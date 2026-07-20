import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../../api/chatApi";
import styles from "./ChatWidget.module.css";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Xin chào! Mình là trợ lý tư vấn của LEANH Studio. Bạn cần tìm sản phẩm gì hôm nay?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage = { role: "user", text: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      // Chuẩn hóa lịch sử gửi lên backend: chỉ role + text, bỏ suggestedProducts
      const history = updatedMessages
        .filter((m) => m.role === "user" || m.role === "bot")
        .map((m) => ({ role: m.role, text: m.text }));

      const data = await sendChatMessage(trimmed, history);

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: data.reply,
          suggestedProducts: data.suggestedProducts || [],
        },
      ]);
    } catch (error) {
      console.error("Chat API error:", error?.response?.status, error?.response?.data || error.message);

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Xin lỗi, hiện mình chưa thể trả lời. Bạn thử lại sau nhé.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={styles.wrapper}>
      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.header}>
            <span>Tư vấn LEANH Studio</span>
            <button
              className={styles.closeBtn}
              onClick={() => setIsOpen(false)}
              type="button"
              aria-label="Đóng chat"
            >
              ✕
            </button>
          </div>

          <div className={styles.messages}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={
                  msg.role === "user" ? styles.userBubble : styles.botBubble
                }
              >
                <p>{msg.text}</p>

                {msg.suggestedProducts?.length > 0 && (
                  <div className={styles.suggestedList}>
                    {msg.suggestedProducts.map((p) => (
                      <a
                        key={p.id}
                        href={`/products/${p.slug}`}
                        className={styles.suggestedItem}
                      >
                        {p.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className={styles.botBubble}>
                <p className={styles.typing}>Đang trả lời...</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className={styles.inputRow}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi..."
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              type="button"
            >
              Gửi
            </button>
          </div>
        </div>
      )}

      <button
        className={styles.toggleBtn}
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
        aria-label="Mở chat tư vấn"
      >
        {isOpen ? "✕" : "💬"}
      </button>
    </div>
  );
}