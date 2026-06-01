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
  { id: "c1", title: "감정 체크인", type: "CHECKIN" as const, durationMin: 5, description: "지금 이 순간 감정 상태를 확인합니다.", content: "현재 감정을 1~10점으로 표현해보세요.", isPublic: true, createdAt: new Date() },
  { id: "c2", title: "마음챙김 호흡", type: "BREATHING" as const, durationMin: 7, description: "4-7-8 호흡법으로 마음을 안정시킵니다.", content: "4초 흡입 → 7초 유지 → 8초 날숨", isPublic: true, createdAt: new Date() },
  { id: "c3", title: "감사 저널", type: "JOURNAL" as const, durationMin: 10, description: "오늘 감사한 것 3가지를 적어봅니다.", content: "", isPublic: true, createdAt: new Date() },
  { id: "c4", title: "바디스캔 명상", type: "MEDITATION" as const, durationMin: 15, description: "몸의 각 부분에 주의를 기울입니다.", content: "", isPublic: true, createdAt: new Date() },
  { id: "c5", title: "그룹 토론", type: "DISCUSSION" as const, durationMin: 20, description: "참여자들과 경험을 나눕니다.", content: "", isPublic: true, createdAt: new Date() },
  { id: "c6", title: "스트레칭 동작", type: "MOVEMENT" as const, durationMin: 8, description: "간단한 스트레칭으로 긴장을 풉니다.", content: "", isPublic: true, createdAt: new Date() },
];
