import axiosClient from "./axiosClient";

const authApi = {
  login: (data) => axiosClient.post("/api/auth/login", data),
  register: (data) => axiosClient.post("/api/auth/register", data),
};

export default authApi;