# 🔧 **Gmail Connection Timeout Fix**

## 🚨 **Issue Identified**

Connection timeout when trying to connect to Gmail SMTP from Render.

**Error:** `ETIMEDOUT` - Connection timeout

**Possible Causes:**
1. Render firewall blocking outbound SMTP connections on port 587
2. Gmail rate limiting or blocking connections
3. Network latency issues
4. Timeout settings too low

---

## ✅ **Fixes Applied**

### **Fix #1: Increased Timeout Settings**

**File:** `server/config/emailService.js`

**Changes:**
- ✅ `connectionTimeout`: 10s → 20s
- ✅ `greetingTimeout`: 5s → 10s
- ✅ `socketTimeout`: 10s → 20s

**Why:** Gmail SMTP can be slower, especially from cloud platforms like Render.

---

### **Fix #2: Updated Test Route**

**File:** `server/route/test.route.js`

**Changes:**
- ✅ Removed fallback transporter with Hostinger settings
- ✅ Now uses only the configured transporter from `emailService.js`
- ✅ Added timeout wrapper for verification (15 seconds)
- ✅ Updated error messages for Gmail-specific issues
- ✅ Removed hardcoded Hostinger references

---

### **Fix #3: Better Error Handling**

**Changes:**
- ✅ More specific troubleshooting messages for Gmail
- ✅ Added `ECONNREFUSED` error handling
- ✅ Updated all error messages to reference Gmail instead of Hostinger

---

## 🔍 **Troubleshooting Steps**

### **If Still Getting Timeout:**

#### **Option 1: Check Render Firewall**

Render might be blocking outbound SMTP. Check:
1. Render Dashboard → Your Service → Settings
2. Look for firewall/network settings
3. Ensure port 587 is allowed for outbound connections

#### **Option 2: Try Port 465 (SSL)**

If port 587 is blocked, try using port 465 with SSL:

**Update Render Environment:**
```
EMAIL_PORT=465
SMTP_PORT=465
SMTP_SECURE=true
EMAIL_SECURE=true
```

**Note:** This requires updating the transporter to use `secure: true`.

#### **Option 3: Use Gmail OAuth2**

For more reliable connections, consider using Gmail OAuth2 instead of app passwords:
- More secure
- Less likely to be blocked
- Better for production

#### **Option 4: Use Email Service Provider**

Consider using a dedicated email service:
- **SendGrid** (free tier: 100 emails/day)
- **Mailgun** (free tier: 5,000 emails/month)
- **AWS SES** (very cheap, reliable)
- **Resend** (modern, developer-friendly)

---

## 🚀 **Deployment Steps**

### **Step 1: Commit and Push**

```bash
git add .
git commit -m "Fix Gmail connection timeout - increase timeouts and update test route"
git push origin main
```

### **Step 2: Wait for Render Deployment**

- Render will auto-deploy (2-3 minutes)
- Check Render dashboard for "Live" status

### **Step 3: Test Again**

After deployment, test the email endpoint:

```
https://zuba-api.onrender.com/api/test-email?to=olivier.niyo250@gmail.com
```

---

## 📊 **Expected Results**

### **Success:**
```json
{
  "success": true,
  "message": "✅ Email sent successfully!",
  "config": {...},
  "emailSent": "...",
  "recipient": "olivier.niyo250@gmail.com"
}
```

### **If Still Timeout:**

The issue is likely **Render's firewall blocking port 587**. Solutions:

1. **Contact Render Support** - Ask them to allow outbound SMTP on port 587
2. **Switch to Port 465** - Update environment variables (see Option 2 above)
3. **Use Email Service Provider** - More reliable than direct SMTP

---

## 🔄 **Alternative: Use Port 465 (SSL)**

If port 587 continues to timeout, update to use port 465:

**Render Environment Variables:**
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=orders.zubahouse@gmail.com
EMAIL_PASS=iqrxczkeuqpfxxnr
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
EMAIL_SECURE=true
```

**Then update code:**
```javascript
// In emailService.js, the secure flag will be true when SMTP_SECURE=true
// This should work with port 465
```

---

## 📋 **Files Changed**

| File | Changes | Status |
|------|---------|--------|
| `server/config/emailService.js` | Increased timeouts (20s) | ✅ Fixed |
| `server/route/test.route.js` | Removed Hostinger fallback, updated errors | ✅ Fixed |

---

## ✅ **Next Steps**

1. **Deploy the changes**
2. **Test the endpoint again**
3. **If still timing out:**
   - Check Render logs for more details
   - Try port 465 instead
   - Consider using an email service provider

---

**The timeout settings have been increased. If it still fails, the issue is likely Render's firewall blocking port 587.** 🔥

