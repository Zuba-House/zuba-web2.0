import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { fetchDataFromApi, postData } from '../../utils/api';
import CircularProgress from '@mui/material/CircularProgress';
import { FaCheckCircle, FaEnvelope } from 'react-icons/fa';

const BecomeVendor = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [formData, setFormData] = useState({
    name: '', // For guest applications
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
    // Only check existing application if user is logged in
    const token = localStorage.getItem('accessToken');
    if (token) {
      checkExistingApplication();
    }
  }, []);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

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
      // No existing application - this is fine for guest users
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

    // Reset email verification when email changes
    if (name === 'email') {
      setEmailVerified(false);
      setOtpSent(false);
      setOtp('');
    }
  };

  const handleSendOTP = async () => {
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSendingOTP(true);
    try {
      const response = await postData('/api/vendors/send-otp', { email: formData.email });
      
      if (response.success) {
        toast.success('OTP sent to your email! Please check your inbox.');
        setOtpSent(true);
        setOtpCountdown(60); // 60 seconds countdown
      } else {
        toast.error(response.error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error(error.response?.data?.error || 'Failed to send OTP');
    } finally {
      setSendingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setVerifyingOTP(true);
    try {
      const response = await postData('/api/vendors/verify-otp', { 
        email: formData.email, 
        otp: otp 
      });
      
      if (response.success) {
        toast.success('Email verified successfully!');
        setEmailVerified(true);
        setOtp('');
      } else {
        toast.error(response.error || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error(error.response?.data?.error || 'Failed to verify OTP');
    } finally {
      setVerifyingOTP(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if email is verified
    if (!emailVerified) {
      toast.error('Please verify your email with OTP before submitting the application');
      return;
    }

    setLoading(true);

    try {
      // Application can be submitted without login (guest application)
      // If user is logged in, token will be sent automatically
      const response = await postData('/api/vendors/apply', formData);
      
      if (response.success) {
        toast.success('Application submitted successfully! We will review it within 2-3 business days.');
        setApplicationStatus('pending');
        // Show success message and option to create account
        if (!localStorage.getItem('accessToken')) {
          toast.success('You can create an account with the same email to track your application status.');
        }
      } else {
        toast.error(response.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Application error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to submit application';
      toast.error(errorMessage);
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
              <span className="text-3xl">⏳</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Application Pending</h1>
            <p className="text-gray-600">
              Your vendor application is currently under review. We will notify you via email once a decision has been made.
            </p>
          </div>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
            sx={{ backgroundColor: '#efb291', '&:hover': { backgroundColor: '#e5a67d' } }}
          >
            Return to Home
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
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Application Approved!</h1>
            <p className="text-gray-600">
              Congratulations! Your vendor application has been approved. Please complete your registration.
            </p>
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
            {/* Contact Information */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  required
                  fullWidth
                  label="Your Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
                <div className="md:col-span-2">
                  <TextField
                    required
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={emailVerified}
                    helperText={emailVerified ? "Email verified ✓" : "Please verify your email with OTP"}
                    InputProps={{
                      endAdornment: emailVerified ? (
                        <FaCheckCircle className="text-green-500 ml-2" />
                      ) : null
                    }}
                  />
                  
                  {!emailVerified && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      {!otpSent ? (
                        <div>
                          <p className="text-sm text-blue-800 mb-3">
                            Please verify your email address to continue with the application.
                          </p>
                          <Button
                            type="button"
                            variant="outlined"
                            onClick={handleSendOTP}
                            disabled={sendingOTP || !formData.email}
                            startIcon={<FaEnvelope />}
                            sx={{ borderColor: '#efb291', color: '#0b2735', '&:hover': { borderColor: '#e5a67d' } }}
                          >
                            {sendingOTP ? 'Sending...' : 'Send OTP'}
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-blue-800 mb-3">
                            OTP has been sent to your email. Please enter the 6-digit code below.
                          </p>
                          <div className="flex gap-3 items-start">
                            <TextField
                              fullWidth
                              label="Enter OTP"
                              value={otp}
                              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              placeholder="000000"
                              inputProps={{ maxLength: 6, style: { textAlign: 'center', fontSize: '20px', letterSpacing: '8px' } }}
                            />
                            <Button
                              type="button"
                              variant="contained"
                              onClick={handleVerifyOTP}
                              disabled={verifyingOTP || otp.length !== 6}
                              sx={{ backgroundColor: '#efb291', '&:hover': { backgroundColor: '#e5a67d' }, minWidth: '120px' }}
                            >
                              {verifyingOTP ? <CircularProgress size={20} /> : 'Verify'}
                            </Button>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <p className="text-xs text-gray-600">
                              Didn't receive OTP? 
                            </p>
                            <Button
                              type="button"
                              size="small"
                              onClick={handleSendOTP}
                              disabled={otpCountdown > 0 || sendingOTP}
                              sx={{ textTransform: 'none', color: '#efb291' }}
                            >
                              {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : 'Resend OTP'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
                <TextField
                  fullWidth
                  label="Registration Number"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Business Address */}
            <div className="pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Business Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  fullWidth
                  label="Street Address"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                />
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

            <Button
              type="submit"
              variant="contained"
              disabled={loading || !emailVerified}
              fullWidth
              size="large"
              sx={{ 
                backgroundColor: '#efb291', 
                '&:hover': { backgroundColor: '#e5a67d' }, 
                color: '#0b2735',
                py: 1.5,
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Submitting...' : emailVerified ? 'Submit Application' : 'Please Verify Email First'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BecomeVendor;
