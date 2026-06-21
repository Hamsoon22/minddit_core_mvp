import Image from "next/image";
import Link from "next/link";
import { NOTICE_ITEMS } from "@/lib/notices";

export default function NoticesPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Image
          src="/icon_notice.png"
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 shrink-0 object-contain"
          aria-hidden="true"
        />
        <h1 className="text-[1.7rem] font-bold text-gray-900">공지 게시판</h1>
      </div>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <ul className="divide-y divide-gray-100">
          {NOTICE_ITEMS.map((item) => (
            <li key={item.id}>
              <Link
                href={`/notices/${item.id}`}
                className="flex items-center gap-3 px-5 py-4 transition hover:bg-gray-50"
              >
                <span className={`inline-flex h-2.5 w-2.5 rounded-full ${item.unread ? "bg-gray-300" : "bg-[#C54646]"}`} />
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-gray-900">{item.title}</span>
                  <span className="mt-1 block text-xs text-gray-500">{item.source} · {item.createdAt}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
