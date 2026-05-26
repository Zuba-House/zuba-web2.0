import UserModel from '../models/user.model.js';
import { stripeCall } from './stripeClient.js';

export async function getOrCreateStripeCustomer(userId, email, name) {
  if (!userId) return null;

  const user = await UserModel.findById(userId);
  if (!user) return null;

  if (user.stripeCustomerId) {
    try {
      const existing = await stripeCall((s, opts) =>
        opts.stripeAccount
          ? s.customers.retrieve(user.stripeCustomerId, opts)
          : s.customers.retrieve(user.stripeCustomerId)
      );
      if (existing && !existing.deleted) {
        return existing.id;
      }
    } catch {
      // Fall through to create a new customer.
    }
  }

  const customer = await stripeCall((s, opts) => {
    const params = {
      email: email || user.email,
      name: name || user.name,
      metadata: { userId: String(userId) },
    };
    return opts.stripeAccount ? s.customers.create(params, opts) : s.customers.create(params);
  });

  await UserModel.findByIdAndUpdate(userId, { stripeCustomerId: customer.id });
  return customer.id;
}

export async function listSavedCardPaymentMethods(stripeCustomerId) {
  if (!stripeCustomerId) return [];

  const result = await stripeCall((s, opts) => {
    const params = { customer: stripeCustomerId, type: 'card' };
    return opts.stripeAccount
      ? s.paymentMethods.list(params, opts)
      : s.paymentMethods.list(params);
  });

  return (result?.data || []).map((pm) => ({
    id: pm.id,
    brand: pm.card?.brand || 'card',
    last4: pm.card?.last4 || '****',
    expMonth: pm.card?.exp_month || 0,
    expYear: pm.card?.exp_year || 0,
  }));
}
