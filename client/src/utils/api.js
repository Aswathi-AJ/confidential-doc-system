import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api" // <-- add /api if backend uses it
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`; // if backend expects Bearer
  }
  return req;
});

export default API;