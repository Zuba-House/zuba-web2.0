# Order Failure Diagnosis Guide

## Overview
This document helps identify and fix common reasons why orders are failing in the Zuba House system.

## How to Run Diagnosis

Run the diagnostic script to analyze your system:

```bash
cd server
node scripts/diagnoseOrderFailures.js
```

This will provide:
- Analysis of recent failed orders
- Common failure reasons and patterns
- Product inventory issues
- Stripe configuration status
- Recommendations for fixes

## Common Failure Reasons

### 1. **Payment Processing Failures (Stripe)**

**Symptoms:**
- Orders marked as `FAILED` with payment_status
- Error messages about Stripe API key
- Payment intent creation failures

**Common Causes:**
- Missing or invalid `STRIPE_SECRET_KEY` environment variable
- Stripe API key expired or revoked
- Network connectivity issues with Stripe
- Invalid payment amount (zero or negative)
- Card declined by bank

**How to Fix:**
1. Check environment variables:
   ```bash
   echo $STRIPE_SECRET_KEY
   ```
2. Verify Stripe key is valid in Stripe Dashboard
3. Ensure key starts with `sk_test_` (test) or `sk_live_` (production)
4. Check server logs for specific Stripe error messages

**Files to Check:**
- `server/controllers/payment.controller.js`
- Environment variables (`.env` file)

---

### 2. **Stock/Inventory Validation Failures**

**Symptoms:**
- Orders fail with "Insufficient stock" messages
- "Product out of stock" errors
- "Product not available" errors

**Common Causes:**
- Product stock is 0 or less than requested quantity
- Product status is not 'published'
- Variation stock is insufficient
- Race condition (multiple orders for same product)

**How to Fix:**
1. Check product stock levels in admin panel
2. Update stock for products that are out of stock
3. Publish products that are in draft/unpublished status
4. For variable products, check variation stock levels

**Files to Check:**
- `server/controllers/order.controller.js` (lines 151-239)
- Product model and inventory fields

---

### 3. **Product Validation Failures**

**Symptoms:**
- "Product not found" errors
- "Missing required fields" errors
- "Product variation not found" errors

**Common Causes:**
- Product was deleted after being added to cart
- Product ID mismatch between frontend and backend
- Missing product fields (productId, productTitle, quantity, price, subTotal)
- Variation ID doesn't exist

**How to Fix:**
1. Verify products exist in database
2. Check cart data structure matches expected format
3. Ensure all required product fields are present
4. For variable products, verify variation IDs are valid

**Files to Check:**
- `server/controllers/order.controller.js` (lines 27-63)
- Frontend cart data structure

---

### 4. **Guest Checkout Validation Failures**

**Symptoms:**
- "Guest customer information is required" errors
- Orders fail for guest users

**Common Causes:**
- Missing `guestCustomer` object in request
- Missing required guest fields (name, email, phone)
- Guest checkout not properly enabled

**How to Fix:**
1. Ensure guest checkout is enabled
2. Verify guest customer data is sent in order creation request
3. Check that guestCustomer object has: name, email, phone

**Files to Check:**
- `server/controllers/order.controller.js` (lines 65-76)
- Frontend checkout form

---

### 5. **Database/Transaction Failures**

**Symptoms:**
- Orders fail during save operation
- Transaction rollback errors
- Database connection errors

**Common Causes:**
- MongoDB connection issues
- Transaction timeout
- Database constraint violations
- Network issues

**How to Fix:**
1. Check MongoDB connection status
2. Verify database is accessible
3. Check server logs for database errors
4. Ensure database indexes are properly set up

**Files to Check:**
- `server/config/connectDb.js`
- `server/controllers/order.controller.js` (transaction handling)

---

### 6. **Order Amount Calculation Issues**

**Symptoms:**
- Orders fail due to amount mismatch
- Payment amount doesn't match order total

**Common Causes:**
- Frontend and backend calculate totals differently
- Shipping cost not included
- Discount calculation errors
- Currency conversion issues

**How to Fix:**
1. Verify total calculation logic matches between frontend and backend
2. Check shipping cost is included
3. Verify discount calculations
4. Ensure currency is consistent

**Files to Check:**
- `server/controllers/order.controller.js` (lines 78-112)
- Frontend checkout calculation

---

## Quick Diagnostic Checklist

Run through this checklist when orders are failing:

- [ ] **Stripe Configuration**
  - [ ] `STRIPE_SECRET_KEY` is set in environment
  - [ ] Stripe key is valid (not expired)
  - [ ] Stripe key matches environment (test vs live)

- [ ] **Product Inventory**
  - [ ] Products have sufficient stock
  - [ ] Products are published (status = 'published')
  - [ ] Variable products have stock in variations

- [ ] **Order Data**
  - [ ] Products array is not empty
  - [ ] All required product fields are present
  - [ ] Guest customer data is provided (if guest checkout)

- [ ] **Database**
  - [ ] MongoDB is connected
  - [ ] Database is accessible
  - [ ] No connection timeouts

- [ ] **Server Logs**
  - [ ] Check for specific error messages
  - [ ] Look for validation errors
  - [ ] Check for payment processing errors

---

## Monitoring Failed Orders

### View Failed Orders in Admin Panel
1. Go to Orders page in admin portal
2. Look for orders with red "FAILED" badge
3. Check the `failReason`, `failCode`, and `failType` fields
4. Review payment ID and error details

### Database Query for Failed Orders
```javascript
// In MongoDB shell or script
db.orders.find({ payment_status: "FAILED" })
  .sort({ createdAt: -1 })
  .limit(20)
  .pretty()
```

### Common Stripe Decline Codes
- `insufficient_funds` - Card has insufficient funds
- `card_declined` - Generic decline
- `expired_card` - Card has expired
- `incorrect_cvc` - CVC code is incorrect
- `processing_error` - Processing error occurred

---

## Prevention Strategies

1. **Pre-validate Cart Before Checkout**
   - Check stock availability before allowing checkout
   - Validate products are still available
   - Remove unavailable products from cart

2. **Better Error Handling**
   - Show specific error messages to users
   - Log detailed error information
   - Provide retry mechanisms

3. **Stock Management**
   - Set up low stock alerts
   - Automatically disable out-of-stock products
   - Implement reservation system for cart items

4. **Payment Validation**
   - Validate payment amount before processing
   - Handle Stripe errors gracefully
   - Provide alternative payment methods

---

## Getting Help

If orders continue to fail after checking the above:

1. **Run the diagnostic script** and share the output
2. **Check server logs** for detailed error messages
3. **Review failed order details** in admin panel
4. **Check Stripe Dashboard** for payment issues
5. **Verify environment variables** are set correctly

---

## Related Files

- `server/controllers/order.controller.js` - Main order creation logic
- `server/controllers/payment.controller.js` - Payment processing
- `server/models/order.model.js` - Order data model
- `client/src/Pages/Checkout/index.jsx` - Frontend checkout
- `client/src/components/StripeCheckout.jsx` - Stripe integration
- `server/scripts/diagnoseOrderFailures.js` - Diagnostic script

---

## Last Updated
Generated automatically - check diagnostic script for latest analysis.
