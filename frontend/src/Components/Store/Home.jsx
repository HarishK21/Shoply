import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Notice from "../UI/Notice";
import Navbar from "./Navbar";
import { apiFetch, clearAuthSession, getAuthToken, getStoredUser } from "../../lib/auth";
import "./Home.css";

const initialItemState = {
  name: "",
  description: "",
  postedBy: "",
  price: "",
  hasImage: false,
  imageURL: ""
};

export default function Home() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sortBy, setSortBy] = useState("none");
  const [showFilters, setShowFilters] = useState(true);
  const [notice, setNotice] = useState({ type: "info", message: "" });

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  const [showAddForm, setShowAddForm] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState(initialItemState);

  const navigate = useNavigate();
  const [user] = useState(() => getStoredUser());
  const [token] = useState(() => getAuthToken());

  useEffect(() => {
    if (!user || !token) {
      navigate("/login");
    }
  }, [navigate, token, user]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const loadItems = async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const response = await fetch("/api/items");
      if (!response.ok) {
        throw new Error("Could not load products right now.");
      }
      const payload = await response.json();
      setItems(Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.error("Fetch items error:", error);
      setLoadError("Could not load products right now. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    if (!showAddForm) {
      return undefined;
    }

    const onEscape = (event) => {
      if (event.key === "Escape" && !isAddingItem) {
        setShowAddForm(false);
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [isAddingItem, showAddForm]);

  const filtered = useMemo(() => {
    let result = [...items];

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((item) => item.name.toLowerCase().includes(q));
    }

    const minPrice = priceMin === "" ? -Infinity : Number(priceMin);
    const maxPrice = priceMax === "" ? Infinity : Number(priceMax);
    result = result.filter((item) => item.price >= minPrice && item.price <= maxPrice);

    if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [items, search, priceMin, priceMax, sortBy]);

  const hasFilters = search.trim() !== "" || priceMin !== "" || priceMax !== "" || sortBy !== "none";

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

  const openAddForm = () => {
    setNotice({ type: "info", message: "" });
    setShowAddForm(true);
  };

  const closeAddForm = () => {
    if (!isAddingItem) {
      setShowAddForm(false);
    }
  };

  const handleNewItemChange = (event) => {
    const { name, value, type, checked } = event.target;
    setNewItem((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const submitNewItem = async (event) => {
    event.preventDefault();
    setNotice({ type: "info", message: "" });

    const trimmedName = newItem.name.trim();
    const parsedPrice = Number(newItem.price);

    if (!trimmedName) {
      setNotice({ type: "warning", message: "Item name is required." });
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setNotice({ type: "warning", message: "Enter a valid price greater than 0." });
      return;
    }

    setIsAddingItem(true);
    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          description: newItem.description.trim(),
          postedBy: newItem.postedBy.trim(),
          userId: user ? user.id : null,
          price: parsedPrice,
          hasImage: Boolean(newItem.hasImage),
          imageURL: newItem.imageURL.trim()
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setNotice({ type: "error", message: payload.message || "Unable to add item." });
        return;
      }

      setItems((prev) => [payload, ...prev]);
      setNewItem(initialItemState);
      setShowAddForm(false);
      setNotice({ type: "success", message: "Item added successfully." });
    } catch (error) {
      console.error("Add item error:", error);
      setNotice({ type: "error", message: "Network error while adding item." });
    } finally {
      setIsAddingItem(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setPriceMin("");
    setPriceMax("");
    setSortBy("none");
  };

  return (
    <div className="home">
      <Navbar user={user} onLogout={onLogout} onSearchChange={setSearch} searchValue={search} />

      <main className="home__wrap">
        {notice.message && (
          <div className="home__notice">
            <Notice
              type={notice.type}
              message={notice.message}
              onDismiss={() => setNotice({ type: "info", message: "" })}
            />
          </div>
        )}

        <div className="home__titleRow">
          <div>
            <h1 className="home__title">Home</h1>
            <p className="home__subtitle">Browse products, filter quickly, and manage items.</p>
          </div>

          <div className="home__controls">
            <div className="badge" aria-label={`${filtered.length} visible items`}>
              {filtered.length} items
            </div>

            <button
              type="button"
              className="home__filterToggle"
              aria-expanded={showFilters}
              aria-controls="home-filter-bar"
              onClick={() => setShowFilters((current) => !current)}
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>

            <button type="button" className="home__addBtn" onClick={openAddForm}>
              Add Item
            </button>

            <button
              type="button"
              className="themeToggle"
              onClick={toggleTheme}
              aria-label="Toggle light and dark mode"
              title="Toggle light and dark mode"
            >
              <span className="themeToggle__icon">{theme === "dark" ? "Dark" : "Light"}</span>
              <span className={`themeToggle__track ${theme === "light" ? "isOn" : ""}`}>
                <span className="themeToggle__thumb" />
              </span>
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="addItemModalOverlay" role="presentation" onClick={(event) => event.target === event.currentTarget && closeAddForm()}>
            <div className="addItemModalCard" role="dialog" aria-modal="true" aria-labelledby="add-item-title">
              <h3 id="add-item-title">Add New Item</h3>
              <p className="addItemModalCard__subtitle">Required fields are marked. This will publish to the product list.</p>
              <form onSubmit={submitNewItem}>
                <div className="addItemModalCard__grid">
                  <input name="name" placeholder="Name (required)" value={newItem.name} onChange={handleNewItemChange} required />
                  <input name="postedBy" placeholder="Seller name" value={newItem.postedBy} onChange={handleNewItemChange} />
                  <input name="price" placeholder="Price (required)" type="number" step="0.01" value={newItem.price} onChange={handleNewItemChange} required />
                  <input name="imageURL" placeholder="Image URL or /images/..." value={newItem.imageURL} onChange={handleNewItemChange} />
                </div>
                <div className="addItemModalCard__field">
                  <textarea name="description" placeholder="Description" value={newItem.description} onChange={handleNewItemChange} rows={4} />
                </div>
                <label className="addItemModalCard__check">
                  <input type="checkbox" name="hasImage" checked={newItem.hasImage} onChange={handleNewItemChange} />
                  Item includes an image
                </label>
                <div className="addItemModalCard__actions">
                  <button type="button" onClick={closeAddForm} disabled={isAddingItem}>
                    Cancel
                  </button>
                  <button type="submit" disabled={isAddingItem}>
                    {isAddingItem ? "Adding..." : "Add Item"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showFilters && (
          <section id="home-filter-bar" className="homeFilterBar" aria-label="Filter and sort products">
            <div className="homeFilterBar__group">
              <label htmlFor="filter-min">Price Range</label>
              <input
                id="filter-min"
                type="number"
                placeholder="Min"
                value={priceMin}
                onChange={(event) => setPriceMin(event.target.value)}
              />
              <span>to</span>
              <input
                id="filter-max"
                type="number"
                placeholder="Max"
                value={priceMax}
                onChange={(event) => setPriceMax(event.target.value)}
              />
            </div>

            <div className="homeFilterBar__group">
              <label htmlFor="sort-select">Sort</label>
              <select id="sort-select" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="none">None</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>

            <button type="button" className="homeFilterBar__clear" onClick={clearFilters} disabled={!hasFilters}>
              Clear Filters
            </button>
          </section>
        )}

        {isLoading ? (
          <div className="grid grid--loading" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, index) => (
              <article key={`skeleton-${index}`} className="card card--skeleton">
                <div className="card__media card__media--skeleton" />
                <div className="card__line card__line--title" />
                <div className="card__line card__line--price" />
                <div className="card__line card__line--link" />
              </article>
            ))}
          </div>
        ) : loadError ? (
          <Notice type="error" message={loadError} actionLabel="Retry" onAction={loadItems} />
        ) : filtered.length === 0 ? (
          <div className="home__emptyState">
            {hasFilters ? "No items match your current filters." : "No products available yet."}
          </div>
        ) : (
          <div className="grid">
            {filtered.map((item) => {
              const rawImage = typeof item.imageURL === "string" ? item.imageURL.trim() : "";
              const imageSrc = item.hasImage && rawImage
                ? rawImage.startsWith("http")
                  ? rawImage
                  : `${window.location.origin}${rawImage}`
                : "";

              return (
                <article key={item.id} className="card">
                  <div className="card__media">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={item.name}
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="card__placeholder">No image</div>
                    )}
                  </div>

                  <h3 className="card__name">{item.name}</h3>
                  <div className="card__meta">
                    <div className="card__price">${Number(item.price).toFixed(2)}</div>
                  </div>

                  <Link className="card__link" to={`/product/${item.id}`}>
                    View Details
                  </Link>
                </article>
              );
            })}
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
