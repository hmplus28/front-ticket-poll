import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const SurveyDetail = () => {
  const { id } = useParams();
  const [poll, setPoll] = useState(null);
  const [answer, setAnswer] = useState("");
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [error, setError] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPollDetail = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("برای دسترسی به این صفحه، لطفاً وارد شوید.");
        navigate("/login");
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Token ${token}`,
      };

      try {
        // *** تغییر: URL صحیح برای دریافت جزئیات نظرسنجی ***
        const res = await fetch(`http://localhost:8000/api/polls/polls/${id}/`, { headers });
        
        if (res.status === 401 || res.status === 403) {
            setError("توکن شما منقضی شده است. لطفاً دوباره وارد شوید.");
            navigate("/login");
            return;
        }
        
        if (!res.ok) {
            throw new Error("خطا در دریافت جزئیات نظرسنجی.");
        }
        
        const data = await res.json();
        setPoll(data);
        setHasVoted(data.user_voted);

      } catch (err) {
        setError(err.message);
      }
    };

    fetchPollDetail();
  }, [id, navigate]);

  const handleSubmit = async () => {
    // مرحله اول: گرفتن تأیید از کاربر
    const isConfirmed = window.confirm("آیا از ثبت پاسخ خود اطمینان دارید؟");
    if (!isConfirmed) {
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("برای ثبت رأی، لطفاً وارد شوید.");
      navigate("/login");
      return;
    }

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Token ${token}`,
    };

    try {
      let payload = {};
      if (poll.question_type === "descriptive") {
        if (!answer.trim()) {
          alert("لطفا پاسخ خود را وارد کنید.");
          return;
        }
        payload = { answer };
      } else {
        if (!selectedChoice) {
          alert("لطفا یک گزینه را انتخاب کنید.");
          return;
        }
        payload = { choice_id: selectedChoice };
      }

      const response = await fetch(`http://localhost:8000/api/polls/polls/${id}/vote/`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload),
      });

      const errData = await response.json(); // ابتدا داده‌های خطا را بخوان

      if (!response.ok) {
        // *** تغییر: مدیریت خطای خاص برای 403 ***
        if (response.status === 403 && errData.error) {
          throw new Error(errData.error); // نمایش خطای دقیق از بک‌اند
        }
        throw new Error(errData.error || errData.detail || "خطا در ثبت رأی");
      }

      alert("رأی شما با موفقیت ثبت شد!");
      setHasVoted(true);
      navigate("/notifications");

    } catch (err) {
      alert(err.message);
    }
  };

  if (error) return <p className="text-red-500 text-center font-bold mt-8">{error}</p>;
  if (!poll) return <p className="text-center mt-8">در حال بارگذاری...</p>;

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold text-blue-120 mb-2">{poll.question}</h1>
      
      {/* *** تغییر: استفاده از فیلد جدید creator_full_name *** */}
      <p className="text-gray-600 mb-4">ایجاد شده توسط: {poll.creator_full_name}</p>

      {hasVoted ? (
        <p className="text-green-600 font-bold mt-4">شما قبلاً در این نظرسنجی رأی داده‌اید.</p>
      ) : (
        <>
          {poll.question_type === "descriptive" ? (
            <textarea
              className="w-full p-2 border rounded-md mb-4 focus:ring focus:ring-blue-200 focus:outline-none transition-all"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="پاسخ خود را وارد کنید"
              rows="5"
            />
          ) : (
            <div className="space-y-4 mb-4">
              {poll.choices.map(choice => (
                <div key={choice.id} className="flex items-center">
                  <input
                    type="radio"
                    id={`choice-${choice.id}`}
                    name="survey-choice"
                    value={choice.id}
                    checked={selectedChoice === choice.id}
                    onChange={() => setSelectedChoice(choice.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor={`choice-${choice.id}`} className="ml-3 block text-sm font-medium text-gray-700">
                    {choice.text}
                  </label>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={
              poll.question_type === "descriptive"
                ? !answer.trim()
                : !selectedChoice
            }
            className={`px-6 py-3 font-bold rounded-lg transition duration-300 ${
              (poll.question_type === "descriptive" && !answer.trim()) ||
              (poll.question_type !== "descriptive" && !selectedChoice)
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            ثبت پاسخ
          </button>
        </>
      )}
    </div>
  );
};

export default SurveyDetail;