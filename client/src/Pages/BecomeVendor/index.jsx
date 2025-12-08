import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { fetchDataFromApi, postData } from '../../utils/api';

const BecomeVendor = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shopName: '',
    shopDescription: '',
    businessName: '',
    businessType: 'individual',
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    taxId: '',
    registrationNumber: ''
  });
  const [applicationStatus, setApplicationStatus] = useState(null);

  useEffect(() => {
    checkExistingApplication();
  }, []);

  const checkExistingApplication = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetchDataFromApi('/api/vendors/my-application');
      if (response.success && response.vendor) {
        setApplicationStatus(response.vendor.status);
        if (response.vendor.status === 'approved') {
          navigate('/vendor/complete-registration');
        }
      }
    } catch (error) {
      // No existing application
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('Please login to apply');
        navigate('/login');
        return;
      }

      const response = await postData('/api/vendors/apply', formData);
      
      if (response.success) {
        toast.success('Application submitted successfully! We will review it within 2-3 business days.');
        setApplicationStatus('pending');
        navigate('/vendor/application-status');
      } else {
        toast.error(response.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Application error:', error);
      toast.error(error.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (applicationStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Under Review</h2>
            <p className="text-gray-600">Your vendor application is currently being reviewed by our team.</p>
            <p className="text-gray-600 mt-2">You will receive an email notification once your application has been reviewed.</p>
          </div>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
            sx={{ backgroundColor: '#efb291', '&:hover': { backgroundColor: '#e5a67d' } }}
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (applicationStatus === 'approved') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Application Approved!</h2>
            <p className="text-gray-600">Your vendor application has been approved. Please complete your registration.</p>
          </div>
          <Button
            variant="contained"
            onClick={() => navigate('/vendor/complete-registration')}
            sx={{ backgroundColor: '#efb291', '&:hover': { backgroundColor: '#e5a67d' } }}
          >
            Complete Registration
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Become a Vendor</h1>
          <p className="text-gray-600 mb-8">Join thousands of sellers on Zuba House and start selling to millions of customers.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Shop Information */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Shop Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  required
                  fullWidth
                  label="Shop Name"
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleChange}
                  helperText="This will be your shop URL: zubahouse.com/vendor/your-shop-name"
                />
                
                <TextField
                  fullWidth
                  label="Business Name"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  required
                />
              </div>

              <TextField
                fullWidth
                label="Shop Description"
                name="shopDescription"
                value={formData.shopDescription}
                onChange={handleChange}
                multiline
                rows={4}
                className="mt-4"
                helperText="Tell customers about your shop (max 1000 characters)"
              />
            </div>

            {/* Business Information */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Business Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  required
                  fullWidth
                  select
                  label="Business Type"
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                >
                  <MenuItem value="individual">Individual</MenuItem>
                  <MenuItem value="business">Business</MenuItem>
                  <MenuItem value="company">Company</MenuItem>
                </TextField>

                <TextField
                  fullWidth
                  label="Tax ID / EIN"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleChange}
                />
              </div>

              <TextField
                fullWidth
                label="Registration Number"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                className="mt-4"
              />
            </div>

            {/* Contact Information */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Contact Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  required
                  fullWidth
                  type="email"
                  label="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />

                <TextField
                  required
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Address */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Business Address</h2>
              
              <TextField
                fullWidth
                label="Street Address"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                className="mb-4"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  fullWidth
                  label="City"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                />

                <TextField
                  fullWidth
                  label="State/Province"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <TextField
                  fullWidth
                  label="ZIP/Postal Code"
                  name="address.zipCode"
                  value={formData.address.zipCode}
                  onChange={handleChange}
                />

                <TextField
                  fullWidth
                  label="Country"
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <Button
                variant="outlined"
                onClick={() => navigate('/')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{ backgroundColor: '#efb291', '&:hover': { backgroundColor: '#e5a67d' } }}
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BecomeVendor;

