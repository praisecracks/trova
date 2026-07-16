import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useReputationGraph } from '../../hooks/useTrustScore';

interface ReputationGraphProps {
  escrowLinks: any[];
  ratingsAverage: number;
  kycStatus?: string;
}

export default function ReputationGraph({ escrowLinks, ratingsAverage, kycStatus }: ReputationGraphProps) {
  const data = useReputationGraph(escrowLinks, ratingsAverage, kycStatus);

  const formatMonth = (month: string) => {
    const [year, m] = month.split('-');
    const date = new Date(parseInt(year), parseInt(m) - 1);
    return date.toLocaleDateString([], { month: 'short', year: 'numeric' });
  };

  const latestScore = data.length > 0 ? data[data.length - 1].score : 0;
  const previousScore = data.length > 1 ? data[data.length - 2].score : 0;
  const change = latestScore - previousScore;
  const changeLabel = change > 0 ? `+${change}` : `${change}`;
  const changeColor = change >= 0 ? 'text-emerald-400' : 'text-rose-400';

  return (
    <div 
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-md)' }}
      className="border rounded-xl p-5 sm:p-6 flex flex-col gap-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>
            REPUTATION
          </span>
          <h3 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
            Trust score over time
          </h3>
        </div>
        {data.length > 1 && (
          <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${change >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{changeLabel} this month</span>
          </div>
        )}
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis 
              dataKey="month" 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false}
              tickFormatter={formatMonth}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              domain={[0, 100]}
              tickFormatter={(val) => `${val}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--surface2)', 
                border: '1px solid var(--border)',
                borderRadius: '8px', 
                fontSize: '11px',
                color: 'var(--text-primary)'
              }}
              labelFormatter={formatMonth}
              formatter={(value: any) => [`${value}/100`, 'Trust Score']}
            />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#10b981' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
