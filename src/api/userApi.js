import axiosClient from "./axiosClient";

const userApi = {
  // Current user - old routes
  getProfile: () => axiosClient.get("/api/users/profile"),
  updateProfile: (data) => axiosClient.put("/api/users/profile", data),
  changePassword: (data) => axiosClient.put("/api/users/change-password", data),

  // Current user - new routes
  getMe: () => axiosClient.get("/api/me"),
  updateMe: (data) => axiosClient.put("/api/me", data),
  changeMyPassword: (data) => axiosClient.put("/api/me/password", data),

  // Admin
  adminGetAll: () => axiosClient.get("/api/admin/users"),
  adminGetById: (id) => axiosClient.get(`/api/admin/users/${id}`),
  adminUpdate: (id, data) => axiosClient.put(`/api/admin/users/${id}`, data),
  adminUpdateStatus: (id, status) =>
    axiosClient.patch(`/api/admin/users/${id}/status`, { status }),
  adminUpdateRole: (id, role) =>
    axiosClient.patch(`/api/admin/users/${id}/role`, { role }),
  adminSoftDelete: (id) => axiosClient.delete(`/api/admin/users/${id}`),
  adminHardDelete: (id) => axiosClient.delete(`/api/admin/users/${id}/hard`),
  adminDelete: (id) => axiosClient.delete(`/api/admin/users/${id}/hard`),
};

export default userApi;
