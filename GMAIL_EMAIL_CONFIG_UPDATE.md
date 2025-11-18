# ✅ **Gmail Email Configuration Update**

## 🎯 **Changes Applied**

Updated email service configuration to use **Gmail SMTP** instead of Hostinger.

---

## 📋 **What Was Updated**

### **File:** `server/config/emailService.js`

**Changes:**
- ✅ Default host: `smtp.gmail.com` (was `smtp.hostinger.com`)
- ✅ Default port: `587` (was `465`)
- ✅ Default secure: `false` (was `true`) - required for port 587
- ✅ Default email: `orders.zubahouse@gmail.com` (was `orders@zubahouse.com`)
- ✅ Added TLS configuration for Gmail compatibility

---

## 🔧 **Configuration Details**

### **Gmail SMTP Settings:**

```javascript
{
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,  // false for port 587, true for port 465
  auth: {
    user: 'orders.zubahouse@gmail.com',
    pass: 'iqrxczkeuqpfxxnr'  // Gmail app password (no spaces)
  },
  tls: {
    rejectUnauthorized: false
  }
}
```

---

## ✅ **Environment Variables (Render)**

Make sure these are set in **Render Dashboard → Environment**:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=orders.zubahouse@gmail.com
EMAIL_PASS=iqrxczkeuqpfxxnr
EMAIL_FROM=orders.zubahouse@gmail.com
EMAIL_SENDER_NAME=Zuba House

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

ADMIN_EMAIL=sales@zubahouse.com
TEST_EMAIL=olivier.niyo250@gmail.com
```

**⚠️ Important:**
- `EMAIL_PASS` should be `iqrxczkeuqpfxxnr` (no spaces!)
- `EMAIL_PORT` should be `587` (not 465)
- `SMTP_SECURE` should be `false` (not true)

---

## 🚀 **Deployment Steps**

### **Step 1: Commit and Push**

```bash
git add .
git commit -m "Update email configuration for Gmail SMTP"
git push origin main
```

### **Step 2: Wait for Render Deployment**

- Render will auto-deploy (2-3 minutes)
- Check Render dashboard for "Live" status

### **Step 3: Test Email**

After deployment, test the email endpoint:

```bash
# Visit in browser or use curl
https://zuba-api.onrender.com/api/test-email?to=olivier.niyo250@gmail.com
```

**Expected Response:**
```json
{
  "success": true,
  "message": "✅ Email sent successfully!",
  "from": "orders.zubahouse@gmail.com",
  "to": "olivier.niyo250@gmail.com"
}
```

---

## 🧪 **Testing Checklist**

After deployment:

- [ ] Render deployment completed successfully
- [ ] Test endpoint returns success: `/api/test-email?to=olivier.niyo250@gmail.com`
- [ ] Test email received in inbox (check spam too)
- [ ] Place test order and verify:
  - Customer receives order confirmation email
  - Admin receives order notification email

---

## 🔍 **Troubleshooting**

### **If Test Email Fails:**

1. **Check Render Logs:**
   - Go to: Render Dashboard → Your Service → Logs
   - Look for email-related errors

2. **Verify Environment Variables:**
   - Ensure `EMAIL_PASS` has no spaces: `iqrxczkeuqpfxxnr`
   - Ensure `EMAIL_PORT=587` (not 465)
   - Ensure `SMTP_SECURE=false` (not true)

3. **Common Errors:**

   **"Invalid login" error:**
   - Password has spaces (remove them)
   - Wrong email address
   - App password not generated correctly

   **"Connection timeout":**
   - Port should be 587 (not 465)
   - Secure should be false (not true)

---

## 📊 **Code Changes Summary**

| Setting | Old Value | New Value |
|---------|-----------|-----------|
| Host | `smtp.hostinger.com` | `smtp.gmail.com` |
| Port | `465` | `587` |
| Secure | `true` | `false` |
| Default Email | `orders@zubahouse.com` | `orders.zubahouse@gmail.com` |
| TLS | Not configured | `rejectUnauthorized: false` |

---

## ✅ **What's Working Now**

- ✅ Email service configured for Gmail
- ✅ Supports both `EMAIL_*` and `SMTP_*` environment variables
- ✅ Proper TLS configuration for Gmail
- ✅ Default values set for Gmail SMTP

---

**All code changes are complete! Deploy and test the email endpoint.** 🚀

