import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { fetchDataFromApi } from '../../utils/api';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const VendorVerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    verifyEmail();
  }, []);

  const verifyEmail = async () => {
    try {
      const token = searchParams.get('token');
      const email = searchParams.get('email');

      if (!token || !email) {
        setError('Invalid verification link. Missing token or email.');
        setLoading(false);
        return;
      }

      const response = await fetchDataFromApi(`/api/vendors/verify-email?token=${token}&email=${encodeURIComponent(email)}`);
      
      if (response.success) {
        setVerified(true);
        toast.success('Email verified successfully!');
        setTimeout(() => {
          navigate('/become-vendor');
        }, 3000);
      } else {
        setError(response.error || 'Failed to verify email');
        toast.error(response.error || 'Failed to verify email');
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      setError('An error occurred while verifying your email');
      toast.error('An error occurred while verifying your email');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <CircularProgress size={60} />
          <p className="mt-4 text-gray-600">Verifying your email...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {verified ? (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheckCircle className="text-5xl text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Verified!</h1>
              <p className="text-gray-600 mb-6">
                Your email has been successfully verified. Your vendor application is now complete and will be reviewed by our team.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                You will receive an email notification once your application has been reviewed (usually within 2-3 business days).
              </p>
              <Button
                variant="contained"
                onClick={() => navigate('/become-vendor')}
                sx={{ backgroundColor: '#efb291', '&:hover': { backgroundColor: '#e5a67d' } }}
              >
                Return to Application Page
              </Button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTimesCircle className="text-5xl text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Verification Failed</h1>
              <p className="text-gray-600 mb-6">
                {error || 'The verification link is invalid or has expired.'}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                If you believe this is an error, please contact support or try applying again.
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  variant="outlined"
                  onClick={() => navigate('/become-vendor')}
                >
                  Return to Application
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/contact')}
                  sx={{ backgroundColor: '#efb291', '&:hover': { backgroundColor: '#e5a67d' } }}
                >
                  Contact Support
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorVerifyEmail;

