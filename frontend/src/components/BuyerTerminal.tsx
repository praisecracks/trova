import React, { useState, useEffect, useRef } from 'react';
import VerifiedBadge from './VerifiedBadge';
import ConfirmationModal, { ConfirmationModalType } from './ConfirmationModal';
import { 
  ShieldCheck, 
  CreditCard, 
  Truck, 
  PackageCheck, 
  Briefcase,
  CheckCircle,
  AlertCircle,
  Clock,
  MessageSquare,
  MessageCircle,
  ThumbsUp,
  Send,
  X,
  User,
  Shield,
  ThumbsDown,
  Paperclip,
  FileText,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { EscrowLink, ChatMessage } from '../types';
import PaystackModal from './PaystackModal';
import { getCurrencySymbol } from '../lib/services/currency';
import { getPublicTransaction } from '../lib/services/transactions';
import { supabase } from '../lib/supabaseClient';
import { useToast } from './ToastContext';
import { useThemeSync } from '../hooks/useThemeSync';

interface BuyerTerminalProps {
  escrowLinks: EscrowLink[];
  selectedLink: EscrowLink | null;
  onLinkSelect: (link: EscrowLink) => void;
  onUpdateStatus: (linkId: string, newStatus: EscrowLink['status'], actorRole?: 'buyer' | 'seller' | 'admin', actorId?: string, buyerToken?: string) => void;
  onNavigateToDashboard?: () => void;
  isSeller?: boolean;
}

export default function BuyerTerminal({ 
  escrowLinks, 
  selectedLink, 
  onLinkSelect, 
  onUpdateStatus,
  onNavigateToDashboard,
  isSeller = false
}: BuyerTerminalProps) {
   
  const { success: toastSuccess, info: toastInfo } = useToast();
   
  // Fallback to first if none selected
  const activeLink = selectedLink || escrowLinks[0];

  const [enrichedLink, setEnrichedLink] = useState<EscrowLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState<string | null>(null);
  const [emptyMessageIdx, setEmptyMessageIdx] = useState(0);

  useEffect(() => {
    if (activeLink?.id) return;
    const messages = [
      'Waiting... a few minute',
      'Data is coming up in a minute',
      'This is taking longer — enter Dashboard, open an escrow, then click reload here'
    ];
    const timer = setInterval(() => {
      setEmptyMessageIdx(prev => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [activeLink?.id]);

  useEffect(() => {
    if (!activeLink?.id) return;
    let mounted = true;
    setLoading(true);
    setRealtimeStatus(null);
    getPublicTransaction(activeLink.id)
      .then((data) => {
        if (!mounted) return;
        if (!data) {
          setLoading(false);
          return;
        }
        const mapped = {
          ...activeLink,
          vendorName: (data as any).seller_business_name || (data as any).seller_display_name || activeLink.vendorName,
          vendorPhoto: (data as any).seller_avatar_url || activeLink.vendorPhoto,
          ratingAverage: (data as any).rating_average ?? activeLink.ratingAverage,
          ratingCount: (data as any).rating_count ?? activeLink.ratingCount,
          activeReferrals: (data as any).active_referral_count ?? activeLink.activeReferrals,
          sellerKycStatus: (data as any).seller_kyc_status,
        } as EscrowLink;
        setEnrichedLink(mapped);
        setLoading(false);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [activeLink?.id]);

  // Real-time subscription for active transaction updates
  useEffect(() => {
    if (!activeLink?.id) return;
    
    const channelName = `buyer-terminal-${activeLink.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trova_transactions',
          filter: `id=eq.${activeLink.id}`
        },
        (payload) => {
          const updated = payload.new as any;
          setEnrichedLink(prev => {
            if (!prev) return prev;
            const next = { ...prev, status: updated.status, updatedAt: updated.updated_at };
            return next;
          });
          setRealtimeStatus(updated.status);
          toastInfo(`Order ${activeLink.id} updated`, `Status changed to ${updated.status.replace('_', ' ')}`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeLink?.id]);

  const displayLink = enrichedLink || activeLink;

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isPaystackOpen, setIsPaystackOpen] = useState(false);
  const [feedbackAlert, setFeedbackAlert] = useState<string | null>(null);

  // Confirmation modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ConfirmationModalType>('confirm_delivery');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

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

  // Theme state synced from localStorage
  const currentTheme = useThemeSync();
   
  // Role selector state to track whether we're viewing/acting from the Buyer side or Seller/Merchant side
  const [viewRole, setViewRole] = useState<'buyer' | 'seller'>('buyer');

  useEffect(() => {
    if (isSeller) {
      setViewRole('seller');
    }
  }, [isSeller]);

  // Local countdown timer for Disputes: 72 hours
  const [disputeTimeLeft, setDisputeTimeLeft] = useState(259200); // 72 hours in seconds
  const [disputeMessages, setDisputeMessages] = useState<Array<{ 
    role: 'buyer' | 'seller' | 'admin'; 
    text: string; 
    timestamp: string;
    fileAttachment?: {
      name: string;
      url: string;
      type: string;
    };
  }>>([]);
  const [sellerInput, setSellerInput] = useState('');
  const [buyerInput, setBuyerInput] = useState('');
  const [activeHelpTopic, setActiveHelpTopic] = useState<string | null>(null);
  
  // File upload state & ref
  const terminalFileInputRef = useRef<HTMLInputElement>(null);
  const [terminalStagedFile, setTerminalStagedFile] = useState<{ name: string; url: string; type: string; size: string } | null>(null);

  const handleTerminalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      alert("File size exceeds 500KB limit for demo platform database storage.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setTerminalStagedFile({
        name: file.name,
        url: result,
        type: file.type,
        size: `${Math.round(file.size / 1024)} KB`
      });
    };
    reader.readAsDataURL(file);
    if (terminalFileInputRef.current) terminalFileInputRef.current.value = '';
  };
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Monitor vantage points
  useEffect(() => {
    console.log(`%c[Trova Security] Vantage point changed: ${viewRole.toUpperCase()} ASPECT`, "color: #34d399; font-weight: bold;");
  }, [viewRole]);

  // Load dispute chat messages and sync
  useEffect(() => {
    if (activeLink?.id) {
      const saved = localStorage.getItem(`dispute_chat_${activeLink.id}`);
      if (saved) {
        try {
          setDisputeMessages(JSON.parse(saved));
        } catch (e) {}
      } else {
        setDisputeMessages([]);
      }
    }
  }, [activeLink?.id]);

  useEffect(() => {
    if (activeLink?.status === 'disputed') {
      const interval = setInterval(() => {
        const saved = localStorage.getItem(`dispute_chat_${activeLink?.id}`);
        if (saved) {
          try {
            setDisputeMessages(JSON.parse(saved));
          } catch (e) {}
        }
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [activeLink?.status, activeLink?.id]);

  useEffect(() => {
    let timer: any;
    if (activeLink?.status === 'disputed') {
      timer = setInterval(() => {
        setDisputeTimeLeft(prev => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeLink?.status]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [disputeMessages]);

  if (!activeLink) {
    return (
      <div className="flex flex-col gap-6 max-w-7xl mx-auto text-left font-sans bg-[var(--bg)] text-[var(--text-primary)] p-1">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-5 sm:p-7 flex flex-col gap-7 shadow-[var(--shadow)]">
          <div className="flex justify-between items-center">
            <div className="h-5 w-40 rounded-md bg-[var(--surface2)] animate-pulse" />
            <div className="h-5 w-24 rounded-md bg-[var(--surface2)] animate-pulse" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[0,1,2,3].map((i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--surface2)] animate-pulse" />
                <div className="h-3 w-12 rounded bg-[var(--surface2)] animate-pulse" />
                <div className="h-2 w-16 rounded bg-[var(--surface2)] animate-pulse" />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <div className="h-4 w-full rounded bg-[var(--surface2)] animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-[var(--surface2)] animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-5 sm:p-7 flex flex-col gap-5 shadow-[var(--shadow)]">
              <div className="h-5 w-48 rounded bg-[var(--surface2)] animate-pulse" />
              <div className="h-32 w-full rounded-xl bg-[var(--surface2)] animate-pulse" />
            </div>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-5 flex flex-col gap-4 shadow-[var(--shadow)]">
              <div className="h-4 w-32 rounded bg-[var(--surface2)] animate-pulse" />
              <div className="h-24 w-full rounded-xl bg-[var(--surface2)] animate-pulse" />
            </div>
          </div>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 text-center">
          <p className="text-xs text-[var(--text-muted)] font-medium">
            {[
              'Waiting... a few minute',
              'Data is coming up in a minute',
              'This is taking longer — enter Dashboard, open an escrow, then click reload here'
            ][emptyMessageIdx]}
          </p>
        </div>
      </div>
    );
  }

  const grossTotal = activeLink.amount + activeLink.shippingFee;

  const getActiveStepIdx = () => {
    switch (displayLink.status) {
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

  const getFriendlyStatusLabel = () => {
    switch (displayLink.status) {
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

  const getTrackStatusMessage = () => {
    if (viewRole === 'seller') {
      switch (displayLink.status) {
        case 'pending_deposit':
          return "Buyer has not yet paid. Awaiting deposit to start the escrow agreement.";
        case 'deposited':
          return "Buyer has funded and paid for this order. Please ship the item to the buyer's address.";
        case 'shipped':
          return "Order has been shipped. Awaiting buyer delivery confirmation.";
        case 'delivered':
          return "Buyer has confirmed delivery. Funds will be released after their final approval.";
        case 'funds_released':
          return "Funds have been released to your account. Settlement complete.";
        case 'disputed':
          return "A dispute has been filed. Funds are frozen. Support chat is active for resolution.";
        default:
          return "Order status review in progress.";
      }
    }
    switch (displayLink.status) {
      case 'pending_deposit':
        return "We are waiting to secure your holding deposit inside the trust vault. Please click the \"Lock In Holding Deposit\" button to secure.";
      case 'deposited':
        return "Your funds have been deposited securely. The merchant has been notified and is preparing shipping handoff.";
      case 'shipped':
        return "Your item is shipped. The merchant has dispatched your order and logistics carrier routing is active.";
      case 'delivered':
        return "Parcel has arrived! Your inspection countdown has started. Please authorize final payout once you inspect correctness.";
      case 'funds_released':
        return "Final release authorized. Hold balance split and settled directly to the seller.";
      case 'disputed':
        return "A dispute hold has been filed. Cash is held securely. Support chat below is active for uploading specs.";
      default:
        return "Order status review in progress.";
    }
  };

  const getOrderTip = () => {
    if (viewRole === 'seller') {
      switch (displayLink.status) {
        case 'pending_deposit':
          return "Funds are held safely. Release requires buyer confirmation of delivery.";
        case 'deposited':
          return "Payment is locked in. You must ship the item to proceed.";
        case 'shipped':
          return "Item is in transit. Buyer will confirm delivery upon receipt.";
        case 'delivered':
          return "Buyer has received the item. Awaiting their confirmation and fund release.";
        case 'funds_released':
          return "Transaction complete! Funds have been disbursed to your account.";
        case 'disputed':
          return "Dispute is under review. Funds remain frozen. Our team will guide both parties to resolution.";
        default:
          return "Monitor this order for status changes.";
      }
    }
    switch (displayLink.status) {
      case 'deposited':
        return "Your payment is locked in. The seller has been notified and will ship your order soon.";
      case 'shipped':
        return "Your item is on its way. You will be notified when it arrives. Inspect carefully before confirming delivery.";
      case 'disputed':
        return "We have received your dispute. Our team reviews all cases fairly. Your payment remains frozen until this is resolved.";
      case 'pending_deposit':
        return "Your payment is safe. Funds will only be released to the seller after you confirm receipt.";
      case 'delivered':
        return "Please unbox immediately and inspect. Satisfied? Release the escrow holds below.";
      case 'funds_released':
        return "Perfect! This transaction has concluded smoothly under escrow protection.";
      default:
        return "Monitor this order for status changes.";
    }
  };

  const getTrustBannerCopy = () => {
    if (viewRole === 'seller') {
      return {
        main: `Buyer payment of ${activeLink.currencySymbol || getCurrencySymbol(activeLink.currencyCode || 'USD')}${grossTotal.toLocaleString()} is safely held in escrow.`,
        sub: "Funds will be released to you once the buyer confirms delivery. If something goes wrong, we will help resolve it fairly."
      };
    }
    return {
      main: `Your payment of ${activeLink.currencySymbol || getCurrencySymbol(activeLink.currencyCode || 'USD')}${grossTotal.toLocaleString()} is safely held in escrow.`,
      sub: "It will only be released when you confirm everything is right. If something is wrong, we will help make it right."
    };
  };

  const trustBanner = getTrustBannerCopy();

  const triggerAlert = (msg: string) => {
    setFeedbackAlert(msg);
  };

  const handlePaystackDeposit = () => {
    if (viewRole !== 'buyer') {
      triggerAlert("Security Error: Only buyers are authorized to initiate payment checkout flows.");
      return;
    }
    setIsPaystackOpen(true);
  };

  const handlePaymentSuccess = (method: string) => {
    setIsPaystackOpen(false);
    triggerAlert("Payment confirmed by buyer. Funds are now secured in escrow.");
  };

  const handleMerchantDispatch = () => {
    if (viewRole !== 'seller') {
      triggerAlert("Security Error: Only the registered merchant has permission to dispatch packages.");
      return;
    }
    onUpdateStatus(activeLink.id, 'shipped', 'seller');
    triggerAlert("Logistics parcel shipped! High-priority tracking system activated.");
  };

  const handleBuyerConfirmArrival = () => {
    if (viewRole !== 'buyer') {
      triggerAlert("Security Error: Only the buyer can confirm arrival.");
      return;
    }
    onUpdateStatus(activeLink.id, 'delivered', 'buyer');
    triggerAlert("Arrival confirmed! Funds release authorization is now available.");
  };

  const handleFinalClearance = () => {
    if (viewRole !== 'buyer') {
      triggerAlert("Security Error: Only the buyer can authorize release of their locked funds.");
      return;
    }
    onUpdateStatus(activeLink.id, 'funds_released', 'buyer');
    triggerAlert(`Settlement cleared! Escrow balanced and disbursed directly to linked accounts.`);
  };

  const handleDisputeRaise = () => {
    if (viewRole !== 'buyer') {
      triggerAlert("Security Error: Only the buyer is authorized to report problems or trigger a custody lock.");
      return;
    }
    onUpdateStatus(activeLink.id, 'disputed', 'buyer');
    setDisputeTimeLeft(259200); // 72h
    triggerAlert("Dispute hold requested. Secure P2P Arbitration chat window is now live.");

    try {
      const savedNotifications = JSON.parse(localStorage.getItem('trustlink_notifications') || '[]');
      const newNotification = {
        id: `notif-${crypto.randomUUID()}`,
        textPayload: `Dispute filed on order ${activeLink.id}. Escrow funds are frozen under staff review.`,
        loggingTime: new Date().toISOString(),
        read: false
      };
      localStorage.setItem('trustlink_notifications', JSON.stringify([newNotification, ...savedNotifications]));
      window.dispatchEvent(new CustomEvent('trustlink_notifications_update'));
    } catch (e) {}
  };

  const formatCountdown = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d : ${h.toString().padStart(2, '0')}h : ${m.toString().padStart(2, '0')}m`;
  };

  const renderStepNode = (stepIndex: number, label: string, sublabel: string, defaultIcon: React.ReactNode) => {
    const isCompleted = activeStep > stepIndex;
    const isActive = activeStep === stepIndex;

    return (
      <div className="flex flex-col items-center text-center z-10 select-none animate-fade-in">
        {isCompleted ? (
          <div className="w-8 h-8 rounded-full bg-[#10b981] text-white flex items-center justify-center transition-all border border-[#10b981]">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : isActive ? (
          <div className="w-8 h-8 rounded-full bg-[#10b981] text-white flex items-center justify-center transition-all border border-[#10b981] active-tracking-step">
            {defaultIcon}
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-[var(--surface2)] border border-[var(--border2)] text-[var(--text-dim)] flex items-center justify-center transition-all">
            {defaultIcon}
          </div>
        )}
        <span className={`text-[11px] font-bold mt-2 leading-tight ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
          {label}
        </span>
        <span className="text-[9px] text-[var(--text-dim)] mt-0.5">
          {sublabel}
        </span>
      </div>
    );
  };

  const isDisputed = displayLink.status === 'disputed';
  const trackCardBg = isDisputed
    ? 'bg-[#1e150a] [.light-theme_&]:bg-[rgba(245,158,11,0.06)]'
    : 'bg-[var(--surface2)]';
  const trackCardBorder = isDisputed
    ? 'border-[#f59e0b]/30 [.light-theme_&]:border-[rgba(245,158,11,0.2)]'
    : 'border-[var(--border)]';
  const trackLabelColor = isDisputed
    ? 'text-[#f59e0b] [.light-theme_&]:text-[#d97706]'
    : 'text-emerald-400';
  const trackHeadingText = isDisputed
    ? 'text-[#f59e0b] [.light-theme_&]:text-[#d97706]'
    : 'text-[var(--text-primary)]';

  return (
    <>
      <div className="max-w-7xl mx-auto w-full px-1 pt-1">
        <button
          type="button"
          onClick={onNavigateToDashboard}
          className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-black/60 px-3.5 py-2 text-xs font-bold text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-400"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {loading && (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto text-left font-sans bg-[var(--bg)] text-[var(--text-primary)] p-1 mt-6">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-5 sm:p-7 flex flex-col gap-7 shadow-[var(--shadow)]">
            <div className="flex justify-between items-center">
              <div className="h-5 w-40 rounded-md bg-[var(--surface2)] animate-pulse" />
              <div className="h-5 w-24 rounded-md bg-[var(--surface2)] animate-pulse" />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[0,1,2,3].map((i) => (
                <div key={i} className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--surface2)] animate-pulse" />
                  <div className="h-3 w-12 rounded bg-[var(--surface2)] animate-pulse" />
                  <div className="h-2 w-16 rounded bg-[var(--surface2)] animate-pulse" />
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <div className="h-4 w-full rounded bg-[var(--surface2)] animate-pulse" />
              <div className="h-4 w-5/6 rounded bg-[var(--surface2)] animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-5 sm:p-7 flex flex-col gap-5 shadow-[var(--shadow)]">
                <div className="h-5 w-48 rounded bg-[var(--surface2)] animate-pulse" />
                <div className="h-32 w-full rounded-xl bg-[var(--surface2)] animate-pulse" />
              </div>
            </div>
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-5 flex flex-col gap-4 shadow-[var(--shadow)]">
                <div className="h-4 w-32 rounded bg-[var(--surface2)] animate-pulse" />
                <div className="h-24 w-full rounded-xl bg-[var(--surface2)] animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && (
      <div className="flex flex-col gap-6 max-w-7xl mx-auto text-left animate-fade-in font-sans bg-[var(--bg)] text-[var(--text-primary)] p-1">
      
      {/* Simulation perspective switcher for dashboard playground */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex flex-col text-left">
             <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--text-primary)] font-bold">Simulator Helper</span>
             <span className="text-xs text-[var(--text-muted)]">{isSeller ? 'Seller testing mode — buyer actions are locked to seller perspective.' : 'Switch workspace perspectives to test buyer or seller checkout controls.'}</span>
          </div>
        </div>

        {!isSeller && (
        <div className="flex gap-2 w-full sm:w-auto p-1 bg-[var(--surface2)] rounded-lg border border-[var(--border)]">
          <button
            onClick={() => setViewRole('buyer')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
              viewRole === 'buyer'
                ? 'bg-emerald-500/10 text-emerald-400 [.light-theme_&]:text-emerald-600 border border-emerald-500/20'
                : 'bg-[var(--surface2)] border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface)]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Buyer side</span>
          </button>
          
          <button
            onClick={() => setViewRole('seller')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
              viewRole === 'seller'
                ? 'bg-zinc-800 text-zinc-200 border border-zinc-700 [.light-theme_&]:bg-zinc-200 [.light-theme_&]:text-zinc-800 [.light-theme_&]:border-zinc-300'
                : 'bg-[var(--surface2)] border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface)]'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Seller side</span>
          </button>
        </div>
        )}
      </div>

      {/* Trust Confidence Banner */}
      <div className="bg-[#0c1a14] [.light-theme_&]:bg-[rgba(16,185,129,0.06)] border border-emerald-500/10 [.light-theme_&]:border-[rgba(16,185,129,0.2)] border-l-4 border-l-emerald-500 rounded-xl p-4 flex items-center gap-3.5 shadow-md w-full">
        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
        </div>
        <div className="text-left w-full flex-1">
          <p className="text-[13px] md:text-[14px] font-bold text-[var(--text-primary)] leading-snug">
             {trustBanner.main}
          </p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">
            {trustBanner.sub}
          </p>
        </div>
        {realtimeStatus && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Live</span>
          </div>
        )}
      </div>

      {/* Selected Action Dropdown Select bar */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[var(--shadow)]">
        <div className="flex gap-3 items-center">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5.5 h-5.5 animate-pulse" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-mono font-bold text-[var(--text-muted)] uppercase">Interactive Checkout Simulator</span>
            <h2 className="text-xs md:text-sm font-bold text-[var(--text-primary)] font-mono mt-0.5">Order ID: {activeLink.id}</h2>
          </div>
        </div>

        <div className="relative w-full md:w-80">
          <select
            value={activeLink.id}
            onChange={(e) => {
              const selected = escrowLinks.find(l => l.id === e.target.value);
              if (selected) onLinkSelect(selected);
            }}
            className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-lg py-2 pl-3 pr-10 text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/60 appearance-none cursor-pointer"
          >
            {escrowLinks.map(link => (
              <option key={link.id} value={link.id}>
                {link.id} - {link.productName} ({link.status.toUpperCase().replace('_', ' ')})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Feedback status messages */}
      {feedbackAlert && (
          <div className="bg-emerald-950/10 border border-emerald-500/20 text-emerald-400 px-4 py-3.5 text-xs font-semibold rounded-xl shadow-lg flex items-center gap-2.5 animate-fade-in w-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="leading-relaxed">{feedbackAlert}</span>
          </div>
      )}

      {/* Main Grid content with stack responsiveness */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        
        {/* Left Milestones Column */}
        <div className="lg:col-span-8 flex flex-col gap-6 w-full">
          
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-5 sm:p-7 flex flex-col gap-7 relative overflow-hidden shadow-[var(--shadow)] w-full">
            <div className="flex justify-between items-center select-none border-b border-[var(--border)] pb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">Order Milestones</span>
              <span className="text-[11.5px] font-mono text-[var(--text-dim)] font-bold">Secure Tracker</span>
            </div>

            {/* steps Connecting graphic nodes */}
            <div className="grid grid-cols-4 relative mt-2 mb-2 w-full gap-1">
              <span className="absolute top-4 left-[12%] right-[12%] h-[1px] md:h-[1.5px] bg-[var(--border2)] z-0">
                <span 
                  className="absolute h-full bg-[#10b981] transition-all duration-300"
                  style={{ 
                    width: activeStep <= 1 ? '0%' : 
                           activeStep === 2 ? '33.3%' :
                           activeStep === 3 ? '66.6%' : 
                           activeStep >= 4 ? '100%' : '0%'
                  }}
                />
              </span>

              {/* paid */}
              {renderStepNode(1, "Paid", "Secured", <CreditCard className="w-4 h-4" />)}

              {/* Shipped */}
              {renderStepNode(
                2,
                activeLink.transactionType === 'service' ? 'WIP' : 'Shipped',
                activeLink.transactionType === 'service' ? 'In Progress' : 'In Transit',
                activeLink.transactionType === 'service' ? <Briefcase className="w-4 h-4" /> : <Truck className="w-4 h-4" />
              )}

              {/* Submitted / Delivered */}
              {renderStepNode(
                3,
                activeLink.transactionType === 'service' ? 'Submitted' : 'Arrived',
                activeLink.transactionType === 'service' ? 'For Review' : 'Inspection',
                activeLink.transactionType === 'service' ? <CheckCircle className="w-4 h-4" /> : <PackageCheck className="w-4 h-4" />
              )}

              {/* Released */}
              {renderStepNode(4, "Released", "Settled", <ShieldCheck className="w-4 h-4" />)}
            </div>

            {/* Describe milestone block */}
            <div className={`p-4 border rounded-xl flex gap-3 text-xs leading-relaxed text-left transition-all ${trackCardBg} ${trackCardBorder}`}>
              <Clock className={`w-4 h-4 shrink-0 mt-0.5 ${trackLabelColor}`} />
              <div className="flex flex-col gap-1 w-full">
                <h4 className={`font-bold uppercase tracking-wider font-mono text-[11px] ${trackHeadingText}`}>
                  Track Status: {getFriendlyStatusLabel()}
                </h4>
                <p className="text-[var(--text-muted)] text-[13px] leading-relaxed">
                  {getTrackStatusMessage()}
                </p>
              </div>
            </div>

            {/* Contextual Status Tip Calm */}
            <div className="bg-[var(--surface2)] border border-[var(--border)] rounded-xl p-4 flex items-start gap-3.5 text-left text-[13px] w-full">
              <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5 w-full text-[13px]">
                <span className="text-[11px] font-black uppercase text-[var(--text-muted)] tracking-wider font-mono">Order Tip</span>
                <p className="text-[var(--text-muted)] leading-normal">
                  {getOrderTip()}
                </p>
              </div>
            </div>

            {/* Action buttons list */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4.5 sm:p-5.5 flex flex-col gap-3 text-left w-full mt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)] pb-2.5 block font-mono">
                What do you need help with
              </span>

              {/* BUYER CONTROLS */}
              {viewRole === 'buyer' && (
                <>
                  {/* secure invoice payment */}
                  {displayLink.status === 'pending_deposit' && (
                    <div className="flex flex-col gap-3.5">
                      <p className="text-[13px] text-[var(--text-muted)] leading-relaxed font-sans mt-1">
                         Authorize secure deposit of <strong>{activeLink.currencySymbol || getCurrencySymbol(activeLink.currencyCode || 'USD')}{grossTotal.toLocaleString()}</strong>. Funds remain safe under holding escrow and cannot be released until products arrives.
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

                  {/* Shipped options */}
                  {displayLink.status === 'shipped' && (
                    <div className="flex flex-col gap-4">
                      <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
                         Your order is shipped! Once courier arrives, verify the item, then select action below.
                      </p>
                       <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
                         <button
                           onClick={handleBuyerConfirmArrival}
                           className="w-full sm:w-auto py-3 px-5 rounded-xl bg-[var(--surface2)] hover:border-emerald-500 border border-[var(--border)] text-[var(--text-primary)] font-black text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow transition-all"
                         >
                           <ThumbsUp className="w-4 h-4 text-emerald-450 shrink-0" />
                           <span>Confirm Delivery Arrived</span>
                         </button>
                        <button
                          onClick={() => triggerConfirmModal('raise_dispute', handleDisputeRaise)}
                          className="w-full sm:w-auto py-3 px-4 rounded-xl bg-[var(--surface2)] hover:border-emerald-500 border border-[var(--border)] text-[var(--text-primary)] font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
                        >
                          <ThumbsDown className="w-4 h-4 text-red-500 shrink-0" />
                          <span>Report a Problem / Dispute</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Delivered options */}
                  {displayLink.status === 'delivered' && (
                    <div className="flex flex-col gap-4">
                      <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
                        Delivery logged. Please unbox and verify correct size. Satisfied? Authorize final payment release.
                      </p>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
                        <button
                          onClick={() => triggerConfirmModal('confirm_delivery', handleFinalClearance)}
                          className="w-full sm:w-auto py-3 px-5 rounded-xl bg-[var(--surface2)] hover:border-emerald-500 border border-[var(--border)] text-[var(--text-primary)] font-black text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                        >
                          <ThumbsUp className="w-4 h-4 text-emerald-455 shrink-0" />
                          <span>Approve & Release Funds</span>
                        </button>
                        <button
                          onClick={() => triggerConfirmModal('raise_dispute', handleDisputeRaise)}
                          className="w-full sm:w-auto py-3 px-4 rounded-xl bg-[var(--surface2)] hover:border-emerald-500 border border-[var(--border)] text-[var(--text-primary)] font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
                        >
                          <ThumbsDown className="w-4 h-4 text-red-500 shrink-0" />
                          <span>Open Dispute / Hold</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* SELLER CONTROL EMULATIONS */}
              {viewRole === 'seller' && (
                <>
                  {displayLink.status === 'pending_deposit' && (
                    <div className="p-4 bg-[var(--surface2)] border border-[var(--border)] rounded-xl leading-relaxed text-[13px] text-[var(--text-muted)]">
                       ⏳ Awaiting customer escrow deposit. Once customer secures {activeLink.currencySymbol || getCurrencySymbol(activeLink.currencyCode || 'USD')}{grossTotal.toLocaleString()} you will be notified to arrange courier dropoff.
                    </div>
                  )}

                  {displayLink.status === 'deposited' && (
                    <div className="flex flex-col gap-4">
                      <p className="text-[13px] text-[var(--text-muted)] leading-normal">
                         Funds have been deposited in the Trova vault. Please drop off the item at the courier terminal and scan the manifest.
                      </p>
                      <button
                        onClick={() => triggerConfirmModal('mark_shipped', handleMerchantDispatch)}
                        className="w-full sm:w-auto py-3 px-6 rounded-lg bg-[var(--surface2)] hover:border-emerald-500 border border-[var(--border)] text-[var(--text-primary)] text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Truck className="w-4 h-4 text-emerald-400" />
                        <span>Dispatched Item (Simulate Ship)</span>
                      </button>
                    </div>
                  )}

                  {displayLink.status === 'shipped' && (
                    <div className="p-4 bg-[var(--surface2)] border border-[var(--border)] rounded-xl leading-relaxed text-[13px] text-[var(--text-muted)]">
                      ⏳ Order is in transit. Awaiting buyer delivery confirmation.
                    </div>
                  )}
                </>
              )}

              {/* Raised Dispute states */}
              {displayLink.status === 'disputed' && (
                <div className="flex flex-col gap-4">
                  <div className="p-4 bg-red-955/10 [.light-theme_&]:bg-red-500/5 border border-red-500/20 rounded-xl leading-relaxed text-[13px] text-[var(--text-primary)] flex flex-col gap-2">
                    <p className="text-red-500 font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
                      There is an active dispute on this order.
                    </p>
                    <p className="text-[13px] text-[var(--text-muted)]">
                      Payments for this order are paused while we review the dispute. Use the chat below to share photos or explain the issue. Our team will review and help resolve this fairly.
                    </p>
                  </div>
                  {viewRole === 'buyer' && (
                    <div>
                      <button
                        onClick={() => triggerConfirmModal('confirm_delivery', handleFinalClearance)}
                        className="w-full sm:w-auto py-3 px-5 rounded-xl bg-[var(--surface2)] hover:border-emerald-500 border border-[var(--border)] text-[var(--text-primary)] font-black text-xs cursor-pointer flex items-center justify-center gap-2 transition-all"
                      >
                        <ThumbsUp className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Approve Mutual Resolution (Pay Merchant)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {displayLink.status === 'funds_released' && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[13px] font-sans">
                  ✓ Transaction complete! Escrow funds released to receiver account successfully.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Info Column */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full text-left">
          
          {/* Active Dispute Resolution Deadline Timer */}
          {displayLink.status === 'disputed' && (
            <div className="bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow)] rounded-3xl p-5 flex flex-col gap-3 text-left w-full">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#dc2626] font-mono">Resolution Deadline</span>
              <span className="text-2xl font-black text-[var(--text-primary)] font-mono mt-1 tracking-wider leading-none">{formatCountdown(disputeTimeLeft)}</span>
              <p className="text-[var(--text-muted)] text-[13px] leading-relaxed mt-1">
                Our team aims to resolve all disputes within 72 hours. Time remaining on this review.
              </p>
            </div>
          )}

          {/* Invoice card */}
          <div className="bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow)] rounded-3xl p-5 flex flex-col gap-4 text-[13px] w-full">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">Invoice Summary</span>

             <div className="p-3.5 bg-[var(--surface2)] border border-[var(--border)] rounded-xl flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center font-bold font-mono text-emerald-400 text-xs text-center overflow-hidden">
                 {displayLink.vendorPhoto ? (
                   <img src={displayLink.vendorPhoto} alt="Merchant logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                 ) : (
                   String(displayLink.vendorName || "S").charAt(0).toUpperCase()
                 )}
               </div>
               <div className="flex flex-col text-left">
                 <span className="font-bold text-[var(--text-primary)] text-[13px] leading-tight">{displayLink.vendorName || "Seller"}</span>
                   <div className="flex items-center gap-1 mt-0.5">
                     <VerifiedBadge size="xs" isKycVerified={displayLink.sellerKycStatus === 'verified'} type="kyc" />
                     {displayLink.sellerKycStatus === 'verified' && (
                       <span className="text-[10px] text-emerald-400 font-bold">Verified</span>
                     )}
                     {displayLink.ratingCount > 0 && (
                       <span className="text-[10px] text-amber-400 font-bold ml-1">
                         ★ {displayLink.ratingAverage} · {displayLink.ratingCount}
                       </span>
                     )}
                   </div>
               </div>
             </div>

            <div className="flex flex-col gap-2.5 border-t border-[var(--border)] pt-3 text-[13px]">
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-[var(--text-muted)]">Order Reference:</span>
                <span className="font-mono font-bold text-[var(--text-primary)]">{activeLink.id}</span>
              </div>
              <div className="flex justify-between items-center mt-0.5 text-[13px]">
                <span className="text-[var(--text-muted)]">Item Name:</span>
                <span className="font-semibold text-[var(--text-primary)] truncate max-w-[140px] text-right">{activeLink.productName}</span>
              </div>
               <div className="flex justify-between items-center text-[13px]">
                <span className="text-[var(--text-muted)]">Price:</span>
                <span className="font-mono text-[var(--text-primary)]">{activeLink.currencySymbol || getCurrencySymbol(activeLink.currencyCode || 'USD')}{activeLink.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-b border-[var(--border)] pb-2.5 text-[13px]">
                <span className="text-[var(--text-muted)]">Delivery Fee:</span>
                <span className="font-mono text-[var(--text-primary)]">{activeLink.currencySymbol || getCurrencySymbol(activeLink.currencyCode || 'USD')}{activeLink.shippingFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[13px] font-bold text-[var(--text-primary)] pt-1">
                <span>Gross Funds held:</span>
                <span className="text-emerald-400 font-mono text-[14px]">{activeLink.currencySymbol || getCurrencySymbol(activeLink.currencyCode || 'USD')}{grossTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[13px] font-mono mt-1 pt-1.5 border-t border-[var(--border)] font-bold">
                <span className="text-[var(--text-muted)]">Active Status:</span>
                <span className="text-emerald-400 text-right">{getFriendlyStatusLabel()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dispute Chat Workspace spans full width 12 cols below */}
        {displayLink.status === 'disputed' && (
          <div className="lg:col-span-12 w-full mt-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-5 sm:p-6 flex flex-col gap-4 shadow-[var(--shadow)] text-left w-full">
              
              {/* Header of Chat */}
              <div className="bg-[var(--surface2)] p-4 border border-[var(--border)] rounded-xl flex items-center justify-between text-left">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">Dispute Support Chat</span>
                    <span className="text-[11px] text-[var(--text-dim)] font-mono">Case reference: {activeLink.id}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-sans font-bold text-emerald-400">Trova Staff Live</span>
                </div>
              </div>

              {/* Chat timeline feed */}
              <div 
                ref={scrollRef}
                className="bg-[var(--bg)] border border-[var(--border)] rounded-2xl p-4 flex flex-col gap-4 h-[340px] md:h-[450px] overflow-y-auto no-scrollbar"
              >
                {disputeMessages.map((msg, idx) => {
                  const isSupport = msg.role === 'admin';
                  const isBuyerSender = msg.role === 'buyer';
                  
                  if (isSupport) {
                    return (
                      <div key={idx} className="flex gap-3 max-w-[85%] self-start text-left items-start my-1.5 animate-fade-in">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-mono font-black text-[12px] text-emerald-400 shrink-0 mt-0.5">
                          TV
                        </div>
                        
                        <div className="flex flex-col gap-1 text-left">
                          <span className="text-[11px] font-bold font-sans text-emerald-450">
                            Trova Support Team
                          </span>
                          <div className="bg-[var(--surface2)] border border-[var(--border)] text-[var(--text-primary)] rounded-2xl py-2.5 px-4 text-[13px] leading-relaxed">
                            <div>{msg.text}</div>
                            {msg.fileAttachment && (
                              <div className="mt-2 text-left relative group">
                                {msg.fileAttachment.type.startsWith('image') || msg.fileAttachment.url.startsWith('data:image') ? (
                                  <div className="rounded-lg overflow-hidden border border-[var(--border)] max-w-[200px] bg-black/45">
                                    <img 
                                      src={msg.fileAttachment.url} 
                                      alt={msg.fileAttachment.name} 
                                      className="max-h-40 w-auto object-cover rounded-lg"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="text-[9px] text-zinc-400 p-1.5 truncate border-t border-[var(--border)] bg-black/20">
                                      {msg.fileAttachment.name}
                                    </div>
                                  </div>
                                ) : (
                                  <a 
                                    href={msg.fileAttachment.url} 
                                    download={msg.fileAttachment.name}
                                    className="flex items-center gap-2 p-2 rounded-lg bg-black/35 border border-[var(--border)] hover:bg-black/50 transition-colors text-zinc-300 hover:text-white"
                                  >
                                    <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <div className="flex flex-col text-left overflow-hidden">
                                      <span className="text-[10px] font-bold truncate max-w-[130px]">{msg.fileAttachment.name}</span>
                                      <span className="text-[8px] text-zinc-400">Click to download</span>
                                    </div>
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] text-[var(--text-dim)] font-mono pl-1">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  const senderLabel = isBuyerSender ? "Buyer Account" : (displayLink.vendorName || "Seller");
                  const isSelfAuthor = msg.role === viewRole;
                  
                  return (
                    <div key={idx} className="flex gap-3 max-w-[85%] self-end text-left items-start justify-end my-1.5 animate-fade-in">
                      <div className="flex flex-col gap-1 text-right items-end">
                        <span className="text-[11px] font-bold font-sans text-[var(--text-muted)] pl-1">
                          {senderLabel} {isSelfAuthor && "(You)"}
                        </span>
                        <div 
                          className="bg-[rgba(16,185,129,0.12)] [.light-theme_&]:bg-[rgba(16,185,129,0.08)] border border-emerald-500/10 [.light-theme_&]:border-[rgba(16,185,129,0.15)] text-[var(--text-primary)] rounded-2xl py-2.5 px-4 text-[13px] leading-relaxed text-left"
                        >
                          <div>{msg.text}</div>
                          {msg.fileAttachment && (
                            <div className="mt-2 text-left relative group">
                              {msg.fileAttachment.type.startsWith('image') || msg.fileAttachment.url.startsWith('data:image') ? (
                                <div className="rounded-lg overflow-hidden border border-emerald-500/20 max-w-[200px] bg-black/45">
                                  <img 
                                    src={msg.fileAttachment.url} 
                                    alt={msg.fileAttachment.name} 
                                    className="max-h-40 w-auto object-cover rounded-lg"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="text-[9px] text-zinc-450 p-1.5 truncate border-t border-zinc-900 bg-black/20">
                                    {msg.fileAttachment.name}
                                  </div>
                                </div>
                              ) : (
                                <a 
                                  href={msg.fileAttachment.url} 
                                  download={msg.fileAttachment.name}
                                  className="flex items-center gap-2 p-2 rounded-lg bg-black/35 border border-emerald-500/20 hover:bg-black/50 transition-colors text-zinc-300 hover:text-white"
                                >
                                  <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                                  <div className="flex flex-col text-left overflow-hidden w-full">
                                    <span className="text-[10px] font-bold truncate max-w-[130px]">{msg.fileAttachment.name}</span>
                                    <span className="text-[8px] text-zinc-450">Click to download</span>
                                  </div>
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-[var(--text-dim)] font-mono pr-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-[var(--surface2)] border border-[var(--border)] flex items-center justify-center font-mono font-bold text-[11px] text-[var(--text-muted)] shrink-0 mt-0.5">
                        {senderLabel.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Inputs */}
              <div className="flex flex-col gap-2.5">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const textValue = viewRole === 'buyer' ? buyerInput : sellerInput;
                    if (!textValue.trim() && !terminalStagedFile) return;

                    const newMessage = {
                      role: viewRole,
                      text: textValue.trim() || `Sent an attachment: ${terminalStagedFile?.name}`,
                      timestamp: new Date().toISOString(),
                      ...(terminalStagedFile ? {
                        fileAttachment: {
                          name: terminalStagedFile.name,
                          url: terminalStagedFile.url,
                          type: terminalStagedFile.type
                        }
                      } : {})
                    };

                    const updated = [...disputeMessages, newMessage];
                    setDisputeMessages(updated);
                    localStorage.setItem(`dispute_chat_${activeLink.id}`, JSON.stringify(updated));

                    if (viewRole === 'buyer') {
                      setBuyerInput('');
                    } else {
                      setSellerInput('');
                    }
                    setTerminalStagedFile(null);

                    // Simulated Moderator response block
                    setTimeout(() => {
                      const supportReply = {
                        role: 'admin' as const,
                         text: `Review in progress. Escrow holding deposit of ${activeLink.currencySymbol || getCurrencySymbol(activeLink.currencyCode || 'USD')}${grossTotal.toLocaleString()} remains safely held in central escrow.`,
                        timestamp: new Date().toISOString()
                      };
                      const fullyUpdated = [...updated, supportReply];
                      setDisputeMessages(fullyUpdated);
                      localStorage.setItem(`dispute_chat_${activeLink.id}`, JSON.stringify(fullyUpdated));
                    }, 1800);
                  }}
                  className="flex flex-col gap-2 w-full"
                >
                  {/* Staged file attachment preview bubble */}
                  {terminalStagedFile && (
                    <div className="flex items-center justify-between p-2.5 bg-[var(--surface2)] border border-[var(--border)] rounded-xl text-xs gap-3 font-sans animate-fade-in max-w-sm self-start">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {terminalStagedFile.type.startsWith('image/') ? (
                          <img src={terminalStagedFile.url} className="w-8 h-8 rounded object-cover border border-[var(--border)]" referrerPolicy="no-referrer" alt="preview" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                        )}
                        <div className="flex flex-col text-left overflow-hidden">
                          <span className="text-[11px] text-[var(--text-primary)] font-bold truncate max-w-[150px]">{terminalStagedFile.name}</span>
                          <span className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">{terminalStagedFile.size}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTerminalStagedFile(null)}
                        className="p-1 rounded-md hover:bg-red-500/15 text-zinc-500 hover:text-red-500 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2.5 w-full items-stretch">
                    <button
                      type="button"
                      onClick={() => terminalFileInputRef.current?.click()}
                      className="py-3 px-3.5 rounded-xl bg-[var(--surface2)] border border-[var(--border)] hover:bg-[var(--surface)] text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-all cursor-pointer flex items-center justify-center"
                      title="Attach dispute evidence photos"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <input 
                      type="file"
                      ref={terminalFileInputRef}
                      className="hidden"
                      onChange={handleTerminalFileSelect}
                      accept="image/*,application/pdf"
                    />
                    <input
                      type="text"
                      value={viewRole === 'buyer' ? buyerInput : sellerInput}
                      onChange={(e) => viewRole === 'buyer' ? setBuyerInput(e.target.value) : setSellerInput(e.target.value)}
                      placeholder="Type your message or describe the issue..."
                      className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-4 py-3 text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/50 placeholder-[var(--text-dim)] font-sans"
                    />
                    <button
                      type="submit"
                      disabled={!(viewRole === 'buyer' ? buyerInput : sellerInput).trim() && !terminalStagedFile}
                      className="py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-440 text-black font-extrabold text-xs cursor-pointer flex items-center justify-center transition-all bg-emerald-500/90 shadow hover:shadow-emerald-500/20 disabled:opacity-45 disabled:cursor-not-allowed"
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

      {/* Bottom Protections and Help Links */}
      <div className="flex flex-col gap-4 mt-2 w-full">
        {/* Your Payment Is Protected Card */}
        <div className="bg-[#0c1a14]/60 [.light-theme_&]:bg-[rgba(16,185,129,0.04)] border border-emerald-500/10 [.light-theme_&]:border-[rgba(16,185,129,0.15)] rounded-2xl p-4 flex items-center gap-3 w-full shadow-sm text-left">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">Your Payment Is Protected</span>
            <p className="text-[12px] text-[var(--text-muted)] leading-relaxed mt-0.5">
              Secure multi-signature escrow holding ensures verification of all item parameters before merchant payout settles.
            </p>
          </div>
        </div>

        {/* Three Help Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
          <button
            onClick={() => setActiveHelpTopic(activeHelpTopic === 'how_works' ? null : 'how_works')}
            className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
              activeHelpTopic === 'how_works'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] hover:border-emerald-500/50 hover:text-emerald-400'
            }`}
          >
            <span>🛡️ How escrow works</span>
            <span className="text-[10px] text-[var(--text-dim)] select-none font-sans">▼</span>
          </button>

          <button
            onClick={() => setActiveHelpTopic(activeHelpTopic === 'dispute' ? null : 'dispute')}
            className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
              activeHelpTopic === 'dispute'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] hover:border-emerald-500/50 hover:text-emerald-400'
            }`}
          >
            <span>⚖️ Dispute guidelines</span>
            <span className="text-[10px] text-[var(--text-dim)] select-none font-sans">▼</span>
          </button>

          <button
            onClick={() => setActiveHelpTopic(activeHelpTopic === 'contact' ? null : 'contact')}
            className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
              activeHelpTopic === 'contact'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] hover:border-emerald-500/50 hover:text-emerald-400'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Speak with Support</span>
            </span>
            <span className="text-[10px] text-[var(--text-dim)] select-none font-sans">▼</span>
          </button>
        </div>

        {/* Selected Topic Content Panel */}
        {activeHelpTopic && (
          <div className="bg-[var(--surface2)] border border-[var(--border)] p-4 rounded-2xl text-[13px] text-[var(--text-muted)] leading-relaxed text-left animate-fade-in w-full">
            {activeHelpTopic === 'how_works' && (
              <p>
                Trova keeps your cash locked securely inside the trust vault while the seller prepares and ships your order. Once you receive your order, inspect it carefully. Only when you confirm everything is perfect are funds finally released and disburse settled to the merchant.
              </p>
            )}
            {activeHelpTopic === 'dispute' && (
              <p>
                If your package has issues with the item, such as mismatch, damage, or condition defects, you can click "Report a Problem" to freeze the outstanding balance. The merchant cannot withdraw it. Our support mediators will then inspect your details and unboxing snapshots inside the Dispute Support Chat to arrange resolution.
              </p>
            )}
            {activeHelpTopic === 'contact' && (
              <p>
                Need our help? Use the direct **Dispute Support Chat** above to communicate with our escrow officers, or write us at <span className="text-emerald-400 font-bold select-all font-mono">support@trova.co</span>. We provide 24/7 client mediation.
              </p>
            )}
          </div>
        )}
      </div>

      <PaystackModal
        isOpen={isPaystackOpen}
        onClose={() => setIsPaystackOpen(false)}
        onSuccess={handlePaymentSuccess}
        grossTotal={grossTotal}
        productName={activeLink?.productName || 'Boots Item'}
        vendorName={activeLink?.vendorName || 'Seller'}
      />

<ConfirmationModal 
          isOpen={modalOpen} 
          type={modalType} 
          onConfirm={handleConfirmAction} 
          onCancel={() => setModalOpen(false)} 
          theme={currentTheme}
        />
      </div>
      )}
    </>
  );
}
