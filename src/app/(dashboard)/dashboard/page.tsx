"use client";

import Link from "next/link";
import { mockSessions } from "@/lib/mock";

export default function DashboardPage() {
  const totalSessions = mockSessions.length;
  const scheduledSessions = mockSessions.filter((s) => s.status === "SCHEDULED");
  const totalParticipants = mockSessions.reduce(
    (sum, s) => sum + s._count.participants,
    0
  );

  return (
    <div className="space-y-8">
      <section className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">대시보드</h1>
          <p className="mt-2 text-sm text-gray-500">
            프로그램 운영 현황과 일정을 한눈에 확인하세요.
          </p>
        </div>

        <Link
          href="/sessions/new"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          새 프로그램 만들기
        </Link>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard title="전체 프로그램" value={totalSessions} href="/sessions" />
        <SummaryCard title="진행 예정" value={scheduledSessions.length} href="/sessions" />
        <SummaryCard title="전체 참여자" value={totalParticipants} href="/participants" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">최근 프로그램</h2>
            <Link href="/sessions" className="text-sm text-gray-400 hover:text-gray-700">
              전체 보기
            </Link>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">프로그램명</th>
                  <th className="px-4 py-3 font-medium">상태</th>
                  <th className="px-4 py-3 font-medium">참여자</th>
                  <th className="px-4 py-3 font-medium">일정</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {mockSessions.slice(0, 6).map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <Link
                        href={`/sessions/${s.id}`}
                        className="font-medium text-gray-800 hover:text-gray-600"
                      >
                        {s.title}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-4 text-gray-500">
                      {s._count.participants}명
                    </td>
                    <td className="px-4 py-4 text-gray-500">
                      {s.scheduledAt
                        ? new Date(s.scheduledAt).toLocaleDateString("ko-KR")
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <SchedulePanel sessions={mockSessions} />
      </section>
    </div>
  );
}

function SchedulePanel({
  sessions,
}: {
  sessions: {
    id: string;
    title: string;
    scheduledAt?: string | Date | null;
    status: string;
    _count: { participants: number };
  }[];
}) {
  const today = new Date();

  const days = Array.from({ length: 5 }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);

    return {
      date,
      day: date.toLocaleDateString("ko-KR", { day: "2-digit" }),
      weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
      active: index === 0,
    };
  });

  const selectedDate = days[0].date;

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
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Schedule</h2>

        <Link
          href="/sessions"
          className="rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-500 hover:bg-gray-50"
        >
          전체 일정
        </Link>
      </div>

      <div className="mb-6 flex items-center justify-center gap-4">
        <button className="text-2xl text-gray-300 hover:text-gray-600">‹</button>
        <p className="text-sm font-semibold text-gray-700">
          {selectedDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </p>
        <button className="text-2xl text-gray-300 hover:text-gray-600">›</button>
      </div>

      <div className="mb-6 grid grid-cols-5 gap-3">
        {days.map((item) => (
          <button
            key={item.day}
            className={
              item.active
                ? "rounded-2xl bg-gray-800 px-3 py-4 text-white shadow-md"
                : "rounded-2xl bg-gray-50 px-3 py-4 text-gray-500 hover:bg-gray-100"
            }
          >
            <p className="text-lg font-semibold">{item.day}</p>
            <p className="text-xs">{item.weekday}</p>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {schedules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-sm text-gray-400">오늘 예정된 일정이 없습니다.</p>
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

function SummaryCard({
  title,
  value,
  href,
}: {
  title: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-gray-300 hover:shadow-sm"
    >
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-gray-900">{value}</p>
      <p className="mt-3 text-xs text-gray-400">자세히 보기 →</p>
    </Link>
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