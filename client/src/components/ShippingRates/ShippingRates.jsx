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
    if (shippingAddress && shippingAddress.postal_code && cartItems && cartItems.length > 0) {
      fetchShippingRates();
    }
  }, [shippingAddress, cartItems]);

  const fetchShippingRates = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(
        `${VITE_API_URL}/api/shipping/rates`,
        {
          cartItems: cartItems,
          shippingAddress: shippingAddress
        }
      );

      if (response.data.success) {
        setRates(response.data.rates);
        setSource(response.data.source);
        
        // Auto-select cheapest option
        if (response.data.rates.length > 0) {
          const cheapest = response.data.rates[0];
          setSelectedRate(cheapest);
          onRateSelected && onRateSelected(cheapest);
        }
      }
    } catch (err) {
      console.error('Shipping rates error:', err);
      setError('Unable to calculate shipping. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRateSelect = (rate) => {
    setSelectedRate(rate);
    onRateSelected && onRateSelected(rate);
  };

  if (!shippingAddress || !shippingAddress.postal_code) {
    return (
      <div className="shipping-rates-placeholder">
        <p>📍 Enter your address to see shipping options</p>
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
                  ${rate.cost.toFixed(2)}
                </span>
                <span className="rate-currency">{rate.currency}</span>
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

