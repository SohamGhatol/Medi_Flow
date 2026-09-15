import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { customerAuth } from '../services/customerApi';
import { useAlert } from '../context/AlertContext';

const CustomerLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const validateField = (name, value) => {
    let error = '';
    if (name === 'email') {
      if (!value.trim()) error = 'Email is required';
      else if (!/^[\w\.-]+@[\w\.-]+\.\w+$/.test(value)) error = 'Please enter a valid email address';
    } else if (name === 'password') {
      if (!value) error = 'Password is required';
    }
    return error;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = {};
    Object.keys(formData).forEach(key => {
      const err = validateField(key, formData[key]);
      if (err) errors[key] = err;
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const response = await customerAuth.login(formData);
      
      // Store token and customer data
      localStorage.setItem('customerToken', response.data.token);
      localStorage.setItem('customer', JSON.stringify(response.data.customer));
      
      // Redirect to shop
      navigate('/shop');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Please try again.';
      showAlert({ type: 'error', message: errMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 animate-fade-in">
        <div className="text-center">
          <div className="mx-auto mb-6">
            <img 
              src="/logo.png" 
              alt="Medi-Flow Systems" 
              className="h-24 w-auto mx-auto"
              onError={(e) => e.target.style.display = 'none'}
            />
          </div>
          <h2 className="text-3xl font-bold text-primary-900 mb-2">
            Customer Login
          </h2>
          <p className="text-slate-600">
            Sign in to shop medicines online
          </p>
        </div>

        <form className="mt-8 space-y-6 bg-white rounded-2xl shadow-xl p-8 border border-slate-100" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`appearance-none block w-full pl-10 pr-3 py-3 border ${fieldErrors.email ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-accent-500'} rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors`}
                  placeholder="you@example.com"
                />
              </div>
              {fieldErrors.email && <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`appearance-none block w-full pl-10 pr-10 py-3 border ${fieldErrors.password ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-accent-500'} rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link to="/customer/forgot-password" className="font-medium text-accent-600 hover:text-accent-700 transition-colors">
                Forgot password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || Object.values(fieldErrors).some(err => err)}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white ${loading || Object.values(fieldErrors).some(err => err) ? 'bg-slate-400 cursor-not-allowed' : 'bg-accent-600 hover:bg-accent-700 hover:shadow-md'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 transition duration-150`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{' '}
              <Link to="/customer/register" className="font-medium text-accent-600 hover:text-accent-700 transition-colors">
                Create one now
              </Link>
            </p>
          </div>

          <div className="text-center pt-4 border-t border-slate-200">
            <Link to="/" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              ← Back to home
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerLogin;
