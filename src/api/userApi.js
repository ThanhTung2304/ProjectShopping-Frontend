import axiosClient from "./axiosClient";

const userApi = {
  // Lấy thông tin chi tiết user hiện tại
  getProfile: () => axiosClient.get("/api/users/profile"),
  // Cập nhật thông tin cá nhân
  updateProfile: (data) => axiosClient.put("/api/users/profile", data),
  // Đổi mật khẩu
  changePassword: (data) => axiosClient.put("/api/users/change-password", data),
};

export default userApi;