import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Notice from "../UI/Notice";
import { storeAuthSession } from "../../lib/auth";
import "./Auth.css";

function Login() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState({ type: "info", message: "" });
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleChange = (event) => {
    setNotice({ type: "info", message: "" });
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setNotice({ type: "info", message: "" });
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password
        })
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setNotice({
          type: "error",
          message: result.message || "Login failed. Check your email and password and try again."
        });
        return;
      }

      const didStoreSession = storeAuthSession({ token: result.token, user: result.user });
      if (!didStoreSession) {
        setNotice({
          type: "error",
          message: "Login response was incomplete. Restart backend and try again."
        });
        return;
      }

      setNotice({ type: "success", message: "Login successful. Redirecting to home..." });
      navigate("/home");
    } catch (error) {
      console.error("Login error:", error);
      setNotice({
        type: "error",
        message: "Unable to reach the server. Please check your connection and try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" aria-busy={isSubmitting}>
        <h2>Welcome Back</h2>
        <p className="auth-subtitle">Log in to continue shopping and manage your orders.</p>

        <Notice
          type={notice.type}
          message={notice.message}
          onDismiss={notice.message ? () => setNotice({ type: "info", message: "" }) : undefined}
          compact
        />

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="auth-button arcade-btn" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="auth-footer">
          Do not have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
