# 📧 Email Templates Setup Guide - Zuba House

## ✅ What's Been Implemented

### 1. **Customer Order Confirmation Email** ✅
- **File:** `server/utils/orderEmailTemplate.js`
- **Features:**
  - ✅ Zuba House branding with logo
  - ✅ Product details with variations (size, color, etc.)
  - ✅ Product SKU display
  - ✅ Shipping cost shown separately
  - ✅ Subtotal, Shipping, and Total breakdown
  - ✅ Professional design with Zuba House colors
  - ✅ Estimated delivery: 5-12 business days

### 2. **Admin Order Notification Email** ✅
- **File:** `server/utils/adminOrderNotificationEmailTemplate.js`
- **Recipient:** `sales@zubahouse.com` (configurable via `ADMIN_EMAIL` env variable)
- **Features:**
  - ✅ Complete order details
  - ✅ Customer information (name, email, phone)
  - ✅ Shipping address
  - ✅ Product details with variations and SKU
  - ✅ Payment information
  - ✅ Total amounts breakdown
  - ✅ Action button to view order in admin panel
  - ✅ Professional admin-focused design

### 3. **Order Cancellation Email** ✅
- **File:** `server/utils/orderCancellationEmailTemplate.js`
- **Features:**
  - ✅ Zuba House branding
  - ✅ Cancellation reason
  - ✅ Refund information (if applicable)
  - ✅ Order details

---

## 🎨 Logo Configuration

### Option 1: Environment Variable (Recommended)
Add to your `.env` file:
```env
ZUBA_LOGO_URL=https://yourdomain.com/logo.png
# OR
LOGO_URL=https://yourdomain.com/logo.png
```

### Option 2: Use Your Logo API
The system has a logo API at `/api/logo`. You can:
1. Upload your logo through the admin panel (Manage Logo)
2. Get the logo URL from the API
3. Set it as an environment variable

### Option 3: Direct URL in Code
Edit the email template files and replace the placeholder URL with your logo URL.

**Current placeholder:** `https://via.placeholder.com/180x60/2c3e50/ffffff?text=ZUBA+HOUSE`

---

## 📋 Admin Email Configuration

### Set Admin Email Address
Add to your `.env` file:
```env
ADMIN_EMAIL=sales@zubahouse.com
```

**Default:** If not set, it will use `sales@zubahouse.com`

---

## 🚀 How It Works

### Customer Email Flow:
1. Order is placed
2. Customer receives confirmation email with:
   - Order details
   - Product variations (size, color, etc.)
   - Product SKU
   - Shipping cost breakdown
   - Total amount

### Admin Email Flow:
1. Order is placed
2. Admin receives notification email at `sales@zubahouse.com` with:
   - Complete order information
   - Customer contact details
   - Shipping address
   - All product details
   - Payment status
   - Link to view order in admin panel

---

## 📦 Product Variations Display

The email templates automatically display:
- **New format:** `variation.attributes` (e.g., "Color: Red", "Size: Large")
- **Legacy format:** `size`, `weight`, `ram` fields (for backward compatibility)

**Example display:**
```
Product Name
Color: Red • Size: Large
SKU: PROD-001-RED-LG
```

---

## 💰 Shipping Cost Display

Shipping cost is now:
- ✅ Always shown separately (even if $0, shows "Free")
- ✅ Highlighted with yellow background
- ✅ Included in total calculation
- ✅ Shown in both customer and admin emails

---

## 🔧 Files Modified

1. ✅ `server/utils/orderEmailTemplate.js` - Customer confirmation email
2. ✅ `server/utils/adminOrderNotificationEmailTemplate.js` - Admin notification (NEW)
3. ✅ `server/utils/orderCancellationEmailTemplate.js` - Cancellation email
4. ✅ `server/controllers/order.controller.js` - Email sending logic
5. ✅ `server/models/order.model.js` - Added `shippingCost` and `shippingRate` fields

---

## 🧪 Testing

### Test Customer Email:
1. Place a test order
2. Check customer's email inbox
3. Verify:
   - Logo appears (or placeholder)
   - Product variations show correctly
   - SKU displays
   - Shipping cost is separate
   - Total is correct

### Test Admin Email:
1. Place a test order
2. Check `sales@zubahouse.com` inbox
3. Verify:
   - All order details present
   - Customer information correct
   - Shipping address displayed
   - Product details with variations
   - Payment information accurate

---

## 📝 Customization

### Change Logo:
1. Upload logo to your server/Cloudinary
2. Get the URL
3. Add to `.env`: `ZUBA_LOGO_URL=https://your-url.com/logo.png`
4. Restart server

### Change Admin Email:
1. Add to `.env`: `ADMIN_EMAIL=your-email@domain.com`
2. Restart server

### Customize Email Content:
- Edit the template files in `server/utils/`
- All templates use HTML/CSS
- Colors use Zuba House brand colors

---

## 🎨 Brand Colors Used

- **Primary:** `#2c3e50` (Dark Blue-Gray)
- **Secondary:** `#e74c3c` (Warm Red)
- **Accent:** `#f39c12` (Golden Orange)
- **Success:** `#27ae60` (Fresh Green)
- **Background:** `#f8f9fa` (Light Gray)

---

## ⚠️ Important Notes

1. **Logo URL:** Make sure your logo URL is publicly accessible (not behind authentication)
2. **Email Service:** Ensure your email service (Nodemailer) is properly configured
3. **Environment Variables:** Restart server after adding/changing env variables
4. **Testing:** Always test with real orders to verify email delivery

---

## 🆘 Troubleshooting

### Logo Not Showing:
- Check logo URL is accessible
- Verify environment variable is set correctly
- Check browser console for image loading errors

### Admin Email Not Received:
- Verify `ADMIN_EMAIL` is set in `.env`
- Check email service configuration
- Check server logs for email errors
- Verify email isn't in spam folder

### Product Variations Not Showing:
- Ensure product has `variation.attributes` or legacy fields (`size`, etc.)
- Check order data includes variation information

---

## ✅ Success Checklist

- [ ] Logo displays in emails (or placeholder)
- [ ] Customer receives confirmation email
- [ ] Admin receives notification email
- [ ] Product variations display correctly
- [ ] SKU shows for each product
- [ ] Shipping cost is separate and visible
- [ ] Total amount is correct
- [ ] All emails use Zuba House branding

---

**Last Updated:** 2024
**Version:** 2.0

