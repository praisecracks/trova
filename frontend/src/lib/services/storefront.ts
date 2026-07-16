import { supabase } from '../supabaseClient';

export interface StorefrontLink {
  id: string;
  url: string;
  label: string;
}

export interface StorefrontItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  photoUrl?: string;
  imageUrl?: string;
}

export interface Storefront {
  id?: string;
  sellerId: string;
  handle?: string;
  businessName?: string;
  tagline?: string;
  profileImageUrl?: string;
  links: StorefrontLink[];
  items: StorefrontItem[];
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  accountType?: string;
  currency?: string;
  accentColor?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicStorefrontPayload {
  id: string;
  handle: string | null;
  businessName: string | null;
  tagline: string | null;
  profileImageUrl: string | null;
  links: StorefrontLink[];
  items: StorefrontItem[];
  bankName: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  currency: string;
  storeCreatedAt: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  instagramHandle: string | null;
  whatsapp: string | null;
  twitterHandle: string | null;
  website: string | null;
  sticker: string | null;
  contactPhone: string | null;
  kycStatus: string;
  status: string | null;
  activeReferrals: number;
  ratingAverage: number;
  ratingCount: number;
  sellerId: string;
  accentColor: string;
}

/**
 * Single consolidated storefront query.
 * The ONLY input is the public :handle route param. Returns the full public
 * payload (business, profile, bio, photo, bank, verified status, referral
 * tier, rating, catalog, social links) from Supabase. No dashboard state or
 * localStorage is involved.
 */
export async function getPublicStorefrontByHandle(handle: string): Promise<PublicStorefrontPayload | null> {
  const cleanHandle = handle.trim().toLowerCase();
  try {
    const { data, error } = await supabase.rpc('get_public_storefront_by_handle', { p_handle: cleanHandle });
    if (error) {
      console.error(`[storefront][public] rpc error handle=${cleanHandle}`, error);
      return null;
    }

    const rows = Array.isArray(data)
      ? data
      : data != null
        ? [data]
        : [];

    if (rows.length === 0) {
      console.warn(`[storefront][public] empty payload handle=${cleanHandle}`);
      return null;
    }

    const row = rows[0];
    const payload: PublicStorefrontPayload = {
      id: row.id ?? '',
      handle: row.handle ?? cleanHandle,
      businessName: row.business_name ?? null,
      tagline: row.tagline ?? null,
      profileImageUrl: row.profile_image_url ?? null,
      links: Array.isArray(row.links) ? row.links : [],
      items: Array.isArray(row.items) ? row.items : [],
      bankName: row.bank_name ?? '',
      accountNumber: row.account_number ?? '',
      accountName: row.account_name ?? '',
      accountType: row.account_type ?? '',
      currency: row.currency ?? 'NGN',
      storeCreatedAt: row.created_at ?? null,
      displayName: row.display_name ?? null,
      bio: row.bio ?? null,
      avatarUrl: row.avatar_url ?? null,
      instagramHandle: row.instagram_handle ?? null,
      whatsapp: row.whatsapp ?? null,
      twitterHandle: row.twitter_handle ?? null,
      website: row.website ?? null,
      sticker: row.sticker ?? null,
      contactPhone: row.contact_phone ?? null,
      kycStatus: row.kyc_status ?? 'unverified',
      status: row.status ?? null,
      activeReferrals: Number(row.active_referrals) || 0,
      ratingAverage: Number(row.rating_average) || 0,
      ratingCount: Number(row.rating_count) || 0,
      sellerId: row.seller_id ?? '',
      accentColor: row.accent_color || '#10b981',
    };

    return payload;
  } catch (e) {
    console.error(`[storefront][public] exception handle=${cleanHandle}`, e);
    return null;
  }
}

export async function getStorefrontForSeller(sellerId: string): Promise<Storefront | null> {
  try {
    const { data, error } = await supabase
      .from('trova_storefronts')
      .select('*')
      .eq('seller_id', sellerId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      if (error) {
        console.error('Supabase storefront query failed (getStorefrontForSeller):', error);
      } else {
        console.warn('No storefront found for seller_id:', sellerId, '- run migration 015_add_storefront_table.sql');
      }
      return null;
    }

    return {
      id: data.id,
      sellerId: data.seller_id,
      handle: data.handle || (data.business_name ? data.business_name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 30) : 'store'),
      businessName: data.business_name || '',
      tagline: data.tagline || '',
      profileImageUrl: data.profile_image_url || '',
      links: Array.isArray(data.links) ? data.links : [],
      items: Array.isArray(data.items) ? data.items : [],
      bankName: data.bank_name || '',
      accountNumber: data.account_number || '',
      accountName: data.account_name || '',
      accountType: data.account_type || '',
      currency: data.currency || 'USD',
      accentColor: data.accent_color || '#10b981',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (e) {
    console.error('Error fetching storefront for seller from Supabase', e);
    return null;
  }
}

export async function getStorefrontByHandle(handle: string): Promise<Storefront | null> {
  try {
    const cleanHandle = handle.trim().toLowerCase();
    let { data, error } = await supabase
      .from('trova_storefronts')
      .select('*')
      .eq('handle', cleanHandle)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      let { data: bizData, error: bizError } = await supabase
        .from('trova_storefronts')
        .select('*')
        .eq('business_name', handle.trim())
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (bizError || !bizData) {
        if (error) {
          console.error('Supabase storefront query failed (getStorefrontByHandle):', error);
        } else {
          console.warn('No storefront found for handle or business name:', handle);
        }
        return null;
      }

      data = bizData;
    }

    return {
      id: data.id,
      sellerId: data.seller_id,
      handle: data.handle,
      businessName: data.business_name || '',
      tagline: data.tagline || '',
      profileImageUrl: data.profile_image_url || '',
      links: Array.isArray(data.links) ? data.links : [],
      items: Array.isArray(data.items) ? data.items : [],
      bankName: data.bank_name || '',
      accountNumber: data.account_number || '',
      accountName: data.account_name || '',
      accountType: data.account_type || '',
      currency: data.currency || 'USD',
      accentColor: data.accent_color || '#10b981',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (e) {
    console.error('Error fetching storefront by handle from Supabase', e);
    return null;
  }
}

function mapStorefrontRow(row: any): Storefront {
  return {
    id: row.id,
    sellerId: row.seller_id,
    handle: row.handle,
    businessName: row.business_name || '',
    tagline: row.tagline || '',
    profileImageUrl: row.profile_image_url || '',
    links: Array.isArray(row.links) ? row.links : [],
    items: Array.isArray(row.items) ? row.items : [],
    bankName: row.bank_name || '',
    accountNumber: row.account_number || '',
    accountName: row.account_name || '',
    accountType: row.account_type || '',
    currency: row.currency || 'USD',
    accentColor: row.accent_color || '#10b981',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createOrUpdateStorefront(storefront: Storefront): Promise<Storefront | null> {
  try {
    const payload = {
      seller_id: storefront.sellerId,
      handle: storefront.handle,
      business_name: storefront.businessName,
      tagline: storefront.tagline,
      profile_image_url: storefront.profileImageUrl,
      links: storefront.links,
      items: storefront.items,
      bank_name: storefront.bankName,
      account_number: storefront.accountNumber,
      account_name: storefront.accountName,
      account_type: storefront.accountType,
      currency: storefront.currency,
      accent_color: storefront.accentColor,
      updated_at: new Date().toISOString(),
    };

    if (storefront.id) {
      const { data, error } = await supabase
        .from('trova_storefronts')
        .update(payload)
        .eq('id', storefront.id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update storefront in Supabase:', error);
        return null;
      }

      if (data) {
        return mapStorefrontRow(data);
      }

      console.warn('Storefront update returned no data for id:', storefront.id, '- falling back to INSERT');
    }

    if (storefront.sellerId) {
      const { data: existing } = await supabase
        .from('trova_storefronts')
        .select('id')
        .eq('seller_id', storefront.sellerId)
        .maybeSingle();

      if (existing?.id) {
        const { data, error } = await supabase
          .from('trova_storefronts')
          .update(payload)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          console.error('Failed to update storefront by seller_id in Supabase:', error);
          return null;
        }

        if (data) {
          return mapStorefrontRow(data);
        }
      }
    }

    const { data, error } = await supabase
      .from('trova_storefronts')
      .insert(payload)
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to create storefront in Supabase:', error);
      return null;
    }

    return mapStorefrontRow(data);
  } catch (e) {
    console.error('Error creating/updating storefront in Supabase:', e);
    return null;
  }
}
