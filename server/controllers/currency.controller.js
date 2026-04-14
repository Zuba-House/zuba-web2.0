/**
 * Display currency helpers for the storefront.
 * Rates: Frankfurter (ECB) — no API key required.
 * Detect: CF-IPCountry header when present, else ipwho.is for client IP.
 */

const FRANKFURTER_URL = 'https://api.frankfurter.app/latest?from=USD&to=CAD,EUR';

/** Euro area + other ISO countries commonly priced in EUR for shopper UX */
const EUR_COUNTRIES = new Set([
  'AT', 'BE', 'HR', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES',
  'AD', 'MC', 'SM', 'VA', 'XK'
]);

let ratesCache = { data: null, expiresAt: 0 };
const RATES_TTL_MS = 60 * 60 * 1000;

function countryToDisplayCurrency(countryCode) {
  if (!countryCode || typeof countryCode !== 'string') return 'USD';
  const c = countryCode.trim().toUpperCase();
  if (c === 'US') return 'USD';
  if (c === 'CA') return 'CAD';
  if (EUR_COUNTRIES.has(c)) return 'EUR';
  return 'USD';
}

function clientIp(req) {
  const cf = req.headers['cf-connecting-ip'];
  if (cf && typeof cf === 'string') return cf.trim();

  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    const first = forwarded.split(',')[0].trim();
    if (first) return first.replace('::ffff:', '');
  }

  const raw = req.socket?.remoteAddress || req.connection?.remoteAddress || '';
  return String(raw).replace('::ffff:', '');
}

export const getRates = async (req, res) => {
  try {
    const now = Date.now();
    if (ratesCache.data && ratesCache.expiresAt > now) {
      return res.status(200).json(ratesCache.data);
    }

    const response = await fetch(FRANKFURTER_URL);
    if (!response.ok) {
      return res.status(502).json({
        error: true,
        message: 'Could not fetch exchange rates'
      });
    }

    const json = await response.json();
    if (!json?.rates || typeof json.rates !== 'object') {
      return res.status(502).json({
        error: true,
        message: 'Invalid rates response'
      });
    }

    const payload = {
      base: 'USD',
      rates: {
        CAD: Number(json.rates.CAD),
        EUR: Number(json.rates.EUR)
      },
      date: json.date || null
    };

    ratesCache = { data: payload, expiresAt: now + RATES_TTL_MS };
    return res.status(200).json(payload);
  } catch (err) {
    console.error('[currency] getRates error:', err?.message || err);
    return res.status(500).json({
      error: true,
      message: err?.message || 'Rates error'
    });
  }
};

export const detectDisplayCurrency = async (req, res) => {
  try {
    const cfCountry = req.headers['cf-ipcountry'];
    if (cfCountry && typeof cfCountry === 'string' && cfCountry.trim() && cfCountry.trim().toUpperCase() !== 'XX') {
      const countryCode = cfCountry.trim().toUpperCase();
      return res.status(200).json({
        countryCode,
        displayCurrency: countryToDisplayCurrency(countryCode),
        source: 'cf-ipcountry'
      });
    }

    const ip = clientIp(req);
    if (!ip || ip === '127.0.0.1' || ip === '::1') {
      return res.status(200).json({
        countryCode: null,
        displayCurrency: 'USD',
        source: 'local-default'
      });
    }

    const geoRes = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      headers: { Accept: 'application/json' }
    });
    if (!geoRes.ok) {
      return res.status(200).json({
        countryCode: null,
        displayCurrency: 'USD',
        source: 'geo-fallback'
      });
    }

    const geo = await geoRes.json();
    if (!geo?.success || !geo.country_code) {
      return res.status(200).json({
        countryCode: null,
        displayCurrency: 'USD',
        source: 'geo-invalid'
      });
    }

    const countryCode = String(geo.country_code).toUpperCase();
    return res.status(200).json({
      countryCode,
      displayCurrency: countryToDisplayCurrency(countryCode),
      source: 'ipwho'
    });
  } catch (err) {
    console.error('[currency] detect error:', err?.message || err);
    return res.status(200).json({
      countryCode: null,
      displayCurrency: 'USD',
      source: 'error'
    });
  }
};
