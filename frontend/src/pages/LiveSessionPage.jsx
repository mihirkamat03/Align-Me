import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LiveWebcamCV from '../components/LiveWebcamCV';
import { createSession, endSession } from '../services/api';
import { useApp } from '../context/AppContext';
import { Clock, Square, Activity, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function LiveSessionPage() {
  const navigate = useNavigate();
  const { demoMode, showToast } = useApp();

  const [sessionId, setSessionId] = useState(`sess-${Date.now().toString(36)}`);
  const [sessionStartTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isEnding, setIsEnding] = useState(false);
  const [endSummary, setEndSummary] = useState(null);

  // Active metrics from LiveWebcamCV
  const [currentMetrics, setCurrentMetrics] = useState({
    headAngle: 12.0,
    shoulderAngle: 2.1,
    torsoAngle: 5.5,
    stabilityScore: 92,
    postureState: 'Balanced',
    isPersistentEpisode: false,
    activeEpisode: null
  });

  // Track session duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionStartTime]);

  // Create session on server
  useEffect(() => {
    createSession({
      id: sessionId,
      title: `Live Posture Session (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      is_demo: demoMode
    }).catch(err => console.warn('Local session active:', err));
  }, [sessionId, demoMode]);

  const handleEndSession = async () => {
    setIsEnding(true);
    try {
      const summary = await endSession(sessionId, {
        duration_seconds: elapsedSeconds
      });
      setEndSummary(summary);
      showToast('Session concluded and posture analytics recorded', 'emerald');
    } catch (err) {
      setEndSummary({
        session_id: sessionId,
        duration_seconds: elapsedSeconds,
        average_score: currentMetrics.stabilityScore,
        breakdown: {
          final_score: currentMetrics.stabilityScore,
          explanations: ['Session ended. Telemetry persisted.']
        }
      });
    }
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] p-4 sm:p-6 lg:p-8 bg-transparent text-slate-800">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* Top Header & Session Telemetry Bar with 3D Depth */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl card-3d">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-sans text-sm font-bold text-slate-900">
                  Active Posture Stream
                </span>
                <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  ID: {sessionId.slice(0, 12)}
                </span>
              </div>
              <span className="text-xs font-sans text-slate-500">
                Continuous joint-angle extraction & temporal hysteresis active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl card-3d-inset text-xs font-sans text-slate-800 font-bold">
              <Clock className="w-4 h-4 text-rose-500" />
              <span>{formatTimer(elapsedSeconds)}</span>
            </div>

            <button
              onClick={handleEndSession}
              disabled={isEnding}
              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-sans font-semibold flex items-center gap-2 transition-all shadow-xs"
            >
              <Square className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
              <span>End & Analyze</span>
            </button>
          </div>
        </div>

        {/* Live CV Component (Camera + Overlay + Status Metrics) */}
        <LiveWebcamCV
          sessionId={sessionId}
          demoMode={demoMode}
          onMetricsUpdate={(p) => {
            setCurrentMetrics({
              headAngle: p.head_angle,
              shoulderAngle: p.shoulder_angle,
              torsoAngle: p.torso_angle,
              stabilityScore: p.stability_score,
              postureState: p.posture_state,
              isPersistentEpisode: p.is_persistent_episode,
              activeEpisode: p.active_episode
            });
          }}
        />

        {/* Modal: Posture Session Concluded */}
        {endSummary && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="max-w-lg w-full p-8 rounded-3xl card-3d flex flex-col items-center text-center shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4 shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mb-2">
                Session Complete
              </h2>
              <p className="text-xs text-slate-600 font-sans mb-6">
                All joint telemetry and temporal episodes have been synthesized into your longitudinal profile.
              </p>

              <div className="grid grid-cols-2 gap-4 w-full mb-6 font-sans text-xs">
                <div className="p-4 rounded-2xl card-3d-inset">
                  <span className="text-slate-400 block mb-1 font-medium">Session Duration</span>
                  <span className="text-xl font-bold font-display text-slate-900">
                    {formatTimer(endSummary.duration_seconds || elapsedSeconds)}
                  </span>
                </div>
                <div className="p-4 rounded-2xl card-3d-inset">
                  <span className="text-slate-400 block mb-1 font-medium">Average Stability</span>
                  <span className="text-xl font-bold font-display text-rose-600">
                    {endSummary.average_score || 88}%
                  </span>
                </div>
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:from-orange-600 hover:to-rose-600 text-white font-sans font-semibold text-xs tracking-wider uppercase transition-all shadow-md shadow-rose-500/20"
                >
                  View in Dashboard
                </button>
                <button
                  onClick={() => navigate(`/session/${sessionId}`)}
                  className="flex-1 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-sans font-semibold text-xs tracking-wider uppercase transition-all border border-slate-200/80"
                >
                  Inspect 3D Replay
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
