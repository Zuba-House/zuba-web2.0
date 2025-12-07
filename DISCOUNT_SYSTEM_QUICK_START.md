# ⚡ Discount System - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### **Step 1: Create Your First Coupon (2 minutes)**

1. **Login to Admin Panel**
   - Go to your admin URL
   - Login with admin credentials

2. **Navigate to Coupons**
   - Click **"Coupons"** in sidebar menu

3. **Create Coupon**
   - Click **"Add Coupon"** button
   - Fill in:
     ```
     Code: TEST20
     Discount Type: Percentage
     Discount Amount: 20
     Minimum Amount: 0
     Active: ✓ (checked)
     ```
   - Click **"Create Coupon"**

✅ **Done!** You now have a 20% off coupon!

---

### **Step 2: Test It (2 minutes)**

1. **Go to Customer Site**
   - Open your storefront
   - Add items to cart

2. **Apply Coupon**
   - Go to cart page
   - Find "Promo Code" section
   - Enter: `TEST20`
   - Click **"Apply"**

3. **See Discount**
   - Cart total updates automatically
   - Shows discount breakdown
   - Proceed to checkout

✅ **Done!** Discount is working!

---

### **Step 3: Create a Gift Card (1 minute)**

1. **Go to Gift Cards**
   - Click **"Gift Cards"** in admin sidebar

2. **Create Gift Card**
   - Click **"Add Gift Card"**
   - Fill in:
     ```
     Initial Balance: 50
     Currency: USD
     ```
   - Click **"Create Gift Card"**

3. **Get Code**
   - Copy the gift card code
   - Share with customer or use yourself

✅ **Done!** Gift card is ready!

---

## 📋 Common Use Cases

### **Use Case 1: 10% Off for New Customers**

```
Code: WELCOME10
Type: Percentage
Amount: 10
Minimum: 0
Usage Per User: 1
Individual Use: Yes
```

### **Use Case 2: $10 Off Orders Over $50**

```
Code: SAVE10
Type: Fixed Cart
Amount: 10
Minimum: 50
```

### **Use Case 3: Free Shipping**

```
Code: FREESHIP
Type: Percentage
Amount: 0
Free Shipping: Yes
```

### **Use Case 4: $100 Gift Card**

```
Initial Balance: 100
Recipient Email: customer@example.com
Message: Thank you for your purchase!
```

---

## 🎯 Key Features

### **What You Can Do:**

✅ Create unlimited coupons  
✅ Create gift cards with any balance  
✅ Set usage limits  
✅ Set expiry dates  
✅ Track usage statistics  
✅ Combine discounts (coupon + gift card)  
✅ Automatic discounts (no code needed)  

### **What Customers Can Do:**

✅ Apply promo codes in cart  
✅ Use gift cards  
✅ See discount breakdown  
✅ Get automatic discounts  
✅ Combine multiple discounts  

---

## 🔗 Important Links

- **Admin Coupons**: `/coupons`
- **Admin Gift Cards**: `/gift-cards`
- **Customer Cart**: `/cart` (apply discounts here)

---

## 💡 Pro Tips

1. **Test First**: Always test coupons before sharing
2. **Set Limits**: Use usage limits to control costs
3. **Monitor Usage**: Check coupon usage regularly
4. **Set Expiry**: Always set expiry dates
5. **Max Discount**: Use max discount to cap losses

---

## ❓ Quick FAQ

**Q: Can customers use multiple coupons?**  
A: Only if coupons don't have "Individual Use" enabled.

**Q: Can gift cards combine with coupons?**  
A: Yes! Unless coupon has "Individual Use" enabled.

**Q: What happens if gift card balance is less than cart total?**  
A: Gift card applies up to available balance, customer pays the rest.

**Q: Can I edit a coupon code?**  
A: No, codes cannot be changed. Create a new coupon instead.

**Q: How do automatic discounts work?**  
A: They apply automatically based on cart value/quantity. No code needed!

---

**That's it! You're ready to start using the discount system!** 🎉

