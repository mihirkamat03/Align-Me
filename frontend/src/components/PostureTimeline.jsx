import React, { useState } from 'react';
import { Clock, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function PostureTimeline({ timeline = [], episodes = [], onSeek, currentTime = 0, totalDuration = 3000 }) {
  const [selectedEpisode, setSelectedEpisode] = useState(null);

  // Fallback points if timeline is empty
  const points = timeline.length > 0 ? timeline : [
    { timestamp: 0, stability_score: 95, posture_state: 'Balanced' },
    { timestamp: 600, stability_score: 93, posture_state: 'Balanced' },
    { timestamp: 900, stability_score: 68, posture_state: 'Forward Lean' },
    { timestamp: 1200, stability_score: 88, posture_state: 'Balanced' },
    { timestamp: 1750, stability_score: 72, posture_state: 'Shoulder Asymmetry' },
    { timestamp: 2000, stability_score: 90, posture_state: 'Balanced' },
    { timestamp: 2400, stability_score: 62, posture_state: 'Forward Head' },
    { timestamp: 2700, stability_score: 85, posture_state: 'Balanced' },
    { timestamp: 3000, stability_score: 87, posture_state: 'Balanced' }
  ];

  const formatMinSec = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const maxTime = totalDuration || 3000;

  return (
    <div className="flex flex-col gap-4">
      {/* Timeline Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-zinc-200 uppercase">
            Interactive Session Timeline ({Math.round(maxTime / 60)} min)
          </span>
        </div>
        <span className="text-xs font-mono text-zinc-500">
          Click any episode or scrub timeline to inspect
        </span>
      </div>

      {/* Main SVG Timeline Container */}
      <div className="p-5 rounded-2xl bg-[#0B0F14] border border-white/[0.08] relative">
        <div className="relative h-44 w-full">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 160" preserveAspectRatio="none">
            {/* Grid horizontal lines */}
            <line x1="0" y1="20" x2="1000" y2="20" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
            <line x1="0" y1="60" x2="1000" y2="60" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
            <line x1="0" y1="100" x2="1000" y2="100" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
            <line x1="0" y1="140" x2="1000" y2="140" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

            {/* Shaded Episode Rectangles */}
            {episodes.map((ep, idx) => {
              const xStart = (ep.start_offset / maxTime) * 1000;
              const width = Math.max(12, ((ep.duration_seconds || 120) / maxTime) * 1000);
              const isSelected = selectedEpisode?.episode_number === ep.episode_number;

              let fillColor = 'rgba(245, 158, 11, 0.2)'; // Amber
              let strokeCol = '#F59E0B';
              if (ep.posture_type === 'Forward Lean') {
                fillColor = 'rgba(249, 115, 22, 0.2)';
                strokeCol = '#F97316';
              } else if (ep.posture_type === 'Persistent Slouch') {
                fillColor = 'rgba(239, 68, 68, 0.25)';
                strokeCol = '#EF4444';
              }

              return (
                <g key={idx} className="cursor-pointer" onClick={() => setSelectedEpisode(ep)}>
                  <rect
                    x={xStart}
                    y={10}
                    width={width}
                    height={130}
                    rx={4}
                    fill={fillColor}
                    stroke={isSelected ? '#FFFFFF' : strokeCol}
                    strokeWidth={isSelected ? 2 : 1}
                  />
                  <text
                    x={xStart + 6}
                    y={26}
                    fill={strokeCol}
                    fontSize="11"
                    fontFamily="JetBrains Mono"
                    fontWeight="600"
                  >
                    #{ep.episode_number}
                  </text>
                </g>
              );
            })}

            {/* Stability Line Plot */}
            <path
              d={points.reduce((acc, pt, i) => {
                const x = (pt.timestamp / maxTime) * 1000;
                // stability score 0-100 mapped to y 140 -> 20
                const y = 140 - ((pt.stability_score - 40) / 60) * 120;
                return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
              }, '')}
              fill="none"
              stroke="#10B981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Current scrubber needle */}
            {currentTime >= 0 && (
              <line
                x1={(currentTime / maxTime) * 1000}
                y1={0}
                x2={(currentTime / maxTime) * 1000}
                y2={150}
                stroke="#38BDF8"
                strokeWidth="2"
              />
            )}
          </svg>

          {/* Clickable scrub track overlay */}
          <div
            className="absolute inset-0 cursor-crosshair"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = Math.max(0, Math.min(1, clickX / rect.width));
              const newTime = ratio * maxTime;
              if (onSeek) onSeek(newTime);
            }}
          />
        </div>

        {/* Time markers beneath */}
        <div className="flex justify-between text-[11px] font-mono text-zinc-500 mt-2 px-1">
          <span>00:00</span>
          <span>15:00</span>
          <span>30:00</span>
          <span>45:00</span>
          <span>{formatMinSec(maxTime)}</span>
        </div>
      </div>

      {/* Selected Episode Inspector Card */}
      {selectedEpisode ? (
        <div className="p-4 rounded-xl bg-zinc-900/90 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-zinc-200">
                  Episode #{selectedEpisode.episode_number} — {selectedEpisode.posture_type}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30 uppercase">
                  {selectedEpisode.severity}
                </span>
              </div>
              <p className="text-xs font-mono text-zinc-400 mt-1">
                Started at {formatMinSec(selectedEpisode.start_offset)} • Concluded at {formatMinSec(selectedEpisode.end_offset || selectedEpisode.start_offset + selectedEpisode.duration_seconds)} • Peak deviation: {selectedEpisode.peak_deviation_deg}°
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono shrink-0">
            <div>
              <span className="text-zinc-500 block">Duration</span>
              <span className="text-zinc-200 font-bold">{Math.round(selectedEpisode.duration_seconds)}s</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Recovery Time</span>
              <span className="text-emerald-400 font-bold">{selectedEpisode.recovery_time_seconds}s</span>
            </div>
            <button
              onClick={() => {
                if (onSeek) onSeek(selectedEpisode.start_offset);
              }}
              className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono flex items-center gap-1 transition-all"
            >
              <span>Jump to Replay</span>
              <ArrowRight className="w-3 h-3 text-emerald-400" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-zinc-950/40 border border-zinc-800/60 text-xs font-mono text-zinc-500 flex items-center justify-between">
          <span>Click any episode block (#1, #2, #3) to inspect telemetry & recovery duration.</span>
          <span className="text-emerald-400">Recovery tracked longitudinally</span>
        </div>
      )}
    </div>
  );
}
