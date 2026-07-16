import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Check } from 'lucide-react';

interface SlideToVerifyProps {
  onVerify: (verified: boolean) => void;
  isVerified: boolean;
}

export default function SlideToVerify({ onVerify, isVerified }: SlideToVerifyProps) {
  const [position, setPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  // Handle slide mouse and touch movements
  useEffect(() => {
    if (!isDragging || isVerified) return;

    const handleMove = (clientX: number) => {
      if (!trackRef.current) return;
      const trackRect = trackRef.current.getBoundingClientRect();
      const maxDelta = trackRect.width - 48; // 40px knob + padding
      const delta = clientX - startXRef.current;
      const newPos = Math.max(0, Math.min(maxDelta, delta));
      setPosition(newPos);

      // Trigger verification if swiped to 95% of the track length
      if (newPos >= maxDelta * 0.95) {
        setIsDragging(false);
        setPosition(maxDelta);
        onVerify(true);
      }
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) handleMove(e.touches[0].clientX);
    };

    const handleEnd = () => {
      setIsDragging(false);
      if (!isVerified) {
        // Smoothly spring handle back if release is not verified
        setPosition(0);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, isVerified, onVerify]);

  const handleStart = (clientX: number) => {
    if (isVerified) return;
    setIsDragging(true);
    startXRef.current = clientX - position;
  };

  return (
    <div 
      ref={trackRef}
      className={`h-11 rounded-xl relative flex items-center overflow-hidden select-none transition-all duration-300 border ${
        isVerified 
          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
          : 'bg-black border-zinc-800 hover:border-zinc-700 text-zinc-400'
      }`}
    >
      {/* Visual background fill following the drag track */}
      <div 
        className="absolute left-0 top-0 bottom-0 bg-emerald-500/10 transition-all duration-75"
        style={{ width: `${position + 24}px` }}
      />

      {/* Guide text inside the tracking bar */}
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
        isVerified ? 'opacity-0' : 'opacity-100'
      }`}>
        <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 select-none animate-pulse">
          {isDragging ? 'Release to reset' : 'Slide to Verify Securely 👉'}
        </span>
      </div>

      {/* Slide knob draggable handle */}
      <div
        className={`absolute top-1 bottom-1 w-9 rounded-lg flex items-center justify-center transition-all cursor-grab active:cursor-grabbing select-none ${
          isVerified 
            ? 'bg-emerald-500 text-black left-auto right-1 cursor-default' 
            : 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
        }`}
        style={isVerified ? undefined : { left: `${position + 4}px` }}
        onMouseDown={(e) => handleStart(e.clientX)}
        onTouchStart={(e) => {
          if (e.touches.length > 0) handleStart(e.touches[0].clientX);
        }}
      >
        {isVerified ? (
          <Check className="w-3.5 h-3.5 text-black stroke-[3.5px]" />
        ) : (
          <ArrowRight className="w-3.5 h-3.5 text-black" />
        )}
      </div>

      {isVerified && (
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-400 select-none pl-4 flex items-center gap-1.5 animate-fade-in">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>Interaction Verified</span>
        </span>
      )}
    </div>
  );
}
