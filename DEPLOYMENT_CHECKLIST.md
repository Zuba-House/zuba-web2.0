# 🚀 Discount System - Deployment Checklist

## ⚠️ IMPORTANT: Server Deployment Required

The 405 errors indicate that the new discount routes are **not deployed** to your production server yet.

## ✅ Files That Need to Be Deployed

### **Server Files (Required):**

1. ✅ `server/route/discount.route.js` - **NEW FILE**
2. ✅ `server/route/coupon.route.js` - **NEW FILE**  
3. ✅ `server/route/giftCard.route.js` - **NEW FILE**
4. ✅ `server/controllers/discount.controller.js` - **NEW FILE**
5. ✅ `server/controllers/coupon.controller.js` - **NEW FILE**
6. ✅ `server/controllers/giftCard.controller.js` - **NEW FILE**
7. ✅ `server/services/discount.service.js` - **NEW FILE**
8. ✅ `server/models/coupon.model.js` - **NEW FILE**
9. ✅ `server/models/giftCard.model.js` - **NEW FILE**
10. ✅ `server/index.js` - **MODIFIED** (route registration)

### **Client Files (Already Deployed):**

- ✅ `client/src/components/DiscountInput/DiscountInput.jsx` - **MODIFIED**
- ✅ `client/src/Pages/Cart/index.jsx` - **MODIFIED**
- ✅ `client/src/Pages/Checkout/index.jsx` - **MODIFIED**

---

## 🔧 Deployment Steps

### **Step 1: Verify All Files Are Committed**

```bash
git status
```

Make sure all new files are committed:
- `server/route/discount.route.js`
- `server/route/coupon.route.js`
- `server/route/giftCard.route.js`
- `server/controllers/discount.controller.js`
- `server/controllers/coupon.controller.js`
- `server/controllers/giftCard.controller.js`
- `server/services/discount.service.js`
- `server/models/coupon.model.js`
- `server/models/giftCard.model.js`

### **Step 2: Push to Repository**

```bash
git add .
git commit -m "Add discount system: coupons, gift cards, and discount calculation"
git push origin main
```

### **Step 3: Deploy to Production**

**If using Render:**
1. Go to Render dashboard
2. Your server service should auto-deploy
3. Wait for deployment to complete
4. Check deployment logs for errors

**If using other platforms:**
- Follow your platform's deployment process
- Ensure all files are uploaded
- Restart the server

### **Step 4: Verify Routes Are Registered**

Check `server/index.js` has these lines (around line 321-323):

```javascript
app.use("/api/coupons", couponRouter);
app.use("/api/gift-cards", giftCardRouter);
app.use("/api/discounts", discountRouter);
```

### **Step 5: Restart Server**

**IMPORTANT:** After deployment, **restart your server** to ensure routes are loaded.

**On Render:**
- Go to your service
- Click "Manual Deploy" → "Deploy latest commit"
- Or restart the service

**On Other Platforms:**
- Restart the Node.js process
- Or redeploy the application

---

## 🧪 Testing After Deployment

### **Test 1: Check Routes Are Available**

```bash
# Test discount route
curl -X POST https://www.zubahouse.com/api/discounts/calculate \
  -H "Content-Type: application/json" \
  -d '{"cartItems":[],"cartTotal":100}'

# Should return JSON (not 405)
```

### **Test 2: Test Coupon Route**

```bash
# Test coupon route
curl -X POST https://www.zubahouse.com/api/coupons/validate \
  -H "Content-Type: application/json" \
  -d '{"code":"TEST"}'

# Should return JSON (not 405)
```

### **Test 3: Test in Browser**

1. Go to your website
2. Add items to cart
3. Try applying a coupon code
4. Should work without 405 errors

---

## 🔍 Troubleshooting

### **Still Getting 405 Errors?**

1. **Check Server Logs:**
   - Look for route registration errors
   - Check if files are being loaded

2. **Verify File Paths:**
   - Ensure all files are in correct directories
   - Check for typos in file names

3. **Check Import Statements:**
   - Verify all imports in `server/index.js` are correct
   - Check for missing dependencies

4. **Verify Route Exports:**
   - All route files should export default router
   - Controllers should export functions correctly

5. **Check Middleware:**
   - Ensure `optionalAuth` middleware exists
   - Verify middleware is working

### **Common Issues:**

**Issue: Routes not found**
- **Solution:** Verify files are deployed and server is restarted

**Issue: Import errors**
- **Solution:** Check all import paths are correct

**Issue: 405 Method Not Allowed**
- **Solution:** Routes aren't registered - restart server

**Issue: 500 Internal Server Error**
- **Solution:** Check server logs for specific error

---

## 📋 Quick Verification Checklist

- [ ] All new files are committed to git
- [ ] Files are pushed to repository
- [ ] Server is deployed/updated
- [ ] Server is restarted
- [ ] Routes are registered in `server/index.js`
- [ ] No errors in server logs
- [ ] Test endpoints return 200 (not 405)
- [ ] Discount system works in browser

---

## 🎯 Expected Behavior After Deployment

### **Before (Current - 405 Errors):**
```
POST /api/discounts/calculate → 405 Method Not Allowed
POST /api/coupons/apply → 405 Method Not Allowed
```

### **After (Fixed - Should Work):**
```
POST /api/discounts/calculate → 200 OK (with discount data)
POST /api/coupons/apply → 200 OK (with coupon data)
POST /api/gift-cards/apply → 200 OK (with gift card data)
```

---

## 🚨 Critical: Server Restart Required

**The most important step is to RESTART your server after deployment.**

Even if files are deployed, the server needs to restart to:
- Load new route files
- Register new routes
- Initialize new models

**Without restarting, you'll continue to get 405 errors.**

---

## 📞 Need Help?

If you're still getting 405 errors after:
1. ✅ Deploying all files
2. ✅ Restarting server
3. ✅ Verifying routes are registered

Check:
- Server deployment logs
- Server runtime logs
- File permissions
- Node.js version compatibility

---

**Once deployed and restarted, the discount system will work perfectly!** 🎉
