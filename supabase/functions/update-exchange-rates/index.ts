declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// @ts-ignore Supabase Edge Function uses Deno's remote import support.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

const jsonResponse = (body: object, status: number) =>
  new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });

interface RateUpdateResult {
  currency: string;
  rate: number;
  updated: boolean;
  error?: string;
}

export default async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const baseCurrency = (body?.baseCurrency as string) || 'USD';
    const targetCurrencies = (body?.targetCurrencies as string[]) || [
      'NGN', 'GHS', 'INR', 'EUR', 'GBP', 'KES', 'ZAR', 'JPY', 'CAD', 'AUD',
      'CHF', 'SGD', 'MYR', 'THB', 'VND', 'PHP', 'IDR', 'BRL', 'MXN', 'TRY',
      'RUB', 'PLN', 'CZK', 'SEK', 'NOK', 'DKK', 'NZD', 'HKD', 'TWD', 'PKR',
      'BDT', 'LKR', 'NPR', 'EGP', 'MAD', 'AED', 'SAR', 'CNY', 'KRW', 'ILS'
    ];

    const apiUrl = `https://open.er-api.com/v6/latest/${encodeURIComponent(baseCurrency)}`;
    
    const rateResponse = await fetch(apiUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!rateResponse.ok) {
      throw new Error(`Exchange rate API responded with ${rateResponse.status}`);
    }

    const apiData = await rateResponse.json();
    const rates: Record<string, number> = apiData.rates || {};
    const lastUpdate = apiData.time_last_update_utc || new Date().toISOString();

    const results: RateUpdateResult[] = [];
    const supportedTargets = targetCurrencies.filter((c) => typeof rates[c] === 'number');

    for (const currency of supportedTargets) {
      const rate = Number(rates[currency]);
      if (!Number.isFinite(rate) || rate <= 0) {
        results.push({ currency, rate: 0, updated: false, error: 'Invalid rate from API' });
        continue;
      }

      const { error } = await supabase
        .from('currency_exchange_rates')
        .upsert(
          {
            base_currency: baseCurrency,
            target_currency: currency,
            rate,
            updated_at: lastUpdate,
          },
          { onConflict: 'base_currency,target_currency' }
        );

      results.push({
        currency,
        rate,
        updated: !error,
        error: error?.message,
      });
    }

    const successCount = results.filter((r) => r.updated).length;
    const failedCount = results.length - successCount;

    return jsonResponse({
      success: true,
      baseCurrency,
      updatedAt: lastUpdate,
      summary: {
        total: results.length,
        success: successCount,
        failed: failedCount,
      },
      results: results.slice(0, 20),
    }, 200);
  } catch (error: any) {
    return jsonResponse(
      {
        error: error?.message || 'Internal server error',
        details: error?.stack,
      },
      500
    );
  }
};
