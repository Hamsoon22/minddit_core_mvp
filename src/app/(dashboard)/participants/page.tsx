import { mockSessions } from "@/lib/mock";
import Link from "next/link";

export default function ParticipantsPage() {
  const participants = mockSessions.flatMap(s =>
    s.participants.map(p => ({ ...p, sessionTitle: s.title }))
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">참여자 관리</h1>
          <p className="mt-2 text-sm text-gray-500">
            참여자 현황과 참여 상태를 확인하고 관리하세요.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="알림"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M15 17H9M17 8C17 6.67392 16.4732 5.40215 15.5355 4.46447C14.5979 3.52678 13.3261 3 12 3C10.6739 3 9.40215 3.52678 8.46447 4.46447C7.52678 5.40215 7 6.67392 7 8C7 10.5772 6.34829 12.2684 5.62047 13.3333C5.00778 14.2296 4.70144 14.6777 4.7118 14.8023C4.72328 14.9405 4.75253 14.9936 4.86071 15.0804C4.95822 15.1586 5.45062 15.1586 6.43542 15.1586H17.5646C18.5494 15.1586 19.0418 15.1586 19.1393 15.0804C19.2475 14.9936 19.2767 14.9405 19.2882 14.8023C19.2986 14.6777 18.9922 14.2296 18.3795 13.3333C17.6517 12.2684 17 10.5772 17 8Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.73 21C13.5542 21.3031 13.3018 21.5546 12.9982 21.7295C12.6946 21.9044 12.3503 21.9966 12 21.9966C11.6497 21.9966 11.3054 21.9044 11.0018 21.7295C10.6982 21.5546 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <Link href="/participants/new" className="inline-flex h-10 items-center rounded-lg bg-[#485763] px-4 text-sm font-medium text-white transition hover:bg-[#3f4c56]">
            + 새 참여자
          </Link>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {participants.map((p) => (
          <Link key={p.id} href={`/participants/${p.id}`}
            className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-700 font-medium text-sm">{p.name[0]}</div>
              <div>
                <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                <p className="text-xs text-gray-400">{p.sessionTitle}</p>
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${p.attended ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {p.attended ? "참여완료" : "미참여"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
