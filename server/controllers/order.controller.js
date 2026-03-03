import mongoose from "mongoose";
import OrderModel from "../models/order.model.js";
import ProductModel from '../models/product.model.js';
import UserModel from '../models/user.model.js';
import AddressModel from "../models/address.model.js";
import VendorModel from '../models/vendor.model.js';
// PayPal removed - using Stripe for payments
// import paypal from "@paypal/checkout-server-sdk";
import OrderConfirmationEmail from "../utils/orderEmailTemplate.js";
import OrderCancellationEmail from "../utils/orderCancellationEmailTemplate.js";
import AdminOrderNotificationEmail from "../utils/adminOrderNotificationEmailTemplate.js";
import sendEmailFun from "../config/sendEmail.js";
import { calculateOrderCommissions, creditVendorBalance } from "../utils/commissionCalculator.js";
import { sendVendorNewOrder } from "../utils/vendorEmails.js";
import { FailedOrderEmailTemplate } from "../utils/failedOrderEmailTemplate.js";

// ========================================
// HELPER FUNCTION: Send order emails (customer + admin)
// This MUST be called for every order
// ========================================
async function sendOrderEmails(order, requestBody) {
    try {
        console.log('📧 Starting email sending process for order:', order._id);
        
        // Get user email - either from logged-in user or guest customer
        let userEmail = null;
        let userName = null;
        let userInfo = null;
        
        if (requestBody.userId) {
            try {
                const user = await UserModel.findOne({ _id: requestBody.userId });
                if (user?.email) {
                    userEmail = user.email;
                    userName = user.name;
                    userInfo = {
                        name: user.name,
                        email: user.email,
                        mobile: user.mobile,
                        phone: user.mobile
                    };
                }
            } catch (userError) {
                console.warn('⚠️ Could not fetch user for email:', userError.message);
            }
        } else if (requestBody.guestCustomer?.email) {
            // Guest checkout
            userEmail = requestBody.guestCustomer.email;
            userName = requestBody.guestCustomer.name;
            userInfo = {
                name: requestBody.guestCustomer.name,
                email: requestBody.guestCustomer.email,
                phone: requestBody.guestCustomer.phone
            };
        }
        
        // Send customer confirmation email
        if (userEmail) {
            try {
                console.log('📧 Sending customer confirmation email to:', userEmail);
                console.log('📧 Order details for email:', {
                    orderId: order._id,
                    productsCount: order.products?.length || 0,
                    totalAmt: order.totalAmt
                });
                
                const emailHtml = OrderConfirmationEmail(userName || 'Customer', order);
                
                if (!emailHtml || emailHtml.trim().length === 0) {
                    console.error('❌ Email HTML template is empty!');
                    throw new Error('Email HTML template is empty');
                }
                
                console.log('📧 Email HTML generated, length:', emailHtml.length);
                
                const emailResult = await sendEmailFun({
                    sendTo: [userEmail],
                    subject: "Order Confirmation - Zuba House",
                    text: "",
                    html: emailHtml
                });
                
                if (emailResult) {
                    console.log('✅ Customer confirmation email sent successfully to:', userEmail);
                } else {
                    console.error('❌ Customer confirmation email failed (sendEmailFun returned false)');
                    console.error('❌ This usually means SendGrid API key is missing or invalid');
                }
            } catch (emailError) {
                console.error('❌ Failed to send customer confirmation email:', {
                    to: userEmail,
                    error: emailError.message,
                    stack: emailError.stack,
                    response: emailError.response?.body || emailError.response
                });
            }
        } else {
            console.warn('⚠️ No user email found - skipping customer confirmation email');
            console.warn('⚠️ Request body:', {
                hasUserId: !!requestBody.userId,
                hasGuestCustomer: !!requestBody.guestCustomer,
                guestEmail: requestBody.guestCustomer?.email
            });
        }

        // Send admin notification email
        try {
            const adminEmail = process.env.ADMIN_EMAIL || process.env.ADMIN_EMAIL_ADDRESS || 'sales@zubahouse.com';
            console.log('📧 Sending admin notification email to:', adminEmail);
            console.log('📧 Checking SendGrid configuration...');
            
            if (!process.env.SENDGRID_API_KEY) {
                console.error('❌ SENDGRID_API_KEY is not set in environment variables!');
                console.error('❌ Emails will fail. Please set SENDGRID_API_KEY in your environment.');
            } else {
                console.log('✅ SENDGRID_API_KEY is configured');
            }
            
            // Get shipping address if available
            let shippingAddress = null;
            if (order.shippingAddress) {
                shippingAddress = order.shippingAddress;
            } else if (order.delivery_address) {
                try {
                    shippingAddress = await AddressModel.findById(order.delivery_address);
                } catch (addrError) {
                    console.log('Could not fetch shipping address:', addrError.message);
                }
            }

            const adminEmailHtml = AdminOrderNotificationEmail(order, userInfo, shippingAddress);
            
            if (!adminEmailHtml || adminEmailHtml.trim().length === 0) {
                console.error('❌ Admin email HTML template is empty!');
                throw new Error('Admin email HTML template is empty');
            }
            
            console.log('📧 Admin email HTML generated, length:', adminEmailHtml.length);
            
            const adminEmailResult = await sendEmailFun({
                sendTo: [adminEmail],
                subject: `New Order #${order._id} - ${userName || 'Guest Customer'}`,
                text: "",
                html: adminEmailHtml
            });
            
            if (adminEmailResult) {
                console.log('✅ Admin notification email sent successfully to:', adminEmail);
            } else {
                console.error('❌ Admin notification email failed (sendEmailFun returned false)');
                console.error('❌ This usually means SendGrid API key is missing or invalid');
            }
        } catch (adminEmailError) {
            console.error('❌ Error sending admin notification email:', {
                error: adminEmailError.message,
                stack: adminEmailError.stack,
                response: adminEmailError.response?.body || adminEmailError.response
            });
        }
        
        console.log('✅ Email sending process completed for order:', order._id);
    } catch (error) {
        console.error('❌ Critical error in sendOrderEmails function:', {
            error: error.message,
            stack: error.stack,
            orderId: order?._id
        });
        // Don't throw - emails are non-critical but we want to log the error
    }
}

// ========================================
// HELPER FUNCTION: Update stock and commissions (non-blocking)
// This runs in background after order is saved
// ========================================
async function updateOrderStockAndCommissions(order, products, shouldAffectInventory) {
    try {
        // Update commissions
        try {
            const vendorProducts = products.filter(p => p.vendor || p.vendorId);
            if (vendorProducts.length > 0) {
                const commissionResult = await calculateOrderCommissions(products);
                
                // Update order with commission data
                for (let i = 0; i < order.products.length; i++) {
                    const updatedItem = commissionResult.items.find(item => 
                        (item.productId?.toString() || item.productId) === (order.products[i].productId?.toString() || order.products[i].productId)
                    );
                    if (updatedItem) {
                        order.products[i].vendorEarning = updatedItem.vendorEarning || 0;
                        order.products[i].platformCommission = updatedItem.platformCommission || 0;
                        order.products[i].commissionRate = updatedItem.commissionRate || 15;
                    }
                }
                
                if (commissionResult.vendorSummary?.length > 0) {
                    order.vendorSummary = commissionResult.vendorSummary.map(vs => ({
                        vendor: vs.vendorId,
                        vendorShopName: vs.vendorName || '',
                        totalAmount: vs.totalAmount,
                        commission: vs.commission,
                        vendorEarning: vs.vendorEarning
                    }));
                }
                
                await order.save();
                console.log('✅ Order updated with commission data (background)');
            }
        } catch (commissionError) {
            console.error('⚠️ Commission calculation error (background, non-critical):', commissionError);
        }
        
        // Update stock
        if (shouldAffectInventory) {
            for (const orderProduct of products) {
                try {
                    const product = await ProductModel.findById(orderProduct.productId);
                    if (!product) {
                        console.error(`Product not found for stock update: ${orderProduct.productId}`);
                        continue;
                    }
                    
                    if (orderProduct.productType === 'variable' && orderProduct.variationId) {
                        const variation = product.variations?.find(
                            v => v._id?.toString() === orderProduct.variationId.toString()
                        );
                        if (variation && !variation.endlessStock) {
                            variation.stock = Math.max(0, (variation.stock || 0) - orderProduct.quantity);
                            if (variation.stock <= 0) variation.stockStatus = 'out_of_stock';
                            else variation.stockStatus = 'in_stock';
                            
                            // Update total product stock
                            const totalStock = product.variations.reduce((sum, v) => {
                                if (v.endlessStock) return sum + 999999;
                                return sum + (v.stock || 0);
                            }, 0);
                            
                            if (product.inventory) {
                                product.inventory.stock = totalStock;
                                product.inventory.stockStatus = totalStock <= 0 ? 'out_of_stock' : 'in_stock';
                            }
                            product.countInStock = totalStock;
                            product.stockStatus = totalStock <= 0 ? 'out_of_stock' : 'in_stock';
                        }
                    } else if (!product.inventory?.endlessStock && !product.endlessStock) {
                        const currentStock = product.inventory?.stock !== undefined 
                            ? product.inventory.stock 
                            : (product.countInStock !== undefined ? product.countInStock : 0);
                        const newStock = Math.max(0, currentStock - orderProduct.quantity);
                        
                        if (product.inventory) {
                            product.inventory.stock = newStock;
                            product.inventory.stockStatus = newStock <= 0 ? 'out_of_stock' : 'in_stock';
                        }
                        product.countInStock = newStock;
                        product.stockStatus = newStock <= 0 ? 'out_of_stock' : 'in_stock';
                    }
                    
                    product.sale = (product.sale || 0) + orderProduct.quantity;
                    product.totalSales = (product.totalSales || 0) + orderProduct.quantity;
                    await product.save();
                } catch (productError) {
                    console.error(`⚠️ Stock update failed for product ${orderProduct.productId} (non-critical):`, productError);
                }
            }
            console.log('✅ Stock updated (background)');
        }
    } catch (error) {
        console.error('⚠️ Background operations error (non-critical, order already saved):', error);
    }
}

export const createOrderController = async (request, response) => {
    try {
        console.log('📦 Order creation request received:', {
            hasUserId: !!request.body.userId,
            isGuestOrder: !!request.body.guestCustomer,
            productsCount: request.body.products?.length || 0,
            paymentId: request.body.paymentId || 'N/A',
            payment_status: request.body.payment_status || 'N/A'
        });

        // Validate required fields
        if (!request.body.products || !Array.isArray(request.body.products) || request.body.products.length === 0) {
            console.error('❌ Order creation failed: No products provided');
            return response.status(400).json({
                error: true,
                success: false,
                message: 'Products are required to create an order'
            });
        }

        // Validate each product has required fields
        for (let i = 0; i < request.body.products.length; i++) {
            const product = request.body.products[i];
            const missingFields = [];
            
            if (!product.productId) missingFields.push('productId');
            if (!product.productTitle && !product.name) missingFields.push('productTitle');
            if (!product.quantity || product.quantity <= 0) missingFields.push('quantity');
            if (!product.price || product.price <= 0) missingFields.push('price');
            if (!product.subTotal || product.subTotal <= 0) {
                // Try to calculate subTotal if missing
                if (product.price && product.quantity) {
                    product.subTotal = parseFloat((product.price * product.quantity).toFixed(2));
                } else {
                    missingFields.push('subTotal');
                }
            }
            
            if (missingFields.length > 0) {
                console.error(`❌ Order creation failed: Product ${i + 1} missing required fields:`, missingFields);
                return response.status(400).json({
                    error: true,
                    success: false,
                    message: `Product ${i + 1} is missing required fields: ${missingFields.join(', ')}`
                });
            }
        }

        // Handle guest checkout
        const isGuestOrder = request.body.isGuestOrder || (!request.body.userId && request.body.guestCustomer);
        
        // Validate guest customer data if it's a guest order
        if (isGuestOrder && !request.body.guestCustomer) {
            console.error('❌ Order creation failed: Guest order requires guestCustomer data');
            return response.status(400).json({
                error: true,
                success: false,
                message: 'Guest customer information is required'
            });
        }
        
        // Calculate total amount including shipping
        const shippingCost = request.body.shippingCost || 0;
        const productsTotal = request.body.products?.reduce((sum, item) => {
            return sum + (parseFloat(item.price || item.subTotal || 0) * (item.quantity || 1));
        }, 0) || 0;
        const calculatedTotal = productsTotal + shippingCost;
        // Use provided totalAmt if it exists and is valid, otherwise calculate it
        const finalTotal = (request.body.totalAmt && request.body.totalAmt > 0) 
            ? request.body.totalAmt 
            : calculatedTotal;
        
        console.log('💰 Order creation - Amount calculation:', {
            productsTotal,
            shippingCost,
            providedTotalAmt: request.body.totalAmt,
            calculatedTotal,
            finalTotal,
            paymentId: request.body.paymentId
        });

        // Optional: Validate payment amount matches order total (if payment ID provided)
        // This helps catch calculation mismatches between frontend and backend
        if (request.body.paymentId && request.body.totalAmt) {
            // Note: We don't have direct access to payment intent amount here
            // But we can log for debugging if needed
            const amountDifference = Math.abs(finalTotal - request.body.totalAmt);
            if (amountDifference > 0.01) {
                console.warn('⚠️ Order total mismatch detected:', {
                    providedTotal: request.body.totalAmt,
                    calculatedTotal: finalTotal,
                    difference: amountDifference
                });
                // Don't fail order - use provided total as it matches payment
            }
        }

        // Update address with phone number if provided
        if (request.body.phone && request.body.delivery_address) {
            try {
                const address = await AddressModel.findById(request.body.delivery_address);
                if (address) {
                    // Update phone in address contactInfo
                    if (!address.contactInfo) {
                        address.contactInfo = {};
                    }
                    address.contactInfo.phone = request.body.phone;
                    await address.save();
                    console.log('✅ Phone number updated in address:', request.body.delivery_address);
                }
            } catch (addressError) {
                console.warn('⚠️ Could not update phone in address:', addressError.message);
                // Continue with order creation even if address update fails
            }
        }

        // Prepare shipping address for order
        let orderShippingAddress = null;
        if (request.body.shippingAddress) {
            const addr = request.body.shippingAddress;
            orderShippingAddress = {
                addressLine1: addr.addressLine1 || addr.address?.addressLine1 || '',
                addressLine2: addr.addressLine2 || addr.address?.addressLine2 || '',
                city: addr.city || addr.address?.city || '',
                province: addr.province || addr.address?.province || '',
                provinceCode: addr.provinceCode || addr.province || addr.address?.provinceCode || '',
                postalCode: addr.postalCode || addr.postal_code || addr.address?.postalCode || '',
                postal_code: addr.postal_code || addr.postalCode || addr.address?.postalCode || '',
                country: addr.country || addr.address?.country || '',
                countryCode: addr.countryCode || addr.address?.countryCode || '',
                coordinates: addr.coordinates || addr.googlePlaces?.coordinates || null
            };
        }

        // ========================================
        // CRITICAL FIX: VALIDATE STOCK AVAILABILITY BEFORE ORDER CREATION
        // ========================================
        // This prevents race conditions where orders are saved but stock validation fails
        // Validate stock BEFORE creating order to prevent overselling and failed orders
        console.log('🔍 Validating stock availability before order creation...');
        for (let i = 0; i < request.body.products.length; i++) {
            const orderProduct = request.body.products[i];
            
            // Get product from database with fresh read
            const product = await ProductModel.findById(orderProduct.productId);
            
            if (!product) {
                console.error(`❌ Order creation failed: Product not found: ${orderProduct.productId}`);
                return response.status(400).json({
                    error: true,
                    success: false,
                    message: `Product "${orderProduct.productTitle || orderProduct.name || 'Unknown'}" is no longer available. Please remove it from your cart.`
                });
            }

            // Check if product is published/active
            if (product.status !== 'published') {
                console.error(`❌ Order creation failed: Product not published: ${orderProduct.productId}`);
                return response.status(400).json({
                    error: true,
                    success: false,
                    message: `Product "${orderProduct.productTitle || orderProduct.name || 'Unknown'}" is no longer available for purchase.`
                });
            }

            // Validate stock for variable products
            if (orderProduct.productType === 'variable' && orderProduct.variationId) {
                const variation = product.variations?.find(
                    v => v._id && v._id.toString() === orderProduct.variationId.toString()
                );
                
                if (!variation) {
                    console.error(`❌ Order creation failed: Variation not found: ${orderProduct.variationId}`);
                    return response.status(400).json({
                        error: true,
                        success: false,
                        message: `Product variation for "${orderProduct.productTitle || orderProduct.name || 'Unknown'}" is no longer available.`
                    });
                }

                const variationStock = variation.stock || 0;
                const hasEndlessStock = variation.endlessStock === true;
                
                if (!hasEndlessStock && variationStock < orderProduct.quantity) {
                    console.error(`❌ Order creation failed: Insufficient stock for variation: ${orderProduct.variationId}, requested: ${orderProduct.quantity}, available: ${variationStock}`);
                    return response.status(400).json({
                        error: true,
                        success: false,
                        message: `Insufficient stock for "${orderProduct.productTitle || orderProduct.name || 'Unknown'}". Only ${variationStock} item(s) available.`
                    });
                }

                if (!hasEndlessStock && variation.stockStatus === 'out_of_stock') {
                    console.error(`❌ Order creation failed: Variation out of stock: ${orderProduct.variationId}`);
                    return response.status(400).json({
                        error: true,
                        success: false,
                        message: `"${orderProduct.productTitle || orderProduct.name || 'Unknown'}" is out of stock. Please remove it from your cart.`
                    });
                }
            }
            // Validate stock for simple products
            else {
                // Check stock from multiple possible locations (new and old structure)
                const productStock = product.inventory?.stock !== undefined 
                    ? product.inventory.stock 
                    : (product.countInStock !== undefined 
                        ? product.countInStock 
                        : (product.stock !== undefined ? product.stock : 0));
                
                // Check if product has endless stock
                const hasEndlessStock = product.inventory?.endlessStock === true || product.endlessStock === true;
                
                if (!hasEndlessStock && productStock < orderProduct.quantity) {
                    console.error(`❌ Order creation failed: Insufficient stock for product: ${orderProduct.productId}, requested: ${orderProduct.quantity}, available: ${productStock}`);
                    return response.status(400).json({
                        error: true,
                        success: false,
                        message: `Insufficient stock for "${orderProduct.productTitle || orderProduct.name || 'Unknown'}". Only ${productStock} item(s) available.`
                    });
                }

                // Check stock status for simple products (only if not endless stock)
                if (!hasEndlessStock && (product.inventory?.stockStatus === 'out_of_stock' || product.stockStatus === 'out_of_stock')) {
                    console.error(`❌ Order creation failed: Product out of stock: ${orderProduct.productId}`);
                    return response.status(400).json({
                        error: true,
                        success: false,
                        message: `"${orderProduct.productTitle || orderProduct.name || 'Unknown'}" is out of stock. Please remove it from your cart.`
                    });
                }
            }
        }
        console.log('✅ Stock validation passed - all products have sufficient stock');

        // Determine if inventory should be affected (before transaction)
        const paymentStatus = (request.body.payment_status || '').toUpperCase();
        const shouldAffectInventory = paymentStatus !== 'FAILED';
        const paymentSucceeded = paymentStatus === 'COMPLETED' || paymentStatus === 'SUCCEEDED' || request.body.paymentId;

        // ========================================
        // CRITICAL: SAVE ORDER FIRST (BEFORE ANYTHING ELSE)
        // If payment succeeded, order MUST be saved immediately
        // All other operations (stock, commissions) are non-blocking
        // ========================================
        let order = null;
        
        // Create order object
        const orderData = {
            userId: request.body.userId || null,
            products: request.body.products,
            paymentId: request.body.paymentId,
            payment_status: request.body.payment_status,
            delivery_address: request.body.delivery_address,
            totalAmt: finalTotal, // Ensure shipping is included
            shippingCost: shippingCost,
            shippingRate: request.body.shippingRate || null,
            shippingAddress: orderShippingAddress,
            phone: request.body.phone || '',
            // New customer info fields for better delivery
            customerName: request.body.customerName || '',
            apartmentNumber: request.body.apartmentNumber || '',
            deliveryNote: request.body.deliveryNote || '',
            date: request.body.date,
            // Guest checkout fields
            isGuestOrder: isGuestOrder,
            guestCustomer: request.body.guestCustomer || null,
            // Discount information
            discounts: request.body.discounts || null,
            // Status tracking
            status: 'Received',
            statusHistory: [{
                status: 'Received',
                timestamp: new Date(),
                updatedBy: request.userId || null
            }]
        };

        // CRITICAL: Save order FIRST (without transaction) if payment succeeded
        // This ensures order is NEVER lost if payment succeeded
        if (paymentSucceeded) {
            try {
                order = new OrderModel(orderData);
                order = await order.save(); // Save WITHOUT transaction first
                console.log('✅ Order saved IMMEDIATELY (payment succeeded):', order._id);
                
                // Return success immediately - order is saved, customer is protected
                // All other operations will happen in background
                response.status(200).json({
                    error: false,
                    success: true,
                    message: "Order Placed Successfully",
                    order: order,
                    orderId: order._id
                });
                
                // Now do all other operations in background (non-blocking)
                // Stock updates, commissions, emails - all happen after response is sent
                (async () => {
                    try {
                        // Send emails FIRST (most important - must happen for every order)
                        await sendOrderEmails(order, request.body);
                        
                        // Then update stock and commissions
                        await updateOrderStockAndCommissions(order, request.body.products, shouldAffectInventory);
                    } catch (bgError) {
                        console.error('⚠️ Background operations failed (non-critical):', bgError);
                        // Order is already saved, so this is non-critical
                        // But try to send emails anyway as a last resort
                        try {
                            console.log('🔄 Retrying email sending after background error...');
                            await sendOrderEmails(order, request.body);
                        } catch (emailError) {
                            console.error('❌ Email sending retry also failed:', emailError);
                        }
                    }
                })();
                
                return; // Exit early - order is saved, customer is happy
            } catch (saveError) {
                console.error('❌ Failed to save order immediately:', saveError);
                // Try one more time with minimal validation
                try {
                    console.log('🔄 Attempting emergency save...');
                    order = new OrderModel(orderData);
                    order = await order.save();
                    console.log('✅ Emergency save succeeded:', order._id);
                    
                    response.status(200).json({
                        error: false,
                        success: true,
                        message: "Order Placed Successfully",
                        order: order,
                        orderId: order._id
                    });
                    
                    // Background operations
                    (async () => {
                        try {
                            await updateOrderStockAndCommissions(order, request.body.products, shouldAffectInventory);
                        } catch (bgError) {
                            console.error('⚠️ Background operations failed (non-critical):', bgError);
                        }
                    })();
                    
                    return;
                } catch (emergencyError) {
                    console.error('❌ Emergency save also failed:', emergencyError);
                    // Fall through to transaction-based approach as last resort
                }
            }
        }

        // If payment didn't succeed or immediate save failed, use transaction approach
        // Start MongoDB session for transaction support
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Create order object
            order = new OrderModel(orderData);

            // Save order to database within transaction
            order = await order.save({ session });
            console.log('✅ Order saved successfully:', order._id);

            // ========================================
            // CALCULATE VENDOR COMMISSIONS
            // ========================================
            try {
                // Check if any products belong to vendors
                const vendorProducts = request.body.products.filter(p => p.vendor || p.vendorId);
                
                if (vendorProducts.length > 0) {
                    console.log('💰 Calculating vendor commissions for', vendorProducts.length, 'vendor products');
                    
                    // Calculate commissions for all order items
                    const commissionResult = await calculateOrderCommissions(request.body.products);
                    
                    // Update order products with commission info
                    for (let i = 0; i < order.products.length; i++) {
                        const updatedItem = commissionResult.items.find(item => 
                            (item.productId?.toString() || item.productId) === (order.products[i].productId?.toString() || order.products[i].productId)
                        );
                        if (updatedItem) {
                            order.products[i].vendorEarning = updatedItem.vendorEarning || 0;
                            order.products[i].platformCommission = updatedItem.platformCommission || 0;
                            order.products[i].commissionRate = updatedItem.commissionRate || 15;
                        }
                    }
                    
                    // Add vendor summary to order
                    if (commissionResult.vendorSummary?.length > 0) {
                        order.vendorSummary = commissionResult.vendorSummary.map(vs => ({
                            vendor: vs.vendorId,
                            vendorShopName: vs.vendorName || '',
                            totalAmount: vs.totalAmount,
                            commission: vs.commission,
                            vendorEarning: vs.vendorEarning
                        }));
                    }
                    
                    // Save order with commission data within transaction
                    await order.save({ session });
                    console.log('✅ Order updated with commission data');
                    
                    // Send email notifications to vendors (non-blocking, outside transaction)
                    for (const vendorSum of (commissionResult.vendorSummary || [])) {
                        try {
                            const vendor = await VendorModel.findById(vendorSum.vendorId);
                            if (vendor?.email) {
                                const vendorItems = order.products.filter(p => 
                                    (p.vendor?.toString() || p.vendorId?.toString()) === vendorSum.vendorId.toString()
                                );
                                sendVendorNewOrder(vendor, order, vendorItems).catch(err => {
                                    console.error('Failed to send vendor order notification:', err);
                                });
                            }
                        } catch (vendorEmailErr) {
                            console.error('Error sending vendor notification:', vendorEmailErr);
                        }
                    }
                }
            } catch (commissionError) {
                console.error('⚠️ Commission calculation error (non-blocking):', commissionError);
                // Don't fail order creation if commission calculation fails
            }

            // Update inventory only for successful or COD orders
            if (shouldAffectInventory) {
                console.log('📦 Updating inventory for order...');
                for (let i = 0; i < request.body.products.length; i++) {
                    const orderProduct = request.body.products[i];
                    
                    // Get product from database within transaction (with fresh read to prevent race conditions)
                    const product = await ProductModel.findById(orderProduct.productId).session(session);
                    
                    if (!product) {
                        console.error(`Product not found during stock update: ${orderProduct.productId}`);
                        throw new Error(`Product not found during stock update: ${orderProduct.productId}`);
                    }
                    
                    // Re-validate stock one more time within transaction to prevent race conditions
                    if (orderProduct.productType === 'variable' && orderProduct.variationId) {
                        const variation = product.variations?.find(
                            v => v._id && v._id.toString() === orderProduct.variationId.toString()
                        );
                        
                        if (!variation) {
                            console.error(`Variation not found during transaction: ${orderProduct.variationId}`);
                            throw new Error(`Variation not found: ${orderProduct.variationId}`);
                        }
                        
                        // Check if variation has endless stock
                        const hasEndlessStock = variation.endlessStock === true;
                        const variationStock = variation.stock || 0;
                        
                        if (!hasEndlessStock && variationStock < orderProduct.quantity) {
                            throw new Error(`Insufficient stock for variation ${orderProduct.variationId}: requested ${orderProduct.quantity}, available ${variationStock}`);
                        }
                    } else {
                        // Check stock from multiple possible locations (new and old structure)
                        const productStock = product.inventory?.stock !== undefined 
                            ? product.inventory.stock 
                            : (product.countInStock !== undefined 
                                ? product.countInStock 
                                : (product.stock !== undefined ? product.stock : 0));
                        
                        // Check if product has endless stock
                        const hasEndlessStock = product.inventory?.endlessStock === true || product.endlessStock === true;
                        
                        if (!hasEndlessStock && productStock < orderProduct.quantity) {
                            throw new Error(`Insufficient stock for product ${orderProduct.productId}: requested ${orderProduct.quantity}, available ${productStock}`);
                        }
                    }
                    
                    // ========================================
                    // HANDLE VARIABLE PRODUCTS
                    // ========================================
                    if (orderProduct.productType === 'variable' && orderProduct.variationId) {
                        // Find the specific variation
                        const variationIndex = product.variations?.findIndex(
                            v => v._id && v._id.toString() === orderProduct.variationId
                        );
                        
                        if (variationIndex !== -1 && product.variations) {
                            const variation = product.variations[variationIndex];
                            const hasEndlessStock = variation.endlessStock === true;
                            
                            if (!hasEndlessStock) {
                                // Update variation stock
                                const currentVariationStock = variation.stock || 0;
                                const newVariationStock = Math.max(0, currentVariationStock - orderProduct.quantity);
                                
                                product.variations[variationIndex].stock = newVariationStock;
                                
                                // Update variation stock status
                                if (newVariationStock <= 0) {
                                    product.variations[variationIndex].stockStatus = 'out_of_stock';
                                } else {
                                    product.variations[variationIndex].stockStatus = 'in_stock';
                                }
                                
                                // Also update total product stock (sum of all variations)
                                const totalStock = product.variations.reduce((sum, v) => {
                                    if (v.endlessStock) return sum + 999999; // Count endless stock as high number
                                    return sum + (v.stock || 0);
                                }, 0);
                                
                                // Update in new structure if it exists
                                if (product.inventory) {
                                    product.inventory.stock = totalStock;
                                    if (totalStock <= 0) {
                                        product.inventory.stockStatus = 'out_of_stock';
                                    } else {
                                        product.inventory.stockStatus = 'in_stock';
                                    }
                                }
                                
                                // Update legacy fields
                                product.countInStock = totalStock;
                                if (product.stock !== undefined) {
                                    product.stock = totalStock;
                                }
                                
                                // Update product stock status
                                if (totalStock <= 0) {
                                    product.stockStatus = 'out_of_stock';
                                } else {
                                    product.stockStatus = 'in_stock';
                                }
                                
                                console.log(`Updated variation stock: Product ${orderProduct.productId}, Variation ${orderProduct.variationId}, New stock: ${newVariationStock}`);
                            } else {
                                console.log(`Variation ${orderProduct.variationId} has endless stock - skipping stock update`);
                            }
                        } else {
                            console.error(`Variation not found: ${orderProduct.variationId}`);
                            throw new Error(`Variation not found: ${orderProduct.variationId}`);
                        }
                    }
                    // ========================================
                    // HANDLE SIMPLE PRODUCTS
                    // ========================================
                    else {
                        // Check if product has endless stock - don't update if it does
                        const hasEndlessStock = product.inventory?.endlessStock === true || product.endlessStock === true;
                        
                        if (!hasEndlessStock) {
                            // Get current stock from multiple possible locations
                            const currentStock = product.inventory?.stock !== undefined 
                                ? product.inventory.stock 
                                : (product.countInStock !== undefined 
                                    ? product.countInStock 
                                    : (product.stock !== undefined ? product.stock : 0));
                            
                            const newStock = Math.max(0, currentStock - orderProduct.quantity);
                            
                            // Update stock in new structure (inventory.stock) if it exists
                            if (product.inventory) {
                                product.inventory.stock = newStock;
                                // Update stock status
                                if (newStock <= 0) {
                                    product.inventory.stockStatus = 'out_of_stock';
                                } else {
                                    product.inventory.stockStatus = 'in_stock';
                                }
                            }
                            
                            // Also update legacy fields for backward compatibility
                            product.countInStock = newStock;
                            if (product.stock !== undefined) {
                                product.stock = newStock;
                            }
                            
                            // Update top-level stock status
                            if (newStock <= 0) {
                                product.stockStatus = 'out_of_stock';
                            } else {
                                product.stockStatus = 'in_stock';
                            }
                            
                            console.log(`Updated product stock: Product ${orderProduct.productId}, New stock: ${newStock}`);
                        } else {
                            console.log(`Product ${orderProduct.productId} has endless stock - skipping stock update`);
                        }
                    }
                    
                    // ========================================
                    // UPDATE SALES COUNT
                    // ========================================
                    product.sale = (product.sale || 0) + orderProduct.quantity;
                    product.totalSales = (product.totalSales || 0) + orderProduct.quantity;
                    
                    // Save product with updated stock within transaction
                    await product.save({ session });
                }
                console.log('✅ Inventory updated successfully');
            }

            // Commit transaction - all operations succeed together or fail together
            await session.commitTransaction();
            console.log('✅ Transaction committed successfully');
        } catch (transactionError) {
            // Rollback transaction on any error
            await session.abortTransaction();
            console.error('❌ Transaction aborted due to error:', {
                message: transactionError.message,
                stack: transactionError.stack,
                paymentId: request.body.paymentId,
                paymentStatus: request.body.payment_status
            });
            
            // CRITICAL: If payment already succeeded, we should NOT fail the order
            // Try to create order outside transaction to prevent payment loss
            const paymentStatus = (request.body.payment_status || '').toUpperCase();
            if (paymentStatus === 'COMPLETED' || paymentStatus === 'SUCCEEDED' || request.body.paymentId) {
                console.warn('⚠️ Payment succeeded but transaction failed. Attempting to save order outside transaction...');
                
                try {
                    // Try to save order without transaction (payment already succeeded)
                    const emergencyOrder = new OrderModel({
                        userId: request.body.userId || null,
                        products: request.body.products,
                        paymentId: request.body.paymentId,
                        payment_status: request.body.payment_status,
                        delivery_address: request.body.delivery_address,
                        totalAmt: finalTotal,
                        shippingCost: shippingCost,
                        shippingRate: request.body.shippingRate || null,
                        shippingAddress: orderShippingAddress,
                        phone: request.body.phone || '',
                        customerName: request.body.customerName || '',
                        apartmentNumber: request.body.apartmentNumber || '',
                        deliveryNote: request.body.deliveryNote || '',
                        date: request.body.date,
                        isGuestOrder: isGuestOrder,
                        guestCustomer: request.body.guestCustomer || null,
                        discounts: request.body.discounts || null,
                        status: 'Received',
                        statusHistory: [{
                            status: 'Received',
                            timestamp: new Date(),
                            updatedBy: request.userId || null
                        }],
                        // Mark as emergency order for manual review
                        notes: `Emergency order - transaction failed but payment succeeded. Error: ${transactionError.message}`
                    });
                    
                    const savedEmergencyOrder = await emergencyOrder.save();
                    console.log('✅ Emergency order saved (payment succeeded):', savedEmergencyOrder._id);
                    
                    // Return success immediately - order is saved
                    response.status(200).json({
                        error: false,
                        success: true,
                        message: "Order placed successfully (payment succeeded)",
                        order: savedEmergencyOrder,
                        orderId: savedEmergencyOrder._id
                    });
                    
                    // Send emails and update stock/commissions in background (non-blocking)
                    (async () => {
                        try {
                            // Send emails FIRST (most important)
                            await sendOrderEmails(savedEmergencyOrder, request.body);
                            
                            // Then update stock and commissions
                            await updateOrderStockAndCommissions(savedEmergencyOrder, request.body.products, shouldAffectInventory);
                        } catch (bgError) {
                            console.error('⚠️ Background operations failed (non-critical):', bgError);
                            // Try emails again as last resort
                            try {
                                await sendOrderEmails(savedEmergencyOrder, request.body);
                            } catch (emailError) {
                                console.error('❌ Email sending retry failed:', emailError);
                            }
                        }
                    })();
                    
                    return;
                } catch (emergencyError) {
                    console.error('❌ Emergency order creation also failed:', emergencyError);
                    // LAST RESORT: Try one more time with absolute minimal data
                    if (paymentSucceeded) {
                        try {
                            console.log('🆘 LAST RESORT: Attempting absolute minimal order save...');
                            const lastResortOrder = new OrderModel({
                                userId: request.body.userId || null,
                                products: request.body.products || [],
                                paymentId: request.body.paymentId || 'UNKNOWN',
                                payment_status: request.body.payment_status || 'COMPLETED',
                                totalAmt: finalTotal || 0,
                                shippingCost: shippingCost || 0,
                                status: 'Received',
                                notes: `LAST RESORT ORDER - Multiple save attempts failed. Payment ID: ${request.body.paymentId}`
                            });
                            const saved = await lastResortOrder.save();
                            console.log('✅ LAST RESORT order saved:', saved._id);
                            
                            response.status(200).json({
                                error: false,
                                success: true,
                                message: "Order placed successfully",
                                order: saved,
                                orderId: saved._id
                            });
                            
                            // Send emails in background (non-blocking)
                            (async () => {
                                try {
                                    await sendOrderEmails(saved, request.body);
                                } catch (emailError) {
                                    console.error('❌ Email sending failed for last resort order:', emailError);
                                }
                            })();
                            
                            return;
                        } catch (lastResortError) {
                            console.error('❌ LAST RESORT save also failed:', lastResortError);
                        }
                    }
                }
            }
            
            // If order was created in transaction, try to delete it (only if payment didn't succeed)
            if (order && order._id && !paymentSucceeded) {
                try {
                    await OrderModel.findByIdAndDelete(order._id);
                    console.log('✅ Cleaned up order after transaction failure:', order._id);
                } catch (cleanupError) {
                    console.error('⚠️ Failed to cleanup order after transaction failure:', cleanupError);
                }
            }
            
            // Return appropriate error response (only if payment didn't succeed)
            if (!paymentSucceeded) {
                return response.status(500).json({
                    error: true,
                    success: false,
                    message: transactionError.message || 'Failed to create order. Please try again.',
                    details: process.env.NODE_ENV === 'development' ? transactionError.stack : undefined,
                    paymentId: request.body.paymentId || null
                });
            } else {
                // Payment succeeded but all save attempts failed - this should never happen
                // But if it does, return success with payment ID for manual recovery
                console.error('🚨 CRITICAL: Payment succeeded but ALL order save attempts failed!');
                return response.status(200).json({
                    error: false,
                    success: true,
                    message: "Payment succeeded. Order processing in progress. Please contact support with Payment ID if order doesn't appear.",
                    paymentId: request.body.paymentId,
                    requiresManualReview: true
                });
            }
        } finally {
            // End session
            session.endSession();
        }

        // Send emails asynchronously (fire and forget) - NEVER block order success
        // CRITICAL: Emails MUST be sent for ALL orders, regardless of shouldAffectInventory
        // If payment succeeded, order MUST succeed regardless of email failures
        if (order && order._id) {
            // Run email sending in background - don't await
            (async () => {
                try {
                    await sendOrderEmails(order, request.body);
                } catch (emailError) {
                    console.error('❌ Email sending failed in transaction path (non-critical):', emailError);
                }
            })(); // Fire and forget - don't await
        }

        // Send failed order notification email if payment failed
        // This runs asynchronously and doesn't block order creation
        // Check if notifications are enabled (default to true for backward compatibility)
        const notificationsEnabled = order.failedOrderNotificationEnabled !== false;
        if (paymentStatus === 'FAILED' && notificationsEnabled) {
            (async () => {
                try {
                    // Use the sendFailedOrderNotification logic but call it directly
                    // to avoid HTTP overhead since we're already in the controller
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

                    if (customerEmail) {
                        // Check total emails sent to this customer across all failed orders (excluding current order)
                        const customerEmailLower = customerEmail.toLowerCase();
                        const allFailedOrders = await OrderModel.find({
                            $or: [
                                { userId: order.userId },
                                { 'guestCustomer.email': { $regex: new RegExp(customerEmailLower, 'i') } }
                            ],
                            payment_status: 'FAILED',
                            _id: { $ne: order._id } // Exclude current order
                        }).select('failedOrderNotificationsSent');

                        const totalEmailsSentFromOtherOrders = allFailedOrders.reduce((sum, o) => sum + (o.failedOrderNotificationsSent || 0), 0);
                        const currentOrderEmailsSent = order.failedOrderNotificationsSent || 0;
                        const totalEmailsSent = totalEmailsSentFromOtherOrders + currentOrderEmailsSent;

                        // Only send if we haven't reached the limit of 3 emails total
                        if (totalEmailsSent < 3) {
                            const websiteUrl = process.env.WEBSITE_URL || process.env.CLIENT_URL || 'https://zubahouse.com';
                            
                            const emailHtml = FailedOrderEmailTemplate({
                                customerName,
                                orderId: order._id,
                                websiteUrl
                            });

                            const emailText = `Hello ${customerName},\n\nWe wanted to let you know that your recent order attempt was unsuccessful.\n\nWe'd love to help you complete your purchase. Please visit our store: ${websiteUrl}\n\nIf you have any questions or need assistance:\n📧 Email: sales@zubahouse.com\n💬 WhatsApp: +1 437-557-7487\n\nYou can reply directly to this email or contact us using the information above. We're here to help!\n\nZuba House`;

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

                                console.log(`✅ Failed order notification sent automatically to ${customerEmail} for order ${order._id}`);
                            } else {
                                console.warn('⚠️ Failed to send failed order notification email (non-critical)');
                            }
                        } else {
                            console.log(`⚠️ Skipping failed order notification - limit reached (${totalEmailsSent} emails already sent to this customer)`);
                        }
                    } else {
                        console.warn('⚠️ No customer email found - skipping failed order notification');
                    }
                } catch (failedOrderEmailError) {
                    console.error('❌ Error sending failed order notification (non-critical):', failedOrderEmailError.message);
                }
            })(); // Fire and forget - don't await
        }


        console.log('✅ Order created successfully:', {
            orderId: order._id,
            userId: order.userId || 'Guest',
            totalAmount: order.totalAmt,
            paymentStatus: order.payment_status
        });

        return response.status(200).json({
            error: false,
            success: true,
            message: "Order Placed Successfully",
            order: order,
            orderId: order._id
        });

    } catch (error) {
        console.error('❌ Order creation error:', {
            message: error.message,
            stack: error.stack,
            body: request.body,
            paymentStatus: request.body.payment_status
        });
        
        // CRITICAL: If payment succeeded, we MUST NOT fail the order
        // Try to create order anyway with minimal validation
        const paymentStatus = (request.body.payment_status || '').toUpperCase();
        if (paymentStatus === 'COMPLETED' || paymentStatus === 'SUCCEEDED') {
            console.warn('⚠️ Payment succeeded but order creation had error. Attempting emergency order creation...');
            
            try {
                // Emergency order creation - minimal validation, just save the order
                const emergencyOrder = new OrderModel({
                    userId: request.body.userId || null,
                    products: request.body.products || [],
                    paymentId: request.body.paymentId || '',
                    payment_status: 'COMPLETED',
                    delivery_address: request.body.delivery_address || null,
                    totalAmt: request.body.totalAmt || 0,
                    shippingCost: request.body.shippingCost || 0,
                    shippingRate: request.body.shippingRate || null,
                    shippingAddress: request.body.shippingAddress || null,
                    phone: request.body.phone || '',
                    customerName: request.body.customerName || '',
                    apartmentNumber: request.body.apartmentNumber || '',
                    deliveryNote: request.body.deliveryNote || '',
                    date: request.body.date || new Date().toLocaleString("en-US", {
                        month: "short",
                        day: "2-digit",
                        year: "numeric",
                    }),
                    isGuestOrder: request.body.isGuestOrder || false,
                    guestCustomer: request.body.guestCustomer || null,
                    discounts: request.body.discounts || null,
                    status: 'Received',
                    statusHistory: [{
                        status: 'Received',
                        timestamp: new Date(),
                        updatedBy: request.userId || null
                    }],
                    emergencyCreated: true, // Flag to indicate this was emergency creation
                    originalError: error.message
                });
                
                const savedEmergencyOrder = await emergencyOrder.save();
                console.log('✅ Emergency order created successfully:', savedEmergencyOrder._id);
                
                // Send emails in background (non-blocking)
                (async () => {
                    try {
                        await sendOrderEmails(savedEmergencyOrder, request.body);
                    } catch (emailError) {
                        console.error('❌ Email sending failed for emergency order:', emailError);
                    }
                })();
                
                return response.status(200).json({
                    error: false,
                    success: true,
                    message: "Order Placed Successfully (Emergency Mode)",
                    order: savedEmergencyOrder,
                    orderId: savedEmergencyOrder._id,
                    warning: "Order created in emergency mode due to validation error, but payment succeeded"
                });
            } catch (emergencyError) {
                console.error('❌ Emergency order creation also failed:', emergencyError);
                // Even emergency creation failed - return error but log payment ID for manual recovery
                return response.status(500).json({
                    error: true,
                    success: false,
                    message: 'Order creation failed. Payment succeeded. Please contact support with Payment ID: ' + (request.body.paymentId || 'N/A'),
                    paymentId: request.body.paymentId,
                    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
                });
            }
        }
        
        // If payment didn't succeed, return normal error
        return response.status(500).json({
            error: true,
            success: false,
            message: error.message || 'Failed to create order',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}


export async function getOrderDetailsController(request, response) {
    try {
        const userId = request.userId // order id

        const { page, limit } = request.query;

        const orderlist = await OrderModel.find().sort({ createdAt: -1 }).populate('delivery_address userId').skip((page - 1) * limit).limit(parseInt(limit));

        const total = await OrderModel.countDocuments(orderlist);

        return response.json({
            message: "order list",
            data: orderlist,
            error: false,
            success: true,
            total: total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export async function getUserOrderDetailsController(request, response) {
    try {
        const userId = request.userId; // User ID from auth middleware
        
        if (!userId) {
            return response.status(401).json({
                message: "User authentication required",
                error: true,
                success: false
            });
        }

        const { page = 1, limit = 5 } = request.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Get user email to also fetch guest orders with matching email
        let userEmail = null;
        try {
            const user = await UserModel.findById(userId).select('email');
            if (user?.email) {
                userEmail = user.email.toLowerCase();
            }
        } catch (userError) {
            console.warn('Could not fetch user email for guest order matching:', userError.message);
        }

        // Build query: orders where userId matches (handle both ObjectId and string)
        // Also include guest orders with matching email
        let userIdQuery;
        
        // Handle both ObjectId and string formats
        try {
            if (mongoose.Types.ObjectId.isValid(userId)) {
                userIdQuery = { userId: new mongoose.Types.ObjectId(userId) };
            } else {
                userIdQuery = { userId: userId };
            }
        } catch {
            userIdQuery = { userId: userId };
        }
        
        const query = {
            $or: [
                userIdQuery
            ]
        };
        
        // Also include guest orders with matching email if user email is available
        if (userEmail) {
            query.$or.push({
                isGuestOrder: true,
                'guestCustomer.email': { $regex: new RegExp(userEmail, 'i') }
            });
        }

        console.log('🔍 Fetching orders for user:', {
            userId,
            userEmail,
            query: JSON.stringify(query)
        });

        // Get paginated orders
        const orderlist = await OrderModel.find(query)
            .sort({ createdAt: -1 })
            .populate('delivery_address userId')
            .skip(skip)
            .limit(limitNum)
            .lean(); // Use lean() for better performance

        // Get total count for pagination
        const total = await OrderModel.countDocuments(query);

        console.log('✅ Found orders:', {
            count: orderlist.length,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum)
        });

        return response.json({
            message: "order list",
            data: orderlist,
            error: false,
            success: true,
            total: total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum)
        });
    } catch (error) {
        console.error('❌ Error fetching user orders:', error);
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}


export async function getTotalOrdersCountController(request, response) {
    try {
        const ordersCount = await OrderModel.countDocuments();
        return response.status(200).json({
            error: false,
            success: true,
            count: ordersCount
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



// PayPal functions removed - using Stripe for payments
// If you need PayPal support in the future, uncomment and configure these functions



export const updateOrderStatusController = async (request, response) => {
    try {
        const { id } = request.params;
        const { status, trackingNumber, estimatedDelivery, order_status } = request.body;

        console.log('🔧 Order Update Request:', {
            orderId: id,
            status: status,
            order_status: order_status,
            body: request.body
        });

        // Validate status if provided
        const validStatuses = ['Received', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
        if (status && !validStatuses.includes(status)) {
            console.log('❌ Invalid status provided:', status);
            return response.status(400).json({
                success: false,
                error: true,
                message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
            });
        }

        const order = await OrderModel.findById(id);
        if (!order) {
            console.log('❌ Order not found:', id);
            return response.status(404).json({
                success: false,
                error: true,
                message: 'Order not found'
            });
        }

        console.log('✅ Order found:', order._id, 'Current status:', order.status || order.order_status);

        // Build update object
        const updateData = {};
        
        // Update new status system
        if (status) {
            const oldStatus = order.status;
            updateData.status = status;
            
            // Add to status history
            if (!order.statusHistory) {
                order.statusHistory = [];
            }
            order.statusHistory.push({
                status: status,
                timestamp: new Date(),
                updatedBy: request.userId || null
            });
        }
        
        // Update legacy order_status for backward compatibility
        if (order_status) {
            updateData.order_status = order_status;
            
            // If status is not provided but order_status is, map it
            if (!status) {
                const statusMap = {
                    'pending': 'Received',
                    'confirm': 'Processing',
                    'delivered': 'Delivered'
                };
                const mappedStatus = statusMap[order_status] || order_status;
                if (validStatuses.includes(mappedStatus)) {
                    updateData.status = mappedStatus;
                    if (!order.statusHistory) {
                        order.statusHistory = [];
                    }
                    order.statusHistory.push({
                        status: mappedStatus,
                        timestamp: new Date(),
                        updatedBy: request.userId || null
                    });
                }
            }
        }
        
        // Update tracking number if provided
        if (trackingNumber !== undefined) {
            updateData.trackingNumber = trackingNumber;
        }
        
        // Update estimated delivery if provided
        if (estimatedDelivery) {
            updateData.estimatedDelivery = new Date(estimatedDelivery);
        }

        // Store old status for comparison
        const oldStatus = order.status || order.order_status;
        
        // Apply updates
        Object.assign(order, updateData);
        const savedOrder = await order.save();
        
        // Get the new status (prioritize new status field)
        const newStatus = savedOrder.status || savedOrder.order_status;
        
        console.log('✅ Order updated successfully:', {
            orderId: savedOrder._id,
            oldStatus: oldStatus,
            newStatus: newStatus,
            statusProvided: status,
            order_statusProvided: order_status,
            updateData: updateData
        });

        // ========================================
        // CREDIT VENDOR BALANCE WHEN ORDER IS DELIVERED
        // ========================================
        const isDelivered = newStatus === 'Delivered' || newStatus === 'delivered' || order_status === 'delivered';
        const wasNotDelivered = oldStatus !== 'Delivered' && oldStatus !== 'delivered';
        
        if (isDelivered && wasNotDelivered) {
            console.log('💰 Order delivered - crediting vendor balances...');
            try {
                // Get vendor items from order
                const vendorItems = savedOrder.products.filter(p => p.vendor || p.vendorId);
                
                if (vendorItems.length > 0) {
                    // Group earnings by vendor
                    const vendorEarnings = {};
                    
                    for (const item of vendorItems) {
                        const vendorId = (item.vendor || item.vendorId)?.toString();
                        if (vendorId) {
                            if (!vendorEarnings[vendorId]) {
                                vendorEarnings[vendorId] = 0;
                            }
                            // Use vendorEarning if calculated, otherwise use subTotal
                            vendorEarnings[vendorId] += item.vendorEarning || item.subTotal || 0;
                            
                            // Update item status to delivered
                            item.vendorStatus = 'DELIVERED';
                            item.deliveredAt = new Date();
                        }
                    }
                    
                    // Credit each vendor
                    for (const [vendorId, earning] of Object.entries(vendorEarnings)) {
                        if (earning > 0) {
                            try {
                                await creditVendorBalance(vendorId, earning, savedOrder._id);
                                console.log(`✅ Credited $${earning} to vendor ${vendorId}`);
                            } catch (creditErr) {
                                console.error(`❌ Failed to credit vendor ${vendorId}:`, creditErr);
                            }
                        }
                    }
                    
                    // Save order with updated vendor statuses
                    await savedOrder.save();
                }
            } catch (vendorCreditError) {
                console.error('⚠️ Vendor credit error (non-blocking):', vendorCreditError);
                // Don't fail status update if vendor credit fails
            }
        }

        // Send email notification if status changed (check both status and order_status)
        // Always send email if status is provided (even if it's the same, admin might want to notify customer)
        const statusChanged = status || order_status; // Send email if either status field is updated
        
        if (statusChanged) {
            console.log('📧 Status update detected, preparing to send email...');
            console.log('📧 Status change details:', {
                statusProvided: status,
                order_statusProvided: order_status,
                oldStatus: oldStatus,
                newStatus: newStatus,
                willSendEmail: true
            });
            try {
                // Import email service and template
                const { sendEmail } = await import('../config/emailService.js');
                const OrderStatusEmailTemplate = (await import('../utils/orderStatusEmailTemplate.js')).default;
                
                // Get customer email (support both registered users and guest orders)
                let customerEmail = '';
                let customerName = '';
                
                if (savedOrder.guestCustomer?.email) {
                    customerEmail = savedOrder.guestCustomer.email;
                    customerName = savedOrder.guestCustomer.name || 'Customer';
                    console.log('📧 Found guest customer email:', customerEmail);
                } else if (savedOrder.userId) {
                    const UserModel = (await import('../models/user.model.js')).default;
                    const user = await UserModel.findById(savedOrder.userId);
                    if (user) {
                        customerEmail = user.email;
                        customerName = user.name || 'Customer';
                        console.log('📧 Found registered user email:', customerEmail);
                    } else {
                        console.log('⚠️ User not found for userId:', savedOrder.userId);
                    }
                } else {
                    console.log('⚠️ No userId or guestCustomer found in order');
                }
                
                // Only send email if we have a customer email
                if (customerEmail) {
                    console.log('📧 Sending status update email to:', customerEmail);
                    console.log('📧 Order details:', {
                        orderId: savedOrder._id,
                        status: newStatus,
                        hasProducts: savedOrder.products?.length > 0
                    });
                    
                    try {
                        // Populate products for email template
                        const populatedOrder = await savedOrder.populate('products.productId');
                        
                        // Use full order ID for consistency with order confirmation email
                        const emailSubject = `Order Status Update - Order #${savedOrder._id.toString()}`;
                        const emailText = `Your order #${savedOrder._id.toString()} status has been updated to ${newStatus}.`;
                        
                        console.log('📧 Calling sendEmail function...');
                        const emailResult = await sendEmail(
                            customerEmail,
                            emailSubject,
                            emailText,
                            OrderStatusEmailTemplate(populatedOrder, newStatus)
                        );
                        
                        if (emailResult && emailResult.success) {
                            console.log('✅ Status update email sent successfully:', emailResult.messageId);
                        } else {
                            console.error('❌ Email sending failed:', emailResult?.error || 'Unknown error');
                            console.error('Email result:', emailResult);
                        }
                    } catch (templateError) {
                        console.error('❌ Error generating email template:', templateError.message);
                        console.error('Template error stack:', templateError.stack);
                    }
                } else {
                    console.log('⚠️ No customer email found. Order details:', {
                        hasGuestCustomer: !!savedOrder.guestCustomer,
                        guestEmail: savedOrder.guestCustomer?.email,
                        hasUserId: !!savedOrder.userId,
                        userId: savedOrder.userId
                    });
                }
            } catch (emailError) {
                // Don't fail the order update if email fails
                console.error('❌ Error sending status update email:', emailError.message);
            }
        }

        // Create notification for customer if status changed
        if (status && order.userId) {
            try {
                const Notification = (await import('../models/notification.model.js')).default;
                await Notification.create({
                    userId: order.userId,
                    type: 'order_status',
                    title: `Order ${newStatus}`,
                    message: `Your order #${order._id} is now ${newStatus}`,
                    orderId: order._id,
                    isRead: false
                });
            } catch (notifError) {
                // Don't fail if notification model doesn't exist yet
                console.log('Notification not created (model may not exist yet):', notifError.message);
            }
        }

        const responseMessage = status 
            ? `Order status updated to ${status}` 
            : (order_status 
                ? `Order status updated to ${order_status}` 
                : "Order updated");

        console.log('📤 Sending response:', responseMessage);

        return response.json({
            message: responseMessage,
            success: true,
            error: false,
            data: savedOrder,
            order: savedOrder // Also include for compatibility
        })
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }

}






export const totalSalesController = async (request, response) => {
    try {
        const currentYear = new Date().getFullYear();

        const ordersList = await OrderModel.find();

        let totalSales = 0;
        let monthlySales = [
            {
                name: 'JAN',
                TotalSales: 0
            },
            {
                name: 'FEB',
                TotalSales: 0
            },
            {
                name: 'MAR',
                TotalSales: 0
            },
            {
                name: 'APRIL',
                TotalSales: 0
            },
            {
                name: 'MAY',
                TotalSales: 0
            },
            {
                name: 'JUNE',
                TotalSales: 0
            },
            {
                name: 'JULY',
                TotalSales: 0
            },
            {
                name: 'AUG',
                TotalSales: 0
            },
            {
                name: 'SEP',
                TotalSales: 0
            },
            {
                name: 'OCT',
                TotalSales: 0
            },
            {
                name: 'NOV',
                TotalSales: 0
            },
            {
                name: 'DEC',
                TotalSales: 0
            },
        ]


        for (let i = 0; i < ordersList.length; i++) {
            totalSales = totalSales + parseInt(ordersList[i].totalAmt);
            const str = JSON.stringify(ordersList[i]?.createdAt);
            const year = str.substr(1, 4);
            const monthStr = str.substr(6, 8);
            const month = parseInt(monthStr.substr(0, 2));

            if (currentYear == year) {

                if (month === 1) {
                    monthlySales[0] = {
                        name: 'JAN',
                        TotalSales: monthlySales[0].TotalSales = parseInt(monthlySales[0].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 2) {

                    monthlySales[1] = {
                        name: 'FEB',
                        TotalSales: monthlySales[1].TotalSales = parseInt(monthlySales[1].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 3) {
                    monthlySales[2] = {
                        name: 'MAR',
                        TotalSales: monthlySales[2].TotalSales = parseInt(monthlySales[2].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 4) {
                    monthlySales[3] = {
                        name: 'APRIL',
                        TotalSales: monthlySales[3].TotalSales = parseInt(monthlySales[3].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 5) {
                    monthlySales[4] = {
                        name: 'MAY',
                        TotalSales: monthlySales[4].TotalSales = parseInt(monthlySales[4].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 6) {
                    monthlySales[5] = {
                        name: 'JUNE',
                        TotalSales: monthlySales[5].TotalSales = parseInt(monthlySales[5].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 7) {
                    monthlySales[6] = {
                        name: 'JULY',
                        TotalSales: monthlySales[6].TotalSales = parseInt(monthlySales[6].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 8) {
                    monthlySales[7] = {
                        name: 'AUG',
                        TotalSales: monthlySales[7].TotalSales = parseInt(monthlySales[7].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 9) {
                    monthlySales[8] = {
                        name: 'SEP',
                        TotalSales: monthlySales[8].TotalSales = parseInt(monthlySales[8].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 10) {
                    monthlySales[9] = {
                        name: 'OCT',
                        TotalSales: monthlySales[9].TotalSales = parseInt(monthlySales[9].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 11) {
                    monthlySales[10] = {
                        name: 'NOV',
                        TotalSales: monthlySales[10].TotalSales = parseInt(monthlySales[10].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

                if (month === 12) {
                    monthlySales[11] = {
                        name: 'DEC',
                        TotalSales: monthlySales[11].TotalSales = parseInt(monthlySales[11].TotalSales) + parseInt(ordersList[i].totalAmt)
                    }
                }

            }


        }


        return response.status(200).json({
            totalSales: totalSales,
            monthlySales: monthlySales,
            error: false,
            success: true
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}





export const totalUsersController = async (request, response) => {
    try {
        const users = await UserModel.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 },
            },
        ]);



        let monthlyUsers = [
            {
                name: 'JAN',
                TotalUsers: 0
            },
            {
                name: 'FEB',
                TotalUsers: 0
            },
            {
                name: 'MAR',
                TotalUsers: 0
            },
            {
                name: 'APRIL',
                TotalUsers: 0
            },
            {
                name: 'MAY',
                TotalUsers: 0
            },
            {
                name: 'JUNE',
                TotalUsers: 0
            },
            {
                name: 'JULY',
                TotalUsers: 0
            },
            {
                name: 'AUG',
                TotalUsers: 0
            },
            {
                name: 'SEP',
                TotalUsers: 0
            },
            {
                name: 'OCT',
                TotalUsers: 0
            },
            {
                name: 'NOV',
                TotalUsers: 0
            },
            {
                name: 'DEC',
                TotalUsers: 0
            },
        ]




        for (let i = 0; i < users.length; i++) {

            if (users[i]?._id?.month === 1) {
                monthlyUsers[0] = {
                    name: 'JAN',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 2) {
                monthlyUsers[1] = {
                    name: 'FEB',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 3) {
                monthlyUsers[2] = {
                    name: 'MAR',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 4) {
                monthlyUsers[3] = {
                    name: 'APRIL',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 5) {
                monthlyUsers[4] = {
                    name: 'MAY',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 6) {
                monthlyUsers[5] = {
                    name: 'JUNE',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 7) {
                monthlyUsers[6] = {
                    name: 'JULY',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 8) {
                monthlyUsers[7] = {
                    name: 'AUG',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 9) {
                monthlyUsers[8] = {
                    name: 'SEP',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 10) {
                monthlyUsers[9] = {
                    name: 'OCT',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 11) {
                monthlyUsers[10] = {
                    name: 'NOV',
                    TotalUsers: users[i].count
                }
            }

            if (users[i]?._id?.month === 12) {
                monthlyUsers[11] = {
                    name: 'DEC',
                    TotalUsers: users[i].count
                }
            }

        }



        return response.status(200).json({
            TotalUsers: monthlyUsers,
            error: false,
            success: true
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



export async function deleteOrder(request, response) {
    try {
        const order = await OrderModel.findById(request.params.id);
        const { cancellationReason } = request.body;

        console.log('Order cancellation request:', request.params.id);

        if (!order) {
            return response.status(404).json({
                message: "Order Not found",
                error: true,
                success: false
            });
        }

        // Get user email for cancellation notification
        let userEmail = null;
        let userName = null;
        
        if (order.userId) {
            const user = await UserModel.findById(order.userId);
            if (user?.email) {
                userEmail = user.email;
                userName = user.name;
            }
        } else if (order.guestCustomer?.email) {
            userEmail = order.guestCustomer.email;
            userName = order.guestCustomer.name;
        }

        // Restore inventory before deleting
        if (order.products && order.products.length > 0) {
            for (const product of order.products) {
                try {
                    const productDoc = await ProductModel.findById(product.productId);
                    if (productDoc) {
                        await ProductModel.findByIdAndUpdate(
                            product.productId,
                            {
                                $inc: {
                                    countInStock: product.quantity || 1,
                                    sale: -(product.quantity || 1)
                                }
                            },
                            { new: true }
                        );
                    }
                } catch (productError) {
                    console.error('Error restoring inventory for product:', product.productId, productError);
                }
            }
        }

        // Send cancellation email before deleting
        if (userEmail) {
            try {
                await sendEmailFun({
                    sendTo: [userEmail],
                    subject: "Order Cancellation - Zuba House",
                    text: "",
                    html: OrderCancellationEmail(userName || 'Customer', order, cancellationReason || 'Order cancelled by admin')
                });
                console.log('Cancellation email sent to:', userEmail);
            } catch (emailError) {
                console.error('Error sending cancellation email:', emailError);
                // Continue with deletion even if email fails
            }
        }

        const deletedOrder = await OrderModel.findByIdAndDelete(request.params.id);

        if (!deletedOrder) {
            return response.status(404).json({
                message: "Order not deleted!",
                success: false,
                error: true
            });
        }

        return response.status(200).json({
            success: true,
            error: false,
            message: "Order cancelled and deleted successfully",
        });
    } catch (error) {
        console.error('Error cancelling order:', error);
        return response.status(500).json({
            message: error.message || "Failed to cancel order",
            error: true,
            success: false
        });
    }
}
