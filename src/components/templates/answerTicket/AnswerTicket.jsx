import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import ChatBubble from "../../modules/chatBubble/ChatBubble";
import { FaTicketAlt, FaUser } from "react-icons/fa";
import { TiCalendar } from "react-icons/ti";
import { AiOutlineTag } from "react-icons/ai";
import { MdOutlineInfo, MdApartment, MdAttachFile, MdClear, MdPersonAdd } from "react-icons/md";
import { BiSolidMessageSquareEdit } from "react-icons/bi";

const formatDateToPersian = (dateString) => {
    if (!dateString) return "";
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const messageDate = new Date(dateString);

    const isToday = messageDate.getDate() === today.getDate() &&
        messageDate.getMonth() === today.getMonth() &&
        messageDate.getFullYear() === today.getFullYear();
    
    const isYesterday = messageDate.getDate() === yesterday.getDate() &&
        messageDate.getMonth() === yesterday.getMonth() &&
        messageDate.getFullYear() === yesterday.getFullYear();

    if (isToday) {
        return "امروز";
    }
    if (isYesterday) {
        return "دیروز";
    }

    return messageDate.toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
};

const AnswerTicket = () => {
    const { id } = useParams();
    const [ticket, setTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messagesGroupedByDate, setMessagesGroupedByDate] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);
    const token = localStorage.getItem("authToken");

    const [availableStatuses, setAvailableStatuses] = useState([]);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [newStatus, setNewStatus] = useState("");
    const [toastMessage, setToastMessage] = useState({ message: "", type: "" });
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmModalContent, setConfirmModalContent] = useState({});
    const [confirmAction, setConfirmAction] = useState(null);

    // حالت‌های جدید برای ارجاع تیکت
    const [showReferralModal, setShowReferralModal] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [sections, setSections] = useState([]);
    const [roles, setRoles] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [selectedRole, setSelectedRole] = useState("");
    const [selectedUser, setSelectedUser] = useState("");
    const [referralMessage, setReferralMessage] = useState("");

    // اضافه برای چک نوع کاربر
    const [currentUserType, setCurrentUserType] = useState(null);

    const wsRef = useRef(null);
    const currentUserId = useRef(null);

    const getStoredUserId = () =>
        localStorage.getItem("userId") ||
        localStorage.getItem("userID") ||
        localStorage.getItem("currentUserId") ||
        localStorage.getItem("authUserId") ||
        null;

    const getStoredUsername = () =>
        localStorage.getItem("username") ||
        localStorage.getItem("userName") ||
        localStorage.getItem("user_username") ||
        localStorage.getItem("authUserName") ||
        null;

    const extractUserInfoFromMsg = (msg) => {
        let msgUserId = null;
        let msgUsername = null;
        
        try {
            // اولویت با نمایش نام کامل کاربر (first_name + last_name)
            const firstName = msg.user_first_name || msg.user?.first_name || '';
            const lastName = msg.user_last_name || msg.user?.last_name || '';
            msgUsername = `${firstName} ${lastName}`.trim();
            
            // اگر نام کامل وجود نداشت، از username استفاده کن
            if (!msgUsername) {
                msgUsername = msg.user_username || msg.user?.username || msg.username || msg.user_name || null;
            }
            
            // استخراج ID کاربر
            msgUserId = msg.user?.id || msg.user_id || msg.userId || null;
        } catch (e) {
            console.error("Error extracting user info:", e);
        }
        
        return {
            msgUserId: msgUserId ? String(msgUserId) : null,
            msgUsername: msgUsername ? String(msgUsername) : `کاربر ${msg.user_id || ''}`,
        };
    };

    const decideIsOwner = ({ msgUserId, msgUsername }, { ticketUserId, ticketUsername, currentUserId, currentUsername }) => {
        if (currentUserId && msgUserId) {
            return String(currentUserId) === String(msgUserId);
        }
        if (currentUsername && msgUsername) {
            return String(currentUsername) === String(msgUsername);
        }
        return false;
    };

    const fetchCurrentUserFromServer = async () => {
        if (!token) return null;
        const correctUrl = "http://127.0.0.1:8000/api/accounts/profile/";
        try {
            const res = await fetch(correctUrl, { headers: { Authorization: `Token ${token}` } });
            if (res.ok) {
                const data = await res.json();
                const id = data.id ?? data.pk ?? data.user_id ?? null;
                const username = data.username ?? data.user_username ?? data.email ?? null;
                const userType = data.user_type ?? null;  // اضافه برای گرفتن user_type
                return {
                    id: id ? String(id) : null,
                    username: username ? String(username) : null,
                    user_type: userType,
                };
            }
        } catch (e) {
            console.error("Error fetching current user:", e);
        }
        return null;
    };

    const fetchAvailableStatuses = async () => {
        try {
            const res = await fetch("http://127.0.0.1:8000/api/tickets/statuses/", {
                headers: { Authorization: `Token ${token}` },
            });
            if (!res.ok) throw new Error(`Status ${res.status}`);
            const data = await res.json();
            setAvailableStatuses(data);
        } catch (err) {
            console.error("Error fetching available statuses:", err);
            setAvailableStatuses(["open", "in_progress", "closed"]);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await fetch("http://127.0.0.1:8000/api/tickets/departments/", {
                headers: { Authorization: `Token ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setDepartments(data.results || data);
            }
        } catch (err) {
            console.error("Error fetching departments:", err);
        }
    };

    const fetchSections = async (departmentId) => {
        if (!departmentId) {
            setSections([]);
            return;
        }
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/tickets/sections/?department_id=${departmentId}`, {
                headers: { Authorization: `Token ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setSections(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Error fetching sections:", err);
            setSections([]);
        }
    };

    const fetchRoles = async (sectionId) => {
        if (!sectionId) {
            setRoles([]);
            return;
        }
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/tickets/roles/?section_id=${sectionId}`, {
                headers: { Authorization: `Token ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setRoles(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Error fetching roles:", err);
            setRoles([]);
        }
    };

    const fetchUsers = async () => {
        try {
            const params = new URLSearchParams();
            if (selectedDepartment) params.append("department_id", selectedDepartment);
            if (selectedSection) params.append("section_id", selectedSection);
            if (selectedRole) params.append("role_id", selectedRole);
            
            const res = await fetch(`http://127.0.0.1:8000/api/accounts/users/by-filters/?${params.toString()}`, {
                headers: { Authorization: `Token ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data.results || data);
            }
        } catch (err) {
            console.error("Error fetching users:", err);
        }
    };

    const fetchTicketAndMessages = async () => {
        setLoading(true);
        try {
            const resTicket = await fetch(
                `http://127.0.0.1:8000/api/tickets/tickets/${id}/`,
                { headers: { Authorization: `Token ${token}` } }
            );
            if (!resTicket.ok) throw new Error(`Status ${resTicket.status}`);
            const ticketData = await resTicket.json();
            setTicket(ticketData);

            let serverUser = null;
            try {
                serverUser = await fetchCurrentUserFromServer();
            } catch (e) {
                serverUser = null;
            }

            const storedUserId = getStoredUserId();
            const currentUserId = serverUser?.id || (storedUserId ? String(storedUserId) : null);
            const storedUsername = getStoredUsername();
            const currentUsername = serverUser?.username || (storedUsername ? String(storedUsername) : null);
            
            const ticketUserId = ticketData.user !== undefined && ticketData.user !== null ? String(ticketData.user) : null;
            const ticketUsername = ticketData.user_username || ticketData.username || ticketData.user_name || null;

            const rawMessages = ticketData.messages || [];

            const filteredMessages = rawMessages.filter(m => m.message?.trim() !== ticketData.description?.trim());

            const mappedReplies = filteredMessages.map((msg) => {
                const { msgUserId, msgUsername } = extractUserInfoFromMsg(msg);
                const isOwner = decideIsOwner(
                    { msgUserId, msgUsername },
                    { ticketUserId, ticketUsername, currentUserId, currentUsername }
                );
                return {
                    id: msg.id,
                    message: msg.message,
                    isOwner,
                    createdAt: msg.created_at,
                    attachments: msg.attachments || [],
                    username: msgUsername || (msgUserId ? `کاربر ${msgUserId}` : "کاربر"),
                    raw_user_id: msgUserId,
                };
            });

            const descriptionMessage = {
                id: `ticket-desc-${ticketData.id}`,
                message: ticketData.description || "",
                isOwner: decideIsOwner(
                    { msgUserId: ticketUserId, msgUsername: ticketUsername },
                    { ticketUserId, ticketUsername, currentUserId, currentUsername }
                ),
                createdAt: ticketData.created_at,
                attachments: ticketData.attachments || [],
                username: ticketData.user_username || ticketData.username || `کاربر ${ticketUserId || ""}`,
                isInitial: true,
            };

            const finalMessages = [descriptionMessage, ...mappedReplies];
            setMessages(finalMessages);
        } catch (err) {
            console.error("Error fetching ticket and messages:", err);
            setTicket(null);
            setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (messages.length === 0) {
            setMessagesGroupedByDate([]);
            return;
        }

        const groups = messages.reduce((acc, message) => {
            if (!message.createdAt) return acc;

            const dateKey = formatDateToPersian(message.createdAt);
            const lastGroup = acc[acc.length - 1];

            if (lastGroup && lastGroup.date === dateKey) {
                lastGroup.messages.push(message);
            } else {
                acc.push({ date: dateKey, messages: [message] });
            }
            return acc;
        }, []);
        
        setMessagesGroupedByDate(groups);
    }, [messages]);

    useEffect(() => {
        const init = async () => {
            await fetchTicketAndMessages();
            await fetchAvailableStatuses();
            await fetchDepartments();

            const serverUser = await fetchCurrentUserFromServer();
            currentUserId.current = serverUser?.id || getStoredUserId();
            setCurrentUserType(serverUser?.user_type || null);

            if (token && id) {
                const wsUrl = `ws://127.0.0.1:8000/ws/ticket/${id}/?token=${token}`;
                wsRef.current = new WebSocket(wsUrl);

                wsRef.current.onopen = () => console.log('WebSocket connected for ticket');

                wsRef.current.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    if (data.type === 'new_message') {
                        const newMsg = data.data;
                        if (String(newMsg.user) !== String(currentUserId.current)) {
                            const mappedMsg = {
                                id: newMsg.id,
                                message: newMsg.message,
                                isOwner: false,
                                createdAt: newMsg.created_at,
                                attachments: newMsg.attachments || [],
                                username: newMsg.user_username || 'کاربر',
                                raw_user_id: newMsg.user,
                            };
                            setMessages((prev) => [...prev, mappedMsg]);
                        }
                    } else if (data.type === 'status_update') {
                        setTicket((prev) => {
                            if (prev) {
                                return { ...prev, status: data.status };
                            }
                            return prev;
                        });
                        setToastMessage({ message: `وضعیت به "${data.status}" تغییر یافت.`, type: "info" });
                    } else if (data.type === 'ticket_referred') {
                        // مدیریت پیام ارجاع
                        setToastMessage({ 
                            message: `تیکت به کاربر دیگری ارجاع داده شد.`, 
                            type: "info" 
                        });
                        // رفرش تیکت برای نمایش اطلاعات ارجاع
                        fetchTicketAndMessages();
                    }
                };

                wsRef.current.onclose = () => console.log('WebSocket disconnected');
                wsRef.current.onerror = (error) => console.error('WebSocket error:', error);
            }
        };
        init();

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, [id, token]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messagesGroupedByDate]);

    useEffect(() => {
        if (toastMessage.message) {
            const timer = setTimeout(() => {
                setToastMessage({ message: "", type: "" });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);
    
    const handleSendMessage = async () => {
        const isClosed = ["closed", "rejected", "done"].includes(ticket?.status);
        if (isClosed) {
            setToastMessage({ message: "امکان ارسال پیام در این وضعیت وجود ندارد.", type: "error" });
            return;
        }

        if (!newMessage.trim() && !file) return;

        const formData = new FormData();
        if (newMessage.trim()) formData.append("message", newMessage);
        if (file) formData.append("file", file);

        try {
            const res = await fetch(
                `http://127.0.0.1:8000/api/tickets/tickets/${id}/messages/`,
                {
                    method: "POST",
                    headers: { Authorization: `Token ${token}` },
                    body: formData,
                }
            );

            if (res.ok) {
                const newMsgData = await res.json();
                const mappedMsg = {
                    id: newMsgData.id,
                    message: newMsgData.message,
                    isOwner: true,
                    createdAt: newMsgData.created_at,
                    attachments: newMsgData.attachments || [],
                    username: getStoredUsername() || 'من',
                };
                setMessages((prev) => [...prev, mappedMsg]);
                setNewMessage("");
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = null;

                const storedUserId = getStoredUserId();
                const ticketUserId = ticket?.user;

                if (storedUserId && ticketUserId && String(storedUserId) === String(ticketUserId)) {
                    if (ticket.status !== 'in_progress') {
                        sendUpdateStatus('in_progress');
                    }
                }
            } else {
                setToastMessage({ message: "خطا در ارسال پیام.", type: "error" });
            }
        } catch (err) {
            console.error("Error sending message:", err);
            setToastMessage({ message: "خطای شبکه در ارسال پیام.", type: "error" });
        }
    };
    
    const handleUpdateStatus = async (status) => {
        if (!status || status === ticket.status) {
            setShowConfirmModal(false);
            return;
        }

        try {
            const res = await fetch(
                `http://127.0.0.1:8000/api/tickets/tickets/${id}/change_status/`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Token ${token}`,
                    },
                    body: JSON.stringify({ status: status }),
                }
            );

            if (res.ok) {
                setToastMessage({ message: `وضعیت تیکت با موفقیت به "${status}" تغییر یافت.`, type: "success" });
                setShowStatusModal(false);
                // اجرای رفرش اجباری صفحه
                setTimeout(() => window.location.reload(), 1500);
            } else {
                setToastMessage({ message: "خطا در تغییر وضعیت تیکت.", type: "error" });
                setShowStatusModal(false);
            }
        } catch (err) {
            console.error("Error updating status:", err);
            setToastMessage({ message: "خطای شبکه هنگام تغییر وضعیت.", type: "error" });
            setShowStatusModal(false);
        }
    };
    
    const sendUpdateStatus = async (status) => {
        try {
            await fetch(`http://127.0.0.1:8000/api/tickets/tickets/${id}/change_status/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${token}`,
                },
                body: JSON.stringify({ status }),
            });
            setTicket((prev) => {
                if (prev) {
                    return { ...prev, status };
                }
                return prev;
            });
        } catch (err) {
            console.error("Error sending update status:", err);
        }
    };

    const handleConfirmStatusChange = () => {
        setConfirmAction(() => () => handleUpdateStatus(newStatus));
        setConfirmModalContent({
            title: "تغییر وضعیت تیکت",
            text: `آیا مطمئن هستید که وضعیت تیکت را به "${newStatus}" تغییر می‌دهید؟`,
            confirmText: "تأیید",
            cancelText: "لغو"
        });
        setShowConfirmModal(true);
    };

    const handleConfirmDelete = async (messageId) => {
        setShowConfirmModal(false);
        try {
            const res = await fetch(
                `http://127.0.0.1:8000/api/tickets/tickets/${id}/messages/${messageId}/`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Token ${token}` },
                }
            );

            if (res.ok) {
                setMessages((prev) => prev.filter((msg) => String(msg.id) !== String(messageId)));
                setToastMessage({ message: "پیام حذف شد.", type: "success" });
            } else {
                setToastMessage({ message: `خطا در حذف پیام: ${res.status}`, type: "error" });
            }
        } catch (err) {
            console.error("Error deleting message:", err);
            setToastMessage({ message: "خطای شبکه هنگام حذف پیام.", type: "error" });
        }
    };
    
    const handleDeleteMessage = (messageId) => {
        setConfirmAction(() => () => handleConfirmDelete(messageId));
        setConfirmModalContent({
            title: "حذف پیام",
            text: "آیا از حذف این پیام مطمئن هستید؟",
            confirmText: "تأیید",
            cancelText: "لغو"
        });
        setShowConfirmModal(true);
    };

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) setFile(e.target.files[0]);
    };

    const handleRemoveFile = () => {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = null;
    };

    // توابع جدید برای ارجاع تیکت
    const handleReferTicket = async () => {
        if (!selectedUser) {
            setToastMessage({ message: "لطفاً کاربر مورد نظر را انتخاب کنید", type: "error" });
            return;
        }

        try {
            const res = await fetch(
                `http://127.0.0.1:8000/api/tickets/tickets/${id}/refer_ticket/`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Token ${token}`,
                    },
                    body: JSON.stringify({
                        referred_to: selectedUser,
                        referral_message: referralMessage
                    }),
                }
            );

            if (res.ok) {
                setToastMessage({ message: "تیکت با موفقیت ارجاع داده شد", type: "success" });
                setShowReferralModal(false);
                setSelectedDepartment("");
                setSelectedSection("");
                setSelectedRole("");
                setSelectedUser("");
                setReferralMessage("");
                fetchTicketAndMessages();
            } else {
                const errorData = await res.json();
                setToastMessage({ 
                    message: `خطا در ارجاع تیکت: ${errorData.error || "خطای نامشخص"}`, 
                    type: "error" 
                });
            }
        } catch (err) {
            console.error("Error referring ticket:", err);
            setToastMessage({ message: "خطای شبکه هنگام ارجاع تیکت", type: "error" });
        }
    };

    // useEffect برای به‌روزرسانی بخش‌ها هنگام تغییر دپارتمان
    useEffect(() => {
        if (selectedDepartment) {
            fetchSections(selectedDepartment);
            setSelectedSection("");
            setRoles([]);
            setSelectedRole("");
        } else {
            setSections([]);
            setRoles([]);
            setSelectedSection("");
            setSelectedRole("");
        }
    }, [selectedDepartment]);

    // useEffect برای به‌روزرسانی نقش‌ها هنگام تغییر بخش
    useEffect(() => {
        if (selectedSection) {
            fetchRoles(selectedSection);
            setSelectedRole("");
        } else {
            setRoles([]);
            setSelectedRole("");
        }
    }, [selectedSection]);

    // useEffect برای به‌روزرسانی کاربران هنگام تغییر فیلترها
    useEffect(() => {
        fetchUsers();
    }, [selectedDepartment, selectedSection, selectedRole]);

    if (loading)
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-gray-600 font-bold text-lg">در حال بارگذاری تیکت...</p>
            </div>
        );

    if (!ticket)
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-red-500 font-bold text-lg">تیکت یافت نشد.</p>
            </div>
        );

    const isTicketClosed = ["closed", "rejected", "done"].includes(ticket?.status);

    return (
        <div className="p-4 md:p-6 w-full h-screen overflow-hidden">
            <div className="mx-auto w-full max-w-7xl h-full flex flex-col rounded-2xl border border-gray-200 bg-white shadow-lg">
                <div className="hidden sm:block bg-white shadow-lg rounded-b-2xl p-6 mb-4 flex-shrink-0">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h2 className="text-xl font-bold">جزئیات تیکت</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowStatusModal(true)}
                                className={`px-4 py-2 text-white rounded-xl transition font-semibold flex items-center gap-2 ${isTicketClosed ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"}`}
                                disabled={isTicketClosed}
                            >
                                <BiSolidMessageSquareEdit />
                                تغییر وضعیت
                            </button>
                            
                            {/* فقط برای کارمندان نمایش داده شود */}
                            {currentUserType !== 'student' && (
                                <button
                                    onClick={() => setShowReferralModal(true)}
                                    className={`px-4 py-2 text-white rounded-xl transition font-semibold flex items-center gap-2 ${isTicketClosed ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
                                    disabled={isTicketClosed}
                                >
                                    <MdPersonAdd />
                                    ارجاع تیکت
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
                        <div className="flex items-center gap-2">
                            <FaTicketAlt className="text-blue-500" />
                            <span className="font-semibold">موضوع:</span>
                            <span>{ticket.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FaUser className="text-green-500" />
                            <span className="font-semibold">کاربر:</span>
                            <span>{ticket.user_username}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MdApartment className="text-purple-500" />
                            <span className="font-semibold">دپارتمان:</span>
                            <span>{ticket.department_name || "—"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MdApartment className="text-indigo-500" />
                            <span className="font-semibold">بخش:</span>
                            <span>{ticket.sections_names || "—"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MdApartment className="text-indigo-500" />
                            <span className="font-semibold">نقش:</span>
                            <span>{ticket.roles_names || "—"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MdOutlineInfo className="text-orange-500" />
                            <span className="font-semibold">وضعیت:</span>
                            <span>{ticket.status}</span>
                        </div>
                        {/* نمایش اطلاعات ارجاع */}
                        {ticket.referred_to && (
                            <div className="flex items-center gap-2">
                                <MdPersonAdd className="text-indigo-500" />
                                <span className="font-semibold">ارجاع به:</span>
                                <span>{ticket.referred_to.username}</span>
                            </div>
                        )}
                        {ticket.referred_by && (
                            <div className="flex items-center gap-2">
                                <MdPersonAdd className="text-indigo-500" />
                                <span className="font-semibold">ارجاع توسط:</span>
                                <span>{ticket.referred_by.username}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <TiCalendar className="text-red-500" />
                            <span className="font-semibold">تاریخ ثبت:</span>
                            <span>
                                {new Date(ticket.created_at).toLocaleString("fa-IR", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <AiOutlineTag className="text-pink-500" />
                            <span className="font-semibold">برچسب‌ها:</span>
                            <span>{ticket.tag_names || "—"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">اولویت:</span>
                            <span>{ticket.priority}</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-6 bg-gray-100 space-y-4">
                    <div className="max-w-3xl mx-auto space-y-3">
                        {messagesGroupedByDate.length === 0 ? (
                            <p className="text-gray-500 text-center mt-4">هیچ پیامی برای این تیکت وجود ندارد</p>
                        ) : (
                            messagesGroupedByDate.map((group) => (
                                <div key={group.date}>
                                    <div className="flex justify-center my-4">
                                        <div className="bg-gray-300 text-gray-700 text-xs px-4 py-1 rounded-full shadow-md">
                                            {group.date}
                                        </div>
                                    </div>
                                    {group.messages.map((msg) => (
                                        <ChatBubble
                                            key={String(msg.id)}
                                            isOwner={!!msg.isOwner}
                                            message={msg.message}
                                            createdAt={msg.createdAt}
                                            onDelete={msg.isOwner && !String(msg.id).startsWith("ticket-desc-") ? () => handleDeleteMessage(msg.id) : null}
                                            attachments={msg.attachments}
                                            username={msg.username}
                                            isInitial={msg.isInitial}
                                            isReferral={msg.message.includes("ارجاع داده شد")}
                                        />
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                    <div ref={messagesEndRef} />
                </div>

                <div className={`sticky bottom-0 p-4 shadow-xl flex items-center gap-2 ${isTicketClosed ? "bg-gray-300" : "bg-white"} flex-shrink-0`}>
                    <label htmlFor="file-upload" className={`cursor-pointer text-gray-500 hover:text-blue-500 transition-colors duration-200 ${isTicketClosed ? "pointer-events-none opacity-50" : ""}`}>
                        <MdAttachFile size={24} />
                        <input
                            ref={fileInputRef}
                            id="file-upload"
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={isTicketClosed}
                        />
                    </label>
                    {file && (
                        <div className="flex items-center gap-2 bg-gray-200 px-3 py-1 rounded-full text-sm">
                            <span>{file.name}</span>
                            <button onClick={handleRemoveFile}>
                                <MdClear size={16} />
                            </button>
                        </div>
                    )}
                    <textarea
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-2xl outline-none resize-none"
                        rows={1}
                        placeholder={isTicketClosed ? "امکان ارسال پیام وجود ندارد" : "متن پیام..."}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                if (!isTicketClosed) handleSendMessage();
                            }
                        }}
                        disabled={isTicketClosed}
                    />
                    <button
                        className={`px-6 py-2 text-white rounded-2xl font-bold transition ${isTicketClosed ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
                        onClick={handleSendMessage}
                        disabled={isTicketClosed}
                    >
                        ارسال
                    </button>
                </div>

                {/* مودال تغییر وضعیت */}
                {showStatusModal && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 h-full w-full flex items-center justify-center z-50">
                        <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full mx-4 text-center">
                            <h3 className="text-lg font-bold mb-4">تغییر وضعیت تیکت</h3>
                            <p className="mb-4">وضعیت جدید را انتخاب کنید:</p>
                            <select
                                className="w-full p-2 mb-4 border border-gray-300 rounded-md"
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                            >
                                <option value="" disabled>انتخاب کنید...</option>
                                {availableStatuses.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
                            </select>
                            <div className="flex justify-around gap-4">
                                <button
                                    onClick={handleConfirmStatusChange}
                                    disabled={!newStatus}
                                    className={`px-4 py-2 rounded-md font-semibold transition ${newStatus ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-400 text-gray-700 cursor-not-allowed"}`}
                                >
                                    تأیید
                                </button>
                                <button
                                    onClick={() => setShowStatusModal(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300"
                                >
                                    لغو
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* مودال ارجاع تیکت */}
                {showReferralModal && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 h-full w-full flex items-center justify-center z-50">
                        <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                            <h3 className="text-lg font-bold mb-4">ارجاع تیکت</h3>
                            
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    دپارتمان:
                                </label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={selectedDepartment}
                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                >
                                    <option value="">-- انتخاب دپارتمان --</option>
                                    {departments.map((dept) => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    بخش:
                                </label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                    disabled={!selectedDepartment}
                                >
                                    <option value="">-- انتخاب بخش --</option>
                                    {sections.map((section) => (
                                        <option key={section.id} value={section.id}>
                                            {section.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    نقش:
                                </label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    disabled={!selectedSection}
                                >
                                    <option value="">-- انتخاب نقش --</option>
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    کاربر:
                                </label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={selectedUser}
                                    onChange={(e) => setSelectedUser(e.target.value)}
                                >
                                    <option value="">-- انتخاب کاربر --</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    پیام ارجاع (اختیاری):
                                </label>
                                <textarea
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    rows="3"
                                    value={referralMessage}
                                    onChange={(e) => setReferralMessage(e.target.value)}
                                    placeholder="پیام ارجاع را وارد کنید..."
                                ></textarea>
                            </div>
                            
                            <div className="flex justify-around gap-4">
                                <button
                                    onClick={handleReferTicket}
                                    disabled={!selectedUser}
                                    className={`px-4 py-2 rounded-md font-semibold transition ${selectedUser ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-400 text-gray-700 cursor-not-allowed"}`}
                                >
                                    ارجاع تیکت
                                </button>
                                <button
                                    onClick={() => {
                                        setShowReferralModal(false);
                                        setSelectedDepartment("");
                                        setSelectedSection("");
                                        setSelectedRole("");
                                        setSelectedUser("");
                                        setReferralMessage("");
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300"
                                >
                                    لغو
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showConfirmModal && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 h-full w-full flex items-center justify-center z-50">
                        <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full mx-4 text-center">
                            <h3 className="text-lg font-bold mb-4">{confirmModalContent.title}</h3>
                            <p className="mb-4">{confirmModalContent.text}</p>
                            <div className="flex justify-around gap-4">
                                <button
                                    onClick={confirmAction}
                                    className="px-4 py-2 rounded-md font-semibold transition bg-red-600 text-white hover:bg-red-700"
                                >
                                    {confirmModalContent.confirmText}
                                </button>
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300"
                                >
                                    {confirmModalContent.cancelText}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {toastMessage.message && (
                    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-white font-semibold shadow-lg transition-opacity duration-300 ${toastMessage.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
                        {toastMessage.message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnswerTicket;