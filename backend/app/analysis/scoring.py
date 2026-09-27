from typing import Dict, Any, List

def calculate_composite_score(
    avg_head_angle: float,
    avg_shoulder_angle: float,
    avg_torso_angle: float,
    total_duration_sec: float,
    episodes: List[Dict[str, Any]],
    avg_recovery_sec: float
) -> Dict[str, Any]:
    """
    Transparent, clinically grounded posture composite score (0-100).
    Every point deduction has an explicit mathematical derivation.
    """
    # 1. Base Score
    base_score = 100.0

    # 2. Alignment Deductions
    # Ideal head angle <= 12 deg. -1 pt per 1.5 deg above ideal
    head_deviation = max(0.0, avg_head_angle - 12.0)
    head_penalty = round(min(25.0, head_deviation * 1.5), 1)

    # Ideal shoulder angle <= 2 deg. -1.5 pt per deg tilt above ideal
    shoulder_deviation = max(0.0, avg_shoulder_angle - 2.5)
    shoulder_penalty = round(min(20.0, shoulder_deviation * 2.0), 1)

    # Ideal torso angle <= 6 deg. -1 pt per deg inclination
    torso_deviation = max(0.0, avg_torso_angle - 6.0)
    torso_penalty = round(min(25.0, torso_deviation * 1.8), 1)

    # 3. Persistent Episode Impact
    # Persistent bad posture degrades health much faster than temporary shifts
    total_episode_duration_sec = sum(ep.get("duration_seconds") or 0.0 for ep in episodes)
    episode_ratio = total_episode_duration_sec / max(60.0, total_duration_sec)
    persistence_penalty = round(min(25.0, episode_ratio * 40.0), 1)

    # 4. Recovery Bonus / Penalty
    # Fast recovery (< 20s) earns bonus; sluggish recovery (> 45s) incurs penalty
    recovery_modifier = 0.0
    if avg_recovery_sec > 0:
        if avg_recovery_sec < 18.0:
            recovery_modifier = +3.0
        elif avg_recovery_sec > 40.0:
            recovery_modifier = -4.0

    final_score = base_score - (head_penalty + shoulder_penalty + torso_penalty + persistence_penalty) + recovery_modifier
    final_score = max(30.0, min(100.0, round(final_score, 1)))

    return {
        "final_score": final_score,
        "breakdown": {
            "base": 100.0,
            "head_penalty": -head_penalty,
            "shoulder_penalty": -shoulder_penalty,
            "torso_penalty": -torso_penalty,
            "persistence_penalty": -persistence_penalty,
            "recovery_adjustment": recovery_modifier
        },
        "explanations": [
            f"Head alignment: {'Optimal' if head_penalty < 4 else f'-{head_penalty} pts from forward tilt'}",
            f"Shoulder balance: {'Balanced' if shoulder_penalty < 3 else f'-{shoulder_penalty} pts from asymmetry'}",
            f"Torso inclination: {'Upright' if torso_penalty < 4 else f'-{torso_penalty} pts from torso forward lean'}",
            f"Episode persistence: {len(episodes)} episodes ({round(total_episode_duration_sec / 60, 1)}m total)",
            f"Recovery responsiveness: {f'+{recovery_modifier}' if recovery_modifier > 0 else f'{recovery_modifier}'} pts"
        ]
    }
