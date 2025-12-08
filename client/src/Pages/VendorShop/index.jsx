import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchDataFromApi } from '../../utils/api';
import CircularProgress from '@mui/material/CircularProgress';
import { FaStar, FaCheckCircle, FaStore, FaEnvelope, FaPhone } from 'react-icons/fa';
import { formatCurrency } from '../../utils/currency';
import ProductItem from '../../components/ProductItem';

const VendorShopPage = () => {
  const { shopSlug } = useParams();
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadVendorData();
  }, [shopSlug]);

  const loadVendorData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load vendor profile
      const vendorResponse = await fetchDataFromApi(`/api/vendors/${shopSlug}`);
      if (vendorResponse.success) {
        setVendor(vendorResponse.vendor);
        
        // Load vendor products
        try {
          const productsResponse = await fetchDataFromApi(`/api/products?vendor=${shopSlug}`);
          if (productsResponse.success) {
            setProducts(productsResponse.products || []);
          }
        } catch (productError) {
          console.error('Error loading products:', productError);
          // Continue even if products fail to load
        }
      } else {
        setError(vendorResponse.error || 'Vendor not found');
      }
    } catch (error) {
      console.error('Error loading vendor:', error);
      setError(error.message || 'Failed to load vendor');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <CircularProgress />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Vendor Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The vendor you are looking for does not exist.'}</p>
          <Link
            to="/"
            className="px-4 py-2 bg-[#efb291] text-white rounded-lg hover:bg-[#e5a67d] inline-block"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Vendor Header */}
      <div className="bg-white border-b">
        {vendor.shopBanner && (
          <div className="h-48 md:h-64 bg-cover bg-center" style={{ backgroundImage: `url(${vendor.shopBanner})` }}>
            <div className="h-full bg-black/20"></div>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {vendor.shopLogo && (
              <img
                src={vendor.shopLogo}
                alt={vendor.shopName}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg object-cover"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{vendor.shopName}</h1>
                {vendor.isVerified && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1">
                    <FaCheckCircle /> Verified
                  </span>
                )}
              </div>
              {vendor.shopDescription && (
                <p className="text-gray-600 mb-3">{vendor.shopDescription}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {vendor.stats?.averageRating > 0 && (
                  <div className="flex items-center gap-1">
                    <FaStar className="text-yellow-500" />
                    <span className="font-medium">{vendor.stats.averageRating.toFixed(1)}</span>
                    <span>({vendor.stats.totalReviews || 0} reviews)</span>
                  </div>
                )}
                <div>
                  <FaStore className="inline mr-1" />
                  {vendor.stats?.totalProducts || 0} Products
                </div>
                {vendor.settings?.showEmail && vendor.email && (
                  <div>
                    <FaEnvelope className="inline mr-1" />
                    {vendor.email}
                  </div>
                )}
                {vendor.settings?.showPhone && vendor.phone && (
                  <div>
                    <FaPhone className="inline mr-1" />
                    {vendor.phone}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Products from {vendor.shopName}</h2>
          <p className="text-gray-600 mt-1">{products.length} product{products.length !== 1 ? 's' : ''} available</p>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FaStore className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Products Yet</h3>
            <p className="text-gray-600">This vendor hasn't added any products yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductItem key={product._id} item={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorShopPage;

