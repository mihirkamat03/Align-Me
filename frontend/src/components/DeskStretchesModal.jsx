import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, CheckCircle2, HeartPulse, Sparkles } from 'lucide-react';

const STRETCHES = [
  {
    id: 'chin_tuck',
    title: 'Cervical Retraction (Chin Tuck)',
    target: 'Deep Cervical Flexors & Suboccipitals',
    duration: 30,
    cues: [
      'Sit tall with your back against the chair backrest.',
      'Gently retract your chin straight back, as if making a subtle double chin.',
      'Hold the contraction for 3 seconds without tilting your head down.',
      'Release smoothly and repeat 6–8 repetitions.'
    ],
    benefit: 'Reverses forward-head strain on C1-C7 vertebrae.'
  },
  {
    id: 'scapular_squeeze',
    title: 'Thoracic Retraction & Scapular Squeeze',
    target: 'Rhomboids, Mid-Trapezius & Anterior Chest',
    duration: 30,
    cues: [
      'Drop your shoulders down away from your ears.',
      'Pull your shoulder blades together and downward as if pinching a pencil.',
      'Keep your chest lifted and breathing steady.',
      'Hold 5 seconds per squeeze, relaxing between reps.'
    ],
    benefit: 'Re-aligns lateral shoulder tilt and opens thoracic cage.'
  },
  {
    id: 'seated_extension',
    title: 'Lumbar & Spinal Decompression',
    target: 'Erector Spinae & Lumbar Discs',
    duration: 30,
    cues: [
      'Place both palms on the small of your lower back.',
      'Gently lean backwards over your chair backrest.',
      'Take a deep 4-second inhalation expanding your diaphragm.',
      'Exhale slowly as you return to neutral upright alignment.'
    ],
    benefit: 'Relieves intradiscal pressure from prolonged sitting posture.'
  }
];

export default function DeskStretchesModal({ isOpen, onClose, onComplete }) {
  const [selectedStretch, setSelectedStretch] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [isActive, setIsActive] = useState(false);
  const [completed, setCompleted] = useState([false, false, false]);

  const current = STRETCHES[selectedStretch];

  useEffect(() => {
    let timer = null;
    if (isActive && secondsRemaining > 0) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isActive) {
      setIsActive(false);
      const updated = [...completed];
      updated[selectedStretch] = true;
      setCompleted(updated);
    }
    return () => clearInterval(timer);
  }, [isActive, secondsRemaining, selectedStretch, completed]);

  const selectExercise = (idx) => {
    setSelectedStretch(idx);
    setSecondsRemaining(STRETCHES[idx].duration);
    setIsActive(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-mono text-xs">
      <div className="w-full max-w-2xl rounded-3xl bg-[#090D14] border border-emerald-500/30 cockpit-surface shadow-2xl p-6 sm:p-8 flex flex-col gap-6 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-display text-white uppercase tracking-tight">
                Desk Decompression & Recovery
              </h2>
              <span className="text-[11px] text-zinc-400">
                Targeted micro-stretches to neutralize cumulative sitting fatigue
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stretch Tabs */}
        <div className="grid grid-cols-3 gap-2">
          {STRETCHES.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => selectExercise(idx)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                selectedStretch === idx
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-zinc-900/60 border-white/[0.04] text-zinc-400 hover:border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase font-bold text-zinc-500">Ex 0{idx + 1}</span>
                {completed[idx] && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <span className="text-xs font-bold text-white leading-snug line-clamp-1">
                {s.title.split('(')[0]}
              </span>
            </button>
          ))}
        </div>

        {/* Active Exercise Display */}
        <div className="p-6 rounded-2xl bg-zinc-900/60 border border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase">
                {current.target}
              </span>
            </div>
            <h3 className="text-lg font-display text-white">{current.title}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              {current.benefit}
            </p>

            <div className="pt-2 space-y-1.5 font-sans text-xs text-zinc-300">
              {current.cues.map((c, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-mono font-bold">{i + 1}.</span>
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Countdown Dial */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-black/50 border border-white/10 shrink-0 w-44">
            <span className="text-5xl font-mono font-bold text-white tracking-tight">
              {secondsRemaining}s
            </span>
            <span className="text-[10px] text-zinc-500 uppercase mt-1">Countdown</span>

            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => setIsActive(!isActive)}
                className="p-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold transition-all shadow-md"
              >
                {isActive ? <Pause className="w-4 h-4 fill-zinc-950" /> : <Play className="w-4 h-4 fill-zinc-950" />}
              </button>
              <button
                onClick={() => {
                  setIsActive(false);
                  setSecondsRemaining(current.duration);
                }}
                className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
          <span className="text-[11px] text-zinc-500">
            {completed.filter(Boolean).length} of 3 exercises finished
          </span>
          <button
            onClick={() => {
              if (onComplete) onComplete();
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold transition-all uppercase tracking-wider text-xs"
          >
            Finish Micro-break
          </button>
        </div>

      </div>
    </div>
  );
}
