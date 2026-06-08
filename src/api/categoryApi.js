import axiosClient from "./axiosClient";

const categoryApi = {
  getAll: () => axiosClient.get("/api/categories"),
  getById: (id) => axiosClient.get(`/api/categories/${id}`),

  // Admin - new routes
  adminGetById: (id) => axiosClient.get(`/api/admin/categories/${id}`),
  create: (data) => axiosClient.post("/api/admin/categories", data),
  update: (id, data) => axiosClient.put(`/api/admin/categories/${id}`, data),
  delete: (id) => axiosClient.delete(`/api/admin/categories/${id}`),

  // Admin - old route aliases
  createLegacy: (data) => axiosClient.post("/api/categories", data),
  updateLegacy: (id, data) => axiosClient.put(`/api/categories/${id}`, data),
  deleteLegacy: (id) => axiosClient.delete(`/api/categories/${id}`),
};

export default categoryApi;
