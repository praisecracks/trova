import supabase from '../supabaseClient';

export type SupportedCurrency = string;

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  NGN: '₦',
  GHS: '₵',
  INR: '₹',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'CA$',
  AUD: 'A$',
  CHF: 'CHF',
  ZAR: 'R',
  KES: 'KSh',
  UGX: 'USh',
  TZS: 'TSh',
  XAF: 'FCFA',
  XOF: 'CFA',
  EGP: 'E£',
  MAD: 'MAD',
  AED: 'AED',
  SAR: 'SAR',
  CNY: '¥',
  KRW: '₩',
  SGD: 'S$',
  MYR: 'RM',
  THB: '฿',
  VND: '₫',
  PHP: '₱',
  IDR: 'Rp',
  BRL: 'R$',
  MXN: 'MX$',
  ARS: 'AR$',
  CLP: 'CL$',
  COP: 'CO$',
  PEN: 'S/',
  UYU: 'UY$',
  TRY: '₺',
  RUB: '₽',
  PLN: 'zł',
  CZK: 'Kč',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  NZD: 'NZ$',
  HKD: 'HK$',
  TWD: 'NT$',
  PKR: 'Rs',
  BDT: '৳',
  LKR: 'Rs',
  NPR: 'Rs',
  AFN: '؋',
  IRR: '﷼',
  IQD: 'ع.د',
  JOD: 'د.ا',
  LBP: 'ل.ل',
  SYP: '£S',
  YER: '﷼',
  QAR: '﷼',
  KWD: 'د.ك',
  BHD: 'ب.د',
  OMR: '﷼',
  ILS: '₪',
};

export const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  NGN: 1500,
  GHS: 13,
  INR: 88,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
  CAD: 1.36,
  AUD: 1.52,
  CHF: 0.88,
  ZAR: 18.5,
  KES: 153,
  UGX: 3800,
  TZS: 2500,
};

export async function getExchangeRate(from: SupportedCurrency, to: SupportedCurrency): Promise<number> {
  if (from === to) return 1;

  try {
    const { data, error } = await supabase
      .from('currency_exchange_rates')
      .select('rate')
      .eq('base_currency', from)
      .eq('target_currency', to)
      .single();

    if (!error && data) {
      return Number(data.rate);
    }
  } catch (e) {
    console.warn('Failed to fetch exchange rate from API, using fallback:', e);
  }

  const fromRate = FALLBACK_RATES[from] || 1;
  const toRate = FALLBACK_RATES[to] || 1;
  return toRate / fromRate;
}

export async function convertAmount(
  amount: number,
  from: SupportedCurrency,
  to: SupportedCurrency
): Promise<number> {
  if (from === to) return amount;
  const rate = await getExchangeRate(from, to);
  return amount * rate;
}

export function getCurrencySymbol(currencyCode: string): string {
  const upper = currencyCode.toUpperCase();
  return CURRENCY_SYMBOLS[upper] || currencyCode;
}

export function detectCurrencyFromTimezone(): SupportedCurrency {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    if (timezone.includes('Africa/Accra')) return 'GHS';
    if (timezone.includes('Africa/Lagos') || timezone.includes('Africa/Nairobi')) return 'NGN';
    if (timezone.includes('Asia/Kolkata')) return 'INR';
    if (timezone.includes('America/New_York') || timezone.includes('America/Los_Angeles')) return 'USD';
    if (timezone.includes('Europe/London')) return 'GBP';
    if (timezone.includes('Europe/Paris') || timezone.includes('Europe/Berlin')) return 'EUR';
    if (timezone.includes('Asia/Tokyo')) return 'JPY';
    if (timezone.includes('Australia/Sydney')) return 'AUD';
    if (timezone.includes('Asia/Singapore')) return 'SGD';
    if (timezone.includes('Asia/Shanghai')) return 'CNY';
  } catch (e) {
    console.warn('Failed to detect timezone:', e);
  }
  
  return 'USD';
}

export function getCurrencyName(currencyCode: string): string {
  const upper = currencyCode.toUpperCase();
  const names: Record<string, string> = {
    USD: 'US Dollar',
    NGN: 'Nigerian Naira',
    GHS: 'Ghanaian Cedi',
    INR: 'Indian Rupee',
    EUR: 'Euro',
    GBP: 'British Pound',
    JPY: 'Japanese Yen',
    CAD: 'Canadian Dollar',
    AUD: 'Australian Dollar',
    CHF: 'Swiss Franc',
    ZAR: 'South African Rand',
    KES: 'Kenyan Shilling',
    UGX: 'Ugandan Shilling',
    TZS: 'Tanzanian Shilling',
    CNY: 'Chinese Yuan',
    KRW: 'South Korean Won',
    SGD: 'Singapore Dollar',
    MYR: 'Malaysian Ringgit',
    THB: 'Thai Baht',
    VND: 'Vietnamese Dong',
    PHP: 'Philippine Peso',
    IDR: 'Indonesian Rupiah',
    BRL: 'Brazilian Real',
    MXN: 'Mexican Peso',
    TRY: 'Turkish Lira',
    RUB: 'Russian Ruble',
  };
  return names[upper] || currencyCode;
}

export async function triggerExchangeRateUpdate(
  baseCurrency: string = 'USD',
  targetCurrencies?: string[]
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { success: false, error: 'Supabase configuration missing' };
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/update-exchange-rates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        baseCurrency,
        targetCurrencies: targetCurrencies || [
          'NGN', 'GHS', 'INR', 'EUR', 'GBP', 'KES', 'ZAR', 'JPY', 'CAD', 'AUD',
          'CHF', 'SGD', 'MYR', 'THB', 'VND', 'PHP', 'IDR', 'BRL', 'MXN', 'TRY'
        ],
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to update rates' };
    }

    return {
      success: true,
      message: `Updated ${result.summary?.success || 0} rates successfully`,
    };
  } catch (e: any) {
    return { success: false, error: e.message || 'Network error' };
  }
}
