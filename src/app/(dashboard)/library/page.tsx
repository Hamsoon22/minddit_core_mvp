"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────

type ToolCategory = "all" | "assessment" | "workshop" | "video" | "worksheet";

interface ContentTool {
  id: string;
  title: string;
  description: string;
  category: Exclude<ToolCategory, "all">;
  lang: string[];
  href: string;
  status: "available" | "coming_soon";
}

// ────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────

const TOOL_CATEGORIES: { value: ToolCategory; label: string }[] = [
  { value: "all",        label: "전체" },
  { value: "assessment", label: "진단 설문" },
  { value: "workshop",   label: "워크샵 도구" },
  { value: "video",      label: "영상 콘텐츠" },
  { value: "worksheet",  label: "워크시트" },
];

const CATEGORY_BADGE: Record<Exclude<ToolCategory, "all">, string> = {
  assessment: "bg-blue-50 text-blue-700",
  workshop:   "bg-purple-50 text-purple-700",
  video:      "bg-amber-50 text-amber-700",
  worksheet:  "bg-green-50 text-green-700",
};

const CATEGORY_LABEL: Record<Exclude<ToolCategory, "all">, string> = {
  assessment: "진단 설문",
  workshop:   "워크샵 도구",
  video:      "영상 콘텐츠",
  worksheet:  "워크시트",
};

const TOOLS: ContentTool[] = [
  {
    id: "vlq",
    title: "가치 명료화 (VLQ)",
    description: "ACT 기반 12개 삶의 영역 중요도·실천도 설문. 참여자의 가치 격차를 시각화합니다.",
    category: "assessment",
    lang: ["한국어", "English", "မြန်မာ"],
    href: "/library/vlq",
    status: "available",
  },
  {
    id: "rumination",
    title: "반추 척도 (Rumination Scale)",
    description: "우울 시 반추적 사고 패턴의 빈도와 강도를 평가합니다.",
    category: "assessment",
    lang: ["한국어"],
    href: "/library/rumination",
    status: "available",
  },
  {
    id: "aaq",
    title: "수용-행동 질문지 (AAQ-II)",
    description: "심리적 비유연성과 경험 회피 수준을 측정하는 ACT 기반 7문항 척도입니다.",
    category: "assessment",
    lang: ["한국어"],
    href: "/library/aaq",
    status: "available",
  },
  {
    id: "burnout",
    title: "번아웃 척도 (MBI-GS)",
    description: "소진·비인격화·효능감 3개 하위척도로 직무 번아웃 수준을 측정합니다.",
    category: "assessment",
    lang: ["한국어", "English", "မြန်မာ"],
    href: "/library/burnout",
    status: "available",
  },
  {
    id: "journal",
    title: "일기 쓰기",
    description: "오늘의 생각과 감정을 자유롭게 기록하는 성찰 일지 도구입니다.",
    category: "worksheet",
    lang: ["한국어"],
    href: "/library/journal",
    status: "available",
  },
  {
    id: "leaf",
    title: "나뭇잎 배띄우기",
    description: "ACT 기반 탈융합 명상. 떠오르는 생각을 나뭇잎에 올려 흘려보내는 영상 명상입니다.",
    category: "video",
    lang: ["한국어"],
    href: "/library/leaf",
    status: "available",
  },
  {
    id: "breathing",
    title: "호흡 명상",
    description: "4-7-8 호흡법으로 마음을 고요하게 가라앉히는 명상 영상입니다.",
    category: "video",
    lang: ["한국어"],
    href: "/library/breathing",
    status: "coming_soon",
  },
  {
    id: "phq9",
    title: "PHQ-9",
    description: "우울 증상 자기보고 척도. 9개 문항으로 우울 수준을 측정합니다.",
    category: "assessment",
    lang: ["한국어", "English"],
    href: "/tools/phq9",
    status: "coming_soon",
  },
  {
    id: "gad7",
    title: "GAD-7",
    description: "범불안장애 증상 척도. 7개 문항으로 불안 수준을 측정합니다.",
    category: "assessment",
    lang: ["한국어", "English"],
    href: "/tools/gad7",
    status: "coming_soon",
  },
  {
    id: "act-matrix",
    title: "ACT 매트릭스",
    description: "수용전념치료의 핵심 워크시트. 가치 행동과 회피 행동을 시각적으로 정리합니다.",
    category: "workshop",
    lang: ["한국어", "English"],
    href: "/tools/act-matrix",
    status: "coming_soon",
  },
  {
    id: "mindfulness-intro",
    title: "마음챙김 소개 영상",
    description: "마음챙김의 기본 개념과 호흡 명상 실습을 안내하는 10분 영상입니다.",
    category: "video",
    lang: ["한국어"],
    href: "/tools/mindfulness-intro",
    status: "coming_soon",
  },
  {
    id: "thought-record",
    title: "생각 기록지",
    description: "CBT 기반 자동적 사고 기록 및 인지 재구성 워크시트입니다.",
    category: "worksheet",
    lang: ["한국어", "English"],
    href: "/tools/thought-record",
    status: "coming_soon",
  },
];

// ────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────

function ToolCard({ tool }: { tool: ContentTool }) {
  const available = tool.status === "available";
  return (
    <div
      className={`group flex flex-col rounded-xl border bg-white p-5 transition ${
        available
          ? "border-gray-200 hover:border-gray-300 hover:shadow-sm"
          : "border-gray-100 opacity-55"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_BADGE[tool.category]}`}>
          {CATEGORY_LABEL[tool.category]}
        </span>
        {!available && (
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-400">준비 중</span>
        )}
      </div>

      <h3 className="mb-1.5 text-sm font-semibold text-gray-900">{tool.title}</h3>
      <p className="mb-4 flex-1 text-xs leading-relaxed text-gray-500">{tool.description}</p>

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {tool.lang.map((l) => (
            <span key={l} className="rounded border border-gray-100 bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-400">
              {l}
            </span>
          ))}
        </div>
        {available ? (
          <Link
            href={`/library/preview/${tool.id}`}
            className="flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-gray-900 hover:bg-gray-900 hover:text-white"
          >
            열기
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ) : (
          <span className="shrink-0 rounded-lg border border-gray-100 px-3 py-1.5 text-xs text-gray-300">
            준비 중
          </span>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Main export
// ────────────────────────────────────────────────

export default function ContentToolsSection() {
  const [activeCategory, setActiveCategory] = useState<ToolCategory>("all");
  const [toolSearch, setToolSearch] = useState("");

  const toolCounts = useMemo(() => {
    const base: Record<ToolCategory, number> = {
      all: TOOLS.length, assessment: 0, workshop: 0, video: 0, worksheet: 0,
    };
    for (const t of TOOLS) base[t.category]++;
    return base;
  }, []);

  const filteredTools = useMemo(() => {
    return TOOLS.filter((t) => {
      const matchCat = activeCategory === "all" || t.category === activeCategory;
      const q = toolSearch.trim().toLowerCase();
      const matchSearch = !q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [activeCategory, toolSearch]);

  return (
    <section aria-label="콘텐츠 관리" className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">콘텐츠 관리</h1>
          <p className="mt-2 text-sm text-gray-500">워크샵에서 사용할 도구를 선택하세요.</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-52">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={toolSearch}
            onChange={(e) => setToolSearch(e.target.value)}
            placeholder="도구 검색···"
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-xs text-gray-700 placeholder-gray-500 outline-none transition focus:border-gray-400"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {TOOL_CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveCategory(value)}
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
              activeCategory === value
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900"
            }`}
          >
            {label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                activeCategory === value ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              }`}
            >
              {toolCounts[value]}
            </span>
          </button>
        ))}
      </div>

      {/* Tool grid */}
      {filteredTools.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-gray-50 py-14 text-center text-sm text-gray-400">
          검색 결과가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      )}
    </section>
  );
}