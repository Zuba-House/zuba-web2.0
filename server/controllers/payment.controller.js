import OrderModel from '../models/order.model.js';
import UserModel from '../models/user.model.js';
import { env } from '../config/env.js';
import { sendError, sendSuccess } from '../utils/response.js';
import { markOrderPaid } from '../services/orderPayment.service.js';
import {
  getOrCreateStripeCustomer,
  listSavedCardPaymentMethods,
} from '../services/stripeCustomer.service.js';
import {
  getStripe,
  getStripeCurrency,
  getStripeCurrencySource,
  isStripeConfigured,
  mapStripeError,
  stripeCall,
} from '../services/stripeClient.js';

async function assertStripeReady(res) {
  if (!isStripeConfigured()) {
    return sendError(res, 500, 'Stripe API key is missing. Set STRIPE_SECRET_KEY on Render.', {
      code: 'STRIPE_NOT_CONFIGURED',
    });
  }
  try {
    await stripeCall((s, opts) =>
      opts.stripeAccount ? s.balance.retrieve({}, opts) : s.balance.retrieve()
    );
    return true;
  } catch (err) {
    const mapped = mapStripeError(err);
    return res.status(mapped.status).json(mapped.body);
  }
}

function defaultCheckoutUrls(orderId) {
  const base = env.apiUrl || env.backendUrl || 'https://zuba-api.onrender.com';
  return {
    success: `${base}/payment-success?orderId=${encodeURIComponent(orderId || '')}&session_id={CHECKOUT_SESSION_ID}`,
    cancel: `${base}/payment-cancel?orderId=${encodeURIComponent(orderId || '')}`,
  };
}

export const createPaymentIntent = async (req, res) => {
  try {
    const ready = await assertStripeReady(res);
    if (ready !== true) return;

    const {
      amount,
      orderId,
      saveCard,
      customerEmail,
      customerName,
      paymentMethodId,
    } = req.body || {};
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return sendError(res, 400, 'Invalid amount. Amount must be a positive number.');
    }

    if (orderId) {
      const order = await OrderModel.findById(orderId);
      if (!order) {
        return sendError(res, 404, 'Order not found');
      }
    }

    const userId = req.userId || null;
    let stripeCustomerId = null;
    if (userId) {
      stripeCustomerId = await getOrCreateStripeCustomer(userId, customerEmail, customerName);
    }

    const currency = getStripeCurrency();
    const paymentIntent = await stripeCall((s, opts) => {
      const piParams = {
        amount: Math.round(Number(amount) * 100),
        currency,
        payment_method_types: ['card'],
        metadata: {
          source: 'zuba_mobile',
          ...(orderId ? { orderId: String(orderId) } : {}),
          ...(userId ? { userId: String(userId) } : {}),
        },
      };

      if (stripeCustomerId) {
        piParams.customer = stripeCustomerId;
      }

      if (saveCard && stripeCustomerId) {
        piParams.setup_future_usage = 'off_session';
      }

      if (paymentMethodId && stripeCustomerId) {
        piParams.payment_method = String(paymentMethodId);
      }

      return opts.stripeAccount
        ? s.paymentIntents.create(piParams, opts)
        : s.paymentIntents.create(piParams);
    });

    if (!paymentIntent?.client_secret) {
      return sendError(res, 500, 'Failed to create payment intent. Please try again.', { code: 'STRIPE_INTENT_INCOMPLETE' });
    }

    return sendSuccess(res, 200, 'Payment intent created', {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      id: paymentIntent.id,
    });
  } catch (err) {
    console.error('[Stripe] createPaymentIntent:', err?.message || err);
    const mapped = mapStripeError(err);
    return res.status(mapped.status).json(mapped.body);
  }
};

/** GET /api/stripe/saved-payment-methods — logged-in customer's saved cards */
export const getSavedPaymentMethods = async (req, res) => {
  try {
    const ready = await assertStripeReady(res);
    if (ready !== true) return;

    const userId = req.userId;
    if (!userId) {
      return sendError(res, 401, 'Authentication required');
    }

    const user = await UserModel.findById(userId).select('stripeCustomerId email name');
    if (!user?.stripeCustomerId) {
      return sendSuccess(res, 200, 'No saved payment methods', { paymentMethods: [] });
    }

    const paymentMethods = await listSavedCardPaymentMethods(user.stripeCustomerId);
    return sendSuccess(res, 200, 'Saved payment methods', { paymentMethods });
  } catch (err) {
    console.error('[Stripe] getSavedPaymentMethods:', err?.message || err);
    const mapped = mapStripeError(err);
    return res.status(mapped.status).json(mapped.body);
  }
};

/** POST /api/stripe/create-checkout-session */
export const createCheckoutSession = async (req, res) => {
  try {
    const ready = await assertStripeReady(res);
    if (ready !== true) return;

    const { amount, orderId, successUrl, cancelUrl, metadata = {} } = req.body || {};
    const numericAmount = Number(amount);

    if (!orderId) {
      return sendError(res, 400, 'orderId is required');
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return sendError(res, 400, 'Invalid amount. Amount must be a positive number.');
    }

    const order = await OrderModel.findById(orderId);
    if (!order) {
      return sendError(res, 404, 'Order not found');
    }

    const defaults = defaultCheckoutUrls(orderId);
    const currency = getStripeCurrency();
    const amountCents = Math.round(numericAmount * 100);

    const resolvedSuccessUrl =
      successUrl ||
      `zuba://payment-success?orderId=${encodeURIComponent(orderId)}&session_id={CHECKOUT_SESSION_ID}`;
    const resolvedCancelUrl =
      cancelUrl || `zuba://payment-cancel?orderId=${encodeURIComponent(orderId)}`;

    const session = await stripeCall((s, opts) => {
      const params = {
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency,
              unit_amount: amountCents,
              product_data: {
                name: `Zuba House Order #${String(orderId).slice(-8).toUpperCase()}`,
                description: 'Secure checkout — Zuba House',
              },
            },
            quantity: 1,
          },
        ],
        client_reference_id: String(orderId),
        success_url: resolvedSuccessUrl.includes('://') ? resolvedSuccessUrl : defaults.success,
        cancel_url: resolvedCancelUrl.includes('://') ? resolvedCancelUrl : defaults.cancel,
        metadata: {
          orderId: String(orderId),
          source: metadata.source || 'zuba_mobile_app',
          ...Object.fromEntries(
            Object.entries(metadata).map(([k, v]) => [k, String(v ?? '')])
          ),
        },
      };
      return opts.stripeAccount
        ? s.checkout.sessions.create(params, opts)
        : s.checkout.sessions.create(params);
    });

    await OrderModel.findByIdAndUpdate(orderId, { paymentId: session.id }).catch(() => undefined);

    console.log('[Stripe] Checkout session:', session.id, 'order:', orderId, 'amount:', numericAmount);

    return sendSuccess(res, 200, 'Checkout session created', {
      url: session.url,
      sessionId: session.id,
      paymentIntentId:
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id || null,
    });
  } catch (err) {
    console.error('[Stripe] createCheckoutSession:', err?.message || err);
    return sendError(res, 500, err?.message || 'Failed to create checkout session', {
      code: err?.code || 'STRIPE_ERROR',
    });
  }
};

/** GET /api/stripe/checkout-status/:sessionId */
export const getCheckoutStatus = async (req, res) => {
  try {
    const ready = await assertStripeReady(res);
    if (ready !== true) return;

    const { sessionId } = req.params;
    if (!sessionId) {
      return sendError(res, 400, 'sessionId is required');
    }

    const session = await stripeCall((s, opts) =>
      opts.stripeAccount
        ? s.checkout.sessions.retrieve(sessionId, opts)
        : s.checkout.sessions.retrieve(sessionId)
    );

    return sendSuccess(res, 200, 'Checkout session status', {
      status: session.status,
      paymentStatus: session.payment_status,
      amountTotal: (session.amount_total || 0) / 100,
      currency: (session.currency || getStripeCurrency()).toUpperCase(),
      orderId: session.metadata?.orderId || session.client_reference_id || null,
    });
  } catch (err) {
    console.error('[Stripe] getCheckoutStatus:', err?.message || err);
    return sendError(res, 500, err?.message || 'Failed to retrieve checkout status', {
      code: err?.code || 'STRIPE_ERROR',
    });
  }
};

/** POST /api/stripe/webhook — register with express.raw() before express.json() */
export const handleStripeWebhook = async (req, res) => {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return res.status(503).json({ error: 'Webhook not configured' });
  }

  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata?.orderId || session.client_reference_id;
      await markOrderPaid(orderId, session.id, 'stripe');
      console.log('[Stripe Webhook] Order paid:', orderId);
    }
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      const orderId = pi.metadata?.orderId;
      if (orderId) {
        await markOrderPaid(orderId, pi.id, 'stripe');
      }
    }
  } catch (err) {
    console.error('[Stripe Webhook] Handler error:', err);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }

  return res.json({ received: true });
};

export const getStripeAccountInfo = async (req, res) => {
  try {
    const ready = await assertStripeReady(res);
    if (ready !== true) return;

    const acct = await stripeCall((s, opts) =>
      opts.stripeAccount ? s.accounts.retrieve({}, opts) : s.accounts.retrieve()
    );

    const secretKey = process.env.STRIPE_SECRET_KEY || '';
    return res.status(200).json({
      success: true,
      account: {
        id: acct.id,
        email: acct.email || null,
        business_type: acct.business_type || null,
        country: acct.country || null,
      },
      keyPrefix: secretKey.substring(0, 7),
      livemode: secretKey.startsWith('sk_live_'),
      configured: true,
    });
  } catch (err) {
    console.error('[Stripe] account-info:', err?.message || err);
    const mapped = mapStripeError(err);
    return res.status(mapped.status).json({ ...mapped.body, configured: false });
  }
};

export const stripeHealth = async (req, res) => {
  try {
    const ready = await assertStripeReady(res);
    if (ready !== true) return;

    const balance = await stripeCall((s, opts) =>
      opts.stripeAccount ? s.balance.retrieve({}, opts) : s.balance.retrieve()
    );
    const currency = getStripeCurrency().toUpperCase();
    const secretKey = process.env.STRIPE_SECRET_KEY || '';

    return res.json({
      ok: true,
      configured: true,
      livemode: secretKey.startsWith('sk_live_'),
      stripeLivemode: balance.livemode,
      currency,
      currencySource: getStripeCurrencySource(),
      available: balance.available,
      pending: balance.pending,
    });
  } catch (err) {
    console.error('[Stripe Health]', err?.message || err);
    const mapped = mapStripeError(err);
    return res.status(mapped.status).json({ ok: false, ...mapped.body });
  }
};
