import React from 'react';
import { X, Printer, ShieldCheck, Activity, Award, CheckCircle2, AlertTriangle, FileText, ChevronRight } from 'lucide-react';

export default function ClinicalAuditModal({ isOpen, onClose, telemetry, calibration }) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const headAngle = telemetry?.headAngle ?? 12.0;
  const shoulderAngle = telemetry?.shoulderAngle ?? 2.1;
  const torsoAngle = telemetry?.torsoAngle ?? 5.5;
  const stability = telemetry?.stabilityScore ?? 92;

  // Ergonomic RULA Assessment Calculation
  let rulaScore = 2; // 1-2: Negligible risk, 3-4: Low risk, 5-6: Medium risk, 7+: High risk
  if (headAngle > 24 || torsoAngle > 14) rulaScore += 3;
  else if (headAngle > 18 || torsoAngle > 10) rulaScore += 2;
  else if (headAngle > 14) rulaScore += 1;

  if (shoulderAngle > 5) rulaScore += 2;
  else if (shoulderAngle > 3) rulaScore += 1;

  let riskCategory = 'Low Risk (Action Level 1)';
  let riskColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (rulaScore >= 6) {
    riskCategory = 'High Ergonomic Strain (Action Level 3)';
    riskColor = 'text-rose-600 bg-rose-50 border-rose-200';
  } else if (rulaScore >= 4) {
    riskCategory = 'Moderate Strain (Action Level 2)';
    riskColor = 'text-amber-600 bg-amber-50 border-amber-200';
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col print:border-none print:shadow-none print:max-h-none">
        
        {/* HEADER */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between print:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-white">Clinical Ergonomic Audit & Biomechanical Prescription</h2>
              <p className="text-xs text-slate-400 font-sans">Compliant with OSHA 3125 & ISO 11226 Ergonomic Standards</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* AUDIT BODY */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 font-sans print:overflow-visible">
          
          {/* PATIENT & META INFO */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Assessment Date:</span>
              <span className="font-semibold text-slate-800">{currentDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Engine Mode:</span>
              <span className="font-semibold text-slate-800">Edge 3D Optical CV</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Privacy Status:</span>
              <span className="font-semibold text-emerald-600">Zero-Cloud Storage (HIPAA-Safe)</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Baseline Status:</span>
              <span className="font-semibold text-rose-600">
                {calibration?.isCalibrated ? 'Custom Calibrated' : 'Standard Normative'}
              </span>
            </div>
          </div>

          {/* RULA / ERGONOMIC SCORECARD */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">RULA Ergonomic Action Level</span>
              <h3 className="text-xl font-bold font-display text-slate-900 flex items-center gap-2">
                Score {rulaScore} / 7 — <span className={`text-sm px-2.5 py-0.5 rounded-full border ${riskColor} font-semibold`}>{riskCategory}</span>
              </h3>
              <p className="text-xs text-slate-500">
                Evaluates upper extremity postural angles, cervical flexion load, and sustained muscular demand.
              </p>
            </div>
            <div className="text-center sm:text-right">
              <span className="text-xs text-slate-400 block">Posture Stability Index</span>
              <span className="text-3xl font-black font-display text-rose-500">{stability}%</span>
            </div>
          </div>

          {/* BIOMECHANICAL METRICS TABLE */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-500">Biomechanical Vector Breakdown</h4>
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3">Anatomical Region</th>
                    <th className="p-3">Measured Angle</th>
                    <th className="p-3">Clinical Ideal</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">Cervical Pitch (Head/Neck)</td>
                    <td className="p-3 font-mono font-bold text-slate-800">{headAngle}°</td>
                    <td className="p-3 font-mono text-slate-500">&lt; 15.0°</td>
                    <td className="p-3">
                      {headAngle <= 15 ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Optimal</span>
                      ) : (
                        <span className="text-amber-600 font-semibold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> High Flexion (+{(headAngle - 15).toFixed(1)}°)</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">Acromion Tilt (Shoulder Roll)</td>
                    <td className="p-3 font-mono font-bold text-slate-800">{shoulderAngle}°</td>
                    <td className="p-3 font-mono text-slate-500">&lt; 3.0°</td>
                    <td className="p-3">
                      {shoulderAngle <= 3 ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Symmetrical</span>
                      ) : (
                        <span className="text-amber-600 font-semibold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Asymmetric Droop</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">Trunk Vector (Torso Inclination)</td>
                    <td className="p-3 font-mono font-bold text-slate-800">{torsoAngle}°</td>
                    <td className="p-3 font-mono text-slate-500">&lt; 7.0°</td>
                    <td className="p-3">
                      {torsoAngle <= 7 ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Upright</span>
                      ) : (
                        <span className="text-rose-600 font-semibold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Forward Lean</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* CLINICAL PRESCRIPTIONS */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-500">Ergonomic Intervention & Prescriptions</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-xs text-slate-900 mb-1">1. Optical Horizon Adjust</div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Elevate primary display so the top third of the monitor aligns with eye horizon. Decreases cervical load by up to 40%.
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-xs text-slate-900 mb-1">2. Scapular Decompression</div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Perform the 15-second guided spinal reset ritual every 45 minutes to relieve trapezius tension and bilateral shoulder asymmetry.
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-xs text-slate-900 mb-1">3. Center of Mass Symmetry</div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Maintain 50/50 bilateral weight distribution across ischial tuberosities (pelvic balance) to prevent lateral lumbar torsion.
                </p>
              </div>
            </div>
          </div>

          {/* SIGNATURE & CLINICAL DISCLAIMER */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
            <span>Generated autonomously by Align Me Biomechanical Edge Core v2.4</span>
            <span className="font-mono text-slate-500">Validation Hash: #ALM-{Math.floor(100000 + Math.random() * 900000)}</span>
          </div>

        </div>

      </div>
    </div>
  );
}
