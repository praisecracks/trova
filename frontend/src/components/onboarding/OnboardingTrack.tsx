import React, { useState, useEffect, useMemo } from 'react';
import { User, Landmark, ShieldCheck, Store, Link, Lock, Clock, CheckCircle } from 'lucide-react';

interface OnboardingTrackProps {
  profile: {
    displayName?: string;
    phone?: string;
    bio?: string;
    avatarUrl?: string;
    businessName?: string;
  };
  bankDetailsAdded: boolean;
  kycStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  storeItemCount: number;
  escrowLinkCount: number;
  onNavigate: (destination: 'settings' | 'settings-bank' | 'kyc' | 'storefront' | 'create-link') => void;
}

type Step = {
  id: string;
  title: string;
  description: string;
  benefit: string;
  icon: string;
  completed: boolean;
  action: string;
  destination: 'settings' | 'settings-bank' | 'kyc' | 'storefront' | 'create-link';
  pending?: boolean;
  pendingMessage?: string;
};

export default function OnboardingTrack({
  profile,
  bankDetailsAdded,
  kycStatus,
  storeItemCount,
  escrowLinkCount,
  onNavigate,
}: OnboardingTrackProps) {
  const [showCompletion, setShowCompletion] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const completeKey = localStorage.getItem('trova_onboarding_complete');
    const dismissedSession = sessionStorage.getItem('trova_onboarding_dismissed_session');

    if (completeKey === 'true' || dismissedSession === 'true') {
      return;
    }
  }, []);

  const steps = useMemo<Step[]>(() => [
    {
      id: 'profile',
      title: 'Complete your profile',
      description: 'Add your name, phone number, and a short bio so buyers know who they are trading with.',
      benefit: 'Unlocks your public store page',
      icon: 'User',
      completed: !!(
        profile.displayName &&
        profile.displayName.trim().length > 1
      ),
      action: 'Complete Profile',
      destination: 'settings',
    },
    {
      id: 'bank',
      title: 'Add your bank account',
      description: 'Link your settlement bank account so you can receive payouts when buyers release funds.',
      benefit: 'Unlocks payouts',
      icon: 'Landmark',
      completed: bankDetailsAdded,
      action: 'Add Bank Details',
      destination: 'settings-bank',
    },
    {
      id: 'kyc',
      title: 'Verify your identity',
      description: 'Submit a quick identity check to unlock higher transaction limits and earn your verified badge.',
      benefit: 'Unlocks unlimited transactions + Verified badge',
      icon: 'ShieldCheck',
      completed: kycStatus === 'verified',
      pending: kycStatus === 'pending',
      pendingMessage: 'Verification in review — we will notify you within 72 hours.',
      action: 'Verify Identity',
      destination: 'kyc',
    },
    {
      id: 'store',
      title: 'Set up your store',
      description: 'Add your products or services so buyers can browse and order directly via escrow.',
      benefit: 'Unlocks your shareable store link',
      icon: 'Store',
      completed: storeItemCount > 0,
      action: 'Set Up Store',
      destination: 'storefront',
    },
    {
      id: 'first-link',
      title: 'Create your first escrow link',
      description: 'Generate a secure payment link and share it with your first buyer.',
      benefit: 'Start trading safely',
      icon: 'Link',
      completed: escrowLinkCount > 0,
      action: 'Create Escrow Link',
      destination: 'create-link',
    },
  ], [profile, bankDetailsAdded, kycStatus, storeItemCount, escrowLinkCount]);

  const completedCount = steps.filter(s => s.completed).length;
  const allComplete = completedCount === steps.length;

  useEffect(() => {
    if (allComplete && !showCompletion) {
      setShowCompletion(true);
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          localStorage.setItem('trova_onboarding_complete', 'true');
        }, 1000);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [allComplete, showCompletion]);

  if (!showCompletion && (localStorage.getItem('trova_onboarding_complete') === 'true' || localStorage.getItem('trova_onboarding_dismissed') === 'true' || sessionStorage.getItem('trova_onboarding_dismissed_session') === 'true')) {
    return null;
  }

  const activeStepIndex = steps.findIndex(s => !s.completed);
  const activeStep = activeStepIndex !== -1 ? steps[activeStepIndex] : null;
  const progressWidth = (completedCount / steps.length) * 100;

  const handleSkipForever = () => {
    localStorage.setItem('trova_onboarding_dismissed', 'true');
    window.location.reload();
  };

  const handleRemindMeLater = () => {
    sessionStorage.setItem('trova_onboarding_dismissed_session', 'true');
    window.location.reload();
  };

  if (showCompletion) {
    return (
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
          borderRadius: '16px',
          padding: '60px 24px',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          opacity: isExiting ? 0 : 1,
          transition: 'opacity 1s ease',
        }}
        className="border"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle className="w-5 h-5" style={{ color: '#10b981' }} />
          <span
            style={{
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            You're all set! Your Trova workspace is fully configured.
          </span>
        </div>
        <span
          style={{
            color: 'var(--text-muted)',
            fontSize: '12px',
          }}
        >
          This message will disappear shortly.
        </span>
      </div>
    );
  }

  const StepIcon = ({ step, isActive, isPending }: { step: Step; isActive: boolean; isPending: boolean }) => {
    const bgColor = step.completed ? '#10b981' : isActive ? 'rgba(16,185,129,0.12)' : isPending ? 'rgba(245,158,11,0.12)' : 'var(--surface2)';
    const borderColor = step.completed ? 'transparent' : isActive ? '#10b981' : isPending ? '#f59e0b' : 'transparent';
    const iconColor = step.completed ? 'white' : isActive ? '#10b981' : isPending ? '#f59e0b' : 'var(--text-muted)';

    const getIconComponent = () => {
      switch (step.icon) {
        case 'User': return <User className="w-4.5 h-4.5" style={{ color: iconColor }} />;
        case 'Landmark': return <Landmark className="w-4.5 h-4.5" style={{ color: iconColor }} />;
        case 'ShieldCheck': return isPending ? <Clock className="w-4.5 h-4.5" style={{ color: iconColor }} /> : <ShieldCheck className="w-4.5 h-4.5" style={{ color: iconColor }} />;
        case 'Store': return <Store className="w-4.5 h-4.5" style={{ color: iconColor }} />;
        case 'Link': return <Link className="w-4.5 h-4.5" style={{ color: iconColor }} />;
        default: return null;
      }
    };

    return (
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: bgColor,
          border: borderColor ? `2px solid ${borderColor}` : undefined,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {step.completed ? (
          <CheckCircle className="w-4.5 h-4.5" style={{ color: iconColor }} />
        ) : (
          getIconComponent()
        )}
        {!step.completed && !isActive && !isPending && (
          <Lock
            className="w-2.5 h-2.5"
            style={{
              position: 'absolute',
              bottom: '2px',
              right: '2px',
              color: 'var(--text-muted)',
            }}
          />
        )}
        {isActive && !step.completed && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              animation: 'pulse 2s infinite',
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: '24px',
      }}
      className="border"
    >
      <style>{`
        @media (max-width: 767px) {
          .onboarding-steps-desktop { display: none !important; }
          .onboarding-steps-mobile { display: flex !important; }
          .onboarding-panel-mobile { display: block !important; }
        }
        @media (min-width: 768px) {
          .onboarding-steps-mobile { display: none !important; }
          .onboarding-panel-mobile { display: none !important; }
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
          100% { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
        }
        @keyframes panelFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .panel-fade-in { animation: panelFadeIn 0.3s ease forwards; }
      `}</style>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <span
            style={{
              color: '#10b981',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            GETTING STARTED
          </span>
          <div
            style={{
              color: 'var(--text-primary)',
              fontSize: '15px',
              fontWeight: 600,
              marginTop: '4px',
            }}
          >
            Complete your setup to start trading on Trova
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          <span
            style={{
              color: 'var(--text-muted)',
              fontSize: '13px',
            }}
          >
            {completedCount} of {steps.length} complete
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handleRemindMeLater}
              style={{
                color: 'var(--text-primary)',
                fontSize: '11px',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                padding: '4px 10px',
                borderRadius: '6px',
              }}
            >
              Remind me later
            </button>
            <button
              onClick={handleSkipForever}
              style={{
                color: 'var(--text-muted)',
                fontSize: '11px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Skip setup
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          width: '100%',
          height: '4px',
          borderRadius: '4px',
          backgroundColor: 'var(--surface2)',
          overflow: 'hidden',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            width: `${progressWidth}%`,
            height: '100%',
            borderRadius: '4px',
            background: 'linear-gradient(to right, #10b981, #059669)',
            transition: 'width 0.6s ease',
          }}
        />
      </div>

      <div
        className="onboarding-steps-desktop"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          position: 'relative',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '22px',
            left: '22px',
            right: '22px',
            height: '1px',
            zIndex: 0,
          }}
        >
          <div
            style={{
              width: `${progressWidth}%`,
              height: '100%',
              backgroundColor: '#10b981',
            }}
          />
          <div
            style={{
              width: `${100 - progressWidth}%`,
              height: '100%',
              backgroundColor: 'var(--border)',
              marginLeft: `${progressWidth}%`,
            }}
          />
        </div>

        {steps.map((step, index) => {
          const isActive = index === activeStepIndex;
          const isPending = step.pending;

          return (
            <div
              key={step.id}
              onClick={() => !step.completed && !isPending && onNavigate(step.destination)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                cursor: step.completed ? 'default' : isPending ? 'default' : 'pointer',
                zIndex: 1,
                width: '80px',
              }}
            >
              <StepIcon step={step} isActive={isActive} isPending={!!isPending} />
              <span
                style={{
                  fontSize: '11px',
                  color: step.completed
                    ? 'var(--text-muted)'
                    : isActive
                      ? 'var(--text-primary)'
                      : 'var(--text-muted)',
                  fontWeight: isActive ? 600 : 400,
                  textDecoration: step.completed ? 'line-through' : 'none',
                  textAlign: 'center',
                }}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      {activeStep && (
        <div
          className="panel-fade-in"
          style={{
            backgroundColor: 'rgba(16,185,129,0.04)',
            border: '1px solid rgba(16,185,129,0.15)',
            borderRadius: '10px',
            padding: '16px 20px',
            marginTop: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                {activeStep.title}
              </div>
              <div
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  marginTop: '4px',
                }}
              >
                {activeStep.description}
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: '20px',
                  padding: '2px 10px',
                  marginTop: '8px',
                }}
              >
                <Lock className="w-2.5 h-2.5" style={{ color: '#10b981' }} />
                <span
                  style={{
                    color: '#10b981',
                    fontSize: '11px',
                  }}
                >
                  Unlocks: {activeStep.benefit}
                </span>
              </div>
            </div>

            <div style={{ flexShrink: 0 }}>
              {activeStep.pending ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
                  <span
                    style={{
                      color: '#f59e0b',
                      fontSize: '13px',
                    }}
                  >
                    Under Review
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => onNavigate(activeStep.destination)}
                  style={{
                    backgroundColor: '#10b981',
                    color: '#09090b',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    padding: '8px 18px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {activeStep.action}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile panel version with step details */}
      <div
        className="onboarding-steps-mobile"
        style={{
          display: 'none',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        {steps.map((step, index) => {
          const isActive = index === activeStepIndex;

          return (
            <div key={step.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
              onClick={() => !step.completed && !step.pending && onNavigate(step.destination)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                cursor: step.completed ? 'default' : step.pending ? 'default' : 'pointer',
              }}
            >
              <StepIcon step={step} isActive={isActive} isPending={!!step.pending} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: '11px',
                    color: step.completed
                      ? 'var(--text-muted)'
                      : isActive
                        ? 'var(--text-primary)'
                        : 'var(--text-muted)',
                    fontWeight: isActive ? 600 : 400,
                    textDecoration: step.completed ? 'line-through' : 'none',
                  }}
                >
                  {step.title}
                </span>
              </div>
            </div>
            {isActive && (
              <div
                className="panel-fade-in onboarding-panel-mobile"
                style={{
                  backgroundColor: 'rgba(16,185,129,0.04)',
                  border: '1px solid rgba(16,185,129,0.15)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginLeft: '56px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexDirection: 'column' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        color: 'var(--text-muted)',
                        fontSize: '13px',
                      }}
                    >
                      {step.description}
                    </div>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: 'rgba(16,185,129,0.08)',
                        border: '1px solid rgba(16,185,129,0.2)',
                        borderRadius: '20px',
                        padding: '2px 10px',
                        marginTop: '8px',
                      }}
                    >
                      <Lock className="w-2.5 h-2.5" style={{ color: '#10b981' }} />
                      <span
                        style={{
                          color: '#10b981',
                          fontSize: '11px',
                        }}
                      >
                        Unlocks: {step.benefit}
                      </span>
                    </div>
                  </div>

                  <div style={{ flexShrink: 0, width: '100%' }}>
                    {step.pending ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
                        <span
                          style={{
                            color: '#f59e0b',
                            fontSize: '13px',
                          }}
                        >
                          Under Review
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onNavigate(step.destination)}
                        style={{
                          backgroundColor: '#10b981',
                          color: '#09090b',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 600,
                          padding: '10px 20px',
                          border: 'none',
                          cursor: 'pointer',
                          width: '100%',
                        }}
                      >
                        {step.action}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
