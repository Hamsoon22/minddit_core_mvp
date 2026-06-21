"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NOTICE_ITEMS, getUnreadNoticeCount } from "@/lib/notices";

export default function HomeNotificationMenu() {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const unreadCount = getUnreadNoticeCount();
  const hasUnread = unreadCount > 0;
  const previewItems = NOTICE_ITEMS.slice(0, 5);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        aria-label="알림"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-[44px] w-[44px] items-center justify-center transition hover:opacity-80"
      >
        <Image
          src={hasUnread ? "/icon_notify_on.png" : "/icon_notify.png"}
          alt=""
          aria-hidden="true"
          width={44}
          height={44}
          className="h-[44px] w-[44px] min-h-[44px] min-w-[44px]"
          style={{ width: 44, height: 44, transform: "translateY(4px)" }}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-30 w-[380px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="text-base font-bold text-gray-900">공지</h3>
            <Link
              href="/notices"
              className="rounded-md px-2 py-1 text-xs font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
              onClick={() => setOpen(false)}
            >
              전체 보기
            </Link>
          </div>

          <div className="max-h-[420px] overflow-y-auto px-2 py-2">
            {previewItems.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => {
                  setOpen(false);
                  router.push(item.targetPath ?? `/notices/${item.id}`);
                }}
                className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-gray-50"
              >
                <span className={`mt-1 inline-flex h-2.5 w-2.5 flex-none rounded-full ${item.unread ? "bg-gray-300" : "bg-[#C54646]"}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-gray-900">{item.title}</span>
                  <span className="mt-0.5 block text-xs text-gray-500">{item.source} · {item.createdAt}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
