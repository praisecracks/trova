import React from 'react';
import { TrendingUp, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { useAIInsights, Insight } from '../../hooks/useAIInsights';

const iconMap = {
  positive: CheckCircle,
  warning: AlertTriangle,
  alert: XCircle,
  info: Info,
};

const colorMap = {
  positive: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  alert: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  info: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
};

export default function AIInsights({ escrowLinks, ratingsAverage, viewsStats }: { escrowLinks: any[]; ratingsAverage: number; viewsStats: any }) {
  const insights = useAIInsights(escrowLinks, ratingsAverage, viewsStats);

  if (insights.length === 0) {
    return (
      <div 
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-md)' }}
        className="border rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-center"
      >
        <TrendingUp className="w-8 h-8 text-[var(--text-muted)]" />
        <div>
          <p className="text-sm font-bold text-[var(--text-primary)]">No insights yet</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Start creating escrow links and completing transactions to unlock AI-powered insights.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-md)' }}
      className="border rounded-xl p-5 sm:p-6 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>
            AI INSIGHTS
          </span>
          <h3 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
            What your data is telling you
          </h3>
        </div>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
          {insights.length} insight{insights.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((insight) => {
          const Icon = iconMap[insight.type] || Info;
          return (
            <div 
              key={insight.id}
              className={`flex items-start gap-3 p-4 rounded-xl border ${colorMap[insight.type]}`}
            >
              <Icon className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{insight.title}</span>
                  {insight.metric && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/20">
                      {insight.metric}
                    </span>
                  )}
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {insight.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
