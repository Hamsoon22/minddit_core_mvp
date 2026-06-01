import { mockSessions } from "@/lib/mock";
import { notFound } from "next/navigation";

export default function ActivityPage({ params }: { params: { code: string; actId: string } }) {
  const session = mockSessions.find(s => s.joinCode === params.code) ?? mockSessions[0];
  const activity = session?.activities.find(a => a.id === params.actId) ?? session?.activities[0];
  if (!activity) notFound();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 p-8">
        <p className="text-xs font-medium text-brand-700 mb-1">{session?.title}</p>
        <h1 className="text-xl font-semibold text-gray-900 mb-6">{activity.title}</h1>
        {activity.content && (
          <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line mb-6">{activity.content}</div>
        )}
        <div className="h-1 rounded-full bg-brand-50">
          <div className="h-1 rounded-full bg-brand-700 w-1/3 transition-all" />
        </div>
        <p className="text-xs text-gray-400 text-right mt-1">{activity.durationMin}분</p>
      </div>
    </div>
  );
}
