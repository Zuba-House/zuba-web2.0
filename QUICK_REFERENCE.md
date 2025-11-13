# Product Variations - Quick Reference Card

## 🚀 Quick Start (5 minutes)

### 1. Create Color Attribute
```bash
curl -X POST http://localhost:5000/api/attributes \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Color",
    "type": "color_swatch",
    "description": "Product colors"
  }'
```

### 2. Add Color Values
```bash
# Red
curl -X POST http://localhost:5000/api/attributes/{colorId}/values \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Red",
    "value": "red",
    "meta": { "colorCode": "#FF0000" }
  }'
```

### 3. Auto-Generate Variations
```bash
curl -X POST http://localhost:5000/api/products/{productId}/variations/generate \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "attributes": [{
      "attributeId": "{colorId}",
      "valueIds": ["{redValueId}", "{blueValueId}"]
    }]
  }'
```

### 4. Get All Variations
```bash
curl -X GET http://localhost:5000/api/products/{productId}/variations
```

---

## 📍 Key Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/attributes` | Create attribute |
| GET | `/api/attributes` | List all attributes |
| POST | `/api/attributes/:id/values` | Add attribute value |
| GET | `/api/attributes/:id/values` | List values |
| POST | `/api/products/:id/variations` | Create variation |
| GET | `/api/products/:id/variations` | List variations |
| POST | `/api/products/:id/variations/generate` | Auto-generate |
| GET | `/api/products/:id/variations/find?color=red` | Find by attributes |
| PUT | `/api/products/:id/variations/:vid` | Update variation |
| PUT | `/api/products/:id/variations/bulk-update` | Bulk update |
| DELETE | `/api/products/:id/variations/:vid` | Delete variation |

---

## 🎯 Common Workflows

### Workflow A: Create Simple T-Shirt with 6 Variations

**Step 1:** Create Color attribute
- Name: "Color"
- Type: "color_swatch"
- Values: Red, Blue

**Step 2:** Create Size attribute
- Name: "Size"
- Type: "button"
- Values: S, M, L

**Step 3:** Auto-generate
- Result: 6 variations (2 colors × 3 sizes)
- All with unique SKUs: TSH-RED-S, TSH-RED-M, etc.

---

### Workflow B: Update Inventory for Multiple Variations

**Use bulk-update endpoint:**
```json
{
  "variations": [
    { "_id": "var1", "stock": 20, "price": 35 },
    { "_id": "var2", "stock": 15, "price": 40 }
  ]
}
```

---

### Workflow C: Find Exact Variation

**Use find endpoint with attributes:**
```bash
GET /api/products/123/variations/find?color=red&size=l
```

Returns: Single variation with exact price, stock, images, etc.

---

## 💾 Database Schema Quick Reference

### Attributes Collection
```json
{
  "name": "Color",
  "slug": "color",
  "type": "color_swatch",
  "isGlobal": true,
  "values": [...]
}
```

### Product Variations Collection
```json
{
  "productId": "prod123",
  "attributes": [
    {
      "attributeId": "attr1",
      "valueId": "val1",
      "label": "Color: Red"
    }
  ],
  "sku": "TSH-RED-L",
  "price": 35,
  "salePrice": 30,
  "stock": 15,
  "isActive": true,
  "isDefault": false
}
```

---

## 🔍 Query Examples

### Get All Attributes with Values
```bash
GET /api/attributes
```

### Get Active Attributes Only
```bash
GET /api/attributes?isActive=true
```

### Get Attributes by Type
```bash
GET /api/attributes?type=color_swatch
```

### Get Active Variations Only
```bash
GET /api/products/123/variations?isActive=true
```

### Find Red + Large T-Shirt
```bash
GET /api/products/123/variations/find?color=red&size=large
```

---

## 🛠️ Admin UI Tasks to Build (Phase 3)

- [ ] Attributes list/create/edit page
- [ ] Add/edit attribute values
- [ ] Create variable product form
- [ ] Variations manager table
- [ ] Auto-generate button
- [ ] Bulk edit variations
- [ ] Image upload per variation
- [ ] Import/export variations

---

## 👥 Customer UI Tasks to Build (Phase 4)

- [ ] Product page variation selector
- [ ] Color swatches display
- [ ] Size button selector
- [ ] Dynamic price update
- [ ] Stock availability check
- [ ] Variation-specific images
- [ ] Add to cart with selection
- [ ] Cart shows variation details

---

## ✅ Validation Rules

| Field | Rule |
|-------|------|
| Attribute name | Required, unique, max 50 chars |
| Attribute type | Required, one of: select, color_swatch, image_swatch, button |
| Attribute value | Required, unique per attribute |
| Variation SKU | Optional but if provided must be unique |
| Variation price | Required, must be > 0 |
| Variation stock | Required, must be >= 0 |
| Color code | Valid hex format: #RRGGBB |

---

## 🔐 Security

- All write operations require admin authentication
- GET operations are public
- Auth token in `Authorization: Bearer {token}` header
- Input validation on all endpoints
- SQLi/XSS protection via Mongoose

---

## 📊 Performance Tips

- Use `/variations/find` instead of fetching all
- Bulk update instead of individual updates
- Limit variations to 50-100 per product
- Use pagination for large lists
- Cache attribute definitions on frontend

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot delete attribute" | Variations exist using it - delete variations first |
| "SKU already exists" | Use unique SKU or let system auto-generate |
| "Variation not found" | Check product ID and variation ID are correct |
| 401 Unauthorized | Missing or invalid auth token |
| 409 Conflict | Duplicate attribute name or value |

---

## 📚 Documentation Files

- `API_DOCUMENTATION.md` - Full endpoint reference
- `IMPLEMENTATION_GUIDE.md` - Setup and testing
- `MIGRATION_GUIDE.md` - Database migration
- `PHASE_1_2_SUMMARY.md` - What was implemented
- `Postman_Collection.json` - Import for testing

---

## 🎓 Learning Path

1. Read `PHASE_1_2_SUMMARY.md` (overview)
2. Review `API_DOCUMENTATION.md` (endpoints)
3. Import `Postman_Collection.json`
4. Follow `IMPLEMENTATION_GUIDE.md` quick start
5. Test endpoints in Postman
6. Build Phase 3 (Admin UI)
7. Build Phase 4 (Customer UI)

---

## 📞 Support

- Check documentation files for detailed info
- Review error messages in API responses
- Test with Postman first
- Check browser console for client errors
- Review server logs for backend errors

---

**Current Status:** Phase 1-2 ✅ COMPLETE  
**Next Phase:** Phase 3 (Admin UI)  
**Updated:** November 13, 2025
