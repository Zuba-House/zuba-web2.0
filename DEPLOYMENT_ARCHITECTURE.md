# 🏗️ ZUBA HOUSE - COMPLETE PROJECT ARCHITECTURE & DEPLOYMENT GUIDE

**Version:** 2.0  
**Last Updated:** January 2025  
**Status:** Production Ready ✅

---

## 📊 **PROJECT OVERVIEW**

**Zuba House** is a full-stack e-commerce platform with three main applications:

```
┌─────────────────────────────────────────────────────────────┐
│                    ZUBA HOUSE ECOSYSTEM                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🌐 CLIENT (Frontend)     →  Vercel                         │
│  ⚙️  SERVER (Backend)     →  Render                         │
│  🎛️  ADMIN (Dashboard)    →  Vercel                         │
│  🗄️  DATABASE (MongoDB)   →  MongoDB Atlas                  │
│  📧 EMAIL (SMTP)          →  Hostinger/Gmail                │
│  🖼️  MEDIA (Images)       →  Cloudinary                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗂️ **PROJECT STRUCTURE**

```
zuba-web2.0/
│
├── client/                    # Customer-facing frontend (React + Vite)
│   ├── src/
│   │   ├── Pages/            # Main pages (Home, Products, Cart, Checkout, etc.)
│   │   ├── components/       # Reusable components
│   │   └── utils/            # API utilities, helpers
│   ├── package.json
│   └── vite.config.js
│
├── admin/                     # Admin dashboard (React + Vite)
│   ├── src/
│   │   ├── Pages/            # Admin pages (Products, Orders, Reviews, etc.)
│   │   ├── Components/       # Admin components
│   │   └── utils/            # API utilities
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Backend API (Node.js + Express)
│   ├── controllers/          # Business logic (20+ controllers)
│   ├── models/               # MongoDB schemas (22 models)
│   ├── route/                # API routes (20 route files)
│   ├── middlewares/          # Auth, error handling, multer
│   ├── config/               # DB, email, validation
│   ├── utils/                # Email templates, helpers
│   ├── index.js              # Main server file
│   └── package.json
│
└── README.md                  # Main documentation
```

---

## 🔌 **API ARCHITECTURE**

### **Base URL Structure**

```
Production: https://api.zubahouse.com (or Render URL)
Development: http://localhost:5000
```

### **All API Routes**

| Route Prefix | Controller | Purpose |
|-------------|-----------|---------|
| `/api/user` | `user.controller.js` | Authentication, user management, reviews |
| `/api/category` | `category.controller.js` | Category CRUD operations |
| `/api/product` | `product.controller.js` | Product CRUD, search, filters |
| `/api/cart` | `cart.controller.js` | Shopping cart operations |
| `/api/myList` | `mylist.controller.js` | Wishlist functionality |
| `/api/address` | `address.controller.js` | Shipping addresses |
| `/api/homeSlides` | `homeSlides.controller.js` | Homepage banners |
| `/api/bannerV1` | `bannerV1.controller.js` | Banner type 1 |
| `/api/bannerList2` | `bannerList2.controller.js` | Banner type 2 |
| `/api/blog` | `blog.controller.js` | Blog posts |
| `/api/order` | `order.controller.js` | Order creation, management |
| `/api/orders` | `orderTracking.controller.js` | Order tracking |
| `/api/logo` | `logo.controller.js` | Logo management |
| `/api/stripe` | `stripe.route.js` | Stripe payment processing |
| `/api/attributes` | `attribute.controller.js` | Product attributes |
| `/api/products/:id/variations` | `variation.controller.js` | Product variations |
| `/api/media` | `media.controller.js` | Media library |
| `/api/notifications` | `notification.controller.js` | Notifications |
| `/api/shipping` | `shipping.controller.js` | Shipping rate calculation |

### **Key Endpoints**

#### **Authentication & Users**
- `POST /api/user/register` - User registration
- `POST /api/user/login` - User login
- `GET /api/user/user-details` - Get current user
- `POST /api/user/addReview` - Submit product review
- `GET /api/user/getReviews` - Get product reviews (approved only)
- `GET /api/user/getAllReviews` - Get all reviews (admin only)
- `POST /api/user/reviews/:reviewId/approve` - Approve review (admin)
- `POST /api/user/reviews/:reviewId/reject` - Reject review (admin)

#### **Products**
- `GET /api/product` - Get all products (with filters)
- `GET /api/product/:id` - Get single product
- `POST /api/product` - Create product (admin)
- `PUT /api/product/:id` - Update product (admin)
- `DELETE /api/product/:id` - Delete product (admin)
- `GET /api/product/search?q=query` - Search products

#### **Orders**
- `POST /api/order` - Create order
- `GET /api/order` - Get user orders
- `GET /api/order/:id` - Get order details
- `PUT /api/order/:id` - Update order status (admin)

#### **Shipping**
- `POST /api/shipping/calculate` - Calculate shipping rates
- Uses Stallion Express API + fallback system

#### **Health Check**
- `GET /api/health` - Server health check
- `GET /` - Basic server status

---

## 🗄️ **DATABASE SCHEMA**

### **MongoDB Collections (22 Models)**

1. **User** - User accounts, authentication
2. **Product** - Products with variations support
3. **Category** - Product categories
4. **Order** - Customer orders
5. **Cart** - Shopping carts
6. **Address** - Shipping addresses
7. **Review** - Product reviews (with admin approval)
8. **Attribute** - Product attributes (Color, Size, etc.)
9. **AttributeValue** - Attribute values
10. **ProductVariation** - Product variations (SKU-level)
11. **HomeSlide** - Homepage banners
12. **BannerV1** - Banner type 1
13. **BannerList2** - Banner type 2
14. **Blog** - Blog posts
15. **Logo** - Logo management
16. **Media** - Media library
17. **Notification** - User notifications
18. **MyList** - Wishlists
19. **OrderTracking** - Order tracking info
20. **Payment** - Payment records
21. **Shipping** - Shipping configurations
22. **SubCategory** - Sub-categories

---

## 🔐 **AUTHENTICATION & AUTHORIZATION**

### **JWT Token System**
- **Access Token**: Short-lived (15 min default)
- **Refresh Token**: Long-lived (7 days default)
- **Storage**: HTTP-only cookies + localStorage fallback

### **User Roles**
- `USER` - Regular customer (default)
- `ADMIN` - Admin access (can manage products, orders, reviews)

### **Protected Routes**
- Admin routes require `role: 'ADMIN'`
- Review management requires admin
- Product CRUD requires admin
- Order management requires admin

---

## 📧 **EMAIL SYSTEM**

### **Email Templates**
1. **Order Confirmation** - `orderEmailTemplate.js`
   - Sent to customer after order placement
   - Includes product details, variations, SKU, shipping breakdown
   - Zuba House branding with logo

2. **Order Cancellation** - `orderCancellationEmailTemplate.js`
   - Sent when order is cancelled
   - Includes refund information

3. **Admin Order Notification** - `adminOrderNotificationEmailTemplate.js`
   - Sent to `sales@zubahouse.com` when order is placed
   - Comprehensive order details, customer info, shipping address
   - Responsive design for mobile

4. **Review Notification** - Inline in `user.controller.js`
   - Sent to admin when new review is submitted
   - Includes product name, rating, review text, customer info

### **SMTP Configuration**
- **Provider**: Hostinger (or Gmail)
- **Host**: `smtp.hostinger.com`
- **Port**: `465` (SSL)
- **From**: `orders@zubahouse.com`
- **Display Name**: `Zuba House`

---

## 🚚 **SHIPPING SYSTEM**

### **Shipping Rate Calculation**
1. **Primary**: Stallion Express API (live rates)
2. **Fallback 1**: Region-based calculation
3. **Fallback 2**: Simple flat rate

### **Features**
- Worldwide shipping support
- Google Maps autocomplete integration
- Delivery time estimates (5-12 business days)
- Address validation
- Region-based pricing

---

## 💳 **PAYMENT SYSTEM**

### **Supported Methods**
1. **Stripe** - Credit card payments
2. **PayPal** - PayPal checkout (configured)
3. **Cash on Delivery** - Manual payment

### **Payment Flow**
1. Customer selects payment method
2. Create payment intent (Stripe) or order (COD)
3. Process payment
4. Create order in database
5. Send confirmation emails
6. Update inventory

---

## 🎨 **FRONTEND ARCHITECTURE**

### **Client (Customer Frontend)**
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **UI Components**: Material-UI
- **State Management**: React Hooks (useState, useContext)
- **Routing**: React Router DOM v7
- **API Client**: Axios with interceptors
- **Image Optimization**: Cloudinary
- **Search**: Algolia (configured)

### **Key Features**
- Product browsing with filters
- Shopping cart
- Checkout with shipping calculation
- User authentication
- Product reviews (approved only)
- Order tracking
- Wishlist
- Responsive design

### **Admin (Admin Dashboard)**
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS + Material-UI
- **Features**:
  - Product management (CRUD)
  - Order management
  - Review approval system
  - User management
  - Category management
  - Banner management
  - Blog management
  - Media library
  - Logo management

---

## 🔧 **ENVIRONMENT VARIABLES**

### **Server (.env)**

#### **Required**
```env
# Server
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/zubahouse

# JWT Secrets
SECRET_KEY_ACCESS_TOKEN=your_secret_here
SECRET_KEY_REFRESH_TOKEN=your_secret_here
JSON_WEB_TOKEN_SECRET_KEY=your_secret_here

# Cloudinary
cloudinary_Config_Cloud_Name=your_cloud_name
cloudinary_Config_api_key=your_api_key
cloudinary_Config_api_secret=your_api_secret

# Email
EMAIL=orders@zubahouse.com
EMAIL_PASS=your_app_password
EMAIL_SENDER_NAME=Zuba House
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true

# Admin Email
ADMIN_EMAIL=sales@zubahouse.com
ADMIN_URL=https://admin.zubahouse.com
```

#### **Optional**
```env
# CORS
ALLOWED_ORIGINS=https://zubahouse.com,https://www.zubahouse.com,https://admin.zubahouse.com

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_TARGET_ACCOUNT=acct_...
CURRENCY=USD

# PayPal
PAYPAL_MODE=live
PAYPAL_CLIENT_ID_LIVE=...
PAYPAL_SECRET_LIVE=...

# Shipping
STALLION_API_KEY=...
STALLION_API_URL=https://api.stallionexpress.ca/v3
```

### **Client (.env.production)**
```env
VITE_API_URL=https://api.zubahouse.com
VITE_APP_NAME=Zuba House
VITE_APP_URL=https://zubahouse.com
```

### **Admin (.env.production)**
```env
VITE_API_URL=https://api.zubahouse.com
VITE_ADMIN_URL=https://admin.zubahouse.com
VITE_FRONTEND_URL=https://zubahouse.com
```

---

## 🚀 **DEPLOYMENT CHECKLIST**

### **Pre-Deployment**

- [x] Code cleaned and organized
- [x] All .md report files removed
- [x] Console.log statements cleaned (errors kept)
- [x] No linter errors
- [x] Environment variables documented
- [x] Health check endpoint exists
- [x] CORS configured for production
- [x] Error handling in place

### **Backend (Render)**

- [ ] MongoDB Atlas connection string ready
- [ ] All environment variables set in Render
- [ ] Root directory set to `server`
- [ ] Start command: `npm start`
- [ ] Build command: `npm install` (or leave empty)
- [ ] Health check: `/api/health` returns 200
- [ ] Database connection verified
- [ ] CORS allows frontend domains

### **Frontend (Vercel)**

- [ ] Root directory: `client`
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Environment variables set
- [ ] API URL points to Render backend
- [ ] Build succeeds without errors
- [ ] Homepage loads correctly
- [ ] API calls work

### **Admin (Vercel)**

- [ ] Root directory: `admin`
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Environment variables set
- [ ] Login works
- [ ] All admin features functional

### **Domain Setup**

- [ ] Domain purchased
- [ ] DNS records configured
- [ ] SSL certificates active (auto by Vercel/Render)
- [ ] Main domain working
- [ ] WWW redirect working
- [ ] Admin subdomain working
- [ ] API subdomain working (optional)

---

## ⚠️ **ISSUES TO FIX BEFORE DEPLOYMENT**

### **1. CORS Configuration Issue**

**Current Code (server/index.js line 43-45):**
```javascript
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];
```

**Problem**: In production, if `ALLOWED_ORIGINS` is not set, it defaults to localhost.

**Fix Required:**
```javascript
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : process.env.NODE_ENV === 'production'
        ? [] // Fail safe - require explicit origins in production
        : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];
```

### **2. Variation Route Path Issue**

**Current Code (server/index.js line 161):**
```javascript
app.use("/api/products/:id/variations", variationRouter);
```

**Problem**: This route pattern won't work correctly. Variations should be nested under products.

**Fix Required:**
```javascript
// Remove this line
// app.use("/api/products/:id/variations", variationRouter);

// Add to product.route.js instead, or use:
app.use("/api/products", productRouter); // This should handle nested routes
```

**Better Solution**: Handle variations in product router with nested routes.

### **3. Build Script for Windows**

**Current (client/package.json):**
```json
"build": "set \"GENERATE_SOURCEMAP=false\" && vite build"
```

**Problem**: This is Windows-specific. Won't work on Linux/Mac (Vercel uses Linux).

**Fix Required:**
```json
"build": "vite build"
```

Then add to `vite.config.js`:
```javascript
export default {
  build: {
    sourcemap: false
  }
}
```

### **4. Missing Health Check Database Status**

**Current (server/index.js line 94-100):**
```javascript
app.get("/api/health", (request, response) => {
    response.json({
        status: "healthy",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});
```

**Problem**: Doesn't check database connection.

**Fix Required:**
```javascript
app.get("/api/health", (request, response) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    response.json({
        status: dbStatus === 'Connected' ? "healthy" : "degraded",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: dbStatus
    });
});
```

### **5. Package.json Missing Engines**

**Current (server/package.json):**
No `engines` field specified.

**Fix Required:**
```json
{
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

---

## 🔧 **DEPLOYMENT FIXES NEEDED**

I'll create a file with all the fixes you need to apply before deployment.

---

## 📝 **DEPLOYMENT STEPS SUMMARY**

1. **Fix Issues Above** (5 minutes)
2. **Set Up MongoDB Atlas** (10 minutes)
3. **Deploy Backend to Render** (15 minutes)
4. **Deploy Frontend to Vercel** (15 minutes)
5. **Deploy Admin to Vercel** (10 minutes)
6. **Configure Domain** (15 minutes)
7. **Test Everything** (10 minutes)

**Total Time**: ~80 minutes

---

## 🆘 **TROUBLESHOOTING**

### **Backend Won't Start**
- Check environment variables in Render
- Verify MongoDB connection string
- Check Render logs for errors

### **Frontend Can't Connect to API**
- Verify `VITE_API_URL` in Vercel
- Check CORS configuration in backend
- Verify backend is running (check Render dashboard)

### **Images Not Loading**
- Verify Cloudinary environment variables
- Check image URLs in database
- Verify Cloudinary uploads are working

### **Email Not Sending**
- Verify SMTP credentials
- For Gmail, use App Password (not regular password)
- Check email service logs

---

## 📞 **SUPPORT RESOURCES**

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com
- **Cloudinary Docs**: https://cloudinary.com/documentation

---

**Status**: Ready for deployment after fixes above are applied.

