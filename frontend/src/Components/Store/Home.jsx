import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { apiFetch, clearAuthSession, getAuthToken, getStoredUser } from "../../lib/auth";
import "./Home.css";

export default function Home() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sortBy, setSortBy] = useState("none");

  // theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  const navigate = useNavigate();
  const [user] = useState(() => getStoredUser());
  const [token] = useState(() => getAuthToken());

  useEffect(() => {
    if (!user || !token) navigate("/login");
  }, [navigate, token, user]);

  useEffect(() => {
    fetch("/api/items")
      .then((r) => r.json())
      .then(setItems)
      .catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    let result = items;

    // Apply search filter
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((it) => it.name.toLowerCase().includes(q));
    }

    // Apply price range filter
    const minPrice = priceMin === "" ? -Infinity : Number(priceMin);
    const maxPrice = priceMax === "" ? Infinity : Number(priceMax);
    result = result.filter((it) => it.price >= minPrice && it.price <= maxPrice);

    // Apply sorting
    if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [items, search, priceMin, priceMax, sortBy]);

  // apply theme to entire page
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
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  };

  // Add item modal state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    postedBy: '',
    userId: '',
    price: '',
    hasImage: false,
    imageURL: ''
  });

  const openAddForm = () => setShowAddForm(true);
  const closeAddForm = () => setShowAddForm(false);

  const handleNewItemChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewItem((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const submitNewItem = async (e) => {
    e.preventDefault();
    if (!newItem.name || newItem.price === '') {
      alert('Please enter item name and price');
      return;
    }

    try {
      const resp = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItem.name,
          description: newItem.description,
          postedBy: newItem.postedBy,
          userId: user ? user.id : null,
          price: Number(newItem.price),
          hasImage: !!newItem.hasImage,
          imageURL: newItem.imageURL
        })
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        alert(err.message || 'Failed to add item');
        return;
      }

      const created = await resp.json();
      // prepend to items list
      setItems((prev) => [created, ...prev]);
      setNewItem({ name: '', description: '', postedBy: '', userId: null, price: '', hasImage: false, imageURL: '' });
      closeAddForm();
    } catch (err) {
      console.error('Error adding item', err);
      alert('Error adding item');
    }
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
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div className="badge">{filtered.length} items</div>

              <button
                type="button"
                className="themeToggle arcade-btn"
                onClick={openAddForm}
                title="Add new item"
                style={{ padding: '8px 14px', borderRadius: '12px', border: 'none', background: 'var(--accent-gradient)' }}
              >
                ➕ Add Item
              </button>
            </div>

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

        {/* Add Item */}
        {showAddForm && (
          <div className="addItemModalOverlay">
            <div className="addItemModalCard">
              <h3 style={{ marginTop: 0 }}>Add New Item</h3>
              <form onSubmit={submitNewItem}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <input name="name" placeholder="Name" value={newItem.name} onChange={handleNewItemChange} required />
                  <input name="postedBy" placeholder="Posted By" value={newItem.postedBy} onChange={handleNewItemChange} />
                  <input name="price" placeholder="Price" value={newItem.price} onChange={handleNewItemChange} required />
                  <input name="imageURL" placeholder="Image URL" value={newItem.imageURL} onChange={handleNewItemChange} />
                </div>
                <div style={{ marginTop: 10 }}>
                  <textarea name="description" placeholder="Description" value={newItem.description} onChange={handleNewItemChange} rows={4} style={{ width: '100%' }} />
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" name="hasImage" checked={newItem.hasImage} onChange={handleNewItemChange} /> Has Image
                  </label>
                </div>
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button type="button" onClick={closeAddForm}>Cancel</button>
                  <button type="submit">Add Item</button>
                </div>
              </form>
            </div>
          </div>
        )}
      

        {/* Filter and Sort Controls */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          alignItems: 'center',
          padding: '12px',
          border: '1px solid var(--input-border)',
          borderRadius: '20px',
          backgroundColor: 'rgba(255,255,255,0.03)'
        }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '0.9rem' }}>Price Range:</label>
            <input
              type="number"
              placeholder="Min"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              style={{
                width: '80px',
                padding: '6px 8px',
                borderRadius: '20px',
                border: '1px solid var(--input-border)',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--home-text)',
                fontSize: '0.9rem'
              }}
            />
            <span>—</span>
            <input
              type="number"
              placeholder="Max"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              style={{
                width: '80px',
                padding: '6px 8px',
                borderRadius: '20px',
                border: '1px solid var(--input-border)',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--home-text)',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label htmlFor="sort-select" style={{ fontSize: '0.9rem' }}>Sort:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '6px 8px',
                borderRadius: '20px',
                border: '1px solid var(--input-border)',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--home-text)',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              <option style={{ color: 'black' }} value="none">None</option>
              <option style={{ color: 'black' }} value="price-asc">Price: Low to High</option>
              <option style={{ color: 'black' }} value="price-desc">Price: High to Low</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setPriceMin("");
              setPriceMax("");
              setSortBy("none");
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
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

        {filtered.length === 0 && (search.trim() !== "" || priceMin !== "" || priceMax !== "" || sortBy !== "none") ? (
          <div className="noResults">
            No items found
          </div>
        ) : (
          <div className="grid">
            {filtered.map((item) => (
              <div key={item.id} className="card">
                {/* Image thumbnail */}
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
