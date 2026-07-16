import React, { useEffect, useState } from "react";
import { Share, Plus, X, Laptop } from "lucide-react";

// Extend Window interface for custom PWA events and properties
declare global {
  interface Window {
    deferredPWAInstallPrompt?: any;
    triggerDeferredPWAInstall?: () => void;
  }
}

export function PWAPromptManager() {
  const [showDrawer, setShowDrawer] = useState(false);
  const [showIosTooltip, setShowIosTooltip] = useState(false);
  const [promptEvent, setPromptEvent] = useState<any>(null);

  // 1. Android & Desktop Chrome Installation flow
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e);
      window.deferredPWAInstallPrompt = e;

      // Dispatch event so other components can know installation is ready
      window.dispatchEvent(new CustomEvent("trustlink_pwa_prompt_ready"));

      const isDismissed = localStorage.getItem("trustlink_pwa_install_dismissed") === "true";
      const isStandalone = 
        window.matchMedia("(display-mode: standalone)").matches || 
        (window.navigator as any).standalone === true;

      if (!isDismissed && !isStandalone) {
        // Delay slightly before showing custom drawer
        const timer = setTimeout(() => {
          setShowDrawer(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Provide a global window function to invoke installation from Settings page
    window.triggerDeferredPWAInstall = () => {
      const activePrompt = window.deferredPWAInstallPrompt || promptEvent;
      if (activePrompt) {
        activePrompt.prompt();
        activePrompt.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === "accepted") {
            console.log("User accepted the install prompt");
          } else {
            console.log("User dismissed the install prompt");
          }
          setShowDrawer(false);
          window.deferredPWAInstallPrompt = null;
          window.dispatchEvent(new CustomEvent("trustlink_pwa_prompt_cleared"));
        });
      }
    };

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [promptEvent]);

  // 2. iOS Safari Custom Tooltip Coachmark flow
  useEffect(() => {
    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    // Detect Safari accurately (Chrome on iOS usually contains CriOS)
    const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
    const isStandalone = 
      window.matchMedia("(display-mode: standalone)").matches || 
      (window.navigator as any).standalone === true;

    // Only show if iOS Safari, not standalone, and not dismissed before
    const isIosDismissed = localStorage.getItem("trustlink_ios_coachmark_dismissed") === "true";

    if (isIOS && isSafari && !isStandalone && !isIosDismissed) {
      const timer = setTimeout(() => {
        setShowIosTooltip(true);
      }, 2000); // 2 seconds after load
      return () => clearTimeout(timer);
    }
  }, []);

  const handleInstallClick = () => {
    const activePrompt = window.deferredPWAInstallPrompt || promptEvent;
    if (activePrompt) {
      activePrompt.prompt();
      activePrompt.userChoice.then((choiceResult: any) => {
        setShowDrawer(false);
        window.deferredPWAInstallPrompt = null;
        window.dispatchEvent(new CustomEvent("trustlink_pwa_prompt_cleared"));
      });
    } else {
      setShowDrawer(false);
    }
  };

  const handleDismissDrawer = () => {
    localStorage.setItem("trustlink_pwa_install_dismissed", "true");
    setShowDrawer(false);
  };

  const handleDismissIosTooltip = () => {
    localStorage.setItem("trustlink_ios_coachmark_dismissed", "true");
    setShowIosTooltip(false);
  };

  return (
    <>
      {/* custom inline PWA drawer keyframes / transitions */}
      <style>{`
        .pwa-drawer-open {
          transform: translateY(0);
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .pwa-drawer-closed {
          transform: translateY(100%);
          transition: transform 0.3s ease-in;
        }
        .pwa-bounce-in {
          animation: tooltipBounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes tooltipBounceIn {
          0% { opacity: 0; transform: translate3d(-50%, 14px, 0); }
          100% { opacity: 1; transform: translate3d(-50%, 0, 0); }
        }
      `}</style>

      {/* ANDROID/DESKTOP CUSTOM BOTTOM DRAWER */}
      <div 
        id="pwa-install-drawer"
        className={`fixed bottom-0 inset-x-0 z-[49] md:max-w-md md:mx-auto select-none ${
          showDrawer ? "pwa-drawer-open" : "pwa-drawer-closed"
        }`}
      >
        <div className="bg-[#18181b] border-t border-zinc-800 rounded-t-2xl p-5 shadow-2xl flex flex-col gap-4 font-sans text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              {/* Logo block */}
              <div className="w-[40px] h-[40px] rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 48 56" className="w-[20px] h-[23px] shrink-0" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="pwaDrawerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{stopColor: "#10b981", stopOpacity: 1}}/>
                      <stop offset="100%" style={{stopColor: "#065f46", stopOpacity: 1}}/>
                    </linearGradient>
                  </defs>
                  <path d="M4,2 L44,2 L44,38 L24,54 L4,38 Z" fill="url(#pwaDrawerGrad)"/>
                  <polyline points="12,14 24,36 36,14" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="14" x2="36" y2="14" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <h4 className="text-sm font-bold text-white tracking-wide">Install Trova</h4>
                <p className="text-[11.5px] text-zinc-400 mt-0.5 leading-snug">Add to your home screen for faster access</p>
              </div>
            </div>

            <button 
              type="button"
              onClick={handleDismissDrawer}
              className="p-1 px-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button 
              type="button" 
              onClick={handleDismissDrawer}
              className="px-4 py-2 text-[12px] font-bold text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              Not now
            </button>
            <button 
              type="button" 
              onClick={handleInstallClick}
              className="px-4.5 py-2.5 text-[12px] font-bold bg-[#10b981] hover:bg-[#34d399] text-black rounded-lg shadow-lg shadow-emerald-500/10 cursor-pointer transition-all"
            >
              Install App
            </button>
          </div>
        </div>
      </div>

      {/* iOS SAFARI FLOATING COACHMARK TOOLTIP */}
      {showIosTooltip && (
        <div 
          id="pwa-ios-coachmark"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[290px]"
          style={{ zIndex: 100 }}
        >
          <div className="pwa-bounce-in bg-[#18181b] border border-zinc-800 rounded-xl p-4.5 shadow-2xl relative font-sans text-left">
            <div className="flex items-start justify-between">
              <h4 className="text-[12.5px] font-bold text-white tracking-wide">Install Trova on your iPhone</h4>
              <button 
                type="button"
                onClick={handleDismissIosTooltip}
                className="text-zinc-500 hover:text-zinc-200 mt-[-2px]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-col gap-3.5 mt-3 text-xs text-zinc-300">
              {/* Step 1 */}
              <div className="flex items-center gap-3">
                <div className="w-[18px] h-[18px] rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-bold shrink-0">
                  1
                </div>
                <div className="flex items-center gap-1.5 leading-none">
                  <span>Tap the Share button</span>
                  <Share className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-center gap-3">
                <div className="w-[18px] h-[18px] rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-bold shrink-0">
                  2
                </div>
                <div className="flex items-center gap-1.5 leading-none">
                  <span>Then tap Add to Home Screen</span>
                  <Plus className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                </div>
              </div>
            </div>

            <button 
              type="button" 
              onClick={handleDismissIosTooltip}
              className="mt-4 w-full py-2 text-[11px] font-bold text-center bg-[#10b981] hover:bg-[#34d399] text-black rounded-lg transition-colors cursor-pointer"
            >
              Got it
            </button>

            {/* Downward pointing triangle pointer */}
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-10 border-t-[#18181b] z-10" />
            <div className="absolute -bottom-[11px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[11px] border-t-zinc-800" />
          </div>
        </div>
      )}
    </>
  );
}
