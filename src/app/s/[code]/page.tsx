import { mockSessions } from "@/lib/mock";
import { notFound } from "next/navigation";
import Link from "next/link";

export default function ParticipantLandingPage({ params }: { params: { code: string } }) {
  const session = mockSessions.find(s => s.joinCode === params.code) ?? mockSessions[0];
  if (!session) notFound();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-brand-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">{session.title}</h1>
          <p className="text-sm text-gray-500 mb-6">세션에 참여합니다</p>
          <div className="space-y-2 text-left mb-6">
            {session.activities.map((a, i) => (
              <div key={a.id} className="flex items-center gap-2 text-sm text-gray-600 py-1">
                <span className="text-xs w-5 h-5 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center font-medium flex-shrink-0">{i + 1}</span>
                {a.title}
                <span className="ml-auto text-gray-400 text-xs">{a.durationMin}분</span>
              </div>
            ))}
          </div>
          <Link href={`/s/${params.code}/activity/${session.activities[0]?.id ?? "intro"}`}
            className="block w-full py-3 bg-brand-700 text-white rounded-xl text-sm font-medium text-center hover:bg-brand-600 transition">
            참여 시작하기 →
          </Link>
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">앱 설치 없이 바로 참여할 수 있습니다</p>
      </div>
    </div>
  );
}
