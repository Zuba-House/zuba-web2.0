import React, { useState, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { FaArrowRight } from 'react-icons/fa';
import { fetchDataFromApi } from '../../utils/api';
import ProductItem from '../ProductItem';
import './SalesSection.css';

import 'swiper/css';
import 'swiper/css/navigation';

const SalesSection = memo(() => {
  const [saleProducts, setSaleProducts] = useState([]);
  const [promotions, setPromotions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both sale products and active promotions in parallel
        const [salesRes, promotionsRes] = await Promise.all([
          fetchDataFromApi('/api/product/getSaleProducts?limit=12'),
          fetchDataFromApi('/api/product/getActivePromotions')
        ]);
        
        if (salesRes?.success && salesRes?.products) {
          setSaleProducts(salesRes.products);
        }
        
        if (promotionsRes?.success) {
          setPromotions(promotionsRes);
        }
      } catch (error) {
        console.error('Error fetching sales data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Don't render if no sales
  if (!loading && saleProducts.length === 0) {
    return null;
  }

  if (loading) {
    return null; // Don't show loading spinner, just wait
  }

  const saleCount = saleProducts.length;
  const promoCount = promotions?.promotions?.length || 0;

  return (
    <section className="sales-section">
      <div className="sale-products-section">
        <div className="section-header">
          <div className="title-wrapper">
            <h2>🔥 Hot Deals & Promotions</h2>
            <p className="subtitle">
              Save big on authentic African fashion - Up to 70% off!
            </p>
            {(saleCount > 0 || promoCount > 0) && (
              <div className="sale-stats">
                <span>{saleCount} Items on Sale</span>
                {promoCount > 0 && <span>{promoCount} Active Promo Code{promoCount !== 1 ? 's' : ''}</span>}
              </div>
            )}
          </div>
          <Link to="/sales" className="view-all-btn">
            View All <FaArrowRight />
          </Link>
        </div>

        {saleProducts.length > 0 && (
          <div className="sale-products-slider">
            <Swiper
              modules={[Navigation]}
              spaceBetween={12}
              slidesPerView={2}
              navigation
              breakpoints={{
                480: { slidesPerView: 2, spaceBetween: 12 },
                640: { slidesPerView: 3, spaceBetween: 12 },
                768: { slidesPerView: 4, spaceBetween: 14 },
                1024: { slidesPerView: 5, spaceBetween: 16 },
                1280: { slidesPerView: 6, spaceBetween: 16 }
              }}
            >
              {saleProducts.map((product) => (
                <SwiperSlide key={product._id}>
                  <ProductItem item={product} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}

        {promotions?.promotions && promotions.promotions.length > 0 && (
          <div className="active-promo-codes">
            <h3>🎟️ Active Promo Codes</h3>
            <div className="promo-codes-grid">
              {promotions.promotions.slice(0, 3).map((promo) => (
                <div key={promo.code} className="promo-code-card">
                  <div className="promo-discount">
                    {promo.discountType === 'percentage' 
                      ? `${promo.discountAmount}% OFF`
                      : `$${promo.discountAmount} OFF`
                    }
                  </div>
                  <div className="promo-code-box">
                    <span className="promo-code">{promo.code}</span>
                    <button 
                      className="copy-btn"
                      onClick={() => {
                        navigator.clipboard.writeText(promo.code);
                        alert(`Promo code ${promo.code} copied to clipboard!`);
                      }}
                    >
                      Copy
                    </button>
                  </div>
                  {promo.description && (
                    <p className="promo-description">{promo.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
});

export default SalesSection;
