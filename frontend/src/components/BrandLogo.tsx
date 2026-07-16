import React from 'react';

interface BrandLogoProps {
  size?: number;
  hideText?: boolean;
  className?: string;
  variant?: 'light' | 'dark';
}

export default function BrandLogo({
  size = 32,
  hideText = false,
  className = '',
  variant = 'dark'
}: BrandLogoProps) {
  const isLight = variant === 'light';

  return (
    <div className={`flex items-center gap-2 px-1 py-0.5 ${className}`}>
      {/* Concept A Shield SVG */}
      <svg
        width={size}
        height={(size * 50) / 48}
        viewBox="24 0 24 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-md select-none transition-transform duration-200 hover:scale-105"
      >
        <defs>
          <linearGradient id="gBrandA" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#065f46" />
          </linearGradient>
        </defs>

        {/* Shield outline path */}
        <path
          d="M24 0 H48 V36 L36 50 L24 36 Z"
          fill="url(#gBrandA)"
          strokeLinejoin="round"
        />

        {/* Top bar & inner lock / anchor line */}
        <polyline
          points="31,16 36,32 41,16"
          fill="none"
          stroke="white"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line
          x1="31"
          y1="16"
          x2="41"
          y2="16"
          stroke="white"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </svg>

      {!hideText && (
        <div className="flex flex-col text-left select-none">
          <span 
            className="font-black tracking-tight text-lg leading-none font-sans lowercase"
            style={{ color: isLight ? '#09090b' : '#f4f4f5' }}
          >
            trova
          </span>
          <span 
            className="text-[8px] font-bold tracking-[0.25em] -mt-0.5 uppercase font-mono"
            style={{ color: '#10b981' }}
          >
            Escrow
          </span>
        </div>
      )}
    </div>
  );
}
