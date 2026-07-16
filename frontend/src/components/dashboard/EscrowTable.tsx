/**
 * EscrowTable.tsx
 * Orchestrates transaction lists, switching rendering depending on media breakpoints:
 *  - Large devices: displays a professional structured table utilizing EscrowTableRow units.
 *  - Small devices: displays a stacked card summary list layout.
 * Props:
 *  - filteredLinks: EscrowLink[] - The matching dataset coordinates.
 *  - onSelect: (link: EscrowLink) => void - Opens the simulator for the selected link.
 *  - onCopyLink: (linkId: string, e: React.MouseEvent) => void - Copy shortcut click handler.
 * Used by: DashboardPage.tsx
 */

import React from 'react';
import { Search, Copy, MoreVertical, Trash2 } from 'lucide-react';
import { EscrowLink } from '../../types';
import EscrowTableRow from './EscrowTableRow';
import { EmptyStateCard } from '../common/EmptyStateCard';
import { getAnimationUrl } from '../../constants/animations';

interface EscrowTableProps {
  filteredLinks: EscrowLink[];
  onSelect: (link: EscrowLink) => void;
  onCopyLink: (linkId: string, e: React.MouseEvent) => void;
  onDelete?: (linkId: string) => void;
}

export default function EscrowTable({
  filteredLinks,
  onSelect,
  onCopyLink,
  onDelete
}: EscrowTableProps) {
const getStatusBadge = (status: EscrowLink['status']) => {
    switch (status) {
      case 'pending_deposit':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--surface2)] border border-[var(--border)] text-[var(--text-primary)] badge-pending-deposit">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
            Awaiting Deposit
          </span>
        );
      case 'deposited':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-500 badge-deposited">
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

  if (filteredLinks.length === 0) {
    return (
      <EmptyStateCard
        title="No agreements mapped"
        description="Amend filters or generate a secure checkout link above."
        animationUrl={getAnimationUrl('escrow')}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Desktop view */}
      <table className="w-full text-left border-collapse hidden md:table">
        <thead>
          <tr 
            style={{ backgroundColor: 'var(--surface)', borderBottomColor: 'var(--border)' }}
            className="border-b text-[9.5px] uppercase tracking-wider font-semibold select-none"
          >
            <th className="py-3 px-5 font-mono" style={{ color: 'var(--text-primary)' }}>ID</th>
            <th className="py-3 px-5 font-mono" style={{ color: 'var(--text-primary)' }}>Product SKU Details</th>
            <th className="py-3 px-5 font-mono" style={{ color: 'var(--text-primary)' }}>AMOUNT</th>
            <th className="py-3 px-5 font-mono" style={{ color: 'var(--text-primary)' }}>Recipient Contact</th>
            <th className="py-3 px-5 font-mono" style={{ color: 'var(--text-primary)' }}>Transaction State</th>
            <th className="py-3 px-5 text-right font-mono" style={{ color: 'var(--text-primary)' }}>Actions</th>
          </tr>
        </thead>
        <tbody className="text-xs" style={{ borderTopColor: 'var(--border)' }}>
          {filteredLinks.map((link) => (
            <EscrowTableRow
              key={link.id}
              link={link}
              onSelect={onSelect}
              onCopyLink={onCopyLink}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>

      {/* Mobile stacked list */}
      <div 
        style={{ borderTopColor: 'var(--border)' }}
        className="flex flex-col md:hidden border-t"
      >
        {filteredLinks.map((link) => (
          <EscrowTableMobileItem
            key={link.id}
            link={link}
            onSelect={onSelect}
            onCopyLink={onCopyLink}
            onDelete={onDelete}
            getStatusBadge={getStatusBadge}
          />
        ))}
      </div>
    </div>
  );
}

interface EscrowTableMobileItemProps {
  key?: React.Key;
  link: EscrowLink;
  onSelect: (link: EscrowLink) => void;
  onCopyLink: (linkId: string, e: React.MouseEvent) => void;
  onDelete?: (linkId: string) => void;
  getStatusBadge: (status: any) => React.ReactNode;
}

function EscrowTableMobileItem({
  link,
  onSelect,
  onCopyLink,
  onDelete,
  getStatusBadge
}: EscrowTableMobileItemProps) {
  const grossTotal = link.amount + link.shippingFee;
  const [isHighlighted, setIsHighlighted] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);

  // Flash the row whenever the escrow status changes (e.g. buyer secures funds
  // in real time) so the seller immediately sees the milestone update.
  const prevStatusMobile = React.useRef(link.status);
  React.useEffect(() => {
    if (prevStatusMobile.current !== link.status) {
      prevStatusMobile.current = link.status;
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
          const el = document.getElementById(`escrow-row-mobile-${link.id}`);
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

  return (
    <div 
      id={`escrow-row-mobile-${link.id}`}
      onClick={() => onSelect(link)}
      className={`p-4 flex flex-col gap-3 hover:bg-[var(--surface2)] border-b transition-all duration-500 cursor-pointer text-left ${isHighlighted ? 'bg-emerald-500/10 border-l-4 border-l-emerald-500 ring-2 ring-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : ''}`}
      style={{ borderBottomColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono font-bold text-emerald-400 text-xs">{link.id}</span>
        {getStatusBadge(link.status)}
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{link.productName}</span>
        <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>To: {link.buyerPhone}</span>
      </div>

      <div className="flex items-center justify-between font-mono text-xs pt-2.5" style={{ borderTopColor: 'var(--border)', borderTopWidth: '1px' }}>
        <div className="flex flex-col">
          <span className="text-[9px] uppercase font-bold font-mono" style={{ color: 'var(--text-muted)' }}>Secured Value</span>
          <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{(link.currencySymbol || '₦')}{grossTotal.toLocaleString()}</span>
        </div>
        
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
 <button
              onClick={(e) => onCopyLink(link.id, e)}
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              className="border px-2 py-1 rounded text-[10px] font-bold copy-btn cursor-pointer transition-all"
            >
              <Copy className="w-3 h-3 text-[var(--text-muted)]" />
              <span>Copy</span>
            </button>
           <button
             onClick={() => onSelect(link)}
             className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-2.5 py-1 rounded text-[10px] font-extrabold portal-btn cursor-pointer font-sans"
           >
             Test
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
                       onClick={() => {
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
      </div>
    </div>
  );
}
