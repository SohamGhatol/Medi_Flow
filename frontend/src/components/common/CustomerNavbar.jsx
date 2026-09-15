import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { customerAuth, cart as cartApi } from '../../services/customerApi';
import { useAlert } from '../../context/AlertContext';

const CustomerNavbar = () => {
  const navigate = useNavigate();
  const { showConfirm } = useAlert();
  const [customer, setCustomer] = useState({});
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    if (token) {
      // Read customer from localStorage as immediate fallback
      try {
        const stored = JSON.parse(localStorage.getItem('customer') || '{}');
        if (stored.name) setCustomer(stored);
      } catch (e) {}
      fetchCustomerDetails();
      fetchCartCount();
    }

    // Listen for cross-component cart updates
    const handleCartUpdate = () => {
      if (localStorage.getItem('customerToken')) {
        fetchCartCount();
      }
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const fetchCustomerDetails = async () => {
    try {
      const response = await customerAuth.getProfile();
      setCustomer(response.data);
    } catch (error) {
      console.error('Error fetching customer details:', error);
    }
  };

  const fetchCartCount = async () => {
    try {
      const response = await cartApi.getCount();
      setCartCount(response.data.count);
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  const handleLogout = async () => {
    const confirmed = await showConfirm('Are you sure you want to logout from Medi-Flow?', 'Confirm Logout', 'Logout');
    if (confirmed) {
      localStorage.removeItem('customerToken');
      localStorage.removeItem('customer');
      navigate('/');
    }
  };

  const isLoggedIn = !!localStorage.getItem('customerToken');

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/shop" className="flex items-center group">
              <div className="flex items-center space-x-2">
                <img 
                  src="/logo.png" 
                  alt="MediFlow" 
                  className="h-10 w-auto transition-transform group-hover:scale-105" 
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150x50?text=MediFlow'; }} 
                />
              </div>
            </Link>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-6">
            {isLoggedIn ? (
              <>
                <Link to="/customer/dashboard" className="hidden sm:inline-flex items-center text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 hover:bg-slate-100 hover:text-primary-600 transition-colors">
                  <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Welcome, <strong className="ml-1 text-slate-900">{customer.name || 'User'}</strong>
                </Link>
                <Link to="/customer/orders" className="flex items-center text-slate-500 hover:text-primary-600 font-medium text-sm transition-colors hidden sm:flex">
                  <svg className="w-5 h-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  My Orders
                </Link>
                <Link to="/cart" className="relative p-2 text-slate-400 hover:text-primary-600 transition-colors group">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-primary-600 rounded-full shadow-sm">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="hidden sm:inline-flex items-center ml-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/customer/login" className="text-slate-500 hover:text-primary-600 font-medium text-sm transition-colors">
                  Log In
                </Link>
                <Link to="/customer/register" className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default CustomerNavbar;
