// src/components/modules/ticket/TicketLifecycle.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaHistory, FaSpinner, FaExclamationTriangle, FaArrowRight } from "react-icons/fa";
import { format, differenceInMinutes, differenceInHours, differenceInDays } from "date-fns-jalali";

const TicketLifecycle = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [lifecycleData, setLifecycleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userPermissions, setUserPermissions] = useState(null);
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/accounts/profile/", {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
                
        if (response.ok) {
          const userData = await response.json();
          setUserPermissions(userData);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, [token]);

  useEffect(() => {
    const fetchLifecycleData = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/reports/api/ticket-lifecycle/${ticketId}/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
                
        if (response.ok) {
          const data = await response.json();
          setLifecycleData(data);
        } else if (response.status === 403) {
          setError("شما دسترسی به این بخش را ندارید.");
        } else if (response.status === 404) {
          setError("تیکت مورد نظر یافت نشد.");
        } else {
          setError("خطا در دریافت اطلاعات چرخه حیات تیکت");
        }
      } catch (error) {
        console.error("Error fetching lifecycle data:", error);
        setError("خطا در ارتباط با سرور");
      } finally {
        setLoading(false);
      }
    };
    fetchLifecycleData();
  }, [ticketId, token]);

  const formatDateTime = (dateTimeString) => {
    try {
      return format(new Date(dateTimeString), 'yyyy/MM/dd HH:mm');
    } catch (e) {
      return dateTimeString;
    }
  };

  const getActionLabel = (action) => {
    const actionLabels = {
      'created': 'ایجاد تیکت',
      'status_changed': 'تغییر وضعیت',
      'replied': 'پاسخ داده شد',
      'referred': 'ارجاع داده شد',
      'resolved': 'حل شد',
      'rejected': 'رد شد',
      'reopened': 'بازگشایی شد',
    };
    return actionLabels[action] || action;
  };

  // تابع برای محاسبه مدت زمان پاسخگویی
  const calculateResponseTime = (events, currentIndex) => {
    if (events[currentIndex].action !== 'referred') return null;
    
    // استخراج نام کاربری که تیکت به او ارجاع شده
    const description = events[currentIndex].description;
    const match = description.match(/تیکت به (.+?) ارجاع داده شد/);
    if (!match) return null;
    const assignedTo = match[1];
    
    // پیدا کردن رویداد قبلی که تیکت به کاربر فعلی ارجاع شده است
    let previousAssignEvent = null;
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (events[i].action === 'referred') {
        const prevDescription = events[i].description;
        const prevMatch = prevDescription.match(/تیکت به (.+?) ارجاع داده شد/);
        if (prevMatch && prevMatch[1] === events[currentIndex].user) {
          previousAssignEvent = events[i];
          break;
        }
      }
    }
    
    // اگر رویداد قبلی پیدا نشد، از زمان ایجاد تیکت استفاده کن
    if (!previousAssignEvent && events[0].action === 'created') {
      previousAssignEvent = events[0];
    }
    
    if (!previousAssignEvent) return null;
    
    const startDate = new Date(previousAssignEvent.timestamp);
    const endDate = new Date(events[currentIndex].timestamp);
    
    const minutes = differenceInMinutes(endDate, startDate);
    const hours = differenceInHours(endDate, startDate);
    const days = differenceInDays(endDate, startDate);
    
    if (days > 0) {
      return `${days} روز و ${hours % 24} ساعت`;
    } else if (hours > 0) {
      return `${hours} ساعت و ${minutes % 60} دقیقه`;
    } else {
      return `${minutes} دقیقه`;
    }
  };

  // بررسی دسترسی کاربر
  if (userPermissions && !userPermissions.is_superuser && !userPermissions.view_report_tickets) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md text-center">
          <div className="flex items-center justify-center mb-2">
            <FaExclamationTriangle className="mr-2" />
            <strong>خطا!</strong>
          </div>
          شما دسترسی به این بخش را ندارید.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mb-4" />
          <div className="text-xl font-semibold">در حال بارگذاری چرخه حیات تیکت...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md text-center">
          <div className="flex items-center justify-center mb-2">
            <FaExclamationTriangle className="mr-2" />
            <strong>خطا!</strong>
          </div>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
        >
          <FaArrowRight className="ml-1" /> بازگشت
        </button>
        <h1 className="text-2xl font-bold flex items-center">
          <FaHistory className="ml-2 text-blue-500" />
          چرخه حیات تیکت: {lifecycleData.ticket.title}
        </h1>
      </div>
            
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">اطلاعات تیکت</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-semibold">شماره تیکت:</span> {lifecycleData.ticket.id}
            </div>
            <div>
              <span className="font-semibold">وضعیت:</span> {lifecycleData.ticket.status}
            </div>
            <div>
              <span className="font-semibold">تاریخ ایجاد:</span> {formatDateTime(lifecycleData.ticket.created_at)}
            </div>
            <div>
              <span className="font-semibold">کاربر:</span> {lifecycleData.ticket.user}
            </div>
          </div>
        </div>
                
        <div>
          <h2 className="text-xl font-bold mb-4">رویدادهای چرخه حیات</h2>
          {lifecycleData.lifecycle_events && lifecycleData.lifecycle_events.length > 0 ? (
            <div className="space-y-4">
              {lifecycleData.lifecycle_events.map((event, index) => {
                const isReferredEvent = event.action === 'referred';
                const responseTime = isReferredEvent ? calculateResponseTime(lifecycleData.lifecycle_events, index) : null;
                
                return (
                  <div 
                    key={index} 
                    className={`${isReferredEvent 
                      ? 'bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6' 
                      : 'border-l-4 border-blue-500 pl-4 py-2'}`}
                  >
                    <div className="flex justify-between">
                      <h3 className={`font-bold ${isReferredEvent ? 'text-green-700' : ''}`}>
                        {getActionLabel(event.action)}
                      </h3>
                      <span className="text-gray-500 text-sm">
                        {formatDateTime(event.timestamp)}
                      </span>
                    </div>
                    
                    {event.description && (
                      <p className={`mt-1 ${isReferredEvent ? 'text-green-600' : 'text-gray-600'}`}>
                        {event.description}
                      </p>
                    )}
                    
                    {event.user && (
                      <p className={`text-sm mt-1 ${isReferredEvent ? 'text-green-500' : 'text-gray-500'}`}>
                        توسط: {event.user}
                      </p>
                    )}
                    
                    {isReferredEvent && responseTime && (
                      <div className="mt-3 bg-green-100 text-green-800 px-3 py-2 rounded-md text-sm font-medium">
                        مدت زمان پاسخگویی: {responseTime}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">هیچ رویدادی برای این تیکت ثبت نشده است.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketLifecycle;