"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SchedulePanel from "@/components/dashboard/SchedulePanel";
import { getProgramSessions, type ProgramSession } from "@/lib/programSessions";

const statusLabel: Record<string, string> = {
  DRAFT: "임시 저장",
  SCHEDULED: "예정",
  ACTIVE: "진행중",
  COMPLETED: "완료",
};

const statusColor: Record<string, string> = {
  DRAFT: "border border-gray-300 bg-transparent text-gray-600",
  SCHEDULED: "bg-blue-50 text-blue-700",
  ACTIVE: "bg-green-50 text-green-700",
  COMPLETED: "bg-gray-50 text-gray-500",
};

function formatDate(date?: Date | string | null) {
  if (!date) return "-";

  if (typeof date === "string") {
    const direct = date.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (direct) {
      return `${direct[1]}.${direct[2].padStart(2, "0")}.${direct[3].padStart(2, "0")}`;
    }
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

export default function ProgramOverviewSection() {
  const [sessions, setSessions] = useState<ProgramSession[]>([]);

  useEffect(() => {
    setSessions(getProgramSessions());
  }, []);

  const totalSessions = sessions.length;
  const totalParticipants = useMemo(
    () => sessions.reduce((sum, session) => sum + session._count.participants, 0),
    [sessions]
  );
  const scheduledSessions = useMemo(
    () => sessions.filter((session) => session.status === "SCHEDULED"),
    [sessions]
  );

  return (
    <>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard title="전체 프로그램" value={totalSessions} href="/sessions" variant="filled" />
        <SummaryCard title="전체 참여자" value={totalParticipants} href="/participants" variant="filled" />
        <SummaryCard title="프로그램 진행(예정)" value={scheduledSessions.length} href="/sessions" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
        <div className="h-full rounded-xl border border-gray-200 bg-white p-6">
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
                  <th className="w-24 px-4 py-3 text-center font-medium">상태</th>
                  <th className="w-24 px-4 py-3 text-center font-medium">참여자</th>
                  <th className="px-4 py-3 font-medium">일자</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {sessions.slice(0, 6).map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 align-middle">
                      <Link href={`/sessions/${session.id}`} className="font-medium text-gray-800 hover:text-gray-600">
                        {session.title}
                      </Link>
                    </td>
                    <td className="w-24 px-4 py-4 align-middle text-center">
                      <StatusBadge status={session.status} />
                    </td>
                    <td className="w-24 px-4 py-4 align-middle text-center text-gray-500">
                      {session._count.participants}명
                    </td>
                    <td className="px-4 py-4 align-middle text-gray-500">{formatDate(session.scheduledAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <SchedulePanel sessions={sessions} />
      </section>
    </>
  );
}

function SummaryCard({
  title,
  value,
  href,
  variant = "default",
}: {
  title: string;
  value: number;
  href: string;
  variant?: "default" | "filled";
}) {
  const filled = variant === "filled";

  return (
    <Link
      href={href}
      className={filled
        ? "rounded-xl border border-[#292929] bg-gradient-to-b from-[#485763] to-[#292929] p-5 transition-opacity hover:opacity-85"
        : "rounded-xl border border-gray-200 bg-white p-5 transition hover:border-gray-300 hover:shadow-sm"
      }
    >
      <div className="flex items-center justify-between gap-3">
        <p className={filled ? "text-sm text-white" : "text-sm text-gray-500"}>{title}</p>
        <span className={filled ? "text-white" : "text-gray-400"} aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
      <p className={filled ? "mt-3 text-3xl font-extrabold text-white" : "mt-3 text-3xl font-extrabold text-gray-900"}>{value}</p>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label = statusLabel[status] ?? "진행중";
  const colorClass = statusColor[status] ?? "bg-gray-100 text-gray-600";

  return (
    <span className={`inline-flex min-w-[56px] justify-center rounded-full px-2.5 py-1 text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}
