import axiosClient from "./axiosClient";

const addressApi = {
  getAll: () => axiosClient.get("/api/addresses"),
  create: (data) => axiosClient.post("/api/addresses", data),
  update: (id, data) => axiosClient.put(`/api/addresses/${id}`, data),
  delete: (id) => axiosClient.delete(`/api/addresses/${id}`),
  setDefault: (id) => axiosClient.patch(`/api/addresses/${id}/default`),
};

export default addressApi;