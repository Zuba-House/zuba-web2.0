# 💼 Discount System - Practical Examples

## 🎯 Real-World Scenarios

### **Scenario 1: Black Friday Sale**

**Goal:** 30% off everything, free shipping, limited to 5000 uses

**Admin Creates:**
```
Code: BLACKFRIDAY2024
Type: Percentage
Amount: 30
Minimum: 0
Max Discount: 100 (cap at $100)
Usage Limit: 5000
Usage Per User: 1
Start: 2024-11-29 00:00
End: 2024-11-30 23:59
Free Shipping: Yes
Active: Yes
```

**Customer Experience:**
- Customer adds $200 worth of items
- Applies code: BLACKFRIDAY2024
- Gets: $60 off (30% of $200, capped at $100)
- Shipping: FREE
- Final: $140 (saved $60 + shipping)

---

### **Scenario 2: Welcome Discount for New Customers**

**Goal:** 15% off first order, one-time use per customer

**Admin Creates:**
```
Code: WELCOME15
Type: Percentage
Amount: 15
Minimum: 0
Usage Limit: Unlimited
Usage Per User: 1
Individual Use: Yes (can't combine)
Active: Yes
```

**Customer Experience:**
- New customer's first order
- Applies code: WELCOME15
- Gets: 15% off
- Can only use once (tracked by user)

---

### **Scenario 3: Product Launch Discount**

**Goal:** 25% off specific new products only

**Admin Creates:**
```
Code: NEWPRODUCT25
Type: Percentage
Amount: 25
Minimum: 0
Product IDs: [new-product-1, new-product-2, new-product-3]
Active: Yes
```

**Customer Experience:**
- Customer adds new product ($100) + regular product ($50)
- Applies code: NEWPRODUCT25
- Gets: $25 off (only on new product)
- Regular product: No discount
- Final: $125 ($75 + $50)

---

### **Scenario 4: Customer Service Gift Card**

**Goal:** Compensate customer with $75 credit

**Admin Creates:**
```
Initial Balance: 75
Recipient Email: customer@example.com
Recipient Name: Customer Name
Message: We apologize for the inconvenience. Here's $75 to use on your next order!
Expiry: 2025-12-31
```

**Customer Experience:**
- Receives email with gift card code
- Adds items to cart ($100)
- Applies gift card code
- Gets: $75 off
- Pays: $25 + shipping

---

### **Scenario 5: Bulk Purchase Incentive**

**Goal:** Automatic 5% off for orders with 10+ items

**System Automatically:**
- Detects: 12 items in cart
- Applies: 5% automatic discount
- Shows: "Bulk Purchase Discount - You saved 5%!"
- No code needed!

---

## 📝 Step-by-Step: Complete Admin Workflow

### **Creating a Seasonal Sale Coupon**

**Step 1: Plan Your Campaign**
- Discount: 25% off
- Duration: December 1-31, 2024
- Minimum: $75
- Max discount: $50
- Usage: 2000 times

**Step 2: Create in Admin**

1. Go to **Coupons** → **Add Coupon**

2. Fill Form:
   ```
   Code: DECEMBER25
   Description: December Sale - 25% off orders over $75
   Discount Type: Percentage
   Discount Amount: 25
   Minimum Amount: 75
   Maximum Discount: 50
   Usage Limit: 2000
   Usage Limit Per User: 1
   Start Date: 2024-12-01
   End Date: 2024-12-31
   Free Shipping: No
   Active: Yes
   ```

3. Click **"Create Coupon"**

**Step 3: Share with Customers**
- Email newsletter
- Social media
- Website banner
- In-app notification

**Step 4: Monitor Usage**
- Check usage count daily
- See which customers used it
- Track discount amounts
- Adjust if needed

---

## 🎬 Complete Customer Journey Example

### **Customer: Sarah**

**Day 1: Browsing**
- Sarah browses your store
- Adds 3 items to cart: $120 total
- Goes to cart page

**Day 1: Applying Discount**
- Sees "Promo Code" section
- Remembers code from email: `WELCOME15`
- Enters code and clicks "Apply"
- ✅ Success! Gets $18 off (15% of $120)
- New total: $102 + shipping

**Day 1: Checkout**
- Proceeds to checkout
- Sees discount breakdown
- Pays $102 + $10 shipping = $112
- Order placed successfully

**Day 1: After Order**
- Coupon usage recorded
- Sarah's usage count: 1/1 (can't use again)
- Order shows discount info

**Day 30: Second Order**
- Sarah shops again
- Tries to use WELCOME15 again
- ❌ Error: "You've already used this coupon"
- Uses different coupon or pays full price

---

## 🔍 Admin Monitoring Example

### **Checking Coupon Performance**

**Go to Coupons Page:**
```
Code: SAVE20
Status: Active
Usage: 245 / 1000
Revenue Impact: $4,900 (245 × $20 avg discount)
```

**Analysis:**
- 245 uses out of 1000 limit
- 755 uses remaining
- Average discount: $20
- Total savings given: ~$4,900

**Decision:**
- Keep running (good performance)
- Or increase limit if popular
- Or create new similar coupon

---

## 💡 Advanced Scenarios

### **Scenario: Tiered Discounts**

**Create Multiple Coupons:**
```
SAVE10 - 10% off, min $50
SAVE20 - 20% off, min $100
SAVE30 - 30% off, min $200
```

**Customer Strategy:**
- Small order ($60) → Uses SAVE10
- Medium order ($150) → Uses SAVE20
- Large order ($250) → Uses SAVE30

---

### **Scenario: Email-Specific Campaign**

**Create Coupon:**
```
Code: VIP2024
Type: Percentage
Amount: 25
Allowed Emails: [vip1@example.com, vip2@example.com]
```

**Result:**
- Only specific emails can use
- Others get "Not available for your email"

---

### **Scenario: Exclude Sale Items**

**Create Coupon:**
```
Code: REGULAR20
Type: Percentage
Amount: 20
Exclude Sale Items: Yes
```

**Result:**
- 20% off regular price items
- Sale items not discounted further
- Prevents double discounting

---

## 🎯 Best Practices Examples

### **✅ Good Coupon Setup:**

```
Code: SUMMER25
Type: Percentage
Amount: 25
Minimum: 50
Maximum: 75 (caps loss)
Usage Limit: 5000 (reasonable)
Usage Per User: 1 (prevents abuse)
Start: Clear start date
End: Clear end date
Free Shipping: No (unless special)
Active: Yes
```

**Why Good:**
- Clear naming
- Reasonable limits
- Prevents abuse
- Caps maximum loss

### **❌ Bad Coupon Setup:**

```
Code: TEST
Type: Percentage
Amount: 50
Minimum: 0
Maximum: None
Usage Limit: Unlimited
Usage Per User: Unlimited
No expiry date
```

**Why Bad:**
- No limits = unlimited loss
- No expiry = runs forever
- Easy to abuse
- No control

---

## 📊 Reporting Examples

### **Coupon Report:**

```
Coupon: SAVE20
─────────────────────────────
Created: 2024-01-01
Status: Active
Total Uses: 1,234
Remaining Uses: 8,766
Average Discount: $18.50
Total Savings Given: $22,839
Most Used By: User #456 (3 times)
```

### **Gift Card Report:**

```
Gift Card: ABCD-1234-EFGH
─────────────────────────────
Issued: 2024-01-15
Initial Balance: $100
Current Balance: $25
Used: $75
Usage Count: 2 orders
Status: Active
Expires: 2025-12-31
```

---

## 🎓 Training Scenarios

### **For New Admins:**

**Exercise 1: Create a Test Coupon**
1. Create coupon: TEST10 (10% off)
2. Test in cart
3. Verify calculation
4. Delete test coupon

**Exercise 2: Create a Gift Card**
1. Create $25 gift card
2. Get the code
3. Test in cart
4. Verify balance deduction

**Exercise 3: Monitor Usage**
1. Check coupon usage stats
2. View gift card balances
3. Check expiry dates
4. Update inactive items

---

## 🔧 Troubleshooting Examples

### **Problem: Coupon not working**

**Checklist:**
1. ✅ Is coupon active? (Check isActive)
2. ✅ Is it expired? (Check endDate)
3. ✅ Usage limit reached? (Check usageCount)
4. ✅ Minimum amount met? (Check cart total)
5. ✅ User already used it? (Check user usage)

**Solution:**
- Go to admin panel
- Check coupon status
- Verify all settings
- Test with different cart total

### **Problem: Gift card balance not updating**

**Checklist:**
1. ✅ Is order completed? (Payment successful)
2. ✅ Was usage recorded? (Check API call)
3. ✅ Check gift card in admin panel
4. ✅ Verify order has discount info

**Solution:**
- Check order status
- Verify discount recording API call
- Manually check gift card balance
- Re-record usage if needed

---

## 🎉 Success Stories

### **Example: Holiday Campaign**

**Setup:**
- Created 5 different coupons
- Each for different discount tier
- Shared via email and social media

**Results:**
- 3,500 coupon uses in 2 weeks
- $45,000 in discounts given
- $180,000 in sales generated
- ROI: 4x return on discount investment

---

## 📱 Mobile Experience

### **Customer on Mobile:**

1. **Adds items to cart**
   - Swipes through products
   - Taps "Add to Cart"

2. **Goes to cart**
   - Sees items
   - Scrolls to discount section

3. **Applies coupon**
   - Taps "Promo Code" tab
   - Types code
   - Taps "Apply"
   - Sees discount applied

4. **Checks out**
   - Sees final total
   - Completes payment

**All works seamlessly on mobile!** 📱

---

## 🎯 Quick Reference Card

### **Admin Actions:**

| Action | Location | Steps |
|--------|----------|-------|
| Create Coupon | Coupons → Add | Fill form → Create |
| Edit Coupon | Coupons → Edit icon | Update → Save |
| Delete Coupon | Coupons → Delete icon | Confirm |
| Create Gift Card | Gift Cards → Add | Fill form → Create |
| Add Balance | Gift Cards → + button | Enter amount |
| View Usage | Coupons/Gift Cards list | See stats in table |

### **Customer Actions:**

| Action | Location | Steps |
|--------|----------|-------|
| Apply Coupon | Cart → Promo Code | Enter code → Apply |
| Apply Gift Card | Cart → Gift Card | Enter code → Apply |
| View Discounts | Cart/Checkout | See breakdown |
| Remove Discount | Cart | Click Remove |

---

## 🚀 Getting Started Checklist

- [ ] Login to admin panel
- [ ] Navigate to Coupons
- [ ] Create your first coupon
- [ ] Test it in customer cart
- [ ] Create a gift card
- [ ] Test gift card
- [ ] Monitor usage
- [ ] Adjust as needed

**You're all set!** 🎉

---

For more details, see:
- **Full Tutorial**: `DISCOUNT_SYSTEM_FULL_TUTORIAL.md`
- **Quick Start**: `DISCOUNT_SYSTEM_QUICK_START.md`
- **Workflow**: `DISCOUNT_SYSTEM_WORKFLOW.md`

