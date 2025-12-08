import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { fetchDataFromApi, deleteData } from '../../utils/api';
import CircularProgress from '@mui/material/CircularProgress';
import { FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';

const VendorProducts = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadProducts();
  }, [pagination.page, statusFilter]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });
      
      if (statusFilter !== 'all') {
        queryParams.append('status', statusFilter);
      }

      const response = await fetchDataFromApi(`/api/vendors/products?${queryParams}`);
      if (response.success) {
        setProducts(response.products || []);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        toast.error(response.error || 'Failed to load products');
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await deleteData(`/api/products/${productId}`);
      if (response.success) {
        toast.success('Product deleted successfully');
        loadProducts();
      } else {
        toast.error(response.error || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'success';
      case 'pending': return 'warning';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  const getImageUrl = (product) => {
    if (product.featuredImage) {
      return typeof product.featuredImage === 'string' 
        ? product.featuredImage 
        : product.featuredImage.url;
    }
    if (product.images && product.images.length > 0) {
      const firstImg = product.images[0];
      return typeof firstImg === 'string' ? firstImg : firstImg.url;
    }
    return '/placeholder-product.png';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Products</h1>
              <p className="text-gray-600 mt-1">Manage your product listings</p>
            </div>
            <Button
              variant="contained"
              startIcon={<FaPlus />}
              onClick={() => navigate('/vendor/products/add')}
              sx={{ backgroundColor: '#efb291', '&:hover': { backgroundColor: '#e5a67d' } }}
            >
              Add Product
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="font-medium">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border rounded-md"
            >
              <option value="all">All</option>
              <option value="published">Published</option>
              <option value="pending">Pending</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <CircularProgress />
          </div>
        ) : (
          <>
            {products.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <FaPlus className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Products Yet</h3>
                <p className="text-gray-600 mb-4">Start selling by adding your first product!</p>
                <Button
                  variant="contained"
                  startIcon={<FaPlus />}
                  onClick={() => navigate('/vendor/products/add')}
                  sx={{ backgroundColor: '#efb291', '&:hover': { backgroundColor: '#e5a67d' } }}
                >
                  Add Your First Product
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {products.map((product) => (
                        <tr key={product._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <img
                              src={getImageUrl(product)}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">{product.sku || 'No SKU'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              ${(product.pricing?.price || product.price || 0).toFixed(2)}
                            </div>
                            {product.pricing?.salePrice && (
                              <div className="text-xs text-gray-500 line-through">
                                ${product.pricing.regularPrice.toFixed(2)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {product.inventory?.stock ?? product.countInStock ?? 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Chip
                              label={product.status || 'draft'}
                              color={getStatusColor(product.status)}
                              size="small"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => navigate(`/product/${product._id}`)}
                                className="text-blue-600 hover:text-blue-900"
                                title="View"
                              >
                                <FaEye />
                              </button>
                              <button
                                onClick={() => navigate(`/vendor/products/edit/${product._id}`)}
                                className="text-green-600 hover:text-green-900"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDelete(product._id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                    <div className="text-sm text-gray-700">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
                    </div>
                    <div className="flex gap-2">
                      <Button
                        disabled={pagination.page === 1}
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      >
                        Previous
                      </Button>
                      <Button
                        disabled={pagination.page >= pagination.pages}
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VendorProducts;

