/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import OnboardingPage from './pages/OnboardingPage';
import ComparePage from './pages/ComparePage';
import CalculatorPage from './pages/CalculatorPage';
import DashboardPage from './pages/DashboardPage';
import AIChat from './components/AIChat';

import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

function TitleManager() {
  const location = useLocation();
  
  useEffect(() => {
    const titles: Record<string, string> = {
      '/': 'YieldSense — Invest in FDs. Understand what you earn.',
      '/compare': 'Compare FDs — YieldSense',
      '/calculator': 'Post-Tax Calculator — YieldSense',
      '/dashboard': 'My Portfolio — YieldSense',
      '/onboarding': 'Get Started — YieldSense'
    };
    document.title = titles[location.pathname] || 'YieldSense';
  }, [location.pathname]);
  
  return null;
}

export default function App() {
  return (
    <Router>
      <TitleManager />
      <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col font-sans">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/calculator" element={<CalculatorPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        <AIChat />
        <footer className="py-12 px-6 bg-bg-secondary gradient-border-top">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <img src="/yield-sense-logo.png" alt="YieldSense Logo" className="h-8 w-auto object-contain" />
                <span className="font-syne text-xl font-bold text-accent-blue">YieldSense</span>
              </div>
              <p className="text-text-muted text-sm italic">Invest in FDs. Understand what you earn.</p>
            </div>
            <div className="flex gap-8 text-sm text-text-muted">
              <a href="#" className="hover:text-accent-gold transition-colors">Privacy</a>
              <a href="#" className="hover:text-accent-gold transition-colors">Terms</a>
              <a href="#" className="hover:text-accent-gold transition-colors">Disclosures</a>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted">
                Backed by Blostem Infrastructure · Powered by Claude AI
              </p>
              <p className="text-xs text-[#1E3A5F] mt-1">
                Built for Blostem Hackathon 2026 · © 2026 YieldSense
              </p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
