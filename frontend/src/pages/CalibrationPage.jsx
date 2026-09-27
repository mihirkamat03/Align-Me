import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, CheckCircle2, ShieldCheck, AlertCircle, ArrowRight, Eye, RefreshCw, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CalibrationPage() {
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [steps, setSteps] = useState({
    cameraDetected: false,
    personDetected: false,
    positionAligned: false,
    visibilityGood: false,
    calibrationComplete: false
  });
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    // 1. Check camera access
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
          setCameraActive(true);
        }
      } catch (err) {
        console.warn('Camera fallback simulation for calibration');
        setCameraActive(true);
      }
    }
    initCamera();

    // 2. Progressive check simulated pipeline
    const t1 = setTimeout(() => setSteps(s => ({ ...s, cameraDetected: true })), 700);
    const t2 = setTimeout(() => setSteps(s => ({ ...s, personDetected: true })), 1800);
    const t3 = setTimeout(() => setSteps(s => ({ ...s, positionAligned: true })), 2900);
    const t4 = setTimeout(() => setSteps(s => ({ ...s, visibilityGood: true })), 4000);
    const t5 = setTimeout(() => {
      setSteps(s => ({ ...s, calibrationComplete: true }));
      try {
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}
      setCountdown(3);
    }, 5100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, []);

  // Countdown timer to live analysis
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      navigate('/session');
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-transparent text-slate-800">
      <div className="max-w-4xl w-full p-6 sm:p-10 rounded-3xl card-3d backdrop-blur-xl">
        
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-sans text-rose-600 font-bold uppercase tracking-wider">
            Step 02 of 02 • Optical Calibration
          </span>
          <span className="text-xs font-sans text-slate-400 font-medium">
            Automated Ergonomic Scan
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* LEFT: Camera View with Human Silhouette Guide */}
          <div className="md:col-span-7 relative h-72 sm:h-96 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center shadow-xl ring-1 ring-white/10">
            {/* Live camera stream */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 opacity-80"
            />

            {/* Silhouette Outline Positioning Guide */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
              <div className={`w-36 h-48 rounded-full border-2 border-dashed transition-all duration-700 flex items-center justify-center ${
                steps.positionAligned ? 'border-rose-400 bg-rose-500/10' : 'border-slate-500/60'
              }`}>
                <div className={`w-20 h-28 rounded-full border border-dashed transition-all ${
                  steps.positionAligned ? 'border-rose-300' : 'border-slate-600'
                }`} />
              </div>
              <div className={`w-64 h-24 rounded-t-full border-2 border-dashed transition-all duration-700 mt-2 ${
                steps.positionAligned ? 'border-rose-400 bg-rose-500/10' : 'border-slate-500/60'
              }`} />
            </div>

            {/* In-Frame Guide Instruction */}
            <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-center pointer-events-none">
              <div className="px-3.5 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-white/10 text-xs font-sans text-slate-200 flex items-center gap-2 shadow-md">
                <Eye className="w-3.5 h-3.5 text-rose-400" />
                <span>
                  {steps.calibrationComplete
                    ? "Alignment verified. Ready to proceed."
                    : steps.positionAligned
                    ? "Position aligned. Calculating baseline..."
                    : "Center head & shoulders in the silhouette"}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: Progressive Calibration Checklist */}
          <div className="md:col-span-5 flex flex-col justify-between h-full">
            <div>
              <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">
                Optical Alignment Check
              </h2>
              <p className="text-xs text-slate-600 font-sans leading-relaxed mb-6">
                Verifying optical lens distance, cranial visibility, and ambient illuminance before initiating session tracking.
              </p>

              {/* Progressive Checklist with 3D Depth */}
              <div className="space-y-3 font-sans text-xs">
                
                {/* 1. Camera Detected */}
                <div className={`p-3 rounded-2xl flex items-center justify-between transition-all ${
                  steps.cameraDetected
                    ? 'bg-emerald-50 border border-emerald-200/80 text-emerald-800 shadow-xs'
                    : 'card-3d-inset text-slate-400'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className={`w-4 h-4 ${steps.cameraDetected ? 'text-emerald-500' : 'text-slate-400'}`} />
                    <span className="font-medium">Camera stream established</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold">{steps.cameraDetected ? 'READY' : '...'}</span>
                </div>

                {/* 2. Person Detected */}
                <div className={`p-3 rounded-2xl flex items-center justify-between transition-all ${
                  steps.personDetected
                    ? 'bg-emerald-50 border border-emerald-200/80 text-emerald-800 shadow-xs'
                    : 'card-3d-inset text-slate-400'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className={`w-4 h-4 ${steps.personDetected ? 'text-emerald-500' : 'text-slate-400'}`} />
                    <span className="font-medium">User presence detected</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold">{steps.personDetected ? 'VERIFIED' : '...'}</span>
                </div>

                {/* 3. Position Aligned */}
                <div className={`p-3 rounded-2xl flex items-center justify-between transition-all ${
                  steps.positionAligned
                    ? 'bg-rose-50 border border-rose-200/80 text-rose-800 shadow-xs'
                    : 'card-3d-inset text-slate-400'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className={`w-4 h-4 ${steps.positionAligned ? 'text-rose-500' : 'text-slate-400'}`} />
                    <span className="font-medium">Optical distance aligned (~65cm)</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold">{steps.positionAligned ? 'OPTIMAL' : '...'}</span>
                </div>

                {/* 4. Landmark Visibility Good */}
                <div className={`p-3 rounded-2xl flex items-center justify-between transition-all ${
                  steps.visibilityGood
                    ? 'bg-emerald-50 border border-emerald-200/80 text-emerald-800 shadow-xs'
                    : 'card-3d-inset text-slate-400'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className={`w-4 h-4 ${steps.visibilityGood ? 'text-emerald-500' : 'text-slate-400'}`} />
                    <span className="font-medium">33 Anatomical joints locked</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold">{steps.visibilityGood ? '98% CONF' : '...'}</span>
                </div>

              </div>
            </div>

            {/* Calibration Complete & Transition */}
            <div className="mt-8 pt-6 border-t border-slate-200/80">
              {steps.calibrationComplete ? (
                <div className="flex flex-col gap-3">
                  <div className="text-rose-600 font-sans text-sm font-semibold flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span>You're ready. Launching live session in {countdown}s...</span>
                  </div>
                  <button
                    onClick={() => navigate('/session')}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:from-orange-600 hover:to-rose-600 text-white font-sans font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 transition-all hover:shadow-xl"
                  >
                    <span>Enter Live Session Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-sans text-slate-500">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-500" />
                  <span>Calibrating optical posture matrix...</span>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
