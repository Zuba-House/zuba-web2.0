import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    storeName: '',
    storeSlug: '',
    description: '',
    phone: '',
    whatsapp: '',
    country: '',
    city: '',
    addressLine1: '',
    addressLine2: '',
    postalCode: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-generate store slug from store name
    if (name === 'storeName') {
      const slug = value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData(prev => ({
        ...prev,
        storeSlug: slug
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!formData.storeName || !formData.storeSlug || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'https://zuba-api.onrender.com'}/api/vendor/apply`,
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          storeName: formData.storeName,
          storeSlug: formData.storeSlug,
          description: formData.description,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          country: formData.country,
          city: formData.city,
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          postalCode: formData.postalCode
        }
      );

      if (response.data?.error === false) {
        toast.success('Vendor application submitted successfully! We will review your application and get back to you.');
        navigate('/login');
      } else {
        toast.error(response.data?.message || 'Registration failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl w-full">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Become a Vendor</h1>
      <p className="text-gray-600 mb-6">Fill out the form below to apply as a vendor on Zuba House.</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Personal Information */}
        <div className="border-b pb-4">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-gray-700 font-medium">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#efb291]"
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-gray-700 font-medium">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#efb291]"
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-gray-700 font-medium">Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#efb291]"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block mb-2 text-gray-700 font-medium">Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#efb291]"
                required
              />
            </div>
          </div>
        </div>

        {/* Store Information */}
        <div className="border-b pb-4">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Store Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-gray-700 font-medium">Store Name *</label>
              <input
                type="text"
                name="storeName"
                value={formData.storeName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#efb291]"
                required
              />
            </div>
            <div>
              <label className="block mb-2 text-gray-700 font-medium">Store URL Slug *</label>
              <input
                type="text"
                name="storeSlug"
                value={formData.storeSlug}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#efb291]"
                required
                pattern="[a-z0-9-]+"
                title="Only lowercase letters, numbers, and hyphens"
              />
              <p className="text-xs text-gray-500 mt-1">e.g., my-store-name</p>
            </div>
            <div className="md:col-span-2">
              <label className="block mb-2 text-gray-700 font-medium">Store Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#efb291]"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="border-b pb-4">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-gray-700 font-medium">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#efb291]"
              />
            </div>
            <div>
              <label className="block mb-2 text-gray-700 font-medium">WhatsApp</label>
              <input
                type="tel"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#efb291]"
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Address Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-gray-700 font-medium">Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#efb291]"
              />
            </div>
            <div>
              <label className="block mb-2 text-gray-700 font-medium">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#efb291]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block mb-2 text-gray-700 font-medium">Address Line 1</label>
              <input
                type="text"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#efb291]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block mb-2 text-gray-700 font-medium">Address Line 2</label>
              <input
                type="text"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#efb291]"
              />
            </div>
            <div>
              <label className="block mb-2 text-gray-700 font-medium">Postal Code</label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#efb291]"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#efb291] text-white py-3 rounded-lg hover:bg-[#e5a67d] disabled:opacity-50 font-medium transition-colors mt-6"
        >
          {loading ? 'Submitting Application...' : 'Submit Application'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">Already have a vendor account?</p>
        <Link
          to="/login"
          className="text-[#efb291] hover:text-[#e5a67d] font-medium transition-colors"
        >
          Login →
        </Link>
      </div>
    </div>
  );
};

export default Register;

