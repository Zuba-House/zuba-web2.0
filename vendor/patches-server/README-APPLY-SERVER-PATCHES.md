# Server patches for vendor notifications

The `server/` folder was read-only in the editor environment. Copy these files into your API project so notifications are stored in the database and pushed on key events.

## 1. Copy `vendorNotifications.js`

Copy `vendor/patches-server/vendorNotifications.js` → `server/utils/vendorNotifications.js`

## 2. Update `server/models/notification.model.js`

- Extend `type` enum with: `product_approved`, `product_rejected`, `payout_update`, `account_status`
- Add optional field: `productId` (ObjectId, ref `product`)

## 3. Wire helpers (non-blocking `.catch()` after emails)

| File | After |
|------|--------|
| `server/services/orderFulfillment.service.js` | `sendVendorNewOrder(...)` → `notifyVendorNewOrder(vendor, order, vendorItems)` |
| `server/controllers/adminVendor.controller.js` | status update emails → `notifyVendorStatusChange(vendor, status, notes)` |
| `server/controllers/adminVendor.controller.js` | product approve/reject emails → `notifyVendorProductApproved` / `notifyVendorProductRejected` |
| `server/controllers/adminPayout.controller.js` | payout emails → `notifyVendorPayout(vendor, payout, 'approved' \| 'rejected' \| 'paid')` |

Import from `../utils/vendorNotifications.js`.

Restart the API after applying.
