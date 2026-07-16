/**
 * SignInForm.tsx
 * Renders the upgraded sign in form with email, password fields, and validation on blur.
 * Includes Forgot Password panel slidedown, Remember Me local storage flags, and Google OAuth mock option.
 * Used by: AuthPage.tsx
 */

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Lock, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Eye, 
  EyeOff, 
  ShieldCheck,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SlideToVerify from '../SlideToVerify';
import { useToast } from '../ToastContext';
import { signInUser, getCurrentProfile, getOrCreateSellerProfile, getAuthErrorMessage, resendSignupConfirmation } from '../../lib/auth';

interface SignInFormProps {
  onSignInSuccess: (details: {
    id?: string;
    name: string;
    email: string;
    role?: 'seller' | 'buyer' | 'admin';
    kycStatus?: string;
  }) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  initialEmail?: string;
  initialPassword?: string;
}

export default function SignInForm({
  onSignInSuccess,
  isLoading,
  setIsLoading,
  initialEmail = '',
  initialPassword = ''
}: SignInFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Forgot password modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Touched / blur states
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  
  const { warn, info } = useToast();

  // Auto load remembered email if possible
  useEffect(() => {
    try {
      const savedRemember = localStorage.getItem('trustlink_remember_me') === 'true';
      if (savedRemember) {
        const savedEmail = localStorage.getItem('trustlink_saved_email');
        if (savedEmail) {
          setEmail(savedEmail);
          setRememberMe(true);
        }
      }
    } catch (e) {}
  }, []);

  const triggerToast = (msg: string) => {
    warn(msg);
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email.trim());
  const isPasswordValid = password.length >= 6;

  // Real-time plain errors on blur
  const errors = {
    email: touched.email && !isEmailValid 
      ? (!email.trim() ? 'Email address is required' : 'Please enter a valid email address') 
      : null,
    password: touched.password && !isPasswordValid 
      ? (!password ? 'Password is required' : 'Password must be at least 6 characters for security') 
      : null
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    if (!isVerified) {
      triggerToast('Please slide to verify securely.');
      return;
    }

    // Save remember me flag
    try {
      if (rememberMe) {
        localStorage.setItem('trustlink_remember_me', 'true');
        localStorage.setItem('trustlink_saved_email', email.trim());
      } else {
        localStorage.removeItem('trustlink_remember_me');
        localStorage.removeItem('trustlink_saved_email');
      }
    } catch (err) {}

(async () => {
       try {
         setIsLoading(true);
         const authUser = await signInUser(email.trim(), password);
         let profile = await getCurrentProfile();

         if (!profile && authUser) {
const result = await getOrCreateSellerProfile(authUser);
            if (result.success && result.profile) {
              profile = {
                id: result.profile.id,
                email: result.profile.email,
                role: 'seller' as const,
                display_name: result.profile.displayName,
                phone: result.profile.phone,
                metadata: {},
                kyc_status: result.profile.kycStatus
              };
            }
          }

          if (!profile) {
            throw new Error('Account profile not found. Create a seller account or contact support.');
          }

          const displayName = profile.display_name || email.split('@')[0];
          const kycStatus = profile.kyc_status || 'unverified';

          onSignInSuccess({
            id: profile.id,
            name: displayName,
            email: profile.email,
            role: profile.role,
            kycStatus: kycStatus
          });
      } catch (err: any) {
        const message = getAuthErrorMessage(err, 'Invalid login credentials');
        warn(message);

        if ((err as { code?: string })?.code === 'email_not_confirmed') {
          resendSignupConfirmation(email.trim()).catch(() => {
            warn('Confirmation email could not be resent right now. Try again shortly or contact support.');
          });
        }
      } finally {
        setIsLoading(false);
      }
    })();
  };

  // REQUIRES EMAIL SERVICE API INTEGRATION
  const handlePasswordResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim() || !emailRegex.test(resetEmail.trim())) {
      triggerToast('Please enter a valid email address.');
      return;
    }
    setResetLoading(true);
    setTimeout(() => {
      setResetLoading(false);
      setResetSuccess(true);
    }, 1500);
  };

  const handleGoogleSignIn = (e: React.MouseEvent) => {
    e.preventDefault();
    info('Google authentication will be provisioned once OAuth is set up.');
  };

  const isLight = false;

  return (
    <div className="flex flex-col gap-6 text-left select-none">
      
      {/* Password Reset Modal Overlay (FIX 4) */}
      <AnimatePresence>
        {showResetModal && (
          <div 
            onClick={() => setShowResetModal(false)}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-[#020202]/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-[#0a0a0c] border border-white/[0.08] rounded-[28px] p-7 md:p-8 text-zinc-200 overflow-hidden font-sans shadow-[0_24px_60px_rgba(0,0,0,0.9)]"
            >
              {/* Decorative radial inner flair */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/[0.03] rounded-full blur-3xl pointer-events-none" />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="absolute top-5 right-5 p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-900/60 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {!resetSuccess ? (
                /* Form State */
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!resetEmail.trim() || !emailRegex.test(resetEmail.trim())) {
                      triggerToast('Please enter a valid email address.');
                      return;
                    }
                    setResetLoading(true);
                    setTimeout(() => {
                      setResetLoading(false);
                      setResetSuccess(true);
                    }, 1500);
                  }} 
                  className="flex flex-col gap-5"
                >
                  {/* Top center Lock icon */}
                  <div className="flex justify-center mt-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_4px_15px_rgba(16,185,129,0.06)]">
                      <Lock className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="text-center flex flex-col gap-1.5 mt-1 select-none">
                    <h3 className="text-lg font-black tracking-tight text-white">Reset Password</h3>
                    <p className="text-[12px] text-zinc-400 max-w-[280px] mx-auto leading-relaxed">
                      Enter your address and we'll transmit instructions to restore your account access
                    </p>
                  </div>

                  {/* Email Input Field */}
                  <div className="flex flex-col gap-2 text-left mt-1">
                    <label className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-450 px-0.5">
                      Email Address
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-emerald-400 transition-colors pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="yourname@domain.com"
                        className="w-full h-12 bg-[#121215] border border-[#1f1f23] focus:border-emerald-500/80 placeholder:text-zinc-600 rounded-xl pl-10 pr-4 text-xs text-white outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-sans hover:border-zinc-700/80"
                      />
                    </div>
                  </div>

                  {/* Submit Button with Loading State */}
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full h-12 mt-2 rounded-xl bg-[#10b981] hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/10 active:scale-98"
                  >
                    {resetLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-black" />
                        <span>Sending Link...</span>
                      </>
                    ) : (
                      <span>Send Recovery Instructions</span>
                    )}
                  </button>

                  {/* Cancel Button / Link */}
                  <div className="text-center mt-1">
                    <button
                      type="button"
                      onClick={() => setShowResetModal(false)}
                      className="text-[11.5px] text-zinc-500 hover:text-zinc-300 font-bold transition-colors underline underline-offset-4 decoration-zinc-800"
                    >
                      Return to Sign In
                    </button>
                  </div>
                </form>
              ) : (
                /* Success State */
                <div className="flex flex-col gap-5 py-4">
                  <div className="flex justify-center mt-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_4px_15px_rgba(16,185,129,0.06)]">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="text-center flex flex-col gap-1.5 mt-1">
                    <h3 className="text-lg font-black tracking-tight text-white">Transmitted Successfully</h3>
                    <p className="text-[12px] text-zinc-400 max-w-[280px] mx-auto leading-relaxed">
                      Check your email inbox. If you don't receive instructions within 3 minutes, verify your spam folder
                    </p>
                  </div>

                  {/* Done Button to Close */}
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="w-full h-12 mt-4 rounded-xl bg-[#10b981] hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center shadow-lg shadow-emerald-500/5 active:scale-98"
                  >
                    Return to Authentication Page
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Welcome header */}
      <div className="flex flex-col items-center text-center pb-2.5 border-b border-zinc-900/50 mb-1 select-none">
        <h2 className="text-xl font-extrabold text-white tracking-tight leading-snug">
          Sign In to Trova
        </h2>
        <p className="text-[11px] text-zinc-400 mt-1 max-w-[260px] leading-normal">
          Manage your transactions and disburse funds securely
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3.5">
        
        {/* Email Address Field */}
        <div className="flex flex-col gap-1 text-left">
          <div className="flex justify-between items-center px-0.5">
            <label className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-450">
              Email Address
            </label>
          </div>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-550 group-focus-within:text-emerald-400 transition-colors pointer-events-none" />
            <input
              type="email"
              value={email}
              onBlur={() => handleBlur('email')}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              placeholder="e.g. praise@coutures.ng"
              className={`w-full h-10.5 rounded-xl pl-9 pr-10 text-xs transition-all duration-200 outline-none focus:border-emerald-500/80 focus:ring-4 focus:ring-emerald-500/10 border ${
                errors.email
                  ? 'bg-red-500/[0.02] border-red-500/30 text-white placeholder:text-zinc-650'
                  : 'bg-[#121215] border-[#1f1f23] text-white placeholder:text-zinc-600 hover:border-zinc-700/80 font-sans'
              }`}
            />
            {touched.email && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.15 }}>
                  {isEmailValid ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                  )}
                </motion.div>
              </div>
            )}
          </div>
          {errors.email && (
            <motion.span 
              initial={{ opacity: 0, y: -2 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="text-red-400 text-[10.5px] font-medium mt-0.5 block px-0.5"
            >
              {errors.email}
            </motion.span>
          )}
        </div>

        {/* Password field with Forgot Password toggle */}
        <div className="flex flex-col gap-1 text-left">
          <div className="flex justify-between items-center px-0.5">
            <label className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-450">
              Password
            </label>
            <button
              type="button"
              onClick={() => {
                setResetEmail('');
                setResetSuccess(false);
                setResetLoading(false);
                setShowResetModal(true);
              }}
              className="text-[10px] font-bold text-[#10b981] hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Forgot?
            </button>
          </div>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-550 group-focus-within:text-emerald-400 transition-colors pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onBlur={() => handleBlur('password')}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              placeholder="••••••••"
              className={`w-full h-10.5 rounded-xl pl-9 pr-14 text-xs transition-all duration-200 outline-none focus:border-emerald-500/80 focus:ring-4 focus:ring-emerald-500/10 border ${
                errors.password
                  ? 'bg-red-500/[0.02] border-red-500/30 text-white placeholder:text-zinc-650'
                  : 'bg-[#121215] border-[#1f1f23] text-white placeholder:text-zinc-600 hover:border-zinc-700/80 font-sans'
              }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {touched.password && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.15 }}>
                  {isPasswordValid ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                  )}
                </motion.div>
              )}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-zinc-500 hover:text-white transition-colors focus:outline-none p-1.5 rounded-lg hover:bg-zinc-900/60"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          {errors.password && (
            <motion.span 
              initial={{ opacity: 0, y: -2 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="text-red-400 text-[10.5px] font-medium mt-0.5 block px-0.5"
            >
              {errors.password}
            </motion.span>
          )}
        </div>

        {/* Custom Remember Me Checkbox */}
        <div className="flex items-center gap-2 select-none justify-between mt-0.5 px-0.5">
          <label className="flex items-center gap-2 cursor-pointer text-zinc-400 text-[11px] font-medium group">
            <div className="relative">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="accent-emerald-500 rounded-md border-zinc-850 bg-[#121215] h-4 w-4 cursor-pointer appearance-none transition-all outline-none border focus:ring-2 focus:ring-emerald-500/10 checked:bg-emerald-500 checked:border-emerald-500"
              />
              {rememberMe && (
                <CheckCircle className="w-3 h-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black pointer-events-none" />
              )}
            </div>
            <span className="group-hover:text-zinc-300 text-[11px] transition-colors">Keep me signed in</span>
          </label>
        </div>

        {/* Dynamic human confirmation slider safeguard */}
        <div className="my-1 flex flex-col gap-1">
          <label className="text-[9px] uppercase tracking-wider font-extrabold text-zinc-500 px-0.5">Security Verification</label>
          <SlideToVerify onVerify={setIsVerified} isVerified={isVerified} />
        </div>

        {/* Action button */}
        <motion.button
          type="submit"
          disabled={isLoading || !isVerified}
          whileHover={{ scale: isVerified ? 1.005 : 1 }}
          whileTap={{ scale: isVerified ? 0.995 : 1 }}
          transition={{ duration: 0.15 }}
          className={`w-full h-10.5 rounded-xl text-black text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
            isVerified 
              ? 'bg-[#10b981] hover:bg-emerald-400 shadow-emerald-500/10 active:scale-98' 
              : 'bg-zinc-850 text-zinc-500 border border-zinc-900/80 opacity-40'
          }`}
        >
          {isLoading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
          ) : (
            <span>Sign In to My Account →</span>
          )}
        </motion.button>

        {/* OR Divider with visual horizontal lines */}
        <div className="flex items-center gap-2.5 my-1.5 select-none font-sans">
          <div className="h-[1px] flex-1 bg-zinc-900" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-550">Or authenticate with</span>
          <div className="h-[1px] flex-1 bg-zinc-900" />
        </div>

        {/* Continue with Google button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="h-10.5 rounded-xl bg-zinc-900/40 border border-zinc-800/60 hover:border-zinc-750 hover:bg-[#121215] transition-all duration-200 text-zinc-350 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer w-full shadow-sm"
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
          <span className="text-[11px] font-bold">Continue with Google</span>
        </button>

      </form>
    </div>
  );
}