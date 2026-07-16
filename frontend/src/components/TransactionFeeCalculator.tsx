import React, { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react';

interface TransactionFeeCalculatorProps {
  initialAmount?: number;
  currencyCode?: 'NGN' | 'USD';
  currencySymbol?: '₦' | '$';
  showHeader?: boolean;
}

export default function TransactionFeeCalculator({
  initialAmount = 50000,
  currencyCode = 'NGN',
  currencySymbol = '₦',
  showHeader = true
}: TransactionFeeCalculatorProps) {
  const [amountInput, setAmountInput] = useState<string>(initialAmount.toString());
  const [payer, setPayer] = useState<'merchant' | 'buyer'>('buyer');

  // Load dynamic global system settings
  const sysSettings = (() => {
    try {
      const saved = localStorage.getItem('trustlink_global_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      exchangeRate: 1500,
      localEscrowFee: 1.5,
      localEscrowCap: 2000,
      globalEscrowFee: 2.5,
      kycDeclineLimit: 1000000,
      globalPayoutsEnabled: true,
      singleTxCap: 5000000
    };
  })();

  // Sync initialAmount if changed from parent
  useEffect(() => {
    if (initialAmount) {
      setAmountInput(initialAmount.toString());
    }
  }, [initialAmount]);

  const amount = parseFloat(amountInput) || 0;

  // Trova escrow standard: Dynamic based on settings
  let escrowFee = 0;
  if (currencyCode === 'USD') {
    escrowFee = amount * (sysSettings.globalEscrowFee / 100); // Dynamic global fee (default 2.5%)
  } else {
    escrowFee = amount * (sysSettings.localEscrowFee / 100); // Dynamic local fee (default 1.5%)
    if (escrowFee > sysSettings.localEscrowCap) {
      escrowFee = sysSettings.localEscrowCap; // Dynamic max local cap (default ₦2000 max)
    }
  }

  const roundedAmount = Math.round(amount * 100) / 100;
  const roundedFee = Math.round(escrowFee * 100) / 100;

  const buyerPays = payer === 'buyer' ? roundedAmount + roundedFee : roundedAmount;
  const sellerReceives = payer === 'merchant' ? roundedAmount - roundedFee : roundedAmount;

  return (
    <div 
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)', color: 'var(--text-primary)' }}
      className="border rounded-2xl p-5 flex flex-col gap-4 text-left font-sans"
    >
      {showHeader && (
        <div style={{ borderColor: 'var(--border)' }} className="flex gap-2 items-center pb-2 border-b">
          <Calculator className="w-4 h-4 text-emerald-400" />
          <div>
            <h4 style={{ color: 'var(--text-primary)' }} className="text-[11px] font-bold uppercase tracking-wider font-mono">Escrow Fee Calculator</h4>
            <p style={{ color: 'var(--text-muted)' }} className="text-[10px]">Calculate exact checkout and payout totals instantly.</p>
          </div>
        </div>
      )}

      {/* Simplified Input fields */}
      <div className="flex flex-col gap-4">
        {/* Simple Amount Input */}
        <div className="flex flex-col gap-1.5 animate-hover">
          <span style={{ color: 'var(--text-muted)' }} className="text-[9.5px] uppercase tracking-wider font-bold font-mono">Deal Volume ({currencyCode})</span>
          <div className="relative">
            <span style={{ color: 'var(--text-dim)' }} className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold font-mono">{currencySymbol}</span>
            <input
              type="number"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="e.g. 50000"
              style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
              className="w-full border rounded-xl pl-7 pr-3 py-2 text-xs focus:outline-none focus:border-emerald-500/60 transition-colors font-mono"
            />
          </div>
        </div>

        {/* Simplified Toggle Selector */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[9.5px] uppercase tracking-wider font-bold font-mono" style={{ color: 'var(--text-muted)' }}>
            <span>Escrow Fee Coverage</span>
            <span className="text-[8.5px] font-normal" style={{ color: 'var(--text-dim)' }}>
              {currencyCode === 'NGN' ? '1.5% Fee (Capped ₦2,000)' : '2.5% International Fee'}
            </span>
          </div>
          <div style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border)' }} className="grid grid-cols-2 gap-1 p-1 rounded-xl border">
            <button
              type="button"
              onClick={() => setPayer('buyer')}
              style={{
                backgroundColor: payer === 'buyer' ? 'var(--surface)' : 'transparent',
                borderColor: payer === 'buyer' ? 'var(--border)' : 'transparent',
                color: payer === 'buyer' ? '#10b981' : 'var(--text-muted)'
              }}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer transition-all border`}
            >
              Customer Pays
            </button>
            <button
              type="button"
              onClick={() => setPayer('merchant')}
              style={{
                backgroundColor: payer === 'merchant' ? 'var(--surface)' : 'transparent',
                borderColor: payer === 'merchant' ? 'var(--border)' : 'transparent',
                color: payer === 'merchant' ? '#10b981' : 'var(--text-muted)'
              }}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer transition-all border`}
            >
              Merchant Pays
            </button>
          </div>
        </div>

        {/* Simplified Breakdown Card with Big Beautiful Numbers */}
        <div style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }} className="border rounded-xl p-3.5 flex flex-col gap-3 mt-1">
          <div style={{ borderColor: 'var(--border)' }} className="flex justify-between text-xs pb-2 border-b">
            <span style={{ color: 'var(--text-muted)' }}>Escrow Processing Fee:</span>
            <span className="font-mono text-amber-500 font-bold">+{currencySymbol}{roundedFee.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="flex flex-col text-left font-sans">
              <span style={{ color: 'var(--text-muted)' }} className="text-[9px] font-bold uppercase tracking-wider">Buyer Sends</span>
              <span style={{ color: 'var(--text-primary)' }} className="text-sm font-black font-mono mt-0.5">{currencySymbol}{buyerPays.toLocaleString()}</span>
            </div>
            <div style={{ borderColor: 'var(--border)' }} className="flex flex-col text-right border-l pl-3 font-sans">
              <span style={{ color: 'var(--text-muted)' }} className="text-[9px] font-bold uppercase tracking-wider">Seller Receives</span>
              <span className="text-sm font-black text-emerald-400 font-mono mt-0.5">{currencySymbol}{sellerReceives.toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
