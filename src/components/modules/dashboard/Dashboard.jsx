import React from "react";
import { NavLink } from "react-router-dom";
import { TiTicket } from "react-icons/ti";
import { SiLimesurvey } from "react-icons/si";
import { IoNotifications } from "react-icons/io5";
import { FaUtensils, FaUniversity, FaChalkboardTeacher, FaGlobe, FaRobot } from "react-icons/fa";

const Dashboard = ({ mobileOpen, setMobileOpen }) => {
  const navItemTop = [
    { name: "تیکت", path: "/tickets", icon: <TiTicket className="text-2xl" /> },
    { name: "نظرسنجی", path: "/survey", icon: <SiLimesurvey className="text-2xl" /> },
    { name: "اعلان", path: "/notifications", icon: <IoNotifications className="text-2xl" /> },
    { name: "دستیار هوش مصنوعی", path: "/ai-assistant", icon: <FaRobot className="text-2xl text-purple-500" />, color: "text-purple-500" },
  ];

  const navItemBottom = [
    { name: "سامانه سلف", path: "https://self.birjandut.ac.ir", icon: <FaUtensils className="text-2xl text-yellow-500" />, color: "text-yellow-500" },
    { name: "پرتال پویا", path: "https://pouya.birjandut.ac.ir", icon: <FaUniversity className="text-2xl text-blue-300" />, color: "text-blue-300" },
    { name: "سامانه LMS", path: "https://lms.birjandut.ac.ir", icon: <FaChalkboardTeacher className="text-2xl text-blue-600" />, color: "text-blue-600" },
    { name: "سایت دانشگاه", path: "https://birjandut.ac.ir", icon: <FaGlobe className="text-2xl text-green-500" />, color: "text-green-500" },
  ];

  const renderNav = (items) =>
    items.map((item) =>
      item.path.startsWith("http") ? (
        <a
          href={item.path}
          target="_blank"
          rel="noopener noreferrer"
          key={item.name}
          className={`flex items-center h-10 p-4 rounded-lg gap-x-4 hover:bg-slate-100 transition-all duration-500 ease-in-out font-medium ${item.color}`}
        >
          {item.icon}
          <span className={`text-lg font-Estedad ${item.color}`}>{item.name}</span>
        </a>
      ) : (
        <NavLink
          to={item.path}
          key={item.name}
          className={({ isActive }) =>
            `${isActive ? "bg-hover-100 font-bold text-blue-120" : "text-slate-500 font-medium"} h-10 flex items-center p-4 rounded-lg gap-x-4 hover:bg-slate-100 transition-all duration-500 ease-in-out`
          }
          onClick={() => setMobileOpen(false)}
        >
          {item.icon}
          <span className={`text-lg font-Estedad ${item.color || ""}`}>{item.name}</span>
        </NavLink>
      )
    );

  return (
    <>
      {/* دکمه موبایل */}
      <button
        className="lg:hidden fixed top-5 right-5 z-50 bg-blue-500 text-white p-2 rounded-md shadow-md"
        onClick={() => setMobileOpen(true)}
      >
        منو
      </button>

      {/* overlay موبایل */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 lg:hidden transition-opacity duration-300 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setMobileOpen(false)}
      ></div>

      {/* سایدبار */}
      <aside
        className={`fixed top-0 right-0 z-50 w-80 h-full bg-white text-gray-900 border-l border-gray-200 transition-transform duration-300 ease-in-out pt-14 flex flex-col justify-between
        ${mobileOpen ? "translate-x-0" : "translate-x-full"}
        lg:translate-x-0 lg:sticky lg:h-screen lg:pt-14`}
      >
        <div className="overflow-y-auto flex-1 flex flex-col">
          {/* هدر */}
          <div className="text-center flex flex-col items-center gap-y-3 select-none font-Estedad px-4">
            <a href="https://birjandut.ac.ir" target="_blank" rel="noopener noreferrer">
              <img
                src="loogo.png"
                alt="لوگوی دانشگاه"
                className="w-40 h-35 object-contain mx-auto hover:opacity-90 transition-opacity duration-300"
              />
            </a>
            <span className="text-gray-800 font-bold text-xl mt-2">سامانه نظرسنجی و تیکت</span>
          </div>

          {/* منو */}
          <div className="mt-8 px-4 pb-4">
            <ul className="flex flex-col gap-4">{renderNav(navItemTop)}</ul>
            <div className="my-8 border-t border-gray-200"></div>
            <ul className="flex flex-col gap-4">{renderNav(navItemBottom)}</ul>
          </div>
        </div>

        {/* سازندگان */}
        <div className="pb-4 text-center text-xs text-gray-400 space-y-1">
          <div>ساخته‌شده توسط</div>
          <div className="flex justify-center gap-2">
            <span>محمدرضا مرادزاده</span>
            <span>-</span>
            <span>حمیدرضا مهرآبادی</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Dashboard;
