import axios from 'axios';

// Environment-based API URL configuration
// For LAN access: set VITE_API_URL to your machine's IP (e.g., http://192.168.1.100:8000)
// For localhost: defaults to http://localhost:8000
const getApiUrl = () => {
  // Check for environment variable first (set in .env file)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Fallback to localhost
  return 'http://localhost:8000';
};

const instance = axios.create({
  baseURL: `${getApiUrl()}/api/`,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request counter for retry logic
const requestRetryCount = new Map();
const MAX_RETRIES = 2;

// Request Interceptor: Attach token + logging
instance.interceptors.request.use(
  (config) => {
    // Attach auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        baseURL: config.baseURL,
        params: config.params,
        data: config.data,
      });
    }

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response Interceptor: Error handling + retry logic + logging
instance.interceptors.response.use(
  (response) => {
    // Log successful response in development
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }

    // Clear retry count on success
    const requestKey = `${response.config.method}-${response.config.url}`;
    requestRetryCount.delete(requestKey);

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log error in development
    if (import.meta.env.DEV) {
      console.error('[API Error]', {
        method: originalRequest?.method?.toUpperCase(),
        url: originalRequest?.url,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
    }

    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;

      // 401 Unauthorized - Clear auth and redirect to login
      if (status === 401 && !originalRequest._isRetrying) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('judge');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // 403 Forbidden
      if (status === 403) {
        console.warn('[API] Access forbidden - check permissions');
      }

      // 404 Not Found
      if (status === 404) {
        console.warn('[API] Resource not found:', originalRequest?.url);
      }

      // 500 Server Error
      if (status >= 500) {
        console.error('[API] Server error - please try again later');
      }
    } else if (error.request) {
      // Request was made but no response received (network error)
      console.error('[API] Network error - server not reachable');

      // Retry logic for network errors
      const requestKey = `${originalRequest?.method}-${originalRequest?.url}`;
      const retryCount = requestRetryCount.get(requestKey) || 0;

      if (retryCount < MAX_RETRIES && !originalRequest._isRetrying) {
        requestRetryCount.set(requestKey, retryCount + 1);
        originalRequest._isRetrying = true;

        console.log(`[API] Retrying request (${retryCount + 1}/${MAX_RETRIES})...`);

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));

        return instance(originalRequest);
      }

      // Max retries reached
      console.error('[API] Max retries reached - please check your connection');
      requestRetryCount.delete(requestKey);
    } else {
      // Something else happened
      console.error('[API] Request setup error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Helper function to get user-friendly error messages
export const getErrorMessage = (error) => {
  if (error.response) {
    // Server responded with error
    const status = error.response.status;
    const data = error.response.data;

    // Check for specific error messages from backend
    if (data?.detail) return data.detail;
    if (data?.message) return data.message;
    if (data?.error) return data.error;

    // Default messages by status code
    switch (status) {
      case 400:
        return 'Napačni podatki. Prosimo preverite vnos.';
      case 401:
        return 'Niste prijavljeni. Prosimo prijavite se.';
      case 403:
        return 'Nimate dovoljenja za to dejanje.';
      case 404:
        return 'Zahtevani vir ni bil najden.';
      case 409:
        return 'Konflikt - podatki že obstajajo.';
      case 500:
        return 'Napaka strežnika. Prosimo poskusite kasneje.';
      case 503:
        return 'Storitev trenutno ni na voljo.';
      default:
        return `Napaka: ${status}`;
    }
  } else if (error.request) {
    // Network error
    return 'Napaka povezave. Preverite, ali je strežnik zagnan in dostopen.';
  } else {
    // Other error
    return error.message || 'Neznana napaka. Prosimo poskusite znova.';
  }
};

// Helper to check if backend is reachable
export const checkBackendHealth = async () => {
  try {
    const response = await axios.get(`${getApiUrl()}/admin/`, { timeout: 3000 });
    return response.status === 200;
  } catch (error) {
    console.error('[Health Check] Backend not reachable:', getApiUrl());
    return false;
  }
};

export default instance;
