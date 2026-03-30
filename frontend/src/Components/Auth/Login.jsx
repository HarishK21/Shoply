import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Notice from "../UI/Notice";
import CyberBackdrop from "../UI/CyberBackdrop";
import { apiFetch, storeAuthSession } from "../../lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState({ type: "info", message: "" });

  const handleLogin = async (e) => {
    e.preventDefault();
    setNotice({ type: "info", message: "" });

    if (!email.trim() || !password.trim()) {
      return setNotice({ type: "warning", message: "Please fill in all fields." });
    }

    setIsLoading(true);
    try {
      const response = await apiFetch("/api/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || "Invalid credentials.");
      }

      storeAuthSession({ token: payload.token, user: payload.user });
      navigate("/home");
      
    } catch (error) {
      setNotice({ type: "error", message: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row">
      <div className="hidden md:flex md:w-1/2 bg-surface-container-highest relative overflow-hidden items-center justify-center">
        <CyberBackdrop mode="login" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/20"></div>
        <div className="z-10 text-center p-12">
          <h1 className="font-display text-5xl lg:text-7xl text-primary mb-6">Shoply</h1>
          <p className="font-body text-xl text-on-surface-variant max-w-md mx-auto">
            Welcome to Shoply. Sign in to continue shopping.
          </p>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center px-6 py-20 md:px-16 lg:px-32 relative">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-12">
            <h2 className="font-display text-4xl text-primary mb-2">Welcome Back</h2>
            <p className="font-body text-on-surface-variant font-medium">Please sign in to access your account.</p>
          </div>
          
          {notice.message && (
            <div className="mb-8">
              <Notice type={notice.type} message={notice.message} onDismiss={() => setNotice({ type: "info", message: ""})} />
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-8">
            <div>
              <label className="label-md block mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="ghost-input w-full"
                required
                autoFocus
                placeholder="Ex. admin@gmail.com"
              />
            </div>

            <div>
              <label className="label-md block mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="ghost-input w-full"
                required
                placeholder="********"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full arcade-btn py-4 text-base tracking-widest uppercase font-semibold text-on-secondary shadow-ambient mt-8 disabled:opacity-50"
            >
              {isLoading ? "Authenticating..." : "Sign In"}
            </button>
          </form>

          <p className="mt-12 text-center text-sm text-on-surface-variant font-medium">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:text-secondary uppercase tracking-widest font-semibold border-b border-primary hover:border-secondary transition-colors pb-0.5 ml-1">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
