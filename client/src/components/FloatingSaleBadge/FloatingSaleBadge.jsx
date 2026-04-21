import React, { useState, useEffect, memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';
import './FloatingSaleBadge.css';

const FloatingSaleBadge = memo(() => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const shouldHideForCheckoutFlow =
    location.pathname.startsWith('/checkout') ||
    location.pathname.startsWith('/cart');

  useEffect(() => {
    const dismissed = sessionStorage.getItem('saleBadgeDismissed');
    if (dismissed === 'true') {
      return;
    }

    // Check if badge was minimized in this session
    const minimized = sessionStorage.getItem('saleBadgeMinimized');
    if (minimized === 'true') {
      setIsMinimized(true);
    }

    // Show after a short delay so it doesn't feel intrusive
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 2200);

    // Auto-hide after some time to avoid covering content
    const autoHideTimer = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('saleBadgeDismissed', 'true');
    }, 18000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(autoHideTimer);
    };
  }, []);

  const handleDismiss = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVisible(false);
    sessionStorage.setItem('saleBadgeDismissed', 'true');
  };

  const handleMinimize = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMinimized(true);
    sessionStorage.setItem('saleBadgeMinimized', 'true');
  };

  const handleExpand = () => {
    setIsMinimized(false);
    sessionStorage.removeItem('saleBadgeMinimized');
  };

  if (!isVisible || shouldHideForCheckoutFlow) return null;

  return (
    <div className={`floating-sale-badge ${isMinimized ? 'minimized' : ''}`}>
      {isMinimized ? (
        <button className="minimized-badge" onClick={handleExpand}>
          🏷️ Sale
        </button>
      ) : (
        <Link to="/sales" className="sale-badge-content">
          <button
            className="dismiss-btn"
            onClick={handleDismiss}
            aria-label="Close sale badge"
          >
            <FaTimes />
          </button>
          <button 
            className="minimize-btn" 
            onClick={handleMinimize}
            aria-label="Minimize"
          >
            <FaTimes />
          </button>
          <div className="badge-icon">
            🏷️
          </div>
          <div className="badge-text">
            <span className="badge-title">Sale</span>
            <span className="badge-subtitle">Up to 50% OFF</span>
          </div>
          <span className="badge-cta">Shop →</span>
        </Link>
      )}
    </div>
  );
});

export default FloatingSaleBadge;

