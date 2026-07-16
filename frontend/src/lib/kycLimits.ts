/**
 * kycLimits.ts
 * Centralized compliance limits and KYC validation logic for Trova.
 * Single source of truth for all hardcoded compliance thresholds.
 */

export const DAILY_UNVERIFIED_LIMIT = 5;
export const USD_UNVERIFIED_CAP = 500;
export const NGN_UNVERIFIED_CAP = 500000;
export const KYC_GATE_AMOUNT_NGN = 50000;
export const DEFAULT_EXCHANGE_RATE = 1500;

export function getDailyUnverifiedLimit(): number {
  return DAILY_UNVERIFIED_LIMIT;
}

export function getUsdUnverifiedCap(): number {
  return USD_UNVERIFIED_CAP;
}

export function getNgnUnverifiedCap(): number {
  return NGN_UNVERIFIED_CAP;
}

export function getKycGateAmountNgn(): number {
  return KYC_GATE_AMOUNT_NGN;
}

export function getDefaultExchangeRate(): number {
  return DEFAULT_EXCHANGE_RATE;
}

export function isVerified(kycStatus: string | undefined): boolean {
  return kycStatus === 'verified';
}

export function getAmountInNgn(
  amount: number,
  currencyCode: string,
  exchangeRate: number = DEFAULT_EXCHANGE_RATE
): number {
  return currencyCode === 'NGN' ? amount : amount * exchangeRate;
}

export function validateDailyCreationLimit(dailyCount: number): { blocked: boolean } {
  if (dailyCount >= DAILY_UNVERIFIED_LIMIT) {
    return { blocked: true };
  }
  return { blocked: false };
}

export function validateUnverifiedAmountCap(
  amount: number,
  currencyCode: string,
  exchangeRate: number = DEFAULT_EXCHANGE_RATE
): { blocked: boolean; isUsd: boolean; amountInNgn: number } {
  const amountInNgn = getAmountInNgn(amount, currencyCode, exchangeRate);
  const isUsd = currencyCode === 'USD';

  if (isUsd && amount > USD_UNVERIFIED_CAP) {
    return { blocked: true, isUsd, amountInNgn };
  }

  if (!isUsd && amount > NGN_UNVERIFIED_CAP) {
    return { blocked: true, isUsd, amountInNgn };
  }

  return { blocked: false, isUsd, amountInNgn };
}

export function validateKycGate(amountInNgn: number, kycStatus: string | undefined): { blocked: boolean } {
  if (amountInNgn > KYC_GATE_AMOUNT_NGN && kycStatus !== 'verified') {
    return { blocked: true };
  }
  return { blocked: false };
}
