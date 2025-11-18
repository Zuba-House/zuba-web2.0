# 🔑 How to Update Stripe Publishable Key in Vercel

## 📍 **Quick Steps**

### **Step 1: Get Your Stripe Publishable Key**

1. **Go to Stripe Dashboard:**
   - Visit: https://dashboard.stripe.com/test/apikeys
   - **Make sure you're in TEST mode** (toggle switch in top right)

2. **Find Your Publishable Key:**
   - Look for **"Publishable key"** (starts with `pk_test_...` for test mode)
   - Click **"Reveal test key"** or **"Reveal live key"** to see the full key
   - **Copy the entire key** (it will look like: `pk_test_51AbC123...`)

---

### **Step 2: Update in Vercel Dashboard**

#### **Option A: Via Vercel Dashboard (Recommended)**

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Login to your account

2. **Select Your Frontend Project:**
   - Click on your project: **zuba-web2-0** (or your frontend project name)

3. **Go to Settings:**
   - Click **"Settings"** tab (top navigation)

4. **Go to Environment Variables:**
   - Click **"Environment Variables"** in the left sidebar

5. **Add/Update the Key:**
   - **If key doesn't exist:**
     - Click **"Add New"** button
     - **Key:** `VITE_STRIPE_PUBLIC_KEY`
     - **Value:** `pk_test_YOUR_KEY_HERE` (paste your full publishable key)
     - **Environment:** Select all (Production, Preview, Development)
     - Click **"Save"**

   - **If key already exists:**
     - Find `VITE_STRIPE_PUBLIC_KEY` in the list
     - Click the **three dots (⋯)** on the right
     - Click **"Edit"**
     - Update the **Value** field with your new key
     - Click **"Save"**

6. **Redeploy:**
   - Go to **"Deployments"** tab
   - Click the **three dots (⋯)** on the latest deployment
   - Click **"Redeploy"**
   - Or push a new commit to trigger auto-deploy

---

#### **Option B: Via Vercel CLI**

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Link your project:**
   ```bash
   cd client
   vercel link
   ```

4. **Set environment variable:**
   ```bash
   vercel env add VITE_STRIPE_PUBLIC_KEY
   ```
   - When prompted, paste your publishable key
   - Select environments: Production, Preview, Development

5. **Redeploy:**
   ```bash
   vercel --prod
   ```

---

### **Step 3: Verify the Update**

1. **Check in Vercel Dashboard:**
   - Go to: Settings → Environment Variables
   - Verify `VITE_STRIPE_PUBLIC_KEY` shows your key (masked)

2. **Check in Browser Console:**
   - After redeploy, visit your site
   - Open browser console (F12)
   - Run:
     ```javascript
     console.log(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
     ```
   - Should show your publishable key (starts with `pk_test_` or `pk_live_`)

3. **Check Stripe Debug Log:**
   - In browser console, look for:
     ```
     [Stripe Debug] Publishable key prefix: pk_test
     ```
   - Should match your key type

---

## 🎯 **Important Notes**

### **Test Mode vs Live Mode:**

**For Testing (Development):**
```
VITE_STRIPE_PUBLIC_KEY=pk_test_51AbC123...
```

**For Production (Live):**
```
VITE_STRIPE_PUBLIC_KEY=pk_live_51AbC123...
```

### **Key Matching:**

Your **frontend publishable key** must match your **backend secret key**:

- ✅ **Test Mode:**
  - Frontend: `pk_test_...`
  - Backend: `sk_test_...`

- ✅ **Live Mode:**
  - Frontend: `pk_live_...`
  - Backend: `sk_live_...`

- ❌ **Mismatch (Won't Work):**
  - Frontend: `pk_test_...`
  - Backend: `sk_live_...`

---

## 🔍 **Troubleshooting**

### **Issue 1: Key Not Updating After Redeploy**

**Solution:**
1. Clear browser cache: `Ctrl + Shift + Delete`
2. Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
3. Check Vercel deployment logs for build errors

### **Issue 2: "Stripe not initialized" Error**

**Solution:**
1. Verify key is set in Vercel environment variables
2. Check key starts with `pk_test_` or `pk_live_`
3. Make sure no extra spaces or quotes in the value
4. Redeploy after updating

### **Issue 3: Key Mismatch Warning**

**Solution:**
1. Check frontend key: `pk_test_...` or `pk_live_...`
2. Check backend key: `sk_test_...` or `sk_live_...`
3. Both must be same mode (both test or both live)
4. Both must be from same Stripe account

---

## 📋 **Quick Checklist**

- [ ] Got publishable key from Stripe Dashboard
- [ ] Key starts with `pk_test_` (test) or `pk_live_` (live)
- [ ] Added/updated `VITE_STRIPE_PUBLIC_KEY` in Vercel
- [ ] Selected all environments (Production, Preview, Development)
- [ ] Redeployed frontend on Vercel
- [ ] Verified key in browser console
- [ ] Backend secret key matches (same mode)
- [ ] Test payment works

---

## 🎯 **Where to Get Keys**

### **Test Keys:**
- URL: https://dashboard.stripe.com/test/apikeys
- Toggle: **"Test mode"** ON (top right)

### **Live Keys:**
- URL: https://dashboard.stripe.com/apikeys
- Toggle: **"Test mode"** OFF (top right)

---

## 💡 **Pro Tips**

1. **Use Test Keys for Development:**
   - Always use `pk_test_...` during development
   - Switch to `pk_live_...` only for production

2. **Keep Keys Secure:**
   - Never commit keys to GitHub
   - Always use environment variables
   - Rotate keys if exposed

3. **Verify After Update:**
   - Always test after updating keys
   - Check browser console for errors
   - Test with Stripe test card: `4242 4242 4242 4242`

---

## 🆘 **Need Help?**

If you're stuck:

1. **Check Vercel Logs:**
   - Go to: Deployments → Latest → View Function Logs

2. **Check Browser Console:**
   - Look for Stripe initialization errors
   - Check for key mismatch warnings

3. **Test Stripe Connection:**
   ```bash
   # In browser console:
   console.log('Stripe Key:', import.meta.env.VITE_STRIPE_PUBLIC_KEY);
   ```

---

**That's it!** After updating the key and redeploying, your Stripe integration should work correctly. 🎉

