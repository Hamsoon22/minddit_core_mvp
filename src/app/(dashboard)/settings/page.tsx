"use client";

import { useEffect, useState } from "react";

type SettingsState = {
  name: string;
  description: string;
  address: string;
  directions: string;
  phone: string;
  email: string;
  enableEmailNotification: boolean;
  enableAutoBackup: boolean;
};

const initialState: SettingsState = {
  name: "",
  description: "",
  address: "",
  directions: "",
  phone: "",
  email: "",
  enableEmailNotification: true,
  enableAutoBackup: true,
};

export default function SettingsPage() {
  const [form, setForm] = useState<SettingsState>(initialState);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        setForm({
          name: data.name ?? "",
          description: data.description ?? "",
          address: data.address ?? "",
          directions: data.directions ?? "",
          phone: data.phone ?? "",
          email: data.email ?? "",
          enableEmailNotification: data.enableEmailNotification ?? true,
          enableAutoBackup: data.enableAutoBackup ?? true,
        });
      })
      .catch(() => {
        setForm(initialState);
      });
  }, []);

  async function onSave() {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">설정</h1>
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
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-gray-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  설명
                </label>

                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  주소
                </label>

                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-gray-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  오시는 길
                </label>

                <textarea
                  rows={3}
                  value={form.directions}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, directions: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    문의 전화
                  </label>

                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-gray-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    문의 이메일
                  </label>

                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-gray-500"
                  />
                </div>
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

                <label className="inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={form.enableEmailNotification}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        enableEmailNotification: e.target.checked,
                      }))
                    }
                    className="peer sr-only"
                  />
                  <span className="relative h-6 w-11 rounded-full bg-gray-300 transition peer-checked:bg-[#485763] after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition peer-checked:after:translate-x-5" />
                </label>
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

                <label className="inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={form.enableAutoBackup}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        enableAutoBackup: e.target.checked,
                      }))
                    }
                    className="peer sr-only"
                  />
                  <span className="relative h-6 w-11 rounded-full bg-gray-300 transition peer-checked:bg-[#485763] after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition peer-checked:after:translate-x-5" />
                </label>
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <button
              onClick={onSave}
              disabled={saving}
              className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-60"
            >
              {saving ? "저장 중..." : "설정 저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}