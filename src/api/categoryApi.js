import axiosClient from "./axiosClient";

const categoryApi = {
  getAll: () => axiosClient.get("/api/categories"),
  getById: (id) => axiosClient.get(`/api/categories/${id}`),
  
  // Admin methods
  create: (data) => axiosClient.post("/api/categories", data),
  update: (id, data) => axiosClient.put(`/api/categories/${id}`, data),
  delete: (id) => axiosClient.delete(`/api/categories/${id}`),
};

export default categoryApi;