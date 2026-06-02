import { mockContentBlocks } from "@/lib/mock";

const TYPE_LABEL: Record<string, string> = {
  CHECKIN: "체크인", POLL: "설문", JOURNAL: "저널", MEDITATION: "명상",
  BREATHING: "호흡", MOVEMENT: "동작", VIDEO: "영상", DISCUSSION: "토론",
};

export default function LibraryPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">콘텐츠 관리</h1>
        <p className="mt-2 text-sm text-gray-500">
          콘텐츠 라이브러리를 탐색하고 프로그램에 활용할 자료를 관리하세요.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockContentBlocks.map((c) => (
          <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <span className="text-xs font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
              {TYPE_LABEL[c.type] ?? c.type}
            </span>
            <h3 className="font-semibold text-gray-900 mt-2 mb-1 text-sm">{c.title}</h3>
            {c.description && <p className="text-xs text-gray-500 line-clamp-2">{c.description}</p>}
            <p className="text-xs text-gray-400 mt-3">{c.durationMin}분</p>
          </div>
        ))}
      </div>
    </div>
  );
}
