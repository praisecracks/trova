import React from 'react';
import { Search, Filter, Plus, Download } from 'lucide-react';

interface DashboardHeaderProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  onCreateLinkClick: () => void;
  onExportCSVClick: () => void;
}

export default function DashboardHeader({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onCreateLinkClick,
  onExportCSVClick
}: DashboardHeaderProps) {
  return (
    <div 
      style={{ backgroundColor: 'var(--surface2)', borderBottomColor: 'var(--border)' }}
      className="p-4 border-b flex flex-col md:flex-row items-center justify-between gap-4"
    >
      <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search link, product, phone..."
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            className="w-full border rounded-lg pl-8.5 pr-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500/80 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-[var(--text-muted)]"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="relative w-full sm:w-auto min-w-[130px]">
          <Filter className="w-3 h-3 absolute left-2.5 top-2.5 animate-hover" style={{ color: 'var(--text-muted)' }} />
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            className="w-full border rounded-lg pl-7 pr-8 py-1.5 text-xs focus:outline-none focus:border-emerald-500/80 focus:ring-4 focus:ring-emerald-500/10 appearance-none cursor-pointer transition-all placeholder:text-[var(--text-muted)]"
          >
            <option value="all">All States</option>
            <option value="pending_deposit">Awaiting payment</option>
            <option value="deposited">Locked (Paid)</option>
            <option value="shipped">In Transit</option>
            <option value="delivered">Arrived</option>
            <option value="funds_released">Settled</option>
            <option value="disputed">Disputes</option>
          </select>
        </div>
      </div>

      {/* Button Group for Export & Creation */}
      <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
        <button
          id="vendor-btn-export-csv"
          onClick={onExportCSVClick}
          style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          className="w-full sm:w-auto px-4 py-2 rounded-lg border text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5 hover:opacity-80 active:scale-98"
        >
          <Download className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          <span>Export CSV</span>
        </button>

        <button
          id="vendor-btn-create-header"
          onClick={onCreateLinkClick}
          className="w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5 active:scale-98"
        >
          <Plus className="w-4 h-4 text-black" />
          <span>Create Escrow Link</span>
        </button>
      </div>

    </div>
  );
}
