"""
Ergonomic posture rules and validation engine.
Synthesizes clinical biomechanical thresholds with real-time corrective guidance.
Inspired by PostureGuard's rule-based validation engine.
"""
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

class PostureRule(BaseModel):
    rule_id: str
    name: str
    target_metric: str
    threshold: float
    unit: str
    operator: str  # ">" or "<"
    severity: str  # "advisory", "moderate", "critical"
    message: str
    corrective_action: str

POSTURE_RULES: Dict[str, PostureRule] = {
    "cervical_forward_head": PostureRule(
        rule_id="cervical_forward_head",
        name="Cervical Pitch (Forward Head)",
        target_metric="head_angle",
        threshold=22.0,
        unit="degrees",
        operator=">",
        severity="moderate",
        message="Cervical spine displaced anteriorly beyond 22°.",
        corrective_action="Gently tuck chin inward to align auditory canal directly over acromion process."
    ),
    "cervical_severe_slump": PostureRule(
        rule_id="cervical_severe_slump",
        name="Severe Cervical Flexion",
        target_metric="head_angle",
        threshold=32.0,
        unit="degrees",
        operator=">",
        severity="critical",
        message="Extreme cranio-cervical extension (>32°); high muscular strain on trapezii.",
        corrective_action="Lift sternum, retract head 4-5 cm back, and adjust monitor height to eye level."
    ),
    "thoracic_shoulder_imbalance": PostureRule(
        rule_id="thoracic_shoulder_imbalance",
        name="Bilateral Shoulder Asymmetry",
        target_metric="shoulder_angle",
        threshold=5.5,
        unit="degrees",
        operator=">",
        severity="moderate",
        message="Shoulder girdle tilted lateral to horizontal plane (>5.5°).",
        corrective_action="Level shoulder blades and balance pelvis weight evenly across chair base."
    ),
    "lumbar_torso_lean": PostureRule(
        rule_id="lumbar_torso_lean",
        name="Lumbar / Torso Anterior Lean",
        target_metric="torso_angle",
        threshold=13.0,
        unit="degrees",
        operator=">",
        severity="moderate",
        message="Torso inclination exceeds 13° from vertical axis.",
        corrective_action="Engage abdominal core and bring thoracic cage against lumbar backrest."
    ),
    "low_optical_confidence": PostureRule(
        rule_id="low_optical_confidence",
        name="Optical Tracking Confidence",
        target_metric="confidence",
        threshold=0.60,
        unit="ratio",
        operator="<",
        severity="advisory",
        message="Landmark occlusion or low lighting detected.",
        corrective_action="Adjust lighting and ensure head, shoulders, and upper chest remain in frame."
    )
}

class PostureRuleEngine:
    @staticmethod
    def get_all_rules() -> List[Dict[str, Any]]:
        return [rule.dict() for rule in POSTURE_RULES.values()]

    @staticmethod
    def evaluate_frame(
        head_angle: float,
        shoulder_angle: float,
        torso_angle: float,
        confidence: float = 0.95
    ) -> Dict[str, Any]:
        violations = []
        cues = []
        score_deductions = 0.0

        # 1. Cervical evaluation
        if head_angle > POSTURE_RULES["cervical_severe_slump"].threshold:
            r = POSTURE_RULES["cervical_severe_slump"]
            violations.append({
                "rule_id": r.rule_id,
                "name": r.name,
                "severity": r.severity,
                "measured": round(head_angle, 1),
                "threshold": r.threshold,
                "unit": r.unit,
                "message": r.message,
                "action": r.corrective_action
            })
            cues.append(r.corrective_action)
            score_deductions += 25.0
        elif head_angle > POSTURE_RULES["cervical_forward_head"].threshold:
            r = POSTURE_RULES["cervical_forward_head"]
            violations.append({
                "rule_id": r.rule_id,
                "name": r.name,
                "severity": r.severity,
                "measured": round(head_angle, 1),
                "threshold": r.threshold,
                "unit": r.unit,
                "message": r.message,
                "action": r.corrective_action
            })
            cues.append(r.corrective_action)
            score_deductions += 14.0

        # 2. Shoulder evaluation
        if shoulder_angle > POSTURE_RULES["thoracic_shoulder_imbalance"].threshold:
            r = POSTURE_RULES["thoracic_shoulder_imbalance"]
            violations.append({
                "rule_id": r.rule_id,
                "name": r.name,
                "severity": r.severity,
                "measured": round(shoulder_angle, 1),
                "threshold": r.threshold,
                "unit": r.unit,
                "message": r.message,
                "action": r.corrective_action
            })
            cues.append(r.corrective_action)
            score_deductions += 12.0

        # 3. Torso evaluation
        if torso_angle > POSTURE_RULES["lumbar_torso_lean"].threshold:
            r = POSTURE_RULES["lumbar_torso_lean"]
            violations.append({
                "rule_id": r.rule_id,
                "name": r.name,
                "severity": r.severity,
                "measured": round(torso_angle, 1),
                "threshold": r.threshold,
                "unit": r.unit,
                "message": r.message,
                "action": r.corrective_action
            })
            cues.append(r.corrective_action)
            score_deductions += 14.0

        # 4. Optical confidence check
        if confidence < POSTURE_RULES["low_optical_confidence"].threshold:
            r = POSTURE_RULES["low_optical_confidence"]
            violations.append({
                "rule_id": r.rule_id,
                "name": r.name,
                "severity": r.severity,
                "measured": round(confidence, 2),
                "threshold": r.threshold,
                "unit": r.unit,
                "message": r.message,
                "action": r.corrective_action
            })

        frame_score = max(0.0, min(100.0, 100.0 - score_deductions))

        # Determine posture state
        state = "Balanced"
        if any(v["rule_id"] in ("cervical_severe_slump", "cervical_forward_head") for v in violations):
            state = "Forward Head"
        elif any(v["rule_id"] == "lumbar_torso_lean" for v in violations):
            state = "Forward Lean"
        elif any(v["rule_id"] == "thoracic_shoulder_imbalance" for v in violations):
            state = "Shoulder Asymmetry"

        return {
            "is_valid": len(violations) == 0,
            "state": state,
            "score": round(frame_score, 1),
            "violations": violations,
            "primary_cue": cues[0] if cues else "Alignment optimal. Maintain current posture.",
            "all_cues": cues,
            "data_quality": "Excellent" if confidence >= 0.85 else ("Good" if confidence >= 0.7 else "Fair")
        }
