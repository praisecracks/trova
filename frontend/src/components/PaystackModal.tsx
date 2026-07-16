import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Landmark, 
  Hash, 
  X, 
  Lock, 
  ShieldCheck, 
  Loader2, 
  Check, 
  Copy, 
  ArrowLeft,
  Smartphone,
  CheckCircle,
  HelpCircle,
  Wallet
} from 'lucide-react';

interface PaystackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (method: string) => void;
  grossTotal: number;
  productName: string;
  vendorName: string;
  email?: string;
  currencySymbol?: string;
  currencyCode?: string;
}

// REQUIRES API INTEGRATION
// Renders secure simulated card, bank transfer, and fintech wallet deposit flows.
// Production deployment REQUIRES integrating a real Payment Gateway SDK / API (e.g. Paystack Inline JS, Flutterwave, or Stripe)
// to collect real customer fund clearances securely, handle true cards PCI-compliance, and verify incoming bank rails.
export default function PaystackModal({
  isOpen,
  onClose,
  onSuccess,
  grossTotal,
  productName,
  vendorName,
  email = 'praiseoluwabumi@gmail.com',
  currencySymbol = '₦',
  currencyCode = 'NGN'
}: PaystackModalProps) {
  const [activeTab, setActiveTab] = useState<'card' | 'transfer' | 'wallet'>('card');
  const [step, setStep] = useState<'idle' | 'processing' | 'otp' | 'success'>('idle');
  const [copied, setCopied] = useState(false);
  const [timer, setTimer] = useState(1200); // 20 mins bank transfer countdown
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');

  // Card Inputs state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [formError, setFormError] = useState('');

  // Wallet inputs state
  const [walletId, setWalletId] = useState('');

  // Trigger countdown for Bank Transfer
  useEffect(() => {
    if (!isOpen || activeTab !== 'transfer') return;
    const interval = setInterval(() => {
      setTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError('');
    let val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let matches = val.match(/\d{4,16}/g);
    let match = (matches && matches[0]) || '';
    let parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(' '));
    } else {
      setCardNumber(val.substring(0, 19));
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError('');
    let val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (val.length >= 2) {
      setCardExpiry(`${val.substring(0, 2)} / ${val.substring(2, 4)}`);
    } else {
      setCardExpiry(val);
    }
  };

  const detectCardLogo = (num: string) => {
    const cleanNum = num.replace(/\s+/g, '');
    if (cleanNum.startsWith('4')) return 'Visa';
    if (cleanNum.startsWith('5')) return 'MasterCard';
    if (cleanNum.startsWith('506') || cleanNum.startsWith('650')) return 'Verve';
    return 'Card';
  };

  const executePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'card') {
      if (cardNumber.length < 18 || cardExpiry.length < 7 || cardCvv.length < 3) {
        setFormError('Please complete all card details.');
        return;
      }
      setStep('processing');
      setTimeout(() => {
        setStep('otp');
      }, 1500);
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 4) {
      setOtpError('Please enter a valid OTP code.');
      return;
    }
    setStep('processing');
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onSuccess('Card Payment');
        setStep('idle');
        setCardNumber('');
        setCardExpiry('');
        setCardCvv('');
        setOtpCode('');
      }, 1500);
    }, 1800);
  };

  const handleDirectSimulatedTransfer = () => {
    setStep('processing');
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onSuccess('Bank Transfer');
        setStep('idle');
      }, 1500);
    }, 2000);
  };

  const handleWalletSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletId) return;
    setStep('processing');
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onSuccess('Wallet Payment');
        setStep('idle');
        setWalletId('');
      }, 1500);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Dark overlay with fade effect */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md transition-opacity"
      />

      <div 
        style={{ 
          backgroundColor: 'var(--surface)', 
          borderColor: 'var(--border)',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.1)'
        }} 
        className="relative border rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden text-left font-sans text-[var(--text-primary)]"
      >
        
        {/* Custom Header banner style */}
        <div 
          style={{ 
            borderColor: 'var(--border)', 
            backgroundColor: 'rgba(16, 185, 129, 0.08)' 
          }} 
          className="border-b px-6 py-5 flex justify-between items-center"
        >
          <div className="flex flex-col text-left">
            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{vendorName}</span>
            <span className="text-[11.5px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{productName}</span>
          </div>

          <div className="flex flex-col items-end shrink-0">
            <span className="text-[9px] uppercase font-semibold font-mono" style={{ color: 'var(--text-muted)' }}>Amount due</span>
            <span className="font-mono text-lg font-black tracking-tight text-emerald-600 dark:text-emerald-400">{currencySymbol}{grossTotal.toLocaleString()}</span>
          </div>
        </div>

        {step === 'processing' && (
          <div className="p-12 flex flex-col items-center justify-center gap-4 text-center min-h-[320px] animate-fade-in bg-[var(--surface)]">
            <Loader2 className="w-10 h-10 text-emerald-500 dark:text-emerald-400 animate-spin" />
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Authorizing settlement secure hold...</span>
              <span className="text-[10.5px] font-mono" style={{ color: 'var(--text-muted)' }}>Verifying safe reserve funds on escrow partner ledger</span>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="p-12 flex flex-col items-center justify-center gap-5 text-center min-h-[320px] animate-fade-in bg-[var(--surface)]">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
              <Check className="w-8 h-8 font-black" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-sm font-extrabold uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>Verification Completed!</h3>
              <p className="text-[11.5px] leading-relaxed max-w-sm" style={{ color: 'var(--text-muted)' }}>
                Your payment of {currencySymbol}{grossTotal.toLocaleString()} has been securely processed and deposited inside the Trova escrow parameters.
              </p>
            </div>
          </div>
        )}

        {step === 'otp' && (
          <div className="p-6 sm:p-8 flex flex-col gap-5 min-h-[320px] animate-fade-in bg-[var(--surface)]">
            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => setStep('idle')} 
                style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
                className="w-7 h-7 border rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex flex-col">
                <span className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>One-Time Password (OTP) Verification</span>
                <span className="text-[9.5px] font-mono" style={{ color: 'var(--text-muted)' }}>Verification sent securely to registered profile</span>
              </div>
            </div>

            <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
              <p className="text-[11.5px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                A simulation OTP was triggered. Enter any 6 digits (e.g. <strong className="text-emerald-500 dark:text-emerald-400">123456</strong>) below to verify:
              </p>
              
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="------"
                  value={otpCode}
                  onChange={(e) => {
                    setOtpError('');
                    setOtpCode(e.target.value.replace(/[^0-9]/g, ''));
                  }}
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
                  className="w-full text-center text-[var(--text-primary)] rounded-xl py-4 font-mono text-xl tracking-widest focus:outline-none focus:border-emerald-500 border"
                />
                {otpError && <p className="text-red-500 text-[11px] font-sans font-semibold">{otpError}</p>}
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] transition-all text-black py-3 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Submit Secure OTP Code
              </button>
            </form>
          </div>
        )}

        {step === 'idle' && (
          <div className="flex flex-col sm:flex-row flex-1 min-h-[320px] bg-[var(--surface)]">
            {/* Sidebar menu selection tabs */}
            <div 
              style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
              className="sm:w-1/3 border-r flex flex-col p-2.5 gap-1 select-none"
            >
              <span className="text-[9px] font-mono font-bold uppercase p-2 tracking-wider text-left" style={{ color: 'var(--text-muted)' }}>Payment Options</span>
              
              <button 
                type="button"
                onClick={() => setActiveTab('card')}
                className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === 'card' 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50'
                }`}
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                <span>Pay with Card</span>
              </button>

              <button 
                type="button"
                onClick={() => setActiveTab('transfer')}
                className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === 'transfer' 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50'
                }`}
              >
                <Landmark className="w-4 h-4 shrink-0" />
                <span>Bank Transfer</span>
              </button>

              <button 
                type="button"
                onClick={() => setActiveTab('wallet')}
                className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                  activeTab === 'wallet' 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50'
                }`}
              >
                <Wallet className="w-4 h-4 shrink-0" />
                <span>Pay with Wallet</span>
              </button>

              <div className="mt-auto p-2 border-t flex flex-col gap-1.5 text-[9px] select-none" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                  <Lock className="w-2.5 h-2.5" />
                  <span>Secured by Trova</span>
                </div>
              </div>
            </div>

            {/* Content view tabs */}
            <div className="flex-1 p-5 sm:p-6 text-[var(--text-primary)]">
              
              {activeTab === 'card' && (
                <form onSubmit={executePaymentSubmit} className="flex flex-col gap-4">
                  
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[9.5px] uppercase font-mono tracking-wider" style={{ color: 'var(--text-muted)' }}>Credit Card Number</label>
                      <span className="text-[9px] text-emerald-500 dark:text-emerald-400 font-mono font-bold uppercase">{cardNumber && detectCardLogo(cardNumber)}</span>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={19}
                      placeholder="5399 2240 1289 9022"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
                      className="w-full border rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] placeholder-zinc-450 dark:placeholder-zinc-600 font-mono focus:outline-none focus:border-emerald-500 text-left"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9.5px] uppercase font-mono tracking-wider" style={{ color: 'var(--text-muted)' }}>Expiry Date</label>
                      <input
                        type="text"
                        required
                        maxLength={7}
                        placeholder="MM / YY"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
                        className="w-full border rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] placeholder-zinc-450 dark:placeholder-zinc-600 font-mono focus:outline-none focus:border-emerald-500 text-left"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9.5px] uppercase font-mono tracking-wider" style={{ color: 'var(--text-muted)' }}>CVV Code</label>
                      <input
                        type="password"
                        required
                        maxLength={3}
                        placeholder="***"
                        value={cardCvv}
                        onChange={(e) => {
                          setFormError('');
                          setCardCvv(e.target.value.replace(/[^0-9]/g, ''));
                        }}
                        style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
                        className="w-full border rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] placeholder-zinc-450 dark:placeholder-zinc-600 font-mono focus:outline-none focus:border-emerald-500 text-left"
                      />
                    </div>
                  </div>

                  {formError && <p className="text-red-500 text-[10.5px] font-sans font-semibold text-left">{formError}</p>}

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-lg mt-1"
                  >
                    Pay {currencySymbol}{grossTotal.toLocaleString()} Securely
                  </button>
                </form>
              )}

              {activeTab === 'transfer' && (
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold font-mono uppercase" style={{ color: 'var(--text-muted)' }}>Interactive Bank Transfer</span>
                    <span className="text-[10px] font-mono flex items-center gap-1.5 font-bold" style={{ color: 'var(--text-muted)' }}>
                      <Loader2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400 animate-spin" />
                      <span>{formatTime(timer)} expiring</span>
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-left" style={{ color: 'var(--text-muted)' }}>
                    Send exact amounts from your banking app. Dynamic virtual escrow account settles instantly:
                  </p>

                  <div 
                    style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
                    className="border rounded-xl p-3.5 flex flex-col gap-2 font-mono text-xs text-left"
                  >
                    <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Beneficiary Bank</span>
                      <span className="font-bold text-[11px]" style={{ color: 'var(--text-primary)' }}>Wemaz Escrow Trust (Partner)</span>
                    </div>

                    <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: 'var(--border)' }}>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Account Number</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm select-all">9022634892</span>
                        <button 
                          type="button"
                          onClick={() => handleCopy('9022634892')} 
                          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                          className="w-6 h-6 rounded flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] border cursor-pointer transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pb-1">
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Account Name</span>
                      <span className="font-bold uppercase text-[10px]" style={{ color: 'var(--text-primary)' }}>Trova Escrow - {grossTotal > 0 ? productName.substring(0, 10) : 'BOOTS'}</span>
                    </div>
                  </div>

                  {copied && (
                    <p className="text-emerald-600 dark:text-emerald-400 text-[10.5px] font-sans font-bold text-center animate-pulse">
                      Account number copied to clipboard!
                    </p>
                  )}

                  <button
                    onClick={handleDirectSimulatedTransfer}
                    style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
                    className="w-full py-3 text-[var(--text-primary)] hover:bg-zinc-100 dark:hover:bg-zinc-900 font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all border"
                  >
                    I Have Sent The Funds (Verify Now)
                  </button>
                </div>
              )}

              {activeTab === 'wallet' && (
                <form onSubmit={handleWalletSubmit} className="flex flex-col gap-4">
                  <span className="text-[10px] font-bold font-mono uppercase text-left block" style={{ color: 'var(--text-muted)' }}>Wallet Payment Gateway</span>
                  <p className="text-xs leading-relaxed text-left" style={{ color: 'var(--text-muted)' }}>
                    Input your wallet address or telephone digits below to complete simulated settlement holding:
                  </p>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9.5px] uppercase font-mono text-left block" style={{ color: 'var(--text-muted)' }}>Wallet Phone Number or Wallet ID</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter OPay, Kuda, or PalmPay number"
                      value={walletId}
                      onChange={(e) => setWalletId(e.target.value)}
                      style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--border)' }}
                      className="w-full border rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] placeholder-zinc-450 dark:placeholder-zinc-650 focus:outline-none focus:border-emerald-500 text-left"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                  >
                    Confirm Payment
                  </button>
                </form>
              )}

            </div>
          </div>
        )}

        <div 
          style={{ backgroundColor: 'var(--bg)', borderTopColor: 'var(--border)' }}
          className="border-t px-6 py-4 flex justify-between items-center text-[10px] font-mono select-none"
        >
          <div className="flex items-center gap-1.5 font-bold" style={{ color: 'var(--text-muted)' }}>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>Secured by Trova Escrow</span>
          </div>

          <button
            onClick={onClose}
            className="font-bold transition-all hover:opacity-80 cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
          >
            Cancel Payment
          </button>
        </div>

      </div>
    </div>
  );
}
