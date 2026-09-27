from collections import deque
from typing import List, Dict, Any, Optional, Tuple
import time

class TemporalPostureTracker:
    """
    Core temporal intelligence engine:
    1. Exponential smoothing & rolling window
    2. Posture state classification
    3. Hysteresis & persistent episode detector
    4. Recovery time measurement
    """

    def __init__(self,
                 smoothing_alpha: float = 0.25,
                 history_window_size: int = 30,
                 persistence_threshold_sec: float = 15.0,
                 recovery_threshold_sec: float = 5.0):
        self.alpha = smoothing_alpha
        self.window_size = history_window_size
        self.persistence_threshold = persistence_threshold_sec
        self.recovery_threshold = recovery_threshold_sec

        # Smoothed state
        self.smoothed_head: Optional[float] = None
        self.smoothed_shoulder: Optional[float] = None
        self.smoothed_torso: Optional[float] = None

        # Rolling buffer of recent points (timestamp, state)
        self.buffer = deque(maxlen=history_window_size)

        # Episode tracking
        self.active_candidate_type: Optional[str] = None
        self.candidate_start_time: Optional[float] = None
        self.current_episode: Optional[Dict[str, Any]] = None
        self.episode_counter = 0

        # Recovery tracking
        self.recovery_start_time: Optional[float] = None

    def smooth(self, head: float, shoulder: float, torso: float) -> Tuple[float, float, float]:
        if self.smoothed_head is None:
            self.smoothed_head = head
            self.smoothed_shoulder = shoulder
            self.smoothed_torso = torso
        else:
            self.smoothed_head = self.alpha * head + (1.0 - self.alpha) * self.smoothed_head
            self.smoothed_shoulder = self.alpha * shoulder + (1.0 - self.alpha) * self.smoothed_shoulder
            self.smoothed_torso = self.alpha * torso + (1.0 - self.alpha) * self.smoothed_torso

        return (
            round(self.smoothed_head, 1),
            round(self.smoothed_shoulder, 1),
            round(self.smoothed_torso, 1)
        )

    def classify_instant_state(self, head_angle: float, shoulder_angle: float, torso_angle: float) -> str:
        """
        Interpretable state classification based on geometric thresholds.
        """
        # Persistent Slouch: multiple indicators abnormal
        if head_angle > 26.0 and torso_angle > 18.0:
            return "Persistent Slouch"
        # Forward Head: head displaced relative to torso
        if head_angle > 24.0:
            return "Forward Head"
        # Forward Lean: upper torso tilting forward
        if torso_angle > 16.0:
            return "Forward Lean"
        # Shoulder Asymmetry: shoulder tilt > 7 degrees
        if shoulder_angle > 7.0:
            return "Shoulder Asymmetry"

        return "Balanced"

    def compute_stability(self, head: float, shoulder: float, torso: float) -> float:
        """
        Calculates instantaneous stability (0 - 100%).
        """
        head_pen = max(0.0, (head - 12.0) * 2.2)
        sh_pen = max(0.0, (shoulder - 3.0) * 3.5)
        torso_pen = max(0.0, (torso - 6.0) * 2.0)

        score = 100.0 - (head_pen + sh_pen + torso_pen)
        return max(35.0, min(100.0, round(score, 1)))

    def process_frame(self, timestamp: float, raw_head: float, raw_shoulder: float, raw_torso: float) -> Dict[str, Any]:
        """
        Main temporal step. Returns current state, episode transitions if any.
        """
        head, shoulder, torso = self.smooth(raw_head, raw_shoulder, raw_torso)
        raw_state = self.classify_instant_state(head, shoulder, torso)
        stability = self.compute_stability(head, shoulder, torso)

        self.buffer.append((timestamp, raw_state))

        new_episode_completed: Optional[Dict[str, Any]] = None
        new_episode_started: Optional[Dict[str, Any]] = None

        # Episode state machine
        if raw_state != "Balanced":
            # Posture is deviated
            if self.active_candidate_type != raw_state:
                # Started a new deviation candidate
                self.active_candidate_type = raw_state
                self.candidate_start_time = timestamp

            deviation_duration = timestamp - (self.candidate_start_time or timestamp)

            # Check if candidate officially becomes an episode
            if deviation_duration >= self.persistence_threshold and not self.current_episode:
                self.episode_counter += 1
                severity = "Mild"
                if head > 32.0 or torso > 24.0 or shoulder > 12.0:
                    severity = "Severe"
                elif head > 28.0 or torso > 20.0 or shoulder > 9.0:
                    severity = "Moderate"

                self.current_episode = {
                    "episode_number": self.episode_counter,
                    "posture_type": raw_state,
                    "start_offset": round(self.candidate_start_time, 1),
                    "end_offset": None,
                    "duration_seconds": None,
                    "severity": severity,
                    "recovery_time_seconds": 0.0,
                    "peak_deviation_deg": max(head, shoulder, torso)
                }
                new_episode_started = dict(self.current_episode)

            # If already in an episode, keep updating peak deviation
            if self.current_episode:
                self.current_episode["peak_deviation_deg"] = max(
                    self.current_episode["peak_deviation_deg"],
                    max(head, shoulder, torso)
                )

            # Reset recovery tracker while posture is bad
            self.recovery_start_time = None

        else:
            # User is Balanced
            if self.current_episode:
                # Track recovery
                if self.recovery_start_time is None:
                    self.recovery_start_time = timestamp

                recovery_duration = timestamp - self.recovery_start_time
                if recovery_duration >= self.recovery_threshold:
                    # Conclude episode
                    self.current_episode["end_offset"] = round(timestamp - self.recovery_threshold, 1)
                    duration = max(1.0, self.current_episode["end_offset"] - self.current_episode["start_offset"])
                    self.current_episode["duration_seconds"] = round(duration, 1)
                    self.current_episode["recovery_time_seconds"] = round(recovery_duration + 8.0, 1)

                    new_episode_completed = dict(self.current_episode)
                    self.current_episode = None
                    self.active_candidate_type = None
                    self.candidate_start_time = None
                    self.recovery_start_time = None
            else:
                # Brief movement recovered naturally before reaching persistence threshold
                self.active_candidate_type = None
                self.candidate_start_time = None

        return {
            "timestamp": timestamp,
            "head_angle": head,
            "shoulder_angle": shoulder,
            "torso_angle": torso,
            "stability_score": stability,
            "posture_state": raw_state,
            "is_persistent_episode": bool(self.current_episode),
            "active_episode": self.current_episode,
            "episode_started": new_episode_started,
            "episode_completed": new_episode_completed,
            "is_temporary_movement": (self.active_candidate_type is not None and not self.current_episode)
        }
