import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Navbar.css";

export default function Navbar({ user, onLogout, onSearchChange, searchValue }) {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    // Get initial cart count from localStorage
    const updateCartCount = () => {
      const cart = localStorage.getItem("cart");
      if (cart) {
        const items = JSON.parse(cart);
        if (Array.isArray(items)) {
          // Sum up quantities for all items to count total items including duplicates
          const count = items.reduce((total, item) => total + (item.quantity || 1), 0);
          setCartCount(count);
        } else {
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    };

    updateCartCount();

    // Listen for storage changes 
    window.addEventListener("storage", updateCartCount);

    // Event listener for same-tab cart updates
    window.addEventListener("cartUpdated", updateCartCount);

    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("cartUpdated", updateCartCount);
    };
  }, []);

  return (
    <header className="nav">
      <div className="nav__inner">
        <div className="nav__left">
          <button className="nav__brand" onClick={() => navigate("/home")}>
            <div className="coin-container">
              <div className="coin">
                <div className="coin-front">$</div>
                <div className="coin-back">$</div>
              </div>
            </div>
            SHOPLY
          </button>

          <nav className="nav__links">
            <Link to="/home" className="nav__link">Home</Link>
            <Link to="/orders" className="nav__link">My Orders</Link>
          </nav>
        </div>

        <div className="nav__center">
          <div className={`nav__search ${location.pathname !== "/home" ? "nav__search--hidden" : ""}`}>
            <span className="nav__searchIcon">⌕</span>
            <input
              className="nav__searchInput"
              placeholder="Search products..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
        
        <div className="nav__right">
          <button className="nav__cart" onClick={() => navigate("/checkout")}>
            <span className="nav__cartIcon">🛒</span>
            {cartCount > 0 && <span className="nav__cartBadge">{cartCount}</span>}
          </button>

          <div className="nav__user">
            <div className="nav__avatar">
              {(user?.name?.[0] || "U").toUpperCase()}
            </div>
            <div className="nav__userText">
              <div className="nav__hello">Signed in</div>
              <div className="nav__name">{user?.name || "Guest"}</div>
            </div>
          </div>

          <button className="nav__btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}