// src/components/templates/tickets/TicketsContainer.jsx
import React, { useState, useEffect } from "react";
import Tickets from "./Tickets.jsx";

const TicketsContainer = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState(null);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          console.error("توکن ورود پیدا نکرده است");
          setLoading(false);
          return;
        }

        // دریافت اطلاعات کاربر و مجوزهای آن
        const userRes = await fetch("http://localhost:8000/api/accounts/profile/", {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`,
          },
        });
        
        if (userRes.ok) {
          const userData = await userRes.json();
          setUserPermissions(userData);
          
          // ذخیره اطلاعات کاربر در localStorage برای استفاده در سایر کامپوننت‌ها
          localStorage.setItem("userData", JSON.stringify(userData));
        }

        const res = await fetch(
          "http://localhost:8000/api/tickets/tickets/my_tickets/",
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Token ${token}`,
            },
          }
        );

        if (!res.ok) {
          console.error("خطا در دریافت تیکت‌ها:", res.status, res.statusText);
          setLoading(false);
          return;
        }

        const data = await res.json();
        const validTickets = data ? data.filter((item) => item && item.id) : [];
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

  // همیشه Tickets رو رندر می‌کنیم، حتی وقتی خالیه
  return <Tickets tickets={tickets} userPermissions={userPermissions} showAddButton={true} />;
};

export default TicketsContainer;