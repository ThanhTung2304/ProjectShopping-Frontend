import axiosClient from "./axiosClient";

const notificationApi = {
  getNotifications: (params) => axiosClient.get("/api/notifications", { params }),
  getUnreadCount: () => axiosClient.get("/api/notifications/unread-count"),
  markAsRead: (id) => axiosClient.patch(`/api/notifications/${id}/read`),
  markAllAsRead: () => axiosClient.patch("/api/notifications/read-all"),
};

export default notificationApi;
