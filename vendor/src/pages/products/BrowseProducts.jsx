import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { vendorApi, categoryApi } from '../../utils/api';
import { 
  Search, Package, CheckCircle, ShoppingBag, 
  Filter, Grid, List, ChevronLeft, ChevronRight,
  AlertCircle, Loader2
} from 'lucide-react';

const BrowseProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState({});
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [view, setView] = useState('grid');
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [pagination.page, category, sort]);

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getCategories();
      if (response.data && Array.isArray(response.data)) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Fetch categories error:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: 20,
        search: search || undefined,
        category: category || undefined,
        sort: sort
      };
      
      const response = await vendorApi.browseAvailableProducts(params);
      if (response.data && response.data.success) {
        setProducts(response.data.data.items || []);
        setPagination({
          page: response.data.data.page || 1,
          pages: response.data.data.pages || 1,
          total: response.data.data.total || 0
        });
      }
    } catch (error) {
      console.error('Fetch products error:', error);
      toast.error(error.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchProducts();
  };

  const handleClaim = async (productId) => {
    try {
      setClaiming({ ...claiming, [productId]: true });
      const response = await vendorApi.claimProduct(productId);
      
      if (response.data && response.data.success) {
        toast.success(response.data.message || 'Product added to your store!');
        // Remove claimed product from list
        setProducts(products.filter(p => p._id !== productId));
        setPagination({ ...pagination, total: pagination.total - 1 });
      } else {
        throw new Error(response.data?.message || 'Failed to claim product');
      }
    } catch (error) {
      console.error('Claim product error:', error);
      toast.error(error.response?.data?.message || 'Failed to claim product');
    } finally {
      setClaiming({ ...claiming, [productId]: false });
    }
  };

  const getImageUrl = (product) => {
    if (product?.images?.[0]?.url) return product.images[0].url;
    if (typeof product?.images?.[0] === 'string') return product.images[0];
    if (product?.featuredImage) return product.featuredImage;
    if (product?.image) return product.image;
    return 'https://via.placeholder.com/300?text=No+Image';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-[#efb291]" />
              Browse & Add Products
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Browse available products and add them to your store. Each product can only belong to one vendor.
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by name, SKU, or description..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#efb291] focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#efb291] focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#efb291] focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>

            {/* View Toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setView('grid')}
                className={`p-2 border rounded-lg ${view === 'grid' ? 'bg-[#efb291] text-white border-[#efb291]' : 'border-gray-300'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                className={`p-2 border rounded-lg ${view === 'list' ? 'bg-[#efb291] text-white border-[#efb291]' : 'border-gray-300'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            <button
              type="submit"
              className="px-6 py-2 bg-[#efb291] text-white rounded-lg hover:bg-[#e0a080] transition-colors font-medium"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {products.length} of {pagination.total} available products
      </div>

      {/* Products Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#efb291]" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Available</h3>
          <p className="text-gray-600">
            {search || category 
              ? 'No products match your search criteria. Try adjusting your filters.'
              : 'All products have been claimed by vendors. Check back later for new products.'}
          </p>
        </div>
      ) : (
        <>
          {view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow border border-gray-200"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square bg-gray-100">
                    <img
                      src={getImageUrl(product)}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300?text=No+Image';
                      }}
                    />
                    {product.pricing?.onSale && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                        SALE
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 min-h-[2.5rem]">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">SKU: {product.sku || 'N/A'}</p>
                    
                    {product.category?.name && (
                      <p className="text-xs text-[#efb291] mb-2">{product.category.name}</p>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-lg font-bold text-[#efb291]">
                          {formatCurrency(product.pricing?.price || product.price || 0)}
                        </span>
                        {product.pricing?.regularPrice && product.pricing.regularPrice > (product.pricing?.price || product.price) && (
                          <span className="text-xs text-gray-500 line-through ml-2">
                            {formatCurrency(product.pricing.regularPrice)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stock Info */}
                    <div className="text-xs text-gray-600 mb-3">
                      Stock: {product.inventory?.endlessStock 
                        ? 'Unlimited' 
                        : (product.inventory?.stock || product.countInStock || 0)}
                    </div>

                    {/* Claim Button */}
                    <button
                      onClick={() => handleClaim(product._id)}
                      disabled={claiming[product._id]}
                      className="w-full py-2 bg-[#efb291] text-white rounded-lg hover:bg-[#e0a080] transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {claiming[product._id] ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Add to My Store
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="bg-white rounded-lg shadow-sm p-4 flex gap-4 hover:shadow-md transition-shadow border border-gray-200"
                >
                  {/* Product Image */}
                  <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={getImageUrl(product)}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300?text=No+Image';
                      }}
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">SKU: {product.sku || 'N/A'}</p>
                    
                    {product.category?.name && (
                      <p className="text-xs text-[#efb291] mb-2">{product.category.name}</p>
                    )}

                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {product.shortDescription || product.description?.substring(0, 100)}
                    </p>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-[#efb291]">
                          {formatCurrency(product.pricing?.price || product.price || 0)}
                        </span>
                        {product.pricing?.regularPrice && product.pricing.regularPrice > (product.pricing?.price || product.price) && (
                          <span className="text-xs text-gray-500 line-through ml-2">
                            {formatCurrency(product.pricing.regularPrice)}
                          </span>
                        )}
                        <div className="text-xs text-gray-600 mt-1">
                          Stock: {product.inventory?.endlessStock 
                            ? 'Unlimited' 
                            : (product.inventory?.stock || product.countInStock || 0)}
                        </div>
                      </div>

                      <button
                        onClick={() => handleClaim(product._id)}
                        disabled={claiming[product._id]}
                        className="px-6 py-2 bg-[#efb291] text-white rounded-lg hover:bg-[#e0a080] transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {claiming[product._id] ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Add to Store
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page >= pagination.pages}
                className="p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BrowseProducts;

