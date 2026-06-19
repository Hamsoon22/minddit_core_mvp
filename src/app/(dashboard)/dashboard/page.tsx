import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import RandomQuoteBlock from "@/components/dashboard/RandomQuoteBlock";
import ProgramOverviewSection from "@/components/dashboard/ProgramOverviewSection";
import HomeGreeting from "@/components/dashboard/HomeGreeting";
import HomeNotificationMenu from "@/components/dashboard/HomeNotificationMenu";

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1BvQjBJpyiSR-VipF4fj3nDzSY2vA4RXfIb3GUTwKllk/gviz/tq?tqx=out:csv&sheet=Sheet1";

const FALLBACK_QUOTES = [
  {
    lines: [
      "인생이라는 숲을 울창하게 가꾸려면 하루하루 어떤 씨앗을 심었는지가 중요하다.",
      "오늘 씨앗 심기를 멈추지 않아야 작은 비바람에도 쓰러지지 않는 숲을 만들 수 있다.",
    ],
    source: "-회복탄력성 中-",
  },
  {
    lines: [
      "끝까지 살아남는 사람은 한 번도 꺾이지 않는 사람이 아니라,",
      "꺾이더라도 유연하게 다시 일어서는 사람이다.",
    ],
    source: "-회복탄력성 中-",
  },
  {
    lines: ["아주 소소한 일이 모여 건강한 보통의 일상을 만든다."],
    source: "-회복탄력성 中-",
  },
];

type Quote = {
  lines: string[];
  source: string;
};

function parseCsvLine(line: string) {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  fields.push(current.trim());
  return fields;
}

function parseQuotesFromCsv(csvText: string): Quote[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const bodyIndex = headers.indexOf("body");
  const sourceIndex = headers.indexOf("source");

  if (bodyIndex < 0 || sourceIndex < 0) return [];

  return lines
    .slice(1)
    .map(parseCsvLine)
    .map((row) => {
      const body = row[bodyIndex]?.trim();
      const source = row[sourceIndex]?.trim();
      if (!body || !source) return null;

      return {
        lines: body
          .split(/\s*(?:\n|\.\s+)/)
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => (line.endsWith(".") ? line : `${line}.`)),
        source,
      } as Quote;
    })
    .filter((quote): quote is Quote => Boolean(quote));
}

async function getQuotes(): Promise<Quote[]> {
  try {
    const response = await fetch(SHEET_CSV_URL, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return FALLBACK_QUOTES;
    }

    const csvText = await response.text();
    const parsed = parseQuotesFromCsv(csvText);
    return parsed.length > 0 ? parsed : FALLBACK_QUOTES;
  } catch {
    return FALLBACK_QUOTES;
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const quotes = await getQuotes();

  const fallbackName = (session?.user?.name ?? "서윤희")
    .replace(/\s*전문가$/, "")
    .trim() || "서윤희";
  const selectedQuoteIndex = quotes.length > 0
    ? Math.floor(Math.random() * quotes.length)
    : 0;

  return (
    <div className="space-y-4">
      <section className="dashboard-sticky-header-compact flex items-start justify-between gap-6">
        <div>
          <HomeGreeting fallbackName={fallbackName} />
        </div>

        <div className="flex items-center gap-3">
          <HomeNotificationMenu />

          <Link
            href="/sessions/new"
            className="ml-2 inline-flex h-10 items-center justify-center rounded-lg bg-[#292929] px-4 text-sm font-medium text-white hover:bg-[#1f1f1f]"
          >
            + 새 프로그램
          </Link>
        </div>
      </section>

      <div className="space-y-1">
        <RandomQuoteBlock quotes={quotes} selectedIndex={selectedQuoteIndex} />
      </div>

      <ProgramOverviewSection />
    </div>
  );
}
