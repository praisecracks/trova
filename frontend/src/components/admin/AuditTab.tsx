import React, { useState } from 'react';
import { AdminAuditLog } from '../../lib/services/admin';
import { Search, Clock, User, Zap, Shield, FileText, ShoppingCart, AlertTriangle } from 'lucide-react';

interface AuditTabProps {
  logs: AdminAuditLog[];
  theme?: 'dark' | 'light';
}

export function AuditTab({ logs, theme }: AuditTabProps) {
  const isLight = theme === 'light';
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.actorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.targetId?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !filterCategory || log.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string | null) => {
    switch (category) {
      case 'kyc':
        return <Shield className="w-4 h-4" />;
      case 'transaction':
        return <ShoppingCart className="w-4 h-4" />;
      case 'dispute':
        return <AlertTriangle className="w-4 h-4" />;
      case 'account':
        return <User className="w-4 h-4" />;
      case 'admin':
        return <Zap className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case 'kyc':
        return isLight
          ? 'text-emerald-600 bg-emerald-50'
          : 'text-emerald-400 bg-emerald-500/10';
      case 'transaction':
        return isLight
          ? 'text-blue-600 bg-blue-50'
          : 'text-blue-400 bg-blue-500/10';
      case 'dispute':
        return isLight
          ? 'text-amber-600 bg-amber-50'
          : 'text-amber-400 bg-amber-500/10';
      case 'account':
        return isLight
          ? 'text-purple-600 bg-purple-50'
          : 'text-purple-400 bg-purple-500/10';
      case 'admin':
        return isLight
          ? 'text-indigo-600 bg-indigo-50'
          : 'text-indigo-400 bg-indigo-500/10';
      default:
        return isLight
          ? 'text-zinc-600 bg-zinc-100'
          : 'text-zinc-400 bg-zinc-800';
    }
  };

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
              isLight ? 'bg-indigo-50' : 'bg-indigo-500/10'
            }`}
          >
            <Clock
              className={`w-6 h-6 ${
                isLight ? 'text-indigo-600' : 'text-indigo-400'
              }`}
            />
          </div>
          <div>
            <h2
              className={`text-xl font-bold ${
                isLight ? 'text-zinc-900' : 'text-zinc-100'
              }`}
            >
              Audit Logs
            </h2>
            <p
              className={`text-sm mt-1 ${
                isLight ? 'text-zinc-500' : 'text-zinc-400'
              }`}
            >
              Complete chronological record of all platform activity
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div
            className={`relative flex-1 ${
              isLight
                ? 'bg-zinc-50 border-zinc-200'
                : 'bg-zinc-800/50 border-zinc-700'
            } border rounded-xl px-4 py-3 flex items-center gap-3`}
          >
            <Search
              className={`w-4 h-4 ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`}
            />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`flex-1 bg-transparent border-none outline-none text-sm ${
                isLight ? 'text-zinc-900' : 'text-zinc-100'
              }`}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterCategory(null)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                !filterCategory
                  ? isLight
                    ? 'bg-zinc-800 text-white'
                    : 'bg-zinc-100 text-zinc-900'
                  : isLight
                  ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              All
            </button>
            {['kyc', 'transaction', 'dispute', 'account', 'admin'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filterCategory === cat
                    ? isLight
                      ? 'bg-zinc-800 text-white'
                      : 'bg-zinc-100 text-zinc-900'
                    : isLight
                    ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <Clock
              className={`w-12 h-12 mx-auto mb-4 ${
                isLight ? 'text-zinc-300' : 'text-zinc-600'
              }`}
            />
            <p
              className={`text-sm ${
                isLight ? 'text-zinc-500' : 'text-zinc-400'
              }`}
            >
              {searchQuery || filterCategory
                ? 'No logs match your filters'
                : 'No audit logs yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`p-5 rounded-xl border transition-all hover:shadow-sm ${
                  isLight
                    ? 'bg-white border-zinc-200'
                    : 'bg-zinc-800/30 border-zinc-700'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${getCategoryColor(log.category)}`}>
                    {getCategoryIcon(log.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                      <h4
                        className={`font-semibold ${
                          isLight ? 'text-zinc-900' : 'text-zinc-100'
                        }`}
                      >
                        {log.action}
                      </h4>
                      <span
                        className={`text-xs font-mono ${
                          isLight ? 'text-zinc-500' : 'text-zinc-400'
                        }`}
                      >
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {log.actorName && (
                        <span
                          className={`text-xs px-3 py-1 rounded-full ${
                            isLight
                              ? 'bg-zinc-100 text-zinc-700'
                              : 'bg-zinc-700 text-zinc-300'
                          }`}
                        >
                          {log.actorName}
                        </span>
                      )}
                      {log.targetId && (
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-mono ${
                            isLight
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-blue-500/10 text-blue-400'
                          }`}
                        >
                          {log.targetId.substring(0, 12)}...
                        </span>
                      )}
                    </div>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div
                        className={`mt-3 p-3 rounded-lg text-xs ${
                          isLight ? 'bg-zinc-50' : 'bg-zinc-800/50'
                        }`}
                      >
                        <pre
                          className={`overflow-x-auto ${
                            isLight ? 'text-zinc-600' : 'text-zinc-400'
                          }`}
                        >
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
