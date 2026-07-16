import React, { useState, useEffect } from "react";
import { ShieldCheck, Menu, X } from "lucide-react";

interface LandingHeaderProps {
  onNavigate: (route: 'landing' | 'login' | 'signup' | 'onboarding' | 'app') => void;
  onSetRole?: (role: 'vendor' | 'buyer') => void;
}

export function LandingHeader({ onNavigate, onSetRole }: LandingHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGetStarted = (role: 'vendor' | 'buyer') => {
    if (onSetRole) onSetRole(role);
    onNavigate('signup');
  };

  return (
    <>
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 h-18 flex items-center justify-between px-6 sm:px-12 w-full ${
        isScrolled 
          ? 'bg-zinc-950/85 backdrop-blur-xl border-b border-zinc-900 shadow-xl' 
          : 'bg-transparent border-b border-transparent'
      }`}>
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 48 56" className="w-[28px] h-[32px] shrink-0" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="trovaMarkLangHeader" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor: "#10b981", stopOpacity: 1}}/>
                  <stop offset="100%" style={{stopColor: "#065f46", stopOpacity: 1}}/>
                </linearGradient>
              </defs>
              <path d="M4,2 L44,2 L44,38 L24,54 L4,38 Z" fill="url(#trovaMarkLangHeader)"/>
              <polyline points="12,14 24,36 36,14" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="14" x2="36" y2="14" stroke="white" strokeWidth="4" strokeLinecap="round"/>
            </svg>
            <span className="font-display font-extrabold text-lg text-white tracking-tight flex items-center gap-0.5 lowercase">
              trova<span className="text-emerald-500 font-bold uppercase tracking-wider text-[11px] ml-1">Escrow</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-[13px] font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#security" className="hover:text-white transition-colors">Trust & Safety</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Success Stories</a>
            <a href="#faq-section" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-3.5">
            <button 
              type="button"
              onClick={() => onNavigate('login')}
              className="text-[13px] font-semibold text-zinc-300 hover:text-white px-3.5 py-2 transition-colors cursor-pointer"
            >
              Sign In
            </button>
            
            <button 
              type="button"
              onClick={() => handleGetStarted('vendor')}
              className="text-[13px] font-bold bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl px-5 py-2.5 transition-all cursor-pointer shadow-lg shadow-emerald-500/5 hover:scale-102"
            >
              Start Selling Free →
            </button>
          </div>

          {/* Hamburger Menu button */}
          <button 
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden flex p-2 rounded-lg bg-zinc-950 border border-zinc-900 text-zinc-300 hover:text-white cursor-pointer"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Menu Slide-over */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-xl flex flex-col p-6 select-none">
          <div className="flex items-center justify-between pb-6 border-b border-zinc-900">
            <div className="flex items-center gap-2.5">
              <svg viewBox="0 0 48 56" className="w-[24px] h-[28px] shrink-0" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="trovaMarkLangHeaderMob" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: "#10b981", stopOpacity: 1}}/>
                    <stop offset="100%" style={{stopColor: "#065f46", stopOpacity: 1}}/>
                  </linearGradient>
                </defs>
                <path d="M4,2 L44,2 L44,38 L24,54 L4,38 Z" fill="url(#trovaMarkLangHeaderMob)"/>
                <polyline points="12,14 24,36 36,14" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="14" x2="36" y2="14" stroke="white" strokeWidth="4" strokeLinecap="round"/>
              </svg>
              <span className="font-display font-extrabold text-base text-white lowercase">
                trova<span className="text-emerald-500 font-bold uppercase tracking-wider text-[9px] ml-1">Escrow</span>
              </span>
            </div>
            <button 
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col gap-6 py-10 text-left">
            <a 
              href="#features" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-bold text-zinc-300 hover:text-white transition-colors"
            >
              Features
            </a>
            <a 
              href="#how-it-works" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-bold text-zinc-300 hover:text-white transition-colors"
            >
              How It Works
            </a>
            <a 
              href="#security" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-bold text-zinc-300 hover:text-white transition-colors"
            >
              Trust & Safety
            </a>
            <a 
              href="#testimonials" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-bold text-zinc-300 hover:text-white transition-colors"
            >
              Success Stories
            </a>
            <a 
              href="#faq-section" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-bold text-zinc-300 hover:text-white transition-colors"
            >
              FAQ
            </a>
          </div>

          <div className="mt-auto flex flex-col gap-3">
            <button 
              type="button"
              onClick={() => { setIsMobileMenuOpen(false); onNavigate('login'); }}
              className="w-full py-3.5 text-center text-sm font-semibold text-zinc-300 border border-zinc-900 rounded-xl hover:bg-zinc-900 cursor-pointer"
            >
              Sign In
            </button>
            <button 
              type="button"
              onClick={() => { setIsMobileMenuOpen(false); handleGetStarted('vendor'); }}
              className="w-full py-3.5 text-center text-sm font-bold bg-emerald-500 text-black rounded-xl hover:bg-emerald-400 cursor-pointer"
            >
              Start Selling Free →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
