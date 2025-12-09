import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { fetchDataFromApi } from '../../utils/api';
import CircularProgress from '@mui/material/CircularProgress';
import VendorLayout from '../../components/VendorLayout';
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
          // Allow vendors to access dashboard even without shopLogo
          // They can complete registration later if needed
          // if (appResponse.vendor.status === 'approved' && !appResponse.vendor.shopLogo) {
          //   navigate('/vendor/complete-registration');
          //   return;
          // }
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
    <VendorLayout>
    <div className="min-h-screen" style={{ backgroundColor: '#0b2735' }}>
      {/* Header */}
      <div className="w-full py-4 lg:py-1 px-5 border bg-[#1a3d52] border-[rgba(239,178,145,0.2)] flex items-center gap-8 mb-5 justify-between rounded-md">
        <div className="info">
          <h1 className="text-[26px] lg:text-[35px] font-bold leading-8 lg:leading-10 mb-3" style={{ color: '#e5e2db' }}>
            Welcome,
            <br />
            <span style={{ color: '#efb291' }}>{vendor.shopName}</span>
          </h1>
          <p style={{ color: '#e5e2db', opacity: 0.8 }}>
            Here's what's happening on your store today. See the statistics at once.
          </p>
        </div>
      </div>

      <div className="w-full">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div
              key={index}
              onClick={() => stat.link && navigate(stat.link)}
              className="rounded-lg p-6 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
              style={{ 
                backgroundColor: '#1a3d52', 
                border: '1px solid rgba(239, 178, 145, 0.2)',
                color: '#e5e2db'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-80">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2" style={{ color: '#efb291' }}>{stat.value}</p>
                </div>
                <div style={{ color: '#efb291', opacity: 0.8 }}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg shadow-md p-6 mb-8" style={{ backgroundColor: '#1a3d52', border: '1px solid rgba(239, 178, 145, 0.2)' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: '#e5e2db' }}>Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/vendor/products/add')}
              className="flex items-center gap-3 p-4 border-2 border-dashed rounded-lg transition-all hover:scale-105"
              style={{ 
                borderColor: 'rgba(239, 178, 145, 0.3)',
                color: '#e5e2db'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#efb291';
                e.target.style.backgroundColor = 'rgba(239, 178, 145, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'rgba(239, 178, 145, 0.3)';
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <FaBox className="text-2xl" style={{ color: '#efb291' }} />
              <span className="font-medium">Add Product</span>
            </button>
            {[
              { icon: <FaEdit />, label: 'Manage Products', path: '/vendor/products' },
              { icon: <FaShoppingCart />, label: 'Manage Orders', path: '/vendor/orders' },
              { icon: <FaMoneyBillWave />, label: 'Withdraw Earnings', path: '/vendor/earnings' }
            ].map((action, idx) => (
              <button
                key={idx}
                onClick={() => navigate(action.path)}
                className="flex items-center gap-3 p-4 border-2 border-dashed rounded-lg transition-all hover:scale-105"
                style={{ 
                  borderColor: 'rgba(239, 178, 145, 0.3)',
                  color: '#e5e2db'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#efb291';
                  e.target.style.backgroundColor = 'rgba(239, 178, 145, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = 'rgba(239, 178, 145, 0.3)';
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                <span className="text-2xl" style={{ color: '#efb291' }}>{action.icon}</span>
                <span className="font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Earnings Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-lg shadow-md p-6" style={{ backgroundColor: '#1a3d52', border: '1px solid rgba(239, 178, 145, 0.2)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#e5e2db' }}>Earnings Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span style={{ color: '#e5e2db', opacity: 0.8 }}>Total Earnings</span>
                <span className="text-2xl font-bold" style={{ color: '#4caf50' }}>
                  {formatCurrency(earnings.totalEarnings || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: '#e5e2db', opacity: 0.8 }}>Available Balance</span>
                <span className="text-xl font-semibold" style={{ color: '#2196f3' }}>
                  {formatCurrency(earnings.availableBalance || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: '#e5e2db', opacity: 0.8 }}>Pending Balance</span>
                <span className="text-lg font-medium" style={{ color: '#ffc107' }}>
                  {formatCurrency(earnings.pendingBalance || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-4" style={{ borderTop: '1px solid rgba(239, 178, 145, 0.2)' }}>
                <span style={{ color: '#e5e2db', opacity: 0.8 }}>Withdrawn</span>
                <span className="text-lg font-medium" style={{ color: '#e5e2db' }}>
                  {formatCurrency(earnings.withdrawnAmount || 0)}
                </span>
              </div>
              {earnings.availableBalance > 0 && (
                <button
                  onClick={() => navigate('/vendor/earnings')}
                  className="w-full mt-4 px-4 py-2 rounded-lg font-medium transition-all hover:scale-105"
                  style={{ backgroundColor: '#efb291', color: '#0b2735' }}
                >
                  Request Withdrawal
                </button>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-lg shadow-md p-6" style={{ backgroundColor: '#1a3d52', border: '1px solid rgba(239, 178, 145, 0.2)' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: '#e5e2db' }}>Recent Activity</h2>
            <div className="space-y-3">
              <div className="text-center py-8" style={{ color: '#e5e2db', opacity: 0.6 }}>
                <FaChartLine className="text-4xl mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </VendorLayout>
  );
};

export default VendorDashboard;

