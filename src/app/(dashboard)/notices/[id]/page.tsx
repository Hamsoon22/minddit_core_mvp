import Link from "next/link";
import { notFound } from "next/navigation";
import { getNoticeById } from "@/lib/notices";

type NoticeDetailPageProps = {
  params: {
    id: string;
  };
};

export default function NoticeDetailPage({ params }: NoticeDetailPageProps) {
  const notice = getNoticeById(params.id);

  if (!notice) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link
          href="/notices"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-xl font-semibold leading-none text-gray-900 hover:bg-gray-50"
          aria-label="뒤로 가기"
        >
          ←
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">공지 게시판</h1>
      </div>

      <article className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 border-b border-gray-100 pb-4">
          <p className="mb-2 inline-flex rounded-full bg-[#DDEFF9] px-2.5 py-1 text-xs font-semibold text-[#0688D3]">
            {notice.category}
          </p>
          <h2 className="text-xl font-bold text-gray-900">{notice.title}</h2>
          <p className="mt-2 text-sm text-gray-500">{notice.source} · {notice.createdAt}</p>
        </div>

        <p className="whitespace-pre-line text-sm leading-7 text-gray-700">{notice.content}</p>
      </article>
    </div>
  );
}
