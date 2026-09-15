import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DualLoginPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full">
        {/* Logo and Title */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="mx-auto mb-6">
            <img 
              src="/logo.png" 
              alt="Medi-Flow Systems Logo" 
              className="h-32 w-auto mx-auto"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-4xl font-bold text-primary-900 mb-2">
            Welcome to Medi-Flow Systems
          </h1>
          <p className="text-xl text-primary-700">
            Smart Management. Better Health.
          </p>
        </div>

        {/* Dual Login Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Customer Login Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 transition duration-300 hover:shadow-2xl animate-slide-up">
            <div className="text-center mb-6">
              <div className="mx-auto h-20 w-20 bg-accent-100 text-accent-600 rounded-full flex items-center justify-center mb-4">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Customer Portal
              </h2>
              <p className="text-gray-600">
                Shop medicines online
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => navigate('/customer/login')}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-accent-600 hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 transition duration-150"
              >
                Customer Login
              </button>
              
              <button
                onClick={() => navigate('/customer/register')}
                className="w-full flex justify-center py-3 px-4 border-2 border-accent-500 rounded-lg shadow-sm text-lg font-medium text-accent-700 bg-white hover:bg-accent-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 transition duration-150"
              >
                Create Account
              </button>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 text-center mb-3">
                  As a customer, you can:
                </p>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-accent-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Browse medicines online
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-accent-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Order with prescription upload
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-accent-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Track your orders
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Staff Login Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 transition duration-300 hover:shadow-2xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="text-center mb-6">
              <div className="mx-auto h-20 w-20 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Staff Portal
              </h2>
              <p className="text-gray-600">
                Manage pharmacy operations
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => navigate('/login')}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition duration-150"
              >
                Staff Login
              </button>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 text-center mb-3">
                  Staff portal includes:
                </p>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Inventory management
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Online order management
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Prescription verification
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Sales & reports
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-500 text-sm">
          <p>© 2025 Medi-Flow Systems. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default DualLoginPage;
