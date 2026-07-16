import React from 'react';
import { 
  ShieldCheck, 
  ArrowLeftRight, 
  AlertCircle, 
  Users, 
  Activity, 
  UserCheck, 
  FileText, 
  Sliders, 
  Wallet,
  Star,
  DollarSign,
  X,
  LogOut,
  UserRound
} from 'lucide-react';

export type AdminTab =
  | 'overview'
  | 'transactions'
  | 'disputes'
  | 'payouts'
  | 'merchant-registry'
  | 'buyer-registry'
  | 'users'
  | 'kyc-queue'
  | 'health'
  | 'audit'
  | 'global-settings'
  | 'ratings'
  | 'currency-rates';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  activeDisputes: number;
  kycApplicationsCount: number;
  isOpen?: boolean;
  onClose?: () => void;
  onExitToLanding?: () => void;
  onLogout?: () => void;
  theme?: 'dark' | 'light';
}

const navItems = [
  { id: 'overview' as AdminTab, label: 'Analytics Board', icon: Activity },
  { id: 'transactions' as AdminTab, label: 'All Transactions', icon: ArrowLeftRight },
  { id: 'disputes' as AdminTab, label: 'Disputes', icon: AlertCircle },
  { id: 'payouts' as AdminTab, label: 'Payouts', icon: Wallet },
  { id: 'merchant-registry' as AdminTab, label: 'Verified Merchants', icon: Users },
  { id: 'buyer-registry' as AdminTab, label: 'Buyer Registry', icon: UserRound },
  { id: 'kyc-queue' as AdminTab, label: 'KYC Approvals', icon: ShieldCheck },
  { id: 'users' as AdminTab, label: 'User Directory', icon: UserCheck },
  { id: 'audit' as AdminTab, label: 'Audit Logs', icon: FileText },
  { id: 'global-settings' as AdminTab, label: 'System Settings', icon: Sliders },
  { id: 'ratings' as AdminTab, label: 'Ratings', icon: Star },
  { id: 'currency-rates' as AdminTab, label: 'Currency Rates', icon: DollarSign },
];

export function AdminSidebar({ 
  activeTab, 
  setActiveTab, 
  activeDisputes, 
  kycApplicationsCount, 
  isOpen = false, 
  onClose, 
  onExitToLanding,
  onLogout,
  theme
}: AdminSidebarProps) {
  const isLight = theme === 'light';
  const handleTabClick = (tabId: AdminTab) => {
    setActiveTab(tabId);
    if (onClose) onClose();
  };

  const renderNavContent = () => (
    <div className={`flex flex-col h-full border-r ${isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'}`}>
      {/* Brand & Logo Header */}
      <div className={`px-5 py-6 border-b flex items-center justify-between ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <svg viewBox="0 0 48 56" className="w-6 h-7 shrink-0" xmlns="http://www.w3.org/2000/svg">
              <polyline points="12,14 24,36 36,14" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="14" x2="36" y2="14" stroke="white" strokeWidth="4" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="flex flex-col">
            <h1 className={`font-bold text-lg tracking-tight ${isLight ? 'text-zinc-900' : 'text-white'}`}>
              Trova
            </h1>
            <span className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">
              Admin Panel
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-1 no-scrollbar min-h-0">
        <span className={`text-xs font-semibold uppercase tracking-widest px-3 mb-3 ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`}>
          Menu
        </span>
        
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left cursor-pointer ${
                isActive 
                  ? (isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20')
                  : (isLight ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100' : 'text-zinc-400 hover:text-white hover:bg-zinc-900')
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? (isLight ? 'text-emerald-700' : 'text-emerald-400') : (isLight ? 'text-zinc-500' : 'text-zinc-400')}`} />
              <span className="flex-1">
                {item.label}
              </span>
              {item.id === 'disputes' && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isLight ? 'bg-red-50 text-red-700' : 'bg-red-500/10 text-red-400'}`}>
                  {activeDisputes}
                </span>
              )}
              {item.id === 'kyc-queue' && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isLight ? 'bg-amber-50 text-amber-700' : 'bg-amber-500/10 text-amber-400'}`}>
                  {kycApplicationsCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Controls */}
      <div className="px-4 pb-5 shrink-0 flex flex-col gap-2">
        <div className={`border-t my-2 ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`} />
        {onLogout && (
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
              isLight ? 'text-red-600 hover:bg-red-50 hover:text-red-700' : 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
            }`}
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        )}
        <button
          onClick={onExitToLanding}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
            isLight ? 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
          }`}
        >
          Exit to Landing
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className={`hidden md:flex w-72 flex-col justify-between h-screen sticky top-0 shrink-0 select-none ${isLight ? 'bg-white' : 'bg-zinc-950'}`}>
        {renderNavContent()}
      </aside>

      {/* Mobile */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-200"
            onClick={onClose} 
          />
          <aside className={`relative w-72 h-full flex flex-col justify-between z-50 shadow-2xl animate-fade-in ${isLight ? 'bg-white' : 'bg-zinc-950'}`}>
            <button 
              onClick={onClose}
              className={`absolute top-4 right-4 p-2 rounded-xl focus:outline-none transition-colors cursor-pointer ${
                isLight 
                  ? 'text-zinc-500 hover:text-zinc-900 bg-zinc-100 border border-zinc-200' 
                  : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
            {renderNavContent()}
          </aside>
        </div>
      )}
    </>
  );
}
