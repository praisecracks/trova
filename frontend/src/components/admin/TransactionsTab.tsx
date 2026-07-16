import React, { useState } from 'react';
import { AdminTransaction, updateTransactionStatus } from '../../lib/services/admin';
import {
  ShoppingCart,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  CreditCard,
  Truck,
  DollarSign,
} from 'lucide-react';

interface TransactionsTabProps {
  transactions: AdminTransaction[];
  theme?: 'dark' | 'light';
  refreshData?: () => void;
}

export function TransactionsTab({
  transactions,
  theme,
  refreshData,
}: TransactionsTabProps) {
  const isLight = theme === 'light';
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] =
    useState<AdminTransaction | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.buyerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.buyerPhone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.sellerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !filterStatus || tx.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: isLight
        ? 'bg-amber-100 text-amber-700'
        : 'bg-amber-500/10 text-amber-400',
      payment_received: isLight
        ? 'bg-blue-100 text-blue-700'
        : 'bg-blue-500/10 text-blue-400',
      shipped: isLight
        ? 'bg-purple-100 text-purple-700'
        : 'bg-purple-500/10 text-purple-400',
      delivered: isLight
        ? 'bg-indigo-100 text-indigo-700'
        : 'bg-indigo-500/10 text-indigo-400',
      funds_released: isLight
        ? 'bg-emerald-100 text-emerald-700'
        : 'bg-emerald-500/10 text-emerald-400',
      refunded: isLight
        ? 'bg-red-100 text-red-700'
        : 'bg-red-500/10 text-red-400',
      disputed: isLight
        ? 'bg-rose-100 text-rose-700'
        : 'bg-rose-500/10 text-rose-400',
    };
    return (
      styles[status] ||
      (isLight ? 'bg-zinc-100 text-zinc-700' : 'bg-zinc-700 text-zinc-400')
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'funds_released':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'refunded':
        return <XCircle className="w-4 h-4" />;
      case 'disputed':
        return <AlertCircle className="w-4 h-4" />;
      case 'shipped':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'payment_received':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleUpdateStatus = async (txId: string, newStatus: string) => {
    setLoading(txId);
    try {
      await updateTransactionStatus(txId, newStatus, 'admin');
      if (refreshData) refreshData();
      setSelectedTransaction(null);
    } catch (err) {
      console.error('Error updating transaction:', err);
    } finally {
      setLoading(null);
    }
  };

  const stats = {
    total: transactions.length,
    pending: transactions.filter(
      (tx) => tx.status === 'pending' || tx.status === 'payment_received'
    ).length,
    delivered: transactions.filter(
      (tx) => tx.status === 'delivered' || tx.status === 'funds_released'
    ).length,
    disputed: transactions.filter((tx) => tx.status === 'disputed').length,
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`p-6 rounded-2xl border ${
          isLight
            ? 'bg-white border-zinc-200 shadow-sm'
            : 'bg-zinc-900 border-zinc-800 shadow-lg'
        }`}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              isLight ? 'bg-blue-50' : 'bg-blue-500/10'
            }`}
          >
            <ShoppingCart
              className={`w-6 h-6 ${
                isLight ? 'text-blue-600' : 'text-blue-400'
              }`}
            />
          </div>
          <div>
            <h2
              className={`text-xl font-bold ${
                isLight ? 'text-zinc-900' : 'text-zinc-100'
              }`}
            >
              All Transactions
            </h2>
            <p
              className={`text-sm mt-1 ${
                isLight ? 'text-zinc-500' : 'text-zinc-400'
              }`}
            >
              View and manage all platform escrow transactions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div
            className={`p-4 rounded-xl border ${
              isLight
                ? 'border-zinc-200 bg-zinc-50'
                : 'border-zinc-700 bg-zinc-800/30'
            }`}
          >
            <p
              className={`text-xs font-semibold ${
                isLight ? 'text-zinc-500' : 'text-zinc-400'
              }`}
            >
              Total
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${
                isLight ? 'text-zinc-900' : 'text-zinc-100'
              }`}
            >
              {stats.total}
            </p>
          </div>
          <div
            className={`p-4 rounded-xl border ${
              isLight
                ? 'border-amber-200 bg-amber-50'
                : 'border-amber-800/30 bg-amber-500/10'
            }`}
          >
            <p
              className={`text-xs font-semibold ${
                isLight ? 'text-amber-600' : 'text-amber-400'
              }`}
            >
              Pending
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${
                isLight ? 'text-amber-700' : 'text-amber-300'
              }`}
            >
              {stats.pending}
            </p>
          </div>
          <div
            className={`p-4 rounded-xl border ${
              isLight
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-emerald-800/30 bg-emerald-500/10'
            }`}
          >
            <p
              className={`text-xs font-semibold ${
                isLight ? 'text-emerald-600' : 'text-emerald-400'
              }`}
            >
              Completed
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${
                isLight ? 'text-emerald-700' : 'text-emerald-300'
              }`}
            >
              {stats.delivered}
            </p>
          </div>
          <div
            className={`p-4 rounded-xl border ${
              isLight
                ? 'border-rose-200 bg-rose-50'
                : 'border-rose-800/30 bg-rose-500/10'
            }`}
          >
            <p
              className={`text-xs font-semibold ${
                isLight ? 'text-rose-600' : 'text-rose-400'
              }`}
            >
              Disputed
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${
                isLight ? 'text-rose-700' : 'text-rose-300'
              }`}
            >
              {stats.disputed}
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div
            className={`relative flex-1 ${
              isLight
                ? 'bg-zinc-50 border-zinc-200'
                : 'bg-zinc-800/50 border-zinc-700'
            } border rounded-xl px-4 py-3 flex items-center gap-3`}
          >
            <Search
              className={`w-4 h-4 ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`}
            />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`flex-1 bg-transparent border-none outline-none text-sm ${
                isLight ? 'text-zinc-900' : 'text-zinc-100'
              }`}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            <button
              onClick={() => setFilterStatus(null)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                !filterStatus
                  ? isLight
                    ? 'bg-zinc-800 text-white'
                    : 'bg-zinc-100 text-zinc-900'
                  : isLight
                  ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              All
            </button>
            {[
              'pending',
              'payment_received',
              'shipped',
              'delivered',
              'funds_released',
              'disputed',
              'refunded',
            ].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  filterStatus === status
                    ? isLight
                      ? 'bg-zinc-800 text-white'
                      : 'bg-zinc-100 text-zinc-900'
                    : isLight
                    ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {formatStatus(status)}
              </button>
            ))}
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart
              className={`w-12 h-12 mx-auto mb-4 ${
                isLight ? 'text-zinc-300' : 'text-zinc-600'
              }`}
            />
            <p
              className={`text-sm ${
                isLight ? 'text-zinc-500' : 'text-zinc-400'
              }`}
            >
              {searchQuery || filterStatus
                ? 'No transactions match your filters'
                : 'No transactions yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                onClick={() => setSelectedTransaction(tx)}
                className={`p-5 rounded-xl border transition-all hover:shadow-sm cursor-pointer ${
                  isLight
                    ? 'bg-white border-zinc-200'
                    : 'bg-zinc-800/30 border-zinc-700'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h4
                        className={`font-semibold truncate ${
                          isLight ? 'text-zinc-900' : 'text-zinc-100'
                        }`}
                      >
                        {tx.productName || 'Unknown Product'}
                      </h4>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${getStatusBadge(
                          tx.status
                        )}`}
                      >
                        {getStatusIcon(tx.status)}
                        {formatStatus(tx.status)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span
                        className={`${
                          isLight ? 'text-zinc-500' : 'text-zinc-400'
                        }`}
                      >
                        <span className="font-medium">Buyer:</span>{' '}
                        {tx.buyerEmail || 'N/A'}
                      </span>
                      {tx.buyerPhone && (
                        <span
                          className={`font-mono text-xs ${
                            isLight ? 'text-emerald-700' : 'text-emerald-400'
                          }`}
                        >
                          {tx.buyerPhone}
                        </span>
                      )}
                      <span
                        className={`${
                          isLight ? 'text-zinc-500' : 'text-zinc-400'
                        }`}
                      >
                        <span className="font-medium">Seller:</span>{' '}
                        {tx.sellerName || 'N/A'}
                      </span>
                      <span
                        className={`font-mono ${
                          isLight ? 'text-zinc-400' : 'text-zinc-500'
                        }`}
                      >
                        {tx.id.substring(0, 12)}...
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p
                        className={`font-bold text-lg ${
                          isLight ? 'text-zinc-900' : 'text-zinc-100'
                        }`}
                      >
                        {tx.currencySymbol}
                        {tx.amount.toLocaleString()}
                      </p>
                      {tx.shippingFee > 0 && (
                        <p
                          className={`text-xs ${
                            isLight ? 'text-zinc-500' : 'text-zinc-400'
                          }`}
                        >
                          + {tx.currencySymbol}
                          {tx.shippingFee.toLocaleString()} shipping
                        </p>
                      )}
                    </div>
                    <button
                      className={`p-2 rounded-lg transition-colors ${
                        isLight
                          ? 'hover:bg-zinc-100 text-zinc-600'
                          : 'hover:bg-zinc-700 text-zinc-400'
                      }`}
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedTransaction(null)}
          />
          <div
            className={`relative w-full max-w-lg h-full overflow-y-auto ${
              isLight ? 'bg-white' : 'bg-zinc-900'
            } shadow-2xl border-l ${
              isLight ? 'border-zinc-200' : 'border-zinc-800'
            }`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3
                  className={`text-lg font-bold ${
                    isLight ? 'text-zinc-900' : 'text-zinc-100'
                  }`}
                >
                  Transaction Details
                </h3>
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className={`p-2 rounded-lg transition-colors ${
                    isLight
                      ? 'hover:bg-zinc-100 text-zinc-600'
                      : 'hover:bg-zinc-800 text-zinc-400'
                  }`}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div
                  className={`p-4 rounded-xl ${
                    isLight ? 'bg-zinc-50' : 'bg-zinc-800/50'
                  }`}
                >
                  <h4
                    className={`text-sm font-semibold mb-3 ${
                      isLight ? 'text-zinc-700' : 'text-zinc-300'
                    }`}
                  >
                    Status
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2 ${getStatusBadge(
                        selectedTransaction.status
                      )}`}
                    >
                      {getStatusIcon(selectedTransaction.status)}
                      {formatStatus(selectedTransaction.status)}
                    </span>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    isLight ? 'bg-zinc-50' : 'bg-zinc-800/50'
                  }`}
                >
                  <h4
                    className={`text-sm font-semibold mb-3 ${
                      isLight ? 'text-zinc-700' : 'text-zinc-300'
                    }`}
                  >
                    Product Details
                  </h4>
                  <p
                    className={`font-semibold ${
                      isLight ? 'text-zinc-900' : 'text-zinc-100'
                    }`}
                  >
                    {selectedTransaction.productName || 'Unknown Product'}
                  </p>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <DollarSign
                        className={`w-4 h-4 ${
                          isLight ? 'text-zinc-400' : 'text-zinc-500'
                        }`}
                      />
                      <span
                        className={`font-bold ${
                          isLight ? 'text-zinc-900' : 'text-zinc-100'
                        }`}
                      >
                        {selectedTransaction.currencySymbol}
                        {selectedTransaction.amount.toLocaleString()}
                      </span>
                    </div>
                    {selectedTransaction.shippingFee > 0 && (
                      <div className="flex items-center gap-2">
                        <Truck
                          className={`w-4 h-4 ${
                            isLight ? 'text-zinc-400' : 'text-zinc-500'
                          }`}
                        />
                        <span
                          className={`${
                            isLight ? 'text-zinc-600' : 'text-zinc-400'
                          }`}
                        >
                          + {selectedTransaction.currencySymbol}
                          {selectedTransaction.shippingFee.toLocaleString()}{' '}
                          shipping
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    isLight ? 'bg-zinc-50' : 'bg-zinc-800/50'
                  }`}
                >
                  <h4
                    className={`text-sm font-semibold mb-3 ${
                      isLight ? 'text-zinc-700' : 'text-zinc-300'
                    }`}
                  >
                    Parties
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p
                        className={`text-xs font-semibold ${
                          isLight ? 'text-zinc-500' : 'text-zinc-400'
                        }`}
                      >
                        Buyer
                      </p>
                      <p
                        className={`font-medium ${
                          isLight ? 'text-zinc-900' : 'text-zinc-100'
                        }`}
                      >
                        {selectedTransaction.buyerEmail || 'N/A'}
                      </p>
                      {selectedTransaction.buyerPhone && (
                        <p
                          className={`text-sm ${
                            isLight ? 'text-zinc-600' : 'text-zinc-400'
                          }`}
                        >
                          {selectedTransaction.buyerPhone}
                        </p>
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-xs font-semibold ${
                          isLight ? 'text-zinc-500' : 'text-zinc-400'
                        }`}
                      >
                        Seller
                      </p>
                      <p
                        className={`font-medium ${
                          isLight ? 'text-zinc-900' : 'text-zinc-100'
                        }`}
                      >
                        {selectedTransaction.sellerName || 'N/A'}
                      </p>
                      {selectedTransaction.sellerPhone && (
                        <p
                          className={`text-sm ${
                            isLight ? 'text-zinc-600' : 'text-zinc-400'
                          }`}
                        >
                          {selectedTransaction.sellerPhone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    isLight ? 'bg-zinc-50' : 'bg-zinc-800/50'
                  }`}
                >
                  <h4
                    className={`text-sm font-semibold mb-3 ${
                      isLight ? 'text-zinc-700' : 'text-zinc-300'
                    }`}
                  >
                    Info
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span
                        className={`${
                          isLight ? 'text-zinc-500' : 'text-zinc-400'
                        }`}
                      >
                        Transaction ID
                      </span>
                      <span
                        className={`font-mono ${
                          isLight ? 'text-zinc-900' : 'text-zinc-100'
                        }`}
                      >
                        {selectedTransaction.id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span
                        className={`${
                          isLight ? 'text-zinc-500' : 'text-zinc-400'
                        }`}
                      >
                        Created
                      </span>
                      <span
                        className={`${
                          isLight ? 'text-zinc-900' : 'text-zinc-100'
                        }`}
                      >
                        {new Date(selectedTransaction.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span
                        className={`${
                          isLight ? 'text-zinc-500' : 'text-zinc-400'
                        }`}
                      >
                        Updated
                      </span>
                      <span
                        className={`${
                          isLight ? 'text-zinc-900' : 'text-zinc-100'
                        }`}
                      >
                        {new Date(selectedTransaction.updatedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl border ${
                    isLight
                      ? 'border-amber-200 bg-amber-50/50'
                      : 'border-amber-800/30 bg-amber-500/10'
                  }`}
                >
                  <h4
                    className={`text-sm font-semibold mb-3 ${
                      isLight ? 'text-amber-700' : 'text-amber-400'
                    }`}
                  >
                    Admin Actions
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'payment_received',
                      'shipped',
                      'delivered',
                      'funds_released',
                      'refunded',
                    ].map((status) => (
                      <button
                        key={status}
                        onClick={() =>
                          handleUpdateStatus(selectedTransaction.id, status)
                        }
                        disabled={loading === selectedTransaction.id}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${
                          isLight
                            ? 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                            : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                        }`}
                      >
                        {loading === selectedTransaction.id ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" />
                        ) : (
                          formatStatus(status)
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
