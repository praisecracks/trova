import React, { useState, useEffect, useRef, useCallback } from 'react';
import VerifiedBadge from './VerifiedBadge';
import ConfirmationModal, { ConfirmationModalType } from './ConfirmationModal';
import { useThemeSync } from '../hooks/useThemeSync';
import { 
  ShieldCheck, 
  CreditCard, 
  Truck, 
  PackageCheck, 
  Briefcase,
  CheckCircle,
  Clock,
  MessageSquare,
  ThumbsUp,
  Send,
  X,
  Lock,
  ThumbsDown,
  Paperclip,
  Shield,
  AlertTriangle,
  Info,
  Scale,
  HelpCircle,
  MessageCircle,
  Star,
  FileText,
  RotateCw
} from 'lucide-react';
import { motion } from 'motion/react';
import { EscrowLink, ChatMessage } from '../types';
import { getPublicTransaction, updateTransactionStatus } from '../lib/services/transactions';
import { getDisputeMessages, sendDisputeMessage, subscribeToDisputeMessages } from '../lib/services/disputes';
import { saveBuyerRating } from '../lib/services/ratings';
import { convertAmount, detectCurrencyFromTimezone, getCurrencySymbol } from '../lib/services/currency';
import { getNotificationsForProfile, markNotificationRead, deleteNotification, type Notification } from '../lib/services/notifications';
import { supabase } from '../lib/supabaseClient';
import PaystackModal from './PaystackModal';
import SupportChatWidget from './SupportChatWidget';

interface BuyerTrackingPublicProps {
  transactionId: string;
  escrowLinks: EscrowLink[];
  onNavigateToLanding: () => void;
}

export default function BuyerTrackingPublic({
  transactionId,
  escrowLinks,
  onNavigateToLanding
}: BuyerTrackingPublicProps) {
  const [feedbackAlert, setFeedbackAlert] = useState<string | null>(null);
  const [typedMessage, setTypedMessage] = useState('');
  const [disputeTimeLeft, setDisputeTimeLeft] = useState(259200); // 72 hours in seconds
  const [activeHelpTopic, setActiveHelpTopic] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Confirmation modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ConfirmationModalType>('confirm_delivery');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const currentTheme = useThemeSync();

  const triggerConfirmModal = (type: ConfirmationModalType, action: () => void) => {
    setModalType(type);
    setPendingAction(() => action);
    setModalOpen(true);
  };

  const handleConfirmAction = () => {
    if (pendingAction) {
      pendingAction();
    }
    setModalOpen(false);
    setPendingAction(null);
  };

  const [disputeMessages, setDisputeMessages] = useState<Array<{ role: 'buyer' | 'seller' | 'admin'; text: string; timestamp: string; fileAttachment?: { name: string; url: string; type: string } }>>([]);

  const [buyerInput, setBuyerInput] = useState('');
  const [buyerCurrency, setBuyerCurrency] = useState<string>('USD');
  const [convertedAmount, setConvertedAmount] = useState<number>(0);
  const [convertedShipping, setConvertedShipping] = useState<number>(0);
  
  // File upload state & ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stagedFile, setStagedFile] = useState<{ name: string; url: string; type: string; size: string } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      alert("File size exceeds 500KB limit for demo platform database storage.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setStagedFile({
        name: file.name,
        url: result,
        type: file.type,
        size: `${Math.round(file.size / 1024)} KB`
      });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const [isPaystackOpen, setIsPaystackOpen] = useState(false);
  const [isTransactionLoading, setIsTransactionLoading] = useState(false);
  const [transactionLoadError, setTransactionLoadError] = useState('');

  // Post-delivery rating state
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [ratingDismissed, setRatingDismissed] = useState(false);
  const [isCheckingRating, setIsCheckingRating] = useState(true);

  // Access revocation: once a completed transaction's receipt has been viewed and the
  // buyer leaves, the public link should no longer expose the receipt on revisits.
  const [completedAccessRevoked, setCompletedAccessRevoked] = useState(false);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const [transaction, setTransaction] = useState<EscrowLink | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<string | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  const getLocalTransactionFallback = (): EscrowLink | null => {
    const directSaved = localStorage.getItem(transactionId);
    if (directSaved) {
      try {
        const parsed = JSON.parse(directSaved) as EscrowLink;
        if (parsed && typeof parsed === 'object' && parsed.productName) return parsed;
      } catch (e) {}
    }

    const directSavedUpper = localStorage.getItem(transactionId.toUpperCase());
    if (directSavedUpper) {
      try {
        const parsed = JSON.parse(directSavedUpper) as EscrowLink;
        if (parsed && typeof parsed === 'object' && parsed.productName) return parsed;
      } catch (e) {}
    }

    const globalSaved = localStorage.getItem('trustlink_escrow_links');
    if (globalSaved) {
      try {
        const parsed = JSON.parse(globalSaved) as EscrowLink[];
        const found = parsed.find(
          l => l.id.toLowerCase() === transactionId.toLowerCase() || l.id === transactionId
        );
        if (found) return found;
      } catch (e) {}
    }

    const matchProp = escrowLinks.find(link => link.id.toLowerCase() === transactionId.toLowerCase());
    if (matchProp) return matchProp;

    return null;
  };

  const mergeWithLocalFallback = (publicTransaction: any): EscrowLink => {
    const local = getLocalTransactionFallback();
    const mapped = mapPublicTransaction(publicTransaction);

    if (local) {
      if (!mapped.amount && local.amount) mapped.amount = local.amount;
      if ((!mapped.shippingFee || mapped.shippingFee === 0) && local.shippingFee) mapped.shippingFee = local.shippingFee;
      if (!mapped.currencyCode && local.currencyCode) mapped.currencyCode = local.currencyCode;
      if (!mapped.currencySymbol && local.currencySymbol) mapped.currencySymbol = local.currencySymbol;
      if (!mapped.vendorName && local.vendorName) mapped.vendorName = local.vendorName;
      if (!mapped.productName && local.productName) mapped.productName = local.productName;
    }

    return mapped;
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

    if (publicTransaction.seller_business_name) {
      mappedTransaction.vendorName = publicTransaction.seller_business_name;
    } else if (publicTransaction.seller_display_name) {
      mappedTransaction.vendorName = publicTransaction.seller_display_name;
    }

    return mappedTransaction;
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadTransaction = useCallback(async (opts?: { isRefresh?: boolean }) => {
    if (!transactionId) return;

    let mounted = true;
    if (opts?.isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsTransactionLoading(true);
      setTransactionLoadError('');
      setTransaction(null);
    }

    getPublicTransaction(transactionId)
      .then((publicTransaction) => {
        if (!mounted) return;
        if (!publicTransaction) {
          throw new Error('Transaction not found');
        }

        setTransaction(mergeWithLocalFallback(publicTransaction));

        const detectedCurrency = detectCurrencyFromTimezone();
        setBuyerCurrency(detectedCurrency);

        const sourceCurrency = (publicTransaction as any).currencyCode || 'USD';
        const amount = Number((publicTransaction as any).amount || 0);
        const shipping = Number((publicTransaction as any).shippingFee || 0);

        if (sourceCurrency !== detectedCurrency) {
          Promise.all([
            convertAmount(amount, sourceCurrency, detectedCurrency),
            convertAmount(shipping, sourceCurrency, detectedCurrency)
          ]).then(([convertedAmt, convertedShip]) => {
            if (mounted) {
              setConvertedAmount(convertedAmt);
              setConvertedShipping(convertedShip);
            }
          }).catch(() => {
            if (mounted) {
              setConvertedAmount(amount);
              setConvertedShipping(shipping);
            }
          });
        } else {
          setConvertedAmount(amount);
          setConvertedShipping(shipping);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('[BuyerTrackingPublic] getPublicTransaction failed:', err);
        if (opts?.isRefresh) return;
        const fallback = getLocalTransactionFallback();
        if (fallback) {
          setTransaction(fallback);
          return;
        }

        setTransactionLoadError('This tracking link is invalid or has expired');
      })
      .finally(() => {
        if (!mounted) return;
        if (opts?.isRefresh) {
          setIsRefreshing(false);
        } else {
          setIsTransactionLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [transactionId]);

  useEffect(() => {
    loadTransaction();
  }, [loadTransaction]);

  // Real-time subscription for transaction status updates
  useEffect(() => {
    if (!transactionId) return;

    const channelName = `buyer-tracking-${transactionId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trova_transactions',
          filter: `id=eq.${transactionId}`
        },
        (payload) => {
          const updated = payload.new as any;
          setRealtimeStatus(updated.status);
          setIsRealtimeConnected(true);
          setTransaction(prev => {
            if (!prev) return prev;
            const next = { ...prev, status: updated.status, updatedAt: updated.updated_at };
            localStorage.setItem(transactionId, JSON.stringify(next));
            localStorage.setItem(transactionId.toUpperCase(), JSON.stringify(next));
            return next;
          });
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Realtime channel error for buyer tracking');
          setIsRealtimeConnected(false);
        } else if (status === 'SUBSCRIBED') {
          setIsRealtimeConnected(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [transactionId]);

  // Check if buyer has already rated this transaction via Supabase
  useEffect(() => {
    if (transaction?.status !== 'funds_released') {
      setIsCheckingRating(false);
      return;
    }

    let cancelled = false;
    setIsCheckingRating(true);

    const checkRating = async () => {
      try {
        const { data, error } = await supabase
          .from('trova_ratings')
          .select('id')
          .eq('transaction_id', transactionId)
          .maybeSingle();

        if (cancelled) return;

        if (!error && data) {
          console.log('[RatingCheck] Existing rating found in Supabase, hiding modal');
          setHasRated(true);
        } else {
          console.log('[RatingCheck] No rating found in Supabase, modal eligible');
          setHasRated(false);
        }
      } catch (e) {
        if (!cancelled) {
          console.error('[RatingCheck] Failed to check rating:', e);
          setHasRated(false);
        }
      } finally {
        if (!cancelled) {
          setIsCheckingRating(false);
        }
      }
    };

    checkRating();

    return () => {
      cancelled = true;
    };
  }, [transaction?.status, transactionId]);

  // Revoke access to the completed receipt once the buyer has already viewed it and left.
  const completedAccessKey = `trova_completed_left_${transactionId}`;
  useEffect(() => {
    if (transaction?.status !== 'funds_released') return;
    try {
      if (localStorage.getItem(completedAccessKey)) {
        setCompletedAccessRevoked(true);
      }
    } catch (e) {
      // ignore storage access errors
    }
  }, [transaction?.status, transactionId, completedAccessKey]);

  const markCompletedLeft = useCallback(() => {
    try {
      localStorage.setItem(completedAccessKey, '1');
    } catch (e) {
      // ignore storage access errors
    }
    setCompletedAccessRevoked(true);
  }, [completedAccessKey]);

  const handleExitToLanding = useCallback(() => {
    markCompletedLeft();
    onNavigateToLanding();
  }, [markCompletedLeft, onNavigateToLanding]);

  // Mark the receipt as left if the tab is closed or navigated away directly.
  useEffect(() => {
    if (transaction?.status !== 'funds_released') return;
    const onHide = () => {
      if (!completedAccessRevoked) markCompletedLeft();
    };
    window.addEventListener('pagehide', onHide);
    return () => window.removeEventListener('pagehide', onHide);
  }, [transaction?.status, completedAccessRevoked, markCompletedLeft]);

   const displaySymbol = transaction?.currencySymbol || getCurrencySymbol(transaction?.currencyCode || 'USD');
   const displayAmount = transaction?.amount || 0;
   const displayShipping = transaction?.shippingFee || 0;
   const grossTotal = displayAmount + displayShipping;

   const isExpired = transaction?.status === 'expired';
   const isCompletedReadOnly = transaction?.status === 'funds_released';

   const showRatingModal = isCompletedReadOnly && !hasRated && !ratingDismissed && !isCheckingRating && !completedAccessRevoked;


  useEffect(() => {
    let timer: any;
    if (transaction?.status === 'disputed') {
      timer = setInterval(() => {
        setDisputeTimeLeft(prev => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [transaction?.status]);

  // Sync chat logs from Supabase in real-time
  useEffect(() => {
    if (transaction?.status !== 'disputed' || !transaction?.id) return;

    let mounted = true;
    let unsubscribe: (() => void) | null = null;

    const loadMessages = async () => {
      const messages = await getDisputeMessages(transaction.id);
      if (mounted) {
        setDisputeMessages(messages.map(msg => ({
          role: msg.senderRole,
          text: msg.messageText,
          timestamp: msg.createdAt,
          fileAttachment: msg.attachmentUrl ? {
            name: 'Attachment',
            url: msg.attachmentUrl,
            type: 'application/octet-stream'
          } : undefined
        })));
      }
    };

    loadMessages();

    unsubscribe = subscribeToDisputeMessages(transaction.id, (newMessage) => {
      if (mounted) {
        setDisputeMessages(prev => [...prev, {
          role: newMessage.senderRole,
          text: newMessage.messageText,
          timestamp: newMessage.createdAt,
          fileAttachment: newMessage.attachmentUrl ? {
            name: 'Attachment',
            url: newMessage.attachmentUrl,
            type: 'application/octet-stream'
          } : undefined
        }]);
      }
    });

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [transaction?.status, transaction?.id]);

  // Scroll to bottom of chat when messages shift
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [disputeMessages]);

  if (isTransactionLoading && !transaction) {
    return (
      <div className="bg-[#000000] text-zinc-150 min-h-screen font-sans flex flex-col justify-center items-center p-6 text-center">
        <div className="max-w-md w-full bg-zinc-950 border border-zinc-900 rounded-3xl p-8 flex flex-col items-center gap-5 shadow-2xl">
          <Clock className="w-12 h-12 text-emerald-500 animate-spin" />
          <h2 className="text-lg font-bold text-white">Loading tracking link</h2>
          <p className="text-[13px] text-zinc-400">Fetching this escrow agreement from Trova.</p>
        </div>
      </div>
    );
  }

  if (transactionLoadError && !transaction) {
    return (
      <div className="bg-[#000000] text-zinc-150 min-h-screen font-sans flex flex-col justify-center items-center p-6 text-center">
        <div className="max-w-md w-full bg-zinc-950 border border-zinc-900 rounded-3xl p-8 flex flex-col items-center gap-5 shadow-2xl">
          <Lock className="w-12 h-12 text-red-400" />
          <h2 className="text-lg font-bold text-white">              This tracking link is invalid or has expired</h2>
          <p className="text-[13px] text-zinc-400 leading-relaxed">{transactionLoadError}</p>
          <button type="button" onClick={onNavigateToLanding} className="py-2.5 px-4 w-full rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs cursor-pointer transition-all border border-zinc-800">
            Return to Homepage
              </button>
              </div>
            </div>
          );
   }


  if (!transaction) {
    return (
      <div className="bg-[#000000] text-zinc-150 min-h-screen font-sans flex flex-col justify-center items-center p-6 text-center">
        <div className="max-w-md w-full bg-zinc-950 border border-zinc-900 rounded-3xl p-8 flex flex-col items-center gap-5 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white flex items-center gap-1.5 font-sans">
            Tracking Code Not Found
          </h2>
          <p className="text-[13px] text-zinc-400 leading-relaxed">
            The tracking code <strong className="text-red-400 font-mono">{transactionId}</strong> does not exist or has expired inside our local database. Please check the code and try again.
          </p>
          <div className="flex flex-col gap-2 w-full mt-2">
            <button
               type="button"
               onClick={onNavigateToLanding}
               className="py-2.5 px-4 w-full rounded-xl bg-zinc-900 hover:bg-zinc-805 text-zinc-305 hover:text-white font-bold text-xs cursor-pointer transition-colors border border-zinc-805"
            >
              Return to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="bg-[#000000] text-[#f4f4f5] min-h-screen font-sans flex flex-col justify-center items-center p-6 text-center">
        <div className="max-w-md w-full bg-[#0a0a0c] border border-zinc-900 rounded-3xl p-8 flex flex-col items-center gap-6 shadow-2xl">
          {/* Logo at the top */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={onNavigateToLanding}>
            <svg viewBox="0 0 48 56" className="w-6 h-7 shrink-0" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="trovaMarkExpired" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: "#10b981", stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: "#059669", stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              <path d="M4,2 L44,2 L44,38 L24,54 L4,38 Z" fill="url(#trovaMarkExpired)" />
              <polyline points="12,14 24,36 36,14" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="12" y1="14" x2="36" y2="14" stroke="white" strokeWidth="4" strokeLinecap="round" />
            </svg>
            <span className="font-extrabold text-[11px] tracking-tight text-white lowercase">
              trova<span className="text-emerald-400 font-bold uppercase tracking-wider text-[8px] ml-1">Escrow</span>
            </span>
          </div>

          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Clock className="w-7 h-7" />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">
              This Payment Link Has Expired
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed text-center">
              This link was valid for 72 hours after it was created. The seller can generate a new link from their dashboard.
            </p>
          </div>

          <div className="w-full">
            <button
              onClick={onNavigateToLanding}
              className="py-3 px-4 w-full rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs cursor-pointer transition-all border border-zinc-800"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isCompletedReadOnly) {
    // Once the buyer has viewed the completed receipt and left, the link no longer
    // exposes the receipt to anyone revisiting it.
    if (completedAccessRevoked) {
      return (
        <div className="bg-[#000000] text-[#f4f4f5] min-h-screen font-sans flex flex-col justify-center items-center p-6 text-center">
          <div className="max-w-md w-full bg-[#0a0a0c] border border-zinc-900 rounded-3xl p-8 flex flex-col items-center gap-6 shadow-2xl">
            <div className="flex items-center gap-2 cursor-pointer" onClick={handleExitToLanding}>
              <svg viewBox="0 0 48 56" className="w-6 h-7 shrink-0" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="trovaMarkRevoked" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: "#10b981", stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: "#059669", stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <path d="M4,2 L44,2 L44,38 L24,54 L4,38 Z" fill="url(#trovaMarkRevoked)" />
                <polyline points="12,14 24,36 36,14" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" y1="14" x2="36" y2="14" stroke="white" strokeWidth="4" strokeLinecap="round" />
              </svg>
              <span className="font-extrabold text-[11px] tracking-tight text-white lowercase">
                trova<span className="text-emerald-400 font-bold uppercase tracking-wider text-[8px] ml-1">Escrow</span>
              </span>
            </div>

            <div className="w-14 h-14 rounded-full bg-zinc-800/60 border border-zinc-700 flex items-center justify-center text-zinc-400">
              <Lock className="w-7 h-7" />
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                This Transaction Is Complete
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed text-center">
                This escrow has been settled and the receipt was already accessed. For your security, the receipt is no longer available on this public link.
              </p>
            </div>

            <div className="w-full">
              <button
                onClick={handleExitToLanding}
                className="py-3 px-4 w-full rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs cursor-pointer transition-all border border-zinc-800"
              >
                Return to Homepage
              </button>
            </div>
          </div>
        </div>
      );
    }

    const formattedDate = transaction.createdAt 
      ? new Date(transaction.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
      : new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    
    const releasedAt = transaction.updatedAt 
      ? new Date(transaction.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'N/A';

    return (
      <div className="bg-[#000000] text-[#f4f4f5] min-h-screen font-sans flex flex-col justify-center items-center p-6 text-center">
        <div className="max-w-lg w-full bg-[#0a0a0c] border border-zinc-900 rounded-3xl p-8 flex flex-col items-center gap-6 shadow-2xl receipt-print-area">
          <style>{`
            @media print {
              @page { margin: 14mm; }
              html, body { background: #ffffff !important; }
              body * { visibility: hidden; }
              .receipt-print-area, .receipt-print-area * { visibility: visible; }
              .receipt-print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; background: #ffffff !important; color: #000000 !important; }
              .receipt-print-area > div { border: none !important; box-shadow: none !important; background: #ffffff !important; color: #000000 !important; }
              .receipt-print-hide { display: none !important; }
              .receipt-print-area * { color: #000000 !important; }
              .receipt-print-area::before {
                content: "TROVA ESCROW • PAID RECEIPT";
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-24deg);
                font-size: 38px;
                font-weight: 800;
                letter-spacing: 2px;
                color: rgba(16, 185, 129, 0.10) !important;
                white-space: nowrap;
                pointer-events: none;
                z-index: 0;
              }
              .receipt-print-area > * { position: relative; z-index: 1; }
            }
          `}</style>
          {/* Logo at the top */}
          <div className="flex items-center gap-2 cursor-pointer mb-2" onClick={onNavigateToLanding}>
            <svg viewBox="0 0 48 56" className="w-7 h-8 shrink-0" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="trovaMarkCompleted" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: "#10b981", stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: "#059669", stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              <path d="M4,2 L44,2 L44,38 L24,54 L4,38 Z" fill="url(#trovaMarkCompleted)" />
              <polyline points="12,14 24,36 36,14" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="12" y1="14" x2="36" y2="14" stroke="white" strokeWidth="4" strokeLinecap="round" />
            </svg>
            <span className="font-extrabold text-[11px] tracking-tight text-white lowercase">
              trova<span className="text-emerald-400 font-bold uppercase tracking-wider text-[8px] ml-1">Escrow</span>
            </span>
          </div>

          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-7 h-7" />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Transaction Completed
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed text-center">
              This escrow transaction was successfully completed. Funds have been released to the seller.
            </p>
          </div>

          {/* Receipt Card */}
          <div className="w-full bg-zinc-950 border border-zinc-900 rounded-xl p-5 text-left text-xs gap-3 flex flex-col font-sans">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-zinc-800">
              <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center font-bold font-mono text-emerald-400 text-xs overflow-hidden">
                {transaction.vendorPhoto ? (
                  <img src={transaction.vendorPhoto} alt="Merchant logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  String(transaction.vendorName || "S").charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-zinc-200 text-[13px]">{transaction.vendorName || "Seller"}</span>
                <span className="text-[10px] text-zinc-500">Merchant</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 text-[13px]">
              <div className="flex justify-between">
                <span className="text-zinc-500">Order Reference:</span>
                <span className="font-mono font-bold text-zinc-300">{transaction.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Item:</span>
                <span className="font-semibold text-zinc-200 truncate max-w-[200px] text-right">{transaction.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Amount Paid:</span>
                <span className="font-mono text-zinc-300">{displaySymbol}{displayAmount.toLocaleString()}</span>
              </div>
              {displayShipping > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Delivery Fee:</span>
                  <span className="font-mono text-zinc-300">{displaySymbol}{displayShipping.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-zinc-900 pt-2.5 font-bold">
                <span className="text-white">Total Released:</span>
                <span className="text-emerald-400 font-mono text-[14px]">{displaySymbol}{grossTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-900 pt-2.5">
                <span className="text-zinc-500">Payment Date:</span>
                <span className="text-zinc-200 font-medium">{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Funds Released:</span>
                <span className="text-zinc-200 font-medium">{releasedAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Status:</span>
                <span className="text-emerald-400 font-bold uppercase tracking-wider text-[11px]">Funds Released</span>
              </div>
            </div>
          </div>

          <div className="w-full flex flex-col gap-2.5 receipt-print-hide">
            <button
              onClick={handleExitToLanding}
              className="py-3 px-4 w-full rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs cursor-pointer transition-all border border-zinc-800"
            >
              Back to Home
            </button>
            <button
              onClick={() => window.print()}
              className="py-3 px-4 w-full rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs cursor-pointer transition-all border border-emerald-500/20"
            >
              Save Receipt
             </button>
             </div>
           </div>

           {showRatingModal && renderRatingModal()}
          </div>
         );
   }


  const getStatusBorderClass = () => {
    switch (transaction.status) {
      case 'delivered':
        return 'border-l-4 border-l-amber-500';
      case 'deposited':
        return 'border-l-4 border-l-emerald-500';
      case 'disputed':
        return 'border-l-4 border-l-red-500';
      default:
        return 'border-l-[#27272a]';
    }
  };

  const getTrackCardStyles = () => {
    const isDisputed = transaction.status === 'disputed';
    const isDelivered = transaction.status === 'delivered';
    const isDeposited = transaction.status === 'deposited';
    
    if (isDisputed) {
      return {
        bg: 'bg-[#1e150a]',
        border: 'border-[#f59e0b]/20',
        labelColor: 'text-[#f59e0b]',
        headingColor: 'text-[#f59e0b]'
      };
    }
    if (isDelivered) {
      return {
        bg: 'bg-[#1a1508]',
        border: 'border-amber-500/20',
        labelColor: 'text-amber-400',
        headingColor: 'text-amber-400'
      };
    }
    if (isDeposited) {
      return {
        bg: 'bg-[#0c1a14]',
        border: 'border-emerald-500/15',
        labelColor: 'text-emerald-400',
        headingColor: 'text-emerald-400'
      };
    }
    return {
      bg: 'bg-black',
      border: 'border-zinc-900',
      labelColor: 'text-emerald-400',
      headingColor: 'text-zinc-200'
    };
  };

  const trackCardStyles = getTrackCardStyles();

  const getPlainLanguageStatus = () => {
    switch (transaction.status) {
      case 'pending_deposit':
        return "Awaiting Your Payment";
      case 'deposited':
        return "Payment Secured — Awaiting Shipment";
      case 'shipped':
        return "Order Shipped";
      case 'delivered':
        return "Delivered — Awaiting Your Confirmation";
      case 'funds_released':
        return "Funds Released to Seller";
      case 'disputed':
        return "Dispute Under Review";
      default:
        return "Status Review";
    }
  };

  const getFriendlyStatusLabel = () => {
    switch (transaction.status) {
      case 'pending_deposit':
        return "Awaiting Your Payment";
      case 'deposited':
        return "Payment Secured — Awaiting Shipment";
      case 'shipped':
        return "Order Shipped";
      case 'delivered':
        return "Delivered — Awaiting Your Confirmation";
      case 'funds_released':
        return "Funds Released to Seller";
      case 'disputed':
        return "Dispute Under Review";
      default:
        return "Order Status Review";
    }
  };

  const updateLocalStatus = (newStatus: EscrowLink['status']) => {
    console.log('[updateLocalStatus] called with:', newStatus, 'current transaction status:', transaction?.status);
    const updated: EscrowLink = {
      ...transaction,
      status: newStatus
    };

    localStorage.setItem(transaction.id, JSON.stringify(updated));
    localStorage.setItem(transaction.id.toUpperCase(), JSON.stringify(updated));

    try {
      const savedList = localStorage.getItem('trustlink_escrow_links');
      if (savedList) {
        const list = JSON.parse(savedList) as EscrowLink[];
        const newList = list.map(item => {
          if (item.id.toLowerCase() === transaction.id.toLowerCase() || item.id === transaction.id) {
            return updated;
          }
          return item;
        });
        localStorage.setItem('trustlink_escrow_links', JSON.stringify(newList));
        localStorage.setItem('trustlink_transactions', JSON.stringify(newList));
      }
    } catch (e) {}

    console.log('[updateLocalStatus] calling setTransaction with status:', newStatus);
    setTransaction(updated);
    console.log('[updateLocalStatus] setTransaction called');
  };

  const handlePaystackDeposit = () => {
    setIsPaystackOpen(true);
  };

  const handlePaymentSuccess = async (method: string) => {
    setIsPaystackOpen(false);
    const buyerToken = getBuyerToken();
    const result = await updateTransactionStatus(transaction.id, 'deposited', 'buyer', undefined, buyerToken);
    if (!result.success) {
      console.error('Deposit failed:', result.error);
      setFeedbackAlert(`Payment could not be confirmed: ${result.error || 'unknown error'}. Please try again.`);
      return;
    }

    updateLocalStatus('deposited');

    // The seller notification is created server-side by the
    // trg_notify_seller_on_transaction_change trigger.

    setFeedbackAlert(`Success! Deposit of ${displaySymbol}${grossTotal.toLocaleString()} secured via ${method}. Your payment is held safely in escrow.`);
  };

  const handleConfirmDelivery = () => {
    updateLocalStatus('delivered');
    const buyerToken = getBuyerToken();
    updateTransactionStatus(transaction.id, 'delivered', 'buyer', undefined, buyerToken).then((result) => {
      if (!result.success) {
        console.error('Supabase status update failed for delivery confirmation: ' + result.error);
      }
    });
    setFeedbackAlert("Shipment marked as received! Please inspect everything. If happy, click Approve below.");

    try {
      const savedNotifications = JSON.parse(localStorage.getItem('trustlink_notifications') || '[]');
      const newNotification = {
        id: `notif-${crypto.randomUUID()}`,
        textPayload: `Buyer has received delivery: Order ${transaction.id} for "${transaction.productName}" arrived at destination.`,
        loggingTime: new Date().toISOString(),
        read: false
      };
      localStorage.setItem('trustlink_notifications', JSON.stringify([newNotification, ...savedNotifications]));
      window.dispatchEvent(new CustomEvent('trustlink_notifications_update'));
    } catch (e) {}
  };

  const handleReportProblem = () => {
    updateLocalStatus('disputed');
    const buyerToken = getBuyerToken();
    updateTransactionStatus(transaction.id, 'disputed', 'buyer', undefined, buyerToken).then((result) => {
      if (!result.success) {
        console.error('Supabase status update failed for dispute raise: ' + result.error);
      }
    });
    setFeedbackAlert("Problem reported. Your payment remains frozen safely inside escrow until resolved.");

    try {
      const savedNotifications = JSON.parse(localStorage.getItem('trustlink_notifications') || '[]');
      const newNotification = {
        id: `notif-${crypto.randomUUID()}`,
        textPayload: `Dispute filed on order ${transaction.id}. Escrow funds are frozen under staff review.`,
        loggingTime: new Date().toISOString(),
        read: false
      };
      localStorage.setItem('trustlink_notifications', JSON.stringify([newNotification, ...savedNotifications]));
      window.dispatchEvent(new CustomEvent('trustlink_notifications_update'));
    } catch (e) {}

    sendDisputeMessage(transaction.id, 'admin', `Support chat opened for order ${transaction.id}.`);
  };

  const handleAuthorizeRelease = () => {
    console.log('[handleAuthorizeRelease] CLICKED - current status:', transaction?.status);
    updateLocalStatus('funds_released');
    const buyerToken = getBuyerToken();
    updateTransactionStatus(transaction.id, 'funds_released', 'buyer', undefined, buyerToken).then((result) => {
      if (!result.success) {
        console.error('Supabase status update failed for release authorization: ' + result.error);
      } else {
        console.log('[handleAuthorizeRelease] Supabase update succeeded');
      }
    });
    setFeedbackAlert("Thank you! Payout released to the merchant successfully.");
    console.log('[handleAuthorizeRelease] feedbackAlert set');
  };

  const handleSkipRating = () => {
    console.log('[Rating] Skipped by user');
    setIsRatingModalOpen(false);
    setRatingDismissed(true);
  };

  const handleSubmitRating = async () => {
    console.log('[Rating] Submitting rating:', rating);
    setIsRatingModalOpen(false);

    try {
      const result = await saveBuyerRating({
        transactionId: transaction.id,
        score: rating,
        comment: reviewText.trim() || undefined,
      });

      if (!result.success) {
        console.error('Failed to save rating to Supabase:', result.error);
      } else {
        console.log('[Rating] Saved to Supabase successfully');
        setHasRated(true);
      }
    } catch (e) {
      console.error("Failed to sync ratings stats", e);
    }
  };

  function renderRatingModal() {
      return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
       <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
        className="border rounded-[20px] p-6 max-w-[420px] w-full relative flex flex-col items-center text-center gap-4 animate-fade-in"
      >
        {/* Bounce Scale Animated Check Mark Badge */}
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0"
        >
          <CheckCircle className="w-8 h-8" />
        </motion.div>

        <div className="flex flex-col gap-1">
          <h3 className="text-base font-bold text-[var(--text-primary)]">Transaction Complete</h3>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            Your order has been successfully completed under Trova escrow protection.
          </p>
        </div>

        <hr className="w-full" style={{ borderColor: 'var(--border)' }} />

        <div className="flex flex-col gap-2.5 w-full items-center">
          <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            How was your experience?
          </h4>

          {/* Five Star Row */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((starIdx) => {
              const currentEffective = hoverRating > 0 ? hoverRating : rating;
              const isFilled = starIdx <= currentEffective;
              return (
                <button
                  key={starIdx}
                  type="button"
                  onMouseEnter={() => setHoverRating(starIdx)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(starIdx)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className="w-7 h-7"
                    style={{
                      color: isFilled ? '#fbbf24' : 'var(--text-dim)',
                      fill: isFilled ? '#fbbf24' : 'transparent',
                    }}
                  />
                </button>
              );
            })}
          </div>

          {/* Star Label */}
          <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
            {rating === 0 && "Tap a star to rate"}
            {rating === 1 && "Poor"}
            {rating === 2 && "Fair"}
            {rating === 3 && "Good"}
            {rating === 4 && "Great experience"}
            {rating === 5 && "Outstanding"}
          </p>
        </div>

        {/* Optional Textarea Comment Section */}
        <div className="w-full flex flex-col items-start gap-1 pb-1 text-left">
          <label className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Add a review (optional)
          </label>
          <textarea
            rows={3}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your experience with this seller."
            className="w-full text-xs p-3 rounded-xl bg-zinc-950 border text-[var(--text-primary)] transition-all focus:outline-none focus:border-emerald-500/50"
            style={{ borderColor: 'var(--border)' }}
          />
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center gap-3 w-full">
          <button
            type="button"
            onClick={handleSkipRating}
            className="flex-1 py-2.5 rounded-xl border font-bold text-xs cursor-pointer transition-all hover:bg-[var(--surface2)]"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={handleSubmitRating}
            disabled={rating === 0}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all text-black bg-emerald-500 hover:bg-emerald-400 ${
              rating === 0 ? 'opacity-40 cursor-not-allowed' : ''
            }`}
          >
            Submit Rating
          </button>
        </div>
      </motion.div>
    </div>
  );
  }

  const formatCountdown = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d : ${h.toString().padStart(2, '0')}h : ${m.toString().padStart(2, '0')}m`;
  };


  const getActiveStepIdx = () => {
    switch (transaction.status) {
      case 'pending_deposit':
        return 0;
      case 'deposited':
        return 1;
      case 'shipped':
        return 2;
      case 'delivered':
        return 3;
      case 'funds_released':
        return 4;
      default:
        return 2;
    }
  };

  const activeStep = getActiveStepIdx();

  return (
    <>
      
      {/* Header Element - Minimal Public Layout, with Help and Support button restored (FIX 1) */}
      <header className="h-16 border-b border-zinc-900 bg-black px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 select-none">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onNavigateToLanding}>
          <svg viewBox="0 0 48 56" className="w-6 h-7 shrink-0" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="trovaMarkTracking" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: "#10b981", stopOpacity: 1}}/>
                <stop offset="100%" style={{stopColor: "#065f46", stopOpacity: 1}}/>
              </linearGradient>
            </defs>
            <path d="M4,2 L44,2 L44,38 L24,54 L4,38 Z" fill="url(#trovaMarkTracking)"/>
            <polyline points="12,14 24,36 36,14" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="14" x2="36" y2="14" stroke="white" strokeWidth="4" strokeLinecap="round"/>
          </svg>
          <span className="font-extrabold text-[13px] tracking-tight text-white lowercase">
            trova<span className="text-emerald-400 font-bold uppercase tracking-wider text-[9px] ml-1">Escrow</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadTransaction({ isRefresh: true })}
            disabled={isRefreshing}
            title="Refresh tracking status"
            aria-label="Refresh tracking status"
            className="text-xs font-semibold text-zinc-400 hover:text-emerald-400 bg-zinc-900 hover:bg-zinc-850 px-3 py-1.5 lg:px-4 rounded-lg border border-zinc-800 hover:border-emerald-500/30 flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Refreshing' : 'Refresh'}</span>
          </button>
          <button
            onClick={() => {
              const el = document.getElementById('buyer-help-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="text-xs font-semibold text-zinc-400 hover:text-emerald-400 bg-zinc-900 hover:bg-zinc-850 px-3 py-1.5 lg:px-4 rounded-lg border border-zinc-800 hover:border-emerald-500/30 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Help & Trova Support</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <section className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 text-left animate-fade-in font-sans">
        
        {/* Trust Bar Banner - Fills confidence */}
        <div className="bg-[#0c1a14] border border-emerald-500/10 border-l-4 border-l-emerald-500 rounded-xl p-4 flex items-center gap-3.5 shadow-md w-full">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <div className="text-left w-full">
            <p className="text-[13px] md:text-[14px] font-bold text-white leading-snug">
              Your payment of <strong className="text-emerald-400 font-extrabold">{displaySymbol}{(grossTotal).toLocaleString()}</strong> is safely held in escrow.
            </p>
            <p className="text-[11px] md:text-xs text-zinc-400 mt-0.5 leading-snug">
              It will only be released when you confirm everything is right. If something is wrong, we will help make it right.
            </p>
          </div>
          {isRealtimeConnected && (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
            </div>
          )}
        </div>

        {/* Upper Invoice Info Widget */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5.5 h-5.5 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-mono font-bold text-zinc-500 uppercase">Your Payment Is Protected</span>
              <h2 className="text-xs md:text-sm font-bold text-white font-mono mt-0.5">Order ID: {transaction.id}</h2>
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end font-mono">
            <span className="text-[11px] text-zinc-500">Total Secured Value</span>
            <span className="text-sm md:text-md font-bold text-emerald-400 mt-0.5">{displaySymbol}{grossTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Dynamic Alerts */}
        {feedbackAlert && (
          <div className="bg-emerald-950/10 border border-emerald-500/20 text-emerald-400 px-4 py-3.5 text-xs font-semibold rounded-xl shadow-lg flex items-center gap-2.5 animate-fade-in w-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="leading-relaxed">{feedbackAlert}</span>
          </div>
        )}

        {/* Responsive Grid System: Stacks on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
          
          {/* Left Area (8 units): Timeline and protections */}
          <div className="lg:col-span-8 flex flex-col gap-6 w-full">
            
            {/* Timeline Milestones box */}
            <div className={`bg-zinc-950 border border-zinc-900 ${getStatusBorderClass()} rounded-[12px] p-5 sm:p-6 flex flex-col gap-6 relative overflow-hidden shadow-xl w-full`}>
              <div className="flex justify-between items-center select-none border-b border-zinc-900 pb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-mono">Order Milestones</span>
                <span className="text-[11.5px] font-mono text-zinc-550 font-bold">Secure Tracker</span>
              </div>

               {/* Steps graphic */}
               <div className="grid grid-cols-4 relative mt-3 mb-3 w-full gap-1">
                 <span className="absolute top-[22px] left-[12%] right-[12%] h-[1.5px] bg-[#1a1a1f] z-0">
                   <span 
                     className="absolute h-full bg-emerald-500 transition-all duration-300"
                     style={{ 
                       width: activeStep <= 1 ? '0%' : 
                              activeStep === 2 ? '33.3%' :
                              activeStep === 3 ? '66.6%' : 
                              activeStep >= 4 ? '100%' : '0%'
                     }}
                   />
                 </span>

                 {/* Stage 1 */}
                 <div className="flex flex-col items-center text-center z-10 select-none">
                   <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                     activeStep >= 1 
                       ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.25)]' 
                       : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                   }`}>
                     {activeStep >= 1 ? (
                       <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                         <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                       </svg>
                     ) : (
                       <CreditCard className="w-4 h-4" />
                     )}
                   </div>
                   <span className="text-[11px] font-sans font-bold text-zinc-200 mt-2 leading-tight">Secured</span>
                 </div>

                 {/* Stage 2 */}
                 <div className="flex flex-col items-center text-center z-10 select-none">
                   <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                     activeStep >= 2 
                       ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.25)]' 
                       : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                   }`}>
                     {transaction.transactionType === 'service' ? (
                       activeStep >= 2 ? <CheckCircle className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />
                     ) : (
                       activeStep >= 2 ? <CheckCircle className="w-4 h-4" /> : <Truck className="w-4 h-4" />
                     )}
                   </div>
                   <span className="text-[11px] font-sans font-bold text-zinc-200 mt-2 leading-tight">
                     {transaction.transactionType === 'service' ? 'WIP' : 'Shipped'}
                   </span>
                 </div>

                 {/* Stage 3 */}
                 <div className="flex flex-col items-center text-center z-10 select-none">
                   <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                     activeStep >= 3 
                       ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.25)]' 
                       : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                   }`}>
                     {transaction.transactionType === 'service' ? (
                       activeStep >= 3 ? <CheckCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />
                     ) : (
                       activeStep >= 3 ? <CheckCircle className="w-4 h-4" /> : <PackageCheck className="w-4 h-4" />
                     )}
                   </div>
                   <span className="text-[11px] font-sans font-bold text-zinc-200 mt-2 leading-tight">
                     {transaction.transactionType === 'service' ? 'Submitted' : 'Arrived'}
                   </span>
                 </div>

                 {/* Stage 4 */}
                 <div className="flex flex-col items-center text-center z-10 select-none">
                   <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                     activeStep >= 4 
                       ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.25)]' 
                       : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                   }`}>
                     {activeStep >= 4 ? (
                       <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                         <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                       </svg>
                     ) : (
                       <ShieldCheck className="w-4 h-4" />
                     )}
                   </div>
                   <span className="text-[11px] font-sans font-bold text-zinc-200 mt-2 leading-tight">Released</span>
                 </div>
               </div>

              {/* Detailed explaining card (FIX 3 - Language adaptation) */}
               <div className={`p-4 border rounded-xl flex gap-3 text-xs leading-relaxed text-left transition-all ${trackCardStyles.bg} ${trackCardStyles.border}`}>
                 <Clock className={`w-4 h-4 shrink-0 mt-0.5 ${trackCardStyles.labelColor}`} />
                 <div className="flex flex-col gap-1 w-full text-left">
                   <h4 className={`font-bold text-[13px] leading-relaxed ${trackCardStyles.headingColor}`}>
                     {transaction.status === 'delivered'
                       ? "Your item has arrived. Please inspect and confirm below."
                       : transaction.status === 'deposited' 
                       ? "Your payment is secured. The funds are safely held and the seller has been notified." 
                       : `Status: ${getFriendlyStatusLabel()}`}
                   </h4>
                  <p className="text-zinc-400 text-[13px] leading-relaxed mt-1">
                    {transaction.status === 'pending_deposit' && "We are waiting to secure your holding deposit inside the trust vault. Please click the \"Lock In Holding Deposit\" button to secure."}
                    {transaction.status === 'deposited' && "Your funds have been deposited securely. The merchant has been notified and is preparing shipping handoff."}
                    {transaction.status === 'shipped' && "Your item is shipped. The merchant has dispatched your package and logistics carrier routing is active."}
                    {transaction.status === 'delivered' && "Your item has been delivered. Open the package, inspect everything carefully, and confirm below when you are satisfied."}
                    {transaction.status === 'funds_released' && "Final release authorized. Hold balance split and settled directly to the seller."}
                    {transaction.status === 'disputed' && "A dispute hold has been filed. Cash is held securely. Support chat below is active for uploading specs."}
                  </p>
                </div>
              </div>

              {/* Responsive Contextual Tip Box - Calm and reassuring */}
               <div className="bg-zinc-950/80 border border-zinc-800/50 rounded-xl p-4 flex items-start gap-3.5 text-left text-zinc-400 text-[13px] w-full">
                 <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                 <div className="flex flex-col gap-0.5 w-full text-[13px]">
                   <p className="text-zinc-300 leading-normal">
                     {transaction.status === 'deposited' && "Your payment is locked in. The seller has been notified and will ship your order soon."}
                     {transaction.status === 'shipped' && "Your item is on its way. You will be notified when it arrives. Inspect carefully before confirming delivery."}
                     {transaction.status === 'disputed' && "We have received your dispute. Our team reviews all cases fairly. Your payment remains frozen until this is resolved."}
                     {transaction.status === 'pending_deposit' && "Your payment is safe. Funds will only be released to the seller after you confirm receipt."}
                     {transaction.status === 'delivered' && "Your item has been delivered. Open the package, inspect everything carefully, and confirm below when you are satisfied."}
                     {transaction.status === 'funds_released' && "Perfect! This transaction has concluded smoothly under escrow protection."}
                   </p>
                 </div>
               </div>

               {/* Action Panels */}
               <div className="bg-zinc-950 border border-zinc-800/50 rounded-2xl p-4.5 sm:p-5.5 flex flex-col gap-3 text-left w-full mt-2 shadow-lg">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-900 pb-2.5 block font-mono">
                  What do you need help with
                </span>

                {/* Lock In Holding Deposit Option */}
                {transaction.status === 'pending_deposit' && (
                  <div className="flex flex-col gap-3.5">
                    <p className="text-[13px] text-zinc-305 leading-relaxed font-sans mt-0.5">
                       Authorize secure deposit of <strong>{displaySymbol}{grossTotal.toLocaleString()}</strong>. Funds remain safe under holding escrow and cannot be released until products arrive.
                    </p>
                    <button
                      onClick={handlePaystackDeposit}
                      className="w-full sm:w-auto py-3 px-6 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all uppercase tracking-wider"
                    >
                      <CreditCard className="w-4 h-4 text-black" />
                      <span>Lock In Holding Deposit</span>
                    </button>
                  </div>
                )}

                {/* Secured Holding Box */}
                {transaction.status === 'deposited' && (
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl leading-relaxed text-[13px] text-zinc-400 flex flex-col gap-2">
                    <div className="flex items-start gap-2">
                      <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p>Your payment is currently <strong className="text-emerald-400 font-bold uppercase tracking-wider">Payment Secured</strong> in holding vaults. The seller is preparing shipment.</p>
                        <p className="text-zinc-550 text-[11px] mt-1">The seller cannot access funds until you verify and authorize release.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Shipped / Transit Actions */}
                {transaction.status === 'shipped' && (
                  <div className="flex flex-col gap-4">
                    <p className="text-[13px] text-zinc-350 leading-relaxed">
                      Your order is shipped! Once courier arrives, verify the item, then select action below.
                    </p>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
                      <button
                        onClick={() => triggerConfirmModal('confirm_delivery', handleConfirmDelivery)}
                        className="w-full sm:w-auto py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow"
                      >
                        <ThumbsUp className="w-4 h-4 text-black shrink-0" />
                        <span>Confirm Delivery Arrived</span>
                      </button>
                      <button
                        onClick={() => triggerConfirmModal('raise_dispute', handleReportProblem)}
                        className="w-full sm:w-auto py-3 px-4 rounded-xl bg-transparent hover:bg-red-500/10 border border-red-500/30 text-red-505 pointer transition-all flex items-center justify-center gap-1.5"
                      >
                        <ThumbsDown className="w-4 h-4 text-red-500 shrink-0" />
                        <span>Report a Problem / Dispute</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Delivered Actions */}
                {transaction.status === 'delivered' && (
                  <div className="flex flex-col gap-4">
                    <p className="text-[13px] text-zinc-350 leading-relaxed">
                      Delivery logged. Please unbox and verify correct size. Satisfied? Authorize final payment release.
                    </p>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
                      <button
                        onClick={() => triggerConfirmModal('confirm_delivery', handleAuthorizeRelease)}
                        className="w-full sm:w-auto py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <ThumbsUp className="w-4 h-4 text-black shrink-0" />
                        <span>Approve & Release Funds</span>
                      </button>
                      <button
                        onClick={() => triggerConfirmModal('raise_dispute', handleReportProblem)}
                        className="w-full sm:w-auto py-3 px-4 rounded-xl bg-transparent hover:bg-red-500/10 border border-red-500/30 text-red-500 font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
                      >
                        <ThumbsDown className="w-4 h-4 text-red-500 shrink-0" />
                        <span>Open Dispute / Hold</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Closed Finished state */}
                {transaction.status === 'funds_released' && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 rounded-xl text-[13px] font-sans flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Transaction complete! Held escrow funds have been safely disburse settled to the merchant. Thank you for choosing Trova.</span>
                  </div>
                )}

                {/* Raised Dispute state */}
                {transaction.status === 'disputed' && (
                  <div className="flex flex-col gap-4">
                    <div className="p-4 bg-red-950/10 border border-red-500/20 rounded-xl leading-relaxed text-[13px] text-zinc-400 flex flex-col gap-2">
                      <p className="text-red-400 font-bold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        There is an active dispute on this order.
                      </p>
                      <p className="text-[13px]">
                        Payments for this order are paused while we review the dispute. Use the chat below to share photos or explain the issue. Our team will review and help resolve this fairly.
                      </p>
                    </div>
                    <div>
                      <button
                        onClick={handleAuthorizeRelease}
                        className="w-full sm:w-auto py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs cursor-pointer flex items-center justify-center gap-2"
                      >
                        <ThumbsUp className="w-4 h-4 text-black shrink-0" />
                        <span>Approve Mutual Resolution (Pay Merchant)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Area (4 units): Countdown or Summary */}
          <div className="lg:col-span-4 flex flex-col gap-6 w-full text-left">
            
            {/* Resolution Countdown Timer Card if Disputed - Helpful and reassuring (styled calmly) */}
            {transaction.status === 'disputed' && (
              <div className="bg-zinc-950 border border-zinc-900 rounded-[12px] p-5 flex flex-col gap-3 text-left shadow-xl w-full">
                <div className="flex items-center gap-1.5 text-amber-500 font-sans font-bold">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Mediator Review Timeline</span>
                </div>
                <span className="text-2xl font-black text-white font-mono mt-1 tracking-wider leading-none">{formatCountdown(disputeTimeLeft)}</span>
                <p className="text-zinc-400 text-[13px] leading-relaxed mt-1">
                  Our team is actively reviewing your concerns and will guide both parties toward a fair resolution. Estimating remaining review time.
                </p>
              </div>
            )}

            {/* Invoice Summary Card */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-[12px] p-5 sm:p-6 flex flex-col gap-4 text-[13px] shadow-xl w-full">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Invoice Summary</span>

               <div className="p-3.5 bg-black border border-zinc-900 rounded-xl flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center font-bold font-mono text-emerald-400 text-xs overflow-hidden">
                   {transaction.vendorPhoto ? (
                     <img src={transaction.vendorPhoto} alt="Merchant logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                   ) : (
                     String(transaction.vendorName || "S").charAt(0).toUpperCase()
                   )}
                 </div>
                 <div className="flex flex-col text-left">
                    <span className="font-bold text-zinc-200 text-[13.5px]">{transaction.vendorName || "Seller"}</span>
                   <div className="flex items-center gap-1 mt-0.5">
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
               </div>

              <div className="flex flex-col gap-2.5 border-t border-zinc-900 pt-3 text-[13px]">
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-zinc-500">Order Reference:</span>
                  <span className="font-mono font-bold text-zinc-300">{transaction.id}</span>
                </div>
                <div className="flex justify-between items-center mt-0.5 text-[13px]">
                  <span className="text-zinc-400">Item Name:</span>
                  <span className="font-semibold text-zinc-200 truncate max-w-[140px] text-right">{transaction.productName}</span>
                </div>
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-zinc-400">Price:</span>
                   <span className="font-mono text-zinc-300">{displaySymbol}{transaction.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-b border-zinc-900 pb-2.5 text-[13px]">
                  <span className="text-zinc-400">Delivery Fee:</span>
                  <span className="font-mono text-zinc-300">
                    {transaction.shippingFee > 0 ? `${displaySymbol}${transaction.shippingFee.toLocaleString()}` : 'Free'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[13px] font-bold text-white pt-1">
                  <span>Total held in escrow:</span>
                  <span className="text-emerald-400 font-mono text-[14px]">{displaySymbol}{grossTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-[13px] mt-1 pt-1.5 border-t border-zinc-900 font-bold">
                  <span className="text-zinc-500">
                    Status:
                  </span>
                  <span className="text-emerald-400 text-right">
                    {getPlainLanguageStatus()}
                  </span>
                </div>
              </div>
            </div>

            {/* Share on WhatsApp Card */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-[12px] p-5 flex flex-col gap-3.5 shadow-xl w-full">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 font-mono">Instant Share</span>
              <p className="text-[12px] text-zinc-400 leading-normal">
                Share this secure escrow payment link with your counterparty or clients via WhatsApp safely.
              </p>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Secure payment link for ${transaction.productName}: ${window.location.origin}/checkout/${transaction.id}. Funds are secure in escrow and only released when you confirm delivery!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.01] active:scale-[0.99] text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all uppercase font-mono tracking-wider text-center cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white text-emerald-600 shrink-0" />
                <span>Share Escrow Link</span>
              </a>
            </div>

          </div>

          {/* Redesigned Integrated Dispute support chat - Placed below order timeline for full screen-width span (12 columns) */}
          {transaction.status === 'disputed' && (
            <div className="lg:col-span-12 w-full mt-4">
              <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 sm:p-6 flex flex-col gap-4 shadow-xl text-left w-full">
                
                {/* Header of Chat */}
                <div className="bg-zinc-950 p-4 border border-zinc-800/50 rounded-xl flex items-center justify-between text-left">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <div className="flex flex-col text-left">
                      <span className="text-[11px] font-bold text-white uppercase tracking-wider font-mono">Dispute Support Chat</span>
                      <span className="text-[11px] text-zinc-500 font-mono">Case reference: {transaction.id}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-sans font-bold text-emerald-400">Trova Staff Live</span>
                  </div>
                </div>

                {/* Redesigned scrollable message logs */}
                <div 
                  ref={scrollRef}
                  className="bg-black/80 border border-zinc-900 rounded-2xl p-4 flex flex-col gap-4 h-[340px] md:h-[450px] overflow-y-auto no-scrollbar"
                >
                  {disputeMessages.map((msg, idx) => {
                    const isSupport = msg.role === 'admin';
                    const isBuyer = msg.role === 'buyer';
                    
                    if (isSupport) {
  return (
                        <div key={idx} className="flex gap-3 max-w-[85%] self-start text-left items-start my-1.5 animate-fade-in">
                          {/* Circle Avatar with TV */}
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-mono font-black text-[12px] text-emerald-400 shrink-0 mt-0.5">
                            TV
                          </div>
                          
                          <div className="flex flex-col gap-1 text-left">
                            <span className="text-[11px] font-bold font-sans text-emerald-400">
                              Trova Support Team
                            </span>
                            <div className="bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-2xl py-2.5 px-4 text-[13px] leading-relaxed">
                              <div>{msg.text}</div>
                              {msg.fileAttachment && (
                                <div className="mt-2.5 text-left relative group">
                                  {msg.fileAttachment.type.startsWith('image') || msg.fileAttachment.url.startsWith('data:image') ? (
                                    <div className="rounded-lg overflow-hidden border border-zinc-800 max-w-[200px] bg-black/45">
                                      <img 
                                        src={msg.fileAttachment.url} 
                                        alt={msg.fileAttachment.name} 
                                        className="max-h-40 w-auto object-cover rounded-lg"
                                        referrerPolicy="no-referrer"
                                      />
                                      <div className="text-[9px] text-zinc-400 p-1.5 truncate border-t border-zinc-800 bg-black/20">
                                        {msg.fileAttachment.name}
                                      </div>
                                    </div>
                                  ) : (
                                    <a 
                                      href={msg.fileAttachment.url} 
                                      download={msg.fileAttachment.name}
                                      className="flex items-center gap-2 p-2 rounded-lg bg-black/35 border border-zinc-800 hover:bg-black/50 transition-colors text-zinc-300 hover:text-white"
                                    >
                                      <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                                      <div className="flex flex-col text-left overflow-hidden w-full">
                                        <span className="text-[10px] font-bold truncate max-w-[130px]">{msg.fileAttachment.name}</span>
                                        <span className="text-[8px] text-zinc-450">File Attachment (Click to download)</span>
                                      </div>
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-550 font-mono pl-1">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    }

                     // For Buyer or Seller/Merchant: Appears on the RIGHT side with rgba emerald background
                     // Sender label "You" or merchant name is displayed
                      const senderLabel = isBuyer ? "You" : (transaction.vendorName || "Seller");
                     const isSelfAuthor = msg.role === 'buyer';
                     
                     return (
                       <div key={idx} className="flex gap-3 max-w-[85%] self-end text-left items-start justify-end my-1.5 animate-fade-in">
                         <div className="flex flex-col gap-1 text-right items-end">
                           <span className="text-[11px] font-bold font-sans text-zinc-400 pl-1">
                             {senderLabel} {isSelfAuthor && "(You)"}
                           </span>
                           <div 
                             style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)' }}
                             className="border border-emerald-500/10 text-zinc-100 rounded-2xl py-2.5 px-4 text-[13px] leading-relaxed text-left"
                           >
                            <div>{msg.text}</div>
                            {msg.fileAttachment && (
                              <div className="mt-2.5 text-left relative group">
                                {msg.fileAttachment.type.startsWith('image') || msg.fileAttachment.url.startsWith('data:image') ? (
                                  <div className="rounded-lg overflow-hidden border border-emerald-500/20 max-w-[200px] bg-black/45">
                                    <img 
                                      src={msg.fileAttachment.url} 
                                      alt={msg.fileAttachment.name} 
                                      className="max-h-40 w-auto object-cover rounded-lg"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="text-[9px] text-zinc-400 p-1.5 truncate border-t border-zinc-900 bg-black/20">
                                      {msg.fileAttachment.name}
                                    </div>
                                  </div>
                                ) : (
                                  <a 
                                    href={msg.fileAttachment.url} 
                                    download={msg.fileAttachment.name}
                                    className="flex items-center gap-2 p-2 rounded-lg bg-black/35 border border-zinc-900 hover:bg-black/50 transition-colors text-zinc-300 hover:text-white"
                                  >
                                    <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <div className="flex flex-col text-left overflow-hidden w-full">
                                      <span className="text-[10px] font-bold truncate max-w-[130px]">{msg.fileAttachment.name}</span>
                                      <span className="text-[8px] text-zinc-450">File Attachment (Click to download)</span>
                                    </div>
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-550 font-mono pr-1">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Avatar on Right side */}
                        <div className="w-8 h-8 rounded-full bg-zinc-850 border border-zinc-800 flex items-center justify-center font-mono font-bold text-[11px] text-zinc-305 shrink-0 mt-0.5">
                          {senderLabel.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Send Input Panel */}
                <div className="flex flex-col gap-2.5">
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!buyerInput.trim() && !stagedFile) return;

                        const messageText = buyerInput.trim() || `Sent an attachment: ${stagedFile?.name}`;
                        const attachmentUrl = stagedFile?.url;

                        setBuyerInput('');
                        setStagedFile(null);

                        await sendDisputeMessage(
                          transaction.id,
                          'buyer',
                          messageText,
                          attachmentUrl
                        );

                        // Simulated support reply for demo
                        setTimeout(async () => {
                          await sendDisputeMessage(
                            transaction.id,
                            'admin',
                             `Noted. We are holding transaction ${displaySymbol}${grossTotal.toLocaleString()} in secure holding. A customer dispute agent has flagged the case and is reviewing the item details.`
                          );
                        }, 1800);
                      }}
                      className="flex flex-col gap-2 w-full"
                    >
                    {/* Staged file attachment preview bubble */}
                    {stagedFile && (
                      <div className="flex items-center justify-between p-2.5 bg-zinc-940 border border-zinc-800 rounded-xl text-xs gap-3 font-sans animate-fade-in max-w-sm self-start mb-1">
                        <div className="flex items-center gap-2 overflow-hidden">
                          {stagedFile.type.startsWith('image/') ? (
                            <img src={stagedFile.url} className="w-8 h-8 rounded object-cover border border-zinc-800" referrerPolicy="no-referrer" alt="preview" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                          )}
                          <div className="flex flex-col text-left overflow-hidden">
                            <span className="text-[11px] text-white font-bold truncate max-w-[150px]">{stagedFile.name}</span>
                            <span className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider">{stagedFile.size}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStagedFile(null)}
                          className="p-1 rounded-md hover:bg-red-500/15 text-zinc-500 hover:text-red-500 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex gap-2.5 w-full items-stretch">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="py-3 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center justify-center"
                        title="Attach verification snapshots"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <input 
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                        accept="image/*,application/pdf"
                      />
                      <input
                        type="text"
                        value={buyerInput}
                        onChange={(e) => setBuyerInput(e.target.value)}
                        placeholder="Type your message or describe the issue..."
                        className="flex-1 bg-black border border-zinc-900 rounded-xl px-4 py-3 text-[13px] text-zinc-100 focus:outline-none focus:border-emerald-500/50 placeholder-zinc-550 font-sans"
                      />
                      <button
                        type="submit"
                        disabled={!buyerInput.trim() && !stagedFile}
                        className="py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-440 text-black font-extrabold text-xs cursor-pointer flex items-center justify-center transition-all bg-emerald-500/90 shadow hover:shadow-emerald-500/20 hover:scale-102 disabled:opacity-45 disabled:cursor-not-allowed"
                      >
                        <Send className="w-4 h-4 text-black" />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confidence Help & Trust Assurance Workspace FAQs */}
        <div 
          id="buyer-help-section"
          className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 sm:p-6 flex flex-col gap-5 mt-4 w-full"
        >
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-widest">Buyer Protection FAQ</span>
            <h3 className="text-[14px] font-extrabold text-white mt-1">Confidence & Help Hub</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Quick guides to help you understand your protection under escrow.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full animate-fade-in">
            <button
              onClick={() => setActiveHelpTopic(activeHelpTopic === 'how_works' ? null : 'how_works')}
              className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
                activeHelpTopic === 'how_works'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>How escrow works</span>
              </div>
              <span className="text-[10px] text-zinc-500 select-none">▼</span>
            </button>

            <button
              onClick={() => setActiveHelpTopic(activeHelpTopic === 'dispute' ? null : 'dispute')}
              className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
                activeHelpTopic === 'dispute'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-500" />
                <span>What happens in a dispute</span>
              </div>
              <span className="text-[10px] text-zinc-500 select-none">▼</span>
            </button>

            <button
              onClick={() => setActiveHelpTopic(activeHelpTopic === 'contact' ? null : 'contact')}
              className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
                activeHelpTopic === 'contact'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <span>Contact Trova Support</span>
              </div>
              <span className="text-[10px] text-zinc-500 select-none">▼</span>
            </button>
          </div>

          {/* Selected Topic Content Panel */}
          {activeHelpTopic && (
            <div className="bg-zinc-950 border border-zinc-800/50 p-5 rounded-2xl text-[13px] text-zinc-300 leading-relaxed text-left animate-fade-in w-full">
              {activeHelpTopic === 'how_works' && (
                <p>
                  Trova keeps your cash locked securely inside the trust vault while the seller prepares and ships your order. Once you receive your parcel, inspect it carefully. Only when you confirm everything is perfect are funds finally released and settled to the merchant.
                </p>
              )}
              {activeHelpTopic === 'dispute' && (
                <p>
                  If your package has size mismatch, color issues, or condition defects, you can click "Report a Problem" to freeze the outstanding balance. The merchant cannot withdraw it. Our support mediators will then inspect your details and unboxing snapshots inside the Dispute Support Chat to arrange resolution.
                </p>
              )}
              {activeHelpTopic === 'contact' && (
                <p>
                  Need our help? Use the direct **Dispute Support Chat** above to communicate with our escrow officers, or write us at <span className="text-emerald-400 font-bold select-all font-mono">support@trova.com</span>. We provide 24/7 client mediation.
                </p>
              )}
            </div>
          )}
        </div>

      {/* Paystack Modal Loader */}
      <PaystackModal
        isOpen={isPaystackOpen}
        onClose={() => setIsPaystackOpen(false)}
        onSuccess={handlePaymentSuccess}
        grossTotal={grossTotal}
        productName={transaction?.productName || 'Boots Item'}
        vendorName={transaction?.vendorName || 'Seller'}
        currencySymbol={transaction.currencySymbol}
        currencyCode={transaction.currencyCode}
      />

      {/* Floating Support Chat Widget */}
      <SupportChatWidget />

      {/* Post-Delivery Rating Modal */}
      {showRatingModal && renderRatingModal()}

      <ConfirmationModal 
        isOpen={modalOpen} 
        type={modalType} 
        onConfirm={handleConfirmAction} 
        onCancel={() => setModalOpen(false)} 
        theme={currentTheme}
      />

    </section>
    </>
  );
}
