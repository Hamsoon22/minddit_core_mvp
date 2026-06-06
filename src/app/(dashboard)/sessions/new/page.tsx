"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createProgramSession } from "@/lib/programSessions";

const DRAFT_CREATE_GUARD_KEY = "mindflow.new-session-create-guard";
const DRAFT_CREATED_ID_KEY = "mindflow.new-session-created-id";

export default function NewSessionPage() {
  const router = useRouter();
  const hasCreatedRef = useRef(false);

  useEffect(() => {
    if (hasCreatedRef.current) return;

    if (window.sessionStorage.getItem(DRAFT_CREATE_GUARD_KEY) === "1") {
      const createdId = window.sessionStorage.getItem(DRAFT_CREATED_ID_KEY);
      if (createdId) {
        router.replace(`/sessions/${createdId}/setup`);
      }
      return;
    }

    hasCreatedRef.current = true;
    window.sessionStorage.setItem(DRAFT_CREATE_GUARD_KEY, "1");

    const created = createProgramSession({
      title: "새 프로그램",
      description: "",
    });

    window.sessionStorage.setItem(DRAFT_CREATED_ID_KEY, created.id);

    router.replace(`/sessions/${created.id}/setup`);
  }, [router]);

  return (
    <div className="py-10">
      <p className="text-sm text-gray-500">프로그램 세부 설정 페이지로 이동 중입니다...</p>
    </div>
  );
}
