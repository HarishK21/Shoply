import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchCart } from "../../lib/cart";
import "./Navbar.css";

export default function Navbar({ user, onLogout, onSearchChange, searchValue = "" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const hasSearch = typeof onSearchChange === "function";

  useEffect(() => {
    let isMounted = true;

    const updateCartCount = async () => {
      try {
        const items = await fetchCart();
        const count = items.reduce((total, item) => total + (item.quantity || 1), 0);
        if (isMounted) {
          setCartCount(count);
        }
      } catch {
        if (isMounted) {
          setCartCount(0);
        }
      }
    };

    updateCartCount();

    window.addEventListener("cartUpdated", updateCartCount);
    window.addEventListener("authChanged", updateCartCount);

    return () => {
      isMounted = false;
      window.removeEventListener("cartUpdated", updateCartCount);
      window.removeEventListener("authChanged", updateCartCount);
    };
  }, []);

  return (
    <header className="nav">
      <div className="nav__inner">
        <div className="nav__left">
          <button className="nav__brand" onClick={() => navigate("/home")}>
            <div className="coin-container" aria-hidden="true">
              <div className="coin">
                <div className="coin-front">$</div>
                <div className="coin-back">$</div>
              </div>
            </div>
            SHOPLY
          </button>

          <nav className="nav__links" aria-label="Main">
            <NavLink to="/home" className={({ isActive }) => `nav__link ${isActive ? "is-active" : ""}`.trim()}>
              Home
            </NavLink>
            <NavLink to="/orders" className={({ isActive }) => `nav__link ${isActive ? "is-active" : ""}`.trim()}>
              My Orders
            </NavLink>
            <NavLink to="/realtime" className={({ isActive }) => `nav__link ${isActive ? "is-active" : ""}`.trim()}>
              Live Chat
            </NavLink>
          </nav>
        </div>

        <div className="nav__center">
          <div
            className={`nav__search ${location.pathname !== "/home" || !hasSearch ? "nav__search--hidden" : ""}`}
            aria-hidden={location.pathname !== "/home" || !hasSearch}
          >
            <span className="nav__searchIcon">Find</span>
            <input
              className="nav__searchInput"
              placeholder="Search products"
              value={searchValue}
              onChange={(event) => onSearchChange?.(event.target.value)}
              aria-label="Search products"
            />
          </div>
        </div>

        <div className="nav__right">
          <button className="nav__cart" onClick={() => navigate("/checkout")} aria-label="Open cart and checkout">
            <span className="nav__cartLabel">Cart</span>
            {cartCount > 0 && <span className="nav__cartBadge">{cartCount}</span>}
          </button>

          <div className="nav__user" aria-label={`Signed in as ${user?.name || "Guest"}`}>
            <div className="nav__avatar">{(user?.name?.[0] || "U").toUpperCase()}</div>
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
