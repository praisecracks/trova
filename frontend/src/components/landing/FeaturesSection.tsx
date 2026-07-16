import React from "react";
import { TrendingUp, Smartphone, Building2 } from "lucide-react";
import { TiltCard } from "../TiltCard";

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-6 sm:px-12 max-w-6xl mx-auto w-full select-none text-left">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <div className="flex flex-col gap-3">
          <span className="text-[11px] text-emerald-400 font-extrabold uppercase tracking-widest font-mono">Run your business confidently</span>
          <h2 className="text-3xl sm:text-4.5xl font-display font-extrabold tracking-tight text-white leading-tight">
            Online, offline, <br />or social channels. <span className="text-emerald-500">Your business.</span>
          </h2>
        </div>
        <p className="text-sm text-zinc-400 max-w-lg leading-relaxed font-normal">
          Trova gives every business, physical product seller, and service provider worldwide a professional payment system with zero barriers. We support physical product sellers as well as freelancers, designers, developers, writers, consultants, and any professional offering a service for payment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Card 1 */}
        <TiltCard className="p-7 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-all duration-300 flex flex-col justify-between gap-6 relative group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.01] rounded-full blur-2xl group-hover:bg-emerald-500/[0.03] transition-colors" />
          <div className="flex flex-col gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="font-display font-bold text-base text-white tracking-tight">Get Paid on Every Order</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-normal">
              Set your price, share your link, and receive funds into secure holding escrow. Eliminate non-payment before delivery anxiety, for you and your buyers.
            </p>
          </div>
          <div className="border-t border-zinc-900 pt-4 mt-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block leading-none">Typical Result</span>
            <span className="text-sm font-bold font-mono text-emerald-400 block mt-1">Avg. vendor earns ₦340,000/month</span>
          </div>
        </TiltCard>

        {/* Card 2 */}
        <TiltCard className="p-7 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-all duration-300 flex flex-col justify-between gap-6 relative group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.01] rounded-full blur-2xl group-hover:bg-emerald-500/[0.03] transition-colors" />
          <div className="flex flex-col gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="font-display font-bold text-base text-white tracking-tight">One Link. Unlimited Buyers.</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-normal">
              Create modular product checkout links for any item you sell. Drop them directly in your Instagram bio, WhatsApp catalog, or broadcast threads.
            </p>
          </div>
          <div className="border-t border-zinc-900 pt-4 mt-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block leading-none">Execution Time</span>
            <span className="text-sm font-bold font-mono text-emerald-400 block mt-1">Links created in under 10 seconds</span>
          </div>
        </TiltCard>

        {/* Card 3 */}
        <TiltCard className="p-7 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-all duration-300 flex flex-col justify-between gap-6 relative group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.01] rounded-full blur-2xl group-hover:bg-emerald-500/[0.03] transition-colors" />
          <div className="flex flex-col gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Building2 className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="font-display font-bold text-base text-white tracking-tight">Your Own Professional Hub</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-normal">
              Monitor and settle all secondary receipts, active logistics, payouts, and customer approvals from one clean dashboard. Scale your store professionally.
            </p>
          </div>
          <div className="border-t border-zinc-900 pt-4 mt-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block leading-none">Receipt Notifications</span>
            <span className="text-sm font-bold font-mono text-emerald-400 block mt-1">Real-time SMS & email pings</span>
          </div>
        </TiltCard>
      </div>
    </section>
  );
}
