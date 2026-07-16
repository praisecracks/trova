import React from 'react';
import { TrendingUp, CheckCircle, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { EscrowLink } from '../../types';

interface MetricsCardsProps {
  escrowLinks: EscrowLink[];
}

export default function MetricsCards({ escrowLinks }: MetricsCardsProps) {

  const isLockedStatus = (status: string) => {
    const s = (status || '').toLowerCase().trim();
    return s === 'deposited' || s === 'shipped';
  };

  const isDisbursedStatus = (status: string) => {
    const s = (status || '').toLowerCase().trim();
    return s === 'funds_released';
  };

  const isDisputeStatus = (status: string) => {
    const s = (status || '').toLowerCase().trim();
    return s === 'disputed';
  };

  const lockedLinks = escrowLinks.filter(link => isLockedStatus(link.status));
  const lockedNgn = lockedLinks
    .filter(link => (link.currencyCode || 'NGN') === 'NGN')
    .reduce((sum, link) => sum + link.amount + link.shippingFee, 0);
  const lockedUsd = lockedLinks
    .filter(link => link.currencyCode === 'USD')
    .reduce((sum, link) => sum + link.amount + link.shippingFee, 0);

  const disbursedLinks = escrowLinks.filter(link => isDisbursedStatus(link.status));
  const disbursedNgn = disbursedLinks
    .filter(link => (link.currencyCode || 'NGN') === 'NGN')
    .reduce((sum, link) => sum + link.amount + link.shippingFee, 0);
  const disbursedUsd = disbursedLinks
    .filter(link => link.currencyCode === 'USD')
    .reduce((sum, link) => sum + link.amount + link.shippingFee, 0);

  const activeDisputes = escrowLinks.filter(link => isDisputeStatus(link.status)).length;

  const renderMetric = (ngnVal: number, usdVal: number) => {
    if (ngnVal === 0 && usdVal === 0) {
      return null;
    }

    if (ngnVal > 0 && usdVal > 0) {
      return (
        <div className="flex flex-col gap-1 mt-1 text-left">
          <div className="text-xl font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
            ₦{ngnVal.toLocaleString()}
          </div>
          <div className="text-lg font-mono font-semibold" style={{ color: 'var(--text-muted)' }}>
            ${usdVal.toLocaleString()}
          </div>
        </div>
      );
    }

    if (ngnVal > 0) {
      return (
        <span className="text-2xl font-mono font-bold tracking-tight mt-2 block text-left" style={{ color: 'var(--text-primary)' }}>
          ₦{ngnVal.toLocaleString()}
        </span>
      );
    }

    return (
      <span className="text-2xl font-mono font-bold tracking-tight mt-2 block text-left" style={{ color: 'var(--text-primary)' }}>
        ${usdVal.toLocaleString()}
      </span>
    );
  };

  const renderEmptyState = (text: string) => (
    <span className="text-xl font-mono font-semibold tracking-tight mt-2 block text-left" style={{ color: 'var(--text-muted)' }}>
      {text}
    </span>
  );

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
       
      {/* KPI 1: Total Locked Escrow */}
      <div 
        style={{ 
          backgroundColor: 'var(--surface)', 
          borderColor: 'var(--border)', 
          boxShadow: 'var(--shadow-md)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
        className="border rounded-xl p-5 flex flex-col justify-between min-h-[140px] metric-card hover:-translate-y-0.5 hover:shadow-[0px_4px_6px_rgba(0,0,0,0.06),0px_8px_20px_rgba(0,0,0,0.10)]"
      >
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-left font-sans" style={{ color: 'var(--text-muted)' }}>Total Locked Escrow</span>
            {lockedNgn === 0 && lockedUsd === 0 ? renderEmptyState('No Locked Funds') : renderMetric(lockedNgn, lockedUsd)}
          </div>
          <div className="p-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)]">
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--brand-emerald)' }} />
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] mt-4" style={{ color: 'var(--text-muted)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Active transactions frozen in safety vault</span>
        </div>
      </div>

      {/* KPI 2: Disbursed Capital */}
      <div 
        style={{ 
          backgroundColor: 'var(--surface)', 
          borderColor: 'var(--border)', 
          boxShadow: 'var(--shadow-md)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
        className="border rounded-xl p-5 flex flex-col justify-between min-h-[140px] metric-card hover:-translate-y-0.5 hover:shadow-[0px_4px_6px_rgba(0,0,0,0.06),0px_8px_20px_rgba(0,0,0,0.10)]"
      >
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-left font-sans" style={{ color: 'var(--text-muted)' }}>Disbursed Capital</span>
            {disbursedNgn === 0 && disbursedUsd === 0 ? renderEmptyState('No Disbursements Yet') : renderMetric(disbursedNgn, disbursedUsd)}
          </div>
          <div className="p-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)]">
            <CheckCircle className="w-4 h-4" style={{ color: 'var(--brand-emerald)' }} />
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] mt-4" style={{ color: 'var(--text-muted)' }}>
          <ArrowUpRight className="w-3 h-3" style={{ color: 'var(--brand-emerald)' }} />
          <span>Cleared instantly to your linked bank account</span>
        </div>
      </div>

      {/* KPI 3: Active Disputes */}
      <div 
        style={{ 
          backgroundColor: 'var(--surface)', 
          borderColor: 'var(--border)', 
          boxShadow: 'var(--shadow-md)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
        className="border rounded-xl p-5 flex flex-col justify-between min-h-[140px] metric-card hover:-translate-y-0.5 hover:shadow-[0px_4px_6px_rgba(0,0,0,0.06),0px_8px_20px_rgba(0,0,0,0.10)]"
      >
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider font-semibold font-sans" style={{ color: 'var(--text-muted)' }}>Active Disputes</span>
            {activeDisputes === 0 ? (
              <span className="text-xl font-mono font-semibold tracking-tight mt-2 block text-left" style={{ color: 'var(--text-muted)' }}>
                —
              </span>
            ) : (
              <span className="text-2xl font-mono font-bold tracking-tight mt-2 text-left block" style={{ color: 'var(--text-primary)' }}>
                {activeDisputes}
              </span>
            )}
          </div>
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/25 text-red-500">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="text-[10px] mt-4 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
          <span className="text-red-500">●</span>
          <span>Awaiting arbitration mediation</span>
        </div>
      </div>

    </section>
  );
}
