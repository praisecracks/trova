/**
 * data/localStorage.ts
 * Real-time localStorage-driven state utility engine for Trova.
 * Connects all screens and subcomponents dynamically to a mock persistent state.
 */

import { EscrowLink, Payout, ChatMessage, RatingRecord } from '../types';

export interface SellerProfile {
  id: string;
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
  joinDate: string;
  totalTransactions: number;
  totalVolume: number;
  kycStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  kyc_status?: 'unverified' | 'pending' | 'verified' | 'rejected';
  kyc_rejection_reason?: string;
  kyc_submitted_at?: string;
  submittedAt?: string;
  kyc_approved_at?: string;
  kycTier?: number;
  idNumber?: string;
  idType?: string;
  uploadedIdFileName?: string;
  cacNumber?: string;
  uploadedCacFileName?: string;
  businessName?: string;
  city?: string;
  country?: string;
  state?: string;
  streetAddress?: string;
  dateOfBirth?: string;
  uploadedFileUrl?: string;
  uploadedCacFileUrl?: string;
  bvnNumber?: string;
  ninNumber?: string;
  status: 'active' | 'suspended';
}

export interface BuyerProfile {
  id: string;
  phoneOrEmail: string; // phone or email matching table column demands
  totalOrders: number;
  disputeCount: number;
  lastActive: string;
  status: 'active' | 'flagged';
}

export interface DisputeRecord {
  id: string;
  transactionId: string;
  productName: string;
  amount: number;
  sellerId: string;
  sellerName: string;
  buyerPhone: string;
  reason: string;
  status: 'active' | 'resolved_refunded' | 'resolved_released' | 'resolved';
  createdAt: string;
  resolutionText?: string;
}

export interface AuditLogRecord {
  id: string;
  timestamp: string;
  username: string;
  category: 'release' | 'refund' | 'dispute' | 'merchant' | 'broadcast' | 'kyc_approve' | 'kyc_reject';
  action: string;
  targetId: string;
}

export interface NotificationRecord {
  id: string;
  message: string;
  textPayload?: string;
  read: boolean;
  date: string;
  loggingTime?: string;
}

// Helper to safely parse JSON from localStorage
function readKey<T>(key: string, defaultValue: T): T {
  const data = localStorage.getItem(key);
  if (!data) return defaultValue;
  try {
    return JSON.parse(data) as T;
  } catch (e) {
    return defaultValue;
  }
}

// Helper to write JSON to localStorage
function writeKey<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ==========================================
 * GETTERS AND SETTERS FOR LOCALSTORAGE ENGINE
 * ========================================== */

export function getTransactions(): EscrowLink[] {
  const trans = readKey<EscrowLink[]>('trustlink_transactions', []);
  if (trans && trans.length > 0) return trans;
  return readKey<EscrowLink[]>('trustlink_escrow_links', []);
}

export function saveTransaction(tx: EscrowLink): void {
  const txs = getTransactions();
  const index = txs.findIndex(t => t.id === tx.id);
  if (index >= 0) {
    txs[index] = tx;
  } else {
    txs.push(tx);
  }
  writeKey('trustlink_transactions', txs);
  writeKey('trustlink_escrow_links', txs);
  window.dispatchEvent(new CustomEvent('trustlink_escrow_links_changed'));
}

export function updateTransactionStatus(id: string, status: EscrowLink['status']): void {
  const txs = getTransactions();
  const index = txs.findIndex(t => t.id === id);
  if (index >= 0) {
    txs[index].status = status;
    writeKey('trustlink_transactions', txs);
    writeKey('trustlink_escrow_links', txs);
    window.dispatchEvent(new CustomEvent('trustlink_escrow_links_changed'));
  }
}

export function getSellersAll(): SellerProfile[] {
  return readKey<SellerProfile[]>('trustlink_sellers', []);
}

export function getSellerById(id: string): SellerProfile | undefined {
  return getSellersAll().find(s => s.id === id);
}

export function saveSeller(seller: SellerProfile): void {
  const sellers = getSellersAll();
  const idx = sellers.findIndex(s => s.id === seller.id);
  if (idx >= 0) {
    sellers[idx] = seller;
  } else {
    sellers.push(seller);
  }
  writeKey('trustlink_sellers', sellers);
}

export function getCurrentSellerId(): string {
  const current = localStorage.getItem('trustlink_current_seller');
  if (current) return current;

  const profileSaved = localStorage.getItem('trustlink-profile');
  if (profileSaved) {
    try {
      const parsed = JSON.parse(profileSaved);
      if (parsed.id) return parsed.id;
      const email = parsed.email;
      if (email) {
        const sellers = getSellersAll();
        const seller = sellers.find(s => s.email.toLowerCase() === email.toLowerCase());
        if (seller) {
          localStorage.setItem('trustlink_current_seller', seller.id);
          return seller.id;
        }
      }
    } catch (e) {}
  }
  return "seller-1";
}

export function getSellerKycStatus(sellerId: string): 'unverified' | 'pending' | 'verified' | 'rejected' {
  const sellers = getSellersAll();
  const seller = sellers.find(s => s.id === sellerId);
  if (seller) {
    return seller.kyc_status || seller.kycStatus || 'unverified';
  }
  try {
    const profileSaved = localStorage.getItem('trustlink-profile');
    if (profileSaved) {
      const parsed = JSON.parse(profileSaved);
      if (parsed.id === sellerId || sellerId === getCurrentSellerId()) {
        return parsed.kyc_status || parsed.kycStatus || 'unverified';
      }
    }
  } catch (e) {}
  return 'unverified';
}

export function updateSellerKycStatus(
  sellerId: string,
  newStatus: 'unverified' | 'pending' | 'verified' | 'rejected',
  rejectionReason?: string
): void {
  const sellers = getSellersAll();
  let idx = sellers.findIndex(s => s.id === sellerId);

  if (idx < 0) {
    try {
      const profileSaved = localStorage.getItem('trustlink-profile');
      if (profileSaved) {
        const parsed = JSON.parse(profileSaved);
        const profileEmail = parsed.email?.toLowerCase();
        if (profileEmail) {
          idx = sellers.findIndex((s: any) => s.email?.toLowerCase() === profileEmail);
        }
      }
    } catch (e) {}
  }

  if (idx >= 0) {
    sellers[idx].kycStatus = newStatus;
    sellers[idx].kyc_status = newStatus;
    if (newStatus === 'pending') {
      sellers[idx].kyc_submitted_at = new Date().toISOString();
    } else if (newStatus === 'verified') {
      sellers[idx].kyc_approved_at = new Date().toISOString();
    } else if (newStatus === 'rejected') {
      sellers[idx].kyc_rejection_reason = rejectionReason || '';
    }
    writeKey('trustlink_sellers', sellers);
  }

  const effectiveSellerId = idx >= 0 ? sellers[idx].id : sellerId;

  try {
    const profileSaved = localStorage.getItem('trustlink-profile');
    if (profileSaved) {
      const parsed = JSON.parse(profileSaved);
      if (parsed.id === effectiveSellerId || getCurrentSellerId() === effectiveSellerId || parsed.email) {
        parsed.kycStatus = newStatus;
        parsed.kyc_status = newStatus;
        if (newStatus === 'pending') {
          parsed.kyc_submitted_at = new Date().toISOString();
        } else if (newStatus === 'verified') {
          parsed.kyc_approved_at = new Date().toISOString();
        } else if (newStatus === 'rejected') {
          parsed.kyc_rejection_reason = rejectionReason || '';
        } else {
          delete parsed.kyc_rejection_reason;
        }
        localStorage.setItem('trustlink-profile', JSON.stringify(parsed));
      }
    }
  } catch (e) {}

  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new CustomEvent('trustlink_sellers_changed'));
  window.dispatchEvent(new CustomEvent('trustlink_kyc_status_updated', { detail: { sellerId: effectiveSellerId, status: newStatus } }));
}

export function getBuyersAll(): BuyerProfile[] {
  return readKey<BuyerProfile[]>('trustlink_buyers', []);
}

export function saveBuyer(buyer: BuyerProfile): void {
  const buyers = getBuyersAll();
  const idx = buyers.findIndex(b => b.id === buyer.id);
  if (idx >= 0) {
    buyers[idx] = buyer;
  } else {
    buyers.push(buyer);
  }
  writeKey('trustlink_buyers', buyers);
}

export function getDisputes(): DisputeRecord[] {
  return readKey<DisputeRecord[]>('trustlink_disputes', []);
}

export function saveDispute(dispute: DisputeRecord): void {
  const disputes = getDisputes();
  const idx = disputes.findIndex(d => d.id === dispute.id);
  if (idx >= 0) {
    disputes[idx] = dispute;
  } else {
    disputes.push(dispute);
  }
  writeKey('trustlink_disputes', disputes);
}

export function getDisputeChat(transactionId: string): ChatMessage[] {
  return readKey<ChatMessage[]>(`trustlink_dispute_chat_${transactionId}`, []);
}

export function saveDisputeChat(transactionId: string, messages: ChatMessage[]): void {
  writeKey(`trustlink_dispute_chat_${transactionId}`, messages);
}

export function getPayouts(): Payout[] {
  return readKey<Payout[]>('trustlink_payouts', []);
}

export function savePayout(payout: Payout): void {
  const payouts = getPayouts();
  const idx = payouts.findIndex(p => p.id === payout.id);
  if (idx >= 0) {
    payouts[idx] = payout;
  } else {
    payouts.push(payout);
  }
  writeKey('trustlink_payouts', payouts);
}

export function getRatings(): RatingRecord[] {
  return readKey<RatingRecord[]>('trustlink_ratings', []);
}

export function saveRating(rating: RatingRecord): void {
  const ratings = getRatings();
  ratings.push(rating);
  writeKey('trustlink_ratings', ratings);
}

export function getAuditLogs(): AuditLogRecord[] {
  return readKey<AuditLogRecord[]>('trustlink_admin_audit_log', []);
}

export function addAuditLogEntry(action: string, category: AuditLogRecord['category'], targetId: string = 'N/A', username: string = 'Trova Admin'): void {
  const logs = getAuditLogs();
  const newLog: AuditLogRecord = {
    id: `log-${crypto.randomUUID()}`,
    timestamp: new Date().toISOString(),
    username,
    category,
    action,
    targetId
  };
  logs.unshift(newLog); // Prepend to show newest first!
  writeKey('trustlink_admin_audit_log', logs);
}

export function getBroadcast(): string {
  return readKey<string>('trustlink_platform_broadcast', 'System notice: Escrow settlement auto-reconciliation complete for UTC timezone.');
}

export function setBroadcast(msg: string): void {
  writeKey('trustlink_platform_broadcast', msg);
}

export function getNotifications(sellerId: string): NotificationRecord[] {
  return readKey<NotificationRecord[]>(`trustlink_notifications_${sellerId}`, []);
}

export function saveNotifications(sellerId: string, notifs: NotificationRecord[]): void {
  writeKey(`` + `trustlink_notifications_${sellerId}`, notifs);
}

export function addNotification(sellerId: string, message: string): void {
  const notifs = getNotifications(sellerId);
  const nowStr = new Date().toISOString();
  const newNotif: NotificationRecord = {
    id: `notif-${crypto.randomUUID()}`,
    message,
    textPayload: message,
    read: false,
    date: nowStr,
    loggingTime: nowStr
  };
  notifs.unshift(newNotif);
  saveNotifications(sellerId, notifs);

  // Sync to common trustlink_notifications list for unified view support
  try {
    const generalSaved = localStorage.getItem('trustlink_notifications');
    let generalNotifs: any[] = [];
    if (generalSaved) {
      generalNotifs = JSON.parse(generalSaved);
    }
    generalNotifs.unshift(newNotif);
    localStorage.setItem('trustlink_notifications', JSON.stringify(generalNotifs));
    
    // Notify all listeners
    window.dispatchEvent(new CustomEvent('trustlink_notifications_update'));
  } catch (e) {
    console.warn("Could not sync to general notifications list:", e);
  }
}

export function getBuyerSupportChat(sessionId: string): ChatMessage[] {
  return readKey<ChatMessage[]>(`trustlink_support_chat_${sessionId}`, []);
}

export function saveBuyerSupportChat(sessionId: string, chat: ChatMessage[]): void {
  writeKey(`trustlink_support_chat_${sessionId}`, chat);
}

