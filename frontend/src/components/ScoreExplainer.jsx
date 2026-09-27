import React from 'react';
import { HelpCircle, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';

export default function ScoreExplainer({ scoreData }) {
  const defaultBreakdown = {
    final_score: 87.5,
    breakdown: {
      base: 100.0,
      head_penalty: -4.5,
      shoulder_penalty: -2.0,
      torso_penalty: -3.0,
      persistence_penalty: -6.0,
      recovery_adjustment: +3.0
    },
    explanations: [
      'Head alignment: -4.5 pts from forward cervical pitch (avg 15.2°)',
      'Shoulder balance: -2.0 pts from minor 2.8° right tilt',
      'Torso inclination: -3.0 pts from slight forward lean',
      'Persistent episodes: 3 episodes detected (9.2m sustained fatigue)',
      'Recovery responsiveness: +3.0 pts bonus for rapid 14.8s recovery average'
    ]
  };

  const data = scoreData || defaultBreakdown;
  const b = data.breakdown || defaultBreakdown.breakdown;

  return (
    <div className="p-6 rounded-2xl bg-[#0D1217] border border-white/[0.08] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-zinc-200 uppercase">
            Composite Score Derivation (Mathematical Breakdown)
          </span>
        </div>
        <span className="text-xs font-mono text-emerald-400 font-bold">
          Final: {data.final_score} / 100
        </span>
      </div>

      <p className="text-xs text-zinc-400 font-sans leading-relaxed">
        Our scoring model is deterministic and transparent. Scores start at 100 and apply clinical deductions based on joint angle thresholds, temporal duration, and recovery agility.
      </p>

      {/* Breakdown Math Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <span className="text-zinc-500 block text-[10px] uppercase">Base Alignment</span>
          <span className="text-zinc-200 font-bold text-sm">+100.0 pts</span>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <span className="text-zinc-500 block text-[10px] uppercase">Cervical (Head)</span>
          <span className="text-amber-400 font-bold text-sm">{b.head_penalty} pts</span>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <span className="text-zinc-500 block text-[10px] uppercase">Thoracic (Shoulder)</span>
          <span className="text-amber-400 font-bold text-sm">{b.shoulder_penalty} pts</span>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <span className="text-zinc-500 block text-[10px] uppercase">Torso Inclination</span>
          <span className="text-amber-400 font-bold text-sm">{b.torso_penalty} pts</span>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <span className="text-zinc-500 block text-[10px] uppercase">Persistent Fatigue</span>
          <span className="text-rose-400 font-bold text-sm">{b.persistence_penalty} pts</span>
        </div>

        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <span className="text-zinc-500 block text-[10px] uppercase">Recovery Speed</span>
          <span className="text-emerald-400 font-bold text-sm">
            {b.recovery_adjustment > 0 ? `+${b.recovery_adjustment}` : b.recovery_adjustment} pts
          </span>
        </div>
      </div>

      {/* Explanatory bullet points */}
      <div className="space-y-1.5 pt-2 border-t border-white/[0.05]">
        {(data.explanations || defaultBreakdown.explanations).map((exp, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/70 shrink-0" />
            <span>{exp}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
