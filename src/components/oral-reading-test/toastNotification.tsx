"use client";

import { CheckCircle, XCircle, X } from "lucide-react";

interface ToastNotificationProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

export function ToastNotification({
  message,
  type,
  onClose,
}: ToastNotificationProps) {
  return (
    <div
      className={`fixed left-4 right-4 top-18 z-50 flex items-start gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all duration-300 sm:left-auto sm:right-6 sm:top-6 sm:w-full sm:max-w-sm ${
        type === "success"
          ? "border border-green-200 bg-green-50 text-green-800"
          : "border border-red-200 bg-red-50 text-red-800"
      }`}
    >
      {type === "success" ? (
        <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 shrink-0 text-red-500" />
      )}
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close notification"
        title="Close notification"
        className={`ml-1 rounded-full p-0.5 transition-colors ${
          type === "success" ? "hover:bg-green-200" : "hover:bg-red-200"
        }`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
