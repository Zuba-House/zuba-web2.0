import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ShippingRates.css';

const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ShippingRates = ({ cartItems, shippingAddress, onRateSelected }) => {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRate, setSelectedRate] = useState(null);
  const [source, setSource] = useState('');

  useEffect(() => {
    // Only fetch if we have valid address and cart items (worldwide support)
    const hasValidAddress = shippingAddress && (
      (shippingAddress.postal_code && shippingAddress.city) ||
      (shippingAddress.city && shippingAddress.countryCode)
    );
    
    if (hasValidAddress && cartItems?.length > 0) {
      // Debounce to avoid too many API calls
      const timeoutId = setTimeout(() => {
        fetchShippingRates();
      }, 500); // Wait 500ms after user stops typing

      return () => clearTimeout(timeoutId);
    } else {
      // Reset rates if address is invalid
      setRates([]);
      setSelectedRate(null);
      onRateSelected && onRateSelected(null);
    }
  }, [shippingAddress?.postal_code, shippingAddress?.city, shippingAddress?.province, shippingAddress?.countryCode, cartItems?.length]);

  const fetchShippingRates = async () => {
    // Validate inputs before making request (worldwide support)
    const hasValidAddress = shippingAddress && (
      (shippingAddress.postal_code && shippingAddress.city) ||
      (shippingAddress.city && shippingAddress.countryCode)
    );
    
    if (!hasValidAddress || !cartItems?.length) {
      setError('Please enter a valid address (city and country required)');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(
        `${VITE_API_URL}/api/shipping/rates`,
        {
          cartItems: cartItems,
          shippingAddress: shippingAddress
        },
        {
          timeout: 20000 // 20 second timeout
        }
      );

      if (response?.data?.success && Array.isArray(response.data.rates)) {
        setRates(response.data.rates);
        setSource(response.data.source || 'fallback');
        
        // Auto-select cheapest option
        if (response.data.rates.length > 0) {
          const cheapest = response.data.rates[0];
          setSelectedRate(cheapest);
          onRateSelected && onRateSelected(cheapest);
        } else {
          setError('No shipping options available for this address');
        }
      } else {
        setError(response?.data?.message || 'Unable to calculate shipping rates');
      }
    } catch (err) {
      console.error('Shipping rates error:', err);
      
      // Provide more specific error messages
      if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Please try again.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 400) {
        setError('Invalid address. Please check your postal code and try again.');
      } else if (err.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else {
        setError('Unable to calculate shipping. Please check your connection and try again.');
      }
      
      // Reset rates on error
      setRates([]);
      setSelectedRate(null);
      onRateSelected && onRateSelected(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRateSelect = (rate) => {
    setSelectedRate(rate);
    onRateSelected && onRateSelected(rate);
  };

  const hasValidAddress = shippingAddress && (
    (shippingAddress.postal_code && shippingAddress.city) ||
    (shippingAddress.city && shippingAddress.countryCode)
  );

  if (!hasValidAddress) {
    return (
      <div className="shipping-rates-placeholder">
        <p>📍 Enter your address (city and country) to see shipping options</p>
        <small className="text-gray-500 text-xs mt-2 block">
          🌍 We ship worldwide! Use the address search above.
        </small>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="shipping-rates-loading">
        <div className="spinner"></div>
        <p>Calculating shipping rates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shipping-rates-error">
        <p>⚠️ {error}</p>
        <button onClick={fetchShippingRates} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="shipping-rates-container">
      <h3 className="shipping-rates-title">
        🚚 Shipping Options
        {source === 'fallback' && (
          <span className="fallback-badge">Estimated</span>
        )}
      </h3>

      {rates.length === 0 ? (
        <p className="no-rates">No shipping options available</p>
      ) : (
        <div className="shipping-rates-list">
          {rates.map((rate, index) => (
            <div
              key={index}
              className={`shipping-rate-card ${selectedRate === rate ? 'selected' : ''} ${index === 0 ? 'cheapest' : ''}`}
              onClick={() => handleRateSelect(rate)}
            >
              <div className="rate-radio">
                <input
                  type="radio"
                  name="shippingRate"
                  checked={selectedRate === rate}
                  onChange={() => handleRateSelect(rate)}
                />
              </div>

              <div className="rate-details">
                <div className="rate-header">
                  <span className="rate-carrier">{rate.carrier}</span>
                  {index === 0 && (
                    <span className="cheapest-badge">Cheapest</span>
                  )}
                </div>
                
                <div className="rate-service">{rate.service}</div>
                
                {rate.deliveryDays && (
                  <div className="rate-delivery">
                    📦 Estimated delivery: {rate.deliveryDays} business days
                    {rate.region && (
                      <span className="text-gray-500 text-xs ml-2">({rate.region})</span>
                    )}
                  </div>
                )}
                
                {rate.deliveryDate && (
                  <div className="rate-delivery-date">
                    📅 Expected by: {new Date(rate.deliveryDate).toLocaleDateString()}
                  </div>
                )}
              </div>

              <div className="rate-price">
                <span className="rate-cost">
                  ${typeof rate.cost === 'number' ? rate.cost.toFixed(2) : '0.00'}
                </span>
                <span className="rate-currency">{rate.currency || 'USD'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {source === 'stallion' && (
        <p className="rate-source-info">
          ✅ Live rates from Stallion Express
        </p>
      )}
      
      {source === 'fallback' && (
        <p className="rate-source-info">
          ℹ️ Estimated shipping cost (final rate calculated at shipment)
        </p>
      )}
    </div>
  );
};

export default ShippingRates;

