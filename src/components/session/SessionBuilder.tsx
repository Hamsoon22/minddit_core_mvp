"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@/types/session";
import type { SessionActivity, ActivityType } from "@/types/activity";

const ACTIVITY_TYPES: { type: ActivityType; label: string; color: string }[] = [
  { type: "CHECKIN", label: "체크인", color: "bg-blue-50 text-blue-700" },
  { type: "POLL", label: "설문", color: "bg-purple-50 text-purple-700" },
  { type: "JOURNAL", label: "저널", color: "bg-amber-50 text-amber-700" },
  { type: "MEDITATION", label: "명상", color: "bg-green-50 text-green-700" },
  { type: "BREATHING", label: "호흡", color: "bg-teal-50 text-teal-700" },
  { type: "DISCUSSION", label: "토론", color: "bg-rose-50 text-rose-700" },
];

interface Props {
  session: Session & { activities: SessionActivity[] };
}

export default function SessionBuilder({ session }: Props) {
  const router = useRouter();
  const [activities, setActivities] = useState<SessionActivity[]>(session.activities);

  function addActivity(type: ActivityType, label: string) {
    const newActivity: SessionActivity = {
      id: `local-${Date.now()}`,
      sessionId: session.id,
      title: `${label} 활동`,
      type,
      durationMin: 10,
      content: "",
      order: activities.length,
    };
    setActivities(prev => [...prev, newActivity]);
  }

  function removeActivity(id: string) {
    setActivities(prev => prev.filter(a => a.id !== id));
  }

  const totalMin = activities.reduce((sum, a) => sum + a.durationMin, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{session.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">세션 빌더</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">총 {totalMin}분</span>
          <button onClick={() => router.push(`/sessions/${session.id}`)}
            className="px-4 py-2 bg-brand-700 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition">
            저장 완료
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6 min-h-64">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">활동 순서</h2>
            {activities.length === 0 ? (
              <div className="flex items-center justify-center h-40 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-gray-400 text-sm">오른쪽에서 활동 유형을 선택하세요</p>
              </div>
            ) : (
              <ol className="space-y-2">
                {activities.map((a, i) => {
                  const typeInfo = ACTIVITY_TYPES.find(t => t.type === a.type);
                  return (
                    <li key={a.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group">
                      <span className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-medium text-gray-500 shrink-0">{i + 1}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${typeInfo?.color}`}>{typeInfo?.label}</span>
                      <span className="text-sm font-medium text-gray-800 flex-1">{a.title}</span>
                      <span className="text-xs text-gray-400">{a.durationMin}분</span>
                      <button onClick={() => removeActivity(a.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition text-xs">✕</button>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">활동 추가</h2>
            <div className="space-y-2">
              {ACTIVITY_TYPES.map(({ type, label, color }) => (
                <button key={type} onClick={() => addActivity(type, label)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-left">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>{label}</span>
                  <span className="text-xs text-gray-400 ml-auto">+ 추가</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
