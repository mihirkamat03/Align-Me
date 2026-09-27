import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowRight, Monitor, BookOpen, Gamepad2, MoveUp, Laptop, Check, Sparkles } from 'lucide-react';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { profile, saveProfile } = useApp();

  const [environment, setEnvironment] = useState(profile?.environment || 'Desk');
  const [goal, setGoal] = useState(profile?.primary_goal || 'Neck posture');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const environments = [
    { id: 'Desk', label: 'Office / Standard Desk', icon: Monitor, desc: 'Single or dual external monitors' },
    { id: 'Study table', label: 'Study Table', icon: BookOpen, desc: 'Laptop on flat surface with books/notes' },
    { id: 'Gaming setup', label: 'Gaming Cockpit', icon: Gamepad2, desc: 'High-back chair with aggressive tilt' },
    { id: 'Standing desk', label: 'Standing Desk', icon: MoveUp, desc: 'Elevated motorized standing workstation' },
    { id: 'Other', label: 'Mobile / Laptop', icon: Laptop, desc: 'Couch, cafe, or variable environments' }
  ];

  const goals = [
    { id: 'Neck posture', label: 'Cervical Spine & Neck', desc: 'Eliminate forward-head protrusion and upper trap tightness' },
    { id: 'Shoulder alignment', label: 'Shoulder Symmetry', desc: 'Fix lateral elevation imbalance and thoracic slouch' },
    { id: 'Sitting posture', label: 'Core & Lumbar Neutral', desc: 'Maintain natural lordotic curve during desk work' },
    { id: 'Overall posture', label: 'Whole-Body Balance', desc: 'Unified alignment across head, shoulders, and spine' },
    { id: 'Long-session habits', label: 'Endurance Horizons', desc: 'Avoid deterioration after 30+ minutes of continuous sitting' }
  ];

  const handleContinue = async () => {
    setIsSubmitting(true);
    await saveProfile({
      environment,
      primary_goal: goal
    });
    setIsSubmitting(false);
    navigate('/calibration');
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-transparent text-slate-800">
      <div className="max-w-3xl w-full p-8 sm:p-12 rounded-3xl card-3d backdrop-blur-xl">
        
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xs font-sans text-rose-600 font-bold uppercase tracking-wider">
            Step 01 of 02 • Environment Profile
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 mb-3 tracking-tight">
          Configure your postural baseline.
        </h1>
        <p className="text-sm text-slate-600 font-sans mb-8 leading-relaxed">
          Align Me personalizes angle thresholds, temporal fatigue predictions, and recovery metrics based on your physical workstation and goals.
        </p>

        {/* 1. Environment Selection */}
        <div className="mb-8">
          <label className="text-xs font-sans font-bold uppercase tracking-wider text-slate-700 block mb-3">
            Where do you usually work?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {environments.map((env) => {
              const Icon = env.icon;
              const isSelected = environment === env.id;
              return (
                <button
                  key={env.id}
                  type="button"
                  onClick={() => setEnvironment(env.id)}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all ${
                    isSelected
                      ? 'bg-rose-50/90 border-rose-300 shadow-md shadow-rose-500/10'
                      : 'card-3d-inset hover:border-slate-300'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 ${isSelected ? 'bg-gradient-to-tr from-orange-500 via-rose-500 to-pink-500 text-white shadow-xs' : 'bg-slate-200 text-slate-600'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className={`text-xs font-sans font-bold block ${isSelected ? 'text-rose-900' : 'text-slate-800'}`}>
                      {env.label}
                    </span>
                    <span className="text-[11px] text-slate-500 font-sans block mt-0.5">
                      {env.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Goal Selection */}
        <div className="mb-10">
          <label className="text-xs font-sans font-bold uppercase tracking-wider text-slate-700 block mb-3">
            What do you want to improve?
          </label>
          <div className="space-y-2.5">
            {goals.map((g) => {
              const isSelected = goal === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGoal(g.id)}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-rose-50/90 border-rose-300 shadow-md shadow-rose-500/10'
                      : 'card-3d-inset hover:border-slate-300'
                  }`}
                >
                  <div>
                    <span className={`text-xs font-sans font-bold block ${isSelected ? 'text-rose-900' : 'text-slate-800'}`}>
                      {g.label}
                    </span>
                    <span className="text-[11px] text-slate-500 font-sans">
                      {g.desc}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-orange-500 to-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Continue Button */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-200/80">
          <span className="text-xs font-sans text-slate-500">
            Next: Optical Silhouette Calibration
          </span>
          <button
            onClick={handleContinue}
            disabled={isSubmitting}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:from-orange-600 hover:to-rose-600 text-white font-sans font-semibold text-xs tracking-wider uppercase flex items-center gap-2 shadow-lg shadow-rose-500/25 transition-all hover:shadow-xl"
          >
            <span>Proceed to Calibration</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
