export default function NewParticipantPage() {
  return (
    <div className="space-y-8">
      <div className="dashboard-sticky-header">
        <h1 className="text-[1.7rem] font-bold text-gray-900">새 참여자</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          참여자 정보를 입력하는 화면을 준비 중입니다.
        </p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="grid gap-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              이름
            </label>
            <input
              type="text"
              placeholder="참여자 이름"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-gray-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              연락처
            </label>
            <input
              type="text"
              placeholder="010-0000-0000"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-gray-500"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
