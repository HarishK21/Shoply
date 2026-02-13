import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import "./Home.css";
const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [search, setSearch] = useState("");

    const [theme, setTheme] = useState(() => {
        return localStorage.getItem("theme") || "dark";
      });
    
    const user = JSON.parse(localStorage.getItem("user") || "null");

    const addToCart = () => {
        // Get existing cart or initialize empty array
        const currentCart = JSON.parse(localStorage.getItem("cart") || "[]");
        
        // Check if item already exists
        const existingItemIndex = currentCart.findIndex((item) => item.id === product.id);

        if (existingItemIndex > -1) {
            // Increment quantity
            currentCart[existingItemIndex].quantity = (currentCart[existingItemIndex].quantity || 1) + 1;
        } else {
            // Add new item
            currentCart.push({ ...product, quantity: 1 });
        }

        // Save back to local storage
        localStorage.setItem("cart", JSON.stringify(currentCart));
        
        // Trigger a simple alert for demo purposes
        alert(`Added ${product.name} to cart!`);
        
        // Optional: Dispatch event to update Navbar count immediately if it listens for it
        window.dispatchEvent(new Event("storage"));
    };

    useEffect(() => {
        if (!user) navigate("/login");
    }, [user, navigate]);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    useEffect(() => {
        fetch(`http://localhost:8080/api/items/${id}`)
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
        return <div className="home" style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>Loading...</div>;
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
                    gridTemplateColumns: 'minmax(300px, 1fr) 2fr', /* Image col, Details col */
                    gap: '40px',
                    alignItems: 'start'
                }}>
                    
                    {/* LEFT COLUMN: IMAGE */}
                    <div className="image-container" style={{ 
                        width: '100%', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        backgroundColor: 'rgba(255,255,255,0.03)', 
                        borderRadius: '16px', 
                        padding: '40px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        minHeight: '400px'
                    }}>
                        {product.hasImage ? (
                            <img 
                                src={product.imageURL.startsWith('http') ? product.imageURL : `${window.location.origin}${product.imageURL}`} 
                                alt={product.name} 
                                style={{ 
                                    maxWidth: '100%', 
                                    maxHeight: '400px', 
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

                    {/* RIGHT COLUMN: DETAILS */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div className="card__meta" style={{ marginBottom: '0', display: 'block' }}>
                            <div className="card__name" style={{ fontSize: '2rem', color: 'var(--accent-color)', fontWeight: 'bold' }}>
                                {product.name}
                            </div>
                            <div className="badge" style={{ marginTop: '10px', display: 'inline-block' }}>
                                Item ID: {product.id}
                            </div>
                        </div>
                        
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '15px' }}>
                            <h3 style={{ marginBottom: '10px' }}>About this item</h3>
                            <p style={{ lineHeight: '1.6', color: 'var(--home-subtext)', fontSize: '1.05rem' }}>
                                {product.description}
                            </p>
                        </div>
                        
                        {product.postedBy && (
                            <div style={{ marginTop: 'auto', fontSize: '0.9rem', opacity: 0.7, fontStyle: 'italic' }}>
                                Seller: {product.postedBy}
                            </div>
                        )}
                            <div className="card__price" style={{ fontSize: '2rem', color: 'var(--accent-color)', fontWeight: 'bold' }}>
                                ${product.price}
                            </div>

                        <button type="button" className="addToCartBtn" onClick={addToCart}>
                            Add to Cart
                        </button>
                    </div>
                </div>
            </main>

            <footer className="footer">
                <div className="footer__inner">
                    <div className="footer__brand">shoply</div>
                    <div className="footer__muted">demo e-commerce platform · cps630</div>
                </div>
            </footer>
        </div>
    );
}


export default ProductDetails;