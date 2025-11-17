# 📧 Email Sender Configuration Guide - Zuba House

## ✅ **YES, YOU CAN UPDATE IT!**

You can easily change the sender email address from your personal Gmail to a professional email like `orders@zubahouse.com` or `sales@zubahouse.com`.

---

## 🔍 **CURRENT CONFIGURATION**

**Current Setup:**
- **Sender Email:** `olivier.niyo250@gmail.com` (from `.env` file)
- **SMTP Server:** Gmail (`smtp.gmail.com`)
- **Configuration File:** `server/config/emailService.js`

**How It Works:**
```javascript
// server/config/emailService.js
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,        // ← Your email address
    pass: process.env.EMAIL_PASS,   // ← Your email password/app password
  },
});

// Sender address is set from:
from: process.env.EMAIL  // ← This is what customers see as "From"
```

---

## 🎯 **YOUR OPTIONS**

### **Option 1: Use Custom Domain Email (RECOMMENDED) ✅**

If you have `zubahouse.com` domain with email hosting:

**Requirements:**
- Email hosting set up for `zubahouse.com`
- Email account created: `orders@zubahouse.com` or `sales@zubahouse.com`
- SMTP credentials from your email provider

**Steps:**

1. **Create Email Account:**
   - Log into your domain/hosting control panel
   - Create email: `orders@zubahouse.com` or `sales@zubahouse.com`
   - Set a secure password

2. **Get SMTP Settings:**
   - Check your email provider's SMTP settings
   - Common providers:
     - **cPanel/WHM:** Usually `mail.zubahouse.com` or `smtp.zubahouse.com`
     - **Google Workspace:** `smtp.gmail.com` (port 465)
     - **Microsoft 365:** `smtp.office365.com` (port 587)
     - **Other providers:** Check their documentation

3. **Update `.env` File:**
   ```env
   # Email Configuration
   EMAIL=orders@zubahouse.com
   EMAIL_PASS=your_email_password_here
   ```

4. **Update SMTP Settings (if needed):**
   - If your email provider is NOT Gmail, update `server/config/emailService.js`:
   ```javascript
   const transporter = nodemailer.createTransport({
     host: 'smtp.zubahouse.com',  // ← Your email provider's SMTP
     port: 465,                     // ← Usually 465 (SSL) or 587 (TLS)
     secure: true,                  // ← true for 465, false for 587
     auth: {
       user: process.env.EMAIL,
       pass: process.env.EMAIL_PASS,
     },
   });
   ```

5. **Restart Server:**
   ```bash
   # Stop server (Ctrl+C)
   # Start again
   npm run dev
   ```

**✅ Advantages:**
- Professional email address
- Brand consistency
- Better deliverability
- More trustworthy

---

### **Option 2: Create Professional Gmail Account (EASIEST) ✅**

If you don't have email hosting yet:

**Steps:**

1. **Create New Gmail Account:**
   - Go to: https://accounts.google.com/signup
   - Create: `zubahouse.orders@gmail.com` or `zubahouse.sales@gmail.com`
   - Use a strong password

2. **Enable 2-Step Verification:**
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification (required for App Password)

3. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it: "Zuba House Server"
   - Copy the 16-character password (you'll need this)

4. **Update `.env` File:**
   ```env
   # Email Configuration
   EMAIL=zubahouse.orders@gmail.com
   EMAIL_PASS=xxxx xxxx xxxx xxxx  # ← The 16-character App Password
   ```

5. **No Code Changes Needed:**
   - Gmail SMTP settings are already configured
   - Just update `.env` and restart server

6. **Restart Server:**
   ```bash
   npm run dev
   ```

**✅ Advantages:**
- Quick setup (5 minutes)
- Free
- Reliable Gmail infrastructure
- Still looks professional

**⚠️ Note:**
- Email will show as: `zubahouse.orders@gmail.com`
- Not as professional as `orders@zubahouse.com` but still good

---

### **Option 3: Use Google Workspace (BEST) ✅**

If you want `orders@zubahouse.com` with Gmail infrastructure:

**Steps:**

1. **Sign Up for Google Workspace:**
   - Go to: https://workspace.google.com/
   - Choose a plan (starts at $6/month)
   - Verify your domain `zubahouse.com`

2. **Create Email Account:**
   - Create `orders@zubahouse.com` in Google Workspace admin

3. **Get App Password:**
   - Same as Option 2, but for the Workspace account

4. **Update `.env` File:**
   ```env
   EMAIL=orders@zubahouse.com
   EMAIL_PASS=your_workspace_app_password
   ```

5. **SMTP Settings:**
   - Use Gmail SMTP (already configured)
   - `smtp.gmail.com` works with Google Workspace

**✅ Advantages:**
- Professional `@zubahouse.com` email
- Gmail reliability
- Full Google Workspace features
- Best of both worlds

---

## 📝 **STEP-BY-STEP: UPDATE YOUR .ENV FILE**

**Location:** `server/.env`

**Current:**
```env
EMAIL=olivier.niyo250@gmail.com
EMAIL_PASS=your_current_app_password
```

**Update To (Option 1 - Custom Domain):**
```env
EMAIL=orders@zubahouse.com
EMAIL_PASS=your_email_password
```

**Update To (Option 2 - Professional Gmail):**
```env
EMAIL=zubahouse.orders@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
EMAIL_SENDER_NAME=Zuba House
```

**Update To (Option 3 - Google Workspace):**
```env
EMAIL=orders@zubahouse.com
EMAIL_PASS=your_workspace_app_password
EMAIL_SENDER_NAME=Zuba House
```

**Note:** `EMAIL_SENDER_NAME` is optional. If not set, defaults to "Zuba House". This is the display name customers see (e.g., "Zuba House <orders@zubahouse.com>").

---

## 🔧 **UPDATING SMTP SETTINGS (If Needed)**

**File:** `server/config/emailService.js`

**Current (Gmail):**
```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  // ...
});
```

**For Custom Domain Email (if not Gmail):**
```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.zubahouse.com',  // ← Your email provider's SMTP
  port: 465,                    // ← Check your provider's docs
  secure: true,                 // ← true for 465, false for 587
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});
```

**Common SMTP Settings:**

| Provider | Host | Port | Secure |
|----------|------|------|--------|
| Gmail | smtp.gmail.com | 465 | true |
| Google Workspace | smtp.gmail.com | 465 | true |
| Microsoft 365 | smtp.office365.com | 587 | false |
| cPanel/WHM | mail.yourdomain.com | 465 | true |
| Zoho | smtp.zoho.com | 465 | true |

---

## ✅ **VERIFICATION CHECKLIST**

After updating:

- [ ] Updated `.env` file with new email
- [ ] Updated `.env` file with new password/app password
- [ ] Updated SMTP settings (if using non-Gmail provider)
- [ ] Restarted server
- [ ] Tested by placing a test order
- [ ] Verified email received from new address
- [ ] Checked spam folder (first email might go there)

---

## 🧪 **TESTING**

1. **Place a Test Order:**
   - Go to your website
   - Add product to cart
   - Complete checkout
   - Check customer email inbox

2. **Verify Sender:**
   - Email should show "From: orders@zubahouse.com" (or your chosen email)
   - Not "From: olivier.niyo250@gmail.com"

3. **Check Admin Email:**
   - Admin notification should also use new sender
   - Check `sales@zubahouse.com` inbox (if configured)

---

## ⚠️ **IMPORTANT NOTES**

### **Gmail App Passwords:**
- **Required** if using Gmail or Google Workspace
- Regular password won't work
- Generate at: https://myaccount.google.com/apppasswords
- Format: `xxxx xxxx xxxx xxxx` (16 characters, spaces optional)

### **Email Deliverability:**
- First emails might go to spam (normal)
- Add SPF/DKIM records for better deliverability (if custom domain)
- Warm up new email account by sending a few test emails

### **Security:**
- Never commit `.env` file to Git
- Use App Passwords, not regular passwords
- Rotate passwords regularly

---

## 🆘 **TROUBLESHOOTING**

### **Error: "Invalid login"**
- Check email address is correct
- Verify password/app password is correct
- For Gmail: Make sure you're using App Password, not regular password

### **Error: "Connection timeout"**
- Check SMTP host is correct
- Verify port number (465 or 587)
- Check firewall/network settings

### **Emails Not Sending:**
- Check server logs for errors
- Verify `.env` file is in `server/` directory
- Restart server after changing `.env`
- Test SMTP connection

### **Emails Going to Spam:**
- Normal for new email addresses
- Add SPF/DKIM records (for custom domain)
- Warm up email account
- Ask recipients to mark as "Not Spam"

---

## 📋 **QUICK REFERENCE**

**Files to Update:**
1. `server/.env` - Email credentials
2. `server/config/emailService.js` - SMTP settings (if needed)

**Environment Variables:**
- `EMAIL` - Sender email address (required)
- `EMAIL_PASS` - Email password/app password (required)
- `EMAIL_SENDER_NAME` - Display name for sender (optional, defaults to "Zuba House")

**What Customers See:**
- "From: orders@zubahouse.com" (or your chosen email)
- Subject: "Order Confirmation - Zuba House"

---

## 🎯 **RECOMMENDATION**

**For Quick Setup (Today):**
→ **Option 2:** Create `zubahouse.orders@gmail.com`
- Takes 5 minutes
- Free
- Works immediately

**For Professional Setup (Best):**
→ **Option 3:** Google Workspace with `orders@zubahouse.com`
- Most professional
- Best deliverability
- Full features

**For Custom Setup:**
→ **Option 1:** Use your existing email hosting
- If you already have email hosting
- Most cost-effective if already paying

---

## ✅ **SUMMARY**

**YES, you can update the sender email!**

**Easiest Way:**
1. Create `zubahouse.orders@gmail.com`
2. Get App Password
3. Update `.env` file
4. Restart server
5. Done! ✅

**Most Professional:**
1. Get Google Workspace
2. Create `orders@zubahouse.com`
3. Get App Password
4. Update `.env` file
5. Restart server
6. Done! ✅

**No code changes needed** if using Gmail/Google Workspace (already configured)!

---

**Last Updated:** 2024  
**Status:** Ready to Use

