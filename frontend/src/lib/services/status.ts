import { EscrowStatus } from '../../types';

export function normalizeStatus(status: string): EscrowStatus {
  const statusMap: Record<string, EscrowStatus> = {
    'pending_deposit': 'pending_deposit',
    'awaiting deposit': 'pending_deposit',
    'deposited': 'deposited',
    'locked deposited': 'deposited',
    'shipped': 'shipped',
    'order shipped': 'shipped',
    'delivered': 'delivered',
    'funds_released': 'funds_released',
    'released and settled': 'funds_released',
    'released': 'funds_released',
    'disputed': 'disputed',
    'dispute raised': 'disputed',
    'expired': 'expired',
  };
  return statusMap[status] || 'pending_deposit';
}

export function getStatusLabel(status: EscrowStatus): string {
  const labels: Record<EscrowStatus, string> = {
    pending_deposit: 'Awaiting payment',
    deposited: 'Funds Locked (Paid)',
    shipped: 'In Transit',
    delivered: 'Arrived (Pending Release)',
    funds_released: 'Settled & Released',
    disputed: 'Under Dispute',
    expired: 'Expired',
  };
  return labels[status];
}