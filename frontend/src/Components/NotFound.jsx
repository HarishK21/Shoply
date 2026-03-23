import { useNavigate } from "react-router-dom";
import Notice from "./UI/Notice";
import "./Auth/Auth.css";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "56px", color: "#818cf8", marginBottom: "10px", marginTop: 0 }}>404</h1>
        <h2 style={{ fontSize: "24px", marginBottom: "16px" }}>Page Not Found</h2>
        <Notice type="warning" message="The page you requested does not exist or may have moved." compact />
        <button className="auth-button arcade-btn" onClick={() => navigate("/home")} style={{ marginTop: "18px" }}>
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;
