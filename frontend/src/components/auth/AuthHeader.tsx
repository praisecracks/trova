import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface AuthHeaderProps {
  activeTab: 'account' | 'track';
  isRegistering: boolean;
  onTabChange: (tab: 'account' | 'track') => void;
  onToggleMode: () => void;
}

export default function AuthHeader({ activeTab, isRegistering, onTabChange, onToggleMode }: AuthHeaderProps) {
  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-zinc-900/30 bg-black/90 backdrop-blur-xl px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <a href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/15">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-extrabold uppercase tracking-[0.18em] text-white">trova</span>
            <span className="text-[10px] uppercase tracking-[0.36em] text-emerald-400 font-semibold">escrow</span>
          </div>
        </a>

        <div className="hidden lg:flex items-center gap-3">
          <div className="grid grid-cols-2 gap-1 rounded-full bg-zinc-950/80 p-1 border border-zinc-900/60">
            <button
              type="button"
              onClick={() => onTabChange('account')}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] transition-all ${activeTab === 'account' ? 'bg-emerald-500 text-black shadow-[0_0_0_1px_rgba(16,185,129,0.25)]' : 'text-zinc-400 hover:text-white'}`}
            >
              I am a seller
            </button>
            <button
              type="button"
              onClick={() => onTabChange('track')}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] transition-all ${activeTab === 'track' ? 'bg-emerald-500 text-black shadow-[0_0_0_1px_rgba(16,185,129,0.25)]' : 'text-zinc-400 hover:text-white'}`}
            >
              I am a buyer
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleMode}
            className="rounded-full border border-emerald-500/40 bg-zinc-950/90 px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-emerald-400 transition hover:bg-emerald-500/10"
          >
            {isRegistering ? 'Sign in instead' : 'Create account'}
          </button>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => onTabChange('account')}
            className={`rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${activeTab === 'account' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-zinc-800 text-zinc-400 hover:border-emerald-500 hover:text-white'}`}
          >
            Seller
          </button>
          <button
            type="button"
            onClick={() => onTabChange('track')}
            className={`rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${activeTab === 'track' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-zinc-800 text-zinc-400 hover:border-emerald-500 hover:text-white'}`}
          >
            Buyer
          </button>
        </div>
      </div>
    </header>
  );
}
