import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { EscrowLink, Payout, ActiveTab } from './types';
import Sidebar from './components/Sidebar';
import TopNavbar from './components/TopNavbar';
import StorefrontProfile from './components/StorefrontProfile';
import CreateLinkModal from './components/dashboard/CreateLinkModal';
import GlobalKYCModal from './components/dashboard/GlobalKYCModal';
import VendorDashboard from './components/dashboard/DashboardPage';
import PayoutView from './components/PayoutView';
import SettingsView from './components/SettingsView';
import AppCenter from './components/AppCenter';
import AnalyticsView from './components/AnalyticsView';
import DisputesView from './components/DisputesView';
import NotificationsView from './components/NotificationsView';
import ReferralsView from './components/ReferralsView';
import DeletedHistory from './components/DeletedHistory';

import LandingPage from './components/LandingPage';
import WelcomeOverlay from './components/onboarding/WelcomeOverlay';
import AuthPage from './components/auth/AuthPage';
import InviteLanding from './components/InviteLanding';
import OnboardingFlow from './components/OnboardingFlow';
import HelpCenter from './components/HelpCenter';
import TrovaLoader from './components/common/TrovaLoader';

// Standalone public route components
import AdminDashboard from './components/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import StaffLogin from './components/auth/StaffLogin';
import BuyerTerminal from './components/BuyerTerminal';
import LegalPagePublic from './components/LegalPagePublic';
import NotFoundPage from './components/NotFoundPage';
import { useToast } from './components/ToastContext.tsx';
import { useTheme } from './providers/ThemeProvider';
import { useAuth } from './providers/AuthProvider';
import { getCurrentSellerId } from './data/localStorage';
import { createTransaction, updateTransactionStatus } from './lib/services/transactions';
import { createNotification } from './lib/services/notifications';
import { getStorefrontForSeller } from './lib/services/storefront';
import { buildPublicUrl } from './lib/siteConfig';
import { useEscrowLinks } from './hooks/useEscrowLinks';
import { usePayouts } from './hooks/usePayouts';
import { useReferrals } from './hooks/useReferrals';
import { useModals } from './hooks/useModals';
import {
  DAILY_UNVERIFIED_LIMIT,
  USD_UNVERIFIED_CAP,
  NGN_UNVERIFIED_CAP,
  getDailyUnverifiedLimit,
  getUsdUnverifiedCap,
  getNgnUnverifiedCap,
  validateDailyCreationLimit,
  validateUnverifiedAmountCap,
} from './lib/kycLimits';
import { PWASplashScreen } from './components/PWASplashScreen';
import { PWAPromptManager } from './components/PWAPromptManager';
import { sounds } from './utils/sounds';

import { 
  Copy,
  ExternalLink,
  CheckCircle,
  Search
} from 'lucide-react';

export default function App() {
  const toastContext = useToast();

  // Set up global KYC modal trigger event
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleOpenKYC = (e: Event) => {
        const customEvent = e as CustomEvent;
        setKycTriggerReason(customEvent.detail?.reason || "Identity verification setup required.");
        setIsKYCModalOpen(true);
      };
      
      window.addEventListener('open_kyc_modal_global', handleOpenKYC);
      return () => {
        window.removeEventListener('open_kyc_modal_global', handleOpenKYC);
      };
    }
  }, [toastContext]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('trova_mock_data_cleared') === 'true') return;

    const keysToRemove = new Set<string>([
      'trustlink_escrow_links',
      'trustlink_transactions'
    ]);

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key) continue;

      if (key.toUpperCase().startsWith('TL-')) {
        keysToRemove.add(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
    localStorage.setItem('trova_mock_data_cleared', 'true');
  }, []);

  // Offline queue: process pending escrow creations when back online
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const queueKey = 'trova_pending_escrow_queue';
    const processQueue = async () => {
      try {
        const raw = localStorage.getItem(queueKey);
        if (!raw) return;
        const queue = JSON.parse(raw) as any[];
        if (!Array.isArray(queue) || queue.length === 0) return;

        const remaining: any[] = [];
        for (const item of queue) {
          try {
            const { transaction: createdTransaction, error } = await createTransaction(
              item.sellerId,
              item.payload
            );
            if (error || !createdTransaction) {
              remaining.push(item);
            }
          } catch (e) {
            remaining.push(item);
          }
        }

        localStorage.setItem(queueKey, JSON.stringify(remaining));
        if (remaining.length === 0 && queue.length > 0) {
          toastContext.success('Offline escrow links synced');
        }
      } catch (e) {
        console.error('Failed to process offline escrow queue:', e);
      }
    };

    const handleOnline = () => {
      processQueue();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [toastContext]);

  // Helper to check if a route is unknown/404
  const isUnknownRoute = (path: string) => {
    const validPaths = [
      '/', '', '/index.html',
      '/signup', '/signin', '/login',
      '/onboarding',
      '/legal/privacy', '/legal/terms',
      '/admin'
    ];
    const validPathStarts = ['/pay/', '/track/', '/store/', '/admin', '/checkout/', '/invite/'];
    
    if (validPaths.includes(path)) return false;
    if (validPathStarts.some(prefix => path.startsWith(prefix))) return false;
    
    if (path.startsWith('/dashboard')) {
      const normalizedPath = path.replace(/\/$/, '');
      const validDashboardTabs = [
        '/dashboard', '/dashboard/analytics', '/dashboard/disputes', 
        '/dashboard/notifications', '/dashboard/referrals', '/dashboard/store', 
        '/dashboard/payouts', '/dashboard/onboarding', '/dashboard/settings', '/dashboard/console'
      ];
      if (validDashboardTabs.includes(normalizedPath)) return false;
    }
    
    return true;
  };

  // Top-level route state
  const [currentRoute, setCurrentRoute] = useState<'landing' | 'login' | 'signup' | 'onboarding' | 'app' | 'pay' | 'track' | 'privacy' | 'terms' | 'admin' | 'store' | 'invite' | '404'>(() => {
    const path = window.location.pathname;
    const validPaths = [
      '/', '', '/index.html',
      '/signup', '/signin', '/login',
      '/onboarding',
      '/legal/privacy', '/legal/terms',
      '/admin', '/dashboard'
    ];
    const validPathStarts = ['/pay/', '/track/', '/store/', '/admin', '/dashboard', '/invite/'];
    
    if (validPaths.includes(path)) {
      if (path === '/' || path === '' || path === '/index.html') return 'landing';
      if (path === '/signup') return 'signup';
      if (path === '/signin' || path === '/login') return 'login';
      if (path === '/onboarding') return 'app';
      if (path === '/legal/privacy') return 'privacy';
      if (path === '/legal/terms') return 'terms';
      if (path.startsWith('/admin')) return 'admin';
      if (path.startsWith('/dashboard')) return 'app';
    } else if (validPathStarts.some(prefix => path.startsWith(prefix))) {
      if (path.startsWith('/pay/')) return 'pay';
      if (path.startsWith('/track/')) return 'track';
      if (path.startsWith('/store/')) return 'store';
      if (path.startsWith('/admin')) return 'admin';
      if (path.startsWith('/dashboard')) return 'app';
      if (path.startsWith('/invite/')) return 'invite';
    }
    return '404';
  });
  const [routeVersion, setRouteVersion] = useState(0);
  const [settingsSubTab, setSettingsSubTab] = useState<'profile' | 'merchant' | 'developer' | null>(null);

  const [urlParamsTransactionId, setUrlParamsTransactionId] = useState<string>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/pay/')) {
      return path.split('/pay/')[1] || '';
    } else if (path.startsWith('/track/')) {
      return path.split('/track/')[1] || '';
    } else if (path.startsWith('/store/')) {
      return path.split('/store/')[1] || '';
    }
    return '';
  });
  
  const { theme, toggleTheme } = useTheme();
  const [currentStorefront, setCurrentStorefront] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('trustlink-storefront');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const auth = useAuth();
  const {
    escrowLinks,
    selectedLink,
    setSelectedLink,
    updateEscrowLinks,
    pendingDeliveries
  } = useEscrowLinks(auth.sellerId);

  const { payouts, setPayouts, updatePayouts } = usePayouts();
  const { referralsData, setReferralsData } = useReferrals(auth.sellerId);

  const location = useLocation();

  useEffect(() => {
    if (!auth.authInitialized) return;
    if (auth.profileLoading) return;
    
    const currentPath = window.location.pathname;
    
    if (!auth.isAuthenticated) {
      if (!isUnknownRoute(currentPath) && !currentPath.startsWith('/pay/') && !currentPath.startsWith('/track/') && !currentPath.startsWith('/store/') && !currentPath.startsWith('/checkout/')) {
        window.history.replaceState(null, '', '/');
        setCurrentRoute('landing');
      }
      return;
    }
    
    if (currentPath.startsWith('/admin') && auth.profile?.role !== 'admin') {
      window.history.replaceState(null, '', '/');
      setCurrentRoute('landing');
      return;
    }
    
    if (auth.profile) {
      if (!isUnknownRoute(currentPath) && !currentPath.startsWith('/store/') && !currentPath.startsWith('/pay/') && !currentPath.startsWith('/track/') && !currentPath.startsWith('/checkout/') && !currentPath.startsWith('/admin')) {
        if (currentPath === '/login' && auth.profile?.role === 'buyer') {
          return;
        }
        setCurrentRoute('app');
        if (currentPath === '/' || currentPath === '/signin' || currentPath === '/signup' || currentPath === '/login') {
          navigate('/dashboard');
        }
      }
      return;
    }
    
    if (!isUnknownRoute(currentPath) && !currentPath.startsWith('/store/') && !currentPath.startsWith('/pay/') && !currentPath.startsWith('/track/') && !currentPath.startsWith('/checkout/') && !currentPath.startsWith('/admin')) {
      window.history.replaceState(null, '', '/signin');
      setCurrentRoute('login');
    }
  }, [auth.isAuthenticated, auth.profileLoading, auth.profile, auth.userRole, auth.authInitialized]);

  useEffect(() => {
    if (!auth.isAuthenticated || !auth.profile || !auth.sellerId) return;

    const loadStorefront = async () => {
      try {
        const storefront = await getStorefrontForSeller(auth.sellerId);
        if (storefront) {
          setCurrentStorefront(storefront);
          try {
            localStorage.setItem('trustlink-storefront', JSON.stringify(storefront));
          } catch {}
        }
      } catch (e) {
        console.warn('Storefront load failed:', e);
      }
    };

    loadStorefront();
  }, [auth.isAuthenticated, auth.profile?.id, auth.sellerId]);


  useEffect(() => {
    const handleSyncData = () => {
      try {
        const savedProfile = localStorage.getItem('trustlink-profile');
        if (!savedProfile) return;
        const parsed = JSON.parse(savedProfile);
        if (!parsed || !parsed.email) return;
        const currentProfile = auth.profile;
        if (currentProfile && currentProfile.email === parsed.email) {
          auth.updateProfile(parsed);
        }
      } catch (e) {}
    };

    window.addEventListener('storage', handleSyncData);
    window.addEventListener('trustlink_sellers_changed', handleSyncData);

    return () => {
      window.removeEventListener('storage', handleSyncData);
      window.removeEventListener('trustlink_sellers_changed', handleSyncData);
    };
  }, []);

  // Real-time compliance monitoring: logs out restricted/frozen/suspended users automatically
  useEffect(() => {
    const checkSecurityStatus = () => {
      try {
        const savedProfile = localStorage.getItem('trustlink-profile');
        if (!savedProfile) return;
        const currentProfile = JSON.parse(savedProfile);
        const businessName = currentProfile.fullName || currentProfile.businessName;
        const frozenJSON = localStorage.getItem('trustlink_frozen_merchants');
        const frozenMerchants = frozenJSON ? JSON.parse(frozenJSON) : {};
        if (frozenMerchants[businessName]) {
          localStorage.removeItem('trustlink-profile');
          auth.logout();
          setCurrentRoute('landing');
          window.location.href = '/';
          alert("⚠️ Your business merchant profile has been SUSPENDED by the TrustLink administrative desk due to a flagged security violation. Active login session terminated.");
          return;
        }

        const sellersSaved = localStorage.getItem('trustlink_sellers');
        if (sellersSaved) {
          const sellers = JSON.parse(sellersSaved);
          const match = sellers.find((s: any) => s.id === getCurrentSellerId() || s.id === currentProfile.id || s.email?.toLowerCase() === currentProfile.email?.toLowerCase());
          if (match) {
            const matchKycStatus = match.kyc_status || match.kycStatus || 'unverified';
            if (
              matchKycStatus !== currentProfile.kycStatus || 
              matchKycStatus !== currentProfile.kyc_status || 
              match.kycTier !== currentProfile.kycTier ||
              match.kyc_rejection_reason !== currentProfile.kyc_rejection_reason
            ) {
              const updatedProfile = {
                ...currentProfile,
                kycStatus: matchKycStatus,
                kyc_status: matchKycStatus,
                kycTier: match.kycTier,
                kyc_rejection_reason: match.kyc_rejection_reason || ''
              };
              auth.updateProfile(updatedProfile);
              localStorage.setItem('trustlink-profile', JSON.stringify(updatedProfile));
              
              try {
                const sellersSaved = localStorage.getItem('trustlink_sellers');
                if (sellersSaved) {
                  const sellers = JSON.parse(sellersSaved);
                  const idx = sellers.findIndex((s: any) => s.email?.toLowerCase() === currentProfile.email?.toLowerCase());
                  if (idx >= 0) {
                    sellers[idx].kycStatus = matchKycStatus;
                    sellers[idx].kyc_status = matchKycStatus;
                    localStorage.setItem('trustlink_sellers', JSON.stringify(sellers));
                  }
                }
              } catch (e) {}
              
              window.dispatchEvent(new Event('storage'));
              window.dispatchEvent(new CustomEvent('trustlink_sellers_changed'));
              window.dispatchEvent(new CustomEvent('trustlink_kyc_status_updated', { detail: { status: matchKycStatus } }));
            }
          }
        }
      } catch (e) {}
    };

    const debouncedCheck = () => {
      clearTimeout((checkSecurityStatus as any)._timeout);
      (checkSecurityStatus as any)._timeout = setTimeout(checkSecurityStatus, 150);
    };

    checkSecurityStatus();
    window.addEventListener('storage', debouncedCheck);
    window.addEventListener('trustlink_sellers_changed', debouncedCheck);
    window.addEventListener('trustlink_kyc_status_updated', debouncedCheck);
    
    return () => {
      clearTimeout((checkSecurityStatus as any)._timeout);
      window.removeEventListener('storage', debouncedCheck);
      window.removeEventListener('trustlink_sellers_changed', debouncedCheck);
      window.removeEventListener('trustlink_kyc_status_updated', debouncedCheck);
    };
  }, []);

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [focusedDisputeId, setFocusedDisputeId] = useState<string | null>(null);

  const handleNavigateTab = (tab: ActiveTab | 'settings-bank', id?: string) => {
    if (tab === 'settings-bank') {
      setSettingsSubTab('merchant');
      window.location.hash = 'merchant'; // Set the hash before navigating
      navigate(getDashboardTabPath('settings'));
      setActiveTab('settings');
    } else {
      setSettingsSubTab(null);
      window.location.hash = ''; // Clear the hash when navigating away from settings
      navigate(getDashboardTabPath(tab));
      setActiveTab(tab);
      if (id) {
        setFocusedDisputeId(id);
      } else {
        setFocusedDisputeId(null);
      }
    }
  };

  const {
    isModalOpen,
    setIsModalOpen,
    isKYCModalOpen,
    setIsKYCModalOpen,
    kycTriggerReason,
    setKycTriggerReason
  } = useModals();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [linkSearchTerm, setLinkSearchTerm] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const getDashboardTabPath = (tab: ActiveTab | 'admin') => {
    if (tab === 'admin') {
      return '/admin';
    }
    switch (tab) {
      case 'analytics':
        return '/dashboard/analytics';
      case 'disputes':
        return '/dashboard/disputes';
      case 'notifications':
        return '/dashboard/notifications';
      case 'referrals':
        return '/dashboard/referrals';
      case 'storefront':
        return '/dashboard/store';
      case 'payouts':
        return '/dashboard/payouts';
      case 'onboarding-hub':
        return '/dashboard/onboarding';
      case 'deleted-history':
        return '/dashboard/deleted-history';
      case 'settings':
        return '/dashboard/settings';
      default:
        return '/dashboard';
    }
  };

  const getDashboardPathTab = (path: string) => {
    const normalizedPath = path.replace(/\/$/, '');
    switch (normalizedPath) {
      case '/dashboard':
        return 'dashboard';
      case '/dashboard/analytics':
        return 'analytics';
      case '/dashboard/disputes':
        return 'disputes';
      case '/dashboard/notifications':
        return 'notifications';
      case '/dashboard/referrals':
        return 'referrals';
      case '/dashboard/store':
        return 'storefront';
      case '/dashboard/payouts':
        return 'payouts';
      case '/dashboard/onboarding':
        return 'onboarding-hub';
      case '/dashboard/deleted-history':
        return 'deleted-history';
      case '/dashboard/settings':
        return 'settings';
      case '/dashboard/console':
        return 'console';
      default:
        return null;
    }
  };

  // Routing Dispatch Logic for direct URL access and address bar synchronization
  const handleURLRouting = () => {
    const path = window.location.pathname;
    
    const validPaths = [
      '/', '', '/index.html',
      '/signup', '/signin', '/login',
      '/onboarding',
      '/legal/privacy', '/legal/terms',
      '/admin'
    ];
    const validPathStarts = ['/pay/', '/track/', '/store/', '/admin', '/checkout/'];
    
    if (validPaths.includes(path)) {
      if (path === '/' || path === '' || path === '/index.html') {
        setCurrentRoute('landing');
      } else if (path === '/signup') {
        setCurrentRoute('signup');
      } else if (path === '/signin' || path === '/login') {
        setCurrentRoute('login');
      } else if (path === '/onboarding') {
        setCurrentRoute('app');
        navigate('/dashboard');
      } else if (path === '/legal/privacy') {
        setCurrentRoute('privacy');
      } else if (path === '/legal/terms') {
        setCurrentRoute('terms');
      } else if (path.startsWith('/admin')) {
        setCurrentRoute('admin');
      }
    } else if (path.startsWith('/dashboard')) {
      const dashboardTab = getDashboardPathTab(path);
      if (dashboardTab) {
        setCurrentRoute('app');
        setActiveTab(dashboardTab);
      } else {
        setCurrentRoute('404');
      }
    } else if (validPathStarts.some(prefix => path.startsWith(prefix))) {
      if (path.startsWith('/pay/')) {
        const parts = path.split('/pay/');
        if (parts[1]) {
          setUrlParamsTransactionId(parts[1]);
          setCurrentRoute('pay');
        } else {
          setCurrentRoute('404');
        }
      } else if (path.startsWith('/track/')) {
        const parts = path.split('/track/');
        if (parts[1]) {
          setUrlParamsTransactionId(parts[1]);
          setCurrentRoute('track');
        } else {
          setCurrentRoute('404');
        }
      } else if (path.startsWith('/store/')) {
        const parts = path.split('/store/');
        if (parts[1]) {
          setUrlParamsTransactionId(parts[1]);
          setCurrentRoute('store');
        } else {
          setCurrentRoute('404');
        }
      } else if (path.startsWith('/admin')) {
        setCurrentRoute('admin');
      }
    } else {
      setCurrentRoute('404');
    }
  };

  const navigate = (path: string) => {
    window.history.pushState(null, '', path);
    window.dispatchEvent(new Event('popstate'));
    handleURLRouting();
    setRouteVersion((version) => version + 1);
  };

  // Sync back & forward clicks with local routing state
  useEffect(() => {
    handleURLRouting();
    window.addEventListener('popstate', handleURLRouting);
    return () => {
      window.removeEventListener('popstate', handleURLRouting);
    };
  }, []);

  // Sync React Router location changes with custom router state
  useEffect(() => {
    if (!auth.authInitialized) return;
    handleURLRouting();
  }, [location.pathname, auth.authInitialized]);

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const activeDashboardTab = getDashboardPathTab(currentPath) || activeTab;

  // Light theme ONLY applies to seller dashboard ('app' route) and admin, NOT buyer pages ('pay', 'track') or public pages
  const isLightThemeActive = currentRoute === 'app' && theme === 'light';

  // Route-scoped body/html theme sync. The persisted theme is global, so the
  // ONLY safe place to attach it to <body>/<html> is here, gated by route.
  // Public / marketing / buyer routes NEVER get 'light-theme' on <body>, which
  // prevents them inheriting the seller dashboard's light theme. This also runs
  // on navigation and logout, cleaning up stale classes from prior routes.
  const bodyLightThemeActive = (currentRoute === 'app' || currentRoute === 'admin') && theme === 'light';
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;

    root.classList.remove('light-theme', 'dark-theme');
    body.classList.remove('light-theme', 'dark-theme');
    body.style.backgroundColor = '';

    if (bodyLightThemeActive) {
      root.classList.add('light-theme');
      body.classList.add('light-theme');
      body.style.backgroundColor = '#f4f4f5';
    }
  }, [bodyLightThemeActive, currentRoute, theme]);

  // Handle building new escrow agreement
  const handleCreateEscrowLink = (newLinkDetails: { 
    productName: string; 
    amount: number; 
    shippingFee: number; 
    buyerPhone: string; 
    description: string; 
    transactionType?: 'physical' | 'service';
    currencyCode?: 'NGN' | 'USD';
    currencySymbol?: '₦' | '$';
  }) => {
                const isVerified = auth.profile?.kycStatus === 'verified';
    
    if (!isVerified) {
      const todayString = new Date().toDateString();
      const createdToday = escrowLinks.filter(link => {
        const d = link.createdAt || link.created_at;
        if (!d) return false;
        return new Date(d).toDateString() === todayString;
      }).length;

      if (createdToday >= getDailyUnverifiedLimit()) {
        setKycTriggerReason("You have reached your daily unverified limit of 5 escrow creations. Complete secure identification to enable unlimited daily links.");
        setIsKYCModalOpen(true);
        return;
      }

      const amt = newLinkDetails.amount || 0;
      const isUsd = (newLinkDetails.currencyCode || auth.profile?.currency_code || 'NGN') === 'USD';
      if (isUsd && amt > getUsdUnverifiedCap()) {
        setKycTriggerReason(`Transactions above $500 are locked for unverified portfolios. complete your identity check to lift this barrier.`);
        setIsKYCModalOpen(true);
        return;
      } else if (!isUsd && amt > getNgnUnverifiedCap()) {
        setKycTriggerReason(`Transactions above ₦500,000 are locked for unverified portfolios. complete your identity check to lift this barrier.`);
        setIsKYCModalOpen(true);
        return;
      }
    }

    const chosenCode = newLinkDetails.currencyCode || auth.profile?.default_currency_code || auth.profile?.currency_code || 'NGN';
    const chosenSymbol = newLinkDetails.currencySymbol || auth.profile?.default_currency_symbol || auth.profile?.currency_symbol || '$';

    (async () => {
      if (!auth.sellerId) {
        return;
      }
      
      try {
        const { transaction: createdTransaction, error } = await createTransaction(
          auth.sellerId,
          {
            productName: newLinkDetails.productName,
            description: newLinkDetails.description,
            amount: newLinkDetails.amount,
            shippingFee: newLinkDetails.shippingFee,
            currencyCode: chosenCode,
            currencySymbol: chosenSymbol,
            transactionType: newLinkDetails.transactionType || 'physical',
            buyerPhone: newLinkDetails.buyerPhone,
            vendorName: auth.profile?.businessName || auth.profile?.fullName || ''
          }
        );

        if (error || !createdTransaction) {
          console.error('Failed to create transaction:', error);
          if (typeof navigator !== 'undefined' && !navigator.onLine) {
            const queueKey = 'trova_pending_escrow_queue';
            const payload = {
              sellerId: auth.sellerId,
              payload: {
                productName: newLinkDetails.productName,
                description: newLinkDetails.description,
                amount: newLinkDetails.amount,
                shippingFee: newLinkDetails.shippingFee,
                currencyCode: chosenCode,
                currencySymbol: chosenSymbol,
                transactionType: newLinkDetails.transactionType || 'physical',
                buyerPhone: newLinkDetails.buyerPhone,
                vendorName: auth.profile?.businessName || auth.profile?.fullName || ''
              }
            };
            const existing = JSON.parse(localStorage.getItem(queueKey) || '[]');
            existing.push(payload);
            localStorage.setItem(queueKey, JSON.stringify(existing));
            toastContext.info('Offline — escrow link queued for sync when back online');
          } else {
            toastContext.error(error || 'Unable to create escrow link. Please try again.');
          }
          return;
        }

        const newAgreement = {
          ...createdTransaction,
          vendorName: auth.profile?.businessName || auth.profile?.fullName || createdTransaction.vendorName
        };
        const nextLinks = [newAgreement, ...escrowLinks];
        updateEscrowLinks(nextLinks);
        setIsModalOpen(false);

        // Create notification in Supabase
        const authProfileId = auth.profile?.profileId || auth.profile?.id;
        if (authProfileId) {
          createNotification(
            authProfileId,
            `New Escrow agreement created: "${newLinkDetails.productName}". Share code ${createdTransaction.id} with client to pay.`
          );
        }
      } catch (error: any) {
        console.error('Escrow creation failed:', error);
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          const queueKey = 'trova_pending_escrow_queue';
          const payload = {
            sellerId: auth.sellerId,
            payload: {
              productName: newLinkDetails.productName,
              description: newLinkDetails.description,
              amount: newLinkDetails.amount,
              shippingFee: newLinkDetails.shippingFee,
              currencyCode: chosenCode,
              currencySymbol: chosenSymbol,
              transactionType: newLinkDetails.transactionType || 'physical',
              buyerPhone: newLinkDetails.buyerPhone,
              vendorName: auth.profile?.businessName || auth.profile?.fullName || ''
            }
          };
          const existing = JSON.parse(localStorage.getItem(queueKey) || '[]');
          existing.push(payload);
          localStorage.setItem(queueKey, JSON.stringify(existing));
          toastContext.info('Offline — escrow link queued for sync when back online');
        } else {
          toastContext.error(error?.message || 'Unable to create escrow link. Please try again.');
        }
      }
    })();
  };

  // Handle agreement state modification
  const handleUpdateStatus = async (linkId: string, newStatus: EscrowLink['status'], actorRole?: 'buyer' | 'seller' | 'admin', actorId?: string, buyerToken?: string) => {
    const updatedLinks = escrowLinks.map(link => {
      if (link.id === linkId) {
        const updatedLink = { ...link, status: newStatus };
        const symbolStr = link.currencySymbol || '$';
        
        // Setup real-time descriptive payload
        let textPayload = `Order reference #${linkId} status updated to ${newStatus.replace('_', ' ').toUpperCase()}.`;
        if (newStatus === 'deposited') {
          textPayload = `${symbolStr}${(link.amount + link.shippingFee).toLocaleString()} deposit secured for "${link.productName}". Code ${linkId} is locked.`;
        } else if (newStatus === 'shipped') {
          textPayload = `🚚 Carrier handoff confirmed! Link reference #${linkId} dispatched under secure transit tracker.`;
        } else if (newStatus === 'delivered') {
          textPayload = `📦 Order #${linkId} arrived at customer physical address. Inspection clock active!`;
        } else if (newStatus === 'funds_released') {
          textPayload = `🎉 Final release authorized! ${symbolStr}${(link.amount + link.shippingFee).toLocaleString()} escrow finalized for shoe order ${linkId}.`;
          
          // Web Audio API custom synthesized sound feedback
          if (link.status === 'disputed') {
            sounds.playDisputeResolved();
          } else {
            sounds.playReleaseFunds();
          }
        } else if (newStatus === 'disputed') {
          textPayload = `⚠️ Dispute Hold raised on order #${linkId} "${link.productName}". Escrow funds are frozen under staff arbitration.`;
        }

        // Create notification in Supabase
        const authProfileId = auth.profile?.profileId || auth.profile?.id;
        if (authProfileId) {
          createNotification(authProfileId, textPayload);
        }


        // Trigger payout sequence on delivered (completed payout)
        if (newStatus === 'delivered') {
          const settlementVal = link.amount + link.shippingFee;
          const storefrontBank = currentStorefront?.bankName || '';
          const accountBank = auth.profile?.bankName || auth.profile?.selectedBank || '';
          const generatedPayout: Payout = {
            id: "PO-" + crypto.randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase(),
            amount: settlementVal,
            bankName: storefrontBank || accountBank || 'Primary Bank',
            accountNumber: currentStorefront?.accountNumber || auth.profile?.accountNumber || '',
            status: "completed", 
            date: new Date().toISOString(),
            currencyCode: link.currencyCode,
            currencySymbol: link.currencySymbol
          };
          
          const nextPayouts = [generatedPayout, ...payouts];
          updatePayouts(nextPayouts);
        }

        // Trigger payout sequence on funds_released
        if (newStatus === 'funds_released') {
          const settlementVal = link.amount + link.shippingFee;
          const storefrontBank = currentStorefront?.bankName || '';
          const accountBank = auth.profile?.bankName || auth.profile?.selectedBank || '';
          const generatedPayout: Payout = {
            id: "PO-" + crypto.randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase(),
            amount: settlementVal,
            bankName: storefrontBank || accountBank || 'Primary Bank',
            accountNumber: currentStorefront?.accountNumber || auth.profile?.accountNumber || '',
            status: "processing", 
            date: new Date().toISOString(),
            currencyCode: link.currencyCode,
            currencySymbol: link.currencySymbol
          };
          
          const nextPayouts = [generatedPayout, ...payouts];
          updatePayouts(nextPayouts);

          // Resolve payout automatically in 5s
          setTimeout(() => {
            const savedP = localStorage.getItem('trustlink_payouts') || '[]';
            let currentList = nextPayouts;
            try {
              currentList = JSON.parse(savedP);
            } catch(e){}
            const processedList = currentList.map(p => {
              if (p.id === generatedPayout.id) {
                return { ...p, status: 'completed' as const };
              }
              return p;
            });
            updatePayouts(processedList);
          }, 5000);
        }

        return updatedLink;
      }
      return link;
    });

    updateEscrowLinks(updatedLinks);
    
    // Determine actor role for secure status update
    const resolvedActorRole = actorRole || (auth.userRole === 'vendor' || auth.sellerId ? 'seller' : auth.profile?.role === 'admin' ? 'admin' : 'buyer');
    
    // Update status in Supabase
    const result = await updateTransactionStatus(linkId, newStatus, resolvedActorRole as 'buyer' | 'seller' | 'admin', actorId || auth.sellerId || auth.profile?.id || undefined, buyerToken);
    if (!result.success) {
      console.error('Failed to sync status to Supabase:', result.error);
      // Don't show error to user, local state already updated
    }
  };

  // Trigger manual settling batch clearing
  const handleBatchSettlements = () => {
                const isVerified = auth.profile?.kycStatus === 'verified';
     
    if (!isVerified) {
      let isOverLimit = false;
      let limitValueMsg = '';
      
      const processingTransactions = payouts.filter(p => p.status === 'processing');
      for (const p of processingTransactions) {
        const amt = p.amount || 0;
        const isUsd = p.currencyCode === 'USD';
        
        if (isUsd && amt > getUsdUnverifiedCap()) {
          isOverLimit = true;
          limitValueMsg = `$${amt.toLocaleString()}`;
          break;
        } else if (!isUsd && amt > getNgnUnverifiedCap()) {
          isOverLimit = true;
          limitValueMsg = `₦${amt.toLocaleString()}`;
          break;
        }
      }
      
      if (isOverLimit) {
        setKycTriggerReason(`Batch settlement of ${limitValueMsg} exceeds unverified payouts limit of ₦${getNgnUnverifiedCap().toLocaleString()} / $${getUsdUnverifiedCap()}. Verify store identity to process payment.`);
        setIsKYCModalOpen(true);
        return;
      }
    }

    const updated = payouts.map(p => {
      if (p.status === 'processing') {
        return { ...p, status: 'completed' as const };
      }
      return p;
    });
    updatePayouts(updated);
  };

  const handleCopyShortLink = (linkId: string) => {
    setCopiedId(linkId);
    const dummyUrl = buildPublicUrl(`/pay/${linkId}`);
    navigator.clipboard?.writeText(dummyUrl);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Login handler
  const handleLoginSuccess = (details: {
    id?: string;
    name: string;
    email: string;
    role?: 'seller' | 'buyer' | 'admin';
    kycStatus?: string;
    currency_code?: 'NGN' | 'USD';
    currency_symbol?: '₦' | '$';
  }) => {
    auth.loginSuccess(details);
    
    const role = details.role || 'seller';
    
    if (role === 'admin') {
      setCurrentRoute('admin');
      navigate('/admin');
      return;
    }

    if (role === 'buyer') {
      setCurrentRoute('login');
      navigate('/login');
      return;
    }

    setCurrentRoute('app');
    navigate('/dashboard');
  };

  // Filter created links for the separate "Escrow Links" specialized tab
  const filteredSocialLinks = escrowLinks.filter(l => 
    l.productName.toLowerCase().includes(linkSearchTerm.toLowerCase()) || 
    l.id.toLowerCase().includes(linkSearchTerm.toLowerCase())
  );

  // ROUTING ENGINE DISPATCHER
  let renderedContent = null;

  if (location.pathname === '/legal/privacy') {
    renderedContent = (
      <LegalPagePublic type="privacy" />
    );
  } else if (location.pathname === '/legal/terms') {
    renderedContent = (
      <LegalPagePublic type="terms" />
    );
  } else if (currentRoute === '404') {
    renderedContent = (
      <NotFoundPage onGoHome={() => navigate('/')} />
    );
  } else if (currentRoute === 'landing') {
    renderedContent = (
      <LandingPage onNavigate={(dest: any) => {
        if (dest === 'signup') navigate('/signup');
        else if (dest === 'login') navigate('/login');
        else if (dest === 'onboarding') navigate('/dashboard');
        else if (dest === 'app') navigate('/dashboard');
        else if (dest === 'privacy') navigate('/legal/privacy');
        else if (dest === 'terms') navigate('/legal/terms');
        else if (dest === 'admin') navigate('/admin');
        else navigate('/');
      }} onSetRole={auth.updateUserRole} />
    );
   } else if (currentRoute === 'invite') {
    renderedContent = (
      <InviteLanding onNavigate={navigate} />
    );
  } else if (currentRoute === 'login' || currentRoute === 'signup') {
    const inviteHandle = typeof window !== 'undefined' ? sessionStorage.getItem('trova_referral_handle') || undefined : undefined;
    renderedContent = (
      <AuthPage onLoginSuccess={handleLoginSuccess} initialMode={currentRoute as 'login' | 'signup'} onNavigate={navigate} referrerHandle={inviteHandle} />
    );
  } else if (currentRoute === 'onboarding') {
    renderedContent = (
      <OnboardingFlow onComplete={() => navigate('/dashboard')} role={auth.userRole} onSetRole={auth.updateUserRole} userName={auth.userName} kycStatus={(auth.profile?.kycStatus as "rejected" | "pending" | "unverified" | "verified") || 'unverified'} />
    );
  } else if (currentRoute === 'admin') {
    renderedContent = (
      <ProtectedRoute requiredRole="admin">
        <div className={`selection:bg-emerald-500/30 selection:text-emerald-300 transition-colors duration-200 ${isLightThemeActive ? 'light-theme' : 'dark-theme'}`}>
          <AdminDashboard 
            onNavigateToLanding={() => navigate('/dashboard')}
            userName={auth.userName}
            userEmail={auth.userEmail}
            theme={theme}
            onThemeToggle={() => {
              toggleTheme();
            }}
            onLogout={() => {
              auth.logout();
              navigate('/');
            }}
          />
        </div>
      </ProtectedRoute>
    );
  }
  // Add staff login route (unlinked)
  if (window.location.pathname === '/staff/login') {
    renderedContent = <StaffLogin onNavigate={navigate} />;
  }

  if (auth.profileLoading) {
    return <TrovaLoader size="fullscreen" message="SECURE · FAST · TRUSTED" theme={theme} />;
  }

  if (!auth.isAuthenticated && currentRoute === 'app') {
    return <TrovaLoader size="fullscreen" message="SECURE · FAST · TRUSTED" theme={theme} />;
  }

  if (currentRoute === 'app' && !auth.profile) {
    return <TrovaLoader size="fullscreen" message="SECURE · FAST · TRUSTED" theme={theme} />;
  }

  if (renderedContent) {
    return (
      <>
        {renderedContent}
        <PWASplashScreen />
        <PWAPromptManager />
      </>
    );
  }

// ELSE RENDER AUTHENTICATED PORTAL WORKSPACE
   return (
     <div id="dashboard-app-container" className={`flex min-h-screen selection:bg-emerald-500/30 selection:text-emerald-300 transition-colors duration-200 ${isLightThemeActive ? 'light-theme bg-zinc-50 text-zinc-900' : 'dark-theme bg-black text-zinc-100'}`}>
      
       {currentRoute === 'app' && (
         <WelcomeOverlay sellerName={auth.profile?.fullName} />
       )}
      
{/* Sidebar navigation element with mobile attributes & exit features */}
        <Sidebar 
           activeTab={activeTab} 
           setActiveTab={(tab) => {
             setActiveTab(tab);
           }}
           onNavigateTab={(tab) => navigate(getDashboardTabPath(tab))}
           pendingDeliveriesCount={pendingDeliveries}
           isOpen={isMobileSidebarOpen}
           onClose={() => setIsMobileSidebarOpen(false)}
           onExitToLanding={() => navigate('/')}
           userName={auth.userName}
           userEmail={auth.userEmail}
           theme={theme}
         />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-h-screen w-full max-w-full min-w-0">
        
        {/* Sleek Top Bar with active API sync indicator and profile options */}
        <TopNavbar 
          activeTab={activeTab} 
          setActiveTab={(tab) => {
            setActiveTab(tab);
          }}
          onNavigateTab={(tab) => navigate(getDashboardTabPath(tab))}
          onMobileMenuToggle={() => setIsMobileSidebarOpen(true)}
          userName={auth.userName}
          userEmail={auth.userEmail}
          onLogout={() => {
            auth.logout();
            navigate('/');
          }}
          theme={theme}
          onThemeToggle={() => {
            toggleTheme();
          }}
          userProfile={auth.profile}
          onVerifyNowClick={() => {
            setKycTriggerReason("Verify your store instantly to lift the unverified transaction and daily creation thresholds.");
            setIsKYCModalOpen(true);
          }}
        />

        {/* Content canvas container */}
        <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 w-full max-w-full min-w-0">
          
          {/* Active Tab router */}
          {currentRoute === 'app' && currentPath === '/dashboard/console' && (
            <BuyerTerminal
              escrowLinks={escrowLinks}
              selectedLink={selectedLink}
              onLinkSelect={setSelectedLink}
              onUpdateStatus={handleUpdateStatus}
              onNavigateToDashboard={() => {
                navigate('/dashboard');
                setActiveTab('dashboard');
              }}
              isSeller={!!auth.sellerId}
            />
          )}

           {activeDashboardTab === 'dashboard' && (currentPath === '/dashboard' || currentPath === '/dashboard/') && (
            <VendorDashboard 
              escrowLinks={escrowLinks}
              onCreateLinkClick={() => setIsModalOpen(true)}
              onSelectBuyerCheckout={(link) => {
                setSelectedLink(link);
                navigate('/dashboard/console');
              }}
              onNavigateTab={handleNavigateTab}
              onUpdateStatus={handleUpdateStatus}
              profile={{
                displayName: auth.profile?.fullName,
                phone: auth.profile?.phone,
                bio: auth.profile?.bio,
                avatarUrl: auth.profile?.avatarUrl,
                businessName: auth.profile?.businessName,
              }}
              bankDetailsAdded={!!(auth.profile?.bankName && auth.profile?.accountNumber)}
              kycStatus={(auth.profile?.kycStatus as "rejected" | "pending" | "unverified" | "verified") || 'unverified'}
              storeItemCount={0}
              escrowLinkCount={escrowLinks?.length || 0}
              onTriggerKYC={() => {
                setKycTriggerReason("Verify your store instantly to lift the unverified transaction and daily creation thresholds.");
                setIsKYCModalOpen(true);
              }}
            />
          )}

          {activeDashboardTab === 'storefront' && (
            <StorefrontProfile 
              profile={auth.profile}
              isSellerLogged={true}
              sellerId={auth.sellerId}
              storefront={currentStorefront}
              onStorefrontUpdate={setCurrentStorefront}
              referralsData={referralsData}
              onGenerateEscrow={(details) => {
    const isVerified = auth.profile?.kycStatus === 'verified';
                if (!isVerified) {
                  const todayString = new Date().toDateString();
                  const createdToday = escrowLinks.filter(link => {
                    const d = link.createdAt || link.created_at;
                    if (!d) return false;
                    return new Date(d).toDateString() === todayString;
                  }).length;

                  if (createdToday >= getDailyUnverifiedLimit()) {
                    setKycTriggerReason("You have reached your daily unverified limit of 5 escrow creations. Complete secure identification to enable unlimited daily links.");
                    setIsKYCModalOpen(true);
                    return;
                  }

                  const amt = details.amount || 0;
                  const isUsd = ((details as any).currencyCode || auth.profile?.currency_code || 'NGN') === 'USD';
                  if (isUsd && amt > getUsdUnverifiedCap()) {
                    setKycTriggerReason(`Transactions above $500 are locked for unverified portfolios. Complete your identity check to lift this barrier.`);
                    setIsKYCModalOpen(true);
                    return;
                  } else if (!isUsd && amt > getNgnUnverifiedCap()) {
                    setKycTriggerReason(`Transactions above ₦500,000 are locked for unverified portfolios. Complete your identity check to lift this barrier.`);
                    setIsKYCModalOpen(true);
                    return;
                  }
                }

                handleCreateEscrowLink(details);
              }}
              onNavigateToTab={(tab) => {
                setActiveTab(tab);
              }}
            />
          )}

          {activeDashboardTab === 'escrow-links' && (
            <div className="flex flex-col gap-6 text-left">
              <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 w-full md:w-80">
                  <div className="relative w-full">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={linkSearchTerm}
                      onChange={(e) => setLinkSearchTerm(e.target.value)}
                      placeholder="Search shared escrow links..."
                      className="w-full bg-black border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/60 transition-all placeholder:text-zinc-650"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full md:w-auto px-4.5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold cursor-pointer transition-colors"
                >
                  + Generate Secure Link
                </button>
              </div>

              {copiedId && (
                <div className="bg-emerald-500 text-black px-4 py-2 text-xs font-bold rounded-md shadow-lg flex items-center gap-2 fixed bottom-6 right-6 z-50">
                  <CheckCircle className="w-4 h-4" />
                  <span>Copied secure payment url!</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredSocialLinks.map((link) => {
                  return (
                    <div 
                      key={link.id} 
                      className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all flex flex-col justify-between gap-5 relative group"
                    >
                      <div>
                        {/* Title & Status */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-400 group-hover:underline">{link.id}</span>
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold ${
                            link.status === 'funds_released' ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' :
                            link.status === 'disputed' ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
                            link.status === 'pending_deposit' ? 'bg-zinc-950 border border-zinc-800 text-zinc-500' :
                            'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                          }`}>
                            {link.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>

                        {/* Title details */}
                        <h4 className="font-bold text-zinc-100 text-sm mt-3 leading-snug">{link.productName}</h4>
                        <span className="text-[10px] text-zinc-505 font-mono mt-1 block">To: {link.buyerPhone}</span>
                      </div>

                      <div className="flex flex-col gap-3 pt-2.5 border-t border-zinc-800">
                        {/* Pricing details */}
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-400">Escrow Secured Value:</span>
                          <span className="font-mono font-bold text-white">₦{(link.amount + link.shippingFee).toLocaleString()}</span>
                        </div>

                        {/* Link share options */}
                        <div className="flex gap-2.5 mt-2">
                          <button
                            onClick={() => handleCopyShortLink(link.id)}
                            className="flex-1 py-1.5 px-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-[10px] rounded font-bold text-zinc-300 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                          >
                            <Copy className="w-3 h-3 text-zinc-450" />
                            <span>{copiedId === link.id ? 'Copied URL!' : 'Copy Link'}</span>
                          </button>
                          
                          <button
                            onClick={() => navigate(`/pay/${link.id}`)}
                            className="py-1.5 px-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-[10px] rounded font-extrabold text-emerald-400 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                          >
                            <ExternalLink className="w-3 h-3 text-emerald-400" />
                            <span>Open Payment Link</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeDashboardTab === 'analytics' && (
            <AnalyticsView escrowLinks={escrowLinks} sellerId={auth.sellerId} />
          )}

          {activeDashboardTab === 'disputes' && (
            <DisputesView 
              escrowLinks={escrowLinks} 
              onUpdateStatus={handleUpdateStatus}
              focusedDisputeId={focusedDisputeId || undefined}
              clearFocusedDisputeId={() => setFocusedDisputeId(null)}
            />
          )}

{activeDashboardTab === 'notifications' && (
             <NotificationsView profileId={auth.profile?.profileId || auth.profile?.id} />
           )}

           {activeDashboardTab === 'referrals' && (
             <ReferralsView 
               sellerId={auth.sellerId}
               referralsData={referralsData}
               onReferralsUpdate={setReferralsData}
             />
           )}

          {activeDashboardTab === 'payouts' && (
            <PayoutView 
              payouts={payouts} 
              onTriggerPayout={handleBatchSettlements}
              canTriggerPayout={payouts.some(p => p.status === 'processing')}
            />
          )}
          
           {activeDashboardTab === 'settings' && (
             <SettingsView
               profile={auth.profile}
               onProfileUpdate={auth.updateProfile}
               onDeleteAccount={() => {
                 localStorage.removeItem('trustlink-profile');
                 localStorage.removeItem('trustlink_escrow_links');
                 localStorage.removeItem('trustlink_payouts');
                 localStorage.removeItem('trustlink_transactions');
                 localStorage.removeItem('trustlink_disputes');
                 localStorage.removeItem('trustlink_sellers');
                 localStorage.removeItem('trustlink_notifications');
                 localStorage.removeItem('trustlink_notifications_update');
                 
                 updateEscrowLinks([]);
                 updatePayouts([]);
                 
                 auth.logout();
                 setCurrentRoute('landing');
                 alert('Your Trova merchant account has been permanently and securely deleted.');
               }}
               onTriggerKYC={() => {
                 setKycTriggerReason("Upgrade your boutique instantly to lift unverified transaction, escrow, and payout limits.");
                 setIsKYCModalOpen(true);
               }}
               defaultSubTab={settingsSubTab}
             />
           )}

           {activeDashboardTab === 'deleted-history' && (
             <DeletedHistory sellerId={auth.sellerId} />
           )}

           {activeDashboardTab === 'onboarding-hub' && (
             <AppCenter />
           )}

          {activeDashboardTab === 'help' && (
            <HelpCenter />
          )}

        </main>
      </div>

{/* Escrow Link Generator Modal Overlay */}
       {isModalOpen && (
         <CreateLinkModal 
           onClose={() => setIsModalOpen(false)}
           onCreate={handleCreateEscrowLink}
           theme={theme}
         />
       )}

      {/* Dynamic Multi-National KYC Verification modal */}
        {isKYCModalOpen && (
          <GlobalKYCModal 
            onClose={() => setIsKYCModalOpen(false)}
            triggerReason={kycTriggerReason}
            theme={theme}
            onVerified={(status, details) => {
             const isPending = status === 'pending';
             let baseProfile = auth.profile;
             try {
               const saved = localStorage.getItem('trustlink-profile');
               if (saved) baseProfile = JSON.parse(saved);
             } catch (e) {}
             const updatedProfile = {
               ...baseProfile,
               kycTier: isPending ? 1 : 2,
               kycStatus: isPending ? "pending" : "verified",
               kyc_status: isPending ? "pending" : "verified",
               ...(details || {})
             };
             auth.updateProfile(updatedProfile);
             setIsKYCModalOpen(false);
           }}
         />
       )}

      {/* PWA Enhancements */}
      <PWASplashScreen />
      <PWAPromptManager />

    </div>
  );
}
