import type { Session } from "@/types/session";
import type { SessionActivity } from "@/types/activity";
import type { Participant } from "@/types/participant";

export const mockSessions: (Session & { activities: SessionActivity[]; participants: Participant[]; _count: { participants: number } })[] = [
  {
    id: "s1",
    title: "스트레스 회복 프로그램",
    description: "스트레스 완화를 위한 짧은 회복 세션입니다.",
    status: "COMPLETED",
    joinCode: "BASE001",
    scheduledAt: new Date("2026-05-02"),
    createdById: "demo-1",
    createdAt: new Date("2026-04-20"),
    updatedAt: new Date("2026-05-08"),
    _count: { participants: 10 },
    activities: [
      { id: "a1", sessionId: "s1", title: "감정 체크인", type: "CHECKIN", durationMin: 8, content: "/library/journal", order: 0, createdAt: new Date() },
      { id: "a2", sessionId: "s1", title: "호흡 명상", type: "BREATHING", durationMin: 10, content: "/library/leaf", order: 1, createdAt: new Date() },
    ],
    participants: [
      { id: "p1", name: "김민지", sessionId: "s1", attended: true, createdAt: new Date() },
      { id: "p2", name: "이준호", sessionId: "s1", attended: true, createdAt: new Date() },
    ],
  },
  {
    id: "s2",
    title: "마음챙김 입문",
    description: "호흡과 감정 인식을 연습하는 입문 세션입니다.",
    status: "COMPLETED",
    joinCode: "BASE002",
    scheduledAt: new Date("2026-05-10"),
    createdById: "demo-1",
    createdAt: new Date("2026-04-28"),
    updatedAt: new Date("2026-05-16"),
    _count: { participants: 14 },
    activities: [
      { id: "a3", sessionId: "s2", title: "가치 명료화", type: "POLL", durationMin: 20, content: "/library/vlq", order: 0, createdAt: new Date() },
      { id: "a4", sessionId: "s2", title: "일기 쓰기", type: "JOURNAL", durationMin: 15, content: "/library/journal", order: 1, createdAt: new Date() },
    ],
    participants: [
      { id: "p3", name: "정유진", sessionId: "s2", attended: true, createdAt: new Date() },
      { id: "p4", name: "한승우", sessionId: "s2", attended: true, createdAt: new Date() },
    ],
  },
  {
    id: "s3",
    title: "직무 번아웃 케어",
    description: "번아웃 신호를 점검하고 회복 전략을 다룹니다.",
    status: "COMPLETED",
    joinCode: "BASE003",
    scheduledAt: new Date("2026-05-18"),
    createdById: "demo-1",
    createdAt: new Date("2026-05-01"),
    updatedAt: new Date("2026-05-22"),
    _count: { participants: 9 },
    activities: [
      { id: "a5", sessionId: "s3", title: "번아웃 척도", type: "POLL", durationMin: 15, content: "/library/burnout", order: 0, createdAt: new Date() },
      { id: "a6", sessionId: "s3", title: "그룹 토론", type: "DISCUSSION", durationMin: 20, content: "", order: 1, createdAt: new Date() },
    ],
    participants: [
      { id: "p5", name: "장서윤", sessionId: "s3", attended: true, createdAt: new Date() },
      { id: "p6", name: "윤하진", sessionId: "s3", attended: true, createdAt: new Date() },
    ],
  },
  {
    id: "s4",
    title: "회복탄력성 훈련",
    description: "일상에서 회복탄력성을 높이는 실습 세션입니다.",
    status: "COMPLETED",
    joinCode: "BASE004",
    scheduledAt: new Date("2026-05-25"),
    createdById: "demo-1",
    createdAt: new Date("2026-05-05"),
    updatedAt: new Date("2026-05-28"),
    _count: { participants: 11 },
    activities: [
      { id: "a7", sessionId: "s4", title: "반추 척도", type: "POLL", durationMin: 15, content: "/library/rumination", order: 0, createdAt: new Date() },
      { id: "a8", sessionId: "s4", title: "나뭇잎 배띄우기", type: "VIDEO", durationMin: 10, content: "/library/leaf", order: 1, createdAt: new Date() },
    ],
    participants: [
      { id: "p7", name: "이지안", sessionId: "s4", attended: true, createdAt: new Date() },
      { id: "p8", name: "오민재", sessionId: "s4", attended: true, createdAt: new Date() },
    ],
  },
  {
    id: "s5",
    title: "정서 인식 훈련",
    description: "예정 샘플 프로그램입니다.",
    status: "SCHEDULED",
    joinCode: "BASE005",
    scheduledAt: new Date("2026-07-08"),
    createdById: "demo-1",
    createdAt: new Date("2026-06-01"),
    updatedAt: new Date("2026-06-01"),
    _count: { participants: 0 },
    activities: [
      { id: "a9", sessionId: "s5", title: "수용-행동 질문지", type: "POLL", durationMin: 10, content: "/library/aaq", order: 0, createdAt: new Date() },
    ],
    participants: [],
  },
  {
    id: "s6",
    title: "마음 돌봄 실습",
    description: "예정 샘플 프로그램입니다.",
    status: "SCHEDULED",
    joinCode: "BASE006",
    scheduledAt: new Date("2026-08-12"),
    createdById: "demo-1",
    createdAt: new Date("2026-06-03"),
    updatedAt: new Date("2026-06-03"),
    _count: { participants: 0 },
    activities: [
      { id: "a10", sessionId: "s6", title: "감정 저널링", type: "JOURNAL", durationMin: 15, content: "/library/journal", order: 0, createdAt: new Date() },
    ],
    participants: [],
  },
];

export const mockContentBlocks = [
  // ── 진단 설문 ──────────────────────────────────────────
  { id: "c7",  title: "가치 명료화 (VLQ)",        type: "POLL" as const, durationMin: 20, description: "ACT 기반 12개 삶의 영역 중요도·실천도 설문.", content: "/library/vlq",        isPublic: true, createdAt: new Date() },
  { id: "c8",  title: "반추 척도",                type: "POLL" as const, durationMin: 15, description: "우울 시 반추적 사고 패턴을 평가합니다.",       content: "/library/rumination", isPublic: true, createdAt: new Date() },
  { id: "c9",  title: "수용-행동 질문지 (AAQ-II)", type: "POLL" as const, durationMin: 10, description: "심리적 비유연성과 경험 회피 수준을 측정합니다.", content: "/library/aaq",        isPublic: true, createdAt: new Date() },
  { id: "c10", title: "번아웃 척도 (MBI-GS)",      type: "POLL" as const, durationMin: 15, description: "소진·비인격화·효능감 3개 하위척도 측정.",      content: "/library/burnout",    isPublic: true, createdAt: new Date() },

  // ── 워크샵 도구 / 워크시트 ────────────────────────────
  { id: "c11", title: "일기 쓰기",                type: "JOURNAL"   as const, durationMin: 15, description: "오늘의 생각과 감정을 자유롭게 기록합니다.",    content: "/library/journal",    isPublic: true, createdAt: new Date() },

  // ── 영상 콘텐츠 ───────────────────────────────────────
  { id: "c12", title: "나뭇잎 배띄우기", type: "VIDEO" as const, durationMin: 10, description: "ACT 탈융합 명상 — 생각을 나뭇잎에 올려 흘려보냅니다.", content: "/library/leaf",      isPublic: true, createdAt: new Date() },
  { id: "c13", title: "호흡 명상",       type: "VIDEO" as const, durationMin: 10, description: "4-7-8 호흡법으로 마음을 고요하게 가라앉히는 명상입니다.", content: "/library/breathing", isPublic: true, createdAt: new Date() },
];