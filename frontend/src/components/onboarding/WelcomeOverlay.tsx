import React, { useState, useEffect } from 'react';

interface WelcomeOverlayProps {
  sellerName?: string;
}

export default function WelcomeOverlay({ sellerName }: WelcomeOverlayProps) {
  const [visible, setVisible] = useState(true);
  const [contentOpacity, setContentOpacity] = useState(0);
  const [taglineOpacity, setTaglineOpacity] = useState(0);
  const [overlayOpacity, setOverlayOpacity] = useState(1);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const welcomeShown = localStorage.getItem('trova_welcome_shown');
    if (welcomeShown) {
      setVisible(false);
      return;
    }

    const contentTimer = setTimeout(() => setContentOpacity(1), 100);
    const taglineTimer = setTimeout(() => setTaglineOpacity(1), 400);
    const fadeTimer = setTimeout(() => {
      setOverlayOpacity(0);
      setTimeout(() => {
        localStorage.setItem('trova_welcome_shown', 'true');
        setVisible(false);
      }, 500);
    }, 2800);

    return () => {
      clearTimeout(contentTimer);
      clearTimeout(taglineTimer);
      clearTimeout(fadeTimer);
    };
  }, []);

  if (!visible) return null;

  const firstName = sellerName ? sellerName.split(' ')[0] : null;
  const welcomeMessage = firstName
    ? `Welcome, ${firstName}. Your secure escrow workspace is ready.`
    : 'Your secure escrow workspace is ready.';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#09090b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9998,
        opacity: overlayOpacity,
        transition: 'opacity 0.5s ease',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          opacity: contentOpacity,
          transition: 'opacity 0.6s ease',
        }}
      >
        <svg viewBox="0 0 48 56" fill="none" width="64" height="64">
          <defs>
            <linearGradient id="wShield" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#065f46" />
            </linearGradient>
          </defs>
          <path d="M4 4 L44 4 L44 36 L24 52 L4 36 Z" fill="url(#wShield)" />
          <line x1="14" y1="16" x2="34" y2="16" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="14" y1="16" x2="24" y2="34" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="34" y1="16" x2="24" y2="34" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
        </svg>

        <span
          style={{
            fontFamily: 'Arial Black, sans-serif',
            fontWeight: 900,
            fontSize: '32px',
            color: '#f4f4f5',
            letterSpacing: '-0.02em',
          }}
        >
          trova
        </span>

        <span
          style={{
            fontSize: '16px',
            color: '#71717a',
            fontWeight: 400,
            textAlign: 'center',
            maxWidth: '280px',
          }}
        >
          {welcomeMessage}
        </span>

        <span
          style={{
            fontSize: '10px',
            color: '#10b981',
            letterSpacing: '0.2em',
            fontWeight: 600,
            opacity: taglineOpacity,
            transition: 'opacity 0.4s ease',
          }}
        >
          SECURE · FAST · TRUSTED
        </span>
      </div>
    </div>
  );
}
