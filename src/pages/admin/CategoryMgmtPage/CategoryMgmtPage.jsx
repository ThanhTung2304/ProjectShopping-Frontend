import { useEffect, useMemo, useRef, useState } from "react";
import categoryApi from "../../../api/categoryApi";
import Modal from "../../../components/common/Modal/Modal";
import { resolveImageUrl } from "../../../utils/productUtils";
import { getId, getItem, getList, safeText } from "../adminPageUtils";
import styles from "../AdminPages.module.css";

const initialForm = {
  name: "",
  slug: "",
  parentId: "",
  imageUrl: "",
  isActive: true,
};

const generateSlug = (name) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const flattenCategories = (items = [], level = 0) =>
  items.flatMap((category) => [
    { ...category, level },
    ...flattenCategories(category.children || [], level + 1),
  ]);

const buildForm = (category) => ({
  name: category?.name || "",
  slug: category?.slug || "",
  parentId: category?.parentId || "",
  imageUrl: category?.imageUrl || category?.image_url || category?.image || category?.img || category?.thumbnail || "",
  isActive: category?.isActive ?? true,
});

const buildPayload = (form) => ({
  name: form.name.trim(),
  slug: form.slug.trim() || generateSlug(form.name),
  parentId: form.parentId ? Number(form.parentId) : null,
  imageUrl: form.imageUrl.trim() || null,
  isActive: Boolean(form.isActive),
});

export default function CategoryMgmtPage() {
  const imageInputRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalMode, setModalMode] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");

  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);

  const filteredCategories = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return flatCategories;

    return flatCategories.filter((category) =>
      [category.name, category.slug, category.parentName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [flatCategories, query]);

  const parentOptions = useMemo(() => {
    const editingId = editingCategory ? String(getId(editingCategory)) : "";
    return flatCategories.filter((category) => String(getId(category)) !== editingId);
  }, [editingCategory, flatCategories]);

  const loadCategories = async () => {
    setLoading(true);
    setError("");
    try {
      setCategories(getList(await categoryApi.getAll()));
    } catch (err) {
      setError(err.message || "Không thể tải danh mục.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  const resetModal = () => {
    setModalMode("");
    setEditingCategory(null);
    setForm(initialForm);
    setFormError("");
    setImageFile(null);
    setImagePreviewUrl("");
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditingCategory(null);
    setForm(initialForm);
    setFormError("");
    setImageFile(null);
    setImagePreviewUrl("");
  };

  const openEditModal = (category) => {
    setModalMode("edit");
    setEditingCategory(category);
    setForm(buildForm(category));
    setFormError("");
    setImageFile(null);
    setImagePreviewUrl("");
  };

  const updateForm = (field, value) => {
    setForm((current) => {
      const updated = { ...current, [field]: value };
      if (field === "name" && (!current.slug || current.slug === generateSlug(current.name))) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });

    if (field === "imageUrl") {
      setImageFile(null);
      setImagePreviewUrl("");
    }
  };

  const handleImageFileChange = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Vui long chon file anh hop le.");
      return;
    }

    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setFormError("");
  };

  const clearImage = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(null);
    setImagePreviewUrl("");
    updateForm("imageUrl", "");
  };
  const validateForm = () => {
    if (!form.name.trim()) return "Vui lòng nhập tên danh mục.";
    if (!buildPayload(form).slug) return "Vui lòng nhập slug hoặc tên danh mục hợp lệ.";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const payload = buildPayload(form);
      let savedCategory;

      if (modalMode === "edit") {
        savedCategory = getItem(await categoryApi.update(getId(editingCategory), payload));
      } else {
        savedCategory = getItem(await categoryApi.create(payload));
      }

      if (imageFile) {
        const categoryId = getId(savedCategory) || getId(editingCategory);
        if (!categoryId) throw new Error("Backend khong tra ve ma danh muc vua luu.");
        await categoryApi.uploadImage(categoryId, imageFile);
      }

      await loadCategories();
      resetModal();
    } catch (err) {
      setFormError(err?.response?.data?.message || err.message || "Không thể lưu danh mục.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    const categoryId = getId(category);
    if (!categoryId) {
      setError("Không tìm thấy mã danh mục để xóa.");
      return;
    }

    if (!window.confirm(`Xóa danh mục "${category.name}"?`)) return;

    setDeletingId(categoryId);
    setError("");

    try {
      await categoryApi.delete(categoryId);
      await loadCategories();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Không thể xóa danh mục.");
    } finally {
      setDeletingId(null);
    }
  };

  const previewImageUrl = imagePreviewUrl || resolveImageUrl(form.imageUrl);

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Categories</p>
          <h1>Quản lý danh mục</h1>
          <p>Tạo danh mục cha, danh mục con và dùng trực tiếp khi thêm sản phẩm.</p>
        </div>
        <button className={styles.primaryBtn} type="button" onClick={openCreateModal}>
          Thêm danh mục
        </button>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2>Danh sách danh mục</h2>
          <input
            className={styles.searchInput}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm danh mục..."
          />
        </div>

        {loading && <div className={styles.loading}>Đang tải danh mục...</div>}
        {error && <div className={styles.error}>{error}</div>}
        {!loading && !error && filteredCategories.length === 0 && (
          <div className={styles.empty}>Chưa có danh mục phù hợp.</div>
        )}

        {!loading && !error && filteredCategories.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tên danh mục</th>
                  <th>Slug</th>
                  <th>Danh mục cha</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category) => {
                  const categoryId = getId(category);
                  const isActive = category.isActive ?? true;

                  return (
                    <tr key={categoryId}>
                      <td className={styles.nameCell}>
                        {"--".repeat(category.level || 0)}
                        {category.level ? " " : ""}
                        {category.name}
                      </td>
                      <td>{safeText(category.slug)}</td>
                      <td>{safeText(category.parentName, "Danh mục gốc")}</td>
                      <td>
                        <span className={`${styles.status} ${isActive ? styles.statusSuccess : styles.statusDanger}`}>
                          {isActive ? "Đang hiển thị" : "Đã ẩn"}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionRow}>
                          <button className={styles.ghostBtn} type="button" onClick={() => openEditModal(category)}>
                            Sửa
                          </button>
                          <button
                            className={styles.ghostBtn}
                            type="button"
                            onClick={() => handleDelete(category)}
                            disabled={String(deletingId) === String(categoryId)}
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
        isOpen={Boolean(modalMode)}
        onClose={resetModal}
        title={modalMode === "create" ? "Thêm danh mục" : "Sửa danh mục"}
        footer={
          <>
            <button className={styles.ghostBtn} type="button" onClick={resetModal} disabled={saving}>
              Hủy
            </button>
            <button className={styles.primaryBtn} type="submit" form="category-form" disabled={saving}>
              {saving ? "Đang lưu..." : modalMode === "create" ? "Thêm danh mục" : "Lưu thay đổi"}
            </button>
          </>
        }
      >
        <form id="category-form" className={styles.formGrid} onSubmit={handleSubmit}>
          {formError && <div className={styles.formError}>{formError}</div>}

          <label className={styles.field}>
            <span>Tên danh mục</span>
            <input value={form.name} onChange={(event) => updateForm("name", event.target.value)} />
          </label>

          <label className={styles.field}>
            <span>Slug</span>
            <input
              value={form.slug}
              onChange={(event) => updateForm("slug", event.target.value)}
              placeholder="ao-thun"
            />
          </label>

          <label className={styles.field}>
            <span>Danh mục cha</span>
            <select value={form.parentId} onChange={(event) => updateForm("parentId", event.target.value)}>
              <option value="">Danh mục gốc</option>
              {parentOptions.map((category) => (
                <option key={getId(category)} value={getId(category)}>
                  {"--".repeat(category.level || 0)}
                  {category.level ? " " : ""}
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>URL ảnh</span>
            <input
              value={form.imageUrl}
              onChange={(event) => updateForm("imageUrl", event.target.value)}
              placeholder="https://..."
            />
            <div className={styles.categoryImagePicker}>
              <div className={styles.imagePreview}>
                {previewImageUrl ? <img src={previewImageUrl} alt="" /> : <span>Ảnh</span>}
              </div>
              <div className={styles.categoryImageActions}>
                <button
                  className={styles.ghostBtn}
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={saving}
                >
                  Chọn ảnh
                </button>
                {(previewImageUrl || imageFile) && (
                  <button
                    className={styles.ghostBtn}
                    type="button"
                    onClick={clearImage}
                    disabled={saving}
                  >
                    Xóa ảnh
                  </button>
                )}
              </div>
              <input
                ref={imageInputRef}
                className={styles.hiddenFileInput}
                type="file"
                accept="image/*"
                onChange={(event) => handleImageFileChange(event.target.files?.[0])}
              />
            </div>
          </label>

          <label className={`${styles.checkboxField} ${styles.fullField}`}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => updateForm("isActive", event.target.checked)}
            />
            <span>Hiển thị danh mục này</span>
          </label>
        </form>
      </Modal>
    </section>
  );
}
