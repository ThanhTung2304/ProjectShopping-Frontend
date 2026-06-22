import axiosClient from "./axiosClient";

const authApi = {
  login: (data) => axiosClient.post("/api/auth/login", data),
  register: (data) => axiosClient.post("/api/auth/register", data),
  forgotPassword: (data) => axiosClient.post("/api/auth/forgot-password", data),
  resetPassword: (data) => axiosClient.post("/api/auth/reset-password", data),
};

export const refreshTokenApi = (refreshToken) =>
  axiosClient.post('/auth/refresh-token', { refreshToken });

export const logoutApi = (refreshToken) =>
  axiosClient.post('/auth/logout', { refreshToken });

export default authApi;
