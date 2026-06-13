"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import {
  deleteProgramSession,
  getProgramDateSummary,
  getProgramSessions,
  type ProgramSession,
} from "@/lib/programSessions";
import type { ProgramMode } from "@/types/session";
import { getActivityTypeMeta } from "@/lib/contentCatalog";
import { getProgramActivityMetrics } from "@/lib/programActivityMetrics";
import { getExistingParticipantAccounts, getParticipantAccounts } from "@/lib/programParticipantAccounts";

const statusLabel: Record<string, string> = { DRAFT: "임시 저장", SCHEDULED: "예정", ACTIVE: "진행중", COMPLETED: "완료" };
const statusColor: Record<string, string> = {
  DRAFT: "border border-gray-300 bg-transparent text-gray-600",
  SCHEDULED: "bg-[#DDEFF9] text-[#0688D3]",
  ACTIVE: "bg-[#E6ECE0] text-[#68814E]",
  COMPLETED: "bg-gray-200 text-gray-700",
};

const GUIDE_MESSAGE_STORAGE_KEY = "minddit.program-guide-messages.v1";

function escapeCsvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function downloadSessionsCsv(sessions: ProgramSession[]) {
  const header = ["번호", "프로그램 명", "참여자 수", "프로그램 기간"];
  const rows = sessions.map((session, index) => [
    String(index + 1),
    session.title,
    String(session._count.participants),
    getProgramDateSummary(session),
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `programs-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
}

function downloadProgramDetailCsv(session: ProgramSession) {
  const metricsByActivity = getProgramActivityMetrics(session.id);

  const sections =
    session.scheduleItems.length > 0
      ? session.scheduleItems
      : [{ id: "default", label: "기본 세션" }];

  const sectionActivities: Record<string, ProgramSession["activities"]> = {};
  sections.forEach((section, index) => {
    const stored = session.scheduleActivities?.[section.id] ?? [];
    if (stored.length > 0) {
      sectionActivities[section.id] = stored;
      return;
    }
    sectionActivities[section.id] = index === 0 ? session.activities ?? [] : [];
  });

  const totalActivities = Object.values(sectionActivities).flat().length;
  const totalTaps = Object.values(metricsByActivity).reduce((sum, item) => sum + item.totalTaps, 0);

  const fallbackCount = Math.max(session._count.participants || 0, 1);
  const existing = getExistingParticipantAccounts(session.id);
  const accounts = existing.length > 0 ? existing : getParticipantAccounts(session.id, fallbackCount);

  const rows: string[][] = [
    ["프로그램명", session.title],
    ["상태", statusLabel[session.status]],
    ["프로그램 기간", getProgramDateSummary(session)],
    ["참여자 수", String(session._count.participants)],
    ["활동 수", String(totalActivities)],
    ["활동 총 탭수", String(totalTaps)],
    [],
    ["참여자", "아이디", "총 탭수"],
    ...accounts.map((account) => {
      const total = Object.values(metricsByActivity).reduce(
        (sum, metric) => sum + (metric.participantTaps[account.username] ?? 0),
        0
      );
      return [account.name, account.username, String(total)];
    }),
    [],
    ["회차", "활동명", "유형", "총 탭수"],
  ];

  const activityColumns: { id: string; label: string }[] = [];

  sections.forEach((section) => {
    (sectionActivities[section.id] ?? []).forEach((activity) => {
      activityColumns.push({ id: activity.id, label: `${section.label}:${activity.title}` });
      const metric = metricsByActivity[activity.id];
      rows.push([
        section.label,
        activity.title,
        getActivityTypeMeta(activity.type).label,
        String(metric?.totalTaps ?? 0),
      ]);
    });
  });

  rows.push([]);
  rows.push(["참여자", "아이디", ...activityColumns.map((column) => column.label)]);
  accounts.forEach((account) => {
    rows.push([
      account.name,
      account.username,
      ...activityColumns.map((column) => String(metricsByActivity[column.id]?.participantTaps[account.username] ?? 0)),
    ]);
  });

  const csv = rows
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `program-${session.id}-stats-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<ProgramSession[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SCHEDULED" | "ACTIVE" | "COMPLETED" | "DRAFT">("ALL");
  const [messageSession, setMessageSession] = useState<ProgramSession | null>(null);
  const [messageDraft, setMessageDraft] = useState("");
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [customMessages, setCustomMessages] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const aTime = (a.startDate ?? a.scheduledAt ?? a.createdAt).getTime();
      const bTime = (b.startDate ?? b.scheduledAt ?? b.createdAt).getTime();
      return bTime - aTime;
    });
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    if (statusFilter === "ALL") return sortedSessions;
    return sortedSessions.filter((session) => session.status === statusFilter);
  }, [sortedSessions, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts = {
      ALL: sessions.length,
      SCHEDULED: 0,
      ACTIVE: 0,
      COMPLETED: 0,
      DRAFT: 0,
    };

    sessions.forEach((session) => {
      if (session.status in counts) {
        counts[session.status as "SCHEDULED" | "ACTIVE" | "COMPLETED" | "DRAFT"] += 1;
      }
    });

    return counts;
  }, [sessions]);

  useEffect(() => {
    setSessions(getProgramSessions());

    try {
      const raw = window.localStorage.getItem(GUIDE_MESSAGE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, string>;
        setCustomMessages(parsed);
      }
    } catch {
      setCustomMessages({});
    }

    setMounted(true);
  }, []);

  function onDeleteSession(id: string) {
    const ok = window.confirm("정말 삭제 하시겠습니까?");
    if (!ok) return;

    const deleted = deleteProgramSession(id);
    if (!deleted) return;
    setSessions((prev) => prev.filter((session) => session.id !== id));
    window.dispatchEvent(
      new CustomEvent("minddit:toast", {
        detail: { message: "삭제되었습니다.", tone: "error" },
      })
    );
  }

  function getModeLabel(mode?: ProgramMode | null) {
    if (mode === "ONLINE") return "비대면";
    if (mode === "HYBRID") return "대면+비대면";
    return "대면";
  }

  function buildProgramGuideMessage(session: ProgramSession) {
    const programName = session.title;
    const schedule = getProgramDateSummary(session);
    const roundText = session.scheduleItems?.length ? `${session.scheduleItems.length}회차` : "미정";
    const modeText = getModeLabel(session.mode);
    const link = `${window.location.origin}/s/${session.joinCode}`;
    const email = session.institutionEmail?.trim() || "미입력(설정 필요)";
    const phone = session.institutionPhone?.trim();

    const phoneLine = phone ? `\n* 연락처: ${phone}` : "";

    return `[${programName}]
안녕하세요.
본 메시지는 [${programName}] 안내를 위해 발송되었습니다.

📌 안내
* 일정: ${schedule}
* 회차: ${roundText}
* 진행 방식: ${modeText}

[${programName}]의 상세 내용은 아래 링크에서 확인하실 수 있습니다.
${link}

📞 문의
기타 문의사항이 있으신 경우 아래 연락처로 문의해 주시기 바랍니다.
* 이메일: ${email}${phoneLine}

감사합니다.
좋은 하루 보내세요. :)`;
  }

  function onOpenGuideMessage(session: ProgramSession) {
    setMessageSession(session);
    setIsEditingMessage(false);
    setMessageDraft(customMessages[session.id] ?? buildProgramGuideMessage(session));
  }

  function onSaveGuideMessage() {
    if (!messageSession) return;
    const next = {
      ...customMessages,
      [messageSession.id]: messageDraft,
    };
    setCustomMessages(next);
    window.localStorage.setItem(GUIDE_MESSAGE_STORAGE_KEY, JSON.stringify(next));
    setIsEditingMessage(false);
    window.dispatchEvent(
      new CustomEvent("minddit:toast", {
        detail: { message: "메세지 내용이 저장되었습니다.", tone: "success" },
      })
    );
  }

  async function onCopyGuideMessage() {
    const text = messageDraft;
    try {
      await navigator.clipboard.writeText(text);
      window.dispatchEvent(
        new CustomEvent("minddit:toast", {
          detail: { message: "내용이 복사되었습니다.", tone: "success" },
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

  async function onCopyProgramLink(session: ProgramSession) {
      if (!(session.linkSharingEnabled ?? true)) {
        window.dispatchEvent(
          new CustomEvent("minddit:toast", {
            detail: { message: "활성화된 링크가 없습니다.", tone: "error" },
          })
        );
        return;
      }
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

  return (
    <div>
      <div className="dashboard-sticky-header-compact mb-0 flex items-center justify-between">
        <div>
          <h1 className="text-[1.7rem] font-bold text-gray-900">프로그램 관리</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="알림"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M15 17H9M17 8C17 6.67392 16.4732 5.40215 15.5355 4.46447C14.5979 3.52678 13.3261 3 12 3C10.6739 3 9.40215 3.52678 8.46447 4.46447C7.52678 5.40215 7 6.67392 7 8C7 10.5772 6.34829 12.2684 5.62047 13.3333C5.00778 14.2296 4.70144 14.6777 4.7118 14.8023C4.72328 14.9405 4.75253 14.9936 4.86071 15.0804C4.95822 15.1586 5.45062 15.1586 6.43542 15.1586H17.5646C18.5494 15.1586 19.0418 15.1586 19.1393 15.0804C19.2475 14.9936 19.2767 14.9405 19.2882 14.8023C19.2986 14.6777 18.9922 14.2296 18.3795 13.3333C17.6517 12.2684 17 10.5772 17 8Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13.73 21C13.5542 21.3031 13.3018 21.5546 12.9982 21.7295C12.6946 21.9044 12.3503 21.9966 12 21.9966C11.6497 21.9966 11.3054 21.9044 11.0018 21.7295C10.6982 21.5546 10.4458 21.3031 10.27 21"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => downloadSessionsCsv(sortedSessions)}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#417572] px-4 text-sm font-medium text-white transition hover:bg-[#356663]"
          >
            엑셀(.csv) 다운
          </button>

          <Link
            href="/sessions/new"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#292929] px-4 text-sm font-medium text-white transition hover:bg-[#1f1f1f]"
          >
            + 새 프로그램
          </Link>
        </div>
      </div>

      <p className="mb-6 mt-0.5 text-sm text-gray-500">운영 중인 프로그램과 상태를 한눈에 관리하세요.</p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[
          { key: "ALL", label: "전체" },
          { key: "SCHEDULED", label: "예정" },
          { key: "ACTIVE", label: "진행" },
          { key: "COMPLETED", label: "완료" },
          { key: "DRAFT", label: "임시저장" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key as "ALL" | "SCHEDULED" | "ACTIVE" | "COMPLETED" | "DRAFT")}
            className={
              statusFilter === tab.key
                ? "rounded-lg border border-[#485763] bg-[#485763] px-3 py-1.5 text-xs font-medium text-white"
                : "rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            }
          >
            {tab.label}({statusCounts[tab.key as "ALL" | "SCHEDULED" | "ACTIVE" | "COMPLETED" | "DRAFT"]})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {filteredSessions.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 px-6 py-4 hover:bg-gray-50 transition">
            <div className="min-w-0 flex flex-1 items-center gap-3">
              <button
                type="button"
                onClick={() => onOpenGuideMessage(s)}
                aria-label="프로그램 안내 메세지"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-100"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M4 7L12 13L20 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => onCopyProgramLink(s)}
                aria-label="프로그램 링크 복사"
                  disabled={!(s.linkSharingEnabled ?? true)}
                  className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition ${
                    s.linkSharingEnabled ?? true
                      ? "border border-gray-300 bg-white text-gray-600 hover:bg-gray-100"
                      : "border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
              >
                <span className="text-[18px] leading-none" aria-hidden="true">🔗</span>
              </button>
              <Link href={`/sessions/${s.id}`} className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-900 text-base">{s.title}</p>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusColor[s.status]}`}>
                    {statusLabel[s.status]}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-0.5">
                  참여자 {s._count.participants}명 · {getProgramDateSummary(s)}
                </p>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onDeleteSession(s.id)}
                aria-label="프로그램 삭제"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {mounted &&
        typeof document !== "undefined" &&
        messageSession &&
        createPortal(
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/55 px-4">
            <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow-2xl">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-900">프로그램 안내 메세지</h2>
                <div className="flex items-center gap-2">
                  {isEditingMessage ? (
                    <button
                      type="button"
                      onClick={onSaveGuideMessage}
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
                    onClick={() => onCopyGuideMessage()}
                    className="inline-flex h-9 items-center justify-center rounded-lg bg-[#485763] px-3 text-sm font-medium text-white hover:bg-[#3f4c56]"
                  >
                    문자 복사하기
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessageSession(null)}
                    className="-translate-y-0.5 text-[30px] font-medium leading-none text-gray-700 hover:text-gray-900"
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
{messageDraft}
                </pre>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
