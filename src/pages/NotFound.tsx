import { useLocation, Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-6xl font-serif font-bold text-brass-200 mb-4">404</h1>
      <p className="text-xl text-brass-300 mb-6">הדף לא נמצא: {location.pathname}</p>
      <Link
        to="/home"
        className="steampunk-button inline-block"
      >
        חזרה לדף הבית
      </Link>
    </div>
  );
};

export default NotFound;
