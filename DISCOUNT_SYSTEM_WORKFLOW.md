# 🔄 Discount System - Complete Workflow

## 📊 Visual Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN CREATES DISCOUNT                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌───────────────┐                      ┌───────────────┐
│   CREATE      │                      │   CREATE      │
│   COUPON      │                      │  GIFT CARD    │
└───────────────┘                      └───────────────┘
        │                                       │
        │ Code: SAVE20                          │ Code: ABCD-1234
        │ 20% off                               │ $100 balance
        │ Min: $50                              │ Expires: 2025
        │                                       │
        └───────────────────┬───────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              CUSTOMER ADDS ITEMS TO CART                    │
│  Item 1: $50  |  Item 2: $30  |  Subtotal: $80            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│           CUSTOMER ENTERS SHIPPING ADDRESS                  │
│  Address: 123 Main St, Ottawa, ON                          │
│  Shipping Calculated: $10                                   │
│  Total Before Discount: $90                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌───────────────┐                      ┌───────────────┐
│  APPLY        │                      │  APPLY        │
│  COUPON       │                      │  GIFT CARD    │
│  "SAVE20"     │                      │  "ABCD-1234"  │
└───────────────┘                      └───────────────┘
        │                                       │
        │ Validates:                            │ Validates:
        │ ✓ Code exists                         │ ✓ Code exists
        │ ✓ Not expired                         │ ✓ Not expired
        │ ✓ Usage limit OK                      │ ✓ Has balance
        │ ✓ Min amount met                      │ ✓ Not expired
        │                                       │
        │ Calculates:                           │ Calculates:
        │ 20% of $80 = $16                      │ Min($50, $80) = $50
        │                                       │
        └───────────────────┬───────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              AUTOMATIC DISCOUNTS APPLIED                     │
│  Cart Threshold: $80 → No discount (need $100+)             │
│  First-Time Buyer: 10% off → $8                             │
│  Bulk Quantity: 2 items → No discount (need 10+)            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    FINAL CALCULATION                         │
│                                                              │
│  Subtotal:              $80.00                               │
│  Coupon (SAVE20):      -$16.00                               │
│  Gift Card:            -$50.00                               │
│  Auto Discount:         -$8.00                               │
│  ───────────────────────────────                            │
│  After Discounts:        $6.00                               │
│  Shipping:            +$10.00                               │
│  ───────────────────────────────                            │
│  FINAL TOTAL:          $16.00                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    CHECKOUT & PAYMENT                        │
│  Customer pays: $16.00 (discounted amount)                  │
│  Payment processed via Stripe                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      ORDER CREATED                           │
│  Order saved with discount information:                      │
│  - Coupon: SAVE20, Discount: $16                             │
│  - Gift Card: ABCD-1234, Used: $50                          │
│  - Auto Discount: $8                                        │
│  - Total Discount: $74                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    USAGE RECORDED                            │
│  Coupon:                                                    │
│  - Usage count: +1                                          │
│  - User usage: +1                                           │
│                                                              │
│  Gift Card:                                                 │
│  - Balance: $100 → $50                                      │
│  - Usage history: +1 entry                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Step-by-Step: Admin Creates Coupon

```
1. Admin Login
   └─> Admin Panel
       └─> Sidebar Menu
           └─> Click "Coupons"
               └─> Click "Add Coupon"
                   └─> Fill Form
                       ├─> Code: SAVE20
                       ├─> Type: Percentage
                       ├─> Amount: 20
                       ├─> Min: 50
                       └─> Click "Create"
                           └─> ✅ Coupon Created!
```

---

## 🛒 Step-by-Step: Customer Uses Discount

```
1. Customer Browses
   └─> Adds Items to Cart
       └─> Goes to Cart Page
           └─> Enters Shipping Address
               └─> Shipping Calculated
                   └─> Sees "Promo Code" Section
                       └─> Clicks "Promo Code" Tab
                           └─> Enters: SAVE20
                               └─> Clicks "Apply"
                                   ├─> API Call: /api/coupons/apply
                                   ├─> Validation: ✅ Valid
                                   ├─> Calculation: 20% of $80 = $16
                                   └─> Cart Updates
                                       ├─> Shows Discount: -$16
                                       ├─> Shows New Total: $74
                                       └─> Customer Proceeds to Checkout
                                           └─> Pays Discounted Amount
                                               └─> Order Created
                                                   └─> Usage Recorded
```

---

## 🔢 Calculation Examples

### **Example 1: Simple Percentage Discount**

```
Cart Subtotal:        $100.00
Coupon (20% off):     -$20.00
Shipping:             +$10.00
──────────────────────────────
Final Total:           $90.00
```

### **Example 2: Coupon + Gift Card**

```
Cart Subtotal:        $150.00
Coupon (10% off):     -$15.00
                      ────────
After Coupon:         $135.00
Gift Card ($50):      -$50.00
Shipping:             +$10.00
──────────────────────────────
Final Total:           $95.00
```

### **Example 3: Multiple Discounts**

```
Cart Subtotal:        $200.00
Coupon (15% off):     -$30.00
                      ────────
After Coupon:         $170.00
Gift Card ($100):     -$100.00
                      ────────
After Gift Card:       $70.00
Auto Discount (3%):    -$6.00  (3% of $200)
                      ────────
After Auto:            $64.00
Shipping:             +$10.00
──────────────────────────────
Final Total:           $74.00
```

### **Example 4: Free Shipping Coupon**

```
Cart Subtotal:        $100.00
Shipping:             +$10.00
                      ────────
Before Discount:      $110.00
Coupon (Free Ship):   -$10.00  (shipping waived)
──────────────────────────────
Final Total:          $100.00
```

---

## 📱 User Interface Flow

### **Cart Page:**

```
┌─────────────────────────────────────┐
│  Cart Items                         │
│  - Item 1: $50                     │
│  - Item 2: $30                     │
│  Subtotal: $80                     │
├─────────────────────────────────────┤
│  Shipping Address Input             │
│  [Enter address...]                 │
│  Shipping: $10                      │
├─────────────────────────────────────┤
│  💰 Discounts                       │
│  ┌─────────────────────────────┐   │
│  │ [Promo Code] [Gift Card]    │   │
│  │                             │   │
│  │ [Enter code...] [Apply]    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ✅ SAVE20 Applied                 │
│  Discount: -$16.00                 │
├─────────────────────────────────────┤
│  Total: $74.00                      │
│  [Proceed to Checkout]              │
└─────────────────────────────────────┘
```

### **Checkout Page:**

```
┌─────────────────────────────────────┐
│  Order Summary                      │
│  - Item 1: $50                     │
│  - Item 2: $30                     │
├─────────────────────────────────────┤
│  Subtotal:        $80.00            │
│  Shipping:        $10.00            │
│  Coupon (SAVE20): -$16.00           │
│  ─────────────────────────          │
│  Total:            $74.00            │
├─────────────────────────────────────┤
│  [Pay $74.00]                       │
└─────────────────────────────────────┘
```

---

## 🔐 Validation Flow

### **Coupon Validation:**

```
Enter Code: "SAVE20"
    │
    ▼
Check if exists
    │
    ├─> ❌ Not Found → Error: "Invalid coupon code"
    │
    └─> ✅ Found
        │
        ▼
Check if active
    │
    ├─> ❌ Inactive → Error: "Coupon is not active"
    │
    └─> ✅ Active
        │
        ▼
Check expiry date
    │
    ├─> ❌ Expired → Error: "Coupon has expired"
    │
    └─> ✅ Valid Date
        │
        ▼
Check usage limit
    │
    ├─> ❌ Limit Reached → Error: "Usage limit reached"
    │
    └─> ✅ Has Usage Left
        │
        ▼
Check user usage
    │
    ├─> ❌ User Limit Reached → Error: "You've already used this"
    │
    └─> ✅ User Can Use
        │
        ▼
Check minimum amount
    │
    ├─> ❌ Below Minimum → Error: "Minimum $50 required"
    │
    └─> ✅ Meets Minimum
        │
        ▼
Calculate Discount
    │
    └─> ✅ Discount Applied!
```

---

## 💾 Data Flow

### **Order Creation with Discounts:**

```javascript
// Cart Page
discounts = {
  coupon: { code: "SAVE20", discount: 16 },
  giftCard: { code: "ABCD-1234", discount: 50 },
  totalDiscount: 66,
  finalTotal: 24
}

// Passed to Checkout
history("/checkout", { state: { discounts } })

// Checkout Page
const { discounts } = location.state
// Uses discounts.finalTotal for payment

// Order Creation
const order = {
  products: [...],
  totalAmt: 24,  // Discounted total
  discounts: {
    couponCode: "SAVE20",
    couponDiscount: 16,
    giftCardCode: "ABCD-1234",
    giftCardDiscount: 50,
    totalDiscount: 66
  }
}

// Usage Recording
POST /api/discounts/record-usage
{
  orderId: "...",
  couponCode: "SAVE20",
  giftCardCode: "ABCD-1234",
  couponDiscount: 16,
  giftCardDiscount: 50
}
```

---

## 🎨 Component Structure

```
Cart Page (index.jsx)
├─> DiscountInput Component
│   ├─> Promo Code Tab
│   │   └─> Input + Apply Button
│   └─> Gift Card Tab
│       └─> Input + Apply Button
│
├─> Discount Display
│   ├─> Coupon Discount
│   ├─> Gift Card Discount
│   └─> Automatic Discounts
│
└─> Total Calculation
    └─> Uses discounts.finalTotal

Checkout Page (index.jsx)
├─> Receives discounts from cart
├─> Shows discount breakdown
├─> Calculates final total
└─> Records usage after order
```

---

## 🔄 State Management

### **Cart Page State:**

```javascript
const [discounts, setDiscounts] = useState(null);

// When discount applied
onDiscountsCalculated={(calculatedDiscounts) => {
  setDiscounts(calculatedDiscounts);
}}

// Pass to checkout
history("/checkout", { 
  state: { 
    discounts,
    shippingAddress,
    // ... other data
  } 
});
```

### **Checkout Page State:**

```javascript
const [discounts, setDiscounts] = useState(null);

// Receive from cart
useEffect(() => {
  if (location.state?.discounts) {
    setDiscounts(location.state.discounts);
  }
}, [location.state]);

// Use in calculation
const finalTotal = discounts?.finalTotal || calculatedTotal;
```

---

## 📊 Database Schema

### **Coupon Document:**

```javascript
{
  _id: ObjectId,
  code: "SAVE20",
  description: "Save 20%",
  discountType: "percentage",
  discountAmount: 20,
  minimumAmount: 50,
  maximumAmount: 100,
  usageLimit: 1000,
  usageLimitPerUser: 1,
  usageCount: 45,
  startDate: Date,
  endDate: Date,
  isActive: true,
  freeShipping: false,
  usedBy: [
    {
      userId: ObjectId,
      orderId: ObjectId,
      usedAt: Date,
      discountApplied: 16
    }
  ]
}
```

### **Gift Card Document:**

```javascript
{
  _id: ObjectId,
  code: "ABCD-1234-EFGH",
  initialBalance: 100,
  currentBalance: 50,
  currency: "USD",
  recipientEmail: "customer@example.com",
  expiryDate: Date,
  isActive: true,
  usageHistory: [
    {
      orderId: ObjectId,
      amount: 50,
      balanceBefore: 100,
      balanceAfter: 50,
      usedAt: Date
    }
  ]
}
```

### **Order Document (with discounts):**

```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  products: [...],
  totalAmt: 24,
  shippingCost: 10,
  discounts: {
    couponCode: "SAVE20",
    couponDiscount: 16,
    giftCardCode: "ABCD-1234",
    giftCardDiscount: 50,
    automaticDiscounts: [
      { type: "first_time_buyer", discount: 8 }
    ],
    totalDiscount: 74,
    freeShipping: false,
    subtotal: 80,
    finalTotal: 24
  }
}
```

---

## 🧪 Testing Scenarios

### **Test 1: Valid Coupon**

```
Input:
- Code: SAVE20
- Cart Total: $100
- Min Required: $50

Expected:
✅ Coupon applied
✅ Discount: $20 (20% of $100)
✅ Final Total: $80 + shipping
```

### **Test 2: Invalid Coupon**

```
Input:
- Code: INVALID
- Cart Total: $100

Expected:
❌ Error: "Invalid coupon code"
✅ No discount applied
✅ Cart total unchanged
```

### **Test 3: Expired Coupon**

```
Input:
- Code: EXPIRED20
- End Date: 2023-12-31 (past)
- Cart Total: $100

Expected:
❌ Error: "Coupon has expired"
✅ No discount applied
```

### **Test 4: Minimum Not Met**

```
Input:
- Code: SAVE20
- Cart Total: $30
- Min Required: $50

Expected:
❌ Error: "Minimum purchase amount of $50 required"
✅ No discount applied
```

### **Test 5: Gift Card Partial Use**

```
Input:
- Gift Card Balance: $50
- Cart Total: $100

Expected:
✅ Gift card applied
✅ Discount: $50 (full balance)
✅ Remaining to pay: $50
✅ Gift card balance: $0
```

---

## 🎓 Learning Path

### **Beginner:**
1. ✅ Read Quick Start Guide
2. ✅ Create a test coupon
3. ✅ Test in cart
4. ✅ Create a gift card
5. ✅ Test gift card

### **Intermediate:**
1. ✅ Understand discount types
2. ✅ Set up restrictions
3. ✅ Monitor usage
4. ✅ Combine discounts
5. ✅ Use automatic discounts

### **Advanced:**
1. ✅ Create complex coupon rules
2. ✅ Set up email-specific coupons
3. ✅ Product-specific discounts
4. ✅ Category-specific discounts
5. ✅ Analyze discount effectiveness

---

## 📖 Complete Documentation

- **Full Tutorial**: `DISCOUNT_SYSTEM_FULL_TUTORIAL.md`
- **Quick Start**: `DISCOUNT_SYSTEM_QUICK_START.md`
- **Implementation**: `DISCOUNT_SYSTEM_IMPLEMENTATION.md`
- **Completion Report**: `DISCOUNT_SYSTEM_COMPLETE.md`
- **Fixes Applied**: `DISCOUNT_SYSTEM_FIXES.md`

---

**Everything is documented and ready to use!** 🎉

