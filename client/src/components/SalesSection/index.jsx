import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { FaFire, FaPercent, FaClock, FaArrowRight, FaTag, FaGift } from 'react-icons/fa';
import { MdLocalOffer } from 'react-icons/md';
import { fetchDataFromApi } from '../../utils/api';
import ProductItem from '../ProductItem';
import './SalesSection.css';

import 'swiper/css';
import 'swiper/css/navigation';

const SalesSection = () => {
  const [saleProducts, setSaleProducts] = useState([]);
  const [promotions, setPromotions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePromo, setActivePromo] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch sale products and promotions in parallel
        const [productsRes, promotionsRes] = await Promise.all([
          fetchDataFromApi('/api/product/getSaleProducts?limit=12'),
          fetchDataFromApi('/api/product/getActivePromotions')
        ]);

        if (productsRes?.success && productsRes?.products) {
          setSaleProducts(productsRes.products);
        }

        if (promotionsRes?.success && promotionsRes?.promotions) {
          setPromotions(promotionsRes.promotions);
        }
      } catch (error) {
        console.error('Error fetching sales data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Rotate through active coupons
  useEffect(() => {
    if (promotions?.coupons?.length > 1) {
      const interval = setInterval(() => {
        setActivePromo((prev) => (prev + 1) % promotions.coupons.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [promotions?.coupons?.length]);

  // Don't render if no sales or promotions
  if (!loading && saleProducts.length === 0 && (!promotions?.coupons || promotions.coupons.length === 0)) {
    return null;
  }

  const formatDiscountText = (coupon) => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountAmount}% OFF`;
    } else if (coupon.discountType === 'fixed_cart') {
      return `$${coupon.discountAmount} OFF`;
    } else {
      return `$${coupon.discountAmount} OFF per item`;
    }
  };

  const getTimeRemaining = (endDate) => {
    if (!endDate) return null;
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;
    
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h left`;
    }
    return `${hours}h left`;
  };

  return (
    <section className="sales-section">
      {/* Promotional Banner */}
      {promotions?.coupons && promotions.coupons.length > 0 && (
        <div className="promo-banner-container">
          <div className="promo-banner">
            <div className="promo-icon">
              <MdLocalOffer />
            </div>
            <div className="promo-content">
              <div className="promo-badge">
                <FaTag /> PROMO CODE
              </div>
              <div className="promo-code-display">
                <span className="code">{promotions.coupons[activePromo]?.code}</span>
                <span className="discount-amount">
                  {formatDiscountText(promotions.coupons[activePromo])}
                </span>
              </div>
              {promotions.coupons[activePromo]?.description && (
                <p className="promo-description">{promotions.coupons[activePromo].description}</p>
              )}
              {promotions.coupons[activePromo]?.minimumAmount > 0 && (
                <span className="promo-condition">
                  Min. purchase: ${promotions.coupons[activePromo].minimumAmount}
                </span>
              )}
              {promotions.coupons[activePromo]?.endsAt && (
                <span className="promo-timer">
                  <FaClock /> {getTimeRemaining(promotions.coupons[activePromo].endsAt)}
                </span>
              )}
            </div>
            {promotions.coupons[activePromo]?.freeShipping && (
              <div className="free-shipping-badge">
                <FaGift /> + FREE SHIPPING
              </div>
            )}
          </div>
          {promotions.coupons.length > 1 && (
            <div className="promo-dots">
              {promotions.coupons.map((_, index) => (
                <button
                  key={index}
                  className={`promo-dot ${index === activePromo ? 'active' : ''}`}
                  onClick={() => setActivePromo(index)}
                  aria-label={`View promo ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sale Products Section */}
      {saleProducts.length > 0 && (
        <div className="sale-products-section">
          <div className="section-header">
            <div className="title-wrapper">
              <div className="fire-icon">
                <FaFire />
              </div>
              <div className="title-content">
                <h2>Hot Deals & Sales</h2>
                <p className="subtitle">
                  Limited time offers - Save up to 70% on selected items!
                </p>
              </div>
            </div>
            <Link to="/sales" className="view-all-btn">
              View All Deals
              <FaArrowRight />
            </Link>
          </div>

          {loading ? (
            <div className="sales-loading">
              <div className="loading-spinner"></div>
              <p>Loading deals...</p>
            </div>
          ) : (
            <div className="sale-products-slider">
              <Swiper
                modules={[Navigation, Autoplay]}
                spaceBetween={16}
                slidesPerView={2}
                navigation
                autoplay={{
                  delay: 4000,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true
                }}
                breakpoints={{
                  480: { slidesPerView: 2, spaceBetween: 12 },
                  640: { slidesPerView: 3, spaceBetween: 16 },
                  768: { slidesPerView: 4, spaceBetween: 16 },
                  1024: { slidesPerView: 5, spaceBetween: 20 },
                  1280: { slidesPerView: 6, spaceBetween: 20 }
                }}
              >
                {saleProducts.map((product) => (
                  <SwiperSlide key={product._id}>
                    <div className="sale-product-card">
                      {product.discountPercentage > 0 && (
                        <div className="discount-badge">
                          <FaPercent />
                          <span>{product.discountPercentage}% OFF</span>
                        </div>
                      )}
                      <ProductItem item={product} />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default SalesSection;

