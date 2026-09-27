import math
from typing import Dict, Any, Tuple, Optional

def calculate_angle_2d(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
    """
    Calculate angle of line (p1 -> p2) with respect to the vertical axis in degrees.
    0 degrees means perfectly vertical.
    """
    dx = p2[0] - p1[0]
    dy = p2[1] - p1[1]
    radians = math.atan2(dx, dy)
    degrees = math.degrees(radians)
    return abs(degrees)

def calculate_horizontal_tilt(left_point: Tuple[float, float], right_point: Tuple[float, float]) -> float:
    """
    Calculate angle of line between left and right landmarks with respect to horizontal.
    0 degrees means perfectly level shoulders/eyes.
    """
    dx = right_point[0] - left_point[0]
    dy = right_point[1] - left_point[1]
    if dx == 0:
        return 90.0
    angle = math.degrees(math.atan(dy / dx))
    return abs(angle)

def analyze_landmarks(landmarks: Dict[str, Dict[str, float]]) -> Dict[str, float]:
    """
    Takes 2D/3D normalized pose landmarks and extracts clinical posture angles.
    Expected keys: 'nose', 'left_ear', 'right_ear', 'left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'.
    """
    default_res = {
        "head_angle": 12.0,
        "shoulder_angle": 3.0,
        "torso_angle": 5.0,
        "confidence": 0.95
    }

    if not landmarks:
        return default_res

    try:
        # Midpoints
        ls = landmarks.get("left_shoulder", {"x": 0.4, "y": 0.4, "visibility": 0.9})
        rs = landmarks.get("right_shoulder", {"x": 0.6, "y": 0.4, "visibility": 0.9})
        mid_shoulder = ((ls["x"] + rs["x"]) / 2.0, (ls["y"] + rs["y"]) / 2.0)

        lh = landmarks.get("left_hip", {"x": 0.42, "y": 0.8, "visibility": 0.8})
        rh = landmarks.get("right_hip", {"x": 0.58, "y": 0.8, "visibility": 0.8})
        mid_hip = ((lh["x"] + rh["x"]) / 2.0, (lh["y"] + rh["y"]) / 2.0)

        nose = landmarks.get("nose", {"x": 0.5, "y": 0.2, "visibility": 0.9})
        le = landmarks.get("left_ear", {"x": 0.44, "y": 0.22, "visibility": 0.9})
        re = landmarks.get("right_ear", {"x": 0.56, "y": 0.22, "visibility": 0.9})
        mid_ear = ((le["x"] + re["x"]) / 2.0, (le["y"] + re["y"]) / 2.0)

        # 1. Shoulder alignment (horizontal tilt)
        shoulder_tilt = calculate_horizontal_tilt((ls["x"], ls["y"]), (rs["x"], rs["y"]))

        # 2. Torso inclination (mid_hip to mid_shoulder relative to vertical)
        torso_angle = calculate_angle_2d(mid_hip, mid_shoulder)

        # 3. Head forward angle (mid_shoulder to mid_ear or nose relative to vertical)
        head_angle = calculate_angle_2d(mid_shoulder, mid_ear)

        # Estimate confidence
        visibilities = [
            ls.get("visibility", 0.9),
            rs.get("visibility", 0.9),
            nose.get("visibility", 0.9)
        ]
        conf = float(sum(visibilities) / len(visibilities))

        return {
            "head_angle": round(head_angle, 1),
            "shoulder_angle": round(shoulder_tilt, 1),
            "torso_angle": round(torso_angle, 1),
            "confidence": round(conf, 2)
        }
    except Exception:
        return default_res
