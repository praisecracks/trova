import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Store,
  Wallet,
  BookOpen,
  ShieldCheck,
  Home,
  X,
  Settings,
  HelpCircle,
  BarChart3,
  AlertTriangle,
  Bell,
  Gift,
  Download,
  Trash2
} from 'lucide-react';
import { ActiveTab } from '../types';

interface LocalStorageNotification {
  id: string;
  textPayload?: string;
  message?: string;
  read: boolean;
  loggingTime?: string;
  date?: string;
  created_at?: string;
}

interface SidebarProps {
  activeTab: ActiveTab | 'admin';
  setActiveTab: (tab: ActiveTab | 'admin') => void;
  pendingDeliveriesCount: number;
  isOpen?: boolean;
  onClose?: () => void;
  onExitToLanding?: () => void;
  onNavigateTab?: (tab: ActiveTab | 'admin') => void;
  userName?: string;
  userEmail?: string;
  isAdmin?: boolean;
  theme?: 'dark' | 'light';
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  pendingDeliveriesCount,
  isOpen = false,
  onClose,
  onExitToLanding,
  onNavigateTab,
  userName = '',
  userEmail = '',
  isAdmin = false,
  theme: propTheme
}: SidebarProps) {
  const theme = propTheme || (typeof window !== 'undefined' && document.body.classList.contains('light-theme') ? 'light' : 'dark');

  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifications, setNotifications] = useState<LocalStorageNotification[]>([]);
  const [activeDisputes, setActiveDisputes] = useState(0);
  const [activeReferralsCount, setActiveReferralsCount] = useState(3);
  const [pwaPromptAvailable, setPwaPromptAvailable] = useState(() => typeof window !== 'undefined' && !!(window as any).deferredPWAInstallPrompt);
  const [isAppStandalone, setIsAppStandalone] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
  });

  const loadNotifications = () => {
    try {
      const savedNotifications = localStorage.getItem('trustlink_notifications');
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);
        if (Array.isArray(parsed)) {
          setNotifications(parsed);
          setUnreadNotifications(parsed.filter((n: any) => !n.read).length);
        }
      } else {
        setUnreadNotifications(0);
      }
    } catch (e) {
      console.error('Error loading notifications:', e);
      setUnreadNotifications(0);
    }
  };

  const syncCounts = () => {
    loadNotifications();

    const disputesRaw = localStorage.getItem('trustlink_disputes');
    if (disputesRaw) {
      try {
        const parsed = JSON.parse(disputesRaw);
        if (Array.isArray(parsed)) {
          setActiveDisputes(parsed.filter(d => d.status !== 'Resolved').length);
        }
      } catch (e) {}
    } else {
      setActiveDisputes(0);
    }

    const profileSaved = localStorage.getItem('trustlink-profile');
    if (profileSaved) {
      try {
        const parsed = JSON.parse(profileSaved);
        if (typeof parsed.activeReferrals === 'number') {
          setActiveReferralsCount(parsed.activeReferrals);
        } else {
          const email = parsed.email || 'chinedu@voltkicks.ng';
          const emailCleaned = email.replace(/[^a-zA-Z0-9]/g, '_');
          const savedRefs = localStorage.getItem(`trustlink_referrals_${emailCleaned}`);
          if (savedRefs) {
            const parsedRefs = JSON.parse(savedRefs);
            if (parsedRefs && Array.isArray(parsedRefs.referrals)) {
              const activeNum = parsedRefs.referrals.filter((r: any) => r.status === 'Active').length;
              setActiveReferralsCount(activeNum);
            }
          }
        }
      } catch (e) {}
    }
  };

  useEffect(() => {
    syncCounts();

    const handleResetNotif = () => setUnreadNotifications(0);
    const handleUpdateDisputes = (e: any) => {
      setActiveDisputes(e.detail !== undefined ? e.detail : 0);
    };
    const handlePromptReady = () => setPwaPromptAvailable(true);
    const handlePromptCleared = () => setPwaPromptAvailable(false);

    window.addEventListener('trustlink_notifications_reset', handleResetNotif);
    window.addEventListener('trustlink_notifications_update', syncCounts);
    window.addEventListener('trustlink_dispute_count_changed', handleUpdateDisputes);
    window.addEventListener('trustlink_pwa_prompt_ready', handlePromptReady);
    window.addEventListener('trustlink_pwa_prompt_cleared', handlePromptCleared);
    window.addEventListener('storage', syncCounts);

    return () => {
      window.removeEventListener('trustlink_notifications_reset', handleResetNotif);
      window.removeEventListener('trustlink_notifications_update', syncCounts);
      window.removeEventListener('trustlink_dispute_count_changed', handleUpdateDisputes);
      window.removeEventListener('trustlink_pwa_prompt_ready', handlePromptReady);
      window.removeEventListener('trustlink_pwa_prompt_cleared', handlePromptCleared);
      window.removeEventListener('storage', syncCounts);
    };
  }, []);

  const menuItems = isAdmin ? [
    { id: 'admin' as const, label: 'Admin Console', icon: ShieldCheck }
  ] : [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics' as ActiveTab, label: 'Analytics', icon: BarChart3 },
    { id: 'storefront' as ActiveTab, label: 'My Store Link', icon: Store },
    { id: 'disputes' as ActiveTab, label: 'Disputes', icon: AlertTriangle },
    { id: 'payouts' as ActiveTab, label: 'Payout & History', icon: Wallet },
    { id: 'notifications' as ActiveTab, label: 'Notifications', icon: Bell },
    { id: 'onboarding-hub' as ActiveTab, label: 'Getting Started', icon: BookOpen },
    { id: 'deleted-history' as ActiveTab, label: 'Deleted History', icon: Trash2 },
    { id: 'settings' as ActiveTab, label: 'Account setup', icon: Settings },
  ];

  const handleTabClick = (tabId: ActiveTab | 'admin') => {
    setActiveTab(tabId);
    onNavigateTab?.(tabId);
    if (onClose) onClose();
  };

  const handleInstallApp = () => {
    const triggerInstall = (window as any).triggerDeferredPWAInstall;
    if (typeof triggerInstall === 'function') {
      triggerInstall();
    }
  };

  const renderContent = () => {
    const userInitials = (userName || userEmail || 'M')
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const isLight = theme === 'light';

    return (
      <div
        className={`flex flex-col h-full ${isLight ? 'bg-white' : 'bg-[#0A0A0A]'}`}
        style={{
          boxShadow: isLight
            ? '0px 0px 0px 1px rgba(0,0,0,0.04), 8px 0px 24px rgba(0,0,0,0.04)'
            : 'none'
        }}
      >

        {/* Brand & Logo Header */}
        <div 
          className="px-5 h-16 flex items-center justify-between"
          style={{ 
            borderBottom: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg viewBox="0 0 48 56" className="w-[28px] h-[32px] shrink-0" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="trovaMarkSidebar" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: "#10b981", stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: "#059669", stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <path d="M4,2 L44,2 L44,38 L24,54 L4,38 Z" fill="url(#trovaMarkSidebar)" />
                <polyline points="12,14 24,36 36,14" fill="none" stroke={isLight ? "#0f172a" : "white"} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" y1="14" x2="36" y2="14" stroke={isLight ? "#0f172a" : "white"} strokeWidth="4" strokeLinecap="round" />
              </svg>
              <div className={`absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ${isLight ? 'ring-white' : 'ring-[#0A0A0A]'}`} />
            </div>
            <div className="flex flex-col">
              <h1 className="font-bold text-[15px] leading-tight tracking-tight" style={{ color: isLight ? '#0A0A0A' : '#FFFFFF' }}>
                trova<span className="text-emerald-500 font-bold ml-0.5">Escrow</span>
              </h1>
              <span className="text-[8px] uppercase tracking-[0.12em] font-semibold mt-0.5 opacity-50" style={{ color: isLight ? '#0A0A0A' : '#FFFFFF' }}>
                secure · fast · trusted
              </span>
            </div>
          </div>
        </div>

        {/* Main Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5 no-scrollbar min-h-0">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 text-left cursor-pointer relative group ${
                  isActive ? 'font-semibold' : 'hover:bg-white/[0.03]'
                }`}
                style={{
                  backgroundColor: isActive
                    ? isLight
                      ? 'rgba(16,185,129,0.06)'
                      : 'rgba(16,185,129,0.08)'
                    : 'transparent',
                  color: isActive
                    ? isLight
                      ? '#059669'
                      : '#10b981'
                    : isLight
                      ? '#6B6B6B'
                      : '#9A9A9A'
                }}
              >
                {isActive && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                    style={{ backgroundColor: isLight ? '#059669' : '#10b981' }}
                  />
                )}
                <IconComponent
                  className="w-4 h-4 shrink-0 transition-all duration-200 group-hover:scale-105"
                  style={{
                    color: isActive
                      ? isLight
                        ? '#059669'
                        : '#10b981'
                      : isLight
                        ? '#9A9A9A'
                        : '#7A7A7A'
                  }}
                />
                <span className="flex-1">{item.label}</span>
                {item.id === 'storefront' && (
                  <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-bold px-1.5 py-0.5 rounded-full font-mono shrink-0 tracking-wide">
                    LIVE
                  </span>
                )}
                {item.id === 'disputes' && activeDisputes > 0 && (
                  <span className="bg-red-500/10 text-red-500 text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono shrink-0">
                    {activeDisputes}
                  </span>
                )}
                {item.id === 'notifications' && unreadNotifications > 0 && (
                  <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono shrink-0">
                    {unreadNotifications}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom controls */}
        <div className="px-3 pb-4 shrink-0 flex flex-col gap-3">
          {!isAdmin && (
            <div className="px-0.5">
              {(() => {
                const active = activeReferralsCount;
                let sidebarBadgeInfo = { tier: 'No Referral badge', color: '#71717a', progressText: '0 of 1' };
                if (active >= 10) {
                  sidebarBadgeInfo = { tier: 'Elite Partner', color: '#8b5cf6', progressText: '10 of 10' };
                } else if (active >= 5) {
                  sidebarBadgeInfo = { tier: 'Top Seller', color: '#f97316', progressText: `${active} of 10` };
                } else if (active >= 3) {
                  sidebarBadgeInfo = { tier: 'Pro Seller', color: '#4f46e5', progressText: `${active} of 5` };
                } else if (active >= 1) {
                  sidebarBadgeInfo = { tier: 'Trusted Merchant', color: '#0d9481', progressText: `${active} of 3` };
                }

                return (
                  <div
                    id="sidebar-referral-card"
                    onClick={() => handleTabClick('referrals')}
                    className={`group/referral w-full flex flex-col gap-3 p-4 rounded-xl transition-all duration-200 text-left cursor-pointer relative overflow-hidden ${
                      isLight
                        ? 'hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]'
                        : 'hover:shadow-[0_4px_16px_rgba(0,0,0,0.4)]'
                    }`}
                    style={{
                      backgroundColor: isLight
                        ? '#FFFFFF'
                        : 'rgba(255,255,255,0.03)',
                      boxShadow: isLight
                        ? '0px 1px 3px rgba(0,0,0,0.04), 0px 0px 0px 1px rgba(0,0,0,0.04)'
                        : '0px 0px 0px 1px rgba(255,255,255,0.04)',
                      border: isLight
                        ? '1px solid rgba(0,0,0,0.04)'
                        : '1px solid rgba(255,255,255,0.04)'
                    }}
                  >
                    {/* Decorative gradient */}
                    <div
                      className="absolute inset-0 opacity-[0.03] pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at 100% 0%, ${sidebarBadgeInfo.color}, transparent 70%)`
                      }}
                    />

                    <div className="flex items-center justify-between w-full relative">
                      <div className="flex items-center gap-3">
                        <div
                          className="p-2 rounded-lg transition-all duration-200 group-hover/referral:scale-105"
                          style={{
                            backgroundColor: isLight
                              ? `${sidebarBadgeInfo.color}08`
                              : `${sidebarBadgeInfo.color}10`,
                            color: sidebarBadgeInfo.color
                          }}
                        >
                          <Gift className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover/referral:scale-110" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-semibold tracking-tight" style={{ color: isLight ? '#0A0A0A' : '#FFFFFF' }}>
                            Refer and Earn
                          </span>
                          <span className="text-[9px] font-medium tracking-wide opacity-60" style={{ color: isLight ? '#0A0A0A' : '#FFFFFF' }}>
                            {sidebarBadgeInfo.tier}
                          </span>
                        </div>
                      </div>

                      <svg
                        className="w-3.5 h-3.5 stroke-[2.5] transition-all duration-200 group-hover/referral:translate-x-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        style={{ color: sidebarBadgeInfo.color }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    <div className="flex items-center justify-between select-none pt-2 border-t" style={{ borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)' }}>
                      <span className="text-[8px] uppercase font-semibold tracking-[0.12em] opacity-50" style={{ color: isLight ? '#0A0A0A' : '#FFFFFF' }}>
                        Active Sellers
                      </span>
                      <span className="text-[11px] font-bold font-mono" style={{ color: sidebarBadgeInfo.color }}>
                        {sidebarBadgeInfo.progressText}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2" style={{ borderTop: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)'}` }}>
            <div className="flex items-center gap-3 px-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[12px] shrink-0 ${
                  isLight
                    ? 'ring-2 ring-emerald-100 shadow-[0_0_0_1px_#05966920]'
                    : 'ring-2 ring-emerald-500/20 shadow-[0_0_20px_#10b98120]'
                }`}
                style={{
                  background: isLight
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : 'linear-gradient(135deg, #10b981, #047857)',
                  color: '#ffffff'
                }}
              >
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate" style={{ color: isLight ? '#0A0A0A' : '#FFFFFF' }}>
                  {userName || 'Merchant'}
                </p>
                <p className="text-[11px] truncate opacity-60" style={{ color: isLight ? '#0A0A0A' : '#FFFFFF' }}>
                  {userEmail || 'Signed in'}
                </p>
              </div>
            </div>

            {!isAppStandalone && (
              <button
                onClick={handleInstallApp}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left cursor-pointer ${
                  pwaPromptAvailable
                    ? isLight
                      ? 'hover:shadow-[0_2px_8px_rgba(16,185,129,0.12)]'
                      : 'hover:shadow-[0_2px_8px_rgba(16,185,129,0.15)]'
                    : ''
                }`}
                style={{
                  backgroundColor: pwaPromptAvailable
                    ? isLight
                      ? 'rgba(16,185,129,0.04)'
                      : 'rgba(16,185,129,0.06)'
                    : isLight
                      ? 'rgba(0,0,0,0.02)'
                      : 'rgba(255,255,255,0.02)',
                  border: isLight
                    ? `1px solid ${pwaPromptAvailable ? 'rgba(16,185,129,0.15)' : 'rgba(0,0,0,0.04)'}`
                    : `1px solid ${pwaPromptAvailable ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)'}`
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="p-1.5 rounded-lg shrink-0 transition-colors"
                    style={{
                      backgroundColor: pwaPromptAvailable
                        ? isLight
                          ? 'rgba(16,185,129,0.06)'
                          : 'rgba(16,185,129,0.08)'
                        : 'transparent',
                      color: pwaPromptAvailable
                        ? isLight
                          ? '#059669'
                          : '#10b981'
                        : isLight
                          ? '#8A8A8A'
                          : '#5A5A5A'
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: isLight ? '#0A0A0A' : '#FFFFFF' }}>
                      Download App
                    </p>
                    <p className="text-[10.5px] truncate opacity-60" style={{ color: isLight ? '#0A0A0A' : '#FFFFFF' }}>
                      {pwaPromptAvailable ? 'Install for faster access' : 'PWA ready in browser'}
                    </p>
                  </div>
                </div>
                <div
                  className={`w-2 h-2 rounded-full shrink-0 transition-all duration-300 ${
                    pwaPromptAvailable
                      ? 'animate-pulse'
                      : ''
                  }`}
                  style={{
                    backgroundColor: pwaPromptAvailable
                      ? isLight
                        ? '#059669'
                        : '#10b981'
                      : isLight
                        ? 'rgba(0,0,0,0.08)'
                        : 'rgba(255,255,255,0.08)'
                  }}
                />
              </button>
            )}
          </div>
        </div>

      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        id="sidebar-desktop-container"
        className="hidden md:flex w-64 flex-col justify-between h-screen sticky top-0 shrink-0 select-none"
      >
        {renderContent()}
      </aside>

      {/* Mobile drawer */}
      {isOpen && (
        <div id="mobile-sidebar-root" className="fixed inset-0 z-50 md:hidden flex">
          <div
            id="mobile-sidebar-backdrop"
            className="fixed inset-0 backdrop-blur-sm transition-opacity duration-300"
            style={{
              backgroundColor: theme === 'light' ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.6)'
            }}
            onClick={onClose}
          />
          <aside
            id="mobile-sidebar-container"
            className={`relative w-64 h-full flex flex-col justify-between z-50 shadow-2xl animate-slide-in ${
              theme === 'light' ? 'bg-white' : 'bg-[#0A0A0A]'
            }`}
            style={{
              boxShadow: theme === 'light'
                ? '0px 0px 0px 1px rgba(0,0,0,0.04), 8px 0px 24px rgba(0,0,0,0.08)'
                : '0px 0px 0px 1px rgba(255,255,255,0.04), 8px 0px 24px rgba(0,0,0,0.4)'
            }}
          >
            <button
              id="mobile-sidebar-close-btn"
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg focus:outline-none transition-colors cursor-pointer"
              style={{
                backgroundColor: theme === 'light'
                  ? 'rgba(0,0,0,0.04)'
                  : 'rgba(255,255,255,0.04)',
                color: theme === 'light'
                  ? '#5A5A5A'
                  : '#8A8A8A'
              }}
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
            {renderContent()}
          </aside>
        </div>
      )}
    </>
  );
}