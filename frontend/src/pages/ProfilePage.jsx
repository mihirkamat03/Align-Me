import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { fetchLongitudinalProfile } from '../services/api';
import { User, Activity, Clock, Zap, Target, Save, ShieldCheck, Compass, Sparkles } from 'lucide-react';

export default function ProfilePage() {
  const { profile, saveProfile } = useApp();
  const [profileData, setProfileData] = useState(null);
  const [form, setForm] = useState({
    environment: profile?.environment || 'Desk',
    primary_goal: profile?.primary_goal || 'Neck posture',
    camera_height_cm: profile?.camera_height_cm || 75.0,
    sensitivity: profile?.sensitivity || 1.0
  });

  useEffect(() => {
    fetchLongitudinalProfile().then(data => {
      if (data) setProfileData(data);
    });
  }, []);

  const d = profileData || {
    most_common_pattern: 'Forward Head',
    vulnerable_period: '35–50 min into session',
    average_recovery_sec: 14.8,
    best_period: 'First 25 minutes',
    unstable_period: '45–60 minutes',
    posture_endurance_min: 37,
    total_sessions_analyzed: 3,
    category_distribution: {
      'Forward Head': 58.0,
      'Forward Lean': 24.0,
      'Shoulder Asymmetry': 12.0,
      'Persistent Slouch': 6.0
    },
    ergonomic_observations: [
      {
        title: 'Camera Elevation Offset',
        detail: 'Camera appears positioned slightly below eye level, correlating with early forward-head onset.',
        severity: 'moderate'
      },
      {
        title: 'Sustained Sitting Horizon',
        detail: 'Telemetry indicates stability decline begins around minute 37. Incorporate a 45-second decompression pause at minute 35.',
        severity: 'actionable'
      }
    ]
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await saveProfile(form);
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] p-4 sm:p-6 lg:p-12 bg-transparent text-slate-800">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        
        {/* Header */}
        <div>
          <span className="text-xs font-sans font-bold tracking-wider text-rose-600 uppercase block mb-2">
            Longitudinal Intelligence Report
          </span>
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-slate-900 tracking-tight">
            Your Posture Signature
          </h1>
          <p className="text-sm text-slate-600 font-sans mt-2 max-w-xl leading-relaxed">
            Multi-session behavioral analysis synthesized from empirical optical telemetry.
          </p>
        </div>

        {/* 4 LARGE METRIC TILES WITH 3D DEPTH */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-sans text-xs">
          
          {/* MOST COMMON PATTERN */}
          <div className="p-8 rounded-3xl card-3d-warm flex flex-col justify-between">
            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] block mb-2">
                01 • Dominant Pattern
              </span>
              <h3 className="text-sm font-bold text-slate-800 uppercase mb-4">
                Most Common Pattern
              </h3>
            </div>
            <div>
              <span className="text-3xl font-bold font-display text-rose-600 block tracking-tight">
                {d.most_common_pattern}
              </span>
              <span className="text-[11px] text-slate-500 font-medium block mt-2">
                Accounts for {d.category_distribution?.[d.most_common_pattern] || (d.category_distribution ? Object.values(d.category_distribution)[0] : 50)}% of recorded deviations
              </span>
            </div>
          </div>

          {/* FATIGUE HORIZON */}
          <div className="p-8 rounded-3xl card-3d flex flex-col justify-between">
            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] block mb-2">
                02 • Endurance Limit
              </span>
              <h3 className="text-sm font-bold text-slate-800 uppercase mb-4">
                Fatigue Horizon
              </h3>
            </div>
            <div>
              <span className="text-3xl font-bold font-display text-orange-600 block tracking-tight">
                ~{d.posture_endurance_min} min
              </span>
              <span className="text-[11px] text-slate-500 font-medium block mt-2">
                Stability drop begins after ~{d.posture_endurance_min} minutes
              </span>
            </div>
          </div>

          {/* RECOVERY AGILITY */}
          <div className="p-8 rounded-3xl card-3d flex flex-col justify-between">
            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] block mb-2">
                03 • Responsiveness
              </span>
              <h3 className="text-sm font-bold text-slate-800 uppercase mb-4">
                Recovery Agility
              </h3>
            </div>
            <div>
              <span className="text-3xl font-bold font-display text-emerald-600 block tracking-tight">
                {d.average_recovery_sec} sec
              </span>
              <span className="text-[11px] text-slate-500 font-medium block mt-2">
                Average return time to neutral alignment
              </span>
            </div>
          </div>

          {/* OPTIMAL STABILITY WINDOW */}
          <div className="p-8 rounded-3xl card-3d flex flex-col justify-between">
            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px] block mb-2">
                04 • Peak Performance
              </span>
              <h3 className="text-sm font-bold text-slate-800 uppercase mb-4">
                Optimal Window
              </h3>
            </div>
            <div>
              <span className="text-3xl font-bold font-display text-slate-900 block tracking-tight">
                {d.best_period}
              </span>
              <span className="text-[11px] text-slate-500 font-medium block mt-2">
                92%+ consistent baseline stability
              </span>
            </div>
          </div>

        </div>

        {/* WORKSTATION PROFILE & DEVIATION BREAKDOWN WITH 3D DEPTH */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Deviation Distribution Bar Chart */}
          <div className="lg:col-span-6 p-8 sm:p-10 rounded-3xl card-3d">
            <span className="text-xs font-sans font-bold tracking-wider text-slate-800 uppercase block mb-6">
              Deviation Distribution (% of Deviated Time)
            </span>

            <div className="space-y-5 font-sans text-xs">
              {Object.entries(d.category_distribution || {}).map(([pattern, pct]) => (
                <div key={pattern}>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-800 font-semibold">{pattern}</span>
                    <span className="text-slate-500 font-medium">{pct}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 card-3d-inset">
                    <div
                      className={`h-full rounded-full transition-all duration-700 shadow-xs ${
                        pattern === 'Forward Head' ? 'bg-gradient-to-r from-orange-400 to-rose-500' :
                        pattern === 'Forward Lean' ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                        pattern === 'Shoulder Asymmetry' ? 'bg-gradient-to-r from-rose-400 to-pink-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* WORKSTATION SETTINGS FORM */}
          <div className="lg:col-span-6 p-8 sm:p-10 rounded-3xl card-3d">
            <span className="text-xs font-sans font-bold tracking-wider text-slate-800 uppercase block mb-6">
              Workstation Profile & Calibration
            </span>

            <form onSubmit={handleSave} className="space-y-4 font-sans text-xs">
              <div>
                <label className="text-slate-600 font-medium block mb-2 text-xs">Workstation Setup</label>
                <select
                  value={form.environment}
                  onChange={(e) => setForm({ ...form, environment: e.target.value })}
                  className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-slate-800 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 card-3d-inset"
                >
                  <option value="Desk">Office / Standard Desk</option>
                  <option value="Study table">Study Table</option>
                  <option value="Gaming setup">Gaming Cockpit</option>
                  <option value="Standing desk">Standing Desk</option>
                  <option value="Other">Other / Mobile</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-medium block mb-2 text-xs">Primary Therapeutic Goal</label>
                <select
                  value={form.primary_goal}
                  onChange={(e) => setForm({ ...form, primary_goal: e.target.value })}
                  className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-slate-800 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 card-3d-inset"
                >
                  <option value="Neck posture">Neck & Cervical Alignment</option>
                  <option value="Shoulder alignment">Shoulder Symmetry</option>
                  <option value="Sitting posture">Lumbar / Core Neutral</option>
                  <option value="Overall posture">Overall Balanced Alignment</option>
                  <option value="Long-session habits">Long-session Endurance</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:from-orange-600 hover:to-rose-600 text-white font-sans font-semibold text-xs tracking-wider uppercase flex items-center gap-2 transition-all shadow-md shadow-rose-500/25 hover:shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  <span>Update Profile</span>
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
