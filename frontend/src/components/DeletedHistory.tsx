import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, XCircle, AlertTriangle } from 'lucide-react';
import { EscrowLink } from '../types';

const STORAGE_KEY = 'trustlink_deleted_escrow_links';

interface DeletedHistoryProps {
  sellerId?: string | null;
  onPermanentDelete?: (linkId: string) => void;
}

export default function DeletedHistory({ sellerId, onPermanentDelete }: DeletedHistoryProps) {
  const [deletedLinks, setDeletedLinks] = useState<EscrowLink[]>([]);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as EscrowLink[];
        setDeletedLinks(parsed);
      }
    } catch (e) {}
  }, []);

  const persist = (updated: EscrowLink[]) => {
    setDeletedLinks(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Keep the dashboard's deleted list in sync so removed links stay hidden.
    window.dispatchEvent(new CustomEvent('trustlink_deleted_links_update'));
  };

  const handleRestore = (linkId: string) => {
    const updated = deletedLinks.filter(l => l.id !== linkId);
    persist(updated);
    setShowRestoreConfirm(null);
  };

  const handlePermanentDelete = (linkId: string) => {
    const updated = deletedLinks.filter(l => l.id !== linkId);
    persist(updated);
    // Also remove the link from the live escrow list so it can't re-appear
    // in the dashboard table.
    onPermanentDelete?.(linkId);
    setShowDeleteConfirm(null);
  };

  const handleDeleteAll = () => {
    const ids = deletedLinks.map(l => l.id);
    persist([]);
    ids.forEach(id => onPermanentDelete?.(id));
    setShowDeleteAllConfirm(false);
  };

  return (
    <div className="flex flex-col gap-6 font-sans max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Deleted History</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Recover or permanently remove deleted escrow links.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            {deletedLinks.length} deleted
          </span>
          {deletedLinks.length > 0 && (
            <button
              onClick={() => setShowDeleteAllConfirm(true)}
              className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer text-[10px] font-semibold flex items-center gap-1.5"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete All</span>
            </button>
          )}
        </div>
      </div>

      {deletedLinks.length === 0 ? (
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-zinc-600" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-bold text-zinc-300">No deleted links</h3>
            <p className="text-xs text-zinc-500">
              Links you delete from the dashboard will appear here for recovery.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr 
                  className="border-b text-[9.5px] uppercase tracking-wider font-semibold select-none"
                  style={{ borderBottomColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
                >
                  <th className="py-3 px-5 font-mono" style={{ color: 'var(--text-primary)' }}>ID</th>
                  <th className="py-3 px-5 font-mono" style={{ color: 'var(--text-primary)' }}>Product</th>
                  <th className="py-3 px-5 font-mono" style={{ color: 'var(--text-primary)' }}>Amount</th>
                  <th className="py-3 px-5 font-mono" style={{ color: 'var(--text-primary)' }}>Status</th>
                  <th className="py-3 px-5 font-mono" style={{ color: 'var(--text-primary)' }}>Deleted</th>
                  <th className="py-3 px-5 text-right font-mono" style={{ color: 'var(--text-primary)' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs" style={{ borderTopColor: 'var(--border)' }}>
                {deletedLinks.map((link) => (
                  <tr key={link.id} className="border-b opacity-70 hover:opacity-100 transition-opacity" style={{ borderBottomColor: 'var(--border)' }}>
                    <td className="py-3 px-5 font-mono font-bold" style={{ color: 'var(--brand-emerald)' }}>{link.id}</td>
                    <td className="py-3 px-5">
                      <div className="flex flex-col">
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{link.productName}</span>
                        <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>To: {link.buyerPhone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-5 font-mono" style={{ color: 'var(--text-primary)' }}>
                      {(link.currencySymbol || '₦')}{(link.amount + link.shippingFee).toLocaleString()}
                    </td>
                    <td className="py-3 px-5">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                        {link.status}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-zinc-500 text-[11px]">
                      {link.deletedAt ? new Date(link.deletedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRestore(link.id)}
                          className="px-2.5 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer text-[10px] font-semibold flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(link.id)}
                          className="px-2.5 py-1.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer text-[10px] font-semibold flex items-center gap-1"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Delete Forever</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm permanent delete (single) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-950 border border-red-500/30 rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">Delete permanently?</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This escrow link will be erased forever and cannot be recovered.
            </p>
            <div className="flex items-center gap-3 w-full mt-1">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-zinc-300 hover:bg-zinc-900 font-bold text-xs cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePermanentDelete(showDeleteConfirm)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-xs cursor-pointer transition-all"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete all */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-950 border border-red-500/30 rounded-2xl p-6 max-w-sm w-full flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">Delete all permanently?</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              All {deletedLinks.length} deleted escrow link{deletedLinks.length === 1 ? '' : 's'} will be erased forever and cannot be recovered.
            </p>
            <div className="flex items-center gap-3 w-full mt-1">
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-zinc-300 hover:bg-zinc-900 font-bold text-xs cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-xs cursor-pointer transition-all"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
