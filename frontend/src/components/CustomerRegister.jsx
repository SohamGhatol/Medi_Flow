import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { customerAuth } from '../services/customerApi';
import { useAlert } from '../context/AlertContext';

const CustomerRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });
  
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'name':
        if (!value.trim()) error = 'Full name is required';
        else if (value.trim().length < 2) error = 'Name must be at least 2 characters';
        break;
      case 'email':
        if (!value.trim()) error = 'Email is required';
        else if (!/^[\w\.-]+@[\w\.-]+\.\w+$/.test(value)) error = 'Please enter a valid email address';
        break;
      case 'phone':
        if (!value.trim()) error = 'Phone number is required';
        else if (!/^[6-9]\d{9}$/.test(value) && !/^\d{10}$/.test(value)) error = 'Please enter a valid 10-digit mobile number';
        break;
      case 'address':
        if (!value.trim()) error = 'Address is required';
        break;
      case 'pincode':
        if (value.trim() && !/^\d{6}$/.test(value)) error = 'Please enter a valid 6-digit pincode';
        break;
      case 'confirmPassword':
        if (value && value !== formData.password) error = 'Passwords do not match';
        break;
      default:
        break;
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
    
    // Clear error as user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
    // Cross-validate confirm password if password changes
    if (name === 'password' && formData.confirmPassword) {
      if (value !== formData.confirmPassword) {
        setFieldErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      } else {
        setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
      }
    }
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return null;
    const checks = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /\d/.test(pwd),
      special: /[^A-Za-z0-9]/.test(pwd)
    };
    const passed = Object.values(checks).filter(Boolean).length;
    let strength = 'Weak';
    let color = 'text-red-600';
    let bg = 'bg-red-500';
    
    if (passed === 5) {
      strength = 'Strong';
      color = 'text-green-600';
      bg = 'bg-green-500';
    } else if (passed >= 3) {
      strength = 'Medium';
      color = 'text-yellow-600';
      bg = 'bg-yellow-500';
    }
    
    return { checks, strength, color, bg, passed };
  };

  const passwordValidation = getPasswordStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields before submission
    const errors = {};
    Object.keys(formData).forEach(key => {
      const err = validateField(key, formData[key]);
      if (err) errors[key] = err;
    });
    
    if (passwordValidation && passwordValidation.passed !== 5) {
      errors.password = 'Please meet all password requirements';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      await customerAuth.register(registerData);
      
      showAlert({ type: 'success', message: 'Account created successfully! Please sign in to continue.' });
      navigate('/customer/login');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed. Please try again.';
      showAlert({ type: 'error', message: errMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8 animate-fade-in">
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
            Create Customer Account
          </h2>
          <p className="text-slate-600">
            Join us to securely manage your health needs
          </p>
        </div>

        <form className="mt-8 space-y-6 bg-white rounded-2xl shadow-xl p-8 border border-slate-100" onSubmit={handleSubmit}>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`appearance-none block w-full px-3 py-3 border ${fieldErrors.name ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-primary-500'} rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors`}
                  placeholder="John Doe"
                />
              </div>
              {fieldErrors.name && <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`appearance-none block w-full px-3 py-3 border ${fieldErrors.email ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-primary-500'} rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors`}
                  placeholder="you@example.com"
                />
              </div>
              {fieldErrors.email && <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`appearance-none block w-full px-3 py-3 border ${fieldErrors.phone ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-primary-500'} rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors`}
                  placeholder="9876543210"
                />
              </div>
              {fieldErrors.phone && <p className="mt-1 text-xs text-red-500">{fieldErrors.phone}</p>}
            </div>

            {/* Address */}
            <div className="md:row-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                id="address"
                name="address"
                required
                rows="4"
                value={formData.address}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`appearance-none block w-full px-3 py-3 border ${fieldErrors.address ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-primary-500'} rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors resize-none`}
                placeholder="123 Main Street, Apartment 4B"
              />
              {fieldErrors.address && <p className="mt-1 text-xs text-red-500">{fieldErrors.address}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-3 border ${fieldErrors.password ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-primary-500'} rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors pr-10`}
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
              
              {/* Password Strength Indicator */}
              {passwordValidation && (
                <div className="mt-2 text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-500">Password Strength:</span>
                    <span className={`font-medium ${passwordValidation.color}`}>{passwordValidation.strength}</span>
                  </div>
                  <div className="flex gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full ${i < passwordValidation.passed ? passwordValidation.bg : 'bg-slate-200'}`}></div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500">
                    <span className={passwordValidation.checks.length ? 'text-green-600' : ''}>✓ 8+ chars</span>
                    <span className={passwordValidation.checks.uppercase ? 'text-green-600' : ''}>✓ Uppercase</span>
                    <span className={passwordValidation.checks.lowercase ? 'text-green-600' : ''}>✓ Lowercase</span>
                    <span className={passwordValidation.checks.number ? 'text-green-600' : ''}>✓ Number</span>
                    <span className={passwordValidation.checks.special ? 'text-green-600' : ''}>✓ Special char</span>
                  </div>
                </div>
              )}
              {fieldErrors.password && <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`appearance-none block w-full px-3 py-3 border ${fieldErrors.confirmPassword ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-primary-500'} rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors pr-10`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && <p className="mt-1 text-xs text-red-500">{fieldErrors.confirmPassword}</p>}
            </div>

            {/* City */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-1">
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                value={formData.city}
                onChange={handleChange}
                className="appearance-none block w-full px-3 py-3 border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                placeholder="Mumbai"
              />
            </div>

            {/* State */}
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-slate-700 mb-1">
                State
              </label>
              <input
                id="state"
                name="state"
                type="text"
                value={formData.state}
                onChange={handleChange}
                className="appearance-none block w-full px-3 py-3 border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                placeholder="Maharashtra"
              />
            </div>

            {/* Pincode */}
            <div>
              <label htmlFor="pincode" className="block text-sm font-medium text-slate-700 mb-1">
                Pincode
              </label>
              <input
                id="pincode"
                name="pincode"
                type="text"
                value={formData.pincode}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`appearance-none block w-full px-3 py-3 border ${fieldErrors.pincode ? 'border-red-300 focus:ring-red-500' : 'border-slate-300 focus:ring-primary-500'} rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors`}
                placeholder="400001"
              />
              {fieldErrors.pincode && <p className="mt-1 text-xs text-red-500">{fieldErrors.pincode}</p>}
            </div>

          </div>

          <div>
            <button
              type="submit"
              disabled={loading || Object.values(fieldErrors).some(err => err)}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white ${loading || Object.values(fieldErrors).some(err => err) ? 'bg-slate-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700 shadow-md hover:shadow-lg'} transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
          
          <div className="text-center mt-4">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/customer/login" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerRegister;
