import supabase from './supabaseClient';
import type {
  CreateEscrowTransactionInput,
  CreatedEscrowTransaction,
  PublicEscrowTransaction
} from './transactions.validation';
import {
  normalizeCreateEscrowTransactionInput
} from './transactions.validation';

export { mapCreatedTransactionToEscrowLink } from './transactions.validation';

export async function createEscrowTransaction(input: CreateEscrowTransactionInput) {
  const payload = normalizeCreateEscrowTransactionInput(input);
  const { data, error } = await supabase.rpc('trova_create_transaction', {
    payload: {
      ...payload,
      seller_id: payload.sellerId,
      vendorName: payload.vendorName,
    }
  });

  if (error) {
    throw error;
  }

  return data as {
    transaction: CreatedEscrowTransaction;
    paymentUrl: string;
    trackingUrl: string;
  };
}

export async function getPublicEscrowTransaction(transactionId: string) {
  const { data, error } = await supabase.rpc('trova_get_public_transaction', {
    p_transaction_id: transactionId
  });

  if (error) {
    throw error;
  }

  return data as PublicEscrowTransaction;
}
