import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true
});

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

// Recursively sanitize objects and arrays
const sanitizeData = (data) => {
  if (data === null || data === undefined) return data;
  
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
    // Sanitize request data (prevent XSS)
    if (config.data) {
      config.data = sanitizeData(config.data);
    }
    
    // Sanitize URL parameters
    if (config.params) {
      config.params = sanitizeData(config.params);
    }
    
    // Add token to headers
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
    if (response.data) {
      response.data = sanitizeData(response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized (Token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      return Promise.reject(error);
    }
    
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error("Access denied:", error.response?.data?.message);
      alert(error.response?.data?.message || "You don't have permission to perform this action.");
    }
    
    // Handle 423 Locked (Account locked)
    if (error.response?.status === 423) {
      alert(error.response?.data?.message || "Account temporarily locked. Please try again after 30 minutes.");
    }
    
    // Handle 429 Too Many Requests
    if (error.response?.status === 429) {
      alert("Too many requests. Please try again later.");
    }
    
    return Promise.reject(error);
  }
);

export default API;