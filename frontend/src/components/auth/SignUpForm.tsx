/**
 * SignUpForm.tsx
 * Renders the upgraded sign up form with Name/Business, email, and password fields.
 * Includes direct checkout path live preview. Handles registration validation on blur.
 * Used by: AuthPage.tsx
 */

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  RefreshCw, 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SlideToVerify from '../SlideToVerify';
import { useToast } from '../ToastContext';
import { signUpSeller } from '../../lib/auth';

interface SignUpFormProps {
  onSignUpSuccess: (details: { name: string; email: string; currency_code: 'NGN' | 'USD'; currency_symbol: '₦' | '$' }) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  referrerHandle?: string;
}

export default function SignUpForm({
  onSignUpSuccess,
  isLoading,
  setIsLoading,
  referrerHandle
}: SignUpFormProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState(false);

  // Blur / Touched tracking for UX validation timing
  const [touched, setTouched] = useState<{ fullName?: boolean; email?: boolean; password?: boolean }>({});
  const [localSubmittingState, setLocalSubmittingState] = useState<'idle' | 'creating' | 'created'>('idle');

  // Validation helpers
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  // Strip harmful characters helper
  const stripHarmfulChars = (str: string) => {
    return str.replace(/[<>{}[\];]/g, '');
  };

  // Validate name
  const isFullNameValid = fullName.trim().length >= 2 && fullName.trim().length <= 80 && nameRegex.test(fullName.trim());
  // Validate email
  const isEmailValid = emailRegex.test(email.trim());
  // Validate password
  const isPasswordValid = passwordRegex.test(password);

  // Real-time error messages
  const errors = {
    fullName: touched.fullName && !isFullNameValid 
      ? (!fullName.trim() ? 'Name or business name is required' : 'Please enter a valid name using letters only (2-80 characters)') 
      : null,
    email: touched.email && !isEmailValid 
      ? (!email.trim() ? 'Email address is required' : 'Please enter a valid email address') 
      : null,
    password: touched.password && !isPasswordValid 
      ? (!password ? 'Password is required' : 'Password must be at least 8 characters with uppercase, lowercase, and a number') 
      : null,
  };

  const handleBlur = (field: 'fullName' | 'email' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'fullName') {
      setFullName(prev => stripHarmfulChars(prev).trim());
    }
  };

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullName(stripHarmfulChars(e.target.value));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(stripHarmfulChars(e.target.value));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(stripHarmfulChars(e.target.value));
  };

  // Password Strength Logic
  const getPasswordStrength = (p: string) => {
    if (!p) return { score: 0, label: '', textClass: '', barColor: '' };
    if (p.length < 8) {
      return { score: 1, label: 'Weak', textClass: 'text-red-400', barColor: 'bg-red-500' };
    }

    const hasLower = /[a-z]/.test(p);
    const hasUpper = /[A-Z]/.test(p);
    const hasDigit = /[0-9]/.test(p);
    const hasSymbol = /[^A-Za-z0-9]/.test(p);
    
    const typesCount = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;
    
    if (p.length >= 8 && hasLower && hasUpper && hasDigit) {
      if (hasSymbol) {
        return { score: 4, label: 'Strong', textClass: 'text-emerald-400', barColor: 'bg-emerald-500' };
      }
      return { score: 3, label: 'Good', textClass: 'text-blue-400', barColor: 'bg-blue-500' };
    }
    
    return { score: 2, label: 'Fair', textClass: 'text-amber-400', barColor: 'bg-amber-500' };
  };

  const strengthInfo = getPasswordStrength(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark everything touched on submit attempt
    setTouched({ fullName: true, email: true, password: true });
    setTermsError(!termsAccepted);

    if (!termsAccepted) {
      return;
    }

    if (!isFullNameValid || !isEmailValid || !isPasswordValid) {
      return;
    }

    if (!isVerified) {
      triggerToast('Please slide to verify securely.');
      return;
    }

    (async () => {
      try {
        setLocalSubmittingState('creating');
        setIsLoading(true);
        await signUpSeller(email.trim(), password, fullName.trim(), undefined, referrerHandle);
        setLocalSubmittingState('created');
        onSignUpSuccess({
          name: fullName.trim(),
          email: email.trim(),
          currency_code: currency,
          currency_symbol: currency === 'NGN' ? '₦' : '$'
        });
      } catch (err: any) {
        const msg = err?.message || 'Failed to create account';
        warn(msg);
      } finally {
        setIsLoading(false);
      }
    })();
  };

  const { warn, info } = useToast();

  const triggerToast = (msg: string) => {
    warn(msg);
  };

  const handleGoogleSignUp = (e: React.MouseEvent) => {
    e.preventDefault();
    info('Google authentication will be provisioned once OAuth is set up.');
  };

  const isLight = false;

  return (
    <div className="flex flex-col gap-5 text-left">
      
      {/* Welcome Header */}
      <div className="flex flex-col items-center text-center pb-2 border-b border-zinc-900/40">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
          <ShieldCheck className="w-5.5 h-5.5 text-emerald-500" />
        </div>
        <h2 className="text-lg font-extrabold text-white leading-snug">
          Create your free account
        </h2>
        <p className="text-[11.5px] text-zinc-500 mt-1">
          Join 2,400+ businesses using escrow to trade safely
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        
        {/* Full Name Field */}
        <div className="flex flex-col gap-2 text-left">
          <label className="text-[9.5px] uppercase tracking-wider font-bold text-zinc-500">
            Your Name or Business Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
            type="text"
            value={fullName}
            onBlur={() => handleBlur('fullName')}
            onChange={handleFullNameChange}
            placeholder="e.g. VoltKicks Lagos, Adesola K."
            maxLength={80}
            className={`w-full h-11 rounded-lg pl-9.5 pr-10 text-xs transition-all duration-200 outline-none focus:border-[#10b981] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)] border border-transparent ${
              errors.fullName
                ? 'bg-red-500/5 border-red-500/30 text-white placeholder:text-zinc-650'
                : 'bg-black border-zinc-900 text-white placeholder:text-zinc-600 font-normal hover:border-zinc-800'
            }`}
          />
            {touched.fullName && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }}>
                  {isFullNameValid ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                </motion.div>
              </div>
            )}
          </div>
          {errors.fullName && (
            <motion.span 
              initial={{ opacity: 0, y: -2 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="text-[#f87171] text-[11px] font-normal mt-0.5 block"
            >
              {errors.fullName}
            </motion.span>
          )}
        </div>

        {/* Email Address Field */}
        <div className="flex flex-col gap-2 text-left">
          <label className="text-[9.5px] uppercase tracking-wider font-bold text-zinc-500">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
            type="email"
            value={email}
            onBlur={() => handleBlur('email')}
            onChange={handleEmailChange}
            placeholder="e.g. praise@coutures.ng"
            maxLength={254}
            className={`w-full h-11 rounded-lg pl-9.5 pr-10 text-xs transition-all duration-200 outline-none focus:border-[#10b981] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)] border border-transparent ${
              errors.email
                ? 'bg-red-500/5 border-red-500/30 text-white placeholder:text-zinc-650'
                : 'bg-black border-zinc-900 text-white placeholder:text-zinc-600 font-normal hover:border-zinc-800'
            }`}
          />
            {touched.email && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }}>
                  {isEmailValid ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                </motion.div>
              </div>
            )}
          </div>
          {errors.email && (
            <motion.span 
              initial={{ opacity: 0, y: -2 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="text-[#f87171] text-[11px] font-normal mt-0.5 block"
            >
              {errors.email}
            </motion.span>
          )}
        </div>

        {/* Password field with show/hide toggle */}
        <div className="flex flex-col gap-2 text-left">
          <label className="text-[9.5px] uppercase tracking-wider font-bold text-zinc-500">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onBlur={() => handleBlur('password')}
            onChange={handlePasswordChange}
            placeholder="••••••••"
            maxLength={128}
            className={`w-full h-11 rounded-lg pl-9.5 pr-16 text-xs transition-all duration-200 outline-none focus:border-[#10b981] focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)] border border-transparent ${
              errors.password
                ? 'bg-red-500/5 border-red-500/30 text-white placeholder:text-zinc-650'
                : 'bg-black border-zinc-900 text-white placeholder:text-zinc-600 font-normal hover:border-zinc-800'
            }`}
          />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {touched.password && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }}>
                  {isPasswordValid ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                </motion.div>
              )}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-zinc-550 hover:text-white transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {errors.password && (
            <motion.span 
              initial={{ opacity: 0, y: -2 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="text-[#f87171] text-[11px] font-normal mt-0.5 block"
            >
              {errors.password}
            </motion.span>
          )}

          {/* Password strength bar */}
          {password.length > 0 && (
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((seg) => (
                  <div 
                    key={seg} 
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                      seg <= strengthInfo.score 
                        ? strengthInfo.barColor 
                        : 'bg-zinc-850'
                    }`}
                  />
                ))}
              </div>
              <span className={`text-[10px] font-bold mt-0.5 block ${strengthInfo.textClass}`}>
                Strength: {strengthInfo.label}
              </span>
            </div>
          )}
        </div>

        {fullName.trim() && (
          <div className="p-2 rounded-lg text-[10.5px] leading-relaxed mt-0.5 animate-fade-in text-left bg-black/50 border border-zinc-900 text-zinc-450">
            Your direct checkout path: <span className="text-emerald-500 font-bold font-mono">trova.co/pay/{(fullName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')) || 'your-store'}</span>
          </div>
        )}

        {/* Dynamic human confirmation slider safeguard */}
        <div className="my-1.5 flex flex-col gap-1.5 animate-fade-in">
          <label className="text-[9.5px] uppercase tracking-wider font-bold text-zinc-500">Security Safeguard</label>
          <SlideToVerify onVerify={setIsVerified} isVerified={isVerified} />
        </div>

        <div className="mb-4 flex flex-col gap-1.5 text-left">
          <label className="flex items-start gap-2 text-[13px] text-[#71717a]">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => {
                setTermsAccepted(e.target.checked);
                setTermsError(false);
              }}
              className="mt-0.5 h-4 w-4 accent-[#10b981]"
            />
            <span>
              I have read and agree to the{' '}
              <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-[#10b981] hover:underline">
                Terms of Escrow Service
              </a>
              {' '}and{' '}
              <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-[#10b981] hover:underline">
                Privacy Policy
              </a>
              .
            </span>
          </label>
          {termsError && (
            <motion.span 
              initial={{ opacity: 0, y: -2 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="text-[#f87171] text-[12px] font-normal"
            >
              You must accept the Terms of Service and Privacy Policy to create an account.
            </motion.span>
          )}
        </div>

        {/* Create My Free Account Button */}
        <motion.button
          type="submit"
          disabled={isLoading || !isVerified || !termsAccepted}
          whileHover={{ scale: isVerified && termsAccepted ? 1.01 : 1 }}
          whileTap={{ scale: isVerified && termsAccepted ? 0.99 : 1 }}
          transition={{ duration: 0.15 }}
          className={`w-full mt-2 h-12 rounded-lg text-black text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
            isVerified && termsAccepted
              ? 'bg-emerald-500 hover:bg-emerald-400 opacity-100' 
              : 'bg-zinc-800 text-zinc-500 border border-zinc-900'
          }`}
        >
          {localSubmittingState === 'creating' ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
              <span>Creating your account...</span>
            </>
          ) : localSubmittingState === 'created' ? (
            <>
              <CheckCircle className="w-4 h-4 text-black font-black" />
              <span>Account Created!</span>
            </>
          ) : (
            <span>Create My Free Account →</span>
          )}
        </motion.button>

        {/* OR Divider with visual horizontal lines */}
        <div className="flex items-center gap-3 my-2 select-none">
          <div className="h-[1px] flex-1 bg-zinc-900/60" />
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-500">Or continue with</span>
          <div className="h-[1px] flex-1 bg-zinc-900/60" />
        </div>

        {/* Continue with Google button */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          className="h-11 rounded-lg bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-colors text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer w-full"
        >
          {/* Custom vector stylized colored Google G logo */}
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5.04c1.67 0 3.17.58 4.35 1.71l3.25-3.25C17.64 1.58 14.99 1 12 1 7.35 1 3.39 3.65 1.5 7.5l3.85 3C6.25 7.5 8.9 5.04 12 5.04z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.82-.07-1.61-.21-2.3H12v4.4h6.5c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-2 3.68-4.94 3.68-8.55z"
            />
            <path
              fill="#FBBC05"
              d="M5.35 14.5c-.24-.72-.37-1.49-.37-2.3s.13-1.58.37-2.3L1.5 6.9C.54 8.44 0 10.16 0 12c0 1.84.54 3.56 1.5 5.1l3.85-2.6z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.24 0 5.96-1.07 7.95-2.92l-3.7-2.87c-1.03.69-2.34 1.1-3.75 1.1-3.1 0-5.75-2.46-6.65-5.46L1.5 15.1c1.89 3.85 5.85 6.5 10.5 6.5z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>
      </form>
    </div>
  );
}
