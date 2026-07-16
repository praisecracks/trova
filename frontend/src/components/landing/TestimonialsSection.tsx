import React, { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Star } from "lucide-react";

export function TestimonialsSection() {
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const marqueeTween = useRef<gsap.core.Tween | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartProgress = useRef(0);

  useEffect(() => {
    const container = testimonialsRef.current;
    if (!container) return;

    // Set initial layout position
    gsap.set(container, { xPercent: 0 });

    // Creates continuous seamless left scrolling keyframe-like motion via GSAP
    marqueeTween.current = gsap.to(container, {
      xPercent: -50,
      ease: "none",
      duration: 50, // slow, constant conveyor belt speed
      repeat: -1,
      paused: false,
    });

    return () => {
      if (marqueeTween.current) marqueeTween.current.kill();
    };
  }, []);

  const handleMouseEnter = () => {
    if (marqueeTween.current && !isDragging) {
      marqueeTween.current.pause();
    }
  };

  const handleMouseLeave = () => {
    if (marqueeTween.current && !isDragging) {
      marqueeTween.current.play();
    }
  };

  const handleDragStart = (clientX: number) => {
    if (!marqueeTween.current) return;
    setIsDragging(true);
    dragStartX.current = clientX;
    dragStartProgress.current = marqueeTween.current.progress();
    marqueeTween.current.pause();
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging || !marqueeTween.current || !testimonialsRef.current) return;

    const container = testimonialsRef.current;
    const deltaX = clientX - dragStartX.current;

    const totalWidth = container.scrollWidth;
    const halfWidth = totalWidth / 2;
    if (halfWidth <= 0) return;

    // Positive x-drag shifts right (decreases progress), negative shifts left (increases progress)
    const deltaProgress = -deltaX / halfWidth;
    let newProgress = dragStartProgress.current + deltaProgress;

    // Keep progress strictly wrapped [0, 1] for endless looping
    if (newProgress < 0) {
      newProgress = (newProgress % 1) + 1;
    } else if (newProgress > 1) {
      newProgress = newProgress % 1;
    }

    marqueeTween.current.progress(newProgress);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (marqueeTween.current) {
      marqueeTween.current.play();
    }
  };

  const baseItems = [
    {
      initials: "CA",
      name: "Chidinma A.",
      role: "Fashion Vendor, Lagos",
      text: "I was scared to sell to strangers online. Trova changed that. I've done ₦2.1M in sales this month alone.",
    },
    {
      initials: "EO",
      name: "Emeka O.",
      role: "Electronics Dealer, Abuja",
      text: "My buyers trust me more now. The escrow link makes me look professional. No more explaining that we are legits in DMs.",
    },
    {
      initials: "FB",
      name: "Fatima B.",
      role: "Beauty Products, Kano",
      text: "Setup was so fast. I sent my first link within 5 minutes of signing up. Highly recommend to anyone selling clothing across the world!",
    },
    {
      initials: "BK",
      name: "Biodun K.",
      role: "Wholesale distributor, Ibadan",
      text: "I run a wholesale supply business. Trova gives my clients confidence to place large orders without fear. It has changed how I close deals.",
      isFeatured: true,
    },
    {
      initials: "AM",
      name: "Alhaji Musa Y.",
      role: "Agribusiness Supplier, Kaduna",
      text: "We ship agricultural produce from Kaduna down south in truckloads. Trova ensures our logistics partners and buyers are completely aligned. The funds clear immediately delivery is signed off.",
    },
    {
      initials: "CN",
      name: "Dr. Chioma N.",
      role: "Medical Equipment supplier, Enugu",
      text: "When dealing with high-ticket imports, trust is everything. Trova lets diagnostic clinic buyers secure payments safely before we dispatch precious medical gear. Extremely reliable.",
      isMonoRole: true,
    },
    {
      initials: "SO",
      name: "Seyi O.",
      role: "Furniture Manufacturer, Abuja",
      text: "Taking massive advance deposits used to be a tough conversation with new clients. Now, they deposit into the Trova escrow vault, and I begin manufacturing knowing the money is secure.",
    },
    {
      initials: "TG",
      name: "Tamuno G.",
      role: "Seafood Wholesaler, Port Harcourt",
      text: "I send fresh seafood crates to customers across the world. Using this system means I never worry about payment-on-delivery problems on regional highways.",
    },
  ];

  const items = baseItems.concat(baseItems);

  return (
    <section id="testimonials" className="py-24 bg-zinc-950/20 border-t border-zinc-900 select-none text-left font-sans">
      <div className="max-w-6xl mx-auto px-6 sm:px-12 flex flex-col gap-14">
        <div className="text-center flex flex-col gap-3">
          <span className="text-[11px] text-emerald-400 font-extrabold uppercase tracking-widest font-mono">Global Trust Network</span>
          <h2 className="text-3xl sm:text-4.5xl font-display font-extrabold text-white">Loved by businesses of all scales</h2>
          <p className="text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed font-normal">
            Read how wholesale suppliers, market traders, retail shops, and corporate vendors across the world eliminated payment worries and built unbreakable customer trust.
          </p>
        </div>

        {/* Interactive Infinite Carousel Layout with ambient edge mask filters */}
        <div className="relative w-full overflow-hidden select-none outline-none" style={{ touchAction: "pan-y" }}>
          <div className="absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-[#09090b] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-[#09090b] to-transparent z-10 pointer-events-none" />

          <div
            ref={testimonialsRef}
            className="flex gap-5 w-max py-4 cursor-grab active:cursor-grabbing text-left"
            style={{ transform: "translate3d(0, 0, 0)" }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={(e) => handleDragStart(e.clientX)}
            onMouseMove={(e) => handleDragMove(e.clientX)}
            onMouseUp={handleDragEnd}
            onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
            onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
            onTouchEnd={handleDragEnd}
          >
            {items.map((item, idx) => (
              <div
                key={`${item.initials}-${idx}`}
                className="w-[280px] sm:w-[340px] shrink-0 p-6 rounded-2xl bg-zinc-950 border border-zinc-900 flex flex-col justify-between gap-5 relative overflow-hidden shadow-lg group transition-all duration-300 hover:border-zinc-850"
              >
                <div className="absolute top-0 left-0 w-1 bg-emerald-500 h-full" />

                <div className="flex flex-col gap-3">
                  <div className="flex gap-1 text-amber-500/90">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className={`text-xs sm:text-[12.5px] leading-relaxed italic ${
                    item.isFeatured ? "text-emerald-400 font-semibold" : "text-zinc-300 font-normal"
                  }`}>
                    "{item.text}"
                  </p>
                </div>

                <div className="flex items-center gap-3 mt-1">
                  <div className="w-8.5 h-8.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 font-mono shrink-0">
                    {item.initials}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-white leading-tight">{item.name}</span>
                    <span className={`text-[10px] text-zinc-500 leading-tight mt-0.5 ${item.isMonoRole ? "font-mono" : ""}`}>
                      {item.role}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
