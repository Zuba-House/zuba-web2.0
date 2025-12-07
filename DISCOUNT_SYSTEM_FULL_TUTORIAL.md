# 🎁 Discount System - Complete Tutorial

## 📚 Table of Contents

1. [Overview](#overview)
2. [How It Works](#how-it-works)
3. [Admin Guide - Managing Coupons](#admin-guide---managing-coupons)
4. [Admin Guide - Managing Gift Cards](#admin-guide---managing-gift-cards)
5. [Customer Guide - Using Discounts](#customer-guide---using-discounts)
6. [Technical Details](#technical-details)
7. [Examples & Use Cases](#examples--use-cases)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The discount system allows you to:
- **Create promo codes** (percentage, fixed amount, free shipping)
- **Issue gift cards** (prepaid cards with balance tracking)
- **Automatic discounts** (cart thresholds, first-time buyer, bulk discounts)
- **Track usage** (who used what, when, and how much)

---

## 🔄 How It Works

### **System Flow:**

```
1. Admin creates coupon/gift card
   ↓
2. Customer adds items to cart
   ↓
3. Customer enters promo code or gift card code
   ↓
4. System validates and calculates discount
   ↓
5. Discount applied to cart total
   ↓
6. Customer proceeds to checkout
   ↓
7. Payment processed with discounted amount
   ↓
8. Order created with discount information
   ↓
9. Usage recorded (coupon count, gift card balance)
```

### **Discount Types:**

1. **Coupons/Promo Codes**
   - Percentage off (e.g., 20% off)
   - Fixed amount off cart (e.g., $10 off)
   - Fixed amount per product (e.g., $5 off each item)
   - Free shipping

2. **Gift Cards**
   - Prepaid balance
   - Can be user-specific or general use
   - Balance decreases when used

3. **Automatic Discounts**
   - Cart value thresholds ($100+ = 3% off, $200+ = 5% off)
   - First-time buyer (10% off)
   - Bulk quantity (5% off for 10+ items)

---

## 👨‍💼 Admin Guide - Managing Coupons

### **Step 1: Access Coupons Page**

1. Login to admin panel
2. Click **"Coupons"** in the sidebar menu
3. You'll see a list of all coupons

### **Step 2: Create a New Coupon**

1. Click **"Add Coupon"** button (top right)
2. Fill in the form:

#### **Basic Information:**
- **Coupon Code** (e.g., `SAVE20`)
  - Leave empty to auto-generate
  - Will be converted to uppercase
  - Must be unique

- **Description** (optional)
  - e.g., "Save 20% on your order"

- **Discount Type** (required)
  - **Percentage**: e.g., 20 for 20% off
  - **Fixed Cart**: e.g., 10 for $10 off entire cart
  - **Fixed Product**: e.g., 5 for $5 off per item

- **Discount Amount** (required)
  - For percentage: enter number (e.g., 20 for 20%)
  - For fixed: enter amount in USD (e.g., 10 for $10)

#### **Restrictions:**
- **Minimum Purchase Amount**
  - Minimum cart total required (e.g., 50 = $50 minimum)
  - Set to 0 for no minimum

- **Maximum Discount Amount**
  - Maximum discount that can be applied
  - Leave empty for no limit
  - Useful for percentage discounts (e.g., max $50 off)

- **Usage Limit**
  - Total times coupon can be used (e.g., 1000)
  - Leave empty for unlimited

- **Usage Limit Per User**
  - How many times each user can use it (default: 1)

#### **Dates:**
- **Start Date**: When coupon becomes active
- **End Date**: When coupon expires (leave empty for no expiry)

#### **Options:**
- **Free Shipping**: Check to offer free shipping
- **Exclude Sale Items**: Check to not apply to sale items
- **Individual Use**: Check to prevent combining with other coupons
- **Active**: Check to enable the coupon

3. Click **"Create Coupon"**

### **Step 3: Edit a Coupon**

1. Go to Coupons list page
2. Click the **Edit icon** (pencil) next to the coupon
3. Update any fields (except code - cannot be changed)
4. Click **"Update Coupon"**

### **Step 4: Delete a Coupon**

1. Go to Coupons list page
2. Click the **Delete icon** (trash) next to the coupon
3. Confirm deletion

### **Example: Create a 20% Off Coupon**

```
Code: SAVE20
Description: Save 20% on orders over $50
Discount Type: Percentage
Discount Amount: 20
Minimum Amount: 50
Maximum Discount: 50 (max $50 off)
Usage Limit: 1000
Usage Limit Per User: 1
Start Date: 2024-01-01
End Date: 2024-12-31
Free Shipping: No
Active: Yes
```

**Result:** Customers get 20% off orders over $50, but maximum discount is $50.

---

## 🎁 Admin Guide - Managing Gift Cards

### **Step 1: Access Gift Cards Page**

1. Login to admin panel
2. Click **"Gift Cards"** in the sidebar menu
3. You'll see a list of all gift cards

### **Step 2: Create a New Gift Card**

1. Click **"Add Gift Card"** button (top right)
2. Fill in the form:

#### **Basic Information:**
- **Gift Card Code** (optional)
  - Leave empty to auto-generate (recommended)
  - Format: `XXXX-XXXX-XXXX`
  - Must be unique

- **Initial Balance** (required)
  - Amount in USD (e.g., 100 for $100)

- **Currency** (default: USD)
  - USD, CAD, EUR, or GBP

#### **Recipient Information (Optional):**
- **Recipient Name**: Name of the person receiving the card
- **Recipient Email**: Email to send the card to
- **Message**: Personal message (max 500 characters)

#### **Expiry:**
- **Expiry Date**: When the card expires (leave empty for no expiry)

3. Click **"Create Gift Card"**

### **Step 3: Edit a Gift Card**

1. Go to Gift Cards list page
2. Click the **Edit icon** (pencil) next to the card
3. Update fields (code cannot be changed)
4. Click **"Update Gift Card"**

### **Step 4: Add Balance to Gift Card**

1. Go to Gift Cards list page
2. Click the **"+"** button next to the card
3. Enter amount to add
4. Balance is updated immediately

### **Step 5: Delete a Gift Card**

1. Go to Gift Cards list page
2. Click the **Delete icon** (trash) next to the card
3. Confirm deletion

### **Example: Create a $100 Gift Card**

```
Initial Balance: 100
Currency: USD
Recipient Name: John Doe
Recipient Email: john@example.com
Message: Happy Birthday! Enjoy shopping at Zuba House!
Expiry Date: 2025-12-31
```

**Result:** A gift card is created with $100 balance, sent to john@example.com.

---

## 🛒 Customer Guide - Using Discounts

### **Step 1: Add Items to Cart**

1. Browse products and add items to cart
2. Go to cart page

### **Step 2: Enter Shipping Address**

1. Enter your shipping address
2. Enter phone number
3. Wait for shipping rates to calculate

### **Step 3: Apply Promo Code**

1. In the cart, find the **"Promo Code"** section
2. Click the **"Promo Code"** tab
3. Enter your coupon code (e.g., `SAVE20`)
4. Click **"Apply"**
5. If valid, discount is applied immediately
6. Cart total updates automatically

### **Step 4: Apply Gift Card**

1. In the cart, find the **"Gift Card"** section
2. Click the **"Gift Card"** tab
3. Enter your gift card code (e.g., `ABCD-1234-EFGH`)
4. Click **"Apply"**
5. If valid, discount is applied (up to available balance)
6. Cart total updates automatically

### **Step 5: View Discount Breakdown**

The cart shows:
- **Subtotal**: Original cart total
- **Coupon Discount**: Amount saved from coupon
- **Gift Card**: Amount used from gift card
- **Automatic Discounts**: Any automatic discounts applied
- **Shipping**: Shipping cost (or FREE if coupon offers free shipping)
- **Total**: Final amount to pay

### **Step 6: Proceed to Checkout**

1. Click **"Proceed to Checkout"**
2. Discount information is carried over
3. Final total includes all discounts
4. Complete payment

### **Step 7: After Order**

- Coupon usage is recorded
- Gift card balance is deducted
- Order shows discount information

---

## 🔧 Technical Details

### **API Endpoints**

#### **Coupons:**

**Validate Coupon:**
```http
POST /api/coupons/validate
Content-Type: application/json

{
  "code": "SAVE20"
}
```

**Apply Coupon:**
```http
POST /api/coupons/apply
Content-Type: application/json

{
  "code": "SAVE20",
  "cartItems": [
    {
      "productId": "123",
      "quantity": 2,
      "price": 50
    }
  ],
  "cartTotal": 100
}
```

**Create Coupon (Admin):**
```http
POST /api/coupons
Content-Type: application/json
Authorization: Bearer <token>

{
  "code": "SAVE20",
  "description": "Save 20%",
  "discountType": "percentage",
  "discountAmount": 20,
  "minimumAmount": 50,
  "usageLimit": 1000,
  "usageLimitPerUser": 1,
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "isActive": true
}
```

**Get All Coupons (Admin):**
```http
GET /api/coupons/all
Authorization: Bearer <token>
```

**Update Coupon (Admin):**
```http
PUT /api/coupons/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "discountAmount": 25,
  "isActive": false
}
```

**Delete Coupon (Admin):**
```http
DELETE /api/coupons/:id
Authorization: Bearer <token>
```

#### **Gift Cards:**

**Validate Gift Card:**
```http
POST /api/gift-cards/validate
Content-Type: application/json

{
  "code": "ABCD-1234-EFGH"
}
```

**Apply Gift Card:**
```http
POST /api/gift-cards/apply
Content-Type: application/json

{
  "code": "ABCD-1234-EFGH",
  "cartTotal": 100
}
```

**Create Gift Card (Admin):**
```http
POST /api/gift-cards
Content-Type: application/json
Authorization: Bearer <token>

{
  "initialBalance": 100,
  "currency": "USD",
  "recipientEmail": "customer@example.com",
  "recipientName": "John Doe",
  "message": "Happy Birthday!",
  "expiryDate": "2025-12-31"
}
```

**Get All Gift Cards (Admin):**
```http
GET /api/gift-cards/all
Authorization: Bearer <token>
```

**Add Balance (Admin):**
```http
POST /api/gift-cards/:id/add-balance
Content-Type: application/json
Authorization: Bearer <token>

{
  "amount": 50,
  "reason": "Customer refund"
}
```

#### **Combined Discount Calculation:**

**Calculate All Discounts:**
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

## 💡 Examples & Use Cases

### **Example 1: Black Friday Sale**

**Create Coupon:**
```
Code: BLACKFRIDAY2024
Type: Percentage
Amount: 30
Minimum: 0
Max Discount: 100
Usage Limit: 5000
Free Shipping: Yes
Start: 2024-11-29
End: 2024-11-30
```

**Result:** 30% off everything, free shipping, max $100 discount, 5000 uses available.

---

### **Example 2: New Customer Welcome**

**Create Coupon:**
```
Code: WELCOME10
Type: Percentage
Amount: 10
Minimum: 0
Usage Limit: Unlimited
Usage Per User: 1
Individual Use: Yes
```

**Result:** 10% off for new customers, one-time use per customer.

---

### **Example 3: Product-Specific Discount**

**Create Coupon:**
```
Code: ART20
Type: Percentage
Amount: 20
Minimum: 0
Product IDs: [art-product-1, art-product-2]
```

**Result:** 20% off only on specific art products.

---

### **Example 4: Gift Card for Customer Service**

**Scenario:** Customer had an issue, you want to give them $50 credit.

**Create Gift Card:**
```
Initial Balance: 50
Recipient Email: customer@example.com
Recipient Name: Customer Name
Message: We apologize for the inconvenience. Here's $50 to use on your next order!
```

**Result:** Customer receives email with gift card code, can use it anytime.

---

### **Example 5: Bulk Purchase Discount**

**Automatic Discount:**
- When cart has 10+ items, automatically applies 5% off
- No coupon code needed
- Applied automatically

---

## 🎬 Step-by-Step: Complete Customer Journey

### **Scenario: Customer uses SAVE20 coupon**

1. **Customer adds items to cart**
   - Item 1: $50
   - Item 2: $30
   - **Subtotal: $80**

2. **Customer enters shipping address**
   - Shipping calculated: $10
   - **Total: $90**

3. **Customer applies coupon "SAVE20"**
   - System validates: ✅ Valid
   - System checks: Minimum $50? ✅ Yes ($80)
   - Discount calculated: 20% of $80 = $16
   - **New Total: $74** ($80 - $16 + $10 shipping)

4. **Customer proceeds to checkout**
   - Sees discount breakdown
   - Pays $74

5. **Order created**
   - Order total: $74
   - Discount info saved: SAVE20, $16 discount

6. **Usage recorded**
   - Coupon usage count: +1
   - User's usage count: +1

---

## 🔍 Troubleshooting

### **Issue: Coupon not applying**

**Possible Causes:**
1. **Coupon expired** - Check end date
2. **Usage limit reached** - Check usage count vs limit
3. **Minimum amount not met** - Check cart total vs minimum
4. **User already used it** - Check usage limit per user
5. **Coupon inactive** - Check isActive status

**Solution:**
- Check coupon status in admin panel
- Verify cart total meets minimum
- Check usage statistics

---

### **Issue: Gift card not applying**

**Possible Causes:**
1. **No balance** - Check current balance
2. **Expired** - Check expiry date
3. **User restriction** - Check if card is user-specific
4. **Card inactive** - Check isActive status

**Solution:**
- Check gift card balance in admin panel
- Verify expiry date
- Check if card is assigned to specific user

---

### **Issue: Discount not showing in checkout**

**Possible Causes:**
1. **Discount info not passed** - Check navigation state
2. **Calculation error** - Check API response

**Solution:**
- Ensure discount info is passed from cart to checkout
- Check browser console for errors
- Verify API is returning correct data

---

### **Issue: Multiple discounts not stacking**

**Check:**
- Coupon has `individualUse: true`? If yes, it can't combine
- Automatic discounts always stack
- Gift cards can combine with coupons (unless coupon says individual use)

---

## 📊 Understanding Discount Calculation

### **Calculation Order:**

1. **Start with cart subtotal**: $100
2. **Apply coupon discount**: -$20 (20% off)
   - New total: $80
3. **Apply gift card**: -$30 (from $50 balance)
   - New total: $50
4. **Apply automatic discounts**: -$1.50 (3% of $50 for $100+ threshold)
   - New total: $48.50
5. **Add shipping**: +$10 (unless free shipping)
   - **Final total: $58.50**

### **Important Notes:**

- Discounts are applied **sequentially** (not all at once)
- Each discount is calculated on the **remaining amount**
- Automatic discounts are calculated on the **original subtotal**
- Maximum discount cannot exceed cart value
- Final total cannot be negative (minimum $0)

---

## 🎯 Best Practices

### **For Admins:**

1. **Test coupons before launching**
   - Create test coupon
   - Test in cart
   - Verify calculation

2. **Set reasonable limits**
   - Don't set unlimited usage on high-value coupons
   - Use maximum discount to cap losses

3. **Monitor usage**
   - Check coupon usage regularly
   - Track which coupons are popular
   - Adjust or expire unused coupons

4. **Gift card security**
   - Don't share gift card codes publicly
   - Use recipient email for delivery
   - Set expiry dates

### **For Customers:**

1. **Check coupon terms**
   - Minimum purchase amount
   - Expiry date
   - Usage limits

2. **Combine strategically**
   - Use gift card + coupon together
   - Check if automatic discounts apply
   - Maximize savings

3. **Save gift cards**
   - Don't lose gift card codes
   - Check balance before using
   - Use before expiry

---

## 📱 Frontend Integration

### **Cart Page Integration:**

The `DiscountInput` component is already integrated in the cart page. It:
- Shows promo code and gift card tabs
- Validates codes in real-time
- Calculates discounts automatically
- Shows discount breakdown
- Updates cart total

### **Checkout Page Integration:**

The checkout page:
- Receives discount info from cart
- Shows discount breakdown
- Calculates final total
- Passes discount info to order creation

---

## 🔐 Security Features

1. **Server-side validation** - All calculations done on server
2. **Usage tracking** - Prevents abuse
3. **Balance protection** - Gift card balances can't go negative
4. **Expiry enforcement** - Expired codes automatically rejected
5. **User restrictions** - Can limit to specific users/emails

---

## 📈 Analytics & Reporting

### **What's Tracked:**

**Coupons:**
- Total usage count
- Usage per user
- Discount amounts applied
- Orders using coupon

**Gift Cards:**
- Initial and current balance
- Usage history
- Amount used per order
- Remaining balance

### **View in Admin:**

1. **Coupons Page:**
   - See usage count vs limit
   - Check status (Active/Expired)
   - View usage statistics

2. **Gift Cards Page:**
   - See current balance
   - View usage history count
   - Check expiry status

---

## 🚀 Quick Start Checklist

### **For Admins:**

- [ ] Login to admin panel
- [ ] Go to Coupons page
- [ ] Create a test coupon
- [ ] Go to Gift Cards page
- [ ] Create a test gift card
- [ ] Test in customer cart

### **For Testing:**

- [ ] Add items to cart
- [ ] Apply test coupon
- [ ] Apply test gift card
- [ ] Verify discount calculation
- [ ] Complete checkout
- [ ] Check order has discount info
- [ ] Verify usage was recorded

---

## 📞 Support

If you encounter issues:

1. **Check error messages** in browser console
2. **Verify API responses** in network tab
3. **Check server logs** for backend errors
4. **Verify coupon/gift card status** in admin panel
5. **Test with different codes** to isolate issue

---

## 🎉 Summary

You now have a complete discount system with:

✅ **Admin Panel** - Full management interface  
✅ **Customer Interface** - Easy discount application  
✅ **Automatic Discounts** - Smart savings  
✅ **Usage Tracking** - Complete analytics  
✅ **Order Integration** - Discounts saved with orders  

**Everything is ready to use!** 🚀

Start by creating a test coupon in the admin panel and try it in the cart!

