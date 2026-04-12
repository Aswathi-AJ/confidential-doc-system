import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
  timeout: 120000,
});

// CSRF token will be set after fetching
let csrfToken = null;

export const setCsrfToken = (token) => {
  csrfToken = token;
  API.defaults.headers.common["CSRF-Token"] = token;
};

// ================= XSS PROTECTION: Sanitize Input =================
const sanitizeInput = (input) => {
  if (input === null || input === undefined) return input;
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[&<>]/g, function(m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    })
    .trim();
};

const sanitizeData = (data) => {
  if (data === null || data === undefined) return data;
  
  if (data instanceof FormData) {
    return data;
  }
  
  if (data instanceof File) {
    return data;
  }
  
  if (data instanceof Blob) {
    return data;
  }
  
  if (typeof data === 'string') {
    return sanitizeInput(data);
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  
  if (typeof data === 'object') {
    const sanitizedObj = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        sanitizedObj[key] = sanitizeData(data[key]);
      }
    }
    return sanitizedObj;
  }
  
  return data;
};

// ================= REQUEST INTERCEPTOR =================
API.interceptors.request.use(
  async (config) => {
    // Add CSRF token to headers if available
    if (csrfToken) {
      config.headers["CSRF-Token"] = csrfToken;
    }
    
    if (config.data instanceof FormData) {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      delete config.headers['Content-Type'];
      return config;
    }
    
    if (config.data) {
      config.data = sanitizeData(config.data);
    }
    
    if (config.params) {
      config.params = sanitizeData(config.params);
    }
    
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error("API Interceptor - Request error:", error);
    return Promise.reject(error);
  }
);

// ================= RESPONSE INTERCEPTOR =================
API.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && !(response.data instanceof FormData)) {
      response.data = sanitizeData(response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

export default API;