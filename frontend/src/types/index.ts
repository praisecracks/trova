/**
 * types/index.ts
 * Shared TypeScript types, interfaces, and enums for the entire application.
 * Centralizes schemas to keep imports clean across the project.
 */

export type ActiveTab = 
  | 'dashboard' 
  | 'storefront' 
  | 'payouts' 
  | 'settings' 
  | 'help'
  | 'escrow-links'
  | 'onboarding-hub'
  | 'admin-panel'
  | 'analytics'
  | 'disputes'
  | 'notifications'
  | 'referrals'
  | 'console'
  | 'admin'
  | 'deleted-history';

export type EscrowStatus = 'pending_deposit' | 'deposited' | 'shipped' | 'delivered' | 'funds_released' | 'disputed' | 'expired';

export interface EscrowLink {
  id: string;
  productName: string;
  amount: number;
  shippingFee: number;
  buyerPhone: string;
  buyerEmail?: string | null;
  buyerName?: string | null;
  claimedByBuyer?: boolean;
  status: EscrowStatus;
  createdAt: string;
  vendorName?: string;
  description?: string;
  payoutId?: string;
  transactionType?: 'physical' | 'service';
  currencyCode?: string;
  currencySymbol?: string;
  expires_at?: string;
  expiresAt?: string;
  created_at?: string;
  updated_at?: string;
  updatedAt?: string;
  activeReferrals?: number;
  vendorPhoto?: string;
  sellerId?: string | null;
  sellerProfileId?: string | null;
  ratingAverage?: number;
  ratingCount?: number;
  sellerKycStatus?: string;
  deletedAt?: string;
}

export interface RatingRecord {
  id: string;
  transactionId: string;
  sellerId: string;
  score: number;
  comment?: string | null;
  createdAt: string;
  productName?: string;
  reviewText?: string;
  reviewerProfileId?: string | null;
  reviewerName?: string;
}

export interface Payout {
  id: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  status: 'processing' | 'completed' | 'failed';
  date: string;
  currencyCode?: string;
  currencySymbol?: string;
}

export interface ChatMessage {
  id: string;
  transactionId: string;
  textPayload: string;
  authorRole: 'buyer' | 'merchant' | 'support';
  loggingTime: string;
}

export interface UserProfile {
  name: string;
  email: string;
  onboarded: boolean;
  businessName?: string;
}
