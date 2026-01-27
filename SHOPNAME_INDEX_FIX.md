# ShopName Index Fix

## Problem
Error: `E11000 duplicate key error collection: zuba_house.vendors index: shopName_1 dup key: { shopName: null }`

## Root Cause
- The vendor model field was renamed from `shopName` to `storeName`
- An old unique index `shopName_1` still exists in the database
- Multiple vendors have `shopName: null`, violating the unique constraint
- The field `shopName` no longer exists in the model, but the index remains

## Solution

### 1. Auto-Fix in Error Handler
- Detects `shopName_1` index errors
- Automatically drops the old index
- Retries vendor creation

### 2. Manual Fix Endpoint
- Updated `fixVendorIndexes` endpoint to also remove `shopName_1` index
- Can be called manually via "Fix Database Indexes" button

## Files Changed

### `server/controllers/adminVendor.controller.js`
1. **Error Handler** (lines ~500-600):
   - Added detection for `shopName_1` index errors
   - Auto-fixes by dropping the index
   - Retries vendor creation

2. **fixVendorIndexes Function** (lines ~1030-1042):
   - Added check for `shopName_1` index
   - Drops it if found
   - Reports in results

## How It Works

### Automatic Fix
1. Vendor creation fails with `shopName_1` error
2. System detects the error
3. Drops `shopName_1` index
4. Retries vendor creation
5. Returns success

### Manual Fix
1. Click "Fix Database Indexes" button
2. System removes all old indexes including `shopName_1`
3. Vendor creation works normally

## Status

✅ **FIXED** - Both auto-fix and manual fix handle `shopName_1` index

## Testing

1. Try creating a vendor
2. If `shopName_1` error occurs, it will auto-fix
3. Or use "Fix Database Indexes" button to fix manually

