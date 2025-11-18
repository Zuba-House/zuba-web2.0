# 🔍 EMAIL DIAGNOSTIC GUIDE - OTP & Order Status Emails

## **Is it Code or Email Provider Issue?**

Most email sending issues are **email provider/configuration problems**, not code issues. Let's diagnose step by step.

---

## ✅ **STEP 1: Test Email Service Directly**

### **Test Endpoint Available:**

Your server already has a test endpoint! Visit:

```
https://your-render-backend-url.onrender.com/test-email
```

**Or if local:**
```
http://localhost:5000/test-email
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "Email sent successfully!",
  "messageId": "...",
  "from": "Zuba House <orders@zubahouse.com>",
  "to": "olivier.niyo250@gmail.com"
}
```

**Expected Response (Failure):**
```json
{
  "success": false,
  "message": "Failed to send test email",
  "error": "Error details here"
}
```

---

## 🔧 **STEP 2: Check Environment Variables in Render**

### **Go to Render Dashboard:**

1. **Open your Render service** → **Environment** tab
2. **Verify these variables exist:**

```env
EMAIL=orders@zubahouse.com
EMAIL_PASS=YourPasswordHere
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
EMAIL_SENDER_NAME=Zuba House
```

### **Common Issues:**

❌ **EMAIL not set** → Emails won't send  
❌ **EMAIL_PASS wrong** → Authentication fails  
❌ **SMTP_PORT wrong** → Connection fails  
❌ **SMTP_SECURE wrong** → SSL/TLS issues  

---

## 📧 **STEP 3: Verify Hostinger Email Account**

### **Check Hostinger Email Settings:**

1. **Login to Hostinger** → **Email** section
2. **Verify email account exists:**
   - `orders@zubahouse.com` should be active
   - Account should not be suspended
   - Check email quota/limits

3. **Verify email password:**
   - Use the **exact password** for `orders@zubahouse.com`
   - Not your Hostinger account password
   - Password should match `EMAIL_PASS` in Render

### **Hostinger SMTP Settings (Correct):**

```
SMTP Server: smtp.hostinger.com
Port: 465 (SSL) or 587 (TLS)
Security: SSL/TLS
Username: orders@zubahouse.com (full email)
Password: Your email account password
```

---

## 🧪 **STEP 4: Test SMTP Connection**

### **Check Server Logs:**

When your server starts, you should see:

**✅ Success:**
```
✅ Email service ready and verified
```

**❌ Failure:**
```
❌ Email service error: [error details]
```

### **Common SMTP Errors:**

1. **"Invalid login"**
   - Wrong email or password
   - Email account doesn't exist
   - Account is locked/suspended

2. **"Connection timeout"**
   - Wrong SMTP host
   - Firewall blocking port 465
   - Network issues

3. **"ECONNREFUSED"**
   - Wrong port number
   - SMTP server down
   - IP blocked

4. **"Authentication failed"**
   - Wrong password
   - Email account not activated
   - 2FA enabled (not supported)

---

## 🔍 **STEP 5: Check Render Logs**

### **View Real-Time Logs:**

1. **Render Dashboard** → Your service → **Logs** tab
2. **Look for email-related messages:**

**When OTP is sent:**
```
📧 Attempting to send email to: [email]
📧 Email service - Preparing to send: {...}
✅ Email sent successfully in 250ms: [messageId]
```

**If email fails:**
```
❌ Error sending email: [error message]
❌ Error details: {code, command, response}
```

### **What to Look For:**

- ✅ `Email sent successfully` = Code is working, email provider is working
- ❌ `Error sending email` = Check error details below
- ⚠️ `No logs at all` = Email function not being called (code issue)

---

## 🚨 **STEP 6: Common Hostinger Issues**

### **Issue 1: Email Account Not Activated**

**Solution:**
1. Login to Hostinger
2. Go to Email section
3. Activate `orders@zubahouse.com` if not active
4. Set password for email account

### **Issue 2: Wrong Port/Security Settings**

**Hostinger supports:**
- **Port 465** with `SMTP_SECURE=true` (SSL) ✅ **RECOMMENDED**
- **Port 587** with `SMTP_SECURE=false` (TLS)

**Your current config uses:**
- Port 465 + SSL ✅ (Correct for Hostinger)

### **Issue 3: Rate Limiting**

**Hostinger limits:**
- ~500 emails per hour per account
- If exceeded, emails are blocked temporarily

**Solution:**
- Wait 1 hour
- Or upgrade email plan
- Or use multiple email accounts

### **Issue 4: Email in Spam Folder**

**Check:**
- Customer's spam/junk folder
- Email might be delivered but filtered

**Solution:**
- Add SPF/DKIM records (advanced)
- Use professional email service (SendGrid, Mailgun)

---

## 🧪 **STEP 7: Manual Test**

### **Test OTP Email:**

1. **Try to sign up** with a test email
2. **Check Render logs** immediately:
   ```
   📧 Sending OTP email to: test@example.com
   📧 Email service - Preparing to send: {...}
   ```

3. **If you see logs but no email:**
   - Check spam folder
   - Verify email address is correct
   - Check Hostinger email account status

4. **If you see error logs:**
   - Copy the error message
   - Check error code (see below)

### **Test Order Status Email:**

1. **Update an order status** in admin panel
2. **Check Render logs:**
   ```
   📧 Status update detected, preparing to send email...
   📧 Found guest customer email: [email]
   📧 Calling sendEmail function...
   ```

3. **Same checks as OTP**

---

## 📋 **STEP 8: Error Code Reference**

### **Common Nodemailer Errors:**

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `EAUTH` | Authentication failed | Check EMAIL and EMAIL_PASS |
| `ECONNECTION` | Connection failed | Check SMTP_HOST and SMTP_PORT |
| `ETIMEDOUT` | Connection timeout | Check firewall, try port 587 |
| `EENVELOPE` | Invalid recipient | Check email address format |
| `EMESSAGE` | Message rejected | Check email content/spam filters |

---

## ✅ **STEP 9: Quick Fix Checklist**

### **If emails aren't sending, check:**

- [ ] `EMAIL` variable set in Render
- [ ] `EMAIL_PASS` is correct (email account password)
- [ ] `SMTP_HOST=smtp.hostinger.com` in Render
- [ ] `SMTP_PORT=465` in Render
- [ ] `SMTP_SECURE=true` in Render
- [ ] Email account `orders@zubahouse.com` exists and is active
- [ ] Email account password matches `EMAIL_PASS`
- [ ] Test endpoint `/test-email` works
- [ ] Server logs show email attempts
- [ ] No rate limiting (check Hostinger dashboard)

---

## 🎯 **STEP 10: Alternative Solutions**

### **If Hostinger SMTP keeps failing:**

**Option 1: Use Gmail SMTP (Free)**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL=your-gmail@gmail.com
EMAIL_PASS=your-app-password  # Not regular password!
```

**Option 2: Use SendGrid (Free tier: 100 emails/day)**
- Sign up: https://sendgrid.com
- Get API key
- Use SendGrid API instead of SMTP

**Option 3: Use Mailgun (Free tier: 5,000 emails/month)**
- Sign up: https://mailgun.com
- Better deliverability
- Professional service

---

## 🔍 **DIAGNOSIS SUMMARY**

### **If `/test-email` works:**
✅ Email provider is fine  
✅ Environment variables are correct  
❌ Issue is in code (OTP/order status logic)  

### **If `/test-email` fails:**
❌ Email provider issue  
❌ Environment variables wrong  
❌ SMTP configuration incorrect  

**Check the error message from `/test-email` to identify the exact issue!**

---

## 📞 **NEXT STEPS**

1. **Test `/test-email` endpoint** first
2. **Check Render logs** for error messages
3. **Verify environment variables** in Render
4. **Check Hostinger email account** status
5. **Share error messages** if still failing

**The test endpoint will tell you exactly what's wrong!** 🎯



