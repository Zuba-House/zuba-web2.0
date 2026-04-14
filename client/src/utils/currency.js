/**
 * Storefront currency: catalog amounts are USD; other currencies are display-only estimates.
 */

export const DISPLAY_CURRENCY_CODES = ['USD', 'CAD', 'EUR'];

export const CURRENCY_STORAGE_KEY = 'zuba_display_currency';
export const CURRENCY_MANUAL_KEY = 'zuba_currency_manual';

export function localeForCurrency(code) {
  switch (code) {
    case 'EUR':
      return 'de-DE';
    case 'CAD':
      return 'en-CA';
    default:
      return 'en-US';
  }
}

export function formatMoney(amount, currencyCode = 'USD') {
  const code = currencyCode || 'USD';
  const n = Number(amount);
  if (amount === null || amount === undefined || isNaN(n)) {
    return new Intl.NumberFormat(localeForCurrency(code), {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(0);
  }

  return new Intl.NumberFormat(localeForCurrency(code), {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n);
}

export function convertUsdToDisplay(usdAmount, displayCurrency, rates) {
  const n = Number(usdAmount);
  if (isNaN(n)) return 0;
  if (!displayCurrency || displayCurrency === 'USD') return n;
  const rate = rates?.[displayCurrency];
  if (!rate || isNaN(rate)) return n;
  return n * rate;
}

/**
 * @deprecated Prefer MyContext.formatPrice(usd) in components inside the storefront.
 * Single-arg: formats a USD amount in USD (backward compatible).
 */
export function formatCurrency(amount, currency = 'USD') {
  return formatMoney(amount, currency);
}

export default formatCurrency;
