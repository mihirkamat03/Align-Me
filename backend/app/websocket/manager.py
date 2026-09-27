import json
from typing import Dict
from fastapi import WebSocket
from sqlalchemy.orm import Session as DBSession
from app.analysis.temporal import TemporalPostureTracker
from app.models import PostureEpisode, PostureMetric, Session
from app.database import SessionLocal

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.trackers: Dict[str, TemporalPostureTracker] = {}
        self.metric_counters: Dict[str, int] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[session_id] = websocket
        self.trackers[session_id] = TemporalPostureTracker(
            smoothing_alpha=0.3,
            history_window_size=30,
            persistence_threshold_sec=12.0,
            recovery_threshold_sec=4.0
        )
        self.metric_counters[session_id] = 0

    def disconnect(self, session_id: str):
        self.active_connections.pop(session_id, None)
        self.trackers.pop(session_id, None)
        self.metric_counters.pop(session_id, None)

    async def process_frame_data(self, session_id: str, data: dict):
        tracker = self.trackers.get(session_id)
        if not tracker:
            return

        timestamp = float(data.get("timestamp", 0.0))
        raw_head = float(data.get("head_angle", 12.0))
        raw_sh = float(data.get("shoulder_angle", 2.0))
        raw_torso = float(data.get("torso_angle", 5.0))
        confidence = float(data.get("confidence", 0.95))

        # Temporal processing
        result = tracker.process_frame(timestamp, raw_head, raw_sh, raw_torso)

        # Database persistence
        self.metric_counters[session_id] = self.metric_counters.get(session_id, 0) + 1
        # Store a metric point every ~10 frames (approx every 1-2 seconds)
        if self.metric_counters[session_id] % 10 == 0:
            db: DBSession = SessionLocal()
            try:
                db_metric = PostureMetric(
                    session_id=session_id,
                    timestamp_offset=timestamp,
                    head_angle=result["head_angle"],
                    shoulder_angle=result["shoulder_angle"],
                    torso_angle=result["torso_angle"],
                    stability_score=result["stability_score"],
                    posture_state=result["posture_state"],
                    confidence=confidence
                )
                db.add(db_metric)
                db.commit()
            except Exception:
                db.rollback()
            finally:
                db.close()

        # If an episode was just completed, persist it
        if result.get("episode_completed"):
            ep_info = result["episode_completed"]
            db: DBSession = SessionLocal()
            try:
                db_ep = PostureEpisode(
                    session_id=session_id,
                    episode_number=ep_info["episode_number"],
                    posture_type=ep_info["posture_type"],
                    start_offset=ep_info["start_offset"],
                    end_offset=ep_info["end_offset"],
                    duration_seconds=ep_info["duration_seconds"],
                    severity=ep_info["severity"],
                    recovery_time_seconds=ep_info["recovery_time_seconds"],
                    peak_deviation_deg=ep_info["peak_deviation_deg"]
                )
                db.add(db_ep)
                db.commit()
            except Exception:
                db.rollback()
            finally:
                db.close()

        # Send response back to frontend
        ws = self.active_connections.get(session_id)
        if ws:
            await ws.send_text(json.dumps({
                "type": "telemetry_update",
                "payload": result
            }))

ws_manager = ConnectionManager()
