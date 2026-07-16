import React, { useEffect, useState } from 'react';
import { getCurrentProfile } from '../lib/auth';

interface ProtectedRouteProps {
  requiredRole: 'seller' | 'admin';
  children: React.ReactNode;
}

export default function ProtectedRoute({ requiredRole, children }: ProtectedRouteProps) {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const profile = await getCurrentProfile();
        if (!mounted) return;
        if (!profile) {
          // redirect to sign in or staff login
          if (requiredRole === 'admin') {
            window.history.pushState(null, '', '/staff/login');
          } else {
            window.history.pushState(null, '', '/signin');
          }
          window.dispatchEvent(new PopStateEvent('popstate'));
          return;
        }

        if (profile.role !== requiredRole) {
          window.history.pushState(null, '', '/');
          window.dispatchEvent(new PopStateEvent('popstate'));
          return;
        }

        setChecking(false);
      } catch {
        if (!mounted) return;
        if (requiredRole === 'admin') {
          window.history.pushState(null, '', '/staff/login');
        } else {
          window.history.pushState(null, '', '/signin');
        }
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    })();

    return () => { mounted = false; };
  }, [requiredRole]);

  if (checking) {
    return (
      <div className="min-h-[240px] flex items-center justify-center text-zinc-400">Loading...</div>
    );
  }

  return <>{children}</>;
}
