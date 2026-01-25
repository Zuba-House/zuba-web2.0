# 📦 Zuba House Shipping Fee Calculation System

## Overview
The system uses a **two-tier shipping calculation approach**:
1. **EasyPost API** (for Canada destinations) - Real-time rates from Canada Post
2. **Fallback Calculator** (for all destinations) - Zone-based pricing with caps

---

## 🏗️ Shipping Calculation Flow

### Step 1: Determine Shipping Zone
Based on destination country code:
- **Canada (CA)**: Uses EasyPost if API key configured, otherwise fallback
- **USA (US)**: Uses fallback calculator
- **International**: Uses fallback calculator

### Step 2: Calculate Shipping Rates

#### **Option A: EasyPost (Canada Only)**
- **When Used**: Canada destinations + EASYPOST_API_KEY configured
- **How It Works**:
  1. Creates shipment with warehouse address (Gatineau, QC) and customer address
  2. Calculates total weight: `sum(item.weight × quantity)` (default 0.5kg per item)
  3. Gets real rates from Canada Post via EasyPost API
  4. Converts CAD to USD (0.73 conversion rate)
  5. Applies caps: **$30 max for Standard, $40 max for Express**
  6. Ensures Express is at least 1.2× Standard rate

**Example Calculation:**
```
Items: 2 products, 0.5kg each = 1.0kg total
EasyPost returns: $15 CAD Standard, $25 CAD Express
Converted: $10.95 USD Standard, $18.25 USD Express
Capped: $10.95 Standard (under $30), $18.25 Express (under $40)
```

#### **Option B: Fallback Calculator (All Destinations)**
- **When Used**: Non-Canada destinations OR EasyPost unavailable
- **Zone-Based Pricing:**

| Zone | Standard Base | Standard Additional Item | Express Base | Express Additional Item | Max Standard | Max Express |
|------|---------------|-------------------------|--------------|------------------------|--------------|-------------|
| **Canada** | $10 | $3 | $17 | $5 | $30 | $40 |
| **USA** | $13 | $2 | $20 | $3 | $30 | $40 |
| **International** | $15 | $2.50 | $25 | $3 | $30 | $40 |

**Calculation Formula:**
```
Standard Cost = Base + (ItemCount - 1) × AdditionalItemRate
Express Cost = ExpressBase + (ItemCount - 1) × ExpressAdditionalRate

Then apply caps:
Standard Cost = min(calculated, $30)
Express Cost = min(calculated, $40)
```

**Example Calculations:**

**Example 1: Canada, 1 item**
```
Standard: $10 + (1-1) × $3 = $10
Express: $17 + (1-1) × $5 = $17
```

**Example 2: Canada, 3 items**
```
Standard: $10 + (3-1) × $3 = $10 + $6 = $16
Express: $17 + (3-1) × $5 = $17 + $10 = $27
```

**Example 3: USA, 5 items**
```
Standard: $13 + (5-1) × $2 = $13 + $8 = $21
Express: $20 + (5-1) × $3 = $20 + $12 = $32
```

**Example 4: International, 10 items (hits cap)**
```
Standard: $15 + (10-1) × $2.50 = $15 + $22.50 = $37.50 → Capped at $30
Express: $25 + (10-1) × $3 = $25 + $27 = $52 → Capped at $40
```

---

## 💰 How Shipping is Charged

### 1. **At Cart Page**
- Customer enters shipping address
- System calculates shipping rates based on:
  - Destination country
  - Number of items in cart
  - Item weights (default 0.5kg per item if not specified)
- Two options shown: **Standard** and **Express**
- Customer selects preferred shipping method

### 2. **Shipping Cost Calculation**
```javascript
// In Checkout
shippingCost = discounts?.freeShipping 
  ? 0  // FREE if coupon/promo provides free shipping
  : (selectedShippingRate?.cost || selectedShippingRate?.price || 0)
```

### 3. **Final Order Total**
```javascript
subtotal = sum(item.price × item.quantity)
shippingCost = (freeShipping ? 0 : selectedRate.cost)
discounts = couponDiscount + giftCardDiscount + automaticDiscounts
finalTotal = subtotal - discounts + shippingCost
```

**Note**: If `freeShipping` is true, shipping cost is set to $0, but the discount service already accounts for this in `finalTotal`.

---

## 🎁 Free Shipping

### When Free Shipping Applies:
1. **Coupon/Promo Code** with `freeShipping: true`
2. **Automatic Discount** that includes free shipping
3. **Gift Card** promotion (if configured)

### How It Works:
```javascript
// In discount service
if (discounts.freeShipping) {
  discounts.finalTotal = finalTotal; // Shipping already $0
} else {
  discounts.finalTotal = finalTotal + shippingCost;
}
```

**Example:**
```
Subtotal: $100
Shipping: $15 (Standard)
Coupon: 10% off + Free Shipping

Calculation:
- Discount: $100 × 10% = $10
- Free Shipping: $15 → $0
- Final Total: $100 - $10 + $0 = $90
```

---

## 📊 Shipping Rate Structure

### Standard Shipping
- **Name**: "Zuba Standard Shipping"
- **Delivery**: 5-10 business days (Canada), 7-14 days (USA), 10-20 days (International)
- **Max Cost**: $30 USD
- **Source**: EasyPost (Canada) or Fallback Calculator

### Express Shipping
- **Name**: "Zuba Express Shipping"
- **Delivery**: 2-5 business days (Canada), 3-7 days (USA), 5-10 days (International)
- **Max Cost**: $40 USD
- **Source**: EasyPost (Canada) or Fallback Calculator
- **Minimum Premium**: Always at least 1.2× Standard rate

---

## 🔧 Technical Details

### Weight Calculation
- **Default Weight**: 0.5kg per item if not specified
- **Source Priority**:
  1. `item.product.shipping.weight`
  2. `item.product.inventory.weight`
  3. Default: 0.5kg

### Distance Calculation (Region Calculator - Not Currently Used in Main Flow)
- Uses Haversine formula for distance from warehouse
- Warehouse: Gatineau, Quebec (45.4765°N, -75.7013°W)
- Distance multipliers apply for:
  - Over 1000km: `cost × (1 + (distance/10000) × multiplier)`
  - Over 500km: `cost × (1 + (distance/5000) × multiplier)`

### Bulk Discount (Region Calculator Only)
- **10+ items**: 15% discount (0.85 multiplier)
- Only applies in region-based calculator (not in main fallback)

---

## 📝 Summary

### Shipping Calculation Summary:
1. **Zone Detection**: Based on country code (CA, US, or International)
2. **Rate Source**: EasyPost for Canada (if available), Fallback for all others
3. **Cost Formula**: Base + (Items-1) × AdditionalRate, then capped
4. **Free Shipping**: Applied via coupons/promos, sets shipping to $0
5. **Final Total**: Subtotal - Discounts + Shipping (or 0 if free shipping)

### Key Caps:
- **Standard Shipping**: Maximum $30 USD
- **Express Shipping**: Maximum $40 USD
- **Express Premium**: Minimum 1.2× Standard rate

### Example Order:
```
Items: 3 products @ $20 each = $60 subtotal
Destination: Canada
Shipping Selected: Standard ($16)
Coupon: 15% off + Free Shipping

Calculation:
- Subtotal: $60
- Discount: $60 × 15% = $9
- Shipping: $0 (free shipping)
- Final Total: $60 - $9 + $0 = $51
```

---

## 🚨 Important Notes

1. **EasyPost Integration**: Requires `EASYPOST_API_KEY` environment variable
2. **Currency**: All rates converted to USD
3. **Weight Default**: 0.5kg per item if not specified in product
4. **Caps**: Always applied to prevent excessive shipping costs
5. **Free Shipping**: Overrides calculated shipping cost to $0
6. **Express Minimum**: Always at least 20% more expensive than Standard
