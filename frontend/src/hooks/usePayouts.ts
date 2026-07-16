import { useState, useEffect } from 'react';
import { Payout } from '../types';

export function usePayouts() {
  const [payouts, setPayouts] = useState<Payout[]>(() => {
    try {
      const saved = localStorage.getItem('trustlink_payouts');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    localStorage.setItem('trustlink_payouts', JSON.stringify([]));
    return [];
  });

  const updatePayouts = (newPayouts: Payout[] | ((prev: Payout[]) => Payout[])) => {
    const resolved = typeof newPayouts === 'function' ? newPayouts(payouts) : newPayouts;
    setPayouts(resolved);
    localStorage.setItem('trustlink_payouts', JSON.stringify(resolved));
    window.dispatchEvent(new CustomEvent('trustlink_payouts_changed'));
  };

  useEffect(() => {
    const handleSyncData = () => {
      try {
        const savedPayouts = localStorage.getItem('trustlink_payouts');
        if (savedPayouts) {
          setPayouts(JSON.parse(savedPayouts));
        }
      } catch (e) {}
    };

    window.addEventListener('storage', handleSyncData);
    window.addEventListener('trustlink_payouts_changed', handleSyncData);

    return () => {
      window.removeEventListener('storage', handleSyncData);
      window.removeEventListener('trustlink_payouts_changed', handleSyncData);
    };
  }, []);

  return { payouts, setPayouts, updatePayouts };
}
