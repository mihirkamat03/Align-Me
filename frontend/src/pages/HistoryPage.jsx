import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchSessions } from '../services/api';
import { Calendar, TrendingUp, Clock, ArrowRight, Activity, Filter, CheckCircle2, Sparkles } from 'lucide-react';

export default function HistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const sessList = await fetchSessions();
        setSessions(sessList);
        if (sessList && sessList.length > 0) {
          setSelectedSession(sessList[0]);
        }
      } catch (err) {
        console.warn('Fallback history');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const historyBars = sessions && sessions.length > 0
    ? sessions.slice(0, 6).reverse().map((sess, idx) => {
        const d = new Date(sess.start_time);
        const day = d.toLocaleDateString(undefined, { weekday: 'short' });
        const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        return {
          day: idx === (Math.min(sessions.length, 6) - 1) ? 'Latest' : day,
          date,
          score: sess.average_score,
          duration: `${Math.round(sess.duration_seconds / 60)}m`,
          episodes: sess.episode_count ?? (sess.is_demo ? 3 : 0),
          primary: sess.primary_deviation || 'Balanced'
        };
      })
    : [
        { day: 'Today', date: 'Live Pending', score: 0.0, duration: '0m', episodes: 0, primary: 'Awaiting Calibration' }
      ];

  const trajectoryImprovement = historyBars.length > 1
    ? (historyBars[historyBars.length - 1].score - historyBars[0].score).toFixed(1)
    : '0.0';

  return (
    <div className="min-h-[calc(100vh-4.5rem)] p-4 sm:p-6 lg:p-12 bg-transparent text-slate-800">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        
        {/* Header */}
        <div>
          <span className="text-xs font-sans font-bold tracking-wider text-rose-600 uppercase block mb-2">
            Longitudinal Telemetry Matrix
          </span>
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-slate-900 tracking-tight">
            Session History & Trends
          </h1>
          <p className="text-sm text-slate-600 font-sans mt-2 max-w-xl leading-relaxed">
            Multi-session timeline tracking your stability curve, fatigue horizon, and recovery agility over time.
          </p>
        </div>

        {/* VISUAL SESSION PROGRESSION WITH 3D DEPTH */}
        <div className="p-8 sm:p-10 rounded-3xl card-3d">
          <div className="flex items-center justify-between mb-8">
            <span className="text-xs font-sans font-bold text-slate-800 uppercase tracking-wider">
              Bi-Weekly Stability Progression
            </span>
            <span className="text-xs font-sans text-rose-600 font-bold px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200/80 shadow-xs">
              {Number(trajectoryImprovement) >= 0 ? `+${trajectoryImprovement}` : trajectoryImprovement} pts Trajectory Delta
            </span>
          </div>

          {/* Graphical Progression Lines with 3D Insets */}
          <div className="space-y-4 font-sans text-xs">
            {historyBars.map((bar, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl card-3d-inset">
                <div className="w-32 shrink-0">
                  <span className="font-bold text-slate-900 text-sm block">{bar.day}</span>
                  <span className="text-slate-400 text-[11px] font-medium">{bar.date} • {bar.duration}</span>
                </div>

                <div className="flex-1 mx-2 flex items-center gap-3">
                  <div className="flex-1 h-3.5 bg-slate-200/80 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 rounded-full transition-all duration-700 shadow-xs"
                      style={{ width: `${bar.score}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <span className="text-slate-500 text-[11px] font-medium hidden sm:block">
                    {bar.episodes} episodes • {bar.primary}
                  </span>
                  <span className="text-lg font-bold font-display text-rose-600 w-16 text-right">
                    {bar.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SESSIONS DIRECTORY WITH 3D ELEVATION */}
        <div className="p-8 sm:p-10 rounded-3xl card-3d">
          <span className="text-xs font-sans font-bold tracking-wider text-slate-800 uppercase block mb-6">
            All Tracked Workblocks ({sessions.length})
          </span>

          <div className="divide-y divide-slate-100 font-sans text-xs">
            {sessions.length === 0 ? (
              <div className="py-8 text-center text-slate-500 font-sans text-xs">
                No sessions recorded yet. Start tracking to establish your baseline posture trajectory.
              </div>
            ) : (
              sessions.map((sess) => (
                <div key={sess.id} className="py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors hover:bg-slate-50/60 rounded-xl px-2">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-900 font-bold text-base">{sess.title}</span>
                      {sess.is_demo && (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                          Reference Session
                        </span>
                      )}
                    </div>
                    <span className="text-slate-500 text-xs block mt-1">
                      Recorded {new Date(sess.start_time).toLocaleDateString()} • {Math.round(sess.duration_seconds / 60)} minutes • Primary deviation: {sess.primary_deviation}
                    </span>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] block uppercase font-medium">Stability</span>
                      <span className="text-xl font-bold font-display text-rose-600">{sess.average_score}</span>
                    </div>

                    <Link
                      to={`/session/${sess.id}`}
                      className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 border border-slate-200/80 shadow-xs"
                    >
                      <span>3D Replay</span>
                      <ArrowRight className="w-3.5 h-3.5 text-rose-600" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
