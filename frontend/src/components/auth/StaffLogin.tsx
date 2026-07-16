import React, { useState } from 'react';
import { Mail, Lock, RefreshCw } from 'lucide-react';
import { signInUser, getCurrentProfile, signOutUser, getAuthErrorMessage } from '../../lib/auth';

interface StaffLoginProps {
  onNavigate?: (path: string) => void;
}

export default function StaffLogin({ onNavigate }: StaffLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInUser(email.trim(), password);
      const profile = await getCurrentProfile();
      if (!profile || profile.role !== 'admin') {
        setError('Invalid credentials');
        await signOutUser();
        localStorage.removeItem('trustlink-profile');
        setLoading(false);
        return;
      }
      localStorage.setItem('trustlink-profile', JSON.stringify({
        id: profile.id,
        fullName: profile.display_name || profile.email.split('@')[0],
        email: profile.email,
        role: profile.role,
        kycStatus: profile.kyc_status || 'unverified',
        kyc_status: profile.kyc_status || 'unverified'
      }));
      // route to admin
      if (onNavigate) onNavigate('/admin');
      else {
        window.history.pushState(null, '', '/admin');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    } catch (err: any) {
      setError(getAuthErrorMessage(err, 'Invalid admin credentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] mx-auto">
      <h3 className="text-lg font-extrabold text-white mb-4">Staff Login</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="text-[11px] text-zinc-400">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input className="w-full h-11 rounded-lg pl-9.5 pr-4 bg-black border border-zinc-900 text-white" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <label className="text-[11px] text-zinc-400">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input type="password" className="w-full h-11 rounded-lg pl-9.5 pr-4 bg-black border border-zinc-900 text-white" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {error && <div className="text-red-400 text-[13px]">{error}</div>}

        <button type="submit" disabled={loading} className="w-full h-11 rounded-lg bg-emerald-500 text-black font-bold">
          {loading ? (<><RefreshCw className="inline-block w-4 h-4 animate-spin" /> Signing in...</>) : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
