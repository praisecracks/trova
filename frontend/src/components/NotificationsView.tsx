import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  BellRing,
  Info,
  AlertTriangle,
  CheckCircle,
  Trash2,
  UserRound,
  Check,
  Search,
  Truck,
  Filter,
  Eye,
  EyeOff,
  Clock,
  ArrowRight,
  ShieldCheck,
  X
} from 'lucide-react';
import { useToast } from './ToastContext';
import { getNotificationsForProfile, markNotificationRead, markNotificationUnread, deleteNotification, type Notification } from '../lib/services/notifications';

interface ParsedNotification {
  id: string;
  type: 'deposit' | 'dispute' | 'delivery' | 'system';
  severity: 'critical' | 'warning' | 'info' | 'system';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

interface NotificationsViewProps {
  profileId?: string;
}

const SEVERITY_CONFIG: Record<string, { border: string; bg: string; text: string; label: string }> = {
  critical: { border: 'border-l-rose-500 [.light-theme_&]:border-l-rose-600', bg: 'bg-rose-500/[0.03] [.light-theme_&]:bg-rose-500/[0.06]', text: 'text-rose-400 [.light-theme_&]:text-rose-600', label: 'Critical' },
  warning: { border: 'border-l-amber-500 [.light-theme_&]:border-l-amber-600', bg: 'bg-amber-500/[0.03] [.light-theme_&]:bg-amber-500/[0.06]', text: 'text-amber-400 [.light-theme_&]:text-amber-600', label: 'Warning' },
  info: { border: 'border-l-emerald-500 [.light-theme_&]:border-l-emerald-600', bg: 'bg-emerald-500/[0.02] [.light-theme_&]:bg-emerald-500/[0.05]', text: 'text-emerald-400 [.light-theme_&]:text-emerald-600', label: 'Info' },
  system: { border: 'border-l-zinc-500 [.light-theme_&]:border-l-zinc-400', bg: 'bg-transparent [.light-theme_&]:bg-zinc-50', text: 'text-zinc-400 [.light-theme_&]:text-zinc-600', label: 'System' }
};

const CREDIT_ALERT_STYLE = {
  border: 'border-l-[3px] border-l-emerald-500 [.light-theme_&]:border-l-emerald-600',
  bg: 'bg-emerald-500/[0.04] [.light-theme_&]:bg-emerald-500/[0.08]',
  badge: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/25 [.light-theme_&]:bg-emerald-50 [.light-theme_&]:text-emerald-700 [.light-theme_&]:border-emerald-200',
  title: 'text-emerald-50 [.light-theme_&]:text-emerald-900',
  description: 'text-emerald-100/80 [.light-theme_&]:text-emerald-800/90'
};

const FILTER_STYLES = {
  all: { activeText: 'text-emerald-400', badge: 'bg-zinc-800 text-zinc-400' },
  unread: { activeText: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-500' },
  payments: { activeText: 'text-emerald-400', badge: 'bg-zinc-800 text-zinc-400' },
  claims: { activeText: 'text-rose-400', badge: 'bg-rose-500/10 text-rose-500' }
};

export default function NotificationsView({ profileId }: NotificationsViewProps) {
  const { success, error: showError } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'payments' | 'claims'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const formatRelativeTime = (isoString: string) => {
    try {
      const past = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - past.getTime();
      const seconds = Math.floor(diffMs / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) return `${days}d ago`;
      if (hours > 0) return `${hours}h ago`;
      if (minutes > 0) return `${minutes}m ago`;
      return 'Just now';
    } catch (e) {
      return 'Some time ago';
    }
  };

  const formatAbsoluteTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  const getNotificationGroup = (dateStr: string): 'Today' | 'This Week' | 'Earlier' => {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    if (date >= today) return 'Today';
    if (date >= weekAgo) return 'This Week';
    return 'Earlier';
  };

  const loadNotifications = async () => {
    if (profileId) {
      try {
        const supabaseNotifications = await getNotificationsForProfile(profileId);
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

    try {
      const savedNotifications = localStorage.getItem('trustlink_notifications');
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);
        if (Array.isArray(parsed)) {
          const mapped = parsed.map((n: any) => ({
            id: n.id,
            profile_id: profileId || '',
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
    const syncFromStorage = () => {
      loadNotifications();
    };
    window.addEventListener('trustlink_notifications_update', syncFromStorage);
    window.addEventListener('storage', syncFromStorage);
    return () => {
      window.removeEventListener('trustlink_notifications_update', syncFromStorage);
      window.removeEventListener('storage', syncFromStorage);
    };
  }, [profileId]);

  useEffect(() => {
    loadNotifications();
  }, [profileId]);

  const handleToggleRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const notification = notifications.find(n => n.id === id);
    if (!notification) return;

    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));

    try {
      const savedNotifications = localStorage.getItem('trustlink_notifications');
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);
        const updated = parsed.map((n: any) =>
          n.id === id ? { ...n, read: !n.read } : n
        );
        localStorage.setItem('trustlink_notifications', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('trustlink_notifications_update'));
      }
    } catch (e) {}

    if (profileId) {
      const result = notification.read ? await markNotificationUnread(id) : await markNotificationRead(id);
      if (!result) {
        showError(`Failed to ${(notification.read ? 'mark unread' : 'mark read')}. Please try again.`);
      }
    }

    success(notification.read ? "Marked as unread" : "Marked as read");
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));

    try {
      const savedNotifications = localStorage.getItem('trustlink_notifications');
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);
        const filtered = parsed.filter((n: any) => n.id !== id);
        localStorage.setItem('trustlink_notifications', JSON.stringify(filtered));
        window.dispatchEvent(new CustomEvent('trustlink_notifications_update'));
      }
    } catch (e) {}

    if (profileId) {
      const result = await deleteNotification(id);
      if (!result) {
        showError('Failed to delete notification. Please try again.');
      }
    }

    success("Notification dismissed");
  };

  const handleClearAll = async () => {
    if (notifications.length === 0) return;

    const currentNotifications = notifications;
    setNotifications([]);
    localStorage.setItem('trustlink_notifications', JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('trustlink_notifications_update'));

    if (profileId) {
      const results = await Promise.all(currentNotifications.map(n => deleteNotification(n.id)));
      const failed = results.filter(r => r === false).length;
      if (failed > 0) {
        showError(`${failed} notification(s) could not be cleared from server.`);
      }
    }

    success("All notifications cleared");
  };

  const handleMarkAllReadManual = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    try {
      const savedNotifications = localStorage.getItem('trustlink_notifications');
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);
        const updated = parsed.map((n: any) => ({ ...n, read: true }));
        localStorage.setItem('trustlink_notifications', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('trustlink_notifications_update'));
      }
    } catch (e) {}

    if (profileId) {
      const results = await Promise.all(unread.map(n => markNotificationRead(n.id)));
      const failed = results.filter(r => r === false).length;
      if (failed > 0) {
        showError(`${failed} notification(s) could not be marked as read.`);
      }
    }

    success("All notifications marked as read");
  };

  const parseNotification = (n: Notification): ParsedNotification => {
    const text = n.text_payload || "";
    const lower = text.toLowerCase();

    let type: 'deposit' | 'dispute' | 'delivery' | 'system' = 'system';
    let severity: 'critical' | 'warning' | 'info' | 'system' = 'system';
    let title = "System notification";

    if (lower.includes('dispute') || lower.includes('disputed') || lower.includes('arbitration') || lower.includes('problem') || lower.includes('freeze')) {
      type = 'dispute';
      severity = 'critical';
      title = "Dispute claim active";
    } else if (lower.includes('delivered') || lower.includes('shipped') || lower.includes('arrived') || lower.includes('dispatch') || lower.includes('release') || lower.includes('finalized') || lower.includes('complete') || lower.includes('confirm')) {
      type = 'delivery';
      severity = 'warning';
      title = "Logistics handoff resolved";
    } else if (lower.includes('deposit') || lower.includes('payout') || lower.includes('payment') || lower.includes('secured') || lower.includes('received') || lower.includes('settlement')) {
      type = 'deposit';
      severity = 'info';
      title = "Secure payment confirmed";
    } else {
      type = 'system';
      severity = 'system';
      title = "System notification";
    }

    return {
      id: n.id,
      type,
      severity,
      title,
      description: text,
      timestamp: n.created_at,
      read: !!n.read
    };
  };

  const parsedItems = useMemo(() => {
    return notifications.map(parseNotification);
  }, [notifications]);

  const groupedNotifications = useMemo(() => {
    let items = parsedItems;

    if (activeTab === 'unread') {
      items = items.filter(n => !n.read);
    } else if (activeTab === 'payments') {
      items = items.filter(n => n.type === 'deposit');
    } else if (activeTab === 'claims') {
      items = items.filter(n => n.type === 'dispute');
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      items = items.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.description.toLowerCase().includes(query)
      );
    }

    const sorted = [...items].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const groups: Record<string, ParsedNotification[]> = { 'Today': [], 'This Week': [], 'Earlier': [] };
    sorted.forEach(item => {
      const group = getNotificationGroup(item.timestamp);
      groups[group].push(item);
    });

    return groups;
  }, [parsedItems, activeTab, searchQuery]);

  const unreadCount = parsedItems.filter(n => !n.read).length;
  const paymentsCount = parsedItems.filter(n => n.type === 'deposit').length;
  const claimsCount = parsedItems.filter(n => n.type === 'dispute').length;
  const hasAnyNotifications = notifications.length > 0;

  return (
    <div id="notifications-view-container" className="flex flex-col gap-5 text-left font-sans w-full max-w-full relative">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-bold font-mono tracking-wider text-emerald-400 uppercase">Vault Feed Log</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Inbox Notifications
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">
            Audit log of escrow deposits, shipment triggers, disputes, and settlements.
          </p>
        </div>

        {hasAnyNotifications && (
          <div className="flex items-center gap-2 self-stretch sm:self-auto select-none">
            <button
              onClick={handleMarkAllReadManual}
              className="py-1.5 px-3 bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface2)] transition-all text-xs font-bold text-[var(--text-primary)] rounded-lg cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mark all read</span>
            </button>

            <button
              onClick={handleClearAll}
              className="py-1.5 px-3 bg-red-500/5 border border-red-500/20 hover:bg-red-500 hover:text-black hover:border-red-500 transition-all text-xs font-bold text-red-400 rounded-lg cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Feed</span>
            </button>
          </div>
        )}
      </div>

      {!hasAnyNotifications ? (
        <div className="flex flex-col gap-4">
          {/* Skeleton notification placeholders — wireframe lines, no loader */}
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-dashed border-[var(--skeleton-line)] flex items-start justify-between gap-3 p-3 sm:p-4"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex flex-col gap-2 text-left min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="h-3 w-28 sm:w-36 rounded-sm border border-[var(--skeleton-line)]" />
                      <div className="h-3 w-14 rounded-sm border border-[var(--skeleton-line)]" />
                      <div className="w-1.5 h-1.5 rounded-full border border-[var(--skeleton-line)] bg-[var(--skeleton-fill)]" />
                    </div>
                    <div className="h-2.5 w-full max-w-md rounded-sm border border-[var(--skeleton-line)]" />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-lg border border-[var(--skeleton-line)] bg-[var(--skeleton-fill)]" />
                    <div className="w-7 h-7 rounded-lg border border-[var(--skeleton-line)] bg-[var(--skeleton-fill)]" />
                  </div>
                  <div className="h-2 w-12 rounded-sm border border-[var(--skeleton-line)]" />
                </div>
              </div>
            ))}
          </div>

          {/* Empty illustration + message — bell dangling, human beside, no box */}
          <div className="flex flex-col items-center justify-center text-center gap-4 py-8">
            <div className="relative flex items-center justify-center mt-6">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-6 h-6 w-px bg-[var(--skeleton-line)]" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-7 w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]/60" />
              <div className="bell-dangle relative flex items-center justify-center">
                <BellRing className="w-12 h-12 text-emerald-400" strokeWidth={1.5} />
                <span className="bell-wave absolute -right-3 top-2 w-2 h-3 border-t-2 border-r-2 rounded-tr-full border-emerald-400/70" />
                <span className="bell-wave-delayed absolute -right-4 top-1 w-2.5 h-4 border-t-2 border-r-2 rounded-tr-full border-emerald-400/50" />
              </div>
              <UserRound className="w-6 h-6 text-[var(--text-muted)] absolute -bottom-2 -right-6" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col gap-2 max-w-sm">
              <h3 className="text-base font-extrabold text-[var(--text-primary)] tracking-tight">No notifications yet</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Any notification will appear here — escrow deposits, shipment triggers, disputes, and settlements.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">

          {/* Filters & Search */}
          <div
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
            className="border p-4 rounded-2xl flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center select-none"
          >
            <div className="flex gap-2 flex-wrap items-center">
              <button
                onClick={() => setActiveTab('all')}
                style={{
                  backgroundColor: activeTab === 'all' ? 'var(--surface2)' : 'transparent',
                  borderColor: activeTab === 'all' ? 'var(--border)' : 'transparent'
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  activeTab === 'all' ? 'text-emerald-500 [.light-theme_&]:text-emerald-700' : 'text-[var(--text-muted)] hover:text-zinc-800 [.light-theme_&]:hover:text-zinc-900'
                }`}
              >
                All Activity
              </button>

              <button
                onClick={() => setActiveTab('unread')}
                style={{
                  backgroundColor: activeTab === 'unread' ? 'var(--surface2)' : 'transparent',
                  borderColor: activeTab === 'unread' ? 'var(--border)' : 'transparent'
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'unread' ? 'text-emerald-500 [.light-theme_&]:text-emerald-700' : 'text-[var(--text-muted)] hover:text-zinc-800 [.light-theme_&]:hover:text-zinc-900'
                }`}
              >
                <span>Unread</span>
                {unreadCount > 0 && (
                  <span className="bg-emerald-500/10 text-emerald-600 [.light-theme_&]:text-emerald-700 px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('payments')}
                style={{
                  backgroundColor: activeTab === 'payments' ? 'var(--surface2)' : 'transparent',
                  borderColor: activeTab === 'payments' ? 'var(--border)' : 'transparent'
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'payments' ? 'text-emerald-500 [.light-theme_&]:text-emerald-700' : 'text-[var(--text-muted)] hover:text-zinc-800 [.light-theme_&]:hover:text-zinc-900'
                }`}
              >
                <span>Deposits</span>
                {paymentsCount > 0 && (
                  <span className="bg-zinc-200 text-zinc-600 [.light-theme_&]:bg-zinc-800 [.light-theme_&]:text-zinc-400 px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold">
                    {paymentsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('claims')}
                style={{
                  backgroundColor: activeTab === 'claims' ? 'var(--surface2)' : 'transparent',
                  borderColor: activeTab === 'claims' ? 'var(--border)' : 'transparent'
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'claims' ? 'text-rose-500 [.light-theme_&]:text-rose-700' : 'text-[var(--text-muted)] hover:text-rose-700 [.light-theme_&]:hover:text-rose-800'
                }`}
              >
                <span>Claims</span>
                {claimsCount > 0 && (
                  <span className="bg-rose-500/10 text-rose-600 [.light-theme_&]:text-rose-700 px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold">
                    {claimsCount}
                  </span>
                )}
              </button>
            </div>

            {/* Search */}
            <div className="relative flex items-center w-full lg:max-w-xs shrink-0">
              <Search className="absolute left-3 w-4 h-4 text-[var(--text-dim)] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notifications..."
                style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
                className="w-full pl-9 pr-10 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-[var(--text-dim)] shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-zinc-500 [.light-theme_&]:text-zinc-600 hover:text-zinc-800 [.light-theme_&]:hover:text-zinc-900 cursor-pointer bg-transparent border-none"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* No results fallback */}
          {Object.values(groupedNotifications).every(group => group.length === 0) && (
            <div
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
              className="border rounded-2xl flex flex-col items-center justify-center text-center gap-4 min-h-[320px] p-10 relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, var(--text-muted) 1px, transparent 0)',
                backgroundSize: '24px 24px'
              }} />
              <div className="w-16 h-16 rounded-2xl bg-zinc-800/30 border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] relative">
                <Search className="w-6 h-6" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--surface)] bg-zinc-500/80" />
              </div>
              <div className="flex flex-col gap-2 max-w-sm relative">
                <h3 className="text-sm font-extrabold text-[var(--text-primary)] tracking-tight">No matches found</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  We couldn&apos;t find any notifications matching your search or filter. Try adjusting your query or clearing filters.
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setActiveTab('all'); }}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 hover:border-emerald-500/30 text-emerald-600 [.light-theme_&]:text-emerald-700 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  <ArrowRight className="w-3 h-3" />
                  Reset filters
                </button>
              </div>
            </div>
          )}

          {/* Notification Groups */}
          {Object.entries(groupedNotifications).map(([groupLabel, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={groupLabel} className="flex flex-col gap-2">
                <div className="text-[10px] font-bold font-mono uppercase tracking-widest text-[var(--text-muted)] px-1">
                  {groupLabel}
                </div>
                <div className="flex flex-col gap-2">
                  {items.map(n => {
                    const severityStyle = SEVERITY_CONFIG[n.severity] || SEVERITY_CONFIG.system;
                    const isUnread = !n.read;
                    const isDeposit = n.type === 'deposit';
                    const cardBg = isUnread ? 'bg-amber-500/[0.06]' : (isDeposit ? CREDIT_ALERT_STYLE.bg : severityStyle.bg);
                    const cardBorder = isDeposit ? CREDIT_ALERT_STYLE.border : severityStyle.border;
                    return (
                      <div
                        key={n.id}
                        style={{
                          backgroundColor: 'var(--surface)',
                          borderColor: 'var(--border)',
                          boxShadow: 'var(--shadow)'
                        }}
                        className={`p-3 sm:p-4 rounded-xl border flex items-start justify-between gap-3 transition-all ${cardBorder} ${cardBg}`}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="flex flex-col gap-1 text-left min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className={`font-extrabold text-[13px] leading-tight ${isDeposit ? CREDIT_ALERT_STYLE.title : 'text-[var(--text-primary)]'}`}>
                                {n.title}
                              </h4>
                              {isDeposit && (
                                <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${CREDIT_ALERT_STYLE.badge}`}>
                                  Credit Alert
                                </span>
                              )}
                              {!isDeposit && (
                                <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${severityStyle.bg} ${severityStyle.text}`}>
                                  {severityStyle.label}
                                </span>
                              )}
                              {isUnread && (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                              )}
                            </div>
                            <p className={`text-[11px] leading-relaxed font-medium truncate ${isDeposit ? CREDIT_ALERT_STYLE.description : 'text-[var(--text-muted)]'}`}>
                              {n.description}
                            </p>
                          </div>
                        </div>

                        {/* Actions + Timestamp */}
                        <div className="flex flex-col items-center gap-1.5 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => handleToggleRead(n.id, e)}
                              className={`p-1.5 rounded-lg border cursor-pointer flex items-center justify-center transition-colors ${
                                n.read
                                  ? 'border-[var(--border)] text-zinc-400 hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-500'
                                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                              }`}
                              title={n.read ? "Mark unread" : "Mark read"}
                            >
                              {n.read ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              onClick={(e) => handleDeleteNotification(n.id, e)}
                              className="p-1.5 rounded-lg border border-[var(--border)] hover:border-red-500/30 hover:bg-red-500/10 text-zinc-400 hover:text-red-500 cursor-pointer transition-colors"
                              title="Dismiss"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="font-mono text-[9px] text-[var(--text-dim)] flex items-center gap-1 select-none whitespace-nowrap">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{formatRelativeTime(n.timestamp)}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
