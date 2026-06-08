import { useState, useEffect, useRef, useContext } from "react";
import styles from "./AuthPage.module.css";
import { useNavigate } from "react-router-dom";
import authApi from "../../api/authApi";
import { AuthContext } from "../../context/authContextValue";
import { buildAuthUser, isAdminUser } from "../../utils/authUtils";

export default function AuthPage() {
  const navigate = useNavigate();
  const { login: setAuthUser } = useContext(AuthContext);
  
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
    const res = await authApi.login({ email: loginForm.email, password: loginForm.password });
    if (!res.success) throw new Error(res.message || "Sai email hoặc mật khẩu");
    
    localStorage.setItem("token", res.data.token);
    const loggedInUser = buildAuthUser(res.data);
    setAuthUser(loggedInUser);
    showToast("Đăng nhập thành công ✓");
    setTimeout(() => navigate(isAdminUser(loggedInUser) ? "/admin/dashboard" : "/"), 800);
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
  if (registerForm.password.length < 6) {
    showToast("Mật khẩu phải có ít nhất 6 ký tự");
    return;
  }
  try {
    const res = await authApi.register({
      fullName: registerForm.fullName,
      email: registerForm.email,
      phone: registerForm.phone,
      password: registerForm.password,
    });
    if (!res.success) throw new Error(res.message || "Đăng ký thất bại");
    localStorage.setItem("token", res.data.token);
    const registeredUser = buildAuthUser(res.data);
    if (registeredUser) setAuthUser(registeredUser);
    showToast("Đăng ký thành công! ✓");
    setTimeout(() => navigate(isAdminUser(registeredUser) ? "/admin/dashboard" : "/"), 800);
  } catch (err) {
    showToast(err.message);
  }
};

  // New state for banner carousel
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const banners = [
    {
      tagline: (
        <>
          Thời trang <em>định nghĩa</em>
          <br />
          phong cách của bạn
        </>
      ),
      subText: "Khám phá bộ sưu tập thời trang cao cấp — từ minimalist đến street style.",
    },
    {
      tagline: (
        <>
          Nâng tầm phong cách
          <br />
          với những thiết kế độc đáo
        </>
      ),
      subText: "Sự kết hợp hoàn hảo giữa hiện đại và cổ điển.",
    },
    {
      tagline: (
        <>
          Tự tin tỏa sáng
          <br />
          mọi lúc mọi nơi
        </>
      ),
      subText: "Thời trang không chỉ là quần áo, mà còn là cá tính.",
    },
  ];
  const bannerRef = useRef(null);

  // Auto-slide effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 5000); // Change banner every 5 seconds
    return () => clearInterval(interval);
  }, [banners.length]);

  // Manual slide effect when dot is clicked
  // Update transform when currentBannerIndex changes
  useEffect(() => {
    if (bannerRef.current) {
      bannerRef.current.style.transform = `translateX(-${currentBannerIndex * 100}%)`;
    }
  }, [currentBannerIndex]);

  return (
    <div className={styles.root}>
      {/* ── Left Panel ── */}
      <div className={styles.leftPanel}>
        <div className={styles.brandLogo}>

          {/* Hiển thị tên thương hiệu với "LeAnh" là phần chính và "Studio" là phần phụ, có thể được thiết kế nhỏ hơn hoặc khác màu để tạo điểm nhấn. */}
          LeAnh <span>Studio</span>     
          
        </div>

        <div className={styles.bannerContainer}>
          <div className={styles.bannerWrapper} ref={bannerRef}>
            {banners.map((banner, index) => (
              <div key={index} className={styles.bannerItem}>
                <h1 className={styles.tagline}>
                  {banner.tagline}
                </h1>
                <p className={styles.subText}>
                  {banner.subText}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.dots}>
          {banners.map((_, index) => (
            <span
              key={index}
              className={`${styles.dot} ${
                currentBannerIndex === index ? styles.dotActive : ""
              }`}
              onClick={() => setCurrentBannerIndex(index)}
            />
          ))}
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
                  placeholder=""
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Mật khẩu</label>
                <input
                  type="password"
                  className={styles.formInput}
                  placeholder=""
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
                  placeholder=""
                  value={registerForm.fullName}
                  onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email</label>
                <input
                  type="email"
                  className={styles.formInput}
                  placeholder=""
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Số điện thoại</label>
                <input
                  type="tel"
                  className={styles.formInput}
                  placeholder=""
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Mật khẩu</label>
                <input
                  type="password"
                  className={styles.formInput}
                  placeholder="Ít nhất 6 ký tự"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                />
                {registerForm.password.length > 0 && registerForm.password.length < 6 && (
                  <span className={styles.errorMessage}>
                    Mật khẩu phải có ít nhất 6 ký tự
                  </span>
                )}
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
