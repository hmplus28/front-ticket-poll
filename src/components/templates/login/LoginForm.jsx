import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import Swal from "sweetalert2";
import bg from "../../../assets/uni2.jpg";
import logo from "../../../assets/unilogo.jpg";

const LoginForm = () => {
  const navigate = useNavigate();
  const [isUserNameFocused, setIsUserNameFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");
  const [checkingLogin, setCheckingLogin] = useState(true); // بررسی ورود کاربر

  // دریافت توکن CSRF
  useEffect(() => {
    const fetchCSRFToken = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/accounts/csrf/", {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        setCsrfToken(data.csrfToken);
      } catch (error) {
        console.error("خطا در دریافت توکن CSRF:", error);
      }
    };
    fetchCSRFToken();
  }, []);

  // بررسی ورود قبلی کاربر
  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setCheckingLogin(false); // توکن نیست، فرم نمایش داده بشه
        return;
      }

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
          navigate("/"); // کاربر لاگین کرده، هدایت به صفحه اصلی
        } else {
          localStorage.removeItem("authToken"); // توکن نامعتبر
          setCheckingLogin(false);
        }
      } catch (err) {
        console.error("خطا در بررسی وضعیت کاربر:", err);
        setCheckingLogin(false);
      }
    };

    checkToken();
  }, [navigate]);

  // تابع لاگین
  const login = async (username, password) => {
    try {
      const response = await fetch("http://localhost:8000/api/accounts/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (result.user || result.token) {
        if (result.token) {
          localStorage.setItem("authToken", result.token);
        }

        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "ورود موفق",
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
        }).then(() => {
          navigate("/");
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "خطا",
          text: result.error || "نام کاربری یا رمز عبور اشتباه است",
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

  // Formik برای مدیریت فرم
  const form = useFormik({
    initialValues: { username: "", password: "" },
    onSubmit: (values, { setSubmitting }) => {
      login(values.username, values.password);
      setTimeout(() => setSubmitting(false), 2000);
    },
    validate: (values) => {
      const errors = {};
      if (!values.username) errors.username = "وارد کردن نام کاربری اجباری است";
      else if (values.username.length < 4)
        errors.username = "نام کاربری باید حداقل ۴ کاراکتر باشد";
      if (!values.password) errors.password = "وارد کردن رمز عبور اجباری است";
      return errors;
    },
  });

  // اگر هنوز وضعیت ورود بررسی نشده، نمایش لودینگ
  if (checkingLogin) {
    return (
      <div className="h-screen w-full flex items-center justify-center text-white text-lg">
        در حال بررسی وضعیت ورود...
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative flex items-center justify-center overflow-hidden">
      <img src={bg} alt="background" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/25 to-black/40"></div>

      <img src={logo} alt="دانشگاه" className="absolute top-5 right-5 w-20 h-20 md:w-32 md:h-32" />

      <div className="relative z-10 w-11/12 max-w-md md:max-w-md p-6 md:p-10 bg-white/20 backdrop-blur-md rounded-3xl shadow-2xl">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-3 text-white">خوش آمدید!</h1>
        <p className="text-center text-gray-200 mb-6 text-sm md:text-base">
          با حساب کاربری خود وارد سامانه شوید
        </p>

        <form onSubmit={form.handleSubmit} className="flex flex-col gap-4">
          <div className={`flex flex-col rounded-xl border-2 px-3 py-2 ${
            isUserNameFocused ? "border-blue-400" : "border-gray-300"
          } bg-white/20 backdrop-blur-sm`}>
            <label className="text-gray-100 text-sm md:text-base mb-1">نام کاربری</label>
            <input
              name="username"
              value={form.values.username}
              onChange={form.handleChange}
              onBlur={() => setIsUserNameFocused(false)}
              onFocus={() => setIsUserNameFocused(true)}
              className="outline-none bg-transparent w-full text-white placeholder-gray-300 text-sm md:text-base"
              placeholder="نام کاربری"
            />
          </div>
          {form.errors.username && form.touched.username && (
            <p className="text-red-500 text-sm text-right">{form.errors.username}</p>
          )}

          <div className={`flex flex-col rounded-xl border-2 px-3 py-2 ${
            isPasswordFocused ? "border-blue-400" : "border-gray-300"
          } bg-white/20 backdrop-blur-sm`}>
            <label className="text-gray-100 text-sm md:text-base mb-1">رمز عبور</label>
            <input
              type="password"
              name="password"
              value={form.values.password}
              onChange={form.handleChange}
              onBlur={() => setIsPasswordFocused(false)}
              onFocus={() => setIsPasswordFocused(true)}
              className="outline-none bg-transparent w-full text-white placeholder-gray-300 text-sm md:text-base"
              placeholder="رمز عبور"
            />
          </div>
          {form.errors.password && form.touched.password && (
            <p className="text-red-500 text-sm text-right">{form.errors.password}</p>
          )}

          <button
            type="submit"
            disabled={form.isSubmitting}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 md:py-3 rounded-xl font-medium text-sm md:text-base transition-colors"
          >
            {form.isSubmitting ? "درحال ورود..." : "ورود"}
          </button>
        </form>
      </div>

      <div className="absolute bottom-10 text-white text-center w-full space-y-1">
        <h2 className="text-sm md:text-lg font-bold">سامانه تیکتینگ و نظرسنجی</h2>
        <p className="text-xs md:text-sm text-gray-200">ثبت تیکت، شرکت در نظرسنجی‌ها و دستیار هوش مصنوعی</p>
      </div>
    </div>
  );
};

export default LoginForm;
