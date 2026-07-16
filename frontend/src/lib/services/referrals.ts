import supabase from '../supabaseClient';

export interface Referral {
  id?: string;
  referrerSellerId: string;
  refereeEmail: string;
  storeName?: string;
  signUpDate?: string;
  status: 'Pending' | 'Active' | 'Cancelled';
  createdAt?: string;
}

const mapReferral = (row: any): Referral => {
  return {
    id: row.id,
    referrerSellerId: row.referrer_seller_id,
    refereeEmail: row.referee_email,
    storeName: row.store_name,
    signUpDate: row.sign_up_date,
    status: row.status,
    createdAt: row.created_at
  };
};

export async function getReferralsForSeller(sellerId: string): Promise<Referral[]> {
  const { data, error } = await supabase
    .from('trova_referrals')
    .select('*')
    .eq('referrer_seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }
  return (data || []).map(mapReferral);
}

export async function createReferral(referral: Omit<Referral, 'id' | 'createdAt'>): Promise<Referral | null> {
  const { data, error } = await supabase
    .from('trova_referrals')
    .insert({
      referrer_seller_id: referral.referrerSellerId,
      referee_email: referral.refereeEmail,
      store_name: referral.storeName,
      sign_up_date: referral.signUpDate,
      status: referral.status,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    return null;
  }
  return mapReferral(data);
}

export async function updateReferralStatus(referralId: string, status: Referral['status']): Promise<boolean> {
  const { error } = await supabase
    .from('trova_referrals')
    .update({ status })
    .eq('id', referralId);

  return !error;
}

export async function deleteReferral(referralId: string): Promise<boolean> {
  const { error } = await supabase
    .from('trova_referrals')
    .delete()
    .eq('id', referralId);

  return !error;
}
