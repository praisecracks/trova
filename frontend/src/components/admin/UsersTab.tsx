import React, { useState } from 'react';
import { AdminProfile, updateUserRole, updateUserKycStatus } from '../../lib/services/admin';
import { Eye, X, ShieldCheck, User, Shield, Copy, ArrowLeft, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface UsersTabProps {
  profiles: AdminProfile[];
  theme?: 'dark' | 'light';
  refreshData?: () => void;
}

export function UsersTab({ profiles, theme, refreshData }: UsersTabProps) {
  const isLight = theme === 'light';
  const [selectedUser, setSelectedUser] = useState<AdminProfile | null>(null);
  const [filter, setFilter] = useState<'all' | 'admin' | 'seller' | 'buyer'>('all');
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredUsers = filter === 'all'
    ? profiles
    : profiles.filter(p => p.role === filter);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return isLight ? 'text-purple-700 bg-purple-50 border-purple-200' : 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'seller':
        return isLight ? 'text-blue-700 bg-blue-50 border-blue-200' : 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'buyer':
        return isLight ? 'text-gray-700 bg-gray-50 border-gray-200' : 'text-gray-400 bg-gray-500/10 border-gray-500/20';
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

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'seller' | 'buyer') => {
    setIsProcessing(true);
    try {
      await updateUserRole(userId, newRole);
      if (refreshData) refreshData();
      setSelectedUser(prev => prev ? { ...prev, role: newRole } : null);
    } catch (err) {
      console.error('Error updating role:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateKycStatus = async (userId: string, newStatus: string) => {
    setIsProcessing(true);
    try {
      await updateUserKycStatus(userId, newStatus);
      if (refreshData) refreshData();
      setSelectedUser(prev => prev ? { ...prev, kycStatus: newStatus } : null);
    } catch (err) {
      console.error('Error updating KYC status:', err);
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
              User Directory
            </h2>
            <p className={`text-sm mt-1 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
              Manage all users on the platform
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-xl border ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-800/30 border-zinc-700'}`}>
              <span className={`text-[11px] font-semibold ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Total Users</span>
              <span className={`ml-2 text-xl font-bold ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>{profiles.length}</span>
            </div>
            <div className="flex gap-2">
              {(['all', 'admin', 'seller', 'buyer'] as const).map(f => (
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
        </div>

        {/* Users List */}
        {filteredUsers.length === 0 ? (
          <div className={`text-center py-16 rounded-xl border-2 border-dashed ${isLight ? 'border-zinc-200 bg-zinc-50' : 'border-zinc-700 bg-zinc-800/30'}`}>
            <User className={`w-12 h-12 mx-auto mb-4 ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`} />
            <h4 className={`text-lg font-semibold mb-2 ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>No Users</h4>
            <p className={`text-sm ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
              {filter === 'all' ? 'No users have been created yet' : `No ${filter} users found`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredUsers.map(profile => (
              <div
                key={profile.id}
                onClick={() => setSelectedUser(profile)}
                className={`group p-5 rounded-xl border transition-all cursor-pointer ${
                  isLight
                    ? 'bg-white border-zinc-200 hover:border-emerald-300 hover:shadow-md'
                    : 'bg-zinc-800/30 border-zinc-700 hover:border-emerald-500/30 hover:shadow-xl'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/20`}>
                      {profile.displayName?.split(' ').map(n => n[0]).join('').slice(0,2) || profile.email.split('@')[0][0].toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className={`font-semibold text-sm truncate ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>{profile.displayName || 'Unknown'}</div>
                      <div className={`text-[11px] mt-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>{profile.email}</div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold border ${getRoleColor(profile.role)}`}>{profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border ${getKycColor(profile.kycStatus)}`}>
                    {profile.kycStatus === 'verified' ? <CheckCircle2 className="w-3.5 h-3.5" /> : profile.kycStatus === 'pending' ? <Clock className="w-3.5 h-3.5" /> : profile.kycStatus === 'rejected' ? <XCircle className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                    KYC: {profile.kycStatus?.charAt(0).toUpperCase() + profile.kycStatus.slice(1) || 'Unverified'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Detail Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
          <div className={`relative w-full max-w-2xl h-full overflow-y-auto ${isLight ? 'bg-white shadow-2xl' : 'bg-zinc-900 shadow-2xl'}`}>
            <div className={`sticky top-0 z-10 px-6 py-4 border-b ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-900 border-zinc-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedUser(null)} className={`p-1.5 rounded-lg transition-colors ${isLight ? 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h3 className={`text-lg font-bold ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>User Details</h3>
                    <p className={`text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>{selectedUser.email}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border ${getRoleColor(selectedUser.role)}`}>{selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}</span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className={`rounded-xl border ${isLight ? 'border-zinc-200 bg-white' : 'border-zinc-700 bg-zinc-800/30'}`}>
                <div className={`px-4 py-3 border-b ${isLight ? 'border-zinc-200' : 'border-zinc-700'}`}>
                  <h4 className={`text-sm font-semibold ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>User Information</h4>
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-emerald-500/20`}>{selectedUser.displayName?.split(' ').map(n => n[0]).join('').slice(0,2) || selectedUser.email.split('@')[0][0].toUpperCase() || 'U'}</div>
                    <div>
                      <h5 className={`text-sm font-semibold ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>{selectedUser.displayName || 'Unknown User'}</h5>
                      <p className={`text-sm ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>{selectedUser.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className={`text-[11px] font-semibold mb-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>User ID</div>
                      <div className="flex items-center gap-2">
                        <code className={`px-2 py-1 rounded-lg text-[11px] font-mono ${isLight ? 'bg-zinc-100 text-zinc-700' : 'bg-zinc-700 text-zinc-300'}`}>{selectedUser.id}</code>
                        <button onClick={() => navigator.clipboard.writeText(selectedUser.id)} className={`p-1.5 rounded-lg ${isLight ? 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700'}`}><Copy className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    {selectedUser.phone && (
                      <div>
                        <div className={`text-[11px] font-semibold mb-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Phone</div>
                        <div className={`text-sm ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>{selectedUser.phone}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* User Management */}
              <div className={`rounded-xl border ${isLight ? 'border-zinc-200 bg-white' : 'border-zinc-700 bg-zinc-800/30'}`}>
                <div className={`px-4 py-3 border-b ${isLight ? 'border-zinc-200' : 'border-zinc-700'}`}>
                  <h4 className={`text-sm font-semibold ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>Manage User</h4>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <div className={`text-[11px] font-semibold mb-1.5 ${isLight ? 'text-zinc-600' : 'text-zinc-300'}`}>User Role</div>
                    <div className="flex gap-2">
                      {(['admin', 'seller', 'buyer'] as const).map(role => (
                        <button
                          key={role}
                          onClick={() => handleUpdateRole(selectedUser.id, role)}
                          disabled={isProcessing}
                          className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            selectedUser.role === role
                              ? isLight
                                ? 'bg-emerald-500 text-white shadow-sm'
                                : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                              : isLight
                                ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                          }`}
                        >
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className={`text-[11px] font-semibold mb-1.5 ${isLight ? 'text-zinc-600' : 'text-zinc-300'}`}>KYC Status</div>
                    <div className="flex gap-2">
                      {(['pending', 'verified', 'rejected'] as const).map(status => (
                        <button
                          key={status}
                          onClick={() => handleUpdateKycStatus(selectedUser.id, status)}
                          disabled={isProcessing}
                          className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            selectedUser.kycStatus === status
                              ? getKycColor(status)
                              : isLight
                                ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              {selectedUser.metadata && Object.keys(selectedUser.metadata).length > 0 && (
                <div className={`rounded-xl border ${isLight ? 'border-zinc-200 bg-white' : 'border-zinc-700 bg-zinc-800/30'}`}>
                  <div className={`px-4 py-3 border-b ${isLight ? 'border-zinc-200' : 'border-zinc-700'}`}>
                    <h4 className={`text-sm font-semibold ${isLight ? 'text-zinc-900' : 'text-zinc-100'}`}>Metadata</h4>
                  </div>
                  <div className="p-4">
                    <pre className={`text-[11px] font-mono p-3 rounded-lg overflow-x-auto ${isLight ? 'bg-zinc-50 text-zinc-700' : 'bg-zinc-700/30 text-zinc-300'}`}>{JSON.stringify(selectedUser.metadata, null, 2)}</pre>
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
