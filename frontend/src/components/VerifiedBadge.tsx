import React, { useState, useEffect } from 'react';

interface VerifiedBadgeProps {
  className?: string; // Additional Tailwind utility styles
  size?: 'xs' | 'sm' | 'md' | 'lg'; // Sizing variation
  title?: string; // Tooltip payload
  activeCount?: number; // Optional direct control from synchronized properties
  type?: 'kyc' | 'growth'; // Whether this badge represents KYC clearance or Milestone referral levels
  isKycVerified?: boolean; // Direct flag if you want to bypass local state checks
}

/**
 * AUTHORITATIVE VERIFICATION & COMPLIANCE BADGING SYSTEM
 * Supports binary KYC clearance (Verified Merchant Badge)
 * AND decouple referral achievements into professional "Merchant Growth Tiers"
 */
export default function VerifiedBadge({
  className = '',
  size = 'md',
  title,
  activeCount: propActiveCount,
  type = 'kyc',
  isKycVerified
}: VerifiedBadgeProps) {
  // Listen to profile storage to trace live KYC status dynamically
  const [kycStatus, setKycStatus] = useState<'verified' | 'unverified' | 'pending' | 'rejected'>(() => {
    if (isKycVerified !== undefined) return isKycVerified ? 'verified' : 'unverified';
    try {
      const savedProfile = localStorage.getItem('trustlink-profile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        return parsed.kycStatus || 'unverified';
      }
    } catch (e) {}
    return 'unverified';
  });

  // Listen to local storage changes to keep referral levels updated in real-time if milestones are simulation-scrolled!
  const [internalActiveCount, setInternalActiveCount] = useState(() => {
    if (propActiveCount !== undefined) return propActiveCount;
    try {
      const override = localStorage.getItem('trustlink_referrals_override_active');
      if (override !== null) return parseInt(override, 10);
      
      const savedProfile = localStorage.getItem('trustlink-profile');
      let cleanedEmail = 'global';
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        if (parsedProfile?.email) {
          cleanedEmail = parsedProfile.email.replace(/[^a-zA-Z0-9]/g, '_');
        }
        if (typeof parsedProfile?.activeReferrals === 'number') {
          return parsedProfile.activeReferrals;
        }
      }

      const storageKey = `trustlink_referrals_${cleanedEmail}`;
      const saved = localStorage.getItem(storageKey) || localStorage.getItem('trustlink_referrals_sellerId');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.referrals) {
          return parsed.referrals.filter((ref: any) => ref.status === 'Active').length;
        }
      }
    } catch (e) {}
    return 2; // Default starting seed has 2 active referrals (Bronze/Top-Rated tier)
  });

  const activeCount = propActiveCount !== undefined ? propActiveCount : internalActiveCount;

  // React to reactive local storage events
  useEffect(() => {
    const handleStorage = () => {
      try {
        // Trace KYC Status changes
        const savedProfile = localStorage.getItem('trustlink-profile');
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          if (parsed.kycStatus) setKycStatus(parsed.kycStatus);
        }

        // Trace Referral milestone overrides
        if (propActiveCount === undefined) {
          const override = localStorage.getItem('trustlink_referrals_override_active');
          if (override !== null) {
            setInternalActiveCount(parseInt(override, 10));
            return;
          }

          if (savedProfile) {
            const parsedProfile = JSON.parse(savedProfile);
            let cleanedEmail = 'global';
            if (parsedProfile?.email) {
              cleanedEmail = parsedProfile.email.replace(/[^a-zA-Z0-9]/g, '_');
            }
            if (typeof parsedProfile?.activeReferrals === 'number') {
              setInternalActiveCount(parsedProfile.activeReferrals);
              return;
            }
            const storageKey = `trustlink_referrals_${cleanedEmail}`;
            const saved = localStorage.getItem(storageKey) || localStorage.getItem('trustlink_referrals_sellerId');
            if (saved) {
              const parsed = JSON.parse(saved);
              if (parsed?.referrals) {
                setInternalActiveCount(parsed.referrals.filter((ref: any) => ref.status === 'Active').length);
                return;
              }
            }
          }
        }
      } catch (e) {}
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('trustlink_sellers_changed', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('trustlink_sellers_changed', handleStorage);
    };
  }, [propActiveCount]);

  // Compute config parameters
  const badgeConfig = React.useMemo(() => {
    // If we want a KYC binary verified badge
    if (type === 'kyc') {
      const isVerified = isKycVerified !== undefined ? isKycVerified : (kycStatus === 'verified');
      if (isVerified) {
        return {
          color: '#10b981', // Emerald checked badge
          label: 'KYC Verified TrustLink Merchant',
          textStyle: 'text-emerald-400 drop-shadow-[0_2px_4px_rgba(16,185,129,0.25)]',
          showCheck: true
        };
      } else if (kycStatus === 'pending') {
        return {
          color: '#f59e0b', // Amber warning/pending
          label: 'Identity Manual Compliance Audit Queued',
          textStyle: 'text-amber-500 animate-pulse',
          showCheck: false,
          isPending: true
        };
      } else {
        // Return null/invisible or small gray badge
        return {
          color: '#4b5563',
          label: 'Unverified Merchant (Limits Active)',
          textStyle: 'text-zinc-500 opacity-40',
          showCheck: false,
          isHidden: true
        };
      }
    }

    // Otherwise, we are doing Referral milestone partnership medals (Merchant Growth level)
    if (activeCount >= 10) {
      return {
        color: '#8b5cf6', // Indigo-purple/violet
        label: 'Elite Partner Badge',
        textStyle: 'text-violet-400 drop-shadow-[0_2px_8px_rgba(139,92,246,0.35)]',
        showCheck: true
      };
    } else if (activeCount >= 5) {
      return {
        color: '#f97316', // Orange-amber
        label: 'Top Seller Badge',
        textStyle: 'text-orange-400 drop-shadow-[0_2px_8px_rgba(249,115,22,0.3)]',
        showCheck: true
      };
    } else if (activeCount >= 3) {
      return {
        color: '#4f46e5', // Indigo
        label: 'Pro Seller Badge',
        textStyle: 'text-indigo-400 drop-shadow-[0_2px_6px_rgba(79,70,229,0.25)]',
        showCheck: true
      };
    } else if (activeCount >= 1) {
      return {
        color: '#0d9488', // Teal
        label: 'Trusted Merchant Badge',
        textStyle: 'text-teal-400 drop-shadow-[0_2px_4px_rgba(13,148,136,0.2)]',
        showCheck: true
      };
    } else {
      return {
        color: '#4b5563',
        label: 'Growth Partner (No Badge)',
        textStyle: 'text-zinc-650 opacity-0',
        showCheck: false,
        isHidden: true // 0 active referrals: No badge
      };
    }
  }, [type, kycStatus, activeCount, isKycVerified]);

  if (badgeConfig.isHidden) {
    return null; // Don't crowd UI with unverified tags unless requested
  }

  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const selectedSize = sizeClasses[size];

  return (
    <svg
      id="compliance-verified-seal"
      className={`${selectedSize} ${className} ${badgeConfig.textStyle} shrink-0 select-none inline-block align-middle transform active:scale-95 transition-all duration-200`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title || badgeConfig.label}</title>
      {/* Premium Scalloped Seal Border and Fill */}
      {badgeConfig.isPending ? (
        <circle 
          cx="12" 
          cy="12" 
          r="10" 
          stroke={badgeConfig.color} 
          strokeWidth="2.5" 
          strokeDasharray="4 3" 
          fill="none"
        />
      ) : (
        <path
          d="M12 2C11.5 2 11 2.2 10.6 2.6L9.6 3.6L8.2 3.3C7.7 3.2 7.2 3.4 6.9 3.8L6.1 4.9H4.7C4.2 4.9 3.7 5.2 3.5 5.7L3 7L1.8 7.6C1.3 7.9 1.1 8.4 1.2 8.9L1.5 10.3L0.7 11.3C0.3 11.7 0.3 12.3 0.7 12.7L1.5 13.7L1.2 15.1C1.1 15.6 1.3 16.1 1.8 16.4L3 17L3.5 18.3C3.7 18.8 4.2 19.1 4.7 19.1H6.1L6.9 20.2C7.2 20.6 7.7 20.8 8.2 20.7L9.6 20.4L10.6 21.4C11 21.8 11.5 22 12 22C12.5 22 13 21.8 13.4 21.4L14.4 20.4L15.8 20.7C16.3 20.8 16.8 20.6 17.1 20.2L17.9 19.1H19.3C19.8 19.1 20.3 18.8 20.5 18.3L21 17L22.2 16.4C22.7 16.1 22.9 15.6 22.8 15.1L22.5 13.7L23.3 12.7C23.7 12.3 23.7 11.7 23.3 11.3L22.5 10.3L22.8 8.9C22.9 8.4 22.7 7.9 22.2 7.6L21 7L20.5 5.7C20.3 5.2 19.8 4.9 19.3 4.9H17.9L17.1 3.8C16.8 3.4 16.3 3.2 15.8 3.3L14.4 3.6L13.4 2.6C13 2.2 12.5 2 12 2Z"
          fill={badgeConfig.color}
        />
      )}
      {/* High-Contrast Centered Icon Symbol */}
      {badgeConfig.showCheck ? (
        <path
          d="M10.2 15.6C9.9 15.6 9.6 15.5 9.4 15.3L6.8 12.7C6.4 12.3 6.4 11.7 6.8 11.3C7.2 10.9 7.8 10.9 8.2 11.3L10.2 13.3L15.8 7.7C16.2 7.3 16.8 7.3 17.2 7.7C17.6 8.1 17.6 8.7 17.2 9.1L11 15.3C10.8 15.5 10.5 15.6 10.2 15.6Z"
          fill="#000000"
        />
      ) : badgeConfig.isPending ? (
        <circle cx="12" cy="12" r="2" fill={badgeConfig.color} className="animate-ping" />
      ) : (
        <path
          d="M12 16C12.5 16 13 15.5 13 15C13 14.5 12.5 14 12 14C11.5 14 11 14.5 11 15C11 15.5 11.5 16 12 16ZM12 6C11.4 6 11 6.4 11 7V12C11 12.6 11.4 13 12 13C12.6 13 13 12.6 13 12V7C13 6.4 12.6 6 12 6Z"
          fill={badgeConfig.color}
        />
      )}
    </svg>
  );
}
