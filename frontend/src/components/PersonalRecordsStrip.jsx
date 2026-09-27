import React from 'react';
import { Flame, Clock, Zap, Award, ShieldCheck } from 'lucide-react';

export default function PersonalRecordsStrip({ records }) {
  const r = records || {
    streak_days: 4,
    longest_hold_min: 37,
    fastest_recovery_sec: 14.2,
    best_stability_pct: 91.4,
    total_hours_tracked: 2.8
  };

  const cards = [
    {
      title: 'Current Consistency',
      value: `${r.streak_days} DAYS`,
      subtext: 'Consecutive active workblocks',
      icon: Flame,
      color: 'text-amber-400',
      border: 'border-amber-500/20',
      badge: 'STREAK'
    },
    {
      title: 'Peak Stability Horizon',
      value: `${r.longest_hold_min} MIN`,
      subtext: 'Uninterrupted neutral alignment',
      icon: Clock,
      color: 'text-cyan-400',
      border: 'border-cyan-500/20',
      badge: 'ENDURANCE'
    },
    {
      title: 'Recovery Agility Record',
      value: `${r.fastest_recovery_sec}s`,
      subtext: 'Fastest return to baseline',
      icon: Zap,
      color: 'text-emerald-400',
      border: 'border-emerald-500/20',
      badge: 'PERSONAL BEST'
    },
    {
      title: 'Session High Score',
      value: `${Math.round(r.best_stability_pct)} PTS`,
      subtext: 'Composite stability benchmark',
      icon: Award,
      color: 'text-purple-400',
      border: 'border-purple-500/20',
      badge: 'RECORD'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`p-6 rounded-2xl bg-[#080C10] border ${c.border} cockpit-surface relative overflow-hidden flex flex-col justify-between group hover:border-white/20 transition-all`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">
                {c.title}
              </span>
              <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-900 border border-white/10 text-zinc-400">
                {c.badge}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <span className={`text-3xl font-bold tracking-tight font-display ${c.color}`}>
                  {c.value}
                </span>
                <span className="text-[11px] text-zinc-500 block mt-1">
                  {c.subtext}
                </span>
              </div>
              <Icon className={`w-6 h-6 opacity-30 group-hover:opacity-75 transition-opacity ${c.color}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
