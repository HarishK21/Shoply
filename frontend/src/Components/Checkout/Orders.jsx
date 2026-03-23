import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Notice from "../UI/Notice";
import Navbar from "../Store/Navbar";
import { apiFetch, clearAuthSession, getAuthToken, getStoredUser } from "../../lib/auth";
import "./Orders.css";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  const navigate = useNavigate();
  const [user] = useState(() => getStoredUser());
  const [token] = useState(() => getAuthToken());

  useEffect(() => {
    if (!user || !token) {
      navigate("/login");
    }
  }, [navigate, token, user]);

  const loadOrders = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    setIsLoading(true);
    setLoadError("");

    try {
      const response = await apiFetch(`/api/orders/${user.id}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || "Could not load your orders.");
      }
      const payload = await response.json();
      setOrders(Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.error("Orders fetch error:", error);
      setLoadError(error.message || "Could not load your orders.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user || !token) {
      return;
    }
    loadOrders();
  }, [token, user, loadOrders]);

  const filtered = useMemo(() => {
    let result = [...orders];

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((order) => {
        const idMatch = String(order.id ?? "").includes(q);
        const firstNameMatch = String(order.firstName ?? "").toLowerCase().includes(q);
        const lastNameMatch = String(order.lastName ?? "").toLowerCase().includes(q);
        const emailMatch = String(order.email ?? "").toLowerCase().includes(q);
        const addressMatch = String(order.address ?? "").toLowerCase().includes(q);
        return idMatch || firstNameMatch || lastNameMatch || emailMatch || addressMatch;
      });
    }

    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === "price-high") {
      result.sort((a, b) => Number(b.totalPrice) - Number(a.totalPrice));
    } else if (sortBy === "price-low") {
      result.sort((a, b) => Number(a.totalPrice) - Number(b.totalPrice));
    }

    return result;
  }, [orders, search, sortBy]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

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

  const clearFilters = () => {
    setSortBy("newest");
    setSearch("");
  };

  return (
    <div className="home">
      <Navbar user={user} onLogout={onLogout} onSearchChange={setSearch} searchValue={search} />

      <main className="home__wrap">
        <div className="home__titleRow">
          <div>
            <h1 className="home__title">My Orders</h1>
            <p className="home__subtitle">Track your purchases and review order details.</p>
          </div>

          <div className="home__controls">
            <div className="badge" aria-label={`${filtered.length} visible orders`}>
              {filtered.length} orders
            </div>

            <button
              type="button"
              className="home__filterToggle"
              aria-expanded={showFilters}
              aria-controls="orders-filter-bar"
              onClick={() => setShowFilters((current) => !current)}
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>

            <button type="button" className="themeToggle" onClick={toggleTheme} aria-label="Toggle light and dark mode">
              <span className="themeToggle__icon">{theme === "dark" ? "Dark" : "Light"}</span>
              <span className={`themeToggle__track ${theme === "light" ? "isOn" : ""}`}>
                <span className="themeToggle__thumb" />
              </span>
            </button>
          </div>
        </div>

        {showFilters && (
          <section id="orders-filter-bar" className="ordersFilterBar" aria-label="Sort and filter orders">
            <div className="ordersFilterBar__group">
              <label htmlFor="sort-select">Sort</label>
              <select id="sort-select" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-high">Total: High to Low</option>
                <option value="price-low">Total: Low to High</option>
              </select>
            </div>

            <button type="button" className="ordersFilterBar__clear" onClick={clearFilters}>
              Clear Filters
            </button>
          </section>
        )}

        {isLoading ? (
          <div className="home__emptyState">Loading orders...</div>
        ) : loadError ? (
          <Notice type="error" message={loadError} actionLabel="Retry" onAction={loadOrders} />
        ) : filtered.length === 0 ? (
          <div className="home__emptyState">
            {search.trim() !== "" ? "No orders match your search." : "You have no orders yet."}
          </div>
        ) : (
          <div className="ordersList">
            {filtered.map((order) => (
              <article key={order.id} className="orderCard">
                <header className="orderCard__header">
                  <div>
                    <h3>Order #{order.id}</h3>
                    <p>
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                  <div className="orderCard__total">
                    <span>Total</span>
                    <strong>${Number(order.totalPrice).toFixed(2)}</strong>
                  </div>
                </header>

                <section className="orderCard__grid">
                  <div>
                    <h4>Customer</h4>
                    <p>{order.firstName} {order.lastName}</p>
                    <p>{order.email}</p>
                  </div>
                  <div>
                    <h4>Delivery Address</h4>
                    <p>{order.address}</p>
                    <p>{order.city}, {order.postalCode}</p>
                  </div>
                </section>

                <section>
                  <h4 className="orderCard__sectionLabel">Items Ordered</h4>
                  <div className="orderCard__items">
                    {Array.isArray(order.items) && order.items.length > 0 ? (
                      order.items.map((item, index) => (
                        <div key={`${item.id}-${index}`} className="orderCard__item">
                          <div>
                            <p>{item.name}</p>
                            <small>Qty: {item.quantity || 1}</small>
                          </div>
                          <p>${(Number(item.price) * (item.quantity || 1)).toFixed(2)}</p>
                        </div>
                      ))
                    ) : (
                      <p className="orderCard__empty">No items listed.</p>
                    )}
                  </div>
                </section>

                <footer className="orderCard__payment">
                  <h4>Payment Method</h4>
                  <div>
                    <p>{order.cardName || "Card"}</p>
                    <p>Card ending in {order.cardNumber ? String(order.cardNumber).slice(-4) : "----"}</p>
                  </div>
                </footer>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__brand">SHOPLY</div>
          <div className="footer__muted">Demo e-commerce platform - CPS630</div>

          <div className="footer__links">
            <a className="footer__link">Hotline</a>
            <a className="footer__link">Email</a>
            <a className="footer__link">Feedback</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
