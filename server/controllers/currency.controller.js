import { sendSuccess } from '../utils/response.js';

const DEFAULT_RATES = { CAD: 1.38, EUR: 0.93 };
const RATES_CACHE_MS = 60 * 60 * 1000;
let cachedRates = null;
let cacheTime = 0;

const EU_COUNTRIES = new Set([
  'AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT',
  'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK',
]);

async function fetchLiveRates() {
  const now = Date.now();
  if (cachedRates && now - cacheTime < RATES_CACHE_MS) {
    return cachedRates;
  }

  const urls = [
    'https://api.frankfurter.app/latest?from=USD&to=CAD,EUR',
    'https://api.frankfurter.dev/v1/latest?from=USD&to=CAD,EUR',
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (!res.ok) continue;
      const data = await res.json();
      if (data?.rates?.CAD && data?.rates?.EUR) {
        cachedRates = {
          CAD: Number(data.rates.CAD),
          EUR: Number(data.rates.EUR),
        };
        cacheTime = now;
        return cachedRates;
      }
    } catch {
      /* try next provider */
    }
  }

  cachedRates = { ...DEFAULT_RATES };
  cacheTime = now;
  return cachedRates;
}

export async function getCurrencyRatesController(_request, response) {
  try {
    const rates = await fetchLiveRates();
    return sendSuccess(response, 200, 'Exchange rates', { rates, base: 'USD' });
  } catch (error) {
    return sendSuccess(response, 200, 'Exchange rates (fallback)', {
      rates: DEFAULT_RATES,
      base: 'USD',
    });
  }
}

export async function detectCurrencyController(request, response) {
  try {
    const country =
      request.headers['cf-ipcountry'] ||
      request.headers['x-vercel-ip-country'] ||
      request.query.country ||
      '';

    const code = String(country).toUpperCase();
    let displayCurrency = 'USD';

    if (code === 'CA') {
      displayCurrency = 'CAD';
    } else if (EU_COUNTRIES.has(code)) {
      displayCurrency = 'EUR';
    }

    const acceptLang = request.headers['accept-language'] || '';
    if (displayCurrency === 'USD' && acceptLang) {
      const lang = acceptLang.split(',')[0].trim().toUpperCase();
      if (lang.endsWith('-CA') || lang.includes('FR-CA')) displayCurrency = 'CAD';
      else if (lang.startsWith('FR') || lang.startsWith('DE') || lang.startsWith('IT')) {
        displayCurrency = 'EUR';
      }
    }

    return sendSuccess(response, 200, 'Currency detected', {
      displayCurrency,
      country: code || null,
    });
  } catch (error) {
    return sendSuccess(response, 200, 'Currency detected', {
      displayCurrency: 'USD',
      country: null,
    });
  }
}
