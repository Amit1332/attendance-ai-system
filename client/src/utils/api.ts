import axios from "axios";

const API_URL = "http://localhost:5000/api/v1";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url === "/auth/login" || originalRequest.url === "/auth/register" || originalRequest.url === "/auth/refresh-token") {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        // No refresh token available, logout user
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("auth-logout"));
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { access, refresh } = response.data.data;

        localStorage.setItem("accessToken", access.token);
        localStorage.setItem("refreshToken", refresh.token);

        originalRequest.headers.Authorization = `Bearer ${access.token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token failed, logout user
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("auth-logout"));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
