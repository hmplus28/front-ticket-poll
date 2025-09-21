import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../../modules/header/Header";
import Dashboard from "../../modules/dashboard/Dashboard";

const Home = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // از این به بعد نیازی به بررسی isLoading و fetch نیست
  // ProtectedRoute قبلاً احراز هویت را انجام داده است.

  return (
    <div className="min-h-screen flex bg-gradient-to-b from-blue-50 to-white transition-all duration-300 ease-in-out">
      {/* داشبورد سمت چپ */}
      <Dashboard mobileOpen={isSidebarOpen} setMobileOpen={setIsSidebarOpen} />

      {/* محتوا سمت راست */}
      <div className="flex-1 flex flex-col relative">
        <Header onMobileMenuToggle={handleMobileMenuToggle} />

        {/* المان‌های تزئینی پشت صفحه */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute w-72 h-72 bg-blue-200 rounded-full -top-16 -left-16 opacity-30 blur-3xl"></div>
          <div className="absolute w-96 h-96 bg-purple-200 rounded-full -bottom-24 -right-24 opacity-20 blur-3xl"></div>
        </div>

        {/* محتوا اصلی */}
        <div className="p-4 md:p-6 w-full">
          <div className="mx-auto w-full max-w-7xl min-w-[400px] rounded-2xl border border-gray-200 bg-white min-h-[80vh] shadow-lg p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;