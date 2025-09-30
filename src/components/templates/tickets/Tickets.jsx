// src/components/templates/tickets/Tickets.jsx
import React, { useState, useEffect } from "react"; // اضافه کردن useEffect
import Ticket from "../../modules/ticket/Ticket";
import { useNavigate } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
const Tickets = ({ tickets, userPermissions, showAddButton }) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => {
    // دریافت اطلاعات کاربر از localStorage
    const token = localStorage.getItem("authToken");
    if (token) {
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      setCurrentUser(userData);
    }
  }, []);
  const handleAddTicket = () => {
    navigate("/tickets/add-ticket");
  };
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">تیکت‌های من</h1>
        {showAddButton && (
          <button
            onClick={handleAddTicket}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <FaPlus />
            ایجاد تیکت جدید
          </button>
        )}
      </div>
      {tickets.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-gray-500 text-lg">هیچ تیکتی یافت نشد</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Ticket 
              key={ticket.id} 
              ticket={ticket} 
              currentUser={currentUser || userPermissions} 
            />
          ))}
        </div>
      )}
    </div>
  );
};
export default Tickets;