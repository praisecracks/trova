/**
 * AuthLayout.tsx
 * Renders the shared static left panel of the split auth screen.
 * Contains the branded storytelling layout, 3-step escrow loop, and ambient glow.
 * Accepts no props that change its content; it is static and reusable.
 * Used by: AuthPage.tsx
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, CheckCircle, Lock } from 'lucide-react';

export default function AuthLayout() {
  const isLight = false;

  // State for rotating testimonial quote: cycles every 6 seconds
  const [activeQuoteIdx, setActiveQuoteIdx] = useState(0);
  const quotes = [
    {
      text: "I was scared to sell to strangers online. Trova changed everything.",
      attribution: "Chidinma A., Lagos"
    },
    {
      text: "My buyers trust me instantly now. This is the best thing for my business.",
      attribution: "Emeka O., Abuja"
    },
    {
      text: "Setup took 5 minutes and I got paid safely on my first order.",
      attribution: "Fatima B., Kano"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveQuoteIdx((prev) => (prev + 1) % quotes.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [quotes.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="hidden lg:flex lg:col-span-6 flex-col justify-between px-10 xl:px-14 py-12 relative select-none min-h-screen bg-[#070708] overflow-hidden"
    >
      {/* Premium subtle background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      {/* Radial soft lighting vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.06),transparent_65%)] pointer-events-none" />
      <div className="absolute top-[20%] left-[-10%] w-[450px] h-[450px] bg-emerald-500/[0.03] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-teal-500/[0.03] rounded-full blur-[140px] pointer-events-none" />

      {/* Decorative vertical separator */}
      <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-zinc-800/50 to-transparent pointer-events-none" />

      {/* Primary Left Brand panel container */}
      <div className="w-full max-w-lg mx-auto flex flex-col gap-10 relative z-10 pt-14">
        
        {/* Brand Catchphrase & Header Copy */}
        <div className="flex flex-col gap-3.5 text-left">
          <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest font-mono select-none bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/10 self-start">
            SECURE THIRD-PARTY ESCROW
          </span>
          <h2 className="text-3xl xl:text-4xl font-black tracking-tight leading-tight text-white animate-fade-in">
            Every transaction. <br />
            Fully protected.
          </h2>
          <p className="text-[13px] leading-relaxed text-zinc-450 mt-1">
            Ditch the payment anxiety in commercial business. Trova guards buyer funds in secure regulated escrow holding chambers, verifying delivery before payouts are unlocked for sellers.
          </p>
        </div>

        {/* Streamlined Escrow Loop Indicators */}
        <div className="flex flex-col gap-5">
          {[
            {
              step: '01',
              title: 'Share your payout route',
              desc: 'Generate secure shopping and client payout links directly. Drop them dynamically in buyers\' DMs in seconds.'
            },
            {
              step: '02',
              title: 'Locked escrow holdings',
              desc: 'Your customer completes custom checkouts. Trova holds the capital in a fully compliant, licensed reserve account.'
            },
            {
              step: '03',
              title: 'Instant direct clearing',
              desc: 'Ship products instantly. Once buyers verify correct delivery, funds clear instantly into your configured local bank.'
            }
          ].map((item, idx) => (
            <div key={idx} className="flex gap-4 group text-left">
              <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10.5px] font-mono font-bold text-emerald-400 shrink-0 transition-all duration-300 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/[0.02]">
                {item.step}
              </div>
              <div className="flex flex-col gap-0.5">
                <h4 className="text-[13.5px] font-bold font-sans tracking-tight text-zinc-150 group-hover:text-emerald-400 transition-colors duration-200">{item.title}</h4>
                <p className="text-[11.5px] leading-relaxed text-zinc-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Small trust logos / badge row */}
        <div className="border-t border-zinc-900 pt-5 mt-1 flex items-center justify-between gap-1.5 flex-row">
          <div className="flex items-center gap-1.5 text-zinc-500 text-[10.5px] font-bold font-mono tracking-tight uppercase">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>ESCROW SHIELD</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-500 text-[10.5px] font-bold font-mono tracking-tight uppercase">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>licensed bank vaults</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-500 text-[10.5px] font-bold font-mono tracking-tight uppercase">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>AML COMPLIANT</span>
          </div>
        </div>

      </div>

      {/* Rotating Testimonials Footer component */}
      <div 
        className="relative z-10 pt-5 mt-8 flex flex-col gap-2 text-left border-t border-zinc-900 max-w-lg mx-auto w-full h-[64px] overflow-hidden"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeQuoteIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex flex-col gap-1 w-full"
          >
            <p className="text-[12.5px] text-zinc-400 leading-normal font-sans tracking-tight">
              "{quotes[activeQuoteIdx].text}"
            </p>
            <span className="text-[9.5px] font-extrabold tracking-widest text-[#10b981] uppercase font-mono">
              — {quotes[activeQuoteIdx].attribution}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
