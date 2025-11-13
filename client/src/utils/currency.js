// Simple currency formatter centralized for the client
export const CURRENCY = import.meta.env.VITE_CURRENCY || 'USD';

export function formatCurrency(value) {
  const amount = Number(value) || 0;
  try {
    return amount.toLocaleString('en-US', { style: 'currency', currency: CURRENCY });
  } catch {
    return amount.toFixed(2);
  }
}

