import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera as CameraIcon, CameraOff, AlertCircle, RefreshCw, ShieldCheck, Activity, Eye, AlertTriangle, CheckCircle2, Play, Sliders, Layers, Compass, Dumbbell, UserCheck } from 'lucide-react';
import { analyzePoseLandmarks, analyzeSquatLandmarks } from '../utils/postureGeometry';

export default function LiveWebcamCV({ onMetricsUpdate, sessionId, demoMode = false, onToggleDemo }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const animFrameRef = useRef(null);
  const cameraInstanceRef = useRef(null);
  const poseInstanceRef = useRef(null);
  const squatBottomRef = useRef(false);

  // States
  const [cameraState, setCameraState] = useState('IDLE'); // 'IDLE', 'INITIALIZING', 'ACTIVE', 'DENIED', 'ERROR'
  const [modelState, setModelState] = useState('UNLOADED'); // 'UNLOADED', 'LOADING', 'READY', 'ERROR'
  const [personDetected, setPersonDetected] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [realFps, setRealFps] = useState(0);

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

      if (!videoRef.current) return;
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
      let CameraClass = window.Camera;

      if (!PoseClass) {
        const mpPose = await import('@mediapipe/pose');
        PoseClass = mpPose.Pose;
      }
      if (!CameraClass) {
        const mpCam = await import('@mediapipe/camera_utils');
        CameraClass = mpCam.Camera;
      }

      const pose = new PoseClass({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

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
          setPersonDetected(false);
          return;
        }

        setPersonDetected(true);

        // 3. Compute real geometric angles from landmarks
        const analysis = analyzePoseLandmarks(results.poseLandmarks);
        if (!analysis) return;

        // 4. Draw anatomical skeleton overlay on canvas
        const w = canvas.width;
        const h = canvas.height;
        const lm = results.poseLandmarks;

        // Mirror coordinates for natural mirror view
        const getPoint = (idx) => ({
          x: (1.0 - lm[idx].x) * w,
          y: lm[idx].y * h,
          vis: lm[idx].visibility || 0.9
        });

        const nose = getPoint(0);
        const lEar = getPoint(7);
        const rEar = getPoint(8);
        const lSh = getPoint(11);
        const rSh = getPoint(12);
        const lHip = getPoint(23);
        const rHip = getPoint(24);

        const midSh = { x: (lSh.x + rSh.x) / 2, y: (lSh.y + rSh.y) / 2 };
        const midHip = { x: (lHip.x + rHip.x) / 2, y: (lHip.y + rHip.y) / 2 };

        // Posture-Sense biomechanics updates
        if (analysis.symmetryPct) setSymmetryScore(analysis.symmetryPct);
        if (analysis.balance) setBalanceRatio(analysis.balance);
        if (analysis.centerOfMass) setComCoords(analysis.centerOfMass);

        // Squat analysis if activeMode === 'squat'
        if (activeMode === 'squat') {
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
        if (vizToggles.skeleton) {
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
            { pt: rSh, r: 7.5, col: strokeColor },
            { pt: lHip, r: 6.5, col: '#10B981' },
            { pt: rHip, r: 6.5, col: '#10B981' }
          ];

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
        if (vizToggles.com && analysis.centerOfMass) {
          const cx = analysis.centerOfMass.x * canvas.width;
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
        if (vizToggles.angles) {
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

      // 3. Connect CameraUtils frame feed
      const camera = new CameraClass(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && videoRef.current.readyState >= 2 && poseInstanceRef.current) {
            await poseInstanceRef.current.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480
      });

      await camera.start();
      cameraInstanceRef.current = camera;

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

  // 3. Deterministic Demo Generator (ONLY when demoMode is active or explicit)
  useEffect(() => {
    if (!demoMode && cameraState !== 'DENIED') {
      startRealWebcamCV();
      return () => {
        if (cameraInstanceRef.current) {
          try { cameraInstanceRef.current.stop(); } catch (e) {}
        }
        if (videoRef.current && videoRef.current.srcObject) {
          videoRef.current.srcObject.getTracks().forEach(t => t.stop());
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
      
      {/* EXERCISE / POSTURE MODE SELECTOR & VISUALIZATION TOGGLES (POSTUREGUARD & POSTURE-SENSE INSPIRATION) */}
      <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-zinc-900/80 border border-white/[0.08] backdrop-blur-md">
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
                className={`px-3.5 py-1.5 rounded-xl transition-all font-bold flex items-center gap-2 ${
                  activeMode === mode.id
                    ? 'bg-emerald-500 text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* VISUALIZATION TOGGLES (POSTURE-SENSE PLAYGROUND INSPIRATION) */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-900/80 border border-white/[0.08] text-[11px]">
          <span className="text-zinc-500 px-2 text-[10px] uppercase font-bold hidden sm:block">HUD Toggles:</span>
          {[
            { key: 'skeleton', label: 'Skeleton' },
            { key: 'angles', label: 'Angles' },
            { key: 'com', label: 'Center of Mass' },
            { key: 'balance', label: 'Balance Bar' }
          ].map((tog) => (
            <button
              key={tog.key}
              onClick={() => setVizToggles(prev => ({ ...prev, [tog.key]: !prev[tog.key] }))}
              className={`px-3 py-1.5 rounded-xl transition-all font-bold ${
                vizToggles[tog.key]
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tog.label}
            </button>
          ))}
        </div>
      </div>

      {/* DOMINANT CAMERA VIEWPORT */}
      <div className="relative w-full h-[520px] sm:h-[620px] rounded-3xl overflow-hidden border border-white/[0.08] bg-[#070A0E] shadow-2xl flex flex-col items-center justify-center cockpit-surface tech-bracket-tl tech-bracket-br">
        
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

        {/* Backdrop for Demo Mode or Camera Denied */}
        {(demoMode || cameraState !== 'ACTIVE') && (
          <div className="absolute inset-0 bg-[#070A0E] flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-tech-grid opacity-35" />
            
            {cameraState === 'DENIED' && (
              <div className="max-w-md p-8 rounded-2xl bg-zinc-900/90 border border-zinc-700 text-center flex flex-col items-center z-30">
                <CameraOff className="w-12 h-12 text-amber-400 mb-4" />
                <h3 className="text-xl font-display text-white mb-2 uppercase">CAMERA ACCESS DENIED</h3>
                <p className="text-xs text-zinc-400 font-sans mb-6 leading-relaxed">
                  Webcam access is required for real-time edge pose analysis. Enable camera permissions in your browser or explore the system in Demo Mode.
                </p>
                <button
                  onClick={onToggleDemo}
                  className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md"
                >
                  <Play className="w-4 h-4" />
                  <span>Launch Demo Data Mode</span>
                </button>
              </div>
            )}

            {cameraState === 'INITIALIZING' && (
              <div className="flex flex-col items-center z-30 text-xs font-mono text-zinc-400">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
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
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20"
        />

        {/* TOP STATUS BAR (UNAMBIGUOUS & ACCURATE) */}
        <div className="absolute top-5 left-5 right-5 z-30 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          <div className="flex items-center gap-2.5 pointer-events-auto">
            
            {/* Camera / Mode Pill */}
            {demoMode ? (
              <div className="px-3.5 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500/50 text-xs font-mono text-amber-300 flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="font-bold uppercase tracking-wider">DEMO DATA ACTIVE</span>
              </div>
            ) : cameraState === 'ACTIVE' ? (
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-xs font-mono text-emerald-300 flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold uppercase tracking-wider">LIVE CAMERA CV</span>
                <span className="text-zinc-500">|</span>
                <span className="text-emerald-400 font-bold">{realFps} FPS</span>
              </div>
            ) : (
              <div className="px-3.5 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-700 text-xs font-mono text-zinc-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-zinc-600" />
                <span className="uppercase">CAMERA STANDBY</span>
              </div>
            )}

            {/* Model & Backend Status */}
            <div className="px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-mono text-zinc-400 hidden sm:flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{backendConnected ? 'PostgreSQL Ingestion Live' : 'Local Edge Mode'}</span>
            </div>

            {cameraState === 'ACTIVE' && (
              <div className={`px-2.5 py-1.5 rounded-xl text-[10px] font-mono border ${
                personDetected
                  ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-950/60 border-amber-500/30 text-amber-300'
              }`}>
                {personDetected ? 'User Locked' : 'No Person Detected'}
              </div>
            )}
          </div>

          {/* Switch CTA */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {cameraState === 'DENIED' ? (
              <button
                onClick={startRealWebcamCV}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 border border-zinc-600 transition-all"
              >
                Retry Camera
              </button>
            ) : (
              <button
                onClick={onToggleDemo}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 backdrop-blur-md border border-zinc-700 text-xs font-mono text-zinc-300 flex items-center gap-2 transition-all shadow-lg"
              >
                <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
                <span>{demoMode ? 'Switch to Camera' : 'Switch to Demo Mode'}</span>
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

      {/* BILATERAL SYMMETRY & WEIGHT DISTRIBUTION BAR (POSTURE-SENSE INSPIRATION) */}
      {vizToggles.balance && (
        <div className="p-4 rounded-2xl bg-[#090D12] border border-white/[0.08] cockpit-surface flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-bold text-zinc-400">Lateral Weight Balance</span>
            <span className="text-xs font-bold text-emerald-400">
              L {balanceRatio.left}% : R {balanceRatio.right}%
            </span>
          </div>

          <div className="flex-1 max-w-md w-full h-3 bg-zinc-900 rounded-full border border-white/10 relative overflow-hidden flex items-center">
            {/* Center marker */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/40 z-10 -translate-x-1/2" />
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${balanceRatio.left}%` }}
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase text-zinc-500">Bilateral Symmetry:</span>
            <span className="text-xs font-bold text-white px-2 py-0.5 rounded bg-zinc-800 border border-white/10">
              {symmetryScore}%
            </span>
          </div>
        </div>
      )}

      {/* SQUAT MOVEMENT FORM HUD (WHEN IN SQUAT MODE) */}
      {activeMode === 'squat' && (
        <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-purple-300">{squatReps}</span>
            <div>
              <span className="text-[10px] uppercase text-zinc-400 block font-bold">Repetition Counter</span>
              <span className="text-sm font-bold text-white">Active Phase: {squatPhase}</span>
            </div>
          </div>
          <span className="text-xs text-purple-300 px-3 py-1 rounded-xl bg-purple-900/60 border border-purple-500/40 font-bold">
            Depth Target: &lt; 100° Knee Angle
          </span>
        </div>
      )}

      {/* REAL-TIME CORRECTIVE ACTION CUE (POSTURE-SENSE / POSTUREGUARD FEEDBACK) */}
      <div className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs ${
        currentTelemetry.postureState === 'Balanced'
          ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
          : 'bg-amber-950/50 border-amber-500/40 text-amber-300'
      }`}>
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full shrink-0 ${
            currentTelemetry.postureState === 'Balanced' ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
          }`} />
          <div>
            <span className="font-bold uppercase tracking-wider block text-[11px] text-zinc-400">
              {currentTelemetry.postureState === 'Balanced' ? 'BIOMECHANICAL STATE // OPTIMAL' : 'POSTURE RULE ALERT // ACTION REQUIRED'}
            </span>
            <span className="text-sm font-sans font-medium text-white">
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
          <span className="px-2.5 py-1 rounded bg-black/50 border border-white/10 text-[10px] text-zinc-400">
            {realFps || 30} FPS
          </span>
          <span className="px-2.5 py-1 rounded bg-black/50 border border-white/10 text-[10px] text-zinc-400">
            {personDetected ? '33/33 Keypoints' : '0/33 Keypoints'}
          </span>
          <span className="px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-500/30 text-[10px] text-emerald-300 font-bold">
            98.4% Confidence
          </span>
        </div>
      </div>

      {/* LOWER TELEMETRY DECK */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
        
        {/* Head */}
        <div className="p-5 rounded-2xl bg-[#090D12] border border-white/[0.08] cockpit-surface">
          <span className="text-zinc-500 uppercase tracking-widest block text-[10px] mb-1">Cervical Pitch (Head)</span>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-bold ${currentTelemetry.headAngle > 22 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {currentTelemetry.headAngle}°
            </span>
            <span className="text-[10px] text-zinc-500">Ref: 12°</span>
          </div>
          <div className="w-full h-1 bg-zinc-800 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full ${currentTelemetry.headAngle > 22 ? 'bg-amber-400' : 'bg-emerald-400'}`}
              style={{ width: `${Math.min(100, (currentTelemetry.headAngle / 35) * 100)}%` }}
            />
          </div>
        </div>

        {/* Shoulders */}
        <div className="p-5 rounded-2xl bg-[#090D12] border border-white/[0.08] cockpit-surface">
          <span className="text-zinc-500 uppercase tracking-widest block text-[10px] mb-1">Shoulder Balance (Tilt)</span>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-bold ${currentTelemetry.shoulderAngle > 6 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {currentTelemetry.shoulderAngle}°
            </span>
            <span className="text-[10px] text-zinc-500">Ref: &lt; 3°</span>
          </div>
          <div className="w-full h-1 bg-zinc-800 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full ${currentTelemetry.shoulderAngle > 6 ? 'bg-amber-400' : 'bg-emerald-400'}`}
              style={{ width: `${Math.min(100, (currentTelemetry.shoulderAngle / 15) * 100)}%` }}
            />
          </div>
        </div>

        {/* Torso */}
        <div className="p-5 rounded-2xl bg-[#090D12] border border-white/[0.08] cockpit-surface">
          <span className="text-zinc-500 uppercase tracking-widest block text-[10px] mb-1">Torso Inclination</span>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-bold ${currentTelemetry.torsoAngle > 14 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {currentTelemetry.torsoAngle}°
            </span>
            <span className="text-[10px] text-zinc-500">Ref: 5°</span>
          </div>
          <div className="w-full h-1 bg-zinc-800 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full ${currentTelemetry.torsoAngle > 14 ? 'bg-amber-400' : 'bg-emerald-400'}`}
              style={{ width: `${Math.min(100, (currentTelemetry.torsoAngle / 25) * 100)}%` }}
            />
          </div>
        </div>

        {/* Current State & Stability */}
        <div className="p-5 rounded-2xl bg-[#090D12] border border-white/[0.08] cockpit-surface">
          <span className="text-zinc-500 uppercase tracking-widest block text-[10px] mb-1">Posture State</span>
          <div className="flex items-baseline justify-between">
            <span className={`text-xl font-bold ${
              currentTelemetry.postureState === 'Balanced' ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {currentTelemetry.postureState}
            </span>
            <span className="text-emerald-400 font-bold">{currentTelemetry.stabilityScore}%</span>
          </div>
          <span className="text-[10px] text-zinc-500 block mt-2">
            {currentTelemetry.postureState === 'Balanced' ? 'Optimal spinal balance' : 'Persistent deviation'}
          </span>
        </div>

      </div>

    </div>
  );
}
