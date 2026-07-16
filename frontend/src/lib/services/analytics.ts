import { supabase } from '../supabaseClient';
import { RatingRecord } from '../../types';

export interface StorefrontView {
  id: string;
  storefrontId: string;
  viewerSessionId: string;
  viewedAt: string;
  referrer: string | null;
  userAgent: string | null;
  ipAddress: string | null;
}

export interface StorefrontViewsStats {
  totalViews: number;
  uniqueViews: number;
  viewsToday: number;
  viewsThisWeek: number;
}

export interface SellerViewsStats extends StorefrontViewsStats {
  sellerId: string;
}

export async function incrementStorefrontView(params: {
  storefrontId: string;
  sessionId: string;
  referrer?: string;
  userAgent?: string;
}): Promise<{ success: boolean; message: string; viewCount: number }> {
  const { data, error } = await supabase.rpc('increment_storefront_views', {
    p_storefront_id: params.storefrontId,
    p_session_id: params.sessionId,
    p_referrer: params.referrer || null,
    p_user_agent: params.userAgent || null,
    p_ip_address: null,
  });

  if (error) {
    console.error('Failed to increment storefront view:', error);
    return { success: false, message: error.message, viewCount: 0 };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return { success: false, message: 'No response from view tracker', viewCount: 0 };
  }

  return {
    success: row.success ?? false,
    message: row.message ?? 'Unknown',
    viewCount: Number(row.view_count) || 0,
  };
}

export async function getSellerViewsStats(sellerId: string, daysBack = 30): Promise<SellerViewsStats> {
  const { data, error } = await supabase.rpc('get_seller_storefront_views', {
    p_seller_id: sellerId,
    p_days_back: daysBack,
  });

  if (error) {
    console.error('Failed to load seller views stats:', error);
    return {
      sellerId,
      totalViews: 0,
      uniqueViews: 0,
      viewsToday: 0,
      viewsThisWeek: 0,
    };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return {
      sellerId,
      totalViews: 0,
      uniqueViews: 0,
      viewsToday: 0,
      viewsThisWeek: 0,
    };
  }

  return {
    sellerId,
    totalViews: Number(row.total_views) || 0,
    uniqueViews: Number(row.unique_views) || 0,
    viewsToday: Number(row.views_today) || 0,
    viewsThisWeek: Number(row.views_period) || 0,
  };
}

export async function getStorefrontViewsBreakdown(storefrontId: string, daysBack = 30): Promise<StorefrontView[]> {
  const { data, error } = await supabase
    .from('storefront_views')
    .select('*')
    .eq('storefront_id', storefrontId)
    .gte('viewed_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
    .order('viewed_at', { ascending: false });

  if (error) {
    console.error('Failed to load storefront views breakdown:', error);
    return [];
  }

  return (data || []).map((v: any) => ({
    id: v.id,
    storefrontId: v.storefront_id,
    viewerSessionId: v.viewer_session_id,
    viewedAt: v.viewed_at,
    referrer: v.referrer,
    userAgent: v.user_agent,
    ipAddress: v.ip_address,
  }));
}

export async function getRatingsFromSupabase(sellerId: string): Promise<RatingRecord[]> {
  const { data, error } = await supabase
    .from('trova_ratings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load ratings from Supabase:', error);
    return [];
  }

  const sellerStorefronts = await supabase
    .from('trova_storefronts')
    .select('id')
    .eq('seller_id', sellerId);

  const storefrontIds = (sellerStorefronts.data || []).map((s: any) => s.id);

  if (storefrontIds.length === 0) {
    return [];
  }

  const matched = (data || []).filter((r: any) => {
    const tx = r.transaction_id;
    return storefrontIds.some((sfId: string) => tx && tx.includes(sfId));
  });

  return matched.map((r: any) => ({
    id: r.id,
    transactionId: r.transaction_id,
    sellerId: r.seller_id || '',
    score: Number(r.score) || 0,
    comment: r.comment || null,
    createdAt: r.created_at,
    reviewerProfileId: r.rater_profile_id || undefined,
  }));
}

export async function deleteRatingFromSupabase(ratingId: string): Promise<boolean> {
  const { error } = await supabase
    .from('trova_ratings')
    .delete()
    .eq('id', ratingId);

  if (error) {
    console.error('Failed to delete rating:', error);
    return false;
  }

  return true;
}
