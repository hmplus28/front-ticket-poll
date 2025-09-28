// Reports.js

import React, { useState, useEffect } from "react";
import { 
  FaChartBar, 
  FaChartPie, 
  FaUsers, 
  FaTicketAlt, 
  FaPoll, 
  FaSpinner, 
  FaUserGraduate, 
  FaUserTie, 
  FaTable, 
  FaExclamationTriangle,
  FaFileExcel,
  FaFilter,
  FaTimes,
  FaClock,
  FaHourglassHalf
} from "react-icons/fa";

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
      avg_response_time: 0,
      avg_resolution_time: 0,
    },
    polls: {
      total: 0,
      active: 0,
      votes: 0,
    },
    departments: [],
    sections: [],
    roles: [],
    tickets_details: [],
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    department: '',
    section: '',
    role: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const token = localStorage.getItem("authToken");

  // دریافت داده‌های اولیه
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // دریافت گزارشات
        const reportsRes = await fetch("http://localhost:8000/api/reports/api/dashboard-stats/", {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        // دریافت دپارتمان‌ها
        const departmentsRes = await fetch("http://localhost:8000/api/tickets/departments/", {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        // دریافت جزئیات تیکت‌ها
        const ticketsRes = await fetch("http://localhost:8000/api/tickets/tickets/", {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        if (reportsRes.ok && departmentsRes.ok && ticketsRes.ok) {
          const reportsData = await reportsRes.json();
          const departmentsData = await departmentsRes.json();
          const ticketsData = await ticketsRes.json();
          
          // محاسبه میانگین زمان پاسخگویی و حل تیکت‌ها
          let totalResponseTime = 0;
          let totalResolutionTime = 0;
          let responseTimeCount = 0;
          let resolutionTimeCount = 0;
          
          ticketsData.forEach(ticket => {
            if (ticket.response_duration_minutes) {
              totalResponseTime += ticket.response_duration_minutes;
              responseTimeCount++;
            }
            if (ticket.resolution_duration_hours) {
              totalResolutionTime += ticket.resolution_duration_hours;
              resolutionTimeCount++;
            }
          });
          
          const avgResponseTime = responseTimeCount > 0 ? Math.round(totalResponseTime / responseTimeCount) : 0;
          const avgResolutionTime = resolutionTimeCount > 0 ? Math.round(totalResolutionTime / resolutionTimeCount) : 0;
          
          setReportsData({
            ...reportsData,
            tickets: {
              ...reportsData.tickets,
              avg_response_time: avgResponseTime,
              avg_resolution_time: avgResolutionTime
            },
            departments: Array.isArray(departmentsData) ? departmentsData : [],
            sections: [],
            roles: [],
            tickets_details: Array.isArray(ticketsData) ? ticketsData : []
          });
        } else {
          setError("خطا در دریافت اطلاعات گزارش");
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setError("خطا در ارتباط با سرور");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [token]);

  // دریافت بخش‌ها بر اساس دپارتمان انتخاب شده
  useEffect(() => {
    if (!filters.department) {
      setReportsData(prev => ({
        ...prev,
        sections: [],
        roles: []
      }));
      return;
    }

    const fetchSections = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/api/tickets/sections/?department_id=${filters.department}`,
          {
            headers: {
              'Authorization': `Token ${token}`
            }
          }
        );
        
        if (res.ok) {
          const sectionsData = await res.json();
          setReportsData(prev => ({
            ...prev,
            sections: Array.isArray(sectionsData) ? sectionsData : [],
            roles: []
          }));
        }
      } catch (err) {
        console.error("Failed to fetch sections:", err);
      }
    };
    
    fetchSections();
  }, [filters.department, token]);

  // دریافت نقش‌ها بر اساس بخش انتخاب شده
  useEffect(() => {
    if (!filters.section) {
      setReportsData(prev => ({
        ...prev,
        roles: []
      }));
      return;
    }

    const selectedDepartment = reportsData.departments.find(d => d.id === parseInt(filters.department));
    const isStudentsDepartment = selectedDepartment && selectedDepartment.name === "دانشجویان";

    if (!isStudentsDepartment) {
      setReportsData(prev => ({
        ...prev,
        roles: []
      }));
      return;
    }
    
    const fetchRoles = async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/api/tickets/roles/?section_id=${filters.section}`,
          {
            headers: {
              'Authorization': `Token ${token}`
            }
          }
        );
        
        if (res.ok) {
          const rolesData = await res.json();
          setReportsData(prev => ({
            ...prev,
            roles: Array.isArray(rolesData) ? rolesData : []
          }));
        }
      } catch (err) {
        console.error("Failed to fetch roles:", err);
      }
    };
    
    fetchRoles();
  }, [filters.section, token, filters.department, reportsData.departments]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      department: '',
      section: '',
      role: ''
    });
    // بارگذاری مجدد داده‌ها بدون فیلتر
    window.location.reload();
  };

  const fetchFilteredReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.department) params.append('department', filters.department);
      if (filters.section) params.append('section', filters.section);
      if (filters.role) params.append('role', filters.role);
      
      const response = await fetch(`http://localhost:8000/api/reports/api/dashboard-stats/?${params.toString()}`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      // دریافت تیکت‌های فیلتر شده
      const ticketsResponse = await fetch(`http://localhost:8000/api/tickets/tickets/?${params.toString()}`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      if (response.ok && ticketsResponse.ok) {
        const data = await response.json();
        const ticketsData = await ticketsResponse.json();
        
        // محاسبه میانگین زمان پاسخگویی و حل تیکت‌ها
        let totalResponseTime = 0;
        let totalResolutionTime = 0;
        let responseTimeCount = 0;
        let resolutionTimeCount = 0;
        
        ticketsData.forEach(ticket => {
          if (ticket.response_duration_minutes) {
            totalResponseTime += ticket.response_duration_minutes;
            responseTimeCount++;
          }
          if (ticket.resolution_duration_hours) {
            totalResolutionTime += ticket.resolution_duration_hours;
            resolutionTimeCount++;
          }
        });
        
        const avgResponseTime = responseTimeCount > 0 ? Math.round(totalResponseTime / responseTimeCount) : 0;
        const avgResolutionTime = resolutionTimeCount > 0 ? Math.round(totalResolutionTime / resolutionTimeCount) : 0;
        
        setReportsData(prev => ({
          ...prev,
          ...data,
          tickets: {
            ...data.tickets,
            avg_response_time: avgResponseTime,
            avg_resolution_time: avgResolutionTime
          },
          tickets_details: Array.isArray(ticketsData) ? ticketsData : []
        }));
      } else {
        setError("خطا در دریافت اطلاعات گزارش");
      }
    } catch (error) {
      console.error("Error fetching filtered reports data:", error);
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.department) params.append('department', filters.department);
      if (filters.section) params.append('section', filters.section);
      if (filters.role) params.append('role', filters.role);
      
      const response = await fetch(`http://localhost:8000/api/reports/api/export-excel/?${params.toString()}`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `گزارش_${new Date().toLocaleDateString('fa-IR')}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError("خطا در دریافت فایل اکسل");
      }
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      setError("خطا در ارتباط با سرور");
    }
  };

  // فرمت‌بندی زمان
  const formatTime = (value, type) => {
    if (!value) return "—";
    if (type === 'response') {
      if (value < 60) return `${value} دقیقه`;
      const hours = Math.floor(value / 60);
      const minutes = value % 60;
      return minutes > 0 ? `${hours} ساعت و ${minutes} دقیقه` : `${hours} ساعت`;
    } else {
      if (value < 24) return `${value} ساعت`;
      const days = Math.floor(value / 24);
      const hours = value % 24;
      return hours > 0 ? `${days} روز و ${hours} ساعت` : `${days} روز`;
    }
  };

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

  const selectedDepartment = reportsData.departments.find(d => d.id === parseInt(filters.department));
  const isStudentsDepartment = selectedDepartment && selectedDepartment.name === "دانشجویان";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">داشبورد گزارش‌گیری</h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <FaFilter className="ml-2" />
            {showFilters ? 'مخفی کردن فیلترها' : 'نمایش فیلترها'}
          </button>
          <button 
            onClick={exportToExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
          >
            <FaFileExcel className="ml-2" />
            خروجی اکسل
          </button>
        </div>
      </div>
      
      {/* بخش فیلترها */}
      {showFilters && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center">
              <FaFilter className="ml-2 text-blue-500" />
              فیلترهای گزارش
            </h2>
            <button 
              onClick={resetFilters}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center text-sm"
            >
              <FaTimes className="ml-1" />
              بازنشانی فیلترها
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">دپارتمان</label>
              <select 
                name="department" 
                value={filters.department} 
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">همه دپارتمان‌ها</option>
                {reportsData.departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">بخش</label>
              <select 
                name="section" 
                value={filters.section} 
                onChange={handleFilterChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                disabled={!filters.department}
              >
                <option value="">همه بخش‌ها</option>
                {reportsData.sections.map(section => (
                  <option key={section.id} value={section.id}>{section.name}</option>
                ))}
              </select>
            </div>
            
            {isStudentsDepartment && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نقش</label>
                <select 
                  name="role" 
                  value={filters.role} 
                  onChange={handleFilterChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  disabled={!filters.section}
                >
                  <option value="">همه نقش‌ها</option>
                  {reportsData.roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex justify-end">
            <button 
              onClick={fetchFilteredReports}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              اعمال فیلترها
            </button>
          </div>
        </div>
      )}
      
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
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
            <div className="text-indigo-700 font-semibold flex items-center">
              <FaClock className="ml-1" />
              میانگین زمان پاسخ
            </div>
            <div className="text-2xl font-bold text-indigo-700">
              {formatTime(reportsData.tickets.avg_response_time, 'response')}
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-purple-700 font-semibold flex items-center">
              <FaHourglassHalf className="ml-1" />
              میانگین زمان حل
            </div>
            <div className="text-2xl font-bold text-purple-700">
              {formatTime(reportsData.tickets.avg_resolution_time, 'resolution')}
            </div>
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
      
      {/* جدول جزئیات تیکت‌ها */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <FaTable className="ml-2 text-indigo-500" />
          جزئیات تیکت‌ها
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عنوان تیکت</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وضعیت</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاریخ ایجاد</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاریخ حل</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">زمان پاسخگویی</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مدت زمان حل</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportsData.tickets_details.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ticket.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ticket.created_at_pretty || new Date(ticket.created_at).toLocaleDateString('fa-IR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ticket.resolved_at_pretty || new Date(ticket.resolved_at).toLocaleDateString('fa-IR') || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTime(ticket.response_duration_minutes, 'response')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTime(ticket.resolution_duration_hours, 'resolution')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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