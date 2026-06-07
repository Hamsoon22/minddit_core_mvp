"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// ────────────────────────────────────────────────
// Types & constants
// ────────────────────────────────────────────────

type Lang = "ko" | "en" | "my";

interface LangData {
  title: string;
  heroTitle: string;
  heroDesc: string;
  step1: string;
  step2: string;
  axisL: string;
  axisR: string;
  na: string;
  disabled: string;
  next: string;
  submit: string;
  retry: string;
  r1: string;
  r2: string;
  r3: string;
  none: string;
  questions: string[];
  short: string[];
}

const T: Record<Lang, LangData> = {
  ko: {
    title:     "가치 명료화 (VLQ)",
    heroTitle: "나에게 소중한 것은...",
    heroDesc:  "각 영역이 삶에서 얼마나 중요한지, 실제로 얼마나 실천하고 있는지 1~10점으로 선택해 주세요.",
    step1:     "1단계 — 중요도",
    step2:     "2단계 — 실천도",
    axisL:     "전혀 아님",
    axisR:     "매우 그러함",
    na:        "해당 없음",
    disabled:  "해당 없음으로 선택된 항목입니다.",
    next:      "다음",
    submit:    "결과 보기",
    retry:     "다시하기",
    r1:        "내가 많은 가치를 두고 있는 분야",
    r2:        "가치는 높지만 실천이 낮은 분야",
    r3:        "전반적인 가치로운 삶 점수",
    none:      "해당 없음",
    questions: [
      "가족 (부부관계나 자녀양육 제외)",
      "부부관계 / 친밀한 관계",
      "부모됨 / 양육하기",
      "친구관계",
      "일",
      "자기 자신에 대한 교육 / 훈련",
      "휴식 / 즐거운 활동",
      "영성 / 초월성",
      "사회참여 / 시민의식",
      "자신을 신체적으로 돌보기 (운동, 수면, 식이 등)",
      "환경문제",
      "예술, 창조성 등",
    ],
    short: ["가족","부부관계","양육","친구","일","교육","휴식","영성","시민참여","신체돌봄","환경","예술"],
  },
  en: {
    title:     "Valued Living Questionnaire",
    heroTitle: "What matters to me...",
    heroDesc:  "For each area, rate how important it is and how consistently you act on it, from 1 to 10.",
    step1:     "Step 1 — Importance",
    step2:     "Step 2 — Commitment",
    axisL:     "Not at all",
    axisR:     "Very much",
    na:        "N/A",
    disabled:  "Marked as not applicable.",
    next:      "Next",
    submit:    "See Results",
    retry:     "Try Again",
    r1:        "Areas you value most",
    r2:        "Highly valued but less engaged",
    r3:        "Overall valued living score",
    none:      "None",
    questions: [
      "Family (excl. marriage / parenting)",
      "Marriage / Intimate relationships",
      "Parenting",
      "Friendship",
      "Work",
      "Education / Training",
      "Recreation / Fun",
      "Spirituality",
      "Citizenship / Community",
      "Physical self-care (exercise, sleep, diet)",
      "Environmental issues",
      "Art / Creativity",
    ],
    short: ["Family","Marriage","Parenting","Friends","Work","Education","Fun","Spirituality","Civic","Self-care","Environment","Art"],
  },
  my: {
    title:     "တန်ဖိုးထားသော ဘဝနေထိုင်မှု စစ်တမ်း",
    heroTitle: "ငါ့အတွက် အရေးကြီးသည်မှာ...",
    heroDesc:  "နယ်ပယ်တစ်ခုချင်းစီအတွက် ၁ မှ ၁၀ အထိ ရွေးချယ်ပေးပါ။",
    step1:     "အဆင့် ၁ — တန်ဖိုး",
    step2:     "အဆင့် ၂ — လုပ်ဆောင်မှု",
    axisL:     "မဖြစ်သလောက်",
    axisR:     "အမြဲနီးပါး",
    na:        "မသက်ဆိုင်",
    disabled:  "မသက်ဆိုင်သည့် အရာ။",
    next:      "ဆက်လက်",
    submit:    "ရလဒ်ကြည့်မည်",
    retry:     "ထပ်မံလုပ်ဆောင်မည်",
    r1:        "အကောင်းဆုံး တန်ဖိုးထားသော နယ်ပယ်",
    r2:        "တန်ဖိုးထား၍ လုပ်ဆောင်မှု နည်းသောနယ်ပယ်",
    r3:        "ဘဝအရည်အသွေး စုစုပေါင်း",
    none:      "မရှိ",
    questions: [
      "မိသားစု",
      "အိမ်ထောင်ရေး / ရင်းနှီးသောဆက်ဆံရေး",
      "မိဘတာဝန်ယူခြင်း",
      "သူငယ်ချင်းများ",
      "အလုပ်",
      "ပညာရေး / လေ့ကျင့်ရေး",
      "အပန်းဖြေ / ပျော်ရွှင်မှု",
      "စိတ်ဓာတ်ရေးရာ / ဘာသာရေး",
      "ရပ်ရွာလူမှုဘဝ",
      "ကိုယ်ကာယထိန်းသိမ်းမှု",
      "သဘာဝပတ်ဝန်းကျင်",
      "အနုပညာ / ဖန်တီးမှု",
    ],
    short: ["မိသားစု","အိမ်ထောင်","မိဘ","သူငယ်ချင်း","အလုပ်","ပညာ","အပန်းဖြေ","စိတ်ဓာတ်","ရပ်ရွာ","ကိုယ်ထိန်း","သဘာဝ","အနုပညာ"],
  },
};

// 0, 2번 인덱스는 "해당없음" 선택 가능
const NA_IDX = [0, 2];

// ────────────────────────────────────────────────
// Score row component
// ────────────────────────────────────────────────

function ScoreRow({
  name,
  value,
  onChange,
  axisL,
  axisR,
}: {
  name: string;
  value: number | null;
  onChange: (v: number) => void;
  axisL: string;
  axisR: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className={`flex h-8 w-full min-w-0 items-center justify-center rounded-full border text-[11px] transition ${
              value === score
                ? "border-gray-900 bg-gray-900 font-medium text-white"
                : "border-gray-200 bg-white text-gray-500 hover:border-gray-400 hover:text-gray-900"
            }`}
          >
            {score}
          </button>
        ))}
      </div>
      <div className="flex justify-between px-0.5 text-[10px] text-gray-400">
        <span>{axisL}</span>
        <span>{axisR}</span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Result view
// ────────────────────────────────────────────────

function ResultView({
  lang,
  imp,
  com,
  onRetry,
}: {
  lang: Lang;
  imp: (number | null)[];
  com: (number | null)[];
  onRetry: () => void;
}) {
  const t = T[lang];

  const scored = t.questions.map((q, i) => {
    const iv = imp[i] ?? 0;
    const isNAval = NA_IDX.includes(i) && iv === 0;
    return { label: q, short: t.short[i], imp: iv, com: isNAval ? 0 : (com[i] ?? 0) };
  });

  const fb1 = scored.filter((x) => x.imp >= 9).sort((a, b) => b.imp - a.imp);
  const fb2 = scored.filter((x) => x.imp >= 9 && x.com <= 6).sort((a, b) => b.imp - a.imp);
  const score = (scored.reduce((s, x) => s + x.imp * x.com, 0) / 12).toFixed(2);

  return (
    <div className="flex flex-col gap-5">
      {/* Score hero */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
        <p className="mb-1 text-xs text-gray-400">{t.r3}</p>
        <p className="text-5xl font-bold tracking-tight text-gray-900">{score}</p>
        <p className="mt-1 text-sm text-gray-400">/ 100</p>
      </div>

      {/* Feedback 1 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="mb-3 text-xs font-medium text-gray-500">{t.r1}</p>
        <div className="flex flex-wrap gap-2">
          {fb1.length
            ? fb1.map((x) => (
                <span key={x.label} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700">
                  {x.label}
                </span>
              ))
            : <span className="text-xs text-gray-400">{t.none}</span>}
        </div>
      </div>

      {/* Feedback 2 */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <p className="mb-3 text-xs font-medium text-gray-500">{t.r2}</p>
        <div className="flex flex-wrap gap-2">
          {fb2.length
            ? fb2.map((x) => (
                <span key={x.label} className="rounded-full border border-gray-900 bg-gray-900 px-3 py-1 text-xs text-white">
                  {x.label}
                </span>
              ))
            : <span className="text-xs text-gray-400">{t.none}</span>}
        </div>
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="w-full rounded-xl border border-gray-200 bg-white py-3 text-sm text-gray-500 transition hover:border-gray-300 hover:text-gray-900"
      >
        {t.retry}
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────

export default function VLQPage() {
  const searchParams = useSearchParams();
  const isEmbedded = searchParams.get("embed") === "1";
  const [lang, setLang] = useState<Lang>("ko");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [imp, setImp] = useState<(number | null)[]>(Array(12).fill(null));
  const [com, setCom] = useState<(number | null)[]>(Array(12).fill(null));

  const t = T[lang];
  const isImp = step === 1;
  const arr = isImp ? imp : com;
  const setArr = isImp ? setImp : setCom;

  function pick(idx: number, val: number) {
    setArr((prev) => prev.map((v, i) => (i === idx ? val : v)));
  }

  function pickNA(idx: number) {
    setImp((prev) => prev.map((v, i) => (i === idx ? (v === 0 ? null : 0) : v)));
  }

  function reset() {
    setImp(Array(12).fill(null));
    setCom(Array(12).fill(null));
    setStep(1);
  }

  function switchLang(l: Lang) {
    setLang(l);
    reset();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top nav ── */}
      {!isEmbedded && (
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
          <span className="text-xs font-medium text-gray-700">가치 명료화 (VLQ)</span>
        </div>
      </div>
      )}

      <div className={`mx-auto max-w-2xl ${isEmbedded ? "px-2 py-3" : "px-4 py-8"}`}>

        {step === 3 ? (
          <>
            {/* Lang selector on result too */}
            <div className="mb-6 flex gap-2">
              {(["ko", "en", "my"] as Lang[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => switchLang(l)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    lang === l
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-400"
                  }`}
                >
                  {l === "ko" ? "한국어" : l === "en" ? "English" : "မြန်မာ"}
                </button>
              ))}
            </div>
            <ResultView lang={lang} imp={imp} com={com} onRetry={reset} />
          </>
        ) : (
          <>
            {/* ── Header block ── */}
            <div className="mb-6 rounded-xl bg-gray-900 px-6 py-5 text-white">
              <div className="mb-4 flex gap-2">
                {(["ko", "en", "my"] as Lang[]).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => switchLang(l)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      lang === l
                        ? "border-white bg-white text-gray-900"
                        : "border-white/30 text-white/70 hover:border-white/60 hover:text-white"
                    }`}
                  >
                    {l === "ko" ? "한국어" : l === "en" ? "English" : "မြန်မာ"}
                  </button>
                ))}
              </div>
              <h1 className="mb-1 text-xl font-bold">{t.heroTitle}</h1>
              <p className="text-sm leading-relaxed text-white/70">{t.heroDesc}</p>
            </div>

            {/* ── Step label ── */}
            <p className="mb-4 text-xs font-medium uppercase tracking-wider text-gray-400">
              {isImp ? t.step1 : t.step2}
            </p>

            {/* ── Questions ── */}
            <div className="flex flex-col gap-3">
              {t.questions.map((q, i) => {
                const isNA = NA_IDX.includes(i);
                const naSelected = isNA && imp[i] === 0;
                const disabled = !isImp && isNA && imp[i] === 0;
                const v = arr[i];

                return (
                  <div
                    key={i}
                    className={`rounded-xl border bg-white p-5 transition ${
                      disabled ? "opacity-40" : "border-gray-200"
                    }`}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-gray-800">
                        <span className="mr-2 text-gray-300">{i + 1}.</span>
                        {q}
                      </p>
                      {isImp && isNA && (
                        <button
                          type="button"
                          onClick={() => pickNA(i)}
                          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] transition ${
                            naSelected
                              ? "border-gray-900 bg-gray-900 text-white"
                              : "border-gray-200 text-gray-400 hover:border-gray-400"
                          }`}
                        >
                          {t.na}
                        </button>
                      )}
                    </div>

                    {disabled ? (
                      <p className="text-xs italic text-gray-400">{t.disabled}</p>
                    ) : (
                      <div className={naSelected ? "pointer-events-none opacity-30" : ""}>
                        <ScoreRow
                          name={`q${step}_${i}`}
                          value={v}
                          onChange={(val) => pick(i, val)}
                          axisL={t.axisL}
                          axisR={t.axisR}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Next button ── */}
            <button
              type="button"
              onClick={() => setStep(step === 1 ? 2 : 3)}
              className="mt-6 w-full rounded-xl bg-gray-900 py-3.5 text-sm font-medium text-white transition hover:opacity-85"
            >
              {step === 2 ? t.submit : t.next}
            </button>
          </>
        )}
      </div>
    </div>
  );
}