"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { mockSessions } from "@/lib/mock";
import { getProgramSessions, type ProgramSession } from "@/lib/programSessions";
import type { SessionActivity } from "@/types/activity";
import { getActivityTypeMeta, syncSessionActivityFromCatalog } from "@/lib/contentCatalog";
import {
  getProgramLinkLoggedInUser,
  getExistingParticipantAccounts,
  setProgramLinkLoggedInUser,
  verifyParticipantLogin,
} from "@/lib/programParticipantAccounts";
import { recordProgramActivityTap } from "@/lib/programActivityMetrics";

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

function getFallbackSession(code: string): ProgramSession | null {
  const base = mockSessions.find((s) => s.joinCode === code);
  if (!base) return null;

  return {
    ...base,
    mode: "IN_PERSON",
    scheduleType: "DATE_SPECIFIC",
    startDate: base.scheduledAt ?? null,
    endDate: base.scheduledAt ?? null,
    scheduleItems: [{ id: "default", label: "1회차", date: base.scheduledAt?.toISOString().slice(0, 10) }],
    scheduleActivities: { default: base.activities },
    institutionName: null,
    institutionAddress: null,
    institutionDirections: null,
    institutionPhone: null,
    institutionEmail: null,
  };
}

export default function ActivityPage({ params }: { params: { code: string; actId: string } }) {
  const router = useRouter();
  const [session, setSession] = useState<ProgramSession | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);

  useEffect(() => {
    const stored = getProgramSessions().find((s) => s.joinCode === params.code) ?? null;
    const current = stored ?? getFallbackSession(params.code);
    setSession(current);
    setLoggedInUser(current ? getProgramLinkLoggedInUser(current.joinCode) : null);
  }, [params.code]);

  function onSubmitLogin() {
    if (!session) return;

    const accounts = getExistingParticipantAccounts(session.id);
    if (accounts.length === 0 || session._count.participants <= 0) {
      setLoginError("아직 참여자 계정이 배부되지 않았습니다.");
      return;
    }

    const account = verifyParticipantLogin(session.id, loginId, loginPassword);
    if (!account) {
      setLoginError("아이디 또는 비밀번호가 올바르지 않습니다.");
      return;
    }

    setProgramLinkLoggedInUser(session.joinCode, account.username);
    setLoggedInUser(account.username);
    setLoginId("");
    setLoginPassword("");
    setLoginError("");
    setLoginOpen(false);
  }

  const sections = useMemo(() => {
    if (!session) return [] as Array<{ id: string; label: string; dateText: string }>;

    if (session.scheduleItems.length === 0) {
      return [{ id: "default", label: "1회차", dateText: formatDate(session.startDate) }];
    }

    return session.scheduleItems.map((section) => {
      if (session.scheduleType === "DATE_SPECIFIC") {
        return {
          id: section.id,
          label: section.label,
          dateText: formatDateText(section.date),
        };
      }

      if (session.scheduleType === "WEEKLY") {
        return {
          id: section.id,
          label: section.label,
          dateText: `${formatDateText(section.weekStart)} ~ ${formatDateText(section.weekEnd)}`,
        };
      }

      if (session.scheduleType === "MONTHLY" && section.year && section.month) {
        return {
          id: section.id,
          label: section.label,
          dateText: `${section.year}.${String(section.month).padStart(2, "0")}`,
        };
      }

      return {
        id: section.id,
        label: section.label,
        dateText: "미정",
      };
    });
  }, [session]);

  const sectionHeader = useMemo(() => {
    if (!session) return (section: { label: string; dateText: string }) => section.label;

    return (section: { label: string; dateText: string }) => {
      if (section.dateText === "미정") return section.label;
      return `${section.label}(${section.dateText})`;
    };
  }, [session]);

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

  if (!session) {
    return (
      <div className="min-h-screen bg-[#f4f6f7] px-4 py-10 text-center text-sm text-gray-500">
        프로그램을 찾을 수 없습니다.
      </div>
    );
  }

  const organizationName = session.institutionName?.trim() || "마인딧센터";
  const description = session.description?.trim() || "프로그램 설명이 없습니다.";

  function onOpenActivity(activity: SessionActivity) {
    if (!activity.content) return;

    if (!loggedInUser) {
      setLoginOpen(true);
      setLoginError("활동을 열기 전에 로그인해 주세요.");
      return;
    }

    recordProgramActivityTap({
      sessionId: session.id,
      activityId: activity.id,
      participantId: loggedInUser,
    });

    if (activity.content.startsWith("/library/")) {
      const slug = activity.content.replace("/library/", "").split("/")[0];
      router.push(`/s/library/activity/${slug}`);
      return;
    }

    if (activity.content.startsWith("/")) {
      router.push(activity.content);
      return;
    }

    window.open(activity.content, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="min-h-screen bg-[#f3f5f7] pb-16">
      <div className="mx-auto w-full max-w-[430px]">
        {loggedInUser && (
          <div className="mb-0 flex h-6 w-full items-center justify-center rounded-none bg-[#485763] px-3 text-xs text-white">
            '{loggedInUser}'으로 로그인중입니다.
          </div>
        )}

        <div className="rounded-b-[28px] bg-[#d7e5f1] px-4 pb-6 pt-8">
          <h1 className="text-2xl font-extrabold leading-tight text-[#101828]">{session.title}</h1>
          <p className="mt-1 whitespace-pre-line text-sm text-[#4b5563]">{description}</p>

          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-3 rounded-full bg-white px-4 py-2.5 text-[#1f2937]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="3" y="4" width="18" height="17" rx="3" stroke="currentColor" strokeWidth="1.8" />
                <path d="M8 2.5V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M16 2.5V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M3 9H21" stroke="currentColor" strokeWidth="1.8" />
              </svg>
              <span className="text-sm font-semibold">{formatDate(session.startDate)} ~ {formatDate(session.endDate)}</span>
            </div>

            <div className="flex items-center gap-3 rounded-full bg-white px-4 py-2.5 text-[#1f2937]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
                <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <span className="text-sm font-semibold">{session.expertName ?? "전문가 미정"}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-3 pt-6">
          {sections.map((section) => (
            <section key={section.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="text-sm font-bold text-gray-900">{sectionHeader(section)}</h2>
              </div>

              <div className="space-y-2">
                {(sectionActivities[section.id] ?? []).map((activity, index) => {
                  const syncedActivity = syncSessionActivityFromCatalog(activity);
                  const typeMeta = getActivityTypeMeta(syncedActivity.type);
                  return (
                    <div key={activity.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-500">
                          {index + 1}
                        </span>
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
                      </div>
                    </div>
                  );
                })}

                {(sectionActivities[section.id] ?? []).length === 0 && (
                  <div className="rounded-lg border-2 border-dashed border-gray-200 py-8 text-center">
                    등록된 활동이 없습니다.
                  </div>
                )}
              </div>
            </section>
          ))}

          <Link
            href={`/s/${params.code}/survey`}
            className="block rounded-xl border border-[#bfc8d2] bg-white p-4 transition hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1f2937]">프로그램 만족도 조사</p>
              </div>
              <span className="text-lg text-[#485763]">→</span>
            </div>
          </Link>
        </div>
      </div>

      <footer className="mt-8 px-4 pb-4 text-center text-[11px] text-gray-400">
        Minddit Core · {organizationName} © 2026 All rights reserved.
      </footer>

      <div className="pointer-events-none fixed bottom-[40px] left-1/2 z-[315] w-full max-w-[430px] -translate-x-1/2 px-[25px]">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#485763] text-white shadow-lg"
            aria-label="로그인 또는 프로필"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
              <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {loginOpen && (
        <div className="fixed inset-0 z-[320] flex items-center justify-center bg-black/55 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">로그인</h2>
              <button
                type="button"
                onClick={() => {
                  setLoginOpen(false);
                  setLoginError("");
                }}
                className="text-2xl font-medium leading-none text-gray-700 hover:text-gray-900"
                aria-label="닫기"
              >
                ×
              </button>
            </div>

            <div className="space-y-2">
              <input
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="아이디"
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-gray-400"
              />
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="비밀번호"
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-gray-400"
              />
              {loginError && <p className="text-xs text-[#AD4E70]">{loginError}</p>}
            </div>

            <div className="mt-3 flex justify-end gap-2">
              {loggedInUser && (
                <button
                  type="button"
                  onClick={() => {
                    if (!session) return;
                    setProgramLinkLoggedInUser(session.joinCode, null);
                    setLoggedInUser(null);
                    setLoginOpen(false);
                  }}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50"
                >
                  로그아웃
                </button>
              )}
              <button
                type="button"
                onClick={onSubmitLogin}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-[#485763] px-4 text-sm font-medium text-white hover:bg-[#3f4c56]"
              >
                로그인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
