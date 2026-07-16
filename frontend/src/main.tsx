import './earlyErrorLogger';
import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { ToastProvider } from './components/ToastContext.tsx';
import { ThemeProvider } from './providers/ThemeProvider';
import { AuthProvider } from './providers/AuthProvider';
import PublicLayout from './layouts/PublicLayout';
import { registerSW } from 'virtual:pwa-register';

// Register service worker for PWA offline support
const updateSW = registerSW({
  onNeedRefresh() {
    // Show user a prompt to update the app
    if (confirm('A new version of Trova is available! Do you want to update now?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('Trova is ready for offline use!');
  },
});

// Public storefront / checkout / tracking routes mount through a lightweight
// PublicLayout that does NOT initialize dashboard state, authentication,
// workspace providers, payout state, profile loading, or theme logic.
// All other routes use the existing provider tree
// (ThemeProvider -> ToastProvider -> AuthProvider -> App).
const isPublicRoute = (path: string) =>
  path.startsWith('/store/') || path.startsWith('/pay/') || path.startsWith('/track/') || path.startsWith('/checkout/');

function AppBootstrap() {
  const [path, setPath] = useState<string>(() => window.location.pathname);

  useEffect(() => {
    const sync = () => setPath(window.location.pathname);
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  if (isPublicRoute(path)) {
    return <PublicLayout />;
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppBootstrap />
    </BrowserRouter>
  </StrictMode>,
);
