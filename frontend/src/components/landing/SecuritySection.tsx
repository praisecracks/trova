import React from "react";
import { ShieldCheck, CheckCircle2, Lock } from "lucide-react";

interface SecuritySectionProps {
  onNavigate: (route: 'landing' | 'login' | 'signup' | 'onboarding' | 'app') => void;
}

export function SecuritySection({ onNavigate }: SecuritySectionProps) {
  return (
    <section id="security" className="py-24 border-t border-zinc-900 bg-black text-left font-sans">
      <div className="max-w-6xl mx-auto px-6 sm:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        <div className="lg:col-span-7 flex flex-col gap-6 animate-fade-in">
          <span className="w-max px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">
            Regulatory Safeguard Compliance
          </span>
          <h2 className="text-3xl sm:text-4.5xl font-display font-extrabold text-white tracking-tight leading-tight">
            Regulated escrow.<br />SUPPORTING CARDS, LOCAL BANKS & PREFERRED PAYMENT METHODS WORLDWIDE
          </h2>
          <p className="text-xs sm:text-[13px] text-zinc-400 leading-relaxed font-normal">
            Every balance deposited is held inside fully segregated commercial trust vaults. We collaborate with licensed global Trustee financial gateways to protect baseline assets and eliminate counterparty transaction risk.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans text-zinc-350 mt-2 font-normal">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
              <span>Global safety compliance processes</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
              <span>Instant disbursements to local bank accounts, cards & preferred methods</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
              <span>Insured courier delivery protections</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
              <span>Neutral dispute mediation services</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 p-7 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.01] rounded-full blur-xl" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Secure Escrow Real-Time Calculator</span>
          
          <div className="flex flex-col gap-4 font-normal">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">Available Merchant Balances</span>
              <span className="font-mono text-white font-bold">₦450,050</span>
            </div>
            <div className="flex justify-between items-center text-xs text-emerald-400 font-semibold">
              <span>Safe Funds Held in Escrow</span>
              <span className="font-mono font-bold">+ ₦120,000</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span>Active Customer Disputes</span>
              <span className="font-mono text-zinc-500 font-bold">0 Disputes (Zero)</span>
            </div>

            <hr className="w-full border-zinc-900" />

            <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-900 flex gap-2.5 items-start text-[10.5px] leading-relaxed text-zinc-400">
              <Lock className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                Every merchant balance is assigned an automated, interest-free client trade vault safeguarding buyer deposits securely.
              </span>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => onNavigate('signup')}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold cursor-pointer transition-colors shadow-lg shadow-emerald-500/5 select-none"
          >
            Get Started with Trova
          </button>
        </div>

      </div>
    </section>
  );
}
