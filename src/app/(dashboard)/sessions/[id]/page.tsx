"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { getProgramSessionById, updateProgramSession, type ProgramSession } from "@/lib/programSessions";
import type { SessionActivity } from "@/types/activity";
import { getActivityTypeMeta, syncSessionActivityFromCatalog } from "@/lib/contentCatalog";
import {
  buildDefaultParticipantAccounts,
  getExistingParticipantAccounts,
  getParticipantAccounts,
  saveParticipantAccounts,
  type ProgramParticipantAccount,
} from "@/lib/programParticipantAccounts";
import type { Participant } from "@/types/participant";
import { getProgramActivityMetrics } from "@/lib/programActivityMetrics";

const statusLabel: Record<string, string> = {
  DRAFT: "임시 저장",
  SCHEDULED: "예정",
  ACTIVE: "진행중",
  COMPLETED: "완료",
};

const statusColor: Record<string, string> = {
  DRAFT: "border border-gray-300 bg-transparent text-gray-600",
  SCHEDULED: "bg-blue-50 text-blue-700",
  ACTIVE: "bg-green-50 text-green-700",
  COMPLETED: "bg-gray-200 text-gray-700",
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

function getModeLabel(mode?: ProgramSession["mode"] | null) {
  if (mode === "ONLINE") return "비대면";
  if (mode === "HYBRID") return "대면+비대면";
  return "대면";
}

function toStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function escapeCsvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function parseSectionStartDate(
  section: ProgramSession["scheduleItems"][number] | { id: string; label: string },
  scheduleType?: ProgramSession["scheduleType"]
) {
  if (scheduleType === "DATE_SPECIFIC" && "date" in section && section.date) {
    const parsed = new Date(section.date);
    return Number.isNaN(parsed.getTime()) ? null : toStartOfDay(parsed);
  }

  if (scheduleType === "WEEKLY" && "weekStart" in section && section.weekStart) {
    const parsed = new Date(section.weekStart);
    return Number.isNaN(parsed.getTime()) ? null : toStartOfDay(parsed);
  }

  if (scheduleType === "MONTHLY" && "year" in section && "month" in section && section.year && section.month) {
    return new Date(section.year, section.month - 1, 1);
  }

  return null;
}

export default function SessionDetailViewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [session, setSession] = useState<ProgramSession | null>(null);
  const [mounted, setMounted] = useState(false);
  const [messageModal, setMessageModal] = useState<{ title: string; text: string } | null>(null);
  const [messageDraft, setMessageDraft] = useState("");
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [participantModalOpen, setParticipantModalOpen] = useState(false);
  const [participantAccounts, setParticipantAccounts] = useState<ProgramParticipantAccount[]>([]);

  useEffect(() => {
    const found = getProgramSessionById(params.id);
    setSession(found);
    setMounted(true);
  }, [params.id]);

  const sections = useMemo(
    () => (session && session.scheduleItems.length > 0 ? session.scheduleItems : [{ id: "default", label: "기본 세션" }]),
    [session]
  );

  const metricsByActivity = useMemo(() => {
    if (!session) return {};
    return getProgramActivityMetrics(session.id);
  }, [session]);

  const totalActivityTaps = useMemo(() => {
    return Object.values(metricsByActivity).reduce((sum, item) => sum + item.totalTaps, 0);
  }, [metricsByActivity]);

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

  const totalActivities = useMemo(
    () => Object.values(sectionActivities).flat().length,
    [sectionActivities]
  );

  const blinkingSectionIndex = useMemo(() => {
    if (!session || sections.length === 0) return -1;
    if (session.status === "COMPLETED") return -1;

    const today = toStartOfDay(new Date());
    const startDates = sections.map((section) => parseSectionStartDate(section, session.scheduleType));
    const hasAnyDate = startDates.some((date) => !!date);

    if (!hasAnyDate) return 0;

    let lastPassed = -1;
    startDates.forEach((date, index) => {
      if (date && date.getTime() < today.getTime()) {
        lastPassed = index;
      }
    });

    if (lastPassed < 0) {
      const firstUpcoming = startDates.findIndex((date) => !!date && date.getTime() >= today.getTime());
      return firstUpcoming >= 0 ? firstUpcoming : 0;
    }

    const nextIndex = lastPassed + 1;
    if (nextIndex < sections.length) return nextIndex;
    return -1;
  }, [session, sections]);

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

  function getSectionScheduleText(section: ProgramSession["scheduleItems"][number] | { id: string; label: string }) {
    if (!session) return "미정";

    if (session.scheduleType === "DATE_SPECIFIC") {
      const date = "date" in section ? section.date : undefined;
      return formatDateText(date);
    }

    if (session.scheduleType === "WEEKLY") {
      const weekStart = "weekStart" in section ? section.weekStart : undefined;
      const weekEnd = "weekEnd" in section ? section.weekEnd : undefined;
      return `${formatDateText(weekStart)} ~ ${formatDateText(weekEnd)}`;
    }

    if (session.scheduleType === "MONTHLY") {
      const year = "year" in section ? section.year : undefined;
      const month = "month" in section ? section.month : undefined;
      if (year && month) return `${year}.${String(month).padStart(2, "0")}`;
    }

    return "미정";
  }

  function buildProgramGuideMessage() {
    if (!session) return "";

    const link = `${window.location.origin}/s/${session.joinCode}`;
    const email = session.institutionEmail?.trim() || "미입력(설정 필요)";
    const phone = session.institutionPhone?.trim();
    const phoneLine = phone ? `\n* 연락처: ${phone}` : "";
    const period = `${formatDate(session.startDate)} ~ ${formatDate(session.endDate)}`;
    const roundText = session.scheduleItems?.length ? `${session.scheduleItems.length}회차` : "미정";

    return `[${session.title}]
안녕하세요.
본 메시지는 [${session.title}] 안내를 위해 발송되었습니다.

📌 안내
* 일정: ${period}
* 회차: ${roundText}
* 진행 방식: ${getModeLabel(session.mode)}

[${session.title}]의 상세 내용은 아래 링크에서 확인하실 수 있습니다.
${link}

📞 문의
기타 문의사항이 있으신 경우 아래 연락처로 문의해 주시기 바랍니다.
* 이메일: ${email}${phoneLine}

감사합니다.
좋은 하루 보내세요. :)`;
  }

  function buildSectionGuideMessage(section: ProgramSession["scheduleItems"][number] | { id: string; label: string }) {
    if (!session) return "";

    const sectionTitle = `${session.title}-${section.label}`;
    const link = `${window.location.origin}/s/${session.joinCode}`;
    const email = session.institutionEmail?.trim() || "미입력(설정 필요)";
    const phone = session.institutionPhone?.trim();
    const phoneLine = phone ? `\n* 연락처: ${phone}` : "";

    return `[${sectionTitle}]
안녕하세요.
본 메시지는 [${sectionTitle}] 안내를 위해 발송되었습니다.

📌 안내
* 일정: ${getSectionScheduleText(section)}
* 회차: ${section.label}
* 진행 방식: ${getModeLabel(session.mode)}

[${sectionTitle}]의 상세 내용은 아래 링크에서 확인하실 수 있습니다.
${link}

📞 문의
기타 문의사항이 있으신 경우 아래 연락처로 문의해 주시기 바랍니다.
* 이메일: ${email}${phoneLine}

감사합니다.
좋은 하루 보내세요. :)`;
  }

  async function onCopyText(text: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(text);
      window.dispatchEvent(
        new CustomEvent("minddit:toast", {
          detail: { message: successMessage, tone: "success" },
        })
      );
    } catch {
      window.dispatchEvent(
        new CustomEvent("minddit:toast", {
          detail: { message: "복사에 실패했습니다.", tone: "error" },
        })
      );
    }
  }

  async function onCopyProgramLink() {
    if (!session) return;
    const link = `${window.location.origin}/s/${session.joinCode}`;
    try {
      await navigator.clipboard.writeText(link);
      window.open(link, "_blank", "noopener,noreferrer");
      window.dispatchEvent(
        new CustomEvent("minddit:toast", {
          detail: { message: "프로그램 링크가 복사되었습니다.", tone: "success" },
        })
      );
    } catch {
      window.dispatchEvent(
        new CustomEvent("minddit:toast", {
          detail: { message: "복사에 실패했습니다.", tone: "error" },
        })
      );
    }
  }

  function onOpenActivity(activity: SessionActivity) {
    if (!session) return;
    const mobileLink = `${window.location.origin}/s/${session.joinCode}/activity/${activity.id}`;
    window.open(mobileLink, "_blank", "noopener,noreferrer");
  }

  function onDownloadProgramStatsCsv() {
    if (!session) return;

    const fallbackCount = Math.max(session._count.participants || 0, 1);
    const accounts = getExistingParticipantAccounts(session.id);
    const accountRows = accounts.length > 0 ? accounts : getParticipantAccounts(session.id, fallbackCount);

    const headerRows: string[][] = [
      ["프로그램명", session.title],
      ["상태", statusLabel[session.status]],
      ["진행 방식", getModeLabel(session.mode)],
      ["기간", `${formatDate(session.startDate)} ~ ${formatDate(session.endDate)}`],
      ["참여자 수", String(session._count.participants)],
      ["활동 수", String(totalActivities)],
      ["활동 총 탭수", String(totalActivityTaps)],
      [],
      ["참여자", "아이디", "총 탭수"],
    ];

    const participantRows = accountRows.map((account) => {
      const totalTaps = Object.values(metricsByActivity).reduce(
        (sum, metric) => sum + (metric.participantTaps[account.username] ?? 0),
        0
      );
      return [account.name, account.username, String(totalTaps)];
    });

    const roundRows: string[][] = [[], ["회차", "활동명", "유형", "총 탭수"]];
    const activityColumns: { id: string; label: string }[] = [];

    sections.forEach((section) => {
      const activities = sectionActivities[section.id] ?? [];
      activities.forEach((activity) => {
        activityColumns.push({ id: activity.id, label: `${section.label}:${activity.title}` });
        const metric = metricsByActivity[activity.id];
        roundRows.push([
          section.label,
          activity.title,
          getActivityTypeMeta(activity.type).label,
          String(metric?.totalTaps ?? 0),
        ]);
      });
    });

    const matrixHeader = ["참여자", "아이디", ...activityColumns.map((col) => col.label)];
    const matrixRows = accountRows.map((account) => [
      account.name,
      account.username,
      ...activityColumns.map((col) => String(metricsByActivity[col.id]?.participantTaps[account.username] ?? 0)),
    ]);

    const csvRows = [...headerRows, ...participantRows, ...roundRows, [], matrixHeader, ...matrixRows]
      .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `program-${session.id}-stats-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  function openProgramMessageModal() {
    if (!session) return;
    const text = buildProgramGuideMessage();
    setMessageModal({
      title: "프로그램 안내 메세지",
      text,
    });
    setMessageDraft(text);
    setIsEditingMessage(false);
  }

  function openSectionMessageModal(section: ProgramSession["scheduleItems"][number] | { id: string; label: string }) {
    const text = buildSectionGuideMessage(section);
    setMessageModal({
      title: `${section.label} 안내 메세지`,
      text,
    });
    setMessageDraft(text);
    setIsEditingMessage(false);
  }

  function onSaveMessageDraft() {
    if (!messageModal) return;
    setMessageModal({
      ...messageModal,
      text: messageDraft,
    });
    setIsEditingMessage(false);
    window.dispatchEvent(
      new CustomEvent("minddit:toast", {
        detail: { message: "메세지 내용이 저장되었습니다.", tone: "success" },
      })
    );
  }

  function openParticipantModal() {
    if (!session) return;
    const defaultCount = Math.max(session._count.participants || 0, 1);
    const loaded = getParticipantAccounts(session.id, defaultCount);
    setParticipantAccounts(loaded);
    setParticipantModalOpen(true);
  }

  function onAdjustParticipantCount(diff: 1 | -1) {
    setParticipantAccounts((prev) => {
      const nextLength = Math.max(1, prev.length + diff);
      if (nextLength === prev.length) return prev;
      if (nextLength < prev.length) return prev.slice(0, nextLength);

      const extension = buildDefaultParticipantAccounts(nextLength).slice(prev.length);
      return [...prev, ...extension];
    });
  }

  function onChangeParticipantPassword(index: number, password: string) {
    setParticipantAccounts((prev) => prev.map((account, i) => (i === index ? { ...account, password } : account)));
  }

  function onSaveParticipantAccounts() {
    if (!session) return;
    saveParticipantAccounts(session.id, participantAccounts);

    const now = new Date();
    const nextParticipants: Participant[] = participantAccounts.map((account, index) => ({
      id: `local-participant-${session.id}-${index + 1}`,
      name: account.name,
      email: null,
      sessionId: session.id,
      attended: false,
      joinedAt: null,
      createdAt: now,
    }));

    const patched = updateProgramSession(session.id, {
      participants: nextParticipants,
      _count: { participants: participantAccounts.length },
    });
    if (patched) {
      setSession(patched);
    }

    setParticipantModalOpen(false);
    window.dispatchEvent(
      new CustomEvent("minddit:toast", {
        detail: { message: "참여자 계정이 저장되었습니다.", tone: "success" },
      })
    );
  }

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
            <button
              type="button"
              onClick={openProgramMessageModal}
              aria-label="프로그램 안내 문자 복사"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-100"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M4 7L12 13L20 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onCopyProgramLink}
              aria-label="프로그램 링크 복사"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-100"
            >
              <span className="text-[16px] leading-none" aria-hidden="true">🔗</span>
            </button>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor[session.status]}`}>
              {statusLabel[session.status]}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openParticipantModal}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            참여자 편집
          </button>
          <Link
            href={`/sessions/${session.id}/setup`}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#485763] px-4 text-sm font-medium text-white transition hover:bg-[#3f4c56]"
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
          <div className="flex items-center justify-between gap-3">
            <p><span className="font-bold">프로그램 기간</span> {formatDate(session.startDate)} ~ {formatDate(session.endDate)}</p>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-white/30 bg-white/10 px-2.5 py-1 text-xs font-medium text-white">
                참여자 {session._count.participants}명
              </span>
              <span className="rounded-full border border-white/30 bg-white/10 px-2.5 py-1 text-xs font-medium text-white">
                {getModeLabel(session.mode)}
              </span>
              <span className="rounded-full border border-white/30 bg-white/10 px-2.5 py-1 text-xs font-medium text-white">
                {(session.expertName ?? "서윤희")} 전문가
              </span>
            </div>
          </div>
        </div>
      </div>

      {session.status === "COMPLETED" && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span>참여자 <span className="font-bold">{session._count.participants}명</span></span>
              <span>활동 <span className="font-bold">{totalActivities}개</span></span>
              <span>탭수 <span className="font-bold">{totalActivityTaps}회</span></span>
            </div>
            <button
              type="button"
              onClick={onDownloadProgramStatsCsv}
              className="inline-flex h-8 items-center justify-center rounded-md bg-[#417572] px-3 text-xs font-medium text-white transition hover:bg-[#356663]"
            >
              엑셀(.csv) 다운
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        <div className="absolute bottom-0 left-3 top-0 w-px bg-gray-200" aria-hidden />

        <div className="space-y-6">
          {sections.map((section, sectionIndex) => {
            const activities = sectionActivities[section.id] ?? [];
            const totalMin = activities.reduce((sum, activity) => sum + activity.durationMin, 0);
            const isBlinking = sectionIndex === blinkingSectionIndex;
            return (
              <div key={section.id} className="relative pl-8">
                <span className="absolute left-3 top-6 h-4 w-4 -translate-x-1/2 -translate-y-1/2" aria-hidden>
                  {isBlinking && <span className="absolute inset-0 animate-ping rounded-full bg-[#485763]/40" />}
                  <span className="absolute inset-0 rounded-full border-2 border-white bg-[#485763] shadow-sm" />
                </span>

                <div className="w-full rounded-xl border border-gray-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-gray-900">{getSectionTabLabel(section)}</h2>
                      <button
                        type="button"
                        onClick={() => openSectionMessageModal(section)}
                        aria-label={`${section.label} 안내 문자 복사`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-50"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
                          <path d="M4 7L12 13L20 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                    <span className="text-sm font-medium text-gray-600">총 소요시간 <span className="font-bold">{totalMin}분</span></span>
                  </div>

                  {activities.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed border-gray-200 py-10 text-center">
                      <p className="text-sm text-gray-400">등록된 활동이 없습니다. 활동 편집에서 추가해 주세요.</p>
                    </div>
                  ) : (
                    <ol className="space-y-2">
                      {activities.map((activity, index) => (
                        <li key={activity.id} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                          <div className="flex items-center gap-3">
                            {(() => {
                              const syncedActivity = syncSessionActivityFromCatalog(activity);
                              const typeMeta = getActivityTypeMeta(syncedActivity.type);
                              return (
                                <>
                                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-500">{index + 1}</span>
                                  <span className={`inline-flex w-[56px] justify-center rounded-full px-2 py-0.5 text-xs font-medium ${typeMeta.color}`}>
                                    {typeMeta.label}
                                  </span>
                                  <p className="flex-1 text-sm font-semibold text-gray-900">{syncedActivity.title}</p>
                                  <button
                                    type="button"
                                    onClick={() => onOpenActivity(syncedActivity)}
                                    className="inline-flex h-7 shrink-0 items-center justify-center rounded-md border border-gray-300 bg-white px-2.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                                  >
                                    열기
                                  </button>
                                  {session.status === "COMPLETED" && (
                                    <span className="text-xs text-gray-500">
                                      탭 {metricsByActivity[syncedActivity.id]?.totalTaps ?? 0}회
                                    </span>
                                  )}
                                  <p className="text-xs text-gray-500">{syncedActivity.durationMin}분</p>
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
          })}
        </div>
      </div>

      {mounted &&
        typeof document !== "undefined" &&
        messageModal &&
        createPortal(
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/55 px-4">
            <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow-2xl">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">{messageModal.title}</h2>
                <div className="flex items-center gap-2">
                  {isEditingMessage ? (
                    <button
                      type="button"
                      onClick={onSaveMessageDraft}
                      className="inline-flex h-9 items-center justify-center rounded-lg bg-[#485763] px-3 text-sm font-medium text-white hover:bg-[#3f4c56]"
                    >
                      저장
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingMessage(true)}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      편집
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onCopyText(isEditingMessage ? messageDraft : messageModal.text, "문자 내용이 복사되었습니다.")}
                    className="inline-flex h-9 items-center justify-center rounded-lg bg-[#485763] px-3 text-sm font-medium text-white hover:bg-[#3f4c56]"
                  >
                    문자 복사하기
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessageModal(null)}
                    className="-translate-y-0.5 text-[26px] font-medium leading-none text-gray-700 hover:text-gray-900"
                    aria-label="닫기"
                  >
                    ×
                  </button>
                </div>
              </div>

              {isEditingMessage ? (
                <textarea
                  value={messageDraft}
                  onChange={(e) => setMessageDraft(e.target.value)}
                  className="h-[360px] w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 outline-none focus:border-gray-400"
                />
              ) : (
                <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
{messageModal.text}
                </pre>
              )}
            </div>
          </div>,
          document.body
        )}

      {mounted &&
        typeof document !== "undefined" &&
        participantModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[310] flex items-center justify-center bg-black/55 px-4">
            <div className="flex h-[70vh] w-full max-w-2xl flex-col rounded-xl bg-white p-5 shadow-2xl">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">참여자 계정 편집</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onAdjustParticipantCount(-1)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-lg text-gray-700 hover:bg-gray-50"
                    aria-label="참여자 수 줄이기"
                  >
                    -
                  </button>
                  <span className="min-w-10 text-center text-sm font-semibold text-gray-700">{participantAccounts.length}명</span>
                  <button
                    type="button"
                    onClick={() => onAdjustParticipantCount(1)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-lg text-gray-700 hover:bg-gray-50"
                    aria-label="참여자 수 늘리기"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => setParticipantModalOpen(false)}
                    className="-translate-y-0.5 text-[26px] font-medium leading-none text-gray-700 hover:text-gray-900"
                    aria-label="닫기"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-2 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
                {participantAccounts.map((account, index) => (
                  <div key={account.username} className="grid grid-cols-[90px_1fr_1fr] items-center gap-2 rounded-md border border-gray-200 bg-white p-2">
                    <p className="text-sm font-medium text-gray-700">{account.name}</p>
                    <input
                      value={account.username}
                      readOnly
                      className="h-9 rounded-md border border-gray-200 bg-gray-100 px-3 text-sm text-gray-700"
                    />
                    <input
                      value={account.password}
                      onChange={(e) => onChangeParticipantPassword(index, e.target.value)}
                      placeholder="비밀번호"
                      className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none focus:border-gray-400"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={onSaveParticipantAccounts}
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-[#485763] px-4 text-sm font-medium text-white hover:bg-[#3f4c56]"
                >
                  저장
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
