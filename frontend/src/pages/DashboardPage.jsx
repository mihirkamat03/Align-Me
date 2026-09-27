import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchDashboardAnalytics, fetchSessions, fetchPersonalRecords } from '../services/api';
import PostureTimeline from '../components/PostureTimeline';
import PostureHeatmap from '../components/PostureHeatmap';
import ScoreExplainer from '../components/ScoreExplainer';
import BiomechanicsBars from '../components/BiomechanicsBars';
import PersonalRecordsStrip from '../components/PersonalRecordsStrip';
import DeskStretchesModal from '../components/DeskStretchesModal';
import VideoUploadModal from '../components/VideoUploadModal';
import { TrendingUp, Clock, ArrowRight, ShieldCheck, Zap, Activity, ChevronRight, BarChart3, Film, HeartPulse, Sparkles } from 'lucide-react';

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [records, setRecords] = useState(null);
  const [timeframe, setTimeframe] = useState('today'); // 'today', 'week', 'month', 'all'
  const [showStretchesModal, setShowStretchesModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [dashData, sessData, recData] = await Promise.all([
          fetchDashboardAnalytics(),
          fetchSessions(),
          fetchPersonalRecords().catch(() => null)
        ]);
        setDashboard(dashData);
        setSessions(sessData);
        if (recData) setRecords(recData);
      } catch (err) {
        console.warn('Dashboard fetch fallback:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const d = dashboard || {
    today_score: 87.5,
    score_change_delta: 4.2,
    today_pattern_headline: '37-Minute Stability Horizon Detected',
    today_pattern_description: 'Your posture remained balanced with 91% stability for 37 minutes before forward-head fatigue manifested. Quick recovery average observed (14.8s).',
    total_tracked_today_min: 50,
    episodes_today_count: 3,
    stability_avg_pct: 88.4,
    avg_recovery_sec: 14.8,
    body_heatmap: null,
    timeline_sample: [],
    recent_episodes: [
      { episode_number: 1, posture_type: 'Forward Lean', start_offset: 840, duration_seconds: 150, severity: 'Mild', recovery_time_seconds: 14.2, peak_deviation_deg: 19.4 },
      { episode_number: 2, posture_type: 'Shoulder Asymmetry', start_offset: 1680, duration_seconds: 165, severity: 'Moderate', recovery_time_seconds: 16.8, peak_deviation_deg: 9.2 },
      { episode_number: 3, posture_type: 'Forward Head', start_offset: 2340, duration_seconds: 240, severity: 'Moderate', recovery_time_seconds: 15.0, peak_deviation_deg: 28.5 }
    ],
    goals: [],
    insights: []
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] p-4 sm:p-6 lg:p-12 bg-transparent text-slate-800">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        
        {/* TOOLBAR: TIMEFRAME SELECTOR + QUICK ACTIONS WITH 3D DEPTH */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-sans text-xs">
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl card-3d">
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: '7 Days' },
              { id: 'month', label: '30 Days' },
              { id: 'all', label: 'All Time' }
            ].map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id)}
                className={`px-4 py-2 rounded-xl transition-all font-semibold ${
                  timeframe === tf.id
                    ? 'bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/25'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowVideoModal(true)}
              className="px-4 py-2.5 rounded-xl card-3d text-slate-700 hover:text-slate-900 transition-all flex items-center gap-2 font-semibold"
            >
              <Film className="w-4 h-4 text-orange-500" />
              <span>Upload Video Footage</span>
            </button>

            <button
              onClick={() => setShowStretchesModal(true)}
              className="px-4 py-2.5 rounded-xl card-3d border-rose-200/90 text-rose-700 hover:text-rose-800 transition-all flex items-center gap-2 font-semibold"
            >
              <HeartPulse className="w-4 h-4 text-rose-500" />
              <span>Desk Decompress</span>
            </button>
          </div>
        </div>

        {/* PERSONAL RECORDS STRIP */}
        <PersonalRecordsStrip records={records} />

        {/* HERO SECTION // PERSONAL INTELLIGENCE COCKPIT WITH 3D ELEVATION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Main Headline & Synthesis */}
          <div className="lg:col-span-8 p-8 sm:p-12 rounded-3xl card-3d flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/08 rounded-full blur-3xl pointer-events-none" />

            <div>
              <span className="text-xs font-sans font-bold tracking-wider text-rose-600 uppercase block mb-3">
                Telemetry Synthesis • Today
              </span>

              <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-slate-900 tracking-tight leading-[1.05] mb-4">
                Telemetry Radar
              </h1>

              <p className="text-xl sm:text-2xl font-display font-semibold text-slate-700 mb-4">
                {d.today_pattern_headline}
              </p>

              <p className="text-sm text-slate-600 font-sans leading-relaxed max-w-xl">
                {d.today_pattern_description}
              </p>
            </div>

            {/* Quick Micro Status Bar with 3D Inset */}
            <div className="mt-8 p-4 rounded-2xl card-3d-inset flex flex-wrap items-center gap-6 font-sans text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] font-medium uppercase">Tracked Duration</span>
                <span className="text-slate-900 font-bold text-sm">{d.total_tracked_today_min} min</span>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div>
                <span className="text-slate-400 block text-[11px] font-medium uppercase">Episodes Logged</span>
                <span className="text-slate-900 font-bold text-sm">{d.episodes_today_count} episodes</span>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div>
                <span className="text-slate-400 block text-[11px] font-medium uppercase">Recovery Agility</span>
                <span className="text-rose-600 font-bold text-sm">{d.avg_recovery_sec}s avg</span>
              </div>
            </div>
          </div>

          {/* Large Stability Score Pill Card with Warm 3D Elevation */}
          <div className="lg:col-span-4 p-8 sm:p-10 rounded-3xl card-3d-warm flex flex-col justify-between">
            <div>
              <span className="text-xs font-sans font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Composite Index
              </span>
              <h3 className="text-sm font-sans font-bold text-slate-800 uppercase">
                Posture Stability
              </h3>
            </div>

            <div className="my-8">
              <div className="flex items-baseline gap-2">
                <span className="text-7xl sm:text-8xl font-display font-extrabold text-slate-900 tracking-tight">
                  {Math.round(d.today_score)}
                </span>
                <span className="text-2xl font-sans text-slate-400 font-medium">/100</span>
              </div>

              <div className="flex items-center gap-2 mt-3 text-xs font-sans font-semibold text-emerald-600">
                <TrendingUp className="w-4 h-4" />
                <span>{d.score_change_delta >= 0 ? `+${d.score_change_delta}` : d.score_change_delta} pts vs prior workblock</span>
              </div>
            </div>

            <Link
              to={sessions.length > 0 ? `/session/${sessions[0].id}` : '/session/session-live-demo-01'}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:from-orange-600 hover:to-rose-600 text-white font-sans text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-500/20"
            >
              <span>Inspect 3D Replay</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </Link>
          </div>

        </div>

        {/* 2. POSTURE TIMELINE // THE SESSION WAVE WITH 3D DEPTH */}
        <div className="p-8 rounded-3xl card-3d">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-sans text-rose-600 font-bold uppercase tracking-wider block mb-1">
                Temporal Waveform
              </span>
              <h3 className="text-2xl font-display font-bold text-slate-900">
                Posture Timeline & Episode Logs
              </h3>
            </div>
            <span className="text-xs font-sans text-slate-400 hidden sm:block">
              Click any episode block to inspect telemetry
            </span>
          </div>

          <PostureTimeline
            timeline={d.timeline_sample}
            episodes={d.recent_episodes}
            totalDuration={3000}
            onSeek={() => {}}
          />
        </div>

        {/* 2.5 BIOMECHANICAL KINEMATIC BARS */}
        <BiomechanicsBars
          headAngle={d.timeline_sample && d.timeline_sample.length > 0 ? d.timeline_sample[d.timeline_sample.length - 1].head_angle : 12.0}
          shoulderAngle={d.timeline_sample && d.timeline_sample.length > 0 ? d.timeline_sample[d.timeline_sample.length - 1].shoulder_angle : 2.5}
          torsoAngle={d.timeline_sample && d.timeline_sample.length > 0 ? d.timeline_sample[d.timeline_sample.length - 1].torso_angle : 5.0}
          stability={d.today_score}
        />

        {/* 3. YOUR PATTERN // EDITORIAL INSIGHT WITH WARM 3D ELEVATION */}
        <div className="p-8 sm:p-12 rounded-3xl card-3d-warm relative overflow-hidden">
          <div className="max-w-3xl">
            <span className="text-xs font-sans font-bold tracking-wider text-rose-600 uppercase block mb-3">
              Section Pattern Analysis
            </span>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mb-3 leading-tight">
              {d.insights && d.insights[0] ? `“${d.insights[0].title}”` : `“${d.today_pattern_headline}”`}
            </h3>
            <p className="text-sm text-slate-600 font-sans leading-relaxed">
              {d.insights && d.insights[0] ? d.insights[0].description : d.today_pattern_description}
            </p>
          </div>
        </div>

        {/* 4. BODY MAP & ANATOMICAL HEATMAP */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <PostureHeatmap heatmapData={d.body_heatmap} />
          </div>
          <div className="lg:col-span-5">
            <ScoreExplainer scoreData={{ final_score: d.today_score }} />
          </div>
        </div>

        {/* 5. RECOVERY TREND & HABITS WITH 3D DEPTH */}
        <div className="p-8 rounded-3xl card-3d">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs font-sans text-orange-600 font-bold uppercase tracking-wider block mb-1">
                Bio-Mechanical Responsiveness
              </span>
              <h3 className="text-2xl font-display font-bold text-slate-900">
                Recovery Agility Over Time
              </h3>
            </div>
            <span className="text-xs font-sans text-emerald-600 font-bold">
              Average recovery improved 24% (21s → 14.8s)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans text-xs">
            <div className="p-5 rounded-2xl card-3d-inset">
              <span className="text-slate-400 uppercase font-semibold block mb-1">Week 1 Baseline</span>
              <span className="text-2xl font-bold font-display text-slate-700">21.4 sec</span>
              <span className="text-[11px] text-slate-500 block mt-2">Initial recovery time</span>
            </div>

            <div className="p-5 rounded-2xl card-3d-inset">
              <span className="text-slate-400 uppercase font-semibold block mb-1">Week 2 Response</span>
              <span className="text-2xl font-bold font-display text-slate-800">18.2 sec</span>
              <span className="text-[11px] text-rose-600 font-semibold block mt-2">-3.2s improvement</span>
            </div>

            <div className="p-5 rounded-2xl card-3d-inset border-rose-200/90 bg-rose-50/50">
              <span className="text-slate-500 uppercase font-semibold block mb-1">Current Workblock</span>
              <span className="text-2xl font-bold font-display text-rose-600">14.8 sec</span>
              <span className="text-[11px] text-rose-700 font-semibold block mt-2">Active personal best</span>
            </div>
          </div>
        </div>

        {/* 6. SESSION HISTORY WITH 3D ELEVATION */}
        <div className="p-8 rounded-3xl card-3d">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-display font-bold text-slate-900 tracking-tight">
              Recorded Workblocks ({sessions.length})
            </h3>
            <Link to="/history" className="text-xs font-sans font-semibold text-rose-600 hover:underline">
              View History Matrix →
            </Link>
          </div>

          <div className="divide-y divide-slate-100 font-sans text-xs">
            {sessions.length === 0 ? (
              <div className="py-8 text-center text-slate-500 font-sans text-xs">
                <p className="mb-3">No recorded workblocks yet in database.</p>
                <Link
                  to="/session"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 hover:bg-rose-100 transition-all font-semibold"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Start Live Calibration & Telemetry</span>
                </Link>
              </div>
            ) : (
              sessions.map((s) => (
                <div key={s.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-slate-900 font-bold text-sm">{s.title}</span>
                      {s.is_demo && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          Reference Session
                        </span>
                      )}
                    </div>
                    <span className="text-slate-500 text-[11px] block mt-1">
                      {Math.round(s.duration_seconds / 60)} min • Primary deviation: {s.primary_deviation}
                    </span>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] block">Stability Score</span>
                      <span className="text-lg font-bold text-rose-600">{s.average_score}</span>
                    </div>

                    <Link
                      to={`/session/${s.id}`}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <span>Replay</span>
                      <ArrowRight className="w-3.5 h-3.5 text-rose-600" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* MODALS */}
        <DeskStretchesModal
          isOpen={showStretchesModal}
          onClose={() => setShowStretchesModal(false)}
        />

        <VideoUploadModal
          isOpen={showVideoModal}
          onClose={() => setShowVideoModal(false)}
        />

      </div>
    </div>
  );
}
