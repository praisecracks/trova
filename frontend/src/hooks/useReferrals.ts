import { useState, useEffect } from 'react';
import { getReferralsForSeller } from '../lib/services/referrals';

export function useReferrals(sellerId: string | null) {
  const [referralsData, setReferralsData] = useState<any[]>([]);

  useEffect(() => {
    if (!sellerId) return;

    const loadReferrals = async () => {
      const referrals = await getReferralsForSeller(sellerId);
      setReferralsData(referrals);
    };

    loadReferrals();
  }, [sellerId]);

  return { referralsData, setReferralsData };
}
