import { type User } from '@supabase/supabase-js';
import supabase from './supabaseClient';
import type { BuyerProfile } from './buyers';
import { getCurrentSellerProfile, type SellerProfile } from './services/seller';
import { createReferral } from './services/referrals';

export interface SupabaseAuthError extends Error {
  code?: string;
  status?: number;
}

export function getAuthErrorMessage(error: unknown, fallback = 'Authentication failed') {
  const authError = error as SupabaseAuthError | null;

  if (authError?.code === 'email_not_confirmed') {
    return 'Email address is not confirmed yet. Check your inbox or spam folder for the Trova confirmation link.';
  }

  if (authError?.code === 'invalid_credentials') {
    return 'Invalid email or password. Check the credentials and try again.';
  }

  if (authError?.code === 'user_not_found') {
    return 'No account exists with this email address.';
  }

  return authError?.message || fallback;
}

export async function resendSignupConfirmation(email: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });

  if (error) {
    throw error;
  }
}

export interface TrovaProfile {
  id: string;
  email: string;
  role: 'buyer' | 'seller' | 'admin';
  display_name: string | null;
  phone: string | null;
  metadata: Record<string, unknown> | null;
  kyc_status: string | null;
}

export async function signUpSeller(email: string, password: string, fullName: string, businessName?: string, referrerHandle?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        business_name: businessName ?? fullName,
        role: 'seller',
      },
    },
  });

  if (error) {
    throw error;
  }

  if (data.user && referrerHandle) {
    try {
      const { data: referrerSeller } = await supabase
        .from('trova_sellers')
        .select('id, profile_id')
        .eq('handle', referrerHandle)
        .maybeSingle();

      if (referrerSeller) {
        await supabase.from('trova_referrals').insert({
          referrer_seller_id: referrerSeller.id,
          referrer_profile_id: referrerSeller.profile_id,
          referred_seller_id: data.user.id,
          referred_profile_id: data.user.id,
          status: 'Active',
        });
      }
    } catch (err) {
      console.error('Failed to create referral:', err);
    }
  }

  return data;
}

export async function signUpBuyer(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: 'buyer',
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signInUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data.user;
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
  // Clear all user-specific localStorage items (keep theme)
  const keysToClear = [
    'trustlink-profile',
    'trustlink_escrow_links',
    'trustlink_payouts',
    'trustlink_transactions',
    'trustlink_disputes',
    'trustlink_sellers',
    'trustlink_buyers',
    'trustlink_notifications',
    'trustlink_notifications_update',
    'trustlink_kyc_submissions',
    'trustlink_kyc_status',
    'trustlink_kyc_rejection_reason',
    'trustlink_frozen_merchants',
    'trustlink_audit_logs',
    'trustlink_global_settings'
  ];
  keysToClear.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Ignore errors
    }
  });
  // Also clear any keys that start with TL- or trustlink_
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith('TL-') || key?.startsWith('trustlink_')) {
        if (key !== 'trustlink_theme') {
          localStorage.removeItem(key);
        }
      }
    }
  } catch (e) {
    // Ignore errors
  }
}

export async function getCurrentProfile(): Promise<TrovaProfile | null> {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return null;
  }

  const uid = userData.user.id;
  const { data: profile, error } = await supabase
    .from('trova_profiles')
    .select('*')
    .eq('id', uid)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return profile;
}

export async function getOrCreateSellerProfile(user: User | null): Promise<{ success: boolean; profile?: SellerProfile; error?: string }> {
  if (!user?.id || !user.email) {
    return { success: false, error: 'Invalid user' };
  }

  try {
    // First check if profile already exists
    let profile = await getCurrentSellerProfile(user.id, user.email);
    if (profile) {
      return { success: true, profile };
    }

    const displayName = user.user_metadata?.full_name || user.email.split('@')[0] || 'Trova Seller';
    const businessName = user.user_metadata?.business_name || displayName;

    // First check if trova_profiles exists separately
    const { data: existingProfile } = await supabase
      .from('trova_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!existingProfile) {
      // Create trova_profiles record with on conflict do nothing
      const { error: profileError } = await supabase
        .from('trova_profiles')
        .insert(
          {
            id: user.id,
            email: user.email,
            role: 'seller',
            display_name: displayName,
            metadata: user.user_metadata ?? {},
            kyc_status: 'unverified',
          }
        );

      // Only return error if it's NOT a 409 conflict
      if (profileError && profileError.code !== '23505') {
        return { success: false, error: profileError.message };
      }
    }

    // Now check if trova_sellers exists
    const { data: existingSeller } = await supabase
      .from('trova_sellers')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!existingSeller) {
      // Create trova_sellers record with on conflict do nothing
      const { error: sellerError } = await supabase
        .from('trova_sellers')
        .insert(
          {
            id: user.id,
            profile_id: user.id,
            business_name: businessName,
          }
        );

      // Only return error if it's NOT a 409 conflict
      if (sellerError && sellerError.code !== '23505') {
        return { success: false, error: sellerError.message };
      }
    }

    // Get the full seller profile
    profile = await getCurrentSellerProfile(user.id, user.email);
    if (profile) {
      return { success: true, profile };
    } else {
      return { success: false, error: 'Failed to load profile' };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}

export async function getOrCreateBuyerProfile(user: User | null) {
  if (!user?.id || !user.email) {
    return null;
  }

  const { data, error } = await supabase.rpc('trova_get_or_create_buyer_profile');

  if (error) {
    throw error;
  }

  return data as { profile: TrovaProfile; buyer: BuyerProfile } | null;
}

