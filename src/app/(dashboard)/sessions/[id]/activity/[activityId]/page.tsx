"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getProgramSessionById } from "@/lib/programSessions";
import { getActivityTypeMeta, syncSessionActivityFromCatalog } from "@/lib/contentCatalog";
import type { SessionActivity } from "@/types/activity";

function formatDate(date?: Date | null) {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

export default function SessionActivityMobileViewPage({
  params,
}: {
  params: { id: string; activityId: string };
}) {
  const router = useRouter();
  const session = getProgramSessionById(params.id);

  const activity = useMemo(() => {
    if (!session) return null;

    const sectionActivities =
      session.scheduleItems.length > 0
        ? session.scheduleItems.flatMap((section, index) => {
            const stored = session.scheduleActivities?.[section.id] ?? [];
            if (stored.length > 0) return stored;
            return index === 0 ? (session.activities ?? []) : [];
          })
        : session.activities ?? [];

    const found = sectionActivities.find((item) => item.id === params.activityId);
    if (!found) return null;
    return syncSessionActivityFromCatalog(found);
  }, [session, params.activityId]);

  if (!session || !activity) {
    return (
      <div className="min-h-screen bg-[#f3f5f7] px-4 py-10 text-center text-sm text-gray-500">
        활동 정보를 찾을 수 없습니다.
      </div>
    );
  }

  const typeMeta = getActivityTypeMeta(activity.type);
  const organizationName = session.institutionName?.trim() || "마인딧센터";
  const description = session.description?.trim() || "프로그램 설명이 없습니다.";

  function onStartActivity(target: SessionActivity) {
    if (!target.content) return;

    if (target.content.startsWith("/")) {
      router.push(target.content);
      return;
    }

    window.open(target.content, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="min-h-screen bg-[#f3f5f7] pb-16">
      <div className="mx-auto w-full max-w-[430px]">
        <div className="rounded-b-[28px] bg-[#d7e5f1] px-4 pb-6 pt-8">
          <h1 className="text-[1.7rem] font-extrabold leading-tight text-[#101828]">{session.title}</h1>
          <p className="mt-1 whitespace-pre-line text-sm text-[#4b5563]">{description}</p>

          <div className="mt-5 flex items-center gap-3 rounded-full bg-white px-4 py-2.5 text-[#1f2937]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="3" y="4" width="18" height="17" rx="3" stroke="currentColor" strokeWidth="1.8" />
              <path d="M8 2.5V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M16 2.5V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M3 9H21" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            <span className="text-sm font-semibold">{formatDate(session.startDate)} ~ {formatDate(session.endDate)}</span>
          </div>
        </div>

        <div className="space-y-4 px-3 pt-6">
          <section className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2.5 border-b border-gray-100 pb-3">
              <span className={`inline-flex w-[64px] justify-center rounded-full px-2 py-0.5 text-xs font-medium ${typeMeta.color}`}>
                {typeMeta.label}
              </span>
              <h2 className="flex-1 text-base font-bold text-gray-900">{activity.title}</h2>
              <span className="text-xs text-gray-500">{activity.durationMin}분</span>
            </div>

            <button
              type="button"
              onClick={() => onStartActivity(activity)}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[#485763] px-4 text-sm font-semibold text-white transition hover:bg-[#3f4c56]"
            >
              활동 시작하기
            </button>

            <Link
              href={`/sessions/${session.id}`}
              className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              프로그램 세부로 돌아가기
            </Link>
          </section>
        </div>

        <footer className="mt-8 px-4 pb-4 text-center text-[11px] text-gray-400">
          Minddit Core · {organizationName} © 2026 All rights reserved.
        </footer>
      </div>
    </div>
  );
}
