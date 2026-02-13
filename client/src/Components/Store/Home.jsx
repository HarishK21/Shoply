import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./Home.css";

export default function Home() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");

  // NEW: theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (!user) navigate("/login");
  }, []);

  useEffect(() => {
    fetch("http://localhost:8080/api/items")
      .then((r) => r.json())
      .then(setItems)
      .catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.name.toLowerCase().includes(q));
  }, [items, search]);

  // NEW: apply theme to entire page
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
            <h1 className="home__title">Home</h1>
            <p className="home__subtitle">Browse products and view details.</p>
          </div>

          {/* RIGHT SIDE: items badge + theme toggle */}
          <div className="home__controls">
            <div className="badge">{filtered.length} items</div>

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

        {filtered.length === 0 && search.trim() !== "" ? (
            <div className="noResults">
                No items found
            </div>
            ) : (
              <div className="grid">
              {filtered.map((item) => (
              <div key={item.id} className="card">
                  {/* NEW: Image thumbnail */}
                  <div style={{
                      height: '180px',
                      marginBottom: '10px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                  }}>
                      {item.hasImage ? (
                          <img 
                              src={item.imageURL.startsWith('http') ? item.imageURL : `${window.location.origin}${item.imageURL}`}
                              alt={item.name}
                              style={{
                                  maxWidth: '100%',
                                  maxHeight: '100%',
                                  objectFit: 'contain'
                              }}
                              onError={(e) => { e.target.style.display = 'none'; }} 
                          />
                      ) : (
                          <div style={{ color: 'var(--home-subtext)', fontSize: '0.8rem' }}>No Image</div>
                      )}
                  </div>

                  <h3 className="card__name">{item.name}</h3>

                  <div className="card__meta">
                      <div className="card__price">${item.price}</div>
                  </div>

                  <Link className="card__link" to={`/product/${item.id}`}>
                      View Details
                  </Link>
              </div>
              ))}
          </div>
        )}
      </main>

      {/* NEW: footer fills that empty bottom space nicely */}
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