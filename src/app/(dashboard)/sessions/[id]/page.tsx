"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getProgramSessionById, type ProgramSession } from "@/lib/programSessions";
import type { SessionActivity } from "@/types/activity";
import { getActivityTypeMeta } from "@/lib/contentCatalog";

const statusLabel: Record<string, string> = {
  DRAFT: "초안",
  SCHEDULED: "예정",
  ACTIVE: "진행중",
  COMPLETED: "완료",
};

const statusColor: Record<string, string> = {
  DRAFT: "border border-gray-300 bg-transparent text-gray-600",
  SCHEDULED: "bg-blue-50 text-blue-700",
  ACTIVE: "bg-green-50 text-green-700",
  COMPLETED: "bg-gray-50 text-gray-500",
};

function formatDate(date?: Date | null) {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

function formatDateText(dateText?: string) {
  if (!dateText) return "-";
  const direct = dateText.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (direct) {
    return `${direct[1]}.${direct[2].padStart(2, "0")}.${direct[3].padStart(2, "0")}`;
  }

  const parsed = new Date(dateText);
  if (Number.isNaN(parsed.getTime())) return "-";
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

export default function SessionDetailViewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [session, setSession] = useState<ProgramSession | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");

  useEffect(() => {
    const found = getProgramSessionById(params.id);
    setSession(found);

    if (!found) return;
    const sections = found.scheduleItems.length > 0 ? found.scheduleItems : [{ id: "default", label: "기본 세션" }];
    setSelectedSectionId(sections[0].id);
  }, [params.id]);

  const sections = useMemo(
    () => (session && session.scheduleItems.length > 0 ? session.scheduleItems : [{ id: "default", label: "기본 세션" }]),
    [session]
  );

  const sectionActivities = useMemo(() => {
    if (!session) return {} as Record<string, SessionActivity[]>;

    const map: Record<string, SessionActivity[]> = {};
    sections.forEach((section, index) => {
      const stored = session.scheduleActivities?.[section.id] ?? [];
      if (stored.length > 0) {
        map[section.id] = stored;
        return;
      }
      if (index === 0) {
        map[section.id] = session.activities ?? [];
        return;
      }
      map[section.id] = [];
    });

    return map;
  }, [session, sections]);

  const currentActivities = selectedSectionId ? sectionActivities[selectedSectionId] ?? [] : [];
  const totalMin = currentActivities.reduce((sum, activity) => sum + activity.durationMin, 0);

  function getSectionTabLabel(section: ProgramSession["scheduleItems"][number] | { id: string; label: string }) {
    if (!session) return section.label;

    if (session.scheduleType === "DATE_SPECIFIC") {
      const date = "date" in section ? section.date : undefined;
      return `${section.label}(${formatDateText(date)})`;
    }

    if (session.scheduleType === "WEEKLY") {
      const weekStart = "weekStart" in section ? section.weekStart : undefined;
      const weekEnd = "weekEnd" in section ? section.weekEnd : undefined;
      return `${section.label}(${formatDateText(weekStart)} ~ ${formatDateText(weekEnd)})`;
    }

    return section.label;
  }

  const selectedSection = sections.find((section) => section.id === selectedSectionId) ?? sections[0];
  const selectedSectionLabel = selectedSection ? getSectionTabLabel(selectedSection) : "1회차";

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
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/sessions")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-xl font-semibold leading-none text-gray-900 hover:bg-gray-50"
            >
              ←
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor[session.status]}`}>
              {statusLabel[session.status]}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/sessions/${session.id}/setup`}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            프로그램 편집
          </Link>
          <Link
            href={`/sessions/${session.id}/builder`}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#485763] px-4 text-sm font-medium text-white transition hover:bg-[#3f4c56]"
          >
            활동 편집
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-[#292929] bg-[#292929] px-4 py-3 text-sm text-white">
          <span className="font-semibold">프로그램 기간:</span> {formatDate(session.startDate)} ~ {formatDate(session.endDate)}
        </div>

        {sections.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setSelectedSectionId(section.id)}
                className={
                  selectedSectionId === section.id
                    ? "rounded-lg border border-[#485763] bg-[#485763] px-3 py-1.5 text-xs font-medium text-white"
                    : "rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                }
              >
                {getSectionTabLabel(section)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">{selectedSectionLabel}</h2>
          <span className="text-sm font-medium text-gray-600">총 소요시간 {totalMin}분</span>
        </div>

        {currentActivities.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-200 py-12 text-center">
            <p className="text-sm text-gray-400">등록된 활동이 없습니다. 활동 편집에서 추가해 주세요.</p>
          </div>
        ) : (
          <ol className="space-y-2">
            {currentActivities.map((activity, index) => (
              <li key={activity.id} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  {(() => {
                    const typeMeta = getActivityTypeMeta(activity.type);
                    return (
                      <>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-500">{index + 1}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeMeta.color}`}>
                    {typeMeta.label}
                  </span>
                  <p className="flex-1 text-sm font-semibold text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500">{activity.durationMin}분</p>
                      </>
                    );
                  })()}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
