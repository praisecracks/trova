import React, { useState, useEffect, useRef } from 'react';
import {
  AdminDispute,
  getDisputeMessages,
  sendDisputeMessage,
  resolveDispute,
} from '../../lib/services/admin';
import {
  AlertCircle,
  MessageSquare,
  Send,
  CheckCircle2,
  XCircle,
  ShoppingCart,
} from 'lucide-react';
import { EmptyStateCard } from '../common/EmptyStateCard';
import { getAnimationUrl } from '../../constants/animations';

interface DisputesTabProps {
  disputes: AdminDispute[];
  theme?: 'dark' | 'light';
  refreshData?: () => void;
}

export function DisputesTab({
  disputes,
  theme,
  refreshData,
}: DisputesTabProps) {
  const isLight = theme === 'light';
  const [selectedDispute, setSelectedDispute] = useState<AdminDispute | null>(
    null
  );
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeDisputes = disputes.filter(
    (d) => d.status === 'open' || d.status === 'escalated'
  );
  const resolvedDisputes = disputes.filter((d) => d.status === 'resolved');

  useEffect(() => {
    if (selectedDispute) {
      loadMessages();
    }
  }, [selectedDispute]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    if (!selectedDispute) return;
    setLoading(true);
    try {
      const msgs = await getDisputeMessages(selectedDispute.id);
      setMessages(msgs);
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedDispute || !newMessage.trim()) return;
    setSendingMessage(true);
    try {
      await sendDisputeMessage(selectedDispute.id, newMessage);
      setNewMessage('');
      await loadMessages();
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleResolve = async (fundTo: 'seller' | 'buyer') => {
    if (!selectedDispute) return;
    setLoading(true);
    try {
      await resolveDispute(selectedDispute.id, fundTo);
      if (refreshData) refreshData();
      setSelectedDispute(null);
    } catch (err) {
      console.error('Error resolving dispute:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'resolved') {
      return isLight
        ? 'bg-emerald-100 text-emerald-700'
        : 'bg-emerald-500/10 text-emerald-400';
    } else if (status === 'escalated') {
      return isLight
        ? 'bg-red-100 text-red-700'
        : 'bg-red-500/10 text-red-400';
    }
    return isLight
      ? 'bg-amber-100 text-amber-700'
      : 'bg-amber-500/10 text-amber-400';
  };

  const formatStatus = (status: string) =>
    status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`p-6 rounded-2xl border ${
          isLight
            ? 'bg-white border-zinc-200 shadow-sm'
            : 'bg-zinc-900 border-zinc-800 shadow-lg'
        }`}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              isLight ? 'bg-rose-50' : 'bg-rose-500/10'
            }`}
          >
            <AlertCircle
              className={`w-6 h-6 ${
                isLight ? 'text-rose-600' : 'text-rose-400'
              }`}
            />
          </div>
          <div>
            <h2
              className={`text-xl font-bold ${
                isLight ? 'text-zinc-900' : 'text-zinc-100'
              }`}
            >
              Disputes
            </h2>
            <p
              className={`text-sm mt-1 ${
                isLight ? 'text-zinc-500' : 'text-zinc-400'
              }`}
            >
              Manage and resolve transaction disputes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div
            className={`p-4 rounded-xl border ${
              isLight
                ? 'border-rose-200 bg-rose-50'
                : 'border-rose-800/30 bg-rose-500/10'
            }`}
          >
            <p
              className={`text-xs font-semibold ${
                isLight ? 'text-rose-600' : 'text-rose-400'
              }`}
            >
              Active
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${
                isLight ? 'text-rose-700' : 'text-rose-300'
              }`}
            >
              {activeDisputes.length}
            </p>
          </div>
          <div
            className={`p-4 rounded-xl border ${
              isLight
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-emerald-800/30 bg-emerald-500/10'
            }`}
          >
            <p
              className={`text-xs font-semibold ${
                isLight ? 'text-emerald-600' : 'text-emerald-400'
              }`}
            >
              Resolved
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${
                isLight ? 'text-emerald-700' : 'text-emerald-300'
              }`}
            >
              {resolvedDisputes.length}
            </p>
          </div>
        </div>

        {disputes.length === 0 ? (
          <EmptyStateCard
            title="All disputes resolved!"
            description="Your platform is running smoothly with no active disputes."
            animationUrl={getAnimationUrl('peaceOfMind')}
          />
        ) : (
          <div className="space-y-3">
            {[...activeDisputes, ...resolvedDisputes].map((dispute) => (
              <div
                key={dispute.id}
                onClick={() => setSelectedDispute(dispute)}
                className={`p-5 rounded-xl border transition-all hover:shadow-sm cursor-pointer ${
                  isLight
                    ? 'bg-white border-zinc-200'
                    : 'bg-zinc-800/30 border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${getStatusBadge(
                          dispute.status
                        )}`}
                      >
                        {formatStatus(dispute.status)}
                      </span>
                      <span
                        className={`font-mono text-xs ${
                          isLight ? 'text-zinc-500' : 'text-zinc-400'
                        }`}
                      >
                        {dispute.id.substring(0, 12)}...
                      </span>
                    </div>
                    <p
                      className={`font-semibold ${
                        isLight ? 'text-zinc-900' : 'text-zinc-100'
                      }`}
                    >
                      Dispute on Transaction:{' '}
                      {dispute.transactionId.substring(0, 12)}...
                    </p>
                    {dispute.transaction && (
                      <div className="flex items-center gap-2 mt-2">
                        <ShoppingCart
                          className={`w-4 h-4 ${
                            isLight ? 'text-zinc-400' : 'text-zinc-500'
                          }`}
                        />
                        <span
                          className={`text-sm font-bold ${
                            isLight ? 'text-zinc-700' : 'text-zinc-300'
                          }`}
                        >
                          {dispute.transaction.currencySymbol}
                          {(dispute.transaction.amount || 0).toLocaleString()}
                        </span>
                        {dispute.transaction.productName && (
                          <p
                            className={`text-sm ${
                              isLight ? 'text-zinc-500' : 'text-zinc-400'
                            }`}
                          >
                            {dispute.transaction.productName}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div
                    className={`text-xs ${
                      isLight ? 'text-zinc-400' : 'text-zinc-500'
                    }`}
                  >
                    {new Date(dispute.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedDispute(null)}
          />
          <div
            className={`relative w-full max-w-lg h-full ${
              isLight ? 'bg-white' : 'bg-zinc-900'
            } shadow-2xl border-l ${
              isLight ? 'border-zinc-200' : 'border-zinc-800'
            } flex flex-col`}
          >
            <div
              className={`p-6 border-b ${
                isLight ? 'border-zinc-200' : 'border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3
                  className={`text-lg font-bold ${
                    isLight ? 'text-zinc-900' : 'text-zinc-100'
                  }`}
                >
                  Dispute Details
                </h3>
                <button
                  onClick={() => setSelectedDispute(null)}
                  className={`p-2 rounded-lg transition-colors ${
                    isLight
                      ? 'hover:bg-zinc-100 text-zinc-600'
                      : 'hover:bg-zinc-800 text-zinc-400'
                  }`}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div
                className={`p-6 border-b ${
                  isLight ? 'border-zinc-200' : 'border-zinc-800'
                }`}
              >
                <span
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${getStatusBadge(
                    selectedDispute.status
                  )}`}
                >
                  {formatStatus(selectedDispute.status)}
                </span>
              </div>

              <div className="p-6 flex-1 space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : (
                  <>
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare
                          className={`w-10 h-10 mx-auto mb-3 ${
                            isLight ? 'text-zinc-300' : 'text-zinc-600'
                          }`}
                        />
                        <p
                          className={`text-sm ${
                            isLight ? 'text-zinc-500' : 'text-zinc-400'
                          }`}
                        >
                          No messages yet
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${
                              msg.sender_role === 'admin'
                                ? 'justify-end'
                                : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[80%] p-3 rounded-2xl ${
                                msg.sender_role === 'admin'
                                  ? isLight
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-emerald-500 text-white'
                                  : isLight
                                    ? 'bg-zinc-100 text-zinc-900'
                                    : 'bg-zinc-800 text-zinc-100'
                              }`}
                            >
                              <p className="text-xs font-semibold mb-1">
                                {msg.sender_role.charAt(0).toUpperCase() +
                                  msg.sender_role.slice(1)}
                              </p>
                              <p className="text-sm">{msg.message}</p>
                              <p className="text-[10px] mt-1 opacity-70 text-right">
                                {new Date(msg.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div
              className={`p-6 border-t ${
                isLight ? 'border-zinc-200' : 'border-zinc-800'
              }`}
            >
              {selectedDispute.status !== 'resolved' ? (
                <>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && handleSendMessage()
                      }
                      placeholder="Write a message..."
                      className={`flex-1 px-4 py-3 rounded-xl border text-sm ${
                        isLight
                          ? 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20'
                      }`}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={sendingMessage || !newMessage.trim()}
                      className={`px-4 py-3 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50 ${
                        isLight
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'bg-emerald-500 hover:bg-emerald-600'
                      }`}
                    >
                      {sendingMessage ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleResolve('seller')}
                      disabled={loading}
                      className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                        isLight
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      }`}
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Release to Seller
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleResolve('buyer')}
                      disabled={loading}
                      className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                        isLight
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : 'bg-rose-500 hover:bg-rose-600 text-white'
                      }`}
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          Refund to Buyer
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p
                    className={`text-sm ${
                      isLight ? 'text-zinc-500' : 'text-zinc-400'
                    }`}
                  >
                    This dispute has been resolved
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
