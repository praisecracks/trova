import React, { useEffect, useState } from 'react';

const CONSENT_KEY = 'trova_consent_accepted';

export default function CookieConsentBanner() {
  const [hasConsent, setHasConsent] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  useEffect(() => {
    setHasConsent(localStorage.getItem(CONSENT_KEY) === 'true');

    const timer = window.setTimeout(() => {
      setShouldRender(true);
    }, 800);

    return () => window.clearTimeout(timer);
  }, []);

  const acceptConsent = () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    setIsClosing(true);
    window.setTimeout(() => {
      setHasConsent(true);
    }, 300);
  };

  const savePreferences = () => {
    acceptConsent();
  };

  const acceptAllFromModal = () => {
    setAnalyticsEnabled(true);
    setMarketingEnabled(true);
    acceptConsent();
  };

  if (hasConsent) {
    return null;
  }

  if (!shouldRender) {
    return null;
  }

  return (
    <>
      <div
        className={`${isClosing ? 'cookie-banner-closing' : 'cookie-banner-enter'} fixed left-0 right-0 bottom-0 z-[9999] w-full bg-[#18181b] px-6 py-4 shadow-[0px_-4px_24px_rgba(0,0,0,0.3)]`}
        style={{ borderTop: '1px solid #27272a' }}
      >
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <p className="text-[14px] font-medium text-[#f4f4f5]">
              Trova uses cookies to improve your experience.
            </p>
            <p className="mt-1 text-[13px] text-[#71717a]">
              By continuing, you agree to our{' '}
              <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-[#10b981] hover:underline">
                Privacy Policy
              </a>
              {' '}and{' '}
              <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-[#10b981] hover:underline">
                Terms of Service
              </a>
              .
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="rounded-[8px] border border-[#27272a] bg-transparent px-4 py-2 text-[13px] text-[#71717a] transition-colors hover:border-[#52525b]"
            >
              Manage Preferences
            </button>
            <button
              type="button"
              onClick={acceptConsent}
              className="rounded-[8px] bg-[#10b981] px-5 py-2 text-[13px] font-semibold text-[#09090b] transition-colors hover:bg-[#059669]"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[4px]">
          <div className="w-full max-w-[420px] rounded-[14px] border border-[#27272a] bg-[#18181b] p-6 shadow-2xl">
            <h3 className="text-[18px] font-semibold text-[#f4f4f5]">
              Cookie Preferences
            </h3>

            <div className="mt-5 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[14px] font-medium text-[#f4f4f5]">Essential Cookies</p>
                  <p className="mt-1 text-[12px] text-[#71717a]">Required for the platform to function. Cannot be disabled.</p>
                </div>
                <button
                  type="button"
                  disabled
                  aria-checked="true"
                  role="switch"
                  className="relative h-6 w-11 rounded-full bg-[#10b981]"
                >
                  <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-[#09090b]" />
                </button>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[14px] font-medium text-[#f4f4f5]">Analytics Cookies</p>
                  <p className="mt-1 text-[12px] text-[#71717a]">Help us understand how you use Trova.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={analyticsEnabled}
                  onClick={() => setAnalyticsEnabled((value) => !value)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${analyticsEnabled ? 'bg-[#10b981]' : 'bg-[#52525b]'}`}
                >
                  <span className={`absolute top-1 h-4 w-4 rounded-full bg-[#09090b] transition-transform ${analyticsEnabled ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[14px] font-medium text-[#f4f4f5]">Marketing Cookies</p>
                  <p className="mt-1 text-[12px] text-[#71717a]">Used to show relevant content and offers.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={marketingEnabled}
                  onClick={() => setMarketingEnabled((value) => !value)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${marketingEnabled ? 'bg-[#10b981]' : 'bg-[#52525b]'}`}
                >
                  <span className={`absolute top-1 h-4 w-4 rounded-full bg-[#09090b] transition-transform ${marketingEnabled ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={savePreferences}
                className="rounded-[8px] bg-[#10b981] px-5 py-2 text-[13px] font-semibold text-[#09090b] transition-colors hover:bg-[#059669]"
              >
                Save Preferences
              </button>
              <button
                type="button"
                onClick={acceptAllFromModal}
                className="rounded-[8px] bg-[#10b981] px-5 py-2 text-[13px] font-semibold text-[#09090b] transition-colors hover:bg-[#059669]"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .cookie-banner-enter {
          opacity: 0;
          transform: translateY(100%);
          animation: cookieBannerEnter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .cookie-banner-closing {
          opacity: 1;
          transform: translateY(0);
          animation: cookieBannerExit 0.3s ease forwards;
        }

        @keyframes cookieBannerEnter {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes cookieBannerExit {
          to {
            opacity: 0;
            transform: translateY(8px);
          }
        }
      `}</style>
    </>
  );
}
