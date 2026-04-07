import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import ConfirmDialog from "../UI/ConfirmDialog";
import Notice from "../UI/Notice";
import Navbar from "./Navbar";
import Footer from "../UI/Footer";
import { apiFetch, clearAuthSession, getAuthToken, getStoredUser } from "../../lib/auth";
import { addItemToCart } from "../../lib/cart";

const emptyEditState = {
  name: "",
  description: "",
  postedBy: "",
  userId: null,
  price: "",
  hasImage: false,
  imageURL: ""
};

export default function ProductDetails() {
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

  const [user] = useState(() => getStoredUser());
  const [token] = useState(() => getAuthToken());

  useEffect(() => {
    if (!user || !token) {
      navigate("/login");
    }
  }, [token, user, navigate]);

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

  const canManageProduct = Boolean(product && (product.userId === user?.id || user?.role === "admin"));

  const addToCart = async () => {
    if (!product) return;

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

  const requestDeleteProduct = () => setShowDeleteConfirm(true);

  const confirmDeleteProduct = async () => {
    if (!product) return;

    setIsDeleting(true);
    setNotice({ type: "info", message: "" });
    try {
      const response = await apiFetch(`/api/items/${product.id}`, { method: "DELETE" });
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
    if (!product) return;
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
    if (!isSavingEdit) setShowEditForm(false);
  };

  const handleEditChange = (event) => {
    const { name, value, type, checked } = event.target;
    setEditData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const submitEdit = async (event) => {
    event.preventDefault();
    setNotice({ type: "info", message: "" });

    if (!editData.name.trim()) return setNotice({ type: "warning", message: "Item name is required." });
    const parsedPrice = Number(editData.price);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) return setNotice({ type: "warning", message: "Price must be a number greater than 0." });

    setIsSavingEdit(true);
    try {
      const response = await apiFetch(`/api/items/${product.id}`, {
        method: "PUT",
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
      if (!response.ok) throw new Error(payload.message || "Failed to update item.");

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

  const rawImage = typeof product?.imageURL === "string" ? product.imageURL.trim() : "";
  const imageSrc = product?.hasImage && rawImage
    ? rawImage.startsWith("http") ? rawImage : `${window.location.origin}${rawImage}`
    : "";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} onLogout={onLogout} onSearchChange={setSearch} searchValue={search} />

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-6 pt-12 pb-24">
        {notice.message && (
          <div className="mb-8">
            <Notice type={notice.type} message={notice.message} onDismiss={() => setNotice({ type: "info", message: "" })} />
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 animate-pulse mt-12">
            <div className="bg-surface-container-highest w-full max-w-[520px] h-[360px] md:h-[520px] lg:h-[calc(100vh-12rem)] max-h-[680px] mx-auto"></div>
            <div>
              <div className="h-12 bg-surface-container-highest w-3/4 mb-4"></div>
              <div className="h-6 bg-surface-container-highest w-1/4 mb-12"></div>
              <div className="h-24 bg-surface-container-highest w-full mb-8"></div>
              <div className="h-12 bg-surface-container-highest w-full mb-4"></div>
            </div>
          </div>
        ) : loadError ? (
          <div className="mt-12 text-center py-24 border border-outline-variant/30 flex justify-center flex-col items-center">
            <h2 className="font-display text-3xl text-primary mb-4">{loadError}</h2>
            <button onClick={() => navigate("/home")} className="tertiary-btn mt-6">Return to Collection</button>
          </div>
        ) : product ? (
          <>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-12">
              <Link to="/home" className="hover:text-primary transition-colors">Shop</Link>
              <span>/</span>
              <span className="text-primary truncate max-w-xs">{product.name}</span>
            </nav>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24">
              {/* Left Column: Image Area */}
              <div className="bg-surface relative lg:sticky lg:top-28 h-fit flex justify-center">
                <div className="w-full max-w-[520px] h-[360px] md:h-[520px] lg:h-[calc(100vh-12rem)] max-h-[680px] overflow-hidden bg-surface-container-highest">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={product.name}
                      className="w-full h-full object-contain"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-container-high flex flex-col items-center justify-center font-display text-outline text-2xl">
                       Shoply <span className="font-body text-xs uppercase tracking-widest mt-2">Item #{product.id}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Product Details */}
              <div className="pt-4 lg:pt-12 md:pb-[30vh]">
                <h1 className="font-display text-4xl lg:text-5xl text-primary mb-4 leading-tight">{product.name}</h1>
                <p className="font-body text-2xl font-semibold text-primary mb-10">${Number(product.price).toFixed(2)}</p>

                <div className="space-y-6 mb-12 text-on-surface-variant font-medium text-[15px]">
                  <p className="leading-relaxed">
                    {product.description || "An exercise in architectural tailoring. This signature piece features sharp lines that command presence while maintaining effortless grace. Crafted from responsibly sourced materials."}
                  </p>
                  
                  <ul className="space-y-3 pt-6">
                    {product.postedBy && <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-secondary/60 mr-4"></span> Seller: {product.postedBy}</li>}
                    <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-secondary/60 mr-4"></span> Item Reference: {product.id}</li>
                    <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-secondary/60 mr-4"></span> Complimentary express shipping</li>
                    <li className="flex items-center"><span className="w-2 h-2 rounded-full bg-secondary/60 mr-4"></span> 14-day return window</li>
                  </ul>
                </div>

                <div className="space-y-4 border-y border-outline-variant/30 py-8 mb-12">
                  <button 
                    onClick={addToCart} 
                    disabled={isAddingToCart}
                    className="w-full arcade-btn py-4 text-base tracking-widest uppercase font-semibold text-on-secondary shadow-ambient"
                  >
                    {isAddingToCart ? "Adding to Bag..." : "Add to Bag"}
                  </button>

                  {canManageProduct && (
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <button 
                        onClick={openEditForm}
                        className="secondary-btn w-full uppercase tracking-widest text-xs font-semibold"
                      >
                        Edit Record
                      </button>
                      <button 
                        onClick={requestDeleteProduct}
                        disabled={isDeleting}
                        className="w-full border border-red-200 text-red-700 bg-transparent hover:bg-red-50 rounded px-4 py-3 uppercase tracking-widest text-xs font-semibold transition-colors"
                      >
                        Delete Record
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Edit Modal Overlay */}
            {showEditForm && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto" onClick={(e) => e.target === e.currentTarget && closeEditForm()}>
                <div className="bg-surface-container-lowest w-full max-w-2xl shadow-lift my-8 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-8 py-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low">
                    <h3 className="font-display text-2xl text-primary">Edit Record</h3>
                    <button onClick={closeEditForm} className="text-on-surface-variant hover:text-primary transition-colors text-4xl font-light leading-none">&times;</button>
                  </div>
                  
                  <div className="p-8">
                    <form onSubmit={submitEdit} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <label className="label-md block mb-2">Title *</label>
                          <input name="name" className="ghost-input w-full font-medium" value={editData.name} onChange={handleEditChange} required />
                        </div>
                        <div>
                          <label className="label-md block mb-2">Price *</label>
                          <input name="price" className="ghost-input w-full font-medium" type="number" step="0.01" value={editData.price} onChange={handleEditChange} required />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <label className="label-md block mb-2">Seller</label>
                          <input name="postedBy" className="ghost-input w-full" value={editData.postedBy} onChange={handleEditChange} />
                        </div>
                        <div>
                          <label className="label-md block mb-2">Image Reference URL</label>
                          <input name="imageURL" className="ghost-input w-full" value={editData.imageURL} onChange={handleEditChange} />
                        </div>
                      </div>

                      <div>
                        <label className="label-md block mb-2">Description</label>
                        <textarea name="description" className="ghost-input w-full resize-y" value={editData.description} onChange={handleEditChange} rows={4} />
                      </div>
                      
                      <label className="flex items-center gap-3 cursor-pointer mt-4">
                        <input type="checkbox" name="hasImage" className="w-5 h-5 accent-secondary border-outline-variant" checked={editData.hasImage} onChange={handleEditChange} />
                        <span className="font-medium text-primary">Media attached to this record</span>
                      </label>
                      
                      <div className="pt-8 mt-4 border-t border-outline-variant/30 flex justify-end gap-6 items-center">
                        <button type="button" className="tertiary-btn border-outline-variant text-on-surface-variant py-2 hover:text-primary transition-colors" onClick={closeEditForm} disabled={isSavingEdit}>
                          Cancel
                        </button>
                        <button type="submit" className="arcade-btn px-8" disabled={isSavingEdit}>
                          {isSavingEdit ? "Saving..." : "Save Record"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : null}
      </main>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete this record?"
        message="This action permanently removes the product from the catalog and cannot be undone."
        confirmLabel="Erase permanently"
        cancelLabel="Keep record"
        danger
        busy={isDeleting}
        onConfirm={confirmDeleteProduct}
        onCancel={() => !isDeleting && setShowDeleteConfirm(false)}
      />

      <Footer />
    </div>
  );
}
