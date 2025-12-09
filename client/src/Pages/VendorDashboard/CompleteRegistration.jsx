import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { fetchDataFromApi, postData } from '../../utils/api';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { FaUpload, FaImage } from 'react-icons/fa';

const CompleteRegistration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    shopLogo: '',
    shopBanner: '',
    bankAccount: {
      bankName: '',
      accountNumber: '',
      accountHolderName: '',
      routingNumber: ''
    }
  });

  useEffect(() => {
    checkVendorStatus();
  }, []);

  const checkVendorStatus = async () => {
    try {
      const response = await fetchDataFromApi('/api/vendors/my-application');
      if (response.success && response.vendor) {
        if (response.vendor.status !== 'approved') {
          navigate('/vendor/dashboard');
          return;
        }
        // Pre-fill form if vendor has existing data
        if (response.vendor.shopLogo) {
          setFormData(prev => ({ ...prev, shopLogo: response.vendor.shopLogo }));
        }
        if (response.vendor.shopBanner) {
          setFormData(prev => ({ ...prev, shopBanner: response.vendor.shopBanner }));
        }
        if (response.vendor.bankAccount) {
          setFormData(prev => ({ ...prev, bankAccount: { ...prev.bankAccount, ...response.vendor.bankAccount } }));
        }
      } else {
        navigate('/become-vendor');
      }
    } catch (error) {
      console.error('Error checking vendor status:', error);
      navigate('/become-vendor');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('bankAccount.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        bankAccount: {
          ...prev.bankAccount,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image size must be less than 5MB');
      return;
    }

    // In a real app, you'd upload to cloud storage (S3, Cloudinary, etc.)
    // For now, we'll use a base64 data URL (not recommended for production)
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        [type]: reader.result
      }));
      toast.success('Image uploaded successfully');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await postData('/api/vendors/complete-registration', formData);
      
      if (response.success) {
        toast.success('Registration completed successfully!');
        setTimeout(() => {
          navigate('/vendor/dashboard');
        }, 1500);
      } else {
        toast.error(response.error || 'Failed to complete registration');
      }
    } catch (error) {
      console.error('Error completing registration:', error);
      toast.error(error.response?.data?.error || 'Failed to complete registration');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Complete Your Vendor Registration</h1>
          <p className="text-gray-600 mb-8">
            Add your shop logo, banner, and bank account details to complete your vendor profile.
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Shop Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shop Logo
              </label>
              <div className="flex items-center space-x-4">
                {formData.shopLogo && (
                  <img 
                    src={formData.shopLogo} 
                    alt="Shop Logo" 
                    className="w-24 h-24 object-cover rounded-lg border"
                  />
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'shopLogo')}
                    className="hidden"
                    id="shopLogo"
                  />
                  <label
                    htmlFor="shopLogo"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    <FaUpload className="mr-2" />
                    {formData.shopLogo ? 'Change Logo' : 'Upload Logo'}
                  </label>
                </div>
              </div>
            </div>

            {/* Shop Banner */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shop Banner
              </label>
              <div className="flex items-center space-x-4">
                {formData.shopBanner && (
                  <img 
                    src={formData.shopBanner} 
                    alt="Shop Banner" 
                    className="w-48 h-24 object-cover rounded-lg border"
                  />
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'shopBanner')}
                    className="hidden"
                    id="shopBanner"
                  />
                  <label
                    htmlFor="shopBanner"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    <FaImage className="mr-2" />
                    {formData.shopBanner ? 'Change Banner' : 'Upload Banner'}
                  </label>
                </div>
              </div>
            </div>

            {/* Bank Account Information */}
            <div className="border-t pt-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Bank Account Information</h2>
              <p className="text-sm text-gray-600 mb-6">
                Add your bank account details to receive payments. This information is encrypted and secure.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextField
                  label="Bank Name"
                  name="bankAccount.bankName"
                  value={formData.bankAccount.bankName}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                />
                <TextField
                  label="Account Holder Name"
                  name="bankAccount.accountHolderName"
                  value={formData.bankAccount.accountHolderName}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                />
                <TextField
                  label="Account Number"
                  name="bankAccount.accountNumber"
                  value={formData.bankAccount.accountNumber}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  type="password"
                />
                <TextField
                  label="Routing Number"
                  name="bankAccount.routingNumber"
                  value={formData.bankAccount.routingNumber}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate('/vendor/dashboard')}
                disabled={submitting}
              >
                Skip for Now
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
                sx={{ backgroundColor: '#efb291', '&:hover': { backgroundColor: '#e5a67d' } }}
              >
                {submitting ? <CircularProgress size={24} /> : 'Complete Registration'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteRegistration;

