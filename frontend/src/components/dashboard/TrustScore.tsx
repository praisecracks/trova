import React from 'react';
import { Star, ShieldCheck, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import { useTrustScore, TrustScoreResult } from '../../hooks/useTrustScore';

interface TrustScoreProps {
  escrowLinks: any[];
  ratingsAverage: number;
  kycStatus?: string;
}

const ScoreRing = ({ score, size = 120 }: { score: number; size?: number }) => {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  let color = '#ef4444';
  if (score >= 80) color = '#10b981';
  else if (score >= 60) color = '#f59e0b';
  else if (score >= 40) color = '#f97316';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bar-track-bg)"
          strokeWidth="6"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black font-mono" style={{ color: 'var(--text-primary)' }}>{score}</span>
        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>/ 100</span>
      </div>
    </div>
  );
};

export default function TrustScore({ escrowLinks, ratingsAverage, kycStatus }: TrustScoreProps) {
  const metrics = useTrustScore(escrowLinks, ratingsAverage, kycStatus);

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Exceptional';
    if (score >= 80) return 'Excellent';
    if (score >= 70) return 'Great';
    if (score >= 60) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Needs Work';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div 
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-md)' }}
      className="border rounded-xl p-5 sm:p-6 flex flex-col gap-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>
            TRUST SCORE
          </span>
          <h3 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
            How trusted your store is
          </h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-emerald-400">{getScoreLabel(metrics.score)}</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6">
        <ScoreRing score={metrics.score} />

        <div className="flex-1 w-full">
          <div className="flex flex-col gap-3">
            {[
              { label: 'Transaction Volume', value: metrics.breakdown.volume, max: 20, icon: <TrendingUp className="w-3.5 h-3.5" /> },
              { label: 'Buyer Rating', value: metrics.breakdown.rating, max: 20, icon: <Star className="w-3.5 h-3.5" /> },
              { label: 'Dispute Health', value: metrics.breakdown.disputeRate, max: 15, icon: <AlertTriangle className="w-3.5 h-3.5" /> },
              { label: 'KYC Verified', value: metrics.breakdown.kyc, max: 15, icon: <ShieldCheck className="w-3.5 h-3.5" /> },
              { label: 'Earnings Volume', value: metrics.breakdown.volumeBonus, max: 10, icon: <DollarSign className="w-3.5 h-3.5" /> },
            ].map((item) => {
              const pct = Math.round((item.value / item.max) * 100);
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-5 text-[var(--text-muted)]">{item.icon}</div>
                  <span className="text-xs text-[var(--text-muted)] w-36 shrink-0">{item.label}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bar-track-bg)' }}>
                    <div 
                      className="h-full rounded-full bg-emerald-500/80 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold w-8 text-right" style={{ color: 'var(--text-primary)' }}>
                    {item.value}/{item.max}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
