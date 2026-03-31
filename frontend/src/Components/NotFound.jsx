import { useNavigate } from "react-router-dom";
import Notice from "./UI/Notice";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center bg-surface-container-lowest p-12 outline outline-1 outline-outline-variant/30 shadow-ambient">
        <h1 className="font-display text-7xl text-primary mb-4">404</h1>
        <h2 className="font-display text-2xl text-primary mb-6">Page Not Found</h2>
        <div className="mb-8 text-left">
          <Notice type="warning" message="The page you requested does not exist or may have moved." />
        </div>
        <button className="arcade-btn w-full py-4 tracking-widest uppercase text-sm font-semibold" onClick={() => navigate("/home")}>
          Return to Shoply
        </button>
      </div>
    </div>
  );
};

export default NotFound;
