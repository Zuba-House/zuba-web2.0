# Product Management Access Update

## Overview
Updated the system to allow users with ADMIN or MARKETING_MANAGER roles to create, update, and publish products even if their email is not in the admin email list. Products created by non-full-admins will require admin approval.

## Changes Made

### 1. New Middleware: `requireProductManagementAccess`
**Location:** `server/middlewares/adminEmailCheck.js`

- Allows users with ADMIN or MARKETING_MANAGER roles to manage products
- Does NOT require email to be in admin email list
- Sets flags on request:
  - `req.isFullAdmin`: true if email is in admin list
  - `req.canAutoApprove`: true only for full admins
  - `req.isMarketingManager`: true if role is MARKETING_MANAGER

### 2. Updated Product Routes
**Location:** `server/route/product.route.js`

Changed from `requireAdminPanelAccess` to `requireProductManagementAccess` for:
- `POST /api/product/create` - Create products
- `PUT /api/product/updateProduct/:id` - Update products
- `POST /api/product/uploadImages` - Upload product images
- `POST /api/product/uploadBannerImages` - Upload banner images
- `DELETE /api/product/:id` - Delete products
- `DELETE /api/product/deleteMultiple` - Delete multiple products
- `DELETE /api/product/deteleImage` - Delete product images

### 3. Updated Product Creation Logic
**Location:** `server/controllers/product.controller.js` (createProduct function)

- Full Admins (email in admin list): Products auto-approved (`APPROVED`)
- Marketing Managers (role but not in email list): Products require approval (`PENDING_REVIEW`)
- Vendors: Products require approval (`PENDING_REVIEW`)

### 4. Updated Product Update Logic
**Location:** `server/controllers/product.controller.js` (updateProduct function)

- When non-full-admin changes status to `published`: Sets `approvalStatus` to `PENDING_REVIEW`
- Full admins can auto-approve when publishing
- Only full admins can directly change `approvalStatus` field

## Security Features

1. **Role-Based Access**: Only ADMIN and MARKETING_MANAGER roles can access product management
2. **Approval Workflow**: Non-full-admins cannot auto-approve products
3. **Status Protection**: Publishing products by non-full-admins automatically triggers approval requirement
4. **Full Admin Override**: Full admins can still override approval status if needed

## User Experience

### For Marketing Managers / Non-Full-Admins:
- ✅ Can create products
- ✅ Can update products
- ✅ Can publish products (but requires approval)
- ✅ Products show as `PENDING_REVIEW` until admin approves
- ❌ Cannot auto-approve products
- ❌ Cannot directly change approval status

### For Full Admins:
- ✅ Can create products (auto-approved)
- ✅ Can update products
- ✅ Can publish products (auto-approved)
- ✅ Can change approval status directly
- ✅ Full control over product approval workflow

## Testing Checklist

- [ ] Marketing Manager can create product → Should be `PENDING_REVIEW`
- [ ] Marketing Manager can update product → Approval status preserved
- [ ] Marketing Manager publishes product → Should be `PENDING_REVIEW`
- [ ] Full Admin creates product → Should be `APPROVED`
- [ ] Full Admin publishes product → Should be `APPROVED`
- [ ] Full Admin can change approval status → Should work
- [ ] Marketing Manager cannot change approval status → Should be blocked

## Notes

- Products with `PENDING_REVIEW` status will not appear in public product listings
- Only products with `APPROVED` status and `published` status are visible to customers
- Admin panel should show pending products for review
- Email notifications should be sent when products require approval

