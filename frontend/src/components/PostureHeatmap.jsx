import React, { useState } from 'react';
import { Layers, Info } from 'lucide-react';

export default function PostureHeatmap({ heatmapData }) {
  const [activeRegion, setActiveRegion] = useState('neck');

  const defaultData = {
    head: { label: 'Craniofacial / Head', strain_level: 'Elevated', percentage: 68.0, color: '#F59E0B', note: 'Forward protrusion during coding blocks' },
    neck: { label: 'Cervical Spine / Neck', strain_level: 'High', percentage: 72.0, color: '#EF4444', note: 'Primary locus of sustained postural load' },
    shoulders: { label: 'Thoracic / Shoulders', strain_level: 'Moderate', percentage: 38.0, color: '#3B82F6', note: 'Mild right acromion elevation' },
    torso: { label: 'Lumbar / Torso', strain_level: 'Optimal', percentage: 22.0, color: '#10B981', note: 'Supported spinal neutral maintained' }
  };

  const data = heatmapData || defaultData;
  const current = data[activeRegion] || data.neck;

  return (
    <div className="p-6 rounded-2xl bg-[#0D1217] border border-white/[0.08] flex flex-col md:flex-row gap-6 items-center">
      {/* Visual Stylized Body Diagram */}
      <div className="relative w-48 h-64 shrink-0 flex items-center justify-center bg-[#080B0E] rounded-xl border border-white/[0.05] p-2">
        <svg className="w-full h-full" viewBox="0 0 160 220">
          {/* Base Wireframe Silhouette */}
          {/* Head */}
          <circle
            cx="80"
            cy="35"
            r="18"
            className="cursor-pointer transition-all duration-300"
            fill={activeRegion === 'head' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(245, 158, 11, 0.15)'}
            stroke={data.head.color}
            strokeWidth={activeRegion === 'head' ? '2.5' : '1.5'}
            onClick={() => setActiveRegion('head')}
          />
          <circle cx="80" cy="35" r="7" fill={data.head.color} opacity="0.8" />

          {/* Neck (Cervical Spine) */}
          <rect
            x="74"
            y="54"
            width="12"
            height="18"
            rx="3"
            className="cursor-pointer transition-all duration-300"
            fill={activeRegion === 'neck' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(239, 68, 68, 0.2)'}
            stroke={data.neck.color}
            strokeWidth={activeRegion === 'neck' ? '2.5' : '1.5'}
            onClick={() => setActiveRegion('neck')}
          />

          {/* Shoulders (Clavicle / Thoracic) */}
          <path
            d="M 35 76 L 125 76 L 115 94 L 45 94 Z"
            className="cursor-pointer transition-all duration-300"
            fill={activeRegion === 'shoulders' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.15)'}
            stroke={data.shoulders.color}
            strokeWidth={activeRegion === 'shoulders' ? '2.5' : '1.5'}
            onClick={() => setActiveRegion('shoulders')}
          />

          {/* Torso / Lumbar */}
          <path
            d="M 46 98 L 114 98 L 102 165 L 58 165 Z"
            className="cursor-pointer transition-all duration-300"
            fill={activeRegion === 'torso' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.15)'}
            stroke={data.torso.color}
            strokeWidth={activeRegion === 'torso' ? '2.5' : '1.5'}
            onClick={() => setActiveRegion('torso')}
          />

          {/* Anatomical Spine Trace line */}
          <line x1="80" y1="54" x2="80" y2="160" stroke="#38BDF8" strokeDasharray="2 3" strokeWidth="1.5" />
        </svg>

        <span className="absolute bottom-2 text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
          Click zone to inspect
        </span>
      </div>

      {/* Region Analytics & Strain Bars */}
      <div className="flex-1 flex flex-col justify-between w-full">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Anatomical Load Heatmap</span>
            </span>
            <span className="text-xs font-mono text-zinc-400">
              Cumulative 7-Day Strain
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(data).map(([key, item]) => {
              const isSelected = activeRegion === key;
              return (
                <div
                  key={key}
                  onClick={() => setActiveRegion(key)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-zinc-800/80 border-white/20 shadow-md'
                      : 'bg-zinc-900/40 border-white/[0.04] hover:border-white/10'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs font-mono mb-1">
                    <span className={isSelected ? 'text-zinc-100 font-bold' : 'text-zinc-400'}>
                      {item.label}
                    </span>
                    <span className="font-mono text-xs font-bold" style={{ color: item.color }}>
                      {item.percentage}% Load ({item.strain_level})
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected zone insight */}
        <div className="mt-4 p-3 rounded-lg bg-zinc-950/70 border border-zinc-800/70 text-xs font-mono text-zinc-400 flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{current.note || `${current.label} shows ${current.strain_level.toLowerCase()} postural strain.`}</span>
        </div>
      </div>
    </div>
  );
}
