import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../Store/Navbar";
import "./Checkout.css";

export default function Checkout() {

  const [search, setSearch] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    userId: null,
    email: "",
    address: "",
    city: "",
    postalCode: "",
    cardName: "",
    cardNumber: "",
    cardExpiry: "",
    cardCVV: ""
  });
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmedOrderDetails, setConfirmedOrderDetails] = useState(null);

  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });
  // theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + Number(item.price) * (item.quantity || 1), 0);
  }, [cart]);
  
  const taxRate = 0.13;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  useEffect(() => {
    if (!user) navigate("/login");
  }, []);

  useEffect(() => {
    // Get initial cart count from localStorage
    const updateCartCount = () => {
      const cart = localStorage.getItem("cart");
      if (cart) {
        const items = JSON.parse(cart);
        if (Array.isArray(items)) {
          // Sum up quantities for all items 
          const count = items.reduce((total, item) => total + (item.quantity || 1), 0);
          setCartCount(count);
        } else {
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    };

    updateCartCount();

    // Listen for storage changes 
    window.addEventListener("storage", updateCartCount);

    // Event listener for cart updates
    window.addEventListener("cartUpdated", updateCartCount);

    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("cartUpdated", updateCartCount);
    };
  }, []);



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

  {/* Remove Item from Cart */ }
  const removeFromCart = (itemId) => {
    const updatedCart = cart.filter((item) => item.id !== itemId);
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));

    // Trigger cart update event for navbar
    window.dispatchEvent(new Event("storage"));
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    const updatedCart = cart.map((item) =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("storage"));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }
    // Basic payment validation 
    const { cardName, cardNumber, cardExpiry, cardCVV } = formData;
    if (!cardName || !cardNumber || !cardExpiry || !cardCVV) {
      alert('Please complete payment information');
      return;
    }

    const numericCard = cardNumber.replace(/\s+/g, '');
    if (!/^[0-9]{12,19}$/.test(numericCard)) {
      alert('Please enter a valid card number');
      return;
    }

    if (!/^[0-9]{3,4}$/.test(cardCVV)) {
      alert('Please enter a valid CVV');
      return;
    }

    // expiry in MM/YY or MM/YYYY
    if (!/^\d{2}\/\d{2,4}$/.test(cardExpiry)) {
      alert('Please enter expiry in MM/YY or MM/YYYY');
      return;
    }

    try {
      // Calculate total price
      const totalPrice = cart.reduce((total, item) => {
        return total + (item.price * (item.quantity || 1) * 1.13);
      }, 0);

      // Prepare order data
      const orderData = {
        ...formData,
        userId: user.id,
        totalPrice,
        items: cart
      };

      // Send order to backend
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create order' }));
        throw new Error(errorData.message || 'Failed to create order');
      }

      const savedOrder = await response.json();
      console.log('Order saved successfully:', savedOrder);

      // Store order details for confirmation display
      setConfirmedOrderDetails({
        firstName: formData.firstName,
        email: formData.email,
        cardName: formData.cardName,
        cardNumber: formData.cardNumber
      });

      // Clear cart and show confirmation
      emptyCart(false);
      setOrderConfirmed(true);

    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to place order: ' + error.message);
    }
  };

  const emptyCart = (resetConfirmation = true) => {
    setCart([]);
    localStorage.setItem("cart", JSON.stringify([]));
    if (resetConfirmation) {
      setOrderConfirmed(false);
      setConfirmedOrderDetails(null);
    }
    setFormData({
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
    });
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <div className="checkout">
      <Navbar
        user={user}
        onLogout={onLogout}
        onSearchChange={setSearch}
        searchValue={search}
      />

      <main className="checkout__wrap">
        <div className="checkout__titleRow">
          <div>
            <h1 className="checkout__title">Checkout</h1>
            <p className="checkout__subtitle">Browse cart and place order.</p>
          </div>

          {/* RIGHT SIDE: items badge + theme toggle */}
          <div className="checkout__controls">
            <div className="badge">{cartCount} items</div>

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

        {cart.length === 0 && search.trim() !== "" ? (
          <div className="noResults">
            No items found
          </div>
        ) : (
          <div className="checkout__container">
            {/* LEFT SIDE - Cart Items */}
            <div className="checkout__left">
              <h2 className="checkout__sectionTitle">Order Items</h2>
              {cart.length === 0 ? (
                <div className="checkout__emptyCart">Your cart is empty</div>
              ) : (
                <div className="checkout__leftBody">
                  <div className="checkout__itemsScroll">
                    <div className="checkout__grid">
                      {cart.map((item) => (
                        <div key={item.id} className="checkout__card">
                          {/* Image thumbnail */}
                          <div className="checkout__card__imageContainer">
                            {item.hasImage ? (
                              <img
                                src={item.imageURL.startsWith("http") ? item.imageURL : `${window.location.origin}${item.imageURL}`}
                                alt={item.name}
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            ) : (
                              <div style={{ color: "var(--checkout-subtext)", fontSize: "0.75rem" }}>No Image</div>
                            )}
                          </div>

                          {/* Details */}
                          <div className="checkout__card__details">
                            <h3 className="checkout__card__name">{item.name}</h3>

                            <div className="checkout__card__meta">
                              <div className="checkout__card__price">${item.price}</div>
                            </div>

                            <div className="checkout__card__quantity">Qty: {item.quantity || 1}</div>

                            {/* Controls */}
                            <div className="checkout__card__controls">
                              <button
                                className="checkout__card__btn"
                                onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                                title="Decrease quantity"
                              >
                                −
                              </button>
                              <button
                                className="checkout__card__btn"
                                onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                                title="Increase quantity"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Actions */}
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
                  </div>

                  {/* Checkout Total*/}
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
                </div>
              )}
            </div>

            {/* Checkout Form */}
            <div className="checkout__right">
              <h2 className="checkout__sectionTitle">Checkout</h2>
              {orderConfirmed ? (
                <div className="checkout__confirmation">
                  <div className="checkout__confirmIcon">✓</div>
                  <h3>Order Confirmed!</h3>
                  <p>Thank you, {confirmedOrderDetails?.firstName || 'Customer'}! Your order has been placed successfully.</p>
                  <p className="checkout__confirmDetails">
                    A confirmation email will be sent to {confirmedOrderDetails?.email || 'your email'}
                  </p>
                  <div className="checkout__paymentSummary">
                    <h4>Payment</h4>
                    <p>
                      {confirmedOrderDetails?.cardName && <>{confirmedOrderDetails.cardName} — </>}
                      Card ending in {confirmedOrderDetails?.cardNumber ? confirmedOrderDetails.cardNumber.replace(/\s+/g, '').slice(-4) : '----'}
                    </p>
                  </div>
                  <button
                    className="checkout__emptyBtn"
                    onClick={emptyCart}
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <form className="checkout__form" onSubmit={handleSubmitOrder}>
                  <div className="checkout__formGroup">
                    <label>First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleFormChange}
                      required
                      placeholder="First Name"
                    />
                  </div>

                  <div className="checkout__formGroup">
                    <label>Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleFormChange}
                      required
                      placeholder="Last Name"
                    />
                  </div>

                  <div className="checkout__formGroup">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      required
                      placeholder="name@example.com"
                    />
                  </div>

                  <div className="checkout__formGroup">
                    <label>Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleFormChange}
                      required
                      placeholder="123 Main St"
                    />
                  </div>

                  <div className="checkout__formGroup">
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleFormChange}
                      required
                      placeholder="Toronto"
                    />
                  </div>

                  <div className="checkout__formGroup">
                    <label>Postal Code</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleFormChange}
                      required
                      placeholder="M4N 1K1"
                    />
                  </div>

                  {/* Payment Information */}
                  <div className="checkout__sectionTitle" style={{ marginTop: '12px' }}>Payment Information</div>

                  <div className="checkout__formGroup">
                    <label>Cardholder Name</label>
                    <input
                      type="text"
                      name="cardName"
                      value={formData.cardName}
                      onChange={handleFormChange}
                      required
                      placeholder="Name on card"
                    />
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

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div className="checkout__formGroup" style={{ flex: 1 }}>
                      <label>Expiry (MM/YY)</label>
                      <input
                        type="text"
                        name="cardExpiry"
                        value={formData.cardExpiry}
                        onChange={handleFormChange}
                        required
                        placeholder="MM/YY"
                      />
                    </div>

                    <div className="checkout__formGroup" style={{ width: '120px' }}>
                      <label>CVV</label>
                      <input
                        type="password"
                        name="cardCVV"
                        value={formData.cardCVV}
                        onChange={handleFormChange}
                        required
                        placeholder="123"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="checkout__submitBtn arcade-btn"
                    disabled={cart.length === 0}
                  >
                    Place Order
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      {/*footer for bottom area*/}
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