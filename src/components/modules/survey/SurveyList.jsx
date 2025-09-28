import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaPoll, FaUsers, FaClock, FaTrashAlt, FaLock, FaCheckCircle, FaBan } from "react-icons/fa";

const SurveyCard = ({ poll, user, onAction }) => {
  const isOwner = poll.created_by?.id === user?.id;

  const handleClose = () => {
    if (window.confirm("آیا مطمئن هستید که می‌خواهید این نظرسنجی را ببندید؟")) {
      onAction(poll.id, "close");
    }
  };

  const handleDelete = () => {
    if (window.confirm("آیا مطمئن هستید که می‌خواهید این نظرسنجی را حذف کنید؟")) {
      onAction(poll.id, "delete");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-lg">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Link to={`/survey/results/${poll.id}`} className="block group">
              <h2 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-200">
                {poll.question}
              </h2>
            </Link>
            
            <div className="mt-3 space-y-2">
              <div className="flex items-center text-gray-600 text-sm">
                <FaUsers className="mr-2 text-blue-500" />
                <span>برای: {poll.audience?.department_name || 'نامشخص'}</span>
              </div>
              
              <div className="flex items-center text-gray-600 text-sm">
                <FaPoll className="mr-2 text-green-500" />
                <span>{poll.audience?.section_name || 'نامشخص'}</span>
              </div>
              
              <div className="flex items-center text-gray-600 text-sm">
                <FaClock className="mr-2 text-purple-500" />
                <span>تاریخ ایجاد: {new Date(poll.created_at).toLocaleDateString('fa-IR')}</span>
              </div>
            </div>
          </div>

          {isOwner && (
            <div className="ml-4 flex flex-col space-y-2">
              {poll.is_active ? (
                <button
                  onClick={handleClose}
                  className="flex items-center justify-center w-12 h-12 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors duration-200"
                >
                  <FaLock className="text-lg" />
                </button>
              ) : (
                <div className="flex items-center justify-center w-12 h-12 bg-gray-50 text-gray-500 rounded-full">
                  <FaCheckCircle className="text-lg" />
                </div>
              )}
              
              <button
                onClick={handleDelete}
                className="flex items-center justify-center w-12 h-12 bg-gray-50 text-gray-500 rounded-full hover:bg-gray-100 transition-colors duration-200"
              >
                <FaTrashAlt className="text-lg" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SurveyList = () => {
  const [surveys, setSurveys] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchUser = async () => {
      try {
        const headers = { 
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        };
        const res = await fetch("http://localhost:8000/api/accounts/profile/", { headers });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("Failed to fetch user:", err);
        navigate("/login");
      }
    };

    const fetchSurveys = async () => {
      try {
        const headers = { 
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        };
        const res = await fetch("http://localhost:8000/api/polls/my-surveys/", { headers }); 
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        setSurveys(data || []);
      } catch (err) {
        console.error("Failed to fetch surveys:", err);
      }
    };
    
    const loadData = async () => {
      setLoading(true);
      await fetchUser();
      await fetchSurveys();
      setLoading(false);
    };

    loadData();
  }, [navigate, token]);

  const handleAction = async (surveyId, actionType) => {
    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`
    };
    
    let url = "";
    let method = "POST";
    
    if (actionType === "close") {
      url = `http://localhost:8000/api/polls/polls/${surveyId}/close_poll/`;
    } else if (actionType === "delete") {
      url = `http://localhost:8000/api/polls/polls/${surveyId}/`;
      method = "DELETE";
    }

    if (!url) return;

    try {
      const res = await fetch(url, {
        method: method,
        headers: headers,
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      setSurveys(prevSurveys => prevSurveys.filter(s => s.id !== surveyId));
    } catch (err) {
      console.error(`Failed to perform ${actionType} action:`, err);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center font-Estedad">
        در حال بارگذاری...
      </div>
    );
  }

  // تابع برای بررسی اینکه آیا کاربر می‌تواند نظرسنجی ایجاد کند
  const canCreateSurvey = () => {
    return (user.user_type === "employee" && user.can_create_poll) || user.user_type === "superuser";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-700">نظرسنجی‌های من</h1>
        {canCreateSurvey() ? (
          <a
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center"
            href="/survey/add-survey"
          >
            <FaPoll className="mr-2" /> ایجاد نظرسنجی
          </a>
        ) : (
          <div className="px-6 py-3 bg-gray-200 text-gray-500 font-medium rounded-lg flex items-center">
            <FaBan className="mr-2" /> عدم مجوز ایجاد نظرسنجی
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {surveys.length > 0 ? (
          surveys.map((survey) => (
            <SurveyCard 
              key={survey.id} 
              poll={survey} 
              user={user} 
              onAction={handleAction} 
            />
          ))
        ) : (
          <div className="col-span-full text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">
              <FaPoll />
            </div>
            <p className="text-xl text-gray-500">هنوز نظرسنجی ایجاد نکرده‌اید.</p>
            {canCreateSurvey() ? (
              <p className="text-gray-400 mt-2">برای شروع، یک نظرسنجی جدید بسازید!</p>
            ) : (
              <p className="text-gray-400 mt-2">شما مجاز به ایجاد نظرسنجی نیستید.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveyList;