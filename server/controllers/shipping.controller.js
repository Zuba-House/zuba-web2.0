import { stallionAPI, WAREHOUSE } from '../config/stallion.js';
import ShippingCalculator from '../utils/shippingCalculator.js';

/**
 * Get live shipping rates with fallback
 */
export const getShippingRates = async (req, res) => {
  try {
    const { cartItems, shippingAddress } = req.body;

    // Validation
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    if (!shippingAddress || !shippingAddress.postal_code) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      });
    }

    // Calculate package dimensions
    const packageDetails = ShippingCalculator.calculatePackage(cartItems);
    
    // Format addresses
    const fromAddress = WAREHOUSE;
    const toAddress = ShippingCalculator.formatAddress(shippingAddress);

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
      
      if (response.data && response.data.rates && response.data.rates.length > 0) {
        // Success - return live rates
        const rates = response.data.rates.map(rate => ({
          carrier: rate.carrier || 'Unknown',
          service: rate.service_name || rate.service || 'Standard',
          serviceCode: rate.service_code || 'STANDARD',
          cost: parseFloat(rate.total || rate.cost || 0),
          currency: rate.currency || 'CAD',
          deliveryDays: rate.delivery_days || null,
          deliveryDate: rate.delivery_date || null,
          isLive: true
        }));

        // Sort by price (cheapest first)
        rates.sort((a, b) => a.cost - b.cost);

        return res.json({
          success: true,
          source: 'stallion',
          rates: rates,
          packageDetails: packageDetails
        });
      }
    } catch (stallionError) {
      console.error('Stallion API Error:', stallionError.response?.data || stallionError.message);
      // Continue to fallback
    }

    // ✅ FALLBACK SHIPPING (if Stallion fails)
    const fallbackCost = ShippingCalculator.calculateFallbackShipping(
      cartItems.length,
      packageDetails.weight
    );

    const fallbackRates = [
      {
        carrier: 'Zuba House',
        service: 'Standard Shipping',
        serviceCode: 'STANDARD',
        cost: fallbackCost,
        currency: 'USD',
        deliveryDays: '5-7',
        deliveryDate: null,
        isLive: false
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

    const fromAddress = WAREHOUSE;
    const toAddress = ShippingCalculator.formatAddress(shippingAddress);

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
    
    const response = await stallionAPI.get(`/tracking/${trackingNumber}`);
    
    res.json({
      success: true,
      tracking: response.data
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to track shipment'
    });
  }
};

