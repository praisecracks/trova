import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { TrendingUp, DollarSign, ShieldAlert, Users, ShieldCheck, Wallet, Eye } from 'lucide-react';
import { AdminTransaction, AdminPayout, AdminProfile, getStorefrontViewsStats } from '../../lib/services/admin';

interface OverviewTabProps {
  transactions: AdminTransaction[];
  payouts: AdminPayout[];
  profiles?: AdminProfile[];
  theme?: 'dark' | 'light';
}

export function OverviewTab({ transactions, payouts, profiles, theme }: OverviewTabProps) {
  const [storefrontViews, setStorefrontViews] = useState<bigint>(0n);

  // Fetch storefront views stats
  useEffect(() => {
    const fetchStorefrontViews = async () => {
      try {
        const stats = await getStorefrontViewsStats();
        if (stats) {
          setStorefrontViews(stats.views_this_week || 0n);
        } else {
          setStorefrontViews(0n);
        }
      } catch (err) {
        console.error('Error fetching storefront views:', err);
        setStorefrontViews(0n);
      }
    };

    fetchStorefrontViews();
  }, []);
  const totalVolume = transactions.reduce((sum, tx) => sum + tx.amount + tx.shippingFee, 0);
  const heldInEscrow = transactions
    .filter(tx => ['deposited', 'shipped', 'delivered'].includes(tx.status))
    .reduce((sum, tx) => sum + tx.amount + tx.shippingFee, 0);
  const settled = transactions
    .filter(tx => tx.status === 'funds_released')
    .reduce((sum, tx) => sum + tx.amount + tx.shippingFee, 0);
  const activeDisputes = transactions.filter(tx => tx.status === 'disputed').length;
  const pendingKyc = profiles?.filter(p => p.kycStatus === 'pending' || !p.kycStatus).length || 0;
  const totalUsers = profiles?.length || 0;
  const totalMerchants = profiles?.filter(p => p.role === 'seller').length || 0;
  
  // Calculate platform revenue (2.5% fee)
  const platformRevenue = totalVolume * 0.025;

  // Generate chart data
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + i);
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dayTransactions = transactions.filter(tx => {
      if (!tx.createdAt) return false;
      const txDate = new Date(tx.createdAt);
      return (
        txDate.getDate() === date.getDate() &&
        txDate.getMonth() === date.getMonth() &&
        txDate.getFullYear() === date.getFullYear()
      );
    });
    const dayVolume = dayTransactions.reduce((sum, tx) => sum + tx.amount + tx.shippingFee, 0);
    const dayCount = dayTransactions.length;
    const dayRevenue = dayVolume * 0.025;
    return {
      label,
      volume: dayVolume,
      transactions: dayCount,
      revenue: dayRevenue
    };
  });

  const statusDistribution = [
    { name: 'Pending', value: transactions.filter(tx => tx.status === 'pending_deposit').length },
    { name: 'Deposited', value: transactions.filter(tx => tx.status === 'deposited').length },
    { name: 'Shipped', value: transactions.filter(tx => tx.status === 'shipped').length },
    { name: 'Delivered', value: transactions.filter(tx => tx.status === 'delivered').length },
    { name: 'funds_released', value: transactions.filter(tx => tx.status === 'funds_released').length },
    { name: 'Disputed', value: activeDisputes }
  ];

  const isLight = theme === 'light';

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div
          className={`p-6 rounded-2xl border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'}`}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${isLight ? 'bg-emerald-100' : 'bg-emerald-500/10'}`}>
                <TrendingUp className={`w-6 h-6 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
              </div>
              <span className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Platform Revenue
              </span>
            </div>
          </div>
          <div className={`text-3xl font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
            ₦{platformRevenue.toLocaleString()}
          </div>
        </div>

        <div
          className={`p-6 rounded-2xl border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'}`}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${isLight ? 'bg-blue-100' : 'bg-blue-500/10'}`}>
                <DollarSign className={`w-6 h-6 ${isLight ? 'text-blue-700' : 'text-blue-400'}`} />
              </div>
              <span className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Total Trade Volume
              </span>
            </div>
          </div>
          <div className={`text-3xl font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>
            ₦{totalVolume.toLocaleString()}
          </div>
        </div>

        <div
          className={`p-6 rounded-2xl border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'}`}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${isLight ? 'bg-emerald-100' : 'bg-emerald-500/10'}`}>
                <ShieldCheck className={`w-6 h-6 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
              </div>
              <span className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Held In Escrow
              </span>
            </div>
          </div>
          <div className={`text-3xl font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
            ₦{heldInEscrow.toLocaleString()}
          </div>
        </div>

        <div
          className={`p-6 rounded-2xl border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'}`}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${isLight ? 'bg-blue-100' : 'bg-blue-500/10'}`}>
                <Wallet className={`w-6 h-6 ${isLight ? 'text-blue-700' : 'text-blue-400'}`} />
              </div>
              <span className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Disbursed Capital
              </span>
            </div>
          </div>
          <div className={`text-3xl font-bold ${isLight ? 'text-blue-700' : 'text-blue-400'}`}>
            ₦{settled.toLocaleString()}
          </div>
        </div>

        <div
          className={`p-6 rounded-2xl border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'}`}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${isLight ? 'bg-red-100' : 'bg-red-500/10'}`}>
                <ShieldAlert className={`w-6 h-6 ${isLight ? 'text-red-700' : 'text-red-400'}`} />
              </div>
              <span className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Active Disputes
              </span>
            </div>
          </div>
          <div className={`text-3xl font-bold ${isLight ? 'text-red-700' : 'text-red-400'}`}>
            {activeDisputes}
          </div>
        </div>

        <div
          className={`p-6 rounded-2xl border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'}`}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${isLight ? 'bg-purple-100' : 'bg-purple-500/10'}`}>
                <Users className={`w-6 h-6 ${isLight ? 'text-purple-700' : 'text-purple-400'}`} />
              </div>
              <span className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Total Users
              </span>
            </div>
          </div>
          <div className={`text-3xl font-bold ${isLight ? 'text-purple-700' : 'text-purple-400'}`}>
            {totalUsers}
          </div>
        </div>

        <div
          className={`p-6 rounded-2xl border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'}`}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${isLight ? 'bg-indigo-100' : 'bg-indigo-500/10'}`}>
                <Eye className={`w-6 h-6 ${isLight ? 'text-indigo-700' : 'text-indigo-400'}`} />
              </div>
              <span className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Storefront Views
              </span>
            </div>
          </div>
          <div className={`text-3xl font-bold ${isLight ? 'text-indigo-700' : 'text-indigo-400'}`}>
            {Number(storefrontViews).toLocaleString()}
          </div>
          <p className={`text-xs mt-2 ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
            This week
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Volume Chart */}
        <div
          className={`p-6 rounded-2xl border lg:col-span-2 ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'}`}
        >
          <h3 className={`text-base font-bold mb-5 ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>
            Trade Volume & Revenue (Last 7 Days)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7Days}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e5e7eb' : '#27272a'} vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke={isLight ? '#64748b' : '#71717a'}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke={isLight ? '#64748b' : '#71717a'}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: isLight ? '#fff' : '#18181b',
                    borderColor: isLight ? '#e4e4e7' : '#27272a',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  labelStyle={{ color: isLight ? '#18181b' : '#f4f4f5' }}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorVolume)"
                  name="Volume"
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Chart */}
        <div
          className={`p-6 rounded-2xl border ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-zinc-900 border-zinc-800'}`}
        >
          <h3 className={`text-base font-bold mb-5 ${isLight ? 'text-zinc-800' : 'text-zinc-200'}`}>
            Transaction Status
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e5e7eb' : '#27272a'} vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke={isLight ? '#64748b' : '#71717a'}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke={isLight ? '#64748b' : '#71717a'}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: isLight ? '#fff' : '#18181b',
                    borderColor: isLight ? '#e4e4e7' : '#27272a',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  labelStyle={{ color: isLight ? '#18181b' : '#f4f4f5' }}
                />
                <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
