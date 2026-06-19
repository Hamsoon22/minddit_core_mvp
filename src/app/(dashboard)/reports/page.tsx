import Image from "next/image";

export default function ReportsPage() {
  return (
    <div>
      <div className="dashboard-sticky-header mb-6 flex items-center gap-3">
        <Image
          src="/icon_setting.png"
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 shrink-0 object-contain"
          aria-hidden="true"
        />
        <h1 className="text-[1.7rem] font-bold text-gray-900">리포트</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400 text-sm">
        세션 데이터가 쌓이면 통계가 여기에 표시됩니다.
      </div>
    </div>
  );
}
