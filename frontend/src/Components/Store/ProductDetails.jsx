import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmDialog from "../UI/ConfirmDialog";
import Notice from "../UI/Notice";
import Navbar from "./Navbar";
import { apiFetch, clearAuthSession, getAuthToken, getStoredUser } from "../../lib/auth";
import { addItemToCart } from "../../lib/cart";
import "./Home.css";

const emptyEditState = {
  name: "",
  description: "",
  postedBy: "",
  userId: null,
  price: "",
  hasImage: false,
  imageURL: ""
};

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [notice, setNotice] = useState({ type: "info", message: "" });
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editData, setEditData] = useState(emptyEditState);

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  const [user] = useState(() => getStoredUser());
  const [token] = useState(() => getAuthToken());

  useEffect(() => {
    if (!user || !token) {
      navigate("/login");
    }
  }, [token, user, navigate]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const loadProduct = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const response = await fetch(`/api/items/${id}`);
      if (!response.ok) {
        throw new Error("Product not found");
      }
      const data = await response.json();
      setProduct(data);
    } catch (error) {
      console.error("Fetch product error:", error);
      setLoadError("Could not load this product. It may have been removed.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const onLogout = async () => {
    try {
      await apiFetch("/api/logout", { method: "POST" });
    } catch {
      // Local auth clear still happens if network logout fails.
    }
    clearAuthSession();
    navigate("/login");
  };

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  const canManageProduct = Boolean(product && (product.userId === user?.id || user?.role === "admin"));

  const addToCart = async () => {
    if (!product) {
      return;
    }

    setNotice({ type: "info", message: "" });
    setIsAddingToCart(true);
    try {
      await addItemToCart(product.id, 1);
      setNotice({ type: "success", message: `${product.name} was added to your cart.` });
    } catch (error) {
      setNotice({ type: "error", message: error.message || "Failed to add item to cart." });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const requestDeleteProduct = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteProduct = async () => {
    if (!product) {
      return;
    }

    setIsDeleting(true);
    setNotice({ type: "info", message: "" });
    try {
      const response = await fetch(`/api/items/${product.id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Failed to delete product.");
      }

      window.dispatchEvent(new Event("cartUpdated"));
      navigate("/home", { replace: true });
    } catch (error) {
      console.error("Delete product error:", error);
      setNotice({ type: "error", message: error.message || "Could not delete product." });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const openEditForm = () => {
    if (!product) {
      return;
    }

    setNotice({ type: "info", message: "" });
    setEditData({
      name: product.name || "",
      description: product.description || "",
      postedBy: product.postedBy || "",
      userId: product.userId || 0,
      price: product.price || "",
      hasImage: product.hasImage || false,
      imageURL: product.imageURL || ""
    });
    setShowEditForm(true);
  };

  const closeEditForm = () => {
    if (!isSavingEdit) {
      setShowEditForm(false);
    }
  };

  const handleEditChange = (event) => {
    const { name, value, type, checked } = event.target;
    setEditData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const submitEdit = async (event) => {
    event.preventDefault();
    setNotice({ type: "info", message: "" });

    if (!editData.name.trim()) {
      setNotice({ type: "warning", message: "Item name is required." });
      return;
    }

    const parsedPrice = Number(editData.price);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setNotice({ type: "warning", message: "Price must be a number greater than 0." });
      return;
    }

    setIsSavingEdit(true);
    try {
      const response = await fetch(`/api/items/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editData.name.trim(),
          description: editData.description.trim(),
          postedBy: editData.postedBy.trim(),
          userId: editData.userId,
          price: parsedPrice,
          hasImage: Boolean(editData.hasImage),
          imageURL: editData.imageURL.trim()
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || "Failed to update item.");
      }

      setProduct(payload);
      window.dispatchEvent(new Event("cartUpdated"));
      setShowEditForm(false);
      setNotice({ type: "success", message: "Product updated successfully." });
    } catch (error) {
      console.error("Update product error:", error);
      setNotice({ type: "error", message: error.message || "Could not update product." });
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="home">
      <Navbar user={user} onLogout={onLogout} onSearchChange={setSearch} searchValue={search} />

      <main className="home__wrap">
        {notice.message && (
          <div className="home__notice">
            <Notice
              type={notice.type}
              message={notice.message}
              onDismiss={() => setNotice({ type: "info", message: "" })}
            />
          </div>
        )}

        {isLoading ? (
          <div className="home__emptyState">Loading product details...</div>
        ) : loadError ? (
          <Notice type="error" message={loadError} actionLabel="Back to Home" onAction={() => navigate("/home")} />
        ) : product ? (
          <>
            <div className="home__titleRow">
              <div>
                <h1 className="home__title">{product.name}</h1>
                <p className="home__subtitle">Product details and available actions.</p>
              </div>

              <div className="home__controls">
                <button type="button" className="themeToggle" onClick={toggleTheme} aria-label="Toggle light and dark mode">
                  <span className="themeToggle__icon">{theme === "dark" ? "Dark" : "Light"}</span>
                  <span className={`themeToggle__track ${theme === "light" ? "isOn" : ""}`}>
                    <span className="themeToggle__thumb" />
                  </span>
                </button>
              </div>
            </div>

            <div
              className="card"
              style={{
                marginTop: "20px",
                display: "grid",
                gridTemplateColumns: "minmax(280px, 1fr) 2fr",
                gap: "40px",
                alignItems: "start"
              }}
            >
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.02)",
                  borderRadius: "16px",
                  padding: "40px",
                  border: "1px solid var(--border)",
                  minHeight: "380px"
                }}
              >
                {product.hasImage && typeof product.imageURL === "string" && product.imageURL.trim() ? (
                  <img
                    src={product.imageURL.trim().startsWith("http") ? product.imageURL.trim() : `${window.location.origin}${product.imageURL.trim()}`}
                    alt={product.name}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "380px",
                      objectFit: "contain",
                      filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.2))"
                    }}
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div style={{ color: "var(--home-subtext)", fontStyle: "italic" }}>No image available</div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <div style={{ fontSize: "1.8rem", color: "var(--accent-color)", fontWeight: "800", letterSpacing: "-0.5px" }}>
                    {product.name}
                  </div>
                  <div className="badge" style={{ marginTop: "10px", display: "inline-block" }}>
                    Item ID: {product.id}
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
                  <h3 style={{ marginBottom: "10px", fontSize: "16px", fontWeight: "700" }}>About this item</h3>
                  <p style={{ lineHeight: "1.7", color: "var(--home-subtext)", fontSize: "15px" }}>{product.description || "No description provided."}</p>
                </div>

                {product.postedBy && (
                  <div style={{ fontSize: "14px", opacity: 0.7 }}>
                    Seller: {product.postedBy}
                  </div>
                )}

                <div style={{ fontSize: "2rem", color: "var(--accent-color)", fontWeight: "800" }}>
                  ${Number(product.price).toFixed(2)}
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button type="button" className="addToCartBtn" onClick={addToCart} style={{ flex: 1 }} disabled={isAddingToCart}>
                    {isAddingToCart ? "Adding..." : "Add to Cart"}
                  </button>

                  {canManageProduct && (
                    <button
                      type="button"
                      className="addToCartBtn"
                      onClick={openEditForm}
                      style={{
                        flex: 1,
                        background: "linear-gradient(135deg, #f59e0b, #d97706)",
                        boxShadow: "0 4px 16px rgba(245, 158, 11, 0.3)"
                      }}
                    >
                      Edit Product
                    </button>
                  )}

                  <button type="button" className="addToCartBtn backBtn" onClick={() => navigate("/home")} style={{ flex: 1 }}>
                    Back to Home
                  </button>

                  {canManageProduct && (
                    <button
                      type="button"
                      className="addToCartBtn"
                      onClick={requestDeleteProduct}
                      style={{
                        flex: 1,
                        background: "linear-gradient(135deg, #ef4444, #dc2626)",
                        boxShadow: "0 4px 16px rgba(239, 68, 68, 0.3)"
                      }}
                      disabled={isDeleting}
                    >
                      Delete Product
                    </button>
                  )}
                </div>
              </div>
            </div>

            {showEditForm && (
              <div className="editModalOverlay" onClick={(event) => event.target === event.currentTarget && closeEditForm()}>
                <div className="editModalCard">
                  <h3 style={{ marginTop: 0, marginBottom: "8px", fontSize: "20px", fontWeight: "700" }}>Edit Product</h3>
                  <p style={{ margin: "0 0 14px", color: "var(--home-subtext)" }}>Update fields and save changes.</p>
                  <form onSubmit={submitEdit}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <input name="name" placeholder="Name" value={editData.name} onChange={handleEditChange} required />
                      <input name="postedBy" placeholder="Seller" value={editData.postedBy} onChange={handleEditChange} />
                      <input name="price" placeholder="Price" type="number" step="0.01" value={editData.price} onChange={handleEditChange} required />
                      <input name="imageURL" placeholder="Image URL" value={editData.imageURL} onChange={handleEditChange} />
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <textarea
                        name="description"
                        placeholder="Description"
                        value={editData.description}
                        onChange={handleEditChange}
                        rows={4}
                        style={{ width: "100%", resize: "vertical" }}
                      />
                    </div>
                    <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 12 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "14px" }}>
                        <input type="checkbox" name="hasImage" checked={editData.hasImage} onChange={handleEditChange} />
                        Has Image
                      </label>
                    </div>
                    <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                      <button type="button" onClick={closeEditForm} disabled={isSavingEdit}>
                        Cancel
                      </button>
                      <button type="submit" disabled={isSavingEdit}>
                        {isSavingEdit ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        ) : null}
      </main>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete this product?"
        message="This action permanently removes the product and cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Keep Product"
        danger
        busy={isDeleting}
        onConfirm={confirmDeleteProduct}
        onCancel={() => !isDeleting && setShowDeleteConfirm(false)}
      />

      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__brand">SHOPLY</div>
          <div className="footer__muted">Demo e-commerce platform - CPS630</div>
        </div>
      </footer>
    </div>
  );
};

export default ProductDetails;
