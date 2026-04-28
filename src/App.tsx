/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import { lazy, Suspense } from 'react';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const CalculatorPage = lazy(() => import('./pages/CalculatorPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const MFLandingPage = lazy(() => import('./pages/MFLandingPage'));
const MFAnalyzePage = lazy(() => import('./pages/MFAnalyzePage'));
const MFResultsPage = lazy(() => import('./pages/MFResultsPage'));
const CompareInstrumentsPage = lazy(() => import('./pages/CompareInstrumentsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AIChat = lazy(() => import('./components/AIChat'));
import { ErrorBoundary } from './components/ErrorBoundary';
import { SEBIFooterNote } from './components/SEBIDisclaimer';

import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { loadFDBookings, loadMFHoldings } from './lib/syncService';

function TitleManager() {
  const location = useLocation();
  
  useEffect(() => {
    const base = 'WealthSense';
    const titles: Record<string, string> = {
      '/': 'WealthSense — Invest in FDs. Understand what you earn.',
      '/compare': 'Compare FDs — WealthSense',
      '/calculator': 'Post-Tax Calculator — WealthSense',
      '/portfolio': `Portfolio — ${base}`,
      '/mf': `Mutual Fund Advisor — ${base}`,
      '/mf/analyze': `Analyze My Holdings — ${base}`,
      '/mf/results': `My Portfolio Analysis — ${base}`,
      '/onboarding': 'Get Started — WealthSense'
    };
    document.title = titles[location.pathname] || 'WealthSense';
  }, [location.pathname]);
  
  return null;
}

export default function App() {
  const { initialize, user } = useAuthStore();
  
  useEffect(() => {
    initialize();
  }, [initialize]);
  
  useEffect(() => {
    if (user) {
      loadFDBookings();
      loadMFHoldings();
    }
  }, [user]);

  return (
    <Router>
      <TitleManager />
      <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col font-sans">
        <Navbar />
        <main className="flex-grow">
          <Suspense fallback={
            <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#1A56DB] border-t-transparent rounded-full animate-spin"/>
            </div>
          }>
            <Routes>
              <Route path="/" element={<ErrorBoundary><LandingPage /></ErrorBoundary>} />
              <Route path="/onboarding" element={<ErrorBoundary><OnboardingPage /></ErrorBoundary>} />
              <Route path="/compare" element={<ErrorBoundary><ComparePage /></ErrorBoundary>} />
              <Route path="/calculator" element={<ErrorBoundary><CalculatorPage /></ErrorBoundary>} />
              <Route path="/portfolio" element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
              <Route path="/mf" element={<ErrorBoundary><MFLandingPage /></ErrorBoundary>} />
              <Route path="/mf/analyze" element={<ErrorBoundary><MFAnalyzePage /></ErrorBoundary>} />
              <Route path="/mf/results" element={<ErrorBoundary><MFResultsPage /></ErrorBoundary>} />
              <Route path="/compare-fd-mf" element={<ErrorBoundary><CompareInstrumentsPage /></ErrorBoundary>} />
              <Route path="*" element={<ErrorBoundary><NotFoundPage /></ErrorBoundary>} />
            </Routes>
          </Suspense>
        </main>

        <Suspense fallback={null}>
          <AIChat />
        </Suspense>
        <footer className="py-12 px-6 bg-bg-secondary gradient-border-top">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <img src="/yield-sense-logo.png" alt="WealthSense Logo" className="h-8 w-auto object-contain" />
                <span className="font-syne text-xl font-bold text-accent-blue">WealthSense</span>
              </div>
              <p className="text-text-muted text-sm italic">Invest in FDs. Understand what you earn.</p>
            </div>
            <div className="flex gap-8 text-sm text-text-muted">
              <a href="#" className="hover:text-accent-gold transition-colors">Privacy</a>
              <a href="#" className="hover:text-accent-gold transition-colors">Terms</a>
              <a href="#" className="hover:text-accent-gold transition-colors">Disclosures</a>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <p className="text-xs text-text-muted">
                Backed by Blostem Infrastructure · Made by <a href="https://github.com/sehgalaayu/" target="_blank" rel="noopener noreferrer" className="hover:text-accent-gold transition-colors underline">Aayu Sehgal</a> with ❤️
              </p>
              <div className="text-xs text-[#1E3A5F] flex items-center justify-end gap-2">
                <span>Built for Blostem Hackathon 2026 · © 2026 WealthSense</span>
                <span>·</span>
                <a href="https://github.com/sehgalaayu/YieldSense" target="_blank" rel="noopener noreferrer" className="hover:text-accent-gold transition-colors underline object-contain">GitHub</a>
              </div>
            </div>
          </div>
          <SEBIFooterNote />
        </footer>
      </div>
    </Router>
  );
}
