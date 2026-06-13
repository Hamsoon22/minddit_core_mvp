"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

type ToolPreview = {
  id: string;
  title: string;
  description: string;
  href: string;
  tag: string;
};

const TOOLS: ToolPreview[] = [
  { id: "vlq", title: "가치 명료화 (VLQ)", description: "ACT 기반 설문 활동입니다.", href: "/library/vlq", tag: "진단 설문" },
  { id: "rumination", title: "반추 척도 (Rumination Scale)", description: "반추적 사고 패턴을 평가합니다.", href: "/library/rumination", tag: "진단 설문" },
  { id: "aaq", title: "수용-행동 질문지 (AAQ-II)", description: "경험 회피 수준을 측정합니다.", href: "/library/aaq", tag: "진단 설문" },
  { id: "burnout", title: "번아웃 척도 (MBI-GS)", description: "번아웃 상태를 측정합니다.", href: "/library/burnout", tag: "진단 설문" },
  { id: "journal", title: "일기 쓰기", description: "생각과 감정을 기록합니다.", href: "/library/journal", tag: "워크시트" },
  { id: "leaf", title: "나뭇잎 배띄우기", description: "탈융합 영상 명상입니다.", href: "/library/leaf", tag: "영상 콘텐츠" },
];

export default function LibraryMobilePreviewPage({
  params,
}: {
  params: { toolId: string };
}) {
  const router = useRouter();
  const tool = useMemo(() => TOOLS.find((item) => item.id === params.toolId) ?? null, [params.toolId]);

  function openParticipantWindow(toolId: string) {
    const url = `/s/library/activity/${toolId}`;
    const width = Math.round(window.screen.availWidth * 0.5);
    const height = Math.round(window.screen.availHeight * 0.5);
    const left = Math.round((window.screen.availWidth - width) / 2);
    const top = Math.round((window.screen.availHeight - height) / 2);
    const features = [
      "popup=yes",
      "resizable=yes",
      "scrollbars=yes",
      "menubar=no",
      "toolbar=no",
      "location=no",
      "status=no",
      `width=${width}`,
      `height=${height}`,
      `left=${left}`,
      `top=${top}`,
    ].join(",");

    // Open a controllable blank popup first, then force size/position.
    const popup = window.open("about:blank", "_blank", features);
    if (!popup) {
      // Fallback: if popup is blocked, open in a regular new tab.
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    popup.opener = null;
    popup.resizeTo(width, height);
    popup.moveTo(left, top);
    popup.location.replace(url);
    popup.focus();
  }

  if (!tool) {
    return <div className="text-sm text-gray-500">콘텐츠를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="dashboard-sticky-header flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-lg font-semibold leading-none text-gray-900 hover:bg-gray-50"
        >
          ←
        </button>
        <h1 className="text-[1.7rem] font-bold text-gray-900">콘텐츠 미리보기</h1>
      </div>

      <div className="rounded-xl border border-gray-200 bg-[#f3f5f7] p-4">
        <div className="mx-auto w-full max-w-[430px] overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm">
          <div className="bg-[#d7e5f1] px-4 pb-5 pt-6">
            <h2 className="text-xl font-extrabold leading-tight text-[#101828]">{tool.title}</h2>
            <p className="mt-1 text-sm leading-6 text-[#4b5563]">{tool.description}</p>
          </div>

          <div className="px-4 py-4">
            <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">{tool.tag}</span>

            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
              <iframe
                title={`${tool.title} 미리보기`}
                src={`${tool.href}?embed=1`}
                className="h-[800px] w-full"
              />
            </div>
            <button
              type="button"
              onClick={() => openParticipantWindow(tool.id)}
              className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              참여자 화면 새창으로 보기
            </button>
          </div>
        </div>
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
