"use client";

import { useEffect, useState } from "react";
import SessionBuilder from "@/components/session/SessionBuilder";
import { useRouter } from "next/navigation";
import { getProgramSessionById, updateProgramSession, type ProgramSession } from "@/lib/programSessions";

export default function BuilderPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [session, setSession] = useState<ProgramSession | null>(null);

  useEffect(() => {
    setSession(getProgramSessionById(params.id));
  }, [params.id]);

  if (!session) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">프로그램을 찾을 수 없습니다.</p>
        <button
          onClick={() => router.push("/sessions")}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700"
        >
          목록으로 이동
        </button>
      </div>
    );
  }

  return (
    <SessionBuilder
      session={session}
      onSaveActivities={({ activities, scheduleActivities }) => {
        const updated = updateProgramSession(session.id, {
          activities,
          scheduleActivities,
        });
        if (updated) setSession(updated);
      }}
    />
  );
}
