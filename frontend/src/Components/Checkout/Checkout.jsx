import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Notice from "../UI/Notice";
import Navbar from "../Store/Navbar";
import { apiFetch, clearAuthSession, getAuthToken, getStoredUser } from "../../lib/auth";
import { clearCart, fetchCart, removeItemFromCart, updateCartItemQuantity } from "../../lib/cart";
import "./Checkout.css";

const TAX_RATE = 0.13;

const initialFormData = {
  firstName: "",
  lastName: "",
  email: "",
  address: "",
  city: "",
  postalCode: "",
  cardName: "",
  cardNumber: "",
  cardExpiry: "",
  cardCVV: ""
};

export default function Checkout() {
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState(initialFormData);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmedOrderDetails, setConfirmedOrderDetails] = useState(null);
  const [cart, setCart] = useState([]);
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [notice, setNotice] = useState({ type: "info", message: "" });
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  const navigate = useNavigate();
  const [user] = useState(() => getStoredUser());
  const [token] = useState(() => getAuthToken());

  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + (item.quantity || 1), 0),
    [cart]
  );

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price) * (item.quantity || 1), 0),
    [cart]
  );
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const loadCart = async () => {
    setIsLoadingCart(true);
    try {
      const items = await fetchCart();
      setCart(items);
    } catch {
      setCart([]);
      setNotice({ type: "error", message: "Unable to load cart items right now." });
    } finally {
      setIsLoadingCart(false);
    }
  };

  useEffect(() => {
    if (!user || !token) {
      navigate("/login");
      return;
    }

    loadCart();
  }, [navigate, token, user]);

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

  const removeFromCart = async (itemId) => {
    setNotice({ type: "info", message: "" });
    try {
      const items = await removeItemFromCart(itemId);
      setCart(items);
      setNotice({ type: "success", message: "Item removed from cart." });
    } catch {
      setNotice({ type: "error", message: "Failed to remove item." });
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    setNotice({ type: "info", message: "" });
    try {
      if (newQuantity <= 0) {
        const items = await removeItemFromCart(itemId);
        setCart(items);
        return;
      }

      const items = await updateCartItemQuantity(itemId, newQuantity);
      setCart(items);
    } catch {
      setNotice({ type: "error", message: "Failed to update quantity." });
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateOrderForm = () => {
    if (cart.length === 0) {
      return "Your cart is empty.";
    }

    const requiredFields = [
      ["firstName", "First name"],
      ["lastName", "Last name"],
      ["email", "Email"],
      ["address", "Address"],
      ["city", "City"],
      ["postalCode", "Postal code"],
      ["cardName", "Cardholder name"],
      ["cardNumber", "Card number"],
      ["cardExpiry", "Expiry date"],
      ["cardCVV", "CVV"]
    ];

    const missingLabel = requiredFields.find(([field]) => !String(formData[field]).trim())?.[1];
    if (missingLabel) {
      return `${missingLabel} is required.`;
    }

    const numericCard = formData.cardNumber.replace(/\s+/g, "");
    if (!/^[0-9]{12,19}$/.test(numericCard)) {
      return "Enter a valid card number (12 to 19 digits).";
    }

    if (!/^[0-9]{3,4}$/.test(formData.cardCVV)) {
      return "Enter a valid CVV (3 or 4 digits).";
    }

    if (!/^\d{2}\/\d{2,4}$/.test(formData.cardExpiry)) {
      return "Expiry must be in MM/YY or MM/YYYY format.";
    }

    return "";
  };

  const handleSubmitOrder = async (event) => {
    event.preventDefault();
    setNotice({ type: "info", message: "" });

    const validationError = validateOrderForm();
    if (validationError) {
      setNotice({ type: "warning", message: validationError });
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const orderData = {
        ...formData,
        userId: user.id,
        totalPrice: Number(total.toFixed(2)),
        items: cart
      };

      const response = await apiFetch("/api/order", {
        method: "POST",
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to create order" }));
        throw new Error(errorData.message || "Failed to create order");
      }

      setConfirmedOrderDetails({
        firstName: formData.firstName,
        email: formData.email,
        cardName: formData.cardName,
        cardNumber: formData.cardNumber
      });

      await clearCart();
      setCart([]);
      setOrderConfirmed(true);
      setNotice({ type: "success", message: "Order placed successfully." });
    } catch (error) {
      setNotice({ type: "error", message: `Failed to place order: ${error.message}` });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const emptyCartAndContinue = async () => {
    setNotice({ type: "info", message: "" });
    try {
      await clearCart();
      setCart([]);
      setOrderConfirmed(false);
      setConfirmedOrderDetails(null);
      setFormData(initialFormData);
      setNotice({ type: "success", message: "Cart cleared. Continue shopping." });
    } catch {
      setNotice({ type: "error", message: "Failed to clear cart." });
    }
  };

  return (
    <div className="checkout">
      <Navbar user={user} onLogout={onLogout} onSearchChange={setSearch} searchValue={search} />

      <main className="checkout__wrap">
        {notice.message && (
          <div className="checkout__notice">
            <Notice type={notice.type} message={notice.message} onDismiss={() => setNotice({ type: "info", message: "" })} />
          </div>
        )}

        <div className="checkout__titleRow">
          <div>
            <h1 className="checkout__title">Checkout</h1>
            <p className="checkout__subtitle">Review your cart and place your order.</p>
          </div>

          <div className="checkout__controls">
            <div className="badge">{cartCount} items</div>

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

        {isLoadingCart ? (
          <div className="checkout__emptyCart">Loading your cart...</div>
        ) : (
          <div className="checkout__container">
            <div className="checkout__left">
              <h2 className="checkout__sectionTitle">Order Items</h2>
              {cart.length === 0 ? (
                <div className="checkout__emptyCart">Your cart is empty.</div>
              ) : (
                <>
                  <div className="checkout__grid">
                    {cart.map((item) => (
                      <div key={item.id} className="checkout__card">
                        <div className="checkout__card__imageContainer">
                          {item.hasImage && typeof item.imageURL === "string" && item.imageURL.trim() ? (
                            <img
                              src={item.imageURL.trim().startsWith("http") ? item.imageURL.trim() : `${window.location.origin}${item.imageURL.trim()}`}
                              alt={item.name}
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div style={{ color: "var(--checkout-subtext)", fontSize: "12px" }}>No Image</div>
                          )}
                        </div>

                        <div className="checkout__card__details">
                          <h3 className="checkout__card__name">{item.name}</h3>

                          <div className="checkout__card__meta">
                            <div className="checkout__card__price">${Number(item.price).toFixed(2)}</div>
                          </div>

                          <div className="checkout__card__quantity">Qty: {item.quantity || 1}</div>

                          <div className="checkout__card__controls">
                            <button className="checkout__card__btn" onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)} title="Decrease quantity">
                              -
                            </button>
                            <button className="checkout__card__btn" onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)} title="Increase quantity">
                              +
                            </button>
                          </div>
                        </div>

                        <div className="checkout__card__actions">
                          <Link className="checkout__card__link" to={`/product/${item.id}`}>
                            View
                          </Link>

                          <button className="checkout__card__delete" onClick={() => removeFromCart(item.id)} title="Delete from cart">
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="checkout__totals">
                    <div className="checkout__totalsRow">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="checkout__totalsRow">
                      <span>Estimated Shipping</span>
                      <span>Free</span>
                    </div>
                    <div className="checkout__totalsRow">
                      <span>Estimated Tax (13%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="checkout__totalsTotal">
                      <span className="label">TOTAL</span>
                      <span className="value">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="checkout__right">
              <h2 className="checkout__sectionTitle">Checkout</h2>
              {orderConfirmed ? (
                <div className="checkout__confirmation">
                  <div className="checkout__confirmIcon">OK</div>
                  <h3>Order Confirmed</h3>
                  <p>Thank you, {confirmedOrderDetails?.firstName || "Customer"}. Your order has been placed successfully.</p>
                  <p className="checkout__confirmDetails">
                    A confirmation email will be sent to {confirmedOrderDetails?.email || "your email"}
                  </p>
                  <div className="checkout__paymentSummary">
                    <h4>Payment</h4>
                    <p>
                      {confirmedOrderDetails?.cardName ? `${confirmedOrderDetails.cardName} - ` : ""}
                      Card ending in {confirmedOrderDetails?.cardNumber ? confirmedOrderDetails.cardNumber.replace(/\s+/g, "").slice(-4) : "----"}
                    </p>
                  </div>
                  <button className="checkout__emptyBtn" onClick={emptyCartAndContinue}>
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <form className="checkout__form" onSubmit={handleSubmitOrder} noValidate>
                  <div className="checkout__formGroup">
                    <label>First Name</label>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleFormChange} required placeholder="First Name" />
                  </div>

                  <div className="checkout__formGroup">
                    <label>Last Name</label>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleFormChange} required placeholder="Last Name" />
                  </div>

                  <div className="checkout__formGroup">
                    <label>Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleFormChange} required placeholder="name@example.com" />
                  </div>

                  <div className="checkout__formGroup">
                    <label>Address</label>
                    <input type="text" name="address" value={formData.address} onChange={handleFormChange} required placeholder="123 Main St" />
                  </div>

                  <div className="checkout__formGroup">
                    <label>City</label>
                    <input type="text" name="city" value={formData.city} onChange={handleFormChange} required placeholder="Toronto" />
                  </div>

                  <div className="checkout__formGroup">
                    <label>Postal Code</label>
                    <input type="text" name="postalCode" value={formData.postalCode} onChange={handleFormChange} required placeholder="M4N 1K1" />
                  </div>

                  <div className="checkout__sectionTitle" style={{ marginTop: "12px" }}>
                    Payment Information
                  </div>

                  <div className="checkout__formGroup">
                    <label>Cardholder Name</label>
                    <input type="text" name="cardName" value={formData.cardName} onChange={handleFormChange} required placeholder="Name on card" />
                  </div>

                  <div className="checkout__formGroup">
                    <label>Card Number</label>
                    <input
                      type="text"
                      name="cardNumber"
                      inputMode="numeric"
                      value={formData.cardNumber}
                      onChange={handleFormChange}
                      required
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <div className="checkout__formGroup" style={{ flex: 1 }}>
                      <label>Expiry (MM/YY)</label>
                      <input type="text" name="cardExpiry" value={formData.cardExpiry} onChange={handleFormChange} required placeholder="MM/YY" />
                    </div>

                    <div className="checkout__formGroup" style={{ width: "120px" }}>
                      <label>CVV</label>
                      <input type="password" name="cardCVV" value={formData.cardCVV} onChange={handleFormChange} required placeholder="123" />
                    </div>
                  </div>

                  <button type="submit" className="checkout__submitBtn arcade-btn" disabled={cart.length === 0 || isSubmittingOrder}>
                    {isSubmittingOrder ? "Placing Order..." : "Place Order"}
                  </button>
                </form>
              )}
            </div>
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
