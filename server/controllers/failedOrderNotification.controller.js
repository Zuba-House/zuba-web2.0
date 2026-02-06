import OrderModel from '../models/order.model.js';
import UserModel from '../models/user.model.js';
import sendEmailFun from '../config/sendEmail.js';
import { FailedOrderEmailTemplate } from '../utils/failedOrderEmailTemplate.js';

/**
 * Send failed order notification email
 * Checks if notifications are enabled and if email count limit (3) hasn't been reached
 */
export const sendFailedOrderNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const { force = false } = req.body; // Allow force sending even if limit reached (for admin manual sends)

        const order = await OrderModel.findById(id);
        if (!order) {
            return res.status(404).json({
                error: true,
                success: false,
                message: 'Order not found'
            });
        }

        // Check if order is actually failed
        if (order.payment_status !== 'FAILED') {
            return res.status(400).json({
                error: true,
                success: false,
                message: 'This order is not marked as failed'
            });
        }

        // Check if notifications are enabled
        if (!force && order.failedOrderNotificationEnabled === false) {
            return res.status(400).json({
                error: true,
                success: false,
                message: 'Failed order notifications are disabled for this order'
            });
        }

        // Get customer email
        let customerEmail = null;
        let customerName = 'Customer';

        if (order.userId) {
            try {
                const user = await UserModel.findById(order.userId).select('name email');
                if (user?.email) {
                    customerEmail = user.email;
                    customerName = user.name || customerName;
                }
            } catch (userError) {
                console.warn('⚠️ Could not fetch user for failed order notification:', userError.message);
            }
        } else if (order.guestCustomer?.email) {
            customerEmail = order.guestCustomer.email;
            customerName = order.guestCustomer.name || customerName;
        }

        if (!customerEmail) {
            return res.status(400).json({
                error: true,
                success: false,
                message: 'No customer email found for this order'
            });
        }

        // Check total emails sent to this customer across all failed orders
        // This ensures we don't send more than 3 emails total per customer
        const customerEmailLower = customerEmail.toLowerCase();
        const allFailedOrders = await OrderModel.find({
            $or: [
                { userId: order.userId },
                { 'guestCustomer.email': { $regex: new RegExp(customerEmailLower, 'i') } }
            ],
            payment_status: 'FAILED'
        }).select('failedOrderNotificationsSent');

        const totalEmailsSent = allFailedOrders.reduce((sum, o) => sum + (o.failedOrderNotificationsSent || 0), 0);

        // Check if we've reached the limit (unless force is true)
        if (!force && totalEmailsSent >= 3) {
            return res.status(400).json({
                error: true,
                success: false,
                message: `Maximum of 3 failed order notification emails have already been sent to this customer. Total sent: ${totalEmailsSent}`,
                totalEmailsSent
            });
        }

        // Check if this specific order has already received max emails (unless force)
        if (!force && order.failedOrderNotificationsSent >= 3) {
            return res.status(400).json({
                error: true,
                success: false,
                message: `Maximum of 3 notification emails have already been sent for this order`,
                emailsSent: order.failedOrderNotificationsSent
            });
        }

        // Get website URL from environment or use default
        const websiteUrl = process.env.WEBSITE_URL || process.env.CLIENT_URL || 'https://zubahouse.com';

        // Prepare email
        const emailHtml = FailedOrderEmailTemplate({
            customerName,
            orderId: order._id,
            websiteUrl
        });

        const emailText = `Hello ${customerName},\n\nWe wanted to let you know that your recent order attempt was unsuccessful.\n\nWe'd love to help you complete your purchase. Please visit our store: ${websiteUrl}\n\nIf you have any questions or need assistance:\n📧 Email: sales@zubahouse.com\n💬 WhatsApp: +1 437-557-7487\n\nYou can reply directly to this email or contact us using the information above. We're here to help!\n\nZuba House`;

        // Send email
        const emailSent = await sendEmailFun({
            sendTo: customerEmail,
            subject: 'Your Order Attempt - Zuba House',
            text: emailText,
            html: emailHtml
        });

        if (emailSent) {
            // Update order with notification sent
            order.failedOrderNotificationsSent = (order.failedOrderNotificationsSent || 0) + 1;
            if (!order.failedOrderNotificationsSentAt) {
                order.failedOrderNotificationsSentAt = [];
            }
            order.failedOrderNotificationsSentAt.push(new Date());
            await order.save();

            console.log(`✅ Failed order notification sent to ${customerEmail} for order ${order._id}`);

            return res.status(200).json({
                error: false,
                success: true,
                message: 'Failed order notification email sent successfully',
                data: {
                    orderId: order._id,
                    customerEmail,
                    emailsSent: order.failedOrderNotificationsSent,
                    totalEmailsSentToCustomer: totalEmailsSent + 1
                }
            });
        } else {
            return res.status(500).json({
                error: true,
                success: false,
                message: 'Failed to send email notification'
            });
        }
    } catch (error) {
        console.error('❌ Error sending failed order notification:', error);
        return res.status(500).json({
            error: true,
            success: false,
            message: error.message || 'Failed to send failed order notification'
        });
    }
};

/**
 * Toggle failed order notification setting for an order
 */
export const toggleFailedOrderNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const { enabled } = req.body;

        const order = await OrderModel.findById(id);
        if (!order) {
            return res.status(404).json({
                error: true,
                success: false,
                message: 'Order not found'
            });
        }

        order.failedOrderNotificationEnabled = enabled !== undefined ? enabled : !order.failedOrderNotificationEnabled;
        await order.save();

        return res.status(200).json({
            error: false,
            success: true,
            message: `Failed order notifications ${order.failedOrderNotificationEnabled ? 'enabled' : 'disabled'} for order`,
            data: {
                orderId: order._id,
                failedOrderNotificationEnabled: order.failedOrderNotificationEnabled
            }
        });
    } catch (error) {
        console.error('Toggle failed order notification error:', error);
        return res.status(500).json({
            error: true,
            success: false,
            message: error.message || 'Failed to toggle failed order notification'
        });
    }
};

/**
 * Get failed order notification status for an order
 */
export const getFailedOrderNotificationStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await OrderModel.findById(id).select('failedOrderNotificationEnabled failedOrderNotificationsSent failedOrderNotificationsSentAt payment_status');
        if (!order) {
            return res.status(404).json({
                error: true,
                success: false,
                message: 'Order not found'
            });
        }

        // Get customer email to check total emails sent
        let customerEmail = null;
        if (order.userId) {
            try {
                const user = await UserModel.findById(order.userId).select('email');
                customerEmail = user?.email || null;
            } catch (userError) {
                console.warn('Could not fetch user email:', userError.message);
            }
        } else if (order.guestCustomer?.email) {
            customerEmail = order.guestCustomer.email;
        }

        let totalEmailsSentToCustomer = 0;
        if (customerEmail) {
            const customerEmailLower = customerEmail.toLowerCase();
            const allFailedOrders = await OrderModel.find({
                $or: [
                    { userId: order.userId },
                    { 'guestCustomer.email': { $regex: new RegExp(customerEmailLower, 'i') } }
                ],
                payment_status: 'FAILED'
            }).select('failedOrderNotificationsSent');

            totalEmailsSentToCustomer = allFailedOrders.reduce((sum, o) => sum + (o.failedOrderNotificationsSent || 0), 0);
        }

        return res.status(200).json({
            error: false,
            success: true,
            data: {
                orderId: order._id,
                paymentStatus: order.payment_status,
                failedOrderNotificationEnabled: order.failedOrderNotificationEnabled !== false,
                emailsSentForThisOrder: order.failedOrderNotificationsSent || 0,
                totalEmailsSentToCustomer,
                canSendMore: totalEmailsSentToCustomer < 3,
                lastSentAt: order.failedOrderNotificationsSentAt && order.failedOrderNotificationsSentAt.length > 0
                    ? order.failedOrderNotificationsSentAt[order.failedOrderNotificationsSentAt.length - 1]
                    : null
            }
        });
    } catch (error) {
        console.error('Get failed order notification status error:', error);
        return res.status(500).json({
            error: true,
            success: false,
            message: error.message || 'Failed to get failed order notification status'
        });
    }
};
