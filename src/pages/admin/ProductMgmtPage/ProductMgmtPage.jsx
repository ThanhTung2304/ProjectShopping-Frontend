import { useEffect, useMemo, useState } from "react";
import categoryApi from "../../../api/categoryApi";
import productApi from "../../../api/productApi";
import Modal from "../../../components/common/Modal/Modal";
import { formatStock, getId, getItem, getList, getProductDisplayPrice, getProductStock, safeText } from "../adminPageUtils";
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

const initialVariant = {
  size: "",
  color: "",
  sku: "",
  price: "",
  salePrice: "",
  stockQuantity: 0,
  isActive: true,
};

const FEATURED_PRODUCTS_KEY = "featuredProductIds";

const generateSlug = (name) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const fetchProductVariants = async (product) => {
  const productId = getId(product);
  if (!productId) return [];

  const attempts = [
    () => productApi.getVariantsById(productId),
    () => productApi.getVariants(productId),
  ];

  for (const attempt of attempts) {
    try {
      const variants = getList(await attempt());
      if (variants.length > 0) return variants;
    } catch {
      // Try the next supported variants route.
    }
  }

  return [];
};

const fetchProductList = async () => {
  const products = getList(await productApi.getAll());

  return Promise.all(
    products.map(async (product) => {
      if (getProductStock(product) !== null) return product;

      const variants = await fetchProductVariants(product);
      return variants.length > 0 ? { ...product, variants } : product;
    }),
  );
};

const getStoredFeaturedProductIds = () => {
  try {
    return JSON.parse(localStorage.getItem(FEATURED_PRODUCTS_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveStoredFeaturedProductIds = (ids) => {
  localStorage.setItem(FEATURED_PRODUCTS_KEY, JSON.stringify([...new Set(ids.map(String))]));
};

const syncStoredFeaturedProduct = (product, isFeatured) => {
  const keys = [getId(product), product?.slug].filter(Boolean).map(String);
  if (keys.length === 0) return;

  const currentIds = getStoredFeaturedProductIds();
  const nextIds = isFeatured
    ? [...currentIds, ...keys]
    : currentIds.filter((id) => !keys.includes(String(id)));

  saveStoredFeaturedProductIds(nextIds);
};

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
  tempId: variant?.tempId,
  isNew: Boolean(variant?.isNew),
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
  isFeatured: form.featured,
  bestSeller: form.featured,
  isActive: form.isActive,
});

const buildVariantPayload = (variant) => ({
  size: variant.size.trim(),
  color: variant.color.trim(),
  price: Number(variant.price || 0),
  salePrice: variant.salePrice === "" ? null : Number(variant.salePrice),
  stockQuantity: Number(variant.stockQuantity || 0),
  sku: variant.sku.trim(),
  isActive: variant.isActive ?? true,
});

const validateVariant = (variant) => {
  if (!variant.size.trim()) return "Vui lòng nhập size.";
  if (!variant.color.trim()) return "Vui lòng nhập màu sắc.";
  if (!variant.sku.trim()) return "Vui lòng nhập SKU.";
  if (variant.price === "" || Number(variant.price) <= 0) return "Giá bán phải lớn hơn 0.";
  if (variant.salePrice !== "" && Number(variant.salePrice) < 0) return "Giá sale không được âm.";
  if (Number(variant.stockQuantity) < 0) return "Tồn kho không được âm.";
  return "";
};

export default function ProductMgmtPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalMode, setModalMode] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [newVariant, setNewVariant] = useState(initialVariant);
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

  useEffect(() => {
    void loadProducts();
  }, []);

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

  const resetModal = () => {
    setModalMode("");
    setEditingProduct(null);
    setForm(initialForm);
    setFormError("");
    setShowAddVariant(false);
    setNewVariant(initialVariant);
    setNewVariantError("");
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditingProduct(null);
    setForm(initialForm);
    setFormError("");
    setShowAddVariant(true);
    setNewVariant(initialVariant);
    setNewVariantError("");
  };

  const openEditModal = async (product) => {
    setModalMode("edit");
    setEditingProduct(product);
    setForm(buildProductForm(product, flatCategories));
    setFormError("");
    setShowAddVariant(false);
    setNewVariant(initialVariant);
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

  const closeModal = () => {
    if (saving || addingVariant) return;
    resetModal();
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

  const updateVariantForm = (variantKey, field, value) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant) =>
        String(variant.id || variant.tempId) === String(variantKey) ? { ...variant, [field]: value } : variant,
      ),
    }));
  };

  const updateNewVariant = (field, value) => {
    setNewVariant((current) => ({ ...current, [field]: value }));
  };

  const handleAddVariant = async () => {
    const validationMessage = validateVariant(newVariant);
    if (validationMessage) {
      setNewVariantError(validationMessage);
      return;
    }

    setAddingVariant(true);
    setNewVariantError("");

    try {
      const payload = buildVariantPayload(newVariant);
      const productId = getId(editingProduct);

      if (modalMode === "edit" && productId) {
        const created = getItem(await productApi.addVariant(productId, payload));
        if (created) {
          setForm((current) => ({
            ...current,
            variants: [...current.variants, buildVariantForm(created)],
          }));
        }
      } else {
        setForm((current) => ({
          ...current,
          variants: [
            ...current.variants,
            buildVariantForm({ ...payload, tempId: `new-${Date.now()}`, isNew: true }),
          ],
        }));
      }

      setNewVariant(initialVariant);
      setShowAddVariant(false);
    } catch (err) {
      setNewVariantError(err?.response?.data?.message || err.message || "Không thể thêm biến thể.");
    } finally {
      setAddingVariant(false);
    }
  };

  const validateForm = () => {
    if (modalMode === "edit" && !getId(editingProduct)) return "Không tìm thấy mã sản phẩm để cập nhật.";
    if (!form.name.trim()) return "Vui lòng nhập tên sản phẩm.";
    if (!form.categoryId) return "Vui lòng chọn loại sản phẩm.";
    if (modalMode === "create" && form.variants.length === 0) return "Vui lòng thêm ít nhất một biến thể cho sản phẩm.";

    const invalidVariant = form.variants.find(validateVariant);
    if (invalidVariant) return validateVariant(invalidVariant);

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
      if (modalMode === "create") {
        const createdProduct = getItem(await productApi.create(buildProductPayload(form)));
        const createdProductId = getId(createdProduct);
        if (!createdProductId) throw new Error("Backend không trả về mã sản phẩm vừa tạo.");

        await Promise.all(
          form.variants.map((variant) => productApi.addVariant(createdProductId, buildVariantPayload(variant))),
        );
        syncStoredFeaturedProduct(
          { ...createdProduct, slug: createdProduct?.slug || form.slug || generateSlug(form.name) },
          form.featured,
        );
      } else {
        const productId = getId(editingProduct);
        const existingVariants = form.variants.filter((variant) => variant.id);

        await productApi.update(productId, buildProductPayload(form));
        await Promise.all(
          existingVariants.map((variant) => productApi.updateVariant(variant.id, buildVariantPayload(variant))),
        );
        syncStoredFeaturedProduct({ ...editingProduct, slug: form.slug || editingProduct?.slug }, form.featured);
      }

      await loadProducts();
      resetModal();
    } catch (err) {
      setFormError(err?.response?.data?.message || err.message || "Không thể lưu sản phẩm.");
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
        <button className={styles.primaryBtn} type="button" onClick={openCreateModal}>
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
        isOpen={Boolean(modalMode)}
        onClose={closeModal}
        title={modalMode === "create" ? "Thêm sản phẩm" : "Sửa sản phẩm"}
        footer={
          <>
            <button className={styles.ghostBtn} type="button" onClick={closeModal} disabled={saving || addingVariant}>
              Hủy
            </button>
            <button className={styles.primaryBtn} type="submit" form="product-form" disabled={saving || addingVariant}>
              {saving ? "Đang lưu..." : modalMode === "create" ? "Thêm sản phẩm" : "Lưu thay đổi"}
            </button>
          </>
        }
      >
        <form id="product-form" className={styles.formGrid} onSubmit={handleSubmit}>
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
            <span>Sản phẩm nổi bật</span>
          </label>

          <label className={`${styles.checkboxField} ${styles.fullField}`}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => updateForm("isActive", event.target.checked)}
            />
            <span>Đang bán sản phẩm này</span>
          </label>

          <div className={`${styles.fullField} ${styles.variantEditor}`}>
            <div className={styles.variantHeader}>
              <span>Biến thể, giá và tồn kho</span>
              <div className={styles.variantHeaderActions}>
                <small>{form.variants.length ? `${form.variants.length} biến thể` : "Chưa có biến thể"}</small>
                <button
                  type="button"
                  className={styles.ghostBtn}
                  onClick={() => {
                    setShowAddVariant((current) => !current);
                    setNewVariantError("");
                  }}
                  disabled={saving || addingVariant}
                >
                  {showAddVariant ? "Hủy thêm" : "+ Thêm biến thể"}
                </button>
              </div>
            </div>

            {showAddVariant && (
              <div className={styles.addVariantForm}>
                {newVariantError && <div className={styles.formError}>{newVariantError}</div>}
                <div className={styles.variantRow}>
                  <label className={styles.compactField}>
                    <span>Size</span>
                    <input
                      value={newVariant.size}
                      onChange={(event) => updateNewVariant("size", event.target.value)}
                      placeholder="S, M, L..."
                    />
                  </label>
                  <label className={styles.compactField}>
                    <span>Màu sắc</span>
                    <input
                      value={newVariant.color}
                      onChange={(event) => updateNewVariant("color", event.target.value)}
                      placeholder="Đen, Trắng..."
                    />
                  </label>
                  <label className={styles.compactField}>
                    <span>SKU</span>
                    <input
                      value={newVariant.sku}
                      onChange={(event) => updateNewVariant("sku", event.target.value)}
                      placeholder="SP001-M-DEN"
                    />
                  </label>
                  <label className={styles.compactField}>
                    <span>Giá bán</span>
                    <input
                      min="0"
                      type="number"
                      value={newVariant.price}
                      onChange={(event) => updateNewVariant("price", event.target.value)}
                    />
                  </label>
                  <label className={styles.compactField}>
                    <span>Giá sale</span>
                    <input
                      min="0"
                      type="number"
                      value={newVariant.salePrice}
                      onChange={(event) => updateNewVariant("salePrice", event.target.value)}
                      placeholder="Không sale"
                    />
                  </label>
                  <label className={styles.compactField}>
                    <span>Tồn kho</span>
                    <input
                      min="0"
                      type="number"
                      value={newVariant.stockQuantity}
                      onChange={(event) => updateNewVariant("stockQuantity", event.target.value)}
                    />
                  </label>
                </div>
                <button
                  className={styles.primaryBtn}
                  type="button"
                  onClick={handleAddVariant}
                  disabled={addingVariant}
                >
                  {addingVariant ? "Đang thêm..." : "Xác nhận thêm biến thể"}
                </button>
              </div>
            )}

            {form.variants.length === 0 && !showAddVariant && (
              <p className={styles.variantEmpty}>Sản phẩm cần ít nhất một biến thể để có giá bán và tồn kho.</p>
            )}

            {form.variants.length > 0 && (
              <div className={styles.variantList}>
                {form.variants.map((variant) => {
                  const variantKey = variant.id || variant.tempId;

                  return (
                    <div className={styles.variantRow} key={variantKey || `${variant.size}-${variant.color}`}>
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
                          onChange={(event) => updateVariantForm(variantKey, "price", event.target.value)}
                        />
                      </label>

                      <label className={styles.compactField}>
                        <span>Giá sale</span>
                        <input
                          min="0"
                          type="number"
                          value={variant.salePrice}
                          onChange={(event) => updateVariantForm(variantKey, "salePrice", event.target.value)}
                          placeholder="Không sale"
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </form>
      </Modal>
    </section>
  );
}
