import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";

const AddTicket = () => {
  const [file, setFile] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [sections, setSections] = useState([]);
  const [roles, setRoles] = useState([]);
  const [tags, setTags] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    section: "",
    role: "",
    tag: "",
    priority: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // دریافت داده‌های اولیه دپارتمان و برچسب‌ها
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          navigate("/login");
          return;
        }
        const headers = { "Authorization": `Token ${token}` };
        const departmentsRes = await fetch(
          "http://localhost:8000/api/tickets/departments/",
          { headers }
        );
        const departmentsData = await departmentsRes.json();
        setDepartments(Array.isArray(departmentsData) ? departmentsData : []);

        const staticTags = [
          { id: 1, name: "فنی" },
          { id: 2, name: "مالی" },
          { id: 3, name: "عمومی" },
        ];
        setTags(staticTags);
      } catch (err) {
        console.error("خطا در دریافت داده‌ها:", err);
        setDepartments([]);
        setTags([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDropdownData();
  }, [navigate]);

  // دریافت بخش‌ها بر اساس دپارتمان
  useEffect(() => {
    if (!formData.department) {
      setSections([]);
      setFormData(prev => ({ ...prev, section: "", role: "" }));
      return;
    }
    const fetchSections = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const headers = { "Authorization": `Token ${token}` };
        const res = await fetch(
          `http://localhost:8000/api/tickets/sections/?department_id=${formData.department}`,
          { headers }
        );
        const data = await res.json();
        setSections(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("خطا در دریافت بخش‌ها:", err);
        setSections([]);
      }
    };
    fetchSections();
  }, [formData.department]);

  // دریافت نقش‌ها بر اساس بخش
  useEffect(() => {
    if (!formData.section) {
      setRoles([]);
      setFormData(prev => ({ ...prev, role: "" }));
      return;
    }
    const fetchRoles = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const headers = { "Authorization": `Token ${token}` };
        const res = await fetch(
          `http://localhost:8000/api/tickets/roles/?section_id=${formData.section}`,
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
  }, [formData.section]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let updatedFormData = { ...formData, [name]: value };
    if (name === "department") {
      updatedFormData.section = "";
      updatedFormData.role = "";
    }
    if (name === "section") {
      updatedFormData.role = "";
    }
    setFormData(updatedFormData);
  };

  const handleFileChange = (e) => setFile(e.target.files[0]);
  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };
  const handleDragOver = (e) => e.preventDefault();
  const handleRemoveFile = () => setFile(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSend = new FormData();
    for (const key in formData) {
      if (
        key === "department" ||
        key === "section" ||
        key === "title" ||
        key === "role" ||
        key === "tag" ||
        key === "priority" ||
        key === "description"
      ) {
        dataToSend.append(key, formData[key]);
      }
    }
    if (file) dataToSend.append("file", file);

    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch("http://localhost:8000/api/tickets/tickets/", {
        method: "POST",
        headers: { "Authorization": `Token ${token}` },
        body: dataToSend,
        credentials: "include",
      });
      if (res.ok) {
        alert("تیکت با موفقیت ثبت شد!");
        navigate("/tickets");
      } else {
        const errorData = await res.json();
        alert(`خطا در ثبت تیکت: ${JSON.stringify(errorData)}`);
      }
    } catch (err) {
      console.error("خطا در ارسال تیکت:", err);
      alert("خطا در اتصال به سرور");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        در حال بارگذاری...
      </div>
    );
  }

  return (
    <div className="container m-auto px-4 my-3">
      <div className="flex items-center justify-between mt-3">
        <div>
          <p className="font-Estedad text-xl font-bold text-blue-120">
            ثبت تیکت جدید
          </p>
        </div>
        <NavLink
          className="w-40 text-center h-auto p-2 text-white font-Estedad bg-blue-100 rounded-md cursor-pointer"
          to={-1}
        >
          بازگشت
        </NavLink>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3 mt-6 px-24">
          <div className="w-full">
            <input
              placeholder="عنوان را وارد کنید . . ."
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full border-2 border-slate-300 h-10 rounded-md px-3 text-sm font-medium text-gray-700 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-blue-400"
            />
          </div>

          <div className="w-full">
            <select
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              className="w-full border-2 border-slate-300 h-10 rounded-md px-3 text-sm font-medium text-gray-700 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-blue-400"
            >
              <option className="text-gray-700 bg-white" value="">
                انتخاب دپارتمان
              </option>
              {departments.map((dep) => (
                <option key={dep.id} value={dep.id}>
                  {dep.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full">
            <select
              name="section"
              value={formData.section}
              onChange={handleInputChange}
              className="w-full border-2 border-slate-300 h-10 rounded-md px-3 text-sm font-medium text-gray-700 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-blue-400"
              disabled={!formData.department}
            >
              <option className="text-gray-700 bg-white" value="">
                انتخاب بخش
              </option>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full">
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full border-2 border-slate-300 h-10 rounded-md px-3 text-sm font-medium text-gray-700 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-blue-400"
              disabled={!formData.section}
            >
              <option className="text-gray-700 bg-white" value="">
                انتخاب نقش
              </option>
              {roles.map((rol) => (
                <option key={rol.id} value={rol.id}>
                  {rol.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full">
            <select
              name="tag"
              value={formData.tag}
              onChange={handleInputChange}
              className="w-full border-2 border-slate-300 h-10 rounded-md px-3 text-sm font-medium text-gray-700 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-blue-400"
            >
              <option className="text-gray-700 bg-white" value="">
                انتخاب برچسب (اختیاری)
              </option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full">
            <select
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full border-2 border-slate-300 h-10 rounded-md px-3 text-sm font-medium text-gray-700 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-blue-400"
            >
              <option className="text-gray-700 bg-white" value="">
                اولویت
              </option>
              <option className="text-gray-700 bg-white" value="low">
                کم
              </option>
              <option className="text-gray-700 bg-white" value="medium">
                متوسط
              </option>
              <option className="text-gray-700 bg-white" value="high">
                زیاد
              </option>
              <option className="text-gray-700 bg-white" value="urgent">
                فوری
              </option>
            </select>
          </div>

          <div className="w-full col-span-2">
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full border-2 border-slate-300 px-3 outline-0 rounded-md text-sm py-2.5 h-48"
              placeholder="جزئیات کامل مشکل یا سوال خودتون رو بنویسید..."
            ></textarea>
          </div>

          <div
            className="w-full col-span-2 h-32 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors relative"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
              <svg
                className="w-6 h-6 mb-2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4m0 0l-4 4m4-4l4 4"
                />
              </svg>

              {file ? (
                <div className="flex flex-col items-center">
                  <p className="text-sm text-gray-700">{file.name}</p>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="mt-2 px-2 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600"
                  >
                    حذف فایل
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-700">
                    کلیک کنید یا فایل را اینجا بکشید و رها کنید
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    فرمت‌های مجاز: zip, rar, png, jpg, jpeg
                  </p>
                </>
              )}
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".zip,.rar,.png,.jpg,.jpeg"
              />
            </label>
          </div>
        </div>

        <div className="mt-6 px-24 flex justify-center">
          <button
            type="submit"
            className="cursor-pointer bg-lime-200 hover:bg-lime-300 transition-colors ease-in-out duration-500 p-2 w-84 rounded-md"
          >
            ارسال تیکت
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTicket;
