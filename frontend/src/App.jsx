import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import LandingPage from './pages/LandingPage';
import OnboardingPage from './pages/OnboardingPage';
import CalibrationPage from './pages/CalibrationPage';
import LiveSessionPage from './pages/LiveSessionPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import SessionDetailPage from './pages/SessionDetailPage';
import ProfilePage from './pages/ProfilePage';
import PrivacyPage from './pages/PrivacyPage';
import InteractivePostureBackground from './components/InteractivePostureBackground';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-light-mesh text-slate-800 font-sans selection:bg-rose-500/20 selection:text-rose-600 relative overflow-x-hidden">
          {/* Vibrant Atmospheric Background Glows (Pink, Orange, and Coral Bloom) */}
          <div className="fixed -top-24 right-1/4 w-[650px] h-[500px] bg-rose-400/22 rounded-full blur-[130px] pointer-events-none -z-10" />
          <div className="fixed top-12 -left-24 w-[600px] h-[550px] bg-orange-400/20 rounded-full blur-[130px] pointer-events-none -z-10" />
          <div className="fixed top-1/2 -right-20 w-[600px] h-[600px] bg-rose-400/18 rounded-full blur-[140px] pointer-events-none -z-10" />
          <div className="fixed bottom-10 left-1/4 w-[650px] h-[500px] bg-amber-400/18 rounded-full blur-[140px] pointer-events-none -z-10" />
          
          {/* Interactive Biomechanical Canvas (cursor-reactive spinal waves & radiant light orbs) */}
          <InteractivePostureBackground />
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/calibration" element={<CalibrationPage />} />
              <Route path="/session" element={<LiveSessionPage />} />
              <Route path="/sessions" element={<HistoryPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/session/:id" element={<SessionDetailPage />} />
              <Route path="/sessions/:id" element={<SessionDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
