import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Notice from "../UI/Notice";
import "./Auth.css";

function Register() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState({ type: "info", message: "" });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const passwordsMatch = useMemo(
    () => formData.confirmPassword === "" || formData.password === formData.confirmPassword,
    [formData.confirmPassword, formData.password]
  );

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

    if (!passwordsMatch) {
      setNotice({
        type: "warning",
        message: "Passwords do not match. Please confirm your password again."
      });
      return;
    }

    if (formData.password.length < 6) {
      setNotice({
        type: "warning",
        message: "Use at least 6 characters for your password."
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password
        })
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setNotice({ type: "error", message: result.message || "Registration failed. Please try again." });
        return;
      }

      setNotice({ type: "success", message: "Account created. Redirecting to login..." });
      setTimeout(() => navigate("/login"), 700);
    } catch (error) {
      console.error("Register error:", error);
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
        <h2>Create Account</h2>
        <p className="auth-subtitle">Sign up to save your cart and manage orders.</p>

        <Notice
          type={notice.type}
          message={notice.message}
          onDismiss={notice.message ? () => setNotice({ type: "info", message: "" }) : undefined}
          compact
        />

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="register-name">Full Name</label>
            <input
              id="register-name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              autoComplete="name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
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
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              required
            />
            <p className="auth-helpText">Use at least 6 characters.</p>
          </div>

          <div className="form-group">
            <label htmlFor="register-confirm">Confirm Password</label>
            <input
              id="register-confirm"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              required
            />
            {!passwordsMatch && <p className="auth-helpText auth-helpText--error">Passwords do not match.</p>}
          </div>

          <button type="submit" className="auth-button arcade-btn" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
