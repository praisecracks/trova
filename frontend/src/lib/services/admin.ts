import { supabase } from '../supabaseClient';
import { createNotification } from './notifications';
import { RatingRecord } from '../../types';

export interface AdminProfile {
  id: string;
  email: string;
  role: 'admin' | 'seller' | 'buyer';
  displayName: string | null;
  phone: string | null;
  metadata: Record<string, unknown> | null;
  kycStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSeller {
  id: string;
  profileId: string;
  email: string;
  displayName: string | null;
  businessName: string | null;
  kycStatus: string | null;
  status: 'active' | 'suspended' | 'frozen';
  createdAt: string;
  metadata: Record<string, unknown> | null;
  totalEscrows?: number;
  totalVolume?: number;
}

export interface AdminTransaction {
  id: string;
  sellerId: string | null;
  buyerId: string | null;
  buyerEmail: string | null;
  productName: string | null;
  amount: number;
  shippingFee: number;
  currencyCode: string;
  currencySymbol: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  sellerName?: string;
  buyerPhone?: string | null;
  sellerPhone?: string | null;
}

export interface AdminDispute {
  id: string;
  transactionId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  transaction?: AdminTransaction;
}

export interface AdminPayout {
  id: string;
  sellerId: string;
  amount: number;
  currencyCode: string;
  currencySymbol: string;
  status: string;
  createdAt: string;
  processedAt: string | null;
}

export interface AdminKycApplication {
  id: string;
  sellerId: string;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  reviewComments: string | null;
  kycData?: Record<string, unknown> | null;
  seller?: AdminSeller;
  // Direct KYC fields from trova_kyc_applications
  fullName?: string;
  phone?: string;
  idType?: string;
  idNumber?: string;
  dateOfBirth?: string;
  businessName?: string;
  country?: string;
  stateRegion?: string;
  city?: string;
  streetAddress?: string;
  uploadedIdFileName?: string;
}

export async function getAllRatings(): Promise<RatingRecord[]> {
  const { data, error } = await supabase
    .from('trova_ratings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get ratings:', error.message);
    return [];
  }

  return (data || []).map(r => ({
    id: r.id,
    transactionId: r.transaction_id,
    sellerId: r.seller_id || '',
    score: Number(r.score) || 0,
    comment: r.comment || null,
    createdAt: r.created_at,
    reviewerProfileId: r.reviewer_profile_id || undefined,
  }));
}

export async function deleteRating(ratingId: string): Promise<boolean> {
  const { error } = await supabase
    .from('trova_ratings')
    .delete()
    .eq('id', ratingId);

  if (error) {
    console.error('Failed to delete rating:', error.message);
    return false;
  }

  return true;
}

export interface AdminAuditLog {
  id: string;
  actorProfileId: string | null;
  action: string;
  category: string | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actorName?: string;
}

export interface AdminSystemSetting {
  key: string;
  value: Record<string, unknown>;
}

export interface AdminDisputeMessage {
  id: string;
  disputeId: string;
  senderProfileId: string | null;
  senderRole: 'buyer' | 'seller' | 'admin';
  message: string;
  createdAt: string;
  senderName?: string;
}

// --- PROFILES ---
export async function getAllProfiles(): Promise<AdminProfile[]> {
  const { data, error } = await supabase
    .from('trova_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get profiles:', error.message);
    return [];
  }

  return (data || []).map(p => ({
    id: p.id,
    email: p.email,
    role: p.role,
    displayName: p.display_name,
    phone: p.phone,
    metadata: p.metadata,
    kycStatus: p.kyc_status,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }));
}

// --- SELLERS ---
export async function getAllSellers(): Promise<AdminSeller[]> {
  const { data, error } = await supabase
    .from('trova_sellers')
    .select('*, profile:trova_profiles!profile_id(id, email, display_name, kyc_status, metadata, phone)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get sellers:', error.message);
    return [];
  }

  // For each seller, calculate escrow count and total volume
  const sellers = await Promise.all(
    (data || []).map(async (s) => {
      let totalEscrows = 0;
      let totalVolume = 0;

      try {
        const { data: txData } = await supabase
          .from('trova_transactions')
          .select('amount')
          .eq('seller_id', s.id);
        
        if (txData) {
          totalEscrows = txData.length;
          totalVolume = txData.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
        }
      } catch {
        // Ignore errors for stats
      }

      return {
        id: s.id,
        profileId: s.profile_id,
        email: s.profile?.email,
        displayName: s.profile?.display_name,
        businessName: s.business_name,
        kycStatus: s.profile?.kyc_status,
        status: s.profile?.metadata?.status || 'active',
        metadata: s.profile?.metadata || null,
        createdAt: s.created_at,
        totalEscrows,
        totalVolume
      };
    })
  );

  return sellers;
}

// --- TRANSACTIONS ---
export async function getAllTransactions(): Promise<AdminTransaction[]> {
  const { data, error } = await supabase
    .from('trova_transactions')
    .select('*, seller:trova_sellers!seller_id(id, profile:trova_profiles!profile_id(display_name, phone))')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get transactions:', error.message);
    return [];
  }

  return (data || []).map(t => ({
    id: t.id,
    sellerId: t.seller_id,
    buyerId: t.buyer_id,
    buyerEmail: t.buyer_email,
    productName: t.product_name,
    amount: Number(t.amount),
    shippingFee: Number(t.shipping_fee || 0),
    currencyCode: t.currency_code,
    currencySymbol: t.currency_symbol,
    status: t.status,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    sellerName: t.seller?.profile?.display_name || 'Unknown Seller',
    buyerPhone: t.buyer_phone,
    sellerPhone: t.seller?.profile?.phone
  }));
}

export async function getSellerTransactions(sellerId: string): Promise<AdminTransaction[]> {
  const { data, error } = await supabase
    .from('trova_transactions')
    .select('*, seller:trova_sellers!seller_id(id, profile:trova_profiles!profile_id(display_name))')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get seller transactions:', error.message);
    return [];
  }

  return (data || []).map(t => ({
    id: t.id,
    sellerId: t.seller_id,
    buyerId: t.buyer_id,
    buyerEmail: t.buyer_email,
    productName: t.product_name,
    amount: Number(t.amount),
    shippingFee: Number(t.shipping_fee || 0),
    currencyCode: t.currency_code,
    currencySymbol: t.currency_symbol,
    status: t.status,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    sellerName: t.seller?.profile?.display_name || 'Unknown Seller',
  }));
}

// --- DISPUTES ---
export async function getAllDisputes(): Promise<AdminDispute[]> {
  const { data, error } = await supabase
    .from('trova_disputes')
    .select('*, transaction:trova_transactions!transaction_id(*)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get disputes:', error.message);
    return [];
  }

  return (data || []).map(d => ({
    id: d.id,
    transactionId: d.transaction_id,
    status: d.status,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
    transaction: d.transaction ? {
      id: d.transaction.id,
      productName: d.transaction.product_name,
      amount: Number(d.transaction.amount),
      currencySymbol: d.transaction.currency_symbol,
    } as any : undefined,
  }));
}

// --- PAYOUTS ---
export async function getAllPayouts(): Promise<AdminPayout[]> {
  const { data, error } = await supabase
    .from('trova_payouts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get payouts:', error.message);
    return [];
  }

  return (data || []).map(p => ({
    id: p.id,
    sellerId: p.seller_id,
    amount: Number(p.amount),
    currencyCode: p.currency_code,
    currencySymbol: p.currency_symbol,
    status: p.status,
    createdAt: p.created_at,
    processedAt: p.processed_at,
  }));
}

// --- KYC APPLICATIONS ---
export async function getAllKycApplications(): Promise<AdminKycApplication[]> {
  // First get all KYC applications with their seller info
  const { data: appsData, error } = await supabase
    .from('trova_kyc_applications')
    .select(`
      *,
      seller:trova_sellers(
        id,
        profile_id,
        business_name
      )
    `)
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Failed to get KYC applications:', error.message);
    return [];
  }

  // Get profile emails for display - we need profile_id from sellers
  const profileIds = (appsData || []).map(a => a.seller?.profile_id).filter(Boolean);
  let profileEmails: Record<string, { email: string; display_name: string }> = {};
  
  if (profileIds.length > 0) {
    const { data: profilesData } = await supabase
      .from('trova_profiles')
      .select('id, email, display_name, phone')
      .in('id', profileIds);
    
    if (profilesData) {
      profileEmails = profilesData.reduce((acc, p) => {
        acc[p.id] = { email: p.email, display_name: p.display_name };
        return acc;
      }, {} as Record<string, { email: string; display_name: string }>);
    }
  }

  return (appsData || []).map(a => {
    const sellerId = a.seller_id;
    const profileId = a.seller?.profile_id;
    const kycData = a.kyc_data || {};
    
    return {
      id: a.id,
      sellerId: sellerId,
      status: a.status,
      submittedAt: a.submitted_at,
      reviewedAt: a.reviewed_at,
      reviewComments: a.review_comments,
      kycData: a.kyc_data,
      // Extract KYC fields from kyc_data JSON
      fullName: kycData.fullName || kycData.full_name || a.full_name || 'N/A',
      phone: kycData.phone || 'N/A',
      idType: kycData.idType || kycData.id_type || 'N/A',
      idNumber: kycData.idNumber || kycData.id_number || 'N/A',
      dateOfBirth: kycData.dateOfBirth || kycData.date_of_birth || 'N/A',
      businessName: kycData.businessName || kycData.business_name || 'N/A',
      country: kycData.country || 'N/A',
      stateRegion: kycData.stateRegion || kycData.state_region || 'N/A',
      city: kycData.city || 'N/A',
      streetAddress: kycData.streetAddress || kycData.street_address || 'N/A',
      uploadedIdFileName: kycData.uploadedIdFileName || kycData.uploaded_id_file_name || 'N/A',
      seller: {
        id: sellerId,
        profileId: profileId,
        displayName: profileEmails[profileId]?.display_name || kycData.fullName || 'Unknown Merchant',
        email: profileEmails[profileId]?.email || 'N/A',
      } as any,
    };
  });
}

// --- AUDIT LOGS ---
export async function getAllAuditLogs(): Promise<AdminAuditLog[]> {
  const { data, error } = await supabase
    .from('trova_audit_logs')
    .select('*, actor:trova_profiles!actor_profile_id(display_name)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get audit logs:', error.message);
    return [];
  }

  return (data || []).map(l => ({
    id: l.id,
    actorProfileId: l.actor_profile_id,
    action: l.action,
    category: l.category,
    targetId: l.target_id,
    metadata: l.metadata,
    createdAt: l.created_at,
    actorName: l.actor?.display_name || 'Unknown',
  }));
}

// --- SYSTEM SETTINGS ---
export async function getSystemSettings(): Promise<AdminSystemSetting[]> {
  const { data, error } = await supabase
    .from('trova_system_settings')
    .select('*');

  if (error) {
    console.error('Failed to get system settings:', error.message);
    return [];
  }

  return (data || []).map(s => ({
    key: s.key,
    value: s.value,
  }));
}

export async function updateSystemSetting(key: string, value: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('trova_system_settings')
      .upsert({ key, value });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}



// --- DISPUTE MESSAGES ---
export async function getDisputeMessages(disputeId: string): Promise<AdminDisputeMessage[]> {
  const { data, error } = await supabase
    .from('trova_dispute_messages')
    .select('*, sender:trova_profiles!sender_profile_id(display_name)')
    .eq('dispute_id', disputeId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to get dispute messages:', error.message);
    return [];
  }

  return (data || []).map(m => ({
    id: m.id,
    disputeId: m.dispute_id,
    senderProfileId: m.sender_profile_id,
    senderRole: m.sender_role,
    message: m.message,
    createdAt: m.created_at,
    senderName: m.sender?.display_name || 'Unknown',
  }));
}

export async function sendDisputeMessage(
  disputeId: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('trova_dispute_messages')
      .insert({
        dispute_id: disputeId,
        message,
        sender_role: 'admin'
      });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

export async function updateDisputeStatus(
  disputeId: string,
  status: string,
  transactionStatus?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await supabase
      .from('trova_disputes')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', disputeId);

    if (transactionStatus) {
      const { data: dispute } = await supabase
        .from('trova_disputes')
        .select('transaction_id')
        .eq('id', disputeId)
        .single();

      if (dispute) {
        await supabase
          .from('trova_transactions')
          .update({
            status: transactionStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', dispute.transaction_id);
      }
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// --- UPDATE USER ROLE ---
export async function updateUserRole(
  userId: string,
  newRole: 'admin' | 'seller' | 'buyer'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('trova_profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Also update audit log
    await insertAuditLog(
      `Updated user ${userId} role to ${newRole}`,
      'user',
      userId,
      { newRole }
    );

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// --- UPDATE USER KYC STATUS ---
export async function updateUserKycStatus(
  userId: string,
  newStatus: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // First get user email for localStorage sync
    const { data: userProfile } = await supabase
      .from('trova_profiles')
      .select('email')
      .eq('id', userId)
      .single();

    const { error } = await supabase
      .from('trova_profiles')
      .update({ kyc_status: newStatus })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Sync to localStorage for seller's active session
    if (typeof window !== 'undefined') {
      try {
        // Update trustlink_sellers list - need to find seller by profile_id
        const { data: seller } = await supabase
          .from('trova_sellers')
          .select('id')
          .eq('profile_id', userId)
          .single();

        if (seller) {
          const sellersSaved = localStorage.getItem('trustlink_sellers');
          if (sellersSaved) {
            const sellers = JSON.parse(sellersSaved);
            const sellerIdx = sellers.findIndex((s: any) => s.id === seller.id);
            if (sellerIdx >= 0) {
              sellers[sellerIdx].kycStatus = newStatus;
              sellers[sellerIdx].kyc_status = newStatus;
              localStorage.setItem('trustlink_sellers', JSON.stringify(sellers));
            }
          }
          
          // Update trustlink-profile if this is the active seller
          const currentSellerId = localStorage.getItem('trustlink_current_seller');
          const sellerWithProfile = { ...seller, profile_id: userId };
          if (currentSellerId === seller.id || (userProfile && localStorage.getItem('trustlink-profile'))) {
            const profileSaved = localStorage.getItem('trustlink-profile');
            if (profileSaved) {
              const parsed = JSON.parse(profileSaved);
              if (parsed.id === userId || (userProfile && parsed.email?.toLowerCase() === userProfile.email?.toLowerCase())) {
                parsed.kycStatus = newStatus;
                parsed.kyc_status = newStatus;
                localStorage.setItem('trustlink-profile', JSON.stringify(parsed));
              }
            }
          }
        }
        
        // Dispatch sync events
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('trustlink_sellers_changed'));
        window.dispatchEvent(new CustomEvent('trustlink_kyc_status_updated', { detail: { profileId: userId, status: newStatus } }));
      } catch (e) {
        console.warn('Could not sync KYC status update to localStorage:', e);
      }
    }

    await insertAuditLog(
      `Updated user ${userId} KYC status to ${newStatus}`,
      'user',
      userId,
      { newStatus }
    );

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// --- UPDATE MERCHANT STATUS ---
export async function updateMerchantStatus(
  sellerId: string,
  newStatus: 'active' | 'suspended' | 'frozen'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the seller to find profile_id and existing metadata
    const { data: seller, error: sellerError } = await supabase
      .from('trova_sellers')
      .select('profile_id, profile:trova_profiles!profile_id(metadata)')
      .eq('id', sellerId)
      .single();

    if (sellerError || !seller) {
      throw new Error('Seller not found');
    }

    // Merge with existing metadata
    const existingMetadata = (seller as any).profile?.metadata || {};
    const { error } = await supabase
      .from('trova_profiles')
      .update({
        metadata: {
          ...existingMetadata,
          status: newStatus,
          updated_at: new Date().toISOString()
        }
      })
      .eq('id', (seller as any).profile_id);

    if (error) {
      throw error;
    }

    // Log the action
    const { data: user } = await supabase.auth.getUser();
    if (user.user) {
      await insertAuditLog(
        `Account ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
        'account',
        sellerId,
        { status: newStatus }
      );
    }

    // Sync to localStorage
    try {
      const sellersSaved = localStorage.getItem('trustlink_sellers');
      if (sellersSaved) {
        const sellers = JSON.parse(sellersSaved);
        const idx = sellers.findIndex((s: any) => s.id === sellerId);
        if (idx >= 0) {
          sellers[idx].status = newStatus;
          if (sellers[idx].profile && sellers[idx].profile.metadata) {
            sellers[idx].profile.metadata.status = newStatus;
          }
          localStorage.setItem('trustlink_sellers', JSON.stringify(sellers));
        }
      }
      window.dispatchEvent(new CustomEvent('trustlink_sellers_changed'));
    } catch (e) {}

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// --- UPDATE TRANSACTION STATUS ---
export async function updateTransactionStatus(
  transactionId: string,
  newStatus: string,
  actorRole: 'buyer' | 'seller' | 'admin' = 'admin'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .rpc('secure_update_transaction_status', {
        p_transaction_id: transactionId,
        p_new_status: newStatus,
        p_actor_role: actorRole
      });

    if (error) {
      throw error;
    }

    const result = data as { success: boolean; error?: string };
    if (!result.success) {
      throw new Error(result.error || 'Failed to update status');
    }

    // Log the action
    const { data: user } = await supabase.auth.getUser();
    if (user.user) {
      await insertAuditLog(
        `Transaction Status Updated — ${newStatus}`,
        'transaction',
        transactionId,
        { status: newStatus }
      );
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// --- RESOLVE DISPUTE ---
export async function resolveDispute(
  disputeId: string,
  fundTo: 'seller' | 'buyer',
  status: string = 'resolved'
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateDisputeStatus(disputeId, status, fundTo === 'seller' ? 'funds_released' : 'refunded');

    // Log the action
    const { data: user } = await supabase.auth.getUser();
    if (user.user) {
      await insertAuditLog(
        `Dispute Resolved — Funds to ${fundTo.charAt(0).toUpperCase() + fundTo.slice(1)}`,
        'dispute',
        disputeId,
        { fundTo }
      );
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// --- AUDIT LOG INSERT ---
export async function insertAuditLog(
  action: string,
  category: string,
  targetId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('trova_audit_logs')
      .insert({
        action,
        category,
        target_id: targetId,
        metadata,
        actor_profile_id: user?.id
      });
  } catch (err) {
    console.error('Error inserting audit log:', err);
  }
}

// --- UPDATE KYC APPLICATION WITH AUDIT ---
export async function updateKycApplication(
  applicationId: string,
  status: string,
  reviewComments?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: application, error: appError } = await supabase
      .from('trova_kyc_applications')
      .select('seller_id')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return { success: false, error: 'Application not found' };
    }

    await supabase
      .from('trova_kyc_applications')
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        review_comments: reviewComments,
      })
      .eq('id', applicationId);

    const { data: seller } = await supabase.from('trova_sellers').select('profile_id').eq('id', application.seller_id).single();
    
    // Also get the profile to access email for localStorage sync
    let sellerEmail: string | null = null;
    let profileId: string | null = null;
    if (seller) {
      profileId = seller.profile_id;
      const { data: profile } = await supabase.from('trova_profiles').select('id, email').eq('id', seller.profile_id).single();
      if (profile) {
        sellerEmail = profile.email;
      }
    }
    
    if (seller) {
      // Update profiles table for KYC status (trova_sellers doesn't have kyc_status column)
      const kycUpdate = {
        kyc_status: status === 'verified' ? 'verified' : status === 'rejected' ? 'rejected' : 'pending',
        kyc_approved_at: status === 'verified' ? new Date().toISOString() : undefined,
        kyc_rejection_reason: status === 'rejected' ? reviewComments : undefined,
      };
       await supabase
         .from('trova_profiles')
         .update(kycUpdate)
         .eq('id', seller.profile_id);
     }

     if (profileId) {
       if (status === 'verified') {
         await createNotification(profileId, 'Your identity verification has been approved. You now have unlimited transaction limits.');
       } else if (status === 'rejected') {
         await createNotification(profileId, `Your identity verification was not approved. Reason: ${reviewComments || 'Please review and resubmit your documents.'}`);
       }
     }

     // Sync to localStorage for seller's active session and dispatch events
    if (typeof window !== 'undefined') {
      // Update trustlink_sellers list
      try {
        const sellersSaved = localStorage.getItem('trustlink_sellers');
        if (sellersSaved) {
          const sellers = JSON.parse(sellersSaved);
          const sellerIdx = sellers.findIndex((s: any) => s.id === application.seller_id);
          if (sellerIdx >= 0) {
            sellers[sellerIdx].kycStatus = status;
            sellers[sellerIdx].kyc_status = status;
            if (status === 'verified') {
              sellers[sellerIdx].kyc_approved_at = new Date().toISOString();
              delete sellers[sellerIdx].kyc_rejection_reason;
            } else if (status === 'rejected' && reviewComments) {
              sellers[sellerIdx].kyc_rejection_reason = reviewComments;
              delete sellers[sellerIdx].kyc_approved_at;
            }
            localStorage.setItem('trustlink_sellers', JSON.stringify(sellers));
          }
        }
        
        // Update trustlink-profile if this is the active seller
        const currentSellerId = localStorage.getItem('trustlink_current_seller');
        if (currentSellerId === application.seller_id) {
          const profileSaved = localStorage.getItem('trustlink-profile');
          if (profileSaved) {
            const parsed = JSON.parse(profileSaved);
            parsed.kycStatus = status;
            parsed.kyc_status = status;
            if (status === 'verified') {
              parsed.kyc_approved_at = new Date().toISOString();
              delete parsed.kyc_rejection_reason;
            } else if (status === 'rejected' && reviewComments) {
              parsed.kyc_rejection_reason = reviewComments;
              delete parsed.kyc_approved_at;
            }
            localStorage.setItem('trustlink-profile', JSON.stringify(parsed));
          }
        }
        
        // Also update by email if current session matches
        if (sellerEmail) {
          const profileSaved = localStorage.getItem('trustlink-profile');
          if (profileSaved) {
            const parsed = JSON.parse(profileSaved);
            if (parsed.email?.toLowerCase() === sellerEmail.toLowerCase()) {
              parsed.kycStatus = status;
              parsed.kyc_status = status;
              if (status === 'verified') {
                parsed.kyc_approved_at = new Date().toISOString();
                delete parsed.kyc_rejection_reason;
              } else if (status === 'rejected' && reviewComments) {
                parsed.kyc_rejection_reason = reviewComments;
                delete parsed.kyc_approved_at;
              }
              localStorage.setItem('trustlink-profile', JSON.stringify(parsed));
            }
          }
        }
        
        // Dispatch sync events
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('trustlink_sellers_changed'));
        window.dispatchEvent(new CustomEvent('trustlink_kyc_status_updated', { detail: { sellerId: application.seller_id, status } }));
      } catch (e) {
        console.warn('Could not sync KYC update to localStorage:', e);
      }
    }

    // Log the action
    const { data: user } = await supabase.auth.getUser();
    if (user.user) {
      const actionText = status === 'verified' ? 'KYC Approved' : status === 'rejected' ? `KYC Rejected${reviewComments ? ` — ${reviewComments}` : ''}` : 'KYC Updated';
      await insertAuditLog(
        actionText,
        'kyc',
        applicationId,
        { status, reviewComments, sellerId: application.seller_id }
      );
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// --- STOREFRONT VIEWS ---
export interface StorefrontViewsStats {
  total_views: bigint;
  unique_views: bigint;
  views_today: bigint;
  views_this_week: bigint;
}

export async function getStorefrontViewsStats(): Promise<StorefrontViewsStats | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_storefront_views_stats', {
        p_days_back: 7
      });

    if (error) {
      console.error('Failed to get storefront views stats:', error.message);
      return null;
    }

    return data ? data[0] : null;
  } catch (err) {
    console.error('Error fetching storefront views:', err);
    return null;
  }
}

export async function trackStorefrontView(
  storefrontId: string,
  sessionId: string,
  referrer?: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .rpc('increment_storefront_views', {
        p_storefront_id: storefrontId,
        p_session_id: sessionId,
        p_referrer: referrer || null,
        p_user_agent: userAgent || null,
        p_ip_address: ipAddress || null
      });

    if (error) {
      console.error('Failed to track storefront view:', error.message);
      return { success: false, error: error.message };
    }

    return { success: data?.[0]?.success || false, message: data?.[0]?.message };
  } catch (err) {
    console.error('Error tracking storefront view:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}

export async function getSellerStorefrontViews(
  sellerId: string,
  daysBack: number = 30
): Promise<{
  seller_id: string;
  total_views: bigint;
  unique_views: bigint;
  views_today: bigint;
  views_period: bigint;
} | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_seller_storefront_views', {
        p_seller_id: sellerId,
        p_days_back: daysBack
      });

    if (error) {
      console.error('Failed to get seller storefront views:', error.message);
      return null;
    }

    return data ? data[0] : null;
  } catch (err) {
    console.error('Error fetching seller storefront views:', err);
    return null;
  }
}

// --- BUYER REGISTRY ---
export interface AdminBuyer {
  id: string;
  profileId: string | null;
  email: string | null;
  displayName: string | null;
  phone: string | null;
  buyerPhone: string | null;
  buyerEmail: string | null;
  buyerName: string | null;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getAllBuyers(): Promise<AdminBuyer[]> {
  try {
    const { data: transactions, error: txError } = await supabase
      .from('trova_transactions')
      .select('id, buyer_id, buyer_email, buyer_phone, buyer_name, amount, created_at, updated_at, seller_id')
      .not('buyer_phone', 'is', null)
      .order('created_at', { ascending: false });

    if (txError) {
      console.error('Failed to get buyer transactions:', txError.message);
      return [];
    }

    const txRows = transactions || [];

    // Group transactions by normalized phone
    const buyerMap = new Map<string, {
      phone: string;
      emails: Set<string>;
      names: Set<string>;
      profileIds: Set<string>;
      totalOrders: number;
      totalSpent: number;
      lastOrderAt: string;
      createdAt: string;
      updatedAt: string;
    }>();

    for (const tx of txRows) {
      const rawPhone = tx.buyer_phone || '';
      const normalized = rawPhone.replace(/\D/g, '');
      if (!normalized) continue;

      const key = normalized;
      const existing = buyerMap.get(key);

      const amount = Number(tx.amount || 0);
      const createdAt = tx.created_at || new Date().toISOString();
      const updatedAt = tx.updated_at || createdAt;

      if (existing) {
        existing.emails.add(tx.buyer_email || '');
        existing.names.add(tx.buyer_name || '');
        if (tx.buyer_id) existing.profileIds.add(tx.buyer_id);
        existing.totalOrders += 1;
        existing.totalSpent += amount;
        if (new Date(updatedAt) > new Date(existing.updatedAt)) {
          existing.updatedAt = updatedAt;
        }
        if (new Date(createdAt) < new Date(existing.createdAt)) {
          existing.createdAt = createdAt;
        }
        if (!existing.lastOrderAt || new Date(createdAt) > new Date(existing.lastOrderAt)) {
          existing.lastOrderAt = createdAt;
        }
      } else {
        buyerMap.set(key, {
          phone: rawPhone,
          emails: new Set(tx.buyer_email ? [tx.buyer_email] : []),
          names: new Set(tx.buyer_name ? [tx.buyer_name] : []),
          profileIds: tx.buyer_id ? new Set([tx.buyer_id]) : new Set(),
          totalOrders: 1,
          totalSpent: amount,
          lastOrderAt: createdAt,
          createdAt,
          updatedAt,
        });
      }
    }

    // Try to enrich with profile data
    const allProfileIds = Array.from(buyerMap.values()).flatMap(b => Array.from(b.profileIds));
    let profilesMap = new Map<string, any>();
    if (allProfileIds.length > 0) {
      const { data: profiles } = await supabase
        .from('trova_profiles')
        .select('id, email, display_name, phone, metadata, kyc_status, created_at, updated_at')
        .in('id', allProfileIds);

      if (profiles) {
        for (const p of profiles) {
          profilesMap.set(p.id, p);
        }
      }
    }

    return Array.from(buyerMap.values()).map((b) => {
      const profileId = Array.from(b.profileIds)[0] || null;
      const profile = profileId ? profilesMap.get(profileId) : null;

      const email = profile?.email || Array.from(b.emails)[0] || null;
      const displayName = profile?.display_name || Array.from(b.names)[0] || null;
      const phone = profile?.phone || null;
      const buyerEmail = Array.from(b.emails).find(e => e) || null;
      const buyerName = Array.from(b.names).find(n => n) || null;

      return {
        id: profileId || b.phone,
        profileId,
        email,
        displayName,
        phone,
        buyerPhone: b.phone,
        buyerEmail,
        buyerName,
        totalOrders: b.totalOrders,
        totalSpent: b.totalSpent,
        lastOrderAt: b.lastOrderAt,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      };
    }).sort((a, b) => new Date(b.lastOrderAt || b.createdAt).getTime() - new Date(a.lastOrderAt || a.createdAt).getTime());
  } catch (err) {
    console.error('Error fetching buyer registry:', err);
    return [];
  }
}

export async function getBuyerTransactions(buyerPhone: string): Promise<AdminTransaction[]> {
  const normalized = buyerPhone.replace(/\D/g, '');
  if (!normalized) return [];

  try {
    const { data, error } = await supabase
      .from('trova_transactions')
      .select('*, seller:trova_sellers!seller_id(id, profile:trova_profiles!profile_id(display_name, phone))')
      .or(`buyer_phone.cs.${normalized}`);

    if (error) {
      console.error('Failed to get buyer transactions:', error.message);
      return [];
    }

    return (data || []).map(t => ({
      id: t.id,
      sellerId: t.seller_id,
      buyerId: t.buyer_id,
      buyerEmail: t.buyer_email,
      productName: t.product_name,
      amount: Number(t.amount),
      shippingFee: Number(t.shipping_fee || 0),
      currencyCode: t.currency_code,
      currencySymbol: t.currency_symbol,
      status: t.status,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      sellerName: t.seller?.profile?.display_name || 'Unknown Seller',
      buyerPhone: t.buyer_phone,
      sellerPhone: t.seller?.profile?.phone,
    }));
  } catch (err) {
    console.error('Error fetching buyer transactions:', err);
    return [];
  }
}
