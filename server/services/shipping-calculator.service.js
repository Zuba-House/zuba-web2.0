/**
 * ZUBA HOUSE - Complete Shipping Calculator Service
 * 
 * Features:
 * - Base Pricing: $10 USD first item, +$3 per additional item
 * - Distance-Based: Zones from Ottawa (ON/QC→Western→USA→International)
 * - Weight Considered: Canada Post-style weight brackets
 * - Category-Based: Clothing 1.0x, Art 1.3x, Electronics 1.4x
 * - Two Tiers: Standard (5-12 days) & Express (3-7 days)
 * - Worldwide Shipping: Canada, USA, International
 */

/**
 * Calculate shipping rates for cart items
 * @param {Array} cartItems - Array of cart items
 * @param {Object} shippingAddress - Shipping address object
 * @returns {Object} Shipping calculation result with options
 */
export const calculateShipping = (cartItems, shippingAddress) => {
  try {
    // Validate inputs
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      throw new Error('Cart items are required');
    }

    if (!shippingAddress) {
      throw new Error('Shipping address is required');
    }

    // Extract address info - handle multiple formats
    let countryCode = shippingAddress.countryCode || 
                     shippingAddress.address?.countryCode || 
                     'CA';
    
    // If country is a full name, convert to code
    if (!countryCode || countryCode.length > 2) {
      const countryName = (shippingAddress.country || shippingAddress.address?.country || '').toString().toUpperCase();
      const countryMap = {
        'CANADA': 'CA',
        'UNITED STATES': 'US',
        'USA': 'US',
        'UNITED STATES OF AMERICA': 'US',
        'UNITED KINGDOM': 'GB',
        'UK': 'GB',
        'AUSTRALIA': 'AU',
        'GERMANY': 'DE',
        'FRANCE': 'FR',
        'ITALY': 'IT',
        'SPAIN': 'ES',
        'NETHERLANDS': 'NL',
        'BELGIUM': 'BE',
        'SWITZERLAND': 'CH',
        'AUSTRIA': 'AT',
        'SWEDEN': 'SE',
        'NORWAY': 'NO',
        'DENMARK': 'DK',
        'FINLAND': 'FI',
        'POLAND': 'PL',
        'CHINA': 'CN',
        'JAPAN': 'JP',
        'SOUTH KOREA': 'KR',
        'KOREA': 'KR',
        'INDIA': 'IN',
        'SINGAPORE': 'SG',
        'MALAYSIA': 'MY',
        'THAILAND': 'TH',
        'BRAZIL': 'BR',
        'MEXICO': 'MX',
        'ARGENTINA': 'AR',
        'SOUTH AFRICA': 'ZA',
        'UNITED ARAB EMIRATES': 'AE',
        'UAE': 'AE',
        'SAUDI ARABIA': 'SA',
        'NEW ZEALAND': 'NZ'
      };
      countryCode = countryMap[countryName] || (countryCode && countryCode.length === 2 ? countryCode : 'CA');
    }
    
    // Ensure countryCode is uppercase and 2 characters
    countryCode = countryCode.toString().toUpperCase().substring(0, 2);
    
    const province = (shippingAddress.province || 
                     shippingAddress.provinceCode || 
                     shippingAddress.address?.provinceCode || 
                     '').toString().toUpperCase();
    const city = shippingAddress.city || shippingAddress.address?.city || '';

    console.log('Shipping calculation - Address:', {
      countryCode,
      province,
      city,
      originalCountry: shippingAddress.country || shippingAddress.countryCode,
      originalProvince: shippingAddress.province || shippingAddress.provinceCode
    });

    // Calculate base shipping cost
    let baseCost = 10; // $10 for first item
    let additionalItems = cartItems.length - 1;
    if (additionalItems > 0) {
      baseCost += additionalItems * 3; // +$3 per additional item
    }

    // Determine shipping zone
    const zone = getShippingZone(countryCode, province);
    
    console.log('Shipping calculation - Zone:', zone);
    
    // Add zone-based cost
    const zoneCost = getZoneCost(zone);
    baseCost += zoneCost;

    // Calculate total weight
    let totalWeight = 0;
    let highestCategoryMultiplier = 1.0;

    cartItems.forEach(item => {
      const product = item.product || item.productId || {};
      const quantity = item.quantity || 1;
      
      // Get weight (convert to kg)
      const weight = getProductWeight(product);
      totalWeight += weight * quantity;

      // Get category multiplier
      const categoryMultiplier = getCategoryMultiplier(product);
      if (categoryMultiplier > highestCategoryMultiplier) {
        highestCategoryMultiplier = categoryMultiplier;
      }
    });

    // Add weight-based cost
    const weightCost = getWeightCost(totalWeight);
    baseCost += weightCost;

    // Apply category multiplier
    const finalCost = baseCost * highestCategoryMultiplier;
    
    console.log('Shipping calculation - Costs:', {
      baseCost: 10,
      additionalItems,
      additionalItemsCost: additionalItems * 3,
      zone,
      zoneCost,
      totalWeight: totalWeight.toFixed(2),
      weightCost,
      categoryMultiplier: highestCategoryMultiplier,
      finalCost: finalCost.toFixed(2),
      expressCost: (finalCost * 1.5).toFixed(2)
    });

    // Calculate delivery estimates
    const standardEstimate = getDeliveryEstimate(zone, 'standard');
    const expressEstimate = getDeliveryEstimate(zone, 'express');

    // Calculate express cost (1.5x standard)
    const expressCost = finalCost * 1.5;

    // Format delivery dates
    const standardDates = formatDeliveryDates(standardEstimate.minDays, standardEstimate.maxDays);
    const expressDates = formatDeliveryDates(expressEstimate.minDays, expressEstimate.maxDays);

    return {
      success: true,
      options: [
        {
          id: 'standard',
          name: 'Standard Shipping',
          description: `${standardEstimate.estimate}`,
          price: Math.round(finalCost * 100) / 100,
          currency: 'USD',
          deliveryDays: `${standardEstimate.minDays}-${standardEstimate.maxDays} business days`,
          estimatedDelivery: standardDates,
          minDays: standardEstimate.minDays,
          maxDays: standardEstimate.maxDays,
          icon: '📦'
        },
        {
          id: 'express',
          name: 'Express Shipping',
          description: `${expressEstimate.estimate}`,
          price: Math.round(expressCost * 100) / 100,
          currency: 'USD',
          deliveryDays: `${expressEstimate.minDays}-${expressEstimate.maxDays} business days`,
          estimatedDelivery: expressDates,
          minDays: expressEstimate.minDays,
          maxDays: expressEstimate.maxDays,
          icon: '🚀'
        }
      ],
      calculation: {
        baseCost: 10,
        additionalItems: additionalItems,
        additionalItemsCost: additionalItems * 3,
        zone: zone,
        zoneCost: zoneCost,
        weight: totalWeight.toFixed(2),
        weightCost: weightCost,
        categoryMultiplier: highestCategoryMultiplier,
        finalCost: Math.round(finalCost * 100) / 100
      }
    };
  } catch (error) {
    console.error('Shipping calculation error:', error);
    return {
      success: false,
      message: error.message,
      options: []
    };
  }
};

/**
 * Get shipping zone based on country and province
 */
const getShippingZone = (countryCode, province) => {
  // countryCode should already be uppercase 2-letter code
  if (!countryCode || countryCode.length !== 2) {
    console.warn('Invalid country code:', countryCode, 'defaulting to international');
    return 'international';
  }
  
  if (countryCode === 'CA') {
    // Canadian provinces
    const provinceCode = province ? province.toString().toUpperCase().substring(0, 2) : '';
    if (provinceCode === 'ON' || provinceCode === 'QC') {
      return 'local'; // Ontario/Quebec
    } else if (provinceCode) {
      return 'western'; // Other Canadian provinces
    } else {
      // No province code, default to local for Canada
      return 'local';
    }
  } else if (countryCode === 'US') {
    return 'usa';
  } else {
    return 'international';
  }
};

/**
 * Get zone-based cost
 */
const getZoneCost = (zone) => {
  const zoneCosts = {
    'local': 0,      // ON/QC - no additional cost
    'western': 5,     // Other Canadian provinces
    'usa': 8,        // United States
    'international': 15 // International
  };
  return zoneCosts[zone] || 15;
};

/**
 * Get weight-based cost (Canada Post style)
 */
const getWeightCost = (weightInKg) => {
  if (weightInKg <= 0.5) return 0;
  if (weightInKg <= 1.0) return 2;
  if (weightInKg <= 2.0) return 4;
  if (weightInKg <= 5.0) return 6;
  if (weightInKg <= 10.0) return 10;
  return 15; // Over 10kg
};

/**
 * Get product weight in kg
 */
const getProductWeight = (product) => {
  if (!product) return 0.5; // Default 0.5kg
  
  // Check shipping.weight
  if (product.shipping?.weight) {
    const weight = parseFloat(product.shipping.weight);
    const unit = product.shipping.weightUnit || 'kg';
    
    // Convert to kg
    if (unit === 'g') return weight / 1000;
    if (unit === 'lb') return weight * 0.453592;
    if (unit === 'oz') return weight * 0.0283495;
    return weight;
  }
  
  // Check variation weight
  if (product.variation?.weight) {
    const weight = parseFloat(product.variation.weight);
    const unit = product.variation.weightUnit || 'kg';
    
    if (unit === 'g') return weight / 1000;
    if (unit === 'lb') return weight * 0.453592;
    if (unit === 'oz') return weight * 0.0283495;
    return weight;
  }
  
  // Check inventory weight
  if (product.inventory?.weight) {
    const weight = parseFloat(product.inventory.weight);
    const unit = product.inventory.weightUnit || 'kg';
    
    if (unit === 'g') return weight / 1000;
    if (unit === 'lb') return weight * 0.453592;
    if (unit === 'oz') return weight * 0.0283495;
    return weight;
  }
  
  return 0.5; // Default
};

/**
 * Get category multiplier
 */
const getCategoryMultiplier = (product) => {
  if (!product) return 1.0;
  
  const category = product.category?.name?.toLowerCase() || 
                   product.categoryName?.toLowerCase() || 
                   product.category?.toLowerCase() || '';
  
  // Clothing categories (1.0x)
  if (category.includes('clothing') || 
      category.includes('jersey') || 
      category.includes('apparel') ||
      category.includes('fashion')) {
    return 1.0;
  }
  
  // Art categories (1.3x)
  if (category.includes('art') || 
      category.includes('print') || 
      category.includes('poster') ||
      category.includes('painting')) {
    return 1.3;
  }
  
  // Electronics categories (1.4x)
  if (category.includes('electronic') || 
      category.includes('tech') || 
      category.includes('device')) {
    return 1.4;
  }
  
  return 1.0; // Default
};

/**
 * Get delivery estimate
 */
const getDeliveryEstimate = (zone, type) => {
  const estimates = {
    'local': {
      standard: { minDays: 5, maxDays: 8, estimate: '5-8 business days' },
      express: { minDays: 3, maxDays: 5, estimate: '3-5 business days' }
    },
    'western': {
      standard: { minDays: 7, maxDays: 10, estimate: '7-10 business days' },
      express: { minDays: 4, maxDays: 6, estimate: '4-6 business days' }
    },
    'usa': {
      standard: { minDays: 7, maxDays: 14, estimate: '7-14 business days' },
      express: { minDays: 5, maxDays: 9, estimate: '5-9 business days' }
    },
    'international': {
      standard: { minDays: 10, maxDays: 20, estimate: '10-20 business days' },
      express: { minDays: 5, maxDays: 12, estimate: '5-12 business days' }
    }
  };
  
  return estimates[zone]?.[type] || estimates['international'][type];
};

/**
 * Format delivery dates (e.g., "Nov 26 - Dec 5")
 */
const formatDeliveryDates = (minDays, maxDays) => {
  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + minDays + 1); // +1 for processing
  
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + maxDays + 1);
  
  // Skip weekends
  while (minDate.getDay() === 0 || minDate.getDay() === 6) {
    minDate.setDate(minDate.getDate() + 1);
  }
  while (maxDate.getDay() === 0 || maxDate.getDay() === 6) {
    maxDate.setDate(maxDate.getDate() + 1);
  }
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const minMonth = months[minDate.getMonth()];
  const minDay = minDate.getDate();
  const maxMonth = months[maxDate.getMonth()];
  const maxDay = maxDate.getDate();
  
  if (minMonth === maxMonth) {
    return `${minMonth} ${minDay} - ${maxDay}`;
  } else {
    return `${minMonth} ${minDay} - ${maxMonth} ${maxDay}`;
  }
};

/**
 * Validate phone number
 * @param {String} phone - Phone number to validate
 * @returns {Boolean} True if valid
 */
export const validatePhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Must have at least 10 digits
  const digitsOnly = cleaned.replace(/\+/g, '');
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return false;
  }
  
  // Basic format check
  return /^\+?[1-9]\d{9,14}$/.test(cleaned);
};

/**
 * Format phone number
 * @param {String} phone - Phone number to format
 * @param {String} country - Country code (default: 'CA')
 * @returns {String} Formatted phone number
 */
export const formatPhoneNumber = (phone, country = 'CA') => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  if (country === 'CA' || country === 'US') {
    // Format as +1-XXX-XXX-XXXX
    if (digits.length === 10) {
      return `+1-${digits.substring(0, 3)}-${digits.substring(3, 6)}-${digits.substring(6)}`;
    } else if (digits.length === 11 && digits[0] === '1') {
      return `+1-${digits.substring(1, 4)}-${digits.substring(4, 7)}-${digits.substring(7)}`;
    }
  }
  
  // For other countries, add + if not present
  if (!phone.startsWith('+')) {
    return `+${digits}`;
  }
  
  return phone;
};

