/**
 * EscrowTableRow.tsx
 * Renders an individual row representing a transaction in the desktop table.
 * Contains action shortcut triggers, currency format, and status indicators.
 * Props:
 *  - link: EscrowLink - The current transaction metadata model.
 *  - onSelect: (link: EscrowLink) => void - Event callback opening the simulator for this link.
 *  - onCopyLink: (linkId: string, e: React.MouseEvent) => void - Clipboard link builder trigger.
 *  - onDelete?: (linkId: string) => void - Soft-delete trigger for completed transactions.
 * Used by: EscrowTable.tsx
 */

import React from 'react';
import { Copy, ExternalLink, MoreVertical, Trash2 } from 'lucide-react';
import { EscrowLink } from '../../types';
import { buildPublicUrl } from '../../lib/siteConfig';

interface EscrowTableRowProps {
  key?: React.Key;
  link: EscrowLink;
  onSelect: (link: EscrowLink) => void;
  onCopyLink: (linkId: string, e: React.MouseEvent) => void;
  onDelete?: (linkId: string) => void;
}

export default function EscrowTableRow({
  link,
  onSelect,
  onCopyLink,
  onDelete
}: EscrowTableRowProps) {
  const grossTotal = link.amount + link.shippingFee;
  const [isHighlighted, setIsHighlighted] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);

  // Flash the row whenever the escrow status changes (e.g. buyer secures funds
  // in real time) so the seller immediately sees the milestone update.
  const prevStatus = React.useRef(link.status);
  React.useEffect(() => {
    if (prevStatus.current !== link.status) {
      prevStatus.current = link.status;
      setIsHighlighted(true);
      const flashTimer = setTimeout(() => {
        setIsHighlighted(false);
      }, 4000);
      return () => clearTimeout(flashTimer);
    }
  }, [link.status]);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    const handleCheckHighlight = () => {
      const targetId = localStorage.getItem('trustlink_dashboard_highlight');
      if (targetId === link.id) {
        setIsHighlighted(true);
        
        const scrollElement = () => {
          const el = document.getElementById(`escrow-row-${link.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return true;
          }
          return false;
        };

        if (!scrollElement()) {
          setTimeout(scrollElement, 50);
          setTimeout(scrollElement, 150);
          setTimeout(scrollElement, 300);
          setTimeout(scrollElement, 600);
        }

        timer = setTimeout(() => {
          setIsHighlighted(false);
        }, 4000);
      }
    };

    handleCheckHighlight();
    window.addEventListener('trustlink_search_navigate', handleCheckHighlight);
    return () => {
      window.removeEventListener('trustlink_search_navigate', handleCheckHighlight);
      if (timer) clearTimeout(timer);
    };
  }, [link.id]);

  const getStatusBadge = (status: EscrowLink['status']) => {
    switch (status) {
      case 'pending_deposit':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-500/10 border border-zinc-500/20 text-zinc-500 badge-pending-deposit">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
            Awaiting Deposit
          </span>
        );
      case 'deposited':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 border border-amber-500/20 text-text-amber badge-deposited" style={{ color: '#f59e0b' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 active-tracking-step" />
            Locked (Deposited)
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 badge-shipped">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 active-tracking-step" />
            Dispatched (In Transit)
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 badge-delivered">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Delivered (Inspecting)
          </span>
        );
      case 'funds_released':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 badge-funds-released">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Released & Settled
          </span>
        );
      case 'disputed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-500 badge-disputed">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Under Dispute
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-500 badge-expired">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Expired
          </span>
        );
      default:
        return null;
    }
  };

  const currencySymbol = link.currencySymbol || '₦';
  const currencyCode = link.currencyCode || 'NGN';

  return (
    <tr 
      id={`escrow-row-${link.id}`}
      style={{ borderBottomColor: 'var(--border)' }}
      className={`hover:bg-[var(--surface2)] border-b transition-all duration-500 group cursor-pointer text-left ${isHighlighted ? 'bg-emerald-500/10 border-l-4 border-l-emerald-500 ring-2 ring-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : ''}`}
      onClick={() => onSelect(link)}
      title="Test in simulator"
    >
<td className="py-4 px-5 font-mono font-bold" style={{ color: 'var(--brand-emerald)' }}>
         {link.id}
       </td>
      <td className="py-4 px-5">
        <div className="flex flex-col">
          <span className="font-semibold transition-colors" style={{ color: 'var(--text-primary)' }}>{link.productName}</span>
          <span className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{link.description || 'Secure peer-to-peer escrow agreement - inspectable upon delivery.'}</span>
        </div>
      </td>
      <td className="py-4 px-5">
        <div className="flex flex-col">
          <span className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{currencySymbol}{grossTotal.toLocaleString()}</span>
          <span className="text-[9.5px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            ({currencySymbol}{link.amount.toLocaleString()} + {currencySymbol}{link.shippingFee.toLocaleString()} {currencyCode})
          </span>
        </div>
      </td>
      <td className="py-4 px-5">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>{link.buyerPhone}</span>
          <span className="text-[8.5px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-1 py-0.2 rounded font-mono uppercase tracking-wider scale-90 sms-badge">
            SMS OK
          </span>
        </div>
      </td>
      <td className="py-4 px-5">
        {getStatusBadge(link.status)}
      </td>
      <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-2">
          <button
               onClick={(e) => onCopyLink(link.id, e)}
               style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
               className="p-1 px-2 rounded border transition-colors cursor-pointer text-[10px] font-semibold flex items-center gap-1 copy-btn animate-hover"
               title="Copy URL"
             >
               <Copy className="w-3 h-3 text-[var(--text-muted)]" />
               <span>Copy Link</span>
             </button>
           
           <button
             onClick={() => onSelect(link)}
             style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
             className="p-1 px-2 rounded border transition-colors cursor-pointer text-[10px] font-semibold flex items-center gap-1 hover:bg-[var(--surface2)]"
             title="Test in simulator"
           >
             <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
             <span>Test</span>
           </button>
           
            {onDelete && (
              <div 
                className="relative after:content-[''] after:absolute after:top-full after:left-0 after:right-0 after:h-1"
                onMouseEnter={() => setShowMenu(true)}
                onMouseLeave={() => setShowMenu(false)}
              >
                <button
                  className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border2)] transition-all cursor-pointer"
                  title="More actions"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
                
                {showMenu && (
                  <div 
                    className="absolute right-0 top-full mt-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl py-1.5 min-w-[160px] z-50"
                    style={{ boxShadow: 'var(--dropdown-shadow)' }}
                    onMouseEnter={() => setShowMenu(true)}
                    onMouseLeave={() => setShowMenu(false)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(link.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Move to Deleted History</span>
                    </button>
                  </div>
                )}
              </div>
            )}
         </div>
       </td>
    </tr>
  );
}
