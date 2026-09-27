import React, { useState } from 'react';
import { purgeData } from '../services/api';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Lock, Trash2, Cpu, FileText, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

export default function PrivacyPage() {
  const { showToast } = useApp();
  const [isPurging, setIsPurging] = useState(false);
  const [purgedMessage, setPurgedMessage] = useState(null);

  const handlePurge = async () => {
    if (!window.confirm("Are you sure you want to permanently delete all posture metrics, sessions, and telemetry? This cannot be undone.")) {
      return;
    }
    setIsPurging(true);
    try {
      const res = await purgeData();
      setPurgedMessage(res.message);
      showToast('All posture telemetry erased successfully', 'emerald');
    } catch (err) {
      showToast('Failed to purge data', 'amber');
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] p-4 sm:p-6 lg:p-12 bg-transparent text-slate-800">
      <div className="max-w-4xl mx-auto flex flex-col gap-10">
        
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-3 text-rose-600 font-sans text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Privacy Architecture & Trust Guarantee</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            “Your camera sees you.<br />
            <span className="bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 bg-clip-text text-transparent">
              Your raw video doesn’t leave your device.”
            </span>
          </h1>
          <p className="text-sm text-slate-600 font-sans mt-4 leading-relaxed max-w-2xl">
            Align Me was engineered with zero-knowledge optical telemetry. We believe physical health diagnostics should never compromise personal optical privacy.
          </p>
        </div>

        {/* 3 Pillars of Privacy with 3D Depth */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans text-xs">
          
          <div className="p-8 rounded-3xl card-3d flex flex-col justify-between">
            <div>
              <div className="p-3 rounded-2xl bg-orange-50 border border-orange-200/80 text-orange-600 w-fit mb-5 shadow-xs">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-display font-bold text-slate-900 mb-2">1. Local Edge CV</h3>
              <p className="text-xs text-slate-600 font-sans leading-relaxed">
                Pose landmark extraction occurs entirely in your browser’s WebGL thread. Raw optical pixels never hit an external network.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-rose-600 mt-6 block">0 bytes video transmitted</span>
          </div>

          <div className="p-8 rounded-3xl card-3d flex flex-col justify-between">
            <div>
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-600 w-fit mb-5 shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-display font-bold text-slate-900 mb-2">2. Scalar Telemetry Only</h3>
              <p className="text-xs text-slate-600 font-sans leading-relaxed">
                The backend receives only geometric scalars: head angle (12.4°), shoulder tilt (2.1°), and episode timestamps.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-orange-600 mt-6 block">Non-invertible geometry</span>
          </div>

          <div className="p-8 rounded-3xl card-3d flex flex-col justify-between">
            <div>
              <div className="p-3 rounded-2xl bg-pink-50 border border-pink-200/80 text-pink-600 w-fit mb-5 shadow-xs">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-display font-bold text-slate-900 mb-2">3. Total Erasure Right</h3>
              <p className="text-xs text-slate-600 font-sans leading-relaxed">
                You retain complete sovereignty over your telemetry. You can cryptographically purge all stored session records anytime.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-rose-600 mt-6 block">Instant one-click purge</span>
          </div>

        </div>

        {/* Data Purge Section with 3D Depth */}
        <div className="p-8 sm:p-10 rounded-3xl card-3d border-rose-200/90 bg-rose-50/40">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-display font-bold text-slate-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Delete All Telemetry & Posture History</span>
              </h3>
              <p className="text-xs text-slate-600 font-sans max-w-xl leading-relaxed">
                Permanently deletes all historical sessions, joint angles, episode logs, and summary records from the system database.
              </p>
            </div>

            <button
              onClick={handlePurge}
              disabled={isPurging}
              className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-sans font-semibold text-xs flex items-center gap-2 transition-all shadow-md shadow-rose-600/25 shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isPurging ? 'Purging Records...' : 'Purge All My Data'}</span>
            </button>
          </div>

          {purgedMessage && (
            <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-sans font-semibold text-emerald-800 flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{purgedMessage}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
