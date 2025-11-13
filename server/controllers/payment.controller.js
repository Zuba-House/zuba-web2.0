import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Helper: detect if an Org API key is being used
const isOrgKey = (key) => typeof key === 'string' && key.startsWith('sk_org_');

export const createPaymentIntent = async (req, res) => {
  try {
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
    console.error("[Stripe] Error:", err && err.message ? err.message : err);
    if (err && err.raw && err.raw.message) {
      console.error('[Stripe] raw:', err.raw);
    }
    if (err && err.statusCode) {
      console.error('[Stripe] HTTP Status:', err.statusCode);
    }
    return res.status(500).json({
      error: 'Payment intent creation failed',
      detail: err && err.message ? err.message : String(err),
      timestamp: new Date().toISOString()
    });
  }
};

// GET /api/stripe/account-info
export const getStripeAccountInfo = async (req, res) => {
  try {
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
    const keyPrefix = secretKey.substring(0, 6);

    res.status(200).json({ account: maskedAccount, keyPrefix });
  } catch (err) {
    console.error('Error retrieving Stripe account info:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Failed to retrieve Stripe account info', detail: err && err.message ? err.message : String(err) });
  }
};

// Optional health endpoint to help diagnose key/account context
export const stripeHealth = async (req, res) => {
  try {
    const balance = await stripe.balance.retrieve();
    const currency = (process.env.CURRENCY || process.env.STRIPE_CURRENCY || 'USD').toUpperCase();
    res.json({ ok: true, livemode: balance.livemode, currency, available: balance.available, pending: balance.pending });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
};
