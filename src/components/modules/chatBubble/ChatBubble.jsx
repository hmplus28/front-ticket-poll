import React from "react";
import { MdDelete, MdAttachFile, MdPersonAdd } from "react-icons/md";

const ChatBubble = ({ message, isOwner = false, onDelete, attachments = [], createdAt, username, isInitial, isReferral = false }) => {
  return (
    <div className={`w-full flex ${isOwner ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] sm:max-w-md flex flex-col ${isOwner ? "items-end" : "items-start"}`}>
        
        {/* نام کاربر (پیام اولیه نمایش داده نشود) */}
        {!isInitial && (
          <div className={`text-sm font-semibold mb-1 px-2 ${isOwner ? "text-blue-700" : "text-gray-700"}`}>
            {username || (isOwner ? "شما" : "کاربر")}
          </div>
        )}

        {/* حباب اصلی چت */}
        <div 
          className={`relative px-5 py-4 shadow-md break-words group 
            ${isReferral ? "bg-indigo-100 border-l-4 border-indigo-500" : 
              (isOwner ? "bg-blue-500 text-white rounded-t-xl rounded-l-xl rounded-br-xl rounded-bl-none" 
                       : "bg-gray-200 text-gray-900 rounded-t-xl rounded-r-xl rounded-bl-xl rounded-br-none")}`}
        >
          {/* آیکون ارجاع */}
          {isReferral && (
            <div className="flex items-center gap-1 mb-2 text-indigo-700">
              <MdPersonAdd />
              <span className="font-semibold">پیام ارجاع:</span>
            </div>
          )}
          
          <p className="text-base sm:text-lg whitespace-pre-wrap">{message}</p>

          {/* فایل‌ها */}
          {attachments && attachments.length > 0 && (
            <div className="flex flex-col gap-1 mt-2">
              {attachments.map((att) => (
                <a
                  key={att.id || att.url || Math.random()}
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-2 text-sm underline ${isOwner ? "text-blue-100 hover:text-white" : "text-gray-600 hover:text-blue-600"}`}
                >
                  <MdAttachFile size={16} />
                  <span>{att.name || att.filename || "دانلود فایل"}</span>
                </a>
              ))}
            </div>
          )}

          {/* زمان و دکمه حذف */}
          <div className={`flex items-center mt-2 gap-2 text-xs
            ${isOwner ? "justify-start flex-row-reverse" : "justify-start"}`}>
            {createdAt && (
              <span className={`${isOwner ? "text-blue-100" : "text-gray-500"}`}>
                {new Date(createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                title="حذف"
                className={`flex items-center justify-center p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300
                  ${isOwner ? "text-blue-100 hover:text-white hover:bg-white/10" : "text-gray-500 hover:text-red-500 hover:bg-gray-300"}`}
              >
                <MdDelete size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;