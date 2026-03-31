import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchCart } from "../../lib/cart";

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
    <header className="sticky top-0 z-50 glass-panel border-b border-outline-variant/30">
      <div className="max-w-[1440px] mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Left: Brand & Links */}
        <div className="flex items-center gap-10">
          <button 
            onClick={() => navigate("/home")}
            className="font-display text-2xl tracking-tight text-primary hover:opacity-80 transition-opacity flex items-center gap-2"
          >
            Shoply
          </button>

          <nav className="hidden md:flex items-center gap-8">
            <NavLink 
              to="/home" 
              className={({ isActive }) => `text-sm font-semibold uppercase tracking-widest ${isActive ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary border-b-2 border-transparent'} py-1 transition-colors`}
            >
              Shop
            </NavLink>
            <NavLink 
              to="/orders" 
              className={({ isActive }) => `text-sm font-semibold uppercase tracking-widest ${isActive ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary border-b-2 border-transparent'} py-1 transition-colors`}
            >
              Orders
            </NavLink>
            <NavLink 
              to="/realtime" 
              className={({ isActive }) => `text-sm font-semibold uppercase tracking-widest ${isActive ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary border-b-2 border-transparent'} py-1 transition-colors`}
            >
              Live Chat
            </NavLink>
          </nav>
        </div>

        {/* Center: Search */}
        <div className={`flex-1 max-w-md mx-8 transition-opacity duration-300 ${location.pathname !== "/home" || !hasSearch ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
          <div className="relative flex items-center w-full">
            <svg className="w-5 h-5 text-on-surface-variant absolute left-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="w-full bg-transparent border-b border-outline-variant/50 pl-8 pr-2 py-2 text-sm text-primary focus:outline-none focus:border-primary transition-colors placeholder:text-outline"
              placeholder="Search products..."
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>
        </div>

        {/* Right: Cart, User, Logout */}
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate("/checkout")}
            className="flex items-center gap-2 text-primary hover:text-secondary transition-colors relative"
            aria-label="Cart"
          >
            <span className="text-sm font-semibold uppercase tracking-widest">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-4 bg-secondary text-on-secondary text-[10px] font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                {cartCount}
              </span>
            )}
          </button>

          <div className="hidden sm:flex items-center gap-3 border-l border-outline-variant/30 pl-6">
            <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-sm font-semibold text-primary">
              {(user?.name?.[0] || "U").toUpperCase()}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant leading-none">Signed In</span>
              <span className="text-sm font-semibold text-primary leading-tight">{user?.name || "Guest"}</span>
            </div>
          </div>

          <button 
            onClick={onLogout}
            className="text-sm font-semibold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors sm:ml-2"
          >
            Logout
          </button>
        </div>

      </div>
    </header>
  );
}
