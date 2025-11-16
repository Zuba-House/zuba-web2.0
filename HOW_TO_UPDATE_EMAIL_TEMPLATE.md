# 📧 How to Update Email Templates - Quick Guide

## ✅ YES, You Can Update It Yourself!

The email template is **code-based** and you can easily edit it. Here's how:

---

## 📍 File Location

**Order Confirmation Email:**
```
server/utils/orderEmailTemplate.js
```

**Order Cancellation Email:**
```
server/utils/orderCancellationEmailTemplate.js
```

---

## 🎨 What's Already Fixed

✅ **Zuba House Branding** - Professional design with brand colors
✅ **USD Currency** - All prices show in USD ($)
✅ **Estimated Delivery** - Shows "5-12 business days"
✅ **Zuba House Footer** - Proper branding

---

## ✏️ How to Customize

### 1. **Open the File**
- Navigate to `server/utils/orderEmailTemplate.js`
- Open it in any text editor (VS Code, Notepad++, etc.)

### 2. **What You Can Change**

#### Change Colors:
```javascript
// Line ~47 - Header background color
background: linear-gradient(135deg, #2c3e50 0%, #1a252f 100%);

// Line ~81 - Table header color
background: #2c3e50;

// Line ~110 - Accent color (orange border)
border-left: 4px solid #f39c12;
```

#### Change Text:
```javascript
// Line ~141 - Company name in header
<h1>ZUBA HOUSE</h1>

// Line ~194 - Delivery estimate
<p><strong>Estimated Delivery:</strong> 5-12 business days</p>

// Line ~200 - Custom message
We'll send you a tracking number once your order ships...
```

#### Change Styling:
- Font sizes: Look for `font-size: XXpx`
- Padding: Look for `padding: XXpx`
- Colors: Look for `color: #XXXXXX`

---

## 🎨 Zuba House Brand Colors

Use these colors for consistency:

- **Primary (Dark Blue-Gray):** `#2c3e50`
- **Secondary (Warm Red):** `#e74c3c`
- **Accent (Golden Orange):** `#f39c12`
- **Success (Fresh Green):** `#27ae60`
- **Background (Light Gray):** `#f8f9fa`

---

## 💰 Currency Format

All prices are formatted as USD:
```javascript
$${price.toFixed(2)}  // Shows: $20.00
```

If you need to change currency:
- Replace `$` with your currency symbol
- Example: `€${price.toFixed(2)}` for Euros

---

## 🔄 After Making Changes

1. **Save the file**
2. **Restart your server** (if running)
3. **Test by placing a new order**
4. **Check the email** - changes will appear in new emails

**Note:** Changes only apply to NEW orders. Old emails won't change.

---

## 📝 Common Customizations

### Change Delivery Time:
```javascript
// Find this line (~194):
<p><strong>Estimated Delivery:</strong> 5-12 business days</p>

// Change to:
<p><strong>Estimated Delivery:</strong> YOUR_TIME_HERE</p>
```

### Add Company Logo:
```javascript
// In the header section, add:
<img src="YOUR_LOGO_URL" alt="Zuba House" style="max-width: 200px; margin-bottom: 10px;" />
```

### Change Footer Text:
```javascript
// Find this section (~204):
<p style="margin: 0 0 10px 0;"><strong>Zuba House</strong></p>
<p style="margin: 0; opacity: 0.8;">&copy; ${new Date().getFullYear()} Zuba House. All rights reserved.</p>

// Change to your preferred text
```

---

## ⚠️ Important Notes

1. **Don't break the template syntax** - Keep all `${}` and backticks intact
2. **Test after changes** - Always test with a real order
3. **Backup first** - Save a copy before making major changes
4. **HTML formatting** - The template uses HTML, so use proper HTML tags

---

## 🆘 Need Help?

If you break something:
1. Check the server console for errors
2. Restore from backup
3. Or ask for help with the specific error

---

## ✅ Current Template Features

- ✅ Professional Zuba House branding
- ✅ Responsive design (works on mobile)
- ✅ USD currency formatting
- ✅ Shows subtotal, shipping, and total
- ✅ Order ID and delivery estimate
- ✅ Clean, modern design

---

**Last Updated:** 2024
**Template Version:** 2.0 (Zuba House Branded)

