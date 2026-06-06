"use client";

import { useEffect, useRef, useState } from "react";

type ToastTone = "success" | "error" | "info";

type ToastPayload = {
  message: string;
  tone?: ToastTone;
};

type ToastState = {
  id: number;
  message: string;
  tone: ToastTone;
} | null;

function bgColor(tone: ToastTone) {
  if (tone === "error") return "rgba(173, 78, 112, 0.8)";
  if (tone === "success") return "rgba(6, 136, 211, 0.8)";
  return "rgba(72, 87, 99, 0.8)";
}

export default function GlobalToast() {
  const [toast, setToast] = useState<ToastState>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    function onToast(e: Event) {
      const custom = e as CustomEvent<ToastPayload>;
      const message = custom.detail?.message;
      if (!message) return;
      const tone: ToastTone = custom.detail?.tone ?? "info";
      const id = Date.now();

      setToast({ id, message, tone });

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        setToast((prev) => (prev?.id === id ? null : prev));
      }, 5000);
    }

    window.addEventListener("minddit:toast", onToast as EventListener);
    return () => {
      window.removeEventListener("minddit:toast", onToast as EventListener);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!toast) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[120] flex justify-center px-4">
      <div
        className="rounded-lg px-4 py-2 text-base font-medium text-white shadow-lg"
        style={{ backgroundColor: bgColor(toast.tone) }}
      >
        {toast.message}
      </div>
    </div>
  );
}
