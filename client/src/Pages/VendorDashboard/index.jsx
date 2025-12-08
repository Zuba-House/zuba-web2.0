import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { fetchDataFromApi } from '../../utils/api';
import CircularProgress from '@mui/material/CircularProgress';
import { 
  FaBox, 
  FaDollarSign, 
  FaShoppingCart, 
  FaStar,
  FaChartLine,
  FaEdit,
  FaImage,
  FaTags,
  FaMoneyBillWave,
  FaCog
} from 'react-icons/fa';
import { formatCurrency } from '../../utils/currency';

const VendorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkVendorStatus();
  }, []);

  const checkVendorStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      // Check application status first
      try {
        const appResponse = await fetchDataFromApi('/api/vendors/my-application');
        if (appResponse.success && appResponse.vendor) {
          if (appResponse.vendor.status === 'pending') {
            navigate('/vendor/application-status');
            return;
          }
          if (appResponse.vendor.status === 'rejected') {
            navigate('/vendor/application-status');
            return;
          }
          if (appResponse.vendor.status === 'approved' && !appResponse.vendor.shopLogo) {
            navigate('/vendor/complete-registration');
            return;
          }
        }
      } catch (appError) {
        // No application found, redirect to apply
        navigate('/become-vendor');
        return;
      }

      // Load dashboard data
      loadDashboard();
    } catch (error) {
      console.error('Error checking vendor status:', error);
      setError('Failed to load dashboard');
      setLoading(false);
    }
  };

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchDataFromApi('/api/vendors/dashboard');
      if (response.success) {
        setDashboardData(response.dashboard);
      } else {
        setError(response.error || 'Failed to load dashboard');
        toast.error(response.error || 'Failed to load dashboard');
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setError(error.message || 'Failed to load dashboard');
      toast.error('Failed to load dashboard');
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadDashboard}
            className="px-4 py-2 bg-[#efb291] text-white rounded-lg hover:bg-[#e5a67d]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { vendor, earnings, stats } = dashboardData;

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts || 0,
      icon: <FaBox className="text-3xl" />,
      color: 'bg-blue-500',
      link: '/vendor/products'
    },
    {
      title: 'Published Products',
      value: stats.publishedProducts || 0,
      icon: <FaImage className="text-3xl" />,
      color: 'bg-green-500',
      link: '/vendor/products?status=published'
    },
    {
      title: 'Total Sales',
      value: stats.totalSales || 0,
      icon: <FaShoppingCart className="text-3xl" />,
      color: 'bg-purple-500',
      link: '/vendor/orders'
    },
    {
      title: 'Total Earnings',
      value: formatCurrency(earnings.totalEarnings || 0),
      icon: <FaDollarSign className="text-3xl" />,
      color: 'bg-yellow-500',
      link: '/vendor/earnings'
    },
    {
      title: 'Available Balance',
      value: formatCurrency(earnings.availableBalance || 0),
      icon: <FaMoneyBillWave className="text-3xl" />,
      color: 'bg-green-600',
      link: '/vendor/earnings'
    },
    {
      title: 'Average Rating',
      value: stats.averageRating ? stats.averageRating.toFixed(1) : '0.0',
      icon: <FaStar className="text-3xl" />,
      color: 'bg-orange-500',
      link: '/vendor/reviews'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Vendor Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {vendor.shopName}</p>
            </div>
            <div className="flex items-center gap-2">
              {vendor.isVerified && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  ✓ Verified
                </span>
              )}
              <button
                onClick={() => navigate('/vendor/settings')}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                <FaCog className="text-xl" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div
              key={index}
              onClick={() => stat.link && navigate(stat.link)}
              className={`${stat.color} rounded-lg p-6 text-white cursor-pointer hover:shadow-lg transition-shadow`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className="text-white/80">
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/vendor/products/add')}
              className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#efb291] hover:bg-[#efb291]/5 transition-colors"
            >
              <FaBox className="text-2xl text-[#efb291]" />
              <span className="font-medium">Add Product</span>
            </button>
            <button
              onClick={() => navigate('/vendor/products')}
              className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#efb291] hover:bg-[#efb291]/5 transition-colors"
            >
              <FaEdit className="text-2xl text-[#efb291]" />
              <span className="font-medium">Manage Products</span>
            </button>
            <button
              onClick={() => navigate('/vendor/promotions')}
              className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#efb291] hover:bg-[#efb291]/5 transition-colors"
            >
              <FaTags className="text-2xl text-[#efb291]" />
              <span className="font-medium">Promotions</span>
            </button>
            <button
              onClick={() => navigate('/vendor/earnings')}
              className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#efb291] hover:bg-[#efb291]/5 transition-colors"
            >
              <FaMoneyBillWave className="text-2xl text-[#efb291]" />
              <span className="font-medium">Withdraw Earnings</span>
            </button>
          </div>
        </div>

        {/* Earnings Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Earnings Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Earnings</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(earnings.totalEarnings || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Available Balance</span>
                <span className="text-xl font-semibold text-blue-600">
                  {formatCurrency(earnings.availableBalance || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending Balance</span>
                <span className="text-lg font-medium text-yellow-600">
                  {formatCurrency(earnings.pendingBalance || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-gray-600">Withdrawn</span>
                <span className="text-lg font-medium text-gray-700">
                  {formatCurrency(earnings.withdrawnAmount || 0)}
                </span>
              </div>
              {earnings.availableBalance > 0 && (
                <button
                  onClick={() => navigate('/vendor/earnings')}
                  className="w-full mt-4 px-4 py-2 bg-[#efb291] text-white rounded-lg hover:bg-[#e5a67d] font-medium"
                >
                  Request Withdrawal
                </button>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              <div className="text-center py-8 text-gray-500">
                <FaChartLine className="text-4xl mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;

