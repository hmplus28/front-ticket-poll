// src/components/common/ProtectedRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const token = localStorage.getItem("authToken");
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch("http://localhost:8000/api/accounts/profile/", {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          localStorage.removeItem("authToken");
        }
      } catch (error) {
        localStorage.removeItem("authToken");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);
  if (loading) {
    return <div className="flex justify-center items-center h-screen">در حال بارگذاری...</div>;
  }
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  // برای مسیر گزارش‌گیری، فقط سوپرادمین‌ها یا کاربران با دسترسی view_report_tickets اجازه دسترسی دارند
  if (location.pathname.startsWith('/reports') && !(user.is_superuser || user.view_report_tickets)) {
    return <Navigate to="/" replace />;
  }
  return children;
};
export default ProtectedRoute;