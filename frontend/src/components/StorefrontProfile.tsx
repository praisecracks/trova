import React, { useState, useEffect, useRef, useCallback } from 'react';
import ConfirmationModal, { ConfirmationModalType } from './ConfirmationModal';
import { 
  Instagram, 
  MessageSquare,
  CheckCircle2, 
  ShoppingBag, 
  ArrowRight,
  Twitter,
  Globe,
  Share2,
  ShieldCheck,
  Plus,
  Trash2,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Edit2,
  Copy,
  Check,
  User,
  CreditCard,
  Link,
  Tag,
  UploadCloud,
  Image as ImageIcon,
  Calculator,
  Mail,
  Linkedin,
  Youtube,
  Music,
  Facebook,
  Send,
  AtSign,
  Github,
  Wallet,
  Landmark,
  Building2,
  Smartphone,
  PenLine
} from 'lucide-react';
import { EscrowLink } from '../types';
import TransactionFeeCalculator from './TransactionFeeCalculator';
import { useToast } from './ToastContext';
import { createOrUpdateStorefront, Storefront } from '../lib/services/storefront';
import { detectSocialPlatform, normalizeSocialUrl, type SocialLinkInfo } from '../utils/socialLinks';


const compressAndResizeImage = (file: File, maxWidth = 400, maxHeight = 400): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Draw image to canvas
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          resolve(compressedBase64);
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = (err) => reject(err);
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

interface StorefrontProfileProps {
  onGenerateEscrow?: (details: { productName: string; amount: number; shippingFee: number; buyerPhone: string; description: string }) => void;
  onNavigateToTab?: (tab: any) => void;
  profile?: any;
  isSellerLogged?: boolean;
  sellerId?: string | null;
  storefront?: any;
  onStorefrontUpdate?: (storefront: any) => void;
  referralsData?: any[];
}

export default function StorefrontProfile({ 
  onGenerateEscrow, 
  onNavigateToTab, 
  profile: globalProfile, 
  isSellerLogged = true,
  sellerId,
  storefront,
  onStorefrontUpdate,
  referralsData = []
}: StorefrontProfileProps) {
  const { success, error, warn, info } = useToast();

  // We manage the 5 tabs state including the escrow fee calculator
  const [activeTab, setActiveTabTab] = useState<'profile' | 'bank' | 'links' | 'catalog' | 'calculator'>(() => {
    const preferred = localStorage.getItem('trustlink_storefront_preferred_tab');
    if (preferred === 'bank' || preferred === 'catalog' || preferred === 'links' || preferred === 'profile' || preferred === 'calculator') {
      localStorage.removeItem('trustlink_storefront_preferred_tab');
      return preferred;
    }
    return 'profile';
  });

  const [shouldHighlightCopy, setShouldHighlightCopy] = useState(false);
  useEffect(() => {
    if (localStorage.getItem('trustlink_storefront_highlight_copy') === 'true') {
      setShouldHighlightCopy(true);
      localStorage.removeItem('trustlink_storefront_highlight_copy');
      const timer = setTimeout(() => {
        setShouldHighlightCopy(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);
  
  // Resolve current active handle/username
  const getLocalStorefrontData = (): { data: any; key: string } | null => {
    if (typeof window === 'undefined') return null;
    try {
      const keys = Object.keys(localStorage);
      const storeKeys = keys.filter(k => 
        k.startsWith('trustlink_store_') && 
        k !== 'trustlink-storefront-profile' && 
        k !== 'trustlink_storefront_preferred_tab' &&
        !k.startsWith('trustlink_storefront_')
      );
      if (storeKeys.length === 0) return null;

      let bestKey = storeKeys[0];
      let bestTime = 0;
      for (const key of storeKeys) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            const time = new Date(parsed.updatedAt || parsed.createdAt || 0).getTime();
            if (time > bestTime) {
              bestTime = time;
              bestKey = key;
            }
          } catch (e) {}
        }
      }

      const raw = localStorage.getItem(bestKey);
      if (raw) {
        try {
          return { data: JSON.parse(raw), key: bestKey };
        } catch (e) {}
      }
    } catch (e) {}
    return null;
  };

  const getLocalStoreKey = () => {
    if (sellerId) return `trustlink_store_seller_${sellerId}`;
    return `trustlink_store_${sellerHandle.toLowerCase()}`;
  };

  const [sellerHandle, setSellerHandle] = useState(() => {
    const localResult = !storefront ? getLocalStorefrontData() : null;
    const localData = localResult?.data;
    let handleSource = (storefront?.handle || localData?.handle || localData?.profile?.username || globalProfile?.username || globalProfile?.instagram || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!handleSource) {
      const fallback = (globalProfile?.businessName || globalProfile?.fullName || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
      handleSource = fallback || 'store';
    }
    return handleSource;
  });

  const accentColorTouchedRef = useRef(false);

  const [lastSavedHandle, setLastSavedHandle] = useState(sellerHandle.toLowerCase());

  // Main local state representing the whole trustlink_store_sellerId entity
  const [storeData, setStoreData] = useState<any>(() => {
    const defaultData = {
      businessName: globalProfile?.businessName || globalProfile?.fullName || '',
      handle: sellerHandle.toLowerCase(),
      tagline: globalProfile?.bio || '',
      profileImageUrl: '',
      bankName: '',
      accountNumber: '',
      accountName: '',
      links: [],
      items: [],
      currency: 'USD',
      accentColor: '#10b981',
      createdAt: new Date().toISOString(),
      profile: {
        businessName: globalProfile?.businessName || globalProfile?.fullName || '',
        username: sellerHandle.toLowerCase(),
        bio: globalProfile?.bio || '',
        profilePhoto: ''
      },
      bankDetails: {
        bankName: '',
        accountNumber: '',
        accountName: '',
        accountType: ''
      }
    };

    // 1) Try stable localStorage key first (sellerId-based or handle-based)
    const localKey = getLocalStoreKey();
    const rawSaved = localStorage.getItem(localKey);
    if (rawSaved) {
      try {
        const parsed = JSON.parse(rawSaved);
        return {
          businessName: parsed.businessName || parsed.profile?.businessName || defaultData.businessName,
          handle: parsed.handle || parsed.profile?.username || defaultData.handle,
          tagline: parsed.tagline || parsed.profile?.bio || defaultData.tagline,
          profileImageUrl: parsed.profileImageUrl !== undefined ? parsed.profileImageUrl : (parsed.profile?.profilePhoto || null),
          bankName: parsed.bankName || parsed.bankDetails?.bankName || defaultData.bankName,
          accountNumber: parsed.accountNumber || parsed.bankDetails?.accountNumber || defaultData.accountNumber,
          accountName: parsed.accountName || parsed.bankDetails?.accountName || defaultData.accountName,
          links: parsed.links || defaultData.links,
          items: parsed.items || defaultData.items,
          currency: parsed.currency || defaultData.currency,
          accentColor: parsed.accentColor || defaultData.accentColor,
          createdAt: parsed.createdAt || defaultData.createdAt,
          profile: { ...defaultData.profile, ...parsed.profile },
          bankDetails: { ...defaultData.bankDetails, ...parsed.bankDetails }
        };
      } catch (e) {
        return defaultData;
      }
    }

    // 2) If no stable key data, merge storefront with whatever localStorage has
    if (storefront) {
      const localResult = getLocalStorefrontData();
      const localData = localResult?.data;
      return {
        businessName: (storefront.businessName || localData?.businessName || localData?.profile?.businessName || defaultData.businessName),
        handle: (storefront.handle || localData?.handle || localData?.profile?.username || defaultData.handle),
        tagline: (storefront.tagline || localData?.tagline || localData?.profile?.bio || defaultData.tagline),
        profileImageUrl: (storefront.profileImageUrl || localData?.profileImageUrl || localData?.profile?.profilePhoto || defaultData.profileImageUrl),
        bankName: (storefront.bankName || localData?.bankName || localData?.bankDetails?.bankName || defaultData.bankName),
        accountNumber: (storefront.accountNumber || localData?.accountNumber || localData?.bankDetails?.accountNumber || defaultData.accountNumber),
        accountName: (storefront.accountName || localData?.accountName || localData?.bankDetails?.accountName || defaultData.accountName),
        links: (storefront.links && storefront.links.length > 0) ? storefront.links : (localData?.links || defaultData.links),
        items: (storefront.items && storefront.items.length > 0) ? storefront.items : (localData?.items || defaultData.items),
        currency: storefront.currency || localData?.currency || defaultData.currency,
        accentColor: storefront.accentColor || localData?.accentColor || defaultData.accentColor,
        createdAt: storefront.createdAt || defaultData.createdAt,
        profile: {
          businessName: storefront.businessName || localData?.profile?.businessName || defaultData.profile.businessName,
          username: storefront.handle || localData?.profile?.username || defaultData.profile.username,
          bio: storefront.tagline || localData?.profile?.bio || defaultData.profile.bio,
          profilePhoto: storefront.profileImageUrl || localData?.profile?.profilePhoto || defaultData.profile.profilePhoto
        },
        bankDetails: {
          bankName: storefront.bankName || localData?.bankDetails?.bankName || defaultData.bankDetails.bankName,
          accountNumber: storefront.accountNumber || localData?.bankDetails?.accountNumber || defaultData.bankDetails.accountNumber,
          accountName: storefront.accountName || localData?.bankDetails?.accountName || defaultData.bankDetails.accountName,
          accountType: storefront.accountType || localData?.bankDetails?.accountType || defaultData.bankDetails.accountType
        }
      };
    }

    // 3) Last resort: scan all localStorage keys for any storefront data
    const localResult = getLocalStorefrontData();
    if (localResult?.data) {
      const parsed = localResult.data;
      return {
        businessName: parsed.businessName || parsed.profile?.businessName || defaultData.businessName,
        handle: parsed.handle || parsed.profile?.username || defaultData.handle,
        tagline: parsed.tagline || parsed.profile?.bio || defaultData.tagline,
        profileImageUrl: parsed.profileImageUrl !== undefined ? parsed.profileImageUrl : (parsed.profile?.profilePhoto || null),
        bankName: parsed.bankName || parsed.bankDetails?.bankName || defaultData.bankName,
        accountNumber: parsed.accountNumber || parsed.bankDetails?.accountNumber || defaultData.accountNumber,
        accountName: parsed.accountName || parsed.bankDetails?.accountName || defaultData.accountName,
        links: parsed.links || defaultData.links,
        items: parsed.items || defaultData.items,
        currency: parsed.currency || defaultData.currency,
        accentColor: parsed.accentColor || defaultData.accentColor,
        createdAt: parsed.createdAt || defaultData.createdAt,
        profile: { ...defaultData.profile, ...parsed.profile },
        bankDetails: { ...defaultData.bankDetails, ...parsed.bankDetails }
      };
    }

    return defaultData;
  });

  useEffect(() => {
    if (!storefront) return;
    setStoreData((prev: any) => ({
      businessName: storefront.businessName ? storefront.businessName : prev.businessName,
      handle: storefront.handle ? storefront.handle : prev.handle,
      tagline: storefront.tagline ? storefront.tagline : prev.tagline,
      profileImageUrl: storefront.profileImageUrl ? storefront.profileImageUrl : prev.profileImageUrl,
      bankName: storefront.bankName ? storefront.bankName : prev.bankName,
      accountNumber: storefront.accountNumber ? storefront.accountNumber : prev.accountNumber,
      accountName: storefront.accountName ? storefront.accountName : prev.accountName,
      accountType: storefront.accountType ? storefront.accountType : prev.accountType,
      links: Array.isArray(storefront.links) && storefront.links.length > 0 ? storefront.links : prev.links,
      items: Array.isArray(storefront.items) && storefront.items.length > 0 ? storefront.items : prev.items,
      currency: storefront.currency ? storefront.currency : prev.currency,
      accentColor: accentColorTouchedRef.current ? prev.accentColor : (storefront.accentColor || prev.accentColor),
      createdAt: storefront.createdAt || prev.createdAt,
      profile: {
        ...prev.profile,
        businessName: storefront.businessName ? storefront.businessName : prev.profile.businessName,
        username: storefront.handle ? storefront.handle : prev.profile.username,
        bio: storefront.tagline ? storefront.tagline : prev.profile.bio,
        profilePhoto: storefront.profileImageUrl ? storefront.profileImageUrl : prev.profile.profilePhoto
      },
      bankDetails: {
        ...prev.bankDetails,
        bankName: storefront.bankName ? storefront.bankName : prev.bankDetails.bankName,
        accountNumber: storefront.accountNumber ? storefront.accountNumber : prev.bankDetails.accountNumber,
        accountName: storefront.accountName ? storefront.accountName : prev.bankDetails.accountName,
        accountType: storefront.accountType ? storefront.accountType : prev.bankDetails.accountType
      }
    }));
    const resolvedHandle = (storefront.handle || '').trim().toLowerCase();
    if (resolvedHandle) setSellerHandle(resolvedHandle);
    setLastSavedHandle(resolvedHandle);
  }, [storefront?.id]);

  const originalAccentColorRef = useRef<string>(storeData.accentColor);

  const handleSaveStoreData = useCallback(async (currentStoreData: any) => {
    const currentHandle = sellerHandle.trim().toLowerCase();

    const activeReferralsCount = referralsData.filter((ref: any) => ref.status === 'Active').length;

    const finalData = {
      businessName: currentStoreData.profile?.businessName || currentStoreData.businessName || '',
      handle: currentHandle,
      tagline: currentStoreData.profile?.bio || currentStoreData.tagline || '',
      profileImageUrl: currentStoreData.profile?.profilePhoto || currentStoreData.profileImageUrl || null,
      bankName: currentStoreData.bankDetails?.bankName || currentStoreData.bankName || '',
      accountNumber: currentStoreData.bankDetails?.accountNumber || currentStoreData.accountNumber || '',
      accountName: currentStoreData.bankDetails?.accountName || currentStoreData.accountName || '',
      links: currentStoreData.links || [],
      items: currentStoreData.items || [],
      currency: currentStoreData.items?.[0]?.currency || currentStoreData.currency || 'USD',
      accentColor: currentStoreData.accentColor || '#10b981',
      createdAt: currentStoreData.createdAt || new Date().toISOString(),
      activeReferrals: activeReferralsCount,
      profile: {
        businessName: currentStoreData.profile?.businessName || currentStoreData.businessName || '',
        username: currentHandle,
        bio: currentStoreData.profile?.bio || currentStoreData.tagline || '',
        profilePhoto: currentStoreData.profile?.profilePhoto || currentStoreData.profileImageUrl || '',
        activeReferrals: activeReferralsCount
      },
      bankDetails: {
        bankName: currentStoreData.bankDetails?.bankName || currentStoreData.bankName || '',
        accountNumber: currentStoreData.bankDetails?.accountNumber || currentStoreData.accountNumber || '',
        accountName: currentStoreData.bankDetails?.accountName || currentStoreData.accountName || '',
        accountType: currentStoreData.bankDetails?.accountType || currentStoreData.accountType || ''
      }
    };

    let savedStorefront: Storefront | null = null;

    if (sellerId) {
      try {
        savedStorefront = await createOrUpdateStorefront({
          id: storefront?.id,
          sellerId,
          handle: finalData.handle,
          businessName: finalData.businessName,
          tagline: finalData.tagline,
          profileImageUrl: finalData.profileImageUrl,
          links: finalData.links,
          items: finalData.items,
          bankName: finalData.bankDetails?.bankName || finalData.bankName || '',
          accountNumber: finalData.bankDetails?.accountNumber || finalData.accountNumber || '',
          accountName: finalData.bankDetails?.accountName || finalData.accountName || '',
          accountType: finalData.bankDetails?.accountType || '',
          currency: finalData.currency,
          accentColor: finalData.accentColor
        });

        if (!savedStorefront) {
          error('Failed to save storefront to server. Your changes were saved locally and will sync when connection is restored.');
        } else {
          setStoreData(finalData);
          setLastSavedHandle(currentHandle);

          if (onStorefrontUpdate) {
            onStorefrontUpdate(savedStorefront);
          }
        }
      } catch (err) {
        console.error('[StorefrontProfile] Save failed', err);
        error('Failed to save storefront to server. Please try again.');
      }
    } else {
      console.warn('[StorefrontProfile] Save skipped - no sellerId', { sellerId });
    }

    if (lastSavedHandle && lastSavedHandle.toLowerCase() !== currentHandle) {
      localStorage.removeItem(`trustlink_store_${lastSavedHandle.toLowerCase()}`);
    }

    const stableKey = getLocalStoreKey();
    const handleKey = `trustlink_store_${currentHandle}`;
    localStorage.setItem(stableKey, JSON.stringify(finalData));

    if (stableKey !== handleKey) {
      localStorage.setItem(handleKey, JSON.stringify(finalData));
    }

    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('trustlink_store_') && 
            key !== stableKey && 
            key !== handleKey &&
            key !== 'trustlink-storefront-profile' && 
            key !== 'trustlink_storefront_preferred_tab' &&
            !key.startsWith('trustlink_storefront_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {}

    try {
      const storefrontProfile = {
        handle: currentHandle,
        businessName: finalData.businessName,
        tagline: finalData.tagline,
        profileImageUrl: finalData.profileImageUrl || '',
        bankDetails: {
          bankName: finalData.bankDetails?.bankName || '',
          accountNumber: finalData.bankDetails?.accountNumber || '',
          accountName: finalData.bankDetails?.accountName || '',
          accountType: finalData.bankDetails?.accountType || ''
        },
        links: finalData.links || [],
        items: finalData.items || [],
        currency: finalData.currency || 'USD',
        activeReferrals: finalData.activeReferrals || 0,
        accentColor: finalData.accentColor
      };
      localStorage.setItem('trustlink-storefront-profile', JSON.stringify(storefrontProfile));
      localStorage.setItem('trustlink-storefront-profile-backup', JSON.stringify(storefrontProfile));
    } catch (e) {}

    try {
      window.dispatchEvent(new StorageEvent('storage', {
        key: stableKey,
        newValue: JSON.stringify(finalData),
        url: window.location.href
      }));
    } catch (e) {}

    return savedStorefront;
  }, [sellerId, storefront?.id, sellerHandle, referralsData, lastSavedHandle, onStorefrontUpdate, error]);

  useEffect(() => {
    if (!storeData.accentColor || storeData.accentColor === originalAccentColorRef.current) return;
    const timeout = setTimeout(async () => {
      await handleSaveStoreData(storeData);
      originalAccentColorRef.current = storeData.accentColor;
      success('Card color saved');
    }, 500);
    return () => clearTimeout(timeout);
  }, [storeData.accentColor, handleSaveStoreData, success]);

  // Tab manual save callbacks
  const saveProfileChanges = () => {
    handleSaveStoreData(storeData);
  };

  const saveLinksChanges = () => {
    handleSaveStoreData(storeData);
  };

  const saveCatalogChanges = () => {
    handleSaveStoreData(storeData);
  };

  // Confirmation modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ConfirmationModalType>('delete_item');
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

  // Dropdown list of popular banks & wallets
  const NIGERIAN_BANKS = [
    // Local Commercial Banks
    'Guaranty Trust Bank (GTBank)',
    'Zenith Bank',
    'Access Bank',
    'United Bank for Africa (UBA)',
    'First Bank of Nigeria',
    'Wema Bank / Alat',
    'Stanbic IBTC Bank',
    'Fidelity Bank',
    'FCMB',
    'Sterling Bank',
    'Union Bank',
    'Keystone Bank',
    'EcoBank',
    'Polaris Bank',
    'Standard Chartered Bank',
    'Providus Bank',

    // Local Digital Providers & Wallets
    'PalmPay Limited',
    'OPay Digital Services',
    'Kuda Microfinance Bank',
    'Moniepoint Microfinance',
    'Chipper Cash Wallet',
    'Paga Wallet',
    'Carbon Microfinance',
    'FairMoney Microfinance',
    'PiggyVest / VFD Bank',
    'Flutterwave Wallet',
    'Paystack Wallet',
    'Geegpay Wallet',

    // International Channels & Escrow Wallets
    'Wise Multi-Currency (USD/GBP)',
    'PayPal Global Wallet',
    'Payoneer Global Wallet',
    'Revolut Business Vault',
    'Mercury Worldwide Checking',
    'Stripe Pay Merchant Account',
    'Eurozone SEPA IBAN Wire',
    'Apple Pay / Google Wallet',
    'Other Worldwide / Custom Bank'
  ];

  // Bank Search term state
  const [bankSearch, setBankSearch] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);

  // Links state
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');

  // Catalog item editing/modal state
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isEditingItem, setIsEditingItem] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'USD',
    photoUrl: '',
    imageUrl: ''
  });

  const getPublicStoreUrl = () => {
    const origin = window.location.origin;
    const safeHandle = sellerHandle.trim().toLowerCase() || 'store';
    return `${origin}/store/${safeHandle}`;
  };

  const handleShareLink = () => {
    navigator.clipboard?.writeText(getPublicStoreUrl()).then(() => {
      success('Public store URL copied to clipboard!');
    });
  };

  const handleViewPublic = () => {
    window.open(getPublicStoreUrl(), '_blank');
  };

  // Profile edits
  const updateProfileField = (field: string, value: string) => {
    setStoreData((prev: any) => {
      const nextProfile = { ...prev.profile, [field]: value };
      
      // Auto-generate handle from businessName if handle field was empty or matching
      if (field === 'businessName') {
        const genHandle = value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 30);
        if (genHandle) {
          nextProfile.username = genHandle;
          setSellerHandle(genHandle);
        }
      }
      if (field === 'username') {
        const sanitized = value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
        nextProfile.username = sanitized;
        setSellerHandle(sanitized);
      }

      return {
        ...prev,
        profile: nextProfile
      };
    });
  };

  // Bank formatting handler
  const handleBankAccountChange = (val: string) => {
    const isInternational = [
      'Wise', 'PayPal', 'Payoneer', 'Revolut', 'Mercury', 'Stripe', 'SEPA', 'Apple', 'Google', 'Worldwide', 'International'
    ].some(keyword => storeData.bankDetails?.bankName?.toLowerCase().includes(keyword.toLowerCase()));

    let clean = isInternational ? val.replace(/[^A-Za-z0-9@.\-_ ]/g, '') : val.replace(/[^0-9]/g, '');
    if (!isInternational && clean.length > 10) clean = clean.substring(0, 10);
    if (isInternational && clean.length > 34) clean = clean.substring(0, 34);
    
    setStoreData((prev: any) => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        accountNumber: clean
      }
    }));
  };

  const formatBankNumberSpaces = (numStr: string) => {
    if (!numStr) return '';
    const isInternational = [
      'Wise', 'PayPal', 'Payoneer', 'Revolut', 'Mercury', 'Stripe', 'SEPA', 'Apple', 'Google', 'Worldwide', 'International'
    ].some(keyword => storeData.bankDetails?.bankName?.toLowerCase().includes(keyword.toLowerCase()));

    if (isInternational) return numStr;
    const clean = numStr.replace(/[^0-9]/g, '');
    const m = clean.match(/.{1,4}/g);
    return m ? m.join(' ') : clean;
  };

  const saveBankDetails = () => {
    handleSaveStoreData(storeData);
  };

  // Links setup
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

  const getLabelForUrl = (urlStr: string, customLabel?: string): string => {
    if (customLabel?.trim()) return customLabel.trim();
    const platform = detectSocialPlatform(urlStr);
    return platform.label;
  };

  const handleAddLink = () => {
    const rawUrl = newLinkUrl.trim();
    if (!rawUrl) return;

    if (storeData.links.length >= 6) {
      warn('Maximum of 6 social/contact links allowed.');
      return;
    }

    const normalized = normalizeSocialUrl(rawUrl);
    
    const newLink = {
      id: `link-${Date.now()}`,
      url: normalized.url,
      label: normalized.label
    };

    setStoreData((prev: any) => ({
      ...prev,
      links: [...prev.links, newLink]
    }));

    setNewLinkUrl('');
    setNewLinkLabel('');
    
    success('Social contact channel added!');
  };

  const handleDeleteLink = (id: string) => {
    setStoreData((prev: any) => ({
      ...prev,
      links: prev.links.filter((l: any) => l.id !== id)
    }));
  };

  // Move link up/down in placement index Robust reordering logic
  const handleMoveLink = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= storeData.links.length) return;

    const listCopy = [...storeData.links];
    const temp = listCopy[index];
    listCopy[index] = listCopy[targetIndex];
    listCopy[targetIndex] = temp;

    setStoreData((prev: any) => ({
      ...prev,
      links: listCopy
    }));
  };

  // Catalog setup
  const handleOpenAddCatalogItem = () => {
    setItemForm({
      name: '',
      description: '',
      price: '',
      currency: 'USD',
      photoUrl: '',
      imageUrl: ''
    });
    setIsEditingItem(null);
    setIsAddingItem(true);
  };

  const handleOpenEditCatalogItem = (item: any) => {
    setItemForm({
      name: item.name,
      description: item.description || '',
      price: String(item.price),
                currency: item.currency || 'USD',
      photoUrl: item.photoUrl || item.imageUrl || '',
      imageUrl: item.imageUrl || item.photoUrl || ''
    });
    setIsEditingItem(item.id);
    setIsAddingItem(true);
  };

  const handleSaveCatalogItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name || !itemForm.price) return;

    const priceNum = parseFloat(itemForm.price.replace(/[^0-9.]/g, '')) || 0;

    setStoreData((prev: any) => {
      let nextItems = [...prev.items];
      
      if (isEditingItem) {
        nextItems = nextItems.map((itm: any) => {
          if (itm.id === isEditingItem) {
            return {
              ...itm,
              name: itemForm.name,
              description: itemForm.description,
              price: priceNum,
              currency: itemForm.currency,
              photoUrl: itemForm.photoUrl,
              imageUrl: itemForm.photoUrl
            };
          }
          return itm;
        });
      } else {
        const newItem = {
          id: `item-${Date.now()}`,
          name: itemForm.name,
          description: itemForm.description,
          price: priceNum,
          currency: itemForm.currency,
          photoUrl: itemForm.photoUrl,
          imageUrl: itemForm.photoUrl
        };
        nextItems.push(newItem);
      }

      return {
        ...prev,
        items: nextItems
      };
    });

    setIsAddingItem(false);
    setIsEditingItem(null);
    success(isEditingItem ? 'Catalog product updated!' : 'Catalog product created!');
  };

  const handleDeleteCatalogItem = (id: string) => {
    setStoreData((prev: any) => ({
      ...prev,
      items: prev.items.filter((item: any) => item.id !== id)
    }));
  };

  const filteredBanks = NIGERIAN_BANKS.filter(b => 
    b.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const isInternationalUserBank = [
    'Wise', 'PayPal', 'Payoneer', 'Revolut', 'Mercury', 'Stripe', 'SEPA', 'Apple', 'Google', 'Worldwide', 'International'
  ].some(keyword => storeData.bankDetails?.bankName?.toLowerCase().includes(keyword.toLowerCase()));

  return (
    <div id="private-store-editor-grid" className="max-w-6xl mx-auto flex flex-col gap-6 text-left pb-16 animate-fade-in relative">
      
      {/* Top action block */}
      <div 
        style={{ borderBottomColor: 'var(--border)' }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-5 gap-4"
      >
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-emerald-400" />
            <span style={{ color: 'var(--text-primary)' }}>Storefront Settings & Editor</span>
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Build and visual brand your storefront, list products, configure social links and escrow routing parameters.
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleShareLink}
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer hover:bg-[var(--surface2)] ${shouldHighlightCopy ? 'animate-pulse ring-4 ring-emerald-500/50 scale-102 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : ''}`}
            title="Copy store link"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-bold">Copy store URL</span>
          </button>
          
          <button
            onClick={handleViewPublic}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-440 text-black text-xs font-black transition-all cursor-pointer"
          >
            <span>View Public Store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Main Content & Realtime Card Layout Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Parameters Tabs & Inputs Fields */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Main 4 Parameter Tabs */}
          <div 
            style={{ borderBottomColor: 'var(--border)' }}
            className="flex border-b gap-1 overflow-x-auto scrollbar-none select-none"
          >
            {[
              { id: 'profile' as const, label: 'Profile', icon: <User className="w-3.5 h-3.5" /> },
              { id: 'bank' as const, label: 'Bank Details', icon: <CreditCard className="w-3.5 h-3.5" /> },
              { id: 'links' as const, label: 'Links & Socials', icon: <Link className="w-3.5 h-3.5" /> },
              { id: 'catalog' as const, label: 'Catalog Store', icon: <Tag className="w-3.5 h-3.5" /> },
              { id: 'calculator' as const, label: 'Fee Calculator', icon: <Calculator className="w-3.5 h-3.5" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTabTab(tab.id)}
                style={
                  activeTab === tab.id
                    ? { borderBottomColor: '#10b981', color: 'var(--text-primary)' }
                    : { borderBottomColor: 'transparent', color: 'var(--text-muted)' }
                }
                className={`py-3 px-4 text-xs font-bold rounded-t-lg flex items-center gap-2 border-b-2 cursor-pointer transition-all shrink-0 hover:bg-[var(--surface2)] hover:text-[var(--text-primary)]`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* TAB 1: PROFILE FIELDS */}
          {activeTab === 'profile' && (
            <div 
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
              className="border p-8 sm:p-10 rounded-2xl flex flex-col gap-8 sm:gap-9 animate-fade-in"
            >
              <h2 className="text-[11px] font-semibold tracking-[0.08em] font-mono leading-none" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Profile details</h2>
              
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center text-xs font-medium font-sans">
                  <label style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500 }}>Business brand name</label>
                  <span className="text-[10px] font-mono" style={{ color: 'var(--text-dim)' }}>
                    {(storeData.profile.businessName || '').length}/50
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={50}
                  value={storeData.profile.businessName}
                  onChange={(e) => updateProfileField('businessName', e.target.value)}
                  placeholder="Your business name"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                  className="w-full border rounded-xl px-4 py-3 text-xs focus:outline-[#10b981] focus:border-[#10b981] transition-all"
                />
              </div>

              <div className="flex flex-col gap-2.5">
                <label className="text-xs font-medium font-sans" style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500 }}>Store username / handle</label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-xs font-mono" style={{ color: 'var(--text-dim)' }}>@</span>
                  <input
                    type="text"
                    value={storeData.profile.username}
                    onChange={(e) => updateProfileField('username', e.target.value)}
                    placeholder="your-handle"
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
                    className="w-full border rounded-xl pl-8 pr-4 py-3 text-xs text-emerald-400 font-mono focus:outline-[#10b981] focus:border-[#10b981] transition-all"
                  />
                </div>
                <span className="text-[10px] font-mono pl-1 leading-snug" style={{ color: 'var(--text-dim)' }}>
                  This generates your public site: <span className="text-emerald-450">store/{sellerHandle}</span>
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center text-xs font-medium font-sans">
                  <label style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500 }}>Short tagline bio</label>
                  <span className="text-[10px] font-mono" style={{ color: 'var(--text-dim)' }}>
                    {(storeData.profile.bio || '').length}/150
                  </span>
                </div>
                <textarea
                  maxLength={150}
                  value={storeData.profile.bio}
                  onChange={(e) => updateProfileField('bio', e.target.value)}
                  placeholder="Explain what your store deals in..."
                  rows={3}
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                  className="w-full border rounded-xl px-4 py-3 text-xs focus:outline-[#10b981] focus:border-[#10b981] transition-all resize-none font-sans"
                />
              </div>

              <div className="flex flex-col gap-2.5">
                <label className="text-xs font-medium font-sans" style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500 }}>
                  Store Profile Brand Logo
                </label>
                
                <div 
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border)' }}
                  className="flex flex-col sm:flex-row gap-4 items-center border border-dashed rounded-xl p-4.5 hover:bg-zinc-900/20 hover:border-emerald-500/40 transition-all group"
                >
                  {/* Miniature Circle Preview */}
                  <div 
                    style={{ borderColor: 'var(--border)', backgroundColor: '#0a0a0a' }}
                    className="w-16 h-16 rounded-full border flex-shrink-0 flex items-center justify-center overflow-hidden relative"
                  >
                    {storeData.profile.profilePhoto ? (
                      <img 
                        src={storeData.profile.profilePhoto} 
                        alt="Brand insignia" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center" style={{
                        background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.03) 0%, transparent 60%), #0a0a0a'
                      }}>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                          {storeData.profile.storeName ? storeData.profile.storeName.substring(0, 2).toUpperCase() : 'TL'}
                          </span>
                    </div>
                )}
                  </div>
                      {/* Drag-and-drop info and upload triggers */}
                  <div className="flex-grow flex flex-col gap-1 items-center sm:items-start text-center sm:text-left">
                    <span className="text-xs font-semibold group-hover:text-emerald-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                      {storeData.profile.profilePhoto ? "Update Brand Logo" : "Upload Brand Logo"}
                    </span>
                    <span className="text-[10.5px] leading-normal font-sans" style={{ color: 'var(--text-muted)' }}>
                      Supports direct photo drag or upload. Automatically optimized for lightning speeds.
                    </span>
                    
                    <div className="flex gap-2.5 mt-2">
                      <label 
                        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        className="py-1 px-3 hover:opacity-80 rounded border text-[10px] font-extrabold uppercase cursor-pointer select-none transition-all"
                      >
                        Select Logo
                        <input 
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const base64 = await compressAndResizeImage(file, 200, 200);
                                updateProfileField('profilePhoto', base64);
                              } catch (err) {
                                alert('Error encoding or processing image. Please try another file.');
                              }
                            }
                          }}
                        />
                      </label>

                      {storeData.profile.profilePhoto && (
                        <button
                          type="button"
                          onClick={() => {
                            updateProfileField('profilePhoto', '');
                          }}
                          className="py-1 px-3 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-[10px] font-bold uppercase rounded cursor-pointer transition-all"
                        >
                          Clear image
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={saveProfileChanges}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-440 text-black text-xs font-black uppercase tracking-wider transition-all active:scale-98 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: BANK DETAILS INTEGRATIVE SECTION */}
          {activeTab === 'bank' && (
            <div 
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
              className="border p-8 sm:p-10 rounded-2xl grid grid-cols-1 gap-8 sm:gap-9 animate-fade-in relative"
            >
              {/* Left column - Form fields */}
              <div className="flex flex-col gap-6">
                <h2 className="text-[11px] font-semibold tracking-[0.08em] font-mono leading-none" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Payment routing bank parameters</h2>
                
                <div className="flex flex-col gap-2.5 relative">
                  <label className="text-xs font-medium font-sans" style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500 }}>Bank name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={storeData.bankDetails.bankName}
                      readOnly
                      onClick={() => setShowBankDropdown(!showBankDropdown)}
                      placeholder="Select settlement bank"
                      style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                      className="w-full border rounded-xl px-4 py-3 text-xs cursor-pointer focus:outline-[#10b981] focus:border-[#10b981] select-all transition-all"
                    />
                    <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-4 top-3.5 pointer-events-none" />
                  </div>

                  {/* Dropdown UI overlay */}
                  {showBankDropdown && (
                    <div 
                      style={{ backgroundColor: 'var(--dropdown-bg)', borderColor: 'var(--border)', boxShadow: 'var(--dropdown-shadow)' }}
                      className="absolute left-0 right-0 top-[65px] border rounded-xl z-40 p-2 flex flex-col gap-1 max-h-48 overflow-y-auto"
                    >
                      <input
                        type="text"
                        placeholder="Type to filter..."
                        value={bankSearch}
                        onChange={(e) => setBankSearch(e.target.value)}
                        style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                        className="w-full border rounded-lg px-3 py-1.5 text-xs mb-2 focus:outline-none focus:border-[#10b981] transition-all"
                      />
                      {filteredBanks.map(bank => (
                        <button
                          key={bank}
                          type="button"
                          onClick={() => {
                            setStoreData((prev: any) => ({
                              ...prev,
                              bankDetails: {
                                ...prev.bankDetails,
                                bankName: bank
                              }
                            }));
                            setShowBankDropdown(false);
                            setBankSearch('');
                          }}
                          style={{ color: 'var(--text-primary)' }}
                          className="py-2 px-3 text-left hover:bg-[var(--surface2)] rounded-lg text-xs"
                        >
                          {bank}
                        </button>
                      ))}
                    </div>
                  )}


                </div>

               {/* Account / Wallet Type Selection Block */}
               <div className="flex flex-col gap-2.5">
                  <label className="text-[10px] font-semibold tracking-[0.08em] font-mono uppercase text-left" style={{ color: 'var(--text-muted)' }}>
                    Account / Wallet Type
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'Savings', label: 'Savings', Icon: Wallet },
                      { id: 'Current', label: 'Current', Icon: Landmark },
                      { id: 'Checking', label: 'Checking', Icon: Building2 },
                      { id: 'Wallet', label: 'Wallet', Icon: Smartphone },
                      { id: 'Domiciliary', label: 'Domiciliary', Icon: Globe },
                      { id: 'Custom', label: 'Custom', Icon: PenLine }
                    ].map((preset) => {
                      const isSelected = preset.id === 'Custom' 
                        ? !['Savings', 'Current', 'Checking', 'Wallet', 'Domiciliary'].includes(storeData.bankDetails.accountType)
                        : storeData.bankDetails.accountType === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setStoreData((prev: any) => ({
                              ...prev,
                              bankDetails: {
                                ...prev.bankDetails,
                                accountType: preset.id === 'Custom' ? 'BUSINESS' : preset.id
                              }
                            }));
                          }}
                          style={{
                            backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'var(--input-bg)',
                            borderColor: isSelected ? '#10b981' : 'var(--input-border)',
                            color: isSelected ? '#10b981' : 'var(--text-muted)'
                          }}
                          className="py-2.5 px-3 border rounded-xl text-[11px] font-semibold font-sans flex items-center gap-2 transition-all text-center cursor-pointer select-none hover:border-emerald-500/30"
                        >
                          <preset.Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                          <span>{preset.label}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Manual entry if custom type is active */}
                  {!['Savings', 'Current', 'Checking', 'Wallet', 'Domiciliary'].includes(storeData.bankDetails.accountType) && (
                    <div className="mt-1 animate-fade-in">
                      <input
                        type="text"
                        value={storeData.bankDetails.accountType}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStoreData((prev: any) => ({
                            ...prev,
                            bankDetails: {
                              ...prev.bankDetails,
                              accountType: val
                            }
                          }));
                        }}
                        placeholder="e.g. PayPal Personal, Bitcoin Ledger, Payoneer Virtual"
                        style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                        className="w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-[#10b981] focus:border-[#10b981] transition-all"
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2.5">
                  <label className="text-xs font-medium font-sans" style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500 }}>
                    {isInternationalUserBank ? 'Settlement Account / Recipient Name' : 'Settlement account name'}
                  </label>
                  <input
                    type="text"
                    value={storeData.bankDetails.accountName}
                    onChange={(e) => setStoreData((prev: any) => ({
                      ...prev,
                      bankDetails: {
                        ...prev.bankDetails,
                        accountName: e.target.value
                      }
                    }))}
                      placeholder={isInternationalUserBank ? "e.g. Your business name" : "Account name"}
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                    className="w-full border rounded-xl px-4 py-3 text-xs uppercase focus:outline-[#10b981] focus:border-[#10b981] transition-all"
                  />
                </div>

                <div className="flex flex-col gap-2.5">
                  <label className="text-xs font-medium font-sans" style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500 }}>
                    {isInternationalUserBank ? 'Settlement account / wallet identifier' : 'Account number'}
                  </label>
                  <input
                    type="text"
                    value={storeData.bankDetails.accountNumber || ''}
                    onChange={(e) => setStoreData((prev: any) => ({
                      ...prev,
                      bankDetails: {
                        ...prev.bankDetails,
                        accountNumber: e.target.value
                      }
                    }))}
                    placeholder={isInternationalUserBank ? "e.g. wallet ID or account number" : "Account number"}
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                    className="w-full border rounded-xl px-4 py-3 text-xs uppercase focus:outline-[#10b981] focus:border-[#10b981] transition-all"
                  />
                </div>

                <div className="pt-6 mt-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    onClick={saveBankDetails}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-440 text-black text-xs font-black uppercase tracking-wider transition-all active:scale-98 cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>


            </div>
          )}


          {/* TAB 3: SOCIAL CONTACT LINKS REORDER LIST */}
          {activeTab === 'links' && (
            <div 
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
              className="border p-8 sm:p-10 rounded-2xl flex flex-col gap-8 sm:gap-9 animate-fade-in"
            >
              <h2 className="text-[11px] font-semibold tracking-[0.08em] font-mono leading-none" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Configure social links</h2>

              {/* Add link tools */}
              <div 
                style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
                className="border rounded-xl p-6 flex flex-col gap-6"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 flex flex-col gap-2.5">
                    <label className="text-xs font-medium font-sans" style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500 }}>Paste social link URL or WhatsApp phone #</label>
                    <input
                      type="text"
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      placeholder="e.g. instagram.com/someusername"
                      style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                      className="w-full border rounded-lg px-3.5 py-2 text-xs focus:outline-[#10b981] focus:border-[#10b981] transition-all"
                    />
                  </div>
                  
                  <div className="sm:w-48 flex flex-col gap-2.5">
                    <label className="text-xs font-medium font-sans" style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500 }}>Custom button label (optional)</label>
                    <input
                      type="text"
                      value={newLinkLabel}
                      onChange={(e) => setNewLinkLabel(e.target.value)}
                      placeholder="e.g. Daily Footwear DM"
                      style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                      className="w-full border rounded-lg px-3.5 py-2 text-xs focus:outline-[#10b981] focus:border-[#10b981] transition-all"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    onClick={handleAddLink}
                    style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    className="px-4 py-2 text-xs font-extrabold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer border hover:border-emerald-500 hover:text-emerald-400 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Link Channel</span>
                  </button>
                </div>
              </div>

              {/* Configured links listed */}
              <div className="flex flex-col gap-4">
                <span className="text-[11px] font-semibold tracking-[0.08em] font-mono leading-none" style={{ color: 'var(--text-muted)' }}>Active channels ({storeData.links.length})</span>
                {storeData.links.length === 0 ? (
                  <div 
                    style={{ borderColor: 'var(--border)' }}
                    className="text-xs text-zinc-650 italic p-6 text-center border border-dashed rounded-xl"
                  >
                    No social or contact link modules active yet. Add some above.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {storeData.links.map((lnk: any, index: number) => (
                      <div 
                        key={lnk.id} 
                        style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
                        className="border rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div 
                            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                            className="p-2 rounded-lg border shrink-0"
                          >
                            {getIconForUrl(lnk.url)}
                          </div>
                          <div className="flex flex-col min-w-0 text-left">
                            <span className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{lnk.label}</span>
                            <span className="text-[9.5px] font-mono truncate" style={{ color: 'var(--text-muted)' }}>{lnk.url}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Arrange index placement controls */}
                          <button
                            type="button"
                            onClick={() => handleMoveLink(index, 'up')}
                            disabled={index === 0}
                            style={{ color: 'var(--text-dim)' }}
                            className="p-1.5 hover:bg-[var(--surface)] hover:text-[var(--text-primary)] rounded transition-colors cursor-pointer disabled:opacity-20"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleMoveLink(index, 'down')}
                            disabled={index === storeData.links.length - 1}
                            style={{ color: 'var(--text-dim)' }}
                            className="p-1.5 hover:bg-[var(--surface)] hover:text-[var(--text-primary)] rounded transition-colors cursor-pointer disabled:opacity-20"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => triggerConfirmModal('remove_link', () => handleDeleteLink(lnk.id))}
                            className="p-1.5 hover:bg-zinc-900 text-red-500/80 hover:text-red-400 rounded transition-colors cursor-pointer ml-1"
                            title="Delete Channel"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-6 mt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={saveLinksChanges}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-440 text-black text-xs font-black uppercase tracking-wider transition-all active:scale-98 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: CATALOG STORE CATALOGUE FIELDS */}
          {activeTab === 'catalog' && (
            <div 
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
              className="border p-8 sm:p-10 rounded-2xl flex flex-col gap-8 sm:gap-9 animate-fade-in"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-semibold tracking-[0.08em] font-mono leading-none" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Catalog store items ({storeData.items.length})</h2>
                <button
                  type="button"
                  onClick={handleOpenAddCatalogItem}
                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-extrabold text-[10.5px] rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>List New Product</span>
                </button>
              </div>

              {/* Add item interactive panel overlay */}
              {isAddingItem && (
                <form 
                  onSubmit={handleSaveCatalogItem} 
                  style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
                  className="border rounded-xl p-6 flex flex-col gap-6 animate-fade-in"
                >
                  <div className="flex justify-between items-center pb-2" style={{ borderBottomColor: 'var(--border)', borderBottomWidth: '1px' }}>
                    <span className="text-[10px] uppercase font-extrabold text-emerald-400 font-mono tracking-wider">
                      {isEditingItem ? 'Modify Listed Product' : 'Add Product Details'}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => { setIsAddingItem(false); setIsEditingItem(null); }}
                      className="text-xs hover:opacity-80 transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2.5 font-sans">
                      <label className="text-xs font-medium font-sans" style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500 }}>Product name</label>
                      <input
                        type="text"
                        required
                        value={itemForm.name}
                        onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                        placeholder="e.g. Nike Dunk Low Retro"
                        style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                        className="w-full border rounded-lg px-3.5 py-2 text-xs focus:outline-[#10b981] focus:border-[#10b981] transition-all"
                      />
                    </div>

                    <div className="flex gap-2">
                      <div className="w-20 flex flex-col gap-2.5">
                        <label className="text-xs font-medium font-sans" style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500 }}>Currency</label>
                        <select
                          value={itemForm.currency}
                          onChange={(e) => setItemForm({ ...itemForm, currency: e.target.value })}
                          style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                          className="w-full border rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-[#10b981] transition-all cursor-pointer"
                        >
                          <option value="USD">USD $</option>
                          <option value="NGN">NGN ₦</option>
                        </select>
                      </div>
                      
                      <div className="flex-grow flex flex-col gap-2.5">
                        <label className="text-xs font-medium font-sans" style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500 }}>Price</label>
                        <input
                          type="text"
                          required
                          value={itemForm.price}
                          onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                          placeholder="e.g. 150,000"
                          style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                          className="w-full border rounded-lg px-3.5 py-2 text-xs font-mono focus:outline-[#10b981] focus:border-[#10b981] transition-all"
                        />
                      </div>
                    </div>
                  </div>

                   <div className="flex flex-col gap-2.5 font-sans">
                     <label className="text-xs font-medium" style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500 }}>
                       Product Representation Photo
                     </label>

                      <div 
                        style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
                        className="border border-dashed rounded-xl p-4.5 flex flex-col items-center justify-center text-center gap-3 relative hover:border-emerald-500/40 transition-all select-none group"
                      >
                        {itemForm.photoUrl ? (
                          /* Preview mode after file is loaded/exist */
                          <div className="w-full flex flex-col items-center gap-3">
                            <div 
                              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
                              className="w-full max-w-[280px] h-[140px] rounded-lg overflow-hidden border flex items-center justify-center relative"
                            >
                              <img 
                                src={itemForm.photoUrl} 
                                alt="Live product representation" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                           
                           <div className="flex gap-2.5">
                             <label 
                               style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                               className="py-1 px-3.5 rounded text-[10.5px] font-extrabold uppercase cursor-pointer select-none transition-all hover:opacity-85 border"
                             >
                               Change Image
                               <input 
                                 type="file"
                                 accept="image/*"
                                 className="hidden"
                                 onChange={async (e) => {
                                   const file = e.target.files?.[0];
                                   if (file) {
                                     try {
                                       const base64 = await compressAndResizeImage(file, 400, 400);
                                       setItemForm({ ...itemForm, photoUrl: base64, imageUrl: base64 });
                                     } catch (err) {
                                       alert('Error reading image file.');
                                     }
                                   }
                                 }}
                               />
                             </label>
                             
                             <button
                               type="button"
                               onClick={() => {
                                 setItemForm({ ...itemForm, photoUrl: '', imageUrl: '' });
                               }}
                               className="py-1 px-3.5 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 rounded text-[10.5px] font-bold uppercase text-red-500 cursor-pointer transition-all"
                             >
                               Remove Image
                             </button>
                           </div>
                        </div>
                      ) : (
                        /* Empty state: prompt upload click or drag */
                        <label className="w-full flex flex-col items-center justify-center py-5 cursor-pointer rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
                          <UploadCloud className="w-8 h-8 text-zinc-500 [.light-theme_&]:text-zinc-400 group-hover:text-emerald-400 group-hover:scale-105 transition-all mb-1.5" />
                          <span className="text-xs font-semibold group-hover:text-emerald-400 transition-colors" style={{ color: 'var(--text-primary)' }}>
                            Click to Upload Product Image
                          </span>
                          <span className="text-[10px] text-zinc-500 [.light-theme_&]:text-zinc-400 font-mono tracking-wider mt-1">
                            Accepts JPG, PNG, WEBP. Auto-scaled for performance.
                          </span>
                          <input 
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const base64 = await compressAndResizeImage(file, 400, 400);
                                  setItemForm({ ...itemForm, photoUrl: base64, imageUrl: base64 });
                                } catch (err) {
                                  alert('Error processing image.');
                                }
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <label className="text-xs font-medium font-sans" style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500 }}>Description</label>
                    <textarea
                      value={itemForm.description}
                      onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                      placeholder="Brief dimensions, features, size attributes..."
                      rows={2}
                      style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                      className="w-full border rounded-lg px-3.5 py-2 text-xs resize-none focus:outline-[#10b981] focus:border-[#10b981] transition-all"
                    />
                  </div>

                  <div className="flex justify-end pt-2 gap-2" style={{ borderTopColor: 'var(--border)', borderTopWidth: '1px' }}>
                    <button
                      type="button"
                      onClick={() => { setIsAddingItem(false); setIsEditingItem(null); }}
                      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
                      className="px-4 py-2 rounded-lg border text-xs transition-colors"
                    >
                      Cancel
                    </button>
                    
                    <button
                      type="submit"
                      className="px-4.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-440 text-black font-extrabold text-xs transition-colors"
                    >
                      Save to Catalogue
                    </button>
                  </div>
                </form>
              )}

               {/* Items Table List */}
               <div className="flex flex-col gap-4">
                 {storeData.items.length === 0 ? (
                   <div 
                     style={{ borderColor: 'var(--border)' }}
                     className="text-xs text-[var(--text-muted)] italic p-6 text-center border border-dashed rounded-xl"
                   >
                     No items configured on storefront catalogue list yet. Use List New Product button.
                   </div>
                 ) : (
                   <div className="flex flex-col gap-3">
                     {storeData.items.map((itm: any) => (
                       <div 
                         key={itm.id}
                         style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
                         className="border rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 hover:border-emerald-500/20 transition-all shadow-sm"
                       >
                         <div className="flex items-center gap-3.5 min-w-0">
                           {/* visual icon wrapper */}
                            <div 
                              style={{ backgroundColor: '#0a0a0a', borderColor: 'var(--border)' }}
                              className="w-11 h-11 rounded-lg border text-zinc-500 shrink-0 overflow-hidden flex items-center justify-center select-none relative"
                            >
                              {itm.photoUrl || itm.imageUrl ? (
                                <img 
                                  src={itm.photoUrl || itm.imageUrl} 
                                  alt={itm.name} 
                                  className="w-full h-full object-cover" 
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <ShoppingBag className="w-4 h-4 relative z-10" style={{ color: 'rgba(255,255,255,0.2)' }} strokeWidth={1.5} />
                              )}
                            </div>
                           <div className="flex flex-col min-w-0 text-left">
                             <span className="text-xs font-extrabold transition-colors" style={{ color: 'var(--text-primary)' }}>{itm.name}</span>
                             {itm.description && (
                               <span className="text-[10.5px] truncate max-w-[280px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{itm.description}</span>
                             )}
                           </div>
                         </div>

                         <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-2.5 sm:pt-0 select-none" style={{ borderTopColor: 'var(--border)' }}>
                           <span className="font-mono text-xs font-bold text-emerald-400">
                             {itm.currency === 'USD' ? '$' : '₦'}{Number(itm.price).toLocaleString()}
                           </span>

                           <div className="flex items-center gap-1.5 shrink-0">
                             <button
                               type="button"
                               onClick={() => handleOpenEditCatalogItem(itm)}
                               className="p-1.5 hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded transition-all cursor-pointer"
                               title="Edit item params"
                             >
                               <Edit2 className="w-3.5 h-3.5" />
                             </button>
                             
                             <button
                               type="button"
                               onClick={() => triggerConfirmModal('delete_item', () => handleDeleteCatalogItem(itm.id))}
                               className="p-1.5 hover:bg-red-500/10 text-red-500 hover:text-red-600 rounded transition-all cursor-pointer select-none"
                               title="Delete listed item"
                             >
                               <Trash2 className="w-3.5 h-3.5" />
                             </button>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>

              <div className="pt-6 mt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={saveCatalogChanges}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-440 text-black text-xs font-black uppercase tracking-wider transition-all active:scale-98 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: STANDALONE TRANSACTION ESCROW FEE ESTIMATOR */}
          {activeTab === 'calculator' && (
            <div className="animate-fade-in flex flex-col gap-4">
              <TransactionFeeCalculator
                currencyCode={storeData.currency || 'USD'}
                currencySymbol={storeData.currency === 'USD' ? '$' : '₦'}
                showHeader={true}
              />
              <div 
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                className="border p-6 rounded-2xl flex flex-col gap-3 font-sans text-left text-xs"
              >
                <h4 className="font-bold text-[10px] uppercase tracking-wider text-amber-500">Escrow Transparency Policy</h4>
                <p style={{ color: 'var(--text-muted)' }} className="leading-relaxed text-[11px]">
                  Trova charges a small secure escrow fee matching the scale of work or item value. By letting either the customer or merchant cover the fee, merchants can operate with absolute pricing clarity.
                </p>
                <div style={{ borderTopColor: 'var(--border)' }} className="border-t pt-3 mt-1 flex flex-col gap-2">
                  <div className="flex justify-between text-[11px]">
                    <span style={{ color: 'var(--text-muted)' }}>Underlying Bank Integration Fee</span>
                    <span style={{ color: 'var(--text-primary)' }} className="font-semibold">0% / Free</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span style={{ color: 'var(--text-muted)' }}>Dispute Mitigation Services</span>
                    <span style={{ color: 'var(--text-primary)' }} className="font-semibold font-mono">Included</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Visual live preview layout showcasing bank debit simulator card */}
        <div className="lg:col-span-5 flex flex-col gap-5 lg:sticky lg:top-24">
          <span className="text-[10px] font-black uppercase tracking-widest font-mono select-none" style={{ color: 'var(--text-muted)' }}>Live Public Storefront Card Preview</span>
          
          <div 
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
            className="border rounded-3xl p-6 sm:p-8 flex flex-col gap-6 relative items-center"
          >
            
            {/* Visual template watermark label */}
            <span 
              style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
              className="absolute top-4 right-4 border rounded px-2 py-0.5 text-[8.5px] font-bold text-zinc-500 font-mono uppercase tracking-wider select-none z-20"
            >
              SIMULATOR LINK
            </span>

            {/* MINI PROFILE PREVIEW COVERING PHOTO AND INSTANT PASTING updates */}
            <div className="flex flex-col items-center gap-2 mb-2 w-full select-none">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black select-none overflow-hidden duration-300 shadow-md hover:scale-[1.03]"
                style={{
                  backgroundColor: 'var(--surface2)',
                  color: 'var(--text-primary)',
                  border: storeData.profile?.profilePhoto ? '3px solid #10b981' : '2px solid var(--border)'
                }}
              >
                {storeData.profile?.profilePhoto ? (
                  <img 
                    src={storeData.profile.profilePhoto} 
                    alt={storeData.profile.businessName} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  (storeData.profile?.businessName || 'Store')
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()
                )}
              </div>
              <div className="text-center">
                <h3 className="text-xs font-bold leading-tight flex items-center justify-center gap-1" style={{ color: 'var(--text-primary)' }}>
                  <span>{storeData.profile?.businessName || 'Business Store'}</span>
                </h3>
                <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>@{storeData.profile?.username || 'handle'}</span>
              </div>
            </div>

            {/* THE BANK CARD COMPONENT SIMULATOR */}
            <div className="w-full max-w-[380px] h-[200px] rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#0f3460] p-5 relative overflow-hidden border border-[#27272a] flex flex-col justify-between shadow-2xl transition-transform hover:scale-[1.01] select-none text-left">
              {/* Pattern texture overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent opacity-15 pointer-events-none" />
              
              {/* Glow layout */}
              <div className="absolute -top-10 -left-10 w-24 h-24 bg-emerald-500/10 blur-2xl rounded-full pointer-events-none" />

              {/* Card Header row */}
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-[9.5px] font-bold tracking-widest text-[#a1a1aa] uppercase font-mono truncate max-w-[150px]">
                    {storeData.bankDetails.bankName || 'GTBANK'}
                  </span>
                  <div className="w-7 h-5 rounded bg-zinc-800/85 border border-zinc-700/30 flex items-center justify-center mt-1">
                    <div className="w-3 h-2 border border-zinc-600/30 rounded-sm" />
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 text-white/95">
                  <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />
                  <span className="text-[9px] font-black uppercase tracking-tighter font-mono">TROVA</span>
                </div>
              </div>

              {/* CARD ACCOUNT NUMBER COPIER PREVIEW */}
              <div className="my-2 select-all">
                <span className="font-mono text-lg font-bold tracking-widest text-white leading-none">
                  {formatBankNumberSpaces(storeData.bankDetails.accountNumber) || '0123 4567 8901 2345'}
                </span>
                <span className="text-[8.5px] text-emerald-400 font-mono block mt-1 tracking-wider uppercase font-semibold">TAP TO COPY CORRESPONDENT</span>
              </div>

              {/* Card Footer row */}
              <div className="flex items-end justify-between border-t border-zinc-800/40 pt-2.5">
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-[7px] text-zinc-400 uppercase tracking-widest font-mono">ACCOUNT NAME</span>
                  <span className="text-[10.5px] font-black text-white uppercase tracking-wide truncate max-w-[190px]">
                    {storeData.bankDetails.accountName || 'Account name'}
                  </span>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-[7px] text-zinc-400 uppercase tracking-widest font-mono">ACCOUNT TYPE</span>
                  <span className="text-[9px] font-bold text-emerald-400 tracking-wider font-mono uppercase">{storeData.bankDetails.accountType || 'Savings'}</span>
                </div>
              </div>
            </div>

            {/* Quick public listing elements indicators */}
            <div 
              style={{ borderTopColor: 'var(--border)' }}
              className="w-full flex flex-col gap-2 text-xs border-t pt-4 font-sans text-left"
            >
              <div className="flex justify-between">
                <span className="font-medium font-sans" style={{ color: 'var(--text-muted)' }}>Business Storefront Slug:</span>
                <span className="text-emerald-400 font-mono truncate max-w-[200px]">store/{sellerHandle}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium font-sans" style={{ color: 'var(--text-muted)' }}>Social channels:</span>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{storeData.links.length} Active Link(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium font-sans" style={{ color: 'var(--text-muted)' }}>Catalog products:</span>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{storeData.items.length} Product(s)</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      <ConfirmationModal 
        isOpen={modalOpen} 
        type={modalType} 
        onConfirm={handleConfirmAction} 
        onCancel={() => setModalOpen(false)} 
      />

    </div>
  );
}
