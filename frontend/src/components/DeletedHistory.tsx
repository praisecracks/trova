import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, XCircle } from 'lucide-react';
import { EscrowLink } from '../types';

interface DeletedHistoryProps {
  sellerId?: string | null;
}

export default function DeletedHistory({ sellerId }: DeletedHistoryProps) {
  const [deletedLinks, setDeletedLinks] = useState<EscrowLink[]>([]);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('trustlink_deleted_escrow_links');
      if (saved) {
        const parsed = JSON.parse(saved) as EscrowLink[];
        setDeletedLinks(parsed);
      }
    } catch (e) {}
  }, []);

  const handleRestore = (linkId: string) => {
    const updated = deletedLinks.filter(l => l.id !== linkId);
    setDeletedLinks(updated);
    localStorage.setItem('trustlink_deleted_escrow_links', JSON.stringify(updated));
    setShowRestoreConfirm(null);
  };

  const handlePermanentDelete = (linkId: string) => {
    const updated = deletedLinks.filter(l => l.id !== linkId);
    setDeletedLinks(updated);
    localStorage.setItem('trustlink_deleted_escrow_links', JSON.stringify(updated));
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
                          onClick={() => handlePermanentDelete(link.id)}
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
    </div>
  );
}
