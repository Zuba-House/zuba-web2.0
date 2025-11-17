# 🔧 DEPLOYMENT FIXES - APPLY BEFORE DEPLOYING

**Critical fixes needed before production deployment**

---

## **FIX 1: Update CORS Configuration**

**File:** `server/index.js`

**Replace lines 42-45:**

```javascript
// OLD CODE (REMOVE)
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];
```

**With:**

```javascript
// NEW CODE (ADD)
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : process.env.NODE_ENV === 'production'
        ? [] // Require explicit origins in production
        : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];
```

**Why**: Prevents CORS errors in production by requiring explicit origins.

---

## **FIX 2: Fix Variation Route**

**File:** `server/index.js`

**Current line 161:**
```javascript
app.use("/api/products/:id/variations", variationRouter);
```

**Problem**: This route pattern doesn't work with Express Router.

**Solution**: Remove this line. Variations are already handled in product routes or need to be nested properly.

**Action**: Comment out or remove line 161:
```javascript
// app.use("/api/products/:id/variations", variationRouter); // REMOVED - handled in product routes
```

**Verify**: Check if variations work via `/api/products/:id/variations` in product router.

---

## **FIX 3: Update Health Check Endpoint**

**File:** `server/index.js`

**Replace lines 94-100:**

```javascript
// OLD CODE
app.get("/api/health", (request, response) => {
    response.json({
        status: "healthy",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});
```

**With:**

```javascript
// NEW CODE
app.get("/api/health", (request, response) => {
    const mongoose = (await import('mongoose')).default;
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    response.json({
        status: dbStatus === 'Connected' ? "healthy" : "degraded",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: dbStatus,
        environment: process.env.NODE_ENV || 'development'
    });
});
```

**Better approach** (since mongoose is already imported):
```javascript
import mongoose from 'mongoose';

// Then in the route:
app.get("/api/health", (request, response) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    response.json({
        status: dbStatus === 'Connected' ? "healthy" : "degraded",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: dbStatus,
        environment: process.env.NODE_ENV || 'development'
    });
});
```

**Why**: Provides better monitoring and shows database connection status.

---

## **FIX 4: Fix Build Scripts for Cross-Platform**

**File:** `client/package.json`

**Current:**
```json
"build": "set \"GENERATE_SOURCEMAP=false\" && vite build"
```

**Replace with:**
```json
"build": "vite build"
```

**File:** `client/vite.config.js` (CREATE or UPDATE)

**Add:**
```javascript
export default {
  build: {
    sourcemap: false
  }
}
```

**File:** `admin/package.json`

**Same fix:**
```json
"build": "vite build"
```

**File:** `admin/vite.config.js` (CREATE or UPDATE)

**Add:**
```javascript
export default {
  build: {
    sourcemap: false
  }
}
```

**Why**: Windows-specific commands don't work on Linux (Vercel uses Linux).

---

## **FIX 5: Add Node.js Engine Requirements**

**File:** `server/package.json`

**Add after line 5:**
```json
"engines": {
  "node": ">=18.0.0",
  "npm": ">=9.0.0"
},
```

**Why**: Ensures Render uses correct Node.js version.

---

## **FIX 6: Update CORS Error Message**

**File:** `server/index.js`

**Current line 61:**
```javascript
callback(new Error('Not allowed by CORS'));
```

**Replace with:**
```javascript
const msg = `CORS policy: Origin ${origin} is not allowed. Allowed origins: ${allowedOrigins.join(', ')}`;
console.error(msg);
callback(new Error(msg));
```

**Why**: Better error messages for debugging.

---

## **FIX 7: Add Production CORS Logging**

**File:** `server/index.js`

**In CORS configuration, add logging (optional but helpful):**

```javascript
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // In development, allow all origins for easier testing
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        
        // In production, only allow specified origins
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            const msg = `CORS: Origin ${origin} not allowed. Allowed: ${allowedOrigins.join(', ')}`;
            console.error(msg);
            callback(new Error(msg));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## **QUICK FIX SUMMARY**

1. ✅ Update CORS configuration (Fix 1)
2. ✅ Remove/comment variation route line (Fix 2)
3. ✅ Update health check (Fix 3)
4. ✅ Fix build scripts (Fix 4)
5. ✅ Add engines to package.json (Fix 5)
6. ✅ Improve CORS error messages (Fix 6)

**Time to apply**: 10 minutes

**After applying**: Test locally, then deploy!

---

## **TESTING AFTER FIXES**

```bash
# 1. Test backend locally
cd server
npm start
# Visit: http://localhost:5000/api/health
# Should show database status

# 2. Test frontend build
cd client
npm run build
# Should build without errors

# 3. Test admin build
cd admin
npm run build
# Should build without errors
```

---

**Apply these fixes, then proceed with deployment guide!**

