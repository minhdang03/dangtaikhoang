"use client";

import { useEffect, useState } from "react";

interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error";
}

export function Toast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { message, type } = (e as CustomEvent).detail;
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      const duration = type === "error" ? 5000 : 2500;
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
    };
    window.addEventListener("show-toast", handler);
    return () => window.removeEventListener("show-toast", handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 inset-x-0 flex flex-col items-center gap-2 z-50 pointer-events-none px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg text-white animate-fade-in max-w-sm text-center ${
            t.type === "error" ? "bg-red-500" : "bg-gray-900"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
