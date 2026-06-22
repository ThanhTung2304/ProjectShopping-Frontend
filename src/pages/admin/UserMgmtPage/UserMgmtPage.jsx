import { useEffect, useMemo, useRef, useState } from "react";
import userApi from "../../../api/userApi";
import Modal from "../../../components/common/Modal/Modal";
import { getList, normalizeRole, safeText } from "../adminPageUtils";
import styles from "../AdminPages.module.css";

const getUserName = (user) =>
  user?.fullName || user?.name || user?.username || `${user?.firstName || ""} ${user?.lastName || ""}`.trim();

const getUserId = (user) =>
  user?.accountId ||
  user?.account_id ||
  user?.account?.id ||
  user?.userId ||
  user?.user_id ||
  user?.id ||
  user?._id;

const getUserRole = (user) => normalizeRole(user.role || user.roles?.[0] || user.authorities?.[0]) || "customer";

const getUserStatusValue = (user) => {
  const status = String(user?.status || "").toUpperCase();
  if (status === "BLOCKED" || status === "INACTIVE") return "BLOCKED";
  if (user?.enabled === false) return "BLOCKED";
  return "ACTIVE";
};

const getUserStatusText = (user) => {
  return getUserStatusValue(user) === "BLOCKED" ? "Bị khóa" : "Hoạt động";
};

const getUserStatusClass = (user) =>
  getUserStatusValue(user) === "ACTIVE" ? styles.statusSuccess : styles.statusDanger;

export default function UserMgmtPage() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "CUSTOMER",
    status: "ACTIVE",
    password: "",
    confirmPassword: "",
  });
  const [editError, setEditError] = useState("");
  const [deletingUser, setDeletingUser] = useState(null);
  const didFetchRef = useRef(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const userList = getList(await userApi.adminGetAll());
      setUsers(userList);
      return userList;
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Không thể tải danh sách tài khoản.");
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    void fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return users;

    return users.filter((user) =>
      `${getUserName(user)} ${user.email || ""} ${user.phone || ""} ${getUserRole(user)}`
        .toLowerCase()
        .includes(keyword),
    );
  }, [users, query]);

  const handleToggleStatus = async (user) => {
    const id = getUserId(user);
    const nextStatus = getUserStatusValue(user) === "ACTIVE" ? "BLOCKED" : "ACTIVE";

    setUpdatingId(id);
    try {
      if (nextStatus === "BLOCKED") {
        await userApi.adminSoftDelete(id);
      } else {
        await userApi.adminUpdateStatus(id, nextStatus);
      }
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Không thể cập nhật trạng thái tài khoản.");
    } finally {
      setUpdatingId(null);
    }
  };

  const openEditModal = (user) => {
    setError("");
    setEditError("");
    setEditingUser(user);
    setEditForm({
      fullName: getUserName(user) || "",
      email: user?.email || "",
      phone: user?.phone || "",
      role: getUserRole(user).toUpperCase(),
      status: getUserStatusValue(user),
      password: "",
      confirmPassword: "",
    });
  };

  const closeEditModal = () => {
    if (updatingId) return;
    setEditingUser(null);
    setEditError("");
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();

    const id = getUserId(editingUser);
    if (!id) {
      setEditError("Không tìm thấy mã tài khoản để cập nhật.");
      return;
    }

    if (editForm.password && editForm.password.length < 6) {
      setEditError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    if (editForm.password !== editForm.confirmPassword) {
      setEditError("Mật khẩu xác nhận không khớp.");
      return;
    }

    const payload = {
      fullName: editForm.fullName.trim(),
      email: editForm.email.trim(),
      phone: editForm.phone.trim(),
      role: editForm.role,
      status: editForm.status,
    };

    setUpdatingId(id);
    setEditError("");
    try {
      await userApi.adminUpdate(id, payload);
      if (editForm.password) {
        await userApi.adminChangePassword(id, editForm.password);
      }
      await fetchUsers();
      setEditingUser(null);
    } catch (err) {
      const status = err.response?.status;
      const fallbackMessage =
        editForm.password && (status === 404 || status === 405)
          ? "Backend chưa hỗ trợ API admin đổi mật khẩu: PATCH /api/admin/users/{id}/password."
          : "Không thể cập nhật tài khoản.";
      setEditError(err.response?.data?.message || err.message || fallbackMessage);
    } finally {
      setUpdatingId(null);
    }
  };

  const openDeleteModal = (user) => {
    setError("");
    setDeletingUser(user);
  };

  const closeDeleteModal = () => {
    if (updatingId) return;
    setDeletingUser(null);
  };

  const handleDelete = async () => {
    const id = getUserId(deletingUser);
    if (!id) {
      setError("Không tìm thấy mã tài khoản để xóa.");
      return;
    }

    setUpdatingId(id);
    try {
      await userApi.adminHardDelete(id);
      const nextUsers = await fetchUsers();
      const stillExists = nextUsers.some((user) => String(getUserId(user)) === String(id));
      if (stillExists) {
        setError("Backend đã phản hồi xóa cứng nhưng tài khoản vẫn còn trong danh sách. Vui lòng kiểm tra endpoint DELETE /api/admin/users/{id}/hard.");
        return;
      }
      setDeletingUser(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Không thể xóa tài khoản.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Users</p>
          <h1>Quản lý tài khoản</h1>
          <p>Theo dõi tài khoản, trạng thái hoạt động và phân quyền.</p>
        </div>
        <button className={styles.primaryBtn} type="button" onClick={fetchUsers}>
          Làm mới
        </button>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2>Danh sách tài khoản</h2>
          <input
            className={styles.searchInput}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm tên, email, vai trò..."
          />
        </div>

        {loading && <div className={styles.loading}>Đang tải tài khoản...</div>}
        {error && <div className={styles.error}>{error}</div>}
        {!loading && !error && filteredUsers.length === 0 && (
          <div className={styles.empty}>Không có tài khoản phù hợp.</div>
        )}

        {!loading && filteredUsers.length > 0 && (
          <div className={`${styles.tableWrap} ${styles.userTableWrap}`}>
            <table className={`${styles.table} ${styles.userTable}`}>
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>Email</th>
                  <th>Số điện thoại</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const id = getUserId(user);
                  const disabled = updatingId === id;

                  return (
                    <tr key={id}>
                      <td className={styles.nameCell}>{safeText(getUserName(user))}</td>
                      <td>{safeText(user.email)}</td>
                      <td>{safeText(user.phone)}</td>
                      <td>{getUserRole(user)}</td>
                      <td>
                        <span className={`${styles.status} ${getUserStatusClass(user)}`}>
                          {getUserStatusText(user)}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionRow}>
                          <button
                            className={styles.ghostBtn}
                            type="button"
                            disabled={disabled}
                            onClick={() => openEditModal(user)}
                          >
                            Sửa
                          </button>
                          <button
                            className={styles.ghostBtn}
                            type="button"
                            disabled={disabled}
                            onClick={() => handleToggleStatus(user)}
                          >
                            {getUserStatusValue(user) === "ACTIVE" ? "Khóa" : "Mở"}
                          </button>
                          <button
                            className={styles.ghostBtn}
                            type="button"
                            disabled={disabled}
                            onClick={() => openDeleteModal(user)}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={Boolean(editingUser)}
        onClose={closeEditModal}
        title="Sửa tài khoản"
        footer={
          <>
            <button className={styles.ghostBtn} type="button" onClick={closeEditModal} disabled={Boolean(updatingId)}>
              Hủy
            </button>
            <button
              className={styles.primaryBtn}
              type="submit"
              form="admin-user-edit-form"
              disabled={Boolean(updatingId)}
            >
              {updatingId ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </>
        }
      >
        <form id="admin-user-edit-form" className={styles.formGrid} onSubmit={handleEditSubmit}>
          {editError && <div className={styles.formError}>{editError}</div>}

          <label className={styles.field}>
            Họ tên
            <input name="fullName" value={editForm.fullName} onChange={handleEditChange} required />
          </label>

          <label className={styles.field}>
            Email
            <input name="email" type="email" value={editForm.email} onChange={handleEditChange} required />
          </label>

          <label className={styles.field}>
            Số điện thoại
            <input name="phone" value={editForm.phone} onChange={handleEditChange} />
          </label>

          <label className={styles.field}>
            Vai trò
            <select name="role" value={editForm.role} onChange={handleEditChange}>
              <option value="CUSTOMER">Customer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>

          <label className={styles.field}>
            Trạng thái
            <select name="status" value={editForm.status} onChange={handleEditChange}>
              <option value="ACTIVE">Hoạt động</option>
              <option value="BLOCKED">Bị khóa</option>
            </select>
          </label>

          <div className={`${styles.fullField} ${styles.formSection}`}>
            <div className={styles.formSectionHeader}>
              <strong>Đổi mật khẩu</strong>
              <span>Để trống nếu bạn không muốn thay đổi mật khẩu.</span>
            </div>

            <div className={styles.formSectionGrid}>
              <label className={styles.field}>
                Mật khẩu mới
                <input
                  name="password"
                  type="password"
                  value={editForm.password}
                  onChange={handleEditChange}
                  placeholder="Tối thiểu 6 ký tự"
                  autoComplete="new-password"
                />
              </label>

              <label className={styles.field}>
                Xác nhận mật khẩu
                <input
                  name="confirmPassword"
                  type="password"
                  value={editForm.confirmPassword}
                  onChange={handleEditChange}
                  placeholder="Nhập lại mật khẩu mới"
                  autoComplete="new-password"
                />
              </label>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(deletingUser)}
        onClose={closeDeleteModal}
        title="Xóa tài khoản"
        footer={
          <>
            <button className={styles.ghostBtn} type="button" onClick={closeDeleteModal} disabled={Boolean(updatingId)}>
              Hủy
            </button>
            <button className={styles.primaryBtn} type="button" onClick={handleDelete} disabled={Boolean(updatingId)}>
              {updatingId ? "Đang xóa..." : "Xóa tài khoản"}
            </button>
          </>
        }
      >
        <p className={styles.muted}>
          Bạn có chắc muốn xóa tài khoản{" "}
          <strong>{getUserName(deletingUser) || deletingUser?.email || getUserId(deletingUser) || "này"}</strong>? Thao tác này sẽ
          gọi API xóa tài khoản từ backend.
        </p>
      </Modal>
    </section>
  );
}
