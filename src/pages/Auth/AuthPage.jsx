import { useState } from "react";
import styles from "./AuthPage.module.css";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {

  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState("login");
  const [toast, setToast] = useState({ show: false, message: "" });

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 2500);
  };
  
const handleLogin = async (e) => {
  e.preventDefault();
  if (!loginForm.email || !loginForm.password) {
    showToast("Vui lòng nhập đầy đủ thông tin");
    return;
  }
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: loginForm.email, password: loginForm.password }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Sai email hoặc mật khẩu");
    localStorage.setItem("token", data.data.token);
    showToast("Đăng nhập thành công ✓");
      setTimeout(() => {
        navigate("/home");
      },800);
  } catch (err) {
    showToast(err.message);
  }
};

  const handleRegister = async (e) => {
  e.preventDefault();
  if (!registerForm.fullName || !registerForm.email || !registerForm.password) {
    showToast("Vui lòng nhập đầy đủ thông tin");
    return;
  }
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: registerForm.fullName,
        email: registerForm.email,
        phone: registerForm.phone,
        password: registerForm.password,
      }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Đăng ký thất bại");
    localStorage.setItem("token", data.data.token);
    showToast("Đăng ký thành công! ✓");
    setTimeout(() => setActiveTab("login"), 1500);
  } catch (err) {
    showToast(err.message);
  }
};

  return (
    <div className={styles.root}>
      {/* ── Left Panel ── */}
      <div className={styles.leftPanel}>
        <div className={styles.brandLogo}>
          LA <span>Studio</span>
        </div>

        <div className={styles.leftContent}>
          <h1 className={styles.tagline}>
            Thời trang <em>định nghĩa</em>
            <br />
            phong cách của bạn
          </h1>
          <p className={styles.subText}>
            Khám phá bộ sưu tập thời trang cao cấp — từ minimalist đến street style.
          </p>
        </div>

        <div className={styles.dots}>
          <span className={`${styles.dot} ${styles.dotActive}`} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className={styles.rightPanel}>
        <div className={styles.rightWrapper}>
          {/* Toast notification */}
          <div className={`${styles.toast} ${toast.show ? styles.toastShow : ""}`}>
            {toast.message}
          </div>

          {/* Tab switcher */}
          <div className={styles.tabSwitcher}>
            <button
              className={`${styles.tabBtn} ${activeTab === "login" ? styles.tabBtnActive : ""}`}
              onClick={() => setActiveTab("login")}
            >
              Đăng nhập
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === "register" ? styles.tabBtnActive : ""}`}
              onClick={() => setActiveTab("register")}
            >
              Đăng ký
            </button>
          </div>

          {/* ── Login Form ── */}
          {activeTab === "login" && (
            <form onSubmit={handleLogin} className={styles.formSection}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email</label>
                <input
                  type="email"
                  className={styles.formInput}
                  placeholder="name@example.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Mật khẩu</label>
                <input
                  type="password"
                  className={styles.formInput}
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                />
              </div>

              <span className={styles.forgotLink}>Quên mật khẩu?</span>

              <button type="submit" className={styles.btnPrimary}>
                Đăng nhập
              </button>

              <div className={styles.divider}>
                <span className={styles.dividerLine} />
                <span className={styles.dividerText}>hoặc</span>
                <span className={styles.dividerLine} />
              </div>

              <button type="button" className={styles.btnGoogle}>
                <span className={styles.googleG} />
                Tiếp tục với Google
              </button>

              <p className={styles.termsNote}>
                Bạn chưa có tài khoản?{" "}
                <a onClick={() => setActiveTab("register")}>Đăng ký ngay</a>
              </p>
            </form>
          )}

          {/* ── Register Form ── */}
          {activeTab === "register" && (
            <form onSubmit={handleRegister} className={styles.formSection}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Họ và tên</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="Nguyễn Văn A"
                  value={registerForm.fullName}
                  onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email</label>
                <input
                  type="email"
                  className={styles.formInput}
                  placeholder="name@example.com"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Số điện thoại</label>
                <input
                  type="tel"
                  className={styles.formInput}
                  placeholder="0912 345 678"
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Mật khẩu</label>
                <input
                  type="password"
                  className={styles.formInput}
                  placeholder="Tối thiểu 8 ký tự"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                />
              </div>

              <button type="submit" className={styles.btnPrimary}>
                Tạo tài khoản
              </button>

              <p className={styles.termsNote} style={{ marginTop: "0.75rem" }}>
                Bằng cách đăng ký, bạn đồng ý với{" "}
                <a>Điều khoản dịch vụ</a> và <a>Chính sách bảo mật</a>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
