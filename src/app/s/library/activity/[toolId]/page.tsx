"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { getProgramSessions } from "@/lib/programSessions";
import { getProgramLinkTheme } from "@/lib/programTheme";


type ToolPreview = {
  id: string;
  title: string;
  description: string;
  href: string;
  tag: string;
};

const TOOLS: ToolPreview[] = [
  {
    id: "vlq",
    title: "가치 명료화 (VLQ)",
    description: "ACT 기반 12개 삶의 영역 중요도·실천도 설문입니다.",
    href: "/library/vlq",
    tag: "진단 설문",
  },
  {
    id: "rumination",
    title: "반추 척도 (Rumination Scale)",
    description: "우울 시 반추적 사고 패턴의 빈도와 강도를 평가합니다.",
    href: "/library/rumination",
    tag: "진단 설문",
  },
  {
    id: "aaq",
    title: "수용-행동 질문지 (AAQ-II)",
    description: "심리적 비유연성과 경험 회피 수준을 측정합니다.",
    href: "/library/aaq",
    tag: "진단 설문",
  },
  {
    id: "burnout",
    title: "번아웃 척도 (MBI-GS)",
    description: "소진·비인격화·효능감 3개 하위척도를 측정합니다.",
    href: "/library/burnout",
    tag: "진단 설문",
  },
  {
    id: "journal",
    title: "일기 쓰기",
    description: "오늘의 생각과 감정을 자유롭게 기록합니다.",
    href: "/library/journal",
    tag: "워크시트",
  },
  {
    id: "leaf",
    title: "나뭇잎 배띄우기",
    description: "생각을 흘려보내는 탈융합 영상 명상입니다.",
    href: "/library/leaf",
    tag: "영상 콘텐츠",
  },
];

export default function LibraryActivityPreviewPage({
  params,
}: {
  params: { toolId: string };
}) {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const theme = useMemo(() => {
    if (!code) return getProgramLinkTheme();
    const linkedSession = getProgramSessions().find((item) => item.joinCode === code);
    return getProgramLinkTheme(linkedSession?.themeKey);
  }, [code]);

  const tool = TOOLS.find((item) => item.id === params.toolId) ?? null;

  if (!tool) {
    return (
      <div className="min-h-screen bg-[#f3f5f7] px-4 py-10 text-center text-sm text-gray-500">
        콘텐츠 정보를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f5f7] pb-16">
      <div className="mx-auto w-full max-w-[430px]">
        <div className="rounded-b-[28px] px-4 pb-6 pt-6" style={{ backgroundColor: theme.panelColor }}>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg font-semibold leading-none text-gray-900 shadow-sm"
          >
            ←
          </button>
          <h1 className="mt-3 text-2xl font-extrabold leading-tight" style={{ color: theme.textColor }}>{tool.title}</h1>
          <p className="mt-1 text-sm leading-6" style={{ color: theme.textColor, opacity: 0.82 }}>{tool.description}</p>
        </div>

        <div className="px-2 pt-4">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <iframe
              title={`${tool.title} 참여자 화면`}
              src={`${tool.href}?embed=1`}
              className="h-[812px] w-full"
            />
          </div>
        </div>

        <footer className="mt-8 px-4 pb-4 text-center text-[11px] text-gray-400">
          Minddit Core · 프로그램 링크 뷰 © 2026
        </footer>
      </div>

      <div className="pointer-events-none fixed bottom-[40px] left-1/2 z-[315] w-full max-w-[430px] -translate-x-1/2 px-[25px]">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#292929] text-white shadow-lg transition hover:opacity-90"
            aria-label="맨 위로 이동"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
