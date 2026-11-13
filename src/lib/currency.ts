import type { CurrencyCode } from '../types/crm';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  label: string;
  rateFromUsd: number;
  decimals: number;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', label: 'US Dollar (USD)', rateFromUsd: 1, decimals: 0 },
  EUR: { code: 'EUR', symbol: '€', label: 'Euro (EUR)', rateFromUsd: 0.92, decimals: 0 },
  UZS: { code: 'UZS', symbol: 'UZS ', label: 'Uzbekistan Som (UZS)', rateFromUsd: 12800, decimals: 0 },
  AED: { code: 'AED', symbol: 'AED ', label: 'UAE Dirham (AED)', rateFromUsd: 3.67, decimals: 0 },
  GBP: { code: 'GBP', symbol: '£', label: 'British Pound (GBP)', rateFromUsd: 0.79, decimals: 0 },
};

export function convertFromUsd(amountUsd: number, currency: CurrencyCode): number {
  const safeAmount = Number.isFinite(amountUsd) ? amountUsd : 0;
  const cfg = CURRENCIES[currency] ?? CURRENCIES.USD;
  return safeAmount * cfg.rateFromUsd;
}

export function formatMoneyFromUsd(
  amountUsd: number,
  currency: CurrencyCode = 'USD',
  compact = false
): string {
  const cfg = CURRENCIES[currency] ?? CURRENCIES.USD;
  const converted = convertFromUsd(amountUsd, currency);

  if (compact && Math.abs(converted) >= 1_000_000) {
    return `${cfg.symbol}${(converted / 1_000_000).toFixed(1)}M`;
  }
  if (compact && Math.abs(converted) >= 100_000) {
    return `${cfg.symbol}${Math.round(converted / 1_000)}K`;
  }

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: cfg.decimals,
    maximumFractionDigits: cfg.decimals,
  }).format(Math.round(converted));

  return `${cfg.symbol}${formatted}`;
}

export function formatNativeCurrency(amount: number, currency: CurrencyCode): string {
  const cfg = CURRENCIES[currency] ?? CURRENCIES.USD;
  const safe = Number.isFinite(amount) ? amount : 0;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(safe));
  return `${cfg.symbol}${formatted}`;
}
