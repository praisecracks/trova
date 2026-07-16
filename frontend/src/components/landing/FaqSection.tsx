import React, { useState } from 'react';
import { ChevronDown, ShieldCheck, ShoppingBag, Store, HelpCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: React.ReactNode;
}

export function FaqSection() {
  const [activeTab, setActiveTab] = useState<'all' | 'buyers' | 'merchants'>('all');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleIndex = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleTabChange = (tab: 'all' | 'buyers' | 'merchants') => {
    setActiveTab(tab);
    setOpenIndex(null);
  };

  const buyerFaqs: FaqItem[] = [
    {
      question: "How does Trova secure my payment as a buyer?",
      answer: (
        <>
          When you pay via a Trova escrow link, your payment does not go directly to the merchant. Instead, it is secured in our licensed trustee account. The seller is notified that funds are secured, prompting them to ship your order. Funds are only transferred to the seller once you receive and confirm the package as described.
        </>
      ),
    },
    {
      question: "Is there a time limit for me to confirm delivery?",
      answer: (
        <>
          Yes. Once the merchant marks the item as shipped, you have a set inspection window (typically 3 to 5 days depending on the courier routing) to verify the item. If you do not raise a dispute or contact support during this period, the system will automatically assume everything is correct and disburse the funds to keep commerce moving.
        </>
      ),
    },
    {
      question: "What if the seller ships the wrong item or a damaged product?",
      answer: (
        <>
          If the item is not as specified, you can immediately click <strong className="text-rose-400">Report a Problem / Raise Dispute</strong> inside your tracking portal. This freezes the escrow funds instantly. You and the seller can discuss the issue using our integrated dispute chat room, where a platform mediator can step in to review shipment records and issue refunds when needed.
        </>
      ),
    },
    {
      question: "Are there extra hidden fees for buyers using Trova?",
      answer: (
        <>
          No, using Trova as a buyer is absolutely free! You only pay the actual seller price of the item and standard shipping cost as agreed upon with the merchant. There are no registration or escrow fees charged to buyers.
        </>
      ),
    }
  ];

  const merchantFaqs: FaqItem[] = [
    {
      question: "How does Trova protect me from fraudulent buyers or order cancellations?",
      answer: (
        <>
          Trova guarantees payment before you drop off your products or apparel at couriers like GIG Logistics. Buyers must lock the 100% purchase amount in escrow first. Once the funds are locked in our trustee vault, the buyer cannot cancel the payment or recall the money without going through support or mutual agreement, protecting you from frivolous cancellations.
        </>
      ),
    },
    {
      question: "How long does it take for funds to reach my bank account after delivery?",
      answer: (
        <>
          Once the buyer verifies the delivery on their device, the funds in escrow are released immediately. You can view your balance in your Merchant Dashboard and trigger a payout. Settled funds are transferred via bank wire to your registered Nigerian bank account within minutes!
        </>
      ),
    },
    {
      question: "Do I need a commercial website or API integration to get started?",
      answer: (
        <>
          No, zero technical setup is required! You can sign up, create custom Escrow Links manually or set up your digital storefront catalog within under 60 seconds. Share these links on WhatsApp, Instagram DMs, or Facebook, and start accepting safe escrow payments effortlessly.
        </>
      ),
    },
    {
      question: "What guidelines should I follow when shipping items?",
      answer: (
        <>
          To protect yourself from false buyer claims, always ship orders using reliable and recognized logistics providers (like GIG Logistics) and keep immediate photo or digital copies of the dispatch waybill. If a dispute occurs, you can upload this receipt as proof to platform mediators.
        </>
      )
    }
  ];

  const allFaqs = [...buyerFaqs, ...merchantFaqs];

  const currentFaqs = activeTab === 'all'
    ? allFaqs
    : activeTab === 'buyers'
      ? buyerFaqs
      : merchantFaqs;

  return (
    <section id="faq-section" className="py-24 relative select-none text-left border-t border-zinc-900 bg-[#09090b] overflow-hidden">
      {/* Visual background details */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-emerald-500/[0.015] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-emerald-500/[0.01] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 sm:px-12 flex flex-col gap-10 relative z-10">
        
        {/* Header */}
        <div className="text-center flex flex-col gap-3">
          <span className="text-[11px] text-emerald-400 font-extrabold uppercase tracking-widest font-mono">Answers on clearing & assurance</span>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">Frequently Asked Questions</h2>
          <p className="text-zinc-500 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Everything you need to know about the Trova escrow ledger, safety milestones, and financial clearing.
          </p>
        </div>

        {/* Categories Tab Selector */}
        <div className="flex bg-zinc-950/80 p-1 rounded-xl border border-zinc-900 max-w-sm mx-auto self-center w-full grow-0">
          <button
            type="button"
            onClick={() => handleTabChange('all')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg font-mono tracking-wide transition-all duration-200 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-zinc-900 text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            All Questions
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('buyers')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg font-mono tracking-wide transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'buyers'
                ? 'bg-zinc-900 text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3 h-3 text-emerald-450" />
            <span>Buyers</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('merchants')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg font-mono tracking-wide transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'merchants'
                ? 'bg-zinc-900 text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Store className="w-3 h-3 text-emerald-450" />
            <span>Merchants</span>
          </button>
        </div>

        {/* Collapsible Accordion Grid */}
        <div className="flex flex-col gap-4 mt-2">
          {currentFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="group rounded-2xl bg-zinc-950 border border-zinc-900/60 hover:border-zinc-800 transition-all duration-200 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleIndex(idx)}
                  className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800/80 group-hover:border-zinc-700/80 transition-all duration-200 shrink-0">
                      <HelpCircle className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                    </span>
                    <span className="text-xs sm:text-[13.5px] font-bold text-zinc-100 group-hover:text-white transition-colors tracking-tight leading-normal">
                      {faq.question}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-500 group-hover:text-zinc-350 transition-all duration-300 shrink-0 ${
                      isOpen ? 'transform rotate-180 text-emerald-400 group-hover:text-emerald-400' : ''
                    }`}
                  />
                </button>

                {/* Animated content expansion */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden border-t border-zinc-900/0 ${
                    isOpen ? 'max-h-[300px] opacity-100 border-t border-zinc-900/60' : 'max-h-0 opacity-0 pointer-events-none'
                  }`}
                >
                  <div className="p-5 sm:p-6 text-xs sm:text-[13px] text-zinc-400 leading-relaxed font-normal bg-zinc-950/50">
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Extra notice footer inside FAQ */}
        <div className="mt-4 p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.015] self-center flex items-start gap-3 max-w-2xl text-left">
          <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-wide">Federal Trustee Assurance & Compliance</span>
            <p className="text-[11px] text-zinc-400 leading-normal font-sans">
              Trova escrow accounts reside in protected, Tier-1 fully deposit-insured partner trustee banks. This segregates 100% of marketplace funds, ensuring neither party can bypass platform validation protocols.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
