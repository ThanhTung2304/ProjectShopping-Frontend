import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import productApi from "../../../api/productApi";
import useCart from "../../../hooks/useCart";
import { useAuth } from "../../../hooks/useAuth";
import {
  formatCurrency,
  getProductId,
  getProductImage,
  getProductPrice,
  getResponseItem,
  getResponseList,
} from "../../../utils/productUtils";
import styles from "./ProductDetailPage.module.css";

const DEFAULT_SIZES = ["S", "M", "L", "XL"];
const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='720' height='960' viewBox='0 0 720 960'%3E%3Crect width='720' height='960' fill='%23f5f5f5'/%3E%3Ctext x='360' y='480' text-anchor='middle' fill='%23999' font-family='Arial' font-size='32'%3ENo Image%3C/text%3E%3C/svg%3E";
const SUCCESS_MESSAGE = "Đã thêm sản phẩm vào giỏ hàng.";

const normalizeList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (Array.isArray(value?.content)) return value.content.filter(Boolean);
  if (Array.isArray(value?.data)) return value.data.filter(Boolean);
  if (Array.isArray(value?.data?.content)) return value.data.content.filter(Boolean);
  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

const getProductImages = (product) => {
  const images = normalizeList(product?.images)
    .concat(normalizeList(product?.gallery))
    .concat([product?.image, product?.img, product?.thumbnail].filter(Boolean));
  const uniqueImages = [...new Set(images)];

  return uniqueImages.length ? uniqueImages : [FALLBACK_IMAGE];
};

const getCartProductId = (product) => {
  if (product?._id) return product._id;
  if (product?.id && String(product.id) !== String(product.slug || "")) return product.id;
  return null;
};

const getVariantId = (variant) => variant?.id || variant?._id;
const getVariantPrice = (variant) => Number(variant?.salePrice ?? variant?.sale_price ?? variant?.price ?? 0);
const getVariantStock = (variant) =>
  Number(variant?.stockQuantity ?? variant?.stock_quantity ?? variant?.stock ?? variant?.quantity ?? 0);
const isVariantActive = (variant) => variant?.isActive ?? variant?.is_active ?? variant?.active ?? true;

const getActiveVariants = (product) => normalizeList(product?.variants).filter(isVariantActive);

const getProductSizes = (product) => {
  const sizes = getActiveVariants(product).map((variant) => variant?.size).filter(Boolean);
  return [...new Set(sizes)].length ? [...new Set(sizes)] : DEFAULT_SIZES;
};

const getProductColors = (product, selectedSize = "") => {
  const variants = getActiveVariants(product);
  const colors = variants
    .filter((variant) => !selectedSize || variant.size === selectedSize)
    .map((variant) => variant?.color)
    .filter(Boolean);

  return [...new Set(colors)];
};

const getTotalVariantStock = (product) =>
  getActiveVariants(product).reduce((total, variant) => total + getVariantStock(variant), 0);

const findProductInList = (products, id) =>
  products.find((item) => {
    const keys = [item?.id, item?._id, item?.slug].filter(Boolean).map(String);
    return keys.includes(String(id));
  });

const fetchProductDetail = async (routeId, listProduct) => {
  const concreteId = getCartProductId(listProduct);

  if (concreteId) {
    return getResponseItem(await productApi.getById(concreteId));
  }

  if (/^\d+$/.test(String(routeId))) {
    return getResponseItem(await productApi.getById(routeId));
  }

  return getResponseItem(await productApi.getBySlug(routeId));
};

const fetchProductVariants = async (productId) => {
  if (!productId) return [];

  const attempts = [
    () => productApi.getVariants(productId),
    () => productApi.adminGetVariants(productId),
  ];

  for (const attempt of attempts) {
    try {
      return getResponseList(await attempt());
    } catch {
      // Backend variants may be protected or not exposed on the public route yet.
    }
  }

  return [];
};

const mergeProductWithConcreteId = async (product, routeId) => {
  if (getCartProductId(product)) return product;

  const listResponse = await productApi.getAll();
  const listProduct = findProductInList(getResponseList(listResponse), routeId || product?.slug);

  return listProduct ? { ...listProduct, ...product, id: listProduct.id, _id: listProduct._id } : product;
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addItem, submittingItemId } = useCart();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [activeTab, setActiveTab] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      setError("");
      setNotice("");

      try {
        const listResponse = await productApi.getAll();
        const listProduct = findProductInList(getResponseList(listResponse), id);
        let data = listProduct;

        try {
          const detailProduct = await fetchProductDetail(id, listProduct);
          data = listProduct ? { ...listProduct, ...detailProduct } : detailProduct;
        } catch {
          data = listProduct || null;
        }

        data = await mergeProductWithConcreteId(data, id);

        if (!data || !getProductId(data)) {
          setError("Không tìm thấy sản phẩm.");
          return;
        }

        const variants = await fetchProductVariants(getCartProductId(data));
        if (variants.length > 0) {
          data = { ...data, variants };
        }

        const images = getProductImages(data);
        const firstVariant = getActiveVariants(data)[0];

        setProduct(data);
        setSelectedImage(images[0]);
        setSelectedSize(firstVariant?.size || getProductSizes(data)[0] || "");
        setSelectedColor(firstVariant?.color || getProductColors(data)[0] || "");
        setQuantity(1);
      } catch (err) {
        setError("Đã xảy ra lỗi khi tải chi tiết sản phẩm.");
        console.error("Error fetching product details:", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchProductDetails();
  }, [id]);

  const images = useMemo(() => getProductImages(product), [product]);
  const sizes = useMemo(() => getProductSizes(product), [product]);
  const colors = useMemo(() => getProductColors(product, selectedSize), [product, selectedSize]);
  const selectedVariant = useMemo(() => {
    const variants = getActiveVariants(product);
    return (
      variants.find((variant) => variant.size === selectedSize && variant.color === selectedColor) ||
      variants.find((variant) => variant.size === selectedSize) ||
      variants[0] ||
      null
    );
  }, [product, selectedColor, selectedSize]);
  const stock = selectedVariant ? getVariantStock(selectedVariant) : getTotalVariantStock(product);
  const displayPrice = selectedVariant ? getVariantPrice(selectedVariant) : getProductPrice(product);
  const productId = getCartProductId(product);
  const isAdding = submittingItemId === productId;
  const isSuccessNotice = notice === SUCCESS_MESSAGE;
  const hasVariants = getActiveVariants(product).length > 0;
  const isOutOfStock = hasVariants && stock <= 0;

  const increaseQuantity = () => {
    setQuantity((current) => Math.min(stock || current + 1, current + 1));
  };

  const decreaseQuantity = () => {
    setQuantity((current) => Math.max(1, current - 1));
  };

  const handleSizeChange = (size) => {
    setSelectedSize(size);
    const nextColor = getProductColors(product, size)[0] || "";
    setSelectedColor(nextColor);
    setQuantity(1);
  };

  const handleAddToCart = async () => {
    if (!productId) {
      setNotice("Không lấy được mã sản phẩm hợp lệ để thêm vào giỏ hàng.");
      return;
    }

    if (hasVariants && !getVariantId(selectedVariant)) {
      setNotice("Vui lòng chọn phân loại sản phẩm hợp lệ.");
      return;
    }

    if (isOutOfStock) {
      setNotice("Phân loại này đã hết hàng.");
      return;
    }

    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    setNotice("");

    try {
      const response = await addItem(productId, quantity, product, selectedVariant);
      if (response?.success === false) {
        throw new Error(response.message || "Không thể thêm sản phẩm vào giỏ hàng.");
      }

      setNotice(SUCCESS_MESSAGE);
    } catch (err) {
      setNotice(err?.response?.data?.message || err?.message || "Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.");
    }
  };

  if (loading) return <div className={styles.loading}>Đang tải chi tiết sản phẩm...</div>;

  if (error) {
    return (
      <div className={styles.stateBlock}>
        <h2>{error}</h2>
        <Link to="/products" className={styles.stateLink}>
          Quay lại cửa hàng
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={styles.stateBlock}>
        <h2>Không tìm thấy sản phẩm này.</h2>
        <Link to="/products" className={styles.stateLink}>
          Quay lại cửa hàng
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <section className={styles.gallery} aria-label="Hình ảnh sản phẩm">
        <div className={styles.mainImage}>
          <img src={selectedImage || getProductImage(product, FALLBACK_IMAGE)} alt={product.name} />
        </div>

        {images.length > 1 && (
          <div className={styles.thumbnails}>
            {images.map((image) => (
              <button
                key={image}
                className={`${styles.thumbBtn} ${selectedImage === image ? styles.activeThumb : ""}`}
                type="button"
                onClick={() => setSelectedImage(image)}
                aria-label={`Xem ảnh ${product.name}`}
              >
                <img src={image} alt="" />
              </button>
            ))}
          </div>
        )}
      </section>

      <section className={styles.details}>
        <div className={styles.metaRow}>
          <span className={styles.category}>{product.categoryName || product.category?.name || "Sản phẩm"}</span>
          <span className={`${styles.stockBadge} ${isOutOfStock ? styles.stockDanger : ""}`}>
            {isOutOfStock ? "Hết hàng" : hasVariants ? `Còn ${stock} sản phẩm` : "Còn hàng"}
          </span>
        </div>

        <h1>{product.name}</h1>
        <p className={styles.price}>{formatCurrency(displayPrice)}</p>
        <p className={styles.lead}>
          {product.shortDescription || product.summary || "Thiết kế dễ phối, chất liệu thoải mái và phù hợp cho nhiều dịp."}
        </p>

        <div className={styles.divider} />

        <div className={styles.options}>
          <p className={styles.optionTitle}>Kích thước: {selectedSize}</p>
          <div className={styles.choiceGrid}>
            {sizes.map((size) => (
              <button
                key={size}
                className={`${styles.choiceBtn} ${selectedSize === size ? styles.activeChoice : ""}`}
                type="button"
                onClick={() => handleSizeChange(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {colors.length > 0 && (
          <div className={styles.options}>
            <p className={styles.optionTitle}>Màu sắc: {selectedColor}</p>
            <div className={styles.choiceGrid}>
              {colors.map((color) => (
                <button
                  key={color}
                  className={`${styles.choiceBtn} ${selectedColor === color ? styles.activeChoice : ""}`}
                  type="button"
                  onClick={() => {
                    setSelectedColor(color);
                    setQuantity(1);
                  }}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <div className={styles.qtyPicker} aria-label="Số lượng">
            <button type="button" onClick={decreaseQuantity} disabled={quantity <= 1 || isAdding}>
              -
            </button>
            <span>{quantity}</span>
            <button type="button" onClick={increaseQuantity} disabled={(hasVariants && quantity >= stock) || isAdding}>
              +
            </button>
          </div>
          <button className={styles.addBtn} onClick={handleAddToCart} disabled={isAdding || isOutOfStock} type="button">
            {isAdding ? "Đang thêm..." : isOutOfStock ? "Hết hàng" : "Thêm vào giỏ"}
          </button>
        </div>

        {notice && (
          <div className={isSuccessNotice ? styles.successNotice : styles.errorNotice}>
            <span>{notice}</span>
            {isSuccessNotice && <Link to="/cart">Xem giỏ hàng</Link>}
          </div>
        )}

        <div className={styles.infoTabs}>
          <div className={styles.tabHeaders}>
            <button
              className={activeTab === "desc" ? styles.activeTab : ""}
              type="button"
              onClick={() => setActiveTab("desc")}
            >
              Mô tả
            </button>
            <button
              className={activeTab === "details" ? styles.activeTab : ""}
              type="button"
              onClick={() => setActiveTab("details")}
            >
              Thông tin
            </button>
            <button
              className={activeTab === "ship" ? styles.activeTab : ""}
              type="button"
              onClick={() => setActiveTab("ship")}
            >
              Vận chuyển
            </button>
          </div>

          <div className={styles.tabContent}>
            {activeTab === "desc" && (
              <p>{product.description || "Chưa có mô tả chi tiết cho sản phẩm này."}</p>
            )}
            {activeTab === "details" && (
              <dl className={styles.specList}>
                <div>
                  <dt>Danh mục</dt>
                  <dd>{product.categoryName || product.category?.name || "Đang cập nhật"}</dd>
                </div>
                <div>
                  <dt>Kích thước</dt>
                  <dd>{sizes.join(", ")}</dd>
                </div>
                {colors.length > 0 && (
                  <div>
                    <dt>Màu sắc</dt>
                    <dd>{colors.join(", ")}</dd>
                  </div>
                )}
                <div>
                  <dt>Tồn kho</dt>
                  <dd>{hasVariants ? `${stock} sản phẩm` : "Đang cập nhật"}</dd>
                </div>
                {selectedVariant?.sku && (
                  <div>
                    <dt>SKU</dt>
                    <dd>{selectedVariant.sku}</dd>
                  </div>
                )}
              </dl>
            )}
            {activeTab === "ship" && (
              <p>
                Giao hàng toàn quốc trong 2-4 ngày làm việc. Miễn phí vận chuyển cho đơn hàng từ 1.000.000 VND.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
