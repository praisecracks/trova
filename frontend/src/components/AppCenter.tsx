import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  ArrowRight, 
  Lock, 
  Sparkles, 
  Store, 
  User, 
  ShieldCheck, 
  CheckCircle,
  Clock,
  Globe,
  Send,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Copy,
  Check,
  Calculator,
  MessageSquare
} from 'lucide-react';
import { useToast } from './ToastContext';
import { EscrowLink } from '../types';
import { buildPublicUrl } from '../lib/siteConfig';

export default function AppCenter() {
  const [activeTab, setActiveTabTab] = useState<'walkthrough' | 'calculator' | 'templates'>('walkthrough');
  const [activePerspective, setActivePerspective] = useState<'seller' | 'buyer'>('seller');
  const { success, info } = useToast();

  // --- CURRENCY & ESCROW PLANNER STATE ---
  const [inputVal, setInputVal] = useState<string>('150000');
  const [inputCurrency, setInputCurrency] = useState<'NGN' | 'USD' | 'GBP'>('NGN');
  const [usdRate, setUsdRate] = useState<number>(1500); // 1 USD = 1500 NGN
  const [gbpRate, setGbpRate] = useState<number>(1950); // 1 GBP = 1950 NGN
  
  // Custom rate focus/editable states
  const [isEditingUSD, setIsEditingUSD] = useState<boolean>(false);
  const [isEditingGBP, setIsEditingGBP] = useState<boolean>(false);

  // --- COPY CHAT TEMPLATES STATE ---
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null);

  const handleCopyTemplateText = (id: string, text: string) => {
    setCopiedTemplateId(id);
    navigator.clipboard?.writeText(text);
    success("Copied message template to clipboard!");
    setTimeout(() => setCopiedTemplateId(null), 2000);
  };

  // Convert NGN price to USD and GBP
  const getConvertedDetails = () => {
    const rawVal = parseFloat(inputVal) || 0;
    let ngnValue = 0;
    let usdValue = 0;
    let gbpValue = 0;

    if (inputCurrency === 'NGN') {
      ngnValue = rawVal;
      usdValue = rawVal / usdRate;
      gbpValue = rawVal / gbpRate;
    } else if (inputCurrency === 'USD') {
      usdValue = rawVal;
      ngnValue = rawVal * usdRate;
      gbpValue = ngnValue / gbpRate;
    } else if (inputCurrency === 'GBP') {
      gbpValue = rawVal;
      ngnValue = rawVal * gbpRate;
      usdValue = ngnValue / usdRate;
    }

    // Trova safety fee is 1.5% of total value
    const escrowFeeNGN = ngnValue * 0.015;
    const escrowFeeUSD = usdValue * 0.015;
    const escrowFeeGBP = gbpValue * 0.015;

    return {
      ngn: ngnValue,
      usd: usdValue,
      gbp: gbpValue,
      feeNGN: escrowFeeNGN,
      feeUSD: escrowFeeUSD,
      feeGBP: escrowFeeGBP,
      payoutNGN: ngnValue - escrowFeeNGN,
      payoutUSD: usdValue - escrowFeeUSD,
      payoutGBP: gbpValue - escrowFeeGBP
    };
  };

  const calcs = getConvertedDetails();

  // Pre-configured social templates
  const salesTemplates = [
    {
      id: 'init-escrow',
      title: '1. Present Escrow Payment Invitation',
      description: 'Send this to a buyer after finalizing prices inside WhatsApp or Instagram DMs to invite them to checkout securely.',
      payload: (amount: string, refId: string) => `Hello! Creative choice. To keep this buy 100% secure, I have created a protected escrow order on Trova.\n\n📦 Order Details:\n💵 Amount: ₦${amount}\n🔒 Safety Code: #${refId}\n\nYou can input your shipping updates and protect your payment here:\n${buildPublicUrl(`/pay/${refId}`)}\n\nTrova holds your money safely in trust. I will only get paid after you receive and confirm your order! 🛡️`
    },
    {
      id: 'transit-dispatch',
      title: '2. Parcel Handed Over to Courier',
      description: 'Send this to your buyers with their tracking links when dispatching their items.',
      payload: (_amount: string, refId: string) => `Awesome news! Your parcel has been hand-delivered to the courier. \n\nTracking Reference: #${refId}\nFollow the active delivery milestones and confirm delivery to release funds here:\n${buildPublicUrl(`/track/${refId}`)}\n\nThank you for choosing a secure trust check-out! 🚀`
    },
    {
      id: 'inspection-alert',
      title: '3. Inspection Milestone reminder',
      description: 'Polite reminder when courier shows the order successfully delivered.',
      payload: (_amount: string, refId: string) => `Hi there! Hope you are loving your items. Our courier update shows the package for Reference #${refId} was delivered. \n\nPlease take a moment to look over your order! Once verified, tap on the "Accept & Authorize Release" button to close our transaction:\n${buildPublicUrl(`/track/${refId}`)}\n\nHave an amazing day! ✨`
    }
  ];

  return (
    <div id="learning-hub-container" className="flex flex-col gap-8 text-left max-w-5xl mx-auto font-sans relative">
      
      {/* Visual Accent */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/[0.015] rounded-full blur-[100px] pointer-events-none" />

      {/* Header section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#10b981] font-bold">Seller Toolkit</span>
        </div>
        <h1 className="text-2xl sm:text-3.5xl font-black tracking-tight animate-fade-in" style={{ color: 'var(--text-primary)' }}>
          Getting Started & Merchant Tools <span className="text-emerald-500">.</span>
        </h1>
        <p className="text-xs sm:text-sm max-w-2xl leading-relaxed animate-fade-in" style={{ color: 'var(--text-muted)' }}>
          Discover simple guidelines to make social sales secure on Trova. Convert global currencies, plan your pricing with our fee estimator, and copy ready-to-use checkout chat templates in just one click.
        </p>
      </div>

      {/* Premium Navigation Tabs */}
      <div 
        style={{ borderBottomColor: 'var(--border)' }}
        className="flex overflow-x-auto gap-2 border-b pb-px scrollbar-none select-none"
      >
        <button
          onClick={() => setActiveTabTab('walkthrough')}
          className={`px-5 py-3 text-xs font-semibold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'walkthrough' 
              ? 'border-emerald-500 text-emerald-400 font-bold' 
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-zinc-450" />
          <span>Guide: How Escrow Works</span>
        </button>

        <button
          onClick={() => setActiveTabTab('calculator')}
          className={`px-5 py-3 text-xs font-semibold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'calculator' 
              ? 'border-emerald-500 text-emerald-400 font-bold' 
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-zinc-450" />
          <span>Planner: Currency & Fee Calculator</span>
        </button>

        <button
          onClick={() => setActiveTabTab('templates')}
          className={`px-5 py-3 text-xs font-semibold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'templates' 
              ? 'border-emerald-500 text-emerald-400 font-bold' 
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-zinc-450" />
          <span>Templates: Quick Chat Copies</span>
        </button>
      </div>

      {/* ==================================== TAB 1: HOW IT WORKS WALKTHROUGH ==================================== */}
      {activeTab === 'walkthrough' && (
        <div className="flex flex-col gap-8 animate-fade-in">
          
          {/* Role switcher bar */}
          <div 
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
            className="border rounded-xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          >
            <div className="flex flex-col gap-1">
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Role Insights Workspace</h3>
              <p className="text-[11.5px]" style={{ color: 'var(--text-dim)' }}>Select your perspective below to understand the secure flow of funds step-by-step.</p>
            </div>
            
            <div 
              style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
              className="flex border p-1 rounded-lg shrink-0 w-full md:w-auto"
            >
              <button
                onClick={() => setActivePerspective('seller')}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer"
                style={{ 
                  backgroundColor: activePerspective === 'seller' ? 'var(--surface)' : 'var(--surface2)', 
                  borderWidth: activePerspective === 'seller' ? '1px' : '1px',
                  borderColor: activePerspective === 'seller' ? 'var(--border)' : 'transparent', 
                  color: activePerspective === 'seller' ? '#10b981' : 'var(--text-primary)' 
                }}
              >
                <Store className="w-3.5 h-3.5 text-emerald-400" />
                <span>As a Seller</span>
              </button>
              
              <button
                onClick={() => setActivePerspective('buyer')}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer"
                style={{ 
                  backgroundColor: activePerspective === 'buyer' ? 'var(--surface)' : 'var(--surface2)', 
                  borderWidth: activePerspective === 'buyer' ? '1px' : '1px',
                  borderColor: activePerspective === 'buyer' ? 'var(--border)' : 'transparent', 
                  color: activePerspective === 'buyer' ? '#10b981' : 'var(--text-primary)' 
                }}
              >
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>As a Buyer</span>
              </button>
            </div>
          </div>

          {/* Three visual milestones */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div 
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
              className="border rounded-xl p-6 flex flex-col justify-between gap-6 hover:border-[#10b981]/25 transition-all min-h-[200px]"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/20 text-emerald-400 bg-emerald-500/[0.02]">
                    STEP 01
                  </span>
                  <PlusCircle className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>1. Draft the Payment Link</h4>
                  <p className="text-[11.5px] leading-relaxed mt-1.5" style={{ color: 'var(--text-muted)' }}>
                    {activePerspective === 'seller' 
                      ? "Create secure payout agreements. Define sizes, shipping details, and items, then generate professional invoice codes in 10 seconds."
                      : "The seller drafts custom order details on Trova and shares a unique invoice check-out code on DM."
                    }
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
                {activePerspective === 'seller' ? "Dashboard: Tap '+ Create Link'" : "Action: Check item name & price"}
              </span>
            </div>

            <div 
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
              className="border rounded-xl p-6 flex flex-col justify-between gap-6 hover:border-[#10b981]/25 transition-all min-h-[200px]"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/20 text-emerald-400 bg-emerald-500/[0.02]">
                    STEP 02
                  </span>
                  <Lock className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>2. Lock Funds in Escrow</h4>
                  <p className="text-[11.5px] leading-relaxed mt-1.5" style={{ color: 'var(--text-muted)' }}>
                    {activePerspective === 'seller'
                      ? "The buyer pays via bank transfer or card. Trova verifies and secures the funds instantly, giving you the green light to dispatch."
                      : "Complete secure bank transfer. Trova secures and registers your deposit safely. The seller can only withdraw after you confirm order."
                    }
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
                {activePerspective === 'seller' ? "Live: 'Payment Secured' active" : "Escrow lock protecting your cash"}
              </span>
            </div>

            <div 
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
              className="border rounded-xl p-6 flex flex-col justify-between gap-6 hover:border-[#10b981]/25 transition-all min-h-[200px]"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/20 text-emerald-400 bg-emerald-500/[0.02]">
                    STEP 03
                  </span>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>3. Full Dispatch & Settlement</h4>
                  <p className="text-[11.5px] leading-relaxed mt-1.5" style={{ color: 'var(--text-muted)' }}>
                    {activePerspective === 'seller'
                      ? "Ship the items. Once the buyer receives and approves delivery, funds are instantly deposited straight into your bank account."
                      : "Inspect your items. Tap 'Accept & Release' to payout the merchant. If there is a major issue, simply file a dispute."
                    }
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
                {activePerspective === 'seller' ? "Payout direct in 60 seconds" : "Zero risk of getting burnt"}
              </span>
            </div>

          </div>

          {/* Quick Informational Faq */}
          <div 
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
            className="border p-5 rounded-xl flex flex-col gap-4"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 font-mono text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Frequently Asked Security Questions
            </h3>
            
            <div 
              style={{ borderTopColor: 'var(--border)' }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t text-xs leading-relaxed"
            >
              <div className="flex flex-col gap-1 text-left">
                <h5 className="font-bold" style={{ color: 'var(--text-primary)' }}>🛡️ How does Trova protect against fake bank screenshots?</h5>
                <p style={{ color: 'var(--text-muted)' }}>
                  IG/WhatsApp sellers often face altered bank alert screenshots. Trova bypasses this entirely by generating a real-time, unique bank account number per checkout link. Once paid, our system automatically verifies receipt in 30 seconds.
                </p>
              </div>

              <div className="flex flex-col gap-1 text-left">
                <h5 className="font-bold" style={{ color: 'var(--text-primary)' }}>🤝 What happens if a customer doesn't approve the order?</h5>
                <p style={{ color: 'var(--text-muted)' }}>
                  Once items are delivered, the buyer has up to 48 hours to inspect. If they approve, pay is released. If they raise a dispute for damage or wrong items, funds stay securely on hold while our support team steps in to moderate.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ==================================== TAB 2: INTERACTIVE CURRENCY ESTIMATOR ==================================== */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in text-left">
          
          {/* Form and Input Parameters */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            <div 
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
              className="border p-5 sm:p-6 rounded-xl flex flex-col gap-5"
            >
              <div className="flex flex-col gap-1">
                <h3 className="font-bold text-[14px]" style={{ color: 'var(--text-primary)' }}>Live Currency Converter & Escrow Fee Estimator</h3>
                <p className="text-[11.5px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Enter prices below to convert values dynamically between Naira (₦), Dollars ($), and Pounds (£), incorporating standard Trova safety service percentages.
                </p>
              </div>

              {/* Calculator Form */}
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* Amount Input */}
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[10px] font-mono tracking-wider font-bold uppercase text-zinc-550">Enter Product Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-xs text-emerald-400">
                        {inputCurrency === 'NGN' ? '₦' : inputCurrency === 'USD' ? '$' : '£'}
                      </span>
                      <input 
                        type="number"
                        min="1"
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
                        className="w-full border p-2.5 pl-8 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                        placeholder="Amount"
                      />
                    </div>
                  </div>

                  {/* Currency selector */}
                  <div className="flex flex-col gap-1.5 col-span-1">
                    <label className="text-[10px] font-mono tracking-wider font-bold uppercase text-zinc-550">Currency</label>
                    <select
                      value={inputCurrency}
                      onChange={(e) => setInputCurrency(e.target.value as any)}
                      style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
                      className="border p-2.5 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="NGN">Naira (₦)</option>
                      <option value="USD">Dollars ($)</option>
                      <option value="GBP">Pounds (£)</option>
                    </select>
                  </div>

                </div>

                {/* Editable Real-Time Exchange Rate Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  
                  {/* USD Rate Input */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px] font-mono tracking-wider font-bold uppercase text-zinc-550">
                      <span>USD Exchange Rate</span>
                      <button 
                        onClick={() => setIsEditingUSD(!isEditingUSD)} 
                        className="text-emerald-400 hover:underline cursor-pointer"
                      >
                        {isEditingUSD ? "Done" : "Customize"}
                      </button>
                    </div>
                    
                    {isEditingUSD ? (
                      <input 
                        type="number"
                        value={usdRate}
                        onChange={(e) => setUsdRate(Math.max(1, parseInt(e.target.value) || 0))}
                        style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
                        className="border p-2 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                      />
                    ) : (
                      <div 
                        style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
                        className="p-2 border rounded-lg text-xs font-mono font-bold flex justify-between"
                      >
                        <span>$1.00 USD</span>
                        <span>= ₦{usdRate.toLocaleString()}</span>
                      </div>
                    )}
                    
                    <input 
                      type="range"
                      min="1200"
                      max="1800"
                      step="10"
                      value={usdRate}
                      onChange={(e) => setUsdRate(parseInt(e.target.value))}
                      className="w-full accent-emerald-500 h-1 mt-1 rounded appearance-none cursor-pointer bg-zinc-700"
                    />
                  </div>

                  {/* GBP Rate Input */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10px] font-mono tracking-wider font-bold uppercase text-zinc-550">
                      <span>GBP Exchange Rate</span>
                      <button 
                        onClick={() => setIsEditingGBP(!isEditingGBP)} 
                        className="text-emerald-400 hover:underline cursor-pointer"
                      >
                        {isEditingGBP ? "Done" : "Customize"}
                      </button>
                    </div>
                    
                    {isEditingGBP ? (
                      <input 
                        type="number"
                        value={gbpRate}
                        onChange={(e) => setGbpRate(Math.max(1, parseInt(e.target.value) || 0))}
                        style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
                        className="border p-2 rounded-lg text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                      />
                    ) : (
                      <div 
                        style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
                        className="p-2 border rounded-lg text-xs font-mono font-bold flex justify-between"
                      >
                        <span>£1.00 GBP</span>
                        <span>= ₦{gbpRate.toLocaleString()}</span>
                      </div>
                    )}

                    <input 
                      type="range"
                      min="1600"
                      max="2200"
                      step="10"
                      value={gbpRate}
                      onChange={(e) => setGbpRate(parseInt(e.target.value))}
                      className="w-full accent-emerald-500 h-1 mt-1 rounded appearance-none cursor-pointer bg-zinc-700"
                    />
                  </div>

                </div>
              </div>

              {/* Dynamic conversion result rows */}
              <div 
                style={{ borderTopColor: 'var(--border)' }}
                className="border-t pt-4 flex flex-col gap-3 font-medium text-xs"
              >
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--text-muted)' }}>Naira Value (₦):</span>
                  <span className="font-mono text-zinc-300 font-bold" style={{ color: 'var(--text-primary)' }}>
                    ₦{Math.round(calcs.ngn).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--text-muted)' }}>Dollar Value ($):</span>
                  <span className="font-mono text-zinc-300 font-bold" style={{ color: 'var(--text-primary)' }}>
                    ${calcs.usd.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--text-muted)' }}>British Pound Value (£):</span>
                  <span className="font-mono text-zinc-300 font-bold" style={{ color: 'var(--text-primary)' }}>
                    £{calcs.gbp.toFixed(2)}
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* Escrow Fee output panel */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            <div 
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
              className="border p-5 rounded-xl flex flex-col gap-4 text-left"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center text-emerald-450 shrink-0">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>Escrow Fee Breakdowns</h4>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Trova fee is a standard 1.5% of total transaction secure hold.</p>
                </div>
              </div>

              <div 
                style={{ borderTopColor: 'var(--border)' }}
                className="border-t pt-4 flex flex-col gap-3.5 text-xs"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between font-mono font-bold text-amber-500">
                    <span>Naira Escrow Fee:</span>
                    <span>- ₦{Math.round(calcs.feeNGN).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-mono text-[9px]" style={{ color: 'var(--text-dim)' }}>
                    <span>Estimated Net Cash Value:</span>
                    <span>₦{Math.round(calcs.payoutNGN).toLocaleString()} paid instantly on confirmed clearance</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 border-t pt-3.5" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex justify-between font-mono font-bold text-amber-500">
                    <span>US Dollar Fee:</span>
                    <span>- ${calcs.feeUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-mono text-[9px]" style={{ color: 'var(--text-dim)' }}>
                    <span>Estimated Net Dollar Value:</span>
                    <span>${calcs.payoutUSD.toFixed(2)} payout rate equivalent</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 border-t pt-3.5" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex justify-between font-mono font-bold text-amber-500">
                    <span>British Pound Fee:</span>
                    <span>- £{calcs.feeGBP.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-mono text-[9px]" style={{ color: 'var(--text-dim)' }}>
                    <span>Estimated Net Pound Value:</span>
                    <span>£{calcs.payoutGBP.toFixed(2)} payout rate equivalent</span>
                  </div>
                </div>
              </div>

              <div 
                style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
                className="p-3 border rounded-xl text-[10.5px] leading-relaxed text-zinc-400 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Tip:</strong> Settle the escrow charges beforehand by adding 1.5% directly to your local or foreign pricing lists, keeping your absolute desired profit margins secure.
                </span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ==================================== TAB 3: DM & CHAT SALES MESSAGES TEMPLATES  =================================== */}
      {activeTab === 'templates' && (
        <div className="flex flex-col gap-6 animate-fade-in text-left">
          
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono text-[#a1a1aa] tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Pro Social Templates</span>
            <h2 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Copy and Paste Checkout Templates</h2>
            <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
              No APIs to pay for, and no configurations required. Instantly grab clear templates and manually share checkout reference details inside WhatsApp or Instagram messages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {salesTemplates.map((item) => {
              // Custom text evaluations for entered order values
              const samplePrice = inputVal.trim() ? parseInt(inputVal).toLocaleString() : '';
              const sampleReference = inputVal.trim();
              const evaluatedText = sampleReference ? item.payload(samplePrice, sampleReference) : '';

              const isCopied = copiedTemplateId === item.id;

              return (
                <div 
                  key={item.id}
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                  className="border rounded-xl p-5 flex flex-col justify-between gap-4 relative overflow-hidden group hover:border-emerald-500/20 transition-all text-xs"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-bold text-[13px]" style={{ color: 'var(--text-primary)' }}>{item.title}</span>
                      <button
                        onClick={() => handleCopyTemplateText(item.id, evaluatedText)}
                        className={`p-1.5 rounded-lg border cursor-pointer transition-all flex items-center justify-center shrink-0 ${
                          isCopied 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-450' 
                            : 'bg-zinc-800/10 border-zinc-700/40 text-zinc-400 hover:text-white'
                        }`}
                        title="Copy Template"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.description}</p>
                    
                    {/* Raw payload block */}
                    <div 
                      style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
                      className="p-3 border rounded-lg max-h-[160px] overflow-y-auto font-mono text-[10px] leading-relaxed whitespace-pre-wrap text-zinc-300 tracking-wide text-left select-all group-hover:border-zinc-700 transition-all border-dashed"
                    >
                      {evaluatedText}
                    </div>
                  </div>

                  <span className="text-[9.5px] font-mono tracking-wide uppercase font-bold" style={{ color: 'var(--text-dim)' }}>
                    {isCopied ? "✓ Copied to clipboard" : "Tap copy icon to use"}
                  </span>
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
}
