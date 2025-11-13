# Database Migration Guide

This file provides scripts to help migrate existing data to the new variations system. Run these in MongoDB or your database interface.

## STEP 1: Add productType field to all existing products (set as "simple")

```javascript
db.products.updateMany(
  { productType: { $exists: false } },
  { $set: { productType: "simple" } }
);
```

Output: `acknowledged: true, modifiedCount: n`

## STEP 2: Add priceRange field to all products

```javascript
db.products.updateMany(
  { priceRange: { $exists: false } },
  {
    $set: {
      priceRange: {
        min: 0,
        max: 0,
      },
    },
  }
);
```

## STEP 3: Add attributes array to all products

```javascript
db.products.updateMany(
  { attributes: { $exists: false } },
  { $set: { attributes: [] } }
);
```

## STEP 4: Verify migration

```javascript
db.products.findOne({});
```

Should show: `{ _id, name, productType: "simple", priceRange: {...}, attributes: [...], ... }`

## STEP 5: Create indexes for performance

```javascript
db.products.createIndex({ productType: 1 });
db.productVariations.createIndex({ productId: 1, isActive: 1 });
db.productVariations.createIndex({ productId: 1, attributes: 1 });
db.attributeValues.createIndex({ attributeId: 1, value: 1 }, { unique: true });
```

## STEP 6: Backup existing data (recommended before migration)

In MongoDB:
```bash
mongodump --db zuba_db --out /backup/zuba_backup_2025-11-13
```

**Result:** Migration complete! Your database is now ready for product variations.
