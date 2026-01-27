# Fix Database Index via API

## Problem
The database still has old indexes causing errors when creating vendors:
- Old `userId_1` index (should be `ownerUser_1`)
- Old `shopSlug_1` index (should be `storeSlug_1` with sparse: true)
- Old `shopName_1` index (field renamed to `storeName`)

The fix script needs to be run on the production database.

## Solution
Created an admin API endpoint that can fix the indexes directly from the admin panel.

## New Endpoint

### POST `/api/admin/vendors/fix-indexes`

**Description:** Fixes vendor collection database indexes. Removes old indexes (`userId_1`, `shopSlug_1`, `shopName_1`) and creates correct indexes (`ownerUser_1`, `storeSlug_1`) with proper sparse settings.

**Authentication:** Requires admin authentication

**Request:**
```http
POST /api/admin/vendors/fix-indexes
Authorization: Bearer <admin_token>
```

**Response (Success):**
```json
{
  "error": false,
  "success": true,
  "message": "Vendor indexes fixed successfully",
  "data": {
    "indexesBefore": 5,
    "indexesAfter": 4,
    "indexesRemoved": ["userId_1", "shopSlug_1", "shopName_1"],
    "indexesCreated": ["ownerUser_1", "storeSlug_1"],
    "finalIndexes": [
      {
        "name": "_id_",
        "key": { "_id": 1 }
      },
      {
        "name": "ownerUser_1",
        "key": { "ownerUser": 1 }
      }
    ],
    "warnings": ["Found 2 vendor(s) with null ownerUser"]
  }
}
```

**Response (Error):**
```json
{
  "error": true,
  "success": false,
  "message": "Failed to fix indexes",
  "details": "Error message (in development only)"
}
```

## How to Use

### Option 1: Via API Call (Recommended)
1. Log in as admin
2. Get admin access token
3. Call the endpoint:
```bash
curl -X POST https://your-api.com/api/admin/vendors/fix-indexes \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Option 2: Via Admin Panel (If UI Added)
Add a button in the admin vendor management page that calls this endpoint.

### Option 3: Via Browser Console
```javascript
// In browser console on admin panel
fetch('/api/admin/vendors/fix-indexes', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('accessToken'),
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log(data));
```

## What It Does

1. **Checks for old indexes and removes them:**
   - `userId_1` (should be `ownerUser_1`)
   - `shopSlug_1` (should be `storeSlug_1` with sparse: true)
   - `shopName_1` (field renamed to `storeName`)
   - Logs all removals

2. **Checks for vendors with null ownerUser**
   - Counts them
   - Reports as warning (doesn't delete them)

3. **Creates correct indexes:**
   - `ownerUser_1`: Drops existing if present, creates with `unique: true, sparse: true`
   - `storeSlug_1`: Drops existing if present, creates with `unique: true, sparse: true` (allows multiple nulls)

4. **Returns summary**
   - Lists all indexes before and after
   - Reports what was removed/created
   - Shows any warnings

## After Running

Once the index is fixed:
1. Try creating a vendor again
2. The error should be gone
3. Vendor creation should work normally

## Files Changed

- `server/controllers/adminVendor.controller.js` - Added `fixVendorIndexes` function
- `server/route/adminVendor.route.js` - Added route `POST /fix-indexes`

## Status

✅ **READY** - Endpoint created and ready to use

