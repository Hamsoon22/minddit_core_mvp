"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type ScheduleSession = {
  id: string;
  title: string;
  scheduledAt?: string | Date | null;
  status: string;
  _count: { participants: number };
};

export default function SchedulePanel({
  sessions,
}: {
  sessions: ScheduleSession[];
}) {
  const [selectedOffset, setSelectedOffset] = useState(0);

  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() + index);

      return {
        date,
        day: String(date.getDate()).padStart(2, "0"),
        weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
      };
    });
  }, []);

  const selectedDate = days[selectedOffset]?.date ?? days[0].date;

  const schedules = sessions
    .filter((session) => {
      if (!session.scheduledAt) return false;

      const date = new Date(session.scheduledAt);
      return (
        date.getFullYear() === selectedDate.getFullYear() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getDate() === selectedDate.getDate()
      );
    })
    .sort(
      (a, b) =>
        new Date(a.scheduledAt!).getTime() -
        new Date(b.scheduledAt!).getTime()
    );

  return (
    <section className="h-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">최근 일정</h2>

        <Link
          href="/sessions"
          className="-mt-1 rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-500 hover:bg-gray-50"
        >
          전체 일정
        </Link>
      </div>

      <div className="mb-6 flex items-center justify-center gap-4">
        <button
          className="text-2xl text-gray-300 hover:text-gray-600"
          onClick={() => setSelectedOffset((prev) => Math.max(0, prev - 1))}
          aria-label="이전 날짜"
        >
          ‹
        </button>
        <p className="text-sm font-semibold text-gray-700">
          {`${selectedDate.getFullYear()}.${String(selectedDate.getMonth() + 1).padStart(2, "0")}`}
        </p>
        <button
          className="text-2xl text-gray-300 hover:text-gray-600"
          onClick={() => setSelectedOffset((prev) => Math.min(days.length - 1, prev + 1))}
          aria-label="다음 날짜"
        >
          ›
        </button>
      </div>

      <div className="mb-6 grid grid-cols-7 gap-2">
        {days.map((item, index) => {
          const active = index === selectedOffset;

          return (
            <button
              key={item.day + item.weekday}
              onClick={() => setSelectedOffset(index)}
              className={
                active
                  ? "rounded-xl bg-[#485763]/75 px-2 py-3 text-white shadow-md"
                  : "rounded-xl bg-gray-50 px-2 py-3 text-gray-500 hover:bg-gray-100"
              }
            >
              <p className="text-base font-semibold">{item.day}</p>
              <p className="text-[11px]">{item.weekday}</p>
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {schedules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-sm text-gray-400">선택한 날짜에 예정된 일정이 없습니다.</p>
          </div>
        ) : (
          schedules.map((session) => {
            const start = new Date(session.scheduledAt!);
            const end = new Date(start.getTime() + 60 * 60 * 1000);

            return (
              <Link
                key={session.id}
                href={`/sessions/${session.id}`}
                className="block rounded-2xl border border-gray-100 bg-gray-50 p-4 transition hover:bg-gray-100"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-gray-800">
                    {session.title}
                  </h3>
                  <StatusBadge status={session.status} />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <p>
                    {formatTime(start)} - {formatTime(end)}
                  </p>

                  <p>{session._count.participants}명</p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label =
    status === "SCHEDULED"
      ? "예정"
      : status === "COMPLETED"
      ? "완료"
      : "진행중";

  return (
    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
      {label}
    </span>
  );
}

function formatTime(date: Date) {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const period = hours < 12 ? "AM" : "PM";
  const displayHours = String(hours % 12 || 12).padStart(2, "0");

  return `${period} ${displayHours}:${minutes}`;
}
