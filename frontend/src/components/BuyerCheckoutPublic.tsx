import React, { useState, useEffect } from 'react';
import ConfirmationModal from './ConfirmationModal';
import { 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  ArrowLeft,
  ShieldAlert,
  Copy,
  Check,
  CreditCard,
  MessageSquare,
  Globe,
  Clock,
  CheckCircle
} from 'lucide-react';
import { EscrowLink } from '../types';
import { getPublicTransaction, updateTransactionStatus } from '../lib/services/transactions';
import { convertAmount, detectCurrencyFromTimezone, getCurrencySymbol } from '../lib/services/currency';
import { createNotification } from '../lib/services/notifications';
import { supabase } from '../lib/supabaseClient';
import VerifiedBadge from './VerifiedBadge';
import SlideToVerify from './SlideToVerify';

interface BuyerCheckoutPublicProps {
  transactionId: string;
  escrowLinks: EscrowLink[];
  onNavigateToLanding: () => void;
  onNavigateToTracking: (id: string) => void;
  onNavigateToPay?: (id: string) => void;
}

export default function BuyerCheckoutPublic({
  transactionId,
  escrowLinks,
  onNavigateToLanding,
  onNavigateToTracking
}: BuyerCheckoutPublicProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer' | 'wallet'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Card input states
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  // Wallet state
  const [walletId, setWalletId] = useState('');

  // Settle Account Copy states
  const [isCopied, setIsCopied] = useState(false);

  // Look up transaction from Supabase first, then localStorage fallback
  const [transaction, setTransaction] = useState<EscrowLink | null>(null);
  const [buyerCurrency, setBuyerCurrency] = useState<string>('USD');
  const [convertedAmount, setConvertedAmount] = useState<number>(0);
  const [convertedShipping, setConvertedShipping] = useState<number>(0);
  const [isConverting, setIsConverting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const getLocalTransactionFallback = (): EscrowLink | null => {
    // 1. Look up directly in localStorage via transactionId key
    const directSaved = localStorage.getItem(transactionId);
    if (directSaved) {
      try {
        const parsed = JSON.parse(directSaved) as EscrowLink;
        if (parsed && typeof parsed === 'object' && parsed.productName) {
          return parsed;
        }
      } catch (e) {}
    }

    // 1b. Check in uppercase
    const directSavedUpper = localStorage.getItem(transactionId.toUpperCase());
    if (directSavedUpper) {
      try {
        const parsed = JSON.parse(directSavedUpper) as EscrowLink;
        if (parsed && typeof parsed === 'object' && parsed.productName) {
          return parsed;
        }
      } catch (e) {}
    }

    // 2. Check key 'trustlink_escrow_links' array in localStorage
    const savedList = localStorage.getItem('trustlink_escrow_links');
    if (savedList) {
      try {
        const list = JSON.parse(savedList) as EscrowLink[];
        const found = list.find(l => l.id.toLowerCase() === transactionId.toLowerCase() || l.id === transactionId);
        if (found) return found;
      } catch (e) {}
    }

    // 3. Check props pass-down
    const matchProp = escrowLinks.find(link => link.id.toLowerCase() === transactionId.toLowerCase());
    if (matchProp) return matchProp;

    return null;
  };

  const isBuyerVerified = (): boolean => {
    try {
      const key = `trustlink_buyer_verified_${transactionId}`;
      const saved = localStorage.getItem(key);
      if (!saved) return false;
      const parsed = JSON.parse(saved);
      const verifiedAt = new Date(parsed.verifiedAt).getTime();
      const now = Date.now();
      return now - verifiedAt < 7 * 24 * 60 * 60 * 1000;
    } catch (e) {
      return false;
    }
  };

  const getBuyerToken = (): string | null => {
    try {
      const key = `trustlink_buyer_verified_${transactionId}`;
      const saved = localStorage.getItem(key);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      return parsed.buyerToken || null;
    } catch (e) {
      return null;
    }
  };

  const saveBuyerVerification = (buyerToken: string) => {
    try {
      const key = `trustlink_buyer_verified_${transactionId}`;
      localStorage.setItem(key, JSON.stringify({ 
        verifiedAt: new Date().toISOString(),
        buyerToken 
      }));
    } catch (e) {}
  };

   const mapPublicTransaction = (publicTransaction: any): EscrowLink => {
     const mappedTransaction = {
        id: publicTransaction.id,
        productName: publicTransaction.product_name,
        amount: Number(publicTransaction.amount),
        shippingFee: Number(publicTransaction.shipping_fee),
        buyerPhone: publicTransaction.buyer_phone || '',
        buyerEmail: publicTransaction.buyer_email || null,
        buyerName: publicTransaction.buyer_name || null,
        claimedByBuyer: publicTransaction.claimedByBuyer,
        status: publicTransaction.status,
        createdAt: publicTransaction.created_at,
        created_at: publicTransaction.created_at,
        updatedAt: publicTransaction.updated_at,
        updated_at: publicTransaction.updated_at,
        expiresAt: publicTransaction.expires_at || undefined,
        expires_at: publicTransaction.expires_at || undefined,
        vendorName: publicTransaction.vendor_name || '',
        description: publicTransaction.description,
        transactionType: publicTransaction.transaction_type,
        currencyCode: publicTransaction.currency_code,
        currencySymbol: publicTransaction.currency_symbol
     } as EscrowLink;

      mappedTransaction.sellerId = publicTransaction.sellerId || publicTransaction.seller_id || null;
      mappedTransaction.vendorPhoto = publicTransaction.seller_avatar_url || null;
      mappedTransaction.ratingAverage = publicTransaction.rating_average;
      mappedTransaction.ratingCount = publicTransaction.rating_count;
      mappedTransaction.activeReferrals = publicTransaction.active_referral_count;
      mappedTransaction.sellerKycStatus = publicTransaction.seller_kyc_status;
      mappedTransaction.sellerProfileId = publicTransaction.seller_profile_id || null;

     if (publicTransaction.seller_business_name) {
       mappedTransaction.vendorName = publicTransaction.seller_business_name;
     } else if (publicTransaction.seller_display_name) {
       mappedTransaction.vendorName = publicTransaction.seller_display_name;
     }

     return mappedTransaction;
   };

  useEffect(() => {
    if (!transactionId) return;
    // Verification is handled in the storefront modal; load transaction directly.
  }, [transactionId]);

  useEffect(() => {
    if (!transactionId) return;

    let mounted = true;
    setIsLoading(true);
    setLoadError(null);
    setTransaction(null);

    getPublicTransaction(transactionId)
      .then((publicTransaction) => {
        if (!mounted) return;
        if (!publicTransaction) {
          throw new Error('Transaction not found');
        }
        setTransaction(mapPublicTransaction(publicTransaction));

        const detectedCurrency = detectCurrencyFromTimezone();
        setBuyerCurrency(detectedCurrency);

        const sourceCurrency = (publicTransaction as any).currencyCode || 'USD';
        const amount = Number((publicTransaction as any).amount || 0);
        const shipping = Number((publicTransaction as any).shippingFee || 0);

        if (sourceCurrency !== detectedCurrency) {
          setIsConverting(true);
          Promise.all([
            convertAmount(amount, sourceCurrency, detectedCurrency),
            convertAmount(shipping, sourceCurrency, detectedCurrency)
          ]).then(([convertedAmt, convertedShip]) => {
            if (mounted) {
              setConvertedAmount(convertedAmt);
              setConvertedShipping(convertedShip);
              setIsConverting(false);
            }
          }).catch(() => {
            if (mounted) {
              setConvertedAmount(amount);
              setConvertedShipping(shipping);
              setIsConverting(false);
            }
          });
        } else {
          setConvertedAmount(amount);
          setConvertedShipping(shipping);
        }
      })
      .catch(() => {
        if (!mounted) return;
        const fallback = getLocalTransactionFallback();
        if (fallback) {
          setTransaction(fallback);
          return;
        }
        setLoadError('This payment link is invalid or has expired');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [transactionId]);

  const displayCurrency = buyerCurrency;
  const displaySymbol = getCurrencySymbol(displayCurrency);
  const displayAmount = convertedAmount;
  const displayShipping = convertedShipping;
  const grossTotal = displayAmount + displayShipping;

  // Handle Card Auto Formatting
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/g, '');
    if (val.length > 16) val = val.substring(0, 16);
    const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/g, '');
    if (val.length > 4) val = val.substring(0, 4);
    if (val.length > 2) {
      val = val.substring(0, 2) + '/' + val.substring(2);
    }
    setExpiry(val);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '').substring(0, 3);
    setCvv(val);
  };

  const handleCopyAccount = () => {
    navigator.clipboard?.writeText('9022634892').then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const triggerPaymentSuccess = async (method: string) => {
    if (!transaction) return;
    setIsProcessing(true);
    
    const updatedTrans: EscrowLink = {
      ...transaction,
      status: 'deposited'
    };

    localStorage.setItem(transaction.id, JSON.stringify(updatedTrans));
    localStorage.setItem(transaction.id.toUpperCase(), JSON.stringify(updatedTrans));

    try {
      const savedList = localStorage.getItem('trustlink_escrow_links');
      if (savedList) {
        const list = JSON.parse(savedList) as EscrowLink[];
        const updatedList = list.map(item => {
          if (item.id.toLowerCase() === transaction.id.toLowerCase() || item.id === transaction.id) {
            return updatedTrans;
          }
          return item;
        });
        localStorage.setItem('trustlink_escrow_links', JSON.stringify(updatedList));
      }
    } catch (e) {}

    const buyerToken = getBuyerToken();
    const result = await updateTransactionStatus(transaction.id, 'deposited', 'buyer', undefined, buyerToken);
    if (!result.success) {
      console.error('Failed to update transaction status:', result.error);
      setIsProcessing(false);
      setLoadError(result.error || 'Payment failed. Please try again.');
      return;
    }
    setTransaction({ ...transaction, status: 'deposited' });
    
    const sellerProfileId = (transaction as any).sellerProfileId || (transaction as any).seller_profile_id;
    if (sellerProfileId) {
      createNotification(sellerProfileId, `Payment confirmed for order ${transaction.id}. ${displaySymbol}${grossTotal.toLocaleString()} deposited for "${transaction.productName}". Funds are now secured in escrow.`);
    }
    
    setTimeout(() => {
      setIsProcessing(false);
      setIsCompleted(true);
      
      try {
        const currentNotifications = JSON.parse(localStorage.getItem('trustlink_notifications') || '[]');
        const newNotification = {
          id: `notif-${Date.now()}`,
          textPayload: `${displaySymbol}${grossTotal.toLocaleString()} escrow deposit secured via ${method} for "${transaction.productName}". Reference key is ${transaction.id}.`,
          loggingTime: new Date().toISOString(),
          read: false
        };
        localStorage.setItem('trustlink_notifications', JSON.stringify([newNotification, ...currentNotifications]));
        window.dispatchEvent(new CustomEvent('trustlink_notifications_update'));
      } catch (e) {}

      setTimeout(() => {
        onNavigateToTracking(transaction.id);
      }, 2000);
    }, 1500);
  };

  const isFormValid = () => {
    if (paymentMethod === 'card') {
      return cardNumber.replace(/\s/g, '').length === 16 && expiry.length === 5 && cvv.length === 3;
    }
    if (paymentMethod === 'wallet') {
      return walletId.trim().length > 2;
    }
    return true;
  };

  // If transaction is still loading
  if (isLoading) {
    return (
      <div className="bg-[#0d0d0f] [.light-theme_&]:bg-zinc-50 text-zinc-100 [.light-theme_&]:text-zinc-900 min-h-screen font-sans flex flex-col justify-center items-center p-6 text-center">
        <div className="max-w-md w-full bg-[#18181b] [.light-theme_&]:bg-white border border-[#27272a] [.light-theme_&]:border-zinc-200 rounded-3xl p-8 flex flex-col items-center gap-5 shadow-2xl">
          <Clock className="w-12 h-12 text-emerald-500 animate-spin" />
          <h2 className="text-lg font-bold text-white">Loading payment link</h2>
          <p className="text-[13px] text-zinc-400">Fetching this escrow agreement from Trova.</p>
        </div>
      </div>
    );
  }

  // If transaction ID does not exist in Supabase or localStorage show clean error state
  if (!transaction && loadError) {
    return (
      <div className="bg-[#0d0d0f] [.light-theme_&]:bg-zinc-50 text-zinc-100 [.light-theme_&]:text-zinc-900 min-h-screen font-sans flex flex-col justify-center items-center p-6 text-center">
        <div className="max-w-md w-full bg-[#18181b] [.light-theme_&]:bg-white border border-[#27272a] [.light-theme_&]:border-zinc-200 rounded-3xl p-8 flex flex-col items-center gap-6 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-red-953/10 [.light-theme_&]:bg-red-500/5 border border-red-500/20 flex items-center justify-center text-red-500 [.light-theme_&]:text-red-650">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold text-white [.light-theme_&]:text-zinc-900 tracking-tight animate-fade-in">
              Payment Link Not Found
            </h2>
            <p className="text-xs text-zinc-400 [.light-theme_&]:text-zinc-500 leading-relaxed text-center">
              {loadError}. Please verify the code or link and try again.
            </p>
          </div>
          <div className="w-full">
            <button
              onClick={onNavigateToLanding}
              className="py-3 px-4 w-full rounded-xl bg-zinc-900 [.light-theme_&]:bg-zinc-100 hover:bg-zinc-850 [.light-theme_&]:hover:bg-zinc-200 text-zinc-300 [.light-theme_&]:text-zinc-700 hover:text-white [.light-theme_&]:hover:text-zinc-950 font-bold text-xs cursor-pointer transition-all border border-zinc-800 [.light-theme_&]:border-zinc-250"
            >
              Return to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="bg-[#0d0d0f] [.light-theme_&]:bg-zinc-50 text-zinc-100 [.light-theme_&]:text-zinc-900 min-h-screen font-sans flex flex-col justify-center items-center p-6 text-center">
        <div className="max-w-md w-full bg-[#18181b] [.light-theme_&]:bg-white border border-[#27272a] [.light-theme_&]:border-zinc-200 rounded-3xl p-8 flex flex-col items-center gap-5 shadow-2xl">
          <Clock className="w-12 h-12 text-emerald-500 animate-spin" />
          <h2 className="text-lg font-bold text-white">Loading payment link</h2>
          <p className="text-[13px] text-zinc-400">Fetching this escrow agreement from Trova.</p>
        </div>
      </div>
    );
  }

  // IMPROVEMENT 1 - Expired/Completed Render Screens
  const isExpired = transaction.status === ('expired' as any);
  const isCompletedReadOnly = 
    transaction.status === ('released and settled' as any) || 
    transaction.status === ('funds_released' as any) || 
    transaction.status === ('released' as any);

  if (isExpired) {
    return (
      <div className="bg-[#0d0d0f] [.light-theme_&]:bg-zinc-50 text-zinc-100 [.light-theme_&]:text-zinc-900 min-h-screen font-sans flex flex-col justify-center items-center p-6 text-center">
        <div className="max-w-md w-full bg-[#18181b] [.light-theme_&]:bg-white border border-[#27272a] [.light-theme_&]:border-zinc-200 rounded-3xl p-8 flex flex-col items-center gap-6 shadow-2xl">
          {/* Logo at the top */}
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={onNavigateToLanding}>
            <svg viewBox="0 0 48 56" className="w-[15px] h-[17px] shrink-0" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="trovaMarkCheckoutExpired" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor: "#10b981", stopOpacity: 1}}/>
                  <stop offset="100%" style={{stopColor: "#065f46", stopOpacity: 1}}/>
                </linearGradient>
              </defs>
              <path d="M4,2 L44,2 L44,38 L24,54 L4,38 Z" fill="url(#trovaMarkCheckoutExpired)"/>
              <polyline points="12,14 24,36 36,14" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="14" x2="36" y2="14" stroke="white" strokeWidth="4" strokeLinecap="round"/>
            </svg>
            <span className="font-extrabold text-xs tracking-tight text-white [.light-theme_&]:text-zinc-900 lowercase">
              trova<span className="text-emerald-500 font-bold uppercase tracking-wider text-[8px] ml-1">Escrow</span>
            </span>
          </div>

          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 [.light-theme_&]:text-amber-600">
            <Clock className="w-7 h-7" />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-bold text-white [.light-theme_&]:text-zinc-900 tracking-tight">
              This Payment Link Has Expired
            </h2>
            <p className="text-xs text-zinc-400 [.light-theme_&]:text-zinc-500 leading-relaxed text-center">
              This link was valid for 72 hours after it was created. The seller can generate a new link from their dashboard.
            </p>
          </div>

          <div className="w-full">
            <button
              onClick={onNavigateToLanding}
              className="py-3 px-4 w-full rounded-xl bg-zinc-900 [.light-theme_&]:bg-zinc-100 hover:bg-zinc-850 [.light-theme_&]:hover:bg-zinc-200 text-zinc-300 [.light-theme_&]:text-zinc-700 hover:text-white [.light-theme_&]:hover:text-zinc-950 font-bold text-xs cursor-pointer transition-all border border-zinc-800 [.light-theme_&]:border-zinc-250"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }  if (isCompletedReadOnly) {
    const formattedDate = transaction.createdAt 
      ? new Date(transaction.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
      : new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

    return (
      <div className="bg-[#0d0d0f] [.light-theme_&]:bg-zinc-50 text-zinc-100 [.light-theme_&]:text-zinc-900 min-h-screen font-sans flex flex-col justify-center items-center p-6 text-center">
        <div className="max-w-md w-full bg-[#18181b] [.light-theme_&]:bg-white border border-[#27272a] [.light-theme_&]:border-zinc-200 rounded-3xl p-8 flex flex-col items-center gap-6 shadow-2xl animate-fade-in">
          {/* Logo at the top */}
          <div className="flex items-center gap-1.5 cursor-pointer mb-2" onClick={onNavigateToLanding}>
            <svg viewBox="0 0 48 56" className="w-[15px] h-[17px] shrink-0" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="trovaMarkCheckoutCompl" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor: "#10b981", stopOpacity: 1}}/>
                  <stop offset="100%" style={{stopColor: "#065f46", stopOpacity: 1}}/>
                </linearGradient>
              </defs>
              <path d="M4,2 L44,2 L44,38 L24,54 L4,38 Z" fill="url(#trovaMarkCheckoutCompl)"/>
              <polyline points="12,14 24,36 36,14" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="14" x2="36" y2="14" stroke="white" strokeWidth="4" strokeLinecap="round"/>
            </svg>
            <span className="font-extrabold text-xs tracking-tight text-white [.light-theme_&]:text-zinc-900 lowercase">
              trova<span className="text-emerald-500 font-bold uppercase tracking-wider text-[8px] ml-1">Escrow</span>
            </span>
          </div>

          <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 [.light-theme_&]:text-emerald-600">
            <CheckCircle className="w-7 h-7" />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-bold text-white [.light-theme_&]:text-zinc-900 tracking-tight">
              Transaction Completed
            </h2>
            <p className="text-xs text-zinc-400 [.light-theme_&]:text-zinc-500 leading-relaxed text-center">
              This escrow transaction was successfully completed. Funds have been released to the seller.
            </p>
          </div>

          {/* Clean Summary Container */}
          <div className="w-full bg-zinc-900/40 [.light-theme_&]:bg-zinc-50 border border-zinc-800/60 [.light-theme_&]:border-zinc-200 p-4 rounded-xl text-left text-xs gap-3 flex flex-col font-sans">
            <div className="flex justify-between border-b border-zinc-800/40 [.light-theme_&]:border-zinc-200/60 pb-2">
              <span className="text-zinc-500">Product Name:</span>
              <span className="text-zinc-200 [.light-theme_&]:text-zinc-800 font-medium truncate max-w-[200px]">{transaction.productName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Completion Date:</span>
              <span className="text-zinc-200 [.light-theme_&]:text-zinc-800 font-medium">{formattedDate}</span>
            </div>
          </div>

          <div className="w-full">
            <button
              onClick={onNavigateToLanding}
              className="py-3 px-4 w-full rounded-xl bg-zinc-900 [.light-theme_&]:bg-zinc-100 hover:bg-zinc-850 [.light-theme_&]:hover:bg-zinc-200 text-zinc-300 [.light-theme_&]:text-zinc-700 hover:text-white [.light-theme_&]:hover:text-zinc-950 font-bold text-xs cursor-pointer transition-all border border-zinc-800 [.light-theme_&]:border-zinc-250"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0d0d0f] [.light-theme_&]:bg-zinc-50 text-zinc-150 [.light-theme_&]:text-zinc-900 min-h-screen font-sans flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* Top Navigation Bar */}
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-8 pt-4 sm:pt-6">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white [.light-theme_&]:hover:text-zinc-900 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Store</span>
        </button>
      </div>

      {/* Centered clean canvas layout */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 flex flex-col gap-6 justify-center">
        
        {isCompleted ? (
          /* Payment success screen inside identical premium structure */
          <div className="max-w-lg mx-auto w-full bg-[#18181b] [.light-theme_&]:bg-white border border-emerald-500/20 [.light-theme_&]:border-zinc-200 rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center gap-6 animate-fade-in shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Check className="w-8 h-8 animate-pulse" />
            </div>

            <div className="flex flex-col gap-2 animate-fade-in">
              <h1 className="text-lg font-bold text-white [.light-theme_&]:text-zinc-900 uppercase tracking-wider">
                Hold Deposit Secured!
              </h1>
              <p className="text-xs text-zinc-400 [.light-theme_&]:text-zinc-500 leading-relaxed max-w-md">
                 {displaySymbol}{grossTotal.toLocaleString()} is locked in the Trova escrow safety vault. Redirecting you to the active tracking sheet in 2 seconds...
              </p>
            </div>

            {/* Receipt details */}
            <div className="w-full bg-zinc-900 [.light-theme_&]:bg-zinc-50 border border-zinc-800 [.light-theme_&]:border-zinc-200 p-4 rounded-xl text-left text-xs gap-2.5 flex flex-col font-mono">
              <div className="flex justify-between border-b border-zinc-800 [.light-theme_&]:border-zinc-200 pb-2">
                <span className="text-zinc-500">Agreement Code:</span>
                <span className="text-emerald-400 [.light-theme_&]:text-emerald-600 font-bold">{transaction.id}</span>
              </div>
                <div className="flex justify-between items-center animate-fade-in">
                 <span className="text-zinc-500">Merchant Seller:</span>
                  <div className="flex items-center gap-1.5 text-zinc-200 [.light-theme_&]:text-zinc-900">
                   {transaction.vendorPhoto && (
                     <img src={transaction.vendorPhoto} alt="" className="w-3.5 h-3.5 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                   )}
                     <span>{transaction.vendorName || "Seller"}</span>
                     <VerifiedBadge size="xs" isKycVerified={transaction.sellerKycStatus === 'verified'} type="kyc" />
                     {transaction.sellerKycStatus === 'verified' && (
                       <span className="text-[10px] text-emerald-400 font-bold">Verified</span>
                     )}
                     {transaction.ratingCount > 0 && (
                      <span className="text-[10px] text-amber-400 font-bold ml-1">
                        ★ {transaction.ratingAverage} · {transaction.ratingCount}
                      </span>
                    )}
                  </div>
               </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Item Name:</span>
                <span className="text-zinc-350 [.light-theme_&]:text-zinc-800 truncate max-w-[200px]">{transaction.productName}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-800 [.light-theme_&]:border-zinc-200 pt-2 font-bold text-sm">
                <span className="text-zinc-400 [.light-theme_&]:text-zinc-650">Secure Hold Balance:</span>
                <span className="text-emerald-400 [.light-theme_&]:text-emerald-600 font-extrabold">{displaySymbol}{grossTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="w-full">
              <button
                onClick={() => onNavigateToTracking(transaction.id)}
                className="py-3 px-4 w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <span>Go to Tracking Sheet Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Redesigned 2-panel fintech layout: Left Order Summary, Right Payment */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch text-left animate-fade-in">
            
            {/* LEFT PANEL — ORDER SUMMARY */}
            <div className="md:col-span-5 bg-[#18181b] [.light-theme_&]:bg-white border border-[#27272a] [.light-theme_&]:border-zinc-200 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-sm min-h-[460px]">
              <div className="flex flex-col">
                {/* Logo small & left aligned */}
                <div className="flex items-center gap-1.5 cursor-pointer mb-8 animate-fade-in" onClick={onNavigateToLanding}>
                  <svg viewBox="0 0 48 56" className="w-[15px] h-[17px] shrink-0" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="trovaMarkCheckoutMain" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: "#10b981", stopOpacity: 1}}/>
                        <stop offset="100%" style={{stopColor: "#065f46", stopOpacity: 1}}/>
                      </linearGradient>
                    </defs>
                    <path d="M4,2 L44,2 L44,38 L24,54 L4,38 Z" fill="url(#trovaMarkCheckoutMain)"/>
                    <polyline points="12,14 24,36 36,14" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="14" x2="36" y2="14" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                  </svg>
                  <span className="font-extrabold text-xs tracking-tight text-white [.light-theme_&]:text-zinc-900 lowercase">
                    trova<span className="text-emerald-500 font-bold uppercase tracking-wider text-[8px] ml-1 font-mono">Escrow</span>
                  </span>
                </div>

                {/* Seller Store Name & Emblem */}
                <div className="flex items-center gap-2 mb-[4px]">
                  {transaction.vendorPhoto ? (
                    <div className="w-5 h-5 rounded-full border border-zinc-700 [.light-theme_&]:border-zinc-200 overflow-hidden shrink-0">
                      <img src={transaction.vendorPhoto} alt="Merchant logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-zinc-800 [.light-theme_&]:bg-zinc-100 border border-zinc-700 [.light-theme_&]:border-zinc-200 flex items-center justify-center font-bold text-[9px] text-emerald-400 [.light-theme_&]:text-emerald-600 font-mono shrink-0">
                      {String(transaction.vendorName || "S").charAt(0).toUpperCase()}
                    </div>
                  )}
                    <span className="text-xs font-bold text-zinc-300 [.light-theme_&]:text-zinc-600 uppercase tracking-wider flex items-center gap-1">
                      <span>{transaction.vendorName || "Seller"}</span>
                       <VerifiedBadge size="xs" isKycVerified={transaction.sellerKycStatus === 'verified'} type="kyc" />
                       {transaction.sellerKycStatus === 'verified' && (
                         <span className="text-[10px] text-emerald-400 font-bold">Verified</span>
                       )}
                     </span>
                </div>

                {/* Product Name */}
                <h1 className="text-2xl font-bold text-white [.light-theme_&]:text-zinc-900 tracking-tight mt-1.5 leading-tight">
                  {transaction.productName}
                </h1>

                {/* Product Description */}
                {transaction.description && (
                  <p className="text-xs text-zinc-500 [.light-theme_&]:text-zinc-650 mt-2.5 leading-relaxed italic">
                    "{transaction.description}"
                  </p>
                )}

                {/* Clean Line Separator */}
                <div className="border-t border-zinc-800/80 [.light-theme_&]:border-zinc-200/80 my-6" />

                {/* Price Breakdown rows */}
                <div className="flex flex-col gap-3 text-xs">
                  <div className="flex justify-between items-center text-zinc-400 [.light-theme_&]:text-zinc-555">
                    <span>Item Price</span>
                     <span className="font-mono text-zinc-350 [.light-theme_&]:text-zinc-800">{displaySymbol}{transaction.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-400 [.light-theme_&]:text-zinc-555">
                    <span>Delivery Fee</span>
                    <span className="font-mono text-zinc-350 [.light-theme_&]:text-zinc-800">
                       {transaction.shippingFee > 0 ? `${displaySymbol}${transaction.shippingFee.toLocaleString()}` : 'Free'}
                    </span>
                  </div>
                  
                  <div className="border-t border-zinc-800/80 [.light-theme_&]:border-zinc-200/85 pt-4 mt-1 flex justify-between items-center">
                    <span className="text-xs font-semibold text-zinc-300 [.light-theme_&]:text-zinc-700">Total</span>
                    <span className="text-lg font-extrabold text-emerald-400 [.light-theme_&]:text-emerald-600 font-mono">
                       {displaySymbol}{grossTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Escrow protection badge below the total */}
              <div className="flex items-center gap-2 mt-8 text-[11px] text-zinc-400 [.light-theme_&]:text-zinc-650 bg-zinc-900/35 [.light-theme_&]:bg-zinc-50 border border-zinc-850 [.light-theme_&]:border-zinc-200 p-3 rounded-xl">
                <Lock className="w-3.5 h-3.5 text-emerald-400 [.light-theme_&]:text-emerald-600 shrink-0" />
                <span className="leading-snug">
                  Your payment is protected until you confirm delivery.
                </span>
              </div>
            </div>

            {/* RIGHT PANEL — PAYMENT PANEL */}
            <div className="md:col-span-7 bg-[#18181b] [.light-theme_&]:bg-white border border-[#27272a] [.light-theme_&]:border-zinc-200 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-sm min-h-[460px]">
              <div>
                {/* Large amount and store display */}
                <div className="mb-6">
                  <h2 className="text-3xl font-black text-white [.light-theme_&]:text-zinc-900 tracking-tight font-mono">
                     {displaySymbol}{grossTotal.toLocaleString()}
                  </h2>
                  <p className="text-xs text-zinc-400 [.light-theme_&]:text-zinc-500 mt-1">
                     Paying to <span className="font-semibold text-zinc-300 [.light-theme_&]:text-zinc-850">{transaction.vendorName || "Seller"}</span>
                  </p>
                </div>

                {/* minimal clean tabs */}
                <div className="flex border-b border-zinc-800 [.light-theme_&]:border-zinc-200 mb-6 gap-6">
                  {[
                    { id: 'card' as const, label: 'Card' },
                    { id: 'bank_transfer' as const, label: 'Bank Transfer' },
                    { id: 'wallet' as const, label: 'Pay with Wallet' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setPaymentMethod(tab.id)}
                      className={`pb-2.5 text-xs font-bold uppercase tracking-wider relative cursor-pointer transition-colors ${
                        paymentMethod === tab.id 
                          ? 'text-emerald-400 [.light-theme_&]:text-emerald-600' 
                          : 'text-zinc-500 hover:text-zinc-300 [.light-theme_&]:hover:text-zinc-800'
                      }`}
                    >
                      {tab.label}
                      {paymentMethod === tab.id && (
                        <div className="absolute bottom-0 inset-x-0 h-[2px] bg-emerald-400 [.light-theme_&]:bg-emerald-600 animate-fade-in" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Card payment content */}
                {paymentMethod === 'card' && (
                  <div className="flex flex-col gap-4 animate-fade-in">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase text-zinc-400 [.light-theme_&]:text-zinc-500 tracking-wider">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="4123 4567 8901 2345"
                        maxLength={19}
                        className="w-full bg-zinc-900/60 [.light-theme_&]:bg-white border border-zinc-800 [.light-theme_&]:border-zinc-200 rounded-xl px-4 py-3 text-xs text-white [.light-theme_&]:text-zinc-900 placeholder-zinc-600 [.light-theme_&]:placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition-all font-mono"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase text-zinc-400 [.light-theme_&]:text-zinc-500 tracking-wider">Expiry Date</label>
                        <input
                          type="text"
                          value={expiry}
                          onChange={handleExpiryChange}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-full bg-zinc-900/60 [.light-theme_&]:bg-white border border-zinc-800 [.light-theme_&]:border-zinc-200 rounded-xl px-4 py-3 text-xs text-white [.light-theme_&]:text-zinc-900 placeholder-zinc-600 [.light-theme_&]:placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition-all font-mono"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase text-zinc-400 [.light-theme_&]:text-zinc-500 tracking-wider">CVV</label>
                        <input
                          type="password"
                          value={cvv}
                          onChange={handleCvvChange}
                          placeholder="•••"
                          maxLength={3}
                          className="w-full bg-zinc-900/60 [.light-theme_&]:bg-white border border-zinc-800 [.light-theme_&]:border-zinc-200 rounded-xl px-4 py-3 text-xs text-white [.light-theme_&]:text-zinc-900 placeholder-zinc-600 [.light-theme_&]:placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition-all font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Bank Transfer content */}
                {paymentMethod === 'bank_transfer' && (
                  <div className="flex flex-col gap-4 animate-fade-in">
                    <div className="bg-zinc-900/50 [.light-theme_&]:bg-zinc-50 border border-zinc-805 [.light-theme_&]:border-zinc-200 rounded-xl p-4 flex flex-col gap-3 font-mono text-xs">
                      <div className="flex justify-between items-center border-b border-zinc-800/60 [.light-theme_&]:border-zinc-200/60 pb-2.5">
                        <span className="text-zinc-500">Bank Name</span>
                        <span className="text-zinc-200 [.light-theme_&]:text-zinc-800 font-bold">Wema Escrow Settle Ltd</span>
                      </div>
                      
                      <div className="flex justify-between items-center border-b border-zinc-800/60 [.light-theme_&]:border-zinc-200/60 pb-2.5">
                        <span className="text-zinc-500">Account Number</span>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 [.light-theme_&]:text-emerald-600 font-black text-sm tracking-wide">9022634892</span>
                          <button 
                            type="button"
                            onClick={handleCopyAccount}
                            className="p-1 hover:bg-zinc-800 [.light-theme_&]:hover:bg-zinc-200 rounded text-zinc-400 [.light-theme_&]:text-zinc-500 hover:text-white [.light-theme_&]:hover:text-zinc-900 transition-colors cursor-pointer"
                            title="Copy Account Number"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400 [.light-theme_&]:text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">Account Name</span>
                        <span className="text-zinc-200 [.light-theme_&]:text-zinc-800 uppercase truncate max-w-[185px]">Trova - {transaction.id}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-400 [.light-theme_&]:text-zinc-550 leading-relaxed bg-zinc-900/30 [.light-theme_&]:bg-zinc-50 border border-zinc-850/50 [.light-theme_&]:border-zinc-200 p-3 rounded-lg font-sans">
                      Transfer the exact amount. We will verify your payment and confirm your order shortly.
                    </p>
                  </div>
                )}

                {/* Pay with Wallet content */}
                {paymentMethod === 'wallet' && (
                  <div className="flex flex-col gap-4 animate-fade-in">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase text-zinc-400 [.light-theme_&]:text-zinc-500 tracking-wider">Wallet Address or User ID</label>
                      <input
                        type="text"
                        value={walletId}
                        onChange={(e) => setWalletId(e.target.value)}
                        placeholder="TL-9812-4412"
                        className="w-full bg-zinc-900/60 [.light-theme_&]:bg-white border border-zinc-800 [.light-theme_&]:border-zinc-200 rounded-xl px-4 py-3 text-xs text-white [.light-theme_&]:text-zinc-900 placeholder-zinc-600 [.light-theme_&]:placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition-all font-mono"
                      />
                    </div>
                    <p className="text-[11px] text-zinc-500 [.light-theme_&]:text-zinc-600 py-1 font-sans">
                      Verify your secure digital credential code to clear funds from internal holds.
                    </p>
                  </div>
                )}
              </div>

              {/* Secure full-width action button context */}
              <div className="mt-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5 align-left text-left">
                  <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Drag to Unlock Secure Checkout</label>
                  <SlideToVerify onVerify={setIsVerified} isVerified={isVerified} />
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  disabled={isProcessing || !isFormValid() || !isVerified}
                  className={`w-full py-3.5 rounded-xl text-black text-xs font-black uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:cursor-not-allowed select-none ${
                    isVerified 
                      ? 'bg-emerald-500 hover:bg-emerald-400' 
                      : 'bg-zinc-800 [.light-theme_&]:bg-zinc-100 text-zinc-550 [.light-theme_&]:text-zinc-400 border border-zinc-900 [.light-theme_&]:border-zinc-250 opacity-40'
                  }`}
                >
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>
                     {isProcessing ? "Verifying Transaction..." : `Pay ${displaySymbol}${grossTotal.toLocaleString()} Securely`}
                  </span>
                </button>

                <p className="text-[10.5px] font-mono text-zinc-500 text-center mt-3 select-none">
                  Secured by Trova Escrow.
                </p>
              </div>
            </div>

          </div>
        )}

      </div>
      <ConfirmationModal
        isOpen={isModalOpen}
        type="pay_now"
        onConfirm={() => {
          setIsModalOpen(false);
          triggerPaymentSuccess(paymentMethod === 'card' ? 'Card Secure Pay' : paymentMethod === 'wallet' ? 'Secure Wallet Holding' : 'Virtual Settle Transfer');
        }}
        onCancel={() => setIsModalOpen(false)}
      />

    </div>
  );
}
