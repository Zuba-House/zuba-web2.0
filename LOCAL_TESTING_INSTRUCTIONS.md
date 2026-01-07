# Local Testing Instructions for Vendor Registration Fix

## ✅ What Was Fixed

1. **Removed Legacy Seller Schema** from `product.model.js`
2. **Removed Duplicate vendorId Field** (kept only `vendor`)
3. **Fixed Registration Flow** - Users are now created only in the final step
4. **Updated Indexes** - Removed seller index, added vendor index

## 🚀 Quick Start Testing

### Prerequisites

1. **MongoDB running locally:**
   ```bash
   # Windows (if installed as service)
   # MongoDB should start automatically
   
   # Or start manually
   mongod --dbpath "C:\data\db"
   
   # Or use MongoDB Atlas connection string in .env
   ```

2. **Node.js 18+ installed**

3. **Environment variables configured** (see `server/ENV_SETUP.md`)

### Step 1: Start Backend Server

```powershell
# Navigate to server directory
cd server

# Install dependencies (if not already done)
npm install

# Start server
npm run dev
```

**Expected output:**
```
✅ Environment variables validated successfully
🔐 CORS Allowed Origins: [...]
MongoDB connected successfully
Server is running on port 5000
```

### Step 2: Test Registration Flow

#### Option A: Using curl (PowerShell)

```powershell
# Step 1: Send OTP
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/vendor/send-otp" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"test@example.com"}'

Write-Host "OTP Response:" -ForegroundColor Green
$response | ConvertTo-Json

# Check server console for OTP code (in development mode)
# Or use: $response.data.otp (if email sending failed)

# Step 2: Verify OTP (replace 123456 with actual OTP)
$verifyResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/vendor/verify-otp" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"test@example.com","otp":"123456"}'

Write-Host "Verify Response:" -ForegroundColor Green
$verifyResponse | ConvertTo-Json

# Step 3: Apply Vendor
$applyResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/vendor/apply" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{
    "email":"test@example.com",
    "password":"password123",
    "name":"Test Vendor",
    "storeName":"Test Store",
    "storeSlug":"test-store",
    "phone":"+250123456789",
    "country":"Rwanda",
    "city":"Kigali"
  }'

Write-Host "Apply Response:" -ForegroundColor Green
$applyResponse | ConvertTo-Json

# Extract token
$token = $applyResponse.data.accesstoken
Write-Host "Token: $token" -ForegroundColor Yellow

# Step 4: Test Dashboard (optional)
$dashboardResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/vendor/dashboard" `
  -Method GET `
  -Headers @{Authorization="Bearer $token"}

Write-Host "Dashboard Response:" -ForegroundColor Green
$dashboardResponse | ConvertTo-Json
```

#### Option B: Using Postman or Thunder Client

1. **Send OTP:**
   - Method: `POST`
   - URL: `http://localhost:5000/api/vendor/send-otp`
   - Body (JSON):
     ```json
     {
       "email": "test@example.com"
     }
     ```
   - Check server console for OTP code

2. **Verify OTP:**
   - Method: `POST`
   - URL: `http://localhost:5000/api/vendor/verify-otp`
   - Body (JSON):
     ```json
     {
       "email": "test@example.com",
       "otp": "123456"
     }
     ```

3. **Apply Vendor:**
   - Method: `POST`
   - URL: `http://localhost:5000/api/vendor/apply`
   - Body (JSON):
     ```json
     {
       "email": "test@example.com",
       "password": "password123",
       "name": "Test Vendor",
       "storeName": "Test Store",
       "storeSlug": "test-store",
       "phone": "+250123456789",
       "country": "Rwanda",
       "city": "Kigali"
     }
     ```

4. **Test Dashboard:**
   - Method: `GET`
   - URL: `http://localhost:5000/api/vendor/dashboard`
   - Headers:
     ```
     Authorization: Bearer YOUR_TOKEN_HERE
     ```

## ✅ Expected Results

### Step 1: Send OTP
```json
{
  "error": false,
  "success": true,
  "message": "Verification code generated. Check your server console for the OTP code.",
  "data": {
    "email": "test@example.com",
    "emailSent": false,
    "otp": "123456"
  }
}
```

### Step 2: Verify OTP
```json
{
  "error": false,
  "success": true,
  "message": "Email verified successfully! You can proceed with registration.",
  "data": {
    "email": "test@example.com",
    "verified": true
  }
}
```

### Step 3: Apply Vendor
```json
{
  "error": false,
  "success": true,
  "message": "Vendor application submitted successfully! Your application is under review.",
  "data": {
    "accesstoken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "vendorId": "65f1234567890abcdef12345",
    "storeName": "Test Store",
    "storeSlug": "test-store",
    "status": "PENDING",
    "emailVerified": true,
    "user": {
      "id": "65f1234567890abcdef12346",
      "name": "Test Vendor",
      "email": "test@example.com",
      "role": "VENDOR"
    },
    "vendor": {
      "id": "65f1234567890abcdef12345",
      "storeName": "Test Store",
      "storeSlug": "test-store",
      "status": "PENDING"
    }
  }
}
```

## 🔍 Verification Checklist

After testing, verify:

- [ ] **No "vendor already exists" errors**
- [ ] **User created only after OTP verification**
- [ ] **Vendor record created and linked to user**
- [ ] **JWT token generated successfully**
- [ ] **Dashboard accessible with token** (may require APPROVED status)
- [ ] **No seller fields in product model**
- [ ] **No vendorId duplicate in product model**

## 🐛 Troubleshooting

### "Missing required environment variables"
- Check that `.env` file exists in `server/` directory
- See `server/ENV_SETUP.md` for required variables
- At minimum, you need:
  - `PORT=5000`
  - `MONGODB_URI` or `MONGODB_LOCAL_URI`
  - `SECRET_KEY_ACCESS_TOKEN`
  - `SECRET_KEY_REFRESH_TOKEN`
  - `JSON_WEB_TOKEN_SECRET_KEY`
  - `cloudinary_Config_Cloud_Name`
  - `cloudinary_Config_api_key`
  - `cloudinary_Config_api_secret`
  - `EMAIL`
  - `EMAIL_PASS`

### "MongoDB connection failed"
- Ensure MongoDB is running
- Check connection string in `.env`
- For local: `MONGODB_LOCAL_URI=mongodb://localhost:27017/zuba-house`
- For Atlas: `MONGODB_URI=mongodb+srv://...`

### "Vendor already exists" error
- This should NOT happen with the fix
- If it does, clean test data:
  ```javascript
  // In MongoDB shell
  use zuba-house
  db.users.deleteOne({ email: "test@example.com" })
  db.vendors.deleteOne({ email: "test@example.com" })
  ```

### CORS errors
- Check `server/index.js` includes `http://localhost:3000` in allowed origins
- Should already be configured

### OTP not received
- In development, OTP is printed to server console
- Check server terminal output
- Email sending requires SendGrid or SMTP configuration

## 📊 Database Verification

After successful registration, verify in MongoDB:

```javascript
// Connect to MongoDB
mongosh

// Use database
use zuba-house

// Check user was created
db.users.findOne({ email: "test@example.com" })
// Should show: role: "VENDOR", vendorId: ObjectId("...")

// Check vendor was created
db.vendors.findOne({ email: "test@example.com" })
// Should show: ownerUser: ObjectId("..."), status: "PENDING"

// Verify no seller fields in products
db.products.findOne({}, { seller: 1, vendor: 1, vendorId: 1 })
// Should show: vendor: ObjectId or null, NO seller field
```

## 🎯 Success Criteria

✅ **Registration completes without errors**  
✅ **User and Vendor created together**  
✅ **Token generated and valid**  
✅ **No legacy seller references**  
✅ **No duplicate vendorId fields**

---

**Ready to test!** Follow the steps above and verify all checkboxes are checked.

