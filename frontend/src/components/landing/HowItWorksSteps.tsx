import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CheckCircle2, ShieldCheck } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export function HowItWorksSteps() {
  const step1Ref = useRef<HTMLDivElement>(null);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const refs = [step1Ref, step2Ref, step3Ref];
    
    refs.forEach((ref, index) => {
      if (!ref.current) return;
      const el = ref.current;
      const bgNum = el.querySelector(".step-bg-number");
      
      const isEven = index % 2 === 0;
      const startX = isEven ? -80 : 80;

      gsap.fromTo(
        el,
        { x: startX, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        }
      );

      if (bgNum) {
        gsap.fromTo(
          bgNum,
          { opacity: 0 },
          {
            opacity: 0.07,
            duration: 0.9,
            delay: 0.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 80%",
              toggleActions: "play none none none",
            },
          }
        );
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => {
        // Only kill our triggers if needed, but standard ScrollTrigger.refresh() matches
      });
    };
  }, []);

  return (
    <section id="how-it-works-scroll" className="py-24 border-t border-zinc-900 select-none text-left font-sans bg-black">
      <div className="max-w-5xl mx-auto px-6 sm:px-12 flex flex-col gap-10">
        <div className="text-center flex flex-col gap-3 mb-10">
          <span className="text-[11px] text-emerald-400 font-extrabold uppercase tracking-widest font-mono">Visual step walkthrough</span>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white">3 Simple Steps to Safe Shopping</h2>
        </div>

        <div className="flex flex-col gap-24 relative">
          {/* Step 1 */}
          <div ref={step1Ref} className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center" style={{ opacity: 0 }}>
            <div className="flex flex-col gap-4">
              <span className="step-bg-number font-display text-7xl font-extrabold text-zinc-900 select-none leading-none -mb-3" style={{ opacity: 0 }}>01</span>
              <h3 className="text-xl font-bold tracking-tight text-white">Create Your Escrow Link in 10 Seconds</h3>
              <p className="text-xs sm:text-[13px] text-zinc-400 leading-relaxed font-normal">
                Enter product spec items, safe price values, and the buyer's contact identifier. Trova compiles a professional payment-ready holding invoice instantly. No complex checkout API triggers or third-party gateways to manage.
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold font-mono bg-emerald-500/5 p-2 px-3 border border-emerald-500/10 rounded-lg w-max">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>No bank account verification delay</span>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 flex flex-col gap-3 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.01] rounded-full blur-xl" />
              <span className="text-[9px] font-bold tracking-wider text-zinc-500 uppercase font-mono">Checkout Creator Mockup</span>
              <div className="p-3 bg-black border border-zinc-900 rounded-lg flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-350">Nike Dunks S-43</span>
                <span className="text-xs font-bold font-mono text-emerald-400">₦58,500</span>
              </div>
              <div className="p-2 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded text-[10.5px] text-emerald-400 font-mono text-center break-all">
                trova.co/pay/TV-7890
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div ref={step2Ref} className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center md:flex-row-reverse" style={{ opacity: 0 }}>
            <div className="flex flex-col gap-4 md:order-2">
              <span className="step-bg-number font-display text-7xl font-extrabold text-zinc-900 select-none leading-none -mb-3" style={{ opacity: 0 }}>02</span>
              <h3 className="text-xl font-bold tracking-tight text-white">Your Buyer Pays Into Protected Escrow</h3>
              <p className="text-xs sm:text-[13px] text-zinc-400 leading-relaxed font-normal">
                The buyer clears deposits securely on their mobile phone. Funds are immediately segregated to a licensed Trust Bank Trustee account. Both merchant and shopper can easily track active holdings on the reference ledger.
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold font-mono bg-emerald-500/5 p-2 px-3 border border-emerald-500/10 rounded-lg w-max">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Funds completely insured and protected</span>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 flex flex-col gap-3.5 md:order-1 shadow-xl">
              <div className="p-3.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4.5 h-4.5 text-emerald-500" />
                  <span className="font-bold text-white">Escrow Secured</span>
                </div>
                <span className="font-mono text-emerald-400 font-bold">₦58,500 Locked</span>
              </div>
              <p className="text-[11px] text-zinc-400 text-center leading-relaxed font-normal">
                Your buyer gets an automated SMS and WhatsApp alert: "₦58,500 deposit secured in escrow. Merchant will initiate delivery tracking code now."
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div ref={step3Ref} className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center" style={{ opacity: 0 }}>
            <div className="flex flex-col gap-4">
              <span className="step-bg-number font-display text-7xl font-extrabold text-zinc-900 select-none leading-none -mb-3" style={{ opacity: 0 }}>03</span>
              <h3 className="text-xl font-bold tracking-tight text-white">Deliver. They Confirm. You Get Paid.</h3>
              <p className="text-xs sm:text-[13px] text-zinc-400 leading-relaxed font-normal">
                Ship items comfortably. When the buyer receives their sneaker or apparel product, they confirm delivery from the public tracking link. Trova settlements trigger immediately directly to your verified commercial accounts.
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold font-mono bg-emerald-500/5 p-2 px-3 border border-emerald-500/10 rounded-lg w-max">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Mediators manage active disputes</span>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-900 flex flex-col gap-3 shadow-xl">
              <div className="flex justify-between items-center bg-black p-2.5 rounded border border-zinc-900">
                <span className="text-[10px] text-zinc-500 uppercase font-mono">Disbursement Clearing</span>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded">Completed</span>
              </div>
              <p className="text-[11.5px] text-zinc-300 leading-relaxed text-center font-normal">
                <strong>Liquidity arrived!</strong> ₦55,000 sent to your registered bank account or mobile wallet successfully. Escrow validation period complete.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
