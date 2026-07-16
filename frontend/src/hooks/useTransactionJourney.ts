import { useMemo } from 'react';
import { EscrowLink } from '../types';

export interface FunnelStage {
  label: string;
  status: string;
  count: number;
  dropOff: number;
  dropOffPercent: number;
  conversionPercent: number;
  color: string;
  icon: string;
}

export interface TransactionJourneyMetrics {
  stages: FunnelStage[];
  totalCreated: number;
  totalReleased: number;
  overallConversionRate: number;
  biggestDropOff: {
    stage: string;
    count: number;
    percent: number;
  } | null;
}

const STAGES = [
  { label: 'Created', status: 'pending_deposit', color: '#64748b', icon: '📝' },
  { label: 'Paid', status: 'deposited', color: '#f59e0b', icon: '💳' },
  { label: 'Shipped', status: 'shipped', color: '#3b82f6', icon: '🚚' },
  { label: 'Delivered', status: 'delivered', color: '#8b5cf6', icon: '📦' },
  { label: 'Released', status: 'funds_released', color: '#10b981', icon: '✅' },
];

export function useTransactionJourney(escrowLinks: EscrowLink[]): TransactionJourneyMetrics {
  return useMemo(() => {
    const counts = STAGES.map(stage => ({
      ...stage,
      count: escrowLinks.filter(l => l.status === stage.status).length,
    }));

    const stages: FunnelStage[] = counts.map((stage, idx) => {
      const prevCount = idx > 0 ? counts[idx - 1].count : stage.count;
      const dropOff = idx > 0 ? Math.max(0, prevCount - stage.count) : 0;
      const dropOffPercent = idx > 0 && prevCount > 0 ? Math.round((dropOff / prevCount) * 100) : 0;
      const conversionPercent = counts[0].count > 0 ? Math.round((stage.count / counts[0].count) * 100) : 0;

      return {
        label: stage.label,
        status: stage.status,
        count: stage.count,
        dropOff,
        dropOffPercent,
        conversionPercent,
        color: stage.color,
        icon: stage.icon,
      };
    });

    const totalCreated = stages[0]?.count || 0;
    const totalReleased = stages[stages.length - 1]?.count || 0;
    const overallConversionRate = totalCreated > 0 ? Math.round((totalReleased / totalCreated) * 100) : 0;

    let biggestDropOff: TransactionJourneyMetrics['biggestDropOff'] = null;
    stages.forEach((stage, idx) => {
      if (idx > 0 && stage.dropOff > 0) {
        if (!biggestDropOff || stage.dropOff > biggestDropOff.count) {
          biggestDropOff = {
            stage: `${counts[idx - 1].label} → ${stage.label}`,
            count: stage.dropOff,
            percent: stage.dropOffPercent,
          };
        }
      }
    });

    return {
      stages,
      totalCreated,
      totalReleased,
      overallConversionRate,
      biggestDropOff,
    };
  }, [escrowLinks]);
}
