import { useMemo } from 'react';
import { EscrowLink } from '../types';

export interface Insight {
  id: string;
  type: 'positive' | 'warning' | 'alert' | 'info';
  title: string;
  description: string;
  metric?: string;
}

export function useAIInsights(escrowLinks: EscrowLink[], ratingsAverage: number, viewsStats: { totalViews: number; viewsToday: number; viewsThisWeek: number }) {
  return useMemo(() => {
    const insights: Insight[] = [];
    const total = escrowLinks.length;
    if (total === 0) return insights;

    const completed = escrowLinks.filter(l => l.status === 'funds_released');
    const disputed = escrowLinks.filter(l => l.status === 'disputed');
    const deposited = escrowLinks.filter(l => l.status === 'deposited');
    const pending = escrowLinks.filter(l => l.status === 'pending_deposit');
    const shipped = escrowLinks.filter(l => l.status === 'shipped');
    const delivered = escrowLinks.filter(l => l.status === 'delivered');

    const totalEarnings = completed.reduce((sum, l) => sum + l.amount + l.shippingFee, 0);
    const disputeRate = total > 0 ? (disputed.length / total) * 100 : 0;
    const successRate = total > 0 ? (completed.length / total) * 100 : 0;
    const avgOrderValue = completed.length > 0 ? Math.round(totalEarnings / completed.length) : 0;

    const now = new Date();
    const thisWeekStart = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    const lastWeekStart = new Date(now.getTime() - 14 * 24 * 3600 * 1000);
    const thisWeek = escrowLinks.filter(l => new Date(l.createdAt) >= thisWeekStart);
    const lastWeek = escrowLinks.filter(l => new Date(l.createdAt) >= lastWeekStart && new Date(l.createdAt) < thisWeekStart);
    const thisWeekEarnings = thisWeek.filter(l => l.status === 'funds_released').reduce((sum, l) => sum + l.amount + l.shippingFee, 0);
    const lastWeekEarnings = lastWeek.filter(l => l.status === 'funds_released').reduce((sum, l) => sum + l.amount + l.shippingFee, 0);
    const earningsGrowth = lastWeekEarnings > 0 ? Math.round(((thisWeekEarnings - lastWeekEarnings) / lastWeekEarnings) * 100) : (thisWeekEarnings > 0 ? 100 : 0);

    if (earningsGrowth > 20) {
      insights.push({
        id: 'revenue-growth',
        type: 'positive',
        title: 'Revenue trending up',
        description: `Your earnings grew ${earningsGrowth}% this week compared to last week.`,
        metric: `+${earningsGrowth}%`
      });
    } else if (earningsGrowth < -20) {
      insights.push({
        id: 'revenue-drop',
        type: 'alert',
        title: 'Revenue drop detected',
        description: `Earnings fell ${Math.abs(earningsGrowth)}% this week. Check your marketing channels and follow up with pending buyers.`,
        metric: `${earningsGrowth}%`
      });
    }

    if (disputeRate > 5) {
      insights.push({
        id: 'dispute-high',
        type: 'alert',
        title: 'Dispute rate is above 5%',
        description: 'High disputes hurt your trust score. Review your delivery process and product descriptions.',
        metric: `${disputeRate.toFixed(1)}%`
      });
    } else if (disputeRate === 0 && total > 5) {
      insights.push({
        id: 'dispute-zero',
        type: 'positive',
        title: 'Zero disputes',
        description: 'No disputed transactions. This strengthens buyer confidence and your trust score.',
        metric: '0%'
      });
    }

    if (deposited.length > 0) {
      const waitingAmount = deposited.reduce((sum, l) => sum + l.amount + l.shippingFee, 0);
      insights.push({
        id: 'money-waiting',
        type: 'info',
        title: 'Funds waiting for buyer confirmation',
        description: `${deposited.length} transaction${deposited.length > 1 ? 's' : ''} totaling ₦${waitingAmount.toLocaleString()} are deposited but not yet released.`,
        metric: `₦${waitingAmount.toLocaleString()}`
      });
    }

    const createdToPaid = total > 0 ? Math.round((deposited.length / pending.length) * 100) : 0;
    if (pending.length > 0 && createdToPaid < 50) {
      insights.push({
        id: 'checkout-friction',
        type: 'warning',
        title: 'Checkout friction detected',
        description: `${pending.length} escrow links created but not yet paid. Consider following up or simplifying your payment instructions.`,
        metric: `${pending.length} pending`
      });
    }

    const shippedNotDelivered = shipped.length;
    if (shippedNotDelivered > 0) {
      insights.push({
        id: 'awaiting-delivery',
        type: 'info',
        title: 'Awaiting delivery confirmation',
        description: `${shippedNotDelivered} transaction${shippedNotDelivered > 1 ? 's' : ''} shipped but not yet delivered. Buyers may need a reminder.`,
        metric: `${shippedNotDelivered}`
      });
    }

    if (ratingsAverage >= 4.5 && completed.length >= 3) {
      insights.push({
        id: 'top-rated',
        type: 'positive',
        title: 'Top-rated seller',
        description: `Your rating of ${ratingsAverage.toFixed(1)} is excellent. Highlight this in your storefront to attract more buyers.`,
        metric: `${ratingsAverage.toFixed(1)}★`
      });
    }

    if (viewsStats.viewsToday > 0) {
      const todayTransactions = thisWeek.filter(l => new Date(l.createdAt).toDateString() === now.toDateString()).length;
      if (todayTransactions === 0) {
        insights.push({
          id: 'views-no-sales',
          type: 'warning',
          title: 'Views without conversions today',
          description: `${viewsStats.viewsToday} people viewed your store today with no transactions yet. Consider a limited-time offer or follow-up.`,
          metric: `${viewsStats.viewsToday} views`
        });
      }
    }

    return insights.slice(0, 6);
  }, [escrowLinks, ratingsAverage, viewsStats]);
}
