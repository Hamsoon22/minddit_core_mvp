"use client";

import { useState } from "react";
import Link from "next/link";

// ────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────

const QUESTIONS = [
  "고통스러운 경험과 기억으로 인해 나는 내가 가치 있게 여기는 삶을 살기가 어렵다.",
  "감정을 느끼는 것이 두렵다.",
  "걱정과 느낌을 통제하지 못하는 것에 대해 염려가 된다.",
  "고통스러운 기억들은 내가 만족스러운 삶을 살지 못하게 한다.",
  "감정은 일상생활에서 문제를 일으킨다.",
  "대부분의 사람들은 나보다 자신의 삶을 잘 꾸려나가고 있는 것 같다.",
  "걱정은 내가 성공하는 데 걸림돌이 된다.",
];

const OPTIONS = [
  { value: 0, label: "전혀 그렇지 않다" },
  { value: 1, label: "거의 그렇지 않다" },
  { value: 2, label: "드물게 그렇다" },
  { value: 3, label: "가끔 그렇다" },
  { value: 4, label: "자주 그렇다" },
  { value: 5, label: "거의 항상 그렇다" },
  { value: 6, label: "항상 그렇다" },
];

// T점수 파라미터 (AAQ-II 표준화)
const T_MEAN = 17.34;
const T_SD   = 4.37;

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────

function calcT(score: number): number {
  return Math.round(50 + 10 * ((score - T_MEAN) / T_SD));
}

function tLabel(t: number): { label: string; colorClass: string } {
  if (t >= 70) return { label: "매우 높음", colorClass: "text-red-600" };
  if (t >= 60) return { label: "높음",      colorClass: "text-orange-500" };
  if (t >= 40) return { label: "평균",      colorClass: "text-gray-600" };
  return              { label: "낮음",      colorClass: "text-blue-500" };
}

// ────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────

function RadioRow({
  index,
  value,
  onChange,
}: {
  index: number;
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {OPTIONS.map((opt) => (
        <label
          key={opt.value}
          className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3.5 py-2.5 text-xs text-gray-600 transition hover:border-gray-400 hover:bg-gray-50 has-[:checked]:border-gray-900 has-[:checked]:bg-gray-900 has-[:checked]:text-white"
        >
          <input
            type="radio"
            name={`q${index}`}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="hidden"
          />
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-current">
            {value === opt.value && (
              <span className="h-2 w-2 rounded-full bg-current" />
            )}
          </span>
          <span className="text-[10px] font-medium opacity-60 mr-0.5">{opt.value}</span>
          {opt.label}
        </label>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────

export default function AAQPage() {
  const [responses, setResponses] = useState<(number | null)[]>(Array(7).fill(null));
  const [submitted, setSubmitted] = useState(false);

  function pick(idx: number, val: number) {
    setResponses((prev) => prev.map((v, i) => (i === idx ? val : v)));
  }

  function reset() {
    setResponses(Array(7).fill(null));
    setSubmitted(false);
  }

  const allAnswered = responses.every((v) => v !== null);
  const totalScore  = responses.reduce<number>((sum, v) => sum + (v ?? 0), 0);
  const tScore      = calcT(totalScore);
  const { label: lvl, colorClass } = tLabel(tScore);
  const pct = Math.min(100, Math.max(0, ((tScore - 20) / 80) * 100));

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
          <span className="text-xs font-medium text-gray-700">수용-행동 질문지 (AAQ-II)</span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8">
        {!submitted ? (
          <>
            {/* Header block */}
            <div className="mb-6 rounded-xl bg-gray-900 px-6 py-5 text-white">
              <h1 className="mb-1 text-xl font-bold">수용-행동 질문지</h1>
              <p className="text-sm leading-relaxed text-white/70">
                다음 문장들을 읽고, 각 진술이 당신에게 얼마나 해당되는지{" "}
                <span className="font-medium text-white underline underline-offset-2">
                  가장 잘 나타내는 설명
                </span>
                을 골라 주세요. (0~6점)
              </p>
            </div>

            {/* Questions */}
            <div className="flex flex-col gap-3">
              {QUESTIONS.map((q, i) => (
                <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
                  <p className="mb-4 text-sm font-medium text-gray-800">
                    <span className="mr-2 text-gray-300">{i + 1}.</span>
                    {q}
                  </p>
                  <RadioRow index={i} value={responses[i]} onChange={(v) => pick(i, v)} />
                </div>
              ))}
            </div>

            {/* Submit */}
            <button
              type="button"
              disabled={!allAnswered}
              onClick={() => setSubmitted(true)}
              className="mt-6 w-full rounded-xl bg-gray-900 py-3.5 text-sm font-medium text-white transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-30"
            >
              결과 보기
            </button>
            {!allAnswered && (
              <p className="mt-2 text-center text-xs text-gray-400">
                모든 문항에 응답해야 결과를 볼 수 있습니다.
              </p>
            )}
          </>
        ) : (
          <>
            {/* Result header */}
            <div className="mb-6 rounded-xl bg-gray-900 px-6 py-5 text-white">
              <h1 className="mb-1 text-xl font-bold">수용-행동 질문지 결과</h1>
              <p className="text-sm text-white/70">
                점수가 높을수록 심리적 비유연성(경험 회피)이 높음을 의미합니다.
              </p>
            </div>

            {/* Score card */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">원점수</p>
                  <p className="text-4xl font-bold tracking-tight text-gray-900">{totalScore}</p>
                  <p className="text-xs text-gray-400 mt-0.5">/ 42점</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-0.5">T점수</p>
                  <p className={`text-4xl font-bold tracking-tight ${colorClass}`}>{tScore}</p>
                  <p className={`text-xs font-medium mt-0.5 ${colorClass}`}>{lvl}</p>
                </div>
              </div>

              {/* T score bar */}
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gray-900 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] text-gray-400">
                <span>20</span>
                <span>평균 (T=50)</span>
                <span>100</span>
              </div>
            </div>

            {/* Interpretation */}
            <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-2 text-xs font-medium text-gray-500">T점수 해석 기준</p>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                <span><span className="font-medium text-blue-500">~39</span> 낮음 — 심리적 유연성 높음</span>
                <span><span className="font-medium text-gray-600">40–59</span> 평균</span>
                <span><span className="font-medium text-orange-500">60–69</span> 높음</span>
                <span><span className="font-medium text-red-600">70+</span> 매우 높음 — 경험 회피 강함</span>
              </div>
            </div>

            <button
              type="button"
              onClick={reset}
              className="mt-4 w-full rounded-xl border border-gray-200 bg-white py-3 text-sm text-gray-500 transition hover:border-gray-300 hover:text-gray-900"
            >
              다시하기
            </button>
          </>
        )}
      </div>
    </div>
  );
}