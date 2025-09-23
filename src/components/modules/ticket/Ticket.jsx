import React from "react";
import { GoDotFill } from "react-icons/go";
import { FaTicketAlt } from "react-icons/fa";
import { TiCalendar } from "react-icons/ti";
import { AiOutlineTag } from "react-icons/ai";
import { MdOutlineInfo, MdApartment, MdLock } from "react-icons/md";
import { useNavigate } from "react-router-dom";

const Ticket = ({ ticket }) => {
  const navigate = useNavigate();

  const isRejected = ticket.status === "rejected";
  const isClosed = ticket.status === "closed";
  const isDone = ticket.status === "done";

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
  }

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
          </div>

          {/* دپارتمان */}
          <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold flex-wrap break-words">
            <MdApartment className="text-slate-500" />
            <p className="text-slate-500">دپارتمان:</p>
            <p className="text-slate-500">{ticket.department_name}</p>
          </div>
        </div>

        {/* دکمه مشاهده */}
        <div className="w-full sm:w-auto">
          <button
            onClick={() => navigate(`/notifications/tickets/${ticket.id}`)}
            className={`px-4 py-2 w-full sm:w-auto rounded-md text-xs sm:text-sm font-semibold cursor-pointer transition-colors duration-200
              bg-hover-100 text-slate-700 hover:bg-slate-100
            `}
          >
            مشاهده
          </button>
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
            {new Date(ticket.created_at).toLocaleString("fa-IR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* برچسب */}
        <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold flex-wrap break-words">
          <AiOutlineTag className="text-slate-500" />
          <p className="text-slate-500">برچسب:</p>
          <p className="text-slate-500">{ticket.tag_names || "—"}</p>
        </div>

        {/* وضعیت */}
        <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold flex-wrap break-words">
          <MdOutlineInfo className="text-slate-500" />
          <p className="text-slate-500">وضعیت:</p>
          <p className="text-slate-500">{ticket.status}</p>
        </div>
      </div>
    </div>
  );
};

export default Ticket;
