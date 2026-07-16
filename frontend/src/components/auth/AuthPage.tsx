/**
 * AuthPage.tsx
 * Parent container for transaction tracking and user authentication.
 * Manages segment selectors ('I am a Seller' vs 'I am a Buyer') and coordinates
 * sub-forms (SignIn, SignUp) and helpers.
 * Props:
 *  - onLoginSuccess: (details: { name: string; email: string }) => void - Callback on success.
 * Used by: App.tsx
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Info,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { motion } from 'motion/react';
import { EscrowLink } from '../../types';
import { getPublicTransaction } from '../../lib/services/transactions';
import { supabase } from '../../lib/supabaseClient';

// Import split subcomponents
import AuthLayout from './AuthLayout';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';

interface AuthPageProps {
  onLoginSuccess: (details: {
    id?: string;
    name: string;
    email: string;
    role?: 'seller' | 'buyer' | 'admin';
    kycStatus?: string;
    currency_code?: 'NGN' | 'USD';
    currency_symbol?: '₦' | '$';
  }) => void;
  initialMode?: 'login' | 'signup';
  onNavigate?: (path: string) => void;
  referrerHandle?: string;
}

// Supabase auth is active. Remaining payment, email, OAuth, and MFA flows still need backend integration.
export default function AuthPage({ onLoginSuccess, initialMode, onNavigate, referrerHandle }: AuthPageProps) {
  const [isRegistering, setIsRegistering] = useState<boolean>(() => {
    if (initialMode) {
      return initialMode === 'signup';
    }
    if (typeof window !== 'undefined') {
      const lastChoice = sessionStorage.getItem('trustlink-auth-choice');
      if (lastChoice === 'signup') return true;
      if (lastChoice === 'login') return false;
    }
    return false;
  });

  useEffect(() => {
    if (initialMode) {
      setIsRegistering(initialMode === 'signup');
    }
  }, [initialMode]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('trova_recent_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRecentOrders(parsed);
        }
      }
    } catch (e) {}
  }, []);

  const saveRecentOrder = (order: { id: string; productName?: string; amount?: number; status?: string }) => {
    setRecentOrders(prev => {
      const filtered = prev.filter(item => item.id !== order.id);
      const updated = [order, ...filtered].slice(0, 5);
      try {
        localStorage.setItem('trova_recent_orders', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'account' | 'track'>('account');
  const [searchId, setSearchId] = useState('');
  const [searchError, setSearchError] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [recentOrders, setRecentOrders] = useState<Array<{ id: string; productName?: string; amount?: number; status?: string }>>([]);

  // Buyer ESCROW Link Tracking State
  const [trackedEscrow, setTrackedEscrow] = useState<EscrowLink | null>(null);

  // Read theme (ignored for Auth page as it must stay dark per user design instructions)
  const isLight = false;

  const suggestions: string[] = [];

  const handleTrackSearch = async (idToSearch: string) => {
    const cleanId = idToSearch.trim().toUpperCase();
    if (!cleanId) return;

    let foundLink: EscrowLink | null = null;

    // 1. Check direct key equal to reference
    const directSaved = localStorage.getItem(cleanId);
    if (directSaved) {
      try {
        const parsed = JSON.parse(directSaved) as EscrowLink;
        if (parsed && typeof parsed === 'object' && parsed.productName) {
          foundLink = parsed;
        }
      } catch (e) {}
    }

    // 2. Check within the trustlink_escrow_links list in localStorage
    if (!foundLink) {
      try {
        const listStr = localStorage.getItem('trustlink_escrow_links');
        if (listStr) {
          const list = JSON.parse(listStr) as EscrowLink[];
          const match = list.find(item => item.id.toUpperCase() === cleanId || item.id === cleanId);
          if (match) foundLink = match;
        }
      } catch (e) {}
    }

    // 3. If not found locally, query Supabase directly
    if (!foundLink) {
      try {
        setIsSearching(true);
        setSearchError(false);
        const publicTransaction = await getPublicTransaction(cleanId);
        if (publicTransaction) {
      foundLink = {
        id: (publicTransaction as any).id,
        productName: (publicTransaction as any).product_name,
        amount: Number((publicTransaction as any).amount),
        shippingFee: Number((publicTransaction as any).shipping_fee),
        buyerPhone: (publicTransaction as any).buyer_phone || '',
        buyerEmail: (publicTransaction as any).buyer_email || null,
        buyerName: (publicTransaction as any).buyer_name || null,
        claimedByBuyer: false,
        status: (publicTransaction as any).status,
        createdAt: (publicTransaction as any).created_at,
        created_at: (publicTransaction as any).created_at,
        updatedAt: (publicTransaction as any).updated_at,
        updated_at: (publicTransaction as any).updated_at,
        expiresAt: (publicTransaction as any).expires_at || undefined,
        expires_at: (publicTransaction as any).expires_at || undefined,
        vendorName: (publicTransaction as any).vendor_name || '',
        description: (publicTransaction as any).description,
        transactionType: (publicTransaction as any).transaction_type,
        currencyCode: (publicTransaction as any).currency_code,
        currencySymbol: (publicTransaction as any).currency_symbol
      } as EscrowLink;

      foundLink.sellerId = (publicTransaction as any).seller_id || null;
      foundLink.vendorPhoto = (publicTransaction as any).seller_avatar_url || null;
      foundLink.ratingAverage = (publicTransaction as any).rating_average;
      foundLink.ratingCount = (publicTransaction as any).rating_count;
      foundLink.activeReferrals = (publicTransaction as any).active_referral_count;
      foundLink.sellerKycStatus = (publicTransaction as any).seller_kyc_status;

      if ((publicTransaction as any).seller_business_name) {
        foundLink.vendorName = (publicTransaction as any).seller_business_name;
      } else if ((publicTransaction as any).seller_display_name) {
        foundLink.vendorName = (publicTransaction as any).seller_display_name;
      }
        }
      } catch (e) {
        console.error('Failed to lookup transaction in Supabase:', e);
      } finally {
        setIsSearching(false);
      }
    }

    if (foundLink) {
      setSearchError(false);
      setTrackedEscrow(foundLink);
      saveRecentOrder({
        id: foundLink.id,
        productName: foundLink.productName,
        amount: foundLink.amount,
        status: foundLink.status
      });
      const targetPath = `/track/${foundLink.id}`;
      if (onNavigate) {
        onNavigate(targetPath);
      } else {
        window.history.pushState(null, '', targetPath);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    } else {
      setTrackedEscrow(null);
      setSearchError(true);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'funds_released':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'deposited':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'shipped':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'delivered':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'disputed':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border border-zinc-800';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').toUpperCase();
  };

  return (
    <div className={`min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-[#070708] text-white font-sans transition-colors duration-200 relative overflow-hidden`}>
      
      {/* 1. Left side illustration & workflow narrative panel */}
      <AuthLayout />      {/* 2. Right side interactive login/lookup card */}
      <div className="col-span-1 lg:col-span-6 flex flex-col justify-center items-center p-5 sm:p-8 md:p-12 relative bg-[#070708] overflow-hidden min-h-screen">
        
        {/* Premium subtle background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        {/* Back button to return to the landing page */}
        <button
          onClick={() => {
            if (onNavigate) {
              onNavigate('/');
            } else {
              window.location.href = '/';
            }
          }}
          className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-zinc-400 hover:text-white transition-all duration-200 cursor-pointer text-[11px] font-extrabold uppercase tracking-widest z-30 group bg-zinc-950/40 hover:bg-zinc-900 border border-zinc-900 rounded-xl px-3.5 py-2.5 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </button>

        {/* Soft decorative background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-emerald-500/[0.04] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[250px] h-[250px] bg-teal-500/[0.02] rounded-full blur-[80px] pointer-events-none" />

        {/* Mobile-visible branding block */}
        <div className="flex lg:hidden flex-col items-center text-center gap-1.5 mb-8 select-none">
          <div className="relative group mb-1">
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 opacity-25 blur-sm" />
            <svg viewBox="0 0 48 56" className="w-[32px] h-[38px] shrink-0 relative" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="trovaMarkAuthPageMobile" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor: "#10b981", stopOpacity: 1}}/>
                  <stop offset="100%" style={{stopColor: "#059669", stopOpacity: 1}}/>
                </linearGradient>
              </defs>
              <path d="M4,2 L44,2 L44,38 L24,54 L4,38 Z" fill="url(#trovaMarkAuthPageMobile)"/>
              <polyline points="12,14 24,36 36,14" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="14" x2="36" y2="14" stroke="white" strokeWidth="4" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-xl font-black text-white tracking-tight leading-none lowercase">
            trova<span className="text-emerald-400 font-extrabold uppercase tracking-widest text-[10px] ml-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-sans">Escrow</span>
          </h1>
          <p className="text-[12px] text-zinc-450 mt-2">Safe guarantees for social buyers and sellers.</p>
        </div>

        {/* Core Auth card with premium fade and delay */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          className="w-full px-4 sm:max-w-[480px] lg:max-w-[520px] rounded-[32px] p-6 sm:p-8 relative z-10 bg-[#0c0c0e]/90 backdrop-blur-2xl border border-zinc-800/40 hover:border-emerald-500/10 transition-colors duration-300 shadow-[0_32px_100px_rgba(0,0,0,0.95)]"
        >
        
        {/* Simple Segment selector representing sellers and direct buyers */}
        <div className="grid grid-cols-2 p-1 rounded-2xl mb-5 bg-[#121215] border border-[#1f1f23]">
          <button
            onClick={() => setActiveTab('account')}
            className={`py-2 text-center text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer ${
              activeTab === 'account'
                ? 'bg-[#1c1c21] text-emerald-400 border border-white/[0.04] shadow-md font-extrabold'
                : 'text-zinc-550 hover:text-zinc-350'
            }`}
          >
            I Am a Seller
          </button>
          <button
            onClick={() => setActiveTab('track')}
            className={`py-2 text-center text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer ${
              activeTab === 'track'
                ? 'bg-[#1c1c21] text-emerald-400 border border-white/[0.04] shadow-md font-extrabold'
                : 'text-zinc-550 hover:text-zinc-350'
            }`}
          >
            I Am a Buyer
          </button>
        </div>

        {/* VIEW A: SELLER CREDENTIALS FORMS */}
        {activeTab === 'account' && (
          <div className="animate-fade-in flex flex-col gap-3">
            {isRegistering ? (
                <SignUpForm 
                  onSignUpSuccess={onLoginSuccess} 
                  isLoading={isLoading} 
                  setIsLoading={setIsLoading}
                  referrerHandle={referrerHandle}
                />
              ) : (
                <SignInForm 
                  onSignInSuccess={onLoginSuccess}
                  isLoading={isLoading} 
                  setIsLoading={setIsLoading} 
                />
              )}

            {/* Spacing & Reassurance Trust signal & Switch link below submission form */}
            <div className="mt-4 flex flex-col gap-3 text-center items-center select-none border-t border-zinc-900/50 pt-3.5">
              <p className="text-[10.5px] text-zinc-400 leading-normal max-w-[290px]">
                Free to start. No physical bank delays. Secured digital disbursements instantly.
              </p>

              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-[11.5px] font-medium transition-colors duration-200 cursor-pointer text-zinc-400 hover:text-white"
              >
                {isRegistering ? (
                  <span>
                    Already have an account?{' '}
                    <span className="text-[#10b981] font-bold hover:text-emerald-300 underline underline-offset-4 decoration-emerald-500/20 duration-200 ml-1">
                      Sign In
                    </span>
                  </span>
                ) : (
                  <span>
                    New to Trova Escrow?{' '}
                    <span className="text-[#10b981] font-bold hover:text-emerald-300 underline underline-offset-4 decoration-emerald-500/20 duration-200 ml-1">
                      Create Free Account
                    </span>
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* VIEW B: TRACK BUYER AGREEMENT SEARCH */}
        {activeTab === 'track' && (
          <div className="animate-fade-in flex flex-col gap-4 items-center text-center py-2">
            
            {/* Centered Large Search Icon */}
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-1 shadow-[0_4px_22px_rgba(16,185,129,0.06)]">
              <Search className="w-5 h-5 text-[#10b981]" />
            </div>

            {/* Headings */}
            <div className="flex flex-col gap-1 select-none text-center">
              <h3 className="text-md font-bold text-white tracking-tight animate-fade-in">Find Secure Order</h3>
              <p className="text-[11px] text-zinc-400 leading-normal max-w-[280px] mx-auto">
                Enter the transaction or order code your seller provided to inspect held funds
              </p>
            </div>

            {/* Input for order code with inline error under it */}
            <div className="w-full text-left flex flex-col gap-1.5 mt-1">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-550 group-focus-within:text-emerald-400 transition-colors pointer-events-none" />
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isSearching) {
                      handleTrackSearch(searchId);
                    }
                  }}
                  placeholder="Enter order code, e.g. TL-7890"
                  disabled={isSearching}
                  className="w-full h-10.5 rounded-xl pl-9 pr-4 text-xs transition-all duration-200 outline-none bg-[#121215] border border-[#1f1f23] text-white placeholder:text-zinc-650 focus:border-emerald-500/80 focus:ring-4 focus:ring-emerald-500/10 hover:border-zinc-700/80 font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Inline gentle state-directed error message */}
              {searchError && (
                <motion.div 
                  initial={{ opacity: 0, y: -2 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-red-400 text-[10.5px] font-semibold leading-relaxed block px-0.5"
                >
                  No order found matching this code. Double-check standard format.
                </motion.div>
              )}
            </div>

            {/* Recent orders quick access */}
            {recentOrders.length > 0 && (
              <div className="w-full text-left flex flex-col gap-2 mt-2">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Recent Orders</span>
                <div className="flex flex-col gap-1.5">
                  {recentOrders.map(order => (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => {
                        setSearchId(order.id);
                        handleTrackSearch(order.id);
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#121215] border border-[#1f1f23] hover:border-emerald-500/30 transition-colors text-left"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[11px] font-bold text-white font-mono truncate">{order.id}</span>
                        <span className="text-[10px] text-zinc-400 truncate">
                          {order.productName || 'Escrow Agreement'}
                          {order.amount ? ` • ₦${Number(order.amount).toLocaleString()}` : ''}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider shrink-0 ml-2">
                        {order.status === 'funds_released' ? 'Completed' : order.status === 'disputed' ? 'Disputed' : 'Active'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Full width Emerald Button */}
            <button
              type="button"
              onClick={() => handleTrackSearch(searchId)}
              disabled={isSearching}
              className="w-full h-10.5 rounded-xl bg-[#10b981] hover:bg-emerald-400 text-black text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-500/10 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSearching ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                'Track My Order →'
              )}
            </button>

            {/* Small help description */}
            <p className="text-[10.5px] text-zinc-400 leading-normal max-w-[285px] mt-0.5 select-none">
               Escrow protected. Your seller shares this code after setup.
            </p>

          </div>
        )}

      </motion.div>

      {/* Real-time security state seal (Fintech SaaS premium standard) */}
      <div className="mt-8 flex items-center gap-1.5 px-3 py-1 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-full select-none z-10 animate-pulse duration-3000">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
        </span>
        <span className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest font-mono">
          SECURE CLIENT VAULT • SSL 256-BIT ENCRYPTION
        </span>
      </div>

      </div>

    </div>
  );
}
