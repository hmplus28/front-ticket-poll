import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import ChatBubble from "../../modules/chatBubble/ChatBubble";
import { FaTicketAlt, FaUser } from "react-icons/fa";
import { TiCalendar } from "react-icons/ti";
import { AiOutlineTag } from "react-icons/ai";
import { MdOutlineInfo, MdApartment, MdAttachFile, MdClear } from "react-icons/md";
import { BiSolidMessageSquareEdit } from "react-icons/bi";

// 💡 منطق جدید برای نمایش تاریخ
const formatDateToPersian = (dateString) => {
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

    // اضافه: WebSocket ref
    const wsRef = useRef(null);
    const currentUserId = useRef(null);  // برای چک isOwner در real-time

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
            if (msg.user !== undefined && msg.user !== null) {
                if (typeof msg.user === "object") {
                    msgUserId = msg.user.id ?? msg.user._id ?? msg.user.pk ?? msg.user.userId ?? null;
                    msgUsername = msg.user.username ?? msg.user.user_username ?? msg.user.name ?? null;
                } else {
                    msgUserId = msg.user;
                }
            }
            msgUsername = msgUsername || msg.user_username || msg.username || msg.user_name || null;
        } catch (e) {
        }
        return {
            msgUserId: msgUserId !== undefined && msgUserId !== null ? String(msgUserId) : null,
            msgUsername: msgUsername !== undefined && msgUsername !== null ? String(msgUsername) : null,
        };
    };

    const decideIsOwner = ({ msgUserId, msgUsername }, { ticketUserId, ticketUsername, currentUserId, currentUsername }) => {
    // 💡 منطق اصلاح شده: فقط زمانی که فرستنده پیام همان کاربر فعلی باشد، isOwner true است.
    if (currentUserId && msgUserId) {
        return String(currentUserId) === String(msgUserId);
    }
    // اگر شناسه کاربر فعلی موجود نبود، با نام کاربری مقایسه کن.
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
                return {
                    id: id !== undefined && id !== null ? String(id) : null,
                    username: username !== undefined && username !== null ? String(username) : null,
                };
            }
        } catch (e) {
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
            setAvailableStatuses(["open", "in_progress", "closed"]);
        }
    };

    // 💡 تابع اصلاح شده برای دریافت تیکت و پیام‌ها
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

            // set currentUserId برای چک real-time
            const serverUser = await fetchCurrentUserFromServer();
            currentUserId.current = serverUser?.id || getStoredUserId();

            // اتصال WebSocket
            if (token && id) {
                const wsUrl = `ws://127.0.0.1:8000/ws/ticket/${id}/?token=${token}`;
                wsRef.current = new WebSocket(wsUrl);

                wsRef.current.onopen = () => console.log('WebSocket connected for ticket');

                wsRef.current.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    if (data.type === 'new_message') {
                        const newMsg = data.data;
                        // چک اگر پیام از خود کاربر نباشه (برای جلوگیری از duplicate)
                        if (String(newMsg.user) !== String(currentUserId.current)) {
                            const mappedMsg = {
                                id: newMsg.id,
                                message: newMsg.message,
                                isOwner: false,  // چون از دیگران
                                createdAt: newMsg.created_at,
                                attachments: newMsg.attachments || [],
                                username: newMsg.user_username || 'کاربر',
                                raw_user_id: newMsg.user,
                            };
                            setMessages((prev) => [...prev, mappedMsg]);
                        }
                    } else if (data.type === 'status_update') {
                        setTicket((prev) => ({ ...prev, status: data.status }));
                        setToastMessage({ message: `وضعیت به "${data.status}" تغییر یافت.`, type: "info" });
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
                const newMsgData = await res.json();  // پیام جدید از پاسخ
                // اضافه به state (برای خود فرستنده، چون broadcast برای دیگرانه)
                const mappedMsg = {
                    id: newMsgData.id,
                    message: newMsgData.message,
                    isOwner: true,  // چون خود فرستنده
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
            setToastMessage({ message: "خطای شبکه در ارسال پیام.", type: "error" });
        }
    };
    
    const handleUpdateStatus = async (status) => {
        setShowConfirmModal(false);
        if (!status || status === ticket.status) return;

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
                const updatedTicket = await res.json();
                setTicket(updatedTicket);
                setToastMessage({ message: `وضعیت تیکت با موفقیت به "${status}" تغییر یافت.`, type: "success" });
                setShowStatusModal(false);
            } else {
                setToastMessage({ message: "خطا در تغییر وضعیت تیکت.", type: "error" });
            }
        } catch (err) {
            setToastMessage({ message: "خطای شبکه هنگام تغییر وضعیت.", type: "error" });
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
            // آپدیت محلی (broadcast برای دیگران)
            setTicket((prev) => ({ ...prev, status }));
        } catch (err) {
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

    const isTicketClosed = ["closed", "rejected", "done"].includes(ticket.status);

    return (
        <div className="p-4 md:p-6 w-full h-screen overflow-hidden">
            <div className="mx-auto w-full max-w-7xl h-full flex flex-col rounded-2xl border border-gray-200 bg-white shadow-lg">
                {/* جزئیات تیکت */}
                <div className="hidden sm:block bg-white shadow-lg rounded-b-2xl p-6 mb-4 flex-shrink-0">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h2 className="text-xl font-bold">جزئیات تیکت</h2>
                        <button
                            onClick={() => setShowStatusModal(true)}
                            className={`px-4 py-2 text-white rounded-xl transition font-semibold flex items-center gap-2 ${isTicketClosed ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"}`}
                            disabled={isTicketClosed}
                        >
                            <BiSolidMessageSquareEdit />
                            تغییر وضعیت
                        </button>
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

                {/* باکس چت */}
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
                                        />
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                    <div ref={messagesEndRef} />
                </div>

                {/* بخش ارسال پیام */}
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

                {/* Modal تغییر وضعیت */}
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
                {/* Modal عمومی برای تأیید عملیات */}
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

                {/* سیستم Toast */}
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