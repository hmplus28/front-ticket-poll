import React from "react";
import { MdDelete, MdAttachFile } from "react-icons/md";

const ChatBubble = ({ message, isOwner = false, onDelete, attachments = [], createdAt, username, isInitial }) => {
  return (
    <div className={`w-full flex ${isOwner ? "justify-end" : "justify-start"} px-2`}>
      <div className={`max-w-[80%] sm:max-w-md flex flex-col ${isOwner ? "items-end" : "items-start"}`}>
        
        {/* نام کاربر (پیام اولیه نمایش داده نشود) */}
        {!isInitial && (
          <div className={`text-sm font-semibold mb-1 ${isOwner ? "text-blue-700" : "text-gray-700"}`}>
            {username || (isOwner ? "شما" : "کاربر")}
          </div>
        )}

        <div className={`relative rounded-3xl px-5 py-4 shadow-lg break-words
          ${isOwner ? "bg-blue-500 text-white rounded-tr-3xl rounded-tl-3xl rounded-bl-3xl" 
                     : "bg-gray-200 text-gray-900 rounded-tr-3xl rounded-tl-3xl rounded-br-3xl"}`}>
          
          <p className="text-base sm:text-lg">{message}</p>

          {/* فایل‌ها */}
          {attachments && attachments.length > 0 && (
            <div className="flex flex-col gap-1 mt-2">
              {attachments.map((att) => (
                <a
                  key={att.id || att.url || Math.random()}
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-2 text-sm underline ${isOwner ? "text-white-100 hover:text-white" : "text-gray-600 hover:text-blue-600"}`}
                >
                  <MdAttachFile size={16} />
                  <span>{att.name || att.filename || "دانلود فایل"}</span>
                </a>
              ))}
            </div>
          )}

          {/* دکمه حذف */}
          {onDelete && (
            <button
              onClick={onDelete}
              title="حذف"
              className={`absolute top-2 ${isOwner ? "right-2" : "left-2"} text-xs
                ${isOwner ? "text-blue-100 hover:text-white" : "text-gray-500 hover:text-red-500"}`}
            >
              <MdDelete size={18} />
            </button>
          )}

          {/* زمان پیام */}
          {createdAt && (
            <div className={`text-[11px] mt-1 ${isOwner ? "text-white-100 text-right" : "text-gray-500 text-left"}`}>
              {new Date(createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
