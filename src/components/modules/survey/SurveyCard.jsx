import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// --- SurveyCard ---
const SurveyCard = ({ poll, user, onAction }) => {
  // امن کردن دسترسی به created_by
  const isOwner = poll.created_by?.id === user.id;

  const handleClose = () => {
    onAction(poll.id, "close");
  };

  const handleDelete = () => {
    onAction(poll.id, "delete");
  };

  return (
    <div className="bg-white p-4 rounded-md shadow-md flex items-center justify-between">
      <div>
        <h2 className="text-lg font-bold">{poll.question ?? 'بدون سوال'}</h2>
        <p className="text-gray-500 text-sm">
          برای: {poll.audience?.department?.name ?? 'نامشخص'} -{" "}
          {poll.audience?.section?.name ?? 'نامشخص'}
        </p>
      </div>
      {isOwner && (
        <div className="flex space-x-2">
          {poll.is_active ? (
            <button
              onClick={handleClose}
              className="bg-red-500 text-white px-3 py-1 rounded-md text-sm"
            >
              بستن
            </button>
          ) : (
            <span className="text-gray-400 text-sm">بسته شده</span>
          )}
          <button
            onClick={handleDelete}
            className="bg-gray-500 text-white px-3 py-1 rounded-md text-sm"
          >
            حذف
          </button>
        </div>
      )}
    </div>
  );
};
export default SurveyCard;
