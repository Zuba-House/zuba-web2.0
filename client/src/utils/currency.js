// Simple currency formatter centralized for the client
export const CURRENCY = import.meta.env.VITE_CURRENCY || 'USD';

export function formatCurrency(value) {
  const amount = Number(value) || 0;
  try {
    // Always format as USD to avoid confusion with CAD
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  } catch {
    return `$${amount.toFixed(2)} USD`;
  }
}

// Helper to get currency label for display
export function getCurrencyLabel() {
  return 'USD';
}

