# Vendor Creation Rollback Fix

## Problem
When admin tried to create a new vendor:
1. User account was created FIRST
2. If vendor creation failed (due to database index error or other issues), the user account remained orphaned
3. This left incomplete data in the system
4. Admin couldn't retry because user already existed

## Root Causes
1. **No Rollback Mechanism**: User creation happened before vendor creation, with no cleanup on failure
2. **Database Index Error**: Old `userId_1` index causing duplicate key errors
3. **No Transaction Support**: MongoDB doesn't support transactions across collections by default

## Solution Implemented

### 1. Added Rollback Tracking
- Track if a new user was created (`userWasNew` flag)
- Store the newly created user ID (`newlyCreatedUser`)
- Only rollback if we actually created a new user (not if updating existing)

### 2. Rollback on Validation Errors
- If slug validation fails → Delete newly created user
- If slug conflict detected → Delete newly created user
- If vendor creation fails → Delete newly created user
- If user-vendor linking fails → Delete both vendor and user

### 3. Enhanced Error Handling
- Catch block now checks if rollback is needed
- Safely attempts to delete orphaned user
- Logs rollback actions for debugging
- Only deletes if user has no vendor linked (safety check)

### 4. Database Index Fix
- Script created to fix old `userId_1` index
- Run: `node server/scripts/fixVendorIndexes.js`
- Removes old index and creates correct `ownerUser_1` index

## Code Changes

### `server/controllers/adminVendor.controller.js`

**Before:**
```javascript
// User created
user = await UserModel.create({...});

// Later, if vendor creation fails, user remains orphaned
const vendor = await VendorModel.create({...});
```

**After:**
```javascript
// Track if new user
let newlyCreatedUser = null;
let userWasNew = false;

// Create user
user = await UserModel.create({...});
newlyCreatedUser = user._id;
userWasNew = true;

// Try vendor creation with rollback
try {
  vendor = await VendorModel.create({...});
} catch (vendorCreateError) {
  // Rollback user if vendor creation fails
  if (userWasNew && newlyCreatedUser) {
    await UserModel.findByIdAndDelete(newlyCreatedUser);
  }
  throw vendorCreateError;
}

// In catch block - additional rollback safety
if (userWasNew && newlyCreatedUser) {
  // Check user doesn't have vendor before deleting
  const userToDelete = await UserModel.findById(newlyCreatedUser);
  if (userToDelete && !userToDelete.vendor && !userToDelete.vendorId) {
    await UserModel.findByIdAndDelete(newlyCreatedUser);
  }
}
```

## Rollback Points

1. **Slug Format Validation** → Rollback user
2. **Slug Conflict** → Rollback user
3. **Vendor Creation Failure** → Rollback user
4. **User-Vendor Linking Failure** → Rollback both vendor and user
5. **Any Other Error** → Rollback user (in catch block)

## Safety Checks

- Only rollback if `userWasNew === true`
- Only delete if user has no vendor linked
- Log all rollback actions
- Don't fail if rollback itself fails (log error)

## Testing

1. **Test Normal Flow**: Create vendor with new user → Should succeed
2. **Test Invalid Slug**: Should rollback user creation
3. **Test Slug Conflict**: Should rollback user creation
4. **Test Database Error**: Should rollback user creation
5. **Test Existing User**: Should update, not create new user

## Status

✅ **FIXED** - User rollback implemented
✅ **FIXED** - Database index fix script created
✅ **FIXED** - Enhanced error handling

## Next Steps

1. Run the index fix script: `node server/scripts/fixVendorIndexes.js`
2. Test vendor creation
3. Verify no orphaned users remain

