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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [forgotStep, setForgotStep] = useState("email");
  const [forgotForm, setForgotForm] = useState({
    email: "",
    code: "",
    newPassword: "",
    confirmPassword: "",
  });

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 2500);
  };

  const getErrorMessage = (err, fallback) => err?.response?.data?.message || err?.message || fallback;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      showToast("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authApi.login({ email: loginForm.email, password: loginForm.password });
      if (!res.success) throw new Error(res.message || "Sai email hoặc mật khẩu");

      localStorage.setItem("token", res.data.token);
      const loggedInUser = buildAuthUser(res.data);
      setAuthUser(loggedInUser);
      showToast("Đăng nhập thành công");
      setTimeout(() => navigate(isAdminUser(loggedInUser) ? "/admin/dashboard" : "/home"), 800);
    } catch (err) {
      showToast(getErrorMessage(err, "Đăng nhập thất bại"));
    } finally {
      setIsSubmitting(false);
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

    setIsSubmitting(true);
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
      showToast("Đăng ký thành công");
      setTimeout(() => navigate(isAdminUser(registeredUser) ? "/admin/dashboard" : "/home"), 800);
    } catch (err) {
      showToast(getErrorMessage(err, "Đăng ký thất bại"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openForgotPassword = () => {
    setForgotForm((prev) => ({
      ...prev,
      email: loginForm.email || prev.email,
    }));
    setForgotStep("email");
    setActiveTab("forgot");
  };

  const backToLogin = () => {
    setActiveTab("login");
    setForgotStep("email");
    setForgotForm({
      email: "",
      code: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotForm.email) {
      showToast("Vui lòng nhập email");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authApi.forgotPassword({ email: forgotForm.email });
      if (res?.success === false) throw new Error(res.message || "Không thể gửi mã xác nhận");
      showToast(res?.message || "Mã xác nhận đã được gửi đến email của bạn");
      setForgotStep("reset");
    } catch (err) {
      showToast(getErrorMessage(err, "Không thể gửi yêu cầu quên mật khẩu"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!forgotForm.email || !forgotForm.code || !forgotForm.newPassword || !forgotForm.confirmPassword) {
      showToast("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (forgotForm.newPassword.length < 6) {
      showToast("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (forgotForm.newPassword !== forgotForm.confirmPassword) {
      showToast("Mật khẩu xác nhận không khớp");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authApi.resetPassword({
        email: forgotForm.email,
        otp: forgotForm.code,
        newPassword: forgotForm.newPassword,
      });
      if (res?.success === false) throw new Error(res.message || "Đặt lại mật khẩu thất bại");

      showToast(res?.message || "Đặt lại mật khẩu thành công");
      setLoginForm({ email: forgotForm.email, password: "" });
      setTimeout(backToLogin, 800);
    } catch (err) {
      showToast(getErrorMessage(err, "Đặt lại mật khẩu thất bại"));
    } finally {
      setIsSubmitting(false);
    }
  };

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
      subText: "Khám phá bộ sưu tập thời trang cao cấp, từ minimalist đến street style.",
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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  useEffect(() => {
    if (bannerRef.current) {
      bannerRef.current.style.transform = `translateX(-${currentBannerIndex * 100}%)`;
    }
  }, [currentBannerIndex]);

  return (
    <div className={styles.root}>
      <div className={styles.leftPanel}>
        <div className={styles.brandLogo}>
          LeAnh <span>Studio</span>
        </div>

        <div className={styles.bannerContainer}>
          <div className={styles.bannerWrapper} ref={bannerRef}>
            {banners.map((banner, index) => (
              <div key={index} className={styles.bannerItem}>
                <h1 className={styles.tagline}>{banner.tagline}</h1>
                <p className={styles.subText}>{banner.subText}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.dots}>
          {banners.map((_, index) => (
            <span
              key={index}
              className={`${styles.dot} ${currentBannerIndex === index ? styles.dotActive : ""}`}
              onClick={() => setCurrentBannerIndex(index)}
            />
          ))}
        </div>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.rightWrapper}>
          <div className={`${styles.toast} ${toast.show ? styles.toastShow : ""}`}>{toast.message}</div>

          {activeTab !== "forgot" && (
            <div className={styles.tabSwitcher}>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === "login" ? styles.tabBtnActive : ""}`}
                onClick={() => setActiveTab("login")}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === "register" ? styles.tabBtnActive : ""}`}
                onClick={() => setActiveTab("register")}
              >
                Đăng ký
              </button>
            </div>
          )}

          {activeTab === "login" && (
            <form onSubmit={handleLogin} className={styles.formSection}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email</label>
                <input
                  type="email"
                  className={styles.formInput}
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Mật khẩu</label>
                <input
                  type="password"
                  className={styles.formInput}
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              <button type="button" className={styles.forgotLink} onClick={openForgotPassword}>
                Quên mật khẩu?
              </button>

              <button type="submit" className={styles.btnPrimary} disabled={isSubmitting}>
                {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
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
                Bạn chưa có tài khoản? <a onClick={() => setActiveTab("register")}>Đăng ký ngay</a>
              </p>
            </form>
          )}

          {activeTab === "forgot" && (
            <form
              onSubmit={forgotStep === "email" ? handleForgotPassword : handleResetPassword}
              className={styles.formSection}
            >
              <div className={styles.forgotHeader}>
                <h2>Quên mật khẩu</h2>
                <p>
                  {forgotStep === "email"
                    ? "Nhập email tài khoản để nhận mã xác nhận."
                    : "Nhập mã xác nhận và mật khẩu mới của bạn."}
                </p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email</label>
                <input
                  type="email"
                  className={styles.formInput}
                  value={forgotForm.email}
                  onChange={(e) => setForgotForm({ ...forgotForm, email: e.target.value })}
                  disabled={forgotStep === "reset" || isSubmitting}
                />
              </div>

              {forgotStep === "reset" && (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Mã xác nhận</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={forgotForm.code}
                      onChange={(e) => setForgotForm({ ...forgotForm, code: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Mật khẩu mới</label>
                    <input
                      type="password"
                      className={styles.formInput}
                      placeholder="Ít nhất 6 ký tự"
                      value={forgotForm.newPassword}
                      onChange={(e) => setForgotForm({ ...forgotForm, newPassword: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Xác nhận mật khẩu</label>
                    <input
                      type="password"
                      className={styles.formInput}
                      value={forgotForm.confirmPassword}
                      onChange={(e) => setForgotForm({ ...forgotForm, confirmPassword: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </>
              )}

              <button type="submit" className={styles.btnPrimary} disabled={isSubmitting}>
                {isSubmitting
                  ? "Đang xử lý..."
                  : forgotStep === "email"
                    ? "Gửi mã xác nhận"
                    : "Đặt lại mật khẩu"}
              </button>

              {forgotStep === "reset" && (
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={handleForgotPassword}
                  disabled={isSubmitting}
                >
                  Gửi lại mã
                </button>
              )}

              <p className={styles.termsNote}>
                Đã nhớ mật khẩu? <a onClick={backToLogin}>Đăng nhập</a>
              </p>
            </form>
          )}

          {activeTab === "register" && (
            <form onSubmit={handleRegister} className={styles.formSection}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Họ và tên</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={registerForm.fullName}
                  onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email</label>
                <input
                  type="email"
                  className={styles.formInput}
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Số điện thoại</label>
                <input
                  type="tel"
                  className={styles.formInput}
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
                {registerForm.password.length > 0 && registerForm.password.length < 6 && (
                  <span className={styles.errorMessage}>Mật khẩu phải có ít nhất 6 ký tự</span>
                )}
              </div>

              <button type="submit" className={styles.btnPrimary} disabled={isSubmitting}>
                {isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
              </button>

              <p className={styles.termsNote} style={{ marginTop: "0.75rem" }}>
                Bằng cách đăng ký, bạn đồng ý với <a>Điều khoản dịch vụ</a> và{" "}
                <a>Chính sách bảo mật</a>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
