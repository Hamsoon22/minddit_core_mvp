"use client";
import { useState } from "react";
import type { Session } from "@/types/session";
import type { SessionActivity } from "@/types/activity";
import type { Participant } from "@/types/participant";
import { buildJoinUrl } from "@/lib/qr";

interface Props {
  session: Session & { activities: SessionActivity[]; participants: Participant[] };
}

export default function LiveController({ session }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const joinUrl = buildJoinUrl(session.joinCode);
  const current = session.activities[currentIdx];

  return (
    <div>
      <div className="dashboard-sticky-header mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[1.7rem] font-semibold text-gray-900">{session.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              진행중
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-1">참여 코드</p>
          <code className="text-lg font-mono font-bold text-brand-700">{session.joinCode}</code>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-gray-500">
                활동 {currentIdx + 1} / {session.activities.length}
              </p>
              {current && <span className="text-xs text-gray-400">{current.durationMin}분</span>}
            </div>
            <div className="h-1 bg-gray-100 rounded-full mb-6">
              <div className="h-1 bg-brand-700 rounded-full transition-all"
                style={{ width: `${((currentIdx + 1) / session.activities.length) * 100}%` }} />
            </div>

            {current ? (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{current.title}</h2>
                {current.content && (
                  <p className="text-gray-600 text-sm leading-relaxed">{current.content}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">활동이 없습니다.</p>
            )}

            <div className="flex gap-2 mt-8">
              <button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                disabled={currentIdx === 0}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm disabled:opacity-30 hover:bg-gray-50 transition">
                이전
              </button>
              <button onClick={() => setCurrentIdx(i => Math.min(session.activities.length - 1, i + 1))}
                disabled={currentIdx === session.activities.length - 1}
                className="px-4 py-2 bg-brand-700 text-white rounded-lg text-sm disabled:opacity-30 hover:bg-brand-600 transition">
                다음 활동
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              참여자 ({session.participants.length})
            </h3>
            <ul className="space-y-1.5">
              {session.participants.map((p) => (
                <li key={p.id} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="w-5 h-5 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-xs shrink-0">
                    {p.name[0]}
                  </span>
                  {p.name}
                </li>
              ))}
              {session.participants.length === 0 && (
                <p className="text-gray-400 text-xs">아직 참여자가 없습니다</p>
              )}
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">참여 링크</h3>
            <p className="text-xs text-gray-500 break-all mb-3">{joinUrl}</p>
            <button onClick={() => navigator.clipboard.writeText(joinUrl)}
              className="w-full py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition">
              링크 복사
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
