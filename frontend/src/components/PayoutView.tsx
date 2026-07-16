import React, { useState } from 'react';
import { 
  Search, 
  Check, 
  Award,
  RefreshCw
} from 'lucide-react';
import { Payout } from '../types';

interface PayoutViewProps {
  payouts: Payout[];
  onTriggerPayout?: () => void;
  canTriggerPayout?: boolean;
}

export default function PayoutView({ payouts, onTriggerPayout, canTriggerPayout }: PayoutViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusBadge = (status: Payout['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            Completed
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400 animate-pulse">
            Settling
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 border border-red-500/20 text-red-400">
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  const ngnPayouts = payouts.filter(p => p.status === 'completed' && (p.currencyCode === 'NGN' || !p.currencyCode));
  const usdPayouts = payouts.filter(p => p.status === 'completed' && p.currencyCode === 'USD');

  const totalSettledNGN = ngnPayouts.reduce((sum, p) => sum + p.amount, 0);
  const totalSettledUSD = usdPayouts.reduce((sum, p) => sum + p.amount, 0);

  const hasNGN = totalSettledNGN > 0 || payouts.length === 0 || (ngnPayouts.length === 0 && usdPayouts.length === 0);
  const hasUSD = totalSettledUSD > 0;

  const filteredPayouts = payouts.filter(p => 
    p.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.accountNumber.includes(searchTerm)
  );

  return (
    <div id="payout-history-container" className="flex flex-col gap-6 font-sans">
      
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Total Settled */}
        <div 
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
          className="border rounded-xl p-5 flex flex-col justify-between metric-card"
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-col flex-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Gross Settled Funds</span>
              <div className="flex flex-col gap-1.5 mt-2">
                {hasNGN && (
                  <span className="text-2xl font-mono font-bold tracking-tight animate-hover" style={{ color: 'var(--text-primary)' }}>
                    ₦{totalSettledNGN.toLocaleString('en-NG')}
                  </span>
                )}
                {hasUSD && (
                  <span className="text-2xl font-mono font-bold text-emerald-400 tracking-tight flex items-center gap-1.5">
                    ${totalSettledUSD.toLocaleString('en-US')} <span className="text-[9.5px] font-mono font-bold text-zinc-500 uppercase">(USD)</span>
                  </span>
                )}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 shrink-0">
              <Check className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[10px] mt-4" style={{ color: 'var(--text-muted)' }}>Transferred immediately upon delivery clearances</span>
        </div>

        {/* Selected Tier Bank */}
        <div 
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
          className="border rounded-xl p-5 flex flex-col justify-between metric-card"
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-col flex-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Linked Bank Account</span>
              <span className="text-sm font-bold tracking-tight mt-2.5" style={{ color: 'var(--text-primary)' }}>
                No Bank Linked
              </span>
              <span className="text-[10px] font-mono mt-1" style={{ color: 'var(--text-muted)' }}>Go to Settings to link your bank</span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 shrink-0">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[10px] text-emerald-400 mt-4 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            <span>Cleared for instant payout settlements</span>
          </span>
        </div>

        {/* Settlement speed */}
        <div 
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
          className="border rounded-xl p-5 flex flex-col justify-between metric-card"
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Average Clearing Time</span>
              <span className="text-2xl font-bold tracking-tight mt-2" style={{ color: 'var(--text-primary)' }}>
                7 Minutes
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-mono text-xs flex items-center justify-center font-bold">
              ₦
            </div>
          </div>
          <span className="text-[10px] mt-4" style={{ color: 'var(--text-muted)' }}>Powered by NIBSS real-time payout system</span>
        </div>

      </div>

      {/* Settlement Log */}
      <div 
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
        className="border rounded-xl overflow-hidden table-container"
      >
        {/* Table header bar */}
        <div 
          style={{ backgroundColor: 'var(--surface2)', borderBottomColor: 'var(--border)' }}
          className="p-5 border-b flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2 w-full md:w-80 font-sans">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter settlements by ID or bank..."
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                className="w-full border rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-emerald-500/60 transition-all placeholder:text-zinc-550"
              />
            </div>
          </div>

          {canTriggerPayout && onTriggerPayout && (
            <button
               id="trigger-payout-btn"
               onClick={onTriggerPayout}
               className="w-full md:w-auto px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold cursor-pointer flex items-center justify-center gap-2 transition-all shadow shadow-emerald-500/20 hover:scale-[1.01]"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-slow text-black" />
              <span>Initiate Batch Settlements now</span>
            </button>
          )}
        </div>

        {/* Payout records table */}
        <div className="overflow-x-auto font-sans">
          {filteredPayouts.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>No settlement histories registered</span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Releases occurring inside active transactions appear here.</span>
            </div>
          ) : (
            <>
              {/* Desktop view: Traditional sleek table */}
              <table className="w-full text-left border-collapse hidden md:table font-sans">
                <thead>
                  <tr 
                    style={{ backgroundColor: 'var(--surface2)', borderBottomColor: 'var(--border)' }}
                    className="border-b text-[9.5px] uppercase tracking-wider font-semibold"
                  >
                    <th className="py-3 px-5" style={{ color: 'var(--text-muted)' }}>Withdrawal ID</th>
                    <th className="py-3 px-5" style={{ color: 'var(--text-muted)' }}>Recipient Ledger Account</th>
                    <th className="py-3 px-5" style={{ color: 'var(--text-muted)' }}>Amount (Supports Multiple Currencies / NGN)</th>
                    <th className="py-3 px-5" style={{ color: 'var(--text-muted)' }}>Clearing Date</th>
                    <th className="py-3 px-5 text-right" style={{ color: 'var(--text-muted)' }}>Settlement State</th>
                  </tr>
                </thead>
                <tbody className="text-xs" style={{ borderTopColor: 'var(--border)' }}>
                  {filteredPayouts.map((p) => (
                    <tr 
                      key={p.id} 
                      style={{ borderBottomColor: 'var(--border)' }}
                      className="hover:bg-[var(--surface2)] border-b transition-colors"
                    >
                      <td className="py-4.5 px-5 font-mono font-bold" style={{ color: 'var(--text-muted)' }}>
                        {p.id}
                      </td>
                      <td className="py-4.5 px-5 animate-hover">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{p.bankName}</span>
                          <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>Acct No: {p.accountNumber}</span>
                        </div>
                      </td>
                      <td className="py-4.5 px-5 font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                        {p.currencySymbol || '₦'}{p.amount.toLocaleString()}
                      </td>
                      <td className="py-4.5 px-5 font-mono" style={{ color: 'var(--text-muted)' }}>
                        {new Date(p.date).toLocaleString()}
                      </td>
                      <td className="py-4.5 px-5 text-right">
                        {getStatusBadge(p.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile view: Stacked card representation */}
              <div 
                style={{ borderTopColor: 'var(--border)' }}
                className="flex flex-col md:hidden border-t"
              >
                {filteredPayouts.map((p) => (
                  <div 
                    key={p.id} 
                    style={{ borderBottomColor: 'var(--border)' }}
                    className="p-4 flex flex-col gap-2.5 transition-colors border-b hover:bg-[var(--surface2)]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs" style={{ color: 'var(--text-muted)' }}>{p.id}</span>
                      {getStatusBadge(p.status)}
                    </div>

                    <div className="flex flex-col gap-0.5 animate-hover">
                      <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{p.bankName}</span>
                      <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>Acct No: {p.accountNumber}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 font-mono" style={{ borderTopColor: 'var(--border)', borderTopWidth: '1px' }}>
                      <span className="font-mono font-bold text-emerald-450 text-sm" style={{ color: 'var(--text-primary)' }}>{p.currencySymbol || '₦'}{p.amount.toLocaleString()}</span>
                      <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{new Date(p.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
