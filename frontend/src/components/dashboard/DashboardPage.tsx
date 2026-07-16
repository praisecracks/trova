import React, { useState } from 'react';
import { CheckCircle, Megaphone, X, Radio, Sliders } from 'lucide-react';
import { EscrowLink, ActiveTab } from '../../types';
import OnboardingTrack from '../onboarding/OnboardingTrack';

// Import subdivided dashboard elements
import MetricsCards from './MetricsCards';
import DashboardHeader from './DashboardHeader';
import EscrowTable from './EscrowTable';
import WorkdayActionHub from './WorkdayActionHub';
import { buildPublicUrl } from '../../lib/siteConfig';

interface DashboardPageProps {
  escrowLinks: EscrowLink[];
  onCreateLinkClick: () => void;
  onSelectBuyerCheckout: (link: EscrowLink) => void;
  onNavigateTab?: (tab: ActiveTab, id?: string) => void;
  onUpdateStatus?: (id: string, newStatus: EscrowLink['status']) => void;
  profile?: {
    displayName?: string;
    phone?: string;
    bio?: string;
    avatarUrl?: string;
    businessName?: string;
  };
  bankDetailsAdded?: boolean;
  kycStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
  storeItemCount?: number;
  escrowLinkCount?: number;
  onTriggerKYC?: () => void;
}

export default function DashboardPage({
  escrowLinks,
  onCreateLinkClick,
  onSelectBuyerCheckout,
  onNavigateTab,
  onUpdateStatus,
  profile,
  bankDetailsAdded,
  kycStatus,
  storeItemCount,
  escrowLinkCount,
  onTriggerKYC,
}: DashboardPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletedLinks, setDeletedLinks] = useState<EscrowLink[]>(() => {
    try {
      const saved = localStorage.getItem('trustlink_deleted_escrow_links');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [broadcast, setBroadcast] = useState(() => {
    try {
      return localStorage.getItem('trustlink_platform_broadcast') || '';
    } catch (e) {
      return '';
    }
  });

  const broadcastHash = React.useMemo(() => {
    if (!broadcast) return '';
    let hash = 0;
    for (let i = 0; i < broadcast.length; i++) {
      hash = ((hash << 5) - hash) + broadcast.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }, [broadcast]);

  const [dismissed, setDismissed] = useState(() => {
    try {
      if (!broadcast) return true;
      let hash = 0;
      for (let i = 0; i < broadcast.length; i++) {
        hash = ((hash << 5) - hash) + broadcast.charCodeAt(i);
        hash |= 0;
      }
      const hashStr = Math.abs(hash).toString(16);
      return sessionStorage.getItem(`dismissed_broadcast_${hashStr}`) === 'true';
    } catch (e) {
      return false;
    }
  });

  const [isExiting, setIsExiting] = useState(false);
  const [displayMode, setDisplayMode] = useState<'inline' | 'toast'>('inline');

  // Reset search filters when search navigate occurs so highlighted row is guaranteed visible
  React.useEffect(() => {
    const handleResetFilters = () => {
      setSearchTerm('');
      setStatusFilter('all');
    };

    window.addEventListener('trustlink_search_navigate', handleResetFilters);
    
    // Also reset if mounting with an active highlight item
    if (localStorage.getItem('trustlink_dashboard_highlight')) {
      handleResetFilters();
    }

    return () => {
      window.removeEventListener('trustlink_search_navigate', handleResetFilters);
    };
  }, []);

  // Copy Link Simulation
  const handleCopyLink = (linkId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCopiedId(linkId);
    
    const dummyUrl = buildPublicUrl(`/pay/${linkId}`);
    navigator.clipboard?.writeText?.(dummyUrl);

    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleDeleteLink = (linkId: string) => {
    const link = escrowLinks.find(l => l.id === linkId);
    if (!link) return;
    
    const updatedDeleted = [...deletedLinks, { ...link, deletedAt: new Date().toISOString() }];
    setDeletedLinks(updatedDeleted);
    localStorage.setItem('trustlink_deleted_escrow_links', JSON.stringify(updatedDeleted));
  };

  // Search and Filter Links
  const filteredLinks = escrowLinks.filter(link => {
    const matchesSearch = 
      link.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.buyerPhone.includes(searchTerm);
    
    if (statusFilter === 'all') return matchesSearch && !deletedLinks.find(d => d.id === link.id);
    return matchesSearch && link.status === statusFilter && !deletedLinks.find(d => d.id === link.id);
  });

  // Export current list of filtered escrow links and their statuses into a CSV format
  const handleExportCSV = () => {
    if (filteredLinks.length === 0) {
      alert("No escrow links are available to export with current filters.");
      return;
    }

    const headers = [
      'Link ID',
      'Product Name',
      'Category/Type',
      'Status',
      'Currency',
      'Amount',
      'Shipping Fee',
      'Total Value',
      'Buyer Phone',
      'Date Created',
      'Description'
    ];

const rows = filteredLinks.map(link => {
       const shipping = link.shippingFee || 0;
       const totalVal = link.amount + shipping;
       const currCode = link.currencyCode || 'NGN';
       
       // Map status into a human-friendly format
       const statusLabels: Record<string, string> = {
         pending_deposit: 'Awaiting payment',
         deposited: 'Funds Locked (Paid)',
         shipped: 'In Transit',
         delivered: 'Arrived (Pending Release)',
         funds_released: 'Settled & Released',
         disputed: 'Under Dispute',
         expired: 'Expired'
       };
       const friendlyStatus = statusLabels[link.status] || link.status;

      const escapeField = (val: string | number | undefined | null) => {
        if (val === undefined || val === null) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      return [
        escapeField(link.id),
        escapeField(link.productName),
        escapeField(link.transactionType || 'physical'),
        escapeField(friendlyStatus),
        escapeField(currCode),
        link.amount,
        shipping,
        totalVal,
        escapeField(link.buyerPhone),
        escapeField(link.createdAt || link.created_at || ''),
        escapeField(link.description || '')
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    // Save blob with UTF-8 byte order mark to avoid Excel format errors with currency symbols/encodings
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const linkEl = document.createElement('a');
    linkEl.setAttribute('href', url);
    const dateFormatted = new Date().toISOString().substring(0, 10);
    linkEl.setAttribute('download', `trustlink_escrow_links_${dateFormatted}.csv`);
    linkEl.style.visibility = 'hidden';
    document.body.appendChild(linkEl);
    linkEl.click();
    document.body.removeChild(linkEl);
  };

  return (
    <div id="vendor-dashboard-content" className="flex flex-col gap-6 font-sans max-w-7xl mx-auto">
        
      {/* Onboarding Track - appears at top for new sellers */}
      {/* <OnboardingTrack
        profile={{
          displayName: profile?.displayName,
          phone: profile?.phone,
          bio: profile?.bio,
          avatarUrl: profile?.avatarUrl,
          businessName: profile?.businessName,
        }}
        bankDetailsAdded={!!bankDetailsAdded}
        kycStatus={kycStatus || 'unverified'}
        storeItemCount={storeItemCount ?? 0}
        escrowLinkCount={escrowLinkCount ?? 0}
        onNavigate={(destination) => {
          if (destination === 'settings') onNavigateTab?.('settings');
          else if (destination === 'settings-bank') onNavigateTab?.('settings');
          else if (destination === 'kyc') onTriggerKYC?.();
          else if (destination === 'storefront') onNavigateTab?.('storefront');
          else if (destination === 'create-link') onCreateLinkClick();
        }}
      /> */}
      
      {/* Direct injection of animation & pulse ring styles */}
      <style>{`
        @keyframes broadcastSlideIn {
          0% { transform: translateY(-100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes broadcastSlideOut {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(-100%); opacity: 0; }
        }
        .broadcast-slide-in {
          animation: broadcastSlideIn 0.40s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .broadcast-slide-out {
          animation: broadcastSlideOut 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        @keyframes actionDotPulseKeyframes {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .pulse-ring-indicator {
          position: relative;
        }
        .pulse-ring-indicator::after {
          content: '';
          position: absolute;
          top: -4px;
          left: -4px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid #10b981;
          animation: actionDotPulseKeyframes 1.8s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }
      `}</style>

      {broadcast && !dismissed && (
        <div
          id="platform-broadcast-banner"
          className={`relative overflow-hidden transition-all duration-150 rounded-xl flex border border-[var(--border)] border-l-[3px] border-l-[#10b981] ${
            displayMode === 'toast'
              ? 'fixed top-6 right-6 left-6 md:left-auto md:w-[480px] z-[9999] shadow-[0_12px_40px_rgba(0,0,0,0.5)]'
              : 'w-full'
          } ${
            isExiting ? 'broadcast-slide-out' : 'broadcast-slide-in'
          } flex-col md:flex-row md:items-center justify-between p-3 md:p-[14px_16px] gap-3`}
          style={{
            background: 'linear-gradient(to right, rgba(16,185,129,0.03) 0%, transparent 40%), var(--surface)',
          }}
        >
          <div className="flex items-start md:items-center gap-3">
            {/* Emerald icon container 36x36, r=8px */}
            <div className="w-9 h-9 md:w-[36px] md:h-[36px] rounded-lg bg-[rgba(16,185,129,0.12)] flex items-center justify-center shrink-0">
              <Megaphone className="w-[18px] h-[18px] text-[#10b981]" />
            </div>
            
            <div className="flex flex-col gap-0.5 text-left">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-[0.12em] text-[#10b981] font-sans uppercase">
                  PLATFORM BROADCAST
                </span>
                <span className="text-[8px] bg-emerald-500/10 text-[#10b981] px-1 rounded uppercase font-bold tracking-widest font-mono select-none">
                  {displayMode} view
                </span>
              </div>
              <span className="text-[14px] font-normal text-[var(--text-primary)] leading-normal">
                {broadcast}
              </span>
            </div>
          </div>
          
          {/* Controls toolbar */}
          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            {/* Display mode choice dynamic inline pill toggle */}
            <button
              onClick={() => setDisplayMode(displayMode === 'inline' ? 'toast' : 'inline')}
              className="text-[10px] font-bold py-1 px-2 rounded-md bg-[var(--surface2)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all select-none hover:bg-[var(--surface)]"
              title="Toggle broadcast preview layout mode"
            >
              {displayMode === 'toast' ? 'Float as Toast' : 'Dock Inline'}
            </button>

            {/* Premium X dismiss button 28x28, radius=6px */}
            <button 
              onClick={() => {
                setIsExiting(true);
                setTimeout(() => {
                  setDismissed(true);
                  try {
                    sessionStorage.setItem(`dismissed_broadcast_${broadcastHash}`, 'true');
                  } catch (e) {}
                }, 260);
              }}
              className="w-7 h-7 md:w-[28px] md:h-[28px] rounded-[6px] bg-transparent hover:bg-[rgba(120,120,120,0.1)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all duration-150 flex items-center justify-center cursor-pointer shrink-0"
              title="Dismiss Broadcast"
            >
              <X className="w-3.5 h-3.5 md:w-[14px] md:h-[14px]" />
            </button>
          </div>
        </div>
      )}
      

      {/* Interactive Workday Priority Checklist Queue (The Hub Factor) */}
      <WorkdayActionHub 
        escrowLinks={escrowLinks}
        onUpdateStatus={onUpdateStatus}
        onNavigateTab={onNavigateTab}
      />

      {/* 1. KPI analytics summary ribbons */}
      <MetricsCards escrowLinks={filteredLinks} />

      {/* 2. Main list console panel */}
      <section 
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-md)' }}
        className="border rounded-xl overflow-hidden table-container transition-all hover:shadow-[0px_4px_6px_rgba(0,0,0,0.06),0px_8px_20px_rgba(0,0,0,0.10)]"
      >
        
        {/* Actions header with input controls */}
        <DashboardHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onCreateLinkClick={onCreateLinkClick}
          onExportCSVClick={handleExportCSV}
        />

        {/* Copy confirmation toast overlay */}
        {copiedId && (
          <div className="bg-emerald-500 text-black px-4 py-2 text-xs font-bold rounded-md shadow-lg flex items-center gap-2 fixed bottom-6 right-6 z-50">
            <CheckCircle className="w-4 h-4" />
            <span>Copied payout checkout link {copiedId}!</span>
          </div>
        )}

        {/* Mapped transactional item grid / table */}
        <EscrowTable
          filteredLinks={filteredLinks}
          onSelect={onSelectBuyerCheckout}
          onCopyLink={handleCopyLink}
          onDelete={handleDeleteLink}
        />

        {/* Bottom regulated informational bar */}
        <div 
          style={{ backgroundColor: 'var(--surface2)', borderTopColor: 'var(--border)' }}
          className="border-t px-5 py-3 flex items-center justify-between text-[10px] select-none"
        >
          <span style={{ color: 'var(--text-muted)' }}>Regulated under Trova Social Covenants (CBN guidelines)</span>
          <span style={{ color: 'var(--text-muted)' }}>Mapped links: {filteredLinks.length} items cataloged</span>
        </div>

      </section>

    </div>
  );
}