import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import "./Home.css";

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [search, setSearch] = useState("");

    // Edit modal state
    const [showEditForm, setShowEditForm] = useState(false);
    const [editData, setEditData] = useState({
        name: '',
        description: '',
        postedBy: '',
        price: '',
        hasImage: false,
        imageURL: ''
    });

    const [theme, setTheme] = useState(() => {
        return localStorage.getItem("theme") || "dark";
    });

    const user = JSON.parse(localStorage.getItem("user") || "null");

    const addToCart = () => {
        const currentCart = JSON.parse(localStorage.getItem("cart") || "[]");
        const existingItemIndex = currentCart.findIndex((item) => item.id === product.id);

        if (existingItemIndex > -1) {
            currentCart[existingItemIndex].quantity = (currentCart[existingItemIndex].quantity || 1) + 1;
        } else {
            currentCart.push({ ...product, quantity: 1 });
        }

        localStorage.setItem("cart", JSON.stringify(currentCart));
        alert(`Added ${product.name} to cart!`);
        window.dispatchEvent(new Event("storage"));
    };

    const deleteProduct = async () => {
        if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/items/${product.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                try {
                    const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
                    const updatedCart = currentCart.filter((it) => it.id !== product.id);
                    localStorage.setItem('cart', JSON.stringify(updatedCart));
                    window.dispatchEvent(new Event('storage'));
                    window.dispatchEvent(new Event('cartUpdated'));
                } catch (e) {
                    console.warn('Failed to update local cart after deletion', e);
                }

                alert('Product deleted successfully!');
                navigate('/home');
            } else {
                alert('Failed to delete product');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Error deleting product');
        }
    };

    // ---- Edit (Update) handlers ----
    const openEditForm = () => {
        setEditData({
            name: product.name || '',
            description: product.description || '',
            postedBy: product.postedBy || '',
            price: product.price || '',
            hasImage: product.hasImage || false,
            imageURL: product.imageURL || ''
        });
        setShowEditForm(true);
    };

    const closeEditForm = () => setShowEditForm(false);

    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const submitEdit = async (e) => {
        e.preventDefault();
        if (!editData.name || editData.price === '') {
            alert('Please enter item name and price');
            return;
        }

        try {
            const resp = await fetch(`/api/items/${product.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editData.name,
                    description: editData.description,
                    postedBy: editData.postedBy,
                    price: Number(editData.price),
                    hasImage: !!editData.hasImage,
                    imageURL: editData.imageURL
                })
            });

            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                alert(err.message || 'Failed to update item');
                return;
            }

            const updated = await resp.json();
            setProduct(updated);

            // Also update in local cart if present
            try {
                const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
                const cartIdx = currentCart.findIndex((it) => it.id === updated.id);
                if (cartIdx > -1) {
                    currentCart[cartIdx] = { ...currentCart[cartIdx], ...updated };
                    localStorage.setItem('cart', JSON.stringify(currentCart));
                    window.dispatchEvent(new Event('storage'));
                    window.dispatchEvent(new Event('cartUpdated'));
                }
            } catch (e) {
                console.warn('Failed to update cart after edit', e);
            }

            closeEditForm();
            alert('Product updated successfully!');
        } catch (err) {
            console.error('Error updating item', err);
            alert('Error updating item');
        }
    };

    useEffect(() => {
        if (!user) navigate("/login");
    }, [user, navigate]);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    useEffect(() => {
        fetch(`/api/items/${id}`)
            .then(res => {
                if (!res.ok) throw new Error("Product not found");
                return res.json();
            })
            .then(data => setProduct(data))
            .catch(err => console.error('Error fetching product:', err));
    }, [id]);

    const onLogout = () => {
        localStorage.removeItem("user");
        navigate("/login");
    };

    const toggleTheme = () => {
        setTheme((t) => (t === "dark" ? "light" : "dark"));
    };

    if (!product) {
        return <div className="home" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex', fontSize: '16px', color: 'var(--home-subtext)' }}>Loading...</div>;
    }

    return (
        <div className="home">
            <Navbar user={user} onLogout={onLogout} onSearchChange={setSearch} searchValue={search} />

            <main className="home__wrap">
                <div className="home__titleRow">
                    <div>
                        <h1 className="home__title">{product.name}</h1>
                        <p className="home__subtitle">Product Details</p>
                    </div>

                    <div className="home__controls">
                        <button type="button" className="themeToggle" onClick={toggleTheme}>
                            <span className="themeToggle__icon">{theme === "dark" ? "🌙" : "☀️"}</span>
                            <span className={`themeToggle__track ${theme === "light" ? "isOn" : ""}`}>
                                <span className="themeToggle__thumb" />
                            </span>
                        </button>
                    </div>
                </div>

                <div className="card" style={{
                    marginTop: '20px',
                    display: 'grid',
                    gridTemplateColumns: 'minmax(280px, 1fr) 2fr',
                    gap: '40px',
                    alignItems: 'start'
                }}>

                    {/* LEFT: Image */}
                    <div style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255,255,255,0.02)',
                        borderRadius: '16px',
                        padding: '40px',
                        border: '1px solid var(--border)',
                        minHeight: '380px'
                    }}>
                        {product.hasImage ? (
                            <img
                                src={product.imageURL.startsWith('http') ? product.imageURL : `${window.location.origin}${product.imageURL}`}
                                alt={product.name}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '380px',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.2))'
                                }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        ) : (
                            <div style={{ color: 'var(--home-subtext)', fontStyle: 'italic' }}>
                                No Image Available
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ marginBottom: '0', display: 'block' }}>
                            <div style={{ fontSize: '1.8rem', color: 'var(--accent-color)', fontWeight: '800', letterSpacing: '-0.5px' }}>
                                {product.name}
                            </div>
                            <div className="badge" style={{ marginTop: '10px', display: 'inline-block' }}>
                                Item ID: {product.id}
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                            <h3 style={{ marginBottom: '10px', fontSize: '16px', fontWeight: '700' }}>About this item</h3>
                            <p style={{ lineHeight: '1.7', color: 'var(--home-subtext)', fontSize: '15px' }}>
                                {product.description}
                            </p>
                        </div>

                        {product.postedBy && (
                            <div style={{ fontSize: '14px', opacity: 0.6, fontStyle: 'italic' }}>
                                Seller: {product.postedBy}
                            </div>
                        )}

                        <div style={{ fontSize: '2rem', color: 'var(--accent-color)', fontWeight: '800' }}>
                            ${product.price}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button type="button" className="addToCartBtn" onClick={addToCart} style={{ flex: 1 }}>
                                🛒 Add to Cart
                            </button>
                            <button type="button" className="addToCartBtn" onClick={openEditForm} style={{
                                flex: 1,
                                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)'
                            }}>
                                ✏️ Edit Product
                            </button>
                            <button type="button" className="addToCartBtn backBtn" onClick={() => navigate("/home")} style={{ flex: 1 }}>
                                ← Back to Home
                            </button>
                            <button type="button" className="addToCartBtn" onClick={deleteProduct} style={{
                                flex: 1,
                                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                boxShadow: '0 4px 16px rgba(239, 68, 68, 0.3)'
                            }}>
                                🗑️ Delete Product
                            </button>
                        </div>
                    </div>
                </div>

                {/* Edit Modal */}
                {showEditForm && (
                    <div className="editModalOverlay" onClick={(e) => { if (e.target === e.currentTarget) closeEditForm(); }}>
                        <div className="editModalCard">
                            <h3 style={{ marginTop: 0, marginBottom: '18px', fontSize: '20px', fontWeight: '700' }}>Edit Product</h3>
                            <form onSubmit={submitEdit}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <input name="name" placeholder="Name" value={editData.name} onChange={handleEditChange} required />
                                    <input name="postedBy" placeholder="Seller" value={editData.postedBy} onChange={handleEditChange} />
                                    <input name="price" placeholder="Price" type="number" step="0.01" value={editData.price} onChange={handleEditChange} required />
                                    <input name="imageURL" placeholder="Image URL" value={editData.imageURL} onChange={handleEditChange} />
                                </div>
                                <div style={{ marginTop: 12 }}>
                                    <textarea name="description" placeholder="Description" value={editData.description} onChange={handleEditChange} rows={4} style={{ width: '100%', resize: 'vertical' }} />
                                </div>
                                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '14px' }}>
                                        <input type="checkbox" name="hasImage" checked={editData.hasImage} onChange={handleEditChange} /> Has Image
                                    </label>
                                </div>
                                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                    <button type="button" onClick={closeEditForm}>Cancel</button>
                                    <button type="submit">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>

            <footer className="footer">
                <div className="footer__inner">
                    <div className="footer__brand">SHOPLY</div>
                    <div className="footer__muted">demo e-commerce platform · cps630</div>
                </div>
            </footer>
        </div>
    );
}

export default ProductDetails;