import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Share2, Copy, Check, Users, Gift, TrendingUp, Gem, HelpCircle, Zap, Sparkles, AlertCircle, Activity, Award, Lock, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './ToastContext';
import { createReferral, updateReferralStatus } from '../lib/services/referrals';

interface ReferredStore {
  storeName: string;
  signUpDate: string;
  status: 'Active' | 'Pending';
}

interface ReferralSchema {
  referrals: ReferredStore[];
}

interface ReferralsViewProps {
  sellerId?: string | null;
  referralsData?: any[];
  onReferralsUpdate?: (referrals: any[]) => void;
  profile?: any;
}

export default function ReferralsView({ 
  sellerId, 
  referralsData = [], 
  onReferralsUpdate,
  profile: propProfile 
}: ReferralsViewProps) {
  const { success, error: toastError } = useToast();
  const [profile, setProfile] = useState(() => {
    if (propProfile) return propProfile;
    try {
      const saved = localStorage.getItem('trustlink-profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      fullName: '',
      email: '',
      instagram: ''
    };
  });

  const [localReferrals, setLocalReferrals] = useState(referralsData);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTemplateIdx, setCopiedTemplateIdx] = useState<number | null>(null);
  const [hoveredTier, setHoveredTier] = useState<string | null>(null);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // Auto-trigger smooth progress bar fill after entrance
  const [progressPercent, setProgressPercent] = useState(0);

  // Listen to profile changes in real time
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('trustlink-profile');
        if (saved) setProfile(JSON.parse(saved));
      } catch (e) {}
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const sellerHandle = useMemo(() => {
    const handle = profile?.instagram || profile?.fullName || '';
    return handle.toLowerCase().replace(/[^a-z0-9a-zA-Z_-]/g, '') || '';
  }, [profile]);

  const storageKey = useMemo(() => {
    const cleanedEmail = (profile?.email || 'global').replace(/[^a-zA-Z0-9]/g, '_');
    return `trustlink_referrals_${cleanedEmail}`;
  }, [profile]);

  const referralLink = `https://trova.co/invite/${sellerHandle}`;

  // WhatsApp click trigger
  const whatsAppShareLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `I use Trova to accept secure escrow payments and eliminate buyer doubts. You should join and secure your boutique too! Register here: ${referralLink}`
  )}`;

  // Sync localReferrals when referralsData prop changes
  useEffect(() => {
    setLocalReferrals(referralsData);
  }, [referralsData]);

  // Compute Stats
  const stats = useMemo(() => {
    const activeCount = localReferrals.filter(ref => ref.status === 'Active').length;
    return {
      activeCount,
      totalCount: localReferrals.length
    };
  }, [localReferrals]);

  // Current badge metrics
  const mapTierToGrowthName = (tier: string) => {
    if (tier === 'Bronze' || tier === 'Copper') return 'Copper Merchant';
    if (tier === 'Silver') return 'Silver Merchant';
    if (tier === 'Gold') return 'Gold Merchant';
    if (tier === 'Pro' || tier === 'Elite') return 'Elite / Diamond Partner';
    return 'Growth Partner';
  };

  const badgeInfo = useMemo(() => {
    const active = stats.activeCount;
    if (active >= 10) {
      return {
        tier: 'Pro', // internal keep key string same to maintain SVG/routing compatibility without breaking props
        color: '#0284c7', // Sky-600
        shadowColor: 'rgba(56,189,248,0.4)',
        desc: 'Elite / Diamond Partner status active. Ultimate prestige growth indicators enabled.',
        nextThreshold: 10,
        nextTier: 'Max Rank',
        referralsNeeded: 0,
        unlockedPerk: 'Universal Seller Elite Badge and 24/7 dedicated support priority settlement channel access.'
      };
    } else if (active >= 5) {
      return {
        tier: 'Gold',
        color: '#ca8a04', // Yellow-600
        shadowColor: 'rgba(234,179,8,0.4)',
        desc: 'Gold status achieved. High-level status ribbon active.',
        nextThreshold: 10,
        nextTier: 'Pro',
        referralsNeeded: 10 - active,
        unlockedPerk: 'Top Seller banner and priority visibility on active storefront streams.'
      };
    } else if (active >= 3) {
      return {
        tier: 'Silver',
        color: '#71717a', // Zinc-500
        shadowColor: 'rgba(161,161,170,0.4)',
        desc: 'Silver status unlocked. Higher partnership milestones activated.',
        nextThreshold: 5,
        nextTier: 'Gold',
        referralsNeeded: 5 - active,
        unlockedPerk: 'Priority search result prominence in search indexing networks.'
      };
    } else if (active >= 1) {
      return {
        tier: 'Bronze',
        color: '#b45309', // Amber-700
        shadowColor: 'rgba(217,119,6,0.4)',
        desc: 'Copper status badge live on your growth timeline.',
        nextThreshold: 3,
        nextTier: 'Silver',
        referralsNeeded: 3 - active,
        unlockedPerk: 'Copper Badge added to boutique profile checkout links.'
      };
    } else {
      return {
        tier: 'None',
        color: '#71717a',
        shadowColor: 'rgba(113,113,122,0.2)',
        desc: 'Onboard and link additional merchants to unlock top selling tiers.',
        nextThreshold: 1,
        nextTier: 'Bronze',
        referralsNeeded: 1,
        unlockedPerk: 'Activate Copper status rank upon your first merchant signup.'
      };
    }
  }, [stats.activeCount]);

  // Compute next tier color
  const nextTierColor = useMemo(() => {
    const next = badgeInfo.nextTier;
    if (next === 'Bronze') return '#b45309';
    if (next === 'Silver') return '#71717a';
    if (next === 'Gold') return '#ca8a04';
    if (next === 'Pro') return '#0284c7';
    return '#0284c7';
  }, [badgeInfo.nextTier]);

  // Calculate percentage of progress dynamically
  const targetPercent = useMemo(() => {
    if (stats.activeCount >= 10) return 100;
    return (stats.activeCount / badgeInfo.nextThreshold) * 100;
  }, [stats.activeCount, badgeInfo.nextThreshold]);

  // Animate progress bar fill after delay
  useEffect(() => {
    setIsPageLoaded(true);
    const timer = setTimeout(() => {
      setProgressPercent(targetPercent);
    }, 400); // Trigger 400ms after component mounts to follow spring sequence
    return () => clearTimeout(timer);
  }, [targetPercent]);

  // Track and notify user of newly earned badge milestones
  useEffect(() => {
    const currentTier = badgeInfo.tier;
    if (currentTier === 'None') return;

    const notifiedKey = 'trustlink_last_notified_badge_tier';
    const lastNotified = localStorage.getItem(notifiedKey);

    if (currentTier !== lastNotified) {
      // It's a newly earned badge!
      let title = '';
      let message = '';
      
      if (currentTier === 'Bronze') {
        title = '🛡️ Trusted Merchant Earned!';
        message = 'Congratulations! You have earned the "Trusted Merchant" badge rank for sharing Trova safety with 1 active partner.';
      } else if (currentTier === 'Silver') {
        title = '🚀 Pro Seller Rank Unlocked!';
        message = 'Amazing! You have unlocked the "Pro Seller" tier for linking 3 active partners. Priority search ranking is now active!';
      } else if (currentTier === 'Gold') {
        title = '🌟 Top Seller Rank Unlocked!';
        message = 'Incredible! You have earned the "Top Seller" rank for linking 5 active partners. All your checkout links now show the premium Gold ribbon badge!';
      } else if (currentTier === 'Pro') {
        title = '👑 Elite Partner Milestone achieved!';
        message = 'Legendary status! You have achieved the "Elite Partner" rank for sharing Trova safety with 10+ partners. Special elite profile seal assigned!';
      }

      if (title && message) {
        // 1. Show dynamic in-app Toast notification
        success(`${title} - ${message}`);

        // 2. Add to central Notifications system
        try {
          const defaultSellerId = 'seller-1';
          const nowStr = new Date().toISOString();
          const newNotif = {
            id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            message: `${title} - ${message}`,
            textPayload: `${title} - ${message}`,
            read: false,
            date: nowStr,
            loggingTime: nowStr
          };

          // Save to seller notifications
          const sellerNotifsKey = `trustlink_notifications_${defaultSellerId}`;
          const currentNotifsStr = localStorage.getItem(sellerNotifsKey);
          let currentNotifs = currentNotifsStr ? JSON.parse(currentNotifsStr) : [];
          currentNotifs.unshift(newNotif);
          localStorage.setItem(sellerNotifsKey, JSON.stringify(currentNotifs));

          // Save to general notifications
          const generalNotifsKey = 'trustlink_notifications';
          const generalStr = localStorage.getItem(generalNotifsKey);
          let generalNotifs = generalStr ? JSON.parse(generalStr) : [];
          generalNotifs.unshift(newNotif);
          localStorage.setItem(generalNotifsKey, JSON.stringify(generalNotifs));

          // Dispatch event
          window.dispatchEvent(new CustomEvent('trustlink_notifications_update'));
        } catch (e) {
          console.error('Error saving badge notification', e);
        }
      }

      // Mark as notified to prevent repetitive triggers
      localStorage.setItem(notifiedKey, currentTier);
    }
  }, [badgeInfo.tier]);

  const handleSaveReferrals = async (updatedReferrals: any[]) => {
    setLocalReferrals(updatedReferrals);
    if (onReferralsUpdate) {
      onReferralsUpdate(updatedReferrals);
    }
  };

  const handleActivateReferral = async (index: number) => {
    const referral = localReferrals[index];
    if (referral?.id) {
      await updateReferralStatus(referral.id, 'Active');
    }
    const updated = localReferrals.map((ref, idx) => {
      if (idx === index) {
        return { ...ref, status: 'Active' as const };
      }
      return ref;
    });
    handleSaveReferrals(updated);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText?.(referralLink);
    setCopiedLink(true);
    setTimeout(() => {
      setCopiedLink(false);
    }, 2000);
  };

  // High Fidelity 3D Shield Vector Badge Renderer
  const renderBadgeSVG = (tier: 'Bronze' | 'Silver' | 'Gold' | 'Pro' | 'None', size = 120, hasGlow = true) => {
    const gradientId = `${tier.toLowerCase()}Gradient-${size}`;
    const colorMap = {
      Bronze: '#b45309', // Copper (Amber-700)
      Silver: '#71717a', // Silver (Zinc-500)
      Gold: '#ca8a04',   // Gold (Yellow-600)
      Pro: '#0284c7',    // Elite / Diamond (Sky-600)
      None: '#71717a'
    };
    const color = colorMap[tier];

    return (
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="block select-none overflow-visible"
        style={{
          filter: hasGlow ? `drop-shadow(0 6px 12px ${badgeInfo.shadowColor})` : 'none'
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            {tier === 'Bronze' && (
              <>
                <stop offset="0%" stopColor="#ffedd5" />
                <stop offset="30%" stopColor="#d97706" />
                <stop offset="70%" stopColor="#b45309" />
                <stop offset="100%" stopColor="#7c2d12" />
              </>
            )}
            {tier === 'Silver' && (
              <>
                <stop offset="0%" stopColor="#f4f4f5" />
                <stop offset="30%" stopColor="#a1a1aa" />
                <stop offset="70%" stopColor="#71717a" />
                <stop offset="100%" stopColor="#3f3f46" />
              </>
            )}
            {tier === 'Gold' && (
              <>
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="30%" stopColor="#eab308" />
                <stop offset="70%" stopColor="#ca8a04" />
                <stop offset="100%" stopColor="#854d0e" />
              </>
            )}
            {tier === 'Pro' && (
              <>
                <stop offset="0%" stopColor="#e0f2fe" />
                <stop offset="30%" stopColor="#38bdf8" />
                <stop offset="70%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0c4a6e" />
              </>
            )}
            {tier === 'None' && (
              <>
                <stop offset="0%" stopColor="#e4e4e7" />
                <stop offset="50%" stopColor="#71717a" />
                <stop offset="100%" stopColor="#27272a" />
              </>
            )}
          </linearGradient>

          <filter id="innerDepth" x="-10%" y="-10%" width="120%" height="120%">
            <feOffset dx="0" dy="2" />
            <feGaussianBlur stdDeviation="1.5" result="offset-blur" />
            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
            <feFlood floodColor="black" floodOpacity="0.4" result="color" />
            <feComposite operator="in" in="color" in2="inverse" result="shadow" />
            <feComposite operator="over" in="shadow" in2="SourceGraphic" />
          </filter>
        </defs>

        {/* 3D Crest Outer Frame */}
        <path
          d="M50,4 L90,16 L82,68 L50,94 L18,68 L10,16 Z"
          fill={`url(#${gradientId})`}
          stroke="#ffffff"
          strokeOpacity={tier === 'None' ? '0.15' : '0.4'}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Dark Offset Core Plate with Inner Depth Filter */}
        <path
          d="M50,11 L83,21 L76,64 L50,86 L24,64 L17,21 Z"
          fill="var(--bg)"
          fillOpacity="0.88"
          stroke={`url(#${gradientId})`}
          strokeWidth="1.2"
          strokeLinejoin="round"
          filter="url(#innerDepth)"
        />

        {/* Star highlights & Crest symbols */}
        <g transform="translate(50, 48)" className="pointer-events-none">
          {tier !== 'None' ? (
            <motion.path
              d="M-12,-4 L-4,4 L16,-16"
              fill="none"
              stroke={color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            />
          ) : (
            <path
              d="M-8,-8 L8,8 M8,-8 L-8,8"
              fill="none"
              stroke="#52525b"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          )}
        </g>
        
        {/* Intricate cyber safety guidelines */}
        <path
          d="M50,18 L76,26 L70,59 L50,76 L30,59 L24,26 Z"
          fill="none"
          stroke={color}
          strokeOpacity="0.25"
          strokeWidth="1"
          strokeDasharray="2, 2"
        />
      </svg>
    );
  };

  const getMetallicTierStyle = (tier: 'Bronze' | 'Silver' | 'Gold' | 'Pro' | 'None') => {
    switch (tier) {
      case 'Bronze': // Copper
        return {
          color: '#b45309',
          border: '1px solid #d97706',
          backgroundColor: 'rgba(217,119,6,0.06)'
        };
      case 'Silver': // Silver
        return {
          color: '#71717a',
          border: '1px solid #a1a1aa',
          backgroundColor: 'rgba(161,161,170,0.06)'
        };
      case 'Gold': // Gold
        return {
          color: '#ca8a04',
          border: '1px solid #eab308',
          backgroundColor: 'rgba(234,179,8,0.06)'
        };
      case 'Pro': // Elite / Diamond
        return {
          color: '#0284c7',
          border: '1px solid #38bdf8',
          backgroundColor: 'rgba(56,189,248,0.06)'
        };
      default:
        return {
          color: 'var(--text-muted)',
          border: '1px solid var(--border)',
          backgroundColor: 'var(--surface)'
        };
    }
  };

  const timelineBadges = [
    { name: 'Bronze' as const, displayName: 'Copper', req: 1, text: 'Requires 1 active referral', perk: 'Badge on your store link' },
    { name: 'Silver' as const, displayName: 'Silver', req: 3, text: 'Requires 3 active referrals', perk: 'Directory priority ranking' },
    { name: 'Gold' as const, displayName: 'Gold', req: 5, text: 'Requires 5 active referrals', perk: 'Checkout header ribbon' },
    { name: 'Pro' as const, displayName: 'Elite / Diamond', req: 10, text: 'Requires 10 active referrals', perk: 'Elite partnership seal' }
  ];

  const milestoneRewards = [
    {
      level: 'Bronze',
      displayName: 'Copper',
      count: 1,
      perk: 'Copper Emblem',
      desc: 'Display an official custom copper growth emblem directly on your public Trova link to instantly reinforce active partner authenticity.'
    },
    {
      level: 'Silver',
      displayName: 'Silver',
      count: 3,
      perk: 'Index Directory priority',
      desc: 'Climb list rankings instantly. Your storefront appears ahead of non-featured boutiques on Trova organic query streams.'
    },
    {
      level: 'Gold',
      displayName: 'Gold',
      count: 5,
      perk: 'Checkout Header Ribbon',
      desc: 'All secure escrow links generated under your boutique automatically display a beautiful gold escrow guarantee banner.'
    },
    {
      level: 'Pro',
      displayName: 'Elite / Diamond',
      count: 10,
      perk: 'Elite Partnership Seal',
      desc: 'Gain ultimate Elite / Diamond status with a glowing diamond-blue partnership badge, dedicated premium customer support, and instant settlements.'
    }
  ];

  return (
    <div 
      id="referrals-view-root" 
      className="w-full max-w-[1200px] mx-auto flex flex-col gap-8 text-left font-sans select-none animate-fade-in pb-16"
    >
      {/* Interactive Global Animation Keyframes Styles */}
      <style>{`
        @keyframes subtleScalePulse {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 16px rgba(16, 185, 129, 0.15));
          }
          50% {
            transform: scale(1.02);
            filter: drop-shadow(0 0 28px rgba(16, 185, 129, 0.35));
          }
        }
        .pulse-3d {
          animation: subtleScalePulse 3s ease-in-out infinite;
        }
        
        @keyframes autoMarquee {
          0% { transform: translateY(0); }
          100% { transform: translateY(-33.33%); }
        }
        .marquee-list {
          animation: autoMarquee 15s linear infinite;
        }
        .marquee-list:hover {
          animation-play-state: paused;
        }
        
        .glow-radial-aura {
          background: radial-gradient(circle, ${badgeInfo.color}15 0%, transparent 68%);
        }
      `}</style>

      {/* PAGE HEADER */}
      <div className="flex flex-col gap-1 text-left pb-1 border-b border-[var(--border)]">
        <h1 className="text-xl font-extrabold tracking-tight text-[var(--text-primary)] uppercase font-mono">
          Grow the Network. Earn Your Rank.
        </h1>
        <p className="text-xs text-[var(--text-muted)] font-medium font-sans">
          Invite outstanding merchants to Trova's secure payment infrastructure. Earn prestige badges, climb partnerships ranks, and secure premium storefront features.
        </p>
      </div>

      {/* SECTION 1 — THE HERO: YOUR CURRENT STATUS */}
      <div 
        style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
        className="relative border rounded-2xl p-6 md:p-8 overflow-hidden shadow-xl flex flex-col md:flex-row gap-8 items-center md:justify-between"
      >
        {/* Faint dynamic ambient radial gradient behind current badge to establish atmosphere */}
        <div className="absolute left-[3%] top-[5%] w-[320px] h-[320px] glow-radial-aura pointer-events-none rounded-full blur-3xl" />

        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 w-full md:flex-1 relative z-10">
          {/* Large dynamic 3D-styled SVG emblem */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            className="flex flex-col items-center shrink-0"
          >
            <div className="pulse-3d select-none">
              {renderBadgeSVG(badgeInfo.tier as any, 120, true)}
            </div>
            <span className="text-lg font-black tracking-tight mt-3 uppercase text-center" style={{ color: badgeInfo.color }}>
              {mapTierToGrowthName(badgeInfo.tier)}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-dim)] font-bold font-mono mt-0.5">
              Growth Milestone Rank
            </span>
          </motion.div>

          {/* Progress track to next level — Emotional epicenter */}
          <div className="flex-1 flex flex-col justify-center w-full text-center md:text-left">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-2 gap-1">
              <span className="text-md font-black tracking-tight" style={{ color: nextTierColor }}>
                Next Rank Target: {badgeInfo.nextTier ? mapTierToGrowthName(badgeInfo.nextTier) : 'Power Merchant Elite Max'}
              </span>
              <span className="text-xs font-mono font-bold text-[var(--text-dim)]">
                {stats.activeCount} <span className="font-normal">of</span> {badgeInfo.nextThreshold} <span className="text-[10px] uppercase font-bold tracking-widest text-[#10b981] bg-[#10b981]/10 px-1.5 py-0.5 rounded ml-1">Active</span>
              </span>
            </div>

            {/* Thick 20px progress bar */}
            <div className="w-full h-5 rounded-full bg-[var(--border)] relative overflow-hidden shadow-inner border border-[var(--border)] select-none">
              <div
                className="h-full rounded-full transition-all ease-out"
                style={{
                  width: `${progressPercent}%`,
                  backgroundImage: `linear-gradient(to right, ${badgeInfo.color}, ${nextTierColor})`,
                  transitionDuration: '1.2s'
                }}
              />
              {progressPercent > 0 && progressPercent < 100 && (
                <div 
                  className="absolute top-1/2 -mt-1.5 w-3 h-3 bg-white rounded-full animate-ping pointer-events-none"
                  style={{ left: `calc(${progressPercent}% - 6px)` }}
                />
              )}
            </div>

            <p className="text-[11.5px] mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {badgeInfo.unlockedPerk} {badgeInfo.nextTier && `Invite ${badgeInfo.referralsNeeded} more merchant${badgeInfo.referralsNeeded === 1 ? '' : 's'} to activate next rank.`}
            </p>
          </div>
        </div>

        {/* SECTION 1 - FAR RIGHT: MAGNIFICENT FLOATING ORB SYSTEM (MOTION DESIGN FEATURE) */}
        <div className="hidden lg:flex w-[260px] md:w-[300px] items-center justify-center relative h-[180px] shrink-0 overflow-hidden border-l border-zinc-850/60 pl-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="relative w-full h-full flex items-center justify-center"
          >
            {/* Pulsing ring tracks representing Escrow orbits */}
            <div className="absolute border border-dashed border-emerald-500/10 w-36 h-36 rounded-full animate-spin [animation-duration:22s]" />
            <div className="absolute border border-dashed border-zinc-800 w-48 h-48 rounded-full animate-spin [animation-duration:35s]" />

            {/* Central Node representing client shop */}
            <div className="absolute w-12 h-12 rounded-full border border-emerald-500 bg-zinc-950 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)] z-10">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>

            {/* Rotating orbits for active merchant references */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 9, ease: 'linear' }}
              className="absolute w-full h-full pointer-events-none"
            >
              {/* Referred Merchant Dot 1 */}
              <div className="absolute left-[8%] top-[15%] w-7 h-7 rounded-full bg-[var(--surface)] border border-amber-500/40 flex items-center justify-center pointer-events-auto cursor-help" title="Pending invite signup">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
              </div>
              {/* Referred Merchant Dot 2 */}
              <div className="absolute right-[12%] bottom-[12%] w-8 h-8 rounded-full bg-[var(--surface)] border border-emerald-500 flex items-center justify-center pointer-events-auto cursor-help" title="Active escrow trade">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </motion.div>

            {/* Float Handshake overlay as high designer accent */}
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="absolute top-1 right-2 w-[52px] h-[52px] rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] p-0.5 shadow-lg flex items-center justify-center"
            >
              <img 
                src="/referral_handshake.png" 
                alt="Partnership" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* SECTION 2 — THE BADGE JOURNEY (TIMELINE STYLER) */}
      <div 
        style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
        className="border rounded-2xl p-6 flex flex-col gap-6 text-left"
      >
        <div className="border-b pb-3" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
            Merchant Verification Pathway
          </h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Refer active sellers to progress smoothly across trust stages. Hover on future tiers to review unlocks.
          </p>
        </div>

        {/* Timelines Showcase (Responsive: horizontal on md, vertical stepper on mobile) */}
        <div id="badge-journey-timeline" className="relative flex flex-col md:flex-row md:justify-between items-stretch md:items-center py-6 gap-6 md:gap-2">
          
          {/* Horizontal lines behind timeline nodes (md and wider) */}
          <div className="absolute left-12 right-12 h-0.5 bg-[var(--border)] top-[52px] hidden md:block select-none pointer-events-none">
            {/* Dynamic line fills filled with emerald up to the current unlocked level */}
            <div 
              className="h-full bg-emerald-500 transition-all duration-1000" 
              style={{
                width: 
                  stats.activeCount >= 10 ? '100%' :
                  stats.activeCount >= 5 ? '66.6%' :
                  stats.activeCount >= 3 ? '33.3%' : '0%'
              }}
            />
          </div>

          {timelineBadges.map((badge, idx) => {
            const isUnlocked = stats.activeCount >= badge.req;
            const isCurrent = 
              (badge.name === 'Bronze' && stats.activeCount >= 1 && stats.activeCount < 3) ||
              (badge.name === 'Silver' && stats.activeCount >= 3 && stats.activeCount < 5) ||
              (badge.name === 'Gold' && stats.activeCount >= 5 && stats.activeCount < 10) ||
              (badge.name === 'Pro' && stats.activeCount >= 10);
            
            const isFuture = stats.activeCount < badge.req;
            const delayTime = 0.1 * (idx + 1);

            return (
              <motion.div
                key={badge.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: delayTime }}
                onMouseEnter={() => setHoveredTier(badge.name)}
                onMouseLeave={() => setHoveredTier(null)}
                className={`relative flex flex-row md:flex-col items-center gap-4 md:gap-2 md:flex-1 justify-start md:text-center transition-all duration-200 ${
                  isFuture ? 'opacity-45' : 'opacity-100'
                }`}
              >
                {/* Horizontal / Vertical divider connector line for mobile */}
                {idx > 0 && (
                  <div className="absolute w-0.5 h-12 bg-zinc-800 left-8 -top-12 md:hidden">
                    <div 
                      className={`w-full bg-emerald-500 transition-all ${
                        stats.activeCount >= badge.req ? 'h-full' : 'h-0'
                      }`} 
                    />
                  </div>
                )}

                {/* Badge SVG representation */}
                <div 
                  className={`relative p-2.5 rounded-2xl transition-transform duration-200 cursor-pointer border ${
                    isCurrent ? 'ring-2 ring-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)] scale-105' : ''
                  } hover:-translate-y-1`}
                  style={getMetallicTierStyle(badge.name)}
                >
                  {renderBadgeSVG(badge.name, 64, !isFuture)}
                </div>

                {/* Badge text values */}
                <div className="flex flex-col md:items-center text-left md:text-center mt-1">
                  <span className="text-sm font-black text-[var(--text-primary)] tracking-tight">
                    {badge.displayName}
                  </span>
                  <span className="text-[10.5px] font-mono leading-tight uppercase font-medium text-[var(--text-dim)]">
                    {badge.req} active
                  </span>
                  <span className="text-[10px] text-emerald-500 font-bold block md:hidden mt-0.5">
                    {badge.perk}
                  </span>
                </div>

                {/* Hover Tooltip displaying reward unlocks */}
                <AnimatePresence>
                  {hoveredTier === badge.name && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] p-3 rounded-xl shadow-2xl z-55 w-56 text-center select-none"
                    >
                      <h4 className="text-[11.5px] font-black uppercase text-emerald-400 mb-1">
                        🎁 {badge.name} Benefit
                      </h4>
                      <p className="text-[10px] leading-relaxed text-[var(--text-muted)] font-medium">
                        {badge.perk}.
                      </p>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 w-3 h-3 bg-[var(--surface)] border-r border-b border-[var(--border)] rotate-45" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

        </div>
      </div>

      {/* SECTION 3 — INVITATION HUB (DOUBLE COLUMNS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Input Field & WhatsApp link */}
        <div 
          style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
          className="border rounded-2xl p-6 flex flex-col gap-4 shadow-sm"
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-black uppercase text-emerald-400 flex items-center gap-2">
              <Share2 className="w-4 h-4" /> Sharing Link
            </span>
            <h3 className="text-md font-extrabold uppercase" style={{ color: 'var(--text-primary)' }}>
              Your Invitation Link
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Provide this custom tracking URL to referred store merchants. As they complete transactions safely, you level up.
            </p>
          </div>

          {/* Clean input box with subtle emerald left-border */}
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <div 
              className="flex-1 px-4 py-3 font-mono text-xs border rounded-xl select-all select-none border-l-2 border-l-emerald-500 overflow-hidden text-ellipsis whitespace-nowrap"
              style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
            >
              {referralLink}
            </div>

            <button
              onClick={handleCopyLink}
              className="px-5 py-3 bg-[var(--text-primary)] text-[var(--bg)] hover:scale-102 hover:shadow-lg hover:shadow-white/5 active:scale-98 transition-all font-sans font-black text-xs uppercase rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 stroke-[3px] text-emerald-500" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Social share button row */}
          <div className="border-t pt-4 border-[var(--border)] mt-1 flex flex-col gap-2">
            <a
              href={whatsAppShareLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-98"
              style={{ backgroundColor: '#25D366' }}
            >
              {/* Custom SVG WhatsApp Logo to align with "No external SVG libraries" rule */}
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.449 5.4 0 9.786-4.391 9.789-9.781.002-2.607-1.011-5.06-2.853-6.904a9.71 9.71 0 0 0-6.915-2.846c-5.4 0-9.787 4.391-9.791 9.781-.001 1.545.459 3.051 1.332 4.363l-.991 3.616 3.733-.968zm11.33-6.19c-.3-.15-1.771-.875-2.046-.975-.27-.1-.47-.15-.67.15-.2.3-.77.975-.95 1.175-.18.2-.35.225-.65.075-1.2-.6-1.85-1.05-2.5-2.175-.15-.25 0-.425.125-.575.125-.125.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.67-1.625-.925-2.225-.25-.6-.5-.525-.67-.525-.175-.001-.375-.001-.575-.001-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.075 2.9 1.225 3.1c.15.2 2.11 3.22 5.11 4.52.714.31 1.27.495 1.703.633.704.224 1.344.193 1.85.118.563-.083 1.771-.725 2.021-1.425.25-.7.25-1.3 1.83-1.5-.075-.2-.25-.3-.55-.45z"/>
              </svg>
              <span>Share on WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Right Column: Share Templates (stacked) */}
        <div className="flex flex-col gap-4">
          
          {/* Card 1: WhatsApp template card */}
          <div 
            style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
            className="border rounded-2xl p-4 flex flex-col gap-2 relative"
          >
            <div className="flex items-center justify-between w-full border-b border-[var(--border)] pb-2 select-none">
              <span className="text-[10.5px] font-black uppercase text-[#25D366] flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" /> WhatsApp Swipe Copy
              </span>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText?.(
                    `I use Trova to accept secure escrow payments and eliminate buyer doubts. You should join and secure your boutique too! Register here: ${referralLink}`
                  );
                  setCopiedTemplateIdx(1);
                  setTimeout(() => setCopiedTemplateIdx(null), 2000);
                }}
                className="text-[9.5px] font-black uppercase tracking-widest text-[#10b981] cursor-pointer"
              >
                {copiedTemplateIdx === 1 ? 'Copied✓' : 'Copy Text'}
              </button>
            </div>
            <div className="text-[11px] leading-relaxed p-2.5 rounded-lg border border-dashed font-mono bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] select-all">
              "I use Trova to accept secure escrow payments and eliminate buyer doubts. You should join and secure your boutique too! Register here: <span className="text-emerald-400 font-bold">{referralLink}</span>"
            </div>
          </div>

          {/* Card 2: LinkedIn template card */}
          <div 
            style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
            className="border rounded-2xl p-4 flex flex-col gap-2 relative"
          >
            <div className="flex items-center justify-between w-full border-b border-[var(--border)] pb-2 select-none">
              <span className="text-[10.5px] font-black uppercase text-[#0a66c2] flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#0a66c2]" /> LinkedIn Professional Swipe
              </span>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText?.(
                    `Escrow payments are redefining trust in digital commerce in West Africa. Learn how we eliminate fraud and collect instant verifications. Partner with Trova here: ${referralLink}`
                  );
                  setCopiedTemplateIdx(2);
                  setTimeout(() => setCopiedTemplateIdx(null), 2000);
                }}
                className="text-[9.5px] font-black uppercase tracking-widest text-emerald-400 cursor-pointer"
              >
                {copiedTemplateIdx === 2 ? 'Copied✓' : 'Copy Text'}
              </button>
            </div>
            <div className="text-[11px] leading-relaxed p-2.5 rounded-lg border border-dashed font-mono bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] select-all">
              "Escrow payments are redefining trust in digital commerce in West Africa. Learn how we eliminate fraud and collect instant verifications. Partner with Trova here: <span className="text-[#0a66c2] font-bold">{referralLink}</span>"
            </div>
          </div>

        </div>

      </div>

      {/* SECTION 4 — LIVE REFERRAL ACTIVITY (ENDLESS AUTO-SCROLL STREAM) */}
      <div 
        style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
        className="border rounded-2xl p-6 flex flex-col gap-4 shadow-sm"
      >
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">
              Live Escrow Streams
            </span>
            <h3 className="text-md font-extrabold uppercase" style={{ color: 'var(--text-primary)' }}>
              Your Referral Activity
            </h3>
          </div>
          
          {/* Active status indicator badge with pulse */}
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono text-emerald-400 font-extrabold uppercase">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Active Network
          </span>
        </div>

        {/* Scrollable ticker frame support endless flow loops */}
        <div className="w-full rounded-xl overflow-hidden relative border border-[var(--border)] bg-[var(--surface)] h-[230px]">
          
          <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-[var(--surface)] to-transparent z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[var(--surface)] to-transparent z-10 pointer-events-none" />

          {localReferrals.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)]">
              <Activity className="w-8 h-8 opacity-40 mb-2 text-[var(--text-muted)]" />
              <span className="text-xs font-bold font-mono">No Active Referrals Registered</span>
              <p className="text-[10px] text-[var(--text-muted)] leading-normal mt-1 max-w-xs">Invite sellers via your custom link above to start monitoring activation milestones.</p>
            </div>
          ) : (
            <div className="w-full overflow-hidden h-full">
              {/* Auto scrolling ticker wrap using infinite looped keyframe container */}
              <div 
                className={`flex flex-col marquee-list py-2 ${
                  localReferrals.length > 5 ? 'active-ticker-animation' : ''
                }`}
              >
                {/* Render sequence 3 times to produce true endless carousel loops */}
                {[...localReferrals, ...localReferrals, ...localReferrals].map((ref, idx) => {
                  const initialLetters = ref.storeName
                    ? ref.storeName.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()
                    : 'M';
                  
                  const isActive = ref.status === 'Active';

                  return (
                    <div 
                      key={`${ref.storeName}-${idx}`} 
                      className="flex items-center justify-between p-3.5 border-b border-[var(--border)] hover:bg-[var(--surface2)]/45 transition-colors flex-wrap gap-2 text-left"
                    >
                      {/* Avatar initials on the left */}
                      <div className="flex items-center gap-3">
                        <div 
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black font-mono shrink-0 select-none ${
                            isActive 
                              ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400' 
                              : 'bg-amber-500/5 border border-amber-500/20 text-amber-500'
                          }`}
                        >
                          {initialLetters}
                        </div>
                        
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold text-[var(--text-primary)] tracking-tight">
                            {ref.storeName}
                          </span>
                          <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1.5 leading-none mt-1">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <span className="font-semibold text-emerald-400">Escrow Partner Verified</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                <span>Sign-up pending trade verification</span>
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Right column: Status pills & activation buttons */}
                      <div className="flex items-center gap-3 text-right">
                        {isActive ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9.5px] uppercase font-bold text-[var(--text-muted)] font-mono hidden sm:inline">
                              {new Date(ref.signUpDate).toLocaleDateString()}
                            </span>
                            <span className="text-[9.5px] font-mono leading-tight bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black px-2 py-0.5 rounded uppercase">
                              Escrow Completed
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-[9.5px] uppercase font-bold text-[var(--text-muted)] font-mono hidden sm:inline">
                              {new Date(ref.signUpDate).toLocaleDateString()}
                            </span>
                            {/* Make original indexes interactive to mutate active state perfectly */}
                            {idx < localReferrals.length && (
                              <button
                                type="button"
                                onClick={() => handleActivateReferral(idx)}
                                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 cursor-pointer text-black text-[9.5px] font-bold uppercase rounded-lg transition-transform active:scale-95"
                              >
                                Process Trade
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* SECTION 5 — MILESTONE REWARDS SHOWCASE */}
      <div className="flex flex-col gap-4 text-left">
        <div className="border-b pb-2" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-xs font-black uppercase text-[var(--text-dim)] tracking-widest block font-mono">
            Milestone Vault
          </h3>
          <h2 className="text-md font-black uppercase" style={{ color: 'var(--text-primary)' }}>
            Exclusive Credentials & Storefront Rewards
          </h2>
        </div>

        {/* 2x2 Grid milestone catalog layout */}
        <div id="milestone-rewards-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4 select-none">
          {milestoneRewards.map((reward, idx) => {
            const hasUnlocked = stats.activeCount >= reward.count;
            const isCurrent = 
              (reward.level === 'Bronze' && stats.activeCount >= 1 && stats.activeCount < 3) ||
              (reward.level === 'Silver' && stats.activeCount >= 3 && stats.activeCount < 5) ||
              (reward.level === 'Gold' && stats.activeCount >= 5 && stats.activeCount < 10) ||
              (reward.level === 'Pro' && stats.activeCount >= 10);
            
            const isFuture = stats.activeCount < reward.count;

            return (
              <div 
                key={reward.level}
                className={`rounded-2xl p-5 border flex items-start gap-4 transition-all duration-300 relative overflow-hidden ${
                  isCurrent ? 'border-emerald-500 shadow-lg shadow-emerald-500/5' : 'border-[var(--border)]'
                } hover:border-emerald-500/60`} 
                style={{ backgroundColor: 'var(--surface2)' }}
              >
                {/* Left side Badge SVG miniature */}
                <div className="shrink-0 p-1 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                  {renderBadgeSVG(reward.level as any, 48, hasUnlocked)}
                </div>

                {/* Left side text information content */}
                <div className="flex-1 flex flex-col pt-0.5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">
                      {reward.displayName} Milestone
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase font-bold text-[#10b981] mb-1">
                    {reward.perk}
                  </span>
                  <p className="text-[11.5px] leading-relaxed text-[var(--text-muted)] font-medium font-sans">
                    {reward.desc}
                  </p>
                </div>

                {/* Right edge status markers: checkmark for past, lock for future */}
                <div className="absolute top-4 right-4 text-xs font-mono select-none">
                  {hasUnlocked ? (
                    <span className="p-1 px-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-extrabold text-[9px] uppercase tracking-wider block">
                      Unlocked✓
                    </span>
                  ) : (
                    <div className="flex items-center gap-1 text-[var(--text-muted)] border border-[var(--border)] bg-[var(--surface)] p-1.5 rounded-lg">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
