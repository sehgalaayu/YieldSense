import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [userDismissed, setUserDismissed] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    if (standalone) return;

    // Check if user dismissed banner in the last 24 hours
    const dismissalTime = localStorage.getItem("pwa_banner_dismissed_at");
    if (dismissalTime) {
      const now = Date.now();
      const dismissedAt = parseInt(dismissalTime, 10);
      if (now - dismissedAt < 24 * 60 * 60 * 1000) {
        setUserDismissed(true);
        return;
      }
      // 24 hours have passed, forget the dismissal
      localStorage.removeItem("pwa_banner_dismissed_at");
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    const showFallback = window.setTimeout(() => {
      // Only show fallback if user hasn't dismissed it
      if (!userDismissed) {
        setShowBanner(true);
      }
    }, 15000);

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setShowBanner(false));
    return () => {
      window.clearTimeout(showFallback);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, [userDismissed]);

  const isIOS = () =>
    /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        // Some browsers may throw if prompt() isn't allowed; guard it
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") setShowBanner(false);
      } catch (err) {
        console.warn("PWA install prompt failed:", err);
        // fallback to showing install help modal
        setShowInstallHelp(true);
      } finally {
        setDeferredPrompt(null);
      }
      return;
    }

    // Fallback: show platform-specific install instructions
    setShowInstallHelp(true);
  };

  if (!showBanner || isStandalone) return null;

  const handleDismiss = () => {
    setShowBanner(false);
    setUserDismissed(true);
    localStorage.setItem("pwa_banner_dismissed_at", Date.now().toString());
  };

  return (
    <>
      <div className="fixed bottom-32 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 bg-[#112240] border border-[#1A56DB] rounded-xl p-4 shadow-2xl shadow-[#1A56DB]/10 animate-fade-in-up">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1A56DB] flex items-center justify-center text-white font-black text-lg">
              W
            </div>
            <div>
              <p className="text-[#F1F5F9] font-bold text-sm">
                Install WealthSense
              </p>
              <p className="text-[#64748B] text-xs">
                Add to home screen for quick access
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-[#64748B] hover:text-[#F1F5F9] ml-2 text-lg leading-none"
          >
            ✕
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleInstall}
            className="flex-1 py-2 bg-[#1A56DB] text-white font-bold text-sm rounded-lg hover:bg-[#1A56DB]/80 transition-all"
          >
            {deferredPrompt ? "Install →" : "Install App"}
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 border border-[#1E3A5F] text-[#64748B] text-sm rounded-lg hover:text-white transition-colors"
          >
            Later
          </button>
        </div>
      </div>
      {showInstallHelp && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#061426] border border-[#1A56DB] rounded-xl p-5 shadow-2xl text-sm text-[#E6EEF8]">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-lg">How to install WealthSense</p>
                <p className="text-[#94A3B8] mt-1">
                  Follow these steps to add the app to your home screen.
                </p>
              </div>
              <button
                onClick={() => setShowInstallHelp(false)}
                className="text-[#64748B] hover:text-[#F1F5F9] ml-2 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {isIOS() ? (
                <ol className="list-decimal list-inside text-[#CBD5E1]">
                  <li>Open Safari menu (Share icon)</li>
                  <li>Tap "Add to Home Screen"</li>
                  <li>Confirm — the app will be added</li>
                </ol>
              ) : (
                <ol className="list-decimal list-inside text-[#CBD5E1]">
                  <li>Open your browser menu (⋮)</li>
                  <li>Tap "Install app" or "Add to Home screen"</li>
                  <li>If available, the browser will prompt to install</li>
                </ol>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowInstallHelp(false)}
                className="px-4 py-2 border border-[#1E3A5F] text-[#94A3B8] rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
