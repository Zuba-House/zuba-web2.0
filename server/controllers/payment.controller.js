import Stripe from "stripe";
import dotenv from "dotenv";
import { sendError, sendSuccess } from "../utils/response.js";
import { env } from "../config/env.js";
dotenv.config();

// Initialize Stripe with validation
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
    try {
        stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        console.log('[Stripe] Initialized with key:', process.env.STRIPE_SECRET_KEY.substring(0, 7) + '...');
    } catch (error) {
        console.error('[Stripe] Failed to initialize:', error.message);
        stripe = null;
    }
} else {
    console.warn('[Stripe] STRIPE_SECRET_KEY not set in environment variables');
}

// Helper: detect if an Org API key is being used
const isOrgKey = (key) => typeof key === 'string' && key.startsWith('sk_org_');

export const createPaymentIntent = async (req, res) => {
  try {
    // Check if Stripe is initialized
    if (!stripe) {
      console.error('[Stripe] Cannot create payment intent: Stripe not initialized');
      return res.status(500).json({ 
        error: 'Payment processing unavailable',
        message: 'Stripe API key is missing or invalid. Please contact support.',
        code: 'STRIPE_NOT_CONFIGURED'
      });
    }

    // Validate Stripe key is still valid
    try {
      await stripe.balance.retrieve();
    } catch (keyError) {
      console.error('[Stripe] API key validation failed:', keyError.message);
      return res.status(500).json({
        error: 'Payment processing unavailable',
        message: 'Stripe API key is invalid or expired. Please contact support to update payment configuration.',
        code: 'STRIPE_KEY_INVALID',
        detail: keyError.message
      });
    }

    const { amount } = req.body;

    // Validate amount
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ error: "Invalid amount. Amount must be a positive number." });
    }

    const currency = (process.env.CURRENCY || process.env.STRIPE_CURRENCY || 'USD').toLowerCase();
    const piParams = {
      amount: Math.round(Number(amount) * 100),
      currency,
      automatic_payment_methods: { enabled: true },
    };

    const options = {};
    if (isOrgKey(process.env.STRIPE_SECRET_KEY)) {
      const targetAccount = process.env.STRIPE_TARGET_ACCOUNT || process.env.STRIPE_ACCOUNT;
      if (targetAccount) {
        options.stripeAccount = targetAccount; // sets Stripe-Account header
      } else {
        return res.status(500).json({ error: 'Organization API key detected. Please set STRIPE_TARGET_ACCOUNT (acct_...) or use a standard account secret key.' });
      }
    }

    // Logging context
    try {
      console.log("[Stripe] Creating PI:", piParams.amount / 100, currency.toUpperCase(), "| testMode:", !(process.env.STRIPE_SECRET_KEY || "").startsWith("sk_live_"));
    } catch {}

    // Create PaymentIntent
    const paymentIntent = options.stripeAccount
      ? await stripe.paymentIntents.create(piParams, { stripeAccount: options.stripeAccount })
      : await stripe.paymentIntents.create(piParams);

    console.log("[Stripe] PaymentIntent created:", paymentIntent.id, "status:", paymentIntent.status);
    return res.status(200).json({ clientSecret: paymentIntent.client_secret, id: paymentIntent.id });
  } catch (err) {
    console.error("[Stripe] Error creating payment intent:", {
      message: err?.message,
      type: err?.type,
      code: err?.code,
      statusCode: err?.statusCode,
      raw: err?.raw
    });
    
    // Handle specific Stripe errors
    let errorMessage = 'Payment processing failed';
    let statusCode = 500;
    
    if (err?.type === 'StripeAuthenticationError') {
      errorMessage = 'Stripe API key is invalid or expired. Please contact support.';
      statusCode = 500;
    } else if (err?.type === 'StripeAPIError') {
      errorMessage = 'Stripe API error. Please try again or contact support.';
      statusCode = 502;
    } else if (err?.type === 'StripeConnectionError') {
      errorMessage = 'Unable to connect to Stripe. Please try again.';
      statusCode = 503;
    }
    
    return res.status(statusCode).json({
      error: errorMessage,
      detail: err?.message || String(err),
      code: err?.code || 'STRIPE_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};

// GET /api/stripe/account-info
export const getStripeAccountInfo = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ 
        error: 'Stripe not configured',
        message: 'STRIPE_SECRET_KEY is not set or invalid'
      });
    }
    
    // retrieve account info associated with the secret key
    const acct = await stripe.accounts.retrieve();
    // mask sensitive values
    const maskedAccount = {
      id: acct.id,
      email: acct.email || null,
      business_type: acct.business_type || null,
      country: acct.country || null,
    };

    // also return key prefix so frontend can compare
    const secretKey = process.env.STRIPE_SECRET_KEY || '';
    const keyPrefix = secretKey.substring(0, 7);

    res.status(200).json({ account: maskedAccount, keyPrefix, configured: true });
  } catch (err) {
    console.error('Error retrieving Stripe account info:', err && err.message ? err.message : err);
    
    // Check if it's an authentication error (invalid key)
    if (err?.type === 'StripeAuthenticationError') {
      return res.status(500).json({ 
        error: 'Stripe API key is invalid or expired',
        message: 'Please update STRIPE_SECRET_KEY in environment variables',
        configured: false
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to retrieve Stripe account info', 
      detail: err && err.message ? err.message : String(err),
      configured: false
    });
  }
};

function stripeRequestOptions() {
  const options = {};
  if (isOrgKey(process.env.STRIPE_SECRET_KEY)) {
    const targetAccount = process.env.STRIPE_TARGET_ACCOUNT || process.env.STRIPE_ACCOUNT;
    if (targetAccount) {
      options.stripeAccount = targetAccount;
    }
  }
  return options;
}

function defaultCheckoutUrls(orderId) {
  const base = env.apiUrl || env.backendUrl || 'https://zuba-api.onrender.com';
  return {
    success: `${base}/payment-success?orderId=${encodeURIComponent(orderId || '')}&session_id={CHECKOUT_SESSION_ID}`,
    cancel: `${base}/payment-cancel?orderId=${encodeURIComponent(orderId || '')}`,
  };
}

// POST /api/stripe/create-checkout-session
export const createCheckoutSession = async (req, res) => {
  try {
    if (!stripe) {
      return sendError(res, 500, 'Payment processing unavailable', { code: 'STRIPE_NOT_CONFIGURED' });
    }

    const { amount, orderId, successUrl, cancelUrl, metadata = {} } = req.body || {};
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return sendError(res, 400, 'Invalid amount. Amount must be a positive number.');
    }
    if (!orderId) {
      return sendError(res, 400, 'orderId is required');
    }

    const defaults = defaultCheckoutUrls(orderId);
    const currency = (process.env.CURRENCY || process.env.STRIPE_CURRENCY || 'USD').toLowerCase();
    const stripeOptions = stripeRequestOptions();

    const sessionParams = {
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `Zuba House Order ${String(orderId).slice(-8).toUpperCase()}`,
            },
            unit_amount: Math.round(numericAmount * 100),
          },
          quantity: 1,
        },
      ],
      success_url: successUrl || defaults.success,
      cancel_url: cancelUrl || defaults.cancel,
      metadata: {
        orderId: String(orderId),
        ...Object.fromEntries(
          Object.entries(metadata).map(([k, v]) => [k, String(v ?? '')])
        ),
      },
    };

    const session = stripeOptions.stripeAccount
      ? await stripe.checkout.sessions.create(sessionParams, stripeOptions)
      : await stripe.checkout.sessions.create(sessionParams);

    return sendSuccess(res, 200, 'Checkout session created', {
      url: session.url,
      sessionId: session.id,
      paymentIntentId: typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id || null,
    });
  } catch (err) {
    console.error('[Stripe] createCheckoutSession error:', err?.message || err);
    return sendError(res, 500, err?.message || 'Failed to create checkout session', {
      code: err?.code || 'STRIPE_ERROR',
    });
  }
};

// GET /api/stripe/checkout-status/:sessionId
export const getCheckoutStatus = async (req, res) => {
  try {
    if (!stripe) {
      return sendError(res, 500, 'Payment processing unavailable', { code: 'STRIPE_NOT_CONFIGURED' });
    }

    const sessionId = req.params.sessionId;
    if (!sessionId) {
      return sendError(res, 400, 'sessionId is required');
    }

    const stripeOptions = stripeRequestOptions();
    const session = stripeOptions.stripeAccount
      ? await stripe.checkout.sessions.retrieve(sessionId, stripeOptions)
      : await stripe.checkout.sessions.retrieve(sessionId);

    return sendSuccess(res, 200, 'Checkout session status', {
      status: session.status,
      paymentStatus: session.payment_status,
      amountTotal: (session.amount_total || 0) / 100,
      currency: session.currency,
    });
  } catch (err) {
    console.error('[Stripe] getCheckoutStatus error:', err?.message || err);
    return sendError(res, 500, err?.message || 'Failed to retrieve checkout status', {
      code: err?.code || 'STRIPE_ERROR',
    });
  }
};

// Optional health endpoint to help diagnose key/account context
export const stripeHealth = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ 
        ok: false, 
        error: 'Stripe not configured',
        message: 'STRIPE_SECRET_KEY is not set in environment variables',
        configured: false
      });
    }
    
    const balance = await stripe.balance.retrieve();
    const currency = (process.env.CURRENCY || process.env.STRIPE_CURRENCY || 'USD').toUpperCase();
    res.json({ 
      ok: true, 
      configured: true,
      livemode: balance.livemode, 
      currency, 
      available: balance.available, 
      pending: balance.pending 
    });
  } catch (e) {
    console.error('[Stripe Health] Error:', e?.message || String(e));
    
    // Check if it's an authentication error
    if (e?.type === 'StripeAuthenticationError') {
      return res.status(500).json({ 
        ok: false, 
        configured: true,
        error: 'Stripe API key is invalid or expired',
        message: 'Please update STRIPE_SECRET_KEY in environment variables',
        detail: e?.message
      });
    }
    
    res.status(500).json({ 
      ok: false, 
      configured: stripe !== null,
      error: e?.message || String(e) 
    });
  }
};
