/**
 * Advanced Shipping Calculator
 * Calculates total package dimensions and weight from cart items
 */

export default class ShippingCalculator {
  
  /**
   * Calculate total package from cart items
   * @param {Array} cartItems - Array of cart items with product info
   * @returns {Object} Package details
   */
  static calculatePackage(cartItems) {
    if (!cartItems || cartItems.length === 0) {
      return this.getDefaultPackage();
    }

    let totalWeight = 0;
    let maxLength = 0;
    let maxWidth = 0;
    let totalHeight = 0;

    cartItems.forEach(item => {
      const product = item.productId || item.product || item;
      const quantity = item.quantity || 1;
      
      if (product && product.shipping) {
        // Weight: sum of all items (convert to kg if needed)
        const itemWeight = product.shipping.weight || 0.5;
        const weightUnit = product.shipping.weightUnit || 'kg';
        
        // Convert to kg
        let weightInKg = itemWeight;
        if (weightUnit === 'g') weightInKg = itemWeight / 1000;
        else if (weightUnit === 'lb') weightInKg = itemWeight * 0.453592;
        else if (weightUnit === 'oz') weightInKg = itemWeight * 0.0283495;
        
        totalWeight += weightInKg * quantity;
        
        // Dimensions: max length/width, sum height
        const dims = product.shipping.dimensions || {};
        const dimUnit = dims.unit || 'cm';
        
        // Convert to cm
        let length = dims.length || 20;
        let width = dims.width || 15;
        let height = dims.height || 10;
        
        if (dimUnit === 'in') {
          length = length * 2.54;
          width = width * 2.54;
          height = height * 2.54;
        } else if (dimUnit === 'm') {
          length = length * 100;
          width = width * 100;
          height = height * 100;
        }
        
        maxLength = Math.max(maxLength, length);
        maxWidth = Math.max(maxWidth, width);
        totalHeight += height * quantity;
      } else {
        // Default values if no shipping info
        totalWeight += 0.5 * quantity;
        maxLength = Math.max(maxLength, 20);
        maxWidth = Math.max(maxWidth, 15);
        totalHeight += 10 * quantity;
      }
    });

    // Ensure minimum values
    return {
      weight: Math.max(totalWeight, 0.5),
      length: Math.max(maxLength, 20),
      width: Math.max(maxWidth, 15),
      height: Math.max(totalHeight, 10)
    };
  }

  /**
   * Default package for empty cart
   */
  static getDefaultPackage() {
    return {
      weight: 0.5,
      length: 20,
      width: 15,
      height: 10
    };
  }

  /**
   * Calculate fallback shipping cost
   * @param {Number} quantity - Number of items
   * @param {Number} weight - Total weight
   * @returns {Number} Shipping cost in USD
   */
  static calculateFallbackShipping(quantity, weight) {
    const baseRate = parseFloat(process.env.FALLBACK_BASE_RATE || 13);
    const extraItemRate = parseFloat(process.env.FALLBACK_EXTRA_ITEM || 3);
    const bulkDiscount = parseFloat(process.env.FALLBACK_BULK_DISCOUNT || 0.85);
    const bulkThreshold = parseInt(process.env.FALLBACK_BULK_THRESHOLD || 10);

    // Base calculation
    let cost = baseRate;
    
    // Add cost for extra items (quantity - 1)
    if (quantity > 1) {
      cost += (quantity - 1) * extraItemRate;
    }

    // Weight surcharge for heavy packages
    if (weight > 5) {
      cost += (weight - 5) * 2; // $2 per kg over 5kg
    }

    // Bulk discount
    if (quantity >= bulkThreshold) {
      cost *= bulkDiscount;
    }

    return Math.round(cost * 100) / 100; // Round to 2 decimals
  }

  /**
   * Format address for Stallion API
   */
  static formatAddress(address) {
    return {
      name: address.name || address.fullName || '',
      company: address.company || "",
      address1: address.address1 || address.street || address.addressLine1 || '',
      address2: address.address2 || address.apartment || address.addressLine2 || "",
      city: address.city || '',
      province: address.province || address.state || address.provinceCode || '',
      postal_code: (address.postal_code || address.postalCode || "").replace(/\s/g, "").toUpperCase(),
      country: address.country || "CA",
      phone: address.phone || address.mobile || ''
    };
  }
}

