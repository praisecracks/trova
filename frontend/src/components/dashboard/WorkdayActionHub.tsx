import React, { useState } from 'react';
import { 
  CheckCircle, 
  Truck, 
  AlertTriangle, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';
import { EscrowLink, ActiveTab } from '../../types';
import { useToast } from '../ToastContext';

interface WorkdayActionHubProps {
  escrowLinks: EscrowLink[];
  onUpdateStatus?: (id: string, newStatus: EscrowLink['status']) => void;
  onNavigateTab?: (tab: ActiveTab, id?: string) => void;
}

export default function WorkdayActionHub({
  escrowLinks,
  onUpdateStatus,
  onNavigateTab
}: WorkdayActionHubProps) {
  const { success, info } = useToast();

  // States to handle inline action confirmations
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmType, setConfirmType] = useState<'shipped' | 'delivered' | null>(null);

  // Filter links for actions: only show uncompleted, actionable orders
  const awaitingShipment = escrowLinks.filter(
    l => l.status === 'deposited'
  );
  
  const awaitingConfirmation = escrowLinks.filter(
    l => l.status === 'shipped'
  );

  const underDispute = escrowLinks.filter(
    l => l.status === 'disputed'
  );

  const totalActionCount = awaitingShipment.length + awaitingConfirmation.length + underDispute.length;

  // React state for animating transitions between items and empty state
  const [stage, setStage] = useState<'active' | 'fading_out' | 'gap' | 'empty'>(() => {
    return totalActionCount > 0 ? 'active' : 'empty';
  });

  const [itemsToRender, setItemsToRender] = useState(() => ({
    awaitingShipment,
    awaitingConfirmation,
    underDispute
  }));

  React.useEffect(() => {
    const hasItems = totalActionCount > 0;
    
    if (hasItems) {
      setItemsToRender({ awaitingShipment, awaitingConfirmation, underDispute });
      setStage('active');
    } else {
      // Transition from active -> fading_out -> gap -> empty
      if (stage === 'active') {
        setStage('fading_out');
        const fadeTimer = setTimeout(() => {
          setStage('gap');
          const gapTimer = setTimeout(() => {
            setStage('empty');
          }, 100); // 0.1s gap
          return () => clearTimeout(gapTimer);
        }, 300); // 0.3s fade out
        return () => clearTimeout(fadeTimer);
      } else if (stage !== 'fading_out' && stage !== 'gap') {
        setStage('empty');
      }
    }
  }, [totalActionCount, awaitingShipment.length, awaitingConfirmation.length, underDispute.length]);

  return (
    <div 
      id="workday-action-center"
      className="p-5 sm:p-[20px_24px] rounded-[14px] border border-[var(--border)] bg-[var(--surface)] flex flex-col gap-4 text-left transition-all cursor-default"
      style={{ 
        boxShadow: 'var(--shadow-md)',
        borderLeft: '3px solid var(--brand-emerald)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
      }}
    >
      {/* 1. Header Layout */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          {/* Animated pulsing dot on left */}
          <div className="relative w-2 h-2 shrink-0 flex items-center justify-center">
            {totalActionCount > 0 ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                <span className="absolute w-4 h-4 rounded-full border border-[#10b981] animate-pulse-ring" />
              </>
            ) : (
              <span className="w-2 h-2 rounded-full bg-zinc-500" />
            )}
          </div>
          
          <div className="flex items-center gap-2 select-none">
            <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">Action Center</h3>
            {totalActionCount > 0 && (
              <span className="inline-block bg-[rgba(239,68,68,0.15)] text-[#f87171] text-[11px] font-bold rounded-[20px] px-1.5 py-0.5 min-w-[18px] text-center font-mono leading-none">
                {totalActionCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Style injection for the pulsating ring & state transition animations */}
      <style>{`
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .animate-pulse-ring {
          animation: pulseRing 2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }
      `}</style>

      {/* 3. Card Body with support for state fades */}
      <div 
        className={`transition-opacity duration-300 ${
          stage === 'active' ? 'opacity-100' :
          stage === 'fading_out' ? 'opacity-0' :
          stage === 'gap' ? 'opacity-0' :
          'opacity-100' // empty state load
        }`}
      >
        {stage === 'empty' ? (
          /* Empty State View */
          <div className="min-h-[80px] py-[10px] flex flex-col items-center justify-center text-center gap-2 select-none">
            <CheckCircle className="w-8 h-8 text-[#10b981]" />
            <div className="flex flex-col gap-0.5">
              <h4 className="text-[14px] font-medium text-[var(--text-primary)]">You are all caught up</h4>
              <p className="text-[12px] text-[var(--text-muted)] max-w-sm">
                No actions required right now. Your transactions are running smoothly
              </p>
            </div>
          </div>
        ) : (
          /* Actionable Rows Stack */
          <div className="flex flex-col">
            {/* Disputes row list */}
            {itemsToRender.underDispute.map((link) => {
              const totalValue = link.amount + (link.shippingFee || 0);
              const symbol = link.currencySymbol || '₦';
              const disputeDesc = link.description || "The buyer has submitted a dispute. Submit resolution evidence today to clear held escrow funds.";

              const isConfirming = confirmId === link.id && confirmType === 'shipped';

              return (
                <div key={link.id} className="border-t border-[var(--border)] py-4 first:border-0 first:pt-0">
                  {/* Mobile Stacked Card View */}
                  <div className="md:hidden flex flex-col gap-3 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#f87171] bg-[rgba(239,68,68,0.12)] rounded px-1.5 py-0.5">
                          DISPUTE
                        </span>
                        <span className="font-mono text-[#10b981] text-[13px] font-semibold">
                          #{link.id}
                        </span>
                      </div>
                      <span className="font-mono text-[14px] font-semibold text-[var(--text-primary)]">
                        {symbol}{totalValue.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <div className="text-[14px] font-medium text-[var(--text-primary)] leading-normal">
                        {link.productName}
                      </div>
                      <div className="text-[12px] text-[var(--text-muted)] mt-1 leading-relaxed">
                        {disputeDesc}
                      </div>
                    </div>
                    <div className="w-full mt-1">
                      <button
                        onClick={() => {
                          if (onNavigateTab) {
                            onNavigateTab('disputes', link.id);
                            info(`Opening Dispute desk for Order #${link.id}`);
                          }
                        }}
                        className="w-full flex items-center justify-center gap-1.5 border border-[rgba(239,68,68,0.4)] bg-[rgba(239,68,68,0.08)] text-[#f87171] hover:border-[rgba(239,68,68,0.7)] hover:bg-[rgba(239,68,68,0.15)] rounded-lg text-[12px] font-semibold p-2 transition-all cursor-pointer"
                      >
                        <AlertTriangle className="w-[12px] h-[12px]" />
                        <span>Resolve Now</span>
                      </button>
                    </div>
                  </div>

                  {/* Desktop Horizontal Flex Row View */}
                  <div className="hidden md:flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-[#f87171] bg-[rgba(239,68,68,0.12)] rounded px-1.5 py-0.5 shrink-0 select-none">
                        DISPUTE
                      </span>
                      <span className="font-mono text-[#10b981] text-[13px] font-semibold shrink-0">
                        #{link.id}
                      </span>
                      <span className="text-[14px] font-medium text-[var(--text-primary)] truncate max-w-[200px]">
                        {link.productName}
                      </span>
                      <span className="text-[12px] text-[var(--text-muted)] truncate flex-1 leading-normal ml-1">
                        {disputeDesc}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-5 shrink-0">
                      <span className="font-mono text-[14px] font-semibold text-[var(--text-primary)]">
                        {symbol}{totalValue.toLocaleString()}
                      </span>
                      <button
                        onClick={() => {
                          if (onNavigateTab) {
                            onNavigateTab('disputes', link.id);
                            info(`Opening Dispute desk for Order #${link.id}`);
                          }
                        }}
                        className="flex items-center gap-1.5 border border-[rgba(239,68,68,0.4)] bg-[rgba(239,68,68,0.08)] text-[#f87171] hover:border-[rgba(239,68,68,0.7)] hover:bg-[rgba(239,68,68,0.15)] rounded-lg text-[12px] font-semibold py-1.5 px-3.5 transition-all cursor-pointer"
                      >
                        <AlertTriangle className="w-[12px] h-[12px]" />
                        <span>Resolve Now</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Paid Shipments list */}
            {itemsToRender.awaitingShipment.map((link) => {
              const totalValue = link.amount + (link.shippingFee || 0);
              const symbol = link.currencySymbol || '₦';
              const carrierDesc = `Paid order waiting to be shipped to: ${link.buyerPhone}`;
              const isConfirming = confirmId === link.id && confirmType === 'shipped';

              const renderButtonMobile = () => {
                if (isConfirming) {
                  return (
                    <div className="w-full flex gap-2">
                      <button
                        onClick={() => {
                          onUpdateStatus?.(link.id, 'shipped');
                          setConfirmId(null);
                          setConfirmType(null);
                          success(`Order #${link.id} marked as shipped!`);
                        }}
                        className="flex-1 py-2 px-3 rounded-lg bg-[#10b981] hover:bg-emerald-400 text-black font-extrabold text-[12px] transition-all"
                      >
                        Confirm Ship
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmId(null);
                          setConfirmType(null);
                        }}
                        className="py-2 px-4 rounded-lg bg-[var(--surface2)] border border-[var(--border)] font-bold text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  );
                }
                return (
                  <button
                    onClick={() => {
                      setConfirmId(link.id);
                      setConfirmType('shipped');
                    }}
                    className="w-full flex items-center justify-center gap-1.5 border border-[rgba(16,185,129,0.4)] bg-[rgba(16,185,129,0.08)] text-[#10b981] hover:border-[rgba(16,185,129,0.7)] hover:bg-[rgba(16,185,129,0.15)] rounded-lg text-[12px] font-semibold p-2 transition-all"
                  >
                    <Truck className="w-[12px] h-[12px]" />
                    <span>Mark Shipped</span>
                  </button>
                );
              };

              const renderButtonDesktop = () => {
                if (isConfirming) {
                  return (
                    <div className="flex gap-1.5 items-center">
                      <button
                        onClick={() => {
                          onUpdateStatus?.(link.id, 'shipped');
                          setConfirmId(null);
                          setConfirmType(null);
                          success(`Order #${link.id} marked as shipped!`);
                        }}
                        className="py-1 px-3 rounded-lg bg-[#10b981] hover:bg-emerald-400 text-black font-extrabold text-[11px] transition-all"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmId(null);
                          setConfirmType(null);
                        }}
                        className="py-1 px-2.5 rounded-lg bg-[var(--surface2)] border border-[var(--border)] font-bold text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  );
                }
                return (
                  <button
                    onClick={() => {
                      setConfirmId(link.id);
                      setConfirmType('shipped');
                    }}
                    className="flex items-center gap-1.5 border border-[rgba(16,185,129,0.4)] bg-[rgba(16,185,129,0.08)] text-[#10b981] hover:border-[rgba(16,185,129,0.7)] hover:bg-[rgba(16,185,129,0.15)] rounded-lg text-[12px] font-semibold py-1.5 px-3.5 transition-all cursor-pointer"
                  >
                    <Truck className="w-[12px] h-[12px]" />
                    <span>Mark Shipped</span>
                  </button>
                );
              };

              return (
                <div key={link.id} className="border-t border-[var(--border)] py-4 first:border-0 first:pt-0">
                  {/* Mobile Stacked Card View */}
                  <div className="md:hidden flex flex-col gap-3 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#10b981] bg-[rgba(16,185,129,0.12)] rounded px-1.5 py-0.5">
                          PAID
                        </span>
                        <span className="font-mono text-[#10b981] text-[13px] font-semibold">
                          #{link.id}
                        </span>
                      </div>
                      <span className="font-mono text-[14px] font-semibold text-[var(--text-primary)]">
                        {symbol}{totalValue.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <div className="text-[14px] font-medium text-[var(--text-primary)] leading-normal">
                        {link.productName}
                      </div>
                      <div className="text-[12px] text-[var(--text-muted)] mt-1 leading-relaxed">
                        {carrierDesc}
                      </div>
                    </div>
                    <div className="w-full mt-1">
                      {renderButtonMobile()}
                    </div>
                  </div>

                  {/* Desktop View */}
                  <div className="hidden md:flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-[#10b981] bg-[rgba(16,185,129,0.12)] rounded px-1.5 py-0.5 shrink-0 select-none">
                        PAID
                      </span>
                      <span className="font-mono text-[#10b981] text-[13px] font-semibold shrink-0">
                        #{link.id}
                      </span>
                      <span className="text-[14px] font-medium text-[var(--text-primary)] truncate max-w-[200px]">
                        {link.productName}
                      </span>
                      <span className="text-[12px] text-[var(--text-muted)] truncate flex-1 leading-normal ml-1">
                        {carrierDesc}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-5 shrink-0">
                      <span className="font-mono text-[14px] font-semibold text-[var(--text-primary)]">
                        {symbol}{totalValue.toLocaleString()}
                      </span>
                      {renderButtonDesktop()}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* In-Transit list */}
            {itemsToRender.awaitingConfirmation.map((link) => {
              const totalValue = link.amount + (link.shippingFee || 0);
              const symbol = link.currencySymbol || '₦';
              const transitDesc = `Courier delivery tracking active. Awaiting delivery confirmation.`;
              const isConfirming = confirmId === link.id && confirmType === 'delivered';

              const renderButtonMobile = () => {
                if (isConfirming) {
                  return (
                    <div className="w-full flex gap-2">
                      <button
                        onClick={() => {
                          onUpdateStatus?.(link.id, 'delivered');
                          setConfirmId(null);
                          setConfirmType(null);
                          success(`Order #${link.id} marked as delivered.`);
                        }}
                        className="flex-1 py-2 px-3 rounded-lg bg-[#10b981] hover:bg-emerald-400 text-black font-extrabold text-[12px] transition-all"
                      >
                        Confirm Delivered
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmId(null);
                          setConfirmType(null);
                        }}
                        className="py-2 px-4 rounded-lg bg-[var(--surface2)] border border-[var(--border)] font-bold text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  );
                }
                return (
                  <button
                    onClick={() => {
                      setConfirmId(link.id);
                      setConfirmType('delivered');
                    }}
                    className="w-full flex items-center justify-center gap-1.5 border border-[rgba(16,185,129,0.4)] bg-[rgba(16,185,129,0.08)] text-[#10b981] hover:border-[rgba(16,185,129,0.7)] hover:bg-[rgba(16,185,129,0.15)] rounded-lg text-[12px] font-semibold p-2 transition-all"
                  >
                    <ShieldCheck className="w-[12px] h-[12px]" />
                    <span>Mark Delivered</span>
                  </button>
                );
              };

              const renderButtonDesktop = () => {
                if (isConfirming) {
                  return (
                    <div className="flex gap-1.5 items-center">
                      <button
                        onClick={() => {
                          onUpdateStatus?.(link.id, 'delivered');
                          setConfirmId(null);
                          setConfirmType(null);
                          success(`Order #${link.id} marked as delivered.`);
                        }}
                        className="py-1 px-3 rounded-lg bg-[#10b981] hover:bg-emerald-400 text-black font-extrabold text-[11px] transition-all"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmId(null);
                          setConfirmType(null);
                        }}
                        className="py-1 px-2.5 rounded-lg bg-[var(--surface2)] border border-[var(--border)] font-bold text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  );
                }
                return (
                  <button
                    onClick={() => {
                      setConfirmId(link.id);
                      setConfirmType('delivered');
                    }}
                    className="flex items-center gap-1.5 border border-[rgba(16,185,129,0.4)] bg-[rgba(16,185,129,0.08)] text-[#10b981] hover:border-[rgba(16,185,129,0.7)] hover:bg-[rgba(16,185,129,0.15)] rounded-lg text-[12px] font-semibold py-1.5 px-3.5 transition-all cursor-pointer"
                  >
                    <ShieldCheck className="w-[12px] h-[12px]" />
                    <span>Mark Delivered</span>
                  </button>
                );
              };

              return (
                <div key={link.id} className="border-t border-[var(--border)] py-4 first:border-0 first:pt-0">
                  {/* Mobile Stacked Card View */}
                  <div className="md:hidden flex flex-col gap-3 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-purple-400 bg-[rgba(168,85,247,0.12)] rounded px-1.5 py-0.5">
                          IN TRANSIT
                        </span>
                        <span className="font-mono text-[#10b981] text-[13px] font-semibold">
                          #{link.id}
                        </span>
                      </div>
                      <span className="font-mono text-[14px] font-semibold text-[var(--text-primary)]">
                        {symbol}{totalValue.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <div className="text-[14px] font-medium text-[var(--text-primary)] leading-normal">
                        {link.productName}
                      </div>
                      <div className="text-[12px] text-[var(--text-muted)] mt-1 leading-relaxed">
                        {transitDesc}
                      </div>
                    </div>
                    <div className="w-full mt-1">
                      {renderButtonMobile()}
                    </div>
                  </div>

                  {/* Desktop View */}
                  <div className="hidden md:flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-purple-400 bg-[rgba(168,85,247,0.12)] rounded px-1.5 py-0.5 shrink-0 select-none">
                        IN TRANSIT
                      </span>
                      <span className="font-mono text-[#10b981] text-[13px] font-semibold shrink-0">
                        #{link.id}
                      </span>
                      <span className="text-[14px] font-medium text-[var(--text-primary)] truncate max-w-[200px]">
                        {link.productName}
                      </span>
                      <span className="text-[12px] text-[var(--text-muted)] truncate flex-1 leading-normal ml-1">
                        {transitDesc}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-5 shrink-0">
                      <span className="font-mono text-[14px] font-semibold text-[var(--text-primary)]">
                        {symbol}{totalValue.toLocaleString()}
                      </span>
                      {renderButtonDesktop()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
