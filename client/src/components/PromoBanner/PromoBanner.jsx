import React, { useState, useEffect, memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';
import './PromoBanner.css';

const PromoBanner = memo(() => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const shouldHideForCheckoutFlow =
    location.pathname.startsWith('/checkout') ||
    location.pathname.startsWith('/cart');

  const promotions = [
    {
      text: '🔥 HOLIDAY SALE - Up to 50% OFF on African Fashion!',
      link: '/sales',
      cta: 'Shop Now'
    },
    {
      text: '🎁 Use code WELCOME10 for 10% OFF your first order!',
      link: '/sales',
      cta: 'Get Code'
    },
    {
      text: '✨ FREE SHIPPING on orders over $75 - Limited Time!',
      link: '/products',
      cta: 'Shop Now'
    },
    {
      text: '💝 Gift Cards Available - Perfect for Any Occasion!',
      link: '/sales',
      cta: 'Buy Now'
    }
  ];

  // Rotate through promotions every 5 seconds
  useEffect(() => {
    if (!isVisible) return undefined;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promotions.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isVisible, promotions.length]);

  // Show/hide behavior with dismissal support
  useEffect(() => {
    const dismissed = sessionStorage.getItem('promoBannerDismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
      return;
    }

    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 600);

    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 12000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('promoBannerDismissed', 'true');
  };

  if (!isVisible || shouldHideForCheckoutFlow) return null;

  const currentPromo = promotions[currentIndex];

  return (
    <div className="promo-banner">
      <div className="promo-banner-content">
        <div className="promo-text-container">
          <span className="promo-text" key={currentIndex}>
            {currentPromo.text}
          </span>
        </div>
        <Link to={currentPromo.link} className="promo-cta">
          {currentPromo.cta}
        </Link>
      </div>
      <button 
        className="promo-close" 
        onClick={handleClose}
        aria-label="Close banner"
      >
        <FaTimes />
      </button>
      
      {/* Progress dots */}
      <div className="promo-dots">
        {promotions.map((_, index) => (
          <span 
            key={index} 
            className={`dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
});

export default PromoBanner;

