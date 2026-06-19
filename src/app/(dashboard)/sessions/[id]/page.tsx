"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { getProgramSessionById, updateProgramSession, type ProgramSession } from "@/lib/programSessions";
import { getProgramTheme } from "@/lib/programTheme";
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
  ACTIVE: "진행",
  COMPLETED: "완료",
};

const statusColor: Record<string, string> = {
  DRAFT: "border border-gray-300 bg-transparent text-gray-600",
  SCHEDULED: "bg-[#DDEFF9] text-[#0688D3]",
  ACTIVE: "bg-[#E6ECE0] text-[#68814E]",
  COMPLETED: "bg-gray-200 text-gray-700",
};

const LINK_BORDER_BY_THEME: Record<string, string> = {
  slate: "#0688D3",
  rose: "#AD4E70",
  forest: "#68814E",
  teal: "#417572",
  olive: "#8C8A47",
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

function withAlpha(hexColor: string, alpha: number) {
  const normalized = hexColor.replace("#", "");
  const hex = normalized.length === 3
    ? normalized
        .split("")
        .map((char) => char + char)
        .join("")
    : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return hexColor;

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [statsTab, setStatsTab] = useState<"activity" | "participant">("activity");
  const theme = useMemo(() => getProgramTheme(session?.themeKey), [session?.themeKey]);
  const linkBorderColor = LINK_BORDER_BY_THEME[theme.key] ?? theme.accentColor;

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

  const participantCount = useMemo(() => Math.max(session?._count.participants ?? 0, 0), [session]);

  // 전체 참여도 = 실제 참여 건수 / (전체 참여자 수 × 전체 활동 수)
  const participationRate = useMemo(() => {
    const accounts = getExistingParticipantAccounts(session?.id ?? "");
    const allActivities = Object.values(sectionActivities).flat();
    const denominator = accounts.length * allActivities.length;
    if (denominator === 0) return 0;

    let actualParticipationCount = 0;
    accounts.forEach((account) => {
      allActivities.forEach((activity) => {
        if ((metricsByActivity[activity.id]?.participantTaps[account.username] ?? 0) > 0) {
          actualParticipationCount += 1;
        }
      });
    });

    return Math.round((actualParticipationCount / denominator) * 100);
  }, [metricsByActivity, sectionActivities, session?.id]);

  // 활동별 참여율
  const activityParticipationRates = useMemo(() => {
    const accounts = getExistingParticipantAccounts(session?.id ?? "");
    const total = accounts.length;
    if (total === 0) return {} as Record<string, number>;
    const result: Record<string, number> = {};
    const allActivities = Object.values(sectionActivities).flat();
    allActivities.forEach((activity) => {
      const metric = metricsByActivity[activity.id];
      if (!metric) {
        result[activity.id] = 0;
        return;
      }
      const participated = Object.values(metric.participantTaps).filter((taps) => taps > 0).length;
      result[activity.id] = Math.round((participated / total) * 100);
    });
    return result;
  }, [metricsByActivity, sectionActivities, session?.id]);

  // 참여자별 활동 참여 여부
  const participantActivityMatrix = useMemo(() => {
    const accounts = getExistingParticipantAccounts(session?.id ?? "");
    const allActivities = Object.values(sectionActivities).flat();
    return accounts.map((account) => ({
      account,
      activities: allActivities.map((activity) => ({
        activityId: activity.id,
        activityTitle: activity.title,
        participated: (metricsByActivity[activity.id]?.participantTaps[account.username] ?? 0) > 0,
      })),
    }));
  }, [metricsByActivity, sectionActivities, session?.id]);

  const sectionActivityGroups = useMemo(
    () =>
      sections
        .map((section) => ({
          section,
          activities: sectionActivities[section.id] ?? [],
        }))
        .filter((group) => group.activities.length > 0),
    [sections, sectionActivities]
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
    const address = session.institutionAddress?.trim();
    const directions = session.institutionDirections?.trim();
    const phoneLine = phone ? `\n* 연락처: ${phone}` : "";
    const addressLine = address ? `\n* 기관 주소: ${address}` : "";
    const directionsLine = directions ? `\n* 오시는 길: ${directions}` : "";
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
* 이메일: ${email}${phoneLine}${addressLine}${directionsLine}

감사합니다.
좋은 하루 보내세요. :)`;
  }

  function buildSectionGuideMessage(section: ProgramSession["scheduleItems"][number] | { id: string; label: string }) {
    if (!session) return "";

    const sectionTitle = `${session.title}-${section.label}`;
    const link = `${window.location.origin}/s/${session.joinCode}`;
    const email = session.institutionEmail?.trim() || "미입력(설정 필요)";
    const phone = session.institutionPhone?.trim();
    const address = session.institutionAddress?.trim();
    const directions = session.institutionDirections?.trim();
    const phoneLine = phone ? `\n* 연락처: ${phone}` : "";
    const addressLine = address ? `\n* 기관 주소: ${address}` : "";
    const directionsLine = directions ? `\n* 오시는 길: ${directions}` : "";

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
* 이메일: ${email}${phoneLine}${addressLine}${directionsLine}

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

  function toggleLinkSharing() {
    if (!session) return;
    const nextEnabled = !(session.linkSharingEnabled ?? true);
    const patched = updateProgramSession(session.id, { linkSharingEnabled: nextEnabled });
    if (!patched) return;

    setSession(patched);
    window.dispatchEvent(
      new CustomEvent("minddit:toast", {
        detail: {
          message: nextEnabled ? "프로그램 링크가 활성화되었습니다." : "프로그램 링크가 비활성화되었습니다.",
          tone: "success",
        },
      })
    );
  }

  function onOpenActivity(activity: SessionActivity) {
    const syncedActivity = syncSessionActivityFromCatalog(activity);
    const content = syncedActivity.content ?? "";
  
    if (!content) {
      window.dispatchEvent(
        new CustomEvent("minddit:toast", {
          detail: { message: "연결된 콘텐츠가 없습니다.", tone: "error" },
        })
      );
      return;
    }
  
    if (content.startsWith("/library/")) {
      const slug = content.replace("/library/", "").split("/")[0];
      router.push(`/library/preview/${slug}`);
      return;
    }
  
    if (content.startsWith("/")) {
      router.push(content);
      return;
    }
  
    window.location.href = content;
  }

  function onDownloadProgramStatsCsv() {
    if (!session) return;

    const fallbackCount = Math.max(session._count.participants || 0, 1);
    const accounts = getExistingParticipantAccounts(session.id);
    const accountRows = accounts.length > 0 ? accounts : getParticipantAccounts(session.id, fallbackCount);
    const allActivities = Object.values(sectionActivities).flat();

    // 기본 정보
    const headerRows: string[][] = [
      ["프로그램명", session.title],
      ["상태", statusLabel[session.status]],
      ["진행 방식", getModeLabel(session.mode)],
      ["기간", `${formatDate(session.startDate)} ~ ${formatDate(session.endDate)}`],
      ["참여자 수", String(session._count.participants)],
      ["활동 수", String(totalActivities)],
      [],
    ];

    // 활동별 현황
    const activityStatRows: string[][] = [
      ["[활동별 현황]"],
      ["활동명", "참여율(%)", "참여자수", "미참여자수"],
    ];
    allActivities.forEach((activity) => {
      const rate = activityParticipationRates[activity.id] ?? 0;
      const participated = Math.round((rate / 100) * accountRows.length);
      activityStatRows.push([
        activity.title,
        String(rate),
        String(participated),
        String(accountRows.length - participated),
      ]);
    });

    // 참여자별 현황 (O/X 매트릭스)
    const matrixHeader = ["[참여자별 현황]", ...allActivities.map((a) => a.title)];
    const matrixRows = accountRows.map((account) => [
      account.name,
      ...allActivities.map((activity) =>
        (metricsByActivity[activity.id]?.participantTaps[account.username] ?? 0) > 0 ? "O" : "X"
      ),
    ]);

    const csvRows = [...headerRows, ...activityStatRows, [], matrixHeader, ...matrixRows]
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
      <div className="dashboard-sticky-header mb-0 flex items-start justify-between gap-4">
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
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 text-xs font-bold text-gray-700 transition hover:bg-gray-100"
            >
              <img src="/icon_message.svg" alt="" aria-hidden="true" className="h-[16px] w-[16px]" />
              안내
            </button>
            <div
              className={`inline-flex h-8 items-center rounded-md border text-xs font-medium ${
                session.linkSharingEnabled ?? true
                  ? ""
                  : "border-gray-300 bg-gray-100 text-gray-500"
              }`}
              style={session.linkSharingEnabled ?? true
                ? {
                    borderColor: linkBorderColor,
                    backgroundColor: withAlpha(linkBorderColor, 0.15),
                    color: theme.textColor,
                  }
                : undefined}
            >
              <button
                type="button"
                onClick={onCopyProgramLink}
                aria-label="프로그램 링크 복사"
                className="inline-flex h-full items-center gap-1.5 px-2.5 font-bold transition hover:opacity-85"
              >
                <img
                  src="/icon_link.svg"
                  alt=""
                  aria-hidden="true"
                  className={`h-[16px] w-[16px] ${session.linkSharingEnabled ?? true ? "" : "grayscale opacity-50"}`}
                />
                링크
              </button>
              <span
                className={`h-4 w-px ${session.linkSharingEnabled ?? true ? "" : "bg-gray-300"}`}
                style={session.linkSharingEnabled ?? true ? { backgroundColor: theme.textColor, opacity: 0.28 } : undefined}
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={toggleLinkSharing}
                aria-label={session.linkSharingEnabled ?? true ? "링크 비활성화" : "링크 활성화"}
                className="inline-flex h-full items-center px-2.5 transition hover:opacity-85"
              >
                {session.linkSharingEnabled ?? true ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M2 12C3.8 7.8 7.5 5 12 5C16.5 5 20.2 7.8 22 12C20.2 16.2 16.5 19 12 19C7.5 19 3.8 16.2 2 12Z" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M2 12C3.8 7.8 7.5 5 12 5C16.5 5 20.2 7.8 22 12C20.2 16.2 16.5 19 12 19C7.5 19 3.8 16.2 2 12Z" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M4 20L20 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor[session.status]}`}>
              {statusLabel[session.status]}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openParticipantModal}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[#292929] bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            참여자 편집
          </button>
          <Link
            href={`/sessions/${session.id}/setup`}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#292929] px-4 text-sm font-medium text-white transition hover:bg-[#1f1f1f]"
          >
            프로그램 편집
          </Link>
          <Link
            href={`/sessions/${session.id}/builder`}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#292929] px-4 text-sm font-medium text-white transition hover:bg-[#1f1f1f]"
          >
            활동 편집
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: theme.panelColor, color: theme.textColor }}>
          <div className="flex items-center justify-between gap-3">
            <p><span className="font-bold">프로그램 기간</span> {formatDate(session.startDate)} ~ {formatDate(session.endDate)}</p>
            <div className="flex items-center gap-2">
              <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: theme.panelSoftColor, color: theme.textColor }}>
                참여자 {session._count.participants}명
              </span>
              <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: theme.panelSoftColor, color: theme.textColor }}>
                {getModeLabel(session.mode)}
              </span>
              <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: theme.panelSoftColor, color: theme.textColor }}>
                {(session.expertName ?? "서윤희")} 전문가
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 핵심 운영 지표 요약 카드 */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-[0.4rem]">
          <h2 className="text-sm font-bold text-gray-700">운영 현황</h2>
          <button
            type="button"
            onClick={() => { setStatsTab("activity"); setStatsModalOpen(true); }}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <img src="/icon_chart.svg" alt="" aria-hidden="true" className="h-[18px] w-[18px]" />
            세부 통계 보기
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg px-3 py-3" style={{ backgroundColor: theme.accentColor }}>
            <p className="mb-1 text-xs text-white/70">전체 참여자</p>
            <p className="text-xl font-extrabold text-white">
              {participantCount}
              <span className="ml-0.5 text-sm font-medium text-white/70">명</span>
            </p>
          </div>
          <div className="rounded-lg px-3 py-3" style={{ backgroundColor: theme.accentColor }}>
            <div className="mb-1 flex items-center gap-1 text-xs text-white/70">
              <p>전체 참여도</p>
              <span className="group relative inline-flex h-4 w-4 items-center justify-center">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white/50 text-[10px] font-bold text-[#485763]">i</span>
                <span className="pointer-events-none absolute -top-2 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-[#485763] px-2.5 py-2 text-[11px] font-medium leading-4 text-white shadow-lg group-hover:block">
                  전체 참여도 = 실제 참여 건수 / (전체 참여자 수 × 전체 활동 수) × 100
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
                <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
                <circle
                  cx="18" cy="18" r="14"
                  fill="none"
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth="6"
                  strokeDasharray={`${(participationRate / 100) * 87.96} 87.96`}
                  strokeLinecap="round"
                  transform="rotate(-90 18 18)"
                />
              </svg>
              <p className="text-xl font-extrabold text-white">
                {participationRate}
                <span className="ml-0.5 text-sm font-medium text-white/70">%</span>
              </p>
            </div>
          </div>
          <div className="rounded-lg px-3 py-3" style={{ backgroundColor: theme.accentColor }}>
            <p className="mb-1 text-xs text-white/70">프로그램 만족도</p>
            <p className="text-xl font-extrabold text-white">
              -
              <span className="ml-0.5 text-sm font-medium text-white/70">/ 5</span>
            </p>
          </div>
        </div>
      </div>

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
                  {isBlinking && <span className="absolute inset-0 animate-ping rounded-full bg-[#292929]/35" />}
                  <span className="absolute inset-0 rounded-full border-2 border-white bg-[#292929] shadow-sm" />
                </span>

                <div className="w-full rounded-xl border border-gray-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-gray-900">{getSectionTabLabel(section)}</h2>
                      <button
                        type="button"
                        onClick={() => openSectionMessageModal(section)}
                        aria-label={`${section.label} 안내 문자 복사`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-50"
                      >
                        <img src="/icon_message.svg" alt="" aria-hidden="true" className="h-[16px] w-[16px]" />
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
        statsModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[310] flex items-center justify-center bg-black/55 px-4">
            <div className="flex h-[75vh] w-full max-w-2xl flex-col rounded-xl bg-white p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                  <img src="/icon_chart.svg" alt="" aria-hidden="true" className="h-[18px] w-[18px]" />
                  세부 통계
                </h2>
                <button
                  type="button"
                  onClick={() => setStatsModalOpen(false)}
                  className="-translate-y-0.5 text-[26px] font-medium leading-none text-gray-700 hover:text-gray-900"
                  aria-label="닫기"
                >
                  ×
                </button>
              </div>

              {/* 탭 */}
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStatsTab("activity")}
                    className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${statsTab === "activity" ? "bg-[#292929] text-white" : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
                  >
                    활동별 현황
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatsTab("participant")}
                    className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${statsTab === "participant" ? "bg-[#292929] text-white" : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
                  >
                    참여자별 현황
                  </button>
                </div>
                <button
                  type="button"
                  onClick={onDownloadProgramStatsCsv}
                  className="inline-flex items-center justify-center rounded-lg px-4 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
                  style={{ backgroundColor: theme.accentColor }}
                >
                  엑셀(.csv) 다운
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-auto">
                {statsTab === "activity" && (
                  <div className="space-y-3">
                    {Object.values(sectionActivities).flat().length === 0 ? (
                      <p className="py-10 text-center text-sm text-gray-400">등록된 활동이 없습니다.</p>
                    ) : (
                      Object.values(sectionActivities).flat().map((activity) => {
                        const rate = activityParticipationRates[activity.id] ?? 0;
                        return (
                          <div key={activity.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <p className="text-sm font-semibold text-gray-900">{activity.title}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                                <div
                                  className="absolute inset-y-0 left-0 rounded-full transition-all"
                                  style={{ width: `${rate}%`, backgroundColor: theme.accentColor }}
                                />
                              </div>
                              <div className="flex shrink-0 items-center gap-3 text-xs">
                                <span className="font-bold text-gray-900">참여 {rate}%</span>
                                <span className="text-gray-400">미참여 {100 - rate}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {statsTab === "participant" && (
                  <div className="overflow-x-auto">
                    {participantActivityMatrix.length === 0 ? (
                      <p className="py-10 text-center text-sm text-gray-400">참여자 데이터가 없습니다.</p>
                    ) : (
                      <table className="w-full min-w-[400px] text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th
                              rowSpan={2}
                              className="sticky left-0 z-10 bg-gray-50 pb-2 px-3 text-center text-xs font-bold text-gray-700"
                            >
                              아이디
                            </th>
                            {sectionActivityGroups.map((group, groupIndex) => (
                              <th
                                key={group.section.id}
                                colSpan={group.activities.length}
                                className={`pb-1 px-2 text-center text-[11px] font-bold text-gray-600 ${groupIndex > 0 ? "border-l border-gray-300" : ""}`}
                              >
                                {group.section.label}
                              </th>
                            ))}
                          </tr>
                          <tr className="border-b border-gray-200">
                            {sectionActivityGroups.flatMap((group, groupIndex) =>
                              group.activities.map((activity, activityIndex) => (
                                <th
                                  key={activity.id}
                                  className={`min-w-[80px] pb-2 px-2 text-center text-xs font-bold text-gray-700 leading-tight ${groupIndex > 0 && activityIndex === 0 ? "border-l border-gray-300" : ""}`}
                                >
                                  {activity.title}
                                </th>
                              ))
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {participantActivityMatrix.map(({ account }) => (
                            <tr key={account.username}>
                              <td className="sticky left-0 z-10 bg-gray-50 px-3 py-2.5 text-center text-xs font-medium text-gray-700">{account.username}</td>
                              {sectionActivityGroups.flatMap((group, groupIndex) =>
                                group.activities.map((activity, activityIndex) => {
                                  const participated = (metricsByActivity[activity.id]?.participantTaps[account.username] ?? 0) > 0;
                                  return (
                                    <td
                                      key={`${account.username}-${activity.id}`}
                                      className={`px-2 py-2.5 text-center ${groupIndex > 0 && activityIndex === 0 ? "border-l border-gray-300" : ""}`}
                                    >
                                      {participated ? (
                                        <span className="text-base font-bold text-green-600">O</span>
                                      ) : (
                                        <span className="text-base font-bold text-red-400">X</span>
                                      )}
                                    </td>
                                  );
                                })
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

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
                <div className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-700">
                  {messageModal.text}
                </div>
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
