import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../store/authStore';
import { TOKEN_KEY } from '../constants/storage';
import NetInfo from '@react-native-community/netinfo';

const axiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  async config => {
    // ✅ Check internet before every request
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      // Reject silently with custom flag
      return Promise.reject({ isOffline: true });
    }

    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    // ✅ Handle offline flag from request interceptor
    if (error?.isOffline) {
      return Promise.reject(error);
    }

    if (error.response) {
      if (
        error?.response?.status === 401 &&
        error?.response?.data?.message === 'Unauthenticated.'
      ) {
        await useAuthStore.getState().logout();
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;