import React, { useState } from 'react';
import './DiscountInput.css';

/**
 * Discount Input Component
 * Handles promo code and gift card input
 */
const DiscountInput = ({ 
  cartItems = [], 
  cartTotal = 0, 
  shippingCost = 0,
  onDiscountsCalculated,
  apiUrl = '/api'
}) => {
  const [promoCode, setPromoCode] = useState('');
  const [giftCardCode, setGiftCardCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [discounts, setDiscounts] = useState(null);
  const [activeTab, setActiveTab] = useState('coupon'); // 'coupon' or 'giftcard'

  const calculateDiscounts = async () => {
    if (!promoCode.trim() && !giftCardCode.trim()) {
      setError('Please enter a promo code or gift card code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/discounts/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cartItems,
          cartTotal,
          shippingCost,
          couponCode: promoCode.trim() || null,
          giftCardCode: giftCardCode.trim() || null
        })
      });

      const data = await response.json();

      if (data.success) {
        setDiscounts(data.discounts);
        if (onDiscountsCalculated) {
          onDiscountsCalculated(data.discounts);
        }
      } else {
        setError(data.error || 'Failed to apply discount');
        setDiscounts(null);
      }
    } catch (err) {
      console.error('Discount calculation error:', err);
      setError('Failed to calculate discounts. Please try again.');
      setDiscounts(null);
    } finally {
      setLoading(false);
    }
  };

  const removeDiscount = (type) => {
    if (type === 'coupon') {
      setPromoCode('');
    } else {
      setGiftCardCode('');
    }
    setDiscounts(null);
    setError('');
    if (onDiscountsCalculated) {
      onDiscountsCalculated(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      calculateDiscounts();
    }
  };

  return (
    <div className="discount-input-container">
      <div className="discount-tabs">
        <button
          className={activeTab === 'coupon' ? 'active' : ''}
          onClick={() => setActiveTab('coupon')}
        >
          Promo Code
        </button>
        <button
          className={activeTab === 'giftcard' ? 'active' : ''}
          onClick={() => setActiveTab('giftcard')}
        >
          Gift Card
        </button>
      </div>

      <div className="discount-input-section">
        {activeTab === 'coupon' ? (
          <div className="promo-code-input">
            {discounts?.coupon ? (
              <div className="applied-discount">
                <div className="discount-info">
                  <span className="discount-icon">✓</span>
                  <span className="discount-code">{discounts.coupon.code}</span>
                  <span className="discount-amount">-${discounts.couponDiscount.toFixed(2)}</span>
                </div>
                <button 
                  className="remove-btn"
                  onClick={() => removeDiscount('coupon')}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
                <button 
                  onClick={calculateDiscounts}
                  disabled={loading || !promoCode.trim()}
                  className="apply-btn"
                >
                  {loading ? 'Applying...' : 'Apply'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="gift-card-input">
            {discounts?.giftCard ? (
              <div className="applied-discount">
                <div className="discount-info">
                  <span className="discount-icon">🎁</span>
                  <span className="discount-code">{discounts.giftCard.code}</span>
                  <span className="discount-amount">-${discounts.giftCardDiscount.toFixed(2)}</span>
                  <span className="balance-info">
                    (Balance: ${discounts.giftCard.currentBalance.toFixed(2)})
                  </span>
                </div>
                <button 
                  className="remove-btn"
                  onClick={() => removeDiscount('giftcard')}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Enter gift card code"
                  value={giftCardCode}
                  onChange={(e) => setGiftCardCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
                <button 
                  onClick={calculateDiscounts}
                  disabled={loading || !giftCardCode.trim()}
                  className="apply-btn"
                >
                  {loading ? 'Applying...' : 'Apply'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="discount-error">
          {error}
        </div>
      )}

      {discounts && discounts.automaticDiscounts?.length > 0 && (
        <div className="automatic-discounts">
          <h4>Automatic Discounts Applied:</h4>
          {discounts.automaticDiscounts.map((discount, index) => (
            <div key={index} className="auto-discount-item">
              <span className="discount-name">{discount.name}</span>
              <span className="discount-amount">-${discount.discount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {discounts && (
        <div className="discount-summary">
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          {discounts.couponDiscount > 0 && (
            <div className="summary-row discount-row">
              <span>Coupon Discount ({discounts.coupon?.code}):</span>
              <span>-${discounts.couponDiscount.toFixed(2)}</span>
            </div>
          )}
          {discounts.giftCardDiscount > 0 && (
            <div className="summary-row discount-row">
              <span>Gift Card ({discounts.giftCard?.code}):</span>
              <span>-${discounts.giftCardDiscount.toFixed(2)}</span>
            </div>
          )}
          {discounts.automaticDiscounts?.reduce((sum, d) => sum + d.discount, 0) > 0 && (
            <div className="summary-row discount-row">
              <span>Automatic Discounts:</span>
              <span>
                -${discounts.automaticDiscounts.reduce((sum, d) => sum + d.discount, 0).toFixed(2)}
              </span>
            </div>
          )}
          {discounts.freeShipping && (
            <div className="summary-row discount-row">
              <span>Free Shipping:</span>
              <span>-${shippingCost.toFixed(2)}</span>
            </div>
          )}
          <div className="summary-row total-row">
            <span>Total:</span>
            <span>${discounts.finalTotal.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountInput;

