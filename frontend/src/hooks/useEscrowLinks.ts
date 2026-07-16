import { useState, useEffect } from 'react';
import { EscrowLink } from '../types';
import { getSellerTransactions } from '../lib/services/transactions';
import { supabase } from '../lib/supabaseClient';

export function useEscrowLinks(sellerId: string | null) {
  const [escrowLinks, setEscrowLinks] = useState<EscrowLink[]>(() => {
    try {
      const saved = localStorage.getItem('trustlink_escrow_links');
      if (saved) {
        const parsed = JSON.parse(saved) as EscrowLink[];
        if (Array.isArray(parsed)) {
          // Keep valid links. An empty description is valid (most real
          // transactions have none) — only drop clearly-corrupted entries so we
          // never wipe the user's real escrow links.
          const clean = parsed.filter(lnk =>
            lnk.description !== 'Verified secure items' &&
            /^\+?[0-9\s-]+$/.test(lnk.buyerPhone || '')
          );
          return clean;
        }
      }
    } catch (e) {}
    return [];
  });

  const [selectedLink, setSelectedLink] = useState<EscrowLink | null>(null);

  useEffect(() => {
    if (!sellerId) return;

    const loadData = async () => {
      try {
        const transactions = await getSellerTransactions(sellerId);
        if (transactions.length > 0) {
          setEscrowLinks(transactions);
          localStorage.setItem('trustlink_escrow_links', JSON.stringify(transactions));
        }
      } catch (e) {
        // Offline or error: keep existing localStorage data
      }
    };

    loadData();
  }, [sellerId]);

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
          setEscrowLinks(transactions);
          localStorage.setItem('trustlink_escrow_links', JSON.stringify(transactions));
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
  }, [sellerId]);

  const updateEscrowLinks = (newLinks: EscrowLink[] | ((prev: EscrowLink[]) => EscrowLink[])) => {
    const resolved = typeof newLinks === 'function' ? newLinks(escrowLinks) : newLinks;
    setEscrowLinks(resolved);
    localStorage.setItem('trustlink_escrow_links', JSON.stringify(resolved));
    window.dispatchEvent(new CustomEvent('trustlink_escrow_links_changed'));
  };

  const pendingDeliveries = escrowLinks.filter(l => l.status === 'delivered').length;

  return {
    escrowLinks,
    selectedLink,
    setSelectedLink,
    updateEscrowLinks,
    pendingDeliveries
  };
}
