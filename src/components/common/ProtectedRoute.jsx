import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("authToken");

  if (!token) {
    // اگر توکن نباشد، کاربر به صفحه ورود هدایت می‌شود.
    return <Navigate to="/login" replace />;
  }

  // اگر توکن معتبر باشد، کامپوننت‌های فرزند رندر می‌شوند.
  return children;
};

export default ProtectedRoute;