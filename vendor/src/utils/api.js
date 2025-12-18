import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://zuba-api.onrender.com';

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('vendorId');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Vendor API functions
export const vendorApi = {
  // Dashboard
  getDashboard: () => api.get('/vendor/dashboard'),
  getProfile: () => api.get('/vendor/me'),
  updateProfile: (data) => api.put('/vendor/me', data),

  // Products
  getProducts: (params) => api.get('/vendor/products', { params }),
  getProduct: (id) => api.get(`/vendor/products/${id}`),
  createProduct: (data) => api.post('/vendor/products', data),
  updateProduct: (id, data) => api.put(`/vendor/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/vendor/products/${id}`),

  // Orders
  getOrders: (params) => api.get('/vendor/orders', { params }),
  getOrder: (id) => api.get(`/vendor/orders/${id}`),
  updateOrderStatus: (id, data) => api.put(`/vendor/orders/${id}/status`, data),

  // Finance
  getFinanceSummary: () => api.get('/vendor/finance/summary'),
  getPayouts: (params) => api.get('/vendor/payouts', { params }),
  requestPayout: (data) => api.post('/vendor/payouts/request', data),
  getPayoutDetails: (id) => api.get(`/vendor/payouts/${id}`),
  updatePayoutSettings: (data) => api.put('/vendor/me/payout-settings', data),

  // Coupons
  getCoupons: (params) => api.get('/vendor/coupons', { params }),
  getCoupon: (id) => api.get(`/vendor/coupons/${id}`),
  createCoupon: (data) => api.post('/vendor/coupons', data),
  updateCoupon: (id, data) => api.put(`/vendor/coupons/${id}`, data),
  deleteCoupon: (id) => api.delete(`/vendor/coupons/${id}`),
  toggleCoupon: (id) => api.put(`/vendor/coupons/${id}/toggle`),
  getCouponStats: () => api.get('/vendor/coupons/stats'),
};

// Categories API
export const categoryApi = {
  getCategories: () => api.get('/category'),
};

// Upload API
export const uploadApi = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    // DO NOT set Content-Type for FormData - axios will set it automatically with boundary
    return api.post('/upload/image', formData);
  },
  // Upload product images - uses the same endpoint as admin
  uploadProductImages: async (files) => {
    const formData = new FormData();
    if (Array.isArray(files)) {
      files.forEach(file => formData.append('images', file));
    } else {
      formData.append('images', files);
    }
    // DO NOT set Content-Type for FormData - axios will set it automatically with boundary
    // Setting it manually removes the boundary string and breaks the upload!
    return api.post('/product/uploadImages', formData);
  },
};

export default api;

