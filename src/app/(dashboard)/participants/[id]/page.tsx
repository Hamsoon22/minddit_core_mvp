import { mockSessions } from "@/lib/mock";
import { notFound } from "next/navigation";

export default function ParticipantDetailPage({ params }: { params: { id: string } }) {
  const all = mockSessions.flatMap(s => s.participants.map(p => ({ ...p, sessionTitle: s.title })));
  const participant = all.find(p => p.id === params.id);
  if (!participant) notFound();

  return (
    <div>
      <div className="dashboard-sticky-header mb-6">
        <h1 className="text-[1.7rem] font-bold text-gray-900">{participant.name}</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-md">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">세션</dt>
            <dd className="text-gray-900 font-medium">{participant.sessionTitle}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">참여 여부</dt>
            <dd className={participant.attended ? "text-green-600" : "text-gray-400"}>
              {participant.attended ? "참여완료" : "미참여"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
