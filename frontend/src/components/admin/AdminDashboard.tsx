import React, { useState, useEffect } from 'react';
import { Menu, User, Moon, Sun, Loader2, X, Activity, ArrowLeftRight, AlertCircle, Users, ShieldCheck, UserCheck, FileText, Sliders, Wallet, Star } from 'lucide-react';
import { OverviewTab } from './OverviewTab';
import { TransactionsTab } from './TransactionsTab';
import { DisputesTab } from './DisputesTab';
import { PayoutsTab } from './PayoutsTab';
import { MerchantRegistryTab } from './MerchantRegistryTab';
import { UsersTab } from './UsersTab';
import { KYCQueueTab } from './KYCQueueTab';
import { HealthTab } from './HealthTab';
import { AuditTab } from './AuditTab';
import { GlobalSettingsTab } from './GlobalSettingsTab';
import { RatingsTab } from './RatingsTab';
import { BuyerRegistryTab } from './BuyerRegistryTab';
import CurrencyRatesTab from './CurrencyRatesTab';
import { AdminSidebar, type AdminTab } from './AdminSidebar';
import {
  getAllSellers,
  getAllTransactions,
  getAllDisputes,
  getAllPayouts,
  getAllKycApplications,
  getAllProfiles,
  getAllAuditLogs,
  getSystemSettings,
  getAllRatings,
  getAllBuyers,
  AdminSeller,
  AdminTransaction,
  AdminDispute,
  AdminPayout,
  AdminKycApplication,
  AdminProfile,
  AdminAuditLog,
  AdminSystemSetting,
} from '../../lib/services/admin';
import { getCurrentProfile } from '../../lib/auth';

interface AdminDashboardProps {
  onNavigateToLanding: () => void;
  userName?: string;
  userEmail?: string;
  theme?: 'dark' | 'light';
  onThemeToggle?: () => void;
  onLogout?: () => void;
}

const navItems = [
  { id: 'overview' as AdminTab, label: 'Analytics Board', icon: Activity },
  { id: 'transactions' as AdminTab, label: 'All Transactions', icon: ArrowLeftRight },
  { id: 'disputes' as AdminTab, label: 'Disputes', icon: AlertCircle },
  { id: 'payouts' as AdminTab, label: 'Payouts', icon: Wallet },
  { id: 'merchant-registry' as AdminTab, label: 'Verified Merchants', icon: Users },
  { id: 'kyc-queue' as AdminTab, label: 'KYC Approvals', icon: ShieldCheck },
  { id: 'users' as AdminTab, label: 'User Directory', icon: UserCheck },
  { id: 'audit' as AdminTab, label: 'Audit Logs', icon: FileText },
  { id: 'global-settings' as AdminTab, label: 'System Settings', icon: Sliders },
  { id: 'ratings' as AdminTab, label: 'Ratings', icon: Star },
];

export function AdminDashboard({
  onNavigateToLanding,
  userName,
  userEmail,
  theme,
  onThemeToggle,
  onLogout
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // Data states
  const [sellers, setSellers] = useState<AdminSeller[]>([]);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [kycApplications, setKycApplications] = useState<AdminKycApplication[]>([]);
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [systemSettings, setSystemSettings] = useState<AdminSystemSetting[]>([]);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [buyers, setBuyers] = useState<any[]>([]);

  // Load data from database
  const loadData = async () => {
    setLoading(true);
    try {
      const [
        currentProfile,
        sellersData,
        transactionsData,
        disputesData,
        payoutsData,
        kycData,
        profilesData,
        auditData,
        settingsData,
        ratingsData,
        buyersData,
      ] = await Promise.all([
        getCurrentProfile(),
        getAllSellers(),
        getAllTransactions(),
        getAllDisputes(),
        getAllPayouts(),
        getAllKycApplications(),
        getAllProfiles(),
        getAllAuditLogs(),
        getSystemSettings(),
        getAllRatings(),
        getAllBuyers(),
      ]);

      if (currentProfile) {
        // Convert TrovaProfile to AdminProfile
        setAdminProfile({
          id: currentProfile.id,
          email: currentProfile.email,
          role: currentProfile.role,
          displayName: currentProfile.display_name,
          phone: currentProfile.phone,
          metadata: currentProfile.metadata,
          kycStatus: currentProfile.kyc_status,
          createdAt: new Date().toISOString(), // Just a placeholder since we don't get it from getCurrentProfile, but fine for display
          updatedAt: new Date().toISOString(),
        });
      }
      setSellers(sellersData);
      setTransactions(transactionsData);
      setDisputes(disputesData);
      setPayouts(payoutsData);
      setKycApplications(kycData);
      setProfiles(profilesData);
      setAuditLogs(auditData);
      setSystemSettings(settingsData);
      setRatings(ratingsData);
      setBuyers(buyersData);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeDisputes = disputes.filter(d => d.status === 'open' || d.status === 'escalated').length;

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            <p className="text-zinc-400 text-base font-medium">Loading dashboard...</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return <OverviewTab transactions={transactions} payouts={payouts} profiles={profiles} theme={theme} />;
      case 'transactions':
        return <TransactionsTab transactions={transactions} theme={theme} refreshData={loadData} />;
      case 'disputes':
        return <DisputesTab disputes={disputes} theme={theme} refreshData={loadData} />;
      case 'payouts':
        return <PayoutsTab payouts={payouts} theme={theme} />;
      case 'merchant-registry':
        return <MerchantRegistryTab sellers={sellers} theme={theme} refreshData={loadData} />;
      case 'kyc-queue':
        return <KYCQueueTab applications={kycApplications} theme={theme} refreshData={loadData} />;
      case 'users':
                return <UsersTab profiles={profiles} theme={theme} refreshData={loadData} />;
      case 'health':
        return <HealthTab theme={theme} />;
      case 'audit':
        return <AuditTab logs={auditLogs} theme={theme} />;
      case 'global-settings':
        return <GlobalSettingsTab settings={systemSettings} theme={theme} refreshData={loadData} />;
      case 'ratings':
        return <RatingsTab ratings={ratings} theme={theme} refreshData={loadData} />;
      case 'buyer-registry':
        return <BuyerRegistryTab theme={theme} refreshData={loadData} />;
      case 'currency-rates':
        return <CurrencyRatesTab theme={theme} refreshData={loadData} />;
      default:
        return null;
    }
  };

  const isLight = theme === 'light';
  return (
    <div className={`flex h-screen ${isLight ? 'bg-white text-zinc-900' : 'bg-zinc-950 text-white'}`}>
      {/* Admin Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeDisputes={activeDisputes}
        kycApplicationsCount={kycApplications.length}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        onExitToLanding={onNavigateToLanding}
        onLogout={onLogout ? () => setShowLogoutModal(true) : undefined}
        theme={theme}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col h-full overflow-hidden ${isLight ? 'bg-zinc-50' : 'bg-zinc-950'}`}>
        {/* Top Bar for Desktop & Mobile */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isLight ? 'border-zinc-200 bg-white/80' : 'border-zinc-800 bg-zinc-950/80'} backdrop-blur-xl sticky top-0 z-40`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className={`md:hidden flex items-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer ${
                isLight
                  ? 'border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  : 'border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className={`font-bold text-xl ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                {navItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onThemeToggle && (
              <button
                onClick={onThemeToggle}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isLight
                    ? 'border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                    : 'border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}
            {adminProfile && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-base shrink-0 shadow-lg shadow-emerald-500/20">
                  {(adminProfile.displayName || adminProfile.email.split('@')[0] || 'Admin').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col min-w-0">
                  <p className={`text-sm font-semibold ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                    {adminProfile.displayName || adminProfile.email.split('@')[0]}
                  </p>
                  <p className={`text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {adminProfile.email}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {renderTabContent()}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-900 border-zinc-800'} rounded-2xl border p-6 max-w-md w-full shadow-2xl`}>
            <div className="flex justify-between items-start mb-5">
              <h3 className={`text-lg font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>Confirm Logout</h3>
              <button
                onClick={() => setShowLogoutModal(false)}
                className={`p-2 rounded-xl transition-all ${isLight ? 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className={`text-base mb-6 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
              Are you sure you want to log out from the admin dashboard?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLogoutModal(false)}
                className={`px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  isLight
                    ? 'border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                    : 'border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onLogout) {
                    onLogout();
                  }
                  setShowLogoutModal(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
