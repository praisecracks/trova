import React, { useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export interface EmptyStateCardProps {
  title: string;
  description?: string;
  animationUrl?: string;
  icon?: React.ReactNode;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyStateCard({
  title,
  description,
  animationUrl,
  icon,
  actionButton,
}: EmptyStateCardProps) {
  const [animError, setAnimError] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="mb-6">
        {animationUrl && !animError ? (
          <DotLottieReact
            src={animationUrl}
            loop
            autoplay
            className="w-48 h-48 sm:w-56 sm:h-56"
            onError={() => setAnimError(true)}
          />
        ) : (
          icon && <div className="text-6xl">{icon}</div>
        )}
      </div>

      <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>

      {description && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {description}
        </p>
      )}

      {actionButton && (
        <button
          onClick={actionButton.onClick}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
        >
          {actionButton.label}
        </button>
      )}
    </div>
  );
}
