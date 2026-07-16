import React, { useEffect } from 'react';

export default function InviteLanding({ onNavigate }: { onNavigate: (path: string) => void }) {
  useEffect(() => {
    const handle = window.location.pathname.split('/invite/')[1] || '';
    if (handle) {
      sessionStorage.setItem('trova_referral_handle', handle);
    }
    setTimeout(() => {
      onNavigate('/signup');
    }, 300);
  }, [onNavigate]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
        <svg viewBox="0 0 48 56" className="w-8 h-10 shrink-0" xmlns="http://www.w3.org/2000/svg">
          <polyline points="12,14 24,36 36,14" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="12" y1="14" x2="36" y2="14" stroke="white" strokeWidth="4" strokeLinecap="round"/>
        </svg>
      </div>
      <h1 className="text-2xl font-black tracking-tight mb-2">You've been invited</h1>
      <p className="text-sm text-zinc-400 mb-6">Redirecting to sign up...</p>
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
