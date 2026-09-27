import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchProfile, updateProfile as apiUpdateProfile } from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [demoMode, setDemoMode] = useState(false);
  const [profile, setProfile] = useState({
    environment: 'Desk',
    primary_goal: 'Overall posture',
    sensitivity: 1.0,
    notifications_enabled: true,
    camera_height_cm: 75.0
  });
  const [activeSession, setActiveSession] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchProfile().then(data => {
      if (data) setProfile(data);
    });
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const toggleDemoMode = () => {
    setDemoMode(prev => {
      const next = !prev;
      showToast(
        next 
          ? 'Demo Mode Active: Realistic multi-session telemetry & 3D replay loaded'
          : 'Live Mode: Connected to local device computer-vision engine',
        next ? 'amber' : 'emerald'
      );
      return next;
    });
  };

  const saveProfile = async (updates) => {
    try {
      const updated = await apiUpdateProfile(updates);
      setProfile(updated);
      showToast('Profile preferences updated', 'emerald');
      return updated;
    } catch (err) {
      setProfile(prev => ({ ...prev, ...updates }));
      showToast('Saved locally', 'info');
    }
  };

  return (
    <AppContext.Provider
      value={{
        demoMode,
        setDemoMode,
        toggleDemoMode,
        profile,
        setProfile,
        saveProfile,
        activeSession,
        setActiveSession,
        toast,
        showToast
      }}
    >
      {children}
      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in transition-all duration-300">
          <div className={`px-4 py-3 rounded-lg border text-xs font-mono tracking-wide flex items-center gap-3 shadow-2xl backdrop-blur-xl ${
            toast.type === 'amber'
              ? 'bg-amber-950/80 border-amber-500/40 text-amber-200'
              : toast.type === 'emerald'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : 'bg-zinc-900/90 border-zinc-700/60 text-zinc-200'
          }`}>
            <span className={`w-2 h-2 rounded-full animate-ping ${
              toast.type === 'amber' ? 'bg-amber-400' : toast.type === 'emerald' ? 'bg-emerald-400' : 'bg-cyan-400'
            }`} />
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
