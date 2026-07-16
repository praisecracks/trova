import React, { useRef, useState, useEffect } from 'react';
import { useTransactionJourney, FunnelStage } from '../../hooks/useTransactionJourney';

const STAGE_COLORS: Record<string, string> = {
  'pending_deposit': '#71717a',
  'deposited': '#f59e0b',
  'shipped': '#3b82f6',
  'delivered': '#8b5cf6',
  'funds_released': '#10b981',
};

interface TransactionJourneyProps {
  escrowLinks: any[];
}

export default function TransactionJourney({ escrowLinks }: TransactionJourneyProps) {
  const { stages, totalCreated, totalReleased, overallConversionRate } = useTransactionJourney(escrowLinks);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;

      let closestIndex = 0;
      let closestDistance = Infinity;

      const cards = container.querySelectorAll('[data-stage-index]');
      cards.forEach((card) => {
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        const distance = Math.abs(containerCenter - cardCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = parseInt(card.getAttribute('data-stage-index') || '0', 10);
        }
      });

      setActiveIndex(closestIndex);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToStage = (index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const card = container.querySelector(`[data-stage-index="${index}"]`) as HTMLElement;
    if (card) {
      const containerRect = container.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const scrollLeft = container.scrollLeft + (cardRect.left - containerRect.left) - (containerRect.width - cardRect.width) / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  };

  const formatNumber = (num: number) => {
    if (num === 0) return '0';
    return num.toLocaleString();
  };

  return (
    <div 
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-md)' }}
      className="border rounded-xl p-5 sm:p-6 flex flex-col gap-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-muted)' }}>
            TRANSACTION FLOW
          </span>
          <h3 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
            Where buyers start and where they finish
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface2)] border border-[var(--border)]">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Started</span>
            <span className="font-mono font-bold text-[var(--text-primary)]">{formatNumber(totalCreated)}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Released</span>
            <span className="font-mono font-bold text-emerald-400">{formatNumber(totalReleased)}</span>
          </div>
        </div>
      </div>

      {/* Timeline — mobile scroll / desktop row */}
      <div className="relative">
        {/* Mobile scroll container */}
        <div 
          className="flex sm:flex sm:justify-between items-start gap-0 overflow-x-auto sm:overflow-visible snap-x snap-mandatory scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0 pb-2 sm:pb-0 scrollbar-hide"
          ref={scrollRef}
        >
          {stages.map((stage, idx) => {
            const stageColor = STAGE_COLORS[stage.status] || '#71717a';
            const isLast = idx === stages.length - 1;
            const showDropOff = idx > 0 && stage.dropOff > 0;

            return (
              <div 
                key={stage.status} 
                data-stage-index={idx}
                className="snap-start shrink-0 w-[85vw] sm:w-auto sm:flex-1 flex flex-col items-center"
              >
                {/* Stage label */}
                <span className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  {stage.label}
                </span>

                {/* Dot on timeline */}
                <div className="relative flex items-center justify-center w-full">
                  {/* Connector line behind dot */}
                  {!isLast && (
                    <div className="hidden sm:block absolute top-1/2 left-[calc(50%+12px)] right-[calc(-50%+12px)] h-px bg-[var(--border)]" />
                  )}
                  
                  {/* Dot */}
                  <div 
                    className="w-3 h-3 rounded-full shrink-0 z-10 transition-colors duration-300"
                    style={{ backgroundColor: stageColor }}
                  />
                </div>

                {/* Count */}
                <span className="text-lg sm:text-xl font-mono font-bold mt-2 text-[var(--text-primary)]">
                  {formatNumber(stage.count)}
                </span>

                {/* Drop-off */}
                {showDropOff && (
                  <span className="text-[10px] font-medium mt-0.5" style={{ color: stage.dropOffPercent > 10 ? '#ef4444' : 'var(--text-muted)' }}>
                    −{formatNumber(stage.dropOff)} ({stage.dropOffPercent}%)
                  </span>
                )}

                {/* Conversion % */}
                <span className="text-[10px] font-mono mt-1" style={{ color: 'var(--text-muted)' }}>
                  {stage.conversionPercent}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Mobile dot indicators */}
        <div className="flex sm:hidden items-center justify-center gap-2 pt-3">
          {stages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollToStage(idx)}
              className={`rounded-full transition-all ${
                idx === activeIndex 
                  ? 'w-4 h-2 bg-emerald-500' 
                  : 'w-2 h-2 bg-[var(--border)] hover:bg-[var(--text-muted)]'
              }`}
              aria-label={`Go to stage ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Overall Conversion */}
      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Overall Conversion
          </span>
          <span className="text-2xl font-black font-mono text-[var(--text-primary)]">
            {overallConversionRate}%
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold">
          <span>Created → Released</span>
        </div>
      </div>
    </div>
  );
}
