import { stallionAPI, WAREHOUSE } from '../config/stallion.js';
import ShippingCalculator from '../utils/shippingCalculator.js';
import RegionShippingCalculator from '../utils/regionShippingCalculator.js';

/**
 * Get live shipping rates with fallback
 */
export const getShippingRates = async (req, res) => {
  try {
    const { cartItems, shippingAddress } = req.body;

    // Validation
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty or invalid'
      });
    }

    // Worldwide support - need at least city and country (postal code optional for some countries)
    const hasPostalCode = shippingAddress?.postal_code || 
                         shippingAddress?.postalCode ||
                         shippingAddress?.address?.postalCode;
    const hasCity = shippingAddress?.city || shippingAddress?.address?.city;
    const hasCountry = shippingAddress?.countryCode || 
                      shippingAddress?.country ||
                      shippingAddress?.address?.countryCode;
    
    if (!hasCity || !hasCountry) {
      return res.status(400).json({
        success: false,
        message: 'City and country are required for shipping calculation'
      });
    }

    // Get country code (worldwide support)
    const countryCode = (hasCountry || 'CA').toString().toUpperCase();

    // Validate postal code format (relaxed for worldwide)
    const cleanPostalCode = (shippingAddress.postal_code || 
                            shippingAddress.postalCode ||
                            shippingAddress.address?.postalCode ||
                            '').replace(/\s/g, '').toUpperCase();
    
    // Only validate Canadian postal codes strictly (if provided)
    if (countryCode === 'CA' && cleanPostalCode && cleanPostalCode.length > 0) {
      const postalCodeRegex = /^[A-Za-z]\d[A-Za-z][\s-]?\d[A-Za-z]\d$/;
      if (!postalCodeRegex.test(cleanPostalCode)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Canadian postal code format. Please use format: A1A1A1'
        });
      }
    }

    // Calculate package dimensions
    const packageDetails = ShippingCalculator.calculatePackage(cartItems);
    
    // Format addresses
    const fromAddress = WAREHOUSE;
    let toAddress;
    try {
      toAddress = ShippingCalculator.formatAddress(shippingAddress);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid address format: ' + error.message
      });
    }

    // Prepare Stallion request
    const ratesRequest = {
      from: {
        country: fromAddress.country,
        province: fromAddress.province,
        postal_code: fromAddress.postal_code
      },
      to: {
        name: toAddress.name,
        address1: toAddress.address1,
        city: toAddress.city,
        province: toAddress.province,
        postal_code: toAddress.postal_code,
        country: toAddress.country,
        phone: toAddress.phone
      },
      parcel: {
        length: packageDetails.length,
        width: packageDetails.width,
        height: packageDetails.height,
        weight: packageDetails.weight
      }
    };

    try {
      // Try to get live Stallion rates
      const response = await stallionAPI.post('/rates', ratesRequest);
      
      if (response?.data?.rates && Array.isArray(response.data.rates) && response.data.rates.length > 0) {
        // Success - return live rates
        const rates = response.data.rates
          .map(rate => {
            const cost = parseFloat(rate.total || rate.cost || 0);
            // Filter out invalid rates (negative or zero cost)
            if (isNaN(cost) || cost <= 0) return null;
            
            // Get delivery estimate from region calculator for consistency
            const deliveryEstimate = RegionShippingCalculator.getDeliveryEstimate(countryCode);
            
            // Parse delivery days if provided by Stallion
            let minDays = deliveryEstimate.minDays;
            let maxDays = deliveryEstimate.maxDays;
            let deliveryDaysStr = deliveryEstimate.estimate;
            
            if (rate.delivery_days) {
              if (typeof rate.delivery_days === 'string' && rate.delivery_days.includes('-')) {
                const parts = rate.delivery_days.split('-');
                minDays = parseInt(parts[0]) || deliveryEstimate.minDays;
                maxDays = parseInt(parts[1]) || deliveryEstimate.maxDays;
                deliveryDaysStr = rate.delivery_days;
              } else if (typeof rate.delivery_days === 'number') {
                minDays = rate.delivery_days;
                maxDays = rate.delivery_days;
                deliveryDaysStr = `${rate.delivery_days} business days`;
              }
            }
            
            return {
              carrier: rate.carrier || 'Unknown',
              service: rate.service_name || rate.service || 'Standard',
              serviceCode: rate.service_code || 'STANDARD',
              cost: cost,
              currency: rate.currency || 'CAD',
              deliveryDays: deliveryDaysStr,
              minDays: minDays,
              maxDays: maxDays,
              deliveryDate: rate.delivery_date || null,
              isLive: true,
              region: deliveryEstimate.regionName
            };
          })
          .filter(rate => rate !== null); // Remove invalid rates

        // Sort by price (cheapest first)
        rates.sort((a, b) => a.cost - b.cost);

        if (rates.length > 0) {
          return res.json({
            success: true,
            source: 'stallion',
            rates: rates,
            packageDetails: packageDetails
          });
        }
      }
    } catch (stallionError) {
      // Log error details for debugging
      const errorDetails = {
        message: stallionError.message,
        status: stallionError.response?.status,
        data: stallionError.response?.data,
        config: {
          url: stallionError.config?.url,
          method: stallionError.config?.method
        }
      };
      console.error('Stallion API Error:', JSON.stringify(errorDetails, null, 2));
      // Continue to fallback
    }

    // ✅ FALLBACK SHIPPING (if Stallion fails) - Region-based
    const countryCode = (shippingAddress.countryCode || 
                        shippingAddress.country || 
                        shippingAddress.address?.countryCode ||
                        'CA').toUpperCase();
    
    const coordinates = shippingAddress.coordinates || 
                       shippingAddress.googlePlaces?.coordinates ||
                       null;

    const fallbackResult = ShippingCalculator.calculateFallbackShipping(
      cartItems.length,
      packageDetails.weight,
      countryCode,
      coordinates
    );

    const fallbackRates = [
      {
        carrier: 'Zuba House',
        service: `Standard Shipping (${fallbackResult.region})`,
        serviceCode: 'STANDARD',
        cost: fallbackResult.cost,
        currency: 'USD',
        deliveryDays: fallbackResult.deliveryEstimate,
        minDays: fallbackResult.minDays,
        maxDays: fallbackResult.maxDays,
        deliveryDate: null,
        isLive: false,
        region: fallbackResult.region
      }
    ];

    return res.json({
      success: true,
      source: 'fallback',
      reason: 'Stallion API unavailable',
      rates: fallbackRates,
      packageDetails: packageDetails,
      formula: {
        baseRate: process.env.FALLBACK_BASE_RATE || 13,
        extraItemRate: process.env.FALLBACK_EXTRA_ITEM || 3,
        quantity: cartItems.length,
        totalCost: fallbackCost
      }
    });

  } catch (error) {
    console.error('Shipping Controller Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate shipping rates',
      error: error.message
    });
  }
};

/**
 * Create shipment and get label
 */
export const createShipment = async (req, res) => {
  try {
    const { orderId, shippingAddress, packageDetails, serviceCode } = req.body;

    // Validation
    if (!orderId || !shippingAddress || !packageDetails) {
      return res.status(400).json({
        success: false,
        message: 'Order ID, shipping address, and package details are required'
      });
    }

    const fromAddress = WAREHOUSE;
    let toAddress;
    try {
      toAddress = ShippingCalculator.formatAddress(shippingAddress);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid address format: ' + error.message
      });
    }

    const shipmentRequest = {
      from: fromAddress,
      to: toAddress,
      parcel: packageDetails,
      service_code: serviceCode || 'CA-POST-REGULAR',
      reference: orderId
    };

    const response = await stallionAPI.post('/shipments', shipmentRequest);

    res.json({
      success: true,
      shipment: {
        id: response.data.id,
        trackingNumber: response.data.tracking_number,
        labelUrl: response.data.label_url,
        carrier: response.data.carrier,
        service: response.data.service_name
      }
    });

  } catch (error) {
    console.error('Create Shipment Error:', error.response?.data || error);
    res.status(500).json({
      success: false,
      message: 'Failed to create shipment'
    });
  }
};

/**
 * Track shipment
 */
export const trackShipment = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    
    // Validate tracking number
    if (!trackingNumber || trackingNumber.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tracking number is required'
      });
    }

    const response = await stallionAPI.get(`/tracking/${trackingNumber.trim()}`);
    
    if (response?.data) {
      res.json({
        success: true,
        tracking: response.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Tracking information not found'
      });
    }

  } catch (error) {
    console.error('Track Shipment Error:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      res.status(404).json({
        success: false,
        message: 'Tracking number not found'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to track shipment: ' + (error.message || 'Unknown error')
      });
    }
  }
};

