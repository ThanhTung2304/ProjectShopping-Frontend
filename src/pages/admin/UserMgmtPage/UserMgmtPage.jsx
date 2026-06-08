import { useEffect, useMemo, useRef, useState } from "react";
import userApi from "../../../api/userApi";
import { getId, getList, normalizeRole, safeText } from "../adminPageUtils";
import styles from "../AdminPages.module.css";

const getUserName = (user) =>
  user.fullName || user.name || user.username || `${user.firstName || ""} ${user.lastName || ""}`.trim();

const getUserRole = (user) => normalizeRole(user.role || user.roles?.[0] || user.authorities?.[0]) || "customer";

const getUserStatusText = (user) => {
  const status = String(user.status || "").toLowerCase();
  if (status === "blocked") return "Bị khóa";
  if (status === "inactive" || user.enabled === false) return "Tạm ngưng";
  return "Hoạt động";
};

const getUserStatusClass = (user) => {
  if (getUserStatusText(user) !== "Hoạt động") return styles.statusDanger;
  return styles.statusSuccess;
};

export default function UserMgmtPage() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const didFetchRef = useRef(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await userApi.adminGetAll();
      setUsers(getList(res));
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Không thể tải danh sách tài khoản.");
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
    const id = getId(user);
    const nextStatus = getUserStatusText(user) === "Hoạt động" ? "BLOCKED" : "ACTIVE";

    setUpdatingId(id);
    try {
      await userApi.adminUpdateStatus(id, nextStatus);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Không thể cập nhật trạng thái tài khoản.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleRole = async (user) => {
    const id = getId(user);
    const nextRole = getUserRole(user) === "admin" ? "CUSTOMER" : "ADMIN";

    setUpdatingId(id);
    try {
      await userApi.adminUpdateRole(id, nextRole);
      await fetchUsers();
    } catch (err) {
      if (err.response?.status === 403) {
        setError("Backend từ chối đổi vai trò tài khoản. Tài khoản admin hiện tại có thể chưa đủ quyền cho thao tác này.");
      } else {
        setError(err.response?.data?.message || err.message || "Không thể cập nhật vai trò tài khoản.");
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (user) => {
    const id = getId(user);
    const confirmed = window.confirm(`Xóa tài khoản ${getUserName(user) || user.email || id}?`);
    if (!confirmed) return;

    setUpdatingId(id);
    try {
      await userApi.adminDelete(id);
      await fetchUsers();
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
          <p>Theo dõi tài khoản khách hàng, trạng thái hoạt động và phân quyền.</p>
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
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm tên, email, vai trò..."
          />
        </div>

        {loading && <div className={styles.loading}>Đang tải tài khoản...</div>}
        {error && <div className={styles.error}>{error}</div>}
        {!loading && !error && filteredUsers.length === 0 && (
          <div className={styles.empty}>Không có tài khoản phù hợp.</div>
        )}

        {!loading && filteredUsers.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
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
                  const id = getId(user);
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
                          <button className={styles.ghostBtn} type="button" disabled={disabled} onClick={() => handleToggleStatus(user)}>
                            {getUserStatusText(user) === "Hoạt động" ? "Khóa" : "Mở"}
                          </button>
                          <button className={styles.ghostBtn} type="button" disabled={disabled} onClick={() => handleToggleRole(user)}>
                            {getUserRole(user) === "admin" ? "Customer" : "Admin"}
                          </button>
                          <button className={styles.ghostBtn} type="button" disabled={disabled} onClick={() => handleDelete(user)}>
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
    </section>
  );
}
