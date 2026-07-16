import React from "react";
import { ArrowRight } from "lucide-react";

interface FinalCtaProps {
  onNavigate: (route: 'landing' | 'login' | 'signup' | 'onboarding' | 'app') => void;
  onSetRole?: (role: 'vendor' | 'buyer') => void;
}

export function FinalCta({ onNavigate, onSetRole }: FinalCtaProps) {
  const handleGetStarted = (role: 'vendor' | 'buyer') => {
    if (onSetRole) onSetRole(role);
    onNavigate('signup');
  };

  return (
    <section className="py-24 relative select-none text-center overflow-hidden border-t border-zinc-900 bg-[#09090b]">
      <style>{`
        @keyframes breathingGlow {
          0%, 100% {
            opacity: 0.6;
            transform: translate(-50%, -50%) scale(0.95);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.05);
          }
        }
        .animate-breathing-glow {
          animation: breathingGlow 4s ease-in-out infinite;
        }
      `}</style>

      {/* Absolutely positioned pulsing/breathing radial gradient element */}
      <div 
        className="absolute top-1/2 left-1/2 w-[700px] h-[400px] pointer-events-none animate-breathing-glow z-0"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.18) 0%, rgba(16,185,129,0) 70%)" }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/[0.02] to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[340px] h-[340px] bg-emerald-500/[0.03] rounded-full blur-[110px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 sm:px-12 flex flex-col items-center relative z-10 gap-7">
        <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight leading-tight">
          Ready to get paid safely?
        </h2>
        
        <p className="text-zinc-400 text-sm sm:text-base max-w-xl leading-relaxed font-normal">
          Join 2,400+ businesses globally and sellers who have eliminated payment anxiety and scale their operations safely.
        </p>

        <button 
          type="button"
          onClick={() => handleGetStarted('vendor')}
          className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl flex items-center gap-2 shadow-xl shadow-emerald-500/15 cursor-pointer hover:scale-102 transition-transform"
        >
          <span>Create Your Free Account</span>
          <ArrowRight className="w-4.5 h-4.5 text-black" />
        </button>

        <p className="text-[10.5px] text-zinc-500 font-medium font-sans">
          No subscription cards required • No bank visits • Live in under 60 seconds
        </p>
      </div>
    </section>
  );
}
