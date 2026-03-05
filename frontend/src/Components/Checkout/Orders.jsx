import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../Store/Navbar";
import "./Orders.css";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (!user) navigate("/login");
  }, []);

  useEffect(() => {
    fetch(`/api/orders/${user.id}`)
      .then((r) => r.json())
      .then(setOrders)
      .catch(console.error);
  }, [user.id]);
  const filtered = useMemo(() => {
    let result = orders;

    // Apply search filter (search by order ID, name, email, or address)
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((order) => 
        String(order.id).includes(q) ||
        order.firstName.toLowerCase().includes(q) ||
        order.lastName.toLowerCase().includes(q) ||
        order.email.toLowerCase().includes(q) ||
        order.address.toLowerCase().includes(q)
      );
    }

    // Apply sorting
    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === "price-high") {
      result.sort((a, b) => b.totalPrice - a.totalPrice);
    } else if (sortBy === "price-low") {
      result.sort((a, b) => a.totalPrice - b.totalPrice);
    }

    return result;
  }, [orders, search, sortBy]);

  // apply theme to entire page
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const onLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const toggleTheme = () => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  };


  return (
    <div className="home">
      <Navbar
        user={user}
        onLogout={onLogout}
        onSearchChange={setSearch}
        searchValue={search}
      />

      <main className="home__wrap">
        <div className="home__titleRow">
          <div>
            <h1 className="home__title">My Orders</h1>
            <p className="home__subtitle">Browse your orders and view details.</p>
          </div>

          {/* RIGHT SIDE: items badge + theme toggle */}
          <div className="home__controls">

            <button
              type="button"
              className="themeToggle"
              onClick={toggleTheme}
              aria-label="Toggle light mode"
              title="Toggle light/dark"
            >
              <span className="themeToggle__icon">{theme === "dark" ? "🌙" : "☀️"}</span>
              <span className={`themeToggle__track ${theme === "light" ? "isOn" : ""}`}>
                <span className="themeToggle__thumb" />
              </span>
            </button>
          </div>
        </div>
      

        {/* Filter and Sort Controls */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          alignItems: 'center',
          padding: '12px',
          border: '1px solid var(--input-border)',
          borderRadius: '8px',
          backgroundColor: 'rgba(255,255,255,0.03)'
        }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label htmlFor="sort-select" style={{ fontSize: '0.9rem' }}>Sort:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '6px 8px',
                borderRadius: '4px',
                border: '1px solid var(--input-border)',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--home-text)',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              <option style={{ color: 'black' }} value="newest">Newest First</option>
              <option style={{ color: 'black' }} value="oldest">Oldest First</option>
              <option style={{ color: 'black' }} value="price-high">Total: High to Low</option>
              <option style={{ color: 'black' }} value="price-low">Total: Low to High</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setSortBy("newest");
              setSearch("");
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid var(--input-border)',
              backgroundColor: 'rgba(200, 100, 100, 0.15)',
              color: 'var(--home-text)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginLeft: 'auto',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(200, 100, 100, 0.25)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(200, 100, 100, 0.15)'}
          >
            Clear Filters
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="noResults">
            {search.trim() !== "" ? "No orders found matching your search" : "You have no orders yet"}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filtered.map((order) => (
              <div key={order.id} style={{
                border: '1px solid var(--card-border)',
                borderRadius: '12px',
                padding: '20px',
                backgroundColor: 'var(--card-bg)',
                boxShadow: 'var(--card-shadow)'
              }}>
                {/* Order Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                  marginBottom: '16px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid var(--card-border)'
                }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', color: 'var(--accent-color)' }}>Order #{order.id}</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--home-subtext)' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--home-subtext)' }}>Total</p>
                    <h3 style={{ margin: '4px 0 0 0', color: 'var(--accent-color)', fontSize: '1.4rem' }}>
                      ${order.totalPrice.toFixed(2)}
                    </h3>
                  </div>
                </div>

                {/* Customer & Delivery Info */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '20px',
                  marginBottom: '16px'
                }}>
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', color: 'var(--home-text)', fontSize: '0.9rem' }}>Customer</h4>
                    <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>{order.firstName} {order.lastName}</p>
                    <p style={{ margin: '4px 0', fontSize: '0.85rem', color: 'var(--home-subtext)' }}>{order.email}</p>
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', color: 'var(--home-text)', fontSize: '0.9rem' }}>Delivery Address</h4>
                    <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>{order.address}</p>
                    <p style={{ margin: '4px 0', fontSize: '0.85rem', color: 'var(--home-subtext)' }}>
                      {order.city}, {order.postalCode}
                    </p>
                  </div>
                </div>

                {/* Items in Order */}
                <div style={{
                  marginBottom: '16px'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', color: 'var(--home-text)', fontSize: '0.9rem' }}>Items Ordered</h4>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    {order.items && order.items.map((item, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px',
                        backgroundColor: 'rgba(255,255,255,0.02)',
                        borderRadius: '6px'
                      }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.9rem' }}>{item.name}</p>
                          <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--home-subtext)' }}>
                            Qty: {item.quantity || 1}
                          </p>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--accent-color)' }}>
                          ${(item.price * (item.quantity || 1)).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Method */}
                <div style={{
                  paddingTop: '12px',
                  borderTop: '1px solid var(--card-border)'
                }}>
                  <h4 style={{ margin: '0 0 8px 0', color: 'var(--home-text)', fontSize: '0.9rem' }}>Payment Method</h4>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>
                      💳 {order.cardName}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--home-subtext)' }}>
                      ···· {order.cardNumber ? order.cardNumber.slice(-4) : '****'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* footer for bottom space */}
      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__brand">shoply</div>
          <div className="footer__muted">
            demo e-commerce platform · cps630
          </div>

          <div className="footer__links">
            <a className="footer__link" >Hotline</a>
            <a className="footer__link" >Email</a>
            <a className="footer__link" >Feedback</a>
          </div>
        </div>
      </footer>
    </div>
  );
}