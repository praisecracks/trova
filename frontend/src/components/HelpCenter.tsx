import React, { useState } from 'react';
import { 
  Building2, 
  HelpCircle, 
  CheckCircle2, 
  ChevronDown, 
  AlertCircle,
  Clock,
  Unlock,
  Key,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Info
} from 'lucide-react';

export default function HelpCenter() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [subject, setSubject] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [payoutId, setPayoutId] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const faqItems = [
    {
      q: "How does Trova's secure Holding Vault work?",
      a: "When a buyer pays via Paystack, the funds do not go directly to the merchant. They are secured in our partner trustee bank accounts. The funds are only released to the vendor once the buyer confirms safe physical delivery of the goods."
    },
    {
      q: "What is the automatic settlement release timer?",
      a: "To protect merchants, once a courier partner marks an order as physically 'Delivered', the buyer has 24 hours to inspect the package. If they don't manually raise a dispute or release funds within 24 hours, the vault automatically releases the payout to the merchant."
    },
    {
      q: "How do I trigger an immediate arbitration review?",
      a: "If there's a disagreement about size, color, or item condition, either party can tap the 'Raise Custody Dispute' button in their portal. This pauses the automatic 24h release timer and prompts both parties to upload proof. A Trova moderator is typically assigned within 3 hours."
    },
    {
      q: "What are the transaction processing fees?",
      a: "Escrow creation links are 100% free for merchants. A flat 1.5% processing fee (capped at ₦2,000) is charged exclusively to secure payment gateways and logistics clearing infrastructure."
    }
  ];

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setSubject('');
      setInvoiceId('');
      setPayoutId('');
      setMessage('');
      setTimeout(() => setIsSubmitted(false), 4000);
    }, 1500);
  };

  return (
    <div id="arbitration-support-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left font-sans">
      
      {/* Toast Notification */}
      {isSubmitted && (
        <div className="bg-emerald-500 text-black px-4 py-2 text-xs font-bold rounded-md shadow-lg flex items-center gap-2 fixed bottom-6 right-6 z-50">
          <CheckCircle2 className="w-4 h-4 text-black" />
          <span>Ticket created! A resolution officer was successfully dispatched.</span>
        </div>
      )}

      {/* Left pane: Dispute Resolution Form (7 cols) */}
      <form onSubmit={handleSupportSubmit} className="lg:col-span-7 bg-zinc-950 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-5">
        
        <div className="flex gap-2 items-center border-b border-zinc-900 pb-3">
          <MessageSquare className="w-4.5 h-4.5 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">Dispute Moderation & Support Ticket</span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Need a manual escrow review or having trouble with bank account resolution? Open a direct dispute ticket with our 24/7 team.
        </p>

        <div className="flex flex-col gap-4">
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">Issue Subject</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Size mismatch arbitration or NUBAN verify fail"
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">Escrow ID (Optional)</label>
              <input
                type="text"
                value={invoiceId}
                onChange={(e) => setInvoiceId(e.target.value)}
                placeholder="e.g. TL-7890"
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">Withdrawal ID (Optional)</label>
              <input
                type="text"
                value={payoutId}
                onChange={(e) => setPayoutId(e.target.value)}
                placeholder="e.g. PO-4952"
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">Description details</label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide exact details of the transaction, buyer WhatsApp, or delivery carrier notes..."
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all h-28 font-sans resize-none"
            />
          </div>

        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-max mt-2 py-3 px-6 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
          ) : (
            <span>Dispatch Arbitration Request Team</span>
          )}
        </button>

      </form>

      {/* Right pane: FAQ Accordions (5 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-5">
        
        <div className="p-4.5 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">Trust Assurance Guidelines</span>
          </div>
          <span className="text-[11px] text-zinc-450 leading-relaxed font-sans">
            Our dispute coordinators use automated GPS logs from our delivery courier integrations and P2P IG/WhatsApp chat history screenshots to verify physical dispatch parameters.
          </span>
        </div>

        {/* Accordions */}
        <div className="flex flex-col gap-2 bg-zinc-950 border border-zinc-800 p-5 rounded-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2 font-mono">Frequently Asked Questions</span>
          {faqItems.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div key={idx} className="border-b border-zinc-90 w/55 py-2 last:border-none">
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between py-2 text-zinc-300 hover:text-white text-xs font-semibold text-left transition-colors cursor-pointer"
                >
                  <span className="pr-3 leading-snug">{faq.q}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <p className="pb-3 text-[11px] text-zinc-450 leading-relaxed animate-fade-in font-sans">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
