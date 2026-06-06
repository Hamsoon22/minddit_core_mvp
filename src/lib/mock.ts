import type { Session } from "@/types/session";
import type { SessionActivity } from "@/types/activity";
import type { Participant } from "@/types/participant";

export const mockSessions: (Session & { activities: SessionActivity[]; participants: Participant[]; _count: { participants: number } })[] = [
  {
    id: "s1",
    title: "마음챙김 8주 프로그램 — 1회차",
    description: "호흡과 신체 감각에 주의를 기울이는 마음챙김 기초",
    status: "SCHEDULED",
    joinCode: "MIND01",
    scheduledAt: new Date("2026-06-01"),
    createdById: "demo-1",
    createdAt: new Date("2026-05-20"),
    updatedAt: new Date("2026-05-20"),
    _count: { participants: 8 },
    activities: [
      { id: "a1", sessionId: "s1", title: "감정 체크인", type: "CHECKIN", durationMin: 5, content: "현재 감정을 1~10점으로 표현해보세요.", order: 0, createdAt: new Date() },
      { id: "a2", sessionId: "s1", title: "마음챙김 호흡", type: "BREATHING", durationMin: 10, content: "4초 흡입 → 7초 유지 → 8초 날숨", order: 1, createdAt: new Date() },
      { id: "a3", sessionId: "s1", title: "바디스캔 명상", type: "MEDITATION", durationMin: 15, content: "발끝에서 머리까지 몸의 각 부분에 주의를 기울입니다.", order: 2, createdAt: new Date() },
      { id: "a4", sessionId: "s1", title: "그룹 나눔", type: "DISCUSSION", durationMin: 10, content: "오늘 느낀 점을 나눠봅시다.", order: 3, createdAt: new Date() },
    ],
    participants: [
      { id: "p1", name: "김민지", sessionId: "s1", attended: true, createdAt: new Date() },
      { id: "p2", name: "이준호", sessionId: "s1", attended: true, createdAt: new Date() },
      { id: "p3", name: "박서연", sessionId: "s1", attended: false, createdAt: new Date() },
      { id: "p4", name: "최도현", sessionId: "s1", attended: true, createdAt: new Date() },
    ],
  },
  {
    id: "s2",
    title: "스트레스 관리 워크숍",
    description: "직장인을 위한 스트레스 대처 기술",
    status: "COMPLETED",
    joinCode: "STR002",
    scheduledAt: new Date("2026-05-15"),
    createdById: "demo-1",
    createdAt: new Date("2026-05-10"),
    updatedAt: new Date("2026-05-15"),
    _count: { participants: 12 },
    activities: [
      { id: "a5", sessionId: "s2", title: "감정 체크인", type: "CHECKIN", durationMin: 5, content: "", order: 0, createdAt: new Date() },
      { id: "a6", sessionId: "s2", title: "스트레칭", type: "MOVEMENT", durationMin: 8, content: "간단한 목·어깨 스트레칭", order: 1, createdAt: new Date() },
      { id: "a7", sessionId: "s2", title: "감사 저널", type: "JOURNAL", durationMin: 10, content: "오늘 감사한 것 3가지를 적어보세요.", order: 2, createdAt: new Date() },
    ],
    participants: [
      { id: "p5", name: "정유진", sessionId: "s2", attended: true, createdAt: new Date() },
      { id: "p6", name: "한승우", sessionId: "s2", attended: true, createdAt: new Date() },
    ],
  },
  {
    id: "s3",
    title: "청소년 자존감 향상 프로그램",
    description: "중고등학생 대상 자기 이해와 자존감 강화",
    status: "DRAFT",
    joinCode: "YOUTH3",
    scheduledAt: null,
    createdById: "demo-1",
    createdAt: new Date("2026-05-25"),
    updatedAt: new Date("2026-05-25"),
    _count: { participants: 0 },
    activities: [],
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