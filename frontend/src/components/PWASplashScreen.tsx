import React, { useEffect, useState } from 'react';

export function PWASplashScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (PWA)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;

    // Check if already shown in this session
    const hasShown = sessionStorage.getItem('trustlink_pwa_splash_shown');

    if (isStandalone && !hasShown) {
      setIsRendered(true);
      setIsVisible(true);
      sessionStorage.setItem('trustlink_pwa_splash_shown', 'true');

      // After 1.4 seconds, start fading out the overlay
      const fadeOutTimer = setTimeout(() => {
        setIsVisible(false);
      }, 1400);

      // After 1.7 seconds, completely remove the overlay from the DOM
      const removeTimer = setTimeout(() => {
        setIsRendered(false);
      }, 1700);

      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(removeTimer);
      };
    }
  }, []);

  if (!isRendered) return null;

  return (
    <div 
      id="pwa-splash-overlay"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#09090b] text-white transition-opacity duration-300 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ pointerEvents: 'none' }}
    >
      <style>{`
        @keyframes logoFadeIn {
          0% { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes drawLine {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        @keyframes textFadeIn {
          0% { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .animate-logo {
          animation: logoFadeIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-line {
          transform-origin: center;
          animation: drawLine 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards;
        }
        .animate-text {
          opacity: 0;
          animation: textFadeIn 0.3s ease-out 1.2s forwards;
        }
      `}</style>
      
      <div className="flex flex-col items-center justify-center text-center">
        {/* Trova shield logo mark - 80px */}
        <div className="w-[80px] h-[93px] opacity-0 animate-logo flex items-center justify-center select-none mb-4">
          <svg viewBox="0 0 48 56" className="w-[80px] h-[93px] shrink-0" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="trovaMarkSplash" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: "#10b981", stopOpacity: 1}}/>
                <stop offset="100%" style={{stopColor: "#065f46", stopOpacity: 1}}/>
              </linearGradient>
            </defs>
            <path d="M4,2 L44,2 L44,38 L24,54 L4,38 Z" fill="url(#trovaMarkSplash)"/>
            <polyline points="12,14 24,36 36,14" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="14" x2="36" y2="14" stroke="white" strokeWidth="4" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Thin emerald underline - 40px */}
        <div className="w-[40px] h-[1.5px] bg-[#10b981] transform scale-x-0 animate-line" />

        {/* Headline text */}
        <div className="mt-3.5 animate-text flex flex-col items-center">
          <span className="font-display font-black text-xl tracking-tight text-white lowercase">
            trova<span className="text-[#10b981] font-extrabold uppercase tracking-wide text-xs ml-0.5">Escrow</span>
          </span>
          <span className="text-[10px] text-[#10b981] font-bold tracking-[0.2em] mt-1.5 uppercase font-sans">
            SECURE · FAST · TRUSTED
          </span>
        </div>
      </div>
    </div>
  );
}
