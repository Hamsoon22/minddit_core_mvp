"use client";

import { useState } from "react";
import Link from "next/link";

// ────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────

const QUESTIONS = [
  "내가 얼마나 외로운지에 대해 생각한다.",
  '"이런 기분에서 빠져 나오지 못하면 일을 하지 못할 거야."라고 생각한다.',
  "내가 얼마나 피로하고 아픈지에 대해 생각한다.",
  "집중하는 것이 얼마나 어려운지에 대해 생각한다.",
  '"내가 무슨 일을 했기에 이런 일을 당할까?"라고 생각한다.',
  "내가 얼마나 수동적이고 의욕이 없는지에 대해 생각한다.",
  "내가 왜 우울해졌는지 알아내기 위해 최근 사건들을 분석해 본다.",
  "이제 더 이상 아무 것도 느낄 수 없을 것만 같다고 생각한다.",
  '"왜 나는 꿋꿋하게 지내지 못할까?"하고 생각한다.',
  '"왜 나는 항상 이런 식으로 반응할까?"라고 생각한다.',
  "혼자 조용히 왜 내가 이렇게 느끼는지에 대해 생각한다.",
  "내가 생각하고 있는 것을 글로 쓰고 분석해 본다.",
  "최근의 상황이 더 나았으면 좋았을 걸 하고 생각한다.",
  '"계속 이런 식으로 느끼다가는 집중하는 게 힘들거야."라고 생각한다.',
  '"나는 왜 다른 사람들에게는 없는 문제가 있을까?"라고 생각한다.',
  '"왜 나는 더 잘 대처하지 못할까?"라고 생각한다.',
  "내가 얼마나 슬픈지에 대해 생각한다.",
  "나의 단점과 실패들, 잘못, 실수에 대해 생각한다.",
  "아무 것도 할 기분이 안 든다는 생각을 한다.",
  "내가 왜 우울해졌는지 이해하려고 나의 성격을 분석해 본다.",
  "혼자 어디론가 가서 내 기분에 대해 생각한다.",
  "내가 스스로에게 얼마나 화가 났는지에 대해 생각한다.",
];

const OPTIONS = [
  { value: 1, label: "거의 전혀 아니다" },
  { value: 2, label: "가끔 그렇다" },
  { value: 3, label: "자주 그렇다" },
  { value: 4, label: "거의 언제나 그렇다" },
];

// 하위척도 문항 (1-based index)
const DEPRESSIVE_ITEMS = [1, 2, 3, 5, 6, 8, 9, 17, 19];
const REFLECTIVE_ITEMS = [7, 11, 12, 20, 21, 22];
const BROODING_ITEMS   = [4, 10, 13, 14, 15, 16, 18];

const T_PARAMS = {
  total:      { mean: 40.73, sd: 13.85 },
  depressive: { mean: 16.25, sd: 5.69 },
  reflective: { mean: 10.38, sd: 4.11 },
  brooding:   { mean: 14.13, sd: 5.19 },
};

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────

function calcSum(items: number[], responses: (number | null)[]): number {
  return items.reduce((sum, i) => sum + (responses[i - 1] ?? 0), 0);
}

function calcT(sum: number, mean: number, sd: number): number {
  return Math.round(50 + 10 * ((sum - mean) / sd));
}

function tLabel(t: number): { label: string; color: string } {
  if (t >= 70) return { label: "매우 높음", color: "text-red-600" };
  if (t >= 60) return { label: "높음",     color: "text-orange-500" };
  if (t >= 40) return { label: "평균",     color: "text-gray-600" };
  return              { label: "낮음",     color: "text-blue-500" };
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
    <div className="flex flex-wrap justify-between gap-2">
      {OPTIONS.map((opt) => (
        <label
          key={opt.value}
          className="flex flex-1 min-w-[120px] cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-600 transition hover:border-gray-400 hover:bg-gray-50 has-[:checked]:border-gray-900 has-[:checked]:bg-gray-900 has-[:checked]:text-white"
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
          {opt.label}
        </label>
      ))}
    </div>
  );
}

function ScoreBar({ t }: { t: number }) {
  const pct = Math.min(100, Math.max(0, ((t - 20) / 80) * 100));
  const { color } = tLabel(t);
  return (
    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        className={`h-full rounded-full transition-all ${color.replace("text-", "bg-")}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────

export default function RuminationPage() {
  const [responses, setResponses] = useState<(number | null)[]>(Array(22).fill(null));
  const [submitted, setSubmitted] = useState(false);

  function pick(idx: number, val: number) {
    setResponses((prev) => prev.map((v, i) => (i === idx ? val : v)));
  }

  function reset() {
    setResponses(Array(22).fill(null));
    setSubmitted(false);
  }

  const allAnswered = responses.every((v) => v !== null);

  // 결과 계산
  const totalScore = responses.reduce((a, b) => a + (b ?? 0), 0);
  const dep = calcSum(DEPRESSIVE_ITEMS, responses);
  const ref = calcSum(REFLECTIVE_ITEMS, responses);
  const bro = calcSum(BROODING_ITEMS,   responses);
  const tTotal = calcT(totalScore, T_PARAMS.total.mean, T_PARAMS.total.sd);
  const tDep   = calcT(dep,        T_PARAMS.depressive.mean, T_PARAMS.depressive.sd);
  const tRef   = calcT(ref,        T_PARAMS.reflective.mean, T_PARAMS.reflective.sd);
  const tBro   = calcT(bro,        T_PARAMS.brooding.mean,   T_PARAMS.brooding.sd);

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
          <span className="text-xs font-medium text-gray-700">반추 척도</span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8">
        {!submitted ? (
          <>
            {/* Header block */}
            <div className="mb-6 rounded-xl bg-gray-900 px-6 py-5 text-white">
              <h1 className="mb-1 text-xl font-bold">나는 우울할 때…</h1>
              <p className="text-sm leading-relaxed text-white/70">
                사람들은 우울할 때 여러 가지 생각과 행동을 하게 됩니다.
                아래 문항들을 읽고 우울할 때 이러한 생각이나 행동을{" "}
                <span className="font-medium text-white underline underline-offset-2">
                  어느 정도 하는지
                </span>{" "}
                선택해 주세요.
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
              <h1 className="mb-1 text-xl font-bold">반추 척도 결과</h1>
              <p className="text-sm text-white/70">T점수 기준 (평균=50, SD=10)</p>
            </div>

            {/* Score cards */}
            <div className="flex flex-col gap-3">
              {[
                { label: "반추적 반응 (총점)", t: tTotal, desc: "우울할 때 나타나는 전반적인 반추 수준" },
                { label: "우울형 반추",        t: tDep,   desc: "우울 감정에 집중하는 반추 경향" },
                { label: "숙고 (Reflective)",  t: tRef,   desc: "자신의 감정을 이해하려는 성찰적 반추" },
                { label: "자책 (Brooding)",    t: tBro,   desc: "현재 상태와 원하는 상태를 비교하는 반추" },
              ].map(({ label, t, desc }) => {
                const { label: lvl, color } = tLabel(t);
                return (
                  <div key={label} className="rounded-xl border border-gray-200 bg-white p-5">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800">{label}</span>
                      <span className={`text-sm font-bold ${color}`}>T = {t}</span>
                    </div>
                    <p className="mb-2 text-xs text-gray-400">{desc}</p>
                    <ScoreBar t={t} />
                    <p className={`mt-1.5 text-right text-xs font-medium ${color}`}>{lvl}</p>
                  </div>
                );
              })}
            </div>

            {/* T-score guide */}
            <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-2 text-xs font-medium text-gray-500">T점수 해석 기준</p>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                <span><span className="font-medium text-blue-500">~39</span> 낮음</span>
                <span><span className="font-medium text-gray-600">40–59</span> 평균</span>
                <span><span className="font-medium text-orange-500">60–69</span> 높음</span>
                <span><span className="font-medium text-red-600">70+</span> 매우 높음</span>
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