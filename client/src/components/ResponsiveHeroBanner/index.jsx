import React, { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation, Autoplay } from "swiper/modules";
import { Link } from "react-router-dom";
import { fetchDataFromApi } from "../../utils/api";

/**
 * Responsive Hero Banner Component
 * Displays different banners for mobile and desktop
 * Fetches banners from /api/banners/public endpoint
 */
const ResponsiveHeroBanner = () => {
  const [banners, setBanners] = useState({
    desktop: null,
    mobile: null
  });
  const [loading, setLoading] = useState(true);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    // Track window width for responsive display
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    
    // Fetch banners from API
    fetchBanners();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await fetchDataFromApi('/api/banners/public');
      
      if (response?.success && response?.banners) {
        setBanners({
          desktop: response.banners.desktop,
          mobile: response.banners.mobile
        });
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  // Determine which banner to show based on screen size
  const isMobile = windowWidth <= 768;
  
  // Hide completely on mobile (MobileHeroBanner handles mobile)
  if (isMobile) {
    return null;
  }
  
  const currentBanner = banners.desktop;

  // Fallback: use desktop banner if mobile banner doesn't exist
  const displayBanner = currentBanner;

  if (loading) {
    return (
      <div className="homeSlider pb-3 pt-3 lg:pb-5 lg:pt-5 relative z-[99]">
        <div className="container">
          <div className="item rounded-[10px] overflow-hidden bg-gray-200 animate-pulse" style={{ height: isMobile ? '250px' : '400px' }}></div>
        </div>
      </div>
    );
  }

  if (!displayBanner || !displayBanner.imageUrl) {
    // Fallback: show default banner or nothing
    return null;
  }

  // If banner has text overlay content, show it
  const hasContent = displayBanner.title || displayBanner.subtitle || displayBanner.ctaText;

  return (
    <div className="homeSlider pb-3 pt-3 lg:pb-5 lg:pt-5 relative z-[99]">
      <div className="container">
        <div className="item rounded-[10px] overflow-hidden relative">
          {/* Desktop Banner Only */}
          {banners.desktop && banners.desktop.imageUrl && (
            <div className="hidden md:block">
              <img
                src={banners.desktop.imageUrl}
                alt={banners.desktop.title || "Banner"}
                className="w-full h-[400px] object-cover"
              />
              {hasContent && (
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-start p-8 lg:p-12">
                  <div className="max-w-2xl text-white">
                    {banners.desktop.title && (
                      <h1 className="text-3xl lg:text-5xl font-bold mb-4 leading-tight">
                        {banners.desktop.title}
                      </h1>
                    )}
                    {banners.desktop.subtitle && (
                      <p className="text-lg lg:text-xl mb-6 leading-relaxed">
                        {banners.desktop.subtitle}
                      </p>
                    )}
                    {banners.desktop.ctaText && banners.desktop.ctaLink && (
                      <Link
                        to={banners.desktop.ctaLink}
                        className="inline-block bg-[#eeb190] hover:bg-[#d99a7a] text-white px-6 py-3 rounded-lg font-semibold text-base lg:text-lg transition-colors"
                      >
                        {banners.desktop.ctaText}
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ResponsiveHeroBanner;

