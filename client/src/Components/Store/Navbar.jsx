import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar({ user, onLogout, onSearchChange, searchValue }) {
  const navigate = useNavigate();

  return (
    <header className="nav">
      <div className="nav__inner">
        <div className="nav__left">
          <button className="nav__brand" onClick={() => navigate("/home")}>
            SHOPLY
          </button>

          <nav className="nav__links">
            <Link to="/home" className="nav__link">Home</Link>
            <Link to="/checkout" className="nav__link">Checkout</Link>
          </nav>
        </div>

        <div className="nav__center">
          <div className="nav__search">
            <span className="nav__searchIcon">⌕</span>
            <input
              className="nav__searchInput"
              placeholder="Search products..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        <div className="nav__right">
          <div className="nav__user">
            <div className="nav__avatar">
              {(user?.name?.[0] || "U").toUpperCase()}
            </div>
            <div className="nav__userText">
              <div className="nav__hello">Signed in</div>
              <div className="nav__name">{user?.name || "Guest"}</div>
            </div>
          </div>

          <button className="nav__btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}