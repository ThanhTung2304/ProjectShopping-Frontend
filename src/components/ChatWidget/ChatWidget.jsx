import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../../api/chatApi";
import styles from "./ChatWidget.module.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const STORAGE_KEY = "leanh_chat_history";

const DEFAULT_GREETING = {
  role: "bot",
  text: "Xin chào! Mình là trợ lý tư vấn của LEANH Studio. Bạn cần tìm sản phẩm gì hôm nay?",
};

const loadStoredMessages = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Không thể đọc lịch sử chat từ localStorage:", err);
  }
  return [DEFAULT_GREETING];
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(loadStoredMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (err) {
      console.error("Không thể lưu lịch sử chat vào localStorage:", err);
    }
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage = { role: "user", text: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
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

  const handleClearChat = () => {
    if (!window.confirm("Bạn muốn xóa toàn bộ lịch sử trò chuyện?")) return;
    setMessages([DEFAULT_GREETING]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className={styles.wrapper}>
      {isOpen && (
        <div className={styles.chatWindow}>
          <div className={styles.header}>
            <span>Tư vấn LEANH Studio</span>
            <div className={styles.headerActions}>
              <button
              className={styles.clearBtn}
              onClick={handleClearChat}
              type="button"
              aria-label="Xóa lịch sử"
            >
              <span>🗑️</span>
            </button>
              <button
                className={styles.closeBtn}
                onClick={() => setIsOpen(false)}
                type="button"
                aria-label="Đóng cửa sổ chat"
              >
                <span>&times;</span>
              </button>
            </div>
          </div>

          <div className={styles.messages}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={
                  msg.role === "user"
                    ? styles.userBubble
                    : styles.botBubble
                }
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  className={styles.markdown}
                >
                  {msg.text}
                </ReactMarkdown>

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