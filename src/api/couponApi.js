// import axiosClient from "./axiosClient";

// const publicCouponPaths = ["/api/coupons", "/api/coupons/active", "/api/public/coupons"];

// const getAvailableCoupons = async () => {
//   let lastError;

//   for (const path of publicCouponPaths) {
//     try {
//       return await axiosClient.get(path);
//     } catch (err) {
//       lastError = err;

//       if (![403, 404, 405].includes(err.response?.status)) {
//         throw err;
//       }
//     }
//   }

//   throw lastError;
// };

// const couponApi = {
//   apply: (code) => axiosClient.post("/api/coupons/apply", { code }),
//   getAvailable: getAvailableCoupons,

//   // Admin - new routes
//   getAll: () => axiosClient.get("/api/admin/coupons"),
//   create: (data) => axiosClient.post("/api/admin/coupons", data),
//   update: (id, data) => axiosClient.put(`/api/admin/coupons/${id}`, data),
//   delete: (id) => axiosClient.delete(`/api/admin/coupons/${id}`),

//   // Admin - old route aliases
//   createLegacy: (data) => axiosClient.post("/api/coupons", data),
//   updateLegacy: (id, data) => axiosClient.put(`/api/coupons/${id}`, data),
//   deleteLegacy: (id) => axiosClient.delete(`/api/coupons/${id}`),
// };

// export default couponApi;


import axiosClient from "./axiosClient";

const couponApi = {
  // Public
  getAvailable: () => axiosClient.get("/api/coupons/active"),
  apply: (code) => axiosClient.post("/api/coupons/apply", { code }),

  // Admin
  getAll: () => axiosClient.get("/api/coupons"),
  create: (data) => axiosClient.post("/api/coupons", data),
  update: (id, data) => axiosClient.put(`/api/coupons/${id}`, data),
  delete: (id) => axiosClient.delete(`/api/coupons/${id}`),
};

export default couponApi;