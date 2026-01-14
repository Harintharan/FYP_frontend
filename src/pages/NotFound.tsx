import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="text-center">
        <h1 className="text-6xl sm:text-8xl lg:text-9xl font-bold mb-2 sm:mb-4 text-gray-300">404</h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-3 sm:mb-4">Oops! Page not found</p>
        <a href="/" className="inline-flex items-center justify-center h-10 sm:h-11 px-6 text-sm sm:text-base rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
