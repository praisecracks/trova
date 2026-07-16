import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ArrowLeft, 
  Send, 
  MessageSquare, 
  AlertTriangle, 
  UserCircle, 
  Paperclip, 
  X, 
  FileText,
  Clock,
  CheckCircle2,
  Calendar,
  HelpCircle,
  FileCheck,
  Briefcase,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Search,
  BookOpen,
  DollarSign
} from 'lucide-react';
import { EscrowLink } from '../types';
import { useToast } from './ToastContext';

interface DisputesViewProps {
  escrowLinks: EscrowLink[];
  onUpdateStatus: (linkId: string, status: EscrowLink['status']) => void;
  focusedDisputeId?: string;
  clearFocusedDisputeId?: () => void;
}

interface Dispute {
  transactionId: string;
  productName: string;
  buyerPhone: string;
  amount: number;
  dateRaised: string;
  status: 'Under Review' | 'Awaiting Admin Review' | 'Resolved';
  resolutionDetails?: string;
  resolutionType?: 'Refunded to Buyer' | 'Released to Merchant' | 'Mutual Agreement';
}

interface ChatMessage {
  id: string;
  author: 'buyer' | 'seller' | 'admin';
  text: string;
  timestamp: string;
  fileAttachment?: {
    name: string;
    url: string;
    type: string;
  };
}

export default function DisputesView({ 
  escrowLinks, 
  onUpdateStatus,
  focusedDisputeId,
  clearFocusedDisputeId
}: DisputesViewProps) {
  const { success, error, info } = useToast();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  
  // Tabs for disputes home
  const [activeTab, setActiveTab] = useState<'active' | 'resolved' | 'policy'>('active');

  // Synchronize and auto-select selected dispute based on parent focusedDisputeId (FIX 3)
  useEffect(() => {
    if (focusedDisputeId && disputes.length > 0) {
      const formattedId = focusedDisputeId.startsWith('TL-') ? focusedDisputeId : `TL-${focusedDisputeId}`;
      const found = disputes.find(d => 
        d.transactionId === focusedDisputeId || 
        d.transactionId === formattedId
      );
      if (found) {
        setSelectedDispute(found);
        if (found.status === 'Resolved') {
          setActiveTab('resolved');
        } else {
          setActiveTab('active');
        }
        info(`Focused Dispute: ${found.transactionId} for your attention.`);
      }
      if (clearFocusedDisputeId) {
        clearFocusedDisputeId();
      }
    }
  }, [focusedDisputeId, disputes, clearFocusedDisputeId, info]);
  const [searchQuery, setSearchQuery] = useState('');

  // File upload state & ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stagedFile, setStagedFile] = useState<{ name: string; url: string; type: string; size: string } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      error("File size exceeds 500KB limit for demo platform database storage.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setStagedFile({
        name: file.name,
        url: result,
        type: file.type,
        size: `${Math.round(file.size / 1024)} KB`
      });
      success("Attachment uploaded to draft successfully!");
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 1. Load or initialize disputes from localStorage and sync with escrowLinks
  useEffect(() => {
    const disputesKey = 'trustlink_disputes';
    const saved = localStorage.getItem(disputesKey);
    
    let currentDisputes: Dispute[] = [];
    if (saved) {
      try {
        currentDisputes = JSON.parse(saved);
      } catch (e) {}
    }

    if (currentDisputes.length === 0) {
      currentDisputes = [];
    }
    
    // Check if TL-8199 is disputed in parent, if yes, synchronize it
    const dl = escrowLinks.find(l => l.id === 'TL-8199');
    if (dl && dl.status === 'deposited') {
      onUpdateStatus('TL-8199', 'disputed');
    }

    // Dynamically synchronize with parent escrowLinks!
    let changed = false;
    escrowLinks.forEach(link => {
      const isDisputedStatus = link.status === 'disputed';
      const existingIdx = currentDisputes.findIndex(d => d.transactionId === link.id);
      
      if (isDisputedStatus) {
        if (existingIdx === -1) {
          // Add newly disputed link into disputes list
          currentDisputes.push({
            transactionId: link.id,
            productName: link.productName,
            buyerPhone: link.buyerPhone || "+234 812 345 6789",
            amount: link.amount,
            dateRaised: new Date().toISOString(),
            status: "Under Review"
          });
          changed = true;
        } else if (currentDisputes[existingIdx].status === 'Resolved') {
          // If parent is still disputed, but local was marked resolved, revert local to Under Review
          currentDisputes[existingIdx].status = 'Under Review';
          changed = true;
        }
      } else {
        // Link is NOT disputed in parent. If we have it as active in local disputes, resolve it!
        if (existingIdx !== -1 && currentDisputes[existingIdx].status !== 'Resolved') {
          currentDisputes[existingIdx].status = 'Resolved';
          currentDisputes[existingIdx].resolutionType = link.status === 'funds_released' ? 'Released to Merchant' : 'Refunded to Buyer';
          currentDisputes[existingIdx].resolutionDetails = `Administrative intervention resolved this transaction status instantly to: ${link.status}`;
          changed = true;
        }
      }
    });

    if (changed || !saved) {
      localStorage.setItem(disputesKey, JSON.stringify(currentDisputes));
    }
    setDisputes(currentDisputes);
  }, [escrowLinks]);

  // Sync active dispute count to sidebar on updates
  const activeDisputeCount = useMemo(() => {
    return disputes.filter(d => d.status !== 'Resolved').length;
  }, [disputes]);

  useEffect(() => {
    const event = new CustomEvent('trustlink_dispute_count_changed', { detail: activeDisputeCount });
    window.dispatchEvent(event);
  }, [activeDisputeCount]);

  // 2. Load chat messages for the selected dispute
  useEffect(() => {
    if (!selectedDispute) {
      setChatMessages([]);
      return;
    }

    const chatKey = `dispute_chat_${selectedDispute.transactionId}`;
    const savedChat = localStorage.getItem(chatKey);

    if (savedChat) {
      try {
        setChatMessages(JSON.parse(savedChat));
        return;
      } catch (e) {}
    }

    setChatMessages([]);
  }, [selectedDispute]);

  // 3. Send message handle
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !stagedFile) return;
    if (!selectedDispute) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      author: 'seller',
      text: inputText.trim() || `Sent an attachment: ${stagedFile?.name}`,
      timestamp: new Date().toISOString(),
      ...(stagedFile ? {
        fileAttachment: {
          name: stagedFile.name,
          url: stagedFile.url,
          type: stagedFile.type
        }
      } : {})
    };

    const nextMessages = [...chatMessages, newMessage];
    setChatMessages(nextMessages);
    localStorage.setItem(`dispute_chat_${selectedDispute.transactionId}`, JSON.stringify(nextMessages));
    setInputText('');
    setStagedFile(null);
    success("Message sent into secure dispute archive.");

    // Small mock timeout for admin tracking update
    setTimeout(() => {
      const latestChat = localStorage.getItem(`dispute_chat_${selectedDispute.transactionId}`);
      if (latestChat) {
        try {
          const arr = JSON.parse(latestChat) as ChatMessage[];
          // Only append admin response if the last message was the seller's
          if (arr[arr.length - 1].author === 'seller') {
            const adminReply: ChatMessage = {
              id: `msg-admin-${Date.now()}`,
              author: 'admin',
              text: "Our dedicated support specialist has logged this dialogue. The verification process is actively underway.",
              timestamp: new Date().toISOString()
            };
            const expanded = [...arr, adminReply];
            setChatMessages(expanded);
            localStorage.setItem(`dispute_chat_${selectedDispute.transactionId}`, JSON.stringify(expanded));
          }
        } catch(e){}
      }
    }, 2000);
  };

  // 4. Request Resolution action
  const handleRequestResolution = () => {
    if (!selectedDispute) return;

    const updatedDisputes = disputes.map(d => {
      if (d.transactionId === selectedDispute.transactionId) {
        return { ...d, status: 'Awaiting Admin Review' as const };
      }
      return d;
    });

    setDisputes(updatedDisputes);
    localStorage.setItem('trustlink_disputes', JSON.stringify(updatedDisputes));
    setSelectedDispute(prev => prev ? { ...prev, status: 'Awaiting Admin Review' } : null);

    // Append admin action in chat thread
    const systemNotif: ChatMessage = {
      id: `sys-${Date.now()}`,
      author: 'admin',
      text: "🚨 Merchant has requested escalation resolution. Staff will inspect dispute terms immediately and issue arbitration judgment shortly.",
      timestamp: new Date().toISOString()
    };
    const nextMessages = [...chatMessages, systemNotif];
    setChatMessages(nextMessages);
    localStorage.setItem(`dispute_chat_${selectedDispute.transactionId}`, JSON.stringify(nextMessages));

    onUpdateStatus(selectedDispute.transactionId, 'disputed');
    success("Arbitration request submitted. Check back in 12 hours.");
  };

  // 5. Resolve dispute manually (Release funds)
  const handleMarkResolved = () => {
    if (!selectedDispute) return;

    const updatedDisputes = disputes.map(d => {
      if (d.transactionId === selectedDispute.transactionId) {
        return { 
          ...d, 
          status: 'Resolved' as const,
          resolutionType: 'Released to Merchant' as const,
          resolutionDetails: 'Settle directly with buyer in the dispute portal. Merchant and buyer resolved size exchange parameters mutually.'
        };
      }
      return d;
    });

    setDisputes(updatedDisputes);
    localStorage.setItem('trustlink_disputes', JSON.stringify(updatedDisputes));
    setSelectedDispute(prev => prev ? { 
      ...prev, 
      status: 'Resolved',
      resolutionType: 'Released to Merchant',
      resolutionDetails: 'Settle directly with buyer in the dispute portal. Merchant and buyer resolved size exchange parameters mutually.'
    } : null);

    const systemNotif: ChatMessage = {
      id: `sys-${Date.now()}`,
      author: 'admin',
      text: "✅ Dispute resolved mutually. Escrow balance settlement unlocked and auto-routed for bank clearance.",
      timestamp: new Date().toISOString()
    };
    const nextMessages = [...chatMessages, systemNotif];
    setChatMessages(nextMessages);
    localStorage.setItem(`dispute_chat_${selectedDispute.transactionId}`, JSON.stringify(nextMessages));

    // Release funds upon resolution!
    onUpdateStatus(selectedDispute.transactionId, 'funds_released');
    success("Funds released! Order settled successfully.");
  };

  // Separate active vs resolved
  const activeDisputesList = disputes.filter(d => d.status !== 'Resolved');
  const resolvedDisputesList = disputes.filter(d => d.status === 'Resolved');

  // Filter lists based on Search Query
  const filteredActiveList = useMemo(() => {
    if (!searchQuery.trim()) return activeDisputesList;
    const q = searchQuery.toLowerCase();
    return activeDisputesList.filter(d => 
      d.transactionId.toLowerCase().includes(q) || 
      d.productName.toLowerCase().includes(q)
    );
  }, [activeDisputesList, searchQuery]);

  const filteredResolvedList = useMemo(() => {
    if (!searchQuery.trim()) return resolvedDisputesList;
    const q = searchQuery.toLowerCase();
    return resolvedDisputesList.filter(d => 
      d.transactionId.toLowerCase().includes(q) || 
      d.productName.toLowerCase().includes(q)
    );
  }, [resolvedDisputesList, searchQuery]);

  return (
    <div id="disputes-view-container" className="flex flex-col gap-6 text-left font-sans w-full max-w-full relative">
      
      {!selectedDispute ? (
        <>
          {/* Header Panel */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-bold font-mono tracking-wider text-red-400 uppercase">Arbitration Court</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Disputes & Refund Claims
              </h1>
              <p className="text-xs max-w-xl text-[var(--text-muted)] leading-relaxed mt-0.5">
                Negotiate details with your social media buyers under support moderation. Resolve order complaints to unlock secure escrow payouts.
              </p>
            </div>
            
            {/* Quick Metrics */}
            <div className="flex gap-4 shrink-0 w-full md:w-auto">
              <div 
                style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
                className="border p-3 px-4 rounded-xl flex items-center gap-3-col flex-1 md:flex-none text-left"
              >
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Active Claims</div>
                  <div className="text-sm font-black text-[var(--text-primary)] font-mono">{activeDisputesList.length}</div>
                </div>
              </div>

              <div 
                style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
                className="border p-3 px-4 rounded-xl flex items-center gap-3 flex-1 md:flex-none text-left"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-450">Resolved</div>
                  <div className="text-sm font-black text-[var(--text-primary)] font-mono">{resolvedDisputesList.length}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Control Panel */}
          <div 
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
            className="border p-4 rounded-2xl flex flex-col sm:flex-row gap-4 justify-between items-center"
          >
            {/* Category tabs */}
            <div 
              style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
              className="flex border p-1 rounded-xl w-full sm:w-auto select-none"
            >
              <button
                onClick={() => { setActiveTab('active'); setSearchQuery(''); }}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                style={{ 
                  backgroundColor: activeTab === 'active' ? 'var(--surface)' : 'transparent',
                  color: activeTab === 'active' ? 'rgb(248, 113, 113)' : 'var(--text-muted)',
                  border: activeTab === 'active' ? '1px solid var(--border)' : '1px solid transparent'
                }}
              >
                <span>Active Cases</span>
                <span className="px-1.5 py-0.2 bg-red-500/10 text-red-500 rounded text-[9px] font-mono font-bold">
                  {activeDisputesList.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('resolved'); setSearchQuery(''); }}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                style={{ 
                  backgroundColor: activeTab === 'resolved' ? 'var(--surface)' : 'transparent',
                  color: activeTab === 'resolved' ? 'rgb(16, 185, 129)' : 'var(--text-muted)',
                  border: activeTab === 'resolved' ? '1px solid var(--border)' : '1px solid transparent'
                }}
              >
                <span>Resolved Archive</span>
                <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-500 rounded text-[9px] font-mono font-bold">
                  {resolvedDisputesList.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('policy'); setSearchQuery(''); }}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                style={{ 
                  backgroundColor: activeTab === 'policy' ? 'var(--surface)' : 'transparent',
                  color: activeTab === 'policy' ? '#10b981' : 'var(--text-muted)',
                  border: activeTab === 'policy' ? '1px solid var(--border)' : '1px solid transparent'
                }}
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Arbitration Manual</span>
              </button>
            </div>

            {/* Quick Search */}
            {activeTab !== 'policy' && (
              <div className="relative flex items-center w-full sm:max-w-xs shrink-0 select-none">
                <Search className="absolute left-3 w-4 h-4 text-[var(--text-dim)] pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter cases by Ref ID or product..."
                  style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs font-medium focus:outline-none transition-all placeholder:text-[var(--text-dim)] shadow-inner"
                />
              </div>
            )}
          </div>

          {/* ======================= ACTIVE DISPUTES TAB ======================= */}
          {activeTab === 'active' && (
            filteredActiveList.length === 0 ? (
              <div 
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                className="border rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-4 min-h-[340px]"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-450 animate-bounce">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div className="flex flex-col gap-1 max-w-sm">
                  <h3 className="text-sm font-extrabold text-[var(--text-primary)]">Dispute Ledger Clear!</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Awesome work! None of your transactions are under dispute. Your shipping ratings and customer security scores are performing incredibly well.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredActiveList.map(d => (
                  <div 
                    key={d.transactionId}
                    style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
                    className="border rounded-2xl p-5 hover:border-red-500/30 transition-all flex flex-col justify-between gap-6 relative group"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                          <span className="font-mono text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-md self-start">
                            {d.transactionId}
                          </span>
                          <h4 className="font-black text-[var(--text-primary)] text-[14px] mt-2 group-hover:text-red-400 transition-colors">
                            {d.productName}
                          </h4>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          {d.status}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        <div className="flex justify-between items-center">
                          <span>Buyer Phone:</span>
                          <span className="font-mono font-bold text-[var(--text-primary)]">{d.buyerPhone}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Date Opened:</span>
                          <span className="font-bold flex items-center gap-1 text-[var(--text-primary)]">
                            <Calendar className="w-3 h-3 text-zinc-550" />
                            {new Date(d.dateRaised).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-[var(--border)] pt-4 mt-1">
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-zinc-550">Held Value</span>
                        <span className="text-base font-black font-mono text-[var(--text-primary)]">
                          ₦{d.amount.toLocaleString()}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedDispute(d)}
                        className="py-1.5 px-3 bg-red-500/10 hover:bg-red-500 border border-red-500/20 hover:border-red-500 hover:text-black font-extrabold text-[10.5px] rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-red-450"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Resolve Case</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ======================= RESOLVED DISPUTES TAB ======================= */}
          {activeTab === 'resolved' && (
            filteredResolvedList.length === 0 ? (
              <div 
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                className="border rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-4 min-h-[300px]"
              >
                <div className="w-12 h-12 rounded-full bg-zinc-800/20 border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="flex flex-col gap-1 max-w-xs">
                  <h3 className="text-sm font-extrabold text-[var(--text-primary)]">Empty Archives</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    You do not have any settled disputes yet. Any cases marked complete will stay cataloged safely here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredResolvedList.map(d => (
                  <div 
                    key={d.transactionId}
                    style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                    className="border rounded-2xl p-5 hover:border-emerald-500/20 transition-all flex flex-col justify-between gap-5 text-xs text-left"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                            {d.transactionId}
                          </span>
                          <h4 className="font-bold text-[var(--text-primary)] text-sm mt-2">{d.productName}</h4>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Resolved</span>
                        </span>
                      </div>

                      {/* Settlement summary tag */}
                      <div className="p-3 rounded-lg bg-[var(--surface2)] border border-[var(--border)] leading-relaxed flex flex-col gap-2">
                        <div className="flex justify-between items-center text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          <span>Decision Outcome:</span>
                          <strong className="text-emerald-400 font-extrabold">{d.resolutionType}</strong>
                        </div>
                        <p className="text-[11px] leading-relaxed text-zinc-400">
                          {d.resolutionDetails || "Case closed mutually. Secure escrow value successfully cleared to destination bank."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-[var(--border)] pt-3.5">
                      <div className="flex items-center gap-1.5 font-mono text-[var(--text-muted)] font-medium text-[11px]">
                        <span>Released Balance:</span>
                        <strong className="text-[var(--text-primary)]">₦{d.amount.toLocaleString()}</strong>
                      </div>
                      
                      <button
                        onClick={() => setSelectedDispute(d)}
                        className="py-1 px-3 border border-[var(--border)] rounded bg-transparent hover:bg-[var(--surface2)] text-[10.5px] font-semibold text-[var(--text-primary)] transition-all cursor-pointer"
                      >
                        Review Dialogue
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ======================= ARBITRATION POLICY MANUAL ======================= */}
          {activeTab === 'policy' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start animate-fade-in select-all">
              
              {/* Detailed articles */}
              <div className="md:col-span-8 flex flex-col gap-5">
                
                <div 
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                  className="border p-6 rounded-2xl flex flex-col gap-4 text-left"
                >
                  <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>How Social Escrow Arbitration Safeguards Work</span>
                  </h3>
                  
                  <div style={{ borderColor: 'var(--border)' }} className="border-t pt-4 flex flex-col gap-4 text-[12px] leading-relaxed text-zinc-400">
                    <div className="flex flex-col gap-1">
                      <h4 className="font-bold text-zinc-200">1. Verification Framework (Waybill & Claims)</h4>
                      <p>
                        To resolve order discrepancies (e.g. wrong size, damaged packaging, or missing pieces), both parties are asked to list proof. Buyers must supply clear high-resolution pictures of size label markings. Merchants must upload dispatch screenshots, shipping receipts, or barcode Waybill files.
                      </p>
                    </div>

                    <div className="flex flex-col gap-1 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                      <h4 className="font-bold text-zinc-200">2. Mutually Authorized Refunds or Settlements</h4>
                      <p>
                        You can refund or settle right from the dashboard portal. If size swaps or refunds are mutually agreed upon in DMs, the seller can instantly trigger "Mark as Resolved" to release the locked funds safely back into the merchant loop or coordinate returns effortlessly.
                      </p>
                    </div>

                    <div className="flex flex-col gap-1 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                      <h4 className="font-bold text-zinc-200">3. Support Escapes & Decisions</h4>
                      <p>
                        If communications break down or fake claims are suspected, tapping the "Request Resolution" button escalates the case code straight into the Trova Support Desk. Active moderators audit documents within 12-24 hours to issue a binding, secure settlement release.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Tips bento board */}
              <div className="md:col-span-4 flex flex-col gap-6">
                
                <div 
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
                  className="border p-5 rounded-2xl flex flex-col gap-4 text-left"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[var(--text-primary)]">Dispute Safehouse Tips</h4>
                      <p className="text-[10px] text-[var(--text-muted)]">Maintain 100% positive payouts</p>
                    </div>
                  </div>

                  <hr style={{ borderColor: 'var(--border)' }} />

                  <ul className="text-[11px] leading-relaxed text-zinc-400 flex flex-col gap-3 list-disc pl-4 text-left">
                    <li>Always photograph the size print sheets of shoes or label barcodes on package dispatch days.</li>
                    <li>Settle things transparently in chat before inviting Support Desk arbitration.</li>
                    <li>Clearly detail sizing fits on your custom "Store Link" pages to avoid delivery returns.</li>
                    <li>Do not dispatch order cargo if Trova dashboard shows "Awaiting Secure Deposit". Only ship when "Payment Secured" glows green.</li>
                  </ul>
                </div>

              </div>

            </div>
          )}
        </>
      ) : (
        /* ======================== DETAILED ACTIVE CASE CHAT (EXPANDED VIEW) ======================== */
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 min-h-[550px] w-full max-w-full animate-fade-in items-stretch">
          
          {/* Main Chat Conversation Board (Collage Column) */}
          <div 
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
            className="lg:col-span-8 border rounded-2xl p-5 flex flex-col justify-between h-[600px] shrink-0"
          >
            {/* Header portion */}
            <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4 shrink-0 justify-between select-none">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedDispute(null)}
                  style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
                  className="p-1 px-3 border rounded-lg hover:bg-[var(--surface2)] hover:opacity-85 text-[10.5px] font-bold text-[var(--text-primary)] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Cases Inbox</span>
                </button>
                <div>
                  <h3 className="text-sm font-black text-[var(--text-primary)]">Case: {selectedDispute.transactionId}</h3>
                  <div className="text-[10.5px] text-[var(--text-muted)] font-bold flex items-center gap-1 md:gap-2 flex-wrap">
                    <span>{selectedDispute.productName}</span>
                    <span className="text-emerald-450">•</span>
                    <span className="font-mono text-zinc-300">₦{selectedDispute.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                selectedDispute.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse'
              }`}>
                {selectedDispute.status}
              </span>
            </div>

            {/* Timestep Progress Stepper */}
            <div style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }} className="px-4 py-2 border rounded-xl my-2 flex items-center justify-between text-[10px] tracking-wide font-bold font-mono">
              <div className="flex items-center gap-1.5 text-red-400">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <span>Opened</span>
              </div>
              <ChevronRight className="w-3 h-3 text-zinc-650" />
              <div className={`flex items-center gap-1.5 ${selectedDispute.status !== 'Resolved' ? 'text-amber-400' : 'text-zinc-550'}`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedDispute.status !== 'Resolved' ? 'bg-amber-400 animate-pulse' : 'bg-zinc-550'}`} />
                <span>Arbitration Review</span>
              </div>
              <ChevronRight className="w-3 h-3 text-zinc-650" />
              <div className={`flex items-center gap-1.5 ${selectedDispute.status === 'Resolved' ? 'text-emerald-400' : 'text-zinc-550'}`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedDispute.status === 'Resolved' ? 'bg-emerald-400' : 'bg-zinc-550'}`} />
                <span>Resolved & Released</span>
              </div>
            </div>

            {/* Messaging Thread Canvas */}
            <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-4 px-1 no-scrollbar block scroll-smooth">
              {chatMessages.map((msg, index) => {
                if (msg.author === 'admin') {
                  return (
                    <div key={msg.id || index} className="flex flex-col items-center justify-center my-1.5 max-w-xl mx-auto text-center gap-1.5 animate-fade-in select-all">
                      <span className="bg-amber-500 text-black px-2 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Trova Support Staff
                      </span>
                      <div style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }} className="text-[11px] text-zinc-450 italic border rounded-xl p-3 font-semibold leading-relaxed text-left max-w-lg">
                        <div>{msg.text}</div>
                        {msg.fileAttachment && (
                          <div className="mt-2.5 text-left relative group">
                            {msg.fileAttachment.type.startsWith('image') || msg.fileAttachment.url.startsWith('data:image') ? (
                              <div className="rounded-lg overflow-hidden border border-amber-500/20 max-w-[180px] bg-black/45">
                                <img 
                                  src={msg.fileAttachment.url} 
                                  alt={msg.fileAttachment.name} 
                                  className="max-h-28 w-auto object-cover rounded-lg"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="text-[8.5px] text-zinc-500 p-1 truncate border-t border-[var(--border)] bg-black/10">
                                  {msg.fileAttachment.name}
                                </div>
                              </div>
                            ) : (
                              <a 
                                href={msg.fileAttachment.url} 
                                download={msg.fileAttachment.name}
                                className="flex items-center gap-2 p-1.5 rounded-lg bg-black/25 border border-amber-500/20 text-zinc-350"
                              >
                                <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span className="text-[9.5px] font-bold truncate max-w-[130px]">{msg.fileAttachment.name}</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                const isSeller = msg.author === 'seller';
                return (
                  <div 
                    key={msg.id || index} 
                    className={`flex flex-col max-w-[85%] ${isSeller ? 'self-end items-end' : 'self-start items-start'} animate-fade-in`}
                  >
                    <span className="text-[9.5px] text-[var(--text-muted)] font-black mb-1 font-mono uppercase tracking-wider">
                      {isSeller ? 'Merchant (You)' : 'Buyer (IG Customer)'}
                    </span>
                    
                    <div 
                      className={`rounded-xl px-4 py-2.5 text-xs font-semibold shadow-sm text-left leading-relaxed ${
                        isSeller 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      <div>{msg.text}</div>
                      
                      {msg.fileAttachment && (
                        <div className="mt-3 text-left relative group select-none">
                          {msg.fileAttachment.type.startsWith('image') || msg.fileAttachment.url.startsWith('data:image') ? (
                            <div className="rounded-lg overflow-hidden border border-emerald-550/20 max-w-[200px] bg-black/45">
                              <img 
                                src={msg.fileAttachment.url} 
                                alt={msg.fileAttachment.name} 
                                className="max-h-36 w-auto object-cover rounded-lg"
                                referrerPolicy="no-referrer"
                              />
                              <div className="text-[8px] text-zinc-400 p-1.5 truncate border-t border-[var(--border)] bg-black/20 font-mono">
                                {msg.fileAttachment.name}
                              </div>
                            </div>
                          ) : (
                            <a 
                              href={msg.fileAttachment.url} 
                              download={msg.fileAttachment.name}
                              className="flex items-center gap-2 p-2 rounded-lg bg-black/35 border border-emerald-555 hover:bg-black/50 transition-colors text-zinc-300 hover:text-white"
                            >
                              <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                              <div className="flex flex-col text-left overflow-hidden">
                                <span className="text-[10px] font-bold truncate max-w-[130px]">{msg.fileAttachment.name}</span>
                                <span className="text-[8px] text-zinc-450">Click to Download</span>
                              </div>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <span className="text-[8.5px] text-[var(--text-muted)] font-mono mt-1 flex items-center gap-1 select-none">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Input Attachment Tray & form stripe */}
            <form 
              onSubmit={handleSendMessage}
              className="flex flex-col gap-2 border-t border-[var(--border)] pt-4 px-1 shrink-0"
            >
              {/* Staged file attachment bubble preview */}
              {stagedFile && (
                <div style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }} className="flex items-center justify-between p-2 rounded-lg border text-xs gap-3 font-sans animate-fade-in max-w-sm self-start shadow-sm">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {stagedFile.type.startsWith('image/') ? (
                      <img src={stagedFile.url} className="w-8 h-8 rounded object-cover border border-zinc-800" referrerPolicy="no-referrer" alt="preview" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                    )}
                    <div className="flex flex-col text-left overflow-hidden">
                      <span className="text-[11px] text-[var(--text-primary)] font-bold truncate max-w-[150px]">{stagedFile.name}</span>
                      <span className="text-[9px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">{stagedFile.size}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStagedFile(null)}
                    className="p-1 rounded bg-transparent text-zinc-400 hover:text-red-500 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Message Controls */}
              {selectedDispute.status !== 'Resolved' ? (
                <div className="flex gap-2.5 items-center justify-between w-full select-none">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }}
                    className="p-2.5 border rounded-xl text-zinc-500 hover:text-[var(--text-primary)] hover:bg-[var(--surface2)] hover:opacity-85 transition-all cursor-pointer shrink-0 flex items-center justify-center shadow-inner"
                    title="Attach Waybills, Logistics Slip, or unboxing videos"
                  >
                    <Paperclip className="w-4.5 h-4.5" />
                  </button>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                    accept="image/*,application/pdf"
                  />
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Provide logisticsWaybills details, messaging snapshots, or size swap terms..."
                    style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    className="flex-1 font-bold rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-all placeholder:text-[var(--text-dim)] font-sans shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() && !stagedFile}
                    className="px-4.5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1 shrink-0 disabled:opacity-45 disabled:cursor-not-allowed"
                  >
                    <span>Send</span>
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div style={{ backgroundColor: 'var(--surface2)', borderColor: 'var(--border)' }} className="p-3 border rounded-xl text-xs text-center font-bold text-emerald-400 flex items-center justify-center gap-1.5 select-none">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Case closed. Conversation archived in Read-Only mode.</span>
                </div>
              )}
            </form>
          </div>

          {/* Right-hand Sidebar (Dispute Intel Panel for rich UI experience) */}
          <div className="lg:col-span-4 flex flex-col gap-6 items-stretch">
            
            {/* Case details Card */}
            <div 
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
              className="border p-5 rounded-2xl flex flex-col gap-4 text-left"
            >
              <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-450 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Arbitration Blueprint</span>
              </h4>
              
              <hr style={{ borderColor: 'var(--border)' }} />

              <div className="flex flex-col gap-3.5 text-xs leading-relaxed">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-550 block">Secured Balance</span>
                  <span className="text-xl font-black text-emerald-450 font-mono">
                    ₦{selectedDispute.amount.toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-550 block">Buyer Verified Account</span>
                  <span className="font-mono text-zinc-200 font-semibold">{selectedDispute.buyerPhone}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-550 block">Item Under Dispute</span>
                  <span className="font-bold text-[var(--text-primary)]">{selectedDispute.productName}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-550 block">Safety Code Reference</span>
                  <span className="font-mono bg-[var(--surface2)] px-2 py-0.5 rounded text-[10.5px] font-bold border border-[var(--border)] text-zinc-300 self-start inline-block mt-0.5">
                    {selectedDispute.transactionId}
                  </span>
                </div>
              </div>

              {selectedDispute.status !== 'Resolved' && (
                <div 
                  style={{ borderTopColor: 'var(--border)' }}
                  className="flex flex-col gap-2 border-t pt-4 mt-2"
                >
                  <button
                    onClick={handleMarkResolved}
                    className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Approve & Release Funds</span>
                  </button>

                  <button
                    onClick={handleRequestResolution}
                    disabled={selectedDispute.status === 'Awaiting Admin Review'}
                    className="w-full px-4 py-2 bg-red-500/10 hover:bg-red-500 hover:text-black hover:border-red-500 border border-red-505 text-red-400 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:opacity-45 disabled:cursor-not-allowed"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 font-bold" />
                    <span>{selectedDispute.status === 'Awaiting Admin Review' ? 'Escalated to Staff' : 'Escalate to Trova support'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* General FAQs on Arbitration in Sidebar */}
            <div 
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: 'var(--shadow)' }}
              className="border p-5 rounded-2xl flex flex-col gap-4 text-left"
            >
              <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-450 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                <span>Sellers Cheat Sheet</span>
              </h4>
              
              <hr style={{ borderColor: 'var(--border)' }} />

              <div className="flex flex-col gap-3 text-[11px] leading-relaxed text-zinc-400">
                <div>
                  <strong className="text-zinc-200 block mb-0.5">How do I verify exchanges?</strong>
                  <span>Arrange product return courier. Do NOT release claims manually until buyer drops old items off.</span>
                </div>
                <div>
                  <strong className="text-zinc-200 block mb-0.5">When does money clear?</strong>
                  <span>Once resolved mutually, secure money routes straight to your banking targets inside 60 seconds.</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
