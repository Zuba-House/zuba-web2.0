import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const Register = () => {
  const [step, setStep] = useState(1); // 1: Email verification (MANDATORY), 2: Registration form
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
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

  // Step 1: Send OTP to email
  const handleSendOTP = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setOtpLoading(true);
    try {
      // First check if email already has vendor account
      const checkResponse = await axios.get(
        `${import.meta.env.VITE_API_URL || 'https://zuba-api.onrender.com'}/api/vendor/application-status/${email}`
      );

      if (checkResponse.data?.data?.hasApplication) {
        toast.error('This email already has a vendor application');
        setOtpLoading(false);
        return;
      }

      // Send OTP for verification
      const otpResponse = await axios.post(
        `${import.meta.env.VITE_API_URL || 'https://zuba-api.onrender.com'}/api/vendor/resend-otp`,
        { email }
      );

      if (otpResponse.data?.error === false) {
        toast.success(otpResponse.data?.message || 'OTP code sent to your email. Please check your inbox (and spam folder).');
        setFormData(prev => ({ ...prev, email }));
      } else {
        // If user doesn't exist yet, that's okay - OTP will be sent during registration
        if (otpResponse.data?.message?.includes('complete registration first')) {
          setFormData(prev => ({ ...prev, email }));
          toast.info('Please continue with registration. OTP will be sent after registration.');
        } else {
          toast.error(otpResponse.data?.message || 'Failed to send OTP. Please try again or continue with registration.');
          setFormData(prev => ({ ...prev, email }));
        }
      }
    } catch (error) {
      // Handle error response
      if (error.response?.data?.error === true) {
        toast.error(error.response.data?.message || 'Failed to send OTP email. Please check your email configuration or try again later.');
      } else if (error.response?.status === 500) {
        toast.error('Email service error. Please try again later or contact support.');
      } else {
        // If no application exists, proceed to step 2
        setFormData(prev => ({ ...prev, email }));
        toast.info('Please continue with registration. OTP will be sent after registration.');
      }
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setOtpLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'https://zuba-api.onrender.com'}/api/vendor/verify-email`,
        { email, otp }
      );

      if (response.data?.error === false) {
        setEmailVerified(true);
        setFormData(prev => ({ ...prev, email: email.toLowerCase().trim() }));
        toast.success('Email verified successfully! You can now complete your registration.');
        // Automatically proceed to registration form after verification
        setTimeout(() => {
          setStep(2);
        }, 1000);
      } else {
        toast.error(response.data?.message || 'Invalid OTP');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to verify OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setOtpLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'https://zuba-api.onrender.com'}/api/vendor/resend-otp`,
        { email }
      );

      if (response.data?.error === false) {
        toast.success('OTP code sent to your email');
        setOtp('');
      } else {
        toast.error(response.data?.message || 'Failed to resend OTP');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setOtpLoading(false);
    }
  };

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
    
    // MANDATORY: Email must be verified before registration
    if (!emailVerified || !email) {
      toast.error('Please verify your email address first');
      setStep(1);
      return;
    }

    // Ensure email is set in formData
    if (!formData.email || formData.email !== email.toLowerCase().trim()) {
      setFormData(prev => ({ ...prev, email: email.toLowerCase().trim() }));
    }
    
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
        if (response.data.data?.requiresEmailVerification) {
          // Show OTP verification step
          setStep(1);
          setEmail(formData.email);
          toast.success('Please verify your email. Check your inbox for the OTP code.');
        } else {
          toast.success('Vendor application submitted successfully! We will review your application and get back to you.');
          navigate('/login');
        }
      } else {
        toast.error(response.data?.message || 'Registration failed');
      }
    } catch (error) {
      if (error.response?.data?.data?.requiresEmailVerification) {
        setStep(1);
        setEmail(formData.email);
        toast.success('Please verify your email. Check your inbox for the OTP code.');
      } else {
        toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Email Verification
  if (step === 1) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Verify Your Email</h1>
        <p className="text-gray-600 mb-6">Enter your email address to receive a verification code.</p>
        
        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-gray-700 font-medium">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#efb291]"
              placeholder="your@email.com"
              required
              disabled={emailVerified}
            />
          </div>

              {email && !emailVerified && (
                <div>
                  <label className="block mb-2 text-gray-700 font-medium">Enter OTP Code *</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#efb291] text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter the 6-digit code sent to your email</p>
                </div>
              )}

              <div className="flex gap-2">
                {email && emailVerified ? (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, email: email.toLowerCase().trim() }));
                      setStep(2);
                    }}
                    className="flex-1 bg-[#efb291] text-white py-2 rounded-lg hover:bg-[#e5a67d] font-medium transition-colors"
                  >
                    Continue with Registration →
                  </button>
                ) : email && otp.length === 6 ? (
                  <button
                    type="button"
                    onClick={handleVerifyOTP}
                    disabled={otpLoading}
                    className="flex-1 bg-[#efb291] text-white py-2 rounded-lg hover:bg-[#e5a67d] disabled:opacity-50 font-medium transition-colors"
                  >
                    {otpLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={otpLoading || !email}
                    className="flex-1 bg-[#efb291] text-white py-2 rounded-lg hover:bg-[#e5a67d] disabled:opacity-50 font-medium transition-colors"
                  >
                    {otpLoading ? 'Sending...' : 'Send OTP'}
                  </button>
                )}
              </div>

              {email && !emailVerified && (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={otpLoading}
                  className="w-full text-sm text-gray-600 hover:text-[#efb291] disabled:opacity-50 transition-colors"
                >
                  Resend OTP Code
                </button>
              )}

              {emailVerified && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                  <div className="flex items-center text-green-800">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-medium">Email verified!</span>
                  </div>
                </div>
              )}
        </div>

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
  }

  // Step 2: Registration Form
  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Become a Vendor</h1>
          <p className="text-gray-600 mt-1">Fill out the form below to apply as a vendor on Zuba House.</p>
        </div>
        {emailVerified && (
          <div className="flex items-center text-green-600">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">Email Verified</span>
          </div>
        )}
      </div>
      
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
                value={formData.email || email || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#efb291] bg-gray-50"
                required
                disabled={true}
                readOnly
              />
              {emailVerified && email && (
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Email verified
                </p>
              )}
              {!emailVerified && (
                <p className="text-xs text-red-600 mt-1">
                  ⚠️ Please verify your email in step 1 before proceeding
                </p>
              )}
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
                pattern="[a-z0-9\-]+"
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

