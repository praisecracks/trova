import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Shield, Send } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'support';
  text: string;
  timestamp: string;
}

export default function SupportChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [hasUnread, setHasUnread] = useState(true); // Red badge initially active on load
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const storageKey = 'support_chat_sessionID';

  const getBotResponse = (msg: string): string => {
    const text = msg.toLowerCase();
    
    if (text.includes('escrow') || text.includes('how it works') || text.includes('what is escrow') || text.includes('explain')) {
      return "Trova keeps your funds safe in escrow. When you make a purchase, your payment is held securely in our trust vault and is only released to the seller after you receive and verify your ordered items. This ensures you either get exactly what you paid for or get your money back.";
    }
    if (text.includes('dispute') || text.includes('problem') || text.includes('issue') || text.includes('wrong') || text.includes('damaged') || text.includes('not received') || text.includes('scam')) {
      return "If there is any issue with your order, such as damaged goods, wrong sizes, or items not received, you can raise a dispute directly from your tracking page. Raising a dispute immediately freezes the escrow funds so they cannot be released to the seller while our mediation team reviews the case to ensure a fair resolution.";
    }
    if (text.includes('confirm') || text.includes('delivery') || text.includes('received') || text.includes('arrived') || text.includes('got it')) {
      return "Once you have received your delivery and verified that the items are in the correct condition, you can click the 'Confirm Delivery Arrived' or 'Approve' button. This authorizes the release of the escrowed funds to the seller's wallet to complete the purchase smoothly.";
    }
    if (text.includes('refund') || text.includes('money back') || text.includes('cancel')) {
      return "To request a refund, please raise a dispute or contact support. Once the seller agrees or our mediation team validates the dispute, the escrowed funds will be returned directly to your original payment method. Your money is completely protected until you authorize release.";
    }
    if (text.includes('seller') || text.includes('merchant') || text.includes('contact') || text.includes('reach')) {
      return "Trova coordinates directly with the merchant for validation. The seller is instantly notified when your payment is confirmed and when order updates are logged. If you need to contact them or require our help in reaching them, our team is here to assist.";
    }
    if (text.includes('how long') || text.includes('when') || text.includes('time') || text.includes('days')) {
      return "The typical timeline depends on the delivery service chosen by the seller. Standard shipping usually takes 1 to 5 business days. In the event of a dispute, our team aims to review and resolve the case within 48 to 72 hours once both parties submit their evidence.";
    }
    if (text.includes('account') || text.includes('login') || text.includes('sign up') || text.includes('password')) {
      return "For private account, login, or password assistance, please contact our support team directly at support@trova.co as we take your security seriously.";
    }
    if (text.includes('fees') || text.includes('cost') || text.includes('charge') || text.includes('percentage')) {
      return "Trova charges a small, transparent service fee of 2.5 percent of the transaction value. This fee is used to maintain secure escrow infrastructure and provide dispute mediation services for a safe transaction experience.";
    }
    
    return "Thank you for your message. A member of our support team will follow up with you shortly. For urgent order issues please use the Report a Problem button on your order tracking page.";
  };

  // Load chat session on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          setHasUnread(false); // If they have previous chat, clear default badge
          return;
        }
      } catch (e) {}
    }

    // Seed initial welcome message
    const initialWelcome: ChatMessage = {
      id: 'welcome-msg',
      sender: 'support',
      text: 'Hello! Welcome to Trova Support. How can we help you secure your transaction or answer your questions today?',
      timestamp: new Date().toISOString()
    };
    setMessages([initialWelcome]);
    localStorage.setItem(storageKey, JSON.stringify([initialWelcome]));
  }, []);

  // Save messages to storage
  const saveMessages = (updated: ChatMessage[]) => {
    setMessages(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  // Scroll to bottom whenever messages, open state, or typing state changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
    setHasUnread(false); // Clear badge on open
  };

  const addMessage = (sender: 'user' | 'support', text: string) => {
    const nextMsg: ChatMessage = {
      id: `chat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sender,
      text,
      timestamp: new Date().toISOString()
    };
    return nextMsg;
  };

  // Quick reply prompt handler
  const handleQuickReply = (question: string) => {
    if (isTyping) return;
    const userMsg = addMessage('user', question);
    const updatedWithUser = [...messages, userMsg];
    saveMessages(updatedWithUser);

    setIsTyping(true);

    // Simulate supportive reply delay between 1.5s and 2.5s
    const delay = Math.floor(Math.random() * 1000) + 1500;
    setTimeout(() => {
      setIsTyping(false);
      const answer = getBotResponse(question);
      const supportMsg = addMessage('support', answer);
      saveMessages([...updatedWithUser, supportMsg]);
    }, delay);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || isTyping) return;

    const userText = inputVal.trim();
    setInputVal('');

    const userMsg = addMessage('user', userText);
    const updatedWithUser = [...messages, userMsg];
    saveMessages(updatedWithUser);

    setIsTyping(true);

    // Simulate typing delay between 1.5s and 2.5s
    const delay = Math.floor(Math.random() * 1000) + 1500;
    setTimeout(() => {
      setIsTyping(false);
      const answer = getBotResponse(userText);
      const supportMsg = addMessage('support', answer);
      saveMessages([...updatedWithUser, supportMsg]);
    }, delay);
  };

  return (
    <div id="trustlink-floating-support-chat-widget" className="fixed bottom-6 right-6 z-[9990] font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulseSequence {
          0%, 100% { opacity: 0.2; }
          30% { opacity: 1; }
          60% { opacity: 0.2; }
        }
        .typing-dot {
          animation: pulseSequence 1.5s infinite;
        }
        .typing-dot:nth-child(1) { animation-delay: 0s; }
        .typing-dot:nth-child(2) { animation-delay: 0.3s; }
        .typing-dot:nth-child(3) { animation-delay: 0.6s; }
      ` }} />

      {/* Floating Action Button */}
      <button
        type="button"
        onClick={handleToggleChat}
        className="w-[52px] h-[52px] rounded-full bg-[#10b981] hover:bg-[#059669] text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all select-none relative cursor-pointer outline-none"
      >
        <MessageCircle className="w-6 h-6 text-white shrink-0" />
        {hasUnread && (
          <span className="w-3 h-3 bg-red-500 rounded-full border-2 border-black absolute top-0 right-0 animate-ping shrink-0" />
        )}
        {hasUnread && (
          <span className="w-3 h-3 bg-red-500 rounded-full border-2 border-black absolute top-0 right-0 shrink-0" />
        )}
      </button>

      {/* Slide-Up Chat Panel */}
      {isOpen && (
        <div 
          style={{ 
            backgroundColor: 'var(--surface, #09090b)', 
            borderColor: 'var(--border, #27272a)' 
          }}
          className="w-full max-w-[360px] h-[480px] rounded-t-3xl sm:rounded-2xl border bg-zinc-950 shadow-2xl fixed bottom-0 left-0 right-0 sm:bottom-[84px] sm:right-6 sm:left-auto z-[9995] flex flex-col overflow-hidden max-sm:w-full max-sm:h-[85vh] animate-fade-in"
        >
          {/* Header */}
          <div className="bg-[#10b981]/15 border-b border-zinc-900 px-4 py-3.5 flex items-center justify-between select-none shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-[#10b981]/15 flex items-center justify-center">
                <Shield className="w-4 h-4 text-[#10b981]" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[12px] font-bold text-white tracking-wide">Trova Support</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0" />
                  <span className="text-[9.5px] text-zinc-400 font-semibold uppercase tracking-wider">Agents Online</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Message Log Workspace */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 no-scrollbar bg-black/40">
            {messages.map((msg) => {
              const isSupport = msg.sender === 'support';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 max-w-[85%] text-left items-start animate-fade-in ${
                    isSupport ? 'self-start' : 'self-end flex-row-reverse text-right'
                  }`}
                >
                  {isSupport && (
                    <div className="w-6 h-6 rounded-full bg-[#10b981]/10 flex items-center justify-center shrink-0 font-bold text-[9px] text-[#10b981] mt-1 border border-[#10b981]/10">
                      TL
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5">
                    <div
                      style={{ 
                        backgroundColor: isSupport ? '#1f1f23' : '#10b981', 
                        color: isSupport ? '#f4f4f5' : '#000000' 
                      }}
                      className={`text-[12.5px] px-3.5 py-2 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                        isSupport ? 'rounded-tl-none border border-zinc-800' : 'rounded-tr-none font-medium'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-zinc-500 font-mono mt-0.5 px-1 block">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex gap-2 max-w-[85%] text-left items-start animate-fade-in self-start">
                <div className="w-6 h-6 rounded-full bg-[#10b981]/10 flex items-center justify-center shrink-0 font-bold text-[9px] text-[#10b981] mt-1 border border-[#10b981]/10">
                  TL
                </div>
                <div className="flex flex-col gap-0.5">
                  <div
                    className="bg-[#1f1f23] text-[#f4f4f5] text-[12.5px] px-3.5 py-2 rounded-2xl rounded-tl-none border border-zinc-800 flex items-center gap-1"
                  >
                    <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full typing-dot" />
                    <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full typing-dot" />
                    <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full typing-dot" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies Panel */}
          <div className="px-3 py-2 border-t border-zinc-900 flex flex-col gap-1.5 bg-black/60 shrink-0 select-none">
            <span className="text-[8.5px] font-semibold text-zinc-550 uppercase tracking-widest pl-1 text-left">Suggested Questions</span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              <button
                type="button"
                onClick={() => handleQuickReply("How does escrow work?")}
                className="px-2.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white shrink-0 hover:bg-zinc-850 cursor-pointer text-[10.5px]"
              >
                🛡️ How does escrow work?
              </button>
              <button
                type="button"
                onClick={() => handleQuickReply("My order has a problem")}
                className="px-2.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white shrink-0 hover:bg-zinc-850 cursor-pointer text-[10.5px]"
              >
                ⚠️ My order has a problem
              </button>
              <button
                type="button"
                onClick={() => handleQuickReply("I want to confirm delivery")}
                className="px-2.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white shrink-0 hover:bg-zinc-850 cursor-pointer text-[10.5px]"
              >
                📦 I want to confirm delivery
              </button>
            </div>
          </div>

          {/* Send Area input panel */}
          <div className="p-3 border-t border-zinc-900 bg-black shrink-0">
            <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Type your message..."
                disabled={isTyping}
                className="flex-1 bg-zinc-900 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#10b981]/50 placeholder-zinc-500 font-sans disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isTyping || !inputVal.trim()}
                className="w-8.5 h-8.5 rounded-xl bg-[#10b981] hover:bg-[#059669] flex items-center justify-center shrink-0 cursor-pointer transition-all active:scale-90 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-black" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
