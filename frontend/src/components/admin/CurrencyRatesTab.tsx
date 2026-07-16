import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { getExchangeRate, getCurrencySymbol, getCurrencyName, detectCurrencyFromTimezone } from '../../lib/services/currency';

interface RateRow {
  currency: string;
  rate: number;
  updatedAt?: string;
  loading?: boolean;
  error?: string;
}

interface CurrencyRatesTabProps {
  theme?: 'dark' | 'light';
  refreshData?: () => void;
}

export default function CurrencyRatesTab({ theme }: CurrencyRatesTabProps) {
  const isLight = theme === 'light';
  const [rates, setRates] = useState<RateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const defaultCurrencies = [
    'USD', 'NGN', 'GHS', 'INR', 'EUR', 'GBP', 'KES', 'ZAR', 'JPY', 'CAD',
    'AUD', 'CHF', 'SGD', 'MYR', 'THB', 'VND', 'PHP', 'IDR', 'BRL', 'MXN'
  ];

  const loadRates = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        defaultCurrencies.map(async (currency) => {
          const rate = await getExchangeRate('USD', currency);
          return {
            currency,
            rate,
            loading: false,
            error: rate === 0 ? 'Rate not available' : undefined,
          };
        })
      );
      setRates(results);
    } catch (e) {
      setError('Failed to load exchange rates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRates();
  }, []);

  const handleUpdateRates = async () => {
    setUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/update-exchange-rates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          baseCurrency: 'USD',
          targetCurrencies: defaultCurrencies,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update rates');
      }

      setSuccess(`Updated ${result.summary?.success || 0} rates successfully`);
      setLastUpdated(new Date().toLocaleString());
      await loadRates();
    } catch (e: any) {
      setError(e.message || 'Failed to update rates');
    } finally {
      setUpdating(false);
    }
  };

  const userCurrency = detectCurrencyFromTimezone();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold ${isLight ? 'text-zinc-900' : 'text-white'}`}>Currency Exchange Rates</h2>
          <p className={`text-sm ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Manage exchange rates for multi-currency transactions
          </p>
          <p className={`text-xs mt-1 ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Your detected currency: <span className="font-semibold">{userCurrency}</span>
          </p>
        </div>
        <button
          onClick={handleUpdateRates}
          disabled={updating}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            isLight
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-emerald-500 text-black hover:bg-emerald-400'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {updating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Refresh Rates
            </>
          )}
        </button>
      </div>

      {error && (
        <div className={`p-4 rounded-xl border ${isLight ? 'bg-red-50 border-red-200 text-red-700' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className={`p-4 rounded-xl border ${isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{success}</span>
          </div>
        </div>
      )}

      <div className={`border rounded-xl overflow-hidden ${isLight ? 'border-zinc-200' : 'border-zinc-800'}`}>
        <div className={`px-5 py-3 border-b ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-900 border-zinc-800'}`}>
          <div className="grid grid-cols-4 gap-4 text-xs font-semibold uppercase tracking-wider">
            <div className={isLight ? 'text-zinc-500' : 'text-zinc-400'}>Currency</div>
            <div className={isLight ? 'text-zinc-500' : 'text-zinc-400'}>Symbol</div>
            <div className={`text-right ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Rate (to USD)</div>
            <div className={`text-right ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Status</div>
          </div>
        </div>
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-500" />
              <p className={`text-sm ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>Loading rates...</p>
            </div>
          ) : (
            rates.map((rate) => (
              <div key={rate.currency} className={`px-5 py-3 ${isLight ? 'hover:bg-zinc-50' : 'hover:bg-zinc-900/50'}`}>
                <div className="grid grid-cols-4 gap-4 items-center">
                  <div>
                    <span className={`font-semibold text-sm ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                      {rate.currency}
                    </span>
                    <span className={`block text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {getCurrencyName(rate.currency)}
                    </span>
                  </div>
                  <div className={`font-mono text-sm ${isLight ? 'text-zinc-600' : 'text-zinc-300'}`}>
                    {getCurrencySymbol(rate.currency)}
                  </div>
                  <div className={`text-right font-mono text-sm font-semibold ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                    {rate.rate > 0 ? rate.rate.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '—'}
                  </div>
                  <div className="text-right">
                    {rate.error ? (
                      <span className={`text-xs ${isLight ? 'text-red-600' : 'text-red-400'}`}>{rate.error}</span>
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {lastUpdated && (
        <p className={`text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
          Last updated: {lastUpdated}
        </p>
      )}

      <div className={`p-4 rounded-xl border ${isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/10 border-blue-500/20'}`}>
        <div className="flex items-start gap-3">
          <ExternalLink className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <p className={`text-sm font-semibold ${isLight ? 'text-blue-900' : 'text-blue-400'}`}>About Exchange Rates</p>
            <p className={`text-xs ${isLight ? 'text-blue-700' : 'text-blue-300'}`}>
              Rates are fetched from open.er-api.com and cached in the database. Click "Refresh Rates" to update all rates. 
              The system automatically falls back to hardcoded rates if the API is unavailable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
