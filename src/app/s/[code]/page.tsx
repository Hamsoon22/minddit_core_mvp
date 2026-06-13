"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { mockSessions } from "@/lib/mock";
import { getProgramSessions, type ProgramSession } from "@/lib/programSessions";
import { getProgramTheme } from "@/lib/programTheme";

function withAlpha(hexColor: string, alpha: number) {
  const normalized = hexColor.replace("#", "");
  const isShortHex = normalized.length === 3;
  const hex = isShortHex
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

export default function ParticipantLandingPage({ params }: { params: { code: string } }) {
  const [session, setSession] = useState<ProgramSession | null>(null);

  useEffect(() => {
    const stored = getProgramSessions().find((s) => s.joinCode === params.code) ?? null;
    const current = stored ?? getFallbackSession(params.code);
    setSession(current);
  }, [params.code]);

  if (!session) {
    return (
      <div className="min-h-screen bg-[#f4f6f7] px-4 py-10 text-center text-sm text-gray-500">
        프로그램을 찾을 수 없습니다.
      </div>
    );
  }

  if (!(session.linkSharingEnabled ?? true)) {
    return (
      <div className="min-h-screen bg-[#f4f6f7] px-4 py-10 text-center text-sm text-gray-500">
        이 프로그램 링크는 비활성화되었습니다.
      </div>
    );
  }

  const organizationName = session.institutionName?.trim() || "마인딧센터";
  const description = session.description?.trim() || "프로그램 설명이 없습니다.";
  const theme = getProgramTheme(session.themeKey);

  return (
    <div className="min-h-screen bg-[#f4f6f7]">
      <main className="flex min-h-screen flex-col items-center justify-center px-4 pb-20 pt-6">
        <div className="w-full max-w-[420px]">
          <div className="rounded-[28px] border border-[#d4dbe0] p-6 text-center shadow-sm" style={{ backgroundColor: withAlpha(theme.panelColor, 0.5) }}>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/80">
              <svg className="h-7 w-7" style={{ color: theme.accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h1 className="mb-1 text-xl font-bold leading-snug" style={{ color: theme.textColor }}>{session.title}</h1>
            <p className="mb-2 whitespace-pre-line text-sm" style={{ color: theme.textColor, opacity: 0.86 }}>{description}</p>
            <div className="mb-6" />

            <Link
              href={`/s/${params.code}/activity/overview`}
              className="block w-full rounded-2xl py-3.5 text-base font-semibold text-white transition hover:opacity-95"
              style={{ backgroundColor: theme.accentColor }}
            >
              시작하기 -&gt;
            </Link>
          </div>

          <p className="mt-5 text-center text-xs text-gray-400">앱 설치 없이 바로 참여할 수 있습니다</p>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 flex h-10 items-center justify-center px-4 text-center text-[11px] text-gray-400">
        Minddit Core · {organizationName} © 2026 All rights reserved.
      </footer>
    </div>
  );
}
