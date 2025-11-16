# 📧 Email Templates Guide - Zuba House

## 📍 Where to Update Email Templates

### 1. **Order Confirmation Email**
**Location:** `server/utils/orderEmailTemplate.js`

This email is sent when an order is successfully placed.

**What it includes:**
- Order details (products, quantities, prices)
- Subtotal
- Shipping cost
- Total amount
- Order ID
- Estimated delivery

**To customize:**
- Edit the HTML template in `server/utils/orderEmailTemplate.js`
- Change colors, styling, or content as needed
- Currently uses USD currency

---

### 2. **Order Cancellation Email** (NEW)
**Location:** `server/utils/orderCancellationEmailTemplate.js`

This email is sent when an order is cancelled.

**What it includes:**
- Cancellation notice
- Order details
- Cancellation reason (if provided)
- Refund information (if payment was completed)
- Order ID and date

**To customize:**
- Edit the HTML template in `server/utils/orderCancellationEmailTemplate.js`
- Change colors, styling, or content as needed
- Currently uses USD currency

---

## 🔧 How Email Templates Work

### Order Confirmation
- **Triggered:** When order is created successfully
- **Controller:** `server/controllers/order.controller.js` → `createOrderController()`
- **Template Function:** `OrderConfirmationEmail(username, order)`
- **Sent to:** User email (logged-in) or guest customer email

### Order Cancellation
- **Triggered:** When order is deleted/cancelled
- **Controller:** `server/controllers/order.controller.js` → `deleteOrder()`
- **Template Function:** `OrderCancellationEmail(username, order, cancellationReason)`
- **Sent to:** User email (logged-in) or guest customer email

---

## 📝 Email Template Structure

Both templates use:
- HTML format with inline CSS
- Responsive design (max-width: 600px)
- Professional styling
- Zuba House branding

### Template Variables Available:

**Order Confirmation:**
- `username` - Customer name
- `orders` - Order object with:
  - `_id` - Order ID
  - `products` - Array of products
  - `totalAmt` - Total amount
  - `shippingCost` - Shipping cost
  - `date` - Order date
  - `payment_status` - Payment status

**Order Cancellation:**
- `username` - Customer name
- `order` - Order object (same as above)
- `cancellationReason` - Reason for cancellation (optional)

---

## 🎨 Customization Examples

### Change Email Colors
```javascript
// In orderEmailTemplate.js
.header {
    background: #YOUR_COLOR; // Change header color
}

// In orderCancellationEmailTemplate.js
.header {
    background: #e74c3c; // Red for cancellation
}
```

### Change Currency
Templates currently use USD. To change:
- Replace `$${amount.toFixed(2)}` with your currency format
- Example for CAD: `$${amount.toFixed(2)} CAD`

### Add Custom Fields
```javascript
// Add to template HTML
<p><strong>Tracking Number:</strong> ${order?.trackingNumber || 'Not available'}</p>
<p><strong>Delivery Address:</strong> ${order?.delivery_address || 'N/A'}</p>
```

---

## ✅ What's Fixed

1. ✅ **Stripe Payment Amount** - Now includes shipping cost correctly
2. ✅ **Order Creation** - Properly saves shipping cost in totalAmt
3. ✅ **Email Template** - Updated to USD currency and includes shipping cost
4. ✅ **Cancellation Email** - New template created and integrated

---

## 🚀 Testing

To test email templates:

1. **Order Confirmation:**
   - Place a test order
   - Check customer email inbox
   - Verify all amounts are correct

2. **Cancellation Email:**
   - Cancel an order from admin panel
   - Check customer email inbox
   - Verify cancellation details are shown

---

## 📞 Support

If you need to:
- Change email sender name/address → Check `server/config/sendEmail.js`
- Modify email sending logic → Check `server/controllers/order.controller.js`
- Update email service settings → Check `server/config/emailService.js`

---

**Last Updated:** 2024
**Version:** 1.0

