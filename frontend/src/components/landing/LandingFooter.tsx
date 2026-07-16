import React from "react";
import { Shield } from "lucide-react";

interface LandingFooterProps {
  onNavigate: (route: 'landing' | 'login' | 'signup' | 'onboarding' | 'app') => void;
  onSetRole?: (role: 'vendor' | 'buyer') => void;
}

export function LandingFooter({ onNavigate, onSetRole }: LandingFooterProps) {
  return (
    <footer className="border-t border-zinc-900 bg-black pt-16 pb-12 px-6 sm:px-12 text-left font-sans relative overflow-hidden">
      {/* Giant centered responsive ambient Trova logo with wordmark in the background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[540px] pointer-events-none select-none z-0 opacity-[0.14]">
        <svg viewBox="0 0 200 60" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="shieldGradGiant" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor: "#10b981", stopOpacity: 1}}/>
              <stop offset="100%" style={{stopColor: "#065f46", stopOpacity: 1}}/>
            </linearGradient>
          </defs>
          {/* Shield mark */}
          <path d="M22,8 L38,8 L38,32 L30,42 L22,32 Z" fill="url(#shieldGradGiant)"/>
          <polyline points="25,16 30,26 35,16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="25" y1="16" x2="35" y2="16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          {/* Wordmark */}
          <text x="48" y="32" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="22" fill="#f4f4f5" letterSpacing="-0.5">trova</text>
          <text x="49" y="45" fontFamily="Arial, sans-serif" fontSize="8" fill="#10b981" letterSpacing="4">ESCROW</text>
        </svg>
      </div>

      <div className="max-w-6xl mx-auto flex flex-col gap-12 relative z-10">
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          
          {/* Column 1: Brand details */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4 text-left font-normal">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 48 56" className="w-[18px] h-[21px] shrink-0" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="trovaMarkFooter" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: "#10b981", stopOpacity: 1}}/>
                    <stop offset="100%" style={{stopColor: "#065f46", stopOpacity: 1}}/>
                  </linearGradient>
                </defs>
                <path d="M4,2 L44,2 L44,38 L24,54 L4,38 Z" fill="url(#trovaMarkFooter)"/>
                <polyline points="12,14 24,36 36,14" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="14" x2="36" y2="14" stroke="white" strokeWidth="4" strokeLinecap="round"/>
              </svg>
              <span className="font-display font-extrabold text-base text-white lowercase">
                trova<span className="text-emerald-500 font-bold uppercase tracking-wider text-[9px] ml-1">Escrow</span>
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#71717a]">
              Eliminating transaction anxiety for buyers and sellers across social commerce channels. Settle safely, live fully.
            </p>
          </div>

          {/* Column 2: Products */}
          <div className="flex flex-col gap-3 font-normal">
            <span className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider font-mono">Products</span>
            <button 
              type="button"
              onClick={() => { onSetRole?.('vendor'); onNavigate('signup'); }} 
              className="text-left text-[11.5px] text-[#71717a] hover:text-[#f4f4f5] transition-colors duration-200 cursor-pointer"
            >
              Merchant Links
            </button>
            <button 
              type="button"
              onClick={() => { onSetRole?.('buyer'); onNavigate('signup'); }} 
              className="text-left text-[11.5px] text-[#71717a] hover:text-[#f4f4f5] font-sans transition-colors duration-200 cursor-pointer"
            >
              Buyer Protections
            </button>
            <button 
              type="button"
              onClick={() => onNavigate('login')} 
              className="text-left text-[11.5px] text-[#71717a] hover:text-[#f4f4f5] transition-colors duration-200 cursor-pointer"
            >
              Sellers Desk
            </button>
            {/* Staff Admin Desk removed from public footer */}
          </div>

          {/* Column 3: Trust system statutory pages */}
          <div className="flex flex-col gap-3 font-normal">
            <span className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider font-mono">Trust System</span>
            <button 
              type="button"
              onClick={() => onNavigate('privacy' as any)} 
              className="text-left text-[11.5px] text-[#71717a] hover:text-[#f4f4f5] transition-colors duration-200 cursor-pointer"
            >
              Safe Escrow Audits
            </button>
            <button 
              type="button"
              onClick={() => onNavigate('terms' as any)} 
              className="text-left text-[11.5px] text-[#71717a] hover:text-[#f4f4f5] transition-colors duration-200 cursor-pointer"
            >
              Dispute Resolution Policy
            </button>
            <button 
              type="button"
              onClick={() => onNavigate('terms' as any)} 
              className="text-left text-[11.5px] text-[#71717a] hover:text-[#f4f4f5] transition-colors duration-200 cursor-pointer"
            >
              Terms of Escrow Service
            </button>
          </div>

          {/* Column 4: Location details */}
          <div className="flex flex-col gap-3 font-normal font-sans">
            <span className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-wider font-mono">Location</span>
            <span className="text-[11.5px] text-[#71717a] leading-relaxed font-sans">
              Global Operations &<br />
              Remote Trustee Network.
            </span>
            <a href="mailto:support@trova.co" className="text-[11.5px] text-[#10b981] hover:underline transition-colors duration-200">support@trova.co</a>
          </div>

        </div>

        <hr className="w-full opacity-10 border-zinc-900" />

        {/* Fintech regulation note */}
        <div className="flex flex-col gap-4">
          <p className="text-[10px] leading-relaxed text-[#71717a] font-normal">
            Disclaimer: Trova is a global financial technology platform, not a licensed commercial bank. Escrow holding deposits is segregated secure and settled in conjunction with partner international commercial trust banks under global banking trade parameters.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1.5 text-[10.5px] text-zinc-600 border-t border-zinc-900 opacity-70 font-normal">
            <span className="text-[#52525b]">© {new Date().getFullYear()} Trova Global. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <button 
                type="button"
                onClick={() => onNavigate('privacy' as any)} 
                className="text-[#71717a] hover:text-[#f4f4f5] transition-colors duration-200 cursor-pointer"
              >
                Privacy Policy
              </button>
              <span className="text-[#52525b]">•</span>
              <button 
                type="button"
                onClick={() => onNavigate('terms' as any)} 
                className="text-[#71717a] hover:text-[#f4f4f5] transition-colors duration-200 cursor-pointer"
              >
                Terms of Escrow Service
              </button>
              <span className="text-[#52525b]">•</span>
              <span className="text-[#52525b]">Cookie parameters</span>
            </div>
          </div>
        </div>

      </div>

    </footer>
  );
}
