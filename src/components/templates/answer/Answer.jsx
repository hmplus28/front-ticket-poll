import React, { useState } from "react";
import { LuMessageCircleQuestion } from "react-icons/lu";
import { NavLink } from "react-router-dom";
import Surveycard from "../../modules/survey/SurveyList";

const Answer = () => {
  const [select, setSelect] = useState();
  const selectOption = (option) => {
    setSelect(option);
  };
  return (
    <div className="container mx-auto px-4 my-3">
      <div className="flex items-center justify-between mt-3">
        <div>
          <p className="font-Estedad text-xl font-bold text-blue-120">
            نظرسنجی
          </p>
        </div>
        <NavLink
          className="w-40 text-center h-auto p-2 text-white font-Estedad bg-blue-100 rounded-md cursor-pointer "
            to={-1}
        >
          بازگشت
        </NavLink>
      </div>
      <div className="flex flex-col mt-6">
        <div className="flex justify-start items-center gap-x-3  mx-20">
          <LuMessageCircleQuestion size={"32px"} className="text-blue-100" />
          <p className="font-medium select-none">
            به نظر شما مهم‌ترین عامل در افزایش کیفیت آموزش دانشگاهی چیست؟
          </p>
        </div>
        <div className="grid grid-cols-2 gap-y-3 justify-center mx-40 items-center mt-12 mb-20">
          <button
            onClick={() => {
              selectOption("option-1");
            }}
            className={`w-64 h-14  ${
              select === "option-1"
                ? "bg-emerald-200"
                : "bg-blue-10 hover:bg-blue-40"
            } rounded-xl flex justify-center items-center cursor-pointer transition-all ease-in-out duration-500 `}
          >
            <p className="select-none text-slate-700 font-semibold">
              گزینه اول
            </p>
          </button>
          <button
            onClick={() => {
              selectOption("option-2");
            }}
            className={`w-64 h-14  ${
              select === "option-2"
                ? "bg-emerald-200"
                : "bg-blue-10 hover:bg-blue-40"
            } rounded-xl flex justify-center items-center  cursor-pointer transition-all ease-in-out duration-500 `}
          >
            <p className="select-none text-slate-700 font-semibold">
              گزینه دوم
            </p>
          </button>
          <button
            onClick={() => {
              selectOption("option-3");
            }}
            className={`w-64 h-14  ${
              select === "option-3"
                ? "bg-emerald-200"
                : "bg-blue-10 hover:bg-blue-40"
            } rounded-xl flex justify-center items-center  cursor-pointer transition-all ease-in-out duration-500 `}
          >
            <p className="select-none text-slate-700 font-semibold">
              گزینه سوم
            </p>
          </button>
          <button
            onClick={() => {
              selectOption("option-4");
            }}
            className={`w-64 h-14  ${
              select === "option-4"
                ? "bg-emerald-200"
                : "bg-blue-10 hover:bg-blue-40"
            } rounded-xl flex justify-center items-center  cursor-pointer transition-all ease-in-out duration-500 `}
          >
            <p className="select-none text-slate-700 font-semibold">
              گزینه چهارم
            </p>
          </button>
        </div>
      </div>
      <div className="flex justify-center">
        <button
          type="button"
          className={`text-white bg-gradient-to-r from-emerald-500 to-green-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-emerald-300 dark:green:ring-cyan-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 cursor-pointer transition-all duration-1000 ease-in-out ${
            select ? "block" : "hidden"
          }`}
        >
         ثبت نظر
        </button>
      </div>
    </div>
  );
};

export default Answer;
