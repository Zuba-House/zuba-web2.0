import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { vendorApi } from '../../utils/api';
import { 
  Package, ShoppingCart, DollarSign, TrendingUp, 
  Clock, CheckCircle, Truck, AlertCircle, XCircle, Eye 
} from 'lucide-react';

const DashboardHome = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, profileRes] = await Promise.all([
        vendorApi.getDashboard(),
        vendorApi.getProfile()
      ]);
      setDashboardData(dashboardRes.data.data);
      setProfile(profileRes.data.data);
    } catch (error) {
      console.error('Dashboard error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#efb291]"></div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const earnings = dashboardData?.earnings || {};

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts || 0,
      subtitle: `${stats.publishedProducts || 0} published`,
      icon: <Package className="w-6 h-6" />,
      color: 'bg-blue-500',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders || 0,
      subtitle: `${stats.todayOrders || 0} today`,
      icon: <ShoppingCart className="w-6 h-6" />,
      color: 'bg-orange-500',
      bgLight: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      subtitle: `${formatCurrency(stats.todayRevenue)} today`,
      icon: <DollarSign className="w-6 h-6" />,
      color: 'bg-green-500',
      bgLight: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Available Balance',
      value: formatCurrency(earnings.availableBalance),
      subtitle: `${formatCurrency(earnings.pendingBalance)} pending`,
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'bg-purple-500',
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-600'
    }
  ];

  const orderStatusCards = [
    { key: 'RECEIVED', label: 'Received', icon: <Clock className="w-5 h-5" />, color: 'text-gray-600 bg-gray-100' },
    { key: 'PROCESSING', label: 'Processing', icon: <AlertCircle className="w-5 h-5" />, color: 'text-yellow-600 bg-yellow-100' },
    { key: 'SHIPPED', label: 'Shipped', icon: <Truck className="w-5 h-5" />, color: 'text-blue-600 bg-blue-100' },
    { key: 'DELIVERED', label: 'Delivered', icon: <CheckCircle className="w-5 h-5" />, color: 'text-green-600 bg-green-100' },
    { key: 'CANCELLED', label: 'Cancelled', icon: <XCircle className="w-5 h-5" />, color: 'text-red-600 bg-red-100' }
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome back, {profile?.storeName || 'Vendor'}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with your store today.
        </p>
      </div>

      {/* Account Status Alert */}
      {profile?.status === 'PENDING' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-6 h-6 text-yellow-500 mr-3" />
            <div>
              <h3 className="font-semibold text-yellow-800">Account Pending Approval</h3>
              <p className="text-yellow-700 text-sm">
                Your vendor account is under review. You'll be notified once approved.
              </p>
            </div>
          </div>
        </div>
      )}

      {profile?.status === 'SUSPENDED' && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
          <div className="flex items-center">
            <XCircle className="w-6 h-6 text-red-500 mr-3" />
            <div>
              <h3 className="font-semibold text-red-800">Account Suspended</h3>
              <p className="text-red-700 text-sm">
                Your vendor account has been suspended. Please contact support.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">{card.title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-2">{card.value}</p>
                <p className="text-gray-500 text-sm mt-1">{card.subtitle}</p>
              </div>
              <div className={`${card.bgLight} ${card.textColor} p-3 rounded-lg`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Status Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Status Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {orderStatusCards.map((status) => (
            <div key={status.key} className={`${status.color} rounded-lg p-4 text-center`}>
              <div className="flex justify-center mb-2">{status.icon}</div>
              <p className="text-2xl font-bold">{stats.orderStatusCounts?.[status.key] || 0}</p>
              <p className="text-sm font-medium">{status.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link 
          to="/products/new" 
          className="bg-gradient-to-r from-[#0b2735] to-[#1a3d52] text-white rounded-xl p-6 hover:opacity-90 transition-opacity"
        >
          <Package className="w-8 h-8 mb-3 text-[#efb291]" />
          <h3 className="font-semibold text-lg mb-1">Add New Product</h3>
          <p className="text-gray-300 text-sm">List a new product in your store</p>
        </Link>

        <Link 
          to="/orders" 
          className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-6 hover:opacity-90 transition-opacity"
        >
          <ShoppingCart className="w-8 h-8 mb-3" />
          <h3 className="font-semibold text-lg mb-1">View Orders</h3>
          <p className="text-orange-100 text-sm">Manage and fulfill your orders</p>
        </Link>

        <Link 
          to="/finance/withdrawals" 
          className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6 hover:opacity-90 transition-opacity"
        >
          <DollarSign className="w-8 h-8 mb-3" />
          <h3 className="font-semibold text-lg mb-1">Request Withdrawal</h3>
          <p className="text-green-100 text-sm">Withdraw your earnings</p>
        </Link>
      </div>

      {/* Earnings Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Earnings Summary</h2>
          <Link to="/finance/earnings" className="text-[#efb291] hover:underline text-sm font-medium flex items-center">
            View Details <Eye className="w-4 h-4 ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-500 text-sm">Total Sales</p>
            <p className="text-xl font-bold text-gray-800">{formatCurrency(earnings.totalSales)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-500 text-sm">Total Earnings</p>
            <p className="text-xl font-bold text-gray-800">{formatCurrency(earnings.totalEarnings)}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-green-600 text-sm">Available Balance</p>
            <p className="text-xl font-bold text-green-700">{formatCurrency(earnings.availableBalance)}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-yellow-600 text-sm">Pending Balance</p>
            <p className="text-xl font-bold text-yellow-700">{formatCurrency(earnings.pendingBalance)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
