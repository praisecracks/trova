import { EscrowLink } from '../types';

/**
 * IMPROVEMENT 1 — ESCROW LINK EXPIRATION SYSTEM helper
 * Runs when any escrow-related page loads.
 * Reads the transaction from localStorage, checks the current timestamp against expires_at 
 * if status is awaiting deposit, and automatically updates the status to expired if the time has passed.
 */
export function checkLinkExpiry(transactionId: string): EscrowLink | null {
  if (!transactionId) return null;

  // 1. Fetch direct from localStorage
  let transaction: EscrowLink | null = null;
  const directSaved = localStorage.getItem(transactionId);
  if (directSaved) {
    try {
      const parsed = JSON.parse(directSaved);
      if (parsed && typeof parsed === 'object' && parsed.productName) {
        transaction = parsed;
      }
    } catch (e) {}
  }

  if (!transaction) {
    const directSavedUpper = localStorage.getItem(transactionId.toUpperCase());
    if (directSavedUpper) {
      try {
        const parsed = JSON.parse(directSavedUpper);
        if (parsed && typeof parsed === 'object' && parsed.productName) {
          transaction = parsed;
        }
      } catch (e) {}
    }
  }

  // 2. Fetch from the escrow links array
  const savedList = localStorage.getItem('trustlink_escrow_links');
  let list: EscrowLink[] = [];
  if (savedList) {
    try {
      list = JSON.parse(savedList) as EscrowLink[];
    } catch (e) {}
  }

  if (!transaction && list.length > 0) {
    const found = list.find(
      l => l.id.toLowerCase() === transactionId.toLowerCase() || l.id === transactionId
    );
    if (found) {
      transaction = found;
    }
  }

  if (!transaction) return null;

  // Check if status is awaiting deposit
  const isAwaitingDeposit = transaction.status === 'pending_deposit';

  if (isAwaitingDeposit) {
    let expiresAt = transaction.expires_at || (transaction as any).expiresAt;
    if (!expiresAt) {
      // Fallback: use createdAt or current time + 72h
      const createdStr = transaction.createdAt || (transaction as any).created_at || new Date().toISOString();
      expiresAt = new Date(new Date(createdStr).getTime() + 72 * 60 * 60 * 1000).toISOString();
      transaction.expires_at = expiresAt;
      (transaction as any).expiresAt = expiresAt;
    }
    if (expiresAt) {
      const expiryTime = new Date(expiresAt).getTime();
      const now = Date.now();
      if (now > expiryTime) {
        // Automatically updates the status to expired
        transaction.status = 'expired' as any;
        
        // Save back direct
        localStorage.setItem(transaction.id, JSON.stringify(transaction));
        localStorage.setItem(transaction.id.toUpperCase(), JSON.stringify(transaction));

        // Save back in the standard list
        const updatedList = list.map(item => {
          if (item.id.toLowerCase() === transaction.id.toLowerCase() || item.id === transaction.id) {
            return { 
              ...item, 
              status: 'expired' as any,
              expires_at: expiresAt,
              created_at: item.created_at || (item as any).createdAt
            };
          }
          return item;
        });
        localStorage.setItem('trustlink_escrow_links', JSON.stringify(updatedList));

        // Let the parent App custom listeners know something changed
        window.dispatchEvent(new CustomEvent('trustlink_escrow_links_changed'));
      }
    }
  }

  return transaction;
}