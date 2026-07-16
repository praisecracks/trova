import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Bell, 
  Menu, 
  LogOut, 
  Settings,
  HelpCircle,
  Database,
  Sun,
  Moon,
  Search,
  AlertTriangle,
  Clock,
  Volume2,
  VolumeX,
  XCircle
} from 'lucide-react';
import { ActiveTab } from '../types';
import { getSellerKycStatus, getCurrentSellerId } from '../data/localStorage';
import { sounds } from '../utils/sounds';
import { useToast } from './ToastContext';

import { getNotificationsForProfile, markNotificationRead, deleteNotification, type Notification } from '../lib/services/notifications';

interface TopNavbarProps {
  activeTab?: ActiveTab;
  setActiveTab?: (tab: ActiveTab) => void;
  onMobileMenuToggle?: () => void;
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
  theme?: 'light' | 'dark';
  onThemeToggle?: () => void;
  userProfile?: { id?: string; profileId?: string; email?: string; kycStatus?: string; avatarUrl?: string; sticker?: string; status?: string } & Record<string, unknown>;
  onVerifyNowClick?: () => void;
  onNavigateTab?: (tab: ActiveTab) => void;
  isAdmin?: boolean;
}

export default function TopNavbar({
  activeTab,
  setActiveTab,
  onMobileMenuToggle,
  userName,
  userEmail,
  onLogout,
  theme,
  onThemeToggle,
  userProfile,
  onVerifyNowClick,
  onNavigateTab,
  isAdmin = false
}: TopNavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [muted, setMuted] = useState(() => sounds.getMuteState());
  const { error: showError } = useToast();

  useEffect(() => {
    const handleMuteChange = (e: Event) => {
      const isMuted = (e as CustomEvent).detail;
      setMuted(isMuted);
    };
    window.addEventListener('trustlink_mute_changed', handleMuteChange);
    return () => {
      window.removeEventListener('trustlink_mute_changed', handleMuteChange);
    };
  }, []);

  const toggleSound = () => {
    const nextMute = !muted;
    sounds.setMuteState(nextMute);
    setMuted(nextMute);
  };

  const [kycStatusState, setKycStatusState] = useState(() => getSellerKycStatus(getCurrentSellerId()));

  // Keep state in sync with profile prop changes safely
  useEffect(() => {
    const currentRenderedKyc = getSellerKycStatus(getCurrentSellerId());
    if (kycStatusState !== currentRenderedKyc) {
      setKycStatusState(currentRenderedKyc);
    }
  }, [userProfile?.kycStatus]);

// Explicitly listen to state sync events
   useEffect(() => {
     const syncStatus = () => {
       setKycStatusState(getSellerKycStatus(getCurrentSellerId()));
     };
     window.addEventListener('storage', syncStatus);
     window.addEventListener('trustlink_sellers_changed', syncStatus);
     window.addEventListener('trustlink_kyc_status_updated', syncStatus);
     return () => {
       window.removeEventListener('storage', syncStatus);
       window.removeEventListener('trustlink_sellers_changed', syncStatus);
       window.removeEventListener('trustlink_kyc_status_updated', syncStatus);
     };
   }, []);

  // Explicitly re-retrieve status from localStorage whenever dropdown is opened
  useEffect(() => {
    if (dropdownOpen) {
      setKycStatusState(getSellerKycStatus(getCurrentSellerId()));
    }
  }, [dropdownOpen]);

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Profile & Notification Dropdown Container Refs
  const profileContainerRef = useRef<HTMLDivElement>(null);
  const notificationContainerRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Close profile dropdown on click outside or Escape key
  useEffect(() => {
    if (!dropdownOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (profileContainerRef.current && !profileContainerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  // Close notification dropdown on click outside or Escape key
  useEffect(() => {
    if (!notificationsOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (notificationContainerRef.current && !notificationContainerRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [notificationsOpen]);

  // Update search results on query change
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const linksRaw = localStorage.getItem('trustlink_escrow_links');
      if (linksRaw) {
        const links = JSON.parse(linksRaw);
        if (Array.isArray(links)) {
          const q = searchQuery.toLowerCase().trim();
          const filtered = links.filter((link: any) => {
            const matchId = link.id?.toLowerCase().includes(q);
            const matchProduct = link.productName?.toLowerCase().includes(q);
            const matchBuyer = link.buyerPhone?.includes(q) || link.description?.toLowerCase().includes(q);
            return matchId || matchProduct || matchBuyer;
          });
          setSearchResults(filtered.slice(0, 5));
        }
      }
    } catch (e) {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSearchResultClick = (id: string) => {
    setSearchQuery('');
    setSearchFocused(false);
    
    // Write target to localStorage so Dashboard can highlight it
    localStorage.setItem('trustlink_dashboard_highlight', id);
    
    // Clear item after 1 second so subsequent navigation does not re-trigger highlight
    setTimeout(() => {
      localStorage.removeItem('trustlink_dashboard_highlight');
    }, 1000);
    
    // Toggle active tab to dashboard
    setActiveTab('dashboard');
    onNavigateTab?.('dashboard');
    
    // Dispatch navigate custom event
    window.dispatchEvent(new CustomEvent('trustlink_search_navigate', { detail: id }));
  };

  const getStatusBadge = (status: string) => {
    let bg = 'bg-zinc-850 text-zinc-400 border border-zinc-700/50';
    let label = status;
    if (['deposited'].includes(status)) {
      bg = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      label = 'Locked';
    } else if (['shipped', 'delivered'].includes(status)) {
      bg = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      label = 'Transit';
    } else if (['funds_released', 'released'].includes(status)) {
      bg = 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
      label = 'Released';
    } else if (['disputed'].includes(status)) {
      bg = 'bg-red-500/10 text-red-500 border border-red-500/20';
      label = 'Disputed';
    } else {
      bg = 'bg-zinc-800 text-zinc-400 border border-zinc-700/40';
      label = 'Awaiting';
    }
    return <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider font-mono ${bg}`}>{label}</span>;
  };
  
  // Real dynamic notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);

// Load notifications from Supabase or localStorage
    const loadNotifications = async () => {
      // Try Supabase first if profileId exists
      const authProfileId = userProfile?.profileId || userProfile?.id;
      if (authProfileId) {
        try {
          const supabaseNotifications = await getNotificationsForProfile(authProfileId);
          // Cache Supabase as authoritative source
          try {
            const storageKey = 'trustlink_notifications';
            const mapped = supabaseNotifications.map(n => ({
              id: n.id,
              profile_id: n.profile_id,
              text_payload: n.text_payload,
              textPayload: n.text_payload,
              read: n.read,
              created_at: n.created_at,
              loggingTime: n.created_at,
              date: n.created_at
            }));
            localStorage.setItem(storageKey, JSON.stringify(mapped));
          } catch (e) {
            console.error('Error caching notifications to localStorage:', e);
          }
          setNotifications(supabaseNotifications);
          return;
        } catch (e) {
          console.error('Supabase notifications failed:', e);
        }
      }

      // Fallback to localStorage cache
      try {
        const savedNotifications = localStorage.getItem('trustlink_notifications');
        if (savedNotifications) {
          const parsed = JSON.parse(savedNotifications);
          if (Array.isArray(parsed)) {
            const mapped = parsed.map((n: any) => ({
              id: n.id,
              profile_id: authProfileId || '',
              text_payload: n.textPayload || n.message || n.text_payload || '',
              read: !!n.read,
              created_at: n.loggingTime || n.date || n.created_at || new Date().toISOString()
            }));
            setNotifications(mapped);
            return;
          }
        }
      } catch (e) {
        console.error('Error loading from localStorage:', e);
      }

      setNotifications([]);
    };

  useEffect(() => {
    const authProfileId = userProfile?.profileId || userProfile?.id;
    if (authProfileId) {
      loadNotifications();
    }

    // Listen to custom notification sync updates
    const handleSync = () => {
      loadNotifications();
    };
    window.addEventListener('trustlink_notifications_update', handleSync);
    window.addEventListener('storage', handleSync);
    
    return () => {
      window.removeEventListener('trustlink_notifications_update', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [userProfile?.profileId, userProfile?.id]);

  // Sync whenever panel is opened
  useEffect(() => {
    if (notificationsOpen) {
      loadNotifications();
    }
  }, [notificationsOpen]);

  const handleMarkAllRead = async () => {
    const authProfileId = userProfile?.profileId || userProfile?.id;
    const unreadNotifications = notifications.filter(n => !n.read);
    
    // Optimistic UI update - update React state immediately
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    
    // Update localStorage first for instant UI feedback
    try {
      const savedNotifications = localStorage.getItem('trustlink_notifications');
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);
        const updated = parsed.map((n: any) => ({ ...n, read: true }));
        localStorage.setItem('trustlink_notifications', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('trustlink_notifications_update'));
      }
    } catch (e) {}

    // Also update Supabase
    if (authProfileId) {
      const results = await Promise.all(unreadNotifications.map(n => markNotificationRead(n.id)));
      const failed = results.filter(r => r === false).length;
      if (failed > 0) {
        showError(`${failed} notification(s) could not sync to server`);
      }
    }
  };

  const handleClearAll = async () => {
    const authProfileId = userProfile?.profileId || userProfile?.id;
    const currentNotifications = notifications;
    
    // Optimistic UI update - clear React state immediately
    setNotifications([]);
    
    // Clear localStorage
    localStorage.setItem('trustlink_notifications', JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('trustlink_notifications_update'));

    // Also clear Supabase
    if (authProfileId && currentNotifications.length > 0) {
      const results = await Promise.all(currentNotifications.map(n => deleteNotification(n.id)));
      const failed = results.filter(r => r === false).length;
      if (failed > 0) {
        showError(`${failed} notification(s) could not be cleared from server`);
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const hasUnread = unreadCount > 0;

  const getTabTitle = () => {
    if (isAdmin) return 'Admin Console';
    switch (activeTab) {
      case 'dashboard':
        return 'Overview';
      case 'analytics':
        return 'Analytics';
      case 'escrow-links':
        return 'Escrow Invoices';
      case 'payouts':
        return 'Payout & History';
      case 'settings':
        return 'Account Setup';
      case 'storefront':
        return 'My Store Link';
      case 'onboarding-hub':
        return 'Getting Started';
      case 'help':
        return 'Support & Arbitration';
      case 'notifications':
        return 'Notifications';
      default:
        return 'Console';
    }
  };

  const getNotificationStatus = (text: string): 'success' | 'info' | 'warning' | 'alert' => {
    const lower = text.toLowerCase();
    if (lower.includes('release') || lower.includes('settled') || lower.includes('complete') || lower.includes('funds')) return 'success';
    if (lower.includes('dispute') || lower.includes('problem') || lower.includes('freeze')) return 'alert';
    if (lower.includes('ship') || lower.includes('transit') || lower.includes('delivery')) return 'info';
    if (lower.includes('lock') || lower.includes('deposit') || lower.includes('vault')) return 'success';
    return 'info';
  };

  const getStatusAccent = (status: string) => {
    switch (status) {
      case 'success': return 'border-l-emerald-500';
      case 'alert': return 'border-l-rose-500';
      case 'warning': return 'border-l-amber-500';
      default: return 'border-l-zinc-500';
    }
  };

  const formatNotificationTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const groupNotificationsByTime = (notifs: Notification[]) => {
    const groups: { label: string; items: Notification[] }[] = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const todayItems: Notification[] = [];
    const weekItems: Notification[] = [];
    const earlierItems: Notification[] = [];

    notifs.forEach((notif) => {
      const date = new Date(notif.created_at);
      if (date >= today) {
        todayItems.push(notif);
      } else if (date >= weekAgo) {
        weekItems.push(notif);
      } else {
        earlierItems.push(notif);
      }
    });

    if (todayItems.length > 0) groups.push({ label: 'Today', items: todayItems });
    if (weekItems.length > 0) groups.push({ label: 'This Week', items: weekItems });
    if (earlierItems.length > 0) groups.push({ label: 'Earlier', items: earlierItems });

    return groups;
  };

  return (
    <header 
      id="dashboard-header"
      className={`h-16 border-b px-6 flex items-center justify-between sticky top-0 z-40 select-none dashboard-header ${theme === 'light' ? 'bg-white border-[#e5e7eb]' : 'border-transparent'}`}
      style={{
        boxShadow: theme === 'light' ? '0px 1px 3px rgba(0,0,0,0.04), 0px 4px 12px rgba(0,0,0,0.06)' : 'none',
        backdropFilter: theme === 'light' ? 'blur(12px) saturate(180%)' : 'none',
        WebkitBackdropFilter: theme === 'light' ? 'blur(12px) saturate(180%)' : 'none'
      }}
    >
      
      {mobileSearchOpen && !isAdmin ? (
        <div className="flex-1 flex items-center gap-3 w-full h-full">
          <div className="flex-1 relative flex items-center">
            <Search className="w-4 h-4 text-emerald-500 absolute left-3 shrink-0 [.light-theme_&]:text-emerald-600" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Search transactions, products, contacts"
               style={{ 
                 backgroundColor: 'var(--surface2)', 
                 borderColor: 'var(--border)', 
                 color: 'var(--text-primary)' 
               }}
               className="w-full text-xs font-semibold pl-9 pr-14 py-2.5 rounded-lg border focus:outline-none transition-all text-left font-sans placeholder:text-[var(--text-muted)]"
            />
             {searchQuery && (
               <button 
                 onClick={() => setSearchQuery('')}
                 className="absolute right-3 text-[10px] font-mono font-bold uppercase text-[var(--text-muted)] hover:text-[var(--text-primary)]"
               >
                 Clear
               </button>
             )}
          </div>
          <button 
            type="button"
            onClick={() => {
              setMobileSearchOpen(false);
              setSearchQuery('');
            }}
            className={`text-xs font-bold px-3 py-2.5 border rounded-lg cursor-pointer transition-colors ${
              theme === 'light' 
                ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200' 
                : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border-zinc-800'
            }`}
          >
            Cancel
          </button>
          
          {/* Mobile Search Results Dropdown Panel */}
          {searchQuery.trim() !== '' && (
            <div 
              style={{ 
                backgroundColor: 'var(--dropdown-bg)', 
                borderColor: 'var(--border)', 
                boxShadow: 'var(--dropdown-shadow)' 
              }}
              className="absolute top-[60px] left-6 right-6 rounded-xl border py-1.5 z-50 text-left overflow-hidden max-h-80 overflow-y-auto"
            >
              {searchResults.length === 0 ? (
                   <div className="px-4 py-3 text-[10.5px] text-[var(--text-muted)] italic text-center">
                     No matching transactions found.
                   </div>
              ) : (
                searchResults.map((link) => (
                  <div
                    key={link.id}
                    onClick={() => {
                      handleSearchResultClick(link.id);
                      setMobileSearchOpen(false);
                    }}
                    className={`px-4 py-2.5 cursor-pointer flex flex-col gap-1 transition-colors border-b last:border-b-0 text-left ${
                      theme === 'light'
                        ? 'hover:bg-zinc-50 border-zinc-100'
                        : 'hover:bg-zinc-900 border-[#27272a]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[10px] text-emerald-500 font-extrabold select-none">
                        {link.id}
                      </span>
                      <span className={`font-mono text-[10px] font-semibold ${
                        theme === 'light' ? 'text-zinc-600' : 'text-zinc-200'
                      }`}>
                        {link.currencySymbol || '₦'}{(link.amount || 0).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between gap-1.5 mt-0.5">
                      <span className={`text-[11px] font-bold truncate max-w-[170px] ${
                        theme === 'light' ? 'text-zinc-800' : 'text-zinc-300'
                      }`}>
                        {link.productName}
                      </span>
                      {getStatusBadge(link.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Tab/Console Navigation Location Info */}
          <div className="flex items-center gap-3">
            <button
              onClick={onMobileMenuToggle}
              className={`p-1.5 rounded-lg md:hidden cursor-pointer transition-colors ${
                theme === 'light'
                  ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
              }`}
              aria-label="Toggle Navigation Panel"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Mobile Header Brand element (FIX 5 & 6) */}
            <div className="md:hidden flex items-center gap-1.5 shrink-0 select-none">
              <svg viewBox="0 0 48 56" className="w-[18px] h-[21px] shrink-0" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="trovaMarkTopNav" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: "#10b981", stopOpacity: 1}}/>
                    <stop offset="100%" style={{stopColor: "#065f46", stopOpacity: 1}}/>
                  </linearGradient>
                </defs>
                <path d="M4,2 L44,2 L44,38 L24,54 L4,38 Z" fill="url(#trovaMarkTopNav)"/>
                <polyline points="12,14 24,36 36,14" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="14" x2="36" y2="14" stroke="white" strokeWidth="4" strokeLinecap="round"/>
              </svg>
              <span className={`font-extrabold text-xs tracking-tight font-sans lowercase shrink-0 ${
                theme === 'light' ? 'text-zinc-900' : 'text-white'
              }`}>
                trova
              </span>
            </div>

            {/* Desktop title path identifier */}
            <div className="hidden md:block">
              <h2 className={"text-xs font-semibold uppercase tracking-widest font-mono flex items-center gap-1.5 " + (theme === 'light' ? 'text-zinc-500' : 'text-zinc-400')}>
                <span className={theme === 'light' ? 'text-zinc-900' : 'text-zinc-100'}>{getTabTitle()}</span>
              </h2>
            </div>
          </div>

          {/* Global Search Input Field and dropdown */}
          {!isAdmin && (
            <div 
              ref={searchContainerRef} 
              className="hidden md:block flex-1 max-w-[340px] mx-6 relative"
            >
            <div className="relative flex items-center">
              <Search style={{ color: 'var(--text-muted)' }} className="w-3.5 h-3.5 absolute left-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchFocused(true);
                }}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                 placeholder="Search transactions, products, contacts"
                 style={{ 
                   backgroundColor: 'var(--surface2)', 
                   borderColor: 'var(--border)', 
                   color: 'var(--text-primary)' 
                 }}
                 className="w-full text-[11px] font-semibold pl-8.5 pr-3.5 py-2.5 rounded-lg border focus:outline-none transition-all text-left font-sans placeholder:text-[var(--text-muted)]"
              />
            </div>

            {/* Dropdown panel */}
            {searchFocused && searchQuery.trim() !== '' && (
              <div 
                style={{ 
                  backgroundColor: 'var(--dropdown-bg)', 
                  borderColor: 'var(--border)', 
                  boxShadow: 'var(--dropdown-shadow)' 
                }}
                className="absolute left-0 right-0 mt-2 rounded-xl border py-1.5 z-50 text-left overflow-hidden max-h-80 overflow-y-auto"
              >
                {searchResults.length === 0 ? (
                  <div className="px-4 py-3 text-[10.5px] text-zinc-500 italic text-center">
                    No matching transactions found.
                  </div>
                ) : (
                  searchResults.map((link) => (
                    <div
                      key={link.id}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSearchResultClick(link.id);
                      }}
                      className={`px-4 py-2.5 cursor-pointer flex flex-col gap-1 transition-colors border-b last:border-b-0 text-left ${
                        theme === 'light'
                          ? 'hover:bg-zinc-50 border-zinc-100'
                          : 'hover:bg-zinc-900 border-[#27272a]/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[10px] text-emerald-500 font-extrabold select-none">
                          {link.id}
                        </span>
                        <span className={`font-mono text-[10px] font-semibold ${
                          theme === 'light' ? 'text-zinc-600' : 'text-zinc-200'
                        }`}>
                          {link.currencySymbol || '₦'}{(link.amount || 0).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between gap-1.5 mt-0.5">
                        <span className={`text-[11px] font-bold truncate max-w-[145px] ${
                          theme === 'light' ? 'text-zinc-800' : 'text-zinc-300'
                        }`}>
                          {link.productName}
                        </span>
                        {getStatusBadge(link.status)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          )}

      {/* Synchronizer indicator and profile controls */}
      <div className="flex items-center gap-4">

        {/* Mobile Search trigger button */}
        {!isAdmin && (
          <button
            id="mobile-search-btn"
            onClick={() => setMobileSearchOpen(true)}
            className={`p-2 rounded-lg md:hidden cursor-pointer transition-colors ${
              theme === 'light'
                ? 'bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-600'
                : 'bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/80 text-zinc-400'
            }`}
            title="Search transactions"
          >
            <Search className="w-4 h-4 search-icon-element text-zinc-400 [.light-theme_&]:text-zinc-500" />
          </button>
        )}

        {/* Real-time Web Audio API Mute Control */}
        <button
          id="global-mute-toggle-btn"
          type="button"
          onClick={toggleSound}
          className={`p-2 rounded-lg transition-all cursor-pointer relative ${
            theme === 'light'
              ? 'bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-600 hover:text-zinc-900'
              : 'bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/80 text-zinc-400 hover:text-zinc-100'
          }`}
          title={muted ? "Unmute system effects" : "Mute system effects"}
        >
          {muted ? (
            <VolumeX className="w-4 h-4 text-rose-500 [.dark-theme_&]:text-rose-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-emerald-600 [.dark-theme_&]:text-emerald-400 animate-hover" />
          )}
        </button>

        {/* Notifications Tray Container */}
          {!isAdmin && (
          <div ref={notificationContainerRef} className="relative">
          <button 
            id="notification-bell-btn"
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setDropdownOpen(false);
            }}
             className={`p-2 rounded-lg transition-all cursor-pointer relative ${
               theme === 'light'
                 ? 'bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-600 hover:text-zinc-900'
                 : 'bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/80 text-zinc-400 hover:text-zinc-100'
             }`}
          >
            <Bell className="w-4 h-4 bell-icon-element" />
            {hasUnread && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[16px] h-4 rounded-full bg-emerald-500 text-black text-[9px] font-black flex items-center justify-center notification-badge">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div 
              style={{ 
                backgroundColor: 'var(--dropdown-bg)', 
                borderColor: 'var(--border)', 
                boxShadow: 'var(--dropdown-shadow)' 
              }}
              className={`absolute right-[-16px] sm:right-0 mt-2.5 w-[calc(100vw-32px)] sm:w-80 max-w-[340px] border rounded-xl shadow-2xl z-50 text-left overflow-hidden notification-dropdown flex flex-col`}
            >
              {/* Header */}
              <div 
                style={{ 
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)'
                }}
                className="px-4 py-2.5 border-b flex items-center justify-between notification-header"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--text-primary)]">Notifications</span>
                  {hasUnread && (
                    <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {hasUnread && (
                    <button 
                      onClick={handleMarkAllRead} 
                      className="text-[10px] font-semibold text-emerald-500 hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
              </div>

              {/* Notification list */}
              <div className="flex flex-col max-h-[360px] overflow-y-auto no-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-[11px] text-[var(--text-muted)]">No notifications</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {groupNotificationsByTime(notifications).map((group) => (
                      <div key={group.label}>
                        <div className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] bg-[var(--surface2)]/50">
                          {group.label}
                        </div>
                        {group.items.slice(0, 4).map((notif) => {
                          const status = getNotificationStatus(notif.text_payload);
                          const accent = getStatusAccent(status);
                          return (
                            <div 
                              key={notif.id} 
                              className={`px-4 py-2.5 hover:bg-[var(--hover-surface)] transition-colors border-l-2 ${accent} ${
                                !notif.read ? 'bg-emerald-500/[0.02]' : 'opacity-70'
                              }`}
                            >
                              <div className="flex flex-col gap-0.5">
                                <p className="text-[11px] text-[var(--text-primary)] leading-normal font-sans text-left">
                                  {notif.text_payload.replace(/^[^\w]*/, '').trim()}
                                </p>
                                <span className="text-[9px] text-[var(--text-muted)] font-mono block text-left">
                                  {formatNotificationTime(notif.created_at)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div 
                  style={{ 
                    borderTopColor: 'var(--border)',
                    backgroundColor: 'var(--surface)'
                  }}
                  className="p-2 text-center flex items-center justify-center shrink-0"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('notifications');
                      onNavigateTab?.('notifications');
                      setNotificationsOpen(false);
                    }}
                    className="w-full py-2 px-4 rounded-lg text-emerald-500 hover:text-emerald-400 text-[11px] font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

        {/* Profile Avatar dropdown with style color rules */}
        <div ref={profileContainerRef} className="relative">
          <button 
            id="profile-trigger-btn"
            type="button"
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setNotificationsOpen(false);
            }}
            className={`relative flex items-center gap-2 p-1.5 rounded-lg border transition-all cursor-pointer ${theme === 'light' ? 'bg-white border-zinc-200 hover:border-zinc-300' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}
          >
            {kycStatusState !== 'verified' && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 border border-black rounded-full animate-pulse z-10" />
            )}
            
            {userProfile?.avatarUrl ? (
              <div className={`relative w-5.5 h-5.5 shrink-0 rounded-md overflow-hidden border ${theme === 'light' ? 'border-zinc-200 bg-white' : 'border-zinc-900 bg-zinc-900'}`}>
                <img 
                  src={userProfile.avatarUrl} 
                   alt={userName} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="w-5.5 h-5.5 rounded-md bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 text-[10px] font-bold shrink-0 relative ">
                {userName.split(' ').map(n => n[0]).join('')}
              </div>
            )}
            
            {/* Minimal absolute sticker tag */}
            {userProfile?.sticker && (
              <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] absolute -bottom-1 left-4 shadow-sm select-none ${theme === 'light' ? 'bg-white border-zinc-200' : 'bg-black border-zinc-900'}`}>
                {userProfile.sticker}
              </span>
            )}
            
            <span className={`text-xs font-semibold select-none hidden sm:inline ml-0.5 profile-user-name ${theme === 'light' ? 'text-zinc-900' : 'text-zinc-300'}`}>
              {userName}
            </span>
          </button>
 
          {dropdownOpen && (
            <div 
              style={{ 
                backgroundColor: 'var(--dropdown-bg)', 
                borderColor: 'var(--border)', 
                boxShadow: theme === 'light' ? '0px 12px 24px rgba(232, 39, 39, 0.12), 0px 4px 12px rgba(0,0,0,0.08)' : 'var(--dropdown-shadow)'
              }}
              className={`absolute right-0 mt-2.5 w-60 border rounded-xl z-50 text-left overflow-hidden font-sans profile-dropdown shadow-2xl py-1.5`}
            >
              <div 
                style={{ 
                  backgroundColor: theme === 'light' ? '#edf1f0' : '#0A0A0A',
                  borderColor: 'var(--border)'
                }}
                className={`px-4 py-2.5 border-b flex flex-col gap-0.5`}
              >
                <div className="flex items-center gap-1.5 justify-start flex-row">
                  <span className={`text-[13px] font-semibold truncate max-w-[140px]`} style={{ color: 'var(--text-primary)' }}>{userName}</span>
                  {userProfile?.sticker && <span className="text-[11px] select-none shrink-0">{userProfile.sticker}</span>}
                </div>
                <span className={`text-[11px] truncate font-mono`} style={{ color: 'var(--text-muted)' }}>{userEmail}</span>
                
                {/* Micro Compliance card section */}
                {!isAdmin && (
                  <div className={`mt-2 pt-2 border-t border-dashed flex flex-col gap-1 text-[10px]`} style={{ borderColor: 'var(--border)' }}>
                    {kycStatusState === 'verified' ? (
                      <div className="flex items-center gap-1.5 font-semibold text-[#10b981]">
                        <ShieldCheck style={{ width: '14px', height: '14px', color: '#10b981' }} />
                        <span style={{ fontSize: '13px', color: '#10b981' }}>Identity Verified</span>
                      </div>
                    ) : kycStatusState === 'pending' ? (
                      <div className="flex items-center gap-1.5 font-semibold text-[#f59e0b]">
                        <Clock style={{ width: '14px', height: '14px', color: '#f59e0b' }} />
                        <span style={{ fontSize: '13px', color: '#f59e0b' }}>Verification in Review</span>
                      </div>
                    ) : kycStatusState === 'rejected' ? (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-1.5 font-semibold text-[#f87171]">
                          <XCircle style={{ width: '14px', height: '14px', color: '#f87171' }} />
                          <span style={{ fontSize: '13px', color: '#f87171' }}>Verification Rejected</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setDropdownOpen(false);
                            onVerifyNowClick?.();
                          }}
                          style={{ color: '#f87171', fontSize: '11px' }}
                          className="font-bold hover:underline cursor-pointer"
                        >
                          Resubmit
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1 font-bold text-amber-500">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Unverified — Shop limits active</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setDropdownOpen(false);
                            onVerifyNowClick?.();
                          }}
                          className="w-full text-center py-1 mt-0.5 bg-[#10b981] hover:bg-emerald-400 text-black text-[9px] font-black uppercase tracking-wider rounded transition-colors cursor-pointer"
                        >
                          Verify Now
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
               <div className="flex flex-col p-1 gap-0.5">
                 {!isAdmin && (
                   <button 
                     type="button"
                     onClick={() => {
                       setActiveTab('settings');
                       onNavigateTab?.('settings');
                       setDropdownOpen(false);
                     }}
                     className="w-full text-left px-3 py-2 text-xs rounded-lg flex items-center gap-2 cursor-pointer transition-colors hover:bg-[var(--hover-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                   >
                     <Settings className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                     <span>Account Setup</span>
                   </button>
                 )}

                {/* Light Mode / Dark Mode Dynamic Toggle */}
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onThemeToggle();
                  }}
                  className="w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between cursor-pointer transition-all hover:bg-[var(--hover-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  title="Toggle Light or Dark interface look"
                >
                  <div className="flex items-center gap-2">
                    {theme === 'dark' ? (
                      <Sun className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    ) : (
                      <Moon className="w-3.5 h-3.5 text-indigo-550" />
                    )}
                    <span className="font-semibold">
                      Interface Theme
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span 
                      className="px-1.5 py-0.5 rounded text-[8.5px] font-black tracking-wider transition-all select-none uppercase"
                      style={{
                        backgroundColor: theme === 'light' ? 'var(--brand-emerald-subtle)' : 'transparent',
                        color: theme === 'light' ? 'var(--brand-emerald)' : 'var(--text-muted)'
                      }}
                    >
                      LIGHT
                    </span>
                    <span 
                      className="px-1.5 py-0.5 rounded text-[8.5px] font-black tracking-wider transition-all select-none uppercase"
                      style={{
                        backgroundColor: theme === 'dark' ? 'var(--brand-emerald-subtle)' : 'transparent',
                        color: theme === 'dark' ? 'var(--brand-emerald)' : 'var(--text-muted)'
                      }}
                    >
                      DARK
                    </span>
                  </div>
                </button>
              </div>
              
                <div 
                  style={{ borderTopColor: 'var(--border)' }}
                  className="px-1 border-t pt-1.5"
                >
                  <button 
                    type="button"
                    onClick={() => { setDropdownOpen(false); onLogout(); }}
                    className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 rounded-lg flex items-center gap-2 cursor-pointer transition-colors font-semibold"
                  >
                  <LogOut className="w-3.5 h-3.5 text-red-500/70" />
                  <span>Sign Out</span>
                </button>
          </div>
        </div>
       )}
        </div>

      </div>
      </>
    )}
    </header>
  );
}
