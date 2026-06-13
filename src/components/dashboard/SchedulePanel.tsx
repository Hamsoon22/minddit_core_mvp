"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ProgramSession } from "@/lib/programSessions";

type ScheduleEntry = {
  id: string;
  key: string;
  title: string;
  date: Date;
  status: string;
  _count: { participants: number };
};

function toDayStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function toValidDate(value?: string | Date | null) {
  if (!value) return null;
  const date = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildScheduleEntries(session: ProgramSession): ScheduleEntry[] {
  const entries = session.scheduleItems.flatMap((item) => {
    if (session.scheduleType === "DATE_SPECIFIC" && item.date) {
      const date = toValidDate(item.date);
      return date ? [{ id: session.id, key: `${session.id}:${item.id}`, title: session.title, date, status: session.status, _count: session._count }] : [];
    }

    if (session.scheduleType === "WEEKLY" && item.weekStart) {
      const date = toValidDate(item.weekStart);
      return date ? [{ id: session.id, key: `${session.id}:${item.id}`, title: session.title, date, status: session.status, _count: session._count }] : [];
    }

    if (session.scheduleType === "MONTHLY" && item.year && item.month) {
      return [{
        id: session.id,
        key: `${session.id}:${item.id}`,
        title: session.title,
        date: new Date(item.year, item.month - 1, 1),
        status: session.status,
        _count: session._count,
      }];
    }

    return [] as ScheduleEntry[];
  });

  if (entries.length > 0) return entries;

  const fallbackDate = toValidDate(session.startDate ?? session.scheduledAt ?? null);
  if (!fallbackDate) return [];

  return [{
    id: session.id,
    key: `${session.id}:default`,
    title: session.title,
    date: fallbackDate,
    status: session.status,
    _count: session._count,
  }];
}

export default function SchedulePanel({
  sessions,
}: {
  sessions: ProgramSession[];
}) {
  const scheduleEntries = useMemo(
    () => sessions.flatMap((session) => buildScheduleEntries(session)),
    [sessions]
  );

  const days = useMemo(() => {
    const today = toDayStart(new Date());
    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() + index);

      const hasSchedule = scheduleEntries.some((entry) => isSameDay(entry.date, date));

      return {
        date,
        day: String(date.getDate()).padStart(2, "0"),
        weekday: date.toLocaleDateString("ko-KR", { weekday: "short" }),
        hasSchedule,
      };
    });
  }, [scheduleEntries]);

  const [selectedOffset, setSelectedOffset] = useState(0);

  const clampedOffset = Math.min(selectedOffset, Math.max(days.length - 1, 0));
  const selectedDate = days[clampedOffset]?.date ?? toDayStart(new Date());

  const schedules = scheduleEntries
    .filter((entry) => isSameDay(entry.date, selectedDate))
    .sort(
      (a, b) =>
        a.date.getTime() - b.date.getTime()
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

      <div className="mb-3 flex items-center justify-center gap-4">
        <button
          className="text-2xl text-gray-300 hover:text-gray-600"
          onClick={() => setSelectedOffset((prev) => Math.max(0, Math.min(prev, days.length - 1) - 1))}
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

      <div className="mb-4 grid grid-cols-7 gap-1.5">
        {days.map((item, index) => {
          const active = index === clampedOffset;

          return (
            <button
              key={item.day + item.weekday}
              onClick={() => setSelectedOffset(index)}
              className={
                active
                  ? "rounded-xl bg-[#485763]/75 px-2 py-2 text-white shadow-md"
                  : "rounded-xl bg-gray-50 px-2 py-2 text-gray-500 hover:bg-gray-100"
              }
            >
              <p className="text-base font-semibold">{item.day}</p>
              <p className="text-[11px]">{item.weekday}</p>
              <span
                className={[
                  "mx-auto mt-1 block h-2 w-2 rounded-full border",
                  item.hasSchedule
                    ? "border-[#ffffff] bg-[#485763]"
                    : "border-transparent bg-transparent",
                ].join(" ")}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {schedules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-sm text-gray-400">일정이 없습니다.</p>
          </div>
        ) : (
          schedules.map((session) => {
            const start = new Date(session.date);
            const end = new Date(start.getTime() + 60 * 60 * 1000);

            return (
              <Link
                key={session.key}
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
    status === "DRAFT"
      ? "임시 저장"
      :
    status === "SCHEDULED"
      ? "예정"
      : status === "COMPLETED"
      ? "완료"
      : "진행중";

  return (
    <span className="inline-flex whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
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
