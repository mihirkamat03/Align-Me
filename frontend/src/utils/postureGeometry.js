/**
 * AETHER CLINICAL & ERGONOMIC POSTURE GEOMETRY ENGINE
 * 
 * Mathematical formulations for real-time 3D landmark angle calculations.
 * All coordinates are normalized [0.0, 1.0] from MediaPipe Pose landmarks.
 */

/**
 * Calculate horizontal angle between two points in degrees.
 * Used for Shoulder Balance (Acromion level).
 * 0° is perfectly horizontal.
 * Formula: |atan2(dy, dx)| * (180 / π)
 */
export function calculateShoulderTilt(leftShoulder, rightShoulder) {
  if (!leftShoulder || !rightShoulder) return 2.0;
  const dx = rightShoulder.x - leftShoulder.x;
  const dy = rightShoulder.y - leftShoulder.y;
  if (dx === 0) return 90.0;
  const rad = Math.atan2(dy, dx);
  const deg = Math.abs(rad * (180.0 / Math.PI));
  return Math.round(deg * 10) / 10;
}

/**
 * Calculate inclination angle with respect to the vertical axis.
 * Used for Torso inclination (mid-hip to mid-shoulder) and Cervical pitch (mid-shoulder to head).
 * 0° is perfectly vertical.
 * Formula: |atan2(dx, -dy)| * (180 / π)
 */
export function calculateVerticalAngle(pFrom, pTo) {
  if (!pFrom || !pTo) return 5.0;
  const dx = pTo.x - pFrom.x;
  const dy = pTo.y - pFrom.y; // in screen coords, y grows downwards
  const rad = Math.atan2(dx, -dy);
  const deg = Math.abs(rad * (180.0 / Math.PI));
  return Math.round(deg * 10) / 10;
}

/**
 * Complete deterministic posture analysis from 33 MediaPipe pose landmarks.
 * Landmarks used:
 * - 0: Nose
 * - 7: Left Ear, 8: Right Ear
 * - 11: Left Shoulder, 12: Right Shoulder
 * - 23: Left Hip, 24: Right Hip
 */
export function analyzePoseLandmarks(landmarks, calibration = null) {
  if (!landmarks || landmarks.length < 13) {
    return null;
  }

  const nose = landmarks[0];
  const leftEar = landmarks[7];
  const rightEar = landmarks[8];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks.length > 23 ? landmarks[23] : null;
  const rightHip = landmarks.length > 24 ? landmarks[24] : null;

  if (!leftShoulder || !rightShoulder) {
    return null;
  }

  // 1. Calculate Midpoints
  const midShoulder = {
    x: (leftShoulder.x + rightShoulder.x) / 2.0,
    y: (leftShoulder.y + rightShoulder.y) / 2.0
  };

  const shoulderWidth = Math.hypot(rightShoulder.x - leftShoulder.x, rightShoulder.y - leftShoulder.y);
  const hipsVisible = (leftHip && (leftHip.visibility ?? 1) > 0.3) || (rightHip && (rightHip.visibility ?? 1) > 0.3);

  let midHip;
  if (hipsVisible && leftHip && rightHip) {
    midHip = {
      x: (leftHip.x + rightHip.x) / 2.0,
      y: (leftHip.y + rightHip.y) / 2.0
    };
  } else {
    // Desk webcam close-up fallback: estimate hip position directly beneath midShoulder
    const estimatedTorsoLength = Math.max(0.28, shoulderWidth * 1.5);
    midHip = {
      x: midShoulder.x,
      y: Math.min(1.1, midShoulder.y + estimatedTorsoLength)
    };
  }

  const headRef = {
    x: nose ? nose.x : (leftEar && rightEar ? (leftEar.x + rightEar.x) / 2.0 : midShoulder.x),
    y: nose ? nose.y : (leftEar && rightEar ? (leftEar.y + rightEar.y) / 2.0 : midShoulder.y - 0.2)
  };

  // 2. Compute Geometric Angles
  const shoulderTilt = calculateShoulderTilt(leftShoulder, rightShoulder);
  const torsoInclination = calculateVerticalAngle(midHip, midShoulder);
  const cervicalPitch = calculateVerticalAngle(midShoulder, headRef);

  // 3. Compute Composite Stability Index (0 - 100%) relative to personalized baseline
  const isCalibrated = Boolean(calibration?.isCalibrated);
  const baseHead = isCalibrated ? calibration.headAngle : 12.0;
  const baseSh = isCalibrated ? calibration.shoulderAngle : 2.5;
  const baseTorso = isCalibrated ? calibration.torsoAngle : 6.0;

  const headDelta = Math.abs(cervicalPitch - baseHead);
  const shDelta = Math.abs(shoulderTilt - baseSh);
  const torsoDelta = Math.abs(torsoInclination - baseTorso);

  const headPen = Math.max(0, (headDelta - (isCalibrated ? 3.5 : 2.0)) * 2.2);
  const shPen = Math.max(0, (shDelta - (isCalibrated ? 2.0 : 1.5)) * 3.5);
  const torsoPen = Math.max(0, (torsoDelta - (isCalibrated ? 3.0 : 2.0)) * 2.0);

  const rawScore = 100.0 - (headPen + shPen + torsoPen);
  const stabilityIndex = Math.max(35, Math.min(100, Math.round(rawScore)));

  // 4. Instantaneous State Classification
  let instantState = 'Balanced';
  if (headDelta > 13.0 && torsoDelta > 9.0) {
    instantState = 'Persistent Slouch';
  } else if (headDelta > 10.0) {
    instantState = 'Forward Head';
  } else if (torsoDelta > 8.0) {
    instantState = 'Forward Lean';
  } else if (shDelta > 4.5) {
    instantState = 'Shoulder Asymmetry';
  }

  // Confidence estimation based on visibility
  const visibilities = [
    leftShoulder.visibility || 0.9,
    rightShoulder.visibility || 0.9,
    nose ? (nose.visibility || 0.9) : 0.8
  ];
  if (leftHip && leftHip.visibility != null) visibilities.push(leftHip.visibility);
  if (rightHip && rightHip.visibility != null) visibilities.push(rightHip.visibility);

  const meanConf = visibilities.reduce((a, b) => a + b, 0) / (visibilities.length || 1);

  // Bilateral symmetry calculation
  const dyShoulder = Math.abs(leftShoulder.y - rightShoulder.y);
  const dyHip = (leftHip && rightHip) ? Math.abs(leftHip.y - rightHip.y) : 0;
  const symmetryPct = Math.max(60, Math.min(100, Math.round(100 - (dyShoulder * 250 + dyHip * 150))));

  // Center of mass calculation
  const comX = (midShoulder.x * 0.45) + (midHip.x * 0.55);
  const comY = (midShoulder.y * 0.45) + (midHip.y * 0.55);
  const balanceLeft = Math.max(35, Math.min(65, Math.round(50 - (comX - 0.5) * 80)));
  const balanceRight = 100 - balanceLeft;

  return {
    cervicalPitch,
    shoulderTilt,
    torsoInclination,
    stabilityIndex,
    instantState,
    symmetryPct,
    centerOfMass: { x: comX, y: comY },
    balance: { left: balanceLeft, right: balanceRight },
    confidence: Math.round(meanConf * 100) / 100,
    keypoints: {
      nose,
      leftEar,
      rightEar,
      leftShoulder,
      rightShoulder,
      leftHip,
      rightHip,
      midShoulder,
      midHip
    }
  };
}

/**
 * 3-Point Angle calculation (A -> B -> C), angle at vertex B.
 */
export function calculate3PointAngle(pointA, pointB, pointC) {
  if (!pointA || !pointB || !pointC) return 180.0;
  const radians = Math.atan2(pointC.y - pointB.y, pointC.x - pointB.x) -
                  Math.atan2(pointA.y - pointB.y, pointA.x - pointB.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360.0 - angle;
  return Math.round(angle * 10) / 10;
}

/**
 * Squat biomechanical analysis for Squat Movement Mode.
 */
export function analyzeSquatLandmarks(landmarks) {
  if (!landmarks || landmarks.length < 29) return null;
  const hip = landmarks[24] || landmarks[23];
  const knee = landmarks[26] || landmarks[25];
  const ankle = landmarks[28] || landmarks[27];
  const shoulder = landmarks[12] || landmarks[11];

  const kneeAngle = calculate3PointAngle(hip, knee, ankle);
  const backAngle = calculate3PointAngle(shoulder, hip, knee);

  let phase = 'Standing';
  if (kneeAngle < 100) phase = 'Bottom Hold';
  else if (kneeAngle < 140) phase = 'Descent';

  return {
    kneeAngle,
    backAngle,
    phase,
    depthScore: Math.max(0, Math.min(100, Math.round(180 - kneeAngle)))
  };
}

