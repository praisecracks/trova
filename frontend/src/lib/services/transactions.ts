import { supabase } from '../supabaseClient';
import { EscrowLink, EscrowStatus } from '../../types';
import { normalizeStatus } from './status';

export interface Transaction extends Omit<EscrowLink, 'claimedByBuyer' | 'payoutId' | 'activeReferrals' | 'vendorPhoto' | 'created_at' | 'updated_at' | 'expires_at'> {
  sellerId: string;
  buyerId: string | null;
  currencyCode: string;
  currencySymbol: string;
  transactionType: 'physical' | 'service';
  status: EscrowStatus;
  expiresAt: string | null;
  paymentReference: string | null;
  paymentMethod: string | null;
  paymentGateway: string | null;
  paymentStatus: string | null;
  buyerPhone: string | null;
  buyerEmail: string | null;
  buyerName: string | null;
  vendorName: string | null;
  escrowHoldReference: string | null;
}

// Load all transactions for the current seller from Supabase
export async function getSellerTransactions(
  sellerId: string
): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('trova_transactions')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load transactions:', error.message);
    return [];
  }

  return (data || []).map(mapTransaction);
}

// Create a new escrow transaction in Supabase using RPC
export async function createTransaction(
  sellerId: string,
  details: {
    productName: string;
    description?: string;
    amount: number;
    shippingFee?: number;
    currencyCode: string;
    currencySymbol: string;
    transactionType: 'physical' | 'service';
    buyerPhone?: string;
    vendorName?: string;
  }
): Promise<{ transaction: Transaction | null; error: string | null }> {
  const { data, error } = await supabase
    .rpc('trova_create_transaction', {
      payload: {
        productName: details.productName,
        description: details.description,
        amount: details.amount,
        shippingFee: details.shippingFee,
        currencyCode: details.currencyCode,
        currencySymbol: details.currencySymbol,
        transactionType: details.transactionType,
        buyerPhone: details.buyerPhone,
        vendorName: details.vendorName,
        seller_id: sellerId,
      }
    });

  if (error) {
    return { transaction: null, error: error.message };
  }

  return { transaction: mapTransaction(data.transaction), error: null };
}

// Load a single transaction by ID (public — no auth required) using RPC
export async function getPublicTransaction(
  transactionId: string
): Promise<any | null> {
  const { data, error } = await supabase
    .rpc('trova_get_public_transaction', {
      p_transaction_id: transactionId
    });

  if (error) {
    console.error('[getPublicTransaction] RPC error:', error);
    return null;
  }
  if (!data) {
    console.warn('[getPublicTransaction] No data returned for:', transactionId);
    return null;
  }
  return data;
}

// Update transaction status via secure RPC
export async function updateTransactionStatus(
  transactionId: string,
  newStatus: string,
  actorRole: 'buyer' | 'seller' | 'admin' = 'buyer',
  actorId?: string | null,
  buyerToken?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .rpc('secure_update_transaction_status', {
        p_transaction_id: transactionId,
        p_new_status: newStatus,
        p_actor_role: actorRole,
        p_actor_id: actorId || null,
        p_buyer_token: buyerToken || null
      });

    if (error) {
      return { success: false, error: error.message };
    }

    const result = data as { success: boolean; error?: string };
    if (!result.success) {
      return { success: false, error: result.error || 'Failed to update status' };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// Permanently delete a transaction from the server (seller-only / admin).
// This is the authoritative delete so later re-syncs cannot resurrect it.
export async function deleteTransaction(
  transactionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('trova_delete_transaction', {
      p_transaction_id: transactionId,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const result = data as { success: boolean; error?: string };
    if (!result.success) {
      return { success: false, error: result.error || 'Failed to delete transaction' };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// Map Supabase snake_case row to camelCase Transaction interface
function mapTransaction(row: Record<string, unknown>): Transaction {
  const status = normalizeStatus(row.status as string);
  const currencyCode = (row.currency_code as string) || 'USD';
  const currencySymbol = (row.currency_symbol as string) || '$';
  
  return {
    id: row.id as string,
    sellerId: row.seller_id as string,
    buyerId: row.buyer_id as string | null,
    productName: row.product_name as string,
    description: row.description as string | null,
    amount: Number(row.amount),
    shippingFee: Number(row.shipping_fee || 0),
    currencyCode: currencyCode as string,
    currencySymbol: currencySymbol as string,
    transactionType: (row.transaction_type as 'physical' | 'service') || 'physical',
    status: status,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    expiresAt: row.expires_at as string | null,
    paymentReference: row.payment_reference as string | null,
    paymentMethod: row.payment_method as string | null,
    paymentGateway: row.payment_gateway as string | null,
    paymentStatus: row.payment_status as string | null,
    buyerPhone: row.buyer_phone as string | null,
    buyerEmail: row.buyer_email as string | null,
    buyerName: row.buyer_name as string | null,
    vendorName: row.vendor_name as string | null,
    escrowHoldReference: row.escrow_hold_reference as string | null,
  };
}

export interface TransactionAccessInfo {
  status: string;
  hasBuyerPhone: boolean;
  buyerPhoneLast4: string | null;
  productName: string;
  currencySymbol: string;
  vendorName: string;
}

export interface BuyerVerificationResult {
  match: boolean;
  reason: string;
  buyerToken?: string;
}

// Verify buyer access by phone match
export async function verifyBuyerAccess(
  transactionId: string,
  phone: string
): Promise<BuyerVerificationResult> {
  const { data, error } = await supabase
    .rpc('trova_verify_buyer_access', {
      p_transaction_id: transactionId,
      p_phone: phone
    });

  if (error) {
    console.error('[verifyBuyerAccess] RPC error:', error);
    return { match: false, reason: 'verification_failed' };
  }
  return data as BuyerVerificationResult;
}

// Minimal public access info (no sensitive details exposed)
export async function getTransactionAccessInfo(
  transactionId: string
): Promise<TransactionAccessInfo | null> {
  const { data, error } = await supabase
    .rpc('trova_get_transaction_access_info', {
      p_transaction_id: transactionId
    });

  if (error) {
    console.error('[getTransactionAccessInfo] RPC error:', error);
    return null;
  }
  if (!data || data.status === 'not_found') return null;
  return data as TransactionAccessInfo;
}
