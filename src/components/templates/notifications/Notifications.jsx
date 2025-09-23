import React, { useState, useEffect } from "react";
import { TiTicket } from "react-icons/ti";
import { SiLimesurvey } from "react-icons/si";
import Tickets from "../tickets/Tickets";
import { useNavigate } from "react-router-dom";

// نمایش لیست نظرسنجی‌ها به صورت کارت مشابه تیکت
const SectionSurveysList = ({ surveys }) => {
  const navigate = useNavigate();

  if (!surveys || surveys.length === 0)
    return <p className="text-center text-gray-400 text-lg">نظرسنجی موجود نیست</p>;

  // مرتب‌سازی نظرسنجی‌ها: ابتدا نظرسنجی‌های پرنشده، سپس پرشده
  const sortedSurveys = [...surveys].sort((a, b) => a.user_voted - b.user_voted);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sortedSurveys.map((survey) => {
        const isActive = survey.is_active;
        const totalVotes = survey.pollresult?.total_votes || 0;
        const hasVoted = survey.user_voted;

        return (
          <div
            key={survey.id}
            onClick={() => navigate(`/survey/${survey.id}`)}
            className={`cursor-pointer p-4 border rounded-lg shadow transition duration-200 
              ${hasVoted ? "bg-gray-100 border-gray-300 opacity-60" : "bg-white hover:bg-blue-50 border-blue-300"}
              ${!isActive && "cursor-not-allowed"}
            `}
          >
            <div className="flex justify-between items-start">
              <p className={`font-semibold text-lg mb-2 ${hasVoted ? "text-gray-500" : "text-gray-800"}`}>{survey.question}</p>
              <span
                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  isActive ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                }`}
              >
                {isActive ? "فعال" : "غیرفعال"}
              </span>
            </div>

            <p className={`text-sm ${hasVoted ? "text-gray-400" : "text-gray-500"}`}>
              توسط: {survey.created_by?.first_name || 'ناشناس'} {survey.created_by?.last_name || ''}
            </p>
            <p className={`text-xs mt-1 ${hasVoted ? "text-gray-400" : "text-gray-400"}`}>
              نوع: {survey.question_type === "descriptive" ? "تشریحی" : "چندگزینه‌ای"}
            </p>
            <p className={`text-sm mt-2 ${hasVoted ? "text-gray-400" : "text-gray-500"}`}>
              تعداد رأی‌ها: {totalVotes}
            </p>
          </div>
        );
      })}
    </div>
  );
};

// ------------------------------------------------------------------------------------------------------------------------------------------------

const Notifications = () => {
  const [isActive, setIsActive] = useState("ticket");
  const [tickets, setTickets] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem("authToken");

      if (!token) {
        console.error("توکن پیدا نشد. کاربر به صفحه ورود هدایت می‌شود.");
        setLoading(false);
        navigate("/login"); 
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      };

      try {
        // واکشی تیکت‌ها
        const resTickets = await fetch("http://localhost:8000/api/tickets/tickets/my_tickets/", { headers });
        if (resTickets.ok) {
          const data = await resTickets.json();
          setTickets(data || []);
        } else if (resTickets.status === 401 || resTickets.status === 403) {
            console.error("خطا: احراز هویت تیکت‌ها با شکست مواجه شد.");
            navigate("/login");
            return;
        } else {
            console.error("خطا در دریافت تیکت‌ها:", resTickets.status, resTickets.statusText);
        }

        // واکشی نظرسنجی‌ها
        const resSurveys = await fetch("http://localhost:8000/api/polls/accessible-surveys/", { headers });
        if (resSurveys.ok) {
          const data = await resSurveys.json();
          setSurveys(data || []);
        } else if (resSurveys.status === 401 || resSurveys.status === 403) {
            console.error("خطا: احراز هویت نظرسنجی‌ها با شکست مواجه شد.");
            navigate("/login");
            return;
        } else {
            const errorBody = await resSurveys.text();
            console.error("خطا در دریافت نظرسنجی‌ها:", resSurveys.status, resSurveys.statusText);
            console.error("پاسخ کامل سرور (ممکن است HTML باشد):", errorBody);
        }
      } catch (err) {
        console.error("خطا در ارتباط با سرور یا شبکه:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg">
        در حال بارگذاری...
      </div>
    );
  }

  const openTicketsCount = tickets.filter(
    (t) => t.status !== "closed" && t.status !== "rejected" && t.status !== "done"
  ).length;

  // محاسبه تعداد نظرسنجی‌های فعال و پرنشده
  const activeUnvotedSurveysCount = surveys.filter(
    (survey) => survey.is_active && !survey.user_voted
  ).length;

  return (
    <div className="container m-auto px-4 my-4">
      <div className="flex items-center justify-center mt-4">
        <p className="font-Estedad text-2xl font-bold text-blue-120">اعلان</p>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 mt-4">
        <ul className="flex flex-wrap -mb-px text-base font-medium text-center text-gray-500 dark:text-gray-400 justify-center">
          <li className="me-4 relative">
            <button
              onClick={() => setIsActive("ticket")}
              className={`inline-flex items-center justify-center p-5 relative cursor-pointer ${
                isActive === "ticket"
                  ? "text-blue-600 border-b-2 border-blue-600 rounded-t-lg font-semibold"
                  : ""
              }`}
            >
              <TiTicket
                className={`w-6 h-6 me-2 ${
                  isActive === "ticket" ? "text-blue-600" : "text-gray-400"
                }`}
              />
              <span className="text-lg">تیکت</span>
              {openTicketsCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {openTicketsCount}
                </span>
              )}
            </button>
          </li>

          <li className="me-4 relative">
            <button
              onClick={() => setIsActive("survey")}
              className={`inline-flex items-center justify-center p-5 relative cursor-pointer ${
                isActive === "survey"
                  ? "text-blue-600 border-b-2 border-blue-600 rounded-t-lg font-semibold"
                  : ""
              }`}
            >
              <SiLimesurvey
                className={`w-6 h-6 me-2 ${
                  isActive === "survey" ? "text-blue-600" : "text-gray-400"
                }`}
              />
              <span className="text-lg">نظرسنجی</span>
              {activeUnvotedSurveysCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {activeUnvotedSurveysCount}
                </span>
              )}
            </button>
          </li>
        </ul>
      </div>

      {isActive === "ticket" ? (
        <div className="grid grid-cols-1 gap-3 mt-8">
          {tickets.length > 0 ? (
            <Tickets tickets={tickets} showAddButton={false} />
          ) : (
            <p className="text-center text-gray-400 text-lg">تیکتی موجود نیست</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 mt-8">
          <SectionSurveysList surveys={surveys} />
        </div>
      )}
    </div>
  );
};

export default Notifications;