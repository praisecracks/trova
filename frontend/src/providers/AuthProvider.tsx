/**
 * AuthProvider.tsx
 * Owns ONLY session, profile, login, logout, session restoration, and auth loading state.
 * Must NEVER modify CSS, manipulate body classes, manage routing, or manage dashboard UI.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { signOutUser, getOrCreateSellerProfile, getCurrentProfile } from '../lib/auth';
import { getCurrentSellerProfile, type SellerProfile as SupabaseSellerProfile } from '../lib/services/seller';

interface Profile {
  fullName: string;
  email: string;
  phone: string;
  bio: string;
  sticker: string;
  avatarUrl: string;
  instagram: string;
  whatsapp: string;
  twitter: string;
  website: string;
  id?: string;
  profileId?: string;
  businessName?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  accountType?: string;
  kycStatus?: string;
  kyc_status?: string;
  kyc_rejection_reason?: string;
  kyc_submitted_at?: string;
  kyc_approved_at?: string;
  status?: string;
  createdAt?: string;
  joinDate?: string;
  kycTier?: number;
  role?: string;
  currency_code?: 'NGN' | 'USD';
  currency_symbol?: '₦' | '$';
  default_currency_code?: 'NGN' | 'USD';
  default_currency_symbol?: '₦' | '$';
  [key: string]: any;
}

interface AuthContextType {
  profile: Profile | null;
  userEmail: string;
  userName: string;
  userRole: 'vendor' | 'buyer';
  profileLoading: boolean;
  isAuthenticated: boolean;
  isVerified: boolean;
  loginSuccess: (details: {
    id?: string;
    name: string;
    email: string;
    role?: 'seller' | 'buyer' | 'admin';
    kycStatus?: string;
    currency_code?: 'NGN' | 'USD';
    currency_symbol?: '₦' | '$';
  }) => void;
  logout: () => void;
  updateProfile: (profile: Profile) => void;
  updateUserRole: (role: 'vendor' | 'buyer') => void;
  sellerId: string | null;
  authInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const defaultProfile = {
  fullName: '',
  email: '',
  phone: '',
  bio: '',
  sticker: '',
  avatarUrl: '',
  instagram: '',
  whatsapp: '',
  twitter: '',
  website: ''
};

const mapSellerProfileToAppProfile = (
  sellerProfile: SupabaseSellerProfile,
  existingProfile: Profile = defaultProfile
): Profile => ({
  ...defaultProfile,
  ...existingProfile,
  id: sellerProfile.id,
  profileId: sellerProfile.profileId,
  fullName: sellerProfile.displayName || existingProfile.fullName || '',
  businessName: sellerProfile.businessName || existingProfile.businessName || '',
  email: sellerProfile.email,
  phone: sellerProfile.phone || '',
  bio: sellerProfile.bio || '',
  avatarUrl: sellerProfile.avatarUrl || '',
  instagram: sellerProfile.instagramHandle || '',
  whatsapp: sellerProfile.whatsapp || '',
  twitter: sellerProfile.twitterHandle || '',
  website: sellerProfile.website || '',
  sticker: sellerProfile.sticker || '',
  contactPhone: sellerProfile.contactPhone || '',
  selectedBank: sellerProfile.selectedBank || '',
  bankName: sellerProfile.selectedBank || '',
  accountNumber: sellerProfile.accountNumber || '',
  accountName: sellerProfile.resolvedAccountName || '',
  accountType: '',
  resolvedAccountName: sellerProfile.resolvedAccountName || '',
  customBankName: sellerProfile.customBankName || '',
  customBankCountry: sellerProfile.customBankCountry || 'United States',
  customBankCurrency: sellerProfile.customBankCurrency || 'USD',
  kycStatus: sellerProfile.kycStatus,
  kyc_status: sellerProfile.kycStatus,
  kyc_rejection_reason: sellerProfile.kycRejectionReason || '',
  kyc_submitted_at: sellerProfile.kycSubmittedAt || '',
  kyc_approved_at: sellerProfile.kycApprovedAt || '',
  status: sellerProfile.status,
  createdAt: sellerProfile.createdAt,
  joinDate: sellerProfile.createdAt,
  kycTier: sellerProfile.kycStatus === 'verified' ? 2 : 1
});

const loadCachedProfileForSession = (sessionEmail: string): Profile | null => {
  try {
    const saved = localStorage.getItem('trustlink-profile');
    if (!saved) return null;
    const parsed = JSON.parse(saved) as Profile;
    return parsed.email?.toLowerCase() === sessionEmail.toLowerCase() ? parsed : null;
  } catch {
    return null;
  }
};

const persistProfileCache = (nextProfile: Profile) => {
  localStorage.setItem('trustlink-profile', JSON.stringify(nextProfile));
};

function withTimeout<T>(promise: Promise<T>, ms = 3000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ]);
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState<'vendor' | 'buyer'>('vendor');
  const [profileLoading, setProfileLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    const hydrateFromCache = (): Profile | null => {
      try {
        const saved = localStorage.getItem('trustlink-profile');
        if (!saved) return null;
        const parsed = JSON.parse(saved) as Profile;
        return parsed.email ? parsed : null;
      } catch {
        return null;
      }
    };

    const cached = hydrateFromCache();
    if (cached) {
      setProfile(cached);
      setUserName(cached.fullName || '');
      setUserEmail(cached.email);
      if (cached.id) setSellerId(cached.id);
      setIsAuthenticated(true);
      setProfileLoading(false);
      setAuthInitialized(true);
    }

    const refreshFromSupabase = async (email?: string) => {
      try {
        const sessionResult = await supabase.auth.getSession();
        const { data: { session } } = sessionResult;

        if (!session) {
          if (!cached) {
            setProfile(null);
            setUserEmail('');
            setUserName('');
            setIsAuthenticated(false);
            setProfileLoading(false);
            setAuthInitialized(true);
          }
          return;
        }

        let sellerProfile: any = null;
        try {
          sellerProfile = await withTimeout(getCurrentSellerProfile(session.user.id, session.user.email));
        } catch (e) {
          console.warn('getCurrentSellerProfile timed out or failed:', e);
        }

        if (sellerProfile) {
          const nextProfile = mapSellerProfileToAppProfile(sellerProfile, profile as Profile);
          setProfile(nextProfile);
          setUserName(nextProfile.fullName);
          setUserEmail(nextProfile.email);
          setSellerId(sellerProfile.id);
          setIsAuthenticated(true);
          persistProfileCache(nextProfile);
        } else {
          const cachedProfile = loadCachedProfileForSession(session.user.email || '');
          if (cachedProfile) {
            setProfile(cachedProfile);
            setUserName(cachedProfile.fullName);
            setUserEmail(cachedProfile.email);
            setIsAuthenticated(true);
          } else {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const result = await getOrCreateSellerProfile(user);
              if (result.success && result.profile) {
                const nextProfile = mapSellerProfileToAppProfile(result.profile);
                setProfile(nextProfile);
                setUserName(nextProfile.fullName);
                setUserEmail(nextProfile.email);
                setSellerId(result.profile.id);
                setIsAuthenticated(true);
                persistProfileCache(nextProfile);
              } else {
                setProfile(null);
                setUserEmail('');
                setUserName('');
                setIsAuthenticated(false);
              }
            }
          }
        }
      } catch (error) {
        console.error('Profile refresh error:', error);
        if (!cached) {
          setProfile(null);
          setUserEmail('');
          setUserName('');
          setIsAuthenticated(false);
        }
      } finally {
        setProfileLoading(false);
        setAuthInitialized(true);
      }
    };

    if (cached) {
      refreshFromSupabase(cached.email);
    } else {
      refreshFromSupabase();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setUserEmail('');
          setUserName('');
          setSellerId(null);
          setIsAuthenticated(false);
          setProfileLoading(false);
          setAuthInitialized(true);
        } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          if (session?.user) {
            let sellerProfile = await getCurrentSellerProfile(session.user.id, session.user.email);
            if (!sellerProfile) {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const result = await getOrCreateSellerProfile(user);
                if (result.success && result.profile) {
                  sellerProfile = result.profile;
                }
              }
            }
            if (sellerProfile) {
              const nextProfile = mapSellerProfileToAppProfile(sellerProfile, profile as Profile);
              setProfile(nextProfile);
              setUserName(nextProfile.fullName);
              setUserEmail(nextProfile.email);
              setSellerId(sellerProfile.id);
              setIsAuthenticated(true);
              persistProfileCache(nextProfile);
            } else {
              const cachedProfile = loadCachedProfileForSession(session.user.email || '');
              if (cachedProfile) {
                setProfile(cachedProfile);
                setUserName(cachedProfile.fullName);
                setUserEmail(cachedProfile.email);
                setIsAuthenticated(true);
              }
            }
            setProfileLoading(false);
            setAuthInitialized(true);
          }
        }
      }
    );

    // Listen for external profile changes
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('trustlink-profile');
        if (saved) {
          const parsed = JSON.parse(saved) as Profile;
          setProfile(parsed);
          setUserName(parsed.fullName || '');
          setUserEmail(parsed.email || '');
        }
      } catch {}
    };

    const handleSellerChange = () => {
      try {
        const saved = localStorage.getItem('trustlink-profile');
        if (saved) {
          const parsed = JSON.parse(saved) as Profile;
          setProfile(parsed);
        }
      } catch {}
    };

    const handleKYCStatusUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ status: string }>;
      if (customEvent.detail?.status) {
        setProfile(prev => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            kycStatus: customEvent.detail.status,
            kyc_status: customEvent.detail.status
          };
          persistProfileCache(updated);
          return updated;
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('trustlink_sellers_changed', handleSellerChange);
    window.addEventListener('trustlink_kyc_status_updated', handleKYCStatusUpdate);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('trustlink_sellers_changed', handleSellerChange);
      window.removeEventListener('trustlink_kyc_status_updated', handleKYCStatusUpdate);
    };
  }, []);

  const loginSuccess = (details: {
    id?: string;
    name: string;
    email: string;
    role?: 'seller' | 'buyer' | 'admin';
    kycStatus?: string;
    currency_code?: 'NGN' | 'USD';
    currency_symbol?: '₦' | '$';
  }) => {
    const role = details.role || 'seller';
    setUserName(details.name);
    setUserEmail(details.email);
    setUserRole(role === 'buyer' ? 'buyer' : 'vendor');
    setIsAuthenticated(true);

    const saved = localStorage.getItem('trustlink-profile');
    let existingProfile = {};
    if (saved) {
      try {
        existingProfile = JSON.parse(saved);
      } catch {}
    }

    const code = details.currency_code || (existingProfile as any).currency_code || (existingProfile as any).default_currency_code || 'NGN';
    const symbol = details.currency_symbol || (existingProfile as any).currency_symbol || (existingProfile as any).default_currency_symbol || '₦';
    const kycStatus = details.kycStatus || (existingProfile as any).kycStatus || (existingProfile as any).kyc_status || 'unverified';

    const newProfile = {
      ...profile,
      ...existingProfile,
      id: details.id || (existingProfile as any).id,
      fullName: details.name,
      email: details.email,
      role,
      kycStatus,
      kyc_status: kycStatus,
      currency_code: code,
      currency_symbol: symbol,
      default_currency_code: code,
      default_currency_symbol: symbol
    };

    setProfile(newProfile);
    persistProfileCache(newProfile);
  };

  const logout = async () => {
    try {
      await signOutUser();
    } catch {}

    // Clear all application state
    localStorage.removeItem('trustlink-profile');
    localStorage.removeItem('trustlink_escrow_links');
    localStorage.removeItem('trustlink_payouts');
    localStorage.removeItem('trustlink_transactions');
    localStorage.removeItem('trustlink_disputes');
    localStorage.removeItem('trustlink_sellers');
    localStorage.removeItem('trustlink_notifications');

    setProfile(null);
    setUserEmail('');
    setUserName('');
    setUserRole('vendor');
    setSellerId(null);
    setIsAuthenticated(false);

    // Theme state is managed centrally by ThemeProvider; nothing to clear here.
  };

  const updateProfile = (newProfile: Profile) => {
    setProfile(newProfile);
    setUserName(newProfile.fullName || '');
    setUserEmail(newProfile.email || '');
    persistProfileCache(newProfile);
  };

  const updateUserRole = (role: 'vendor' | 'buyer') => {
    setUserRole(role);
  };

  const isVerified = profile?.kycStatus === 'verified';

  return (
    <AuthContext.Provider value={{
      profile,
      userEmail,
      userName,
      userRole,
      profileLoading,
      isAuthenticated,
      isVerified,
      loginSuccess,
      logout,
      updateProfile,
      updateUserRole,
      sellerId,
      authInitialized
    }}>
      {children}
    </AuthContext.Provider>
  );
};
