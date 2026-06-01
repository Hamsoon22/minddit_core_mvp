import { mockSessions } from "@/lib/mock";
import Link from "next/link";

export default function ParticipantsPage() {
  const participants = mockSessions.flatMap(s =>
    s.participants.map(p => ({ ...p, sessionTitle: s.title }))
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">참여자</h1>
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {participants.map((p) => (
          <Link key={p.id} href={`/participants/${p.id}`}
            className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-700 font-medium text-sm">{p.name[0]}</div>
              <div>
                <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                <p className="text-xs text-gray-400">{p.sessionTitle}</p>
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${p.attended ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {p.attended ? "참여완료" : "미참여"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
