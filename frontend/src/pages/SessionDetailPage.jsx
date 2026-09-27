import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchSessionDetail } from '../services/api';
import ReplaySkeletonCanvas from '../three/ReplaySkeleton';
import PostureTimeline from '../components/PostureTimeline';
import ScoreExplainer from '../components/ScoreExplainer';
import { Play, Pause, RotateCcw, Clock, ArrowLeft, Activity, AlertTriangle, ShieldCheck, ChevronRight, Sparkles } from 'lucide-react';

export default function SessionDetailPage() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Scrubber playback state
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 0.5x, 1x, 2x, 5x

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchSessionDetail(id || 'session-live-demo-01');
        if (data) {
          setSession(data);
        }
      } catch (err) {
        console.warn('Fallback detail');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const s = session || {
    id: id || 'session-live-demo-01',
    title: 'Deep Focus Workblock',
    duration_seconds: 3000,
    average_score: 87.5,
    environment_snapshot: 'Adjusted Standing/Sitting Desk',
    notes: 'Optimal stability during initial 35m. Mild cervical fatigue noticed in the final 12m.',
    episodes: [
      { episode_number: 1, posture_type: 'Forward Lean', start_offset: 840, end_offset: 990, duration_seconds: 150, severity: 'Mild', recovery_time_seconds: 14.2, peak_deviation_deg: 19.4 },
      { episode_number: 2, posture_type: 'Shoulder Asymmetry', start_offset: 1680, end_offset: 1845, duration_seconds: 165, severity: 'Moderate', recovery_time_seconds: 16.8, peak_deviation_deg: 9.2 },
      { episode_number: 3, posture_type: 'Forward Head', start_offset: 2340, end_offset: 2580, duration_seconds: 240, severity: 'Moderate', recovery_time_seconds: 15.0, peak_deviation_deg: 28.5 }
    ],
    timeline: []
  };

  const totalDuration = s.duration_seconds || 3000;

  // Playback timer ticker with real speed multiplication
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + playbackSpeed * 0.8;
          if (next >= totalDuration) {
            setIsPlaying(false);
            return totalDuration;
          }
          return next;
        });
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playbackSpeed, totalDuration]);

  // Extract kinematic angle data for current playback head
  const getAnglesAtTime = (t) => {
    if (s.timeline && s.timeline.length > 0) {
      let closest = s.timeline[0];
      let minDiff = 999999;
      for (let i = 0; i < s.timeline.length; i++) {
        const diff = Math.abs(s.timeline[i].timestamp_offset - t);
        if (diff < minDiff) {
          minDiff = diff;
          closest = s.timeline[i];
        }
      }
      const activeEp = (s.episodes || []).find(ep => {
        const end = ep.end_offset || ep.start_offset + ep.duration_seconds;
        return t >= ep.start_offset && t <= end;
      });
      return {
        headAngle: Number((closest.head_angle ?? 12.0).toFixed(1)),
        shoulderAngle: Number((closest.shoulder_angle ?? 2.1).toFixed(1)),
        torsoAngle: Number((closest.torso_angle ?? 5.5).toFixed(1)),
        postureState: closest.posture_state || (closest.head_angle > 20 || closest.torso_angle > 14 ? 'Deviated' : 'Balanced'),
        activeEp: activeEp || null
      };
    }

    // Fallback if session only has episodes
    for (const ep of s.episodes || []) {
      const end = ep.end_offset || ep.start_offset + ep.duration_seconds;
      if (t >= ep.start_offset && t <= end) {
        if (ep.posture_type === 'Forward Head') {
          return { headAngle: ep.peak_deviation_deg || 28.5, shoulderAngle: 3.1, torsoAngle: 7.2, postureState: 'Forward Head', activeEp: ep };
        }
        if (ep.posture_type === 'Forward Lean') {
          return { headAngle: 15.5, shoulderAngle: 2.8, torsoAngle: ep.peak_deviation_deg || 18.5, postureState: 'Forward Lean', activeEp: ep };
        }
        if (ep.posture_type === 'Shoulder Asymmetry') {
          return { headAngle: 13.0, shoulderAngle: ep.peak_deviation_deg || 9.2, torsoAngle: 6.1, postureState: 'Shoulder Asymmetry', activeEp: ep };
        }
      }
    }
    return { headAngle: 12.0, shoulderAngle: 2.1, torsoAngle: 5.5, postureState: 'Balanced', activeEp: null };
  };

  const currentAngles = getAnglesAtTime(currentTime);

  const formatMinSec = (sec) => {
    const m = Math.floor(sec / 60);
    const sRem = Math.floor(sec % 60);
    return `${m}:${sRem < 10 ? '0' : ''}${sRem}`;
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] p-4 sm:p-6 lg:p-12 bg-transparent text-slate-800">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Navigation & Header with 3D Depth */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="p-3 rounded-2xl card-3d text-slate-700 hover:text-slate-900 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">{s.title}</h1>
                <span className="text-xs font-sans font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200/80 shadow-xs">
                  {s.average_score} Pts
                </span>
              </div>
              <span className="text-xs font-sans text-slate-500 font-medium">
                Duration: {Math.round(totalDuration / 60)} min • Environment: {s.environment_snapshot}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 font-sans text-xs">
            <span className="text-slate-500 font-medium">Recovery Agility:</span>
            <span className="text-rose-600 font-bold px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200/80 shadow-xs">
              {s.recovery_avg_sec || 14.8}s avg
            </span>
          </div>
        </div>

        {/* 3D POSTURE REPLAY COCKPIT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left: 3D Skeleton Replay Canvas */}
          <div className="lg:col-span-7 h-[480px] sm:h-[560px] rounded-3xl bg-slate-950 border border-slate-700/80 relative overflow-hidden flex items-center justify-center shadow-[0_25px_60px_-15px_rgba(244,63,94,0.18)] ring-1 ring-white/10">
            <ReplaySkeletonCanvas
              headAngle={currentAngles.headAngle}
              shoulderAngle={currentAngles.shoulderAngle}
              torsoAngle={currentAngles.torsoAngle}
              postureState={currentAngles.postureState}
            />

            {/* Corner Indicators */}
            <div className="absolute top-5 left-5 z-20 px-3.5 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/15 text-xs font-sans flex items-center gap-2.5 shadow-md">
              <span className={`w-2 h-2 rounded-full ${
                currentAngles.postureState === 'Balanced' ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'
              }`} />
              <span className="text-slate-200 font-semibold">{currentAngles.postureState}</span>
            </div>

            <div className="absolute bottom-5 left-5 z-20 px-3.5 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/15 text-[11px] font-sans text-slate-300 shadow-md">
              Kinematic frame @ {formatMinSec(currentTime)}
            </div>
          </div>

          {/* Right: Telemetry & Interactive Playback Deck with 3D Depth */}
          <div className="lg:col-span-5 p-8 rounded-3xl card-3d flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-sans uppercase tracking-wider text-slate-400 font-semibold">
                  Frame Ingestion
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-sans font-bold shadow-xs ${
                  currentAngles.postureState === 'Balanced'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {currentAngles.postureState}
                </span>
              </div>

              {/* Angles Deck with 3D Insets */}
              <div className="space-y-3 font-sans text-xs">
                <div className="p-4 rounded-2xl card-3d-inset flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Cervical Pitch (Head)</span>
                  <span className={`text-base font-bold font-display ${currentAngles.headAngle > 22 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {currentAngles.headAngle}°
                  </span>
                </div>

                <div className="p-4 rounded-2xl card-3d-inset flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Shoulder Alignment</span>
                  <span className={`text-base font-bold font-display ${currentAngles.shoulderAngle > 6 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {currentAngles.shoulderAngle}°
                  </span>
                </div>

                <div className="p-4 rounded-2xl card-3d-inset flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Torso Inclination</span>
                  <span className={`text-base font-bold font-display ${currentAngles.torsoAngle > 14 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {currentAngles.torsoAngle}°
                  </span>
                </div>
              </div>

              {/* Active Episode Marker if scrubbing across one */}
              {currentAngles.activeEp && (
                <div className="mt-5 p-4 rounded-2xl bg-rose-50/80 border border-rose-200 text-xs font-sans text-rose-900 shadow-xs">
                  <span className="font-bold block mb-1">
                    Episode #{currentAngles.activeEp.episode_number} — {currentAngles.activeEp.posture_type}
                  </span>
                  <span className="text-rose-700 block text-[11px]">
                    Duration: {currentAngles.activeEp.duration_seconds}s • Severity: {currentAngles.activeEp.severity} • Peak: {currentAngles.activeEp.peak_deviation_deg}°
                  </span>
                </div>
              )}
            </div>

            {/* Playback Controls (Play/Pause, Reset, Speed) */}
            <div className="pt-6 border-t border-slate-200/80 flex items-center justify-between gap-4 font-sans text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:from-orange-600 hover:to-rose-600 text-white transition-all flex items-center justify-center shadow-md shadow-rose-500/25"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                </button>

                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentTime(0);
                  }}
                  className="p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200/80"
                  title="Rewind to start"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Speed Buttons: 0.5x | 1x | 2x | 5x */}
              <div className="flex items-center gap-1 p-1 rounded-2xl card-3d-inset">
                {[0.5, 1, 2, 5].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-2.5 py-1 rounded-xl text-xs transition-all font-semibold ${
                      playbackSpeed === spd
                        ? 'bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>

              <span className="text-slate-700 font-bold">
                {formatMinSec(currentTime)} / {formatMinSec(totalDuration)}
              </span>
            </div>
          </div>

        </div>

        {/* INTERACTIVE TIMELINE SCRUBBER WITH 3D DEPTH */}
        <div className="p-8 rounded-3xl card-3d">
          <PostureTimeline
            timeline={s.timeline}
            episodes={s.episodes}
            currentTime={currentTime}
            totalDuration={totalDuration}
            onSeek={(newT) => setCurrentTime(newT)}
          />
        </div>

        {/* SCORE BREAKDOWN */}
        <ScoreExplainer scoreData={s.score_breakdown} />

      </div>
    </div>
  );
}
