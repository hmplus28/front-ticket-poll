import React, { useState, useEffect } from "react";
import Tickets from "./Tickets.jsx";

const TicketsContainer = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        // گرفتن توکن از localStorage
        const token = localStorage.getItem("authToken");

        if (!token) {
          console.error("توکن ورود پیدا نکرده است");
          setLoading(false);
          return;
        }

        const res = await fetch(
          "http://localhost:8000/api/tickets/tickets/my_tickets/",
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Token ${token}`, // اضافه کردن توکن
            },
          }
        );

        if (!res.ok) {
          console.error("خطا در دریافت تیکت‌ها:", res.status, res.statusText);
          setLoading(false);
          return;
        }

        const data = await res.json();
        const validTickets = data ? data.filter(item => item && item.id) : [];
        setTickets(validTickets);
      } catch (err) {
        console.error("خطا در ارتباط با سرور:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        در حال بارگذاری...
      </div>
    );
  }

  // نمایش پیام وقتی تیکتی موجود نیست
  if (tickets.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-400">
        <p className="text-lg font-semibold">تیکتی موجود نیست</p>
        <p className="text-sm mt-2">هنوز هیچ تیکتی ثبت نشده است.</p>
      </div>
    );
  }

  return <Tickets tickets={tickets} />;
};

export default TicketsContainer;
