import axios from 'axios';

// Use environment variable or default to local backend
const baseURL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000') + '/api';

const api = axios.create({
  baseURL,
});

// Add a request interceptor to add the JWT token to the headers
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

export default api;
