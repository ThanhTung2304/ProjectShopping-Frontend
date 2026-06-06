import axiosClient from "./axiosClient";

const reviewApi = {
  getByProduct: (productId) => axiosClient.get(`/api/reviews/product/${productId}`),
  getSummary: (productId) => axiosClient.get(`/api/reviews/product/${productId}/summary`),
  create: (data) => axiosClient.post("/api/reviews", data),
};

export default reviewApi;