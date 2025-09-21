import React from "react";
import Ticket from "../../modules/ticket/Ticket.jsx";

const Tickets = ({ tickets, showAddButton = true }) => {
  if (!tickets || tickets.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-400">
        <p className="text-lg font-semibold">تیکتی موجود نیست</p>
        <p className="text-sm mt-2">هنوز هیچ تیکتی ثبت نشده است.</p>
      </div>
    );
  }

  // مرتب‌سازی: بازها بالا، بسته/ردشده پایین
  const sortedTickets = [...tickets].sort((a, b) => {
    const isInactive = (t) => t.status === "closed" || t.status === "rejected";

    if (isInactive(a) && !isInactive(b)) return 1; // a پایین
    if (!isInactive(a) && isInactive(b)) return -1; // b پایین
    return 0;
  });

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 p-4">
      {/* دکمه "افزودن تیکت" */}
      {showAddButton && (
        <div className="flex justify-end mb-4">
          <a
            href="/tickets/add-ticket"
            className="w-44 text-center h-auto py-2 px-4 text-lg text-white font-Estedad bg-blue-100 rounded-md cursor-pointer hover:bg-blue-200 transition"
          >
            افزودن تیکت
          </a>
        </div>
      )}

      {/* لیست تیکت‌ها */}
      {sortedTickets.map((ticket) => {
        const isInactive =
          ticket.status === "closed" || ticket.status === "rejected";

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
