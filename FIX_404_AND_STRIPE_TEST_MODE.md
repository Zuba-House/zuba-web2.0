# 🔧 Fix 404 Error & Stripe Test Mode Configuration

## 🎯 **Two Issues to Fix**

1. **404 Error on `/order/failed`** - Vercel routing issue
2. **Stripe Test Mode Not Working** - Key configuration mismatch

---

## ✅ **Fix 1: 404 Error on `/order/failed`**

### **Problem:**
Vercel is showing a 404 error when navigating to `/order/failed` because the route isn't being handled correctly.

### **Solution:**

1. **The `vercel.json` has been updated** - it now includes proper SPA routing
2. **Redeploy your frontend on Vercel:**
   - Go to Vercel Dashboard → Your Frontend Project
   - Click **"Redeploy"** or push a new commit
   - Wait for deployment to complete

3. **Verify the fix:**
   - After redeploy, visit: `https://zuba-web2-0.vercel.app/order/failed`
   - Should show the "Order Failed" page (not 404)

### **If still getting 404 after redeploy:**

1. **Clear browser cache:**
   - Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
   - Clear cached images and files
   - Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)

2. **Check Vercel deployment logs:**
   - Look for any build errors
   - Verify `vercel.json` is included in the build

---

## ✅ **Fix 2: Stripe Test Mode (Sandbox) Configuration**

### **Problem:**
You're not receiving payments in Stripe test mode because:
- **Frontend publishable key** and **backend secret key** don't match (one is test, one is live)
- Or keys are not set correctly in environment variables

### **Solution:**

#### **Step 1: Get Your Stripe Test Keys**

1. **Go to Stripe Dashboard:**
   - Visit: https://dashboard.stripe.com/test/apikeys
   - Make sure you're in **"Test mode"** (toggle in top right)

2. **Get Test Keys:**
   - **Publishable key:** Starts with `pk_test_...`
   - **Secret key:** Starts with `sk_test_...`
   - **Copy both keys**

#### **Step 2: Update Vercel Frontend Environment Variables**

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Select your **frontend project** (zuba-web2-0)
   - Go to **Settings** → **Environment Variables**

2. **Add/Update:**
   ```
   VITE_STRIPE_PUBLIC_KEY=pk_test_YOUR_TEST_PUBLISHABLE_KEY_HERE
   ```
   - Replace with your actual test publishable key
   - Make sure it starts with `pk_test_`

3. **Save and Redeploy:**
   - Click **"Save"**
   - Go to **Deployments** tab
   - Click **"Redeploy"** on the latest deployment

#### **Step 3: Update Render Backend Environment Variables**

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com
   - Select your **backend service**
   - Go to **Environment** tab

2. **Update Stripe Secret Key:**
   ```
   STRIPE_SECRET_KEY=sk_test_YOUR_TEST_SECRET_KEY_HERE
   ```
   - Replace with your actual test secret key
   - Make sure it starts with `sk_test_` (NOT `sk_live_`)

3. **Save and Redeploy:**
   - Click **"Save Changes"**
   - Render will automatically redeploy

#### **Step 4: Verify Key Match**

**IMPORTANT:** Both keys must be from the **same Stripe account** and **same mode** (both test or both live).

**Test keys:**
- Frontend: `pk_test_...`
- Backend: `sk_test_...`

**Live keys (for production):**
- Frontend: `pk_live_...`
- Backend: `sk_live_...`

#### **Step 5: Test Payment Processing**

1. **Test with Stripe test card:**
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

2. **Check Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com/test/payments
   - You should see the test payment

3. **Check Render Logs:**
   - Look for: `[Stripe] Creating PI: ... | testMode: true`
   - Should show `testMode: true` for test keys

---

## 🔍 **How to Verify Configuration**

### **1. Check Frontend Stripe Key:**
```bash
# In browser console (F12), run:
console.log(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
```
Should show: `pk_test_...` (for test mode)

### **2. Check Backend Stripe Key:**
```bash
# Test backend health:
curl https://zuba-api.onrender.com/api/stripe/health
```
Should return: `{"ok": true, "configured": true, "livemode": false}`

The `livemode: false` means you're using test keys.

### **3. Check Key Match:**
The frontend component automatically checks if keys match. Open browser console and look for:
- `[Stripe Debug] Publishable key prefix: pk_test`
- `[Stripe Debug] Server key prefix: sk_test`
- If they don't match, you'll see a warning

---

## 📋 **Environment Variables Checklist**

### **Vercel (Frontend):**
- [ ] `VITE_STRIPE_PUBLIC_KEY` = `pk_test_...` (for test mode)
- [ ] `VITE_API_URL` = `https://zuba-api.onrender.com`

### **Render (Backend):**
- [ ] `STRIPE_SECRET_KEY` = `sk_test_...` (for test mode)
- [ ] `CURRENCY` = `USD` (optional)
- [ ] `STRIPE_CURRENCY` = `USD` (optional)

---

## 🚨 **Common Issues**

### **Issue 1: "Payment processing unavailable"**
**Cause:** Stripe key not set or invalid
**Fix:** 
- Check `STRIPE_SECRET_KEY` is set in Render
- Verify key starts with `sk_test_` (test) or `sk_live_` (live)
- Check key is not expired

### **Issue 2: "Key mismatch" warning**
**Cause:** Frontend and backend keys are from different modes
**Fix:**
- Frontend: `pk_test_...` → Backend: `sk_test_...` ✅
- Frontend: `pk_live_...` → Backend: `sk_live_...` ✅
- Frontend: `pk_test_...` → Backend: `sk_live_...` ❌ (MISMATCH!)

### **Issue 3: Payments not showing in Stripe Dashboard**
**Cause:** Using test keys but checking live dashboard (or vice versa)
**Fix:**
- Test keys → Check: https://dashboard.stripe.com/test/payments
- Live keys → Check: https://dashboard.stripe.com/payments
- Toggle "Test mode" in Stripe Dashboard top right

### **Issue 4: Still getting 404 after redeploy**
**Cause:** Browser cache or Vercel build issue
**Fix:**
- Clear browser cache
- Hard refresh: `Ctrl + Shift + R`
- Check Vercel deployment logs
- Verify `vercel.json` is in the `client` folder

---

## ✅ **Testing Checklist**

After configuration:

- [ ] Frontend redeployed on Vercel
- [ ] Backend redeployed on Render
- [ ] `VITE_STRIPE_PUBLIC_KEY` set in Vercel (test key)
- [ ] `STRIPE_SECRET_KEY` set in Render (test key)
- [ ] Both keys are from same Stripe account
- [ ] Both keys are test mode (`pk_test_` and `sk_test_`)
- [ ] `/order/failed` route works (no 404)
- [ ] Test payment with card `4242 4242 4242 4242` works
- [ ] Payment appears in Stripe test dashboard
- [ ] No key mismatch warnings in browser console

---

## 🎯 **Quick Test**

1. **Place a test order:**
   - Go to checkout
   - Use test card: `4242 4242 4242 4242`
   - Complete payment

2. **Verify:**
   - Order is created successfully
   - Redirects to `/order/success` (not `/order/failed`)
   - Payment appears in Stripe test dashboard
   - No 404 errors

---

## 📞 **Still Having Issues?**

1. **Check Browser Console:**
   - Look for Stripe errors
   - Check for key mismatch warnings

2. **Check Render Logs:**
   - Look for Stripe API errors
   - Check for key validation errors

3. **Test Stripe Health:**
   ```bash
   curl https://zuba-api.onrender.com/api/stripe/health
   ```

4. **Verify Environment Variables:**
   - Double-check keys are set correctly
   - Make sure no extra spaces or quotes

---

## 🎉 **Expected Result**

After fixing:
- ✅ `/order/failed` route works (no 404)
- ✅ `/order/success` route works
- ✅ Stripe test payments work
- ✅ Payments appear in Stripe test dashboard
- ✅ Orders are created successfully

---

**Remember:** 
- **Test mode:** Use `pk_test_` and `sk_test_` keys
- **Live mode:** Use `pk_live_` and `sk_live_` keys
- **Both keys must match** (same account, same mode)

