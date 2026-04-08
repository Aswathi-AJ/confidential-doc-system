import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: false
});

// Add token to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    console.log("API Interceptor - Token exists:", token ? "Yes" : "No");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("API Interceptor - Added Authorization header");
    }
    console.log("API Interceptor - Request URL:", config.url);
    return config;
  },
  (error) => {
    console.error("API Interceptor - Request error:", error);
    return Promise.reject(error);
  }
);

// Handle 401 responses
API.interceptors.response.use(
  (response) => {
    console.log("API Interceptor - Response success:", response.config.url);
    return response;
  },
  (error) => {
    console.error("API Interceptor - Response error:", error.response?.status, error.response?.config?.url);
    if (error.response?.status === 401) {
      console.log("API Interceptor - 401 detected, clearing localStorage and redirecting");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default API;