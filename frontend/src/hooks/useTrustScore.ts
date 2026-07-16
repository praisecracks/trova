import { useMemo } from 'react';
import { EscrowLink } from '../types';

export interface TrustScoreResult {
  score: number;
  breakdown: {
    base: number;
    volume: number;
    rating: number;
    disputeRate: number;
    kyc: number;
    volumeBonus: number;
  };
  rating: number;
  totalReviews: number;
  disputeRate: number;
}

function computeMonthlyTrustScore(links: EscrowLink[], ratingsAvg: number, kycVerified: boolean): number {
  const completed = links.filter(l => l.status === 'funds_released').length;
  const total = links.length;
  const disputed = links.filter(l => l.status === 'disputed').length;
  const disputeRate = total > 0 ? disputed / total : 0;
  const totalEarnings = links
    .filter(l => l.status === 'funds_released')
    .reduce((sum, l) => sum + l.amount + l.shippingFee, 0);

  let score = 50;
  score += Math.min(20, completed * 2);
  score += Math.min(20, (ratingsAvg / 5) * 20);
  if (disputeRate < 0.02) score += 15;
  else if (disputeRate < 0.05) score += 10;
  else if (disputeRate < 0.10) score += 5;
  if (kycVerified) score += 15;
  if (totalEarnings > 100000) score += 10;
  else if (totalEarnings > 10000) score += 5;

  return Math.min(100, Math.max(0, score));
}

export function useTrustScore(
  escrowLinks: EscrowLink[],
  ratingsAverage: number,
  kycStatus?: string
): TrustScoreResult {
  return useMemo(() => {
    const kycVerified = kycStatus === 'verified';
    const total = escrowLinks.length;
    const disputed = escrowLinks.filter(l => l.status === 'disputed').length;
    const disputeRate = total > 0 ? disputed / total : 0;
    const completed = escrowLinks.filter(l => l.status === 'funds_released').length;
    const totalEarnings = escrowLinks
      .filter(l => l.status === 'funds_released')
      .reduce((sum, l) => sum + l.amount + l.shippingFee, 0);

    let volume = Math.min(20, completed * 2);
    let rating = Math.min(20, (ratingsAverage / 5) * 20);
    let disputeScore = 0;
    if (disputeRate < 0.02) disputeScore = 15;
    else if (disputeRate < 0.05) disputeScore = 10;
    else if (disputeRate < 0.10) disputeScore = 5;

    let kyc = kycVerified ? 15 : 0;
    let volumeBonus = 0;
    if (totalEarnings > 100000) volumeBonus = 10;
    else if (totalEarnings > 10000) volumeBonus = 5;

    const score = Math.min(100, Math.max(0, 50 + volume + rating + disputeScore + kyc + volumeBonus));

    return {
      score,
      breakdown: {
        base: 50,
        volume,
        rating,
        disputeRate: disputeScore,
        kyc,
        volumeBonus,
      },
      rating: ratingsAverage,
      totalReviews: 0,
      disputeRate,
    };
  }, [escrowLinks, ratingsAverage, kycStatus]);
}

export function useReputationGraph(
  escrowLinks: EscrowLink[],
  ratingsAverage: number,
  kycStatus?: string
): { month: string; score: number }[] {
  return useMemo(() => {
    const months: { [key: string]: EscrowLink[] } = {};
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = [];
    }

    escrowLinks.forEach(link => {
      if (!link.createdAt) return;
      const d = new Date(link.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (months[key]) {
        months[key].push(link);
      }
    });

    return Object.entries(months).map(([month, links]) => {
      const score = computeMonthlyTrustScore(links, ratingsAverage, kycStatus === 'verified');
      return { month, score };
    });
  }, [escrowLinks, ratingsAverage, kycStatus]);
}
