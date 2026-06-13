"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// ────────────────────────────────────────────────
// Types & constants
// ────────────────────────────────────────────────

type Lang = "ko" | "en" | "my";

const T: Record<Lang, {
  title: string; heroTitle: string; heroDesc: string;
  submit: string; retry: string;
  labels: string[];
  questions: string[];
  sub: { exhaustion: string; depersonal: string; efficacy: string };
}> = {
  ko: {
    title: "MBI GS 설문지",
    heroTitle: "나는 직무에서…",
    heroDesc: "다음 질문에 0에서 6 사이의 점수로 답해주세요.",
    submit: "결과 보기", retry: "다시하기",
    labels: ["전혀없다","1년에 2-3회 또는 그 미만","한 달에 한 번 또는 그 미만","한 달에 2-3회","일주일에 1회 정도","일주일에 2-3회","매일"],
    questions: [
      "맡은 일을 하는 데 있어서 정서적으로 고갈된 느낌이 든다.",
      "일을 마치고 퇴근할 때쯤이면 기진맥진한 느낌이 든다.",
      "아침에 일어나서 다시 출근할 생각을 하면 피곤한 느낌이 든다.",
      "하루 종일 일하는 것은 나를 긴장시킨다.",
      "나는 직무상 발생하는 문제들을 효과적으로 해결한다.",
      "일 때문에 소진된 상태이다.",
      "직장에 효과적인 기여를 하고 있다고 느낀다.",
      "이 일을 시작한 이후로 내 일에 대한 관심이 줄었다.",
      "맡은 일을 하는데 있어서 소극적이 되었다.",
      "내가 생각할 때, 나는 일을 잘한다.",
      "직무상 무언가를 성취했을 때 기쁨을 느낀다.",
      "나는 현재의 직무에서 가치 있는 많은 것을 이루어왔다.",
      "나는 방해받지 않고 내 일을 수행하기 원할 뿐이다.",
      "내 일이 무언가에 기여하든 말든 나는 점점 더 냉소적이 되었다.",
      "내 일의 중요성이 의심스럽다.",
      "나는 일을 효과적으로 처리하고 있다는 자신감이 있다.",
    ],
    sub: { exhaustion: "소진", depersonal: "비인격화", efficacy: "효능감" },
  },
  en: {
    title: "MBI GS Survey",
    heroTitle: "In my work…",
    heroDesc: "Please respond using a score from 0 to 6.",
    submit: "See Results", retry: "Try Again",
    labels: ["Never","A few times a year or less","Once a month or less","A few times a month","Once a week","A few times a week","Every day"],
    questions: [
      "I feel emotionally drained from my work.",
      "I feel used up at the end of the workday.",
      "I feel tired when I get up in the morning and have to face another day on the job.",
      "Working all day is really a strain for me.",
      "I can effectively solve the problems that arise in my work.",
      "I feel burned out from my work.",
      "I feel I am making an effective contribution to what this organization does.",
      "I have become less interested in my work since I started this job.",
      "I have become less enthusiastic about my work.",
      "In my opinion, I am good at my job.",
      "I feel exhilarated when I accomplish something at work.",
      "I have accomplished many worthwhile things in this job.",
      "I just want to do my job and not be bothered.",
      "I have become more cynical about whether my work contributes anything.",
      "I doubt the significance of my work.",
      "At my work, I feel confident that I am effective at getting things done.",
    ],
    sub: { exhaustion: "Exhaustion", depersonal: "Depersonalization", efficacy: "Efficacy" },
  },
  my: {
    title: "MBI GS စစ်တမ်း",
    heroTitle: "ကျွန်ုပ်၏အလုပ်တွင်…",
    heroDesc: "အောက်ဖော်ပြပါမေးခွန်းများကို ၀ မှ ၆ အထိ အမှတ်ပေးပါ။",
    submit: "ရလဒ်ကြည့်မည်", retry: "ထပ်မံလုပ်ဆောင်မည်",
    labels: ["လုံးဝမရှိပါ","တစ်နှစ်လျှင် အနည်းငယ် သို့မဟုတ် ပိုနည်းပါးသည်","တစ်လလျှင် တစ်ကြိမ် သို့မဟုတ် ပိုနည်းပါးသည်","တစ်လလျှင် အကြိမ်အနည်းငယ်","တစ်ပတ်လျှင် တစ်ကြိမ်","တစ်ပတ်လျှင် အနည်းငယ်","နေ့စဉ်"],
    questions: [
      "ကျွန်ုပ်၏အလုပ်ကြောင့် စိတ်ပိုင်းဆိုင်ရာ ကုန်ခန်းနေသည်ဟု ခံစားရသည်။",
      "အလုပ်ပြီးဆုံးချိန်တွင် အင်အားကုန်ခန်းသွားသည်ဟု ခံစားရသည်။",
      "နောက်ရက်တွင် အလုပ်တစ်ခုကို ရင်ဆိုင်ရမည်ဖြစ်၍ နံနက်အိပ်ယာထချိန်တွင်ပင် ပင်ပန်းသည်ဟု ခံစားရသည်။",
      "တစ်နေကုန် အလုပ်လုပ်ရခြင်းသည် ကျွန်ုပ်အတွက် အလွန်ဖိစီးပင်ပန်းစေသည်။",
      "ကျွန်ုပ်၏အလုပ်တွင် ဖြစ်ပေါ်လာသော ပြဿနာများကို ထိထိရောက်ရောက် ဖြေရှင်းနိုင်သည်။",
      "ကျွန်ုပ်၏အလုပ်ကြောင့် အလွန်အမင်းပင်ပန်းနွမ်းနယ်နေသည်ဟု ခံစားရသည်။",
      "ဤအဖွဲ့အစည်း၏ လုပ်ဆောင်ချက်များတွင် ကျွန်ုပ်ထိရောက်စွာ ပံ့ပိုးကူညီနေသည်ဟု ခံစားရသည်။",
      "ဤအလုပ်ကို စတင်လုပ်ကိုင်ပြီးနောက် ကျွန်ုပ်၏အလုပ်အပေါ် စိတ်ဝင်စားမှု လျော့နည်းလာသည်။",
      "ကျွန်ုပ်၏အလုပ်အပေါ် စိတ်အားထက်သန်မှု လျော့နည်းလာသည်။",
      "ကျွန်ုပ်၏ထင်မြင်ချက်အရ ကျွန်ုပ်သည် ကျွန်ုပ်၏အလုပ်တွင် ကောင်းမွန်စွာလုပ်ဆောင်နိုင်သည်။",
      "အလုပ်တွင် တစ်စုံတစ်ရာ ပြီးမြောက်အောင်မြင်သောအခါ ကျွန်ုပ်ပျော်ရွှင်စိတ်လှုပ်ရှားမှုကို ခံစားရသည်။",
      "ဤအလုပ်တွင် အဖိုးတန်သော အရာများစွာကို ကျွန်ုပ်ပြီးမြောက်အောင်မြင်ခဲ့ပြီ။",
      "ကျွန်ုပ်သည် ကျွန်ုပ်၏အလုပ်ကိုသာ လုပ်လိုပြီး အနှောင့်အယှက်မခံလိုပါ။",
      "ကျွန်ုပ်၏အလုပ်က တစ်စုံတစ်ရာ အထောက်အကူပြုခြင်းရှိမရှိအပေါ် ပိုမိုသံသယဝင်လာသည်။",
      "ကျွန်ုပ်၏အလုပ်၏ အရေးပါမှုကို သံသယရှိသည်။",
      "ကျွန်ုပ်၏အလုပ်တွင် ကိစ္စရပ်များကို ထိထိရောက်ရောက် လုပ်ဆောင်နိုင်သည်ဟု ယုံကြည်မှုရှိသည်။",
    ],
    sub: { exhaustion: "ပင်ပန်းနွမ်းနယ်မှု", depersonal: "မတည်ကြည်မှု", efficacy: "ထိရောက်မှု" },
  },
};

// 하위척도 문항 인덱스 (0-based)
const EXHAUSTION_IDX  = [0, 1, 2, 3, 5];
const DEPERSONAL_IDX  = [7, 8, 12, 13, 14];
const EFFICACY_IDX    = [4, 6, 9, 10, 11, 15];

// T점수 파라미터
const TP = {
  exhaustion:  { mean: 2.26, sd: 1.47 },
  depersonal:  { mean: 1.74, sd: 1.36 },
  efficacy:    { mean: 4.34, sd: 1.17 },
};

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────

function mean(indices: number[], responses: (number | null)[]): number {
  return indices.reduce((s, i) => s + (responses[i] ?? 0), 0) / indices.length;
}

function calcT(val: number, m: number, sd: number): number {
  return Math.round(50 + 10 * ((val - m) / sd));
}

function tLabel(t: number): { label: string; color: string } {
  if (t >= 70) return { label: "매우 높음", color: "text-red-600" };
  if (t >= 60) return { label: "높음",      color: "text-orange-500" };
  if (t >= 40) return { label: "평균",      color: "text-gray-600" };
  return              { label: "낮음",      color: "text-blue-500" };
}

// ────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────

function RadioCol({
  index, value, labels, onChange,
}: {
  index: number; value: number | null; labels: string[]; onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {labels.map((lbl, i) => (
        <label
          key={i}
          className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3.5 py-2.5 text-xs text-gray-600 transition hover:border-gray-400 hover:bg-gray-50 has-[:checked]:border-[#292929] has-[:checked]:bg-[#292929] has-[:checked]:text-white"
        >
          <input
            type="radio"
            name={`q${index}`}
            value={i}
            checked={value === i}
            onChange={() => onChange(i)}
            className="hidden"
          />
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-current">
            {value === i && <span className="h-2 w-2 rounded-full bg-current" />}
          </span>
          <span className="text-[10px] font-medium opacity-50 w-3 shrink-0">{i}</span>
          {lbl}
        </label>
      ))}
    </div>
  );
}

function ScoreCard({
  label, meanVal, t, desc,
}: {
  label: string; meanVal: number; t: number; desc: string;
}) {
  const { label: lvl, color } = tLabel(t);
  const pct = Math.min(100, Math.max(0, ((t - 20) / 80) * 100));
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-800">{label}</span>
        <span className={`text-sm font-bold ${color}`}>T = {t}</span>
      </div>
      <p className="mb-2 text-xs text-gray-400">{desc} — 평균 {meanVal.toFixed(2)}</p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-gray-900 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <p className={`mt-1.5 text-right text-xs font-medium ${color}`}>{lvl}</p>
    </div>
  );
}

// ────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────

export default function BurnoutPage() {
  const searchParams = useSearchParams();
  const isEmbedded = searchParams.get("embed") === "1";
  const [lang, setLang] = useState<Lang>("ko");
  const [responses, setResponses] = useState<(number | null)[]>(Array(16).fill(null));
  const [submitted, setSubmitted] = useState(false);

  const t = T[lang];
  const allAnswered = responses.every((v) => v !== null);

  function pick(idx: number, val: number) {
    setResponses((prev) => prev.map((v, i) => (i === idx ? val : v)));
  }

  function switchLang(l: Lang) {
    setLang(l);
    setResponses(Array(16).fill(null));
    setSubmitted(false);
  }

  function reset() {
    setResponses(Array(16).fill(null));
    setSubmitted(false);
  }

  const exMean = mean(EXHAUSTION_IDX, responses);
  const dpMean = mean(DEPERSONAL_IDX, responses);
  const efMean = mean(EFFICACY_IDX,   responses);
  const exT = calcT(exMean, TP.exhaustion.mean,  TP.exhaustion.sd);
  const dpT = calcT(dpMean, TP.depersonal.mean,  TP.depersonal.sd);
  const efT = calcT(efMean, TP.efficacy.mean,    TP.efficacy.sd);

  const langBtns: { code: Lang; label: string }[] = [
    { code: "ko", label: "한국어" },
    { code: "en", label: "English" },
    { code: "my", label: "မြန်မာ" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      {!isEmbedded && (
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link href="/library" className="flex items-center gap-1.5 text-xs text-gray-400 transition hover:text-gray-700">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            라이브러리
          </Link>
          <span className="text-gray-200">/</span>
          <span className="text-xs font-medium text-gray-700">번아웃 척도 (MBI-GS)</span>
        </div>
      </div>
      )}

      <div className={`mx-auto max-w-2xl ${isEmbedded ? "px-2 py-3" : "px-4 py-8"}`}>
        {!submitted ? (
          <>
            {/* Header block */}
            <div className="mb-6 rounded-lg -translate-y-[2px] bg-[#ffffff] px-6 py-5 text-[#292929]">
              {/* Lang selector */}
              <div className="mb-4 flex gap-2">
                {langBtns.map(({ code, label }) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => switchLang(code)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      lang === code
                        ? "border-[#292929] bg-[#292929] text-white"
                        : "border-gray-300 text-gray-600 hover:border-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <h1 className="mb-1 text-xl font-bold">{t.heroTitle}</h1>
              <p className="text-sm leading-relaxed text-[#4B4B4B]">{t.heroDesc}</p>
              <p className="mt-1.5 text-xs text-gray-500">
                0 — {t.labels[0]} &nbsp;·&nbsp; 6 — {t.labels[6]}
              </p>
            </div>

            {/* Questions */}
            <div className="flex flex-col gap-3">
              {t.questions.map((q, i) => (
                <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
                  <p className="mb-4 text-sm font-medium text-gray-800">
                    <span className="mr-2 text-gray-300">{i + 1}.</span>
                    {q}
                  </p>
                  <RadioCol index={i} value={responses[i]} labels={t.labels} onChange={(v) => pick(i, v)} />
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={!allAnswered}
              onClick={() => setSubmitted(true)}
              className="mt-6 w-full rounded-xl bg-gray-900 py-3.5 text-sm font-medium text-white transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {t.submit}
            </button>
            {!allAnswered && (
              <p className="mt-2 text-center text-xs text-gray-400">모든 문항에 응답해야 결과를 볼 수 있습니다.</p>
            )}
          </>
        ) : (
          <>
            {/* Result header */}
            <div className="mb-6 rounded-lg -translate-y-[2px] bg-[#ffffff] px-6 py-5 text-[#292929]">
              <div className="mb-3 flex gap-2">
                {langBtns.map(({ code, label }) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => switchLang(code)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      lang === code
                        ? "border-[#292929] bg-[#292929] text-white"
                        : "border-gray-300 text-gray-600 hover:border-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <h1 className="mb-1 text-xl font-bold">{t.title} 결과</h1>
              <p className="text-sm text-[#4B4B4B]">T점수 기준 (평균=50, SD=10)</p>
            </div>

            <div className="flex flex-col gap-3">
              <ScoreCard
                label={t.sub.exhaustion}
                meanVal={exMean}
                t={exT}
                desc="정서적 고갈 수준"
              />
              <ScoreCard
                label={t.sub.depersonal}
                meanVal={dpMean}
                t={dpT}
                desc="냉소·비인격화 수준"
              />
              <ScoreCard
                label={t.sub.efficacy}
                meanVal={efMean}
                t={efT}
                desc="직무 효능감 (낮을수록 번아웃 위험)"
              />
            </div>

            <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-2 text-xs font-medium text-gray-500">T점수 해석 기준</p>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                <span><span className="font-medium text-blue-500">~39</span> 낮음</span>
                <span><span className="font-medium text-gray-600">40–59</span> 평균</span>
                <span><span className="font-medium text-orange-500">60–69</span> 높음</span>
                <span><span className="font-medium text-red-600">70+</span> 매우 높음</span>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                * 효능감은 점수가 낮을수록 번아웃 위험이 높습니다.
              </p>
            </div>

            <button
              type="button"
              onClick={reset}
              className="mt-4 w-full rounded-xl border border-gray-200 bg-white py-3 text-sm text-gray-500 transition hover:border-gray-300 hover:text-gray-900"
            >
              {t.retry}
            </button>
          </>
        )}
      </div>

      {!isEmbedded && (
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
      )}
    </div>
  );
}