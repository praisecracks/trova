import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, ArrowRight, Check } from 'lucide-react';
import { ActiveTab } from '../../types';

interface OnboardingChecklistProps {
  onNavigateTab: (tab: ActiveTab) => void;
  onCreateLinkClick: () => void;
}

interface StepsState {
  [key: string]: boolean;
}

export default function OnboardingChecklist({
  onNavigateTab,
  onCreateLinkClick
}: OnboardingChecklistProps) {
  // We use sellerId since specified 'trustlink_onboarding_sellerId'
  const storageKey = 'trustlink_onboarding_sellerId';
  const completeKey = 'trustlink_onboarding_complete';

  const [steps, setSteps] = useState<StepsState>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return {
      '1': false,
      '2': false,
      '3': false,
      '4': false,
      '5': false
    };
  });

  const [isPermanentlyComplete, setIsPermanentlyComplete] = useState<boolean>(() => {
    return localStorage.getItem(completeKey) === 'true';
  });

  const checklistSteps = [
    {
      id: '1',
      title: 'Complete your profile',
      actionLabel: 'Go',
      onClick: () => {
        onNavigateTab('settings');
      }
    },
    {
      id: '2',
      title: 'Add your bank details',
      actionLabel: 'Go',
      onClick: () => {
        // Go to storefront / My Store Link, specifically the bank tab
        localStorage.setItem(`trustlink_storefront_preferred_tab`, 'bank');
        onNavigateTab('storefront');
      }
    },
    {
      id: '3',
      title: 'Set up your store link',
      actionLabel: 'Go',
      onClick: () => {
        onNavigateTab('storefront');
      }
    },
    {
      id: '4',
      title: 'Create your first escrow link',
      actionLabel: 'Go',
      onClick: () => {
        onCreateLinkClick();
      }
    },
    {
      id: '5',
      title: 'Share your store with a buyer',
      actionLabel: 'Go',
      onClick: () => {
        // Highlight copy URL action on storefront
        localStorage.setItem(`trustlink_storefront_highlight_copy`, 'true');
        onNavigateTab('storefront');
      }
    }
  ];

  const handleToggleStep = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextSteps = { ...steps, [id]: !steps[id] };
    setSteps(nextSteps);
    localStorage.setItem(storageKey, JSON.stringify(nextSteps));
    checkAllComplete(nextSteps);
  };

  const handleAction = (step: typeof checklistSteps[0]) => {
    // Perform navigation/action first
    step.onClick();
    
    // Automatically flag completed when action is clicked, as standard in responsive workflows
    const nextSteps = { ...steps, [step.id]: true };
    setSteps(nextSteps);
    localStorage.setItem(storageKey, JSON.stringify(nextSteps));
    checkAllComplete(nextSteps);
  };

  const checkAllComplete = (currentSteps: StepsState) => {
    const allDone = Object.values(currentSteps).every(val => val === true);
    if (allDone) {
      localStorage.setItem(completeKey, 'true');
      setIsPermanentlyComplete(true);
      // Dispatch event to update layout immediately
      window.dispatchEvent(new CustomEvent('trustlink_onboarding_changed'));
    }
  };

  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          setSteps(JSON.parse(saved));
        }
        setIsPermanentlyComplete(localStorage.getItem(completeKey) === 'true');
      } catch (e) {}
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('trustlink_onboarding_changed', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('trustlink_onboarding_changed', handleSync);
    };
  }, []);

  if (isPermanentlyComplete) return null;

  const completedCount = Object.values(steps).filter(Boolean).length;
  const progressPercent = (completedCount / 5) * 100;

  return (
    <div 
      className="rounded-xl p-5 mb-6 transition-all duration-300 relative overflow-hidden"
      style={{
        backgroundColor: 'var(--surface)',
        borderLeft: '3px solid #10b981',
        boxShadow: 'var(--shadow)'
      }}
    >
      <div className="flex flex-col gap-4">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Get your store ready
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Complete these steps to start receiving payments.
            </p>
          </div>
          <span className="text-xs font-semibold font-mono whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
            {completedCount} of 5 steps completed
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-[var(--progress-track)] overflow-hidden relative">
          <div 
            className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Steps List */}
        <div className="flex flex-col gap-2 mt-2">
          {checklistSteps.map(step => {
            const isCompleted = steps[step.id];

            return (
              <div 
                key={step.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-[var(--surface2)] transition-colors duration-150"
                style={{
                  backgroundColor: 'var(--surface2)',
                  borderColor: 'var(--border)'
                }}
              >
                <div 
                  className="flex items-center gap-3 cursor-pointer select-none flex-1"
                  onClick={(e) => handleToggleStep(step.id, e)}
                >
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-black shrink-0 transition-transform hover:scale-105 duration-100">
                      <Check className="w-3.5 h-3.5 stroke-[3px]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-zinc-650 flex items-center justify-center text-zinc-550 shrink-0 hover:border-emerald-500/50 transition-colors">
                      <Circle className="w-2 h-2 text-transparent" />
                    </div>
                  )}
                  
                  <span 
                    className={`text-xs font-semibold transition-all ${isCompleted ? 'line-through' : ''}`}
                    style={{ color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)' }}
                  >
                    {step.title}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAction(step)}
                    style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                    className="py-1 px-3.5 text-[10px] font-bold border rounded hover:border-emerald-500 hover:text-emerald-500 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>{isCompleted ? 'Done' : step.actionLabel}</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
