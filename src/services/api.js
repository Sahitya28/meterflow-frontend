import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiry
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        // If no refresh token just logout
        if (!refreshToken) {
          localStorage.clear();
          window.location.href = "/login";
          return Promise.reject(error);
        }

        // Try to get new access token
        const res = await axios.post(
          `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/auth/refresh`,
          { refreshToken }
        );

        const newToken = res.data.accessToken;
        localStorage.setItem("accessToken", newToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear everything and go to login
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => API.post("/auth/register", data),
  login: (data) => API.post("/auth/login", data),
  logout: () => API.post("/auth/logout"),
  getMe: () => API.get("/auth/me"),
};

// API Keys
export const apiKeyAPI = {
  create: (data) => API.post("/keys", data),
  getAll: () => API.get("/keys"),
  revoke: (id) => API.delete(`/keys/${id}`),
  rotate: (id) => API.post(`/keys/${id}/rotate`),
  getUsage: (id) => API.get(`/keys/${id}/usage`),
};

// APIs
export const apisAPI = {
  create: (data) => API.post("/apis", data),
  getAll: () => API.get("/apis"),
  getOne: (id) => API.get(`/apis/${id}`),
  update: (id, data) => API.put(`/apis/${id}`, data),
  delete: (id) => API.delete(`/apis/${id}`),
  generateKey: (id, data) => API.post(`/apis/${id}/keys`, data),
};

// Usage
export const usageAPI = {
  getLogs: () => API.get("/usage"),
  getStats: () => API.get("/usage/stats"),
};

// Billing
export const billingAPI = {
  getAll: () => API.get("/billing"),
  calculate: () => API.post("/billing/calculate"),
  getSummary: () => API.get("/billing/summary"),
  markAsPaid: (id) => API.post(`/billing/${id}/pay`),
};

// Payments
export const paymentAPI = {
  getPlans: () => API.get("/payments/plans"),
  getSubscription: () => API.get("/payments/subscription"),
  createOrder: (data) => API.post("/payments/create-order", data),
  verifyPayment: (data) => API.post("/payments/verify", data),
  getHistory: () => API.get("/payments/history"),
  cancel: () => API.post("/payments/cancel"),
  createOrderForBill: (data) => API.post("/payments/create-order-for-bill", data), // ← NEW
  verifyBillPayment: (data) => API.post("/payments/verify-bill-payment", data),    // ← NEW
};


// Access management
export const accessAPI = {
  browseApis: () => API.get("/access/apis"),
  requestAccess: (data) => API.post("/access/request", data),
  getMyAccess: () => API.get("/access/my-access"),
  getMyRequests: () => API.get("/access/my-requests"),
  getIncomingRequests: () => API.get("/access/requests"),
  approve: (id, data) => API.post(`/access/approve/${id}`, data),
  reject: (id) => API.post(`/access/reject/${id}`),
  getConsumerUsage: () => API.get("/access/consumer-usage"),
};

// User account management
export const userAPI = {
  getProfile: () => API.get("/user/profile"),
  updateProfile: (data) => API.put("/user/profile", data),
  changePassword: (data) => API.put("/user/password", data),
  deleteAccount: (data) => API.delete("/user/account", { data }),
};

export default API;