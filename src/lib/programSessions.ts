"use client";

import { mockSessions } from "@/lib/mock";
import type { Session } from "@/types/session";
import type { SessionActivity } from "@/types/activity";
import type { Participant } from "@/types/participant";
import type { ProgramMode, ScheduleType } from "@/types/session";
import type { SessionStatus } from "@/types/session";
import type { ProgramThemeKey } from "@/types/session";

export type LocalScheduleItem = {
  id: string;
  label: string;
  date?: string;
  weekStart?: string;
  weekEnd?: string;
  year?: number;
  month?: number;
};

export type ProgramSession = Session & {
  activities: SessionActivity[];
  scheduleActivities: Record<string, SessionActivity[]>;
  participants: Participant[];
  _count: { participants: number };
  scheduleItems: LocalScheduleItem[];
};

type StoredParticipant = Omit<Participant, "createdAt" | "joinedAt"> & {
  createdAt: string;
  joinedAt?: string | null;
};

type StoredProgramSession = Omit<
  ProgramSession,
  "scheduledAt" | "startDate" | "endDate" | "createdAt" | "updatedAt" | "participants"
> & {
  scheduledAt?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
  participants: StoredParticipant[];
};

const STORAGE_KEY = "minddit.programSessions.v3";

function toDayStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDateOnly(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return toDayStart(parsed);
}

function getScheduleDateRange(session: ProgramSession) {
  const points: Date[] = [];

  session.scheduleItems.forEach((item) => {
    if (session.scheduleType === "DATE_SPECIFIC") {
      const date = parseDateOnly(item.date);
      if (date) points.push(date);
      return;
    }

    if (session.scheduleType === "WEEKLY") {
      const start = parseDateOnly(item.weekStart);
      const end = parseDateOnly(item.weekEnd);
      if (start) points.push(start);
      if (end) points.push(end);
      return;
    }

    if (session.scheduleType === "MONTHLY" && item.year && item.month) {
      points.push(new Date(item.year, item.month - 1, 1));
    }
  });

  if (points.length === 0) return { start: null as Date | null, end: null as Date | null };

  points.sort((a, b) => a.getTime() - b.getTime());
  return { start: points[0], end: points[points.length - 1] };
}

function deriveStatusByDate(session: ProgramSession): SessionStatus {
  if (session.status === "DRAFT") return "DRAFT";

  const today = toDayStart(new Date());
  const scheduleRange = getScheduleDateRange(session);

  const start = session.startDate
    ? toDayStart(session.startDate)
    : scheduleRange.start ?? (session.scheduledAt ? toDayStart(session.scheduledAt) : null);
  const end = session.endDate
    ? toDayStart(session.endDate)
    : scheduleRange.end ?? start;

  if (!start || !end) return session.status;

  if (today.getTime() < start.getTime()) return "SCHEDULED";
  if (today.getTime() > end.getTime()) return "COMPLETED";
  return "ACTIVE";
}

function withDerivedStatus(session: ProgramSession): ProgramSession {
  const derivedStatus = deriveStatusByDate(session);
  return {
    ...session,
    status: derivedStatus,
    linkSharingEnabled: derivedStatus === "COMPLETED" ? false : (session.linkSharingEnabled ?? true),
    themeKey: session.themeKey ?? "slate",
  };
}

function toStored(session: ProgramSession): StoredProgramSession {
  return {
    ...session,
    scheduledAt: session.scheduledAt ? session.scheduledAt.toISOString() : null,
    startDate: session.startDate ? session.startDate.toISOString() : null,
    endDate: session.endDate ? session.endDate.toISOString() : null,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    participants: session.participants.map((p) => ({
      ...p,
      joinedAt: p.joinedAt ? p.joinedAt.toISOString() : null,
      createdAt: p.createdAt.toISOString(),
    })),
  };
}

function fromStored(session: StoredProgramSession): ProgramSession {
  return {
    ...session,
    scheduledAt: session.scheduledAt ? new Date(session.scheduledAt) : null,
    startDate: session.startDate ? new Date(session.startDate) : null,
    endDate: session.endDate ? new Date(session.endDate) : null,
    createdAt: new Date(session.createdAt),
    updatedAt: new Date(session.updatedAt),
    participants: session.participants.map((p) => ({
      ...p,
      joinedAt: p.joinedAt ? new Date(p.joinedAt) : null,
      createdAt: new Date(p.createdAt),
    })),
    scheduleActivities: session.scheduleActivities ?? {},
    scheduleItems: session.scheduleItems ?? [],
  };
}

function cloneSeed(): ProgramSession[] {
  return mockSessions.map((s) => ({
    ...s,
    scheduledAt: s.scheduledAt ? new Date(s.scheduledAt) : null,
    startDate: s.startDate ? new Date(s.startDate) : null,
    endDate: s.endDate ? new Date(s.endDate) : null,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
    activities: s.activities.map((a) => ({ ...a })),
    scheduleActivities: {},
    participants: s.participants.map((p) => ({
      ...p,
      joinedAt: p.joinedAt ? new Date(p.joinedAt) : null,
      createdAt: new Date(p.createdAt),
    })),
    scheduleItems: [],
  }));
}

function persist(sessions: ProgramSession[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(sessions.map(toStored))
  );
}

export function getProgramSessions(): ProgramSession[] {
  if (typeof window === "undefined") return cloneSeed();

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = cloneSeed();
    persist(seed);
    return seed.map(withDerivedStatus);
  }

  try {
    const parsed = JSON.parse(raw) as StoredProgramSession[];
    return parsed.map(fromStored).map(withDerivedStatus);
  } catch {
    const seed = cloneSeed();
    persist(seed);
    return seed.map(withDerivedStatus);
  }
}

export function getProgramSessionById(id: string): ProgramSession | null {
  const sessions = getProgramSessions();
  return sessions.find((s) => s.id === id) ?? null;
}

export function createProgramSession(input: {
  title: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  mode?: ProgramMode;
  themeKey?: ProgramThemeKey;
}): ProgramSession {
  const now = new Date();
  const startDate = input.startDate ?? "";
  const endDate = input.endDate ?? "";
  const sessionId = `local-${Date.now()}`;

  const next: ProgramSession = {
    id: sessionId,
    title: input.title,
    description: input.description ?? null,
    expertName: "서윤희",
    mode: input.mode ?? "IN_PERSON",
    status: "DRAFT",
    scheduleType: "DATE_SPECIFIC",
    joinCode: Math.random().toString(36).slice(2, 10).toUpperCase(),
    scheduledAt: startDate ? new Date(startDate) : null,
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
    linkSharingEnabled: true,
    themeKey: input.themeKey ?? "slate",
    createdById: "local-user",
    createdAt: now,
    updatedAt: now,
    activities: [],
    scheduleActivities: {},
    participants: [
      {
        id: `${sessionId}-p1`,
        name: "참여자 1",
        sessionId,
        attended: false,
        joinedAt: null,
        createdAt: now,
      },
    ],
    _count: { participants: 1 },
    scheduleItems: [],
  };

  const sessions = [next, ...getProgramSessions()];
  persist(sessions);
  return next;
}

export function updateProgramSession(
  id: string,
  patch: Partial<
    Pick<
      ProgramSession,
      "title" | "description" | "expertName" | "mode" | "scheduledAt" | "activities" | "scheduleActivities" | "scheduleType" | "scheduleItems" | "startDate" | "endDate" | "status" | "participants" | "_count" | "linkSharingEnabled"
      | "themeKey"
    >
  >
): ProgramSession | null {
  const sessions = getProgramSessions();
  const idx = sessions.findIndex((s) => s.id === id);
  if (idx < 0) return null;

  const updated: ProgramSession = {
    ...sessions[idx],
    ...patch,
    updatedAt: new Date(),
  };

  sessions[idx] = withDerivedStatus(updated);
  persist(sessions);
  return sessions[idx];
}

export function deleteProgramSession(id: string): boolean {
  const sessions = getProgramSessions();
  const next = sessions.filter((session) => session.id !== id);
  if (next.length === sessions.length) return false;
  persist(next);
  return true;
}

function formatDate(dateText: string) {
  const direct = dateText.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
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

export function getProgramDateSummary(session: ProgramSession): string {
  if (session.startDate || session.endDate) {
    const start = session.startDate ? formatDate(session.startDate.toISOString()) : "-";
    const end = session.endDate ? formatDate(session.endDate.toISOString()) : "-";
    return `${start} ~ ${end}`;
  }

  if (session.scheduleType === "DATE_SPECIFIC") {
    if (session.scheduleItems.length === 0) return "일자 미정";
    if (session.scheduleItems.length === 1 && session.scheduleItems[0].date) {
      return formatDate(session.scheduleItems[0].date as string);
    }
    return `일자별 ${session.scheduleItems.length}개`;
  }

  if (session.scheduleType === "WEEKLY") {
    if (session.scheduleItems.length === 0) return "주차 미정";
    return `${session.scheduleItems.length}주차 구성`;
  }

  if (session.scheduleType === "MONTHLY") {
    if (session.scheduleItems.length === 0) return "월 미정";
    return `월별 ${session.scheduleItems.length}개`;
  }

  if (session.scheduledAt) return formatDate(session.scheduledAt.toISOString());
  return "일자 미정";
}
