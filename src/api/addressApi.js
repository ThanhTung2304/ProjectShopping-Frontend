import axiosClient from "./axiosClient";

const addressApi = {
  // Old routes
  getAll: () => axiosClient.get("/api/addresses"),
  create: (data) => axiosClient.post("/api/addresses", data),
  update: (id, data) => axiosClient.put(`/api/addresses/${id}`, data),
  delete: (id) => axiosClient.delete(`/api/addresses/${id}`),
  setDefault: (id) => axiosClient.patch(`/api/addresses/${id}/default`),

  // New current-user routes
  getMine: () => axiosClient.get("/api/me/addresses"),
  createMine: (data) => axiosClient.post("/api/me/addresses", data),
  updateMine: (id, data) => axiosClient.put(`/api/me/addresses/${id}`, data),
  deleteMine: (id) => axiosClient.delete(`/api/me/addresses/${id}`),
  setMineDefault: (id) => axiosClient.patch(`/api/me/addresses/${id}/default`),
};

export default addressApi;
