import React, { useMemo, useEffect, useState } from 'react';
import {
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell, 
  AreaChart, 
  Area
} from 'recharts';
import { TrendingUp, ShoppingCart, Percent, AlertTriangle, ShieldCheck, DollarSign, Star, Eye, Globe, MessageCircle, Facebook, Linkedin, Youtube, Music, AtSign, Send } from 'lucide-react';
import { motion } from 'motion/react';
import { EscrowLink } from '../types';
import { getSellerViewsStats, getStorefrontViewsBreakdown } from '../lib/services/analytics';
import { getStorefrontForSeller } from '../lib/services/storefront';
import BusinessHealth from './dashboard/BusinessHealth';
import TransactionJourney from './dashboard/TransactionJourney';
import TrustScore from './dashboard/TrustScore';
import ReputationGraph from './dashboard/ReputationGraph';
import AIInsights from './dashboard/AIInsights';

interface AnalyticsViewProps {
  escrowLinks: EscrowLink[];
  sellerId?: string;
}

export default function AnalyticsView({ escrowLinks, sellerId }: AnalyticsViewProps) {
  // Load ratings inside AnalyticsView
  const ratingsData = useMemo(() => {
    return {
      average: 0,
      totalCount: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      recentReviews: [],
      hasRatings: false
    };
  }, [escrowLinks]);

  const kycStatus = useMemo(() => {
    try {
      const saved = localStorage.getItem('trustlink-profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.kycStatus || parsed.kyc_status || 'unverified';
      }
    } catch (e) {}
    return 'unverified';
  }, []);

  // Storefront views stats
  const [viewsStats, setViewsStats] = useState<{ totalViews: number; viewsToday: number; viewsThisWeek: number }>({
    totalViews: 0,
    viewsToday: 0,
    viewsThisWeek: 0,
  });
  const [viewsLoading, setViewsLoading] = useState(true);
  const [referrerBreakdown, setReferrerBreakdown] = useState<Array<{ name: string; views: number; platform: string }>>([]);

  useEffect(() => {
    const fetchViewsData = async () => {
      try {
        if (!sellerId) {
          setViewsLoading(false);
          return;
        }

        const stats = await getSellerViewsStats(sellerId, 30);
        if (stats) {
          setViewsStats({
            totalViews: stats.totalViews,
            viewsToday: stats.viewsToday,
            viewsThisWeek: stats.viewsThisWeek,
          });
        } else {
          console.warn('[Analytics] getSellerViewsStats returned null for seller', sellerId);
        }

        const storefront = await getStorefrontForSeller(sellerId);
        if (storefront?.id) {
          const breakdown = await getStorefrontViewsBreakdown(storefront.id, 30);
          if (breakdown && breakdown.length > 0) {
            const referrerMap = new Map<string, { name: string; views: number; platform: string }>();
            
            breakdown.forEach((view) => {
              const referrer = view.referrer || 'Direct / Unknown';
              const existing = referrerMap.get(referrer);
              if (existing) {
                existing.views += 1;
              } else {
                referrerMap.set(referrer, {
                  name: referrer,
                  views: 1,
                  platform: detectSocialPlatform(referrer),
                });
              }
            });

            const sorted = Array.from(referrerMap.values())
              .sort((a, b) => b.views - a.views)
              .slice(0, 10);
            setReferrerBreakdown(sorted);
          } else {
            console.warn('[Analytics] No storefront views breakdown found for storefront', storefront.id);
          }
        } else {
          console.warn('[Analytics] No storefront found for seller', sellerId);
        }
      } catch (err) {
        console.error('[Analytics] Error fetching storefront views:', err);
      } finally {
        setViewsLoading(false);
      }
    };

    fetchViewsData();
  }, [sellerId]);

  const detectSocialPlatform = (referrer: string): string => {
    const url = referrer.toLowerCase();
    if (url.includes('instagram') || url.includes('ig.me')) return 'Instagram';
    if (url.includes('facebook') || url.includes('fb.me')) return 'Facebook';
    if (url.includes('twitter') || url.includes('x.com') || url.includes('t.co')) return 'X / Twitter';
    if (url.includes('linkedin')) return 'LinkedIn';
    if (url.includes('youtube') || url.includes('youtu.be')) return 'YouTube';
    if (url.includes('tiktok') || url.includes('vm.tiktok')) return 'TikTok';
    if (url.includes('whatsapp') || url.includes('wa.me')) return 'WhatsApp';
    if (url.includes('telegram') || url.includes('t.me')) return 'Telegram';
    if (url.includes('snapchat') || url.includes('snap')) return 'Snapchat';
    if (url.includes('pinterest') || url.includes('pin.it')) return 'Pinterest';
    if (url.includes('google') || url.includes('g.co')) return 'Google';
    if (url.includes('bing') || url.includes('yahoo')) return 'Search Engine';
    if (url.includes('trova') || url.includes('localhost') || url.includes('127.0.0.1')) return 'Trova Platform';
    if (url === 'direct / unknown' || url === '' || url === 'null') return 'Direct / Unknown';
    return 'Other';
  };

  const getPlatformIcon = (platform: string) => {
    const iconMap: Record<string, any> = {
      'Instagram': MessageCircle,
      'Facebook': Facebook,
      'X / Twitter': AtSign,
      'LinkedIn': Linkedin,
      'YouTube': Youtube,
      'TikTok': Music,
      'WhatsApp': MessageCircle,
      'Telegram': Send,
      'Snapchat': AtSign,
      'Pinterest': AtSign,
      'Google': Globe,
      'Search Engine': Globe,
      'Trova Platform': Globe,
      'Direct / Unknown': Globe,
      'Other': Globe,
    };
    const Icon = iconMap[platform] || Globe;
    return <Icon className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />;
  };

  // 1. Calculate active currency symbol
  const currencySymbol = useMemo(() => {
    if (escrowLinks.length > 0) {
      const link = escrowLinks.find(l => l.currencySymbol);
      if (link) return link.currencySymbol;
    }
    return '₦';
  }, [escrowLinks]);

  // 2. Use only real transactions, no seeding
  const resolvedTransactions = useMemo(() => {
    return escrowLinks;
  }, [escrowLinks]);

  // 3. Compute metric outputs
  const metrics = useMemo(() => {
    // Earnings: sum of completed ('funds_released', 'funds_released', 'funds_released')
    const completedList = resolvedTransactions.filter(l => 
      ['funds_released', 'funds_released', 'funds_released'].includes(l.status)
    );
    const totalEarnings = completedList.reduce((sum, l) => sum + l.amount, 0);

    const totalTransactions = resolvedTransactions.length;

    // Success Rate = completed out of total
    const successRate = totalTransactions > 0 
      ? Math.round((completedList.length / totalTransactions) * 100) 
      : 100;

    // Average Order Value (AOV)
    const averageOrderValue = completedList.length > 0
      ? Math.round(totalEarnings / completedList.length)
      : 0;

    // Dispute rate
    const disputedList = resolvedTransactions.filter(l => 
      ['disputed', 'disputed'].includes(l.status)
    );
    const disputeRate = totalTransactions > 0
      ? parseFloat(((disputedList.length / totalTransactions) * 100).toFixed(1))
      : 0;

    return {
      totalEarnings,
      totalTransactions,
      successRate,
      averageOrderValue,
      disputeRate
    };
  }, [resolvedTransactions]);

  // 4. Group earnings into past 8 weeks
  const earningsOverTimeData = useMemo(() => {
    const data = [];
    const now = new Date();
    
    // Group active transactions by week index
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 3600 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 3600 * 1000);
      
      const weekLabel = i === 0 ? 'This Week' : `${i} wks ago`;

      // Filter successful releases creating in this range
      const weekReleases = resolvedTransactions.filter(l => {
        const d = new Date(l.createdAt);
        return d >= weekStart && d < weekEnd && ['funds_released', 'funds_released', 'funds_released'].includes(l.status);
      });

      const totalValue = weekReleases.reduce((sum, l) => sum + l.amount, 0);

      data.push({
        name: weekLabel,
        "Completed Earnings": totalValue
      });
    }
    return data;
  }, [resolvedTransactions]);

  // 5. Group status rates
  const statusChartData = useMemo(() => {
    let awaitingDeposit = 0;
    let lockedDeposited = 0;
    let dispatchedTransit = 0;
    let releasedSettled = 0;
    let underDispute = 0;

    resolvedTransactions.forEach(l => {
      const s = l.status;
      if (['pending_deposit', 'pending_deposit'].includes(s)) awaitingDeposit++;
      else if (['deposited', 'deposited'].includes(s)) lockedDeposited++;
      else if (['shipped', 'shipped', 'delivered'].includes(s)) dispatchedTransit++;
      else if (['funds_released', 'funds_released', 'funds_released'].includes(s)) releasedSettled++;
      else if (['disputed', 'disputed'].includes(s)) underDispute++;
    });

    return [
      { name: 'Awaiting', count: awaitingDeposit, color: '#71717a' }, // zinc
      { name: 'Locked', count: lockedDeposited, color: '#10b981' }, // emerald
      { name: 'Transit', count: dispatchedTransit, color: '#3b82f6' }, // blue
      { name: 'funds_released', count: releasedSettled, color: '#06b6d4' }, // cyan
      { name: 'Disputed', count: underDispute, color: '#ef4444' } // red
    ];
  }, [resolvedTransactions]);

  // 6. Calculate Top Products by revenue
  const topProducts = useMemo(() => {
    const productMap: { [key: string]: { count: number; totalRev: number } } = {};

    resolvedTransactions.forEach(l => {
      // Only record completed orders towards sales revenue
      if (['funds_released', 'funds_released', 'funds_released'].includes(l.status)) {
        const name = l.productName.trim() || 'Custom Order';
        if (!productMap[name]) {
          productMap[name] = { count: 0, totalRev: 0 };
        }
        productMap[name].count += 1;
        productMap[name].totalRev += l.amount;
      }
    });

    return Object.entries(productMap)
      .map(([name, stat]) => ({
        name,
        unitsSold: stat.count,
        totalRevenue: stat.totalRev,
        avgOrderValue: Math.round(stat.totalRev / stat.count)
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [resolvedTransactions]);

  const currencyFormatter = (value: number) => {
    return `${currencySymbol}${value.toLocaleString()}`;
  };

  const [activeTab, setActiveTab] = React.useState<'overview' | 'transactions' | 'customers'>('overview');

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'transactions' as const, label: 'Transactions' },
    { id: 'customers' as const, label: 'Customers' },
  ];

  return (
    <div id="analytics-view-container" className="flex flex-col gap-6 text-left font-sans w-full max-w-full">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">Store Analytics</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Real-time performance metrics and sales intelligence.</p>
        </div>
      </div>

      {/* Business Health — always visible */}
      <BusinessHealth escrowLinks={escrowLinks} />

      {/* Trust Score — always visible */}
      <TrustScore escrowLinks={escrowLinks} ratingsAverage={ratingsData.average} kycStatus={kycStatus} />

      {/* Reputation Graph — always visible */}
      <ReputationGraph escrowLinks={escrowLinks} ratingsAverage={ratingsData.average} kycStatus={kycStatus} />

      {/* Tabs */}
      <div className="border-b border-[var(--border)]">
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab.id
                  ? 'text-emerald-400 border-b-2 border-emerald-500'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-6">
          <AIInsights escrowLinks={escrowLinks} ratingsAverage={ratingsData.average} viewsStats={viewsStats} />
          
          {/* Storefront Traffic */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest block" style={{ color: 'var(--text-muted)' }}>STOREFRONT TRAFFIC</span>
                <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">How buyers discover your store</h3>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div 
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
                className="border rounded-xl p-4 flex flex-col gap-2"
              >
                <span className="text-[10px] uppercase tracking-wider font-semibold text-left font-sans" style={{ color: 'var(--text-muted)' }}>Total Views</span>
                <span className="text-lg font-black text-[var(--text-primary)] font-mono leading-none">
                  {viewsLoading ? '...' : viewsStats.totalViews.toLocaleString()}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] leading-tight">
                  {viewsStats.totalViews === 0 && !viewsLoading ? 'No views yet — share your store link to start getting traffic' : 'All-time public storefront visits'}
                </span>
              </div>
              
              <div 
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
                className="border rounded-xl p-4 flex flex-col gap-2"
              >
                <span className="text-[10px] uppercase tracking-wider font-semibold text-left font-sans" style={{ color: 'var(--text-muted)' }}>Views Today</span>
                <span className="text-lg font-black text-[var(--text-primary)] font-mono leading-none">
                  {viewsLoading ? '...' : viewsStats.viewsToday.toLocaleString()}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] leading-tight">
                  {viewsStats.viewsToday === 0 && !viewsLoading ? 'No visits today — promote your link on social media' : 'Visits in the last 24 hours'}
                </span>
              </div>
              
              <div 
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
                className="border rounded-xl p-4 flex flex-col gap-2"
              >
                <span className="text-[10px] uppercase tracking-wider font-semibold text-left font-sans" style={{ color: 'var(--text-muted)' }}>Views This Week</span>
                <span className="text-lg font-black text-[var(--text-primary)] font-mono leading-none">
                  {viewsLoading ? '...' : viewsStats.viewsThisWeek.toLocaleString()}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] leading-tight">
                  {viewsStats.viewsThisWeek === 0 && !viewsLoading ? 'No traffic this week — your store is live but undiscovered' : 'Visits in the last 7 days'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="flex flex-col gap-6">
          <TransactionJourney escrowLinks={escrowLinks} />
          
          {/* Earnings Over Time */}
          <div 
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
            className="border rounded-xl p-5 sm:p-7 flex flex-col gap-4"
          >
            <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Earnings Over Time</span>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={earningsOverTimeData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => `${currencySymbol}${val >= 1000 ? (val/1000) + 'k' : val}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--surface2)', 
                      border: '1px solid var(--border)',
                      borderRadius: '8px', 
                      fontSize: '11px',
                      color: 'var(--text-primary)'
                    }}
                    formatter={(value: any) => [currencyFormatter(Number(value)), 'Completed Earnings']}
                  />
                  <Area
                    type="monotone"
                    dataKey="Completed Earnings"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#earningsGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Bar Chart */}
          <div 
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
            className="border rounded-xl p-5 sm:p-7 flex flex-col gap-4"
          >
            <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Transactions by Status</span>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusChartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--surface2)', 
                      border: '1px solid var(--border)',
                      borderRadius: '8px', 
                      fontSize: '11px',
                      color: 'var(--text-primary)'
                    }}
                    formatter={(value: any) => [value, 'Volume']}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'customers' && (
        <div className="flex flex-col gap-6">
          {/* Customer Ratings */}
          <div 
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
            className="border rounded-xl p-5 sm:p-6 flex flex-col gap-6"
          >
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest block" style={{ color: 'var(--text-muted)' }}>FEEDBACK METRICS</span>
              <span className="text-base font-bold text-[var(--text-primary)] tracking-tight">Customer Ratings</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div 
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
                className="md:col-span-5 flex flex-col items-start gap-2.5 border rounded-2xl p-5 select-none md:sticky md:top-20"
              >
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Average Seller Rating</span>
                <div className="flex items-center gap-4">
                  <span className="font-extrabold text-emerald-400 leading-none tracking-tight font-sans" style={{ fontSize: '48px' }}>
                    {ratingsData.average}
                  </span>
                  <div className="flex flex-col gap-1 text-left">
                    <div className="flex items-center gap-[2px]">
                      {[1, 2, 3, 4, 5].map((starValue) => {
                        const isFull = ratingsData.average >= starValue;
                        const isHalf = ratingsData.average > starValue - 1 && ratingsData.average < starValue;
                        return (
                          <div key={starValue} className="relative flex items-center justify-center shrink-0" style={{ width: '20px', height: '20px' }}>
                            <Star className="absolute inset-0" style={{ width: '20px', height: '20px', stroke: '#3f3f46', fill: 'transparent' }} />
                            {isFull && <Star className="absolute inset-0" style={{ width: '20px', height: '20px', stroke: '#f59e0b', fill: '#f59e0b' }} />}
                            {isHalf && (
                              <div className="absolute left-0 top-0 bottom-0 overflow-hidden" style={{ width: '50%' }}>
                                <Star style={{ width: '20px', height: '20px', stroke: '#f59e0b', fill: '#f59e0b', maxWidth: 'none' }} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <span className="text-xs font-sans mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {ratingsData.totalCount} total {ratingsData.totalCount === 1 ? 'rating' : 'ratings'}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] leading-normal border-t pt-3 mt-1.5 w-full text-left font-sans italic" style={{ color: 'var(--text-dim)', borderColor: 'var(--border)' }}>
                  Ratings and unboxing remarks are submitted by buyers secure post-payment settlement.
                </p>
              </div>
              <div 
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
                className="md:col-span-7 flex flex-col gap-4 border rounded-2xl p-5"
              >
                <span className="text-xs font-bold uppercase tracking-wider font-mono text-left block" style={{ color: 'var(--text-muted)' }}>RATING DISTRIBUTION</span>
                <div className="flex flex-col gap-3">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = ratingsData.distribution[stars as 5 | 4 | 3 | 2 | 1] || 0;
                    const percentage = ratingsData.totalCount > 0 ? Math.round((count / ratingsData.totalCount) * 100) : 0;
                    return (
                      <div key={stars} className="flex items-center gap-3 w-full text-xs">
                        <span className="w-12 text-left font-mono font-bold text-[var(--text-primary)]">
                          {stars} {stars === 1 ? 'star' : 'stars'}
                        </span>
                        <div className="flex-1 h-3.5 border rounded-lg overflow-hidden relative" style={{ backgroundColor: 'var(--bar-track-bg)', borderColor: 'var(--border)' }}>
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: `${percentage}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="bg-amber-500 h-full rounded-r-sm shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                          />
                        </div>
                        <div className="w-16 text-right font-mono flex items-center justify-end gap-1.5" style={{ color: 'var(--text-primary)' }}>
                          <span className="font-bold">{count}</span>
                          <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t pt-5 mt-3 flex flex-col gap-4" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-xs font-bold uppercase tracking-wider font-mono text-left block" style={{ color: 'var(--text-muted)' }}>RECENT WRITTEN REVIEWS</span>
                  {ratingsData.recentReviews.length === 0 ? (
                    <div className="py-2 text-center text-xs italic" style={{ color: 'var(--text-muted)' }}>No written reviews yet</div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {ratingsData.recentReviews.map((rev, rIdx) => (
                        <div key={rIdx} style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }} className="border p-4 rounded-xl flex flex-col gap-2.5 text-left">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((sVal) => (
                                <Star key={sVal} className="w-3" style={{ stroke: sVal <= rev.rating ? '#f59e0b' : '#3f3f46', fill: sVal <= rev.rating ? '#f59e0b' : 'transparent' }} />
                              ))}
                            </div>
                            <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                              {new Date(rev.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-xs italic font-sans leading-relaxed" style={{ color: 'var(--text-primary)' }}>"{rev.text}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div 
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
            className="border rounded-xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Top Products by Revenue</span>
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-mono">Completed Settlements</span>
            </div>
            <div className="overflow-x-auto w-full no-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr style={{ backgroundColor: 'var(--surface2)', color: 'var(--text-muted)' }} className="border-b border-[var(--border)] text-[9.5px] font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-sans text-left">Product / Service Name</th>
                    <th className="py-2.5 px-4 font-sans text-center">Units Sold</th>
                    <th className="py-2.5 px-4 font-sans text-right">Average Order Value</th>
                    <th className="py-2.5 px-4 font-sans text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {topProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-[var(--text-muted)] italic">
                        No completed revenue items on file.
                      </td>
                    </tr>
                  ) : (
                    topProducts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-[var(--surface2)]/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">{p.name}</td>
                        <td className="py-3 px-4 text-center font-mono text-[var(--text-primary)]">{p.unitsSold}</td>
                        <td className="py-3 px-4 text-right font-mono text-[var(--text-muted)]">{currencyFormatter(p.avgOrderValue)}</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-500 font-extrabold">{currencyFormatter(p.totalRevenue)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Referrer Breakdown */}
          <div 
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
            className="border rounded-xl p-5 flex flex-col gap-4"
          >
            <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Views by Source</span>
            {referrerBreakdown.length === 0 ? (
              <div className="text-xs text-[var(--text-muted)] italic py-4 text-center">
                No referrer data available yet.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {referrerBreakdown.map((item, idx) => {
                  const maxViews = referrerBreakdown[0]?.views || 1;
                  const percentage = Math.round((item.views / maxViews) * 100);
                  return (
                    <div key={idx} className="flex items-center gap-3 w-full text-xs">
                      <div className="w-8 h-8 rounded-lg bg-[var(--surface2)] border border-[var(--border)] flex items-center justify-center shrink-0">
                        {getPlatformIcon(item.platform)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-[var(--text-primary)] truncate text-left">{item.platform}</span>
                          <span className="font-mono text-[var(--text-muted)] ml-2 shrink-0">{item.views} views</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bar-track-bg)' }}>
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: `${percentage}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="h-full rounded-full bg-indigo-500/80"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
