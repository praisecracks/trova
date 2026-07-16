import supabase from '../supabaseClient';

export interface BuyerRatingInput {
  transactionId: string;
  score: number;
  comment?: string;
}

export async function saveBuyerRating(input: BuyerRatingInput): Promise<{ success: boolean; error?: string }> {
  if (input.score < 1 || input.score > 5) {
    return { success: false, error: 'Rating must be between 1 and 5' };
  }

  const { error } = await supabase.rpc('submit_transaction_rating', {
    p_transaction_id: input.transactionId,
    p_score: input.score,
    p_comment: input.comment?.trim() || null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getSellerRatings(sellerId: string): Promise<{ average: number; count: number }> {
  const { data, error } = await supabase
    .from('trova_ratings')
    .select('score')
    .eq('seller_id', sellerId);

  if (error || !data || data.length === 0) {
    return { average: 0, count: 0 };
  }

  const sum = data.reduce((acc, row) => acc + Number(row.score), 0);
  const average = Math.round((sum / data.length) * 10) / 10;

  return { average, count: data.length };
}

export async function getSellerActiveReferrals(sellerId: string): Promise<number> {
  const { count, error } = await supabase
    .from('trova_referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_seller_id', sellerId)
    .eq('status', 'Active');

  if (error) {
    return 0;
  }

  return count || 0;
}
