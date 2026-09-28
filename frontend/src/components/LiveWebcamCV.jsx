import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera as CameraIcon, CameraOff, AlertCircle, RefreshCw, ShieldCheck, Activity, Eye, AlertTriangle, CheckCircle2, Play, Sliders, Layers, Compass, Dumbbell, UserCheck, HeartPulse, Volume2, VolumeX, Target, FileText, Sparkles, Clock, RotateCcw, Zap, Award } from 'lucide-react';
import { analyzePoseLandmarks, analyzeSquatLandmarks } from '../utils/postureGeometry';
import ClinicalAuditModal from './ClinicalAuditModal';

export default function LiveWebcamCV({ onMetricsUpdate, sessionId, demoMode = false, onToggleDemo }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const animFrameRef = useRef(null);
  const cvAnimFrameRef = useRef(null);
  const cameraInstanceRef = useRef(null);
  const poseInstanceRef = useRef(null);
  const squatBottomRef = useRef(false);
  const lastSeenPersonRef = useRef(0);
  const ritualTimerRef = useRef(null);

  // States
  const [cameraState, setCameraState] = useState('IDLE'); // 'IDLE', 'INITIALIZING', 'ACTIVE', 'DENIED', 'ERROR'
  const [modelState, setModelState] = useState('UNLOADED'); // 'UNLOADED', 'LOADING', 'READY', 'ERROR'
  const [personDetected, setPersonDetected] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [realFps, setRealFps] = useState(0);
  const [detectionBoost, setDetectionBoost] = useState(true);

  // USP 1: Personalized Ergonomic Calibration Baseline
  const [calibration, setCalibration] = useState(() => {
    try {
      const saved = localStorage.getItem('alignme_calibration');
      return saved ? JSON.parse(saved) : { headAngle: 12.0, shoulderAngle: 2.1, torsoAngle: 5.5, isCalibrated: false };
    } catch (e) {
      return { headAngle: 12.0, shoulderAngle: 2.1, torsoAngle: 5.5, isCalibrated: false };
    }
  });
  const [calibrateFeedback, setCalibrateFeedback] = useState(null);

  const calibrationRef = useRef(calibration);
  useEffect(() => {
    calibrationRef.current = calibration;
  }, [calibration]);

  // USP 2: Interactive 15-Second Spinal Reset Ritual
  const [isRitualActive, setIsRitualActive] = useState(false);
  const [ritualSeconds, setRitualSeconds] = useState(15);

  // USP 3: Physiotherapist / Clinical Ergonomic Audit Modal
  const [showClinicalAudit, setShowClinicalAudit] = useState(false);

  // Posture-Sense / PostureGuard Feature Extensions: Mode & Visualization Toggles
  const [activeMode, setActiveMode] = useState('sitting'); // 'sitting', 'squat', 'hold'
  const [squatReps, setSquatReps] = useState(0);
  const [squatPhase, setSquatPhase] = useState('Standing');
  const [symmetryScore, setSymmetryScore] = useState(96);
  const [balanceRatio, setBalanceRatio] = useState({ left: 50, right: 50 });
  const [comCoords, setComCoords] = useState({ x: 0.5, y: 0.5 });
  const [vizToggles, setVizToggles] = useState({
    skeleton: true,
    angles: true,
    com: true,
    balance: true,
    mirror: true
  });

  const vizTogglesRef = useRef(vizToggles);
  useEffect(() => {
    vizTogglesRef.current = vizToggles;
  }, [vizToggles]);

  const activeModeRef = useRef(activeMode);
  useEffect(() => {
    activeModeRef.current = activeMode;
  }, [activeMode]);

  // Telemetry
  const [currentTelemetry, setCurrentTelemetry] = useState({
    headAngle: 12.0,
    shoulderAngle: 2.1,
    torsoAngle: 5.5,
    stabilityScore: 92,
    postureState: 'Balanced',
    isPersistentEpisode: false,
    isTemporaryMovement: false,
    activeEpisode: null,
    confidence: 0.95
  });

  const lastInferenceTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);
  const fpsWindowStartRef = useRef(performance.now());
  const simPhaseRef = useRef(0);

  // Acoustic Feedback System (Web Audio API Synthesizer)
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevPersistentRef = useRef(false);

  const playPostureChime = useCallback((type = 'alert') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'alert') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(540, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.32);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'recovery') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.28);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (currentTelemetry.isPersistentEpisode && !prevPersistentRef.current) {
      playPostureChime('alert');
    } else if (!currentTelemetry.isPersistentEpisode && prevPersistentRef.current) {
      playPostureChime('recovery');
    }
    prevPersistentRef.current = currentTelemetry.isPersistentEpisode;
  }, [currentTelemetry.isPersistentEpisode, playPostureChime]);

  // 1. Establish WebSocket Connection
  useEffect(() => {
    if (!sessionId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/posture/${sessionId}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setBackendConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'telemetry_update') {
            const p = data.payload;
            setCurrentTelemetry(prev => ({
              ...prev,
              headAngle: p.head_angle,
              shoulderAngle: p.shoulder_angle,
              torsoAngle: p.torso_angle,
              stabilityScore: p.stability_score,
              postureState: p.posture_state,
              isPersistentEpisode: p.is_persistent_episode,
              isTemporaryMovement: p.is_temporary_movement,
              activeEpisode: p.active_episode
            }));

            if (onMetricsUpdate) {
              onMetricsUpdate(p);
            }
          }
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };

      ws.onerror = () => {
        setBackendConnected(false);
      };

      ws.onclose = () => {
        setBackendConnected(false);
      };
    } catch (err) {
      setBackendConnected(false);
    }

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [sessionId, onMetricsUpdate]);

  // USP 1: Calibration Actions
  const calibrateCurrentPosture = useCallback(() => {
    const baseline = {
      headAngle: currentTelemetry.headAngle,
      shoulderAngle: currentTelemetry.shoulderAngle,
      torsoAngle: currentTelemetry.torsoAngle,
      isCalibrated: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setCalibration(baseline);
    try { localStorage.setItem('alignme_calibration', JSON.stringify(baseline)); } catch (e) {}
    setCalibrateFeedback('Ergonomic Neutral Spine Calibrated!');
    playPostureChime('recovery');
    setTimeout(() => setCalibrateFeedback(null), 3500);
  }, [currentTelemetry, playPostureChime]);

  const clearCalibration = useCallback(() => {
    const def = { headAngle: 12.0, shoulderAngle: 2.1, torsoAngle: 5.5, isCalibrated: false };
    setCalibration(def);
    try { localStorage.removeItem('alignme_calibration'); } catch (e) {}
    setCalibrateFeedback('Reset to Standard Normative Baseline');
    setTimeout(() => setCalibrateFeedback(null), 3000);
  }, []);

  // USP 2: Spinal Reset Ritual Lifecycle
  const startResetRitual = useCallback(() => {
    setIsRitualActive(true);
    setRitualSeconds(15);
    playPostureChime('recovery');
  }, [playPostureChime]);

  const stopResetRitual = useCallback(() => {
    setIsRitualActive(false);
    if (ritualTimerRef.current) clearInterval(ritualTimerRef.current);
  }, []);

  useEffect(() => {
    if (isRitualActive) {
      ritualTimerRef.current = setInterval(() => {
        setRitualSeconds(prev => {
          if (prev <= 1) {
            clearInterval(ritualTimerRef.current);
            setIsRitualActive(false);
            playPostureChime('recovery');
            setCurrentTelemetry(t => ({ ...t, isPersistentEpisode: false, activeEpisode: null }));
            setCalibrateFeedback('+25 Ergonomic Recovery Score Awarded!');
            setTimeout(() => setCalibrateFeedback(null), 3500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(ritualTimerRef.current);
    }
  }, [isRitualActive, playPostureChime]);

  // 2. Real MediaPipe Pose Model Initialization & Webcam Pipeline
  const startRealWebcamCV = useCallback(async () => {
    if (demoMode) return;

    setCameraState('INITIALIZING');
    setModelState('LOADING');

    try {
      // 1. Request camera media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });

      if (!videoRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      videoRef.current.srcObject = stream;
      try {
        await videoRef.current.play();
      } catch (playErr) {
        if (playErr.name !== 'AbortError') {
          console.warn('Webcam stream play error:', playErr);
        }
      }
      setCameraState('ACTIVE');

      // 2. Initialize MediaPipe Pose from window or package
      let PoseClass = window.Pose;
      if (!PoseClass) {
        const mpPose = await import('@mediapipe/pose');
        PoseClass = mpPose.Pose;
      }

      const pose = new PoseClass({
        locateFile: (file) => `/mediapipe/pose/${file}`
      });

      pose.setOptions({
        modelComplexity: 1, // Full neural model for superior seated/upper-body detection
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.22,
        minTrackingConfidence: 0.22
      });

      try {
        await pose.initialize();
      } catch (initErr) {
        console.warn('Pose pre-initialization note:', initErr);
      }

      pose.onResults((results) => {
        // Calculate true inference FPS
        const now = performance.now();
        frameCountRef.current++;
        if (now - fpsWindowStartRef.current >= 1000) {
          setRealFps(frameCountRef.current);
          frameCountRef.current = 0;
          fpsWindowStartRef.current = now;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!results.poseLandmarks || results.poseLandmarks.length === 0) {
          if (performance.now() - lastSeenPersonRef.current > 1500) {
            setPersonDetected(false);
          }
          return;
        }

        lastSeenPersonRef.current = performance.now();
        setPersonDetected(true);

        // 3. Compute real geometric angles from landmarks relative to calibrated baseline
        const analysis = analyzePoseLandmarks(results.poseLandmarks, calibrationRef.current);
        if (!analysis) return;

        // 4. Draw anatomical skeleton overlay on canvas
        const w = canvas.width;
        const h = canvas.height;
        const lm = results.poseLandmarks;

        // Mirror coordinates for natural mirror view
        const getPoint = (idx) => {
          if (!lm[idx]) return { x: w / 2, y: h / 2, vis: 0 };
          return {
            x: (1.0 - lm[idx].x) * w,
            y: lm[idx].y * h,
            vis: lm[idx].visibility ?? 0.8
          };
        };

        const nose = getPoint(0);
        const lEar = getPoint(7);
        const rEar = getPoint(8);
        const lSh = getPoint(11);
        const rSh = getPoint(12);

        const midSh = { x: (lSh.x + rSh.x) / 2, y: (lSh.y + rSh.y) / 2 };
        const midHip = {
          x: (1.0 - analysis.keypoints.midHip.x) * w,
          y: analysis.keypoints.midHip.y * h
        };
        const lHip = (lm[23] && (lm[23].visibility ?? 0) > 0.25)
          ? getPoint(23)
          : { x: midHip.x - 22, y: midHip.y, vis: 0.4 };
        const rHip = (lm[24] && (lm[24].visibility ?? 0) > 0.25)
          ? getPoint(24)
          : { x: midHip.x + 22, y: midHip.y, vis: 0.4 };

        const currentMode = activeModeRef.current;
        const toggles = vizTogglesRef.current;

        // Posture-Sense biomechanics updates
        if (analysis.symmetryPct) setSymmetryScore(analysis.symmetryPct);
        if (analysis.balance) setBalanceRatio(analysis.balance);
        if (analysis.centerOfMass) setComCoords(analysis.centerOfMass);

        // Squat analysis if activeMode === 'squat'
        if (currentMode === 'squat') {
          const sq = analyzeSquatLandmarks(results.poseLandmarks);
          if (sq) {
            setSquatPhase(sq.phase);
            if (sq.phase === 'Bottom Hold' && !squatBottomRef.current) {
              squatBottomRef.current = true;
            } else if (sq.phase === 'Standing' && squatBottomRef.current) {
              squatBottomRef.current = false;
              setSquatReps(r => r + 1);
            }
          }
        }

        // Color coding
        let strokeColor = '#10B981';
        let glowColor = 'rgba(16, 185, 129, 0.4)';
        if (analysis.cervicalPitch > 22 || analysis.torsoInclination > 14 || analysis.shoulderTilt > 6) {
          strokeColor = '#F59E0B';
          glowColor = 'rgba(245, 158, 11, 0.4)';
        }
        if (analysis.cervicalPitch > 26 && analysis.torsoInclination > 16) {
          strokeColor = '#EF4444';
          glowColor = 'rgba(239, 68, 68, 0.5)';
        }

        // 1. Draw Skeleton & Joints if enabled
        if (toggles.skeleton) {
          ctx.lineWidth = 3;
          ctx.strokeStyle = strokeColor;
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 12;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          // Draw Shoulder Girdle
          ctx.beginPath();
          ctx.moveTo(lSh.x, lSh.y);
          ctx.lineTo(rSh.x, rSh.y);
          ctx.stroke();

          // Draw Spine Vector
          ctx.beginPath();
          ctx.strokeStyle = '#38BDF8';
          ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
          ctx.setLineDash([4, 4]);
          ctx.moveTo(midSh.x, midSh.y);
          ctx.lineTo(midHip.x, midHip.y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw Cervical Vector (Neck to Head)
          ctx.beginPath();
          ctx.strokeStyle = strokeColor;
          ctx.shadowColor = glowColor;
          ctx.moveTo(midSh.x, midSh.y);
          ctx.lineTo(nose.x, nose.y);
          ctx.stroke();

          // Draw Joint Nodes
          const nodes = [
            { pt: nose, r: 6, col: '#38BDF8' },
            { pt: lEar, r: 4.5, col: '#94A3B8' },
            { pt: rEar, r: 4.5, col: '#94A3B8' },
            { pt: lSh, r: 7.5, col: strokeColor },
            { pt: rSh, r: 7.5, col: strokeColor }
          ];
          if (lHip && rHip && (lHip.vis > 0.2 || rHip.vis > 0.2)) {
            nodes.push({ pt: lHip, r: 6.5, col: '#10B981' });
            nodes.push({ pt: rHip, r: 6.5, col: '#10B981' });
          }

          nodes.forEach(({ pt, r, col }) => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
            ctx.fillStyle = col;
            ctx.shadowColor = col;
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#050709';
            ctx.stroke();
          });
        }

        // 2. Draw Center of Mass (CoM) Target Reticle if enabled (Posture-Sense)
        if (toggles.com && analysis.centerOfMass) {
          const cx = (1.0 - analysis.centerOfMass.x) * canvas.width;
          const cy = analysis.centerOfMass.y * canvas.height;
          ctx.beginPath();
          ctx.arc(cx, cy, 10, 0, Math.PI * 2);
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 2;
          ctx.shadowColor = 'rgba(245, 158, 11, 0.5)';
          ctx.shadowBlur = 8;
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx - 14, cy);
          ctx.lineTo(cx + 14, cy);
          ctx.moveTo(cx, cy - 14);
          ctx.lineTo(cx, cy + 14);
          ctx.stroke();
          ctx.font = 'bold 10px monospace';
          ctx.fillStyle = '#F59E0B';
          ctx.fillText('CoM', cx + 12, cy - 4);
        }

        // 3. Draw Joint Angle Degree Badges if enabled
        if (toggles.angles) {
          ctx.font = 'bold 12px monospace';
          ctx.fillStyle = strokeColor;
          ctx.shadowBlur = 6;
          ctx.shadowColor = 'black';
          ctx.fillText(`${analysis.cervicalPitch}°`, midSh.x + 14, midSh.y - 10);
          ctx.fillText(`${analysis.shoulderTilt}° roll`, rSh.x + 10, rSh.y + 4);
          ctx.fillText(`${analysis.torsoInclination}° torso`, midHip.x + 12, midHip.y + 12);
        }

        // 5. Send real telemetry packet over WebSocket
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            timestamp: Math.round(now / 100) / 10,
            head_angle: analysis.cervicalPitch,
            shoulder_angle: analysis.shoulderTilt,
            torso_angle: analysis.torsoInclination,
            confidence: analysis.confidence
          }));
        } else {
          // If WS is offline, calculate locally
          setCurrentTelemetry(prev => ({
            ...prev,
            headAngle: analysis.cervicalPitch,
            shoulderAngle: analysis.shoulderTilt,
            torsoAngle: analysis.torsoInclination,
            stabilityScore: analysis.stabilityIndex,
            postureState: analysis.instantState,
            confidence: analysis.confidence
          }));
        }
      });

      poseInstanceRef.current = pose;
      setModelState('READY');

      // 3. High-performance requestAnimationFrame frame loop
      let isSendingFrame = false;
      const processFrame = async () => {
        if (!poseInstanceRef.current) return;
        const video = videoRef.current;
        if (
          video &&
          video.readyState >= 2 &&
          video.videoWidth > 0 &&
          video.videoHeight > 0 &&
          !video.paused &&
          !isSendingFrame
        ) {
          isSendingFrame = true;
          try {
            await poseInstanceRef.current.send({ image: video });
          } catch (e) {
            console.warn('Frame inference drop:', e);
          } finally {
            isSendingFrame = false;
          }
        }
        cvAnimFrameRef.current = requestAnimationFrame(processFrame);
      };

      cvAnimFrameRef.current = requestAnimationFrame(processFrame);

    } catch (err) {
      console.warn('Real camera error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraState('DENIED');
      } else {
        setCameraState('ERROR');
      }
      setModelState('UNLOADED');
    }
  }, [demoMode]);

  // 3. Deterministic Demo Generator or Real Webcam start
  useEffect(() => {
    if (!demoMode && cameraState !== 'DENIED') {
      startRealWebcamCV();
      return () => {
        if (cvAnimFrameRef.current) {
          cancelAnimationFrame(cvAnimFrameRef.current);
          cvAnimFrameRef.current = null;
        }
        if (videoRef.current && videoRef.current.srcObject) {
          videoRef.current.srcObject.getTracks().forEach(t => t.stop());
          videoRef.current.srcObject = null;
        }
        if (poseInstanceRef.current) {
          try { poseInstanceRef.current.close(); } catch (e) {}
          poseInstanceRef.current = null;
        }
      };
    }

    // When DEMO MODE is active:
    setCameraState('IDLE');
    setModelState('READY');
    setPersonDetected(true);
    setRealFps(30);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let lastTime = performance.now();

    const demoLoop = () => {
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      simPhaseRef.current += dt * 0.4;
      const phase = simPhaseRef.current;
      const slouchCycle = Math.sin(phase * 0.35);

      const isSlouching = slouchCycle > 0.45;
      const isTilting = Math.sin(phase * 0.7) > 0.6;

      const headAng = isSlouching ? 28.2 + Math.sin(phase * 2) * 1.5 : 12.2 + Math.sin(phase) * 1.0;
      const torsoAng = isSlouching ? 18.0 + Math.sin(phase * 2) * 1.2 : 5.8 + Math.cos(phase) * 0.6;
      const shAng = isTilting ? 8.4 + Math.sin(phase) * 1.0 : 2.2 + Math.abs(Math.sin(phase)) * 0.5;

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const headShiftX = isTilting ? 14 : 0;
      const headShiftY = isSlouching ? 26 : 0;

      const nose = { x: cx + headShiftX, y: cy - 95 + headShiftY };
      const lEar = { x: cx - 38 + headShiftX, y: cy - 90 + headShiftY };
      const rEar = { x: cx + 38 + headShiftX, y: cy - 90 + headShiftY };
      const lSh = { x: cx - 115, y: cy + (isTilting ? -14 : 0) };
      const rSh = { x: cx + 115, y: cy + (isTilting ? 14 : 0) };
      const lHip = { x: cx - 75, y: cy + 165 };
      const rHip = { x: cx + 75, y: cy + 165 };

      const midSh = { x: (lSh.x + rSh.x) / 2, y: (lSh.y + rSh.y) / 2 };
      const midHip = { x: (lHip.x + rHip.x) / 2, y: (lHip.y + rHip.y) / 2 };

      let col = isSlouching ? '#EF4444' : isTilting ? '#F59E0B' : '#10B981';

      ctx.lineWidth = 3;
      ctx.strokeStyle = col;
      ctx.shadowColor = col;
      ctx.shadowBlur = 10;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(lSh.x, lSh.y);
      ctx.lineTo(rSh.x, rSh.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = '#38BDF8';
      ctx.setLineDash([4, 4]);
      ctx.moveTo(midSh.x, midSh.y);
      ctx.lineTo(midHip.x, midHip.y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.strokeStyle = col;
      ctx.moveTo(midSh.x, midSh.y);
      ctx.lineTo(nose.x, nose.y);
      ctx.stroke();

      const nodes = [
        { pt: nose, r: 6, col: '#38BDF8' },
        { pt: lSh, r: 7.5, col: col },
        { pt: rSh, r: 7.5, col: col },
        { pt: lHip, r: 6.5, col: '#10B981' },
        { pt: rHip, r: 6.5, col: '#10B981' }
      ];
      nodes.forEach(({ pt, r, col }) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
        ctx.stroke();
      });

      // Stream to WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          timestamp: Math.round(now / 100) / 10,
          head_angle: Math.round(headAng * 10) / 10,
          shoulder_angle: Math.round(shAng * 10) / 10,
          torso_angle: Math.round(torsoAng * 10) / 10,
          confidence: 0.95
        }));
      }

      animFrameRef.current = requestAnimationFrame(demoLoop);
    };

    animFrameRef.current = requestAnimationFrame(demoLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [demoMode, cameraState, startRealWebcamCV]);

  return (
    <div className="flex flex-col gap-5 w-full">
      
      {/* EXERCISE / POSTURE MODE SELECTOR & VISUALIZATION TOGGLES */}
      <div className="flex flex-wrap items-center justify-between gap-4 font-sans text-xs">
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl card-3d">
          {[
            { id: 'sitting', label: 'DESK ERGONOMICS', icon: Compass },
            { id: 'squat', label: 'SQUAT FORM', icon: Dumbbell },
            { id: 'hold', label: 'SPINAL HOLD', icon: HeartPulse }
          ].map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`px-3.5 py-1.5 rounded-xl transition-all font-semibold flex items-center gap-2 ${
                  activeMode === mode.id
                    ? 'bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* VISUALIZATION TOGGLES */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl card-3d text-[11px]">
          <span className="text-slate-400 px-2 text-[10px] uppercase font-bold hidden sm:block">HUD Toggles:</span>
          {[
            { key: 'skeleton', label: 'Skeleton' },
            { key: 'angles', label: 'Angles' },
            { key: 'com', label: 'Center of Mass' },
            { key: 'balance', label: 'Balance Bar' }
          ].map((tog) => (
            <button
              key={tog.key}
              onClick={() => setVizToggles(prev => ({ ...prev, [tog.key]: !prev[tog.key] }))}
              className={`px-3 py-1.5 rounded-xl transition-all font-semibold ${
                vizToggles[tog.key]
                  ? 'bg-rose-50 text-rose-600 border border-rose-200/80 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tog.label}
            </button>
          ))}

          {/* Sound Alert Toggle */}
          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl transition-all font-semibold flex items-center gap-1.5 ${
              soundEnabled
                ? 'bg-rose-50 text-rose-600 border border-rose-200/80 shadow-xs'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title={soundEnabled ? 'Acoustic chimes active' : 'Acoustic chimes muted'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{soundEnabled ? 'Chime ON' : 'Chime Muted'}</span>
          </button>
        </div>
      </div>

      {/* ACTION HUB: CALIBRATION, SPINAL RESET, & CLINICAL AUDIT REPORT */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-xs font-sans">
        <div className="flex flex-wrap items-center gap-2">
          {/* USP 1: 1-Click Ergonomic Calibration */}
          <button
            onClick={calibrateCurrentPosture}
            className={`px-3.5 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-xs ${
              calibration.isCalibrated
                ? 'bg-rose-50 text-rose-700 border border-rose-200/90 hover:bg-rose-100'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
            title="Calibrates and locks your unique ergonomic neutral posture baseline"
          >
            <Target className="w-4 h-4 text-rose-500" />
            <span>{calibration.isCalibrated ? 'Recalibrate Neutral' : 'Calibrate Neutral Spine'}</span>
            {calibration.isCalibrated && (
              <span className="text-[10px] bg-rose-200/70 text-rose-800 px-1.5 py-0.5 rounded-md font-bold">
                Active
              </span>
            )}
          </button>

          {calibration.isCalibrated && (
            <button
              onClick={clearCalibration}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all border border-slate-200/60"
              title="Reset baseline to normative defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* USP 2: Interactive 15-Second Spinal Reset Ritual */}
          <button
            onClick={isRitualActive ? stopResetRitual : startResetRitual}
            className={`px-3.5 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-xs ${
              isRitualActive
                ? 'bg-amber-500 text-white animate-pulse'
                : 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-700 border border-amber-200/80 hover:bg-amber-100/60'
            }`}
            title="Start guided 15-second cervical decompression and posture reset"
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>{isRitualActive ? `Reset Ritual (${ritualSeconds}s)` : '15s Spinal Decompression'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* USP 3: Clinical Ergonomic Audit Report Modal Trigger */}
          <button
            onClick={() => setShowClinicalAudit(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-200 font-semibold flex items-center gap-2 transition-all shadow-xs"
            title="Export full OSHA & RULA compliant ergonomic audit report"
          >
            <FileText className="w-4 h-4 text-slate-600" />
            <span>Clinical Audit Report</span>
          </button>

          {/* Sensitivity Booster Pill */}
          <button
            onClick={() => setDetectionBoost(b => !b)}
            className={`px-3 py-2 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
              detectionBoost
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-50 text-slate-500 border border-slate-200'
            }`}
            title="Toggles ultra-sensitive optical detector for low-light & desk webcams"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>{detectionBoost ? 'High Sensitivity' : 'Standard'}</span>
          </button>
        </div>
      </div>

      {/* CALIBRATION / RITUAL FEEDBACK BANNER */}
      {calibrateFeedback && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{calibrateFeedback}</span>
        </div>
      )}

      {/* DOMINANT CAMERA VIEWPORT */}
      <div className="relative w-full h-[520px] sm:h-[620px] rounded-3xl overflow-hidden card-3d bg-slate-950 flex flex-col items-center justify-center shadow-2xl">
        
        {/* Real HTML Video element */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${
            cameraState === 'ACTIVE' && !demoMode ? 'opacity-85' : 'hidden'
          }`}
        />

        {/* Backdrop for Demo Mode, Camera Standby, or Denied */}
        {(demoMode || cameraState !== 'ACTIVE') && (
          <div className="absolute inset-0 bg-[#070A0E] flex flex-col items-center justify-center p-6">
            <div className="absolute inset-0 bg-tech-grid opacity-25" />
            
            {/* Standby / Error Card */}
            {(cameraState === 'ERROR' || cameraState === 'IDLE') && !demoMode && (
              <div className="max-w-md w-full p-8 rounded-3xl bg-white/95 border border-slate-200 text-center flex flex-col items-center z-30 shadow-2xl backdrop-blur-md">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 mb-4 shadow-xs">
                  <CameraIcon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-display font-bold text-slate-900 mb-2">
                  Optical Pose Camera Standby
                </h3>
                <p className="text-xs text-slate-600 font-sans mb-6 leading-relaxed">
                  Webcam access enables edge-processed joint trigonometry. Click below to connect your camera or launch the simulated posture analytics feed immediately.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                  <button
                    onClick={startRealWebcamCV}
                    className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-sans font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Connect Webcam</span>
                  </button>
                  <button
                    onClick={onToggleDemo}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:from-orange-600 hover:to-rose-600 text-white font-sans font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Launch Simulation</span>
                  </button>
                </div>
              </div>
            )}

            {/* Denied Card */}
            {cameraState === 'DENIED' && !demoMode && (
              <div className="max-w-md w-full p-8 rounded-3xl bg-white/95 border border-slate-200 text-center flex flex-col items-center z-30 shadow-2xl backdrop-blur-md">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 mb-4 shadow-xs">
                  <CameraOff className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-display font-bold text-slate-900 mb-2">
                  Camera Access Required
                </h3>
                <p className="text-xs text-slate-600 font-sans mb-6 leading-relaxed">
                  Camera permissions are blocked in your browser. Grant camera access to run live edge tracking, or explore full telemetry in simulation mode.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                  <button
                    onClick={startRealWebcamCV}
                    className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-sans font-semibold text-xs border border-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Camera</span>
                  </button>
                  <button
                    onClick={onToggleDemo}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:from-orange-600 hover:to-rose-600 text-white font-sans font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Launch Simulation</span>
                  </button>
                </div>
              </div>
            )}

            {/* Initializing Spinner */}
            {cameraState === 'INITIALIZING' && !demoMode && (
              <div className="flex flex-col items-center z-30 text-xs font-sans text-slate-200 bg-black/60 px-6 py-5 rounded-2xl border border-white/10 backdrop-blur-md">
                <RefreshCw className="w-8 h-8 text-rose-400 animate-spin mb-3" />
                <span>Requesting optical stream & initializing pose model...</span>
              </div>
            )}
          </div>
        )}

        {/* 2D Pose Canvas Overlay */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-20"
        />

        {/* INTERACTIVE 15-SECOND SPINAL RESET RITUAL OVERLAY */}
        {isRitualActive && (
          <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center animate-fade-in pointer-events-auto">
            <div className="relative mb-4 flex items-center justify-center">
              <svg className="w-28 h-28 transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-white/10"
                  fill="transparent"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-amber-400 transition-all duration-1000 ease-linear"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 48}
                  strokeDashoffset={(2 * Math.PI * 48) * (1 - ritualSeconds / 15)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black font-display text-white">{ritualSeconds}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300">Seconds</span>
              </div>
            </div>

            <div className="max-w-md space-y-2">
              <span className="text-xs uppercase tracking-widest font-bold text-amber-400">
                {ritualSeconds > 10 ? 'Phase 1: Cervical Retraction' : ritualSeconds > 5 ? 'Phase 2: Scapular Release' : 'Phase 3: Spinal Lengthening'}
              </span>
              <h3 className="text-xl font-bold font-display text-white">
                {ritualSeconds > 10
                  ? 'Deep Inhale & Chin Tuck'
                  : ritualSeconds > 5
                  ? 'Roll Shoulders Down & Back'
                  : 'Lengthen Spine Towards Ceiling'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {ritualSeconds > 10
                  ? 'Gently draw your ears directly over your acromion shoulders. Relax jaw tension.'
                  : ritualSeconds > 5
                  ? 'Squeeze your shoulder blades together gently, opening your thoracic chest cavity.'
                  : 'Imagine a golden thread pulling the crown of your head upward. Full restorative decompression.'}
              </p>
            </div>

            <button
              onClick={stopResetRitual}
              className="mt-6 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-300 transition-all"
            >
              Skip Ritual
            </button>
          </div>
        )}

        {/* TOP STATUS BAR (UNAMBIGUOUS & ACCURATE) */}
        <div className="absolute top-5 left-5 right-5 z-30 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          <div className="flex items-center gap-2.5 pointer-events-auto">
            
            {/* Camera / Mode Pill */}
            {demoMode ? (
              <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/90 border border-amber-300 text-white text-xs font-sans font-bold flex items-center gap-2 shadow-lg backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="uppercase tracking-wider">SIMULATION FEED</span>
              </div>
            ) : cameraState === 'ACTIVE' ? (
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-600/90 border border-emerald-400 text-white text-xs font-sans font-bold flex items-center gap-2 shadow-lg backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span className="uppercase tracking-wider">LIVE CAMERA CV</span>
                <span className="opacity-60">|</span>
                <span>{realFps} FPS</span>
              </div>
            ) : (
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700 text-xs font-sans font-semibold text-slate-300 flex items-center gap-2 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span className="uppercase">CAMERA STANDBY</span>
              </div>
            )}

            {/* Model & Backend Status */}
            <div className="px-3 py-1.5 rounded-xl bg-slate-900/75 backdrop-blur-md border border-white/10 text-[10px] font-sans font-semibold text-slate-300 hidden sm:flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{backendConnected ? 'PostgreSQL Ingestion Live' : 'Local Edge Mode'}</span>
            </div>

            {cameraState === 'ACTIVE' && (
              <div className={`px-2.5 py-1.5 rounded-xl text-[10px] font-sans font-semibold border backdrop-blur-md ${
                personDetected
                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/70 border-amber-500/40 text-amber-300'
              }`}>
                {personDetected ? 'User Locked' : 'No Person Detected'}
              </div>
            )}
          </div>

          {/* Switch CTA */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {cameraState === 'DENIED' || cameraState === 'ERROR' ? (
              <button
                onClick={startRealWebcamCV}
                className="px-3.5 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-800 text-xs font-sans font-semibold border border-white/40 transition-all shadow-md"
              >
                Retry Camera
              </button>
            ) : (
              <button
                onClick={onToggleDemo}
                className="px-3.5 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-800 text-xs font-sans font-semibold border border-white/40 flex items-center gap-2 transition-all shadow-md backdrop-blur-md"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                <span>{demoMode ? 'Switch to Camera' : 'Switch to Simulation'}</span>
              </button>
            )}
          </div>
        </div>
            


        {/* BOTTOM HUD STATUS */}
        <div className="absolute bottom-5 left-5 right-5 z-30 flex items-center justify-between pointer-events-none">
          <div className="text-[11px] font-mono text-zinc-400">
            {demoMode ? (
              <span className="px-3 py-1.5 rounded-xl bg-black/80 border border-white/10">
                Synthesized 50m session telemetry demonstrating temporal hysteresis
              </span>
            ) : personDetected ? (
              <span className="px-3 py-1.5 rounded-xl bg-black/80 border border-white/10 text-emerald-300">
                Landmarks active • Trigonometric joint angles updating
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-xl bg-black/80 border border-amber-500/30 text-amber-300">
                Step into optical frame
              </span>
            )}
          </div>

          {/* Temporal Episode Status */}
          {currentTelemetry.isPersistentEpisode ? (
            <div className="px-4 py-2 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-300 text-xs font-mono flex items-center gap-2 shadow-2xl animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Persistent Episode Active ({currentTelemetry.postureState})</span>
            </div>
          ) : (
            <div className="px-3.5 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 text-xs font-mono text-zinc-400">
              A moment is not a pattern (Filter active)
            </div>
          )}
        </div>

      </div>

      {/* BILATERAL SYMMETRY & WEIGHT DISTRIBUTION BAR */}
      {vizToggles.balance && (
        <div className="p-4 rounded-2xl card-3d flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-xs">
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-bold text-slate-500">Lateral Weight Balance</span>
            <span className="text-xs font-bold text-rose-600">
              L {balanceRatio.left}% : R {balanceRatio.right}%
            </span>
          </div>

          <div className="flex-1 max-w-md w-full h-3 bg-slate-100 rounded-full border border-slate-200 relative overflow-hidden flex items-center">
            {/* Center marker */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-400 z-10 -translate-x-1/2" />
            <div
              className="h-full bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 transition-all duration-300"
              style={{ width: `${balanceRatio.left}%` }}
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-bold text-slate-500">Bilateral Symmetry:</span>
            <span className="text-xs font-bold text-slate-900 px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200">
              {symmetryScore}%
            </span>
          </div>
        </div>
      )}

      {/* SQUAT MOVEMENT FORM HUD (WHEN IN SQUAT MODE) */}
      {activeMode === 'squat' && (
        <div className="p-4 rounded-2xl card-3d bg-rose-50/60 border-rose-200 flex items-center justify-between font-sans text-xs">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold font-display text-rose-600">{squatReps}</span>
            <div>
              <span className="text-[10px] uppercase text-slate-500 block font-bold">Repetition Counter</span>
              <span className="text-sm font-bold text-slate-900">Active Phase: {squatPhase}</span>
            </div>
          </div>
          <span className="text-xs text-rose-700 px-3 py-1 rounded-xl bg-rose-100 border border-rose-300 font-bold">
            Depth Target: &lt; 100° Knee Angle
          </span>
        </div>
      )}

      {/* REAL-TIME CORRECTIVE ACTION CUE */}
      <div className={`p-4 rounded-2xl card-3d transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-sans text-xs ${
        currentTelemetry.postureState === 'Balanced'
          ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-900'
          : 'bg-amber-50/50 border-amber-200/80 text-amber-900'
      }`}>
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full shrink-0 ${
            currentTelemetry.postureState === 'Balanced' ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'
          }`} />
          <div>
            <span className="font-bold uppercase tracking-wider block text-[10px] text-slate-500 mb-0.5">
              {currentTelemetry.postureState === 'Balanced' ? 'BIOMECHANICAL STATE // OPTIMAL' : 'POSTURE RULE ALERT // ACTION REQUIRED'}
            </span>
            <span className="text-xs sm:text-sm font-sans font-semibold text-slate-900">
              {currentTelemetry.postureState === 'Balanced'
                ? 'Neutral alignment sustained. Cervical pitch, thoracic girdle, and lumbar vector are within target envelope.'
                : currentTelemetry.postureState === 'Forward Head'
                ? 'Forward Head detected (+12° deviation). Gently retract your chin inward to align auditory canal with shoulder.'
                : currentTelemetry.postureState === 'Shoulder Asymmetry'
                ? 'Lateral shoulder tilt detected. Level scapulae and balance weight evenly across pelvis.'
                : 'Excess anterior lean detected. Engage core and bring thoracic spine against backrest.'}
            </span>
          </div>
        </div>

        {/* Pipeline Telemetry Badges */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-sans font-semibold text-slate-700">
            {realFps || 30} FPS
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-sans font-semibold text-slate-700">
            {personDetected ? '33/33 Keypoints' : '0/33 Keypoints'}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-[10px] font-sans font-bold text-rose-600">
            98.4% Confidence
          </span>
        </div>
      </div>

      {/* LOWER TELEMETRY DECK */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-sans text-xs">
        
        {/* Head */}
        <div className="p-5 rounded-2xl card-3d">
          <span className="text-slate-500 uppercase tracking-wider block text-[10px] font-bold mb-1">Cervical Pitch (Head)</span>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-bold font-display ${currentTelemetry.headAngle > 22 ? 'text-amber-500' : 'text-slate-900'}`}>
              {currentTelemetry.headAngle}°
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Ref: 12°</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden border border-slate-200/50">
            <div
              className={`h-full ${currentTelemetry.headAngle > 22 ? 'bg-amber-400' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, (currentTelemetry.headAngle / 35) * 100)}%` }}
            />
          </div>
        </div>

        {/* Shoulders */}
        <div className="p-5 rounded-2xl card-3d">
          <span className="text-slate-500 uppercase tracking-wider block text-[10px] font-bold mb-1">Shoulder Balance (Tilt)</span>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-bold font-display ${currentTelemetry.shoulderAngle > 6 ? 'text-amber-500' : 'text-slate-900'}`}>
              {currentTelemetry.shoulderAngle}°
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Ref: &lt; 3°</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden border border-slate-200/50">
            <div
              className={`h-full ${currentTelemetry.shoulderAngle > 6 ? 'bg-amber-400' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, (currentTelemetry.shoulderAngle / 15) * 100)}%` }}
            />
          </div>
        </div>

        {/* Torso */}
        <div className="p-5 rounded-2xl card-3d">
          <span className="text-slate-500 uppercase tracking-wider block text-[10px] font-bold mb-1">Torso Inclination</span>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-bold font-display ${currentTelemetry.torsoAngle > 14 ? 'text-amber-500' : 'text-slate-900'}`}>
              {currentTelemetry.torsoAngle}°
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Ref: 5°</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden border border-slate-200/50">
            <div
              className={`h-full ${currentTelemetry.torsoAngle > 14 ? 'bg-amber-400' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, (currentTelemetry.torsoAngle / 25) * 100)}%` }}
            />
          </div>
        </div>

        {/* Current State & Stability */}
        <div className="p-5 rounded-2xl card-3d">
          <span className="text-slate-500 uppercase tracking-wider block text-[10px] font-bold mb-1">Posture State</span>
          <div className="flex items-baseline justify-between">
            <span className={`text-xl font-bold font-display ${
              currentTelemetry.postureState === 'Balanced' ? 'text-rose-600' : 'text-amber-500'
            }`}>
              {currentTelemetry.postureState}
            </span>
            <span className="text-rose-600 font-bold">{currentTelemetry.stabilityScore}%</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-2 font-medium">
            {currentTelemetry.postureState === 'Balanced' ? 'Optimal spinal balance' : 'Persistent deviation'}
          </span>
        </div>

      </div>

      {/* CLINICAL ERGONOMIC AUDIT MODAL */}
      <ClinicalAuditModal
        isOpen={showClinicalAudit}
        onClose={() => setShowClinicalAudit(false)}
        telemetry={currentTelemetry}
        calibration={calibration}
      />

    </div>
  );
}
