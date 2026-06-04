import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { mockSessions } from "@/lib/mock";
import SchedulePanel from "@/components/dashboard/SchedulePanel";
import RandomQuoteBlock from "@/components/dashboard/RandomQuoteBlock";

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

const statusLabel: Record<string, string> = {
  DRAFT: "초안",
  SCHEDULED: "예정",
  ACTIVE: "진행중",
  COMPLETED: "완료",
};

const statusColor: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SCHEDULED: "bg-blue-50 text-blue-700",
  ACTIVE: "bg-green-50 text-green-700",
  COMPLETED: "bg-gray-50 text-gray-500",
};

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
  const totalSessions = mockSessions.length;
  const scheduledSessions = mockSessions.filter((s) => s.status === "SCHEDULED");
  const totalParticipants = mockSessions.reduce(
    (sum, s) => sum + s._count.participants,
    0
  );

  const displayName = (session?.user?.name ?? "데모")
    .replace(/\s*전문가$/, "")
    .trim() || "데모";
  const selectedQuoteIndex = quotes.length > 0
    ? Math.floor(Math.random() * quotes.length)
    : 0;

  return (
    <div className="space-y-8">
      <section className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-medium text-gray-900">
            <span className="font-bold">{displayName} 전문가님,</span>  반갑습니다.
          </h1>
          <RandomQuoteBlock quotes={quotes} selectedIndex={selectedQuoteIndex} />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="알림"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M15 17H9M17 8C17 6.67392 16.4732 5.40215 15.5355 4.46447C14.5979 3.52678 13.3261 3 12 3C10.6739 3 9.40215 3.52678 8.46447 4.46447C7.52678 5.40215 7 6.67392 7 8C7 10.5772 6.34829 12.2684 5.62047 13.3333C5.00778 14.2296 4.70144 14.6777 4.7118 14.8023C4.72328 14.9405 4.75253 14.9936 4.86071 15.0804C4.95822 15.1586 5.45062 15.1586 6.43542 15.1586H17.5646C18.5494 15.1586 19.0418 15.1586 19.1393 15.0804C19.2475 14.9936 19.2767 14.9405 19.2882 14.8023C19.2986 14.6777 18.9922 14.2296 18.3795 13.3333C17.6517 12.2684 17 10.5772 17 8Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13.73 21C13.5542 21.3031 13.3018 21.5546 12.9982 21.7295C12.6946 21.9044 12.3503 21.9966 12 21.9966C11.6497 21.9966 11.3054 21.9044 11.0018 21.7295C10.6982 21.5546 10.4458 21.3031 10.27 21"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <Link
            href="/sessions/new"
            className="inline-flex h-10 items-center rounded-lg bg-[#485763] px-4 text-sm font-medium text-white hover:bg-[#3f4c56]"
          >
            + 새 프로그램
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard
          title="전체 프로그램"
          value={totalSessions}
          href="/sessions"
          variant="filled"
        />
        <SummaryCard
          title="전체 참여자"
          value={totalParticipants}
          href="/participants"
          variant="filled"
        />
        <SummaryCard
          title="프로그램 진행(예정)"
          value={scheduledSessions.length}
          href="/sessions"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
        <div className="h-full rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">최근 프로그램</h2>
            <Link href="/sessions" className="text-sm text-gray-400 hover:text-gray-700">
              전체 보기
            </Link>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">프로그램명</th>
                  <th className="w-24 px-4 py-3 text-center font-medium">상태</th>
                  <th className="w-24 px-4 py-3 text-center font-medium">참여자</th>
                  <th className="px-4 py-3 font-medium">일자</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {mockSessions.slice(0, 6).map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 align-middle">
                      <Link
                        href={`/sessions/${s.id}`}
                        className="font-medium text-gray-800 hover:text-gray-600"
                      >
                        {s.title}
                      </Link>
                    </td>
                    <td className="w-24 px-4 py-4 align-middle text-center">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="w-24 px-4 py-4 align-middle text-center text-gray-500">
                      {s._count.participants}명
                    </td>
                    <td className="px-4 py-4 align-middle text-gray-500">
                      {s.scheduledAt
                        ? new Date(s.scheduledAt).toLocaleDateString("ko-KR")
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <SchedulePanel sessions={mockSessions} />
      </section>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  href,
  variant = "default",
}: {
  title: string;
  value: number;
  href: string;
  variant?: "default" | "filled";
}) {
  const filled = variant === "filled";

  return (
    <Link
      href={href}
      className={filled
        ? "rounded-xl border border-[#292929] bg-gradient-to-b from-[#485763] to-[#292929] p-5 transition-opacity hover:opacity-85"
        : "rounded-xl border border-gray-200 bg-white p-5 transition hover:border-gray-300 hover:shadow-sm"
      }
    >
      <div className="flex items-center justify-between gap-3">
        <p className={filled ? "text-sm text-white" : "text-sm text-gray-500"}>{title}</p>
        <span className={filled ? "text-white" : "text-gray-400"} aria-hidden="true">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 6L15 12L9 18"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
      <p className={filled ? "mt-3 text-3xl font-extrabold text-white" : "mt-3 text-3xl font-extrabold text-gray-900"}>{value}</p>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label = statusLabel[status] ?? "진행중";
  const colorClass = statusColor[status] ?? "bg-gray-100 text-gray-600";

  return (
    <span className={`inline-flex min-w-[56px] justify-center rounded-full px-2.5 py-1 text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}