import React from 'react';
import { ShieldCheck, Cpu, Lock, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-md text-slate-500 py-10 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-display text-sm font-bold text-slate-900 tracking-tight">
              Align Me • Posture Intelligence
            </span>
            <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200/60">
              Edge-CV Native
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-md font-sans">
            A moment is not a pattern. Real-time computer vision, biomechanical angle extraction, and temporal hysteresis intelligence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs font-sans text-slate-500">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Lock className="w-3.5 h-3.5 text-rose-500" />
            <span>Zero Video Storage</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <Cpu className="w-3.5 h-3.5 text-orange-500" />
            <span>Local Geometric Ingestion</span>
          </div>
          <Link to="/privacy" className="hover:text-rose-600 transition-colors">
            Privacy Manifesto
          </Link>
          <Link to="/calibration" className="hover:text-rose-600 transition-colors">
            Optical Calibration
          </Link>
        </div>
      </div>
    </footer>
  );
}
