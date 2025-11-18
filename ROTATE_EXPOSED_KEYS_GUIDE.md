# 🔐 **CRITICAL: Rotate Exposed API Keys - Complete Guide**

## ⚠️ **URGENT: Your API Keys Were Exposed**

You received security alerts because:
- **Stripe secret key** (`sk_live_***gmKwt`) was exposed on GitHub
- **Cloudinary API keys** were exposed on GitHub
- Stripe will **automatically expire** your key in 48 hours if not rotated

---

## 🚨 **IMMEDIATE ACTIONS (Do This First!)**

### **Step 1: Rotate Stripe Secret Key (CRITICAL - Do This NOW)**

1. **Go to Stripe Dashboard:**
   - Visit: https://dashboard.stripe.com/apikeys
   - Login to your account: **ZUBAHOUSE** (Account ID: `acct_1R55aeLdeXRbv8XS`)

2. **Revoke the Exposed Key:**
   - Find the key ending in `...gmKwt`
   - Click **"Reveal"** to see the full key
   - Click **"Delete"** or **"Revoke"** to disable it immediately

3. **Create a New Secret Key:**
   - Click **"Create secret key"**
   - Give it a name: `Zuba House Production - Rotated [Date]`
   - Copy the new key (starts with `sk_live_...`)

4. **Update Render Environment Variables:**
   - Go to: Render Dashboard → Your Service → Environment
   - Find: `STRIPE_SECRET_KEY`
   - **Delete** the old value
   - **Add** the new key value
   - Click **"Save Changes"**
   - **Redeploy** your service

5. **Verify the New Key Works:**
   - After redeploy, test: `https://zuba-api.onrender.com/api/stripe/health`
   - Should return: `{"ok": true, "configured": true, ...}`

---

### **Step 2: Rotate Cloudinary Keys**

1. **Go to Cloudinary Dashboard:**
   - Visit: https://cloudinary.com/console
   - Login to your account

2. **Regenerate API Secret:**
   - Go to: Settings → Security
   - Find: **API Secret**
   - Click **"Regenerate"**
   - **Copy the new secret** (you won't see it again!)

3. **Update Render Environment Variables:**
   - Update: `cloudinary_Config_api_secret`
   - Keep: `cloudinary_Config_Cloud_Name` and `cloudinary_Config_api_key` (these are usually safe)

4. **Redeploy** your service

---

### **Step 3: Remove Keys from GitHub History**

**⚠️ IMPORTANT:** Even if you delete the file, the keys are still in Git history!

1. **Check for exposed keys in your repo:**
   ```bash
   # Search for Stripe keys
   git log --all --full-history --source -S "sk_live_" -- "*.env*" "*.js" "*.json"
   
   # Search for Cloudinary keys
   git log --all --full-history --source -S "cloudinary" -- "*.env*" "*.js" "*.json"
   ```

2. **Remove sensitive files from Git history:**
   ```bash
   # Install git-filter-repo (if not installed)
   pip install git-filter-repo
   
   # Remove .env files from history
   git filter-repo --path .env --invert-paths
   git filter-repo --path server/.env --invert-paths
   git filter-repo --path client/.env --invert-paths
   ```

3. **Force push (WARNING: This rewrites history!):**
   ```bash
   git push origin --force --all
   ```

4. **Alternative: Use BFG Repo-Cleaner:**
   ```bash
   # Download BFG: https://rtyley.github.io/bfg-repo-cleaner/
   java -jar bfg.jar --replace-text passwords.txt
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   ```

---

## 📋 **Environment Variables to Update in Render**

Go to **Render Dashboard** → **Your Service** → **Environment** tab:

### **Stripe (REQUIRED - Update Now!)**
```
STRIPE_SECRET_KEY=sk_live_YOUR_NEW_KEY_HERE
```

### **Cloudinary (Update if exposed)**
```
cloudinary_Config_Cloud_Name=your_cloud_name
cloudinary_Config_api_key=your_api_key
cloudinary_Config_api_secret=YOUR_NEW_SECRET_HERE
```

---

## ✅ **Verification Steps**

After updating keys, verify everything works:

1. **Test Stripe Health:**
   ```bash
   curl https://zuba-api.onrender.com/api/stripe/health
   ```
   Should return: `{"ok": true, "configured": true}`

2. **Test Stripe Account Info:**
   ```bash
   curl https://zuba-api.onrender.com/api/stripe/account-info
   ```
   Should return account details (not errors)

3. **Test Order Creation:**
   - Try placing a test order on your frontend
   - Check Render logs for any Stripe errors
   - Verify payment processes successfully

4. **Check Render Logs:**
   - Look for: `[Stripe] Initialized with key: sk_live_...`
   - No errors about invalid keys

---

## 🔒 **Prevent Future Exposures**

### **1. Use .gitignore (CRITICAL!)**

Make sure your `.gitignore` includes:
```
# Environment variables
.env
.env.local
.env.production
.env.development
*.env
server/.env
client/.env
admin/.env

# API keys
**/secrets/
**/keys/
*.key
*.pem
```

### **2. Never Commit Secrets**

**❌ NEVER DO THIS:**
```javascript
// BAD - Don't commit secrets!
const stripeKey = "sk_live_1234567890";
```

**✅ ALWAYS DO THIS:**
```javascript
// GOOD - Use environment variables
const stripeKey = process.env.STRIPE_SECRET_KEY;
```

### **3. Use Environment Variables Only**

- ✅ Store secrets in Render environment variables
- ✅ Use `.env` files locally (and add to `.gitignore`)
- ❌ Never commit `.env` files
- ❌ Never hardcode secrets in code

### **4. Regular Security Audits**

- Use tools like **GitGuardian** (you're already using it!)
- Set up alerts for secret exposures
- Review code before committing
- Use pre-commit hooks to scan for secrets

---

## 🆘 **If Keys Are Already Expired**

If Stripe already expired your key:

1. **Check Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com/apikeys
   - Look for expired/revoked keys

2. **Create New Key:**
   - Follow Step 1 above to create a new key

3. **Update Render:**
   - Update `STRIPE_SECRET_KEY` environment variable
   - Redeploy service

4. **Test Immediately:**
   - Verify payment processing works
   - Check for any errors in logs

---

## 📞 **Need Help?**

If you're stuck:

1. **Check Render Logs:**
   - Look for Stripe authentication errors
   - Check for "invalid API key" messages

2. **Test Stripe Connection:**
   ```bash
   curl https://zuba-api.onrender.com/api/stripe/health
   ```

3. **Contact Support:**
   - Stripe Support: https://support.stripe.com
   - Render Support: https://render.com/docs

---

## ✅ **Checklist**

- [ ] Stripe secret key rotated in Stripe Dashboard
- [ ] New Stripe key added to Render environment variables
- [ ] Cloudinary API secret regenerated
- [ ] New Cloudinary secret added to Render
- [ ] Service redeployed on Render
- [ ] Stripe health check passes (`/api/stripe/health`)
- [ ] Test order placed successfully
- [ ] `.env` files added to `.gitignore`
- [ ] Git history cleaned (optional but recommended)
- [ ] No more security alerts from GitGuardian

---

## 🎯 **Expected Timeline**

- **Immediate (0-1 hour):** Rotate keys, update Render, redeploy
- **Within 24 hours:** Clean Git history, verify everything works
- **Ongoing:** Monitor for new exposures, keep keys secure

---

**🚨 Remember: Stripe will expire your key in 48 hours if you don't rotate it!**

**Do this NOW before your payment processing stops working!**

