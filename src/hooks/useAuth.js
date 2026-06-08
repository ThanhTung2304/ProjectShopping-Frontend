import { useContext, useState } from "react";
import authApi from "../api/authApi";
import { AuthContext } from "../context/authContextValue";

export function useAuth() {
  const context = useContext(AuthContext);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  const signIn = async ({ email, password }) => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await authApi.login({ email, password });
      if (!res.success) throw new Error(res.message || "Đăng nhập thất bại");

      localStorage.setItem("token", res.data.token);
      context.login(res.data.user);
      return res;
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại");
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const signUp = async (formData) => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await authApi.register(formData);
      if (!res.success) throw new Error(res.message || "Đăng ký thất bại");

      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
        context.login(res.data.user);
      }

      return res;
    } catch (err) {
      setError(err.message || "Đăng ký thất bại");
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const getToken = () => localStorage.getItem("token");

  return {
    ...context,
    signIn,
    signUp,
    getToken,
    submitting,
    error,
  };
}

export default useAuth;
