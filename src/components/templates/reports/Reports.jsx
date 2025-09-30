// src/components/templates/reports/Reports.jsx
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
  FaHourglassHalf,
  FaArrowRight
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
      avg_resolution_time: 0,
      total_resolution_time: 0,
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
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState('tickets');
    
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
          
          // محاسبه آمار زمان حل تیکت‌ها
          const timeStats = calculateTimeStats(ticketsData);
                    
          setReportsData({
            ...reportsData,
            tickets: {
              ...reportsData.tickets,
              ...timeStats
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

  // تابع محاسبه آمار زمان‌ها (فقط زمان حل)
  const calculateTimeStats = (ticketsData) => {
    let totalResolutionTime = 0;
    let resolutionTimeCount = 0;
    
    // فیلتر کردن تیکت‌های معتبر و محاسبه مجموع زمان حل
    const validTickets = ticketsData.filter(ticket => 
      ticket.resolution_duration_hours && ticket.resolution_duration_hours > 0
    );
    
    validTickets.forEach(ticket => {
      totalResolutionTime += ticket.resolution_duration_hours;
      resolutionTimeCount++;
    });
    
    // محاسبه میانگین زمان حل با دقت بیشتر
    const avgResolutionTime = resolutionTimeCount > 0 
      ? Math.round((totalResolutionTime / resolutionTimeCount) * 100) / 100 
      : 0;
    
    return {
      avg_resolution_time: avgResolutionTime,
      total_resolution_time: totalResolutionTime
    };
  };

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
  }, [filters.section, token]);

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
                
        // محاسبه آمار زمان‌ها برای داده‌های فیلتر شده
        const timeStats = calculateTimeStats(ticketsData);
                
        setReportsData(prev => ({
          ...prev,
          ...data,
          tickets: {
            ...data.tickets,
            ...timeStats
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

  const exportToExcel = async (reportType) => {
    try {
      const params = new URLSearchParams();
      params.append('type', reportType);
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
        a.download = `گزارش_${reportType}_${new Date().toLocaleDateString('fa-IR')}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('خطا در دریافت فایل اکسل');
      }
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert('خطا در خروجی گرفتن اکسل');
    }
  };

  // فرمت‌بندی زمان - فقط برای زمان حل
  const formatTime = (value, type) => {
    if (!value || value === 0 || value === "0") return "—";
    
    // فقط نوع resolution را پشتیبانی می‌کنیم
    if (type === 'resolution') {
      if (value < 24) return `${value} ساعت`;
      const days = Math.floor(value / 24);
      const hours = value % 24;
      return hours > 0 ? `${days} روز و ${hours} ساعت` : `${days} روز`;
    }
    
    return "—";
  };

  // تبدیل وضعیت به فارسی
  const getStatusInPersian = (status) => {
    const statusMap = {
      'open': 'باز',
      'in_progress': 'در حال بررسی',
      'done': 'انجام شده',
      'rejected': 'رد شده',
      'closed': 'بسته شده'
    };
    return statusMap[status] || status;
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
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
          >
            <FaFileExcel className="ml-2" />
            خروجی اکسل
          </button>
        </div>
      </div>
            
      {/* مودال انتخاب نوع گزارش */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">انتخاب نوع گزارش</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع گزارش:</label>
                <div className="space-y-2">
                  {[
                    { value: 'tickets', label: 'گزارش تیکت‌ها' },
                    { value: 'users', label: 'گزارش کاربران' },
                    { value: 'polls', label: 'گزارش نظرسنجی‌ها' }
                  ].map((option) => (
                    <div key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        id={option.value}
                        name="reportType"
                        value={option.value}
                        checked={selectedReportType === option.value}
                        onChange={() => setSelectedReportType(option.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor={option.value} className="mr-2 block text-sm text-gray-900">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                انصراف
              </button>
              <button
                onClick={() => {
                  setShowExportModal(false);
                  exportToExcel(selectedReportType);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                تایید و دانلود
              </button>
            </div>
          </div>
        </div>
      )}
            
      {/* بخش فیلترها */}
      {showFilters && (
        <div className="mb-8 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center">
              <FaFilter className="ml-2 text-blue-500" />
              فیلترهای گزارش
            </h2>
            <button 
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center text-sm transition-colors"
            >
              <FaTimes className="ml-1" />
              بازنشانی فیلترها
            </button>
          </div>
                    
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">دپارتمان</label>
              <select 
                name="department" 
                value={filters.department} 
                onChange={handleFilterChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">همه دپارتمان‌ها</option>
                {reportsData.departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
                        
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">بخش</label>
              <select 
                name="section" 
                value={filters.section} 
                onChange={handleFilterChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                disabled={!filters.department}
              >
                <option value="">همه بخش‌ها</option>
                {reportsData.sections.map(section => (
                  <option key={section.id} value={section.id}>{section.name}</option>
                ))}
              </select>
            </div>
                        
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">نقش</label>
              <select 
                name="role" 
                value={filters.role} 
                onChange={handleFilterChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                disabled={!filters.section}
              >
                <option value="">همه نقش‌ها</option>
                {reportsData.roles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
          </div>
                    
          <div className="mt-6 flex justify-end">
            <button 
              onClick={fetchFilteredReports}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition-colors"
            >
              اعمال فیلترها
              <FaArrowRight className="mr-2" />
            </button>
          </div>
        </div>
      )}
            
      {/* کارت‌های آماری کاربران */}
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-6 flex items-center">
          <FaUsers className="ml-2 text-blue-500" />
          آمار کاربران
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
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
                    
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
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
                    
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
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
                    
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
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
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 mb-10">
        <h2 className="text-xl font-bold mb-6 flex items-center">
          <FaTicketAlt className="ml-2 text-blue-500" />
          وضعیت تیکت‌ها
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-200 hover:shadow-md transition-shadow">
            <div className="text-blue-700 font-semibold mb-2">کل تیکت‌ها</div>
            <div className="text-3xl font-bold text-blue-700">{reportsData.tickets.total}</div>
          </div>
          <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-200 hover:shadow-md transition-shadow">
            <div className="text-yellow-700 font-semibold mb-2">تیکت‌های باز</div>
            <div className="text-3xl font-bold text-yellow-700">{reportsData.tickets.open}</div>
          </div>
          <div className="bg-orange-50 p-5 rounded-xl border border-orange-200 hover:shadow-md transition-shadow">
            <div className="text-orange-700 font-semibold mb-2">در حال بررسی</div>
            <div className="text-3xl font-bold text-orange-700">{reportsData.tickets.in_progress}</div>
          </div>
          <div className="bg-green-50 p-5 rounded-xl border border-green-200 hover:shadow-md transition-shadow">
            <div className="text-green-700 font-semibold mb-2">انجام شده</div>
            <div className="text-3xl font-bold text-green-700">{reportsData.tickets.done}</div>
          </div>
          <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-200 hover:shadow-md transition-shadow">
            <div className="text-indigo-700 font-semibold mb-2 flex items-center">
              <FaClock className="ml-1" />
              میانگین مدت زمان حل
            </div>
            <div className="text-2xl font-bold text-indigo-700">
              {formatTime(reportsData.tickets.avg_resolution_time, 'resolution')}
            </div>
          </div>
          
          <div className="bg-teal-50 p-5 rounded-xl border border-teal-200 hover:shadow-md transition-shadow">
            <div className="text-teal-700 font-semibold mb-2 flex items-center">
              <FaHourglassHalf className="ml-1" />
              مجموع مدت زمان حل
            </div>
            <div className="text-2xl font-bold text-teal-700">
              {formatTime(reportsData.tickets.total_resolution_time, 'resolution')}
            </div>
          </div>
        </div>
      </div>
            
      {/* وضعیت نظرسنجی‌ها */}
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 mb-10">
        <h2 className="text-xl font-bold mb-6 flex items-center">
          <FaPoll className="ml-2 text-green-500" />
          وضعیت نظرسنجی‌ها
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50 p-5 rounded-xl border border-green-200 hover:shadow-md transition-shadow">
            <div className="text-green-700 font-semibold mb-2">کل نظرسنجی‌ها</div>
            <div className="text-3xl font-bold text-green-700">{reportsData.polls.total}</div>
          </div>
          <div className="bg-blue-50 p-5 rounded-xl border border-blue-200 hover:shadow-md transition-shadow">
            <div className="text-blue-700 font-semibold mb-2">نظرسنجی‌های فعال</div>
            <div className="text-3xl font-bold text-blue-700">{reportsData.polls.active}</div>
          </div>
          <div className="bg-purple-50 p-5 rounded-xl border border-purple-200 hover:shadow-md transition-shadow">
            <div className="text-purple-700 font-semibold mb-2">کل آراء</div>
            <div className="text-3xl font-bold text-purple-700">{reportsData.polls.votes}</div>
          </div>
        </div>
      </div>
            
      {/* جدول جزئیات تیکت‌ها */}
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 mb-10">
        <h2 className="text-xl font-bold mb-6 flex items-center">
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">مدت زمان حل</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportsData.tickets_details.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ticket.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${ticket.status === 'done' ? 'bg-green-100 text-green-800' : 
                        ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' : 
                        ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {getStatusInPersian(ticket.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ticket.created_at_pretty || new Date(ticket.created_at).toLocaleDateString('fa-IR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ticket.resolved_at_pretty || new Date(ticket.resolved_at).toLocaleDateString('fa-IR') || '—'}
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
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <h2 className="text-xl font-bold mb-6 flex items-center">
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
                <tr key={dept.id} className="hover:bg-gray-50">
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