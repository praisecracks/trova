import { supabase } from '../supabaseClient';

export interface SellerProfile {
  id: string;
  profileId: string;
  email: string;
  displayName: string;
  businessName: string | null;
  phone: string | null;
  bio: string | null;
  avatarUrl: string | null;
  instagramHandle: string | null;
  whatsapp: string | null;
  twitterHandle: string | null;
  website: string | null;
  sticker: string | null;
  contactPhone: string | null;
  selectedBank: string | null;
  accountNumber: string | null;
  resolvedAccountName: string | null;
  customBankName: string | null;
  customBankCountry: string | null;
  customBankCurrency: string | null;
  kycStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  kycRejectionReason: string | null;
  kycSubmittedAt: string | null;
  kycApprovedAt: string | null;
  status: 'active' | 'suspended' | 'frozen';
  createdAt: string;
}

export async function getCurrentSellerProfile(
  sessionUserId?: string,
  sessionUserEmail?: string
): Promise<SellerProfile | null> {
  let userId = sessionUserId;

  // Only get session if userId not provided (backward compatible)
  if (!userId) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return null;
    }
    userId = session.user.id;
    sessionUserEmail = session.user.email;
  }

  // First query trova_sellers
  const { data: sellerData, error: sellerError } = await supabase
    .from('trova_sellers')
    .select('id, profile_id, business_name, business_website, payout_details, created_at')
    .eq('profile_id', userId)
    .maybeSingle();

  if (sellerError || !sellerData) {
    return null;
  }

  // Now query trova_profiles.
  // The base + metadata columns exist at every migration level, so select them
  // first and never 400. Flat account-bank columns (migration 027) are fetched
  // in a separate guarded call so a partially-migrated database (where those
  // columns are absent) does not throw a 400 that bubbles up as a console error.
  const { data: baseProfile, error: baseError } = await supabase
    .from('trova_profiles')
    .select('id, email, display_name, phone, kyc_status, kyc_rejection_reason, kyc_submitted_at, kyc_approved_at, metadata')
    .eq('id', userId)
    .maybeSingle();

  if (baseError || !baseProfile) {
    return null;
  }

  // Optional flat bank columns. Silently ignored if migration 027 hasn't been applied.
  let flatBank: any = null;
  try {
    const { data: fb, error: fbError } = await supabase
      .from('trova_profiles')
      .select('bank_name, account_number, account_name, account_type, currency')
      .eq('id', userId)
      .maybeSingle();
    if (!fbError && fb) flatBank = fb;
  } catch (e) {
    // Columns may not exist yet — fall back to metadata below.
  }

  const profileData: any = { ...baseProfile, ...(flatBank || {}) };

  const hasFlatBank = typeof profileData.bank_name !== 'undefined';
  const result = {
    id: sellerData.id,
    profileId: sellerData.profile_id,
    email: profileData.email || sessionUserEmail || '',
    displayName: profileData.display_name || '',
    businessName: sellerData.business_name || null,
    phone: profileData.phone || null,
    bio: profileData.metadata?.bio || null,
    avatarUrl: profileData.metadata?.avatar_url || null,
    instagramHandle: profileData.metadata?.instagram_handle || null,
    whatsapp: profileData.metadata?.whatsapp || null,
    twitterHandle: profileData.metadata?.twitter_handle || null,
    website: sellerData.business_website || null,
    sticker: profileData.metadata?.sticker || null,
    contactPhone: profileData.metadata?.contact_phone || null,
    selectedBank: hasFlatBank ? (profileData.bank_name || profileData.metadata?.selected_bank || null) : (profileData.metadata?.selected_bank || null),
    accountNumber: hasFlatBank ? (profileData.account_number || profileData.metadata?.account_number || null) : (profileData.metadata?.account_number || null),
    resolvedAccountName: hasFlatBank ? (profileData.account_name || profileData.metadata?.resolved_account_name || null) : (profileData.metadata?.resolved_account_name || null),
    customBankName: profileData.metadata?.custom_bank_name || null,
    customBankCountry: profileData.metadata?.custom_bank_country || null,
    customBankCurrency: profileData.metadata?.custom_bank_currency || null,
    kycStatus: profileData.kyc_status || 'unverified',
    kycRejectionReason: profileData.kyc_rejection_reason || null,
    kycSubmittedAt: profileData.kyc_submitted_at || null,
    kycApprovedAt: profileData.kyc_approved_at || null,
    status: profileData.metadata?.status || 'active',
    createdAt: sellerData.created_at,
  };

  return result;
}

export async function updateSellerProfile(
  sellerId: string,
  profileId: string,
  updates: {
    displayName?: string;
    businessName?: string;
    phone?: string;
    bio?: string;
    avatarUrl?: string;
    instagramHandle?: string;
    whatsapp?: string;
    twitterHandle?: string;
    website?: string;
    sticker?: string;
    contactPhone?: string;
    selectedBank?: string;
    accountNumber?: string;
    resolvedAccountName?: string;
    customBankName?: string;
    customBankCountry?: string;
    customBankCurrency?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const profileUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.displayName !== undefined) profileUpdates.display_name = updates.displayName;
    if (updates.phone !== undefined) profileUpdates.phone = updates.phone;

    const { data: existingProfile } = await supabase
      .from('trova_profiles')
      .select('metadata')
      .eq('id', profileId)
      .single();

    const existingMeta = existingProfile?.metadata || {};
    const newMeta = {
      ...existingMeta,
      ...(updates.bio !== undefined && { bio: updates.bio }),
      ...(updates.avatarUrl !== undefined && { avatar_url: updates.avatarUrl }),
      ...(updates.instagramHandle !== undefined && { instagram_handle: updates.instagramHandle }),
      ...(updates.whatsapp !== undefined && { whatsapp: updates.whatsapp }),
      ...(updates.twitterHandle !== undefined && { twitter_handle: updates.twitterHandle }),
      ...(updates.sticker !== undefined && { sticker: updates.sticker }),
      ...(updates.contactPhone !== undefined && { contact_phone: updates.contactPhone }),
    };

    if (updates.selectedBank !== undefined) profileUpdates.bank_name = updates.selectedBank;
    if (updates.accountNumber !== undefined) profileUpdates.account_number = updates.accountNumber;
    if (updates.resolvedAccountName !== undefined) profileUpdates.account_name = updates.resolvedAccountName;
    profileUpdates.metadata = {
      ...newMeta,
      ...(updates.customBankName !== undefined && { custom_bank_name: updates.customBankName }),
      ...(updates.customBankCountry !== undefined && { custom_bank_country: updates.customBankCountry }),
      ...(updates.customBankCurrency !== undefined && { custom_bank_currency: updates.customBankCurrency }),
    };

    const { error: profileError } = await supabase
      .from('trova_profiles')
      .update(profileUpdates)
      .eq('id', profileId);

    if (profileError) return { success: false, error: profileError.message };

    if (updates.businessName !== undefined || updates.website !== undefined) {
      const sellerUpdates: Record<string, any> = {};
      if (updates.businessName !== undefined) sellerUpdates.business_name = updates.businessName;
      if (updates.website !== undefined) sellerUpdates.business_website = updates.website;

      const { error: sellerError } = await supabase
        .from('trova_sellers')
        .update(sellerUpdates)
        .eq('id', sellerId);

      if (sellerError) return { success: false, error: sellerError.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error updating profile',
    };
  }
}

export async function getCurrentSellerId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data } = await supabase
    .from('trova_sellers')
    .select('id')
    .eq('profile_id', session.user.id)
    .single();

  return data?.id || null;
}

export async function getPublicSellerProfileByHandle(handle: string): Promise<SellerProfile | null> {
  const { data, error } = await supabase
    .rpc('get_public_seller_profile_by_handle', { p_handle: handle });

  if (error || !data || data.length === 0) {
    return null;
  }

  const row = data[0];
  return {
    id: row.id,
    profileId: row.profile_id,
    email: row.email || '',
    displayName: row.display_name || '',
    businessName: row.business_name || null,
    phone: row.phone || null,
    bio: row.bio || null,
    avatarUrl: row.avatar_url || null,
    instagramHandle: row.instagram_handle || null,
    whatsapp: row.whatsapp || null,
    twitterHandle: row.twitter_handle || null,
    website: row.website || null,
    sticker: row.sticker || null,
    contactPhone: row.contact_phone || null,
    selectedBank: row.selected_bank || null,
    accountNumber: row.account_number || null,
    resolvedAccountName: row.resolved_account_name || null,
    customBankName: row.custom_bank_name || null,
    customBankCountry: row.custom_bank_country || null,
    customBankCurrency: row.custom_bank_currency || null,
    kycStatus: row.kyc_status || 'unverified',
    kycRejectionReason: row.kyc_rejection_reason || null,
    kycSubmittedAt: row.kyc_submitted_at || null,
    kycApprovedAt: row.kyc_approved_at || null,
    status: row.status || 'active',
    createdAt: row.created_at,
  };
}