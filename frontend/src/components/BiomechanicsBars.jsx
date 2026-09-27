import React from 'react';
import { Activity, ShieldCheck, Zap } from 'lucide-react';

export default function BiomechanicsBars({
  headAngle = 12.0,
  shoulderAngle = 2.5,
  torsoAngle = 5.0,
  stability = 91.0
}) {
  // Convert angles to health percentages (100% = optimal neutral)
  const headAlignment = Math.max(0, Math.min(100, Math.round(100 - (Math.max(0, headAngle - 10) * 3.5))));
  const shoulderSymmetry = Math.max(0, Math.min(100, Math.round(100 - (shoulderAngle * 7.5))));
  const lumbarStability = Math.max(0, Math.min(100, Math.round(100 - (Math.max(0, torsoAngle - 4) * 4.0))));
  const enduranceRatio = Math.round(stability);

  const metrics = [
    {
      name: 'Cranio-Cervical Alignment',
      value: `${headAngle}°`,
      pct: headAlignment,
      status: headAngle > 22 ? 'Slump Tendency' : 'Optimal Neutral',
      color: headAngle > 22 ? 'from-amber-500 to-amber-400' : 'from-emerald-500 to-teal-400'
    },
    {
      name: 'Bilateral Thoracic Symmetry',
      value: `${shoulderAngle}°`,
      pct: shoulderSymmetry,
      status: shoulderAngle > 5.5 ? 'Lateral Roll' : 'Balanced Plane',
      color: shoulderAngle > 5.5 ? 'from-amber-500 to-orange-400' : 'from-sky-500 to-emerald-400'
    },
    {
      name: 'Lumbar Vector Straightness',
      value: `${torsoAngle}°`,
      pct: lumbarStability,
      status: torsoAngle > 13 ? 'Excess Anterior Lean' : 'Vertical Stable',
      color: torsoAngle > 13 ? 'from-rose-500 to-amber-500' : 'from-teal-500 to-emerald-400'
    },
    {
      name: 'Session Endurance Index',
      value: `${enduranceRatio}%`,
      pct: enduranceRatio,
      status: enduranceRatio > 85 ? 'High Endurance' : 'Active Fatigue',
      color: 'from-cyan-500 to-emerald-400'
    }
  ];

  return (
    <div className="p-8 rounded-3xl bg-[#080C10] border border-white/[0.08] cockpit-surface">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-widest block mb-1">
            Biomechanical Profiling
          </span>
          <h3 className="text-2xl font-display text-white uppercase tracking-tight">
            Kinematic Vector Balance
          </h3>
        </div>
        <span className="text-xs font-mono text-zinc-500 hidden sm:block">
          ISO-Certified Clinical Ergonomic Envelope
        </span>
      </div>

      <div className="space-y-5 font-mono text-xs">
        {metrics.map((m, idx) => (
          <div key={idx} className="p-4 rounded-2xl bg-zinc-900/50 border border-white/[0.04]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-200 font-bold">{m.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-zinc-500 hidden sm:block">{m.status}</span>
                <span className="text-sm font-bold text-white">{m.value}</span>
              </div>
            </div>

            <div className="w-full h-2 bg-zinc-800/80 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${m.color} rounded-full transition-all duration-500`}
                style={{ width: `${m.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
