# 🎁 Discount System Implementation Guide

## Overview

A comprehensive discount system has been implemented for your e-commerce platform, including:

- ✅ **Promo Codes / Coupons** - Percentage, fixed amount, free shipping
- ✅ **Gift Cards** - Prepaid cards with balance tracking
- ✅ **Automatic Discounts** - Cart thresholds, first-time buyer, bulk discounts
- ✅ **Discount Stacking** - Multiple discounts can be applied together
- ✅ **Usage Tracking** - Tracks coupon and gift card usage

---

## 📁 Files Created

### Models
- `server/models/coupon.model.js` - Coupon/promo code model (already existed, verified)
- `server/models/giftCard.model.js` - Gift card model (NEW)

### Services
- `server/services/discount.service.js` - Core discount calculation logic (NEW)

### Controllers
- `server/controllers/coupon.controller.js` - Coupon management (NEW)
- `server/controllers/giftCard.controller.js` - Gift card management (NEW)
- `server/controllers/discount.controller.js` - Combined discount operations (NEW)

### Routes
- `server/route/coupon.route.js` - Coupon API routes (NEW)
- `server/route/giftCard.route.js` - Gift card API routes (NEW)
- `server/route/discount.route.js` - Discount API routes (NEW)

### Updated Files
- `server/models/order.model.js` - Added discount fields
- `server/index.js` - Registered new routes

---

## 🚀 API Endpoints

### Coupons

#### Validate Coupon
```http
POST /api/coupons/validate
Content-Type: application/json

{
  "code": "SAVE20"
}
```

**Response:**
```json
{
  "success": true,
  "valid": true,
  "coupon": {
    "code": "SAVE20",
    "description": "Save 20% on your order",
    "discountType": "percentage",
    "discountAmount": 20,
    "minimumAmount": 50,
    "freeShipping": false
  }
}
```

#### Apply Coupon
```http
POST /api/coupons/apply
Content-Type: application/json

{
  "code": "SAVE20",
  "cartItems": [...],
  "cartTotal": 100
}
```

**Response:**
```json
{
  "success": true,
  "coupon": {
    "id": "...",
    "code": "SAVE20",
    "discountType": "percentage",
    "discountAmount": 20
  },
  "discount": 20.00,
  "freeShipping": false
}
```

#### Get Active Coupons (Public)
```http
GET /api/coupons
```

#### Create Coupon (Admin)
```http
POST /api/coupons
Content-Type: application/json

{
  "code": "SAVE20",
  "description": "Save 20% on your order",
  "discountType": "percentage",
  "discountAmount": 20,
  "minimumAmount": 50,
  "usageLimit": 100,
  "usageLimitPerUser": 1,
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "freeShipping": false,
  "isActive": true
}
```

---

### Gift Cards

#### Validate Gift Card
```http
POST /api/gift-cards/validate
Content-Type: application/json

{
  "code": "ABCD-1234-EFGH"
}
```

#### Apply Gift Card
```http
POST /api/gift-cards/apply
Content-Type: application/json

{
  "code": "ABCD-1234-EFGH",
  "cartTotal": 100
}
```

#### Get My Gift Cards
```http
GET /api/gift-cards/my-cards
Authorization: Bearer <token>
```

#### Create Gift Card (Admin)
```http
POST /api/gift-cards
Content-Type: application/json

{
  "initialBalance": 100,
  "currency": "USD",
  "recipientEmail": "customer@example.com",
  "recipientName": "John Doe",
  "message": "Happy Birthday!",
  "expiryDate": "2025-12-31"
}
```

---

### Combined Discount Calculation

#### Calculate All Discounts
```http
POST /api/discounts/calculate
Content-Type: application/json

{
  "cartItems": [...],
  "cartTotal": 150,
  "shippingCost": 10,
  "couponCode": "SAVE20",
  "giftCardCode": "ABCD-1234-EFGH"
}
```

**Response:**
```json
{
  "success": true,
  "discounts": {
    "coupon": {
      "id": "...",
      "code": "SAVE20",
      "discountType": "percentage",
      "discountAmount": 20
    },
    "couponDiscount": 30.00,
    "giftCard": {
      "id": "...",
      "code": "ABCD-1234-EFGH",
      "currentBalance": 50.00
    },
    "giftCardDiscount": 50.00,
    "automaticDiscounts": [
      {
        "type": "cart_threshold",
        "name": "Spend $100+ Discount",
        "description": "You saved 3% on orders over $100!",
        "discount": 4.50
      }
    ],
    "totalDiscount": 84.50,
    "freeShipping": false,
    "finalTotal": 75.50
  }
}
```

---

## 💡 Discount Types

### Coupon Types

1. **Percentage** - Percentage off total (e.g., 20% off)
2. **Fixed Cart** - Fixed amount off entire cart (e.g., $10 off)
3. **Fixed Product** - Fixed amount per product (e.g., $5 off each item)

### Automatic Discounts

1. **Cart Threshold** - Discounts based on cart value:
   - $100+ → 3% off
   - $200+ → 5% off

2. **First-Time Buyer** - 10% off for first order

3. **Bulk Quantity** - 5% off for 10+ items

---

## 🎯 Frontend Integration

### Example: Apply Promo Code Component

```jsx
import { useState } from 'react';

const PromoCodeInput = ({ onDiscountApplied }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const handleApply = async () => {
    if (!code.trim()) {
      setError('Please enter a promo code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // if authenticated
        },
        body: JSON.stringify({
          code: code.trim(),
          cartItems: cartItems, // Your cart items
          cartTotal: cartTotal // Your cart total
        })
      });

      const data = await response.json();

      if (data.success) {
        setAppliedCoupon(data.coupon);
        onDiscountApplied({
          type: 'coupon',
          code: data.coupon.code,
          discount: data.discount,
          freeShipping: data.freeShipping
        });
      } else {
        setError(data.error || 'Invalid promo code');
      }
    } catch (err) {
      setError('Failed to apply promo code');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setCode('');
    setAppliedCoupon(null);
    setError('');
    onDiscountApplied(null);
  };

  return (
    <div className="promo-code-section">
      {appliedCoupon ? (
        <div className="applied-coupon">
          <span>✓ {appliedCoupon.code} applied</span>
          <button onClick={handleRemove}>Remove</button>
        </div>
      ) : (
        <div className="promo-input">
          <input
            type="text"
            placeholder="Enter promo code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === 'Enter' && handleApply()}
          />
          <button onClick={handleApply} disabled={loading}>
            {loading ? 'Applying...' : 'Apply'}
          </button>
        </div>
      )}
      {error && <div className="error">{error}</div>}
    </div>
  );
};
```

### Example: Calculate All Discounts

```jsx
const calculateAllDiscounts = async (cartItems, cartTotal, shippingCost, couponCode, giftCardCode) => {
  try {
    const response = await fetch('/api/discounts/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        cartItems,
        cartTotal,
        shippingCost,
        couponCode,
        giftCardCode
      })
    });

    const data = await response.json();
    
    if (data.success) {
      return data.discounts;
    }
    
    return null;
  } catch (error) {
    console.error('Discount calculation error:', error);
    return null;
  }
};
```

---

## 📊 Order Integration

When creating an order, include discount information:

```javascript
const orderPayload = {
  // ... other order fields
  discounts: {
    couponCode: appliedCoupon?.code || null,
    couponDiscount: discounts.couponDiscount || 0,
    giftCardCode: appliedGiftCard?.code || null,
    giftCardDiscount: discounts.giftCardDiscount || 0,
    automaticDiscounts: discounts.automaticDiscounts || [],
    totalDiscount: discounts.totalDiscount || 0,
    freeShipping: discounts.freeShipping || false,
    subtotal: cartTotal,
    finalTotal: discounts.finalTotal
  }
};
```

After order is created, record discount usage:

```javascript
await fetch('/api/discounts/record-usage', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    orderId: order._id,
    couponCode: appliedCoupon?.code,
    giftCardCode: appliedGiftCard?.code,
    couponDiscount: discounts.couponDiscount,
    giftCardDiscount: discounts.giftCardDiscount
  })
});
```

---

## 🔧 Admin Features

### Create Coupon

```javascript
// Example: 20% off, minimum $50 purchase
{
  code: "SAVE20",
  description: "Save 20% on orders over $50",
  discountType: "percentage",
  discountAmount: 20,
  minimumAmount: 50,
  usageLimit: 1000,
  usageLimitPerUser: 1,
  startDate: "2024-01-01",
  endDate: "2024-12-31",
  freeShipping: false,
  isActive: true
}
```

### Create Gift Card

```javascript
// Example: $100 gift card
{
  initialBalance: 100,
  currency: "USD",
  recipientEmail: "customer@example.com",
  recipientName: "John Doe",
  message: "Thank you for your purchase!",
  expiryDate: "2025-12-31"
}
```

---

## 🎨 Discount Features

### Coupon Features
- ✅ Percentage, fixed cart, or fixed product discounts
- ✅ Minimum/maximum purchase amounts
- ✅ Product/category inclusion/exclusion
- ✅ Email restrictions (allowed/excluded)
- ✅ Usage limits (total and per user)
- ✅ Date range validation
- ✅ Free shipping option
- ✅ Exclude sale items option
- ✅ Individual use (cannot combine with other coupons)

### Gift Card Features
- ✅ Prepaid balance tracking
- ✅ User-specific or general use
- ✅ Expiry dates
- ✅ Usage history
- ✅ Balance management
- ✅ Email delivery option

### Automatic Discounts
- ✅ Cart value thresholds
- ✅ First-time buyer discount
- ✅ Bulk quantity discounts
- ✅ Extensible for custom rules

---

## 🔒 Security Notes

1. **Admin Routes**: Currently using `optionalAuth` - you should add proper admin middleware
2. **Validation**: All discount calculations are validated server-side
3. **Usage Tracking**: Coupon and gift card usage is tracked to prevent abuse
4. **Balance Protection**: Gift card balances are protected from negative values

---

## 🚀 Next Steps

1. **Add Admin Middleware**: Protect admin routes with proper authentication
2. **Frontend Components**: Create React components for promo code and gift card input
3. **Cart Integration**: Update cart page to show discount breakdown
4. **Checkout Integration**: Integrate discount calculation in checkout flow
5. **Order History**: Show discount information in order history
6. **Email Templates**: Send gift card codes via email
7. **Analytics**: Track discount usage and effectiveness

---

## 📝 Testing

### Test Coupon Application
```bash
curl -X POST http://localhost:5000/api/coupons/apply \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SAVE20",
    "cartItems": [{"productId": "123", "quantity": 1, "price": 100}],
    "cartTotal": 100
  }'
```

### Test Gift Card Application
```bash
curl -X POST http://localhost:5000/api/gift-cards/apply \
  -H "Content-Type: application/json" \
  -d '{
    "code": "ABCD-1234-EFGH",
    "cartTotal": 100
  }'
```

---

## 🎉 Summary

You now have a complete discount system that supports:
- ✅ Promo codes with flexible rules
- ✅ Gift cards with balance tracking
- ✅ Automatic discounts
- ✅ Discount stacking
- ✅ Usage tracking
- ✅ Order integration

The system is ready to use! Just integrate it into your frontend and start creating discounts! 🚀

