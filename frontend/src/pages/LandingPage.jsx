import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import HeroSkeletonCanvas from '../three/HeroSkeleton';
import SpineKinematicsSimulator from '../components/SpineKinematicsSimulator';
import { ArrowRight, Activity, Eye, Zap, Lock, ChevronDown, CheckCircle2, ShieldCheck, Sparkles, Sliders } from 'lucide-react';
import gsap from 'gsap';

export default function LandingPage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    setMousePos({
      x: (clientX / innerWidth) * 2 - 1,
      y: (clientY / innerHeight) * 2 - 1
    });
  };

  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current.querySelectorAll('.hero-anim'),
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out' }
      );
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-transparent relative" onMouseMove={handleMouseMove}>
      
      {/* 1. HERO SECTION */}
      <section ref={heroRef} className="relative min-h-[calc(100vh-4.5rem)] flex flex-col justify-center px-4 sm:px-6 lg:px-12 py-16 border-b border-slate-200/80 overflow-hidden">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Left: Human Editorial Typography */}
          <div className="lg:col-span-7 flex flex-col items-start">
            
            <div className="hero-anim inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-sans font-semibold mb-6 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Edge Computer Vision • In-Browser Telemetry</span>
            </div>

            {/* Radiant Title with Balanced Typography */}
            <h1 className="hero-anim text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-5">
              <span>Your posture </span>
              <br className="hidden sm:inline" />
              <span>has a </span>
              <span className="bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 bg-clip-text text-transparent inline-block">
                pattern.
              </span>
            </h1>

            <div className="hero-anim text-xl sm:text-2xl font-display font-semibold text-slate-700 mb-5">
              We help you see and understand it.
            </div>

            <p className="hero-anim text-base text-slate-600 font-sans max-w-xl mb-8 leading-relaxed">
              Computer vision that understands how your posture shifts over time — not just how you sit for one frame. Differentiating momentary human movement from persistent fatigue episodes.
            </p>

            <div className="hero-anim flex flex-wrap items-center gap-4 w-full sm:w-auto">
              <Link
                to="/calibration"
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:from-orange-600 hover:to-rose-600 text-white font-sans font-semibold text-sm flex items-center gap-3 transition-all shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/35 hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Start Assessment</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/dashboard"
                className="px-6 py-4 rounded-2xl card-3d text-slate-700 hover:text-slate-900 text-sm font-sans font-semibold transition-all flex items-center gap-2"
              >
                <Activity className="w-4 h-4 text-rose-500" />
                <span>Open Dashboard</span>
              </Link>
            </div>

            {/* Scientific Matrix Numbers with 3D Depth Elevation */}
            <div className="hero-anim mt-10 grid grid-cols-3 gap-3.5 w-full max-w-lg font-sans">
              <div className="p-4 sm:p-5 rounded-2xl card-3d">
                <span className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight block">30 FPS</span>
                <span className="text-[11px] text-slate-500 font-medium mt-1 block">Local Inference</span>
              </div>
              <div className="p-4 sm:p-5 rounded-2xl card-3d border-rose-200">
                <span className="text-2xl sm:text-3xl font-bold font-display text-rose-600 tracking-tight block">&lt; 15s</span>
                <span className="text-[11px] text-slate-500 font-medium mt-1 block">Hysteresis Filter</span>
              </div>
              <div className="p-4 sm:p-5 rounded-2xl card-3d border-orange-200">
                <span className="text-2xl sm:text-3xl font-bold font-display text-orange-600 tracking-tight block">100%</span>
                <span className="text-[11px] text-slate-500 font-medium mt-1 block">Private Device CV</span>
              </div>
            </div>

          </div>

          {/* Right: Technical 3D Kinematic Figure with Deep Glass Elevation */}
          <div className="lg:col-span-5 h-[500px] sm:h-[580px] relative rounded-3xl bg-slate-950/95 border border-slate-700/80 shadow-[0_25px_60px_-15px_rgba(244,63,94,0.22)] flex items-center justify-center overflow-hidden transition-all duration-500 hover:scale-[1.01] hover:shadow-[0_35px_80px_-15px_rgba(244,63,94,0.32)] ring-1 ring-white/15">
            <div className="absolute top-0 right-0 w-72 h-72 bg-rose-500/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-orange-500/25 rounded-full blur-3xl pointer-events-none" />

            <HeroSkeletonCanvas mousePos={mousePos} />

            {/* Telemetry badges */}
            <div className="absolute top-4 left-4 z-20 px-3.5 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-white/15 text-xs font-sans font-medium text-slate-200 flex items-center gap-2 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              <span>3D Kinematic Rig • Pointer Reactive</span>
            </div>

            <div className="absolute bottom-4 right-4 z-20 px-3.5 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-white/15 text-xs font-sans text-rose-300 shadow-lg">
              Interactive Tilt Physics
            </div>
          </div>

        </div>

        {/* Scroll down prompt */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-xs font-sans font-medium text-slate-400 animate-bounce">
          <span>Explore Architecture</span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>
      </section>

      {/* 2. INTERACTIVE POSTURE LAB // LIVE BIOMECHANICS SIMULATION */}
      <section className="py-20 px-4 sm:px-6 lg:px-12 border-b border-slate-200/80 relative">
        <div className="max-w-7xl mx-auto">
          <SpineKinematicsSimulator />
        </div>
      </section>

      {/* 3. THE PROBLEM // A MOMENT IS NOT A PATTERN */}
      <section className="py-24 px-4 sm:px-6 lg:px-12 border-b border-slate-200/80 relative">
        <div className="max-w-7xl mx-auto">
          
          <div className="max-w-3xl mb-16">
            <span className="text-xs font-sans font-bold tracking-wider text-rose-600 uppercase block mb-3">
              Core Principle
            </span>
            <h2 className="text-3xl sm:text-5xl font-display font-bold text-slate-900 tracking-tight leading-[1.1] mb-4">
              A moment is not a pattern.
            </h2>
            <p className="text-base text-slate-600 font-sans leading-relaxed">
              If you look down for 2 seconds to check notes or take a sip of water, that is healthy human movement. Flashing a red alert on every 2-second tilt creates noisy false alarms. Align Me differentiates transient mobility from persistent postural episodes.
            </p>
          </div>

          {/* Animated Contrast Matrix with 3D Depth */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
            
            {/* Transient Movement */}
            <div className="p-8 sm:p-10 rounded-3xl card-3d flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs">
                    Duration: 1.8 sec
                  </span>
                  <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider">
                    Transient Shift
                  </span>
                </div>
                <h3 className="text-xl font-display font-bold text-slate-900 mb-2">Temporary Movement</h3>
                <p className="text-sm text-slate-600 font-sans leading-relaxed mb-6">
                  Brief cervical pitch deviation while reaching for an item. Suppressed by the temporal smoothing window (α=0.3).
                </p>
              </div>

              <div className="p-5 rounded-2xl card-3d-inset text-xs space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Persistent Episode:</span>
                  <span className="text-slate-700 font-semibold">No (Filtered Out)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Alert Status:</span>
                  <span className="text-emerald-600 font-bold">Zero False Alert</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Score Impact:</span>
                  <span className="text-slate-800 font-semibold">0.0 pts deducted</span>
                </div>
              </div>
            </div>

            {/* Persistent Episode with Warm 3D Glass Elevation */}
            <div className="p-8 sm:p-10 rounded-3xl card-3d-warm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-44 h-44 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 shadow-xs">
                    Duration: 47.2 sec
                  </span>
                  <span className="text-xs text-rose-600 font-bold uppercase tracking-wider">
                    Episode Logged
                  </span>
                </div>
                <h3 className="text-xl font-display font-bold text-slate-900 mb-2">Persistent Forward Head</h3>
                <p className="text-sm text-slate-600 font-sans leading-relaxed mb-6">
                  Cervical pitch sustained beyond the 15-second hysteresis threshold. Episode recorded with peak deviation and recovery velocity.
                </p>
              </div>

              <div className="p-5 rounded-2xl card-3d-inset border-rose-200/90 text-xs space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Persistent Episode:</span>
                  <span className="text-rose-600 font-bold">Yes (Logged to DB)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Peak Angle:</span>
                  <span className="text-rose-700 font-bold">28.5° Cervical Tilt</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Recovery Tracked:</span>
                  <span className="text-slate-800 font-bold">14.8s back to neutral</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4. REAL-TIME ANALYSIS CARDS WITH 3D DEPTH */}
      <section className="py-24 px-4 sm:px-6 lg:px-12 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <span className="text-xs font-sans font-bold tracking-wider text-orange-600 uppercase block mb-3">
              Real-Time Vision
            </span>
            <h2 className="text-3xl sm:text-5xl font-display font-bold text-slate-900 tracking-tight mb-4">
              See your posture as it happens.
            </h2>
            <p className="text-base text-slate-600 font-sans max-w-2xl leading-relaxed">
              Real-time trigonometric calculation across cervical, acromion, and thoracic vectors with instant explainable status.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-sans text-xs">
            <div className="p-6 rounded-2xl card-3d">
              <span className="text-emerald-600 font-bold text-sm block mb-2">01 • Balanced</span>
              <p className="text-xs text-slate-600 font-sans leading-relaxed">
                Ear-shoulder-hip vertical alignment within 12° cervical pitch and 2.5° shoulder balance.
              </p>
            </div>

            <div className="p-6 rounded-2xl card-3d">
              <span className="text-amber-600 font-bold text-sm block mb-2">02 • Forward Head</span>
              <p className="text-xs text-slate-600 font-sans leading-relaxed">
                Nose and mid-ear vector protruding forward relative to mid-shoulder vertical reference.
              </p>
            </div>

            <div className="p-6 rounded-2xl card-3d">
              <span className="text-orange-600 font-bold text-sm block mb-2">03 • Forward Lean</span>
              <p className="text-xs text-slate-600 font-sans leading-relaxed">
                Mid-shoulder to mid-hip torso axis tilting forward past 16° inclination.
              </p>
            </div>

            <div className="p-6 rounded-2xl card-3d">
              <span className="text-rose-600 font-bold text-sm block mb-2">04 • Shoulder Asymmetry</span>
              <p className="text-xs text-slate-600 font-sans leading-relaxed">
                Unilateral elevation tilt between left and right acromion landmarks exceeding 6°.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRIVACY PLEDGE */}
      <section className="py-20 px-4 sm:px-6 lg:px-12 border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto p-10 rounded-3xl card-3d flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-start gap-5">
            <div className="p-4 rounded-2xl bg-gradient-to-tr from-orange-500 via-rose-500 to-pink-500 text-white shrink-0 mt-1 shadow-md shadow-rose-500/20">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mb-2">
                “Your camera sees you.<br />
                <span className="italic text-rose-600 font-normal">Your raw video doesn’t leave your device.”</span>
              </h3>
              <p className="text-sm text-slate-600 font-sans max-w-xl leading-relaxed mt-2">
                No video streaming to cloud servers. Pose inference executes locally in your browser. The backend only persists scalar joint angles and episode timestamps in dedicated PostgreSQL storage.
              </p>
            </div>
          </div>

          <Link
            to="/privacy"
            className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-sans font-semibold shrink-0 transition-all shadow-sm"
          >
            Privacy Architecture →
          </Link>
        </div>
      </section>

      {/* 5. FINAL CALL TO ACTION */}
      <section className="py-24 px-4 sm:px-6 lg:px-12 text-center relative">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-6xl font-display font-bold text-slate-900 tracking-tight mb-6">
            Understand your posture.
          </h2>
          <p className="text-base text-slate-600 font-sans mb-10 max-w-xl mx-auto">
            Experience real-time computer vision, temporal hysteresis tracking, and interactive 3D kinematic replay.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/calibration"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:from-orange-600 hover:to-rose-600 text-white font-sans font-semibold text-sm shadow-lg shadow-rose-500/25 transition-all hover:shadow-xl hover:shadow-rose-500/35 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
            >
              <span>Begin Optical Calibration</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
