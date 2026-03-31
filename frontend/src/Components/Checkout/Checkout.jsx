import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Notice from "../UI/Notice";
import Navbar from "../Store/Navbar";
import Footer from "../UI/Footer";
import { apiFetch, clearAuthSession, getAuthToken, getStoredUser } from "../../lib/auth";
import { fetchCart, removeItemFromCart, updateCartItemQuantity } from "../../lib/cart";

const SHIPPING_COST = 15;
const TAX_RATE = 0.08;

const defaultForm = {
  firstName: "",
  lastName: "",
  email: "",
  address: "",
  city: "",
  postalCode: "",
  cardNumber: "",
  cardName: "",
  cardExpiry: "",
  cardCVC: ""
};

export default function Checkout() {
  const navigate = useNavigate();
  const [user] = useState(() => getStoredUser());
  const [token] = useState(() => getAuthToken());
  const [search, setSearch] = useState("");

  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState({ type: "info", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 1 = Cart list, 2 = Checkout form
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem("checkout_draft");
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return { ...defaultForm };
  });

  useEffect(() => {
    if (!user || !token) {
      navigate("/login");
    } else if (!formData.email) {
      setFormData(prev => ({ ...prev, email: user.email || "" }));
    }
  }, [navigate, token, user, formData.email]);

  const loadLocalCart = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const items = await fetchCart();
      setCartItems(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error("Cart load error:", error);
      setLoadError("Could not load your cart.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocalCart();
    const handleCartUpdate = () => loadLocalCart();
    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, [loadLocalCart]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem("checkout_draft", JSON.stringify(formData));
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [formData]);

  const removeLineItem = async (itemId) => {
    setNotice({ type: "info", message: "" });
    try {
      await removeItemFromCart(itemId);
      setCartItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (error) {
      setNotice({ type: "error", message: error.message || "Failed to remove item." });
    }
  };

  const updateQuantity = async (itemId, newQty) => {
    if (newQty < 1) return;
    setNotice({ type: "info", message: "" });
    try {
      await updateCartItemQuantity(itemId, newQty);
      setCartItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, quantity: newQty } : item))
      );
    } catch (error) {
      setNotice({ type: "error", message: error.message || "Failed to update quantity." });
    }
  };

  const totals = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => {
      const p = Number(item.price) || 0;
      const q = Number(item.quantity) || 1;
      return sum + p * q;
    }, 0);

    // Free shipping over $200
    const shipping = subtotal > 0 && subtotal < 200 ? SHIPPING_COST : 0;
    const tax = subtotal * TAX_RATE;
    const total = subtotal + shipping + tax;

    return { subtotal, shipping, tax, total };
  }, [cartItems]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const submitOrder = async (event) => {
    event.preventDefault();
    setNotice({ type: "info", message: "" });

    // Validation
    const requiredFields = ["firstName", "lastName", "email", "address", "city", "postalCode", "cardNumber", "cardName", "cardExpiry", "cardCVC"];
    for (const field of requiredFields) {
      if (!formData[field] || !formData[field].trim()) {
        setNotice({ type: "warning", message: "Please fill in all required delivery and payment fields." });
        return;
      }
    }

    if (!user?.id) {
      setNotice({ type: "error", message: "User session not found." });
      return;
    }

    if (cartItems.length === 0) {
      setNotice({ type: "warning", message: "Your cart is empty." });
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        userId: user.id,
        items: cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1
        })),
        totalPrice: totals.total,
        ...formData
      };

      const response = await apiFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify(orderPayload)
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Checkout failed");
      }

      // Clear cart
      for (const item of cartItems) {
        await removeItemFromCart(item.id).catch(() => {});
      }

      setCartItems([]);
      localStorage.removeItem("checkout_draft");
      setFormData(defaultForm);
      setNotice({ type: "success", message: "Order placed successfully! Redirecting to your orders..." });

      setTimeout(() => {
        navigate("/orders");
      }, 2500);
    } catch (error) {
      console.error("Checkout submit error:", error);
      setNotice({ type: "error", message: error.message || "An error occurred during checkout." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onLogout = async () => {
    try { await apiFetch("/api/logout", { method: "POST" }); } catch { /* ignore */ }
    clearAuthSession();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar user={user} onLogout={onLogout} onSearchChange={setSearch} searchValue={search} />

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-6 pt-12 pb-24">
        {notice.message && (
          <div className="mb-8">
            <Notice type={notice.type} message={notice.message} onDismiss={() => setNotice({ type: "info", message: "" })} />
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 relative">
          
          {/* Left Column: Flow */}
          <div className="flex-1">
            <h1 className="font-display text-4xl text-primary mb-12">
              {currentStep === 1 ? "Shopping Bag" : "Secure Checkout"}
            </h1>

            {isLoading ? (
              <div className="animate-pulse space-y-8">
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-6">
                    <div className="w-24 h-32 bg-surface-container-highest"></div>
                    <div className="flex-1">
                      <div className="h-6 bg-surface-container-highest w-3/4 mb-4"></div>
                      <div className="h-4 bg-surface-container-highest w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : loadError ? (
              <Notice type="error" message={loadError} actionLabel="Retry" onAction={loadLocalCart} />
            ) : cartItems.length === 0 ? (
              <div className="py-16 text-center border-y border-outline-variant/30">
                <p className="font-body text-xl text-primary mb-6">Your bag is currently empty.</p>
                <Link to="/home" className="arcade-btn inline-block">Discover Collection</Link>
              </div>
            ) : currentStep === 1 ? (
              <div className="space-y-12">
                <div className="space-y-8 border-t border-outline-variant/30 pt-8">
                  {cartItems.map((item) => {
                    const rawImage = typeof item.imageURL === "string" ? item.imageURL.trim() : "";
                    const imageSrc = item.hasImage && rawImage
                      ? rawImage.startsWith("http") ? rawImage : `${window.location.origin}${rawImage}`
                      : "";

                    return (
                      <div key={item.id} className="flex gap-6 sm:gap-8 group">
                        <Link to={`/product/${item.id}`} className="w-24 sm:w-32 shrink-0 aspect-[3/4] bg-surface-container-highest overflow-hidden">
                          {imageSrc ? (
                            <img src={imageSrc} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center font-display text-outline-variant text-[10px] uppercase tracking-widest text-center">No Media</div>
                          )}
                        </Link>
                        
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div className="flex justify-between items-start gap-4">
                            <Link to={`/product/${item.id}`} className="font-display text-xl text-primary hover:text-secondary hover:underline underline-offset-4 decoration-1 transition-colors line-clamp-2">
                              {item.name}
                            </Link>
                            <span className="font-body font-semibold text-primary whitespace-nowrap pl-4">
                              ${(Number(item.price) * (item.quantity || 1)).toFixed(2)}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-end mt-4">
                            <div className="flex items-center gap-4">
                              <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Qty</span>
                              <div className="flex items-center border border-outline-variant/50">
                                <button className="px-3 py-1 hover:bg-surface-container-low text-primary transition-colors" onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}>-</button>
                                <span className="px-3 font-body text-sm font-semibold w-8 text-center">{item.quantity || 1}</span>
                                <button className="px-3 py-1 hover:bg-surface-container-low text-primary transition-colors" onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}>+</button>
                              </div>
                            </div>
                            <button className="tertiary-btn text-on-surface-variant hover:text-red-700 hover:border-red-700" onClick={() => removeLineItem(item.id)}>Remove</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex justify-end pt-8 border-t border-outline-variant/30">
                  <button onClick={() => setCurrentStep(2)} className="arcade-btn px-12 py-4 shadow-ambient">
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submitOrder} className="space-y-12 pb-12">
                <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
                  <h2 className="font-display text-2xl text-primary">Delivery Information</h2>
                  <button type="button" onClick={() => setCurrentStep(1)} className="tertiary-btn uppercase tracking-widest text-xs">Return to Bag</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div>
                    <label className="label-md block mb-2">First Name</label>
                    <input name="firstName" className="ghost-input w-full" value={formData.firstName} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <label className="label-md block mb-2">Last Name</label>
                    <input name="lastName" className="ghost-input w-full" value={formData.lastName} onChange={handleInputChange} required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label-md block mb-2">Email Address</label>
                    <input type="email" name="email" className="ghost-input w-full" value={formData.email} onChange={handleInputChange} required />
                  </div>
                  <div className="md:col-span-2 mt-4">
                    <label className="label-md block mb-2">Shipping Address</label>
                    <input name="address" className="ghost-input w-full" value={formData.address} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <label className="label-md block mb-2">City</label>
                    <input name="city" className="ghost-input w-full" value={formData.city} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <label className="label-md block mb-2">Postal / Zip Code</label>
                    <input name="postalCode" className="ghost-input w-full" value={formData.postalCode} onChange={handleInputChange} required />
                  </div>
                </div>

                <div className="border-b border-outline-variant/30 pb-4 pt-8">
                  <h2 className="font-display text-2xl text-primary">Payment Details</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="md:col-span-2">
                    <label className="label-md block mb-2">Name on Card</label>
                    <input name="cardName" className="ghost-input w-full" value={formData.cardName} onChange={handleInputChange} required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label-md block mb-2">Card Number</label>
                    <input name="cardNumber" type="text" maxLength={19} className="ghost-input w-full" placeholder="XXXX XXXX XXXX XXXX" value={formData.cardNumber} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <label className="label-md block mb-2">Expiry Date</label>
                    <input name="cardExpiry" type="text" maxLength={5} className="ghost-input w-full" placeholder="MM/YY" value={formData.cardExpiry} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <label className="label-md block mb-2">Security Code (CVC)</label>
                    <input name="cardCVC" type="text" maxLength={4} className="ghost-input w-full" placeholder="XXX" value={formData.cardCVC} onChange={handleInputChange} required />
                  </div>
                </div>

                <div className="pt-8">
                  <button type="submit" disabled={isSubmitting || cartItems.length === 0} className="arcade-btn w-full py-4 text-base tracking-widest font-semibold shadow-ambient disabled:opacity-50">
                    {isSubmitting ? "Processing Payment..." : `Pay $${totals.total.toFixed(2)}`}
                  </button>
                  <p className="text-center font-body text-sm text-on-surface-variant mt-6 flex justify-center items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Secure 256-bit automated encryption
                  </p>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: Order Summary (Sticky) */}
          <div className="w-full lg:w-[400px] shrink-0">
            <div className="sticky top-32 bg-surface-container-low p-8 outline outline-1 outline-outline-variant/30">
              <h2 className="font-display text-2xl text-primary mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-on-surface-variant font-medium">
                  <span>Subtotal</span>
                  <span className="text-primary">${totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant font-medium">
                  <span>Shipping</span>
                  <span className="text-primary">{totals.shipping === 0 ? "Complimentary" : `$${totals.shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant font-medium">
                  <span>Estimated Tax</span>
                  <span className="text-primary">${totals.tax.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="border-t border-outline-variant/50 pt-6 pb-2 mb-6">
                <div className="flex justify-between items-end">
                  <span className="font-display text-xl text-primary">Total</span>
                  <span className="font-display text-2xl text-primary">${totals.total.toFixed(2)}</span>
                </div>
              </div>

              {currentStep === 2 && cartItems.length > 0 && (
                <div className="mt-8">
                   <h3 className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4 pb-2 border-b border-outline-variant/30">Bag Contents</h3>
                   <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                     {cartItems.map(item => (
                       <div key={item.id} className="flex justify-between gap-4 text-sm font-medium items-center">
                         <span className="text-on-surface-variant truncate">
                           {item.quantity || 1}x {item.name}
                         </span>
                         <span className="text-primary shrink-0">${(Number(item.price) * (item.quantity || 1)).toFixed(2)}</span>
                       </div>
                     ))}
                   </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
