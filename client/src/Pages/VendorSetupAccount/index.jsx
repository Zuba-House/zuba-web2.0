import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { fetchDataFromApi, postData } from '../../utils/api';
import CircularProgress from '@mui/material/CircularProgress';
import { FaCheckCircle, FaLock, FaUser, FaEnvelope } from 'react-icons/fa';

const VendorSetupAccount = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [vendorInfo, setVendorInfo] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    verifyToken();
  }, []);

  const verifyToken = async () => {
    try {
      const token = searchParams.get('token');
      const email = searchParams.get('email');

      if (!token || !email) {
        toast.error('Invalid setup link. Please check your email.');
        navigate('/become-vendor');
        return;
      }

      const response = await fetchDataFromApi(`/api/vendors/verify-setup-token?token=${token}&email=${encodeURIComponent(email)}`);
      
      if (response.success) {
        setVendorInfo(response.vendor);
        setFormData(prev => ({
          ...prev,
          email: email
        }));
      } else {
        if (response.expired) {
          toast.error('This setup link has expired. Please contact support for a new link.');
        } else if (response.alreadyCreated) {
          toast.error('Account has already been created. Please login to access your dashboard.');
          navigate('/login');
        } else {
          toast.error(response.error || 'Invalid setup link');
        }
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      toast.error('Failed to verify setup link');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const token = searchParams.get('token');
      const response = await postData('/api/vendors/setup-account', {
        token,
        email: formData.email,
        password: formData.password,
        name: formData.name
      });

      if (response.success) {
        // Store tokens
        if (response.data?.accesstoken) {
          localStorage.setItem('accessToken', response.data.accesstoken);
          if (response.data.refreshToken) {
            localStorage.setItem('refreshToken', response.data.refreshToken);
          }
        }

        toast.success('Account created successfully! Welcome to Zuba House!');
        
        // Redirect to vendor dashboard
        setTimeout(() => {
          navigate('/vendor/dashboard');
        }, 1500);
      } else {
        toast.error(response.error || 'Failed to create account');
      }
    } catch (error) {
      console.error('Error creating account:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create account';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <CircularProgress />
      </div>
    );
  }

  if (!vendorInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Invalid Setup Link</h2>
          <p className="text-gray-600 mb-4">This setup link is invalid or has expired.</p>
          <Button
            variant="contained"
            onClick={() => navigate('/become-vendor')}
            sx={{ backgroundColor: '#efb291', '&:hover': { backgroundColor: '#e5a67d' } }}
          >
            Go to Application Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheckCircle className="text-4xl text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🎉 Congratulations!</h1>
            <p className="text-gray-600 text-lg">Your vendor application has been approved</p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Shop Name:</strong> {vendorInfo.shopName}
              </p>
            </div>
          </div>

          {/* Setup Form */}
          <div className="border-t pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Account</h2>
            <p className="text-gray-600 mb-6">
              Set up your password to access your vendor dashboard and start selling!
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <TextField
                fullWidth
                required
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                InputProps={{
                  startAdornment: <FaUser className="mr-2 text-gray-400" />
                }}
              />

              <TextField
                fullWidth
                required
                type="email"
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email || 'This email will be used for your account'}
                disabled
                InputProps={{
                  startAdornment: <FaEnvelope className="mr-2 text-gray-400" />
                }}
              />

              <TextField
                fullWidth
                required
                type="password"
                label="Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password || 'Must be at least 8 characters'}
                InputProps={{
                  startAdornment: <FaLock className="mr-2 text-gray-400" />
                }}
              />

              <TextField
                fullWidth
                required
                type="password"
                label="Confirm Password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                InputProps={{
                  startAdornment: <FaLock className="mr-2 text-gray-400" />
                }}
              />

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>🔒 Security Note:</strong> Choose a strong password that you haven't used elsewhere. 
                  This will be your login credential for accessing your vendor dashboard.
                </p>
              </div>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={submitting}
                sx={{
                  backgroundColor: '#efb291',
                  '&:hover': { backgroundColor: '#e5a67d' },
                  py: 1.5,
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                {submitting ? 'Creating Account...' : '🚀 Create Account & Access Dashboard'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-[#efb291] hover:text-[#e5a67d] font-medium"
                >
                  Login here
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorSetupAccount;

