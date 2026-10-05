import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { products, cart } from '../services/customerApi';
import { useAlert } from '../context/AlertContext';
import CustomerNavbar from './common/CustomerNavbar';

const ProductCatalog = () => {
  const { showAlert, showConfirm } = useAlert();
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Advanced Filters
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    sort: 'name'
  });
  
  const [categories, setCategories] = useState([
    'Pain Relief', 'Cold & Cough', 'Allergy & Sinus', 
    'Digestive Health', 'Vitamins & Supplements', 
    'Heart & Blood Pressure', 'Diabetes Care', 
    'Skin Care', 'First Aid', 'Oral Care'
  ]); // Pre-loaded common categories for the UI
  
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });
  const [cartCount, setCartCount] = useState(0);
  const [addingState, setAddingState] = useState({});
  const [imageErrors, setImageErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    fetchCartCount();
  }, [filters, pagination.page]);

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination(prev => ({ ...prev, page: 1 }));
      } else {
        fetchProducts();
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        type: filters.type,
        category: filters.category,
        min_price: filters.minPrice,
        max_price: filters.maxPrice,
        sort: filters.sort,
        page: pagination.page,
        per_page: 12
      };
      
      const response = await products.getAll(params);
      setProductList(response.data.products);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCartCount = async () => {
    try {
      const response = await cart.getCount();
      setCartCount(response.data.count);
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  const handleAddToCart = async (e, productId) => {
    e.stopPropagation(); // Prevent card click
    
    const token = localStorage.getItem('customerToken');
    if (!token) {
      showAlert({ type: 'warning', message: 'Please login to add items to cart' });
      navigate('/customer/login');
      return;
    }

    try {
      setAddingState(prev => ({ ...prev, [productId]: 'adding' }));
      
      await cart.add({ medicine_id: productId, quantity: 1 });
      fetchCartCount();
      window.dispatchEvent(new Event('cartUpdated'));
      
      setAddingState(prev => ({ ...prev, [productId]: 'added' }));
      
      setTimeout(() => {
        setAddingState(prev => {
          const newState = { ...prev };
          delete newState[productId];
          return newState;
        });
      }, 2000);
      
    } catch (error) {
      setAddingState(prev => {
        const newState = { ...prev };
        delete newState[productId];
        return newState;
      });
      showAlert({ type: 'error', message: error.response?.data?.message || 'Failed to add to cart' });
    }
  };

  const handleLogout = async () => {
    const confirmed = await showConfirm('Are you sure you want to logout from Medi-Flow?', 'Confirm Logout', 'Logout');
    if (confirmed) {
      localStorage.removeItem('customerToken');
      localStorage.removeItem('customer');
      navigate('/customer/login');
    }
  };

  const customer = JSON.parse(localStorage.getItem('customer') || '{}');

  const ProductSkeleton = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-pulse">
      <div className="w-full aspect-square bg-slate-100"></div>
      <div className="p-5">
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-3"></div>
        <div className="h-6 bg-slate-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
        <div className="flex justify-between items-end mt-6">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="h-10 bg-slate-200 rounded-lg w-1/3"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navigation */}
      <CustomerNavbar />

      {/* Hero Search Section */}
      <div className="bg-white border-b border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Shop Pharmacy Essentials</h1>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search for medicines, generics, or categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-2xl text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-primary-500 transition-colors shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Filters
              </h2>
              
              <div className="space-y-8">
                {/* Product Type */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Prescription</h3>
                  <div className="space-y-2">
                    <label className="flex items-center cursor-pointer group">
                      <input 
                        type="radio" 
                        name="type" 
                        checked={filters.type === ''} 
                        onChange={() => setFilters({...filters, type: ''})}
                        className="form-radio h-4 w-4 text-primary-600 border-slate-300 focus:ring-primary-500"
                      />
                      <span className="ml-3 text-sm text-slate-600 group-hover:text-slate-900">All Items</span>
                    </label>
                    <label className="flex items-center cursor-pointer group">
                      <input 
                        type="radio" 
                        name="type" 
                        checked={filters.type === 'OTC'} 
                        onChange={() => setFilters({...filters, type: 'OTC'})}
                        className="form-radio h-4 w-4 text-primary-600 border-slate-300 focus:ring-primary-500"
                      />
                      <span className="ml-3 text-sm text-slate-600 group-hover:text-slate-900">Over The Counter</span>
                    </label>
                    <label className="flex items-center cursor-pointer group">
                      <input 
                        type="radio" 
                        name="type" 
                        checked={filters.type === 'Rx'} 
                        onChange={() => setFilters({...filters, type: 'Rx'})}
                        className="form-radio h-4 w-4 text-primary-600 border-slate-300 focus:ring-primary-500"
                      />
                      <span className="ml-3 text-sm text-slate-600 group-hover:text-slate-900">Prescription Required</span>
                    </label>
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Categories</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    <label className="flex items-center cursor-pointer group">
                      <input 
                        type="radio" 
                        name="category" 
                        checked={filters.category === ''} 
                        onChange={() => setFilters({...filters, category: ''})}
                        className="form-radio h-4 w-4 text-primary-600 border-slate-300 focus:ring-primary-500"
                      />
                      <span className="ml-3 text-sm text-slate-600 group-hover:text-slate-900">All Categories</span>
                    </label>
                    {categories.map(cat => (
                      <label key={cat} className="flex items-center cursor-pointer group">
                        <input 
                          type="radio" 
                          name="category" 
                          checked={filters.category === cat} 
                          onChange={() => setFilters({...filters, category: cat})}
                          className="form-radio h-4 w-4 text-primary-600 border-slate-300 focus:ring-primary-500"
                        />
                        <span className="ml-3 text-sm text-slate-600 group-hover:text-slate-900">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Sort By</h3>
                  <select 
                    value={filters.sort}
                    onChange={(e) => setFilters({...filters, sort: e.target.value})}
                    className="block w-full pl-3 pr-10 py-2 text-sm border-slate-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-lg shadow-sm"
                  >
                    <option value="name">Name (A-Z)</option>
                    <option value="price_asc">Price (Low to High)</option>
                    <option value="price_desc">Price (High to Low)</option>
                  </select>
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            
            {/* Header info */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-slate-500">
                Showing <strong className="text-slate-900">{productList.length}</strong> items 
                {filters.category && <span> in <strong className="text-slate-900">{filters.category}</strong></span>}
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(8)].map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            ) : productList.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No medicines found</h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                  We couldn't find any products matching your search or filter criteria. Try adjusting your filters.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilters({ type: '', category: '', minPrice: '', maxPrice: '', sort: 'name' });
                  }}
                  className="inline-flex items-center px-6 py-3 border border-slate-300 shadow-sm text-sm font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {productList.map((product) => (
                  <div 
                    key={product.medicine_id} 
                    onClick={() => navigate(`/product/${product.medicine_id}`)}
                    className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col h-full"
                  >
                    {/* Image Container */}
                    <div className="relative aspect-square bg-slate-50 overflow-hidden border-b border-slate-100 flex items-center justify-center">
                      {(!product.image_url || imageErrors[product.medicine_id]) ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                          <svg className="h-16 w-16 mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                        </div>
                      ) : (
                        <img 
                          src={product.image_url?.startsWith('/uploads') ? `http://localhost:5000${product.image_url}` : product.image_url} 
                          alt={product.name}
                          className="absolute inset-0 w-full h-full object-contain p-6 mix-blend-multiply group-hover:scale-110 transition-transform duration-500 ease-out"
                          onError={() => setImageErrors(prev => ({ ...prev, [product.medicine_id]: true }))}
                        />
                      )}
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {product.requires_prescription ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-100/90 text-purple-700 backdrop-blur-sm border border-purple-200 shadow-sm">
                            Rx Only
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100/90 text-emerald-700 backdrop-blur-sm border border-emerald-200 shadow-sm">
                            OTC
                          </span>
                        )}
                        {!product.in_stock && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-100/90 text-red-700 backdrop-blur-sm border border-red-200 shadow-sm">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content Container */}
                    <div className="p-5 flex flex-col flex-grow">
                      <div className="mb-1">
                        <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">
                          {product.category || 'Medicine'}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-slate-900 mb-1 leading-tight line-clamp-1 group-hover:text-primary-600 transition-colors">
                        {product.name}
                      </h3>
                      
                      <p className="text-xs text-slate-500 mb-4 font-medium">
                        {product.company}
                      </p>

                      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-400 font-medium mb-0.5">Price</p>
                          <p className="text-xl font-black text-slate-900">₹{product.price.toFixed(2)}</p>
                        </div>
                        
                        <button
                          onClick={(e) => handleAddToCart(e, product.medicine_id)}
                          disabled={!product.in_stock || addingState[product.medicine_id] === 'adding' || addingState[product.medicine_id] === 'added'}
                          className={`flex-shrink-0 inline-flex items-center justify-center h-10 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${
                            !product.in_stock
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : addingState[product.medicine_id] === 'added'
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'bg-slate-900 text-white hover:bg-primary-600 shadow-sm hover:shadow group-hover:bg-primary-600'
                          }`}
                        >
                          {addingState[product.medicine_id] === 'added' ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : addingState[product.medicine_id] === 'adding' ? (
                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            'Add'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div className="mt-10 sticky bottom-4 z-40 flex items-center justify-between border border-slate-200 bg-white px-4 py-3 sm:px-6 rounded-2xl shadow-xl">
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-slate-700">
                      Showing page <span className="font-bold">{pagination.page}</span> of{' '}
                      <span className="font-bold">{pagination.pages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                        disabled={pagination.page === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                        disabled={pagination.page === pagination.pages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductCatalog;
