# 🚀 **SendGrid Setup Instructions**

## ✅ **Code is Ready!**

All code has been updated to use SendGrid. Now you need to:

1. Install the package
2. Set environment variables
3. Verify sender email
4. Deploy

---

## 📦 **Step 1: Install SendGrid Package**

**Run in terminal:**
```bash
cd server
npm install @sendgrid/mail
```

**Or** it will install automatically when you push (package.json already updated)

---

## ⚙️ **Step 2: Set Render Environment Variables**

**Go to:** Render Dashboard → Your Service → Environment

### **ADD These Variables:**

Click **"Add Environment Variable"** for each:

```
SENDGRID_API_KEY=SG.your_actual_api_key_here
```

```
EMAIL_FROM=orders@zubahouse.com
```

```
EMAIL_SENDER_NAME=Zuba House
```

```
TEST_EMAIL=olivier.niyo250@gmail.com
```

### **OPTIONAL - Delete These (No Longer Needed):**

You can delete these if you want (they're not used anymore):
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER`
- `EMAIL_PASS`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`

**⚠️ Keep `EMAIL_FROM` and `EMAIL_SENDER_NAME` - they're still used!**

---

## 📧 **Step 3: Verify Sender Email in SendGrid**

**⚠️ CRITICAL:** You MUST verify the sender email before emails will send!

1. **Go to:** https://app.sendgrid.com/settings/sender_auth/senders

2. **Click:** "Create New Sender"

3. **Fill in:**
   - **From Email:** `orders@zubahouse.com`
   - **From Name:** `Zuba House`
   - **Reply To:** `orders@zubahouse.com`
   - **Address:** Your business address
   - **City:** Your city
   - **State:** Your state
   - **Country:** Your country
   - **ZIP:** Your ZIP code

4. **Click:** "Create"

5. **Check your email inbox** for verification email from SendGrid

6. **Click the verification link** in the email

7. **Status should show:** ✅ "Verified" (green checkmark)

---

## 🚀 **Step 4: Deploy**

```bash
git add .
git commit -m "Switch to SendGrid email service"
git push origin main
```

**Wait 2-3 minutes for Render to deploy**

---

## 🧪 **Step 5: Test**

After deployment, test:

```
https://zuba-api.onrender.com/api/test-email?to=olivier.niyo250@gmail.com
```

**Expected Response:**
```json
{
  "success": true,
  "message": "✅ Email sent successfully via SendGrid!",
  "details": {
    "statusCode": 202,
    "provider": "SendGrid"
  }
}
```

**Status Code 202 = Success!** ✅

---

## ✅ **Complete Checklist**

- [ ] `npm install @sendgrid/mail` (or push - it will install)
- [ ] Added `SENDGRID_API_KEY` to Render
- [ ] Added `EMAIL_FROM=orders@zubahouse.com` to Render
- [ ] Added `EMAIL_SENDER_NAME=Zuba House` to Render
- [ ] Verified sender email in SendGrid dashboard
- [ ] Committed and pushed code
- [ ] Render deployment completed
- [ ] Test endpoint returns success
- [ ] Email received in inbox

---

## 🎯 **Why This Works**

- ✅ Uses HTTPS (port 443) - Render allows this
- ✅ No SMTP ports needed
- ✅ No firewall issues
- ✅ Fast and reliable
- ✅ 100 free emails/day

---

**All code is ready! Just set the environment variables and verify the sender email!** 🚀

