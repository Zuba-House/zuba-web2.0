# Product Variations Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (Phase 4)                   │
├─────────────────────────────────────────────────────────────────┤
│  Product Page                 Cart              Checkout         │
│  ├─ Variant Selector         ├─ Cart Items     ├─ Order Review  │
│  ├─ Color Swatches           ├─ Selection      └─ Confirmation  │
│  ├─ Size Buttons             └─ Qty                              │
│  └─ Price/Stock                                                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP Requests
┌──────────────────────────────▼──────────────────────────────────┐
│                    API LAYER (Phase 1-2) ✅                      │
├──────────────────────────────────────────────────────────────────┤
│  /api/attributes           /api/products/:id/variations          │
│  ├─ POST /                 ├─ GET /                            │
│  ├─ GET /                  ├─ POST / (create single)            │
│  ├─ PUT /:id               ├─ POST /generate (auto-generate)    │
│  ├─ DELETE /:id            ├─ PUT /:variationId                 │
│  ├─ POST /:id/values       ├─ DELETE /:variationId              │
│  └─ GET /:id/values        ├─ GET /find (search)                │
│                            └─ PUT /bulk-update                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                  CONTROLLER LAYER (Phase 1-2) ✅                │
├──────────────────────────────────────────────────────────────────┤
│  attribute.controller.js       variation.controller.js          │
│  ├─ createAttribute          ├─ getProductVariations           │
│  ├─ getAllAttributes         ├─ createVariation                │
│  ├─ getAttributeById         ├─ updateVariation                │
│  ├─ updateAttribute          ├─ deleteVariation                │
│  ├─ deleteAttribute          ├─ generateVariations ⭐          │
│  ├─ createAttributeValue     ├─ findVariationByAttributes      │
│  ├─ updateAttributeValue     ├─ bulkUpdateVariations           │
│  ├─ deleteAttributeValue     └─ updateProductStock ⭐          │
│  └─ getAttributeValues                                          │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                    DATABASE LAYER (Phase 1-2) ✅               │
├──────────────────────────────────────────────────────────────────┤
│  MongoDB Collections:                                            │
│                                                                  │
│  ┌─────────────────────────────────────────────────────┐        │
│  │ Attributes Collection                               │        │
│  ├─ name: "Color"                                     │        │
│  ├─ slug: "color"                                     │        │
│  ├─ type: "color_swatch"                              │        │
│  ├─ visibility: "both"                                │        │
│  └─ isGlobal: true                                    │        │
│  └─ Index: { slug: 1 }, { isGlobal: 1 }             │        │
│  └─────────────────────────────────────────────────────┘        │
│                           ▼ references                           │
│  ┌─────────────────────────────────────────────────────┐        │
│  │ AttributeValues Collection                          │        │
│  ├─ attributeId: ObjectId (ref to Attributes)        │        │
│  ├─ label: "Red"                                      │        │
│  ├─ value: "red"                                      │        │
│  ├─ meta: { colorCode: "#FF0000" }                    │        │
│  ├─ usageCount: 5                                     │        │
│  └─ isActive: true                                    │        │
│  └─ Index: { attributeId: 1, value: 1 (unique) }    │        │
│  └─────────────────────────────────────────────────────┘        │
│                           ▼ references                           │
│  ┌─────────────────────────────────────────────────────┐        │
│  │ ProductVariations Collection                        │        │
│  ├─ productId: ObjectId (ref to Products)            │        │
│  ├─ attributes: [                                     │        │
│  │   {                                                │        │
│  │     attributeId: ObjectId,                         │        │
│  │     valueId: ObjectId,                             │        │
│  │     label: "Color: Red"                            │        │
│  │   }                                                │        │
│  │ ]                                                  │        │
│  ├─ sku: "TSH-RED-L" (unique)                        │        │
│  ├─ price: 35                                         │        │
│  ├─ salePrice: 30                                     │        │
│  ├─ stock: 15                                         │        │
│  ├─ images: ["url1", "url2"]                         │        │
│  ├─ isActive: true                                    │        │
│  ├─ isDefault: true                                   │        │
│  ├─ weight: 0.5                                       │        │
│  └─ dimensions: { length: 10, width: 8, height: 2 }  │        │
│  └─ Index: { productId: 1 }, { productId: 1, isActive: 1 } │ │
│  └─────────────────────────────────────────────────────┘        │
│                           ▼ references                           │
│  ┌─────────────────────────────────────────────────────┐        │
│  │ Products Collection (UPDATED)                       │        │
│  ├─ name: "Premium T-Shirt"                           │        │
│  ├─ productType: "simple" | "variable" ⭐             │        │
│  ├─ price: 35                                         │        │
│  ├─ oldPrice: 50                                      │        │
│  ├─ countInStock: 100                                 │        │
│  ├─ priceRange: { min: 30, max: 50 } ⭐              │        │
│  ├─ attributes: [ ⭐                                  │        │
│  │   {                                                │        │
│  │     attributeId: ObjectId,                         │        │
│  │     values: [ObjectId, ObjectId]                   │        │
│  │   }                                                │        │
│  │ ]                                                  │        │
│  ├─ images: ["url1", "url2"]                         │        │
│  └─ ... (existing fields)                            │        │
│  └─ Index: { productType: 1 }                        │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                  │
│  ⭐ = New fields added for variations system                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Creating Variations (Auto-Generate Flow)

```
Admin clicks "Generate Variations"
        │
        ▼
┌─────────────────────────────────┐
│ Select Attributes & Values      │
│ Color: Red, Blue                │
│ Size: S, M, L                   │
└────────────┬────────────────────┘
             │
             ▼
POST /api/products/:id/variations/generate
        │
        ▼
┌──────────────────────────────────────────┐
│ generateVariations Controller            │
│ ├─ Validate attributes exist             │
│ ├─ Fetch all attribute values            │
│ └─ Generate combinations (n^m)           │
│    2 colors × 3 sizes = 6 combinations   │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│ Create ProductVariation Documents        │
│ for each combination:                    │
│ ├─ Red + S → variation1                 │
│ ├─ Red + M → variation2                 │
│ ├─ Red + L → variation3                 │
│ ├─ Blue + S → variation4                │
│ ├─ Blue + M → variation5                │
│ └─ Blue + L → variation6                │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│ Update Parent Product                    │
│ ├─ productType: "simple" → "variable" ✓ │
│ ├─ countInStock: recalculated           │
│ ├─ priceRange: recalculated             │
│ └─ attributes: linked & saved           │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│ Increment AttributeValue usageCount      │
│ for each value used                      │
└────────────┬─────────────────────────────┘
             │
             ▼
Response: 6 variations created ✓
```

---

### Customer Selecting a Variation (Frontend Flow - Phase 4)

```
Customer views Product Page
        │
        ▼
┌─────────────────────────────────┐
│ Render Variation Selector       │
│ ├─ Color: [Red] [Blue]          │
│ ├─ Size: [S] [M] [L]            │
│ └─ Price: $35 (starts blank)    │
└────────────┬────────────────────┘
             │ (customer clicks: Red + Large)
             ▼
GET /api/products/:id/variations/find?color=red&size=l
        │
        ▼
┌──────────────────────────────────────────┐
│ findVariationByAttributes Controller     │
│ ├─ Parse query params                    │
│ ├─ Build attribute filter                │
│ └─ Return matching variation             │
└────────────┬─────────────────────────────┘
             │
             ▼
Response: {
  _id: "var2",
  sku: "TSH-RED-L",
  price: 35,
  salePrice: 30,
  stock: 15,
  images: ["red-large-1.jpg", "red-large-2.jpg"],
  displayName: "Color: Red / Size: Large"
}
             │
             ▼
┌─────────────────────────────────┐
│ Update Frontend Display         │
│ ├─ Price: $30 (with sale)      │
│ ├─ Stock: 15 available         │
│ ├─ Images: Show Red Large       │
│ ├─ SKU: TSH-RED-L              │
│ └─ Button: "Add to Cart"       │
└─────────────────────────────────┘
```

---

## Variation Combination Generation Algorithm

```
generateCombinations(attributeList):
  
  Input: [
    { attr: Color, values: [Red, Blue] },
    { attr: Size, values: [S, M, L] }
  ]
  
  Step 1: Start with first attribute
    combinations = [
      [Red],
      [Blue]
    ]
  
  Step 2: Cross with Size attribute
    combinations = [
      [Red, S],      [Red, M],      [Red, L],
      [Blue, S],     [Blue, M],     [Blue, L]
    ]
  
  Output: 6 combinations
  
  Formula: Product of all attribute value counts
           2 × 3 = 6 combinations
           3 × 3 × 2 = 18 combinations
           4 × 5 × 3 × 2 = 120 combinations
```

---

## Stock Recalculation Logic

```
When variation stock changes:

updateProductStock(productId)
  
  Step 1: Fetch all active variations
    variations = ProductVariation.find({
      productId: productId,
      isActive: true
    })
  
  Step 2: Sum all variation stocks
    totalStock = sum(variation.stock for each variation)
    
  Step 3: Calculate price range
    priceRange.min = min(price or salePrice)
    priceRange.max = max(price)
  
  Step 4: Update parent product
    Product.update({
      countInStock: totalStock,
      priceRange: { min, max }
    })
  
  Result: Product always reflects current inventory
```

---

## Attribute Type Support

```
┌─ Select ──────────────────────┐
│ Rendered as: <select dropdown>│
│ Example: Size (S, M, L, XL)   │
│ Data: label only               │
└────────────────────────────────┘

┌─ Color Swatch ────────────────┐
│ Rendered as: colored buttons   │
│ Example: Color (Red, Blue)     │
│ Data: #FF0000, #0000FF         │
│ Used for: clothes color, etc.  │
└────────────────────────────────┘

┌─ Image Swatch ────────────────┐
│ Rendered as: image thumbnails │
│ Example: Material (Cotton...)  │
│ Data: image URLs               │
│ Used for: texture, pattern     │
└────────────────────────────────┘

┌─ Button ──────────────────────┐
│ Rendered as: visual buttons    │
│ Example: Size (S M L XL)       │
│ Data: label only (styled)      │
│ Used for: size, fit, style     │
└────────────────────────────────┘
```

---

## Query Optimization

```
Common Queries & Indexes:

1. Get all variations for product
   Index: { productId: 1, isActive: 1 }
   Query: ProductVariation.find({ productId, isActive: true })

2. Find active attributes
   Index: { isGlobal: 1, isActive: 1 }
   Query: Attribute.find({ isGlobal: true, isActive: true })

3. Check SKU uniqueness
   Index: { sku: 1 (unique) }
   Query: ProductVariation.findOne({ sku: "TSH-RED-L" })

4. Get attribute values
   Index: { attributeId: 1, value: 1 (unique) }
   Query: AttributeValue.find({ attributeId })

Performance Impact:
├─ Without indexes: Full collection scan (slow)
└─ With indexes: Key lookup + range scan (fast)
   Typical response: < 100ms
```

---

## Error Handling Flow

```
API Request
    │
    ▼
┌─────────────────────────┐
│ Input Validation        │
├─────────────────────────┤
│ ✗ Missing required      │
│   → 400 Bad Request     │
│   → "Price required"    │
└─────────────────────────┘
    │ ✓ Valid input
    ▼
┌─────────────────────────┐
│ Business Logic Check    │
├─────────────────────────┤
│ ✗ Product not found     │
│   → 404 Not Found       │
│ ✗ SKU already exists    │
│   → 409 Conflict        │
└─────────────────────────┘
    │ ✓ Valid business state
    ▼
┌─────────────────────────┐
│ Database Operation      │
├─────────────────────────┤
│ ✗ Connection error      │
│   → 500 Server Error    │
│   → Logged & monitored  │
└─────────────────────────┘
    │ ✓ Database success
    ▼
Response: 200/201 ✓
```

---

## Security Layer

```
┌─────────────────────────────────────────┐
│ API Request                             │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ Auth Middleware (GET requests skip)     │
│ ├─ Check Authorization header           │
│ ├─ Verify JWT token                     │
│ ├─ Check admin role                     │
│ └─ If invalid: 401 Unauthorized         │
└────────────────┬────────────────────────┘
                 │ ✓ Authenticated
                 ▼
┌─────────────────────────────────────────┐
│ Input Sanitization                      │
│ ├─ Remove <script> tags                 │
│ ├─ Escape special chars                 │
│ ├─ Validate data types                  │
│ └─ Enforce length limits                │
└────────────────┬────────────────────────┘
                 │ ✓ Clean input
                 ▼
┌─────────────────────────────────────────┐
│ Database Query                          │
│ ├─ Mongoose prevents SQL injection      │
│ ├─ Parameterized queries                │
│ ├─ Type-safe document access            │
│ └─ Schema validation on write           │
└────────────────┬────────────────────────┘
                 │ ✓ Secure query
                 ▼
Response: Safe ✓
```

---

## Backward Compatibility

```
BEFORE (Existing System)
├─ Simple products only
├─ product.productType = undefined
├─ product.priceRange = undefined
├─ product.attributes = undefined
└─ No variations concept

                    ↓ MIGRATION

AFTER (New System)
├─ Simple products (default)
│  ├─ productType: "simple"
│  ├─ priceRange: { min: 0, max: 0 }
│  ├─ attributes: []
│  └─ No variations (backward compatible)
│
├─ Variable products (new opt-in)
│  ├─ productType: "variable"
│  ├─ priceRange: { min: 30, max: 50 }
│  ├─ attributes: [linked attributes]
│  └─ Variations: 1 → many records
│
└─ ZERO breaking changes to API
   All existing endpoints work unchanged
```

---

**Architecture Status: Phase 1-2 ✅ COMPLETE**

Last Updated: November 13, 2025
