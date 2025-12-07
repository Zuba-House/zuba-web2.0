# 🚀 Commit and Deploy Instructions

## ✅ Current Status

**Good News:** All discount system files are **already committed** locally!

Latest commit: `a9ec288 - Add discount system routes`

---

## 📦 What's Already Committed

### **Server Files (All Committed):**
✅ `server/route/discount.route.js`
✅ `server/route/coupon.route.js`
✅ `server/route/giftCard.route.js`
✅ `server/controllers/discount.controller.js`
✅ `server/controllers/coupon.controller.js`
✅ `server/controllers/giftCard.controller.js`
✅ `server/services/discount.service.js`
✅ `server/models/coupon.model.js`
✅ `server/models/giftCard.model.js`
✅ `server/index.js` (with route registration)

### **Client Files:**
Check if these are committed:
- `client/src/components/DiscountInput/DiscountInput.jsx`
- `client/src/Pages/Cart/index.jsx`
- `client/src/Pages/Checkout/index.jsx`

---

## 🚀 Deployment Steps

### **Step 1: Push to Remote (if not already pushed)**

```bash
git push origin master
```

Or if you're on a different branch:
```bash
git push origin <your-branch-name>
```

### **Step 2: Deploy to Production**

**If using Render (Auto-Deploy):**
1. Go to https://dashboard.render.com
2. Your service should auto-deploy from git
3. Wait for deployment to complete
4. **IMPORTANT:** Restart the service after deployment

**If using Render (Manual Deploy):**
1. Go to your service dashboard
2. Click "Manual Deploy" → "Deploy latest commit"
3. Wait for deployment
4. Restart service

**If using other platforms:**
- Pull latest code on server
- Run `npm install` (if needed)
- Restart Node.js process

### **Step 3: Verify Deployment**

After deployment and restart, test:

```bash
# Should return 200, not 405
curl -X POST https://www.zubahouse.com/api/discounts/calculate \
  -H "Content-Type: application/json" \
  -d '{"cartItems":[],"cartTotal":100}'
```

Or test in browser:
1. Go to your website
2. Add items to cart
3. Try applying a coupon code
4. Should work! ✅

---

## 🔍 If Files Need to Be Committed

If you see uncommitted changes, run:

```bash
# Add all discount system files
git add server/route/discount.route.js
git add server/route/coupon.route.js
git add server/route/giftCard.route.js
git add server/controllers/discount.controller.js
git add server/controllers/coupon.controller.js
git add server/controllers/giftCard.controller.js
git add server/services/discount.service.js
git add server/models/coupon.model.js
git add server/models/giftCard.model.js
git add server/index.js

# Add client files (if modified)
git add client/src/components/DiscountInput/DiscountInput.jsx
git add client/src/Pages/Cart/index.jsx
git add client/src/Pages/Checkout/index.jsx

# Commit
git commit -m "Add complete discount system: routes, controllers, services, and models"

# Push
git push origin master
```

---

## ⚠️ Critical: Server Restart Required

**After deployment, you MUST restart the server!**

The server needs to restart to:
- Load new route files
- Register new routes
- Initialize new models

**Without restarting, you'll continue to get 405 errors.**

---

## ✅ Verification Checklist

After deployment:
- [ ] Files pushed to git
- [ ] Server deployed
- [ ] Server restarted
- [ ] Test endpoint returns 200 (not 405)
- [ ] Discount system works in browser

---

## 🎯 Quick Commands

```bash
# Check what's committed
git log --oneline -5

# Check if there are uncommitted changes
git status

# Push to remote (if needed)
git push origin master

# Then deploy and restart server on your hosting platform
```

---

**Everything is ready! Just push (if needed) and deploy!** 🚀

