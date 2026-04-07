import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import Notice from "../UI/Notice";
import Navbar from "./Navbar";
import Footer from "../UI/Footer";
import CyberBackdrop from "../UI/CyberBackdrop";
import { apiFetch, clearAuthSession, getAuthToken, getStoredUser } from "../../lib/auth";

const initialItemState = {
  name: "",
  description: "",
  postedBy: "",
  price: "",
  hasImage: false,
  imageURL: ""
};

const MotionLink = motion(Link);

export default function Home() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sortBy, setSortBy] = useState("none");
  const [showFilters, setShowFilters] = useState(false);
  const [notice, setNotice] = useState({ type: "info", message: "" });

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

  const onLogout = async () => {
    try {
      await apiFetch("/api/logout", { method: "POST" });
    } catch {
      // Local auth clear still happens if network logout fails.
    }
    clearAuthSession();
    navigate("/login");
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
      const response = await apiFetch("/api/items", {
        method: "POST",
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
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} onLogout={onLogout} onSearchChange={setSearch} searchValue={search} />

      <main className="flex-1">
        {/* Notice Banner */}
        {notice.message && (
          <div className="max-w-[1440px] mx-auto px-6 mt-6">
            <Notice
              type={notice.type}
              message={notice.message}
              onDismiss={() => setNotice({ type: "info", message: "" })}
            />
          </div>
        )}

        {/* Hero Section */}
        <section className="relative pt-24 pb-20 px-6 max-w-[1440px] mx-auto text-center overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest/70">
          <CyberBackdrop mode="hero" />
          <div className="absolute inset-0 bg-gradient-to-b from-surface-container-low/70 via-transparent to-surface/85"></div>
          <div className="relative z-10">
            <motion.h1
              className="font-display text-5xl md:text-7xl lg:text-8xl tracking-tight text-primary leading-tight mb-8"
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              Refining the Art of<br />
              Everyday Tech & Home Finds
            </motion.h1>
            <motion.p
              className="font-body text-xl text-on-surface-variant max-w-2xl mx-auto mb-12 font-medium"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.12 }}
            >
              Shop phones, laptops, gaming gear, audio devices, sneakers, and furniture from trusted sellers.
            </motion.p>
          </div>
        </section>

        {/* Product Catalog */}
        <section className="py-24 px-6 max-w-[1440px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-outline-variant/30 pb-6 mb-12">
            <div>
              <h2 className="font-display text-4xl text-primary mb-2">Essential Collection</h2>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 mt-6 md:mt-0">
              <div className="text-sm font-semibold uppercase tracking-widest text-on-surface-variant border-x border-outline-variant/30 px-6 py-2">
                 {filtered.length} Items 
              </div>
              <div className="flex items-center gap-4 ml-auto">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-sm font-semibold uppercase tracking-widest text-primary hover:text-secondary transition-colors"
                >
                  {showFilters ? "HIDE FILTERS" : "FILTER & SORT"}
                </button>
                {(user?.role === "admin" || user) && (
                  <button 
                    onClick={openAddForm}
                    className="arcade-btn"
                  >
                    ADD ITEM
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showFilters ? 'max-h-[500px] mb-12 opacity-100' : 'max-h-0 mb-0 opacity-0'}`}>
            <div className="bg-surface-container-low p-8 flex flex-wrap gap-12 items-end border-l border-primary">
              <div>
                <label className="block text-sm font-semibold uppercase tracking-widest text-primary mb-4">Price Range</label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    className="ghost-input w-24 text-center"
                  />
                  <span className="text-on-surface-variant uppercase tracking-widest text-sm">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    className="ghost-input w-24 text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold uppercase tracking-widest text-primary mb-4">Sort By</label>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="ghost-input pr-8 appearance-none bg-transparent cursor-pointer"
                >
                  <option value="none">Default Arrival</option>
                  <option value="price-asc">Price: Ascending</option>
                  <option value="price-desc">Price: Descending</option>
                </select>
              </div>

              <div className="ml-auto">
                <button 
                  onClick={clearFilters}
                  className="tertiary-btn"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-8">
              {Array.from({ length: 9 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="bg-surface-container-highest aspect-[4/5] w-full mb-6 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-surface-container-highest via-surface-container-low to-surface-container-highest animate-pulse"></div>
                  </div>
                  <div className="h-4 bg-surface-container-highest w-3/4 mb-4"></div>
                  <div className="h-4 bg-surface-container-highest w-1/4"></div>
                </div>
              ))}
            </div>
          ) : loadError ? (
            <Notice type="error" message={loadError} actionLabel="Retry" onAction={loadItems} />
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center border-y border-outline-variant/30 flex flex-col items-center justify-center">
              <h3 className="font-display text-3xl text-primary mb-4">No pieces match your criteria</h3>
              <p className="text-on-surface-variant font-medium">Please adjust your search filters to discover available items in the collection.</p>
              {showFilters && (
                <button onClick={clearFilters} className="mt-8 tertiary-btn">View Full Collection</button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-8">
              {filtered.map((item) => {
                const rawImage = typeof item.imageURL === "string" ? item.imageURL.trim() : "";
                const imageSrc = item.hasImage && rawImage
                  ? rawImage.startsWith("http")
                    ? rawImage
                    : `${window.location.origin}${rawImage}`
                  : "";

                return (
                  <MotionLink
                    key={item.id}
                    to={`/product/${item.id}`}
                    className="group block focus-visible:outline-none focus:ring-2 focus:ring-secondary/50 focus:ring-offset-8"
                    whileHover={{ y: -8, rotateX: 2, rotateY: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.995 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  >
                    <div className="bg-surface relative aspect-[4/5] mb-6 overflow-hidden">
                       {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      ) : (
                        <div className="w-full h-full bg-surface-container-high flex flex-col items-center justify-center text-outline group-hover:scale-105 transition-transform duration-700 font-display">
                          Shoply <br/>
                          <span className="font-body text-xs mt-2 uppercase tracking-widest text-outline-variant">Product Record</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-start">
                      <div className="pr-4">
                        <h3 className="font-display text-xl text-primary mb-1 group-hover:text-secondary transition-colors line-clamp-2">{item.name}</h3>
                        {item.postedBy && <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Seller: {item.postedBy}</p>}
                      </div>
                      <div className="font-body font-semibold text-primary pt-1 whitespace-nowrap">
                        ${Number(item.price).toFixed(2)}
                      </div>
                    </div>
                  </MotionLink>
                );
              })}
            </div>
          )}
        </section>

        {/* Add Item Modal Overlay */}
        {showAddForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto" onClick={(e) => e.target === e.currentTarget && closeAddForm()}>
            <div className="bg-surface-container-lowest w-full max-w-2xl shadow-lift my-8 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-8 py-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low">
                <h3 className="font-display text-2xl text-primary">Catalog Entry</h3>
                <button onClick={closeAddForm} className="text-on-surface-variant hover:text-primary transition-colors text-3xl font-light leading-none">&times;</button>
              </div>
              
              <div className="p-8">
                <p className="font-body text-on-surface-variant mb-8 font-medium">Publish a new piece to the collection.</p>
                
                <form onSubmit={submitNewItem} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="label-md block mb-2">Title *</label>
                      <input name="name" className="ghost-input w-full" placeholder="e.g. Sculptural Wool Overcoat" value={newItem.name} onChange={handleNewItemChange} required />
                    </div>
                    <div>
                      <label className="label-md block mb-2">Price *</label>
                      <input name="price" className="ghost-input w-full" placeholder="0.00" type="number" step="0.01" value={newItem.price} onChange={handleNewItemChange} required />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="label-md block mb-2">Seller</label>
                      <input name="postedBy" className="ghost-input w-full" placeholder="Shoply" value={newItem.postedBy} onChange={handleNewItemChange} />
                    </div>
                    <div>
                      <label className="label-md block mb-2">Image Reference URL</label>
                      <input name="imageURL" className="ghost-input w-full" placeholder="https://..." value={newItem.imageURL} onChange={handleNewItemChange} />
                    </div>
                  </div>

                  <div>
                    <label className="label-md block mb-2">Description</label>
                    <textarea name="description" className="ghost-input w-full resize-y" placeholder="Crafted from Italian wool..." value={newItem.description} onChange={handleNewItemChange} rows={4} />
                  </div>
                  
                  <label className="flex items-center gap-3 cursor-pointer mt-4">
                    <input type="checkbox" name="hasImage" className="w-5 h-5 accent-secondary border-outline-variant" checked={newItem.hasImage} onChange={handleNewItemChange} />
                    <span className="font-medium text-primary">Media attached to this record</span>
                  </label>
                  
                  <div className="pt-8 mt-4 border-t border-outline-variant/30 flex justify-end gap-6 items-center">
                    <button type="button" className="tertiary-btn border-outline-variant text-on-surface-variant py-2 hover:text-primary transition-colors" onClick={closeAddForm} disabled={isAddingItem}>
                      Cancel
                    </button>
                    <button type="submit" className="arcade-btn" disabled={isAddingItem}>
                      {isAddingItem ? "Publishing..." : "Submit to Catalog"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
