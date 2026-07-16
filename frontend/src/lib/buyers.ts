import supabase from './supabaseClient';

export interface BuyerProfile {
  id: string;
  profileId: string;
  displayName?: string | null;
  email?: string | null;
  phone?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface BuyerTransactionContact {
  displayName?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface ClaimBuyerTransactionResult {
  transaction: {
    id: string;
    buyerId?: string | null;
    buyerName?: string | null;
    buyerEmail?: string | null;
    buyerPhone?: string | null;
    claimedByBuyer?: boolean;
  };
  buyer?: BuyerTransactionContact | null;
}

export async function claimBuyerTransaction(
  transactionId: string,
  email: string,
  phone: string,
  fullName?: string
): Promise<ClaimBuyerTransactionResult> {
  const { data, error } = await supabase.rpc('trova_claim_buyer_transaction', {
    p_transaction_id: transactionId,
    p_email: email,
    p_phone: phone,
    p_full_name: fullName || null
  });

  if (error) {
    throw error;
  }

  return data as ClaimBuyerTransactionResult;
}

export async function getCurrentBuyerProfile(): Promise<{ profile: any; buyer: BuyerProfile } | null> {
  const { data, error } = await supabase.rpc('trova_get_or_create_buyer_profile');

  if (error) {
    throw error;
  }

  return data as { profile: any; buyer: BuyerProfile } | null;
}

export async function getBuyerTransactions() {
  const { data, error } = await supabase.rpc('trova_get_buyer_transactions');

  if (error) {
    throw error;
  }

  return (data || []) as any[];
}
