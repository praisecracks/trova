import React, { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Plus, Send, Lock, CheckCircle2, ShieldCheck, Check, Smartphone } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const STORY_FRAMES = [
  {
    title: "01. Create your link",
    headline: "You fill in the product details. Takes 10 seconds.",
    desc: "Enter your product price, weight, and delivery options right from your smartphone or shop counter. No complex coding required."
  },
  {
    title: "02. Share with your buyer",
    headline: "Share anywhere, via WhatsApp, SMS, email, or in-person.",
    desc: "Copy and send the unique Trova reference link to your customers on any channel. Universal compatibility makes it completely seamless."
  },
  {
    title: "03. Buyer pays with escrow guarantee",
    headline: "The money is locked in. Neither side can lose.",
    desc: "Buyers authorize checkouts confidently via secure merchant rails. Balance is securely segregated across secure partner bank vaults and fintech mobile wallets."
  },
  {
    title: "04. Deliver, confirm and earn",
    headline: "Funds hit your account the moment they confirm delivery.",
    desc: "Once the buyer receives the product and confirms specification matches, delivery settlements clear instantly to your local bank, card, or preferred payment method."
  }
];

export function StoryWalkthrough() {
  const [activeStoryFrame, setActiveStoryFrame] = useState(0);
  const [isWalkthroughPaused, setIsWalkthroughPaused] = useState(false);

  // Auto-play the storyboard walkthrough every 5 seconds unless paused by user click
  useEffect(() => {
    if (isWalkthroughPaused) return;
    const interval = setInterval(() => {
      setActiveStoryFrame((prev) => (prev + 1) % 4);
    }, 5000);
    return () => clearInterval(interval);
  }, [isWalkthroughPaused]);

  const sectionRef = useRef<HTMLDivElement>(null);
  const leftColumnRef = useRef<HTMLDivElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current || !leftColumnRef.current || !rightColumnRef.current) return;

    const ctx = gsap.context(() => {
      // Left hand side explanation sliding in on scroll direction
      gsap.fromTo(leftColumnRef.current,
        { x: -100, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 95%",
            end: "top 35%",
            scrub: 1,
          }
        }
      );

      // Right hand side mobile mock lifting and rotating on scroll entry
      gsap.fromTo(rightColumnRef.current,
        { scale: 0.7, y: 180, opacity: 0, rotate: 12 },
        {
          scale: 1,
          y: 0,
          opacity: 1,
          rotate: 0,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 90%",
            end: "top 30%",
            scrub: 1,
          }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleFrameClick = (idx: number) => {
    setActiveStoryFrame(idx);
    setIsWalkthroughPaused(true); // Stop autoplay when clicked
  };

  return (
    <section id="how-it-works" ref={sectionRef} className="pin-trigger-box w-full bg-zinc-950 border-y border-zinc-900 overflow-hidden relative">
      <div className="absolute top-1/2 left-[-10%] w-[330px] h-[330px] bg-emerald-500/[0.02] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-emerald-500/[0.04] rounded-full blur-[140px] pointer-events-none" />

      <div className="min-h-screen max-w-7xl mx-auto px-6 sm:px-12 py-20 flex flex-col justify-center">
        
        <div className="text-center flex flex-col gap-3 mb-10">
          <span className="text-[11px] text-emerald-400 font-extrabold uppercase tracking-widest font-mono">Interactive Storyboard Walkthrough</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold tracking-tight text-white animate-fade-in">
            Watch how it actually works.
          </h2>
          <p className="text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Experience the simple 4-frame flow of social link escrows. Tap any frame on the left or the indicator dots below to navigate.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          
          {/* LEFT SIDE — Interactive navigation steps list */}
          <div ref={leftColumnRef} className="flex flex-col gap-4">
            {STORY_FRAMES.map((step, idx) => {
              const isActive = activeStoryFrame === idx;
              return (
                <div 
                  key={idx}
                  onClick={() => handleFrameClick(idx)}
                  className={`p-5 sm:p-6 rounded-2xl border transition-all duration-300 flex gap-4 cursor-pointer text-left relative overflow-hidden ${
                    isActive 
                      ? 'bg-zinc-900/90 border-emerald-500/40 shadow-xl shadow-emerald-500/[0.02]' 
                      : 'bg-zinc-950/30 border-zinc-900 hover:border-zinc-800'
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-emerald-500" />
                  )}

                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
                    isActive 
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-500'
                  }`}>
                    {idx === 0 && <Plus className="w-5 h-5" />}
                    {idx === 1 && <Send className="w-5 h-5" />}
                    {idx === 2 && <Lock className="w-5 h-5" />}
                    {idx === 3 && <CheckCircle2 className="w-5 h-5" />}
                  </div>

                  <div className="flex flex-col select-none">
                    <h3 className={`font-display font-bold text-sm sm:text-base leading-snug transition-colors ${
                      isActive ? 'text-white' : 'text-zinc-400'
                    }`}>
                      {step.title}
                    </h3>
                    <h4 className={`text-xs font-semibold leading-normal font-sans mt-0.5 transition-colors ${
                      isActive ? 'text-emerald-400' : 'text-zinc-500'
                    }`}>
                      {step.headline}
                    </h4>
                    {isActive && (
                      <p className="text-zinc-400 text-xs mt-2.5 leading-relaxed font-normal animate-fade-in">
                        {step.desc}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT SIDE — Interactive Phone screen mockup containing live adaptive layouts */}
          <div ref={rightColumnRef} className="flex justify-center items-center relative py-10 lg:py-14">
            <div className="absolute top-1/4 left-1/4 w-[340px] h-[340px] bg-emerald-500/[0.03] rounded-full blur-[110px] pointer-events-none" />
            
            {/* Hand & Phone Assembly Wrapper */}
            <div className="relative w-[300px] h-[600px] select-none">
              
              {/* 1. Behind-Phone Hand Background */}
              <div className="absolute pointer-events-none z-0 bottom-[-95px] right-[-115px] w-[390px] h-[450px]">
                <svg viewBox="0 0 390 450" className="w-full h-full drop-shadow-[5px_22px_30px_rgba(0,0,0,0.92)]">
                  <defs>
                    <linearGradient id="cyber-sleeve-w" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0a0a0c" />
                      <stop offset="50%" stopColor="#141419" />
                      <stop offset="100%" stopColor="#1e1e24" />
                    </linearGradient>
                    <linearGradient id="cyber-hand-w" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#18181c" />
                      <stop offset="60%" stopColor="#22222a" />
                      <stop offset="100%" stopColor="#2c2c36" />
                    </linearGradient>
                    <linearGradient id="emerald-indicator-w" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#059669" stopOpacity="0.1" />
                    </linearGradient>
                    <filter id="neon-glow-w" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  <path
                    d="M 195 355 C 230 330, 275 338, 298 380"
                    fill="none"
                    stroke="url(#emerald-indicator-w)"
                    strokeWidth="5"
                    filter="url(#neon-glow-w)"
                  />
                  
                  <path
                    d="M 120 450 C 150 350, 210 335, 250 370 L 375 450 Z"
                    fill="url(#cyber-sleeve-w)"
                    stroke="#2d2d38"
                    strokeWidth="1.5"
                  />

                  <path
                    d="M 155 350 C 190 332, 230 342, 268 378"
                    fill="none"
                    stroke="#32323e"
                    strokeWidth="2.5"
                  />
                  
                  <path
                    d="M 115 300 C 105 235, 145 165, 220 145 C 280 130, 320 175, 330 250 C 300 330, 220 370, 155 350 Z"
                    fill="url(#cyber-hand-w)"
                    stroke="#3f3f4e"
                    strokeWidth="1.2"
                  />

                  <path
                    d="M 205 210 C 215 175, 255 165, 290 200 C 280 270, 230 280, 205 210 Z"
                    fill="#1c1c24"
                    opacity="0.8"
                  />
                </svg>
              </div>

              {/* 2. iPhone container mockup */}
              <div className="w-full h-full rounded-[42px] border-[8px] border-zinc-900 bg-black shadow-2xl overflow-hidden relative flex flex-col justify-between p-3 select-none z-10">
                
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-900 rounded-b-2xl z-20 flex justify-center items-center">
                  <div className="w-10 h-1 bg-black rounded-full mb-1" />
                </div>

                {/* Inner Screen Scroll Canvas */}
                <div className="flex-1 bg-black rounded-[28px] overflow-hidden flex flex-col relative pt-8 font-sans">
                  
                  <div className="px-4 py-1 flex justify-between items-center text-[9px] text-zinc-500 font-mono">
                    <span>Order</span>
                    <span>10:28 AM</span>
                  </div>

                  {/* FRAME 1 SCREEN — Link Generator Form */}
                  <div 
                    className="phone-content-frame-0 p-4 sm:p-5 flex flex-col gap-4 text-left flex-1 absolute inset-0 bg-zinc-950 pt-11 transition-all duration-500 ease-in-out"
                    style={{ opacity: activeStoryFrame === 0 ? 1 : 0, pointerEvents: activeStoryFrame === 0 ? "auto" : "none" }}
                  >
                    <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-2">
                      <ShieldCheck className="w-4.5 h-4.5 text-emerald-500" />
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">New Escrow Link</span>
                    </div>

                    <div className="flex flex-col gap-3 mt-1 font-sans">
                      <div className="flex flex-col gap-1">
                        <label className="text-[8.5px] uppercase text-zinc-500 font-bold font-mono">Product Name</label>
                        <div className="p-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white overflow-hidden font-normal select-none">
                          Silver Nike Dunks Size 43
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1 font-sans">
                          <label className="text-[8.5px] uppercase text-zinc-500 font-bold font-mono">Total Price</label>
                          <div className="p-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-805 text-xs text-white font-sans select-none">
                            ₦55,000
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 font-sans">
                          <label className="text-[8.5px] uppercase text-zinc-500 font-bold font-mono">Delivery Fee</label>
                          <div className="p-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-805 text-xs text-white font-sans select-none">
                            ₦3,500
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 font-sans">
                        <label className="text-[8.5px] uppercase text-zinc-500 font-bold font-mono">Buyer Phone Number</label>
                        <div className="p-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-805 text-xs text-white select-none">
                          +234 812 345 6789
                        </div>
                      </div>
                    </div>

                    <button 
                      type="button"
                      className="w-full mt-auto py-2 bg-emerald-500 text-black text-[10px] font-bold rounded-lg uppercase tracking-wide flex items-center justify-center gap-1 select-none active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Generate Link</span>
                    </button>
                  </div>

                  {/* FRAME 2 SCREEN — WhatsApp Native Sharing */}
                  <div 
                    className="phone-content-frame-1 p-3 flex flex-col gap-3.5 text-left flex-1 absolute inset-0 bg-zinc-950 pt-11 transition-all duration-500 ease-in-out font-sans"
                    style={{ opacity: activeStoryFrame === 1 ? 1 : 0, pointerEvents: activeStoryFrame === 1 ? "auto" : "none" }}
                  >
                    <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-white font-bold font-mono">
                        CA
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-white">Chidinma (Lagos Buyer)</span>
                        <span className="text-[8px] text-emerald-400">online</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 flex-1 justify-end pb-4 font-normal">
                      <div className="p-2 rounded-xl bg-zinc-900 max-w-[85%] self-start text-[10.5px] leading-relaxed text-zinc-300">
                        Hi sis! Please send the checkout link for the silver nike dunks.
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/40 max-w-[85%] self-end text-[10.5px] leading-relaxed text-emerald-100 flex flex-col gap-1 relative overflow-hidden select-none">
                        <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500/5 rounded-full blur-md" />
                        <p className="font-semibold text-emerald-400 text-[10px]">🔒 TROVA SECURED</p>
                        <p>Here's the secure link. Let's close transaction safely!</p>
                        <span className="text-emerald-500 underline break-all font-mono text-[9px] mt-1 pr-1.5 block">
                          trova.co/pay/TV-8821
                        </span>
                      </div>
                    </div>

                    <div className="p-2 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-between text-[10px] text-zinc-550 px-3 select-none">
                      <span>Message copy secured...</span>
                      <Send className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                  </div>

                  {/* FRAME 3 SCREEN — Buyer Checkout Lock Screen */}
                  <div 
                    className="phone-content-frame-2 p-4 flex flex-col gap-3 text-left absolute inset-0 bg-zinc-950 pt-11 transition-all duration-500 ease-in-out font-sans"
                    style={{ opacity: activeStoryFrame === 2 ? 1 : 0, pointerEvents: activeStoryFrame === 2 ? "auto" : "none" }}
                  >
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col gap-2 relative">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span>ESCROW VAULT ARMED</span>
                      </div>
                      <p className="text-[10px] text-zinc-300 leading-normal font-normal">
                        Funds held inside secure, segregated escrow partner bank vaults. Supports your local bank, card, or preferred payment method.
                      </p>
                    </div>

                    <div className="border border-zinc-900 rounded-xl bg-black p-3.5 flex flex-col gap-1.5 select-none mt-2">
                      <span className="text-[8px] text-zinc-500 font-bold font-mono">SECURED VALUE</span>
                      <p className="text-base font-bold font-mono text-white leading-none">₦58,500</p>
                      <span className="text-[8.5px] text-zinc-400 leading-normal block border-t border-zinc-900 pt-1.5 mt-1 font-normal animate-pulse">
                        Includes sneaker value ₦55,000 + insured courier shipping ₦3,500
                      </span>
                    </div>

                    <button 
                      type="button"
                      className="w-full mt-auto py-2.5 rounded-lg bg-emerald-500 text-black text-xs font-bold uppercase tracking-wider select-none flex items-center justify-center gap-1 shadow-md shadow-emerald-500/10 active:scale-95"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Authorize Safe Deposit</span>
                    </button>
                  </div>

                  {/* FRAME 4 SCREEN — Settlement Confirmed */}
                  <div 
                    className="phone-content-frame-3 p-4 flex flex-col gap-4 text-left flex-1 absolute inset-0 bg-[#0b0c0d] items-center justify-center text-center pt-11 transition-all duration-500 ease-in-out font-sans"
                    style={{ opacity: activeStoryFrame === 3 ? 1 : 0, pointerEvents: activeStoryFrame === 3 ? "auto" : "none" }}
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/5 mb-1 animate-bounce">
                      <Check className="w-6 h-6" />
                    </div>

                    <div className="flex flex-col gap-1">
                      <h4 className="text-sm font-bold text-white">₦58,500 Disbursed</h4>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold leading-none tracking-widest">TRANSACTION CLOSED</span>
                    </div>

                    <p className="text-[10.5px] text-zinc-400 leading-relaxed max-w-xs font-normal font-sans">
                      Lagos courier delivered item successfully. Buyer checked Yeezy shoes and hit confirm! Funds cleared directly to registered bank.
                    </p>

                    <div className="bg-zinc-900/60 p-2.5 px-3.5 rounded-lg border border-zinc-800 text-[9.5px] text-zinc-500 font-mono w-full text-center select-none leading-normal mt-3 font-sans">
                      Settled to Bank Account • Ref PO-2101
                    </div>
                  </div>

                </div>

                {/* Home indicator */}
                <div className="w-24 h-1 bg-zinc-800 rounded-full mx-auto my-1 shrink-0" />
              </div>

              {/* Fingers overlap mockup highlights */}
              <div 
                className="absolute left-[-15px] top-[140px] w-[25px] h-[35px] bg-gradient-to-r from-zinc-950 via-zinc-800 to-[#2c2c36] border-y border-r border-zinc-800/40 rounded-r-xl shadow-[3px_5px_8px_rgba(0,0,0,0.85)] z-20 pointer-events-none flex flex-col justify-center items-end pr-0.5"
                style={{ transform: "rotate(3deg)" }}
              >
                <div className="w-[3px] h-4 rounded-full bg-zinc-700/50 border-r border-white/5" />
              </div>

              <div 
                className="absolute left-[-17px] top-[192px] w-[28px] h-[37px] bg-gradient-to-r from-zinc-950 via-zinc-800 to-[#2c2c36] border-y border-r border-zinc-800/40 rounded-r-xl shadow-[3px_5px_9px_rgba(0,0,0,0.85)] z-20 pointer-events-none flex flex-col justify-center items-end pr-0.5"
                style={{ transform: "rotate(1.5deg)" }}
              >
                <div className="w-[3px] h-5 rounded-full bg-zinc-700/55 border-r border-white/5" />
              </div>

              <div 
                className="absolute left-[-16px] top-[244px] w-[26px] h-[36px] bg-gradient-to-r from-zinc-950 via-zinc-800 to-[#2c2c36] border-y border-r border-zinc-800/40 rounded-r-xl shadow-[3px_5px_8px_rgba(0,0,0,0.85)] z-20 pointer-events-none flex flex-col justify-center items-end pr-0.5"
                style={{ transform: "rotate(0deg)" }}
              >
                <div className="w-[3px] h-4 rounded-full bg-zinc-700/50 border-r border-white/5" />
              </div>

              <div 
                className="absolute left-[-13px] top-[296px] w-[22px] h-[31px] bg-gradient-to-r from-zinc-950 via-zinc-800 to-[#2c2c35] border-y border-r border-[#3a3a48]/40 rounded-r-lg shadow-[2px_4px_6px_rgba(0,0,0,0.85)] z-20 pointer-events-none flex flex-col justify-center items-end pr-0.5"
                style={{ transform: "rotate(-2deg)" }}
              >
                <div className="w-[2px] h-3 rounded-full bg-zinc-700/45 border-r border-white/5" />
              </div>

              <div 
                className="absolute right-[-14px] top-[385px] w-[35px] h-[46px] bg-gradient-to-l from-zinc-950 via-zinc-800 to-[#2a2a34] border-y border-l border-[#3a3a48]/40 rounded-l-2xl shadow-[-3px_5px_12px_rgba(0,0,0,0.9)] z-20 pointer-events-none flex flex-col justify-center items-start pl-1"
                style={{ transform: "rotate(-10deg)" }}
              >
                <div className="w-[3px] h-4 rounded-full bg-zinc-700/50 border-l border-white/5" />
              </div>

            </div>

          </div>

        </div>

        {/* Indicator dots */}
        <div className="flex gap-2.5 justify-center mt-6 relative z-20">
          {STORY_FRAMES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleFrameClick(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                activeStoryFrame === idx ? 'bg-emerald-500 w-8' : 'bg-zinc-850 hover:bg-zinc-700'
              }`}
              title={`View Frame ${idx + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
