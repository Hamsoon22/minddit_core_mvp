"use client";

import { useState } from "react";
import Link from "next/link";

// ────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────

const MAX = 500;

const PROMPTS = [
  "오늘 나에게 의미 있었던 순간은 무엇인가요?",
  "내가 가장 가치 있게 여기는 것과 오늘 하루가 얼마나 일치했나요?",
  "지금 내 마음속에 있는 감정을 그대로 적어보세요.",
  "오늘 나를 힘들게 한 것은 무엇이고, 그것에 어떻게 반응했나요?",
  "내가 회피하고 있는 것이 있다면 무엇인가요?",
];

// ────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────

export default function JournalPage() {
  const [text, setText] = useState("");
  const [promptIdx, setPromptIdx] = useState(0);
  const [saved, setSaved] = useState(false);

  const remaining = MAX - text.length;

  function handleSave() {
    if (text.trim().length === 0) return;
    setSaved(true);
  }

  function handleReset() {
    setText("");
    setPromptIdx((i) => (i + 1) % PROMPTS.length);
    setSaved(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link
            href="/library"
            className="flex items-center gap-1.5 text-xs text-gray-400 transition hover:text-gray-700"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            라이브러리
          </Link>
          <span className="text-gray-200">/</span>
          <span className="text-xs font-medium text-gray-700">일기 쓰기</span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8">
        {!saved ? (
          <>
            {/* Header */}
            <div className="mb-6 rounded-xl bg-gray-900 px-6 py-5 text-white">
              <h1 className="mb-1 text-xl font-bold">일기 쓰기</h1>
              <p className="text-sm text-white/70">
                오늘의 생각과 감정을 자유롭게 기록해보세요.
              </p>
            </div>

            {/* Prompt card */}
            <div className="mb-4 rounded-xl border border-gray-200 bg-white px-5 py-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-gray-400">오늘의 질문</p>
                <button
                  type="button"
                  onClick={() => setPromptIdx((i) => (i + 1) % PROMPTS.length)}
                  className="flex items-center gap-1 text-xs text-gray-400 transition hover:text-gray-700"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4 12a8 8 0 018-8v2M20 12a8 8 0 01-8 8v-2M4 12h2M20 12h-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M12 4l2-2-2-2M12 20l-2 2 2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  다른 질문
                </button>
              </div>
              <p className="text-sm font-medium text-gray-800">{PROMPTS[promptIdx]}</p>
            </div>

            {/* Textarea */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX))}
                placeholder="내용을 입력하세요..."
                className="w-full resize-none px-5 py-4 text-sm text-gray-800 placeholder-gray-300 outline-none"
                style={{ height: "300px" }}
              />
              <div
                className={`flex justify-end border-t border-gray-100 px-4 py-2 text-xs ${
                  remaining < 50 ? "text-orange-500" : "text-gray-400"
                }`}
              >
                {text.length} / {MAX}
              </div>
            </div>

            {/* Save button */}
            <button
              type="button"
              disabled={text.trim().length === 0}
              onClick={handleSave}
              className="mt-4 w-full rounded-xl bg-gray-900 py-3.5 text-sm font-medium text-white transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-30"
            >
              저장하기
            </button>
          </>
        ) : (
          <>
            {/* Saved state */}
            <div className="mb-6 rounded-xl bg-gray-900 px-6 py-5 text-white">
              <h1 className="mb-1 text-xl font-bold">일기 쓰기</h1>
              <p className="text-sm text-white/70">오늘의 기록이 저장되었습니다.</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="mb-3 text-xs font-medium text-gray-400">{PROMPTS[promptIdx]}</p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{text}</p>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="mt-4 w-full rounded-xl border border-gray-200 bg-white py-3.5 text-sm text-gray-500 transition hover:border-gray-300 hover:text-gray-900"
            >
              새 일기 쓰기
            </button>
          </>
        )}
      </div>
    </div>
  );
}