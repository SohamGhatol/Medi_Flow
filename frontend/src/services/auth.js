import api from './api';

export const authService = {
  async login(username, password) {
    try {
      const response = await api.post('/auth/login', { username, password });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(msg);
    }
  },

  async register(username, password, roleId) {
    try {
      const response = await api.post('/auth/register', { username, password, role_id: roleId });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Registration failed';
    }
  },

  async getProfile() {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to fetch profile';
    }
  }
};