import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";

interface HeroSectionProps {
  onNavigate: (route: 'landing' | 'login' | 'signup' | 'onboarding' | 'app') => void;
  onSetRole?: (role: 'vendor' | 'buyer') => void;
}

export function HeroSection({ onNavigate, onSetRole }: HeroSectionProps) {
  // Normalized cursor coordinate tracking state for brand floating sync
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      const y = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
      setMouseOffset({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Dashboard premium collapse/scale scroll animation
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [scrollTransform, setScrollTransform] = useState({
    scale: 0.92,
    rotateX: 12,
    translateY: 40,
    opacity: 0.7,
  });

  useEffect(() => {
    const handleScrollAnim = () => {
      if (!dashboardRef.current) return;
      const rect = dashboardRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight || 0;

      const triggerStart = windowHeight;
      const triggerEnd = windowHeight * 0.4;
      const totalDistance = triggerStart - triggerEnd;
      const distanceVal = triggerStart - (rect ? rect.top : 0);

      // Safe check for division by zero or NaN values
      let progress = 0;
      if (totalDistance > 0) {
        progress = distanceVal / totalDistance;
      }
      
      progress = Math.max(0, Math.min(1, progress));
      if (isNaN(progress) || !isFinite(progress)) {
        progress = 0;
      }

      const rawScale = 0.92 + 0.08 * progress;
      const rawRotateX = 12 * (1 - progress);
      const rawTranslateY = 40 * (1 - progress);
      const rawOpacity = 0.7 + 0.3 * progress;

      setScrollTransform({
        scale: isNaN(rawScale) || !isFinite(rawScale) ? 0.92 : rawScale,
        rotateX: isNaN(rawRotateX) || !isFinite(rawRotateX) ? 12 : rawRotateX,
        translateY: isNaN(rawTranslateY) || !isFinite(rawTranslateY) ? 40 : rawTranslateY,
        opacity: isNaN(rawOpacity) || !isFinite(rawOpacity) ? 0.7 : rawOpacity,
      });
    };

    window.addEventListener("scroll", handleScrollAnim);
    handleScrollAnim();
    return () => window.removeEventListener("scroll", handleScrollAnim);
  }, []);

  const handleGetStarted = (role: "vendor" | "buyer") => {
    if (onSetRole) onSetRole(role);
    onNavigate("signup");
  };

  return (
    <section className="relative pt-32 pb-20 px-6 sm:px-12 max-w-7xl mx-auto w-full flex flex-col items-center overflow-hidden mt-10">
      {/* Ambient atmospheric radial lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[400px] bg-emerald-500/[0.03] rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute top-[-20%] right-[-10%] w-[330px] h-[330px] bg-emerald-500/[0.02] rounded-full blur-[100px] pointer-events-none" />

      {/* Cursor/Mouse Sync Floating background icons */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
        {/* Top Left: Storefront/Store */}
        <div
          className="absolute top-[12%] left-[8%] opacity-[0.025] transition-transform duration-200 ease-out hidden md:block"
          style={{ transform: `translate(${mouseOffset.x * 25}px, ${mouseOffset.y * 25}px)` }}
        >
          <svg className="w-16 h-16 stroke-current text-white" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="text-[9px] font-mono tracking-widest text-zinc-500 block text-center mt-1 scale-90">RETAIL_SHOP</span>
        </div>

        {/* Top Right: Instagram */}
        <div
          className="absolute top-[14%] right-[10%] opacity-[0.025] transition-transform duration-200 ease-out hidden md:block"
          style={{ transform: `translate(${mouseOffset.x * -20}px, ${mouseOffset.y * -20}px)` }}
        >
          <svg className="w-14 h-14 stroke-current text-white" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
          <span className="text-[9px] font-mono tracking-widest text-zinc-500 block text-center mt-1 scale-90">ONLINE_BRAND</span>
        </div>

        {/* Middle Left */}
        <div
          className="absolute top-[42%] left-[6%] opacity-[0.022] transition-transform duration-200 ease-out hidden lg:block"
          style={{ transform: `translate(${mouseOffset.x * 15}px, ${mouseOffset.y * -30}px)` }}
        >
          <svg className="w-15 h-15 stroke-current text-white" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
            <line x1="9" y1="22" x2="9" y2="16" />
            <line x1="15" y1="22" x2="15" y2="16" />
            <line x1="9" y1="16" x2="15" y2="16" />
            <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zm-6 4h2v2H8v-2zm6 0h2v2h-2v-2z" />
          </svg>
          <span className="text-[9px] font-mono tracking-widest text-zinc-500 block text-center mt-1 scale-90">REAL_ESTATE_FIRM</span>
        </div>

        {/* Middle Right */}
        <div
          className="absolute top-[45%] right-[8%] opacity-[0.022] transition-transform duration-200 ease-out hidden lg:block"
          style={{ transform: `translate(${mouseOffset.x * -18}px, ${mouseOffset.y * 22}px)` }}
        >
          <svg className="w-14 h-14 stroke-current text-white" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
          </svg>
          <span className="text-[9px] font-mono tracking-widest text-zinc-500 block text-center mt-1 scale-90">SOCIAL_SELLERS</span>
        </div>

        {/* Lower Left */}
        <div
          className="absolute bottom-[20%] left-[12%] opacity-[0.025] transition-transform duration-200 ease-out hidden md:block"
          style={{ transform: `translate(${mouseOffset.x * 22}px, ${mouseOffset.y * 18}px)` }}
        >
          <svg className="w-12 h-12 stroke-current text-white" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
            <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
          </svg>
          <span className="text-[9px] font-mono tracking-widest text-zinc-500 block text-center mt-1 scale-90">NETWORK_DEALS</span>
        </div>

        {/* Lower Right */}
        <div
          className="absolute bottom-[22%] right-[11%] opacity-[0.025] transition-transform duration-200 ease-out hidden md:block"
          style={{ transform: `translate(${mouseOffset.x * -30}px, ${mouseOffset.y * -15}px)` }}
        >
          <svg className="w-14 h-14 stroke-current text-white" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 10c-1.5-3-4.5-5-8-5A6 6 0 0 0 4 17c3.5 0 6.5-2 8-5 1.5 3 4.5 5 8 5a6 6 0 0 0 0-12c-3.5 0-6.5 2-8 5z" />
          </svg>
          <span className="text-[9px] font-mono tracking-widest text-zinc-500 block text-center mt-1 scale-90">ENTERPRISE_SALES</span>
        </div>
      </div>

      <div className="hero-badge inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 hover:border-zinc-700/80 text-[11.5px] font-medium text-zinc-300 mb-8 select-none tracking-wide animate-fade-in relative z-10 pr-4 pl-2.5 shadow-xl shadow-black/40 transition-all duration-300">
        <div className="flex -space-x-1.5 overflow-hidden">
          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80&crop=face" alt="Merchant 1" className="w-[22px] h-[22px] rounded-full border border-black object-cover shrink-0 select-none hover:scale-110 transition-transform duration-200" referrerPolicy="no-referrer" />
          <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80&crop=face" alt="Merchant 2" className="w-[22px] h-[22px] rounded-full border border-black object-cover shrink-0 select-none hover:scale-110 transition-transform duration-200" referrerPolicy="no-referrer" />
          <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80&crop=face" alt="Merchant 3" className="w-[22px] h-[22px] rounded-full border border-black object-cover shrink-0 select-none hover:scale-110 transition-transform duration-200" referrerPolicy="no-referrer" />
          <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80&crop=face" alt="Merchant 4" className="w-[22px] h-[22px] rounded-full border border-black object-cover shrink-0 select-none hover:scale-110 transition-transform duration-200" referrerPolicy="no-referrer" />
        </div>
        <div className="h-3.5 w-[1px] bg-zinc-800" />
        <span className="flex items-center gap-1.5 font-sans font-medium text-zinc-300">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse inline-block" />
          Used by <strong className="text-white font-extrabold">2,400+ businesses</strong> across the world
        </span>
        <div className="h-3.5 w-[1px] bg-zinc-800 hidden sm:block" />
        <span className="text-[9px] text-emerald-400 font-bold font-mono tracking-wider items-center gap-0.5 uppercase hidden sm:flex">
          LIVE VERIFIED
        </span>
      </div>

      <h1 className="hero-headline text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-white leading-[1.1] max-w-3xl text-center animate-fade-in relative z-10">
        Create secure payment links.<br />
        <span className="text-emerald-500 tracking-tight">Get paid safely.</span><br />
        Deliver with confidence.
      </h1>

      <p className="hero-subhead mt-7 text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed text-center animate-fade-in relative z-10">
        Turn any sale into a trusted transaction. Whether you sell on social media, from your shop, or through referrals, Trova protects both sides of every deal.
      </p>

      {/* Hero CTAs */}
      <div className="hero-ctas mt-10 flex flex-col sm:flex-row items-stretch justify-center gap-4 w-full max-w-lg animate-fade-in relative z-10">
        <button
          type="button"
          onClick={() => handleGetStarted("vendor")}
          className="flex-1 px-6 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 hover:scale-[1.01]"
        >
          <span>Start Earning Free</span>
          <ArrowRight className="w-4 h-4 text-black" />
        </button>

        <button
          type="button"
          onClick={() => {
            const element = document.getElementById("how-it-works");
            if (element) {
              element.scrollIntoView({ behavior: "smooth" });
            }
          }}
          className="flex-1 px-6 py-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-100 text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2 hover:bg-zinc-900"
        >
          <span>I'm a Buyer, Show Me How</span>
          <ChevronRight className="w-4 h-4 text-zinc-500 animate-pulse" />
        </button>
      </div>

      {/* Live dynamic stats bar */}
      <div className="hero-subhead mt-8 flex items-center gap-2 text-[11px] text-zinc-500 font-medium select-none bg-zinc-950/60 p-2.5 px-4 rounded-full border border-zinc-900 animate-fade-in relative z-10 font-sans">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
   
        <span className="text-zinc-400 font-bold tracking-tight">Instant Settlements Worldwide Active</span>
      </div>

      {/* Floating Animated Dashboard Layout */}
      <div
        ref={dashboardRef}
        style={{
          transform: `perspective(1000px) rotateX(${scrollTransform.rotateX}deg) scale(${scrollTransform.scale}) translateY(${scrollTransform.translateY}px)`,
          opacity: scrollTransform.opacity,
          transition: "transform 0.12s ease-out, opacity 0.12s ease-out",
        }}
        className="hero-dashboard mt-12 w-full max-w-4xl border border-zinc-800 bg-zinc-900/10 rounded-3xl p-1.5 relative shadow-2xl overflow-hidden group select-none hover:border-zinc-700 animate-fade-in z-20"
      >
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        <img
          src="/dashboard_preview.png"
          alt="Trova Escrow Dashboard Snapshot"
          className="w-full h-auto rounded-2xl object-cover border border-zinc-900/80 shadow-2xl"
          referrerPolicy="no-referrer"
        />
      </div>
    </section>
  );
}
