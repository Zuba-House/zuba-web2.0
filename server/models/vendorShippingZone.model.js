import mongoose from 'mongoose';

/**
 * Vendor Shipping Zones Model
 * Region-based shipping rates for vendors
 * WooCommerce-style shipping zone management
 */

const shippingMethodSchema = new mongoose.Schema({
  methodId: {
    type: String,
    required: true
  },
  methodName: {
    type: String,
    required: true
  },
  methodType: {
    type: String,
    enum: ['standard', 'express', 'overnight', 'economy', 'pickup', 'local_delivery'],
    default: 'standard'
  },
  
  // Pricing structure
  pricing: {
    type: {
      type: String,
      enum: ['free', 'flat_rate', 'weight_based', 'value_based', 'item_based', 'calculated'],
      default: 'flat_rate'
    },
    
    // Flat rate pricing
    baseRate: {
      type: Number,
      default: 0
    },
    
    // Per additional item
    additionalItemRate: {
      type: Number,
      default: 0
    },
    
    // Weight-based pricing
    pricePerKg: {
      type: Number,
      default: 0
    },
    freeWeightThreshold: {
      type: Number,
      default: 0
    },
    
    // Value-based pricing (percentage of order value)
    pricePercentage: {
      type: Number,
      default: 0
    },
    minimumCharge: {
      type: Number,
      default: 0
    },
    
    // Free shipping threshold
    freeShippingThreshold: {
      type: Number,
      default: 0
    },
    
    // Maximum charge cap
    maximumCharge: {
      type: Number,
      default: 0
    }
  },
  
  // Delivery time estimates
  deliveryTime: {
    min: {
      type: Number,
      default: 3
    },
    max: {
      type: Number,
      default: 7
    },
    unit: {
      type: String,
      enum: ['hours', 'days', 'weeks'],
      default: 'days'
    }
  },
  
  // Processing time before shipping
  processingTime: {
    min: {
      type: Number,
      default: 1
    },
    max: {
      type: Number,
      default: 2
    },
    unit: {
      type: String,
      enum: ['hours', 'days'],
      default: 'days'
    }
  },
  
  // Method settings
  enabled: {
    type: Boolean,
    default: true
  },
  description: String,
  
  // Restrictions
  restrictions: {
    minWeight: Number,
    maxWeight: Number,
    minValue: Number,
    maxValue: Number,
    minItems: Number,
    maxItems: Number,
    excludedCategories: [String],
    excludedProducts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }],
    requireSignature: {
      type: Boolean,
      default: false
    },
    allowPOBox: {
      type: Boolean,
      default: true
    },
    hazardousMaterialsAllowed: {
      type: Boolean,
      default: false
    }
  },
  
  // Carrier integration
  carrier: {
    name: String,
    code: String,
    serviceCode: String,
    trackingUrl: String
  }
}, { _id: true });

const vendorShippingZoneSchema = new mongoose.Schema({
  // ═══════════════════════════════════════════════════════
  // 🏪 VENDOR REFERENCE
  // ═══════════════════════════════════════════════════════
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    index: true
  },

  // ═══════════════════════════════════════════════════════
  // 🏷️ ZONE IDENTIFICATION
  // ═══════════════════════════════════════════════════════
  zoneName: {
    type: String,
    required: true,
    trim: true
  },
  
  zoneCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  
  description: String,

  // ═══════════════════════════════════════════════════════
  // 🌍 GEOGRAPHIC COVERAGE
  // ═══════════════════════════════════════════════════════
  
  // Countries in this zone
  countries: [{
    countryCode: {
      type: String,
      uppercase: true
    }, // ISO 2-letter code (e.g., 'CA', 'US')
    countryName: String,
    enabled: {
      type: Boolean,
      default: true
    }
  }],
  
  // Specific regions/states/provinces
  regions: [{
    regionCode: String, // State/Province code
    regionName: String,
    countryCode: String,
    enabled: {
      type: Boolean,
      default: true
    }
  }],
  
  // Specific cities
  cities: [{
    cityName: String,
    regionCode: String,
    countryCode: String,
    enabled: {
      type: Boolean,
      default: true
    }
  }],
  
  // Postal code patterns (for fine-grained control)
  postalCodePatterns: [{
    pattern: String, // RegEx pattern or prefix
    description: String,
    included: {
      type: Boolean,
      default: true
    } // true = include, false = exclude
  }],

  // ═══════════════════════════════════════════════════════
  // 🚚 SHIPPING METHODS
  // ═══════════════════════════════════════════════════════
  shippingMethods: [shippingMethodSchema],

  // ═══════════════════════════════════════════════════════
  // ⚙️ ZONE SETTINGS
  // ═══════════════════════════════════════════════════════
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Priority (higher = checked first)
  priority: {
    type: Number,
    default: 0
  },
  
  // Default zone (fallback for unmatched locations)
  isDefault: {
    type: Boolean,
    default: false
  },
  
  // Rest of World (catch-all zone)
  isRestOfWorld: {
    type: Boolean,
    default: false
  },

  // ═══════════════════════════════════════════════════════
  // 📦 DEFAULT PACKAGING
  // ═══════════════════════════════════════════════════════
  defaultPackaging: {
    length: Number,
    width: Number,
    height: Number,
    weight: Number,
    dimensionUnit: {
      type: String,
      enum: ['cm', 'inch'],
      default: 'cm'
    },
    weightUnit: {
      type: String,
      enum: ['kg', 'lb', 'g', 'oz'],
      default: 'kg'
    }
  },

  // ═══════════════════════════════════════════════════════
  // 📝 INTERNAL NOTES
  // ═══════════════════════════════════════════════════════
  internalNotes: String

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ═══════════════════════════════════════════════════════
// 📊 INDEXES
// ═══════════════════════════════════════════════════════
vendorShippingZoneSchema.index({ vendorId: 1, isActive: 1 });
vendorShippingZoneSchema.index({ vendorId: 1, priority: -1 });
vendorShippingZoneSchema.index({ 'countries.countryCode': 1 });
vendorShippingZoneSchema.index({ 'regions.regionCode': 1 });
vendorShippingZoneSchema.index({ isDefault: 1 });
vendorShippingZoneSchema.index({ isRestOfWorld: 1 });

// ═══════════════════════════════════════════════════════
// 🔧 STATIC METHODS
// ═══════════════════════════════════════════════════════

// Find matching zone for a destination
vendorShippingZoneSchema.statics.findMatchingZone = async function(vendorId, destination) {
  const { country, region, city, postalCode } = destination;
  
  // Get all active zones for vendor, sorted by priority
  const zones = await this.find({
    vendorId,
    isActive: true
  }).sort({ priority: -1, isDefault: 1 });
  
  // Check zones in priority order
  for (const zone of zones) {
    // Check postal code patterns first (most specific)
    if (postalCode && zone.postalCodePatterns.length > 0) {
      for (const pattern of zone.postalCodePatterns) {
        const regex = new RegExp(pattern.pattern, 'i');
        if (regex.test(postalCode)) {
          if (pattern.included) {
            return zone;
          }
        }
      }
    }
    
    // Check city
    if (city && zone.cities.length > 0) {
      const matchingCity = zone.cities.find(
        c => c.cityName.toLowerCase() === city.toLowerCase() && c.enabled
      );
      if (matchingCity) {
        return zone;
      }
    }
    
    // Check region
    if (region && zone.regions.length > 0) {
      const matchingRegion = zone.regions.find(
        r => (r.regionCode === region || r.regionName.toLowerCase() === region.toLowerCase()) && r.enabled
      );
      if (matchingRegion) {
        return zone;
      }
    }
    
    // Check country
    if (country && zone.countries.length > 0) {
      const matchingCountry = zone.countries.find(
        c => (c.countryCode === country || c.countryName.toLowerCase() === country.toLowerCase()) && c.enabled
      );
      if (matchingCountry) {
        return zone;
      }
    }
    
    // Check if it's a "Rest of World" zone
    if (zone.isRestOfWorld) {
      return zone;
    }
    
    // Check if it's the default zone
    if (zone.isDefault) {
      return zone;
    }
  }
  
  // No matching zone found
  return null;
};

// Get available shipping methods for a destination
vendorShippingZoneSchema.statics.getAvailableMethods = async function(vendorId, destination, orderDetails = {}) {
  const zone = await this.findMatchingZone(vendorId, destination);
  
  if (!zone) {
    return { zone: null, methods: [], message: 'No shipping available for this location' };
  }
  
  const { totalWeight = 0, totalValue = 0, itemCount = 1 } = orderDetails;
  
  // Filter enabled methods and check restrictions
  const availableMethods = zone.shippingMethods.filter(method => {
    if (!method.enabled) return false;
    
    const r = method.restrictions;
    if (r) {
      if (r.minWeight && totalWeight < r.minWeight) return false;
      if (r.maxWeight && totalWeight > r.maxWeight) return false;
      if (r.minValue && totalValue < r.minValue) return false;
      if (r.maxValue && totalValue > r.maxValue) return false;
      if (r.minItems && itemCount < r.minItems) return false;
      if (r.maxItems && itemCount > r.maxItems) return false;
    }
    
    return true;
  });
  
  // Calculate shipping costs for each method
  const methodsWithCosts = availableMethods.map(method => {
    const cost = zone.calculateMethodCost(method, orderDetails);
    return {
      ...method.toObject(),
      calculatedCost: cost,
      isFree: cost === 0
    };
  });
  
  return {
    zone: {
      _id: zone._id,
      zoneName: zone.zoneName,
      zoneCode: zone.zoneCode
    },
    methods: methodsWithCosts
  };
};

// Get vendor's zones
vendorShippingZoneSchema.statics.getVendorZones = function(vendorId) {
  return this.find({ vendorId }).sort({ priority: -1, zoneName: 1 });
};

// ═══════════════════════════════════════════════════════
// 💡 INSTANCE METHODS
// ═══════════════════════════════════════════════════════

// Calculate shipping cost for a method
vendorShippingZoneSchema.methods.calculateMethodCost = function(method, orderDetails) {
  const { totalWeight = 0, totalValue = 0, itemCount = 1 } = orderDetails;
  const pricing = method.pricing;
  
  let cost = 0;
  
  switch (pricing.type) {
    case 'free':
      cost = 0;
      break;
      
    case 'flat_rate':
      cost = pricing.baseRate;
      if (itemCount > 1 && pricing.additionalItemRate) {
        cost += (itemCount - 1) * pricing.additionalItemRate;
      }
      break;
      
    case 'weight_based':
      cost = pricing.baseRate;
      if (totalWeight > (pricing.freeWeightThreshold || 0)) {
        cost += totalWeight * pricing.pricePerKg;
      }
      break;
      
    case 'value_based':
      cost = Math.max(
        totalValue * (pricing.pricePercentage / 100),
        pricing.minimumCharge || 0
      );
      break;
      
    case 'item_based':
      cost = pricing.baseRate * itemCount;
      break;
      
    case 'calculated':
      // Would integrate with carrier API
      cost = pricing.baseRate;
      break;
  }
  
  // Apply free shipping threshold
  if (pricing.freeShippingThreshold && totalValue >= pricing.freeShippingThreshold) {
    cost = 0;
  }
  
  // Apply maximum charge cap
  if (pricing.maximumCharge && cost > pricing.maximumCharge) {
    cost = pricing.maximumCharge;
  }
  
  return Math.round(cost * 100) / 100; // Round to 2 decimal places
};

// Calculate all methods' costs
vendorShippingZoneSchema.methods.calculateAllMethodsCosts = function(orderDetails) {
  return this.shippingMethods
    .filter(m => m.enabled)
    .map(method => ({
      methodId: method.methodId,
      methodName: method.methodName,
      methodType: method.methodType,
      cost: this.calculateMethodCost(method, orderDetails),
      deliveryTime: method.deliveryTime,
      processingTime: method.processingTime
    }));
};

// Add shipping method
vendorShippingZoneSchema.methods.addShippingMethod = async function(methodData) {
  this.shippingMethods.push(methodData);
  return await this.save();
};

// Update shipping method
vendorShippingZoneSchema.methods.updateShippingMethod = async function(methodId, methodData) {
  const methodIndex = this.shippingMethods.findIndex(m => m.methodId === methodId);
  if (methodIndex === -1) {
    throw new Error('Shipping method not found');
  }
  
  this.shippingMethods[methodIndex] = { ...this.shippingMethods[methodIndex].toObject(), ...methodData };
  return await this.save();
};

// Remove shipping method
vendorShippingZoneSchema.methods.removeShippingMethod = async function(methodId) {
  this.shippingMethods = this.shippingMethods.filter(m => m.methodId !== methodId);
  return await this.save();
};

// Add country to zone
vendorShippingZoneSchema.methods.addCountry = async function(countryCode, countryName) {
  const exists = this.countries.find(c => c.countryCode === countryCode);
  if (!exists) {
    this.countries.push({ countryCode, countryName, enabled: true });
    return await this.save();
  }
  return this;
};

// Add region to zone
vendorShippingZoneSchema.methods.addRegion = async function(regionCode, regionName, countryCode) {
  const exists = this.regions.find(r => r.regionCode === regionCode && r.countryCode === countryCode);
  if (!exists) {
    this.regions.push({ regionCode, regionName, countryCode, enabled: true });
    return await this.save();
  }
  return this;
};

// ═══════════════════════════════════════════════════════
// 💡 VIRTUALS
// ═══════════════════════════════════════════════════════
vendorShippingZoneSchema.virtual('countryCount').get(function() {
  return this.countries.filter(c => c.enabled).length;
});

vendorShippingZoneSchema.virtual('regionCount').get(function() {
  return this.regions.filter(r => r.enabled).length;
});

vendorShippingZoneSchema.virtual('activeMethodsCount').get(function() {
  return this.shippingMethods.filter(m => m.enabled).length;
});

vendorShippingZoneSchema.virtual('hasFreeShipping').get(function() {
  return this.shippingMethods.some(m => m.enabled && m.pricing.type === 'free');
});

const VendorShippingZoneModel = mongoose.model('VendorShippingZone', vendorShippingZoneSchema);

export default VendorShippingZoneModel;

