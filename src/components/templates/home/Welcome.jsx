import React from "react";
import bg from "../../../assets/bg.jpg";

const Welcome = () => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-center h-full gap-8">
      
      {/* عکس دانشگاه */}
      <div className="flex-1 flex justify-center order-1 md:order-1">
        <div className="relative w-full max-w-md md:max-w-lg rounded-3xl overflow-hidden shadow-2xl">
          <img
            src={bg}
            alt="university"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-gray-900/50 to-transparent"></div>
        </div>
      </div>

      {/* متن راست‌چین */}
      <div className="flex-1 text-right md:text-right space-y-6 px-4 md:px-8 order-0 md:order-2">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 leading-tight">
          خوش آمدید!
        </h1>
        <p className="text-gray-600 text-lg md:text-xl">
          در این سامانه قادر خواهید بود:
        </p>
        <ul className="space-y-3 text-gray-700 text-base md:text-lg">
          <li className="flex items-center gap-2">
            <span className="text-blue-500">📩</span> ثبت و پیگیری <b>تیکت‌ها</b>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">📝</span> شرکت در <b>نظرسنجی‌ها</b>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-purple-500">🤖</span> استفاده از <b>دستیار هوش مصنوعی</b>
          </li>
        </ul>
        <p className="text-gray-500 text-sm mt-2">
          امیدواریم تجربه‌ای بهتر و سریع‌تر از خدمات دانشگاهی داشته باشید.
        </p>
      </div>
    </div>
  );
};

export default Welcome;
