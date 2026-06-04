import { mockSessions } from "@/lib/mock";
import { notFound } from "next/navigation";
import Link from "next/link";

export default function SessionDetailPage({ params }: { params: { id: string } }) {
  const session = mockSessions.find(s => s.id === params.id);
  if (!session) notFound();

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/sessions" className="hover:text-gray-900">세션</Link>
        <span>/</span>
        <span className="text-gray-900">{session.title}</span>
      </div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
          {session.description && <p className="text-gray-500 text-sm mt-1">{session.description}</p>}
        </div>
        <div className="flex gap-2">
          <Link href={`/sessions/${session.id}/builder`}
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition">
            빌더 편집
          </Link>
          <Link href={`/sessions/${session.id}/live`}
            className="px-4 py-2 bg-brand-700 text-white rounded-lg text-sm hover:bg-brand-600 transition">
            세션 시작
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">활동 ({session.activities.length})</h2>
          <ol className="space-y-2">
            {session.activities.map((a, i) => (
              <li key={a.id} className="flex items-center gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-medium flex-shrink-0">{i + 1}</span>
                <span className="text-gray-800">{a.title}</span>
                <span className="text-gray-400 ml-auto">{a.durationMin}분</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">참여자 ({session.participants.length})</h2>
          <ul className="space-y-2">
            {session.participants.map((p) => (
              <li key={p.id} className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">{p.name[0]}</div>
                <span className="text-gray-800">{p.name}</span>
                <span className={`ml-auto text-xs ${p.attended ? "text-green-600" : "text-gray-400"}`}>{p.attended ? "참여" : "미참여"}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
