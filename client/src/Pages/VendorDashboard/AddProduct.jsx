import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { fetchDataFromApi, postData } from '../../utils/api';
import VendorLayout from '../../components/VendorLayout';
import CircularProgress from '@mui/material/CircularProgress';
import { FaBox, FaImage, FaDollarSign, FaWarehouse, FaSave, FaTimes } from 'react-icons/fa';
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;

const AddProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    category: '',
    sku: '',
    pricing: {
      regularPrice: 0,
      salePrice: null,
      currency: 'USD'
    },
    inventory: {
      stock: 0,
      stockStatus: 'in_stock',
      manageStock: true
    },
    status: 'draft',
    images: []
  });
  const [errors, setErrors] = useState({});
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetchDataFromApi('/api/category');
      if (response?.error === false && response?.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('pricing.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        pricing: {
          ...prev.pricing,
          [field]: field === 'regularPrice' || field === 'salePrice' ? parseFloat(value) || 0 : value
        }
      }));
    } else if (name.startsWith('inventory.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        inventory: {
          ...prev.inventory,
          [field]: field === 'stock' ? parseInt(value) || 0 : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (imagePreviews.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setUploadingImages(true);
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${apiUrl}/api/product/uploadImages`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            // Don't set Content-Type - axios will set it with boundary
          }
        }
      );

      if (response.data?.error === false && response.data?.images) {
        const uploadedUrls = response.data.images.map(img => 
          typeof img === 'string' ? img : img.url || img
        );
        
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls]
        }));
        
        setImagePreviews(prev => [...prev, ...uploadedUrls]);
        toast.success('Images uploaded successfully');
      } else {
        toast.error('Failed to upload images');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Product description is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.pricing.regularPrice || formData.pricing.regularPrice <= 0) {
      newErrors.regularPrice = 'Regular price must be greater than 0';
    }
    
    if (formData.images.length === 0) {
      newErrors.images = 'At least one product image is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setLoading(true);
    try {
      // Prepare product data
      const productData = {
        name: formData.name,
        description: formData.description,
        shortDescription: formData.shortDescription || '',
        category: formData.category,
        categories: [formData.category],
        sku: formData.sku || '',
        images: formData.images,
        featuredImage: formData.images[0] || '',
        oldPrice: formData.pricing.regularPrice,
        price: formData.pricing.salePrice && formData.pricing.salePrice < formData.pricing.regularPrice
          ? formData.pricing.salePrice
          : formData.pricing.regularPrice,
        discount: formData.pricing.salePrice && formData.pricing.salePrice < formData.pricing.regularPrice
          ? Math.round(((formData.pricing.regularPrice - formData.pricing.salePrice) / formData.pricing.regularPrice) * 100)
          : 0,
        countInStock: formData.inventory.stock,
        status: formData.status,
        pricing: formData.pricing,
        inventory: formData.inventory
      };

      const response = await postData('/api/product/create', productData);
      
      if (response?.error === false) {
        toast.success('Product created successfully!');
        setTimeout(() => {
          navigate('/vendor/products');
        }, 1500);
      } else {
        toast.error(response?.message || 'Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <VendorLayout>
      <div className="min-h-screen" style={{ backgroundColor: '#0b2735', padding: '20px' }}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold mb-2" style={{ color: '#e5e2db' }}>
                  <FaBox className="inline mr-3" style={{ color: '#efb291' }} />
                  Add New Product
                </h1>
                <p style={{ color: '#e5e2db', opacity: 0.7 }}>
                  Create a new product for your store
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/vendor/products')}
                  className="px-6 py-3 rounded-lg font-semibold transition-all"
                  style={{ backgroundColor: '#1a3d52', color: '#e5e2db', border: '1px solid #efb291' }}
                >
                  <FaTimes className="inline mr-2" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || uploadingImages}
                  className="px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
                  style={{ backgroundColor: '#efb291', color: '#0b2735' }}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={20} style={{ color: '#0b2735' }} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave className="inline" />
                      Save Product
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Basic Information */}
                <div
                  className="p-6 rounded-xl"
                  style={{ backgroundColor: '#1a3d52', border: '1px solid rgba(239, 178, 145, 0.2)' }}
                >
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: '#e5e2db' }}>
                    <FaBox style={{ color: '#efb291' }} />
                    Basic Information
                  </h2>

                  {/* Product Name */}
                  <div className="mb-4">
                    <label className="block mb-2 font-semibold" style={{ color: '#e5e2db' }}>
                      Product Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter product name"
                      className="w-full px-4 py-3 rounded-lg outline-none"
                      style={{ backgroundColor: '#0b2735', color: '#e5e2db', border: '1px solid rgba(239, 178, 145, 0.2)' }}
                      required
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Short Description */}
                  <div className="mb-4">
                    <label className="block mb-2 font-semibold" style={{ color: '#e5e2db' }}>
                      Short Description
                    </label>
                    <textarea
                      name="shortDescription"
                      value={formData.shortDescription}
                      onChange={handleChange}
                      placeholder="Brief product summary"
                      rows="3"
                      className="w-full px-4 py-3 rounded-lg outline-none"
                      style={{ backgroundColor: '#0b2735', color: '#e5e2db', border: '1px solid rgba(239, 178, 145, 0.2)' }}
                    />
                  </div>

                  {/* Product Description */}
                  <div className="mb-4">
                    <label className="block mb-2 font-semibold" style={{ color: '#e5e2db' }}>
                      Product Description <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Enter detailed product description"
                      rows="6"
                      className="w-full px-4 py-3 rounded-lg outline-none"
                      style={{ backgroundColor: '#0b2735', color: '#e5e2db', border: '1px solid rgba(239, 178, 145, 0.2)' }}
                      required
                    />
                    {errors.description && (
                      <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                    )}
                  </div>

                  {/* Category */}
                  <div className="mb-4">
                    <label className="block mb-2 font-semibold" style={{ color: '#e5e2db' }}>
                      Category <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg outline-none"
                      style={{ backgroundColor: '#0b2735', color: '#e5e2db', border: '1px solid rgba(239, 178, 145, 0.2)' }}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-red-500 text-sm mt-1">{errors.category}</p>
                    )}
                  </div>

                  {/* SKU */}
                  <div className="mb-4">
                    <label className="block mb-2 font-semibold" style={{ color: '#e5e2db' }}>
                      SKU (Stock Keeping Unit)
                    </label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleChange}
                      placeholder="e.g., PROD-001"
                      className="w-full px-4 py-3 rounded-lg outline-none"
                      style={{ backgroundColor: '#0b2735', color: '#e5e2db', border: '1px solid rgba(239, 178, 145, 0.2)' }}
                    />
                  </div>
                </div>

                {/* Pricing */}
                <div
                  className="p-6 rounded-xl"
                  style={{ backgroundColor: '#1a3d52', border: '1px solid rgba(239, 178, 145, 0.2)' }}
                >
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: '#e5e2db' }}>
                    <FaDollarSign style={{ color: '#efb291' }} />
                    Pricing
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 font-semibold" style={{ color: '#e5e2db' }}>
                        Regular Price <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="number"
                        name="pricing.regularPrice"
                        value={formData.pricing.regularPrice}
                        onChange={handleChange}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 rounded-lg outline-none"
                        style={{ backgroundColor: '#0b2735', color: '#e5e2db', border: '1px solid rgba(239, 178, 145, 0.2)' }}
                        required
                      />
                      {errors.regularPrice && (
                        <p className="text-red-500 text-sm mt-1">{errors.regularPrice}</p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-2 font-semibold" style={{ color: '#e5e2db' }}>
                        Sale Price (Optional)
                      </label>
                      <input
                        type="number"
                        name="pricing.salePrice"
                        value={formData.pricing.salePrice || ''}
                        onChange={handleChange}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 rounded-lg outline-none"
                        style={{ backgroundColor: '#0b2735', color: '#e5e2db', border: '1px solid rgba(239, 178, 145, 0.2)' }}
                      />
                      {formData.pricing.salePrice && formData.pricing.salePrice < formData.pricing.regularPrice && (
                        <p className="text-green-500 text-sm mt-1">
                          Discount: {Math.round(((formData.pricing.regularPrice - formData.pricing.salePrice) / formData.pricing.regularPrice) * 100)}%
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Inventory */}
                <div
                  className="p-6 rounded-xl"
                  style={{ backgroundColor: '#1a3d52', border: '1px solid rgba(239, 178, 145, 0.2)' }}
                >
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: '#e5e2db' }}>
                    <FaWarehouse style={{ color: '#efb291' }} />
                    Inventory
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 font-semibold" style={{ color: '#e5e2db' }}>
                        Stock Quantity
                      </label>
                      <input
                        type="number"
                        name="inventory.stock"
                        value={formData.inventory.stock}
                        onChange={handleChange}
                        placeholder="0"
                        min="0"
                        className="w-full px-4 py-3 rounded-lg outline-none"
                        style={{ backgroundColor: '#0b2735', color: '#e5e2db', border: '1px solid rgba(239, 178, 145, 0.2)' }}
                      />
                    </div>

                    <div>
                      <label className="block mb-2 font-semibold" style={{ color: '#e5e2db' }}>
                        Stock Status
                      </label>
                      <select
                        name="inventory.stockStatus"
                        value={formData.inventory.stockStatus}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg outline-none"
                        style={{ backgroundColor: '#0b2735', color: '#e5e2db', border: '1px solid rgba(239, 178, 145, 0.2)' }}
                      >
                        <option value="in_stock">In Stock</option>
                        <option value="out_of_stock">Out of Stock</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Product Images */}
                <div
                  className="p-6 rounded-xl"
                  style={{ backgroundColor: '#1a3d52', border: '1px solid rgba(239, 178, 145, 0.2)' }}
                >
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: '#e5e2db' }}>
                    <FaImage style={{ color: '#efb291' }} />
                    Product Images <span style={{ color: '#ef4444' }}>*</span>
                  </h2>

                  <div className="mb-4">
                    <input
                      type="file"
                      id="image-upload"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImages}
                    />
                    <label
                      htmlFor="image-upload"
                      className="inline-block px-6 py-3 rounded-lg font-semibold cursor-pointer transition-all hover:scale-105 disabled:opacity-50"
                      style={{ backgroundColor: '#efb291', color: '#0b2735' }}
                    >
                      {uploadingImages ? 'Uploading...' : 'Upload Images (Max 5)'}
                    </label>
                    {errors.images && (
                      <p className="text-red-500 text-sm mt-1">{errors.images}</p>
                    )}
                  </div>

                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {imagePreviews.map((url, index) => (
                        <div key={index} className="relative">
                          <img
                            src={url}
                            alt={`Product ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                            style={{ border: '1px solid rgba(239, 178, 145, 0.2)' }}
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-6">
                {/* Status */}
                <div
                  className="p-6 rounded-xl"
                  style={{ backgroundColor: '#1a3d52', border: '1px solid rgba(239, 178, 145, 0.2)' }}
                >
                  <h2 className="text-xl font-bold mb-4" style={{ color: '#e5e2db' }}>Status</h2>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg outline-none"
                    style={{ backgroundColor: '#0b2735', color: '#e5e2db', border: '1px solid rgba(239, 178, 145, 0.2)' }}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="pending">Pending Review</option>
                  </select>
                  <p className="text-sm mt-2" style={{ color: '#e5e2db', opacity: 0.6 }}>
                    Draft: Save without publishing
                    <br />
                    Published: Make product visible to customers
                    <br />
                    Pending: Submit for admin review
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </VendorLayout>
  );
};

export default AddProduct;

