import axiosClient from "./axiosClient";

const cartApi = {
  getCart: () => axiosClient.get("/api/cart"),
  addToCart: (data) => axiosClient.post("/api/cart", data),
  updateQuantity: (id, quantity) => axiosClient.put(`/api/cart/${id}`, { quantity }),
  removeItem: (id) => axiosClient.delete(`/api/cart/${id}`),
  clearCart: () => axiosClient.delete("/api/cart"),
};

export default cartApi;