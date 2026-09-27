import React, { useState } from 'react';
import { Activity, ShieldCheck, AlertCircle, Sparkles, MoveRight, RotateCcw } from 'lucide-react';

export default function SpineKinematicsSimulator() {
  // Deviation factor: 0 (optimal) to 1 (extreme slump)
  const [slumpFactor, setSlumpFactor] = useState(0.15);

  // Biomechanical calculations based on cervical pitch moment arm
  const headAngle = Math.round(8 + slumpFactor * 32); // 8° to 40°
  const thoracicAngle = Math.round(3 + slumpFactor * 22); // 3° to 25°
  const spinalLoadLbs = Math.round(11 + Math.pow(slumpFactor * 1.5, 1.4) * 36); // 11 lbs to 47 lbs
  const stabilityScore = Math.max(25, Math.round(100 - slumpFactor * 68));

  // Determine state description and color
  let statusText = 'Optimal Neutral Alignment';
  let statusColor = 'text-emerald-600 bg-emerald-50 border-emerald-200/80';
  let ringColor = '#10B981';
  let spineStroke = '#10B981';

  if (slumpFactor > 0.6) {
    statusText = 'Persistent Cervical Strain (High Fatigue)';
    statusColor = 'text-rose-600 bg-rose-50 border-rose-200/80';
    ringColor = '#F43F5E';
    spineStroke = '#F43F5E';
  } else if (slumpFactor > 0.28) {
    statusText = 'Moderate Forward Lean (Fatigue Inception)';
    statusColor = 'text-amber-600 bg-amber-50 border-amber-200/80';
    ringColor = '#F59E0B';
    spineStroke = '#F59E0B';
  }

  // Generate SVG spine vertebrae points dynamically
  const spinePoints = [];
  const baseHeadX = 140 + slumpFactor * 55; // head shifts forward
  const baseHeadY = 40 + slumpFactor * 18;  // head drops slightly
  const midSpineX = 135 + slumpFactor * 22;
  const midSpineY = 135;
  const baseSpineX = 130;
  const baseSpineY = 230;

  // 12 representative spinal vertebral disks
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    // Quadratic bezier curve interpolation
    const vx = Math.pow(1 - t, 2) * baseHeadX + 2 * (1 - t) * t * midSpineX + Math.pow(t, 2) * baseSpineX;
    const vy = Math.pow(1 - t, 2) * baseHeadY + 2 * (1 - t) * t * midSpineY + Math.pow(t, 2) * baseSpineY;
    spinePoints.push({ x: vx, y: vy });
  }

  return (
    <div className="card-3d w-full p-8 sm:p-10 rounded-3xl backdrop-blur-xl">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
        
        {/* Left: Interactive Controls & Biomechanical Metrics */}
        <div className="flex-1 w-full">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-sans font-bold tracking-wider text-rose-600 uppercase">
              Interactive Biomechanics Laboratory
            </span>
            <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Live Simulator
            </span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mb-2">
            Dynamic Cervical & Spinal Load
          </h3>

          <p className="text-sm text-slate-600 font-sans mb-6 leading-relaxed">
            Drag the slider to observe how forward head inclination amplifies gravitational torque on the cervical spine from 11 lbs up to 47 lbs of muscular strain.
          </p>

          {/* Interactive Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <button
              onClick={() => setSlumpFactor(0.08)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-sans font-semibold transition-all ${
                slumpFactor < 0.25
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Neutral (Balanced)
            </button>
            <button
              onClick={() => setSlumpFactor(0.45)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-sans font-semibold transition-all ${
                slumpFactor >= 0.25 && slumpFactor <= 0.6
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Desk Lean (Moderate)
            </button>
            <button
              onClick={() => setSlumpFactor(0.88)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-sans font-semibold transition-all ${
                slumpFactor > 0.6
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Cervical Fatigue (Severe)
            </button>
          </div>

          {/* Interactive Slider with Gradient Track */}
          <div className="mb-8">
            <div className="flex justify-between text-xs font-sans text-slate-500 font-semibold mb-2">
              <span>0° Neutral Horizon</span>
              <span className="text-slate-900 font-bold">{headAngle}° Forward Deviation</span>
              <span>45° Extreme Slump</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={slumpFactor}
              onChange={(e) => setSlumpFactor(parseFloat(e.target.value))}
              className="w-full h-3 bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 rounded-lg appearance-none cursor-pointer accent-slate-900 transition-all"
            />
          </div>

          {/* Metrics Matrix with 3D Inset Surface */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl card-3d-inset">
              <span className="text-[11px] font-sans font-medium text-slate-400 uppercase block mb-1">
                Cervical Angle
              </span>
              <span className="text-xl font-bold font-display text-slate-900">
                {headAngle}°
              </span>
            </div>

            <div className="p-3.5 rounded-2xl card-3d-inset">
              <span className="text-[11px] font-sans font-medium text-slate-400 uppercase block mb-1">
                Thoracic Flex
              </span>
              <span className="text-xl font-bold font-display text-slate-900">
                {thoracicAngle}°
              </span>
            </div>

            <div className="p-3.5 rounded-2xl card-3d-inset border-rose-200/90 bg-rose-50/50">
              <span className="text-[11px] font-sans font-medium text-rose-600 uppercase block mb-1">
                Effective Head Load
              </span>
              <span className="text-xl font-bold font-display text-rose-700">
                {spinalLoadLbs} lbs
              </span>
            </div>

            <div className="p-3.5 rounded-2xl card-3d-inset">
              <span className="text-[11px] font-sans font-medium text-slate-400 uppercase block mb-1">
                Stability Index
              </span>
              <span className="text-xl font-bold font-display text-slate-900">
                {stabilityScore}/100
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`mt-5 p-3.5 rounded-2xl border text-xs font-sans font-semibold flex items-center gap-2 shadow-xs ${statusColor}`}>
            <span className="w-2.5 h-2.5 rounded-full animate-pulse shrink-0" style={{ backgroundColor: ringColor }} />
            <span>Diagnostic: {statusText}</span>
          </div>
        </div>

        {/* Right: Real-Time Dynamic Kinematic Spine Diagram */}
        <div className="w-full sm:w-[320px] h-[340px] rounded-3xl bg-slate-950 border border-slate-700/80 p-4 relative flex flex-col items-center justify-between shadow-[0_20px_45px_-10px_rgba(15,23,42,0.4)] ring-1 ring-white/10 overflow-hidden shrink-0 transition-transform duration-300 hover:scale-[1.02]">
          
          <div className="w-full flex items-center justify-between text-[11px] font-sans text-slate-400 px-2 pt-1 z-10">
            <span>SAGITTAL VIEW</span>
            <span className="text-rose-400 font-semibold">{headAngle}° PITCH</span>
          </div>

          <svg className="w-full h-[260px] my-auto" viewBox="0 0 280 260">
            {/* Background alignment reference lines */}
            <line x1="130" y1="20" x2="130" y2="245" stroke="#334155" strokeDasharray="3 3" strokeWidth="1.2" />
            <line x1="40" y1="230" x2="240" y2="230" stroke="#334155" strokeWidth="1" />

            {/* Neutral alignment reference ghost curve */}
            <path
              d="M 145 42 Q 137 135 130 230"
              fill="none"
              stroke="#475569"
              strokeWidth="2"
              strokeDasharray="4 4"
              opacity="0.4"
            />

            {/* Dynamic Spine Curve */}
            <path
              d={`M ${baseHeadX} ${baseHeadY} Q ${midSpineX} ${midSpineY} ${baseSpineX} ${baseSpineY}`}
              fill="none"
              stroke={spineStroke}
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Cranium / Head Sphere */}
            <circle
              cx={baseHeadX}
              cy={baseHeadY}
              r="22"
              fill="#0F172A"
              stroke={spineStroke}
              strokeWidth="3"
            />
            {/* Cranium Ear Alignment Dot */}
            <circle
              cx={baseHeadX}
              cy={baseHeadY}
              r="4"
              fill="#FFFFFF"
            />

            {/* Vertebral Disks */}
            {spinePoints.map((pt, idx) => (
              <circle
                key={idx}
                cx={pt.x}
                cy={pt.y}
                r={idx === 0 || idx === 12 ? "4.5" : "3.5"}
                fill={idx < 4 ? "#FB923C" : "#F43F5E"}
                stroke="#FFFFFF"
                strokeWidth="1.2"
              />
            ))}

            {/* Pelvic Anchor */}
            <rect
              x={baseSpineX - 18}
              y={baseSpineY}
              width="36"
              height="10"
              rx="4"
              fill="#475569"
            />

            {/* Dynamic Angle Arc & Label */}
            <text
              x={baseHeadX + 28}
              y={baseHeadY + 5}
              fill="#F8FAFC"
              fontSize="12"
              fontFamily="sans-serif"
              fontWeight="bold"
            >
              {headAngle}°
            </text>
          </svg>

          <div className="w-full text-center text-[10px] font-sans text-slate-400 pb-1 z-10">
            Real-time kinetic sagittal projection
          </div>
        </div>

      </div>
    </div>
  );
}
