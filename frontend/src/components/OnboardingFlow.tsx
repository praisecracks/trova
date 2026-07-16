import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle, 
  Store, 
  ShoppingBag,
  AlertCircle
} from 'lucide-react';
import { getCurrentSellerProfile } from '../lib/services/seller';
import { getCurrentProfile } from '../lib/auth';

interface OnboardingFlowProps {
  onComplete: () => void;
  role: 'vendor' | 'buyer';
  onSetRole: (role: 'vendor' | 'buyer') => void;
  userName?: string;
  kycStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
  onKycStatusChange?: (status: 'unverified' | 'pending' | 'verified' | 'rejected') => void;
}

export default function OnboardingFlow({ onComplete, role, onSetRole, userName = 'Chinedu Okafor', kycStatus: propKycStatus, onKycStatusChange }: OnboardingFlowProps) {
  const [step, setStep] = useState<number>(1);
  const [kycStatus, setKycStatus] = useState<'unverified' | 'pending' | 'verified' | 'rejected'>(propKycStatus || 'unverified');

  useEffect(() => {
    const loadKycStatus = async () => {
      try {
        const profile = await getCurrentProfile();
        if (profile?.kyc_status) {
          const status = profile.kyc_status as 'unverified' | 'pending' | 'verified' | 'rejected';
          setKycStatus(status);
          onKycStatusChange?.(status);
        }
      } catch (e) {
        console.warn('Could not load KYC status:', e);
      }
    };
    loadKycStatus();

    const handleKycUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.status) {
        setKycStatus(customEvent.detail.status);
        onKycStatusChange?.(customEvent.detail.status);
      }
    };
    window.addEventListener('trustlink_kyc_status_updated', handleKycUpdate);
    return () => window.removeEventListener('trustlink_kyc_status_updated', handleKycUpdate);
  }, [onKycStatusChange]);

  const handleNextStep = () => {
    if (step < 3) {
      setStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="bg-black text-zinc-100 min-h-screen flex flex-col justify-center items-center px-4 font-sans selection:bg-emerald-500/30 selection:text-emerald-300 w-full">
      
      {/* Container wrapper Card */}
      <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-10 flex flex-col gap-8 relative overflow-hidden">
        
        {/* Progress Stepper indicators */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">Trova Escrow</span>
          </div>

          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step ? 'w-8 bg-emerald-500' : s < step ? 'w-3 bg-emerald-700/60' : 'w-2 bg-zinc-800'
                }`} 
                id={`step-${s}`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: ROLE SELECTION */}
        {step === 1 && (
          <div className="flex flex-col gap-6 animate-fade-in text-left">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-emerald-400 font-bold font-mono">STEP 1 OF 3 - CHOOSE ACCOUNT ROLE</span>
              <h2 className="text-2xl font-bold text-white tracking-tight leading-snug">Welcome, {userName}! How do you want to use Trova today?</h2>
              <p className="text-xs text-zinc-400 mt-1">Select your primary purpose. You can easily switch between selling and buying any time inside the app.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <button
                type="button"
                onClick={() => onSetRole('vendor')}
                className={`p-5 rounded-2xl border text-left flex flex-col gap-3 transition-all cursor-pointer ${
                  role === 'vendor'
                    ? 'bg-emerald-500/5 border-emerald-500/50 text-emerald-400 shadow-lg'
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-350'
                }`}
              >
                <Store className={`w-8 h-8 ${role === 'vendor' ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <div>
                  <h4 className="font-bold text-sm text-white">Business / Seller</h4>
                  <span className="text-[11px] text-zinc-450 mt-1 block">I sell goods or services online, offline, or via social channels and need payment safety.</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onSetRole('buyer')}
                className={`p-5 rounded-2xl border text-left flex flex-col gap-3 transition-all cursor-pointer ${
                  role === 'buyer'
                    ? 'bg-amber-500/5 border-amber-500/50 text-amber-500 shadow-lg'
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-350'
                }`}
              >
                <ShoppingBag className={`w-8 h-8 ${role === 'buyer' ? 'text-amber-500' : 'text-zinc-500'}`} />
                <div>
                  <h4 className="font-bold text-sm text-white">Direct Customer / Buyer</h4>
                  <span className="text-[11px] text-zinc-450 mt-1 block">I purchase items from social pages, offline shops, or online sellers and want payment protection.</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: SIMPLE EXPLANATION CARDS */}
        {step === 2 && (
          <div className="flex flex-col gap-6 animate-fade-in text-left">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-emerald-400 font-bold font-mono">STEP 2 OF 3 - HOW ESCROW PROTECTS YOU</span>
              <h2 className="text-2xl font-black text-white leading-snug font-sans">Simple trade protection for both sides</h2>
              <p className="text-xs text-zinc-400">A neutral, secure process that guarantees safety and transparency.</p>
            </div>

            <div className="flex flex-col gap-3 mt-1 font-sans">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex gap-3.5 items-start">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold font-mono text-xs shrink-0 select-none">
                  1
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-zinc-100">Create safe transaction links</span>
                  <span className="text-[11px] text-zinc-400">Generate a secure payment invoice. Send the link to your client via Instagram DM or WhatsApp.</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex gap-3.5 items-start">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold font-mono text-xs shrink-0 select-none">
                  2
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-zinc-100 font-sans">Funds are held in secure escrow</span>
                  <span className="text-[11px] text-zinc-400">The buyer pays securely online. The funds remain protected by our partner banks until shipment is inspected.</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex gap-3.5 items-start">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-zinc-900 text-emerald-400 flex items-center justify-center font-bold font-mono text-xs shrink-0 select-none">
                  3
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-zinc-100">Instant payout upon verification</span>
                  <span className="text-[11px] text-zinc-400 font-sans">Once the buyer receives and validates the item quality, funds clear to the seller's local bank instantly.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: FINAL CALL TO ACTION */}
        {step === 3 && (
          <div className="flex flex-col gap-6 animate-fade-in text-center py-6 font-sans">
            <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black text-white mt-4 font-sans">All Set! Account Ready</h2>
              <p className="text-xs text-[#a1a1aa] max-w-sm mt-1 leading-normal font-sans">
                You are ready to enter your Trova workspace. Generate secure payment links, buy products, or track sales smoothly.
              </p>
            </div>

            <div className="p-4.5 rounded-xl bg-[#0c0c0e] border border-zinc-800 text-left flex flex-col gap-3 font-sans">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Account Type:</span>
                <span className="text-white font-bold">{role === 'vendor' ? 'Selling Merchant' : 'Direct Product Buyer'}</span>
              </div>
<div className="flex justify-between items-center text-xs">
                 <span className="text-zinc-400">Security Status:</span>
                 <span className={`font-bold px-2 py-0.5 rounded text-[10px] flex items-center gap-1 ${
                   kycStatus === 'verified' 
                     ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' 
                     : kycStatus === 'pending'
                     ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                     : kycStatus === 'rejected'
                     ? 'text-red-400 bg-red-500/10 border border-red-500/20'
                     : 'text-zinc-400 bg-zinc-500/10 border border-zinc-500/20'
                 }`}>
                   {kycStatus === 'verified' ? (
                     <><CheckCircle className="w-3 h-3" /> VERIFIED SECURE</>
                   ) : kycStatus === 'pending' ? (
                     <><AlertCircle className="w-3 h-3" /> PENDING REVIEW</>
                   ) : kycStatus === 'rejected' ? (
                     <><AlertCircle className="w-3 h-3" /> REJECTED</>
                   ) : (
                     <><ShieldCheck className="w-3 h-3" /> UNVERIFIED</>
                   )}
                 </span>
               </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Daily Escrow Limit:</span>
                <span className="text-white font-bold">₦10,000,000 (Standard)</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Action bar */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          <div className="text-xs text-zinc-500">
            {step === 2 && <span>Backed by partner commercial banks</span>}
            {step === 3 && <span>Global ESCROW systems active</span>}
          </div>

          <button
            onClick={handleNextStep}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
          >
            <span>{step === 3 ? 'Go to Dashboard' : 'Proceed forward'}</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </button>
        </div>

      </div>

    </div>
  );
}
