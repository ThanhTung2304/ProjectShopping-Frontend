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
  images: [],
  deletedImageIds: [],
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

const initialImage = {
  id: "",
  tempId: "",
  file: null,
  imageUrl: "",
  previewUrl: "",
  isPrimary: false,
  sortOrder: 0,
  isNew: true,
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

  const attempts = [() => productApi.getVariants(productId)];

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
  const keys = [getId(product), product?.slug, product?.previousSlug].filter(Boolean).map(String);
  if (keys.length === 0) return;

  const currentIds = getStoredFeaturedProductIds();
  const nextIds = isFeatured
    ? [...currentIds, ...keys]
    : currentIds.filter((id) => !keys.includes(String(id)));

  saveStoredFeaturedProductIds(nextIds);
};

const isStoredFeaturedProduct = (product) => {
  const keys = [getId(product), product?.slug].filter(Boolean).map(String);
  if (keys.length === 0) return false;

  const storedIds = getStoredFeaturedProductIds().map(String);
  return keys.some((key) => storedIds.includes(key));
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
  Boolean(product?.featured ?? product?.isFeatured ?? product?.is_featured ?? product?.bestSeller ?? false) ||
  isStoredFeaturedProduct(product);

const getImageUrl = (image) => {
  if (!image) return "";
  if (typeof image === "string") return image;
  return image.imageUrl || image.image_url || image.url || image.src || image.path || "";
};

const getProductImages = (product) => {
  const images = []
    .concat(Array.isArray(product?.images) ? product.images : [])
    .concat(Array.isArray(product?.productImages) ? product.productImages : [])
    .concat(Array.isArray(product?.product_images) ? product.product_images : [])
    .concat([product?.image, product?.img, product?.thumbnail].filter(Boolean));

  const normalizedImages = images
    .map((image, index) => ({
      id: typeof image === "object" ? getId(image) : undefined,
      tempId: `image-${index}-${Date.now()}`,
      file: null,
      imageUrl: getImageUrl(image),
      previewUrl: getImageUrl(image),
      isPrimary: typeof image === "object" ? image?.isPrimary ?? image?.is_primary ?? false : index === 0,
      sortOrder: Number(typeof image === "object" ? image?.sortOrder ?? image?.sort_order ?? index : index),
      isNew: false,
    }))
    .filter((image) => image.imageUrl);

  const uniqueImages = normalizedImages.filter(
    (image, index, list) => list.findIndex((item) => item.imageUrl === image.imageUrl) === index,
  );

  return uniqueImages.sort((first, second) => {
    if (first.isPrimary !== second.isPrimary) return first.isPrimary ? -1 : 1;
    return Number(first.sortOrder || 0) - Number(second.sortOrder || 0);
  });
};

const loadProductImages = async (productId) => getProductImages({ images: getList(await productApi.getImages(productId)) });

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
  images: getProductImages(product),
  deletedImageIds: [],
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
  const [deletingId, setDeletingId] = useState(null);

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

  const addImage = () => {
    setForm((current) => ({
      ...current,
      images: [
        ...current.images,
        {
          ...initialImage,
          tempId: `image-${Date.now()}`,
          isPrimary: current.images.length === 0,
          sortOrder: current.images.length,
          isNew: true,
        },
      ],
    }));
  };

  const reloadImages = async () => {
    const productId = getId(editingProduct);
    if (!productId) return;

    setFormError("");

    try {
      const images = await loadProductImages(productId);
      setForm((current) => ({ ...current, images, deletedImageIds: [] }));
    } catch (err) {
      setFormError(err?.response?.data?.message || err.message || "Không thể tải ảnh sản phẩm từ backend.");
    }
  };

  const updateImage = (imageKey, field, value) => {
    setForm((current) => ({
      ...current,
      images: current.images.map((image) =>
        String(image.id || image.tempId) === String(imageKey)
          ? { ...image, [field]: field === "sortOrder" ? Number(value || 0) : value }
          : image,
      ),
    }));
  };

  const updateImageFile = (imageKey, file) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);

    setForm((current) => ({
      ...current,
      images: current.images.map((image) =>
        String(image.id || image.tempId) === String(imageKey)
          ? {
              ...image,
              file,
              imageUrl: previewUrl,
              previewUrl,
              isNew: true,
            }
          : image,
      ),
    }));
  };

  const setPrimaryImage = (imageKey) => {
    setForm((current) => ({
      ...current,
      images: current.images.map((image) => ({
        ...image,
        isPrimary: String(image.id || image.tempId) === String(imageKey),
      })),
    }));
  };

  const removeImage = (imageKey) => {
    setForm((current) => {
      const removedImage = current.images.find((image) => String(image.id || image.tempId) === String(imageKey));
      const nextImages = current.images.filter((image) => String(image.id || image.tempId) !== String(imageKey));

      return {
        ...current,
        deletedImageIds: removedImage?.id ? [...current.deletedImageIds, removedImage.id] : current.deletedImageIds,
        images:
          nextImages.length > 0 && !nextImages.some((image) => image.isPrimary)
            ? nextImages.map((image, index) => ({ ...image, isPrimary: index === 0 }))
            : nextImages,
      };
    });
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

const syncProductImages = async (productId, imageForm) => {
  if (!productId) return;

  await Promise.all(
    [...new Set(imageForm.deletedImageIds.filter(Boolean))].map((imageId) =>
      productApi.deleteImage(productId, imageId),
    ),
  );

  const imagesToUpload = imageForm.images.filter((image) => image.file);
  const uploadedImages = await Promise.all(
    imagesToUpload.map(async (image) => {
      const uploaded = getItem(
        await productApi.uploadImage(productId, {
          file: image.file,
          isPrimary: image.isPrimary,
          sortOrder: image.sortOrder,
        }),
      );
      return {
        formKey: String(image.id || image.tempId),
        id: getId(uploaded),
      };
    }),
  );

  const primaryImage = imageForm.images.find((image) => image.isPrimary);
  const primaryKey = primaryImage ? String(primaryImage.id || primaryImage.tempId) : "";
  const uploadedPrimary = uploadedImages.find((image) => image.formKey === primaryKey);
  const primaryImageId = primaryImage?.id || uploadedPrimary?.id;

  if (primaryImageId) {
    await productApi.setPrimaryImage(productId, primaryImageId);
  }
};

  const validateForm = () => {
    if (modalMode === "edit" && !getId(editingProduct)) return "Không tìm thấy mã sản phẩm để cập nhật.";
    if (!form.name.trim()) return "Vui lòng nhập tên sản phẩm.";
    if (!form.categoryId) return "Vui lòng chọn loại sản phẩm.";
    if (modalMode === "create" && form.variants.length === 0) return "Vui lòng thêm ít nhất một biến thể cho sản phẩm.";

    const emptyNewImage = form.images.find((image) => image.isNew && !image.file);
    if (emptyNewImage) return "Vui lòng chọn file ảnh hoặc xóa dòng ảnh trống.";

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
        await syncProductImages(createdProductId, form);
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
        await syncProductImages(productId, form);
        syncStoredFeaturedProduct(
          {
            ...editingProduct,
            slug: form.slug || editingProduct?.slug,
            previousSlug: editingProduct?.slug,
          },
          form.featured,
        );
      }

      await loadProducts();
      resetModal();
    } catch (err) {
      setFormError(err?.response?.data?.message || err.message || "Không thể lưu sản phẩm.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (product) => {
    const productId = getId(product);
    if (!productId) {
      setError("Không tìm thấy mã sản phẩm để xóa.");
      return;
    }

    if (!window.confirm(`Xóa sản phẩm "${product.name}"?`)) return;

    setDeletingId(productId);
    setError("");

    try {
      await productApi.delete(productId);
      await loadProducts();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Không thể xóa sản phẩm.");
    } finally {
      setDeletingId(null);
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
                          <button
                            className={styles.ghostBtn}
                            type="button"
                            onClick={() => handleDeleteProduct(product)}
                            disabled={String(deletingId) === String(getId(product))}
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

          <div className={`${styles.fullField} ${styles.imageEditor}`}>
            <div className={styles.variantHeader}>
              <span>Hình ảnh sản phẩm</span>
              <div className={styles.variantHeaderActions}>
                <small>{form.images.length ? `${form.images.length} ảnh` : "Chưa có ảnh"}</small>
                {modalMode === "edit" && (
                  <button type="button" className={styles.ghostBtn} onClick={reloadImages} disabled={saving}>
                    Tải ảnh
                  </button>
                )}
                <button type="button" className={styles.ghostBtn} onClick={addImage} disabled={saving}>
                  + Thêm ảnh
                </button>
              </div>
            </div>

            {form.images.length === 0 && (
              <p className={styles.variantEmpty}>Thêm URL ảnh để hiển thị ở danh sách và trang chi tiết sản phẩm.</p>
            )}

            {form.images.length > 0 && (
              <div className={styles.imageList}>
                {form.images.map((image, index) => {
                  const imageKey = image.id || image.tempId;

                  return (
                    <div className={styles.imageRow} key={imageKey || index}>
                      <div className={styles.imagePreview}>
                        {image.imageUrl ? <img src={image.imageUrl} alt="" /> : <span>Ảnh</span>}
                      </div>

                      <label className={`${styles.compactField} ${styles.imageUrlField}`}>
                        <span>URL ảnh</span>
                        <input
                          value={image.imageUrl}
                          onChange={(event) => updateImage(imageKey, "imageUrl", event.target.value)}
                          placeholder="https://..."
                          readOnly
                        />
                        <input
                          accept="image/*"
                          type="file"
                          onChange={(event) => updateImageFile(imageKey, event.target.files?.[0])}
                        />
                      </label>

                      <label className={styles.compactField}>
                        <span>Thứ tự</span>
                        <input
                          min="0"
                          type="number"
                          value={image.sortOrder}
                          onChange={(event) => updateImage(imageKey, "sortOrder", event.target.value)}
                        />
                      </label>

                      <label className={styles.checkboxField}>
                        <input
                          type="radio"
                          name="primaryProductImage"
                          checked={Boolean(image.isPrimary)}
                          onChange={() => setPrimaryImage(imageKey)}
                        />
                        <span>Ảnh chính</span>
                      </label>

                      <button className={styles.ghostBtn} type="button" onClick={() => removeImage(imageKey)}>
                        Xóa
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

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
