import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Instagram, 
  MessageSquare, 
  Twitter, 
  Globe, 
  ArrowRight, 
  ShieldCheck, 
  Copy, 
  Check, 
  ShoppingBag, 
  ChevronRight,
  ExternalLink,
  Star,
  Mail,
  Linkedin,
  Youtube,
  Music,
  Facebook,
  Send,
  AtSign,
  Github
} from 'lucide-react';
import { EscrowLink } from '../types';
import { createEscrowTransaction, mapCreatedTransactionToEscrowLink } from '../lib/transactions';
import { verifyBuyerAccess } from '../lib/services/transactions';
import { getPublicStorefrontByHandle, type PublicStorefrontPayload } from '../lib/services/storefront';
import { detectSocialPlatform } from '../utils/socialLinks';
import { incrementStorefrontView } from '../lib/services/analytics';
import { getCurrencySymbol, detectCurrencyFromTimezone } from '../lib/services/currency';
import VerifiedBadge from './VerifiedBadge';
import CountrySelect from './CountrySelect';
import { COUNTRIES, type CountryOption } from '../lib/data/countries';

interface StorefrontPublicProps {
  handle: string;
  onNavigateToLanding: () => void;
}

export default function StorefrontPublic({ handle, onNavigateToLanding }: StorefrontPublicProps) {
  // ---------------------------------------------------------------------------
  // PRODUCTION STOREFRONT
  // The ONLY input is the route parameter `handle`. All data is loaded from
  // Supabase via a single consolidated query (get_public_storefront_by_handle).
  // No dashboard state, no localStorage, and no seller-workspace props are
  // used to render this page.
  // ---------------------------------------------------------------------------
  const [store, setStore] = useState<PublicStorefrontPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSlowLoad, setIsSlowLoad] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [tooltipText, setTooltipText] = useState('Copy Account Number');
  const [productEscrowLoading, setProductEscrowLoading] = useState(false);
  const [productEscrowError, setProductEscrowError] = useState('');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [selectedItemForEscrow, setSelectedItemForEscrow] = useState<any>(null);
  const [buyerPhoneInput, setBuyerPhoneInput] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('+234');
  const [phoneError, setPhoneError] = useState('');
  const [escrowCooldown, setEscrowCooldown] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);

  const COOLDOWN_KEY = 'trova_escrow_cooldown_until';
  const COOLDOWN_MS = 30_000;

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('trustlink_store_')) {
        setReloadToken((t) => t + 1);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const tick = () => {
      const stored = localStorage.getItem(COOLDOWN_KEY);
      if (!stored) {
        setEscrowCooldown(0);
        return;
      }

      const until = Number(stored);
      const remaining = Math.max(0, Math.floor((until - Date.now()) / 1000));

      if (remaining <= 0) {
        localStorage.removeItem(COOLDOWN_KEY);
        setEscrowCooldown(0);
      } else {
        setEscrowCooldown(remaining);
      }
    };

    tick();
    interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, []);

  const startCooldown = () => {
    const until = Date.now() + COOLDOWN_MS;
    localStorage.setItem(COOLDOWN_KEY, String(until));
    setEscrowCooldown(Math.floor(COOLDOWN_MS / 1000));
  };

  const isOnCooldown = escrowCooldown > 0;

  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
    };
  }, [handle]);

  useEffect(() => {
    const cleanHandle = handle.trim().toLowerCase();

    setLoading(true);
    setLoadError(null);
    setIsSlowLoad(false);

    const slowTimeout = setTimeout(() => {
      if (!cancelledRef.current) {
        setIsSlowLoad(true);
      }
    }, 3000);

    getPublicStorefrontByHandle(cleanHandle)
      .then((data) => {
        if (cancelledRef.current) return;
        clearTimeout(slowTimeout);
        setStore(data);
        setLoading(false);
        setIsSlowLoad(false);
      })
      .catch((err) => {
        if (cancelledRef.current) return;
        clearTimeout(slowTimeout);
        console.error('[StorefrontPublic] load failed', err);
        setLoadError(err instanceof Error ? err.message : 'Unable to load storefront');
        setStore(null);
        setLoading(false);
        setIsSlowLoad(false);
      });

    return () => {
      clearTimeout(slowTimeout);
      cancelledRef.current = true;
    };
  }, [handle, reloadToken]);

  useEffect(() => {
    if (!store?.id) return;

    let sessionId = sessionStorage.getItem('storefront_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem('storefront_session_id', sessionId);
    }

    const referrer = typeof document !== 'undefined' ? document.referrer || null : null;
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent || null : null;

    incrementStorefrontView({
      storefrontId: store.id,
      sessionId,
      referrer,
      userAgent,
    }).catch((err) => {
      if (!cancelledRef.current) {
        console.warn('[StorefrontPublic] view tracking failed', err);
      }
    });
  }, [store?.id]);

  // Derived values (UI unchanged — sourced exclusively from `store`)
  const isKycVerified = store ? store.kycStatus === 'verified' : false;

  const activeCount = store ? store.activeReferrals : 0;

  const partnerTier = React.useMemo(() => {
    if (activeCount >= 10) return { name: 'Elite Partner', color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.1)' };
    if (activeCount >= 5) return { name: 'Top Seller', color: '#f97316', bgColor: 'rgba(249,115,22,0.1)' };
    if (activeCount >= 3) return { name: 'Pro Seller', color: '#4f46e5', bgColor: 'rgba(79,70,229,0.1)' };
    if (activeCount >= 1) return { name: 'Trusted Merchant', color: '#0d9488', bgColor: 'rgba(13,148,136,0.1)' };
    return null;
  }, [activeCount]);

  const ratingStats = store && store.ratingCount > 0
    ? { average: parseFloat(Number(store.ratingAverage).toFixed(1)), count: store.ratingCount }
    : null;

  const navigateToPath = (path: string) => {
    window.history.pushState(null, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  const handleCopyAccount = (accNum: string) => {
    if (!accNum) return;
    navigator.clipboard?.writeText(accNum).then(() => {
      setCopiedText(true);
      setTooltipText('Copied');
      setTimeout(() => {
        setCopiedText(false);
        setTooltipText('Copy Account Number');
      }, 2000);
    });
  };

  const getIconForUrl = (urlStr: string) => {
    const platform = detectSocialPlatform(urlStr);
    const iconMap: Record<string, any> = {
      Mail: Mail,
      MessageSquare: MessageSquare,
      Instagram: Instagram,
      Twitter: Twitter,
      Linkedin: Linkedin,
      Youtube: Youtube,
      Music: Music,
      Facebook: Facebook,
      Send: Send,
      AtSign: AtSign,
      Github: Github,
      Globe: Globe
    };
    const IconComponent = iconMap[platform.icon] || Globe;
    return <IconComponent className="w-4 h-4" style={{ color: platform.color }} />;
  };

  const formatAccountNumber = (acc: string) => {
    if (!acc) return '';
    const clean = acc.replace(/[^0-9]/g, '');
    const matched = clean.match(/.{1,4}/g);
    return matched ? matched.join(' ') : clean;
  };

  const handleProductEscrowBuy = async (item: any) => {
    if (isOnCooldown) return;
    setSelectedItemForEscrow(item);
    setBuyerPhoneInput('');
    setPhoneError('');
    setShowPhoneModal(true);
  };

  const handlePhoneSubmit = async () => {
    if (!selectedItemForEscrow) return;

    const nationalNumber = buyerPhoneInput.trim();
    const digitsOnly = nationalNumber.replace(/\D/g, '');
    const selectedCountry = COUNTRIES.find(c => c.code === selectedCountryCode) as CountryOption | undefined;
    const allowedLengths = selectedCountry?.length || [7, 8, 9, 10, 11, 12, 13, 14, 15];

    if (!digitsOnly) {
      setPhoneError('Please enter your phone number');
      return;
    }

    const isValidLength = allowedLengths.some(len => digitsOnly.length === len);
    if (!isValidLength) {
      const expected = allowedLengths.join(' or ');
      setPhoneError(`Number must be ${expected} digits for ${selectedCountry?.name || 'selected country'}`);
      return;
    }

    const fullPhone = `${selectedCountryCode}${digitsOnly}`;

    setPhoneError('');
    setProductEscrowLoading(true);
    setShowPhoneModal(false);

    try {
      const currencyCode = detectCurrencyFromTimezone();
      const currencySymbol = getCurrencySymbol(currencyCode);
      const created = await createEscrowTransaction({
        productName: selectedItemForEscrow.name,
        amount: Number(selectedItemForEscrow.price),
        shippingFee: 0,
        buyerPhone: fullPhone,
        description: selectedItemForEscrow.description || '',
        transactionType: 'physical',
        currencyCode,
        currencySymbol,
        idempotencyKey: `storefront-${handle}-${selectedItemForEscrow.id}-${Date.now()}`,
        sellerId: store?.sellerId,
        vendorName: store?.businessName || store?.displayName || undefined
      });

      const newTransaction: EscrowLink = {
        ...mapCreatedTransactionToEscrowLink(created.transaction),
        vendorName: store?.businessName || store?.displayName || created.transaction.sellerId,
        activeReferrals: activeCount,
        vendorPhoto: store?.profileImageUrl || ''
      };

      localStorage.setItem(newTransaction.id, JSON.stringify(newTransaction));
      localStorage.setItem(newTransaction.id.toUpperCase(), JSON.stringify(newTransaction));

      try {
        const savedList = localStorage.getItem('trustlink_escrow_links');
        const list = savedList ? JSON.parse(savedList) as EscrowLink[] : [];
        localStorage.setItem('trustlink_escrow_links', JSON.stringify([newTransaction, ...list]));
        window.dispatchEvent(new CustomEvent('trustlink_escrow_links_changed'));
      } catch (e) {}

      try {
        const verification = await verifyBuyerAccess(newTransaction.id, fullPhone);
        if (verification?.match && verification.buyerToken) {
          localStorage.setItem(`trustlink_buyer_verified_${newTransaction.id}`, JSON.stringify({
            verifiedAt: new Date().toISOString(),
            buyerToken: verification.buyerToken,
          }));
        }
      } catch (e) {
        console.error('[StorefrontPublic] Failed to pre-verify buyer:', e);
      }

      startCooldown();
      navigateToPath(`/pay/${newTransaction.id}`);
    } catch (error: any) {
      setProductEscrowError(error?.message || 'Unable to create escrow link. Please try again.');
    } finally {
      setProductEscrowLoading(false);
      setSelectedItemForEscrow(null);
    }
  };

  if (loading) {
    return (
      <div className={`bg-[#0d0d0f] text-zinc-150 min-h-screen font-sans flex flex-col select-none`}>
        {/* Skeleton Header */}
        <header className="border-b border-zinc-900/60 max-w-2xl mx-auto w-full px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-[14px] h-[16px] rounded bg-zinc-800 animate-pulse" />
            <div className="w-24 h-3 rounded bg-zinc-800 animate-pulse" />
          </div>
          <div className="w-28 h-3 rounded bg-zinc-800 animate-pulse" />
        </header>

        {/* Skeleton Main Content */}
        <main className="flex-1 max-w-lg mx-auto w-full px-5 py-8 flex flex-col gap-8">
          {/* Profile Skeleton */}
          <section className="text-center flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-zinc-800 animate-pulse" />
            <div className="w-48 h-6 rounded bg-zinc-800 animate-pulse" />
            <div className="w-32 h-3 rounded bg-zinc-800 animate-pulse" />
            <div className="flex gap-2 justify-center">
              <div className="w-24 h-5 rounded-full bg-zinc-800 animate-pulse" />
              <div className="w-28 h-5 rounded-full bg-zinc-800 animate-pulse" />
            </div>
            <div className="flex gap-1 justify-center">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-4 h-4 rounded bg-zinc-800 animate-pulse" />
              ))}
            </div>
          </section>

          {/* Bank Details Skeleton */}
          <section className="border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4">
            <div className="w-40 h-4 rounded bg-zinc-800 animate-pulse mx-auto" />
            <div className="flex flex-col gap-2">
              <div className="w-full h-10 rounded-lg bg-zinc-800 animate-pulse" />
              <div className="flex gap-2">
                <div className="flex-1 h-10 rounded-lg bg-zinc-800 animate-pulse" />
                <div className="flex-1 h-10 rounded-lg bg-zinc-800 animate-pulse" />
              </div>
            </div>
            <div className="w-full h-11 rounded-xl bg-zinc-800 animate-pulse" />
          </section>

          {/* Social Links Skeleton */}
          <section className="flex flex-col gap-3">
            <div className="w-32 h-4 rounded bg-zinc-800 animate-pulse mx-auto" />
            <div className="flex flex-wrap gap-2 justify-center">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-28 h-9 rounded-lg bg-zinc-800 animate-pulse" />
              ))}
            </div>
          </section>

          {/* Products Skeleton */}
          <section className="flex flex-col gap-4">
            <div className="w-36 h-4 rounded bg-zinc-800 animate-pulse mx-auto" />
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="w-full aspect-square bg-zinc-800 animate-pulse" />
                  <div className="p-3 flex flex-col gap-2">
                    <div className="w-full h-3 rounded bg-zinc-800 animate-pulse" />
                    <div className="w-16 h-3 rounded bg-zinc-800 animate-pulse" />
                    <div className="w-full h-8 rounded-lg bg-zinc-800 animate-pulse mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (!store) {
    return (
      <div className={`bg-[#0d0d0f] text-zinc-150 min-h-screen font-sans flex flex-col justify-center items-center text-center p-6 select-none animate-fade-in`}>
        <div className="mb-8 flex items-center gap-1.5 cursor-pointer opacity-85 hover:opacity-100 transition-opacity" onClick={onNavigateToLanding}>
          <svg viewBox="0 0 48 56" className="w-[15px] h-[17px] shrink-0" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="trovaMarkStoreNotFound" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: "#10b981", stopOpacity: 1}}/>
                <stop offset="100%" style={{stopColor: "#065f46", stopOpacity: 1}}/>
              </linearGradient>
            </defs>
            <path d="M4,2 L44,2 L44,38 L24,54 L4,38 Z" fill="url(#trovaMarkStoreNotFound)"/>
            <polyline points="12,14 24,36 36,14" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="14" x2="36" y2="14" stroke="white" strokeWidth="4" strokeLinecap="round"/>
          </svg>
          <span className="font-extrabold text-xs tracking-tight text-white font-sans lowercase flex items-center">
            trova<span className="text-emerald-500 font-bold uppercase tracking-wider text-[8px] ml-1">Escrow</span>
          </span>
        </div>

        <div className="max-w-md w-full bg-[#18181b] border border-[#27272a] rounded-3xl p-10 flex flex-col items-center gap-6 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-zinc-800/40 border border-[#27272a] flex items-center justify-center text-zinc-500">
            <ShieldCheck className="w-8 h-8 text-zinc-500" />
          </div>

          <div className="flex flex-col gap-3">
            <h1 className="text-xl font-bold text-white tracking-tight font-sans">Store Not Found</h1>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm px-2">
              This store link may have expired or the handle may have changed. If you received this link from a seller please ask them for their updated store link.
            </p>
            {loadError && (
              <p className="text-[10px] text-red-400 font-mono leading-relaxed max-w-sm px-2">
                Debug: {loadError}
              </p>
            )}
          </div>

          <div className="w-full pt-4 border-t border-zinc-900 mt-2">
            <button
              onClick={onNavigateToLanding}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-450 text-black text-xs font-black uppercase tracking-wider transition-colors active:scale-98 cursor-pointer"
            >
              Go to Trova Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const profile = {
    businessName: store?.businessName || store?.displayName || 'Store',
    username: handle,
    bio: store?.tagline || '',
    profilePhoto: store?.profileImageUrl || '',
    accentColor: store?.accentColor || '#10b981'
  };

  const bankDetails = {
    bankName: store?.bankName || '',
    accountNumber: store?.accountNumber || '',
    accountName: store?.accountName || '',
    accountType: store?.accountType || 'Savings'
  };

  const links = store?.links || [];
  const items = store?.items || [];

  const initials = (profile.businessName || 'Store')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className={`bg-[#0d0d0f] text-zinc-150 min-h-screen font-sans flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-300`}>
      
      {/* Standalone Minimal Header */}
      <header className="border-b border-zinc-900/60 max-w-2xl mx-auto w-full px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={onNavigateToLanding}>
          <svg viewBox="0 0 48 56" className="w-[14px] h-[16px] shrink-0" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="trovaMarkStoreMain" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: "#10b981", stopOpacity: 1}}/>
                <stop offset="100%" style={{stopColor: "#065f46", stopOpacity: 1}}/>
              </linearGradient>
            </defs>
            <path d="M4,2 L44,2 L44,38 L24,54 L4,38 Z" fill="url(#trovaMarkStoreMain)"/>
            <polyline points="12,14 24,36 36,14" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="14" x2="36" y2="14" stroke="white" strokeWidth="4" strokeLinecap="round"/>
          </svg>
          <span className="font-extrabold text-[12px] tracking-tight text-white font-sans lowercase flex items-center">
            trova<span className="text-emerald-500 font-bold uppercase tracking-wider text-[8px] ml-1">Escrow</span>
          </span>
        </div>
        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">PUBLIC SECURE STORE</span>
      </header>

      {/* Main Single Page Layout Container */}
      <main className="flex-1 max-w-lg mx-auto w-full px-5 py-8 flex flex-col gap-8 animate-fade-in">
        
        {/* SECTION 1 — STORE PROFILE */}
        <section className="text-center flex flex-col items-center gap-3">
          <div 
            className="w-20 h-20 rounded-full bg-[#18181b] flex items-center justify-center text-3xl font-black text-emerald-400 select-none overflow-hidden shadow-lg transition-all duration-300 hover:scale-[1.03]"
            style={{
              border: profile.profilePhoto ? `3px solid ${profile.accentColor}` : '2px solid #27272a'
            }}
          >
            {profile.profilePhoto ? (
              <img 
                src={profile.profilePhoto} 
                alt={profile.businessName} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            ) : (
              initials
            )}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center justify-center gap-1.5">
              <span>{profile.businessName || 'Business Store'}</span>
            </h1>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">@{profile.username || handle}</p>
            
            {/* Unified Badges Row (Below handle text and above rating stars) */}
            <div className="flex justify-center mt-2 w-full">
              <div className="flex flex-col [@media(min-width:480px)]:flex-row items-start [@media(min-width:480px)]:items-center gap-1 [@media(min-width:480px)]:gap-2 text-left">
                {/* 1. Identity Verified Badge */}
                {isKycVerified && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 select-none">
                    <VerifiedBadge size="sm" isKycVerified={true} type="kyc" title="Compliance Verified Seller" />
                    <span>Identity Verified</span>
                  </div>
                )}
                
                {/* 2. Referral/Achievement Badge */}
                {partnerTier && (
                  <div 
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border select-none"
                    style={{ 
                      color: partnerTier.color, 
                      backgroundColor: partnerTier.bgColor,
                      borderColor: `${partnerTier.color}25` 
                    }}
                  >
                    <VerifiedBadge type="growth" activeCount={activeCount} size="xs" />
                    <span>{partnerTier.name} Status</span>
                  </div>
                )}
              </div>
            </div>
            {ratingStats && (
              <div id="seller-rating-row" className="flex items-center justify-center gap-1.5 mt-[6px] select-none">
                <div className="flex items-center gap-[2px]">
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const isFull = ratingStats.average >= starValue;
                    const isHalf = ratingStats.average > starValue - 1 && ratingStats.average < starValue;
                    return (
                      <div 
                        key={starValue} 
                        className="relative flex items-center justify-center shrink-0" 
                        style={{ width: '16px', height: '16px' }}
                      >
                        <Star 
                          className="absolute inset-0" 
                          style={{ width: '16px', height: '16px', stroke: '#3f3f46', fill: 'transparent' }} 
                        />
                        {isFull && (
                          <Star 
                            className="absolute inset-0" 
                            style={{ width: '16px', height: '16px', stroke: '#f59e0b', fill: '#f59e0b' }} 
                          />
                        )}
                        {isHalf && (
                          <div 
                            className="absolute left-0 top-0 bottom-0 overflow-hidden" 
                            style={{ width: '50%' }}
                          >
                            <Star 
                              style={{ 
                                width: '16px', 
                                height: '16px', 
                                stroke: '#f59e0b', 
                                fill: '#f59e0b',
                                maxWidth: 'none'
                              }} 
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <span className="text-[13px] font-bold text-white font-sans ml-1 leading-none">
                  {ratingStats.average}
                </span>
                <span className="text-[11px] text-zinc-400 font-sans leading-none">
                  ({ratingStats.count} {ratingStats.count === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}
          </div>
          {profile.bio && (
            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed mt-1 font-medium italic">
              "{profile.bio}"
            </p>
          )}
        </section>

        {/* SECTION 2 — BANK PAYMENT CARD */}
        <section className="flex justify-center w-full">
          <div className="w-full max-w-[420px] h-[210px] rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#0f3460] p-6 relative overflow-hidden border border-[#27272a] flex flex-col justify-between shadow-2xl transition-transform hover:scale-[1.01] group">
            {/* Subtle top left ambient glow */}
            <div className="absolute -top-12 -left-12 w-32 h-32 blur-2xl rounded-full pointer-events-none" style={{ backgroundColor: `${profile.accentColor}15` }} />
            
            {/* Pattern micro chip replica texture overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent opacity-20 pointer-events-none" />

            {/* CARD TOP ROW */}
            <div className="flex items-start justify-between z-10 select-none">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-black tracking-widest text-[#a1a1aa] uppercase font-mono">
                  {bankDetails.bankName || 'OPAY'}
                </span>
                <div className="w-7.5 h-6 rounded bg-zinc-800/80 border border-zinc-700/30 flex items-center justify-center mt-1 outline-none">
                  <div className="w-3.5 h-3 border border-zinc-600/30 rounded-sm" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-white/90">
                <ShieldCheck className="w-5 h-5" style={{ color: profile.accentColor }} />
                <span className="text-[9.5px] font-black tracking-tighter uppercase font-mono">TROVA</span>
              </div>
            </div>

            {/* CARD ACCOUNT NUMBER (TAP TO COPY WITH TOOLTIP & GORGEOUS EMERALD FLICKER ACTIVE) */}
            {bankDetails.accountNumber ? (
              <div 
                onClick={() => handleCopyAccount(bankDetails.accountNumber)}
                className="my-3 z-10 cursor-pointer active:scale-95 transition-transform flex flex-col gap-1 inline-block self-start group/acc"
                title="Click to copy account details"
              >
                <div className={`font-mono text-xl sm:text-2xl font-bold tracking-widest transition-colors duration-300 flex items-center gap-2.5 ${copiedText ? '' : 'text-white'}`} style={copiedText ? { color: profile.accentColor } : {}}>
                  <span>{formatAccountNumber(bankDetails.accountNumber)}</span>
                  <Copy className={`w-3.5 h-3.5 opacity-40 group-hover/acc:opacity-100 transition-opacity ${copiedText ? 'opacity-100 animate-pulse' : ''}`} style={copiedText ? { color: profile.accentColor } : { color: 'white' }} />
                </div>
                <div className="flex items-center gap-1.5 min-h-[14px]">
                  <span className="text-[9px] text-zinc-400 font-mono tracking-wider font-semibold">
                    {tooltipText}
                  </span>
                  {copiedText && <Check className="w-3 h-3" style={{ color: profile.accentColor }} />}
                </div>
              </div>
            ) : (
              <div className="my-3 z-10 flex flex-col gap-1">
                <span className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-zinc-600">
                  **** **** **** ****
                </span>
                <div className="flex items-center gap-1.5 min-h-[14px]">
                  <span className="text-[9px] text-zinc-500 font-mono tracking-wider font-semibold">
                    Account details hidden
                  </span>
                </div>
              </div>
            )}

            {/* CARD HOLDER DETAILS */}
            <div className="flex items-end justify-between border-t border-zinc-800/50 pt-3 z-10 select-none">
              <div className="flex flex-col">
                <span className="text-[7.5px] text-zinc-400 uppercase tracking-widest font-mono">RECIPIENT NAME</span>
                <span className="text-xs font-bold text-white uppercase tracking-wide font-sans mt-0.5 truncate max-w-[210px]">
                  {bankDetails.accountName || 'STORE CONTRACT'}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[7.5px] text-zinc-400 uppercase tracking-widest font-mono">ACCOUNT TYPE</span>
                <span className="text-[9px] font-black tracking-wider font-mono mt-0.5 uppercase" style={{ color: profile.accentColor }}>
                  {bankDetails.accountType || 'Savings'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3 — SOCIAL AND CONTACT LINKS (DRIVEN BY AUTOMATIC ICON ASSIGNMENTS) */}
        {links.length > 0 && (
          <section className="flex flex-col gap-2.5 w-full">
            {links.map((lnk: any) => (
              <a
                key={lnk.id}
                href={lnk.url.startsWith('http') || lnk.url.startsWith('+') || /^[0-9]/.test(lnk.url) ? (lnk.url.startsWith('https://') || lnk.url.startsWith('http://') ? lnk.url : `https://${lnk.url}`) : `https://${lnk.url}`}
                target="_blank"
                rel="noreferrer"
                referrerPolicy="no-referrer"
                className="w-full px-5 py-4 rounded-xl bg-[#18181b] hover:bg-zinc-900 border border-[#27272a] text-xs font-bold text-zinc-300 hover:text-white flex items-center justify-between transition-all hover:border-zinc-700 active:scale-[0.99] group shadow-sm"
              >
                <div className="flex items-center gap-3.5">
                  {getIconForUrl(lnk.url)}
                  <span>{lnk.label || 'Visit link'}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-550 group-hover:text-emerald-400 transition-colors" />
              </a>
            ))}
          </section>
        )}

        {/* SECTION 4 — CATALOG ITEMS Grid */}
        {items.length > 0 && (
          <section className="flex flex-col gap-4 mt-2">
            <div className="flex items-center justify-between pl-1 border-b border-zinc-900 pb-2 mb-2 select-none">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#a1a1aa] font-mono">
                Products and Services ({items.length})
              </h2>
              <span className="text-[9px] text-[#a1a1aa] font-mono">SECURED PAYMENTS</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {items.map((prod: any) => (
                <div 
                  key={prod.id} 
                  className="bg-[#18181b] border border-[#27272a] rounded-2xl p-4 flex flex-col justify-between gap-4 hover:border-zinc-700 transition-all shadow-md group/card"
                >
                  <div className="flex flex-col gap-2">
                    {/* Product media area — always full-width with distinct dark background */}
                    <div className="-mx-4 -mt-4 mb-2 h-[200px] sm:h-[180px] overflow-hidden rounded-t-2xl border-b border-zinc-900 select-none relative">
                      {(prod.imageUrl || prod.photoUrl) && !failedImages[prod.id] ? (
                        <img 
                          src={prod.imageUrl || prod.photoUrl} 
                          alt={prod.name} 
                          className="w-full h-full object-cover group-hover/card:scale-[1.02] transition-transform duration-300"
                          referrerPolicy="no-referrer"
                          onError={() => setFailedImages(prev => ({ ...prev, [prod.id]: true }))}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 pt-3" style={{ backgroundColor: '#111113' }}>
                          <ShoppingBag className="w-7 h-7 text-zinc-600" strokeWidth={1.5} />
                        </div>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-zinc-100 text-sm leading-snug">{prod.name}</h3>
                    {prod.description && (
                      <p className="text-[11px] text-zinc-400 leading-relaxed font-sans line-clamp-2">
                        {prod.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3.5 border-t border-zinc-900/60 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] uppercase font-bold text-zinc-500 font-mono tracking-wider">SECURE PRICE</span>
                      <span className="font-mono text-zinc-100 font-bold text-sm">
                         {getCurrencySymbol(prod.currency || 'USD')}{Number(prod.price).toLocaleString()}
                      </span>
                    </div>
                    
                    {productEscrowError && (
                      <p className="text-[10.5px] text-red-400 leading-relaxed text-center">
                        {productEscrowError}
                      </p>
                    )}
                    
                    <button
                      onClick={() => handleProductEscrowBuy(prod)}
                      disabled={productEscrowLoading || isOnCooldown}
                      className={`w-full py-2.5 rounded-xl text-black text-[11px] font-black uppercase tracking-wider cursor-pointer text-center transition-all shadow-sm active:scale-95 ${
                        isOnCooldown
                          ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                          : 'bg-emerald-500 hover:bg-emerald-450 disabled:opacity-50'
                      }`}
                    >
                      {productEscrowLoading
                        ? 'Creating secure escrow...'
                        : isOnCooldown
                          ? `Wait ${escrowCooldown}s`
                          : 'Order via Escrow'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Buyer Phone Verification Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <div className="w-full max-w-md bg-[#18181b] border border-[#27272a] rounded-2xl p-6 sm:p-8 flex flex-col gap-5 shadow-2xl animate-fade-in">
            <div className="flex flex-col gap-1.5 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-base font-black text-white tracking-tight">Verify Your Identity</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Enter the phone number where you want to receive delivery updates, shipment tracking, and order notifications for this escrow.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-semibold font-mono uppercase tracking-wider text-zinc-500">
                Phone Number
              </label>
              <div className="flex gap-2">
                <CountrySelect
                  value={selectedCountryCode}
                  onChange={setSelectedCountryCode}
                />
                <input
                  type="tel"
                  value={buyerPhoneInput}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    setBuyerPhoneInput(digits);
                    setPhoneError('');
                  }}
                  placeholder="Enter phone number"
                  maxLength={15}
                  className="flex-1 bg-[#0d0d0f] border border-[#27272a] rounded-xl px-4 py-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                />
              </div>
              {phoneError && (
                <p className="text-[10px] text-red-400 font-medium">{phoneError}</p>
              )}
              <p className="text-[9px] text-zinc-600 leading-relaxed">
                Enter your national phone number. This will be used for SMS and WhatsApp delivery confirmations. We will never share it with the seller.
              </p>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => {
                  setShowPhoneModal(false);
                  setSelectedItemForEscrow(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-[#27272a] text-zinc-400 text-[11px] font-bold uppercase tracking-wider hover:bg-zinc-900 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handlePhoneSubmit}
                disabled={productEscrowLoading}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-450 disabled:opacity-50 disabled:cursor-not-allowed text-black text-[11px] font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95"
              >
                {productEscrowLoading ? 'Creating...' : 'Continue to Checkout'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5 — STANDALONE FOOTER */}
      <footer className="border-t border-zinc-900/80 bg-black/40 py-6 text-center flex flex-col items-center gap-2 select-none">
        <div className="flex items-center gap-1.5 text-zinc-500 text-[10px]">
          <ShieldCheck className="w-4 h-4 text-emerald-500/80" />
          <span className="font-medium text-zinc-400 font-sans uppercase">Payments secured by Trova Escrow</span>
        </div>
        <span className="text-[8.5px] font-mono text-zinc-650">© 2026 Trova Technologies. Ltd. Governance CBN Approved.</span>
      </footer>

    </div>
  );
}
