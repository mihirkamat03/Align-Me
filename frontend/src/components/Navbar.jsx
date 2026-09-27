import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Video, Menu, X, Sparkles, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Overview', path: '/' },
    { label: 'Live Camera', path: '/session' },
    { label: 'Calibration', path: '/calibration' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'History', path: '/history' },
    { label: 'Profile', path: '/profile' },
    { label: 'Privacy', path: '/privacy' }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 via-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 transition-transform group-hover:scale-105">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg tracking-tight font-extrabold text-slate-900 group-hover:text-rose-600 transition-colors">
                Align Me
              </span>
              <span className="text-[11px] font-sans font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200/60">
                Posture AI
              </span>
            </div>
            <p className="text-[11px] font-sans text-slate-500 font-medium hidden sm:block">
              Posture Intelligence
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Items */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3.5 py-1.5 rounded-xl text-sm font-sans transition-all ${
                  isActive
                    ? 'text-rose-600 bg-rose-50/90 border border-rose-200/70 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side controls: Engine Status & CTA */}
        <div className="flex items-center gap-3">
          
          {/* Engine Active Status Indicator */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-sans font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Neural Engine Ready</span>
          </div>

          {/* Primary CTA */}
          <Link
            to="/session"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:from-orange-600 hover:to-rose-600 text-white text-sm font-sans font-semibold shadow-md shadow-rose-500/25 hover:shadow-lg hover:shadow-rose-500/35 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <Video className="w-4 h-4" />
            <span>Start Session</span>
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-4 border-t border-slate-200/80 bg-white/95 backdrop-blur-xl space-y-1 shadow-lg">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-sans transition-all ${
                  isActive
                    ? 'text-rose-600 bg-rose-50 border border-rose-200/60 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
