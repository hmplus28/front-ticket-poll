import React, { useState, useEffect } from "react";
import { FaChartBar, FaChartPie, FaUsers, FaTicketAlt, FaPoll, FaSpinner, FaUserGraduate, FaUserTie, FaTable, FaExclamationTriangle } from "react-icons/fa";

const Reports = () => {
  const [reportsData, setReportsData] = useState({
    users: {
      total: 0,
      active: 0,
      students: 0,
      employees: 0,
    },
    tickets: {
      total: 0,
      open: 0,
      in_progress: 0,
      done: 0,
    },
    polls: {
      total: 0,
      active: 0,
      votes: 0,
    },
    departments: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/reports/api/dashboard-stats/", {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setReportsData(data);
        } else if (response.status === 403) {
          setError("شما دسترسی به این بخش را ندارید. این بخش فقط برای مدیران سیستم قابل مشاهده است.");
        } else {
          setError("خطا در دریافت اطلاعات گزارش");
        }
      } catch (error) {
        console.error("Error fetching reports data:", error);
        setError("خطا در ارتباط با سرور");
      } finally {
        setLoading(false);
      }
    };

    fetchReportsData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mb-4" />
          <div className="text-xl font-semibold">در حال بارگذاری گزارش‌ها...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md text-center">
          <div className="flex items-center justify-center mb-2">
            <FaExclamationTriangle className="mr-2" />
            <strong>خطا!</strong>
          </div>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">داشبورد گزارش‌گیری</h1>
      
      {/* کارت‌های آماری کاربران */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <FaUsers className="ml-2 text-blue-500" />
          آمار کاربران
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-500">
                <FaUsers className="text-2xl" />
              </div>
              <div className="mr-4">
                <p className="text-gray-500">کل کاربران</p>
                <p className="text-2xl font-bold">{reportsData.users.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-500">
                <FaUsers className="text-2xl" />
              </div>
              <div className="mr-4">
                <p className="text-gray-500">کاربران فعال</p>
                <p className="text-2xl font-bold">{reportsData.users.active}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-500">
                <FaUserGraduate className="text-2xl" />
              </div>
              <div className="mr-4">
                <p className="text-gray-500">دانشجویان</p>
                <p className="text-2xl font-bold">{reportsData.users.students}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-500">
                <FaUserTie className="text-2xl" />
              </div>
              <div className="mr-4">
                <p className="text-gray-500">کارمندان</p>
                <p className="text-2xl font-bold">{reportsData.users.employees}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* وضعیت تیکت‌ها */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <FaTicketAlt className="ml-2 text-blue-500" />
          وضعیت تیکت‌ها
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-blue-700 font-semibold">کل تیکت‌ها</div>
            <div className="text-3xl font-bold text-blue-700">{reportsData.tickets.total}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-yellow-700 font-semibold">تیکت‌های باز</div>
            <div className="text-3xl font-bold text-yellow-700">{reportsData.tickets.open}</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="text-orange-700 font-semibold">در حال بررسی</div>
            <div className="text-3xl font-bold text-orange-700">{reportsData.tickets.in_progress}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-green-700 font-semibold">انجام شده</div>
            <div className="text-3xl font-bold text-green-700">{reportsData.tickets.done}</div>
          </div>
        </div>
      </div>
      
      {/* وضعیت نظرسنجی‌ها */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <FaPoll className="ml-2 text-green-500" />
          وضعیت نظرسنجی‌ها
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-green-700 font-semibold">کل نظرسنجی‌ها</div>
            <div className="text-3xl font-bold text-green-700">{reportsData.polls.total}</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-blue-700 font-semibold">نظرسنجی‌های فعال</div>
            <div className="text-3xl font-bold text-blue-700">{reportsData.polls.active}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-purple-700 font-semibold">کل آراء</div>
            <div className="text-3xl font-bold text-purple-700">{reportsData.polls.votes}</div>
          </div>
        </div>
      </div>
      
      {/* جدول آمار دپارتمان‌ها */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <FaTable className="ml-2 text-indigo-500" />
          آمار دپارتمان‌ها
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">دپارتمان</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تعداد کاربران</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تعداد تیکت‌ها</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportsData.departments.map((dept) => (
                <tr key={dept.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.users}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.tickets}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;