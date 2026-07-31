import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_ISO_API_URL,
});
console.log(import.meta.env.VITE_ISO_API_URL);
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sisq_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
