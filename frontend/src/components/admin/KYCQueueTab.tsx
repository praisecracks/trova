
import React, { useState } from 'react';
import { AdminKycApplication, updateKycApplication } from '../../lib/services/admin';
import { Eye, X, CheckCircle2, XCircle, Clock, User, FileText, Calendar, Mail, Phone, MapPin, Building2, ShieldCheck, Copy, ArrowLeft } from 'lucide-react';
import { EmptyStateCard } from '../common/EmptyStateCard';
import { getAnimationUrl } from '../../constants/animations';

interface KYCQueueTabProps {
  applications: AdminKycApplication[];
  theme?: 'dark' | 'light';
  refreshData?: () => void;
}

export function KYCQueueTab({ applications, theme, refreshData }: KYCQueueTabProps) {
  const isLight = theme === 'light';
  const [selectedApp, setSelectedApp] = useState<AdminKycApplication | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewing' | 'verified' | 'rejected'>('all');

  const filteredApplications = filter === 'all' 
    ? applications 
    : applications.filter(a => a.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return isLight ? 'text-green-700 bg-green-50 border-green-200' : 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'pending':
        return isLight ? 'text-yellow-700 bg-yellow-50 border-yellow-200' : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'reviewing':
        return isLight ? 'text-blue-700 bg-blue-50 border-blue-200' : 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'rejected':
        return isLight ? 'text-red-700 bg-red-50 border-red-200' : 'text-red-400 bg-red-500/10 border-red-500/20';
      default:
        return isLight ? 'text-gray-700 bg-gray-50 border-gray-200' : 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'reviewing':
        return <Eye className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleApprove = async () => {
    if (!selectedApp) return;
    setIsProcessing(true);
    try {
      await updateKycApplication(selectedApp.id, 'verified');
      if (refreshData) refreshData();
      setSelectedApp(null);
    } catch (err) {
      console.error('Error approving KYC:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    setIsProcessing(true);
    try {
      await updateKycApplication(selectedApp.id, 'rejected', rejectionReason);
      if (refreshData) refreshData();
      setSelectedApp(null);
      setRejectionReason('');
    } catch (err) {
      console.error('Error rejecting KYC:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main Header */}
      <div className={`p-6 rounded-2xl border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-800 shadow-lg'}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className={`text-xl font-bold ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
              KYC Verification Queue
            </h2>
            <p className={`text-sm mt-1 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
              Review and verify merchant KYC applications
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'pending', 'reviewing', 'verified', 'rejected'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === f
                    ? isLight
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                    : isLight
                      ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className={`p-4 rounded-xl border ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-800/30 border-zinc-700'}`}>
            <div className={`text-[11px] font-semibold mb-1 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Total</div>
            <div className={`text-2xl font-bold ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>{applications.length}</div>
          </div>
          <div className={`p-4 rounded-xl border ${isLight ? 'bg-yellow-50 border-yellow-200' : 'bg-yellow-500/10 border-yellow-500/20'}`}>
            <div className={`text-[11px] font-semibold mb-1 ${isLight ? 'text-yellow-600' : 'text-yellow-400'}`}>Pending</div>
            <div className={`text-2xl font-bold ${isLight ? 'text-yellow-700' : 'text-yellow-300'}`}>{applications.filter(a => a.status === 'pending').length}</div>
          </div>
          <div className={`p-4 rounded-xl border ${isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/10 border-blue-500/20'}`}>
            <div className={`text-[11px] font-semibold mb-1 ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>Reviewing</div>
            <div className={`text-2xl font-bold ${isLight ? 'text-blue-700' : 'text-blue-300'}`}>{applications.filter(a => a.status === 'reviewing').length}</div>
          </div>
          <div className={`p-4 rounded-xl border ${isLight ? 'bg-green-50 border-green-200' : 'bg-green-500/10 border-green-500/20'}`}>
            <div className={`text-[11px] font-semibold mb-1 ${isLight ? 'text-green-600' : 'text-green-400'}`}>Verified</div>
            <div className={`text-2xl font-bold ${isLight ? 'text-green-700' : 'text-green-300'}`}>{applications.filter(a => a.status === 'verified').length}</div>
          </div>
          <div className={`p-4 rounded-xl border ${isLight ? 'bg-red-50 border-red-200' : 'bg-red-500/10 border-red-500/20'}`}>
            <div className={`text-[11px] font-semibold mb-1 ${isLight ? 'text-red-600' : 'text-red-400'}`}>Rejected</div>
            <div className={`text-2xl font-bold ${isLight ? 'text-red-700' : 'text-red-300'}`}>{applications.filter(a => a.status === 'rejected').length}</div>
          </div>
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <EmptyStateCard
            title="No Applications"
            description={filter === 'all' ? 'No KYC applications have been submitted yet' : `No ${filter} KYC applications`}
            animationUrl={getAnimationUrl('verified')}
          />
        ) : (
          <div className="space-y-3">
            {filteredApplications.map((app) => (
              <div
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className={`p-5 rounded-xl border transition-all cursor-pointer ${
                  isLight
                    ? 'bg-white border-zinc-200 hover:border-emerald-300 hover:shadow-md'
                    : 'bg-zinc-800/30 border-zinc-700 hover:border-emerald-500/30 hover:shadow-xl'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                      app.status === 'verified' 
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                        : app.status === 'rejected'
                        ? 'bg-gradient-to-br from-red-500 to-rose-600'
                        : 'bg-gradient-to-br from-yellow-500 to-amber-600'
                    }`}>
                      {getStatusIcon(app.status)}
                    </div>
                    <div>
                      <div className={`font-semibold text-sm ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
                        {app.seller?.displayName || 'Unknown Merchant'}
                      </div>
                      <div className={`text-xs mt-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {app.seller?.email || 'No email'}
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${getStatusColor(app.status)}`}>
                    {getStatusIcon(app.status)}
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px]">
                  <div className={`flex items-center gap-1.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Submitted: {new Date(app.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  {app.reviewedAt && (
                    <div className={`flex items-center gap-1.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Reviewed: {new Date(app.reviewedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  )}
                  <div className={`flex items-center gap-1.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    <FileText className="w-3.5 h-3.5" />
                    <span>ID: {app.id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Application Detail Drawer */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedApp(null)}
          />
          
          {/* Drawer */}
          <div className={`relative w-full max-w-2xl h-full overflow-y-auto ${isLight ? 'bg-white shadow-2xl' : 'bg-zinc-900 shadow-2xl'}`}>
            {/* Drawer Header */}
            <div className={`sticky top-0 z-10 px-6 py-4 border-b ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-900 border-zinc-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedApp(null)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isLight
                        ? 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h3 className={`text-lg font-bold ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
                      KYC Application
                    </h3>
                    <p className={`text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {selectedApp.seller?.displayName || 'Unknown Merchant'}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border ${getStatusColor(selectedApp.status)}`}>
                  {getStatusIcon(selectedApp.status)}
                  {selectedApp.status.charAt(0).toUpperCase() + selectedApp.status.slice(1)}
                </span>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="p-6 space-y-6">
              {/* Merchant Info */}
              <div className={`rounded-xl border ${isLight ? 'border-zinc-200 bg-white' : 'border-zinc-700 bg-zinc-800/30'}`}>
                <div className={`px-4 py-3 border-b ${isLight ? 'border-zinc-200' : 'border-zinc-700'}`}>
                  <h4 className={`text-sm font-semibold ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
                    Merchant Details
                  </h4>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className={`text-[11px] font-semibold mb-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Display Name</div>
                      <div className={`text-sm ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>{selectedApp.seller?.displayName || 'N/A'}</div>
                    </div>
                    <div>
                      <div className={`text-[11px] font-semibold mb-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Email</div>
                      <div className={`text-sm ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>{selectedApp.seller?.email || 'N/A'}</div>
                    </div>
                  </div>
                  <div>
                    <div className={`text-[11px] font-semibold mb-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Application ID</div>
                    <div className="flex items-center gap-2">
                      <code className={`px-2 py-1 rounded-lg text-[11px] font-mono ${isLight ? 'bg-zinc-100 text-zinc-700' : 'bg-zinc-700 text-zinc-300'}`}>{selectedApp.id}</code>
                      <button onClick={() => navigator.clipboard.writeText(selectedApp.id)} className={`p-1.5 rounded-lg ${isLight ? 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700'}`}>
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* KYC Data Fields */}
              <div className={`rounded-xl border ${isLight ? 'border-zinc-200 bg-white' : 'border-zinc-700 bg-zinc-800/30'}`}>
                <div className={`px-4 py-3 border-b ${isLight ? 'border-zinc-200' : 'border-zinc-700'}`}>
                  <h4 className={`text-sm font-semibold ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>
                    Submitted KYC Information
                  </h4>
                </div>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className={`text-[11px] font-semibold mb-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Full Legal Name</div>
                      <div className={`text-sm ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>{(selectedApp as any).fullName || (selectedApp.kycData as any)?.fullName || 'N/A'}</div>
                    </div>
                    <div>
                      <div className={`text-[11px] font-semibold mb-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Phone</div>
                      <div className={`text-sm ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>{(selectedApp as any).phone || (selectedApp.kycData as any)?.phone || 'N/A'}</div>
                    </div>
                    <div>
                      <div className={`text-[11px] font-semibold mb-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>ID Type</div>
                      <div className={`text-sm ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>{(selectedApp as any).idType || (selectedApp.kycData as any)?.idType || 'N/A'}</div>
                    </div>
                    <div>
                      <div className={`text-[11px] font-semibold mb-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>ID Number</div>
                      <div className={`text-sm ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>{(selectedApp as any).idNumber || (selectedApp.kycData as any)?.idNumber || 'N/A'}</div>
                    </div>
                    <div>
                      <div className={`text-[11px] font-semibold mb-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Date of Birth</div>
                      <div className={`text-sm ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>{(selectedApp as any).dateOfBirth || (selectedApp.kycData as any)?.dateOfBirth || 'N/A'}</div>
                    </div>
                    <div>
                      <div className={`text-[11px] font-semibold mb-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Business Name</div>
                      <div className={`text-sm ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>{(selectedApp as any).businessName || (selectedApp.kycData as any)?.businessName || 'N/A'}</div>
                    </div>
                    <div>
                      <div className={`text-[11px] font-semibold mb-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Country</div>
                      <div className={`text-sm ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>{(selectedApp as any).country || (selectedApp.kycData as any)?.country || 'N/A'}</div>
                    </div>
                    <div>
                      <div className={`text-[11px] font-semibold mb-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>State/Region</div>
                      <div className={`text-sm ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>{(selectedApp as any).stateRegion || (selectedApp.kycData as any)?.stateRegion || 'N/A'}</div>
                    </div>
                    <div>
                      <div className={`text-[11px] font-semibold mb-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>City</div>
                      <div className={`text-sm ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>{(selectedApp as any).city || (selectedApp.kycData as any)?.city || 'N/A'}</div>
                    </div>
                    <div>
                      <div className={`text-[11px] font-semibold mb-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Street Address</div>
                      <div className={`text-sm ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>{(selectedApp as any).streetAddress || (selectedApp.kycData as any)?.streetAddress || 'N/A'}</div>
                    </div>
                     <div>
                       <div className={`text-[11px] font-semibold mb-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>ID File Name</div>
                       <div className={`text-sm ${isLight ? 'text-zinc-800' : 'text-zinc-200'} flex items-center gap-2`}>
                         {(selectedApp as any).uploadedIdFileName || (selectedApp.kycData as any)?.uploadedIdFileName || 'N/A'}
                         {((selectedApp as any).uploadedIdFileUrl || (selectedApp.kycData as any)?.uploadedIdFileUrl) && (
                           <a
                             href={(selectedApp as any).uploadedIdFileUrl || (selectedApp.kycData as any)?.uploadedIdFileUrl}
                             target="_blank"
                             rel="noopener noreferrer"
                             className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${isLight ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}
                           >
                             <Eye className="w-3 h-3" />
                             Review File
                           </a>
                         )}
                       </div>
                     </div>
                  </div>

                  {/* Raw KYC Data */}
                  {selectedApp.kycData && (
                    <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700">
                      <div className={`text-[11px] font-semibold mb-2 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Raw KYC Data</div>
                      <pre className={`text-[11px] font-mono p-3 rounded-lg overflow-x-auto ${isLight ? 'bg-zinc-50 text-zinc-700' : 'bg-zinc-700/30 text-zinc-300'}`}>{JSON.stringify(selectedApp.kycData, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Review Comments */}
              {selectedApp.reviewComments && (
                <div className={`rounded-xl border ${isLight ? 'border-zinc-200 bg-white' : 'border-zinc-700 bg-zinc-800/30'}`}>
                  <div className={`px-4 py-3 border-b ${isLight ? 'border-zinc-200' : 'border-zinc-700'}`}>
                    <h4 className={`text-sm font-semibold ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>Review Comments</h4>
                  </div>
                  <div className="p-4">
                    <p className={`text-sm ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>{selectedApp.reviewComments}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              {(selectedApp.status === 'pending' || selectedApp.status === 'reviewing') && (
                <div className="space-y-4">
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1.5 ${isLight ? 'text-zinc-600' : 'text-zinc-300'}`}>
                      Rejection Reason (Optional)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                      className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                        isLight
                          ? 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-500'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500'
                      }`}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleReject}
                      disabled={isProcessing}
                      className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        isLight
                          ? 'bg-red-50 text-red-700 hover:bg-red-100'
                          : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                      }`}
                    >
                      {isProcessing ? 'Rejecting...' : 'Reject Application'}
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={isProcessing}
                      className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        isLight ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm' : 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/25'
                      }`}
                    >
                      {isProcessing ? 'Approving...' : 'Approve Application'}
                    </button>
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
