import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4003/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sisq_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
