# 📊 Shipping Calculation Logic Report

## 🔍 Current Implementation Overview

### **Calculation Formula:**
```
Final Cost = (Base Cost + Zone Cost + Weight Cost) × Category Multiplier
Express Cost = Final Cost × 1.5
```

---

## 📋 Step-by-Step Calculation Logic

### **Step 1: Base Cost Calculation**
```javascript
Base Cost = $10 (first item) + ($3 × additional items)
```
- **Example:** 1 item = $10, 2 items = $13, 3 items = $16

### **Step 2: Zone Detection**
The system determines shipping zone based on:
- **Country Code** (2-letter: CA, US, etc.)
- **Province/State Code** (for Canada: ON, QC, etc.)

**Zone Mapping:**
| Zone | Criteria | Zone Cost |
|------|----------|-----------|
| `local` | Canada (ON or QC) | +$0 |
| `western` | Canada (other provinces) | +$5 |
| `usa` | United States | +$8 |
| `international` | All other countries | +$15 |

**Zone Detection Code:**
```javascript
if (countryCode === 'CA') {
  if (province === 'ON' || province === 'QC') return 'local';
  else return 'western';
} else if (countryCode === 'US') {
  return 'usa';
} else {
  return 'international';
}
```

### **Step 3: Weight-Based Cost**
```javascript
Weight Brackets:
- ≤ 0.5kg: +$0
- ≤ 1.0kg: +$2
- ≤ 2.0kg: +$4
- ≤ 5.0kg: +$6
- ≤ 10.0kg: +$10
- > 10.0kg: +$15
```

### **Step 4: Category Multiplier**
```javascript
- Clothing/Fashion/Jersey: 1.0x (no change)
- Art/Print/Poster: 1.3x
- Electronics/Tech: 1.4x
- Default: 1.0x
```

### **Step 5: Final Calculation**
```javascript
baseCost = 10 + (additionalItems × 3)
baseCost += zoneCost
baseCost += weightCost
finalCost = baseCost × categoryMultiplier
expressCost = finalCost × 1.5
```

---

## 🔄 Data Flow

### **Frontend (Cart Page) → Backend**

**1. Cart Page (`client/src/Pages/Cart/index.jsx`):**
```javascript
// Address sent to API
const addressForCalc = {
  country: shippingAddress.country || 'Canada',
  countryCode: shippingAddress.countryCode,  // e.g., 'CA', 'US'
  province: shippingAddress.province,        // e.g., 'ON', 'QC', 'NY'
  city: shippingAddress.city,
  postalCode: shippingAddress.postal_code
};

// API Call
POST /api/shipping/calculate
Body: {
  cartItems: [...],
  shippingAddress: addressForCalc
}
```

**2. Backend Controller (`server/controllers/shipping.controller.js`):**
```javascript
// Receives request and calls service
const result = shippingCalculatorService.calculateShipping(cartItems, shippingAddress);
```

**3. Shipping Service (`server/services/shipping-calculator.service.js`):**
```javascript
// Extracts country code
countryCode = shippingAddress.countryCode || 'CA'

// Determines zone
zone = getShippingZone(countryCode, province)

// Calculates costs
zoneCost = getZoneCost(zone)  // 0, 5, 8, or 15
finalCost = (baseCost + zoneCost + weightCost) × categoryMultiplier
```

---

## 💰 Expected Prices by Location

### **Example: 1 item, 0.5kg, Clothing category (1.0x multiplier)**

| Location | Base | Zone | Weight | Category | **Standard** | **Express** |
|----------|------|------|--------|----------|--------------|-------------|
| **Ottawa, ON (CA)** | $10 | +$0 | +$0 | ×1.0 | **$10.00** | **$15.00** |
| **Montreal, QC (CA)** | $10 | +$0 | +$0 | ×1.0 | **$10.00** | **$15.00** |
| **Vancouver, BC (CA)** | $10 | +$5 | +$0 | ×1.0 | **$15.00** | **$22.50** |
| **New York, NY (US)** | $10 | +$8 | +$0 | ×1.0 | **$18.00** | **$27.00** |
| **London, UK** | $10 | +$15 | +$0 | ×1.0 | **$25.00** | **$37.50** |
| **Tokyo, Japan** | $10 | +$15 | +$0 | ×1.0 | **$25.00** | **$37.50** |

### **Example: 2 items, 1.2kg, Art category (1.3x multiplier)**

| Location | Base | Zone | Weight | Category | **Standard** | **Express** |
|----------|------|------|--------|----------|--------------|-------------|
| **Ottawa, ON** | $13 | +$0 | +$2 | ×1.3 | **$19.50** | **$29.25** |
| **Vancouver, BC** | $13 | +$5 | +$2 | ×1.3 | **$26.00** | **$39.00** |
| **New York, NY** | $13 | +$8 | +$2 | ×1.3 | **$29.90** | **$44.85** |
| **London, UK** | $13 | +$15 | +$2 | ×1.3 | **$39.00** | **$58.50** |

---

## 🐛 Potential Issues & Debug Points

### **Issue 1: Country Code Not Being Extracted Correctly**
**Check:** What is being sent from frontend?
```javascript
// In Cart page, check console.log:
console.log('Address being sent:', addressForCalc);
// Should show: { countryCode: 'CA', province: 'ON', ... }
```

**Possible Problems:**
- `shippingAddress.countryCode` might be undefined
- Country name instead of code being sent
- Province code not being extracted from Google Maps

### **Issue 2: Zone Detection Failing**
**Check:** Backend console logs
```javascript
// Should see in server logs:
"Shipping calculation - Address: { countryCode: 'CA', province: 'ON', ... }"
"Shipping calculation - Zone: local"
"Shipping calculation - Costs: { zone: 'local', zoneCost: 0, ... }"
```

**Possible Problems:**
- Province code not matching (e.g., 'Ontario' instead of 'ON')
- Country code defaulting to 'CA' when it should be different
- Zone always returning 'international'

### **Issue 3: Product Data Not Being Fetched**
**Check:** Are products being fetched with category and weight?
```javascript
// In Cart page, check if product data includes:
product.category  // Should have category name
product.shipping.weight  // Should have weight
product.inventory.weight  // Alternative weight location
```

**Possible Problems:**
- Products don't have category set
- Products don't have weight set (defaults to 0.5kg)
- Category multiplier always 1.0x

### **Issue 4: Calculation Not Being Applied**
**Check:** Are the calculations actually running?
```javascript
// Backend should log:
"Shipping calculation - Costs: {
  baseCost: 10,
  zone: 'local',
  zoneCost: 0,
  finalCost: '10.00',
  expressCost: '15.00'
}"
```

---

## 🔧 Debugging Steps

### **Step 1: Check Frontend Data**
Open browser console on cart page and check:
```javascript
// Add this to Cart/index.jsx calculateShipping function:
console.log('🔍 DEBUG - Address being sent:', addressForCalc);
console.log('🔍 DEBUG - Cart items:', cartItemsWithProducts);
```

### **Step 2: Check Backend Logs**
Check server console for:
```javascript
// Should see these logs:
"Shipping calculation - Address: { countryCode: '...', province: '...' }"
"Shipping calculation - Zone: ..."
"Shipping calculation - Costs: { ... }"
```

### **Step 3: Test Different Addresses**
Try these addresses and check prices:
1. **Ottawa, ON, Canada** → Should be $10/$15
2. **Vancouver, BC, Canada** → Should be $15/$22.50
3. **New York, NY, USA** → Should be $18/$27
4. **London, UK** → Should be $25/$37.50

### **Step 4: Verify API Response**
Check network tab in browser:
```javascript
// POST /api/shipping/calculate response should include:
{
  success: true,
  options: [
    { id: 'standard', price: 10.00, ... },
    { id: 'express', price: 15.00, ... }
  ],
  calculation: {
    zone: 'local',
    zoneCost: 0,
    finalCost: 10.00
  }
}
```

---

## 📝 Current Code Locations

1. **Frontend Cart Page:** `client/src/Pages/Cart/index.jsx` (lines 72-142)
2. **Backend Controller:** `server/controllers/shipping.controller.js` (lines 407-438)
3. **Shipping Service:** `server/services/shipping-calculator.service.js` (lines 19-210)
4. **Zone Detection:** `server/services/shipping-calculator.service.js` (lines 215-238)
5. **Zone Costs:** `server/services/shipping-calculator.service.js` (lines 243-251)

---

## 🎯 Quick Fix Checklist

- [ ] Verify `countryCode` is being sent correctly from frontend
- [ ] Verify `province` code is being extracted correctly (should be 2-letter code)
- [ ] Check backend console logs for zone detection
- [ ] Verify zone costs are being added (should see different zoneCost values)
- [ ] Test with different countries to see if zone changes
- [ ] Check if category multiplier is being applied
- [ ] Verify weight is being calculated correctly

---

## 📞 What to Share for Debugging

Please share:
1. **Browser Console Logs** - When entering address on cart page
2. **Server Console Logs** - When calculating shipping
3. **Network Tab Response** - The actual API response from `/api/shipping/calculate`
4. **Test Addresses Used** - What addresses you tried and what prices you got
5. **Expected vs Actual Prices** - What you expected vs what you're seeing

This will help identify exactly where the calculation is failing!

