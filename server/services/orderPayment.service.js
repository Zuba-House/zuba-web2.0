import OrderModel from '../models/order.model.js';
import { fulfillOrderAfterPayment } from './orderFulfillment.service.js';

export async function markOrderPaid(orderId, paymentId, paymentMethod = 'stripe') {
  if (!orderId) return null;
  const order = await OrderModel.findById(orderId);
  if (!order) return null;

  const alreadyPaid = ['paid', 'completed', 'success', 'succeeded'].includes(
    String(order.payment_status || '').toLowerCase()
  );
  if (alreadyPaid) {
    if (!order.fulfillmentCompleted) {
      await fulfillOrderAfterPayment(order);
    }
    return order;
  }

  order.payment_status = 'paid';
  order.paymentId = paymentId || order.paymentId;
  if (!order.notes) order.notes = '';
  if (!order.notes.includes('[PAYMENT:stripe]')) {
    order.notes = `${order.notes} [PAYMENT:${paymentMethod}]`.trim();
  }
  await order.save();

  await fulfillOrderAfterPayment(order);
  return order;
}
