import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://elegant-home-decor.onrender.com/api"
});

api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("ehd_user") || "null");
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
    console.log("[api] Authorization header set for:", config.url);
  } else {
    console.warn("[api] No token found in localStorage for:", config.url);
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("[api] response error:", err.config?.url, err.response?.status, err.response?.data);
    return Promise.reject(err);
  }
);

export default api;
