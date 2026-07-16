import React, { useRef, useState, useEffect } from 'react';
import { TrendingUp, ShieldAlert, Clock, Activity, CheckCircle, DollarSign, Percent } from 'lucide-react';
import { useBusinessHealth, BusinessHealthMetrics } from '../../hooks/useBusinessHealth';

interface BusinessHealthProps {
  escrowLinks: any[];
}

const KpiCard = ({ title, value, growth, icon, prefix = '', suffix = '', formatAsCurrency = false, currencySymbol = '₦' }: {
  title: string;
  value: string;
  growth: number;
  icon: React.ReactNode;
  prefix?: string;
  suffix?: string;
  formatAsCurrency?: boolean;
  currencySymbol?: string;
}) => {
  const isPositive = growth >= 0;
  const growthLabel = isPositive ? `+${growth}%` : `${growth}%`;
  const growthColor = isPositive ? 'text-emerald-400' : 'text-rose-400';
  const growthBg = isPositive ? 'bg-emerald-500/10' : 'bg-rose-500/10';

  return (
    <div 
      style={{ 
        backgroundColor: 'var(--surface)', 
        borderColor: 'var(--border)', 
        boxShadow: 'var(--shadow-md)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
      }}
      className="border rounded-xl p-4 sm:p-5 flex flex-col justify-between min-h-[120px] sm:min-h-[140px] metric-card hover:-translate-y-0.5 hover:shadow-[0px_4px_6px_rgba(0,0,0,0.06),0px_8px_20px_rgba(0,0,0,0.10)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold text-left font-sans truncate" style={{ color: 'var(--text-muted)' }}>{title}</span>
          <span className="text-xl sm:text-2xl font-mono font-bold tracking-tight text-left block truncate" style={{ color: 'var(--text-primary)' }}>
            {formatAsCurrency && value !== '0' && value !== '0%' ? `${currencySymbol}${value}` : value}
            {suffix && <span className="text-xs sm:text-sm font-medium ml-1" style={{ color: 'var(--text-muted)' }}>{suffix}</span>}
          </span>
        </div>
        <div className="p-1.5 sm:p-2 rounded-lg bg-[var(--surface2)] border border-[var(--border)] shrink-0">
          {icon}
        </div>
      </div>
      <div className={`inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold mt-3 sm:mt-4 w-fit px-1.5 sm:px-2 py-0.5 rounded-full ${growthBg} ${growthColor}`}>
        <span>{isPositive ? '↑' : '↓'}</span>
        <span>{growthLabel}</span>
        <span style={{ color: 'var(--text-muted)' }} className="hidden sm:inline font-normal">vs last period</span>
      </div>
    </div>
  );
};

export default function BusinessHealth({ escrowLinks }: BusinessHealthProps) {
  const metrics = useBusinessHealth(escrowLinks);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const formatCurrency = (value: number) => {
    if (value === 0) return '0';
    return value.toLocaleString();
  };

  const cards = [
    { id: 'revenue', title: "Today's Revenue", value: formatCurrency(metrics.todayRevenue), growth: metrics.growth.todayRevenue, icon: <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: 'var(--brand-emerald)' }} />, formatAsCurrency: true, currencySymbol: metrics.currencySymbol },
    { id: 'locked', title: 'Total Locked in Escrow', value: formatCurrency(metrics.lockedInEscrow), growth: metrics.growth.lockedInEscrow, icon: <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: 'var(--brand-emerald)' }} />, formatAsCurrency: true, currencySymbol: metrics.currencySymbol },
    { id: 'waiting', title: 'Money Waiting', value: formatCurrency(metrics.moneyWaiting), growth: metrics.growth.moneyWaiting, icon: <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#f59e0b' }} />, formatAsCurrency: true, currencySymbol: metrics.currencySymbol },
    { id: 'pending', title: 'Pending', value: metrics.pendingCount.toString(), growth: metrics.growth.pendingCount, icon: <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#64748b' }} /> },
    { id: 'completed', title: 'Completed', value: metrics.completedCount.toString(), growth: metrics.growth.completedCount, icon: <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: 'var(--brand-emerald)' }} /> },
    { id: 'disputed', title: 'Disputed', value: metrics.disputedCount.toString(), growth: metrics.growth.disputedCount, icon: <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#ef4444' }} /> },
    { id: 'aov', title: 'Avg Order Value', value: formatCurrency(metrics.averageOrderValue), growth: metrics.growth.averageOrderValue, icon: <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: '#06b6d4' }} />, formatAsCurrency: true, currencySymbol: metrics.currencySymbol },
    { id: 'success', title: 'Success Rate', value: `${metrics.successRate}`, growth: metrics.growth.successRate, suffix: '%', icon: <Percent className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: 'var(--brand-emerald)' }} /> },
  ];

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;

      let closestIndex = 0;
      let closestDistance = Infinity;

      const cards = container.querySelectorAll('[data-card-index]');
      cards.forEach((card) => {
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        const distance = Math.abs(containerCenter - cardCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = parseInt(card.getAttribute('data-card-index') || '0', 10);
        }
      });

      setActiveIndex(closestIndex);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToCard = (index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const card = container.querySelector(`[data-card-index="${index}"]`) as HTMLElement;
    if (card) {
      const containerRect = container.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const scrollLeft = container.scrollLeft + (cardRect.left - containerRect.left) - (containerRect.width - cardRect.width) / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest block" style={{ color: 'var(--text-muted)' }}>BUSINESS HEALTH</span>
          <h3 className="text-base font-bold text-[var(--text-primary)] tracking-tight">How your business is performing right now</h3>
        </div>
      </div>

      {/* Mobile: horizontal scroll snap with peek / sm+: grid */}
      <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0 pb-2 sm:pb-0 scrollbar-hide" ref={scrollRef}>
        {cards.map((card, idx) => (
          <div 
            key={card.id} 
            data-card-index={idx} 
            className={`snap-start shrink-0 w-[85vw] sm:w-auto ${idx === 0 ? 'pl-2 sm:pl-0' : ''} ${idx === cards.length - 1 ? 'pr-8 sm:pr-0' : ''}`}
          >
            <KpiCard {...card} />
          </div>
        ))}
      </div>

      {/* Mobile dot indicators */}
      <div className="flex sm:hidden items-center justify-center gap-2 pt-1">
        {cards.map((_, idx) => (
          <button
            key={idx}
            onClick={() => scrollToCard(idx)}
            className={`rounded-full transition-all ${
              idx === activeIndex 
                ? 'w-4 h-2 bg-emerald-500' 
                : 'w-2 h-2 bg-[var(--border)] hover:bg-[var(--text-muted)]'
            }`}
            aria-label={`Go to card ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
