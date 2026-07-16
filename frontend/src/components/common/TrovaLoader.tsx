/** 
 * TrovaLoader — Branded loading component 
 *  
 * Usage: 
 * <TrovaLoader size="fullscreen" />                          — Full screen takeover (app init) 
 * <TrovaLoader size="fullscreen" message="Signing you in" /> — Full screen with message 
 * <TrovaLoader size="lg" />                                  — Large, centered in a section 
 * <TrovaLoader size="md" />                                  — Default, inline or card loading 
 * <TrovaLoader size="sm" />                                  — Small, inside buttons or rows 
 *  
 * Reuse this component anywhere in the app that needs a loading state. 
 * Never use a raw spinner or the old border-animate pattern again. 
 */ 
import React from 'react'; 
  
interface TrovaLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'fullscreen';
  message?: string;
  theme?: 'dark' | 'light';
}
  
export default function TrovaLoader({  
  size = 'md',  
  message,
  theme: propTheme
}: TrovaLoaderProps) {  
  const theme = propTheme || (typeof window !== 'undefined' && document.body.classList.contains('light-theme') ? 'light' : 'dark');
  const isFullscreen = size === 'fullscreen';
    
   const dimensions = { 
     sm: 32, 
     md: 48, 
     lg: 64, 
     fullscreen: 72, 
   }; 
    
   const dim = dimensions[size]; 
  
   const loader = ( 
     <div className="flex flex-col items-center justify-center gap-4"> 
       {/* Trova Shield Mark — animated SVG */} 
       <div 
         style={{ width: dim, height: dim }} 
         className="relative" 
       > 
         <svg 
           viewBox="0 0 48 56" 
           fill="none" 
           xmlns="http://www.w3.org/2000/svg" 
           style={{ width: dim, height: dim }} 
         > 
           <defs> 
             {/* Emerald gradient for shield fill */} 
             <linearGradient 
               id="trovashield" 
               x1="0%" 
               y1="0%" 
               x2="100%" 
               y2="100%" 
             > 
               <stop offset="0%" stopColor="#10b981" /> 
               <stop offset="100%" stopColor="#065f46" /> 
             </linearGradient> 
  
             {/* Animated glow filter */} 
             <filter id="trovaGlow" x="-20%" y="-20%" width="140%" height="140%"> 
               <feGaussianBlur stdDeviation="2" result="coloredBlur" /> 
               <feMerge> 
                 <feMergeNode in="coloredBlur" /> 
                 <feMergeNode in="SourceGraphic" /> 
               </feMerge> 
             </filter> 
  
             {/* Clip path for shield shape */} 
             <clipPath id="shieldClip"> 
               <path d="M4 4 L44 4 L44 36 L24 52 L4 36 Z" /> 
             </clipPath> 
           </defs> 
  
           {/* Shield body */} 
           <path 
             d="M4 4 L44 4 L44 36 L24 52 L4 36 Z" 
             fill="url(#trovashield)" 
             filter="url(#trovaGlow)" 
             style={{ 
               animation: 'trovaShieldPulse 2s ease-in-out infinite', 
             }} 
           /> 
  
           {/* Shield inner border highlight */} 
           <path 
             d="M4 4 L44 4 L44 36 L24 52 L4 36 Z" 
             fill="none" 
             stroke="rgba(255,255,255,0.15)" 
             strokeWidth="1" 
           /> 
  
           {/* V checkmark mark inside shield */} 
           {/* Horizontal top bar */} 
           <line 
             x1="14" 
             y1="16" 
             x2="34" 
             y2="16" 
             stroke="white" 
             strokeWidth="3.5" 
             strokeLinecap="round" 
             style={{ 
               animation: 'trovaMarkDraw 0.6s ease-out 0.3s both', 
               strokeDasharray: 20, 
               strokeDashoffset: 20, 
             }} 
           /> 
           {/* V left leg */} 
           <line 
             x1="14" 
             y1="16" 
             x2="24" 
             y2="34" 
             stroke="white" 
             strokeWidth="3.5" 
             strokeLinecap="round" 
             style={{ 
               animation: 'trovaMarkDraw 0.5s ease-out 0.6s both', 
               strokeDasharray: 22, 
               strokeDashoffset: 22, 
             }} 
           /> 
           {/* V right leg */} 
           <line 
             x1="34" 
             y1="16" 
             x2="24" 
             y2="34" 
             stroke="white" 
             strokeWidth="3.5" 
             strokeLinecap="round" 
             style={{ 
               animation: 'trovaMarkDraw 0.5s ease-out 0.6s both', 
               strokeDasharray: 22, 
               strokeDashoffset: 22, 
             }} 
           /> 
         </svg> 
  
         {/* Rotating ring around the shield */} 
         <div 
           style={{ 
             position: 'absolute', 
             top: -6, 
             left: -6, 
             width: dim + 12, 
             height: dim + 12, 
             borderRadius: '50%', 
             border: '1.5px solid transparent', 
             borderTopColor: '#10b981', 
             borderRightColor: 'rgba(16,185,129,0.3)', 
             animation: 'trovaRingSpin 1.2s linear infinite', 
           }} 
         /> 
       </div> 
  
{/* Trova wordmark below */} 
        <div className="flex flex-col items-center gap-1"> 
          <span 
            style={{ 
              fontFamily: 'Arial Black, sans-serif', 
              fontWeight: 900, 
              fontSize: size === 'fullscreen' ? 18 : size === 'lg' ? 14 : 12, 
              color: theme === 'light' ? '#18181b' : '#f4f4f5', 
              letterSpacing: '-0.02em', 
              animation: 'trovaFadeIn 0.8s ease-out 0.2s both', 
            }} 
          > 
            trova 
          </span> 
          {message && ( 
            <span 
              style={{ 
                fontSize: 11, 
                color: theme === 'light' ? '#52525b' : '#71717a', 
                letterSpacing: '0.08em', 
                animation: 'trovaFadeIn 0.8s ease-out 0.4s both', 
              }} 
            > 
              {message} 
            </span> 
          )} 
        </div>
  
       {/* Keyframe styles injected inline */} 
       <style>{` 
         @keyframes trovaShieldPulse { 
           0%, 100% { opacity: 1; filter: url(#trovaGlow); } 
           50% { opacity: 0.85; } 
         } 
         @keyframes trovaMarkDraw { 
           to { stroke-dashoffset: 0; } 
         } 
         @keyframes trovaRingSpin { 
           from { transform: rotate(0deg); } 
           to { transform: rotate(360deg); } 
         } 
         @keyframes trovaFadeIn { 
           from { opacity: 0; transform: translateY(4px); } 
           to { opacity: 1; transform: translateY(0); } 
         } 
       `}</style> 
     </div> 
   ); 
  
if (isFullscreen) { 
      return ( 
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            backgroundColor: theme === 'light' ? '#f4f4f5' : '#09090b',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 9999, 
          }} 
        > 
          {loader} 
        </div> 
      ); 
    }
  
   return loader; 
 } 
