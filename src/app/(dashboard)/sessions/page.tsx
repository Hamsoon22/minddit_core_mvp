import { mockSessions } from "@/lib/mock";
import Link from "next/link";

const statusLabel: Record<string, string> = { DRAFT: "초안", SCHEDULED: "예정", ACTIVE: "진행중", COMPLETED: "완료" };
const statusColor: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SCHEDULED: "bg-blue-50 text-blue-700",
  ACTIVE: "bg-green-50 text-green-700",
  COMPLETED: "bg-gray-50 text-gray-500",
};

export default function SessionsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">세션</h1>
        <Link href="/sessions/s1/builder"
          className="px-4 py-2 bg-brand-700 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition">
          + 새 세션
        </Link>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {mockSessions.map((s) => (
          <Link key={s.id} href={`/sessions/${s.id}`}
            className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition">
            <div>
              <p className="font-medium text-gray-900 text-sm">{s.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                참여자 {s._count.participants}명 · {new Date(s.createdAt).toLocaleDateString("ko-KR")} 생성
              </p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor[s.status]}`}>
              {statusLabel[s.status]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
