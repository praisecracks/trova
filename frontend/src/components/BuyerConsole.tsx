import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  PackageCheck,
  ShieldCheck,
  CreditCard,
  ExternalLink,
  Loader2,
  User,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { signInUser, signUpBuyer, getOrCreateBuyerProfile } from '../lib/auth';
import { getBuyerTransactions } from '../lib/buyers';
import { buildPublicUrl } from '../lib/siteConfig';
import { useToast } from './ToastContext';

interface BuyerConsoleTransaction {
  id: string;
  sellerName?: string | null;
  productName: string;
  amount: number;
  shippingFee: number;
  currencyCode?: string;
  currencySymbol?: '₦' | '$';
  status: string;
  createdAt: string;
  expiresAt?: string | null;
}

export default function BuyerConsole({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { success, error, warn } = useToast();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<BuyerConsoleTransaction[]>([]);
  const [displayName, setDisplayName] = useState('');

  const loadBuyerConsole = async (user?: any) => {
    try {
      const profile = await getOrCreateBuyerProfile(user || null);
      if (profile) {
        setDisplayName(profile.buyer.displayName || profile.profile.display_name || profile.profile.email || 'Buyer');
      }
      const list = await getBuyerTransactions();
      setTransactions(list);
    } catch (err: any) {
      warn(err?.message || 'Unable to load buyer console.');
    }
  };

  useEffect(() => {
    loadBuyerConsole().catch(() => undefined);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim() || password.length < 6) {
      error(mode === 'signup' ? 'Enter a valid email and a password with at least 6 characters.' : 'Enter your email and password.');
      return;
    }

    if (mode === 'signup' && fullName.trim().length < 3) {
      error('Enter your full name to create a buyer account.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        await signUpBuyer(email.trim(), password, fullName.trim());
      }

      const signedIn = await signInUser(email.trim(), password);
      await getOrCreateBuyerProfile(signedIn);
      await loadBuyerConsole(signedIn);
      success(mode === 'signup' ? 'Buyer account created.' : 'Buyer console unlocked.');
    } catch (err: any) {
      error(err?.message || 'Unable to access buyer console.');
    } finally {
      setLoading(false);
    }
  };

  const currencySymbol = (transaction: BuyerConsoleTransaction) => transaction.currencySymbol || '₦';
  const grossTotal = (transaction: BuyerConsoleTransaction) => transaction.amount + (transaction.shippingFee || 0);

  if (transactions.length > 0) {
    return (
      <div className="min-h-screen bg-[#0d0d0f] [.light-theme_&]:bg-zinc-50 text-zinc-100 [.light-theme_&]:text-zinc-900 font-sans">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight">Buyer Console</h1>
                  <p className="text-xs text-zinc-400 [.light-theme_&]:text-zinc-600">Welcome back, {displayName}.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('/')}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
              >
                Back to home
              </button>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 max-w-sm">
              <p className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold">Protected purchases</p>
              <p className="text-3xl font-black font-mono text-emerald-400 mt-1">{transactions.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {transactions.map((transaction) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-zinc-800 [.light-theme_&]:border-zinc-200 bg-[#18181b] [.light-theme_&]:bg-white p-5 shadow-2xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-mono text-emerald-400">{transaction.id}</p>
                    <h2 className="text-lg font-bold mt-2">{transaction.productName}</h2>
                    <p className="text-xs text-zinc-500 mt-1">Seller: {transaction.sellerName || 'Trova Seller'}</p>
                  </div>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 text-[9px] font-black uppercase">
                    {transaction.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="mt-5 rounded-2xl bg-zinc-900/60 [.light-theme_&]:bg-zinc-50 border border-zinc-800/70 [.light-theme_&]:border-zinc-200 p-4">
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Escrow value</span>
                    <span className="font-mono font-black text-white [.light-theme_&]:text-zinc-900">{currencySymbol(transaction)}{grossTotal(transaction).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-400 mt-2">
                    <span>Created</span>
                    <span className="text-zinc-300 [.light-theme_&]:text-zinc-700">{new Date(transaction.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <a
                    href={buildPublicUrl(`/pay/${transaction.id}`)}
                    className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black px-3 py-2.5 text-[11px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Pay
                  </a>
                  <button
                    type="button"
                    onClick={() => onNavigate(`/track/${transaction.id}`)}
                    className="rounded-xl bg-zinc-900 [.light-theme_&]:bg-zinc-100 border border-zinc-800 [.light-theme_&]:border-zinc-200 hover:border-emerald-500/40 text-zinc-200 [.light-theme_&]:text-zinc-900 px-3 py-2.5 text-[11px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <PackageCheck className="w-3.5 h-3.5" />
                    Track
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0f] [.light-theme_&]:bg-zinc-50 text-zinc-100 [.light-theme_&]:text-zinc-900 font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-[32px] border border-zinc-800 [.light-theme_&]:border-zinc-200 bg-[#18181b] [.light-theme_&]:bg-white p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <User className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-black">Buyer Console</h1>
            <p className="text-[11px] text-zinc-500 [.light-theme_&]:text-zinc-600 mt-1">Sign in to view protected purchases.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 p-1 rounded-2xl bg-zinc-900/70 [.light-theme_&]:bg-zinc-100 border border-zinc-800/70 [.light-theme_&]:border-zinc-200 mb-5">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`rounded-xl py-2 text-[11px] font-black uppercase ${mode === 'signin' ? 'bg-zinc-800 [.light-theme_&]:bg-white text-emerald-400' : 'text-zinc-500'}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`rounded-xl py-2 text-[11px] font-black uppercase ${mode === 'signup' ? 'bg-zinc-800 [.light-theme_&]:bg-white text-emerald-400' : 'text-zinc-500'}`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'signup' && (
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                className="w-full h-11 rounded-xl bg-zinc-900/70 [.light-theme_&]:bg-white border border-zinc-800 [.light-theme_&]:border-zinc-200 pl-10 pr-3 text-xs text-white [.light-theme_&]:text-zinc-900 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full h-11 rounded-xl bg-zinc-900/70 [.light-theme_&]:bg-white border border-zinc-800 [.light-theme_&]:border-zinc-200 pl-10 pr-3 text-xs text-white [.light-theme_&]:text-zinc-900 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full h-11 rounded-xl bg-zinc-900/70 [.light-theme_&]:bg-white border border-zinc-800 [.light-theme_&]:border-zinc-200 pl-10 pr-3 text-xs text-white [.light-theme_&]:text-zinc-900 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {mode === 'signup' ? 'Create buyer account' : 'Open console'}
          </button>
        </form>

        <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-zinc-400 [.light-theme_&]:text-zinc-600">
              After claiming a TL order from the pay page, it appears here permanently under your buyer account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
