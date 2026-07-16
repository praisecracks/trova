/**
 * AuthNavBar.tsx
 * Renders the top navigation bar for the auth screen.
 * Displays the Trova logo on the left and a toggle button on the right.
 * Props:
 *  - mode: "signup" | "signin" - Dictates which routing/toggle label is shown.
 *  - onToggleMode: () => void - Callback executed when toggling between SignUp and SignIn.
 * Used by: AuthPage.tsx
 */

import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

interface AuthNavBarProps {
  mode: 'signup' | 'signin';
  onToggleMode: () => void;
}

export default function AuthNavBar({ mode, onToggleMode }: AuthNavBarProps) {
  const isLight = false;

  return (
    <header className="fixed top-0 inset-x-0 z-40 h-16 flex items-center justify-between px-8 border-b border-zinc-900/40 bg-[#09090b]">
      <div className="w-full flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <svg viewBox="0 0 48 56" className="w-[28px] h-[32px] shrink-0" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="trovaMarkAuthNav" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: "#10b981", stopOpacity: 1}}/>
                <stop offset="100%" style={{stopColor: "#065f46", stopOpacity: 1}}/>
              </linearGradient>
            </defs>
            <path d="M4,2 L44,2 L44,38 L24,54 L4,38 Z" fill="url(#trovaMarkAuthNav)"/>
            <polyline points="12,14 24,36 36,14" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="14" x2="36" y2="14" stroke="white" strokeWidth="4" strokeLinecap="round"/>
          </svg>
          <span className={`font-display font-extrabold text-lg text-white tracking-tight flex items-center gap-0.5 lowercase`}>
            trova<span className="text-emerald-500 font-bold uppercase tracking-wider text-[11px] ml-1">Escrow</span>
          </span>
        </a>

        <div>
          {mode === 'signup' ? (
            <button
              type="button"
              onClick={onToggleMode}
              className="text-[12px] sm:text-[13px] font-semibold text-zinc-500 hover:text-zinc-705 dark:text-zinc-400 dark:hover:text-zinc-200 hover:underline cursor-pointer"
            >
              Already have an account? <span className="font-semibold underline">Sign In</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleMode}
              className="text-[12px] sm:text-[13px] font-semibold text-zinc-900 hover:text-zinc-750 dark:text-white dark:hover:text-zinc-200 hover:underline cursor-pointer"
            >
              New here? <span className="font-semibold underline">Create Free Account</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
