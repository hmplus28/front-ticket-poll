import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AddSurvey = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({
    question_type: "",
    department: "",
    section: "",
    role: "",
    question: "",
    options: ["", "", "", ""],
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("");

  const token = localStorage.getItem("authToken");

  // دریافت داده‌های اولیه
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const headers = { Authorization: `Token ${token}` };
        const depRes = await fetch("http://localhost:8000/api/tickets/departments/", { headers });
        const deps = await depRes.json();
        setDepartments(Array.isArray(deps) ? deps : []);
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
        setMessage("خطا در بارگذاری اطلاعات دپارتمان‌ها.");
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate, token]);

  // دریافت بخش‌ها (برای دپارتمان‌های غیردانشجویی)
  useEffect(() => {
    if (!form.department) {
      setSections([]);
      setForm((prev) => ({ ...prev, section: "", role: "" }));
      return;
    }

    const selectedDepartment = departments.find(d => d.id === parseInt(form.department));
    const isStudentsDepartment = selectedDepartment && selectedDepartment.name === "دانشجویان";

    if (isStudentsDepartment) {
      setSections([]);
      setForm((prev) => ({ ...prev, section: "", role: "" }));
      return;
    }
    
    const fetchSections = async () => {
      try {
        const headers = { Authorization: `Token ${token}` };
        const res = await fetch(
          `http://localhost:8000/api/tickets/sections/?department_id=${form.department}`,
          { headers }
        );
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setSections(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch sections:", err);
        setSections([]);
        setMessage("خطا در بارگذاری اطلاعات بخش‌ها.");
        setMessageType("error");
      }
    };
    fetchSections();
  }, [form.department, token, departments]);

  // دریافت نقش‌ها (فقط برای دپارتمان دانشجویان)
  useEffect(() => {
    const selectedDepartment = departments.find(d => d.id === parseInt(form.department));
    const isStudentsDepartment = selectedDepartment && selectedDepartment.name === "دانشجویان";

    if (!isStudentsDepartment || !form.section) {
      setRoles([]);
      setForm((prev) => ({ ...prev, role: "" }));
      return;
    }
    
    const fetchRoles = async () => {
      try {
        const headers = { Authorization: `Token ${token}` };
        const res = await fetch(
          `http://localhost:8000/api/tickets/roles/?section_id=${form.section}`,
          { headers }
        );
        const data = await res.json();
        setRoles(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("خطا در دریافت نقش‌ها:", err);
        setRoles([]);
      }
    };
    fetchRoles();
  }, [form.section, token, form.department, departments]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "department") {
        setForm((prev) => ({ ...prev, [name]: value, section: "", role: "" }));
    } else if (name === "section") {
        setForm((prev) => ({ ...prev, [name]: value, role: "" }));
    } else {
        setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...form.options];
    newOptions[index] = value;
    setForm((prev) => ({ ...prev, options: newOptions }));
  };

  const handleSubmit = async () => {
    setMessage(null);

    const selectedDepartment = departments.find(d => d.id === parseInt(form.department));
    const isStudentsDepartment = selectedDepartment && selectedDepartment.name === "دانشجویان";

    if (!form.question_type || !form.department || !form.question) {
      setMessage("لطفاً تمام فیلدهای ضروری را پر کنید.");
      setMessageType("error");
      return;
    }
    
    // اعتبارسنجی شرطی
    if (!isStudentsDepartment) {
      if (!form.section) {
        setMessage("انتخاب بخش الزامی است.");
        setMessageType("error");
        return;
      }
    } else { // اگر دپارتمان دانشجویان باشد
      if (form.question_type === "single_choice" && form.options.some((opt) => !opt.trim())) {
        setMessage("لطفاً تمام گزینه‌ها را پر کنید.");
        setMessageType("error");
        return;
      }
    }

    const dataToSend = {
      question_type: form.question_type,
      question: form.question,
      department: form.department,
      choices: form.question_type === "single_choice" ? form.options.map(text => ({ text })) : [],
    };

    // 💡 اضافه کردن فیلدهای اختیاری تنها در صورت داشتن مقدار
    if (form.section) {
        dataToSend.section = form.section;
    }
    if (form.role) {
        dataToSend.role = form.role;
    }

    try {
      const res = await fetch("http://localhost:8000/api/polls/polls/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("API error:", errorData);
        setMessage(`ثبت نظرسنجی موفق نبود. جزئیات خطا: ${JSON.stringify(errorData)}`);
        setMessageType("error");
        throw new Error("خطا در ثبت نظرسنجی");
      }

      setMessage("نظرسنجی با موفقیت ثبت شد!");
      setMessageType("success");
      navigate("/survey");
    } catch (err) {
        console.error(err);
        setMessage("ثبت نظرسنجی موفق نبود. لطفاً مجدداً تلاش کنید.");
        setMessageType("error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-Estedad">
        در حال بارگذاری...
      </div>
    );
  }

  const selectedDepartment = departments.find(d => d.id === parseInt(form.department));
  const isStudentsDepartment = selectedDepartment && selectedDepartment.name === "دانشجویان";

  return (
    <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-6 max-w-2xl">
      <h1 className="font-Estedad text-xl font-bold text-blue-120 mb-4">
        ثبت نظرسنجی جدید
      </h1>

      {message && (
        <div className={`p-3 rounded-md mb-4 text-center font-Estedad ${messageType === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <select
          name="question_type"
          value={form.question_type}
          onChange={handleChange}
          className="w-full border-2 border-slate-300 h-10 rounded-md px-3 text-sm text-gray-700 bg-white font-Estedad"
        >
          <option value="" hidden>
            نوع سوال
          </option>
          <option value="single_choice">چهار گزینه‌ای</option>
          <option value="descriptive">تشریحی</option>
        </select>
        <select
          name="department"
          value={form.department}
          onChange={handleChange}
          className="w-full border-2 border-slate-300 h-10 rounded-md px-3 text-sm text-gray-700 bg-white font-Estedad"
        >
          <option value="" hidden>
            انتخاب دپارتمان
          </option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        {isStudentsDepartment ? (
            <>
                <select
                name="section"
                value={form.section}
                onChange={handleChange}
                className="w-full border-2 border-slate-300 h-10 rounded-md px-3 text-sm text-gray-700 bg-white font-Estedad"
                disabled={!form.department}
                >
                <option value="" hidden>
                    انتخاب بخش (اختیاری)
                </option>
                {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                    {s.name}
                    </option>
                ))}
                </select>
                <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full border-2 border-slate-300 h-10 rounded-md px-3 text-sm text-gray-700 bg-white font-Estedad"
                disabled={!form.section}
                >
                <option value="" hidden>
                    انتخاب نقش (اختیاری)
                </option>
                {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                    {r.name}
                    </option>
                ))}
                </select>
            </>
        ) : (
            <select
            name="section"
            value={form.section}
            onChange={handleChange}
            className="w-full border-2 border-slate-300 h-10 rounded-md px-3 text-sm text-gray-700 bg-white font-Estedad"
            disabled={!form.department}
            >
            <option value="" hidden>
                انتخاب بخش
            </option>
            {sections.map((s) => (
                <option key={s.id} value={s.id}>
                {s.name}
                </option>
            ))}
            </select>
        )}
      </div>

      <div className="mt-6 p-4 border-2 border-slate-300 rounded-md bg-white">
        <input
          name="question"
          value={form.question}
          onChange={handleChange}
          placeholder="متن سوال را وارد کنید"
          className="w-full border-2 border-slate-300 px-3 py-2.5 rounded-md text-sm outline-none font-Estedad"
        />

        {form.question_type === "single_choice" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {form.options.map((opt, i) => (
              <input
                key={i}
                value={opt}
                onChange={(e) => handleOptionChange(i, e.target.value)}
                placeholder={`گزینه ${i + 1}`}
                className="w-full border-2 border-slate-300 px-3 py-2.5 rounded-md text-sm outline-none font-Estedad"
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-center">
        <button
          onClick={handleSubmit}
          className="cursor-pointer bg-lime-200 hover:bg-lime-300 transition-colors duration-500 p-2 w-full sm:w-80 rounded-md font-Estedad font-bold"
        >
          ثبت نظرسنجی
        </button>
      </div>
    </div>
  );
};

export default AddSurvey;