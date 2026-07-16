
import React, { useState } from 'react';
import { AdminSeller, AdminTransaction, getSellerTransactions, updateMerchantStatus } from '../../lib/services/admin';
import { Eye, X, CheckCircle2, Clock, User, ShoppingBag, Calendar, Mail, Phone, MapPin, Building2, ShieldCheck, MoreHorizontal, Copy, ExternalLink, Settings, Ban, Snowflake } from 'lucide-react';
import { EmptyStateCard } from '../common/EmptyStateCard';
import { getAnimationUrl } from '../../constants/animations';

interface MerchantRegistryTabProps {
  sellers: AdminSeller[];
  theme?: 'dark' | 'light';
  refreshData?: () => void;
}

export function MerchantRegistryTab({ sellers, theme, refreshData }: MerchantRegistryTabProps) {
  const isLight = theme === 'light';
  const [selectedSeller, setSelectedSeller] = useState<AdminSeller | null>(null);
  const [sellerTransactions, setSellerTransactions] = useState<AdminTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'kyc' | 'settings'>('overview');

  const handleViewSeller = async (seller: AdminSeller) => {
    setSelectedSeller(seller);
    setActiveTab('overview');
    setLoadingTransactions(true);
    const transactions = await getSellerTransactions(seller.id);
    setSellerTransactions(transactions);
    setLoadingTransactions(false);
  };

  const handleUpdateStatus = async (newStatus: 'active' | 'suspended' | 'frozen') => {
    if (!selectedSeller) return;
    setLoadingAction(true);
    try {
      await updateMerchantStatus(selectedSeller.id, newStatus);
      if (refreshData) refreshData();
      // Update local state
      setSelectedSeller({ ...selectedSeller, status: newStatus });
    } catch (err) {
      console.error('Error updating merchant status:', err);
    } finally {
      setLoadingAction(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return isLight ? 'text-green-700 bg-green-50 border-green-200' : 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'frozen':
        return isLight ? 'text-red-700 bg-red-50 border-red-200' : 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'suspended':
        return isLight ? 'text-yellow-700 bg-yellow-50 border-yellow-200' : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      default:
        return isLight ? 'text-gray-700 bg-gray-50 border-gray-200' : 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getKycColor = (status: string | null) => {
    switch (status) {
      case 'verified':
        return isLight ? 'text-green-700 bg-green-50 border-green-200' : 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'pending':
        return isLight ? 'text-yellow-700 bg-yellow-50 border-yellow-200' : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'rejected':
        return isLight ? 'text-red-700 bg-red-50 border-red-200' : 'text-red-400 bg-red-500/10 border-red-500/20';
      default:
        return isLight ? 'text-gray-700 bg-gray-50 border-gray-200' : 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main Header */}
      <div className={`p-6 rounded-2xl border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-800 shadow-lg'}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className={`text-xl font-bold ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
              Merchant Registry
            </h2>
            <p className={`text-sm mt-1 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
              Manage and monitor all registered merchants on the platform
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-xl border ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-800/50 border-zinc-700'}`}>
              <span className={`text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Total Merchants</span>
              <span className={`ml-2 text-xl font-bold ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>{sellers.length}</span>
            </div>
            <div className={`px-4 py-2 rounded-xl border ${isLight ? 'bg-green-50 border-green-200' : 'bg-green-500/10 border-green-500/20'}`}>
              <span className={`text-xs ${isLight ? 'text-green-600' : 'text-green-400'}`}>Active</span>
              <span className={`ml-2 text-xl font-bold ${isLight ? 'text-green-800' : 'text-green-300'}`}>{sellers.filter(s => s.status === 'active').length}</span>
            </div>
          </div>
        </div>

        {/* Merchant Grid */}
        {sellers.length === 0 ? (
          <EmptyStateCard
            title="No Merchants Yet"
            description="No merchants have registered on the platform yet"
            animationUrl={getAnimationUrl('storeOpening')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sellers.map((seller) => (
              <div
                key={seller.id}
                className={`group relative p-5 rounded-xl border transition-all duration-300 cursor-pointer ${
                  isLight 
                    ? 'bg-white border-zinc-200 hover:border-emerald-500/30 hover:shadow-md' 
                    : 'bg-zinc-800/50 border-zinc-700 hover:border-emerald-500/30 hover:shadow-xl'
                }`}
                onClick={() => handleViewSeller(seller)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/20`}>
                        {(seller.displayName || 'M').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      {seller.kycStatus === 'verified' && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-semibold text-sm truncate ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
                        {seller.displayName || 'Unknown Merchant'}
                      </h4>
                      <p className={`text-xs truncate ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {seller.email}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getStatusColor(seller.status)}`}>
                    {seller.status.charAt(0).toUpperCase() + seller.status.slice(1)}
                  </span>
                </div>

                {seller.businessName && (
                  <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg ${isLight ? 'bg-zinc-50' : 'bg-zinc-700/30'}`}>
                    <Building2 className={`w-3.5 h-3.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`} />
                    <span className={`text-xs truncate ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
                      {seller.businessName}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getKycColor(seller.kycStatus)}`}>
                    {seller.kycStatus === 'verified' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    KYC: {seller.kycStatus || 'Unverified'}
                  </span>
                  <Eye className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Merchant Detail Drawer */}
      {selectedSeller && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedSeller(null)}
          />
          
          {/* Drawer */}
          <div className={`relative w-full max-w-2xl h-full overflow-y-auto ${isLight ? 'bg-white shadow-2xl' : 'bg-zinc-900 shadow-2xl'}`}>
            {/* Drawer Header */}
            <div className={`sticky top-0 z-10 px-6 py-4 border-b ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-900 border-zinc-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-500/20">
                      {(selectedSeller.displayName || 'M').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    {selectedSeller.kycStatus === 'verified' && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
                      {selectedSeller.displayName || 'Unknown Merchant'}
                    </h3>
                    <p className={`text-sm ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {selectedSeller.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSeller(null)}
                  className={`p-2 rounded-xl transition-colors ${
                    isLight 
                      ? 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700' 
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mt-4 overflow-x-auto">
                {['overview', 'transactions', 'kyc', 'settings'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      activeTab === tab
                        ? isLight 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-emerald-500/10 text-emerald-400'
                        : isLight 
                          ? 'text-zinc-500 hover:bg-zinc-100' 
                          : 'text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Drawer Content */}
            <div className="p-6 space-y-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-5">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-4 rounded-xl border ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-800/30 border-zinc-700'}`}>
                      <div className={`text-xs font-semibold mb-1.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Joined</div>
                      <div className={`font-semibold ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
                        {new Date(selectedSeller.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                      <div className={`text-[10px] mt-1 ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {new Date(selectedSeller.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className={`p-4 rounded-xl border ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-800/30 border-zinc-700'}`}>
                      <div className={`text-xs font-semibold mb-1.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Status</div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${getStatusColor(selectedSeller.status)}`}>
                        {selectedSeller.status.charAt(0).toUpperCase() + selectedSeller.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Merchant Info Card */}
                  <div className={`rounded-xl border ${isLight ? 'border-zinc-200 bg-white' : 'border-zinc-700 bg-zinc-800/30'}`}>
                    <div className={`px-4 py-3 border-b ${isLight ? 'border-zinc-200' : 'border-zinc-700'}`}>
                      <h4 className={`text-sm font-semibold ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
                        Merchant Information
                      </h4>
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-1 gap-3">
                        {selectedSeller.businessName && (
                          <div className="flex items-start gap-3">
                            <Building2 className={`w-5 h-5 mt-0.5 ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`} />
                            <div>
                              <div className={`text-[11px] font-semibold mb-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Business Name</div>
                              <div className={`text-sm ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>{selectedSeller.businessName}</div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-start gap-3">
                          <Mail className={`w-5 h-5 mt-0.5 ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`} />
                          <div>
                            <div className={`text-[11px] font-semibold mb-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Email</div>
                            <div className={`text-sm ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>{selectedSeller.email}</div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <ShieldCheck className={`w-5 h-5 mt-0.5 ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`} />
                          <div>
                            <div className={`text-[11px] font-semibold mb-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>KYC Status</div>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${getKycColor(selectedSeller.kycStatus)}`}>
                              {selectedSeller.kycStatus === 'verified' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                              {selectedSeller.kycStatus?.charAt(0).toUpperCase() + selectedSeller.kycStatus?.slice(1) || 'Unverified'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Calendar className={`w-5 h-5 mt-0.5 ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`} />
                          <div>
                            <div className={`text-[11px] font-semibold mb-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Merchant ID</div>
                            <div className="flex items-center gap-2">
                              <code className={`px-2 py-1 rounded-lg text-[11px] font-mono ${isLight ? 'bg-zinc-100 text-zinc-700' : 'bg-zinc-700 text-zinc-300'}`}>
                                {selectedSeller.id}
                              </code>
                              <button
                                onClick={() => navigator.clipboard.writeText(selectedSeller.id)}
                                className={`p-1.5 rounded-lg ${isLight ? 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700'}`}
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Metadata if available */}
                  {selectedSeller.metadata && Object.keys(selectedSeller.metadata).length > 0 && (
                    <div className={`rounded-xl border ${isLight ? 'border-zinc-200 bg-white' : 'border-zinc-700 bg-zinc-800/30'}`}>
                      <div className={`px-4 py-3 border-b ${isLight ? 'border-zinc-200' : 'border-zinc-700'}`}>
                        <h4 className={`text-sm font-semibold ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
                          Additional Metadata
                        </h4>
                      </div>
                      <div className="p-4">
                        <pre className={`text-xs font-mono p-3 rounded-lg overflow-x-auto ${
                          isLight ? 'bg-zinc-50 text-zinc-700' : 'bg-zinc-700/30 text-zinc-300'
                        }`}>
                          {JSON.stringify(selectedSeller.metadata, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Transactions Tab */}
              {activeTab === 'transactions' && (
                <div className="space-y-4">
                  <div className={`flex items-center justify-between ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    <span className="text-xs font-semibold">Recent Transactions</span>
                    <span className="text-xs">{sellerTransactions.length} transactions</span>
                  </div>
                  
                  {loadingTransactions ? (
                    <div className={`text-center py-12 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      Loading transactions...
                    </div>
                  ) : sellerTransactions.length === 0 ? (
                    <div className={`text-center py-12 rounded-xl border-2 border-dashed ${isLight ? 'border-zinc-200 bg-zinc-50' : 'border-zinc-700 bg-zinc-800/30'}`}>
                      <ShoppingBag className={`w-10 h-10 mx-auto mb-3 ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`} />
                      <h4 className={`text-sm font-semibold mb-1 ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>No Transactions</h4>
                      <p className={`text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>This merchant hasn't made any transactions yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sellerTransactions.map((tx) => (
                        <div
                          key={tx.id}
                          className={`p-4 rounded-xl border ${
                            isLight ? 'bg-white border-zinc-200 hover:border-emerald-200' : 'bg-zinc-800/30 border-zinc-700 hover:border-emerald-500/30'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <div className={`font-medium text-sm truncate ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
                                {tx.productName || 'Untitled Transaction'}
                              </div>
                              <div className={`text-[11px] mt-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                {tx.id}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`font-bold text-sm ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
                                {tx.currencySymbol}{tx.amount.toLocaleString()}
                              </div>
                              {tx.shippingFee > 0 && (
                                <div className={`text-[11px] ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                  +{tx.currencySymbol}{tx.shippingFee.toLocaleString()} shipping
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                              tx.status === 'completed' 
                                ? isLight ? 'bg-green-100 text-green-700' : 'bg-green-500/10 text-green-400'
                                : tx.status === 'disputed'
                                ? isLight ? 'bg-red-100 text-red-700' : 'bg-red-500/10 text-red-400'
                                : isLight ? 'bg-yellow-100 text-yellow-700' : 'bg-yellow-500/10 text-yellow-400'
                            }`}>
                              {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                            </span>
                            <span className={`text-[11px] ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                              {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* KYC Tab */}
              {activeTab === 'kyc' && (
                <div className={`p-6 rounded-xl border text-center ${isLight ? 'border-zinc-200 bg-zinc-50' : 'border-zinc-700 bg-zinc-800/30'}`}>
                  <ShieldCheck className={`w-12 h-12 mx-auto mb-3 ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`} />
                  <h4 className={`text-sm font-semibold mb-1 ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>KYC Information</h4>
                  <p className={`text-xs mb-4 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    View KYC applications in the KYC Queue tab
                  </p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${getKycColor(selectedSeller.kycStatus)}`}>
                    {selectedSeller.kycStatus === 'verified' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    {selectedSeller.kycStatus?.charAt(0).toUpperCase() + selectedSeller.kycStatus?.slice(1) || 'Unverified'}
                  </span>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  {/* Status Management */}
                  <div className={`rounded-xl border ${isLight ? 'border-zinc-200 bg-white' : 'border-zinc-700 bg-zinc-800/30'}`}>
                    <div className={`px-4 py-3 border-b ${isLight ? 'border-zinc-200' : 'border-zinc-700'}`}>
                      <h4 className={`text-sm font-semibold ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
                        Account Status
                      </h4>
                    </div>
                    <div className="p-4 space-y-4">
                      <p className={`text-sm ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        Manage the status of this merchant account
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        <button
                          onClick={() => handleUpdateStatus('active')}
                          disabled={loadingAction || selectedSeller.status === 'active'}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all disabled:opacity-50 ${
                            selectedSeller.status === 'active'
                              ? isLight ? 'border-green-500 bg-green-50 text-green-700' : 'border-green-500/30 bg-green-500/10 text-green-400'
                              : isLight ? 'border-zinc-200 hover:bg-zinc-50 text-zinc-700' : 'border-zinc-700 hover:bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="text-sm font-medium">Activate Account</span>
                          </div>
                          {loadingAction && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                        </button>
                        <button
                          onClick={() => handleUpdateStatus('suspended')}
                          disabled={loadingAction || selectedSeller.status === 'suspended'}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all disabled:opacity-50 ${
                            selectedSeller.status === 'suspended'
                              ? isLight ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
                              : isLight ? 'border-zinc-200 hover:bg-zinc-50 text-zinc-700' : 'border-zinc-700 hover:bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Ban className="w-5 h-5" />
                            <span className="text-sm font-medium">Suspend Account</span>
                          </div>
                          {loadingAction && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                        </button>
                        <button
                          onClick={() => handleUpdateStatus('frozen')}
                          disabled={loadingAction || selectedSeller.status === 'frozen'}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all disabled:opacity-50 ${
                            selectedSeller.status === 'frozen'
                              ? isLight ? 'border-red-500 bg-red-50 text-red-700' : 'border-red-500/30 bg-red-500/10 text-red-400'
                              : isLight ? 'border-zinc-200 hover:bg-zinc-50 text-zinc-700' : 'border-zinc-700 hover:bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Snowflake className="w-5 h-5" />
                            <span className="text-sm font-medium">Freeze Account</span>
                          </div>
                          {loadingAction && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


