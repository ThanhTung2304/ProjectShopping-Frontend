import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const WS_URL = `${import.meta.env.VITE_API_URL}/ws`;

/**
 * Kết nối WebSocket, lắng nghe thông báo real-time cho user hiện tại.
 * @param {string} userEmail - email của user đang đăng nhập (dùng làm định danh, khớp bên backend)
 * @param {function} onNotification - callback nhận thông báo mới
 */
export default function useNotificationSocket(userEmail, onNotification) {
  const clientRef = useRef(null);

  useEffect(() => {
    if (!userEmail) return;

    const token = sessionStorage.getItem("token");

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000, // tự động kết nối lại nếu mất kết nối
      onConnect: () => {
        client.subscribe(`/user/${userEmail}/queue/notifications`, (message) => {
          try {
            const notification = JSON.parse(message.body);
            onNotification(notification);
          } catch (err) {
            console.error("Lỗi parse thông báo WebSocket:", err);
          }
        });
      },
      onStompError: (frame) => {
        console.error("Lỗi STOMP:", frame.headers?.message, frame.body);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [userEmail, onNotification]);
}