/**
 * Product Utilities
 * Helper functions for product operations
 */

/**
 * Get current price for a product or variation
 * @param {Object} item - Product or variation object
 * @returns {number} - Current price
 */
export const getCurrentPrice = (item) => {
  if (!item) return 0;

  // Check for sale price first
  if (item.salePrice && item.salePrice < (item.regularPrice || item.price)) {
    return Number(item.salePrice);
  }

  // Check pricing object
  if (item.pricing?.salePrice && item.pricing.salePrice < item.pricing.regularPrice) {
    return Number(item.pricing.salePrice);
  }

  // Fallback to regular price
  return Number(
    item.price || 
    item.regularPrice || 
    item.pricing?.regularPrice || 
    item.pricing?.price || 
    0
  );
};

/**
 * Check if product/variation is on sale
 * @param {Object} item - Product or variation object
 * @returns {boolean}
 */
export const isOnSale = (item) => {
  if (!item) return false;

  // Check direct fields
  if (item.salePrice && item.regularPrice && item.salePrice < item.regularPrice) {
    return true;
  }

  // Check pricing object
  if (item.pricing?.salePrice && item.pricing.regularPrice && 
      item.pricing.salePrice < item.pricing.regularPrice) {
    return true;
  }

  return false;
};

/**
 * Get discount percentage
 * @param {Object} item - Product or variation object
 * @returns {number} - Discount percentage (0-100)
 */
export const getDiscountPercentage = (item) => {
  if (!isOnSale(item)) return 0;

  const regular = Number(item.regularPrice || item.pricing?.regularPrice || 0);
  const sale = Number(item.salePrice || item.pricing?.salePrice || 0);

  if (regular <= 0 || sale <= 0) return 0;

  return Math.round(((regular - sale) / regular) * 100);
};

/**
 * Get stock quantity for product or variation
 * @param {Object} product - Product object
 * @param {string} variationId - Optional variation ID
 * @returns {number} - Stock quantity
 */
export const getProductStock = (product, variationId = null) => {
  if (!product) return 0;

  // If variation ID provided, get variation stock
  if (variationId && Array.isArray(product.variations)) {
    const variation = product.variations.find(v => 
      v._id === variationId || v.id === variationId
    );
    if (variation) {
      return Number(variation.stock || 0);
    }
  }

  // For variable products without variation selected
  if (product.productType === 'variable' || product.type === 'variable') {
    if (Array.isArray(product.variations) && product.variations.length > 0) {
      // Return total stock across all variations
      return product.variations.reduce((total, v) => {
        return total + Number(v.stock || 0);
      }, 0);
    }
  }

  // For simple products
  return Number(
    product.stock ||
    product.countInStock ||
    product.inventory?.stock ||
    product.inventory?.stockQuantity ||
    0
  );
};

/**
 * Check if product is in stock
 * @param {Object} product - Product object
 * @param {string} variationId - Optional variation ID
 * @returns {boolean}
 */
export const isInStock = (product, variationId = null) => {
  return getProductStock(product, variationId) > 0;
};

/**
 * Get product image URL (handles both string and object formats)
 * @param {string|Object} image - Image string or object
 * @returns {string} - Image URL
 */
export const getImageUrl = (image) => {
  if (!image) return '/placeholder-image.jpg';

  if (typeof image === 'string') {
    return image;
  }

  if (typeof image === 'object' && image.url) {
    return image.url;
  }

  return '/placeholder-image.jpg';
};

/**
 * Get featured image from product
 * @param {Object} product - Product object
 * @returns {string} - Featured image URL
 */
export const getFeaturedImage = (product) => {
  if (!product) return '/placeholder-image.jpg';

  // Check for featured image field
  if (product.featuredImage) {
    return getImageUrl(product.featuredImage);
  }

  // Check images array for featured
  if (Array.isArray(product.images) && product.images.length > 0) {
    const featured = product.images.find(img => 
      img && (img.isFeatured || img.is_featured || img.featured)
    );
    if (featured) {
      return getImageUrl(featured);
    }
    // Return first image as fallback
    return getImageUrl(product.images[0]);
  }

  return '/placeholder-image.jpg';
};

/**
 * Format price for display
 * @param {number} price - Price value
 * @param {string} currency - Currency symbol (default: $)
 * @returns {string} - Formatted price
 */
export const formatPrice = (price, currency = '$') => {
  const numPrice = Number(price);
  if (isNaN(numPrice)) return `${currency}0.00`;
  return `${currency}${numPrice.toFixed(2)}`;
};

/**
 * Check if product is variable type
 * @param {Object} product - Product object
 * @returns {boolean}
 */
export const isVariableProduct = (product) => {
  if (!product) return false;
  return product.productType === 'variable' || product.type === 'variable';
};

/**
 * Get price range for variable products
 * @param {Object} product - Product object
 * @returns {Object|null} - {min, max} or null
 */
export const getPriceRange = (product) => {
  if (!isVariableProduct(product) || !Array.isArray(product.variations)) {
    return null;
  }

  if (product.variations.length === 0) return null;

  const prices = product.variations.map(v => getCurrentPrice(v));

  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
};

/**
 * Validate if all required attributes are selected
 * @param {Array} attributeNames - All attribute names
 * @param {Object} selectedAttributes - Currently selected attributes
 * @returns {boolean}
 */
export const areAllAttributesSelected = (attributeNames, selectedAttributes) => {
  if (!Array.isArray(attributeNames) || !selectedAttributes) {
    return false;
  }

  return attributeNames.every(name => {
    return selectedAttributes[name] && selectedAttributes[name] !== '';
  });
};

