import React from "react";
import { GoDotFill } from "react-icons/go";
import { FaTicketAlt } from "react-icons/fa";
import { TiCalendar } from "react-icons/ti";
import { AiOutlineTag } from "react-icons/ai";
import { MdOutlineInfo, MdApartment, MdLock } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { BsLayersHalf } from "react-icons/bs";
import { PiPersonArmsSpreadFill } from "react-icons/pi";

const Ticket = ({ ticket }) => {
  const navigate = useNavigate();

  const isInactive = ticket.status === "closed" || ticket.status === "rejected";

  return (
    <div
      key={ticket.id}
      className={`border-2 rounded-xl p-4 flex flex-col gap-4 shadow-sm transition-all
        ${isInactive ? "bg-gray-100 text-gray-400 opacity-70 border-gray-300" : "bg-white border-slate-300"}
      `}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 flex-wrap">
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 gap-2 flex-wrap">
          {/* عنوان تیکت */}
          <div className="flex items-center gap-2 break-words">
            <GoDotFill className={isInactive ? "text-gray-400" : "text-slate-900"} />
            <p className="font-bold text-sm sm:text-base break-words">{ticket.title}</p>
            {isInactive && (
              <MdLock className="text-gray-400 w-5 h-5" title="تیکت بسته یا رد شده" />
            )}
          </div>

          {/* دپارتمان */}
          <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold flex-wrap break-words">
            <MdApartment className={isInactive ? "text-gray-400" : "text-slate-500"} />
            <p className={isInactive ? "text-gray-400" : "text-slate-500"}>دپارتمان:</p>
            <p className={isInactive ? "text-gray-400" : "text-slate-500"}>{ticket.department_name}</p>
          </div>

          {/* بخش */}
          <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold flex-wrap break-words">
            <BsLayersHalf className={isInactive ? "text-gray-400" : "text-slate-500"} />
            <p className={isInactive ? "text-gray-400" : "text-slate-500"}>بخش:</p>
            <p className={isInactive ? "text-gray-400" : "text-slate-500"}>{ticket.sections_names}</p>
          </div>

          {/* نقش */}
          <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold flex-wrap break-words">
            <PiPersonArmsSpreadFill className={isInactive ? "text-gray-400" : "text-slate-500"} />
            <p className={isInactive ? "text-gray-400" : "text-slate-500"}>نقش:</p>
            <p className={isInactive ? "text-gray-400" : "text-slate-500"}>{ticket.roles_names}</p>
          </div>
        </div>

        {/* دکمه مشاهده */}
        <div className="w-full sm:w-auto">
          <button
            onClick={() => navigate(`/notifications/tickets/${ticket.id}`)}
            className={`px-4 py-2 w-full sm:w-auto rounded-md text-xs sm:text-sm font-semibold cursor-pointer transition-colors duration-200
              ${isInactive ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-hover-100 text-slate-700 hover:bg-slate-100"}
            `}
            disabled={isInactive}
          >
            مشاهده
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold flex-wrap break-words">
          <FaTicketAlt className={isInactive ? "text-gray-400" : "text-slate-500"} />
          <p className={isInactive ? "text-gray-400" : "text-slate-500"}>شماره تیکت:</p>
          <p className={isInactive ? "text-gray-400" : "text-slate-500"}>{ticket.id}</p>
        </div>

        <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold flex-wrap break-words">
          <TiCalendar className={isInactive ? "text-gray-400" : "text-slate-500"} />
          <p className={isInactive ? "text-gray-400" : "text-slate-500"}>تاریخ ثبت:</p>
          <p className={isInactive ? "text-gray-400" : "text-slate-500"}>
            {new Date(ticket.created_at).toLocaleString("fa-IR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold flex-wrap break-words">
          <AiOutlineTag className={isInactive ? "text-gray-400" : "text-slate-500"} />
          <p className={isInactive ? "text-gray-400" : "text-slate-500"}>برچسب:</p>
          <p className={isInactive ? "text-gray-400" : "text-slate-500"}>{ticket.tag_names || "—"}</p>
        </div>

        <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold flex-wrap break-words">
          <MdOutlineInfo className={isInactive ? "text-gray-400" : "text-slate-500"} />
          <p className={isInactive ? "text-gray-400" : "text-slate-500"}>وضعیت:</p>
          <p className={isInactive ? "text-gray-400" : "text-slate-500"}>{ticket.status}</p>
        </div>
      </div>
    </div>
  );
};

export default Ticket;
