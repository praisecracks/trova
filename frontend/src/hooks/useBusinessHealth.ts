import { useMemo } from 'react';
import { EscrowLink } from '../types';

export interface BusinessHealthMetrics {
  todayRevenue: number;
  lockedInEscrow: number;
  moneyWaiting: number;
  pendingCount: number;
  completedCount: number;
  disputedCount: number;
  averageOrderValue: number;
  successRate: number;
  growth: {
    todayRevenue: number;
    lockedInEscrow: number;
    moneyWaiting: number;
    pendingCount: number;
    completedCount: number;
    disputedCount: number;
    averageOrderValue: number;
    successRate: number;
  };
  currencySymbol: string;
}

const toDateKey = (date: Date) => date.toDateString();

const isToday = (dateStr: string) => {
  if (!dateStr) return false;
  return toDateKey(new Date(dateStr)) === toDateKey(new Date());
};

const isWithinDays = (dateStr: string, daysAgo: number, daysEnd: number) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const start = new Date(now.getTime() - daysEnd * 24 * 3600 * 1000);
  const end = new Date(now.getTime() - daysAgo * 24 * 3600 * 1000);
  return d >= start && d < end;
};

const sumAmount = (links: EscrowLink[], predicate: (l: EscrowLink) => boolean) =>
  links.filter(predicate).reduce((sum, l) => sum + (l.amount || 0) + (l.shippingFee || 0), 0);

const countStatus = (links: EscrowLink[], statuses: string[]) =>
  links.filter(l => statuses.includes(l.status)).length;

export function useBusinessHealth(escrowLinks: EscrowLink[]): BusinessHealthMetrics {
  return useMemo(() => {
    const currencySymbol = (() => {
      const link = escrowLinks.find(l => l.currencySymbol);
      return link?.currencySymbol || '₦';
    })();

    // Revenue is earned when funds are RELEASED (settled), so use the
    // settlement timestamp (updatedAt), not the link creation date.
    const todayRevenue = sumAmount(escrowLinks, l => l.status === 'funds_released' && isToday(l.updatedAt || l.createdAt));
    const lockedInEscrow = sumAmount(escrowLinks, l => ['pending_deposit', 'deposited'].includes(l.status));
    const moneyWaiting = sumAmount(escrowLinks, l => l.status === 'deposited');
    const pendingCount = countStatus(escrowLinks, ['pending_deposit']);
    const completedCount = countStatus(escrowLinks, ['funds_released']);
    const disputedCount = countStatus(escrowLinks, ['disputed']);
    const totalTransactions = escrowLinks.length;
    const successRate = totalTransactions > 0 ? Math.round((completedCount / totalTransactions) * 100) : 0;
    const averageOrderValue = completedCount > 0 ? Math.round((sumAmount(escrowLinks, l => l.status === 'funds_released') / completedCount)) : 0;

    const prevTodayRevenue = sumAmount(escrowLinks, l => l.status === 'funds_released' && isWithinDays(l.updatedAt || l.createdAt, 1, 2));
    const prevLockedInEscrow = sumAmount(escrowLinks, l => ['pending_deposit', 'deposited'].includes(l.status) && isWithinDays(l.createdAt, 7, 14));
    const prevMoneyWaiting = sumAmount(escrowLinks, l => l.status === 'deposited' && isWithinDays(l.createdAt, 7, 14));
    const prevPendingCount = countStatus(escrowLinks, ['pending_deposit']) === pendingCount ? 0 : pendingCount;
    const prevCompletedCount = countStatus(escrowLinks, ['funds_released']) === completedCount ? 0 : completedCount;
    const prevDisputedCount = countStatus(escrowLinks, ['disputed']) === disputedCount ? 0 : disputedCount;

    const prevTotalTransactions = escrowLinks.filter(l => isWithinDays(l.createdAt, 0, 7)).length;
    const prevSuccessRate = prevTotalTransactions > 0 ? Math.round((prevCompletedCount / prevTotalTransactions) * 100) : 0;
    const prevAov = prevCompletedCount > 0 ? Math.round((sumAmount(escrowLinks, l => l.status === 'funds_released' && isWithinDays(l.createdAt, 0, 7)) / prevCompletedCount)) : 0;

    const pctChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const growth = {
      todayRevenue: pctChange(todayRevenue, prevTodayRevenue),
      lockedInEscrow: pctChange(lockedInEscrow, prevLockedInEscrow),
      moneyWaiting: pctChange(moneyWaiting, prevMoneyWaiting),
      pendingCount: pctChange(pendingCount, prevPendingCount),
      completedCount: pctChange(completedCount, prevCompletedCount),
      disputedCount: pctChange(disputedCount, prevDisputedCount),
      averageOrderValue: pctChange(averageOrderValue, prevAov),
      successRate: pctChange(successRate, prevSuccessRate),
    };

    return {
      todayRevenue,
      lockedInEscrow,
      moneyWaiting,
      pendingCount,
      completedCount,
      disputedCount,
      averageOrderValue,
      successRate,
      growth,
      currencySymbol,
    };
  }, [escrowLinks]);
}
