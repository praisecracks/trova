import { useState, useEffect, type ReactNode } from 'react';
import { ToastProvider } from '../components/ToastContext';
import StorefrontPublic from '../components/StorefrontPublic';
import BuyerCheckoutPublic from '../components/BuyerCheckoutPublic';
import BuyerTrackingPublic from '../components/BuyerTrackingPublic';

/**
 * PublicLayout mounts the public, unauthenticated storefront surfaces
 * (/store/:handle, /pay/:id, /track/:id) WITHOUT the seller dashboard
 * provider tree. It deliberately does NOT initialize ThemeProvider,
 * AuthProvider, workspace providers, payout state, profile loading, or
 * dashboard theme logic. Each public page sources its own data from Supabase
 * and forces its own dark theme.
 */
const usePublicPath = (): string => {
  const [path, setPath] = useState<string>(() => window.location.pathname);
  useEffect(() => {
    const sync = () => setPath(window.location.pathname);
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  return path;
};

export const navigatePublic = (to: string) => {
  window.history.pushState(null, '', to);
  window.dispatchEvent(new Event('popstate'));
};

export default function PublicLayout() {
  const path = usePublicPath();
  const onNavigateToLanding = () => navigatePublic('/');

  let content: ReactNode = null;

  if (path.startsWith('/store/')) {
    const handle = path.split('/store/')[1] || '';
    content = <StorefrontPublic handle={handle} onNavigateToLanding={onNavigateToLanding} />;
  } else if (path.startsWith('/pay/') || path.startsWith('/checkout/')) {
    const id = path.split('/pay/')[1] || path.split('/checkout/')[1] || '';
    content = (
      <BuyerCheckoutPublic
        transactionId={id}
        escrowLinks={[]}
        onNavigateToLanding={onNavigateToLanding}
        onNavigateToTracking={(tid) => navigatePublic(`/track/${tid}`)}
        onNavigateToPay={(tid) => navigatePublic(`/pay/${tid}`)}
      />
    );
  } else if (path.startsWith('/track/')) {
    const id = path.split('/track/')[1] || '';
    content = (
      <BuyerTrackingPublic
        transactionId={id}
        escrowLinks={[]}
        onNavigateToLanding={onNavigateToLanding}
      />
    );
  }

  // ToastProvider is the only provider public pages may depend on; everything
  // dashboard-related is intentionally absent.
  return <ToastProvider>{content}</ToastProvider>;
}
