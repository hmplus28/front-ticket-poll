import React, { useState, useEffect, useRef } from "react";
import { MdKeyboardArrowDown, MdLogout, MdMenu } from "react-icons/md";
import { CgProfile } from "react-icons/cg";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const Header = ({ onMobileMenuToggle }) => {
  const [isShow, setIsShow] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [userName, setUserName] = useState(""); // اسم واقعی کاربر
  const [profileData, setProfileData] = useState(null); // داده پروفایل
  const slogan = "پویا ، فناور ، مسئله محور";
  const typingSpeed = 80;
  const pauseTime = 2000;
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // تایپ‌رایتر
  useEffect(() => {
    let index = 0;
    let timeout;

    const type = () => {
      if (index <= slogan.length) {
        setTypedText(slogan.slice(0, index));
        index++;
        timeout = setTimeout(type, typingSpeed);
      } else {
        timeout = setTimeout(() => {
          index = 0;
          setTypedText("");
          timeout = setTimeout(type, typingSpeed);
        }, pauseTime);
      }
    };

    type();
    return () => clearTimeout(timeout);
  }, []);

  // گرفتن یوزرنیم واقعی هنگام لود هدر
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      try {
        const response = await fetch("http://localhost:8000/api/accounts/profile/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`,
          },
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setUserName(data.username); // فرض بر اینکه API فیلد username دارد
          setProfileData(data);
        } else {
          setUserName(""); // توکن نامعتبر
          localStorage.removeItem("authToken");
        }
      } catch (err) {
        console.error("خطا در دریافت پروفایل:", err);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsShow(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // لاگ‌اوت
  const handleLogout = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/accounts/logout/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`,
        },
        credentials: "include",
      });

      const result = await response.json();

      if (result.success || response.ok) {
        localStorage.removeItem("authToken");
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: result.message || "با موفقیت خارج شدید",
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
        }).then(() => navigate("/login"));
      } else {
        Swal.fire({
          icon: "error",
          title: "خطا",
          text: result.error || "خطا در خروج",
        });
      }
    } catch (error) {
      console.error("خطا در ارتباط با سرور:", error);
      Swal.fire({
        icon: "error",
        title: "خطا",
        text: "ارتباط با سرور برقرار نشد",
      });
    }
  };

  // نمایش پروفایل هنگام کلیک
const handleShowProfile = () => {
  if (!profileData) {
    Swal.fire({
      icon: "info",
      title: "درحال بارگذاری...",
      text: "لطفاً کمی صبر کنید",
    });
    return;
  }

  Swal.fire({
    title: `${profileData.first_name} ${profileData.last_name} - پروفایل شما`,
    html: `
      <p><strong>نام کاربری:</strong> ${profileData.username || "-"}</p>
      <p><strong>نام:</strong> ${profileData.first_name || "-"}</p>
      <p><strong>نام خانوادگی:</strong> ${profileData.last_name || "-"}</p>
      <p><strong>ایمیل:</strong> ${profileData.email || "-"}</p>
      <p><strong>شماره تماس:</strong> ${profileData.phone_number || "-"}</p>
      <p><strong>نوع کاربر:</strong> ${profileData.user_type || "-"}</p>
    `,
    icon: "info",
    confirmButtonText: "باشه",
  });
};


  return (
    <header className="sticky top-0 flex w-full bg-white border-b border-gray-200 z-50 px-4 sm:px-6 lg:px-8 shadow-sm h-20">
      <div className="flex w-full items-center justify-between">
        <button className="lg:hidden text-gray-700 text-2xl p-2 mr-2" onClick={onMobileMenuToggle}>
          <MdMenu />
        </button>

        <div className="flex-1 text-sm sm:text-base font-semibold text-gray-700 overflow-hidden whitespace-nowrap">
          {typedText}<span className="animate-pulse">|</span>
        </div>

        <div className="relative flex items-center gap-3" ref={dropdownRef}>
          <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setIsShow(!isShow)}>
            <span className="hidden sm:block font-medium text-gray-800">{userName || "کاربر"}</span>
            <img src="avatar.png" alt="avatar" className="h-12 w-12 rounded-full object-cover border border-gray-300" />
            <MdKeyboardArrowDown className={`text-gray-500 text-xl transition-transform ${isShow ? "rotate-180" : ""}`} />
          </div>

          {isShow && (
            <div className="absolute right-0 mt-12 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
              <ul className="flex flex-col py-2">
                <li>
                  <button onClick={handleShowProfile} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg w-full text-left">
                    <CgProfile className="text-lg" />پروفایل کاربری
                  </button>
                </li>
                <li>
                  <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-lg w-full text-left">
                    <MdLogout className="text-lg" />خروج
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
