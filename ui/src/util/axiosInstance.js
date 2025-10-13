// ui/src/util/axiosInstance.js
import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_REACT_APP_API_BASE_URL, // Use full API URL
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Add request interceptor to dynamically set token
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper to resolve image URLs
export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path; // Already absolute
  return `${import.meta.env.VITE_REACT_APP_API_BASE_URL}${path}`;
};