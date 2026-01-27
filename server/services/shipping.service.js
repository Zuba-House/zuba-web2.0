/**
 * ZUBA HOUSE - EasyPost Shipping Service
 * 
 * Features:
 * - EasyPost integration for Canada Post real rates
 * - Smart fallback pricing (always works)
 * - Zone-based pricing (Canada, USA, International)
 * - Maximum caps ($30 Standard / $40 Express)
 * - Branded as "Zuba Shipping"
 * - Progressive quantity discounts (shipping decreases as quantity increases)
 * 
 * FUTURE ENHANCEMENT: Vendor-location-based shipping
 * - Shipping cost and delivery time will be calculated based on vendor's location
 * - Example: If vendor is in Rwanda and customer is in Ottawa, shipping will use
 *   international rates and longer delivery times based on Rwanda-to-Ottawa distance
 * - This will require adding vendor location data to product/vendor models
 */

import EasyPostClient from '@easypost/api';
import { WAREHOUSE } from '../config/stallion.js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize EasyPost client
// API key must be set in environment variable: EASYPOST_API_KEY
const apiKey = process.env.EASYPOST_API_KEY;
if (!apiKey) {
  console.warn('⚠️ EASYPOST_API_KEY not set in environment variables. EasyPost features will use fallback pricing.');
}
const easypost = apiKey ? new EasyPostClient(apiKey) : null;

/**
 * Get shipping zone from country code
 */
const getShippingZone = (countryCode) => {
  if (!countryCode) return 'international';
  
  const code = countryCode.toString().toUpperCase();
  if (code === 'CA') return 'canada';
  if (code === 'US') return 'usa';
  return 'international';
};

/**
 * Classify product into shipping tier based on category, weight, and name
 * Returns: 'small' (jewelry, small accessories) or 'standard' (decor, large items)
 */
const getProductShippingTier = (item) => {
  // Safety check: if item is null/undefined, default to standard
  if (!item) {
    return 'standard';
  }
  
  // Check product weight (in kg) - ensure it's a valid number
  const weight = parseFloat(item.weight || item.product?.shipping?.weight || 0.5) || 0.5;
  
  // Small items: weight < 0.2kg (200g) are considered small jewelry/accessories
  if (weight < 0.2) {
    return 'small';
  }
  
  // Check category name (case-insensitive) - safely handle null/undefined
  const categoryName = (
    (item.product?.category?.name || 
     item.product?.catName || 
     item.categoryName || 
     '')
  ).toString().toLowerCase();
  
  // Check product name for keywords - safely handle null/undefined
  const productName = (
    (item.name || 
     item.product?.name || 
     item.productTitle || 
     '')
  ).toString().toLowerCase();
  
  // Small item keywords (jewelry, accessories)
  const smallItemKeywords = [
    'earring', 'earrings', 'bracelet', 'bracelets', 'necklace', 'necklaces',
    'ring', 'rings', 'pendant', 'pendants', 'charm', 'charms', 'brooch', 'brooches',
    'anklet', 'anklets', 'bangle', 'bangles', 'cuff', 'cuffs', 'jewelry', 'jewellery',
    'accessory', 'accessories', 'watch', 'watches', 'keychain', 'keychains'
  ];
  
  // Large item keywords (decor, furniture, art)
  const largeItemKeywords = [
    'decor', 'decoration', 'furniture', 'art', 'painting', 'sculpture', 'statue',
    'vase', 'vases', 'lamp', 'lamps', 'rug', 'rugs', 'carpet', 'carpets',
    'curtain', 'curtains', 'mirror', 'mirrors', 'frame', 'frames', 'canvas',
    'wall art', 'home decor', 'interior', 'furnishing'
  ];
  
  // Check if product name or category contains small item keywords
  const isSmallItem = smallItemKeywords.some(keyword => 
    productName.includes(keyword) || categoryName.includes(keyword)
  );
  
  // Check if product name or category contains large item keywords
  const isLargeItem = largeItemKeywords.some(keyword => 
    productName.includes(keyword) || categoryName.includes(keyword)
  );
  
  // If explicitly small or large, return that
  if (isSmallItem) return 'small';
  if (isLargeItem) return 'standard';
  
  // Default based on weight: < 0.3kg = small, >= 0.3kg = standard
  return weight < 0.3 ? 'small' : 'standard';
};

/**
 * Calculate fallback shipping rates
 * Used when EasyPost is unavailable or for non-Canada destinations
 * Now includes product-type-based pricing (small jewelry vs large decor)
 */
const calculateFallbackRates = (items, destination) => {
  const zone = getShippingZone(destination.countryCode || destination.country);
  
  // Classify items by shipping tier
  const itemGroups = {
    small: [], // Small jewelry, accessories (earrings, bracelets, etc.)
    standard: [] // Standard/large items (decor, furniture, etc.)
  };
  
  // Safely process items - skip null/undefined items
  items.forEach(item => {
    if (!item) return; // Skip null/undefined items
    
    try {
      const tier = getProductShippingTier(item);
      const quantity = Math.max(1, parseInt(item.quantity) || 1); // Ensure valid quantity
      
      // Ensure tier is valid ('small' or 'standard')
      const validTier = (tier === 'small' || tier === 'standard') ? tier : 'standard';
      
      for (let i = 0; i < quantity; i++) {
        itemGroups[validTier].push(item);
      }
    } catch (error) {
      // If classification fails, default to standard tier
      console.warn('Error classifying item for shipping:', error);
      const quantity = Math.max(1, parseInt(item.quantity) || 1);
      for (let i = 0; i < quantity; i++) {
        itemGroups.standard.push(item);
      }
    }
  });
  
  const smallItemCount = itemGroups.small.length || 0;
  const standardItemCount = itemGroups.standard.length || 0;
  const totalItemCount = smallItemCount + standardItemCount;
  
  // Safety check: if no items, return default rates
  if (totalItemCount === 0) {
    console.warn('No valid items found for shipping calculation, using default rates');
    // Return default standard rates
    return {
      standard: {
        name: 'Zuba Standard Shipping',
        cost: 10,
        displayCost: '$10.00 USD',
        delivery: '5-10 business days',
        estimatedDelivery: '5-10 business days',
        minDays: 5,
        maxDays: 10,
        type: 'standard',
        source: 'fallback'
      },
      express: {
        name: 'Zuba Express Shipping',
        cost: 17,
        displayCost: '$17.00 USD',
        delivery: '2-5 business days',
        estimatedDelivery: '2-5 business days',
        minDays: 2,
        maxDays: 5,
        type: 'express',
        source: 'fallback'
      }
    };
  }
  
  // Zone-based pricing with product-type differentiation
  // Updated for Canada (Ottawa/Gatineau area): $5.00 base, 2 days normal, 1 day express
  const zonePricing = {
    canada: {
      // Small items (jewelry, accessories) - cheaper rates
      small: {
        standard: { base: 5, additional: 1.5, expressBase: 8, expressAdditional: 2.0 },
        minDays: 2,
        maxDays: 2
      },
      // Standard items (decor, large items) - regular rates
      standard: {
        standard: { base: 5, additional: 2.0, expressBase: 10, expressAdditional: 3.0 },
        minDays: 2,
        maxDays: 2
      }
    },
    usa: {
      small: {
        standard: { base: 8, additional: 1, expressBase: 15, expressAdditional: 2 },
        minDays: 6,
        maxDays: 12
      },
      standard: {
        standard: { base: 13, additional: 2, expressBase: 20, expressAdditional: 3 },
        minDays: 7,
        maxDays: 14
      }
    },
    international: {
      small: {
        standard: { base: 10, additional: 1.5, expressBase: 20, expressAdditional: 2.5 },
        minDays: 8,
        maxDays: 16
      },
      standard: {
        standard: { base: 15, additional: 2.5, expressBase: 25, expressAdditional: 3 },
        minDays: 10,
        maxDays: 20
      }
    }
  };
  
  const zoneData = zonePricing[zone] || zonePricing.international;
  
  // Calculate costs for small items
  let smallStandardCost = 0;
  let smallExpressCost = 0;
  if (smallItemCount > 0) {
    const smallPricing = zoneData.small.standard;
    smallStandardCost = smallPricing.base;
    smallExpressCost = smallPricing.expressBase;
    
    if (smallItemCount > 1) {
      smallStandardCost += (smallItemCount - 1) * smallPricing.additional;
      smallExpressCost += (smallItemCount - 1) * smallPricing.expressAdditional;
    }
  }
  
  // Calculate costs for standard items
  let standardCost = 0;
  let expressCost = 0;
  if (standardItemCount > 0) {
    const standardPricing = zoneData.standard.standard;
    standardCost = standardPricing.base;
    expressCost = standardPricing.expressBase;
    
    if (standardItemCount > 1) {
      standardCost += (standardItemCount - 1) * standardPricing.additional;
      expressCost += (standardItemCount - 1) * standardPricing.expressAdditional;
    }
  }
  
  // Combine costs (small items + standard items)
  let totalStandardCost = smallStandardCost + standardCost;
  let totalExpressCost = smallExpressCost + expressCost;
  
  // Apply progressive quantity discount for Canada (shipping decreases as quantity increases)
  if (zone === 'canada' && totalItemCount > 1) {
    // Progressive discount based on total quantity
    if (totalItemCount >= 15) {
      totalStandardCost *= 0.80; // 20% discount for 15+ items
      totalExpressCost *= 0.80;
    } else if (totalItemCount >= 10) {
      totalStandardCost *= 0.85; // 15% discount for 10-14 items
      totalExpressCost *= 0.85;
    } else if (totalItemCount >= 5) {
      totalStandardCost *= 0.90; // 10% discount for 5-9 items
      totalExpressCost *= 0.90;
    }
    
    // Ensure minimum cost of $5.00 for Canada
    if (totalStandardCost < 5.0) {
      totalStandardCost = 5.0;
    }
    if (totalExpressCost < 5.0) {
      totalExpressCost = 5.0;
    }
  }
  
  // Apply maximum caps
  const MAX_STANDARD = 30;
  const MAX_EXPRESS = 40;
  
  totalStandardCost = Math.min(totalStandardCost, MAX_STANDARD);
  totalExpressCost = Math.min(totalExpressCost, MAX_EXPRESS);
  
  // Calculate delivery days (weighted average based on item types)
  let minDays, maxDays;
  if (smallItemCount > 0 && standardItemCount > 0) {
    // Mixed order: use average
    const smallDays = zoneData.small.minDays;
    const standardDays = zoneData.standard.minDays;
    minDays = Math.round((smallDays * smallItemCount + standardDays * standardItemCount) / totalItemCount);
    
    const smallMaxDays = zoneData.small.maxDays;
    const standardMaxDays = zoneData.standard.maxDays;
    maxDays = Math.round((smallMaxDays * smallItemCount + standardMaxDays * standardItemCount) / totalItemCount);
  } else if (smallItemCount > 0) {
    minDays = zoneData.small.minDays;
    maxDays = zoneData.small.maxDays;
  } else {
    minDays = zoneData.standard.minDays;
    maxDays = zoneData.standard.maxDays;
  }
  
  // Calculate express delivery days
  // For Canada: Express is 1 day, for others: 60% of standard but minimum 2-5 days
  let expressMinDays, expressMaxDays;
  if (zone === 'canada') {
    expressMinDays = 1;
    expressMaxDays = 1;
  } else {
    expressMinDays = Math.max(2, Math.ceil(minDays * 0.6));
    expressMaxDays = Math.max(5, Math.ceil(maxDays * 0.6));
  }
  
  return {
    standard: {
      name: 'Zuba Standard Shipping',
      cost: Math.round(totalStandardCost * 100) / 100,
      displayCost: `$${totalStandardCost.toFixed(2)} USD`,
      delivery: `${minDays}-${maxDays} business days`,
      estimatedDelivery: `${minDays}-${maxDays} business days`,
      minDays: minDays,
      maxDays: maxDays,
      type: 'standard',
      source: 'fallback',
      breakdown: {
        smallItems: smallItemCount,
        standardItems: standardItemCount,
        smallCost: Math.round(smallStandardCost * 100) / 100,
        standardCost: Math.round(standardCost * 100) / 100
      }
    },
    express: {
      name: 'Zuba Express Shipping',
      cost: Math.round(totalExpressCost * 100) / 100,
      displayCost: `$${totalExpressCost.toFixed(2)} USD`,
      delivery: `${expressMinDays}-${expressMaxDays} business days`,
      estimatedDelivery: `${expressMinDays}-${expressMaxDays} business days`,
      minDays: expressMinDays,
      maxDays: expressMaxDays,
      type: 'express',
      source: 'fallback',
      breakdown: {
        smallItems: smallItemCount,
        standardItems: standardItemCount,
        smallCost: Math.round(smallExpressCost * 100) / 100,
        standardCost: Math.round(expressCost * 100) / 100
      }
    }
  };
};

/**
 * Get shipping rates from EasyPost
 */
export const getShippingRates = async ({ items, destination }) => {
  try {
    // Validate inputs
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Items are required');
    }
    
    if (!destination) {
      throw new Error('Destination address is required');
    }
    
    // Check if destination is Canada (EasyPost works best for Canada Post)
    const isCanada = getShippingZone(destination.countryCode || destination.country) === 'canada';
    
    // Try EasyPost for Canada destinations (only if API key is configured)
    if (isCanada && easypost) {
      try {
        // Prepare from address (warehouse)
        const fromAddress = {
          name: WAREHOUSE.name,
          company: WAREHOUSE.company,
          street1: WAREHOUSE.address1,
          street2: WAREHOUSE.address2 || '',
          city: WAREHOUSE.city,
          state: WAREHOUSE.province,
          zip: WAREHOUSE.postal_code,
          country: WAREHOUSE.country,
          phone: WAREHOUSE.phone
        };
        
        // Prepare to address
        const toAddress = {
          name: `${destination.firstName || ''} ${destination.lastName || ''}`.trim() || 'Customer',
          street1: destination.address || destination.addressLine1 || '',
          street2: destination.addressLine2 || '',
          city: destination.city,
          state: destination.province || destination.state || '',
          zip: destination.postalCode || destination.postal_code || '',
          country: destination.countryCode || destination.country || 'CA',
          phone: destination.phone || ''
        };
        
        // Calculate total weight (default 0.5kg per item if not specified)
        const totalWeight = items.reduce((sum, item) => {
          const weight = item.weight || item.product?.shipping?.weight || 0.5;
          const quantity = item.quantity || 1;
          return sum + (weight * quantity);
        }, 0);
        
        // Create parcel (weight in oz for EasyPost)
        const parcel = {
          length: 8, // inches
          width: 6,
          height: 4,
          weight: Math.max(totalWeight * 35.274, 1) // Convert kg to oz, minimum 1 oz
        };
        
        // Create shipment to get rates
        const shipment = await easypost.Shipment.create({
          from_address: fromAddress,
          to_address: toAddress,
          parcel: parcel
        });
        
        if (shipment.rates && shipment.rates.length > 0) {
          // Find standard and express rates
          const standardRate = shipment.rates.find(r => 
            r.service && (
              r.service.toLowerCase().includes('regular') ||
              r.service.toLowerCase().includes('standard') ||
              r.service.toLowerCase().includes('ground')
            )
          ) || shipment.rates[0]; // Fallback to first rate
          
          // Find express rate - prioritize express services, then find higher rate than standard
          let expressRate = shipment.rates.find(r => 
            r.service && (
              r.service.toLowerCase().includes('express') ||
              r.service.toLowerCase().includes('xpresspost') ||
              r.service.toLowerCase().includes('priority')
            )
          );
          
          // If no express service found, find the highest rate (should be faster service)
          if (!expressRate) {
            const sortedRates = [...shipment.rates].sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate));
            expressRate = sortedRates.find(r => parseFloat(r.rate) > parseFloat(standardRate.rate)) || sortedRates[0];
          }
          
          // Ensure we have both rates
          if (!expressRate) {
            expressRate = standardRate;
          }
          
          // Convert to USD (EasyPost returns CAD for Canada Post)
          const cadToUsd = 0.73; // Approximate conversion
          
          const standardCost = Math.max(0, parseFloat(standardRate.rate || 0) * cadToUsd);
          let expressCost = Math.max(0, parseFloat(expressRate.rate || 0) * cadToUsd);
          
          // Ensure express is at least 1.2x standard (minimum express premium)
          // This ensures express is always more expensive than standard
          const minExpressCost = standardCost * 1.2;
          if (expressCost < minExpressCost) {
            expressCost = minExpressCost;
          }
          
          // Apply caps
          const MAX_STANDARD = 30;
          const MAX_EXPRESS = 40;
          
          return {
            standard: {
              name: 'Zuba Standard Shipping',
              cost: Math.min(Math.round(standardCost * 100) / 100, MAX_STANDARD),
              displayCost: `$${Math.min(standardCost, MAX_STANDARD).toFixed(2)} USD`,
              delivery: standardRate.est_delivery_days 
                ? `${standardRate.est_delivery_days} business days`
                : '5-10 business days',
              estimatedDelivery: standardRate.est_delivery_days 
                ? `${standardRate.est_delivery_days} business days`
                : '5-10 business days',
              minDays: 5,
              maxDays: 10,
              type: 'standard',
              source: 'easypost',
              carrier: standardRate.carrier || 'Canada Post'
            },
            express: {
              name: 'Zuba Express Shipping',
              cost: Math.min(Math.round(expressCost * 100) / 100, MAX_EXPRESS),
              displayCost: `$${Math.min(expressCost, MAX_EXPRESS).toFixed(2)} USD`,
              delivery: expressRate.est_delivery_days
                ? `${expressRate.est_delivery_days} business days`
                : '2-5 business days',
              estimatedDelivery: expressRate.est_delivery_days
                ? `${expressRate.est_delivery_days} business days`
                : '2-5 business days',
              minDays: 2,
              maxDays: 5,
              type: 'express',
              source: 'easypost',
              carrier: expressRate.carrier || 'Canada Post'
            }
          };
        }
      } catch (easypostError) {
        console.error('EasyPost error:', easypostError.message);
        // Fall through to fallback
      }
    }
    
    // Use fallback pricing (for non-Canada or if EasyPost fails)
    return calculateFallbackRates(items, destination);
    
  } catch (error) {
    console.error('Shipping service error:', error);
    // Always return fallback rates
    return calculateFallbackRates(items, destination || {});
  }
};

