import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance for customer API
const customerApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
customerApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('customerToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Customer Authentication
export const customerAuth = {
  register: (data) => customerApi.post('/customer/register', data),
  login: (data) => customerApi.post('/customer/login', data),
  getProfile: () => customerApi.get('/customer/profile'),
  updateProfile: (data) => customerApi.put('/customer/profile', data),
  changePassword: (data) => customerApi.post('/customer/change-password', data),
  forgotPassword: (data) => customerApi.post('/customer/forgot-password', data),
  resetPassword: (data) => customerApi.post('/customer/reset-password', data)
};

// Products
export const products = {
  getAll: (params) => customerApi.get('/shop/products', { params }),
  getById: (id) => customerApi.get(`/shop/products/${id}`),
  getFeatured: () => customerApi.get('/shop/products/featured'),
  getCategories: () => customerApi.get('/shop/categories'),
  searchSuggestions: (query) => customerApi.get('/shop/search-suggestions', { params: { q: query } }),
  checkAvailability: (items) => customerApi.post('/shop/check-availability', { items })
};

// Shopping Cart
export const cart = {
  get: () => customerApi.get('/customer/cart'),
  add: (data) => customerApi.post('/customer/cart/add', data),
  update: (id, data) => customerApi.put(`/customer/cart/update/${id}`, data),
  remove: (id) => customerApi.delete(`/customer/cart/remove/${id}`),
  clear: () => customerApi.delete('/customer/cart/clear'),
  getCount: () => customerApi.get('/customer/cart/count')
};

// Orders
export const orders = {
  validateCheckout: () => customerApi.post('/customer/checkout/validate'),
  place: (formData) => {
    // For file upload, use multipart/form-data
    return customerApi.post('/customer/orders/place', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  getAll: () => customerApi.get('/customer/orders'),
  getById: (id) => customerApi.get(`/customer/orders/${id}`),
  getOcr: (id) => customerApi.get(`/customer/orders/${id}/ocr`),
  track: (id) => customerApi.get(`/customer/orders/${id}/track`),
  cancel: (id) => customerApi.post(`/customer/orders/${id}/cancel`)
};

export default customerApi;
