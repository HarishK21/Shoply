import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Notice from "../UI/Notice";
import { apiFetch, storeAuthSession } from "../../lib/auth";

export default function Register() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState({ type: "info", message: "" });

  const handleRegister = async (e) => {
    e.preventDefault();
    setNotice({ type: "info", message: "" });

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      return setNotice({ type: "warning", message: "Please fill in all fields." });
    }

    if (password.length < 8) {
      return setNotice({ type: "warning", message: "Password must be at least 8 characters." });
    }

    setIsLoading(true);
    try {
      const response = await apiFetch("/api/register", {
        method: "POST",
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          password: password.trim()
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || "Registration failed.");
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
      <div className="hidden md:flex md:w-1/2 bg-surface-container-highest relative overflow-hidden items-center justify-center order-last">
        <div className="absolute inset-0 bg-primary/5"></div>
        <div className="z-10 text-center p-12">
           <h1 className="font-display text-5xl lg:text-7xl text-primary mb-6">Shoply</h1>
           <p className="font-body text-xl text-on-surface-variant max-w-md mx-auto">
             Join Shoply and start building your collection.
           </p>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center px-6 py-20 md:px-16 lg:px-32 relative">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-12">
            <h2 className="font-display text-4xl text-primary mb-2">Create Account</h2>
            <p className="font-body text-on-surface-variant font-medium">Join us to manage your orders and collection.</p>
          </div>
          
          {notice.message && (
            <div className="mb-8">
              <Notice type={notice.type} message={notice.message} onDismiss={() => setNotice({ type: "info", message: ""})} />
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="label-md block mb-2">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="ghost-input w-full"
                  required
                />
              </div>
              <div>
                <label className="label-md block mb-2">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="ghost-input w-full"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label-md block mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="ghost-input w-full"
                required
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
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full arcade-btn py-4 text-base tracking-widest uppercase font-semibold text-on-secondary shadow-ambient mt-8 disabled:opacity-50"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-12 text-center text-sm text-on-surface-variant font-medium">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:text-secondary uppercase tracking-widest font-semibold border-b border-primary hover:border-secondary transition-colors pb-0.5 ml-1">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
