import { useState, useEffect, useCallback } from 'react';
import { EscrowLink } from '../types';
import { getSellerTransactions, deleteTransaction } from '../lib/services/transactions';
import { supabase } from '../lib/supabaseClient';

const DELETED_IDS_KEY = 'trustlink_deleted_ids';

const readDeletedIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DELETED_IDS_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch (e) {}
  return new Set();
};

const writeDeletedIds = (ids: Set<string>) => {
  try {
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify([...ids]));
  } catch (e) {}
};

// Drop clearly-corrupted seed entries while keeping the user's real links.
const sanitizeLinks = (links: EscrowLink[]): EscrowLink[] =>
  links.filter(
    lnk =>
      lnk.description !== 'Verified secure items' &&
      /^\+?[0-9\s-]+$/.test(lnk.buyerPhone || '')
  );

// Remove any links the user has permanently deleted (local or server-side)
// so they never re-appear after a re-sync.
const applyDeletedFilter = (links: EscrowLink[], deleted: Set<string>): EscrowLink[] =>
  sanitizeLinks(links).filter(l => !deleted.has(l.id));

export function useEscrowLinks(sellerId: string | null) {
  const [escrowLinks, setEscrowLinks] = useState<EscrowLink[]>(() => {
    const deleted = readDeletedIds();
    try {
      const saved = localStorage.getItem('trustlink_escrow_links');
      if (saved) {
        const parsed = JSON.parse(saved) as EscrowLink[];
        if (Array.isArray(parsed)) {
          return applyDeletedFilter(parsed, deleted);
        }
      }
    } catch (e) {}
    return [];
  });

  const [selectedLink, setSelectedLink] = useState<EscrowLink | null>(null);

  // Persist the current list to localStorage, always stripping deleted IDs.
  const persistLinks = useCallback((links: EscrowLink[]) => {
    const deleted = readDeletedIds();
    const next = applyDeletedFilter(links, deleted);
    setEscrowLinks(next);
    localStorage.setItem('trustlink_escrow_links', JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('trustlink_escrow_links_changed'));
  }, []);

  useEffect(() => {
    if (!sellerId) return;

    const loadData = async () => {
      try {
        const transactions = await getSellerTransactions(sellerId);
        if (transactions.length > 0) {
          persistLinks(transactions);
        }
      } catch (e) {
        // Offline or error: keep existing localStorage data
      }
    };

    loadData();
  }, [sellerId, persistLinks]);

  useEffect(() => {
    if (!sellerId) return;

    const channelName = `seller-transactions-${sellerId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trova_transactions',
          filter: `seller_id=eq.${sellerId}`
        },
        (payload) => {
          const updated = payload.new as any;
          setEscrowLinks(prev => {
            const deleted = readDeletedIds();
            if (deleted.has(updated.id)) return prev;
            const idx = prev.findIndex(l => l.id === updated.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = { ...next[idx], status: updated.status, updatedAt: updated.updated_at };
              localStorage.setItem('trustlink_escrow_links', JSON.stringify(next));
              window.dispatchEvent(new CustomEvent('trustlink_escrow_links_changed'));
              return next;
            }
            return prev;
          });
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Realtime channel error for seller transactions');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sellerId]);

  // Live updates are driven by the realtime subscription above. As a cheap
  // safety net for a missed realtime event, re-sync when the tab becomes
  // visible/focused, plus an infrequent 5-minute heartbeat (instead of a
  // constant 30s poll that doesn't scale).
  useEffect(() => {
    if (!sellerId) return;

    const reconcile = async () => {
      try {
        const transactions = await getSellerTransactions(sellerId);
        if (transactions.length > 0) {
          persistLinks(transactions);
        }
      } catch (e) {
        // Offline or error: keep existing localStorage data
      }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') reconcile();
    };

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', reconcile);
    const heartbeat = setInterval(reconcile, 5 * 60 * 1000);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', reconcile);
      clearInterval(heartbeat);
    };
  }, [sellerId, persistLinks]);

  const updateEscrowLinks = (newLinks: EscrowLink[] | ((prev: EscrowLink[]) => EscrowLink[])) => {
    const resolved = typeof newLinks === 'function' ? newLinks(escrowLinks) : newLinks;
    persistLinks(resolved);
  };

  // Permanently remove a link. Deletes it authoritatively on the server (so
  // re-syncs can't resurrect it) and, as a safety net for offline/demo mode,
  // records the ID in a local deleted-IDs set and removes it from the live
  // list immediately.
  const removeEscrowLink = (linkId: string) => {
    const deleted = readDeletedIds();
    deleted.add(linkId);
    writeDeletedIds(deleted);

    const next = escrowLinks.filter(l => l.id !== linkId);
    setEscrowLinks(next);
    localStorage.setItem('trustlink_escrow_links', JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('trustlink_escrow_links_changed'));
    // Notify the dashboard so its deleted-IDs filter updates immediately.
    window.dispatchEvent(new CustomEvent('trustlink_deleted_links_update'));

    // Authoritative server-side delete (best effort; ignore failure so the
    // local removal still happens when Supabase is unreachable).
    deleteTransaction(linkId).catch((err) => {
      console.warn('[useEscrowLinks] server delete failed (kept local delete):', err);
    });
  };

  const pendingDeliveries = escrowLinks.filter(l => l.status === 'delivered').length;

  return {
    escrowLinks,
    selectedLink,
    setSelectedLink,
    updateEscrowLinks,
    removeEscrowLink,
    pendingDeliveries
  };
}
