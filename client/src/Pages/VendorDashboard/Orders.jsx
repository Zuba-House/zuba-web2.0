import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { fetchDataFromApi, postData } from '../../utils/api';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import { FaBox, FaTruck, FaCheckCircle, FaClock } from 'react-icons/fa';

const VendorOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let url = '/api/vendors/orders';
      if (filter !== 'all') {
        url += `?status=${filter}`;
      }
      const response = await fetchDataFromApi(url);
      if (response.success) {
        setOrders(response.data || []);
      } else {
        toast.error(response.error || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, productId, newStatus) => {
    try {
      const response = await postData(
        `/api/vendors/orders/${orderId}/products/${productId}/status`,
        { status: newStatus }
      );
      if (response.success) {
        toast.success('Order status updated successfully');
        fetchOrders();
      } else {
        toast.error(response.error || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const addTrackingNumber = async (orderId, productId) => {
    const trackingNumber = prompt('Enter tracking number:');
    if (!trackingNumber) return;

    try {
      const response = await postData(
        `/api/vendors/orders/${orderId}/products/${productId}/tracking`,
        { trackingNumber }
      );
      if (response.success) {
        toast.success('Tracking number added successfully');
        fetchOrders();
      } else {
        toast.error(response.error || 'Failed to add tracking number');
      }
    } catch (error) {
      console.error('Error adding tracking number:', error);
      toast.error('Failed to add tracking number');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      processing: 'info',
      shipped: 'primary',
      delivered: 'success',
      completed: 'success',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.orderNumber?.toLowerCase().includes(searchLower) ||
      order.customer?.name?.toLowerCase().includes(searchLower) ||
      order.customer?.email?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📦 Orders</h1>
              <p className="text-gray-600 mt-1">Manage your order fulfillment</p>
            </div>
            <input
              type="text"
              placeholder="Search by order number or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border rounded-md w-64"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filter === 'all' ? 'contained' : 'outlined'}
              onClick={() => setFilter('all')}
              sx={{ minWidth: 120 }}
            >
              All Orders
            </Button>
            <Button
              variant={filter === 'pending' ? 'contained' : 'outlined'}
              onClick={() => setFilter('pending')}
              sx={{ minWidth: 120 }}
            >
              Pending
            </Button>
            <Button
              variant={filter === 'processing' ? 'contained' : 'outlined'}
              onClick={() => setFilter('processing')}
              sx={{ minWidth: 120 }}
            >
              Processing
            </Button>
            <Button
              variant={filter === 'shipped' ? 'contained' : 'outlined'}
              onClick={() => setFilter('shipped')}
              sx={{ minWidth: 120 }}
            >
              Shipped
            </Button>
            <Button
              variant={filter === 'completed' ? 'contained' : 'outlined'}
              onClick={() => setFilter('completed')}
              sx={{ minWidth: 120 }}
            >
              Completed
            </Button>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <FaBox className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No orders found</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Order #{order.orderNumber || order._id}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <Chip
                    label={order.status || 'pending'}
                    color={getStatusColor(order.status)}
                    size="small"
                  />
                </div>

                {order.customer && (
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <p><strong>Customer:</strong> {order.customer.name}</p>
                    <p><strong>Email:</strong> {order.customer.email}</p>
                    <p><strong>Phone:</strong> {order.customer.phone || 'N/A'}</p>
                  </div>
                )}

                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Your Products in this Order:</h4>
                  {order.vendorProducts && order.vendorProducts.map((product, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded mb-2">
                      <img
                        src={product.image || '/placeholder.png'}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600">Qty: {product.quantity}</p>
                        <p className="text-sm text-gray-600">${product.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <select
                          value={product.vendorStatus || 'pending'}
                          onChange={(e) => updateOrderStatus(order._id, product.productId, e.target.value)}
                          className="px-3 py-1 border rounded text-sm"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                        </select>
                        {product.trackingNumber ? (
                          <p className="text-xs text-gray-600">
                            Tracking: {product.trackingNumber}
                          </p>
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => addTrackingNumber(order._id, product.productId)}
                            sx={{ fontSize: '0.75rem' }}
                          >
                            + Add Tracking
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <strong>Your Earnings:</strong>
                    <span className="ml-2 text-lg font-bold text-green-600">
                      ${order.vendorEarnings?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/orders/${order._id}`)}
                  >
                    View Full Details
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorOrders;

