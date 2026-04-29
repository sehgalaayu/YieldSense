import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 30000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowBanner(false);
    setDeferredPrompt(null);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 bg-[#112240] border border-[#1A56DB] rounded-xl p-4 shadow-2xl shadow-[#1A56DB]/10 animate-fade-in-up">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1A56DB] flex items-center justify-center text-white font-black text-lg">
            W
          </div>
          <div>
            <p className="text-[#F1F5F9] font-bold text-sm">Install WealthSense</p>
            <p className="text-[#64748B] text-xs">Add to home screen for quick access</p>
          </div>
        </div>
        <button onClick={() => setShowBanner(false)} className="text-[#64748B] hover:text-[#F1F5F9] ml-2 text-lg leading-none">✕</button>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={handleInstall}
          className="flex-1 py-2 bg-[#1A56DB] text-white font-bold text-sm rounded-lg hover:bg-[#1A56DB]/80 transition-all">
          Install →
        </button>
        <button onClick={() => setShowBanner(false)}
          className="px-4 py-2 border border-[#1E3A5F] text-[#64748B] text-sm rounded-lg hover:text-white transition-colors">
          Later
        </button>
      </div>
    </div>
  );
}
