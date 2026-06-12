import { useEffect, useMemo, useState } from "react";
import categoryApi from "../../../api/categoryApi";
import productApi from "../../../api/productApi";
import Modal from "../../../components/common/Modal/Modal";
import { formatStock, getId, getItem, getList, getProductDisplayPrice, safeText } from "../adminPageUtils";
import styles from "../AdminPages.module.css";

const initialForm = {
  name: "",
  slug: "",
  description: "",
  categoryId: "",
  featured: false,
  isActive: true,
  variants: [],
};

const initialNewVariant = {
  size: "",
  color: "",
  sku: "",
  price: "",
  salePrice: "",
  stockQuantity: 0,
};

// Tạo slug từ tên sản phẩm (tiếng Việt → Latin)
const generateSlug = (name) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const fetchProductList = async () => getList(await productApi.getAll());

const flattenCategories = (items = []) =>
  items.flatMap((category) => [category, ...flattenCategories(category.children || [])]);

const findCategoryIdByName = (categories, categoryName) => {
  if (!categoryName) return "";
  const match = categories.find((category) => category.name === categoryName);
  return match ? getId(match) : "";
};

const getCategoryId = (product, categories = []) =>
  product?.categoryId ||
  product?.category_id ||
  product?.category?.id ||
  product?.category?._id ||
  findCategoryIdByName(categories, product?.categoryName) ||
  "";

const getActiveValue = (item) => item?.isActive ?? item?.is_active ?? item?.active ?? true;

const getFeaturedValue = (product) =>
  product?.featured ?? product?.isFeatured ?? product?.is_featured ?? product?.bestSeller ?? false;

const getVariantSalePrice = (variant) => variant?.salePrice ?? variant?.sale_price ?? "";

const buildVariantForm = (variant) => ({
  id: getId(variant),
  size: variant?.size || "",
  color: variant?.color || "",
  sku: variant?.sku || "",
  price: variant?.price ?? "",
  salePrice: getVariantSalePrice(variant),
  stockQuantity: variant?.stockQuantity ?? variant?.stock_quantity ?? variant?.stock ?? 0,
  isActive: getActiveValue(variant),
});

const buildProductForm = (product, categories = []) => ({
  name: product?.name || "",
  slug: product?.slug || "",
  description: product?.description || "",
  categoryId: getCategoryId(product, categories),
  featured: getFeaturedValue(product),
  isActive: getActiveValue(product),
  variants: Array.isArray(product?.variants) ? product.variants.map(buildVariantForm) : [],
});

const buildProductPayload = (form) => ({
  name: form.name.trim(),
  slug: form.slug.trim() || generateSlug(form.name),
  description: form.description.trim(),
  categoryId: Number(form.categoryId),
  featured: form.featured,
  isActive: form.isActive,
});

const buildVariantPayload = (variant) => ({
  size: variant.size,
  color: variant.color,
  price: Number(variant.price || 0),
  salePrice: variant.salePrice === "" ? null : Number(variant.salePrice),
  stockQuantity: Number(variant.stockQuantity || 0),
  sku: variant.sku,
  isActive: variant.isActive ?? true,
});

const validateNewVariant = (v) => {
  if (!v.size.trim()) return "Vui lòng nhập size.";
  if (!v.color.trim()) return "Vui lòng nhập màu sắc.";
  if (!v.sku.trim()) return "Vui lòng nhập SKU.";
  if (v.price === "" || Number(v.price) <= 0) return "Giá bán phải lớn hơn 0.";
  if (v.salePrice !== "" && Number(v.salePrice) < 0) return "Giá sale không được âm.";
  if (Number(v.stockQuantity) < 0) return "Số lượng không được âm.";
  return "";
};

export default function ProductMgmtPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // State cho form thêm biến thể mới
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [newVariant, setNewVariant] = useState(initialNewVariant);
  const [newVariantError, setNewVariantError] = useState("");
  const [addingVariant, setAddingVariant] = useState(false);

  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);

  const loadProducts = async () => {
    setLoading(true);
    setError("");
    try {
      setProducts(await fetchProductList());
    } catch (err) {
      setError(err.message || "Không thể tải danh sách sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadProducts(); }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategories(getList(await categoryApi.getAll()));
      } catch {
        setCategories([]);
      }
    };
    void fetchCategories();
  }, []);

  const filteredProducts = useMemo(
    () => products.filter((product) => product.name?.toLowerCase().includes(query.toLowerCase())),
    [products, query],
  );

  const openEditModal = async (product) => {
    setEditingProduct(product);
    setForm(buildProductForm(product, flatCategories));
    setFormError("");
    setShowAddVariant(false);
    setNewVariant(initialNewVariant);
    setNewVariantError("");

    const productId = getId(product);
    if (!productId) return;

    try {
      const detail = getItem(await productApi.getById(productId));
      if (detail) {
        const mergedProduct = { ...product, ...detail };
        setEditingProduct(mergedProduct);
        setForm(buildProductForm(mergedProduct, flatCategories));
      }
    } catch {
      setFormError("Không tải được chi tiết sản phẩm. Bạn vẫn có thể sửa dữ liệu đang hiển thị.");
    }
  };

  const closeEditModal = () => {
    if (saving || addingVariant) return;
    setEditingProduct(null);
    setForm(initialForm);
    setFormError("");
    setShowAddVariant(false);
    setNewVariant(initialNewVariant);
    setNewVariantError("");
  };

  const updateForm = (field, value) => {
    setForm((current) => {
      const updated = { ...current, [field]: value };
      if (field === "name" && (!current.slug || current.slug === generateSlug(current.name))) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
  };

  const updateVariantForm = (variantId, field, value) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant) =>
        String(variant.id) === String(variantId) ? { ...variant, [field]: value } : variant,
      ),
    }));
  };

  const updateNewVariant = (field, value) => {
    setNewVariant((current) => ({ ...current, [field]: value }));
  };

  // Thêm biến thể mới vào sản phẩm đang sửa
  const handleAddVariant = async () => {
    const validationMessage = validateNewVariant(newVariant);
    if (validationMessage) {
      setNewVariantError(validationMessage);
      return;
    }

    const productId = getId(editingProduct);
    if (!productId) return;

    setAddingVariant(true);
    setNewVariantError("");

    try {
      const payload = {
        size: newVariant.size.trim(),
        color: newVariant.color.trim(),
        sku: newVariant.sku.trim(),
        price: Number(newVariant.price),
        salePrice: newVariant.salePrice === "" ? null : Number(newVariant.salePrice),
        stockQuantity: Number(newVariant.stockQuantity || 0),
        isActive: true,
      };

      const created = getItem(await productApi.addVariant(productId, payload));

      // Thêm variant mới vào form state ngay lập tức (không cần reload toàn bộ)
      if (created) {
        setForm((current) => ({
          ...current,
          variants: [...current.variants, buildVariantForm(created)],
        }));
      }

      setNewVariant(initialNewVariant);
      setShowAddVariant(false);
    } catch (err) {
      setNewVariantError(err?.response?.data?.message || err.message || "Không thể thêm biến thể.");
    } finally {
      setAddingVariant(false);
    }
  };

  const validateForm = () => {
    if (!getId(editingProduct)) return "Không tìm thấy mã sản phẩm để cập nhật.";
    if (!form.name.trim()) return "Vui lòng nhập tên sản phẩm.";
    if (!form.categoryId) return "Vui lòng chọn loại sản phẩm.";

    const invalidVariant = form.variants.find(
      (variant) =>
        variant.price === "" ||
        Number(variant.price) < 0 ||
        (variant.salePrice !== "" && Number(variant.salePrice) < 0),
    );

    if (invalidVariant) {
      return "Giá bán không được trống. Giá bán và giá sale không được nhỏ hơn 0.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    const productId = getId(editingProduct);
    const editableVariants = form.variants.filter((variant) => variant.id);

    setSaving(true);
    setFormError("");

    try {
      await productApi.update(productId, buildProductPayload(form));
      await Promise.all(
        editableVariants.map((variant) => productApi.updateVariant(variant.id, buildVariantPayload(variant))),
      );

      await loadProducts();
      closeEditModal();
    } catch (err) {
      setFormError(err?.response?.data?.message || err.message || "Không thể cập nhật sản phẩm.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Products</p>
          <h1>Quản lý sản phẩm</h1>
          <p>Kiểm tra sản phẩm, giá và tồn kho theo product variants.</p>
        </div>
        <button className={styles.primaryBtn} type="button">
          Thêm sản phẩm
        </button>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2>Danh sách sản phẩm</h2>
          <input
            className={styles.searchInput}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm sản phẩm..."
          />
        </div>

        {loading && <div className={styles.loading}>Đang tải sản phẩm...</div>}
        {error && <div className={styles.error}>{error}</div>}
        {!loading && !error && filteredProducts.length === 0 && (
          <div className={styles.empty}>Không có sản phẩm phù hợp.</div>
        )}

        {!loading && !error && filteredProducts.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tên sản phẩm</th>
                  <th>Danh mục</th>
                  <th>Giá</th>
                  <th>Tồn kho</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const isActive = getActiveValue(product);
                  return (
                    <tr key={getId(product)}>
                      <td className={styles.nameCell}>{product.name}</td>
                      <td>{safeText(product.categoryName || product.category?.name)}</td>
                      <td>{getProductDisplayPrice(product)}</td>
                      <td>{formatStock(product)}</td>
                      <td>
                        <span className={`${styles.status} ${isActive ? styles.statusSuccess : styles.statusDanger}`}>
                          {isActive ? "Đang bán" : "Đã ẩn"}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionRow}>
                          <button className={styles.ghostBtn} type="button" onClick={() => openEditModal(product)}>
                            Sửa
                          </button>
                          <button className={styles.ghostBtn} type="button">
                            {isActive ? "Ẩn" : "Hiện"}
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
        isOpen={Boolean(editingProduct)}
        onClose={closeEditModal}
        title="Sửa sản phẩm"
        footer={
          <>
            <button className={styles.ghostBtn} type="button" onClick={closeEditModal} disabled={saving || addingVariant}>
              Hủy
            </button>
            <button className={styles.primaryBtn} type="submit" form="edit-product-form" disabled={saving || addingVariant}>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </>
        }
      >
        <form id="edit-product-form" className={styles.formGrid} onSubmit={handleSubmit}>
          {formError && <div className={styles.formError}>{formError}</div>}

          <label className={styles.field}>
            <span>Tên sản phẩm</span>
            <input value={form.name} onChange={(event) => updateForm("name", event.target.value)} />
          </label>

          <label className={styles.field}>
            <span>Slug (URL)</span>
            <input
              value={form.slug}
              onChange={(event) => updateForm("slug", event.target.value)}
              placeholder="tu-dong-tao-tu-ten"
            />
          </label>

          <label className={styles.field}>
            <span>Loại sản phẩm</span>
            <select value={form.categoryId} onChange={(event) => updateForm("categoryId", event.target.value)}>
              <option value="">Chọn loại sản phẩm</option>
              {flatCategories.map((category) => (
                <option
                  key={getId(category)}
                  value={getId(category)}
                  disabled={Boolean(!category.parentId && category.children?.length)}
                >
                  {category.parentId ? category.name : `${category.name} (nhóm)`}
                </option>
              ))}
            </select>
          </label>

          <label className={`${styles.field} ${styles.fullField}`}>
            <span>Mô tả</span>
            <textarea value={form.description} onChange={(event) => updateForm("description", event.target.value)} />
          </label>

          <label className={`${styles.checkboxField} ${styles.fullField}`}>
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(event) => updateForm("featured", event.target.checked)}
            />
            <span>Bán chạy</span>
          </label>

          {/* ===== VARIANT EDITOR ===== */}
          <div className={`${styles.fullField} ${styles.variantEditor}`}>
            <div className={styles.variantHeader}>
              <span>Giá theo biến thể</span>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <small>{form.variants.length ? `${form.variants.length} biến thể` : "Chưa có biến thể"}</small>
                <button
                  type="button"
                  className={styles.ghostBtn}
                  onClick={() => { setShowAddVariant((v) => !v); setNewVariantError(""); }}
                  disabled={saving || addingVariant}
                >
                  {showAddVariant ? "Hủy thêm" : "+ Thêm biến thể"}
                </button>
              </div>
            </div>

            {/* Form thêm biến thể mới */}
            {showAddVariant && (
              <div className={styles.addVariantForm}>
                {newVariantError && <div className={styles.formError}>{newVariantError}</div>}

                <div className={styles.variantRow}>
                  <label className={styles.compactField}>
                    <span>Size *</span>
                    <input
                      value={newVariant.size}
                      onChange={(e) => updateNewVariant("size", e.target.value)}
                      placeholder="S, M, L, XL..."
                    />
                  </label>

                  <label className={styles.compactField}>
                    <span>Màu sắc *</span>
                    <input
                      value={newVariant.color}
                      onChange={(e) => updateNewVariant("color", e.target.value)}
                      placeholder="Đen, Trắng..."
                    />
                  </label>

                  <label className={styles.compactField}>
                    <span>SKU *</span>
                    <input
                      value={newVariant.sku}
                      onChange={(e) => updateNewVariant("sku", e.target.value)}
                      placeholder="SP001-M-DEN"
                    />
                  </label>

                  <label className={styles.compactField}>
                    <span>Giá bán *</span>
                    <input
                      type="number"
                      min="0"
                      value={newVariant.price}
                      onChange={(e) => updateNewVariant("price", e.target.value)}
                      placeholder="299000"
                    />
                  </label>

                  <label className={styles.compactField}>
                    <span>Giá sale</span>
                    <input
                      type="number"
                      min="0"
                      value={newVariant.salePrice}
                      onChange={(e) => updateNewVariant("salePrice", e.target.value)}
                      placeholder="Không sale"
                    />
                  </label>

                  <label className={styles.compactField}>
                    <span>Tồn kho</span>
                    <input
                      type="number"
                      min="0"
                      value={newVariant.stockQuantity}
                      onChange={(e) => updateNewVariant("stockQuantity", e.target.value)}
                    />
                  </label>
                </div>

                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={handleAddVariant}
                  disabled={addingVariant}
                  style={{ marginTop: "8px" }}
                >
                  {addingVariant ? "Đang thêm..." : "Xác nhận thêm biến thể"}
                </button>
              </div>
            )}

            {/* Danh sách biến thể hiện có */}
            {form.variants.length === 0 && !showAddVariant && (
              <p className={styles.variantEmpty}>Sản phẩm này chưa có biến thể. Nhấn &quot;+ Thêm biến thể&quot; để tạo mới.</p>
            )}

            {form.variants.length > 0 && (
              <div className={styles.variantList}>
                {form.variants.map((variant) => (
                  <div className={styles.variantRow} key={variant.id || `${variant.size}-${variant.color}`}>
                    <div className={styles.variantMeta}>
                      <strong>{[variant.size, variant.color].filter(Boolean).join(" / ") || "Biến thể"}</strong>
                      <span>{variant.sku || "Chưa có SKU"}</span>
                    </div>

                    <label className={styles.compactField}>
                      <span>Giá bán</span>
                      <input
                        min="0"
                        type="number"
                        value={variant.price}
                        onChange={(event) => updateVariantForm(variant.id, "price", event.target.value)}
                      />
                    </label>

                    <label className={styles.compactField}>
                      <span>Giá sale</span>
                      <input
                        min="0"
                        type="number"
                        value={variant.salePrice}
                        onChange={(event) => updateVariantForm(variant.id, "salePrice", event.target.value)}
                        placeholder="Không sale"
                      />
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </Modal>
    </section>
  );
}