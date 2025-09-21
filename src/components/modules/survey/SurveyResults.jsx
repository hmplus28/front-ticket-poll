import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

const SurveyResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchPollAndResults = async () => {
      try {
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        };
        
        const pollRes = await fetch(`http://localhost:8000/api/polls/polls/${id}/details/`, { headers });
        if (!pollRes.ok) throw new Error("خطا در دریافت اطلاعات نظرسنجی.");
        const pollData = await pollRes.json();

        const resultsRes = await fetch(`http://localhost:8000/api/polls/polls/${id}/results/`, { headers });
        if (!resultsRes.ok) throw new Error("خطا در دریافت نتایج نظرسنجی.");
        const resultsData = await resultsRes.json();

        if (pollData.question_type === 'descriptive') {
          const descriptiveRes = await fetch(`http://localhost:8000/api/polls/polls/${id}/descriptive-answers/`, { headers });
          if (!descriptiveRes.ok) throw new Error("خطا در دریافت پاسخ‌های تشریحی.");
          const descriptiveData = await descriptiveRes.json();
          pollData.descriptive_answers = descriptiveData;
        }

        setPoll({ ...pollData, results: resultsData });

      } catch (err) {
        console.error("Failed to fetch data:", err);
        alert("خطا در بارگذاری اطلاعات نظرسنجی یا نتایج.");
        navigate("/notifications");
      } finally {
        setLoading(false);
      }
    };

    fetchPollAndResults();
  }, [id, navigate, token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-Estedad">
        در حال بارگذاری نتایج...
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-Estedad">
        <p>نظرسنجی پیدا نشد.</p>
        <Link className="mt-4 text-blue-500" to="/notifications">
          بازگشت به اعلان‌ها
        </Link>
      </div>
    );
  }
  
  // منطق جدید: تعیین تعداد کل رأی‌ها بر اساس نوع نظرسنجی
  let totalVotes = 0;
  if (poll.question_type === 'descriptive') {
    totalVotes = poll.descriptive_answers ? poll.descriptive_answers.length : 0;
  } else {
    totalVotes = poll.results?.total_votes || 0;
  }

  const hasResults = totalVotes > 0;
  
  return (
    <div className="p-4 max-w-2xl mx-auto font-Estedad">
      <h1 className="text-2xl font-bold mb-2">{poll.question}</h1>
      <p className="text-gray-600 mb-4">تعداد کل رأی‌ها: {totalVotes}</p>
      
      {poll.question_type === 'descriptive' ? (
        hasResults ? (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">پاسخ‌های تشریحی:</h3>
            {poll.descriptive_answers.map((answer, index) => (
              <div key={index} className="p-4 bg-gray-100 rounded-md">
                <p className="text-gray-800">{answer.descriptive_answer}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>هنوز رأیی برای این نظرسنجی ثبت نشده است.</p>
        )
      ) : (
        hasResults ? (
          <div className="space-y-4">
            {Object.values(poll.results).map((choice) => (
              <div key={choice.text} className="border p-4 rounded-md shadow-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold">{choice.text}</span>
                  <span className="text-sm text-gray-600">
                    {choice.votes} رأی ({choice.percentage ? choice.percentage.toFixed(1) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 h-3 rounded-full">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${choice.percentage || 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>هنوز رأیی برای این نظرسنجی ثبت نشده است.</p>
        )
      )}

      <Link className="mt-6 inline-block text-blue-500" to="/survey">
        بازگشت 
      </Link>
    </div>
  );
};

export default SurveyResults;