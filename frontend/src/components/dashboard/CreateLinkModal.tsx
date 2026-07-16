/**
 * CreateLinkModal.tsx
 * Modal popover dialog wrapping the secure payment link generation wizard.
 * Enables the seller to specify product details, pricing model, shipping, and buyer coordinates.
 * Props:
 *  - onClose: () => void - Callback triggered to hide the modal.
 *  - onCreate: (link: { productName: string; amount: number; shippingFee: number; buyerPhone: string; description: string }) => void - Creation callback.
 * Used by: DashboardPage.tsx
 */

import React, { useState } from 'react';
import { X, ShieldCheck, ArrowRight, Info } from 'lucide-react';
import TransactionFeeCalculator from '../TransactionFeeCalculator';
import { getSellerKycStatus, getCurrentSellerId } from '../../data/localStorage';
import { getKycGateAmountNgn, DEFAULT_EXCHANGE_RATE } from '../../lib/kycLimits';

interface CreateLinkModalProps {
  onClose: () => void;
  onCreate: (link: { 
    productName: string; 
    amount: number; 
    shippingFee: number; 
    buyerPhone: string; 
    description: string; 
    transactionType?: 'physical' | 'service';
    currencyCode?: 'NGN' | 'USD';
    currencySymbol?: '₦' | '$';
  }) => void;
  theme?: 'dark' | 'light';
}

export default function CreateLinkModal({ onClose, onCreate, theme: propTheme }: CreateLinkModalProps) {
  const theme = propTheme || 'dark';
  const [productName, setProductName] = useState('');
  const [amount, setAmount] = useState('');
  const [shippingFee, setShippingFee] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [description, setDescription] = useState('');
  const [transactionType, setTransactionType] = useState<'physical' | 'service'>('physical');
  const [showEstimator, setShowEstimator] = useState(false);
  const [showKycGate, setShowKycGate] = useState(false);

  // Load matching merchant profile to extract correct active currency settings (Naira or USD)
  const profile = (() => {
    try {
      const saved = localStorage.getItem('trustlink-profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { currency_symbol: '$', currency_code: 'USD' };
  })();

  const defaultCurrencyCode = profile.default_currency_code || profile.currency_code || 'USD';
  const [currencyCode, setCurrencyCode] = useState<'NGN' | 'USD'>(defaultCurrencyCode);
  const currencySymbol = currencyCode === 'NGN' ? '₦' : '$';

  const [validationError, setValidationError] = useState<string | null>(null);
  const kycStatus = getSellerKycStatus(getCurrentSellerId());

  // Load dynamic global system settings
  const sysSettings = (() => {
    try {
      const saved = localStorage.getItem('trustlink_global_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      exchangeRate: DEFAULT_EXCHANGE_RATE,
      localEscrowFee: 1.5,
      localEscrowCap: 2000,
      globalEscrowFee: 2.5,
      kycDeclineLimit: 1000000,
      globalPayoutsEnabled: true,
      singleTxCap: 5000000
    };
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (!productName.trim() || !amount || !buyerPhone.trim()) {
      return;
    }

    const numericAmount = Number(String(amount).replace(/[^0-9.]/g, '')) || 0;
    const numericShippingFee = Number(String(shippingFee).replace(/[^0-9.]/g, '')) || 0;
    const amountInNgn = currencyCode === 'NGN' ? numericAmount : numericAmount * sysSettings.exchangeRate;

    // Standard high-limit safety cap
    if (amountInNgn > sysSettings.singleTxCap) {
      setValidationError(`Transaction Limit Exceeded: The platform transaction threshold is capped at ${currencyCode === 'NGN' ? '₦' : '$'}${currencyCode === 'NGN' ? sysSettings.singleTxCap.toLocaleString() : (sysSettings.singleTxCap / sysSettings.exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 0})} per escrow.`);
      return;
    }

    // Intercept unverified/pending sellers attempting to create links exceeding NGN 50,000
    const currentKycStatus = getSellerKycStatus(getCurrentSellerId());
    if (amountInNgn > getKycGateAmountNgn() && currentKycStatus !== 'verified') {
      setShowKycGate(true);
      return;
    }

    // Checking if amount exceeds compliance limits without verified status
    if (amountInNgn > sysSettings.kycDeclineLimit && currentKycStatus !== 'verified') {
      setValidationError(`Compliance Hold: Escrow values over ₦${sysSettings.kycDeclineLimit.toLocaleString()} require full KYC profile status. Please complete Business Verification in Settings.`);
      return;
    }

    onCreate({
      productName: productName.trim(),
      amount: numericAmount,
      shippingFee: numericShippingFee,
      buyerPhone: buyerPhone.trim(),
      description: description.trim(),
      transactionType,
      currencyCode,
      currencySymbol
    });
  };

  return (
<div id="create-link-modal-container" className="fixed inset-0 [.light-theme_&]:bg-black/25 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
      <div id="create-link-modal-box" className="border w-full max-w-lg rounded-2xl p-6 relative flex flex-col gap-6 text-left shadow-2xl overflow-hidden transition-all" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
      
      {/* Limit Intercept Gate Overlay */}
      {showKycGate && (
        <div className="absolute inset-0 [.light-theme_&]:bg-black/60 bg-black/95 backdrop-blur-md rounded-2xl flex items-center justify-center p-6 text-center z-50 animate-fade-in font-sans">
          <div className="flex flex-col items-center gap-4 max-w-[340px] m-auto">
            <div className="w-12 h-12 rounded-full bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] flex items-center justify-center text-amber-400">
              <span className="text-xl">⚠️</span>
            </div>
            
            <h4 className={`text-sm font-bold uppercase tracking-wider font-mono`} style={{ color: 'var(--text-primary)' }}>Limit Intercept Gate</h4>
            
            <p className={`text-xs leading-relaxed font-sans`} style={{ color: 'var(--text-muted)' }}>
              {kycStatus === 'pending' ? (
                <>
                  Your verification is currently under review. You can create escrow links up to <strong style={{ color: 'var(--text-primary)' }}>₦50,000</strong> while your verification is being processed. This limit will be lifted once your identity is confirmed.
                </>
              ) : (
                <>
                  Generating payment links above <strong style={{ color: 'var(--text-primary)' }}>₦50,000</strong> requires swiftly verifying your identity to satisfy standard compliance guidelines.
                </>
              )}
            </p>
            
            <div className={`text-[11px] font-mono px-3 py-2 rounded border`} style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              Attempted Value: <strong style={{ color: 'var(--brand-emerald)' }}>{currencySymbol}{parseFloat(amount).toLocaleString()}</strong> ({currencyCode})
            </div>

            <div className="flex flex-col gap-2 w-full mt-3">
              {kycStatus !== 'pending' && (
                <button
                  type="button"
                  onClick={() => {
                     window.dispatchEvent(new CustomEvent('open_kyc_modal_global', { 
                       detail: { reason: `We intercepted your checkout link of ${currencySymbol}${parseFloat(amount).toLocaleString()} as it exceeds the ₦50,000 limit for unverified merchants.` } 
                     }));
                     onClose();
                   }}
                  className="w-full py-2 bg-[var(--brand-emerald)] hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider rounded-lg transition-all h-9 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Verify My Identity
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowKycGate(false)}
                className={`w-full py-2 bg-transparent hover:bg-[var(--hover-surface)] border text-xs font-bold uppercase rounded-lg transition-all h-9 cursor-pointer`}
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                {kycStatus === 'pending' ? 'Go Back' : 'Maybe Later'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Close Trigger */}
      <button 
        id="create-link-modal-close-btn"
        onClick={onClose}
        className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors`}
        style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        title="Close Link Generator"
      >
        <X className="w-4 h-4" />
        </button>

        {/* Heading Header */}
        <div id="create-link-modal-header" className="flex gap-2.5 items-center pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div id="create-link-modal-badge" className="w-8.5 h-8.5 rounded-lg bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] flex items-center justify-center text-emerald-500">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <h3 id="create-link-modal-heading" className="text-xs font-bold uppercase tracking-widest font-mono" style={{ color: 'var(--text-primary)' }}>Create Escrow Link</h3>
            <span id="create-link-modal-subtext" className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Define price, shipping rate, and customer details.</span>
          </div>
        </div>

        {/* Create Form */}
        <form id="create-link-modal-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
              <label className="text-[10px] uppercase tracking-wider font-semibold create-link-label" style={{ color: 'var(--text-muted)' }}>Transaction Type (Required)</label>
              <select
                id="create-link-form-type"
                required
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value as 'physical' | 'service')}
                className="rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/60 transition-colors font-sans w-full cursor-pointer"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
              >
                <option value="physical">Physical Product</option>
                <option value="service">Service or Digital Deliverable</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
              <label className="text-[10px] uppercase tracking-wider font-semibold create-link-label" style={{ color: 'var(--text-muted)' }}>Payment Currency</label>
              <select
                id="create-link-form-currency"
                required
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value as 'NGN' | 'USD')}
                className="rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/60 transition-colors font-sans w-full cursor-pointer"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
              >
                <option value="NGN">Nigerian Naira NGN ₦</option>
                <option value="USD">US Dollar USD $</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
              <label className="text-[10px] uppercase tracking-wider font-semibold create-link-label" style={{ color: 'var(--text-muted)' }}>Product Title / Service Name</label>
              <input
                id="create-link-form-name"
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder={transactionType === 'service' ? "e.g. Website Development Contract" : "e.g. Original Nike Air Max 90"}
                className="rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/60 transition-colors font-sans"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
              />
            </div>

            <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
              <label className="text-[10px] uppercase tracking-wider font-semibold create-link-label" style={{ color: 'var(--text-muted)' }}>Buyer Phone Number</label>
              <input
                id="create-link-form-phone"
                type="tel"
                required
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                placeholder="Enter buyer phone number with country code"
                className="rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/60 transition-colors font-mono"
                style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
              />
            </div>

            <div className="flex flex-col gap-1.5 font-sans">
              <label className="text-[10px] uppercase tracking-wider font-semibold create-link-label" style={{ color: 'var(--text-muted)' }}>ITEM PRICE ({currencyCode})</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono select-none" style={{ color: 'var(--text-muted)' }}>{currencySymbol}</span>
                <input
                  id="create-link-form-amount"
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 145000"
                  className="w-full rounded-lg pl-7 pr-3 py-2 text-xs focus:outline-none focus:border-emerald-500/60 transition-colors font-mono"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                />
              </div>
              {amount && !isNaN(parseFloat(amount)) && (
                <span id="create-link-form-approx" className="text-[10px] mt-0.5 font-mono" style={{ color: 'var(--text-muted)' }}>
                  Approx. {currencyCode === 'NGN' ? '$' : '₦'}
                  {currencyCode === 'NGN' 
                    ? (parseFloat(amount) / sysSettings.exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : (parseFloat(amount) * sysSettings.exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 0 })
                  } {currencyCode === 'NGN' ? 'USD' : 'NGN'}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5 font-sans">
              <label className="text-[10px] uppercase tracking-wider font-semibold create-link-label" style={{ color: 'var(--text-muted)' }}>
                {transactionType === 'service' ? 'Optional Milestone Fee' : `DELIVERY FEE (${currencyCode})`}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono select-none" style={{ color: 'var(--text-muted)' }}>{currencySymbol}</span>
                <input
                  id="create-link-form-shipping"
                  type="number"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full rounded-lg pl-7 pr-4 py-2 text-xs focus:outline-none focus:border-emerald-500/60 transition-colors font-mono"
                  style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          </div>

          {/* Real-time escrow payout estimates */}
          {amount && !isNaN(parseFloat(amount)) && (
            <div className={`border rounded-xl overflow-hidden font-sans`} style={{ borderColor: 'var(--border)' }}>
              <button
                type="button"
                onClick={() => setShowEstimator(!showEstimator)}
                className="w-full px-3 py-2 [.light-theme_&]:bg-[var(--surface2)] [.light-theme_&]:hover:bg-[var(--hover-surface)] [.light-theme_&]:border-[var(--border)] bg-[var(--surface2)] hover:bg-[var(--surface)] border-[var(--border)] text-[10px] font-bold text-emerald-400 flex justify-between items-center transition-colors cursor-pointer [.light-theme_&]:text-emerald-600 border-b"
                style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{showEstimator ? 'Hide' : 'Reveal'} Real-time Escrow & Net Payout Estimate</span>
                </span>
                <span className="text-[8.5px] uppercase font-mono px-1.5 py-0.5 rounded bg-[rgba(16,185,129,0.1)] font-bold tracking-wider" style={{ color: 'var(--brand-emerald)' }}>Calculate Fees</span>
              </button>
              {showEstimator && (
                <div className="p-1 animate-fade-in" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <TransactionFeeCalculator
                    initialAmount={parseFloat(amount)}
                    currencyCode={currencyCode}
                    currencySymbol={currencySymbol}
                    showHeader={false}
                  />
                </div>
              )}
            </div>
          )}

          {/* Description textarea */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-wider font-semibold create-link-label" style={{ color: 'var(--text-muted)' }}>
              {transactionType === 'service' ? 'Scope of Work / Deliverables' : 'Item Specifications (Optional)'}
            </label>
            <textarea
              id="create-link-form-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={transactionType === 'service' ? "e.g. Fully responsive Figma design and Next.js frontend implementation. 3 rounds of revisions allowed." : "e.g. Size 43, Midnight Navy colorway. Delivered via GIG Logistics in excellent condition."}
              className="rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/60 transition-colors h-16 font-sans resize-none"
              style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
            />
          </div>

          {/* Secure vault lock description */}
          <div id="create-link-modal-info-banner" className="p-3 rounded-lg border flex flex-col gap-2.5 text-[10px]" style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}>
            <div className="flex items-start gap-2.5">
              <Info className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5 animate-pulse" />
              <span id="create-link-modal-info-text" className="leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Upon generation, we dispatch a distinct secure checkout API link. Buyer deposits are immediately locked inside our regulated CBN-compliant secure vault.
              </span>
            </div>
            <div id="create-link-modal-info-footer" className="flex items-center gap-2 border-t pt-2 px-1" style={{ borderTopColor: 'var(--border)' }}>
              <span id="create-link-modal-info-footer-label" className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>Buyer Confirmation Protocol:</span>
              <span id="create-link-modal-info-footer-status" className="font-mono text-emerald-400 font-extrabold uppercase bg-[rgba(16,185,129,0.1)] px-2 py-0.5 rounded leading-none text-[9.5px]">
                {transactionType === 'service' ? 'Approve Deliverable' : 'Confirm Delivery'}
              </span>
            </div>
          </div>

          {/* Warning and validation feedback block */}
          {validationError && (
            <div className="p-3 border text-xs rounded-lg font-medium font-sans flex items-start gap-2 animate-fade-in" style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}>
              <span className="text-sm">⚠️</span>
              <span className="leading-normal" style={{ color: 'var(--text-primary)' }}>{validationError}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2.5 justify-end pt-1">
            <button
              id="create-link-modal-cancel-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all active:scale-[0.98]"
              style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              Cancel
            </button>
            <button
              id="create-link-modal-submit-btn"
              type="submit"
              className="px-4.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/10 transition-colors active:scale-[0.98]"
            >
              <span>Generate Escrow Link</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}