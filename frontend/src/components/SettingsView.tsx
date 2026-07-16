import React, { useState, useRef, useEffect } from 'react';
import ConfirmationModal, { ConfirmationModalType } from './ConfirmationModal';
import { 
  Building2, 
  CheckCircle, 
  Copy,
  Key,
  RefreshCw,
  Info,
  User,
  Image as ImageIcon,
  Smile,
  Upload,
  UserCheck,
  Globe,
  Trash2,
  ShieldCheck,
  Shield,
  Lock,
  Laptop,
  ShieldOff,
  Clock,
  XCircle,
  Volume2,
  VolumeX,
  Eye,
  EyeOff
} from 'lucide-react';
import { getCurrentSellerId, getSellerKycStatus, updateSellerKycStatus, getSellerById } from '../data/localStorage';
import { updateSellerProfile } from '../lib/services/seller';
import { sounds } from '../utils/sounds';

interface SettingsViewProps {
  profile?: {
    fullName: string;
    email: string;
    phone: string;
    bio: string;
    sticker: string;
    avatarUrl: string;
    instagram?: string;
    whatsapp?: string;
    twitter?: string;
    website?: string;
    businessName?: string;
    contactPhone?: string;
    selectedBank?: string;
    accountNumber?: string;
    resolvedAccountName?: string;
    customBankName?: string;
    customBankCountry?: string;
    customBankCurrency?: string;
    kycStatus?: string;
    kycTier?: number;
  };
  onProfileUpdate?: (profile: any) => void;
  onDeleteAccount?: () => void;
  onTriggerKYC?: () => void;
  defaultSubTab?: 'profile' | 'merchant' | 'developer';
}

const PROFILE_STICKERS = [
  { char: '👟', label: 'Sneaks & Kicks' },
  { char: '👗', label: 'Apparel & Boutique' },
  { char: '💻', label: 'Tech & Gadgets' },
  { char: '💄', label: 'Beauty & Cosmetics' },
  { char: '✨', label: 'Crafts & Handmade' },
  { char: '🍔', label: 'Food & Groceries' },
  { char: '⌚', label: 'Luxury Watches' },
  { char: '📚', label: 'Books & Learning' },
  { char: '🎨', label: 'Digital Services' },
  { char: '🌿', label: 'Health & Wellness' },
  { char: '🛠️', label: 'Home & Repair' },
  { char: '📦', label: 'General Goods' },
  { char: '🏠', label: 'Property and real estate' },
  { char: '🐦‍🔥', label: 'Others' }

];

const BANK_OPTIONS = [
  // Local Nigerian Commercial
  { id: '058', name: 'Guaranty Trust Bank (GTBank)', label: 'GTBank', group: 'Local commercial', logo: '🏦' },
  { id: '057', name: 'Zenith Bank', label: 'Zenith', group: 'Local commercial', logo: '🏦' },
  { id: '044', name: 'Access Bank', label: 'Access', group: 'Local commercial', logo: '🏦' },
  { id: '033', name: 'United Bank for Africa (UBA)', label: 'UBA', group: 'Local commercial', logo: '🏦' },
  { id: '011', name: 'First Bank of Nigeria', label: 'FirstBank', group: 'Local commercial', logo: '🏦' },
  { id: '030', name: 'Sterling Bank', label: 'Sterling', group: 'Local commercial', logo: '🏦' },
  { id: '101', name: 'Providus Bank', label: 'Providus', group: 'Local commercial', logo: '🏦' },
  { id: '035', name: 'Wema Bank / Alat', label: 'Wema / Alat', group: 'Local commercial', logo: '🏦' },
  
  // Local Nigerian Digital Bankers
  { id: '50211', name: 'Kuda Microfinance Bank', label: 'Kuda Bank', group: 'Local Digital / Neo-bank', logo: '📱' },
  { id: '999992', name: 'OPay Digital Services', label: 'OPay', group: 'Local Digital / Neo-bank', logo: '📱' },
  { id: '50515', name: 'Moniepoint Microfinance Bank', label: 'Moniepoint', group: 'Local Digital / Neo-bank', logo: '📱' },
  { id: '999991', name: 'PalmPay Limited', label: 'PalmPay', group: 'Local Digital / Neo-bank', logo: '📱' },
  { id: 'CHIPPER_WALLET', name: 'Chipper Cash Wallet', label: 'Chipper', group: 'Local Digital / Neo-bank', logo: '💸' },
  { id: 'PAGA_WALLET', name: 'Paga Wallet', label: 'Paga', group: 'Local Digital / Neo-bank', logo: '💸' },
  { id: 'FLUTTERWAVE_WALLET', name: 'Flutterwave Wallet', label: 'Flutterwave', group: 'Local Digital / Neo-bank', logo: '💳' },
  { id: 'PAYSTACK_WALLET', name: 'Paystack Wallet', label: 'Paystack', group: 'Local Digital / Neo-bank', logo: '💳' },
  { id: 'GEEGPAY_WALLET', name: 'Geegpay Wallet', label: 'Geegpay', group: 'Local Digital / Neo-bank', logo: '🌌' },
  { id: '566', name: 'VFD Microfinance Bank', label: 'VFD Bank', group: 'Local Digital / Neo-bank', logo: '📱' },
  { id: '565', name: 'Carbon Microfinance Bank', label: 'Carbon', group: 'Local Digital / Neo-bank', logo: '📱' },
  { id: '554', name: 'FairMoney Microfinance Bank', label: 'FairMoney', group: 'Local Digital / Neo-bank', logo: '📱' },
  
  // International Channels
  { id: 'WISE_USD', name: 'Wise Global Payout (USD Route - ACH)', label: 'Wise (USD)', group: 'International Channels', logo: '🗺️' },
  { id: 'PAYPAL_WALLET', name: 'PayPal Global Wallet (Multi-Currency)', label: 'PayPal', group: 'International Channels', logo: '🗺️' },
  { id: 'PAYONEER_USD', name: 'Payoneer Payout (USD Route - Virtual)', label: 'Payoneer (USD)', group: 'International Channels', logo: '🗺️' },
  { id: 'REVOLUT_USD', name: 'Revolut Business Wire (USD Route)', label: 'Revolut (USD)', group: 'International Channels', logo: '🗺️' },
  { id: 'WISE_GBP', name: 'Wise Business Payout (GBP Route - FPS)', label: 'Wise (GBP)', group: 'International Channels', logo: '🗺️' },
  { id: 'REVOLUT_EUR', name: 'Revolut Business Payout (EUR Route - SEPA)', label: 'Revolut (EUR)', group: 'International Channels', logo: '🗺️' },
  { id: 'MERCURY_USD', name: 'Mercury Worldwide Business Checking (USD)', label: 'Mercury (USD)', group: 'International Channels', logo: '🗺️' },
  { id: 'STRIPE_USD', name: 'Stripe Worldwide Merchant Payout (USD)', label: 'Stripe Pay', group: 'International Channels', logo: '🗺️' },
  { id: 'APPLE_GOOGLE_WALLET', name: 'Apple Pay / Google Wallet', label: 'Apple/Google Pay', group: 'International Channels', logo: '🗺️' },
  { id: 'SEPA_EUR', name: 'Eurozone SEPA IBAN Wire Payout', label: 'SEPA wire', group: 'International Channels', logo: '🗺️' },
  
  // Custom Global
  { id: 'CUSTOM_GLOBAL', name: 'Other Worldwide / Custom Bank', label: 'Custom Global Bank', group: 'Custom Global Channels', logo: '🌍' }
];

export default function SettingsView({ profile, onProfileUpdate, onDeleteAccount, onTriggerKYC, defaultSubTab }: SettingsViewProps) {
  const [pwaPromptAvailable, setPwaPromptAvailable] = useState(() => typeof window !== "undefined" ? !!window.deferredPWAInstallPrompt : false);
  const [isAppStandalone, setIsAppStandalone] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
  });

  useEffect(() => {
    const handlePromptReady = () => setPwaPromptAvailable(true);
    const handlePromptCleared = () => setPwaPromptAvailable(false);

    window.addEventListener("trustlink_pwa_prompt_ready", handlePromptReady);
    window.addEventListener("trustlink_pwa_prompt_cleared", handlePromptCleared);

    return () => {
      window.removeEventListener("trustlink_pwa_prompt_ready", handlePromptReady);
      window.removeEventListener("trustlink_pwa_prompt_cleared", handlePromptCleared);
    };
  }, []);

  const [soundMutedState, setSoundMutedState] = useState(() => sounds.getMuteState());

  useEffect(() => {
    const handleMuteChange = (e: Event) => {
      const isMuted = (e as CustomEvent).detail;
      setSoundMutedState(isMuted);
    };
    window.addEventListener('trustlink_mute_changed', handleMuteChange);
    return () => {
      window.removeEventListener('trustlink_mute_changed', handleMuteChange);
    };
  }, []);

  const handleToggleMute = () => {
    const newVal = !soundMutedState;
    sounds.setMuteState(newVal);
    setSoundMutedState(newVal);
  };

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('trustlink_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    const handleStorage = () => {
      const current = (localStorage.getItem('trustlink_theme') as 'dark' | 'light') || 'dark';
      setTheme(current);
    };
    window.addEventListener('storage', handleStorage);
    // Also run a local check interval because storage listener doesn't trigger on of same-window manual clicks
    const interval = setInterval(handleStorage, 1000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  // Local fallback state if props not passed (integrated smoothly)
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

  const activeProfile = {
    ...defaultProfile,
    ...profile
  } as any;

  // Personal profile forms state
  const [fullName, setFullName] = useState(activeProfile.fullName);
  const [email, setEmail] = useState(activeProfile.email);
  const [phone, setPhone] = useState(activeProfile.phone);
  const [bio, setBio] = useState(activeProfile.bio);
  const [sticker, setSticker] = useState(activeProfile.sticker);
  const [avatarUrl, setAvatarUrl] = useState(activeProfile.avatarUrl);

  // Social link option states
  const [instagram, setInstagram] = useState(activeProfile.instagram || '');
  const [whatsapp, setWhatsapp] = useState(activeProfile.whatsapp || '');
  const [twitter, setTwitter] = useState(activeProfile.twitter || '');
  const [website, setWebsite] = useState(activeProfile.website || '');

  // Business and banking options state
  const [businessName, setBusinessName] = useState(activeProfile.businessName || '');
  const [contactPhone, setContactPhone] = useState(activeProfile.contactPhone || '');
  const [selectedBank, setSelectedBank] = useState(activeProfile.selectedBank || '');
  const [accountNumber, setAccountNumber] = useState(activeProfile.accountNumber || '');
  const [resolvedAccountName, setResolvedAccountName] = useState(activeProfile.resolvedAccountName || '');
  const [isResolving, setIsResolving] = useState(false);
  const [resolveProgressLog, setResolveProgressLog] = useState<string[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [urlError, setUrlError] = useState('');

  // Search parameters & Custom alternative bank type details
  const [customBankName, setCustomBankName] = useState(activeProfile.customBankName || '');
  const [customBankCountry, setCustomBankCountry] = useState(activeProfile.customBankCountry || 'United States');
  const [customBankCurrency, setCustomBankCurrency] = useState(activeProfile.customBankCurrency || 'USD');
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);

  // Region and Custom select trackers
  const [settlementRegion, setSettlementRegion] = useState<'domestic' | 'international'>(() => {
    const isIntBank = ['WISE_USD', 'PAYONEER_USD', 'REVOLUT_USD', 'WISE_GBP', 'REVOLUT_EUR', 'MERCURY_USD', 'STRIPE_USD', 'SEPA_EUR', 'CUSTOM_GLOBAL'].includes(activeProfile.selectedBank || '058');
    return isIntBank ? 'international' : 'domestic';
  });
  const [customBankNameSelect, setCustomBankNameSelect] = useState(() => {
    const popularInts = ["Chase Bank", "Bank of America", "Wells Fargo", "HSBC Bank", "Barclays Bank", "Lloyds Bank", "Deutsche Bank", "Royal Bank of Canada", "BNP Paribas"];
    const savedName = activeProfile.customBankName || '';
    if (savedName && popularInts.includes(savedName)) {
      return savedName;
    }
    return savedName ? 'other' : 'Chase Bank';
  });

  // IMPROVEMENT 5 — TWO-FACTOR AUTHENTICATION STATE
  const [tfaActive, setTfaActive] = useState(() => localStorage.getItem('trustlink_2fa_active') === 'true');
  const [tfaMethod, setTfaMethod] = useState(() => localStorage.getItem('trustlink_2fa_method') || 'Authenticator App');
  const [tfaModalOpen, setTfaModalOpen] = useState(false);
  const [tfaSubTab, setTfaSubTab] = useState<'authenticator' | 'sms' | 'email'>('authenticator');

  // ACCOUNT DELETION RE-CONFIRMATION PASSWORD MODAL STATE
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState('');
  const [showDeletePasswordReveal, setShowDeletePasswordReveal] = useState(false);
  
  // Method Inputs
  const [tfaCode, setTfaCode] = useState('');
  const [tfaSmsPhone, setTfaSmsPhone] = useState('');
  const [tfaCodeSent, setTfaCodeSent] = useState(false);
  const [tfaValidationError, setTfaValidationError] = useState('');
  const [tfaSuccess, setTfaSuccess] = useState(false);
  
  const [copiedKeyText, setCopiedKeyText] = useState(false);
  const [copiedBackupText, setCopiedBackupText] = useState(false);

  const tfaSecretKey = "TL2F-7UHG-98WS-P3O1";
  
  const tfaBackupCodes = [
    'GF89-D98B-91C0',
    'KJ72-N20C-83W1',
    'XZ49-P92O-00Z1',
    'DF4F-G6Y5-8YT4',
    'AQ11-X4E2-88W9',
    'HG52-B48R-11F2',
    'YT77-P02Q-55A3',
    'PL00-Z28C-99V8'
  ];

  // Developer credentials state
  const [webhookUrl, setWebhookUrl] = useState('');
  const [apiKey, setApiKey] = useState('tl_live_key_9fca88e21a48c480aef84029a1');
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Confirmation modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ConfirmationModalType>('regenerate_api');
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

  const handleFinalDeleteAccount = () => {
    if (!deletePassword) {
      setDeletePasswordError('Password is required.');
      return;
    }
    if (deletePassword.length < 6) {
      setDeletePasswordError('Password must be at least 6 characters for security.');
      return;
    }
    
    setShowPasswordModal(false);
    if (onDeleteAccount) {
      onDeleteAccount();
    } else {
      alert("Account deleted permanently.");
    }
  };

  const handleRegenerateApiKey = () => {
    const randomHex = Array.from({length: 24}, () => Math.floor(Math.random()*16).toString(16)).join('');
    setApiKey(`tl_live_key_${randomHex}`);
  };

  // Sub-tabs management
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'merchant' | 'developer'>(() => {
    // If defaultSubTab is provided, use that first
    if (defaultSubTab) {
      return defaultSubTab;
    }
    // Otherwise check the URL hash
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '');
      if (['profile', 'merchant', 'developer'].includes(hash)) {
        return hash as any;
      }
    }
    return 'profile';
  });

  useEffect(() => {
    if (defaultSubTab) {
      setActiveSubTab(defaultSubTab);
    }
  }, [defaultSubTab]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.hash = activeSubTab;
    }
  }, [activeSubTab]);

  // Tier compliance and Advanced KYC logic states
  const [kycTier, setKycTier] = useState<number>(() => {
    return activeProfile.kycTier || (activeProfile.kycStatus === 'verified' ? 2 : 1);
  });
  const [kycStatusState, setKycStatusState] = useState<'unverified' | 'pending' | 'verified' | 'rejected'>(() => {
    return getSellerKycStatus(getCurrentSellerId());
  });

  const currentSellerObj = getSellerById(getCurrentSellerId());
  const currentKycRejectionReason = currentSellerObj?.kyc_rejection_reason || 'The uploaded file scan does not match the entered document type or the image quality was too low.';
  const currentKycSubmittedAtStr = currentSellerObj?.kyc_submitted_at 
    ? new Date(currentSellerObj.kyc_submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) 
    : new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    const syncStatus = () => {
      setKycStatusState(getSellerKycStatus(getCurrentSellerId()));
    };
    window.addEventListener('storage', syncStatus);
    window.addEventListener('trustlink_sellers_changed', syncStatus);
    window.addEventListener('trustlink_kyc_status_updated', syncStatus);
    // Poll to make sure UI is immediately responsive
    const interval = setInterval(syncStatus, 1000);
    return () => {
      window.removeEventListener('storage', syncStatus);
      window.removeEventListener('trustlink_sellers_changed', syncStatus);
      window.removeEventListener('trustlink_kyc_status_updated', syncStatus);
      clearInterval(interval);
    };
  }, []);

  const [selectedUpgradeTarget, setSelectedUpgradeTarget] = useState<2 | 3 | null>(null);
  
  // Verification forms
  const [govIdType, setGovIdType] = useState<'BVN' | 'NIN'>('BVN');
  const [govIdValue, setGovIdValue] = useState('');
  const [uploadedIdFileName, setUploadedIdFileName] = useState('');
  const [cacRcNumber, setCacRcNumber] = useState('');
  const [uploadedCacFileName, setUploadedCacFileName] = useState('');
  
  // API matching log simulation
  const [apiVerificationActive, setApiVerificationActive] = useState(false);
  const [apiLogs, setApiLogs] = useState<string[]>([]);
  const [apiResultSuccess, setApiResultSuccess] = useState<boolean | null>(null);

  // Drag-and-drop style controls
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isInternational = settlementRegion === 'international';

  const handleBankResolve = () => {
    const isValidLength = isInternational ? (accountNumber.length >= 8) : (accountNumber.length === 10);
    if (!isValidLength) return;

    setIsResolving(true);
    setResolvedAccountName('');
    setResolveProgressLog(["Verifying account connection with payment gateway..."]);
    
    setTimeout(() => {
      setResolveProgressLog(prev => [...prev, "Checking active bank databases..."]);
    }, 300);

    setTimeout(() => {
      setResolveProgressLog(prev => [...prev, "Confirming account settlement route..."]);
    }, 700);

    setTimeout(() => {
      setIsResolving(false);
      
      // Capitalize the merchant name beautifully
      const formattedMerchant = fullName ? fullName.trim().toUpperCase() : 'VOLT KICKS NIGERIA ENTERPRISES';
      const activeBankObj = BANK_OPTIONS.find(b => b.id === selectedBank);
      const bankLabel = activeBankObj ? activeBankObj.label : 'Channel';

      if (selectedBank === 'CUSTOM_GLOBAL') {
        const bankTitle = (customBankName || 'Other International Bank').toUpperCase();
        const currencyTitle = customBankCurrency.toUpperCase();
        setResolvedAccountName(`${formattedMerchant} (${bankTitle} - ${currencyTitle} wire)`);
      } else if (isInternational) {
        setResolvedAccountName(`${formattedMerchant} (Verified Global Settlement - ${bankLabel})`);
      } else {
        setResolvedAccountName(`${formattedMerchant} (Verified Account)`);
      }
    }, 1200);
  };

  // Masterclass automatic fintech NUBAN/routing account name generator
  useEffect(() => {
    const targetLen = isInternational ? 8 : 10;
    
    // Automatically trigger if the user typed the exact valid length and it's not currently resolved or resolving
    if (accountNumber.length === targetLen && !isResolving && !resolvedAccountName) {
      handleBankResolve();
    }
  }, [accountNumber, isInternational, isResolving, resolvedAccountName]);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result as string;
      setAvatarUrl(b64);
      // Trigger instant callback if active to update navbar dynamically
      if (onProfileUpdate) {
        onProfileUpdate({
          ...activeProfile,
          avatarUrl: b64,
          fullName,
          email,
          phone,
          bio,
          sticker,
          instagram,
          whatsapp,
          twitter,
          website
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError('');

    let validatedWebsite = website.trim();
    if (validatedWebsite) {
      if (!/^https?:\/\//i.test(validatedWebsite)) {
        validatedWebsite = 'https://' + validatedWebsite;
      }
      try {
        const parsed = new URL(validatedWebsite);
        if (!parsed.hostname.includes('.') || parsed.hostname.split('.').pop()!.length < 2) {
          setUrlError('Please enter a valid website address (e.g. https://voltkicks.ng or voltkicks.ng).');
          return;
        }
      } catch (err) {
        setUrlError('Please enter a valid website address (e.g. https://voltkicks.ng or voltkicks.ng).');
        return;
      }
    }

    const updated = {
      ...activeProfile,
      fullName,
      email,
      phone,
      bio,
      sticker,
      avatarUrl,
      instagram,
      whatsapp,
      twitter,
      website: validatedWebsite,
      businessName,
      contactPhone,
      selectedBank,
      accountNumber,
      resolvedAccountName,
      customBankName,
      customBankCountry,
      customBankCurrency
    };

    if (activeProfile.id && activeProfile.profileId) {
      const result = await updateSellerProfile(
        activeProfile.id,
        activeProfile.profileId,
        {
          displayName: fullName,
          businessName,
          phone,
          bio,
          avatarUrl,
          instagramHandle: instagram,
          whatsapp,
          twitterHandle: twitter,
          website: validatedWebsite,
          sticker,
          contactPhone,
          selectedBank,
          accountNumber,
          resolvedAccountName,
          customBankName,
          customBankCountry,
          customBankCurrency
        }
      );

      if (!result.success) {
        console.error('Profile update failed:', result.error);
        alert(result.error || 'Profile update failed. Please try again.');
        return;
      }
    }

    if (onProfileUpdate) {
      onProfileUpdate(updated);
    } else {
      localStorage.setItem('trustlink-profile', JSON.stringify(updated));
    }

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };

  const handleCopyKey = () => {
    navigator.clipboard?.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const filteredBanks = BANK_OPTIONS.filter(b => 
    b.name.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
    b.label.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
    b.group.toLowerCase().includes(bankSearchQuery.toLowerCase())
  );
  const selectedBankObj = BANK_OPTIONS.find(b => b.id === selectedBank) || BANK_OPTIONS[0];

  return (
    <div id="settings-view-container" className="flex flex-col gap-6 text-left font-sans w-full max-w-full overflow-visible">
      
      {/* Settings Tab Header Menu */}
      <div 
        style={{ borderBottomColor: 'var(--border)' }}
        className="flex border-b pb-1.5 gap-1.5 select-none overflow-x-auto no-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        <button
          type="button"
          onClick={() => setActiveSubTab('profile')}
          className={`px-3 py-2 border-b-2 text-[10.5px] sm:text-xs font-bold uppercase tracking-wider transition-all h-9 cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeSubTab === 'profile'
              ? 'border-emerald-500 text-emerald-500 font-extrabold'
              : 'border-transparent hover:text-[var(--text-primary)]'
          }`}
          style={{ color: activeSubTab === 'profile' ? 'var(--text-primary)' : 'var(--text-muted)' }}
        >
          <User className="w-3.5 h-3.5 shrink-0" />
          <span>My Personal Profile</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('merchant')}
          className={`px-3 py-2 border-b-2 text-[10.5px] sm:text-xs font-bold uppercase tracking-wider transition-all h-9 cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeSubTab === 'merchant'
              ? 'border-emerald-500 text-emerald-500 font-extrabold'
              : 'border-transparent hover:text-[var(--text-primary)]'
          }`}
          style={{ color: activeSubTab === 'merchant' ? 'var(--text-primary)' : 'var(--text-muted)' }}
        >
          <Building2 className="w-3.5 h-3.5 shrink-0" />
          <span>Settlement & Merchant Profile</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('developer')}
          className={`px-3 py-2 border-b-2 text-[10.5px] sm:text-xs font-bold uppercase tracking-wider transition-all h-9 cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
            activeSubTab === 'developer'
              ? 'border-emerald-500 text-emerald-500 font-extrabold'
              : 'border-transparent hover:text-[var(--text-primary)]'
          }`}
          style={{ color: activeSubTab === 'developer' ? 'var(--text-primary)' : 'var(--text-muted)' }}
        >
          <Key className="w-3.5 h-3.5 shrink-0" />
          <span>Developer & Webhooks</span>
        </button>
      </div>

      {isSaved && (
        <div className="bg-emerald-500 text-black px-4 py-2 text-xs font-bold rounded-md shadow-lg flex items-center gap-2 fixed bottom-6 right-6 z-50">
          <CheckCircle className="w-4 h-4" />
          <span>Profile configuration saved successfully!</span>
        </div>
      )}

      {/* Main settings dynamic screen routing */}
      <form onSubmit={handleSaveAll} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full max-w-full">
        
        {/* Left main controls column (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6 w-full max-w-full overflow-hidden">
          
          {activeSubTab === 'profile' && (
            <div className="flex flex-col gap-6 w-full max-w-full">
              
              {/* Profile details input card */}
              <div 
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
                className="border rounded-xl p-4 sm:p-6 flex flex-col gap-5"
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Personal Contact Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 animate-hover">
                    <label className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Chinedu Okafor"
                      style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      className="border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 transition-all font-medium"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 animate-hover">
                    <label className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Private Escrow Contact Phone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +234 812 345 6789"
                      style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      className="border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 transition-all font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2 animate-hover">
                    <label className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Login Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. chinedu@example.com"
                      style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      className="border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 sm:col-span-2 animate-hover">
                    <label className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Merchant Profile Biography / Escrow Tagline</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      maxLength={180}
                      rows={3}
                      placeholder="Tell buyers about your business..."
                      style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      className="border rounded-lg p-3 text-xs focus:outline-none focus:border-emerald-500 transition-all font-sans resize-none"
                    />
                    <div className="text-[10px] text-zinc-550 text-right">
                      {bio.length}/180 Characters
                    </div>
                  </div>
                </div>
              </div>

              {/* Social and Store Links Card */}
              <div 
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
                className="border rounded-xl p-4 sm:p-6 flex flex-col gap-5"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Social Contact & Store Links</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 animate-hover">
                    <label className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Instagram Handle</label>
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="e.g. voltkicks (strip @ if entered)"
                      style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      className="border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 transition-all font-medium font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 animate-hover">
                    <label className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>WhatsApp Number</label>
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="e.g. +234 812 345 6789"
                      style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      className="border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 transition-all font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 animate-hover">
                    <label className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Twitter / X Handle</label>
                    <input
                      type="text"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      placeholder="e.g. @voltkicks"
                      style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      className="border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 transition-all font-medium font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 animate-hover">
                    <label className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>General Website or Link</label>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => {
                        setWebsite(e.target.value);
                        if (urlError) setUrlError('');
                      }}
                      placeholder="e.g. https://voltkicks.ng"
                      style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      className="border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 transition-all font-medium"
                    />
                    {urlError && (
                      <span className="text-[10px] text-red-400 font-sans mt-0.5 pl-1 block leading-tight">
                        ⚠️ {urlError}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile image and stickers settings */}
              <div 
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
                className="border rounded-xl p-4 sm:p-6 flex flex-col gap-5"
              >
                <div className="flex items-center gap-2">
                  <Smile className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Avatar Profile Sticker & Picture Upload</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Photo Drag and Drop container */}
                  <div className="flex flex-col gap-2.5">
                    <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Upload profile photo</span>
                    
                    <div
                      id="profile-upload-box"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      style={isDragging ? { backgroundColor: 'rgba(16, 185, 129, 0.05)', borderColor: '#10b981' } : { backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
                      className={`border-2 border-dashed rounded-xl p-5 text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-all min-h-[160px] hover:border-emerald-500/50`}
                    >
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden" 
                      />
                      <Upload id="profile-upload-icon" className="w-7 h-7 text-zinc-500" />
                      
                      <div className="text-xs profile-upload-text" style={{ color: 'var(--text-primary)' }}>
                        <span className="text-emerald-500 font-bold clickable-text">Click to upload</span> or drag and drop
                      </div>
                      <span className="text-[9.5px] profile-upload-hint" style={{ color: 'var(--text-muted)' }}>
                        PNG, JPEG, GIF up to 2MB (Instant resolution)
                      </span>
                    </div>

                    {avatarUrl && (
                      <button
                        id="delete-avatar-btn"
                        type="button"
                        onClick={() => triggerConfirmModal('delete_avatar', () => setAvatarUrl(''))}
                        className="py-1.5 px-3 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-[10.5px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer mt-1 self-start transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete uploaded photo</span>
                      </button>
                    )}
                  </div>

                  {/* Icon stickers grid */}
                  <div className="flex flex-col gap-2.5">
                    <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Select active profile sticker</span>
                    
                    <div 
                      id="sticker-grid-container" 
                      style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
                      className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-4 gap-2 p-3 rounded-xl border"
                    >
                      {PROFILE_STICKERS.map((st) => {
                        const isSelected = sticker === st.char;
                        return (
                          <button
                            key={st.char}
                            type="button"
                            onClick={() => setSticker(st.char)}
                            style={{ 
                              backgroundColor: isSelected ? 'var(--surface)' : 'var(--surface2)',
                              borderColor: isSelected ? '#10b981' : 'var(--border)',
                              color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)'
                            }}
                            className={`sticker-cell p-2 rounded-lg border text-base flex items-center justify-center cursor-pointer transition-all hover:scale-105 min-h-[44px] ${
                              isSelected
                                ? 'sticker-cell-selected bg-emerald-500/10 border-emerald-500/60 shadow-md scale-[1.02]'
                                : 'hover:border-emerald-500/40 text-zinc-300'
                            }`}
                            title={st.label}
                          >
                            <span>{st.char}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>

              {/* TWO-FACTOR AUTHENTICATION CONTROL CARD */}
              <div 
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
                className="border rounded-xl p-4 sm:p-6 flex flex-col gap-5 select-none"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex gap-3 text-left">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Two-Factor Authentication (2FA)</span>
                        {tfaActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-450 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-zinc-900 text-zinc-500 border border-zinc-800">
                            Disabled
                          </span>
                        )}
                      </div>
                      <p className="text-[11.5px] text-[var(--text-muted)] mt-1.5 leading-relaxed max-w-xl">
                        Two-Factor Authentication adds an extra vector of defensive security protecting payouts configurations and merchant API key access.
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center">
                    {tfaActive ? (
                      <button
                        type="button"
                        onClick={() => {
                          setTfaActive(false);
                          localStorage.setItem('trustlink_2fa_active', 'false');
                        }}
                        className="py-1.5 px-3.5 rounded-lg border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-xs font-bold uppercase transition-all cursor-pointer"
                      >
                        Disable 2FA
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          // Open setup modal
                          setTfaSubTab('authenticator');
                          setTfaCode('');
                          setTfaSmsPhone('');
                          setTfaCodeSent(false);
                          setTfaValidationError('');
                          setTfaSuccess(false);
                          setCopiedKeyText(false);
                          setCopiedBackupText(false);
                          setTfaModalOpen(true);
                        }}
                        className="py-2 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-450 text-black text-xs font-extrabold uppercase transition-all cursor-pointer shadow-md active:scale-[0.98]"
                      >
                        Enable 2FA
                      </button>
                    )}
                  </div>
                </div>

                {tfaActive && (
                  <div className="border-t border-dashed border-zinc-800/80 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                    <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">Secured Channel:</span>
                    <span className="text-xs font-bold font-sans text-emerald-450 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      {tfaMethod} Protected
                    </span>
                  </div>
                )}
              </div>

              {/* System Sounds Toggle Block */}
              <div 
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
                className="border rounded-xl p-4 sm:p-6 flex flex-col gap-5 select-none"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex gap-3 text-left">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                      <Volume2 className="w-5 h-5 animate-hover" />
                    </div>
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>System Sound Effects</span>
                        {!soundMutedState ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
                            Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/10">
                            Muted
                          </span>
                        )}
                      </div>
                      <p className="text-[11.5px] text-[var(--text-muted)] mt-1.5 leading-relaxed max-w-xl">
                        Enables clean acoustic waveforms for successful payment release confirmations and cooperative dispute settlement boundaries.
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={!soundMutedState} 
                        onChange={handleToggleMute} 
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-350 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-black"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* DANGER ZONE: DELETE ACCOUNT PERMANENTLY */}
              <div 
                style={{ backgroundColor: 'var(--surface)', borderColor: 'rgba(239, 68, 68, 0.2)', boxShadow: 'var(--shadow)' }}
                className="border border-red-500/15 rounded-xl p-4 sm:p-6 flex flex-col gap-5 select-none mt-4 bg-red-500/[0.01]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex gap-3 text-left">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-red-500">Danger Zone</span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-500/15 text-red-500 border border-red-500/10">
                          Irreversible
                        </span>
                      </div>
                      <p className="text-[11.5px] text-[var(--text-muted)] mt-1.5 leading-relaxed max-w-xl">
                        Deleting your merchant account will permanently wipe your profile metadata, active Trova link products catalog, escrow transactions record, and unpaid settlement logs.
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center">
                    <button
                      type="button"
                      onClick={() => {
                        triggerConfirmModal('delete_account', () => {
                          setShowPasswordModal(true);
                          setDeletePassword('');
                          setDeletePasswordError('');
                          setShowDeletePasswordReveal(false);
                        });
                      }}
                      className="w-full sm:w-auto py-2 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold uppercase tracking-wide transition-all cursor-pointer shadow-md active:scale-[0.98]"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeSubTab === 'merchant' && (
            <div className="flex flex-col gap-6 w-full max-w-full">
              {/* Profile Card */}
              <div 
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
                className="border rounded-xl p-4 sm:p-6 flex flex-col gap-5"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Merchant Business Profile</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 sm:col-span-2 animate-hover">
                    <div className="flex justify-between items-center text-[11px] font-semibold uppercase tracking-wider">
                      <label style={{ color: 'var(--text-muted)' }}>Registered Trade Name</label>
                      <span className="text-[10px] font-mono font-normal" style={{ color: 'var(--text-dim)' }}>
                        {(businessName || '').length}/50
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={50}
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      className="border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 transition-all font-medium"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 animate-hover">
                    <label className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Contact Telephone Number</label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      className="border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 transition-all font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 animate-hover">
                    <label className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Support Email Address</label>
                    <input
                      type="email"
                      placeholder="support@yourbusiness.com"
                      style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      className="border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Details Resolution Card */}
              <div 
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
                className="border rounded-xl p-4 sm:p-6 flex flex-col gap-6"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 rounded-full h-4 bg-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Settlement Bank Settings</span>
                </div>

                {/* Segment Switcher */}
                <div className="flex flex-col gap-1.5 w-full text-left">
                  <label className="text-[11px] uppercase tracking-wider font-semibold text-left" style={{ color: 'var(--text-muted)' }}>
                    Settlement Location & Currency
                  </label>
                  <div style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border)' }} className="flex p-1 rounded-xl border max-w-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setSettlementRegion('domestic');
                        setSelectedBank('058'); // GTBank
                        setAccountNumber('');
                        setResolvedAccountName('');
                      }}
                      style={{
                        backgroundColor: settlementRegion === 'domestic' ? '#10b981' : 'transparent',
                        color: settlementRegion === 'domestic' ? '#000000' : 'var(--text-muted)'
                      }}
                      className={`flex-1 py-1 px-3 text-xs font-bold rounded-lg transition-all h-8 cursor-pointer ${
                        settlementRegion === 'domestic'
                          ? 'shadow-md font-extrabold'
                          : 'hover:text-[var(--text-primary)] font-semibold'
                      }`}
                    >
                      🇳🇬 Nigerian Bank (NGN)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSettlementRegion('international');
                        setSelectedBank('WISE_USD');
                        setAccountNumber('');
                        setResolvedAccountName('');
                      }}
                      style={{
                        backgroundColor: settlementRegion === 'international' ? '#10b981' : 'transparent',
                        color: settlementRegion === 'international' ? '#000000' : 'var(--text-muted)'
                      }}
                      className={`flex-1 py-1 px-3 text-xs font-bold rounded-lg transition-all h-8 cursor-pointer ${
                        settlementRegion === 'international'
                          ? 'shadow-md font-extrabold'
                          : 'hover:text-[var(--text-primary)] font-semibold'
                      }`}
                    >
                      🌐 Global Routes (USD/EUR)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end text-left">
                  {/* Bank Selector depending on region */}
                  <div className="flex flex-col gap-1.5 md:col-span-5 w-full text-left">
                    {settlementRegion === 'domestic' ? (
                      <>
                        <label className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>
                          Settlement Bank
                        </label>
                        <select
                          value={selectedBank}
                          onChange={(e) => {
                            setSelectedBank(e.target.value);
                            setAccountNumber('');
                            setResolvedAccountName('');
                          }}
                          style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                          className="border rounded-lg px-3 py-2.5 text-xs cursor-pointer focus:outline-none focus:border-emerald-500 w-full"
                        >
                          <option value="058">Guaranty Trust Bank (GTBank)</option>
                          <option value="057">Zenith Bank</option>
                          <option value="044">Access Bank</option>
                          <option value="033">United Bank for Africa (UBA)</option>
                          <option value="011">First Bank of Nigeria</option>
                          <option value="50211">Kuda Microfinance Bank</option>
                          <option value="999992">OPay Digital Services</option>
                          <option value="50515">Moniepoint Microfinance Bank</option>
                          <option value="999991">PalmPay Limited</option>
                          <option value="030">Sterling Bank</option>
                          <option value="101">Providus Bank</option>
                          <option value="035">Wema Bank / Alat</option>
                          <option value="566">VFD Microfinance Bank</option>
                          <option value="565">Carbon Microfinance Bank</option>
                          <option value="554">FairMoney Microfinance Bank</option>
                        </select>
                      </>
                    ) : (
                      <>
                        <label className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>
                          International Payout Route
                        </label>
                        <select
                          value={selectedBank}
                          onChange={(e) => {
                            setSelectedBank(e.target.value);
                            setAccountNumber('');
                            setResolvedAccountName('');
                          }}
                          style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                          className="border rounded-lg px-3 py-2.5 text-xs cursor-pointer focus:outline-none focus:border-emerald-500 w-full"
                        >
                          <option value="WISE_USD">Wise Global Payout (USD Route - ACH)</option>
                          <option value="PAYPAL_WALLET">PayPal Global Wallet (Multi-Currency)</option>
                          <option value="PAYONEER_USD">Payoneer Payout (USD Route - Virtual)</option>
                          <option value="REVOLUT_USD">Revolut Business Wire (USD Route)</option>
                          <option value="WISE_GBP">Wise Business Payout (GBP Route - FPS)</option>
                          <option value="REVOLUT_EUR">Revolut Business Payout (EUR Route - SEPA)</option>
                          <option value="MERCURY_USD">Mercury Worldwide Business Checking (USD)</option>
                          <option value="STRIPE_USD">Stripe Worldwide Merchant Payout (USD)</option>
                          <option value="APPLE_GOOGLE_WALLET">Apple Pay / Google Wallet</option>
                          <option value="SEPA_EUR">Eurozone SEPA IBAN Wire Payout</option>
                          <option value="CUSTOM_GLOBAL">Other Worldwide / Custom Bank</option>
                        </select>
                      </>
                    )}
                  </div>

                  {/* Account Numbers and Wires */}
                  <div className="flex flex-col gap-1.5 md:col-span-4 w-full text-left">
                    <label className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>
                      {isInternational ? 'International Account / IBAN' : 'Account Number (NUBAN)'}
                    </label>
                    <input
                      type="text"
                      maxLength={isInternational ? 34 : 10}
                      value={accountNumber}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAccountNumber(isInternational ? val.replace(/[^A-Za-z0-9]/g, '') : val.replace(/[^0-9]/g, ''));
                        setResolvedAccountName('');
                      }}
                      placeholder={isInternational ? "e.g. US12345678 or IBAN/Swift" : "10 Digits"}
                      style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      className="border rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-500 font-mono transition-all w-full"
                    />
                  </div>

                  {/* Manual trigger verify button */}
                  <div className="md:col-span-3 w-full">
                    <button
                      type="button"
                      onClick={handleBankResolve}
                      disabled={isResolving || (isInternational ? accountNumber.length < 8 : accountNumber.length !== 10)}
                      style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      className="w-full border hover:border-emerald-500 disabled:opacity-45 disabled:cursor-not-allowed text-xs font-bold py-2 px-3.5 rounded-lg h-9.5 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isResolving ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      ) : (
                        <span className="text-emerald-400">Verify Account</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Subtext describing NUBAN or routing rules */}
                <div 
                  style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
                  className="text-left text-[11.5px] p-4 rounded-xl border leading-relaxed max-w-full"
                >
                  {!isInternational ? (
                    <p style={{ color: 'var(--text-muted)' }}>
                      💡 <strong style={{ color: 'var(--text-primary)' }}>NUBAN</strong> stands for <em className="text-emerald-400 font-semibold not-italic">Nigeria Uniform Bank Account Number</em>. It is a 10-digit standardized structure used across all digital and commercial banks in Nigeria. Enter your 10 digits above and your registered merchant account name will be confirmed automatically in real-time.
                    </p>
                  ) : (
                    <p style={{ color: 'var(--text-muted)' }}>
                      💡 For international payouts, select your virtual channel and pick your international provider below. Enter your standard routing or Swift/IBAN structure (minimum 8 characters) to initiate auto-lookup.
                    </p>
                  )}
                </div>

                {/* If International: show custom international bank selector/manual input */}
                {isInternational && (
                  <div 
                    style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-xl animate-fade-in text-left"
                  >
                    <div className="flex flex-col gap-1.5 w-full">
                      <label className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>
                        International Target Bank
                      </label>
                      <select
                        value={customBankNameSelect}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomBankNameSelect(val);
                          if (val !== 'other') {
                            setCustomBankName(val);
                          } else {
                            setCustomBankName('');
                          }
                          setResolvedAccountName('');
                        }}
                        style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        className="rounded-lg px-3 py-2.5 text-xs cursor-pointer focus:outline-none focus:border-emerald-500 w-full border"
                      >
                        <option value="Chase Bank">Chase Bank (USA)</option>
                        <option value="Bank of America">Bank of America (USA)</option>
                        <option value="Wells Fargo">Wells Fargo (USA)</option>
                        <option value="HSBC Bank">HSBC Bank (UK / Global)</option>
                        <option value="Barclays Bank">Barclays Bank (UK)</option>
                        <option value="Lloyds Bank">Lloyds Bank (UK)</option>
                        <option value="Deutsche Bank">Deutsche Bank (Europe)</option>
                        <option value="Royal Bank of Canada">Royal Bank of Canada (Canada)</option>
                        <option value="BNP Paribas">BNP Paribas (France)</option>
                        <option value="other">Other / Specify manually...</option>
                      </select>
                    </div>

                    {/* Enable custom name input if "other" is selected */}
                    {(customBankNameSelect === 'other' || selectedBank === 'CUSTOM_GLOBAL') && (
                      <div className="flex flex-col gap-1.5 w-full animate-fade-in">
                        <label className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>
                          Specify Custom Bank Name
                        </label>
                        <input
                          type="text"
                          value={customBankName}
                          onChange={(e) => {
                            setCustomBankName(e.target.value);
                            setResolvedAccountName('');
                          }}
                          placeholder="e.g. Lloyds Bank International, Bunq"
                          style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                          className="rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 w-full border"
                        />
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5 w-full">
                      <label className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>
                        Settlement Country & Currency
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={customBankCountry}
                          onChange={(e) => {
                            setCustomBankCountry(e.target.value);
                            setResolvedAccountName('');
                          }}
                          placeholder="e.g. United States"
                          style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                          className="rounded-lg px-3 py-2 text-xs focus:outline-none w-full border"
                        />
                        <select
                          value={customBankCurrency}
                          onChange={(e) => {
                            setCustomBankCurrency(e.target.value);
                            setResolvedAccountName('');
                          }}
                          style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                          className="rounded-lg px-3 py-2 text-xs cursor-pointer focus:outline-none w-full border"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="CAD">CAD ($)</option>
                          <option value="AUD">AUD ($)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress Verification state */}
                {isResolving && (
                  <div 
                    style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
                    className="p-4 rounded-xl border flex flex-col gap-2 font-mono text-[11px] text-emerald-400 text-left shadow-inner animate-fade-in"
                  >
                    <div style={{ borderColor: 'var(--border)' }} className="flex justify-between items-center border-b pb-2 mb-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Gateway query status</span>
                      <span className="animate-pulse text-emerald-500 text-[9px] font-bold">Verifying...</span>
                    </div>
                    {resolveProgressLog.map((log, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <span className="text-emerald-500">✓</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                )}

              </div>

              {/* Identity Verification Section */}
              <div 
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
                className="border rounded-xl p-4 sm:p-6 flex flex-col gap-4 text-left font-sans text-zinc-350"
              >
                <div className="flex flex-col gap-1 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
                  <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Identity Verification</h3>
                  <p className="text-xs text-zinc-400 font-medium">Verify your identity to unlock higher transaction limits and build buyer trust.</p>
                </div>

                {/* Switch rendering based on active status */}
                {kycStatusState === 'unverified' && (
                  <div className="flex flex-col gap-3">
                    <div 
                      className="p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      style={{ borderLeft: '3px solid #71717a', backgroundColor: theme === 'light' ? '#f4f4f5' : '#18181b' }}
                    >
                      <div className="flex items-center gap-3">
                        <ShieldOff className="w-5 h-5 text-[#71717a] shrink-0" />
                        <div className="flex flex-col gap-0.5 text-left">
                          <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Unverified</span>
                          <span className="text-[11px] text-zinc-400">Verify your identity to create escrow links above your default limit.</span>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={onTriggerKYC}
                        style={{ backgroundColor: '#10b981', color: '#09090b', borderRadius: '8px', fontSize: '13px', fontWeight: 600, padding: '8px 16px' }}
                        className="hover:bg-emerald-400 transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
                      >
                        Start Verification
                      </button>
                    </div>
                    <div className="text-xs text-zinc-400 font-medium">
                      Current escrow limit: <strong className="text-[#f59e0b]">₦50,000 per link</strong>
                    </div>
                  </div>
                )}

                {kycStatusState === 'pending' && (
                  <div className="flex flex-col gap-3">
                    <div 
                      className="p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      style={{ borderLeft: '3px solid #f59e0b', backgroundColor: theme === 'light' ? '#fffbeb' : 'rgba(245,158,11,0.04)' }}
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-[#f59e0b] shrink-0" />
                        <div className="flex flex-col gap-0.5 text-left">
                          <span className="text-xs font-semibold text-[#f59e0b]">Verification Pending</span>
                          <span className="text-[11px] text-zinc-450">Your documents are under review. This usually takes up to 72 hours.</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 self-end sm:self-auto text-right">
                        <span className="text-[10px] text-zinc-500 font-medium">
                          Submitted on {currentKycSubmittedAtStr}
                        </span>
                        {/* subtle dot pulsing progress */}
                        <div className="flex gap-1 items-center px-1.5 py-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse delay-150" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse delay-300" />
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-400 font-medium flex items-center gap-2">
                      <span>Current escrow limit:</span>
                      <span className="text-[#f59e0b] font-bold">₦50,000 per link</span>
                      <span className="text-[10px] text-zinc-500 font-mono">(Review pending)</span>
                    </div>
                  </div>
                )}

                {kycStatusState === 'verified' && (
                  <div className="flex flex-col gap-3">
                    <div 
                      className="p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      style={{ borderLeft: '3px solid #10b981', backgroundColor: 'rgba(16,185,129,0.04)' }}
                    >
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-[#10b981] shrink-0" />
                        <div className="flex flex-col gap-0.5 text-left">
                          <span className="text-xs font-semibold text-[#10b981]">Identity Verified</span>
                          <span className="text-[11px] text-zinc-400">Your identity has been verified. You can create escrow links with no transaction limit.</span>
                        </div>
                      </div>
                      <div className="px-2.5 py-1 bg-[rgba(16,185,129,0.12)] text-[#10b981] rounded-full flex items-center gap-1 font-bold text-[11px] tracking-wider uppercase whitespace-nowrap">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>VERIFIED</span>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-350 font-medium">
                      Current escrow limit: <strong className="text-emerald-450">Unlimited</strong>
                    </div>
                  </div>
                )}

                {kycStatusState === 'rejected' && (
                  <div className="flex flex-col gap-3">
                    <div 
                      className="p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      style={{ borderLeft: '3px solid #f87171', backgroundColor: 'rgba(248,113,113,0.04)' }}
                    >
                      <div className="flex items-center gap-3">
                        <XCircle className="w-5 h-5 text-[#f87171] shrink-0" />
                        <div className="flex flex-col gap-0.5 text-left">
                          <span className="text-xs font-semibold text-[#f87171]">Verification Rejected</span>
                          <span className="text-[11px] text-zinc-400">Your verification was not successful. Please review the reason below and resubmit.</span>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={onTriggerKYC}
                        style={{ backgroundColor: '#10b981', color: '#09090b', borderRadius: '8px', fontSize: '13px', fontWeight: 600, padding: '8px 16px' }}
                        className="hover:bg-emerald-400 transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
                      >
                        Resubmit Verification
                      </button>
                    </div>
                    
                    {/* Reason box */}
                    <div 
                      style={theme === 'light' ? { backgroundColor: '#fef2f2', borderColor: '#fca5a5' } : { backgroundColor: '#1c1c1f', borderColor: '#27272a' }}
                      className="border rounded-xl p-3.5 flex flex-col gap-1.5 text-left text-xs"
                    >
                      <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider font-mono">Rejection Reason:</span>
                      <p className="font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                        {currentKycRejectionReason}
                      </p>
                    </div>

                    <div className="text-xs text-zinc-400 font-medium">
                      Current escrow limit: <strong className="text-[#f59e0b]">₦50,000 per link</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* App Installation Settings Block */}
              <div 
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
                className="border rounded-xl p-4 sm:p-6 flex flex-col gap-5 select-none"
              >
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>App Installation</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3.5 text-left">
                    <div className="w-8 h-[37px] rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 48 56" className="w-[16px] h-[19px] shrink-0" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <linearGradient id="pwaSettingsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{stopColor: "#10b981", stopOpacity: 1}}/>
                            <stop offset="100%" style={{stopColor: "#065f46", stopOpacity: 1}}/>
                          </linearGradient>
                        </defs>
                        <path d="M4,2 L44,2 L44,38 L24,54 L4,38 Z" fill="url(#pwaSettingsGrad)"/>
                        <polyline points="12,14 24,36 36,14" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="12" y1="14" x2="36" y2="14" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                      </svg>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                        {isAppStandalone ? "Trova is installed" : "Install Trova as a desktop app"}
                      </span>
                      <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                        Install Trova as a desktop app for faster access, high-fidelity native alerts, and cleaner standalone window experiences.
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center">
                    {isAppStandalone ? (
                      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-lg text-emerald-400 text-xs font-bold leading-none select-none">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span>Trova is installed</span>
                      </div>
                    ) : pwaPromptAvailable ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.triggerDeferredPWAInstall) {
                            window.triggerDeferredPWAInstall();
                          }
                        }}
                        className="py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold uppercase transition-all cursor-pointer shadow-md active:scale-[0.98]"
                      >
                        Install App
                      </button>
                    ) : (
                      <span className="text-xs text-zinc-500 italic font-medium">Ready in browser / PWA ready</span>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeSubTab === 'developer' && (
            <div 
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
              className="border rounded-xl p-4 sm:p-6 flex flex-col gap-5"
            >
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Trova Developer parameters (Webhooks)</span>
              </div>

              <div className="flex flex-col gap-4 font-sans">
                <div className="flex flex-col gap-1.5 animate-hover">
                  <label className="text-[11px] uppercase tracking-wider font-semibold font-sans" style={{ color: 'var(--text-muted)' }}>Settlement Webhook Endpoint URL</label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://yourdomain.com/webhooks"
                    style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    className="border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500 transition-all"
                  />
                  <span className="text-[10px] leading-normal font-sans" style={{ color: 'var(--text-muted)' }}>
                    An instant `POST` alert with payload describing the buyer's delivery clearance events will be auto-dispatched to this URL.
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 animate-hover">
                  <label className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Live API Key</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type={showKey ? "text" : "password"}
                      value={apiKey}
                      readOnly
                      style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      className="border rounded-lg px-3 py-2 text-xs font-mono flex-1 focus:outline-none min-w-0"
                    />
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        className="flex-1 sm:flex-initial border px-3 py-2 sm:py-0 text-xs font-bold rounded-lg cursor-pointer hover:bg-[var(--surface)] transition text-center min-h-[38px] flex items-center justify-center"
                      >
                        {showKey ? 'Hide' : 'Reveal'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyKey}
                        style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        className="flex-1 sm:flex-initial border px-3 py-2 sm:py-0 text-xs font-bold rounded-lg cursor-pointer hover:bg-[var(--surface)] transition flex items-center justify-center min-h-[38px]"
                      >
                        {copiedKey ? 'Copied' : <Copy className="w-3.5 h-3.5 animate-hover" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerConfirmModal('regenerate_api', handleRegenerateApiKey)}
                        style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
                        className="flex-1 sm:flex-initial border border-amber-500/20 hover:border-amber-500/40 px-3 py-2 sm:py-0 text-xs font-bold text-amber-500 rounded-lg cursor-pointer hover:bg-[var(--surface)] transition flex items-center justify-center min-h-[38px] gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Regenerate</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Global Form Submit bar */}
          <div className="flex justify-end pt-2 w-full">
            <button
              type="submit"
              className="w-full sm:w-auto text-center px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold cursor-pointer transition-all shadow-md shadow-emerald-500/10 hover:scale-[1.01] active:scale-[0.98]"
            >
              Save Profile And System Configurations
            </button>
          </div>

        </div>

        {/* Right Preview Card column (4 cols) - Sticky alongside form layout (FIX 3) */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 self-start flex flex-col gap-6 w-full max-w-full">
          
          {/* Real-time personal identity preview container */}
          <div 
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
            className="border rounded-xl p-4 sm:p-5 flex flex-col gap-5 text-sans select-none relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <span className="text-[10.5px] font-bold tracking-wider uppercase font-mono animate-hover" style={{ color: 'var(--text-muted)' }}>Live Personal Profile Hub</span>
            
            {/* Main Avatar rendering */}
            <div className="flex flex-col items-center gap-3.5 mt-3">
              <div className="relative group">
                <div 
                  style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
                  className="w-18 h-18 rounded-full border flex items-center justify-center relative overflow-hidden transition-all shadow-inner"
                >
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt={fullName} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="font-black font-mono text-2xl flex items-center justify-center h-full w-full" style={{ color: 'var(--text-primary)' }}>
                      {fullName.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}

                  {/* Absolute positioning sticker badge */}
                  <div 
                    style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                    className="absolute -bottom-1 -right-1 w-7.5 h-7.5 border rounded-full flex items-center justify-center text-sm shadow-md animate-bounce select-none"
                  >
                    {sticker}
                  </div>
                </div>
              </div>

              {/* Tag info inside Card */}
              <div className="text-center flex flex-col gap-0.5 max-w-full w-full font-sans">
                <div className="flex items-center justify-center gap-1.5 flex-wrap px-2">
                  <span className="font-extrabold text-sm break-words text-center max-w-full" style={{ color: 'var(--text-primary)' }}>{fullName}</span>
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <UserCheck className="w-2 h-2 text-emerald-400" />
                  </div>
                </div>
                <span className="text-[10px] break-all font-mono px-2 block animate-hover" style={{ color: 'var(--text-muted)' }}>{email}</span>
              </div>
            </div>

            {/* Custom Dynamic Bio */}
            <div 
              style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
              className="p-3 rounded-lg border text-[11px] italic font-sans leading-relaxed text-center break-words max-w-full"
            >
              &quot;{bio || 'Premium trade solutions and escrow trust lines.'}&quot;
            </div>

            <hr style={{ borderColor: 'var(--border)' }} className="mt-1" />

            <div className="flex flex-col gap-2.5 text-xs font-sans">
              <div 
                style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2.5 rounded-lg border gap-1.5"
              >
                <span className="font-mono text-[9.5px]" style={{ color: 'var(--text-muted)' }}>VERIFICATION ID</span>
                <span className="font-mono text-emerald-500 font-bold text-[10px] break-all">TL-MEMBER-951</span>
              </div>
              <div 
                style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2.5 rounded-lg border gap-1.5"
              >
                <span className="font-mono text-[9.5px]" style={{ color: 'var(--text-muted)' }}>PRESET STICKER</span>
                <span className="font-mono text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>{sticker} Active</span>
              </div>
            </div>

          </div>

          {/* Security Notice Card (FIX 4) */}
          <div 
            style={{ 
              backgroundColor: 'rgba(16, 185, 129, 0.03)', 
              borderLeft: '2px solid rgba(16, 185, 129, 0.4)',
              borderTop: '1px solid var(--border)',
              borderRight: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
              boxShadow: 'var(--shadow)' 
            }}
            className="rounded-xl p-4 sm:p-5 flex flex-col gap-4 font-sans text-left"
          >
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Security Notice</span>
            <div className="flex items-start gap-3">
              <div 
                className="shrink-0 flex items-center justify-center rounded-[8px]" 
                style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '6px' }}
              >
                <ShieldCheck className="w-[18px] h-[18px] text-emerald-500" />
              </div>
              <div className="text-[10.5px] leading-relaxed font-sans" style={{ color: 'var(--text-muted)' }}>
                Your account credentials and contact details are secured and verified before any escrow transaction can proceed. Keep your information accurate to avoid payment delays.
              </div>
            </div>
          </div>

        </div>

      </form>

      <ConfirmationModal 
        isOpen={modalOpen} 
        type={modalType} 
        onConfirm={handleConfirmAction} 
        onCancel={() => setModalOpen(false)} 
      />

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-zinc-100">
          <div 
            style={theme === 'light' ? { backgroundColor: '#ffffff', borderColor: '#e4e4e7' } : { backgroundColor: '#09090b', borderColor: '#27272a' }}
            className="w-full max-w-md border rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 relative animate-zoom-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-dashed" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Enter Your Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="p-1 hover:bg-[var(--surface2)] w-7 h-7 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                title="Cancel"
              >
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>

            <p style={{ color: 'var(--text-dim)' }} className="text-xs leading-relaxed text-left">
              To verify your identity and authorize the permanent deletion of your account, please enter your password below. This action is irreversible.
            </p>

            {/* Input Form */}
            <div className="flex flex-col gap-1.5 text-left">
              <label style={{ color: 'var(--text-muted)' }} className="text-[10px] uppercase tracking-wider font-extrabold font-mono">
                Account Password
              </label>
              <div className="relative">
                <input
                  type={showDeletePasswordReveal ? "text" : "password"}
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    setDeletePasswordError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleFinalDeleteAccount();
                    }
                  }}
                  placeholder="••••••••••••"
                  style={theme === 'light' ? { backgroundColor: '#ffffff', borderColor: '#d4d4d8', color: '#18181b' } : { backgroundColor: '#181a1d', borderColor: '#27272a', color: '#ffffff' }}
                  className="w-full h-11 border rounded-xl pl-3.5 pr-12 text-xs focus:outline-none focus:border-red-500 font-mono"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowDeletePasswordReveal(!showDeletePasswordReveal)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer flex items-center justify-center"
                >
                  {showDeletePasswordReveal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {deletePasswordError && (
                <span className="text-red-500 text-[11px] font-semibold flex items-center gap-1.5 mt-1">
                  <span>⚠️ {deletePasswordError}</span>
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 py-2.5 bg-transparent border rounded-xl text-xs font-bold uppercase cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface2)]"
                style={{ borderColor: 'var(--border)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinalDeleteAccount}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase cursor-pointer"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {tfaModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          {/* Main Modal Wrapper (clicks inside do not propagate/close) */}
          <div 
            style={theme === 'light' ? { backgroundColor: '#ffffff', borderColor: '#e4e4e7' } : { backgroundColor: '#09090b', borderColor: '#27272a' }}
            className="w-full max-w-lg border rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>Configure Two-Factor Security (2FA)</h3>
              </div>
              {!tfaSuccess && (
                <button
                  type="button"
                  onClick={() => setTfaModalOpen(false)}
                  className="p-1 hover:bg-[var(--surface2)] w-7 h-7 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  title="Cancel Setup"
                >
                  <span className="text-xl leading-none">&times;</span>
                </button>
              )}
            </div>

            {/* ERROR NOTIFICATION PANEL */}
            {tfaValidationError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 animate-pulse font-semibold">
                <span>⚠️ {tfaValidationError}</span>
              </div>
            )}

            {/* SCREEN 1: SUCCESS VIEW (Backup Codes and Copy logic) */}
            {tfaSuccess ? (
              <div className="flex flex-col gap-5 text-center items-center py-4 select-none">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-555">
                  <CheckCircle className="w-7 h-7 text-emerald-400" />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <h4 className="text-sm font-black uppercase" style={{ color: 'var(--text-primary)' }}>2FA Configured Successfully!</h4>
                  <p className="text-xs max-w-sm" style={{ color: 'var(--text-muted)' }}>
                    Two-Factor authentication is now active. Store these 8 backup recovery codes in a safe place. They allow account recovery if your device is lost.
                  </p>
                </div>

                <div 
                  style={theme === 'light' ? { backgroundColor: '#f4f4f5', borderColor: '#e4e4e7' } : { backgroundColor: '#18181b', borderColor: '#27272a' }}
                  className="grid grid-cols-2 gap-2 p-4 rounded-xl w-full max-w-md font-mono text-[11.5px] font-bold select-all"
                >
                  {tfaBackupCodes.map(code => (
                    <div 
                      key={code} 
                      style={theme === 'light' ? { backgroundColor: '#ffffff', borderColor: '#e4e4e7', color: '#18181b' } : { backgroundColor: '#09090b', borderColor: '#18181b', color: '#f4f4f5' }}
                      className="py-1 px-2.5 rounded border flex items-center justify-center text-center"
                    >
                      {code}
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 w-full max-w-md mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText?.(tfaBackupCodes.join('\n'));
                      setCopiedBackupText(true);
                      setTimeout(() => setCopiedBackupText(false), 2000);
                    }}
                    style={theme === 'light' ? { backgroundColor: '#f4f4f5', borderColor: '#e4e4e7', color: '#27272a' } : { backgroundColor: '#18181b', borderColor: '#27272a', color: '#d4d4d8' }}
                    className="flex-1 py-2.5 border hover:opacity-90 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedBackupText ? "Copied!" : "Copy Codes"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      // Finalize
                      setTfaActive(true);
                      const displayMethod = tfaSubTab === 'authenticator' ? 'Authenticator App' : tfaSubTab === 'sms' ? 'SMS Authentication' : 'Email Authentication';
                      setTfaMethod(displayMethod);
                      localStorage.setItem('trustlink_2fa_active', 'true');
                      localStorage.setItem('trustlink_2fa_method', displayMethod);
                      setTfaModalOpen(false);
                    }}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-450 text-black text-xs font-black uppercase rounded-xl transition-all cursor-pointer"
                  >
                    Finish
                  </button>
                </div>
              </div>
            ) : (
              /* SCREEN 2: MAIN CONFIGURATION (Method Selector + Form Fields) */
              <div className="flex flex-col gap-5">
                {/* Visual Method Tabs selection */}
                <div className="grid grid-cols-3 gap-2 border-b pb-3" style={{ borderColor: 'var(--border)' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setTfaSubTab('authenticator');
                      setTfaCode('');
                      setTfaValidationError('');
                    }}
                    className={`py-2 text-[10.5px] font-bold uppercase tracking-wider text-center rounded-lg border transition-all cursor-pointer ${
                      tfaSubTab === 'authenticator'
                        ? 'border-emerald-500 bg-emerald-500/5 text-emerald-500 font-extrabold'
                        : (theme === 'light' ? 'border-zinc-200 bg-zinc-100 text-zinc-500 hover:text-zinc-800' : 'border-zinc-900 bg-zinc-900/40 text-zinc-400 hover:text-white')
                    }`}
                  >
                    App Auth
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTfaSubTab('sms');
                      setTfaCode('');
                      setTfaValidationError('');
                    }}
                    className={`py-2 text-[10.5px] font-bold uppercase tracking-wider text-center rounded-lg border transition-all cursor-pointer ${
                      tfaSubTab === 'sms'
                        ? 'border-emerald-500 bg-emerald-500/5 text-emerald-500 font-extrabold'
                        : (theme === 'light' ? 'border-zinc-200 bg-zinc-100 text-zinc-500 hover:text-zinc-800' : 'border-zinc-900 bg-zinc-900/40 text-zinc-400 hover:text-white')
                    }`}
                  >
                    SMS Auth
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTfaSubTab('email');
                      setTfaCode('');
                      setTfaValidationError('');
                    }}
                    className={`py-2 text-[10.5px] font-bold uppercase tracking-wider text-center rounded-lg border transition-all cursor-pointer ${
                      tfaSubTab === 'email'
                        ? 'border-emerald-500 bg-emerald-500/5 text-emerald-500 font-extrabold'
                        : (theme === 'light' ? 'border-zinc-200 bg-zinc-100 text-zinc-500 hover:text-zinc-800' : 'border-zinc-900 bg-zinc-900/40 text-zinc-400 hover:text-white')
                    }`}
                  >
                    Email Auth
                  </button>
                </div>

                {/* Sub-tab rendering block */}
                {tfaSubTab === 'authenticator' && (
                  <div className="flex flex-col gap-4 text-left">
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Method: Google / Duo Authenticator</span>
                    <p className="text-xs leading-relaxed font-sans" style={{ color: 'var(--text-muted)' }}>
                      Download Google Authenticator or Microsoft Authenticator, then scan this QR code or type the secret token key below into your app.
                    </p>

                    <div 
                      style={theme === 'light' ? { backgroundColor: '#f4f4f5', borderColor: '#e4e4e7' } : { backgroundColor: 'rgba(24, 24, 27, 0.2)', borderColor: '#18181b' }}
                      className="flex flex-col sm:flex-row gap-5 items-center justify-between border p-4 rounded-xl max-w-full overflow-hidden"
                    >
                      {/* High-Contrast Grid QR code */}
                      <div className="w-28 h-28 p-2.5 rounded-lg border-2 border-emerald-500 bg-white flex items-center justify-center flex-wrap gap-[2.5px] select-none hover:scale-102 transition-all">
                        {Array.from({ length: 49 }).map((_, i) => {
                          const isDark = (i * 7 + (i % 3)) % 2 === 0 || i % 5 === 0 || i < 8 || i > 40 || (i % 7 === 0 && i < 28);
                          return (
                            <div 
                              key={i} 
                              className={`w-[10px] h-[10px] rounded-[1px] ${isDark ? 'bg-zinc-950' : 'bg-transparent'}`} 
                            />
                          );
                        })}
                      </div>

                      <div className="flex-grow flex flex-col gap-2 w-full">
                        <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>Secret Key:</span>
                        <div className="flex items-center gap-1.5">
                          <code 
                            style={theme === 'light' ? { backgroundColor: '#ffffff', borderColor: '#e4e4e7' } : { backgroundColor: '#09090b', borderColor: '#27272a' }}
                            className="text-xs py-1.5 px-3 rounded border text-[#f43f5e] font-bold tracking-wider select-all flex-grow text-center font-mono"
                          >
                            {tfaSecretKey}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText?.(tfaSecretKey);
                              setCopiedKeyText(true);
                              setTimeout(() => setCopiedKeyText(false), 2000);
                            }}
                            style={theme === 'light' ? { backgroundColor: '#ffffff', borderColor: '#e4e4e7' } : { backgroundColor: '#18181b', borderColor: '#27272a' }}
                            className="p-2 border rounded cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                            title="Copy Secret Key"
                          >
                            {copiedKeyText ? (
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] uppercase tracking-wider font-semibold text-sans" style={{ color: 'var(--text-muted)' }}>Authenticator Code (6-Digits)</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="e.g. 123456"
                        style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                        className="w-full border rounded-lg px-4 py-2 text-sm font-mono text-center tracking-[6px] focus:outline-none focus:border-emerald-500 transition-all font-bold"
                        value={tfaCode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\s+/g, '');
                          if (/^\d*$/.test(val)) {
                            setTfaCode(val);
                            setTfaValidationError('');
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {tfaSubTab === 'sms' && (
                  <div className="flex flex-col gap-4 text-left">
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Method: Secure SMS Channel</span>
                    <p className="text-xs leading-relaxed font-sans" style={{ color: 'var(--text-muted)' }}>
                      Insert your telephone mobile number. We will route a 6-digit verification code check securely.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="w-24 shrink-0 font-mono">
                        <select 
                          style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                          className="w-full border rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                        >
                          <option value="+234">+234 (NG)</option>
                          <option value="+1">+1 (US/CA)</option>
                          <option value="+44">+44 (UK)</option>
                          <option value="+233">+233 (GH)</option>
                        </select>
                      </div>

                      <div className="flex-grow flex gap-2">
                        <input
                          type="text"
                          required
                          placeholder="e.g. 812234567"
                          style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                          className="flex-grow border rounded-lg px-3.5 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500"
                          value={tfaSmsPhone}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^[0-9+() -]*$/.test(val)) {
                              setTfaSmsPhone(val);
                              setTfaValidationError('');
                            }
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => {
                            // Validate phone non-empty
                            const cleanPhone = tfaSmsPhone.trim();
                            if (!cleanPhone || cleanPhone.length < 7) {
                              setTfaValidationError('Please enter a valid phone number, e.g., +2348123456789');
                              return;
                            }
                            setTfaCodeSent(true);
                            setTfaValidationError('');
                            alert(`Mock SMS verification code sent to ${cleanPhone}! Use 123456 to verify.`);
                          }}
                          style={theme === 'light' ? { backgroundColor: '#f4f4f5', borderColor: '#e4e4e7', color: '#18181b' } : { backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                          className="px-4 rounded-lg text-xs font-bold cursor-pointer border"
                        >
                          {tfaCodeSent ? "Resend" : "Send Code"}
                        </button>
                      </div>
                    </div>

                    {tfaCodeSent && (
                      <span className="text-[10px] font-semibold text-emerald-400 block -mt-1 font-mono uppercase tracking-wider">✓ Code dispatched successfully!</span>
                    )}

                    <div className="flex flex-col gap-1.5 mt-1">
                      <label className="text-[11px] uppercase tracking-wider font-semibold font-sans" style={{ color: 'var(--text-muted)' }}>SMS Pin Code (6-Digits)</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="e.g. 123456"
                        style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                        className="w-full border rounded-lg px-4 py-2 text-sm font-mono text-center tracking-[6px] focus:outline-none focus:border-emerald-500 transition-all font-bold"
                        value={tfaCode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\s+/g, '');
                          if (/^\d*$/.test(val)) {
                            setTfaCode(val);
                            setTfaValidationError('');
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {tfaSubTab === 'email' && (
                  <div className="flex flex-col gap-4 text-left animate-fade-in font-sans">
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Method: Registered Email Gateway</span>
                    <p className="text-xs leading-relaxed font-sans" style={{ color: 'var(--text-muted)' }}>
                      Verify through your primary registered profile credential. We will dispatch a 6-digit code pin check.
                    </p>

                    <div 
                      style={theme === 'light' ? { backgroundColor: '#f4f4f5', borderColor: '#e4e4e7' } : { backgroundColor: 'rgba(24, 24, 27, 0.2)', borderColor: '#27272a' }}
                      className="flex flex-col gap-2 border p-4 rounded-xl"
                    >
                      <span className="text-[10.5px] uppercase font-bold tracking-wider font-mono" style={{ color: 'var(--text-muted)' }}>Pre-filled Registered email Address:</span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-muted)' }}
                          className="flex-grow border rounded-lg px-3.5 py-2 text-xs font-semibold focus:outline-none font-mono"
                          value={email || "chinedu@example.com"}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setTfaCodeSent(true);
                            setTfaValidationError('');
                            alert(`Mock email verification code sent to ${email || "chinedu@example.com"}! Use 123456 to verify.`);
                          }}
                          style={theme === 'light' ? { backgroundColor: '#f4f4f5', borderColor: '#e4e4e7', color: '#18181b' } : { backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                          className="px-4 rounded-lg border hover:opacity-90 text-xs font-bold cursor-pointer"
                        >
                          {tfaCodeSent ? "Resend" : "Send Code"}
                        </button>
                      </div>
                    </div>

                    {tfaCodeSent && (
                      <span className="text-[10px] font-semibold text-emerald-400 block -mt-1 font-mono uppercase tracking-wider">✓ Pin code sent to inbox!</span>
                    )}

                    <div className="flex flex-col gap-1.5 mt-1">
                      <label className="text-[11px] uppercase tracking-wider font-semibold font-sans" style={{ color: 'var(--text-muted)' }}>Email Pin Code (6-Digits)</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="e.g. 123456"
                        style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                        className="w-full border rounded-lg px-4 py-2 text-sm font-mono text-center tracking-[6px] focus:outline-none focus:border-emerald-500 transition-all font-bold"
                        value={tfaCode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\s+/g, '');
                          if (/^\d*$/.test(val)) {
                            setTfaCode(val);
                            setTfaValidationError('');
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Submit row */}
                <div className="flex gap-3 mt-4 border-t pt-5" style={{ borderColor: 'var(--border)' }}>
                  <button
                    type="button"
                    onClick={() => setTfaModalOpen(false)}
                    style={theme === 'light' ? { backgroundColor: '#f4f4f5', borderColor: '#e4e4e7', color: '#52525b' } : { backgroundColor: '#18181b', borderColor: '#27272a', color: '#a1a1aa' }}
                    className="flex-1 py-3 border hover:opacity-90 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer text-center"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      // Perform pin validation
                      const cleanPin = tfaCode.trim();
                      if (!cleanPin || cleanPin.length !== 6) {
                        setTfaValidationError('Code must be exactly 6 digits.');
                        return;
                      }
                      if (tfaSubTab === 'sms' && (!tfaCodeSent || !tfaSmsPhone.trim())) {
                        setTfaValidationError('Please input phone and send pin code first.');
                        return;
                      }
                      if (tfaSubTab === 'email' && !tfaCodeSent) {
                        setTfaValidationError('Please request email verification code first.');
                        return;
                      }
                      
                      // Code represents mock checking
                      setTfaValidationError('');
                      setTfaSuccess(true);
                    }}
                    className="flex-grow py-3 bg-emerald-500 hover:bg-emerald-450 text-black text-xs font-black uppercase rounded-xl transition-all cursor-pointer shadow-lg hover:shadow-emerald-500/15 font-sans"
                  >
                    Verify & Complete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
