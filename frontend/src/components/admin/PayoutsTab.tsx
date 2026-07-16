import React from 'react';
import { AdminPayout } from '../../lib/services/admin';
import { EmptyStateCard } from '../common/EmptyStateCard';
import { getAnimationUrl } from '../../constants/animations';

interface PayoutsTabProps {
  payouts: AdminPayout[];
  theme?: 'dark' | 'light';
}

export function PayoutsTab({ payouts, theme }: PayoutsTabProps) {
  const isLight = theme === 'light';

  return (
    <div className="flex flex-col gap-4">
      <div className={`p-5 rounded-xl border ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-900 border-zinc-800'}`}>
        <h3 className={`text-sm font-bold mb-4 ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>
          Payout History
        </h3>
        {payouts.length === 0 ? (
          <EmptyStateCard
            title="No Payouts Yet"
            description="No payouts have been processed yet"
            animationUrl={getAnimationUrl('moneyFlow')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className={`border-b ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
                  <th className="text-left py-3 px-2 font-semibold text-zinc-500">Payout ID</th>
                  <th className="text-left py-3 px-2 font-semibold text-zinc-500">Amount</th>
                  <th className="text-left py-3 px-2 font-semibold text-zinc-500">Status</th>
                  <th className="text-left py-3 px-2 font-semibold text-zinc-500">Created</th>
                  <th className="text-left py-3 px-2 font-semibold text-zinc-500">Processed</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr
                    key={payout.id}
                    className={`border-b ${isLight ? 'border-zinc-100 hover:bg-zinc-50' : 'border-zinc-800 hover:bg-zinc-800/30'}`}
                  >
                    <td className="py-3 px-2 font-mono text-zinc-400">{payout.id.substring(0, 12)}...</td>
                    <td className="py-3 px-2 font-mono">{payout.currencySymbol}{payout.amount.toLocaleString()}</td>
                    <td className="py-3 px-2">
                      <span
                        className={`px-2 py-1 rounded-full text-[9px] font-bold ${
                          payout.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : payout.status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {payout.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-zinc-500">
                      {new Date(payout.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-2 text-zinc-500">
                      {payout.processedAt ? new Date(payout.processedAt).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
