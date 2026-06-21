export type NoticeCategory = "공지" | "업데이트" | "안내";

export type NoticeItem = {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: NoticeCategory;
  source: string;
  createdAt: string;
  unread?: boolean;
  targetPath?: string;
};

export const NOTICE_ITEMS: NoticeItem[] = [
  {
    id: "privacy-policy-20260619",
    title: "개인정보 처리방침 개정 안내 (2026.06.19)",
    summary: "개인정보 수집 항목과 보관 정책이 일부 변경되었습니다.",
    content:
      "서비스 운영 안정화를 위해 개인정보 수집 항목, 보관 기간, 이용 목적이 최신 정책으로 업데이트되었습니다. 공지일 이후 첫 로그인 시 동의 화면에서 변경 사항을 다시 확인할 수 있습니다.",
    category: "공지",
    source: "마인딧 코어",
    createdAt: "2026.06.19 15:00",
    unread: true,
    targetPath: "/notices/privacy-policy-20260619",
  },
  {
    id: "program-guide-template-update",
    title: "프로그램 안내 메시지 템플릿 개선",
    summary: "기관 주소/오시는 길 항목이 자동 포함되도록 개선되었습니다.",
    content:
      "프로그램 관리와 세부 화면에서 전송하는 안내 메시지에 기관 주소와 오시는 길 정보가 조건부로 자동 포함됩니다. 설정 관리의 기관 정보가 비어 있으면 해당 항목은 자동 생략됩니다.",
    category: "업데이트",
    source: "마인딧 코어",
    createdAt: "2026.06.18 18:20",
    unread: true,
    targetPath: "/notices/program-guide-template-update",
  },
  {
    id: "dashboard-ui-improvement",
    title: "대시보드 UI 개선 사항 안내",
    summary: "홈 요약 카드/일정 이동/상태 배지 색상이 최신 정책으로 정리되었습니다.",
    content:
      "홈 화면의 요약 카드와 최근 일정 패널 UI가 개선되었습니다. 진행/예정/완료 상태 배지의 색상 규칙이 통일되었고, 일정 이동 동작이 무한 스크롤 방식으로 변경되었습니다.",
    category: "안내",
    source: "마인딧 코어",
    createdAt: "2026.06.17 10:05",
    unread: false,
    targetPath: "/notices/dashboard-ui-improvement",
  },
];

export function getNoticeById(id: string) {
  return NOTICE_ITEMS.find((item) => item.id === id) ?? null;
}

export function getUnreadNoticeCount() {
  return NOTICE_ITEMS.filter((item) => item.unread).length;
}
