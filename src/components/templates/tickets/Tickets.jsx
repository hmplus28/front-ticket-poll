import React from "react";
import Ticket from "../../modules/ticket/Ticket.jsx";

const Tickets = ({ tickets, showAddButton = true }) => {
  // debug: وضعیت ورودی‌ها رو لاگ کن تا مطمئن بشیم props درست میاد
  console.log("Tickets props:", { tickets, showAddButton });

  const hasTickets = Array.isArray(tickets) && tickets.length > 0;

  const sortedTickets = hasTickets
    ? [...tickets].sort((a, b) => {
        const isInactive = (t) => t.status === "closed" || t.status === "rejected";

        if (isInactive(a) && !isInactive(b)) return 1; // a پایین
        if (!isInactive(a) && isInactive(b)) return -1; // b پایین
        return 0;
      })
    : [];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 p-4">
      {/* دکمه \"افزودن تیکت\" — همیشه در DOM قرار می‌گیره تا راحت دیباگ بشه */}
      <div className="flex justify-end mb-4">
        {showAddButton ? (
          <a
            data-testid="add-ticket-btn"
            href="/tickets/add-ticket"
            className="w-44 text-center h-auto py-2 px-4 text-lg text-white font-Estedad bg-blue-600 rounded-md cursor-pointer hover:opacity-90 transition z-20"
          >
            افزودن تیکت
          </a>
        ) : (
          // برای وقتی والد خواسته دکمه پنهان بشه: یک عنصر جایگزین کم‌رنگ برای دیباگ
          <span data-testid="add-ticket-hidden" className="text-sm text-gray-400">
          </span>
        )}
      </div>

      {/* حالت خالی (بدون استفاده از min-h-screen که می‌تونه باعث پوشونده شدن المان‌های اطراف بشه) */}
      {!hasTickets && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 min-h-[160px] rounded-md">
          <p className="text-lg font-semibold">تیکتی موجود نیست</p>
          <p className="text-sm mt-2">هنوز هیچ تیکتی ثبت نشده است.</p>
        </div>
      )}

      {/* لیست تیکت‌ها */}
      {hasTickets &&
        sortedTickets.map((ticket) => {
          const isInactive = ticket.status === "closed" || ticket.status === "rejected";

          return (
            <div
              key={ticket.id}
              className={`rounded-lg transition ${
                isInactive ? "bg-gray-100 text-gray-400 opacity-70" : "bg-white"
              }`}
            >
              <Ticket ticket={ticket} />
            </div>
          );
        })}
    </div>
  );
};

export default Tickets;
