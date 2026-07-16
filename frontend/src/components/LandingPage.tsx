import React from 'react';
import { LandingHeader } from './landing/LandingHeader';
import { HeroSection } from './landing/HeroSection';
import { StoryWalkthrough } from './landing/StoryWalkthrough';
import { FeaturesSection } from './landing/FeaturesSection';
import { HowItWorksSteps } from './landing/HowItWorksSteps';
import { TestimonialsSection } from './landing/TestimonialsSection';
import { SecuritySection } from './landing/SecuritySection';
import { FaqSection } from './landing/FaqSection';
import { FinalCta } from './landing/FinalCta';
import { LandingFooter } from './landing/LandingFooter';
import CookieConsentBanner from './common/CookieConsentBanner';

interface LandingPageProps {
  onNavigate: (route: 'landing' | 'login' | 'signup' | 'onboarding' | 'app') => void;
  onSetRole?: (role: 'vendor' | 'buyer') => void;
}

export default function LandingPage({ onNavigate, onSetRole }: LandingPageProps) {
  return (
    <div className="bg-[#09090b] text-zinc-150 min-h-screen font-sans flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300 overflow-x-hidden antialiased">
      {/* 1. Header with backdrop blur & navigation */}
      <LandingHeader onNavigate={onNavigate} onSetRole={onSetRole} />

      {/* 2. Hero Section & floating interactive dashboard lockup */}
      <HeroSection onNavigate={onNavigate} onSetRole={onSetRole} />

      {/* 3. Interactive Step-by-Step Storyboard Walkthrough (GSAP Pinned Scroll) */}
      <StoryWalkthrough />

      {/* 4. Earnings / Trust angle cards */}
      <FeaturesSection />

      {/* 5. How It Works Steps visual list */}
      <HowItWorksSteps />

      {/* 6. Social Proof / Testimonials Carousel */}
      <TestimonialsSection />

      {/* 7. Security / bank trustee compliance board */}
      <SecuritySection onNavigate={onNavigate} />

      {/* 7.5. Collapsible Frequently Asked Questions */}
      <FaqSection />

      {/* 8. Final CTA with emerald glow */}
      <FinalCta onNavigate={onNavigate} onSetRole={onSetRole} />

      {/* 9. Footer with regulatory disclaimers & statutory legal modals */}
      <LandingFooter onNavigate={onNavigate} onSetRole={onSetRole} />

      <CookieConsentBanner />
    </div>
  );
}
