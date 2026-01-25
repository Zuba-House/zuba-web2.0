# 📦 Product-Type-Based Shipping System

## Problem Solved
Previously, all products were charged the same shipping rate regardless of size/type. Now the system differentiates between:
- **Small items** (jewelry, accessories): Lower shipping costs
- **Standard items** (decor, large items): Regular shipping costs

---

## 🎯 How Products Are Classified

### Classification Method
The system uses **three factors** to determine shipping tier:

1. **Product Weight**
   - Items < 0.2kg (200g): Automatically classified as "small"
   - Items < 0.3kg (300g): Default to "small" if no other indicators
   - Items ≥ 0.3kg: Default to "standard"

2. **Product Name Keywords**
   - **Small Item Keywords**: earring, bracelet, necklace, ring, pendant, charm, brooch, anklet, bangle, cuff, jewelry, watch, keychain, accessory
   - **Large Item Keywords**: decor, decoration, furniture, art, painting, sculpture, statue, vase, lamp, rug, carpet, curtain, mirror, frame, canvas, wall art, home decor

3. **Category Name**
   - Checks product category name for keywords
   - Matches against same keyword lists

### Classification Logic
```javascript
1. If weight < 0.2kg → "small"
2. If product name/category contains small item keywords → "small"
3. If product name/category contains large item keywords → "standard"
4. If weight < 0.3kg → "small", else → "standard"
```

---

## 💰 New Shipping Rates

### Canada

#### Small Items (Jewelry, Accessories)
- **Standard**: $6 base + $1.50 per additional item
- **Express**: $12 base + $2.50 per additional item
- **Delivery**: 4-8 business days

#### Standard Items (Decor, Large Items)
- **Standard**: $10 base + $3 per additional item
- **Express**: $17 base + $5 per additional item
- **Delivery**: 5-10 business days

### USA

#### Small Items
- **Standard**: $8 base + $1 per additional item
- **Express**: $15 base + $2 per additional item
- **Delivery**: 6-12 business days

#### Standard Items
- **Standard**: $13 base + $2 per additional item
- **Express**: $20 base + $3 per additional item
- **Delivery**: 7-14 business days

### International

#### Small Items
- **Standard**: $10 base + $1.50 per additional item
- **Express**: $20 base + $2.50 per additional item
- **Delivery**: 8-16 business days

#### Standard Items
- **Standard**: $15 base + $2.50 per additional item
- **Express**: $25 base + $3 per additional item
- **Delivery**: 10-20 business days

---

## 📊 Calculation Examples

### Example 1: 3 Earrings (Small Items) - Canada
```
Classification: Small (earring keyword + weight < 0.2kg)
Standard: $6 + (3-1) × $1.50 = $6 + $3 = $9
Express: $12 + (3-1) × $2.50 = $12 + $5 = $17
```

### Example 2: 3 Decor Items (Standard Items) - Canada
```
Classification: Standard (decor keyword + weight > 0.3kg)
Standard: $10 + (3-1) × $3 = $10 + $6 = $16
Express: $17 + (3-1) × $5 = $17 + $10 = $27
```

### Example 3: Mixed Order (2 Earrings + 1 Decor) - Canada
```
Small items: 2 earrings
Standard items: 1 decor

Small Standard: $6 + (2-1) × $1.50 = $7.50
Standard Standard: $10 (base only, 1 item)
Total Standard: $7.50 + $10 = $17.50

Small Express: $12 + (2-1) × $2.50 = $14.50
Standard Express: $17 (base only, 1 item)
Total Express: $14.50 + $17 = $31.50
```

### Example 4: 5 Bracelets (Small Items) - USA
```
Classification: Small (bracelet keyword)
Standard: $8 + (5-1) × $1 = $8 + $4 = $12
Express: $15 + (5-1) × $2 = $15 + $8 = $23
```

### Example 5: 5 Decor Items (Standard Items) - USA
```
Classification: Standard (decor keyword)
Standard: $13 + (5-1) × $2 = $13 + $8 = $21
Express: $20 + (5-1) × $3 = $20 + $12 = $32
```

---

## 🔧 Technical Implementation

### Files Modified
1. **`server/services/shipping.service.js`**
   - Added `getProductShippingTier()` function
   - Updated `calculateFallbackRates()` to use product classification
   - Separate pricing for small vs standard items

2. **`server/controllers/shipping.controller.js`**
   - Updated item mapping to include category information
   - Passes product name, category, and weight to shipping service

### Key Functions

#### `getProductShippingTier(item)`
```javascript
// Returns: 'small' or 'standard'
// Checks:
// 1. Weight (< 0.2kg = small)
// 2. Product name keywords
// 3. Category name keywords
// 4. Default by weight (< 0.3kg = small)
```

#### `calculateFallbackRates(items, destination)`
```javascript
// Groups items by shipping tier
// Calculates costs separately for small and standard items
// Combines costs for final total
// Returns breakdown in response
```

---

## 📋 Product Classification Keywords

### Small Items (Jewelry/Accessories)
- earring, earrings
- bracelet, bracelets
- necklace, necklaces
- ring, rings
- pendant, pendants
- charm, charms
- brooch, brooches
- anklet, anklets
- bangle, bangles
- cuff, cuffs
- jewelry, jewellery
- accessory, accessories
- watch, watches
- keychain, keychains

### Large Items (Decor/Furniture)
- decor, decoration
- furniture
- art, painting, sculpture, statue
- vase, vases
- lamp, lamps
- rug, rugs, carpet, carpets
- curtain, curtains
- mirror, mirrors
- frame, frames
- canvas
- wall art
- home decor
- interior, furnishing

---

## 🎁 Benefits

1. **Fair Pricing**: Small items pay less, large items pay appropriate rates
2. **Automatic Classification**: No manual configuration needed
3. **Mixed Orders**: Handles combinations of small and standard items
4. **Weight-Based Fallback**: Uses weight if keywords don't match
5. **Backward Compatible**: Works with existing products

---

## ⚙️ Customization

### To Add More Keywords
Edit `getProductShippingTier()` in `server/services/shipping.service.js`:
```javascript
const smallItemKeywords = [
  // Add your keywords here
  'your-keyword'
];
```

### To Adjust Weight Thresholds
Edit `getProductShippingTier()`:
```javascript
if (weight < 0.2) {  // Change 0.2 to your threshold
  return 'small';
}
```

### To Modify Rates
Edit `calculateFallbackRates()` in `server/services/shipping.service.js`:
```javascript
small: {
  standard: { base: 6, additional: 1.5, ... }  // Adjust rates here
}
```

---

## 📝 Notes

- **Caps Still Apply**: Maximum $30 Standard, $40 Express
- **EasyPost Integration**: For Canada, EasyPost rates are still used when available (weight-based)
- **Mixed Orders**: Costs are calculated separately and combined
- **Default Weight**: 0.5kg per item if not specified in product
- **Category Support**: Works with both new category system and legacy `catName` field
