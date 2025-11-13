# Product Variations API Documentation

## Phase 1-2: Attributes & Variations System

This document outlines the RESTful API endpoints for managing product attributes and variations.

### Base URL
```
http://localhost:5000/api
```

---

## ATTRIBUTES MANAGEMENT

### 1. Create Attribute
**POST** `/attributes`

**Auth Required:** Yes (Admin)

**Request Body:**
```json
{
  "name": "Color",
  "type": "color_swatch",
  "description": "Product color options",
  "visibility": "both"
}
```

**Response (201 Created):**
```json
{
  "error": false,
  "message": "Attribute created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Color",
    "slug": "color",
    "type": "color_swatch",
    "description": "Product color options",
    "visibility": "both",
    "isGlobal": true,
    "sortOrder": 0,
    "isActive": true,
    "createdAt": "2025-11-13T10:00:00Z",
    "updatedAt": "2025-11-13T10:00:00Z"
  }
}
```

---

### 2. Get All Attributes
**GET** `/attributes`

**Query Parameters:**
- `isActive` (boolean): Filter by active status
- `type` (string): Filter by type (select, color_swatch, image_swatch, button)

**Response (200 OK):**
```json
{
  "error": false,
  "message": "Attributes retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Color",
      "slug": "color",
      "type": "color_swatch",
      "description": "Product color options",
      "visibility": "both",
      "isGlobal": true,
      "isActive": true,
      "values": [
        {
          "_id": "507f1f77bcf86cd799439012",
          "label": "Red",
          "value": "red",
          "meta": {
            "colorCode": "#FF0000"
          }
        },
        {
          "_id": "507f1f77bcf86cd799439013",
          "label": "Blue",
          "value": "blue",
          "meta": {
            "colorCode": "#0000FF"
          }
        }
      ]
    }
  ]
}
```

---

### 3. Get Single Attribute with Values
**GET** `/attributes/:id`

**Response (200 OK):**
```json
{
  "error": false,
  "message": "Attribute retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Color",
    "slug": "color",
    "type": "color_swatch",
    "values": [...]
  }
}
```

---

### 4. Update Attribute
**PUT** `/attributes/:id`

**Auth Required:** Yes (Admin)

**Request Body:**
```json
{
  "description": "Updated description",
  "visibility": "filter",
  "isActive": true
}
```

**Response (200 OK):**
```json
{
  "error": false,
  "message": "Attribute updated successfully",
  "data": { ... }
}
```

---

### 5. Delete Attribute
**DELETE** `/attributes/:id`

**Auth Required:** Yes (Admin)

**Response (200 OK):**
```json
{
  "error": false,
  "message": "Attribute deleted successfully"
}
```

---

## ATTRIBUTE VALUES

### 6. Get All Values for Attribute
**GET** `/attributes/:id/values`

**Query Parameters:**
- `isActive` (boolean): Filter by active status

**Response (200 OK):**
```json
{
  "error": false,
  "message": "Attribute values retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "attributeId": "507f1f77bcf86cd799439011",
      "label": "Red",
      "value": "red",
      "meta": {
        "colorCode": "#FF0000",
        "sortOrder": 1
      },
      "isActive": true,
      "usageCount": 5
    }
  ]
}
```

---

### 7. Create Attribute Value
**POST** `/attributes/:id/values`

**Auth Required:** Yes (Admin)

**Request Body:**
```json
{
  "label": "Red",
  "value": "red",
  "meta": {
    "colorCode": "#FF0000",
    "sortOrder": 1
  }
}
```

**Response (201 Created):**
```json
{
  "error": false,
  "message": "Attribute value created successfully",
  "data": { ... }
}
```

---

### 8. Update Attribute Value
**PUT** `/attributes/:id/values/:valueId`

**Auth Required:** Yes (Admin)

**Request Body:**
```json
{
  "label": "Dark Red",
  "meta": {
    "colorCode": "#CC0000"
  },
  "isActive": true
}
```

---

### 9. Delete Attribute Value
**DELETE** `/attributes/:id/values/:valueId`

**Auth Required:** Yes (Admin)

---

## PRODUCT VARIATIONS

### 10. Get All Variations for Product
**GET** `/products/:id/variations`

**Query Parameters:**
- `isActive` (boolean): Filter by active status

**Response (200 OK):**
```json
{
  "error": false,
  "message": "Variations retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "productId": "507f1f77bcf86cd799439001",
      "attributes": [
        {
          "attributeId": {
            "_id": "507f1f77bcf86cd799439011",
            "name": "Color",
            "slug": "color",
            "type": "color_swatch"
          },
          "valueId": {
            "_id": "507f1f77bcf86cd799439012",
            "label": "Red",
            "value": "red"
          },
          "label": "Color: Red"
        },
        {
          "attributeId": {
            "_id": "507f1f77bcf86cd799439014",
            "name": "Size",
            "slug": "size",
            "type": "button"
          },
          "valueId": {
            "_id": "507f1f77bcf86cd799439015",
            "label": "Large",
            "value": "large"
          },
          "label": "Size: Large"
        }
      ],
      "sku": "TSH-RED-L",
      "price": 35,
      "salePrice": 30,
      "stock": 15,
      "images": [],
      "isActive": true,
      "isDefault": true,
      "displayName": "Color: Red / Size: Large",
      "createdAt": "2025-11-13T10:00:00Z"
    }
  ]
}
```

---

### 11. Get Single Variation
**GET** `/products/:id/variations/:variationId`

**Response (200 OK):**
```json
{
  "error": false,
  "message": "Variation retrieved successfully",
  "data": { ... }
}
```

---

### 12. Find Variation by Attributes (Query)
**GET** `/products/:id/variations/find?color=red&size=large`

**Query Parameters:**
- Attribute slug + value pairs (e.g., `color=red`, `size=large`)

**Response (200 OK):**
```json
{
  "error": false,
  "message": "Variation found successfully",
  "data": { ... }
}
```

---

### 13. Create Single Variation
**POST** `/products/:id/variations`

**Auth Required:** Yes (Admin)

**Request Body:**
```json
{
  "attributes": [
    {
      "attributeId": "507f1f77bcf86cd799439011",
      "valueId": "507f1f77bcf86cd799439012",
      "label": "Color: Red"
    },
    {
      "attributeId": "507f1f77bcf86cd799439014",
      "valueId": "507f1f77bcf86cd799439015",
      "label": "Size: Large"
    }
  ],
  "sku": "TSH-RED-L",
  "price": 35,
  "salePrice": 30,
  "stock": 15,
  "images": [],
  "isDefault": false
}
```

**Response (201 Created):**
```json
{
  "error": false,
  "message": "Variation created successfully",
  "data": { ... }
}
```

---

### 14. Auto-Generate Variations
**POST** `/products/:id/variations/generate`

**Auth Required:** Yes (Admin)

**Request Body:**
```json
{
  "attributes": [
    {
      "attributeId": "507f1f77bcf86cd799439011",
      "valueIds": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"]
    },
    {
      "attributeId": "507f1f77bcf86cd799439014",
      "valueIds": ["507f1f77bcf86cd799439015", "507f1f77bcf86cd799439016"]
    }
  ]
}
```

**Example: This creates 4 variations:**
- Red + Small
- Red + Large
- Blue + Small
- Blue + Large

**Response (201 Created):**
```json
{
  "error": false,
  "message": "4 variations generated successfully",
  "data": [ ... ]
}
```

---

### 15. Update Variation
**PUT** `/products/:id/variations/:variationId`

**Auth Required:** Yes (Admin)

**Request Body:**
```json
{
  "price": 40,
  "salePrice": 35,
  "stock": 20,
  "isActive": true,
  "isDefault": false,
  "sku": "TSH-RED-L"
}
```

**Response (200 OK):**
```json
{
  "error": false,
  "message": "Variation updated successfully",
  "data": { ... }
}
```

---

### 16. Bulk Update Variations
**PUT** `/products/:id/variations/bulk-update`

**Auth Required:** Yes (Admin)

**Request Body:**
```json
{
  "variations": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "price": 40,
      "stock": 20,
      "isActive": true
    },
    {
      "_id": "507f1f77bcf86cd799439021",
      "price": 45,
      "stock": 25,
      "isActive": true
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "error": false,
  "message": "Variations updated successfully"
}
```

---

### 17. Delete Variation
**DELETE** `/products/:id/variations/:variationId`

**Auth Required:** Yes (Admin)

**Response (200 OK):**
```json
{
  "error": false,
  "message": "Variation deleted successfully"
}
```

---

## ERROR RESPONSES

### 400 Bad Request
```json
{
  "error": true,
  "message": "Attributes are required"
}
```

### 404 Not Found
```json
{
  "error": true,
  "message": "Product not found"
}
```

### 409 Conflict
```json
{
  "error": true,
  "message": "SKU already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": true,
  "message": "Failed to create attribute"
}
```

---

## WORKFLOW EXAMPLES

### Example 1: Create Color Attribute with Values

**Step 1:** Create attribute
```bash
POST /api/attributes
{
  "name": "Color",
  "type": "color_swatch",
  "description": "Product colors"
}
```

**Step 2:** Add color values
```bash
POST /api/attributes/{attributeId}/values
{
  "label": "Red",
  "value": "red",
  "meta": { "colorCode": "#FF0000" }
}

POST /api/attributes/{attributeId}/values
{
  "label": "Blue",
  "value": "blue",
  "meta": { "colorCode": "#0000FF" }
}
```

---

### Example 2: Create Variable Product with Auto-Generated Variations

**Step 1:** Create product as Simple first (existing functionality)

**Step 2:** Create Size attribute with values
```bash
POST /api/attributes
{ "name": "Size", "type": "button" }

POST /api/attributes/{sizeAttrId}/values
{ "label": "S", "value": "s" }

POST /api/attributes/{sizeAttrId}/values
{ "label": "M", "value": "m" }

POST /api/attributes/{sizeAttrId}/values
{ "label": "L", "value": "l" }
```

**Step 3:** Auto-generate variations
```bash
POST /api/products/{productId}/variations/generate
{
  "attributes": [
    {
      "attributeId": "{colorAttrId}",
      "valueIds": ["{redValueId}", "{blueValueId}"]
    },
    {
      "attributeId": "{sizeAttrId}",
      "valueIds": ["{sValueId}", "{mValueId}", "{lValueId}"]
    }
  ]
}
```

**Result:** Creates 6 variations (2 colors × 3 sizes)

---

### Example 3: Find Product Variation by Attributes

```bash
GET /api/products/{productId}/variations/find?color=red&size=l
```

**Response:** Returns the Red + Large variation with its price, stock, images, SKU, etc.

---

## TESTING WITH POSTMAN

**Import as Postman Collection:**
1. Create new collection: "Zuba Product Variations"
2. Add requests with variables:
   - `{{base_url}}` = `http://localhost:5000/api`
   - `{{product_id}}` = Product ID
   - `{{attr_id}}` = Attribute ID
   - `{{variation_id}}` = Variation ID

---

## NOTES

- All admin endpoints require authentication token in Authorization header
- SKUs must be unique across all products
- Variations inherit currency from parent product
- Stock and price ranges automatically update when variations change
- Setting a variation as default automatically unsets other defaults
- Deleting all variations converts product back to simple type
