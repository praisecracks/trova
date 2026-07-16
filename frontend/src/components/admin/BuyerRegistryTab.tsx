import React, { useState, useEffect } from 'react';
import { AdminBuyer, AdminTransaction, getAllBuyers, getBuyerTransactions } from '../../lib/services/admin';
import { Eye, X, Search, Phone, Mail, ShoppingBag, Calendar, DollarSign, ChevronRight, ExternalLink } from 'lucide-react';

interface BuyerRegistryTabProps {
  theme?: 'dark' | 'light';
  refreshData?: () => void;
}

export function BuyerRegistryTab({ theme, refreshData }: BuyerRegistryTabProps) {
  const isLight = theme === 'light';
  const [buyers, setBuyers] = useState<AdminBuyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuyer, setSelectedBuyer] = useState<AdminBuyer | null>(null);
  const [buyerTransactions, setBuyerTransactions] = useState<AdminTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const loadBuyers = async () => {
    setLoading(true);
    try {
      const data = await getAllBuyers();
      setBuyers(data);
    } catch (err) {
      console.error('Error loading buyer registry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBuyers();
  }, []);

  const handleViewBuyer = async (buyer: AdminBuyer) => {
    setSelectedBuyer(buyer);
    setLoadingTransactions(true);
    const txs = await getBuyerTransactions(buyer.buyerPhone || '');
    setBuyerTransactions(txs);
    setLoadingTransactions(false);
  };

  const filteredBuyers = buyers.filter(b => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (b.buyerPhone && b.buyerPhone.includes(q)) ||
      (b.email && b.email.toLowerCase().includes(q)) ||
      (b.displayName && b.displayName.toLowerCase().includes(q)) ||
      (b.buyerName && b.buyerName.toLowerCase().includes(q))
    );
  });

  const formatCurrency = (amount: number, currencyCode = 'USD') => {
    const symbol = currencyCode === 'USD' ? '$' : currencyCode === 'NGN' ? '₦' : currencyCode;
    return `${symbol}${Number(amount).toLocaleString()}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const initials = (name: string | null) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main Header */}
      <div className={`p-6 rounded-2xl border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-800 shadow-lg'}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className={`text-xl font-bold ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
              Buyer Registry
            </h2>
            <p className={`text-sm mt-1 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
              All buyers from public storefront transactions, linked to their orders
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-xl border ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-800/50 border-zinc-700'}`}>
              <span className={`text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Total Buyers</span>
              <span className={`ml-2 text-xl font-bold ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>{buyers.length}</span>
            </div>
            <div className={`px-4 py-2 rounded-xl border ${isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
              <span className={`text-xs ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>Total Orders</span>
              <span className={`ml-2 text-xl font-bold ${isLight ? 'text-emerald-800' : 'text-emerald-300'}`}>
                {buyers.reduce((sum, b) => sum + b.totalOrders, 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by phone, email, or name..."
            className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-emerald-500/50 transition-all ${
              isLight
                ? 'bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400'
                : 'bg-zinc-800/50 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500'
            }`}
          />
        </div>

        {/* Buyers Table */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className={`text-sm ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Loading buyer registry...</p>
            </div>
          </div>
        ) : filteredBuyers.length === 0 ? (
          <div className={`p-12 rounded-xl border text-center ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-800/30 border-zinc-700'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isLight ? 'bg-zinc-100' : 'bg-zinc-800'}`}>
              <ShoppingBag className={`w-8 h-8 ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`} />
            </div>
            <h3 className={`text-lg font-bold mb-1 ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
              {searchQuery ? 'No buyers match your search' : 'No buyers yet'}
            </h3>
            <p className={`text-sm ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
              {searchQuery ? 'Try adjusting your search terms' : 'Buyers will appear here once they place orders from public storefronts'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
                  <th className={`text-left py-3 px-4 text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Buyer</th>
                  <th className={`text-left py-3 px-4 text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Phone</th>
                  <th className={`text-left py-3 px-4 text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Email</th>
                  <th className={`text-right py-3 px-4 text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Orders</th>
                  <th className={`text-right py-3 px-4 text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Total Spent</th>
                  <th className={`text-left py-3 px-4 text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Last Order</th>
                  <th className={`text-right py-3 px-4 text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBuyers.map((buyer) => (
                  <tr
                    key={buyer.id}
                    className={`border-b transition-colors cursor-pointer ${
                      isLight ? 'border-zinc-100 hover:bg-zinc-50' : 'border-zinc-800/50 hover:bg-zinc-800/30'
                    }`}
                    onClick={() => handleViewBuyer(buyer)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                          isLight ? 'bg-zinc-100 text-zinc-700' : 'bg-zinc-800 text-zinc-300'
                        }`}>
                          {initials(buyer.displayName || buyer.buyerName)}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold truncate ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
                            {buyer.displayName || buyer.buyerName || 'Anonymous Buyer'}
                          </p>
                          {buyer.buyerName && buyer.displayName && buyer.buyerName !== buyer.displayName && (
                            <p className={`text-[10px] ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`}>
                              Also known as: {buyer.buyerName}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-mono text-sm ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                        {buyer.buyerPhone || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-sm ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        {buyer.email || buyer.buyerEmail || 'N/A'}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-right text-sm font-semibold ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
                      {buyer.totalOrders}
                    </td>
                    <td className={`py-3 px-4 text-right text-sm font-semibold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                      {formatCurrency(buyer.totalSpent)}
                    </td>
                    <td className={`py-3 px-4 text-sm ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {formatDate(buyer.lastOrderAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewBuyer(buyer);
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          isLight
                            ? 'text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50'
                            : 'text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Buyer Detail Drawer */}
      {selectedBuyer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedBuyer(null)}
          />

          {/* Drawer */}
          <div className={`relative w-full max-w-2xl h-full overflow-y-auto ${isLight ? 'bg-white shadow-2xl' : 'bg-zinc-900 shadow-2xl'}`}>
            {/* Drawer Header */}
            <div className={`sticky top-0 z-10 px-6 py-4 border-b ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-900 border-zinc-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold ${
                    isLight ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {initials(selectedBuyer.displayName || selectedBuyer.buyerName)}
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
                      {selectedBuyer.displayName || selectedBuyer.buyerName || 'Anonymous Buyer'}
                    </h3>
                    <p className={`text-sm ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {selectedBuyer.buyerPhone}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBuyer(null)}
                  className={`p-2 rounded-xl transition-colors ${
                    isLight
                      ? 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="p-6 space-y-6">
              {/* Buyer Info */}
              <div className={`p-5 rounded-xl border ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-800/30 border-zinc-700'}`}>
                <h4 className={`text-sm font-bold mb-3 ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
                  Buyer Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Phone</span>
                    <p className={`text-sm font-mono mt-1 ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
                      {selectedBuyer.buyerPhone || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Email</span>
                    <p className={`text-sm mt-1 ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
                      {selectedBuyer.email || selectedBuyer.buyerEmail || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Total Orders</span>
                    <p className={`text-sm font-bold mt-1 ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
                      {selectedBuyer.totalOrders}
                    </p>
                  </div>
                  <div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Total Spent</span>
                    <p className={`text-sm font-bold mt-1 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                      {formatCurrency(selectedBuyer.totalSpent)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              <div>
                <h4 className={`text-sm font-bold mb-3 ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
                  Transaction History
                </h4>
                {loadingTransactions ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : buyerTransactions.length === 0 ? (
                  <div className={`p-6 rounded-xl border text-center ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-800/30 border-zinc-700'}`}>
                    <p className={`text-sm ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>No transactions found</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {buyerTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className={`p-4 rounded-xl border ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-800/30 border-zinc-700'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <ShoppingBag className={`w-4 h-4 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`} />
                            <span className={`text-sm font-semibold ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
                              {tx.productName || 'Unknown Product'}
                            </span>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                            tx.status === 'completed'
                              ? isLight ? 'bg-green-50 text-green-700 border-green-200' : 'bg-green-500/10 text-green-400 border-green-500/20'
                              : tx.status === 'pending_deposit'
                              ? isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : tx.status === 'disputed'
                              ? isLight ? 'bg-red-50 text-red-700 border-red-200' : 'bg-red-500/10 text-red-400 border-red-500/20'
                              : isLight ? 'bg-zinc-100 text-zinc-700 border-zinc-200' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                          }`}>
                            {tx.status.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className={`text-sm font-mono font-bold ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
                              {formatCurrency(tx.amount, tx.currencyCode)}
                            </span>
                            {tx.shippingFee > 0 && (
                              <span className={`text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                +{formatCurrency(tx.shippingFee, tx.currencyCode)} shipping
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className={`w-3.5 h-3.5 ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`} />
                            <span className={`text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                              {formatDate(tx.createdAt)}
                            </span>
                          </div>
                        </div>
                        {tx.sellerName && (
                          <div className={`mt-2 pt-2 border-t text-xs ${isLight ? 'border-zinc-100 text-zinc-500' : 'border-zinc-700 text-zinc-400'}`}>
                            Seller: {tx.sellerName}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
