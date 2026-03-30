import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Notice from "../UI/Notice";
import Navbar from "../Store/Navbar";
import Footer from "../UI/Footer";
import { apiFetch, clearAuthSession, getAuthToken, getStoredUser } from "../../lib/auth";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const navigate = useNavigate();
  const [user] = useState(() => getStoredUser());
  const [token] = useState(() => getAuthToken());

  useEffect(() => {
    if (!user || !token) {
      navigate("/login");
    }
  }, [navigate, token, user]);

  const loadOrders = useCallback(async () => {
    if (!user?.id) return;

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
    if (user && token) {
      loadOrders();
    }
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
        return idMatch || firstNameMatch || lastNameMatch || emailMatch;
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

  const onLogout = async () => {
    try { await apiFetch("/api/logout", { method: "POST" }); } catch { /* ignore */ }
    clearAuthSession();
    navigate("/login");
  };

  const clearFilters = () => {
    setSortBy("newest");
    setSearch("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} onLogout={onLogout} onSearchChange={setSearch} searchValue={search} />

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-6 pt-12 pb-24">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-outline-variant/30 pb-6 mb-12">
          <div>
            <h1 className="font-display text-4xl text-primary mb-2">Order History</h1>
            <p className="font-body text-on-surface-variant font-medium text-lg">Track your purchases and review order details.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-6 mt-6 md:mt-0">
            <div className="text-sm font-semibold uppercase tracking-widest text-on-surface-variant border-x border-outline-variant/30 px-6 py-2">
              {filtered.length} Orders
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm font-semibold uppercase tracking-widest text-primary hover:text-secondary transition-colors"
            >
              {showFilters ? "HIDE FILTERS" : "FILTER & SORT"}
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showFilters ? 'max-h-[500px] mb-12 opacity-100' : 'max-h-0 mb-0 opacity-0'}`}>
          <div className="bg-surface-container-low p-8 flex flex-wrap gap-12 items-end border-l border-primary">
            <div>
              <label className="block text-sm font-semibold uppercase tracking-widest text-primary mb-4">Sort By</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="ghost-input pr-8 appearance-none bg-transparent cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-high">Total: High to Low</option>
                <option value="price-low">Total: Low to High</option>
              </select>
            </div>

            <div className="ml-auto">
              <button onClick={clearFilters} className="tertiary-btn">
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-8 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-surface-container-highest w-full mb-4"></div>
            ))}
          </div>
        ) : loadError ? (
          <Notice type="error" message={loadError} actionLabel="Retry" onAction={loadOrders} />
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center border-y border-outline-variant/30 flex flex-col items-center justify-center">
            <h3 className="font-display text-3xl text-primary mb-4">No records found</h3>
            <p className="text-on-surface-variant font-medium">
              {search.trim() !== "" ? "No orders match your search criteria." : "You have no orders yet in your history."}
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {filtered.map((order) => (
              <article key={order.id} className="bg-surface-container-lowest outline outline-1 outline-outline-variant/30 p-8 shadow-ambient group hover:shadow-lift transition-shadow">
                <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-outline-variant/30 pb-6 mb-6 gap-6">
                  <div>
                    <h3 className="font-display text-2xl text-primary mb-2">Order #{order.id}</h3>
                    <p className="text-on-surface-variant text-sm font-semibold uppercase tracking-widest">
                      {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <span className="text-sm font-semibold uppercase tracking-widest text-on-surface-variant block mb-1">Total Amount</span>
                    <strong className="font-display text-2xl text-primary">${Number(order.totalPrice).toFixed(2)}</strong>
                  </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 font-medium">
                  {/* Left: Customer Info & Payment */}
                  <div className="space-y-8">
                    <section>
                      <h4 className="text-sm font-semibold uppercase tracking-widest text-primary mb-4 border-b border-outline-variant/30 pb-2">Client Details</h4>
                      <div className="text-on-surface-variant space-y-1 text-sm">
                        <p>{order.firstName} {order.lastName}</p>
                        <p>{order.email}</p>
                      </div>
                    </section>
                    
                    <section>
                      <h4 className="text-sm font-semibold uppercase tracking-widest text-primary mb-4 border-b border-outline-variant/30 pb-2">Delivery Details</h4>
                      <div className="text-on-surface-variant space-y-1 text-sm">
                        <p>{order.address}</p>
                        <p>{order.city}, {order.postalCode}</p>
                      </div>
                    </section>
                    
                    <section>
                      <h4 className="text-sm font-semibold uppercase tracking-widest text-primary mb-4 border-b border-outline-variant/30 pb-2">Payment Method</h4>
                      <div className="text-on-surface-variant space-y-1 text-sm">
                        <p>{order.cardName || "Card"}</p>
                        <p>Ending in {order.cardNumber ? String(order.cardNumber).slice(-4) : "----"}</p>
                      </div>
                    </section>
                  </div>
                  
                  {/* Right: Items List */}
                  <section className="md:col-span-2">
                    <h4 className="text-sm font-semibold uppercase tracking-widest text-primary mb-4 border-b border-outline-variant/30 pb-2">Purchased Items</h4>
                    <div className="bg-surface p-6">
                      {Array.isArray(order.items) && order.items.length > 0 ? (
                        <div className="space-y-4">
                          {order.items.map((item, index) => (
                            <div key={`${item.id}-${index}`} className="flex justify-between items-center gap-4 text-sm font-medium border-b border-outline-variant/20 last:border-0 pb-4 last:pb-0">
                              <div className="text-on-surface-variant">
                                <span className="font-semibold text-primary mr-3">{item.quantity || 1}x</span> 
                                {item.name}
                              </div>
                              <span className="text-primary whitespace-nowrap">${(Number(item.price) * (item.quantity || 1)).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-on-surface-variant text-sm py-4">No items listed for this order.</p>
                      )}
                    </div>
                  </section>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
