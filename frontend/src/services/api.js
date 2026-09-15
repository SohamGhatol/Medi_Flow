import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const onlineOrders = {
  getAll: () => api.get('/online-orders'),
  getById: (id) => api.get(`/online-orders/${id}`),
  updateStatus: (id, status) => api.put(`/online-orders/${id}/status`, { status }),
  reviewPrescription: (id, action) => api.post(`/online-orders/${id}/review-prescription`, { action }),
  getOcr: (id) => api.get(`/online-orders/${id}/ocr`),
  confirmOcr: (id) => api.post(`/online-orders/${id}/ocr/confirm`)
};

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid, logout user
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;