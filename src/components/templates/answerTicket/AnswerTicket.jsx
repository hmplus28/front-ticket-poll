import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import ChatBubble from "../../modules/chatBubble/ChatBubble";
import { FaTicketAlt, FaUser } from "react-icons/fa";
import { TiCalendar } from "react-icons/ti";
import { AiOutlineTag } from "react-icons/ai";
import { MdOutlineInfo, MdApartment, MdAttachFile, MdClear } from "react-icons/md";
import { BiSolidMessageSquareEdit } from "react-icons/bi";

const AnswerTicket = () => {
    const { id } = useParams();
    const [ticket, setTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);
    const token = localStorage.getItem("authToken");

    const [availableStatuses, setAvailableStatuses] = useState([]);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [newStatus, setNewStatus] = useState("");

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
            console.warn("extractUserInfoFromMsg error:", e, msg);
        }
        return {
            msgUserId: msgUserId !== undefined && msgUserId !== null ? String(msgUserId) : null,
            msgUsername: msgUsername !== undefined && msgUsername !== null ? String(msgUsername) : null,
        };
    };

    const decideIsOwner = ({ msgUserId, msgUsername }, { ticketUserId, ticketUsername, currentUserId, currentUsername }) => {
        if (currentUserId && msgUserId && String(currentUserId) === String(msgUserId)) return true;
        if (currentUsername && msgUsername && String(currentUsername) === String(msgUsername)) return true;
        if (ticketUserId && msgUserId && String(ticketUserId) === String(msgUserId)) return true;
        if (ticketUsername && msgUsername && String(ticketUsername) === String(msgUsername)) return true;
        return false;
    };

    const fetchCurrentUserFromServer = async () => {
        if (!token) return null;
        const candidateUrls = [
            "/api/auth/user/",
            "/api/users/me/",
            "/auth/users/me/",
            "/api/profile/me/",
        ];
        for (const url of candidateUrls) {
            try {
                const res = await fetch(url, { headers: { Authorization: `Token ${token}` } });
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
                console.error(`Failed to fetch from ${url}`, e);
            }
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
            console.error("خطا در دریافت وضعیت‌های تیکت:", err);
            setAvailableStatuses(["open", "in_progress", "closed"]);
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
            
            // اطلاعات صاحب تیکت (fallback)
            const ticketUserId = ticketData.user !== undefined && ticketData.user !== null ? String(ticketData.user) : null;
            const ticketUsername = ticketData.user_username || ticketData.username || ticketData.user_name || null;

            const rawMessages = ticketData.messages || [];

            const filteredMessages = rawMessages.filter((m) => {
                const isDuplicateDescription = (message, description) => {
                    if (!message.message || !description) return false;
                    const normalizedMessageText = String(message.message).trim().replace(/\s+/g, ' ');
                    const normalizedDescriptionText = String(description).trim().replace(/\s+/g, ' ');
                    return (
                        normalizedMessageText === normalizedDescriptionText &&
                        (message.created_at && ticketData.created_at ? new Date(message.created_at).getTime() === new Date(ticketData.created_at).getTime() : true)
                    );
                };
                return !isDuplicateDescription(m, ticketData.description);
            });

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

            setMessages([descriptionMessage, ...mappedReplies]);
        } catch (err) {
            console.error("خطا در دریافت اطلاعات تیکت:", err);
            setTicket(null);
            setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async () => {
        if (!newStatus || newStatus === ticket.status) {
            setShowStatusModal(false);
            return;
        }

        const isConfirmed = window.confirm(`آیا مطمئن هستید که وضعیت تیکت را به "${newStatus}" تغییر می‌دهید؟`);
        if (!isConfirmed) {
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
                    body: JSON.stringify({ status: newStatus }),
                }
            );

            if (res.ok) {
                const updatedTicket = await res.json();
                setTicket(updatedTicket);
                alert(`وضعیت تیکت با موفقیت به "${newStatus}" تغییر یافت.`);
                setShowStatusModal(false);
            } else {
                const errorData = await res.json().catch(() => ({}));
                console.error("خطا در به‌روزرسانی وضعیت:", res.status, errorData);
                alert("خطا در تغییر وضعیت تیکت — کنسول را چک کن.");
            }
        } catch (err) {
            console.error("خطا در به‌روزرسانی وضعیت:", err);
            alert("خطای شبکه هنگام تغییر وضعیت. کنسول را بررسی کن.");
        }
    };

    // 💡 **منطق جدید برای به‌روزرسانی وضعیت هنگام ارسال پیام**
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
        } catch (err) {
            console.error("خطا در به‌روزرسانی خودکار وضعیت:", err);
        }
    };

    useEffect(() => {
        fetchTicketAndMessages();
        fetchAvailableStatuses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, token]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

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
                setNewMessage("");
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = null;
                await fetchTicketAndMessages();

                // 💡 **اگر پیام توسط کاربر (مشتری) ارسال شده باشد، وضعیت را به 'in_progress' تغییر بده**
                const storedUserId = getStoredUserId();
                const ticketUserId = ticket?.user;

                if (storedUserId && ticketUserId && String(storedUserId) === String(ticketUserId)) {
                    if (ticket.status !== 'in_progress') {
                        sendUpdateStatus('in_progress');
                    }
                }
            } else {
                console.error("خطا در ارسال پیام:", res.status, res.statusText);
                alert("خطا در ارسال پیام — کنسول را چک کن.");
            }
        } catch (err) {
            console.error("خطا در ارسال پیام:", err);
            alert("خطای شبکه در ارسال پیام. کنسول را بررسی کن.");
        }
    };

    const handleDeleteMessage = async (messageId) => {
        console.log("Request delete message id:", messageId);
        const isConfirmed = window.confirm("آیا از حذف این پیام مطمئن هستید؟");
        if (!isConfirmed) return;

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
                alert("پیام حذف شد.");
            } else {
                const text = await res.text().catch(() => "");
                console.error("خطا در حذف پیام:", res.status, res.statusText, text);
                alert(`خطا در حذف پیام: ${res.status}`);
            }
        } catch (err) {
            console.error("خطا در حذف پیام:", err);
            alert("خطای شبکه هنگام حذف پیام. کنسول را بررسی کن.");
        }
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

    // 💡 **بررسی وضعیت تیکت برای غیرفعال کردن باکس چت و دکمه تغییر وضعیت**
    const isTicketClosed = ["closed", "rejected", "done"].includes(ticket.status);

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {/* جزئیات تیکت */}
            <div className="hidden sm:block bg-white shadow-lg rounded-b-2xl p-6 mb-4">
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
                        <span>{ticket.department_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MdApartment className="text-indigo-500" />
                        <span className="font-semibold">بخش:</span>
                        <span>{ticket.sections_names}</span>
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
                    {messages.length === 0 ? (
                        <p className="text-gray-500 text-center mt-4">هیچ پیامی برای این تیکت وجود ندارد</p>
                    ) : (
                        messages.map((msg) => (
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
                        ))
                    )}
                </div>
                <div ref={messagesEndRef} />
            </div>

            {/* بخش ارسال پیام */}
            <div className={`sticky bottom-0 p-4 shadow-xl flex items-center gap-2 ${isTicketClosed ? "bg-gray-300" : "bg-white"}`}>
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
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
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
                                onClick={handleUpdateStatus}
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
        </div>
    );
};

export default AnswerTicket;