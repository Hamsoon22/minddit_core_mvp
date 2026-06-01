export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">설정</h1>
        <p className="mt-2 text-sm text-gray-500">
          시스템 및 계정 설정을 관리합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[240px_1fr]">
        <aside className="rounded-xl border border-gray-200 bg-white p-4">
          <nav className="space-y-1">
            <button className="w-full rounded-lg bg-gray-100 px-4 py-3 text-left text-sm font-medium text-gray-900">
              일반 설정
            </button>

            <button className="w-full rounded-lg px-4 py-3 text-left text-sm text-gray-500 hover:bg-gray-50">
              계정 설정
            </button>

            <button className="w-full rounded-lg px-4 py-3 text-left text-sm text-gray-500 hover:bg-gray-50">
              사용자 관리
            </button>

            <button className="w-full rounded-lg px-4 py-3 text-left text-sm text-gray-500 hover:bg-gray-50">
              알림 설정
            </button>
          </nav>
        </aside>

        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-5 text-lg font-semibold text-gray-900">
              기관 정보
            </h2>

            <div className="grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  기관명
                </label>

                <input
                  type="text"
                  defaultValue="Minddit Core"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-gray-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  설명
                </label>

                <textarea
                  rows={4}
                  defaultValue="마음 건강 프로그램 운영 플랫폼"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-5 text-lg font-semibold text-gray-900">
              시스템 설정
            </h2>

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">
                    이메일 알림
                  </p>
                  <p className="text-sm text-gray-500">
                    중요한 이벤트 발생 시 이메일 발송
                  </p>
                </div>

                <input type="checkbox" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">
                    자동 백업
                  </p>
                  <p className="text-sm text-gray-500">
                    매일 자정 데이터 백업
                  </p>
                </div>

                <input type="checkbox" defaultChecked />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex justify-end">
              <button className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700">
                설정 저장
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}