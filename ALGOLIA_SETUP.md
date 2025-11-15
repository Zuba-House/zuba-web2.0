# 🔍 Algolia Search Setup Guide

## Overview

Your Zuba House application now supports **TEMU/Amazon-style advanced search** powered by Algolia! This provides:

- ⚡ **Instant search results** as you type
- 🎯 **Smart autocomplete** suggestions
- 🔍 **Advanced filtering** by category, brand, price, etc.
- 📊 **Faceted search** with result counts
- 🎨 **Beautiful UI** matching your Zuba House design

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create Algolia Account

1. Go to [https://www.algolia.com](https://www.algolia.com)
2. Sign up for a **free account** (10,000 searches/month free)
3. Create a new application

### Step 2: Get Your Credentials

1. In Algolia Dashboard, go to **Settings** → **API Keys**
2. Copy your **Application ID**
3. Copy your **Search-Only API Key** (public key, safe for frontend)

### Step 3: Configure Environment Variables

1. In your `client` folder, create or update `.env` file:

```env
VITE_ALGOLIA_APP_ID=your_application_id_here
VITE_ALGOLIA_SEARCH_API_KEY=your_search_api_key_here
VITE_ALGOLIA_INDEX_NAME=products
```

**Important:** Vite uses `VITE_` prefix for environment variables (not `REACT_APP_`). Make sure to restart your dev server after adding these variables.

2. Restart your development server:
```bash
npm start
```

### Step 4: Index Your Products

You need to sync your products from MongoDB to Algolia. Here are two options:

#### Option A: Manual Indexing Script (Recommended for Testing)

1. Go to Algolia Dashboard → **Indices** → **Create Index**
2. Name it `products`
3. Use the **Import** feature to upload a JSON file of your products

#### Option B: Automated Indexing (Backend Integration)

Create a script to sync products automatically:

```javascript
// server/scripts/indexProductsToAlgolia.js
const algoliasearch = require('algoliasearch');
const Product = require('../models/product.model');

const client = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_ADMIN_API_KEY // Admin key (keep secret!)
);

const index = client.initIndex('products');

async function indexProducts() {
  try {
    const products = await Product.find({});
    
    const records = products.map(product => ({
      objectID: product._id.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      oldPrice: product.oldPrice,
      image: product.image,
      images: product.images,
      catName: product.catName,
      subCat: product.subCat,
      brand: product.brand,
      rating: product.rating,
      // Add any other fields you want to search/filter
    }));

    await index.saveObjects(records);
    console.log(`✅ Indexed ${records.length} products to Algolia`);
  } catch (error) {
    console.error('❌ Indexing error:', error);
  }
}

indexProducts();
```

## 📋 Product Schema for Algolia

Your products should have these fields indexed:

```javascript
{
  objectID: "product_id",      // Required: unique identifier
  name: "Product Name",        // Searchable
  description: "Description",  // Searchable
  price: 29.99,                // Filterable
  catName: "Category",         // Filterable
  subCat: "Subcategory",       // Filterable
  brand: "Brand Name",         // Filterable
  image: "image_url",          // Display
  rating: 4.5,                 // Sortable
  // Add more fields as needed
}
```

## 🎯 Features Enabled

Once configured, your search will have:

✅ **Real-time search** - Results update as you type  
✅ **Category filters** - Filter by product categories  
✅ **Brand filters** - Filter by brand  
✅ **Subcategory filters** - Filter by subcategories  
✅ **Active filter tags** - See and remove active filters  
✅ **Pagination** - Navigate through results  
✅ **Empty states** - Helpful messages when no results  
✅ **Responsive design** - Works on all devices  

## 🔄 Fallback Behavior

- If Algolia is **not configured**, the search automatically falls back to your existing MongoDB search
- Your existing search functionality remains **100% intact**
- No breaking changes to your current code

## 🧪 Testing

1. Visit `/search` in your application
2. If Algolia is configured, you'll see the advanced search interface
3. If not configured, you'll see the standard search (with setup instructions)

## 📚 Additional Resources

- [Algolia Documentation](https://www.algolia.com/doc/)
- [React InstantSearch Guide](https://www.algolia.com/doc/guides/building-search-ui/what-is-instantsearch/react/)
- [Algolia Dashboard](https://www.algolia.com/dashboard)

## 🆘 Troubleshooting

### Search not working?
- Check that environment variables are set correctly
- Restart your dev server after adding `.env` variables
- Verify your Algolia index has products

### No results showing?
- Make sure products are indexed in Algolia
- Check that field names match (e.g., `catName`, `subCat`, `brand`)
- Verify your index name matches `REACT_APP_ALGOLIA_INDEX_NAME`

### Styling issues?
- Check that `AlgoliaSearch.css` is imported
- Verify Tailwind CSS is configured

## 💡 Next Steps

1. **Customize filters** - Add price range, size, color filters
2. **Add autocomplete** - Implement search suggestions
3. **Analytics** - Track search queries in Algolia Dashboard
4. **A/B Testing** - Test different search configurations

---

**Need help?** Contact support or check Algolia's extensive documentation!

