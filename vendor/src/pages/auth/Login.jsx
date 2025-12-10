import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import jwt_decode from 'jwt-decode';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'https://zuba-api.onrender.com'}/api/user/login`,
        { email, password }
      );

      if (response.data?.error === false && response.data?.data?.accesstoken) {
        const token = response.data.data.accesstoken;
        const refreshToken = response.data.data.refreshToken;
        
        // Decode token to get user role and vendorId
        try {
          const decoded = jwt_decode(token);
          const userRole = decoded.role || 'USER';
          const vendorId = decoded.vendorId || null;
          
          localStorage.setItem('accessToken', token);
          localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('userRole', userRole);
          if (vendorId) {
            localStorage.setItem('vendorId', vendorId);
          }
          
          if (userRole === 'VENDOR') {
            toast.success('Login successful!');
            navigate('/dashboard');
          } else {
            toast.error('Vendor access only. Please use vendor login.');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userRole');
          }
        } catch (decodeError) {
          console.error('Token decode error:', decodeError);
          toast.error('Login failed. Please try again.');
        }
      } else {
        toast.error(response.data?.message || 'Login failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Vendor Login</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2 text-gray-700 font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#efb291]"
            placeholder="Enter your email"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 text-gray-700 font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#efb291]"
            placeholder="Enter your password"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#efb291] text-white py-2 rounded-lg hover:bg-[#e5a67d] disabled:opacity-50 font-medium transition-colors"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-gray-600 mb-2">Don't have a vendor account?</p>
        <Link
          to="/register"
          className="text-[#efb291] hover:text-[#e5a67d] font-medium transition-colors"
        >
          Register as Vendor →
        </Link>
      </div>
      
      <div className="mt-4 text-center">
        <Link
          to="/forgot-password"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Forgot Password?
        </Link>
      </div>
    </div>
  );
};

export default Login;

