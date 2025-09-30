// src/components/modules/ticket/Ticket.jsx
import React, { useState, useEffect } from "react";
import { GoDotFill } from "react-icons/go";
import { FaTicketAlt, FaHourglassHalf } from "react-icons/fa";
import { TiCalendar } from "react-icons/ti";
import { AiOutlineTag } from "react-icons/ai";
import { MdOutlineInfo, MdApartment, MdLock, MdPersonAdd, MdHistory } from "react-icons/md";
import { useNavigate } from "react-router-dom";
const Ticket = ({ ticket, currentUser }) => {
  const navigate = useNavigate();
  const [showReferButton, setShowReferButton] = useState(false);
  const [isSender, setIsSender] = useState(false);
  const [isReceiver, setIsReceiver] = useState(false);
  const [userPermissions, setUserPermissions] = useState(null);
  useEffect(() => {
    // دریافت اطلاعات کاربر از localStorage اگر از props ارسال نشده باشد
    const userData = currentUser || JSON.parse(localStorage.getItem("userData") || "{}");
        
    // بررسی اینکه آیا کاربر فعلی ارسال کننده تیکت است یا خیر
    const senderCheck = userData && ticket.user_id === userData.id;
    // بررسی اینکه آیا کاربر فعلی گیرنده تیکت است یا خیر
    const receiverCheck = userData && ticket.referred_to_id === userData.id;
        
    setIsSender(senderCheck);
    setIsReceiver(receiverCheck);
        
    // فقط اگر کاربر گیرنده باشد و ارسال کننده نباشد و تیکت در حالت انجام نشده/بسته نشده/رد نشده باشد
    const shouldShowRefer = receiverCheck && !senderCheck && 
      ticket.status !== 'done' && ticket.status !== 'closed' && ticket.status !== 'rejected';
        
    setShowReferButton(shouldShowRefer);
        
    // دریافت اطلاعات کاربر و مجوزهای آن
    const fetchUserPermissions = async () => {
      if (!userData) {
        try {
          const token = localStorage.getItem("authToken");
          const response = await fetch("http://localhost:8000/api/accounts/profile/", {
            headers: {
              'Authorization': `Token ${token}`
            }
          });
                    
          if (response.ok) {
            const userData = await response.json();
            setUserPermissions(userData);
            localStorage.setItem("userData", JSON.stringify(userData));
          }
        } catch (error) {
          console.error("Error fetching user permissions:", error);
        }
      } else {
        setUserPermissions(userData);
      }
    };
        
    fetchUserPermissions();
  }, [ticket, currentUser]);
  const isRejected = ticket.status === "rejected";
  const isClosed = ticket.status === "closed";
  const isDone = ticket.status === "done";
  const isReferred = ticket.referred_to !== null && ticket.referred_to !== undefined;
    
  // تعیین رنگ‌ها بر اساس وضعیت
  let borderColor = "border-slate-300";
  let bgColor = "bg-white";
  let titleColor = "text-slate-900";
  let ticketNumberColor = "text-slate-700";
  if (isRejected) {
    borderColor = "border-red-200";
    bgColor = "bg-gray-100";
    titleColor = "text-red-600";
    ticketNumberColor = "text-red-500";
  } else if (isDone) {
    borderColor = "border-green-200";
    bgColor = "bg-green-50";
    titleColor = "text-green-700";
    ticketNumberColor = "text-green-600";
  } else if (isClosed) {
    bgColor = "bg-gray-100";
    titleColor = "text-gray-600";
    ticketNumberColor = "text-gray-500";
  } else if (isReferred) {
    borderColor = "border-indigo-200";
    bgColor = "bg-indigo-50";
    titleColor = "text-indigo-700";
    ticketNumberColor = "text-indigo-600";
  }
  // فرمت‌بندی مدت زمان حل
  const formatResolutionTime = (hours) => {
    if (!hours) return "0";
    if (hours < 24) return `${hours} ساعت`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days} روز و ${remainingHours} ساعت` : `${days} روز`;
  };
  // تابع ارجاع تیکت
  const handleReferTicket = () => {
    navigate(`/notifications/tickets/${ticket.id}/refer`);
  };
  // تابع مشاهده چرخه حیات تیکت - حالا برای همه کاربرانی که تیکت را می‌بینند
  const handleViewLifecycle = () => {
    navigate(`/reports/ticket-lifecycle/${ticket.id}`);
  };
  // تبدیل وضعیت به فارسی
  const getStatusInPersian = (status) => {
    const statusMap = {
      'open': 'باز',
      'in_progress': 'در حال بررسی',
      'done': 'انجام شده',
      'rejected': 'رد شده',
      'closed': 'بسته شده'
    };
    return statusMap[status] || status;
  };
  return (
    <div
      key={ticket.id}
      className={`border-2 ${borderColor} rounded-xl p-4 flex flex-col gap-4 shadow-sm transition-all ${bgColor}`}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 flex-wrap">
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 gap-2 flex-wrap">
          {/* عنوان تیکت */}
          <div className="flex items-center gap-2 break-words">
            <GoDotFill className={titleColor} />
            <p className={`font-bold text-sm sm:text-base break-words ${titleColor}`}>
              {ticket.title}
            </p>
            {(isClosed || isRejected) && (
              <MdLock className="text-gray-400 w-5 h-5" title="تیکت بسته یا رد شده" />
            )}
            {isReferred && (
              <MdPersonAdd className="text-indigo-500 w-5 h-5" title="تیکت ارجاع داده شده" />
            )}
          </div>
          {/* دپارتمان */}
          <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold flex-wrap break-words">
            <MdApartment className="text-slate-500" />
            <p className="text-slate-500">دپارتمان:</p>
            <p className="text-slate-500">{ticket.department_name}</p>
          </div>
        </div>
        {/* دکمه‌های عملیات */}
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => navigate(`/notifications/tickets/${ticket.id}`)}
            className={`px-4 py-2 w-full sm:w-auto rounded-md text-xs sm:text-sm font-semibold cursor-pointer transition-colors duration-200
              bg-hover-100 text-slate-700 hover:bg-slate-100
            `}
          >
            مشاهده
          </button>
                    
          {/* دکمه مشاهده چرخه حیات تیکت - حالا برای همه کاربرانی که تیکت را می‌بینند */}
          <button
            onClick={handleViewLifecycle}
            className={`px-4 py-2 w-full sm:w-auto rounded-md text-xs sm:text-sm font-semibold cursor-pointer transition-colors duration-200
              bg-purple-100 text-purple-700 hover:bg-purple-200
            `}
          >
            <MdHistory className="inline ml-1" />
            چرخه حیات
          </button>
                    
          {/* دکمه ارجاع تیکت - فقط برای گیرنده تیکت نمایش داده می‌شود */}
          {showReferButton && (
            <button
              onClick={handleReferTicket}
              className={`px-4 py-2 w-full sm:w-auto rounded-md text-xs sm:text-sm font-semibold cursor-pointer transition-colors duration-200
                bg-indigo-100 text-indigo-700 hover:bg-indigo-200
              `}
            >
              ارجاع تیکت
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        {/* شماره تیکت */}
        <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold flex-wrap break-words">
          <FaTicketAlt className={ticketNumberColor} />
          <p className={ticketNumberColor}>شماره تیکت:</p>
          <p className={ticketNumberColor}>{ticket.id}</p>
        </div>
        {/* تاریخ ثبت */}
        <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold flex-wrap break-words">
          <TiCalendar className="text-slate-500" />
          <p className="text-slate-500">تاریخ ثبت:</p>
          <p className="text-slate-500">
            {ticket.created_at_pretty || new Date(ticket.created_at).toLocaleString("fa-IR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        {/* تاریخ حل */}
        {ticket.resolved_at && (
          <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold flex-wrap break-words">
            <TiCalendar className="text-slate-500" />
            <p className="text-slate-500">تاریخ حل:</p>
            <p className="text-slate-500">
              {ticket.resolved_at_pretty || new Date(ticket.resolved_at).toLocaleString("fa-IR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        )}
        {/* مدت زمان حل */}
        <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold flex-wrap break-words">
          <FaHourglassHalf className="text-slate-500" />
          <p className="text-slate-500">مدت زمان حل:</p>
          <p className="text-slate-500">
            {formatResolutionTime(ticket.resolution_duration_hours)}
          </p>
        </div>
                
        {/* وضعیت */}
        <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold flex-wrap break-words">
          <MdOutlineInfo className="text-slate-500" />
          <p className="text-slate-500">وضعیت:</p>
          <p className="text-slate-500">{getStatusInPersian(ticket.status)}</p>
        </div>
        {/* اطلاعات ارجاع */}
        {isReferred && (
          <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold flex-wrap break-words">
            <MdPersonAdd className="text-indigo-500" />
            <p className="text-indigo-500">ارجاع به:</p>
            <p className="text-indigo-500">{ticket.referred_to?.username || "—"}</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default Ticket;