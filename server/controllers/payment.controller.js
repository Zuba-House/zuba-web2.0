import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Helper: detect if an Org API key is being used
const isOrgKey = (key) => typeof key === 'string' && key.startsWith('sk_org_');

export const createPaymentIntent = async (req, res) => {
  try {
    const { amount } = req.body;
    
    // Log the incoming request for debugging
    console.log("📥 create-payment-intent request:", { amount });
    
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      console.error("❌ Invalid amount:", amount);
      return res.status(400).json({ error: "Invalid amount. Amount must be a positive number." });
    }

    const piParams = {
      amount: Math.round(Number(amount) * 100), // convert dollars → cents
      currency: "usd",
      automatic_payment_methods: { enabled: true },
    };

    // If an Organization API key is being used, the server must target a specific account/context.
    // If STRIPE_TARGET_ACCOUNT is set (acct_xxx), pass it as stripeAccount option to the SDK.
    // If not set and key is an org key, return an informative error so the developer can fix env.
    const options = {};
    if (isOrgKey(process.env.STRIPE_SECRET_KEY)) {
      const targetAccount = process.env.STRIPE_TARGET_ACCOUNT || process.env.STRIPE_ACCOUNT;
      if (targetAccount) {
        options.stripeAccount = targetAccount; // will set Stripe-Account header
        console.info('✅ Using Organization API key with target account:', targetAccount);
      } else {
        console.error('❌ Organization API key detected but STRIPE_TARGET_ACCOUNT is not set.');
        return res.status(500).json({ error: 'Organization API key detected. Please set STRIPE_TARGET_ACCOUNT (acct_...) in server environment or use a standard account secret key.' });
      }
    } else {
      console.info('✅ Using standard account secret key');
    }

    console.log("💳 Creating Stripe PaymentIntent with amount:", piParams.amount / 100, "USD");
    const paymentIntent = await stripe.paymentIntents.create(piParams, options);
    console.log("✅ PaymentIntent created successfully:", paymentIntent.id);

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    // log full error for debugging
    console.error("❌ Stripe Error:", err && err.message ? err.message : err);
    if (err && err.raw && err.raw.message) {
      console.error('Stripe raw error:', err.raw);
    }
    if (err && err.statusCode) {
      console.error('Stripe HTTP Status:', err.statusCode);
    }
    res.status(500).json({ 
      error: "Payment intent creation failed", 
      detail: err && err.message ? err.message : String(err),
      timestamp: new Date().toISOString()
    });
  }
};
