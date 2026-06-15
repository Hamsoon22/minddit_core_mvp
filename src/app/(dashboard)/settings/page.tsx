"use client";

import { useEffect, useState } from "react";

const DEFAULT_CENTER_NAME = "마인딧센터";
const LOCAL_SETTINGS_KEY = "minddit.settings.local.v1";
const LOCAL_ACCOUNT_KEY = "minddit.account.local.v1";

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
  name: DEFAULT_CENTER_NAME,
  description: "",
  address: "",
  directions: "",
  phone: "",
  email: "",
  enableEmailNotification: true,
  enableAutoBackup: true,
};

type AccountState = {
  accountName: string;
  accountId: string;
  contactPhone: string;
  contactEmail: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  profileImage: string;
};

const initialAccountState: AccountState = {
  accountName: "서윤희",
  accountId: "demo@mindflow.kr",
  contactPhone: "",
  contactEmail: "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  profileImage: "",
};

type SettingsTab = "general" | "account" | "users" | "notifications";

function normalizeSettings(data: Partial<SettingsState> | null | undefined): SettingsState {
  return {
    name: data?.name?.trim() ? data.name : DEFAULT_CENTER_NAME,
    description: data?.description ?? "",
    address: data?.address ?? "",
    directions: data?.directions ?? "",
    phone: data?.phone ?? "",
    email: data?.email ?? "",
    enableEmailNotification: data?.enableEmailNotification ?? true,
    enableAutoBackup: data?.enableAutoBackup ?? true,
  };
}

export default function SettingsPage() {
  const [form, setForm] = useState<SettingsState>(initialState);
  const [accountForm, setAccountForm] = useState<AccountState>(initialAccountState);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  function showToast(message: string, tone: "success" | "error" | "info") {
    window.dispatchEvent(
      new CustomEvent("minddit:toast", {
        detail: { message, tone },
      })
    );
  }

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        if (!res.ok) throw new Error("settings fetch failed");
        const data = await res.json();
        const normalized = normalizeSettings(data);
        setForm(normalized);
        window.localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(normalized));
      } catch {
        const local = window.localStorage.getItem(LOCAL_SETTINGS_KEY);
        if (local) {
          try {
            setForm(normalizeSettings(JSON.parse(local) as Partial<SettingsState>));
          } catch {
            // fallback to initial state
          }
        }
        setForm(initialState);
      }

      try {
        const accountRaw = window.localStorage.getItem(LOCAL_ACCOUNT_KEY);
        if (accountRaw) {
          const parsed = JSON.parse(accountRaw) as Partial<AccountState>;
          setAccountForm((prev) => ({ ...prev, ...parsed }));
        }
      } catch {
        setAccountForm(initialAccountState);
      }
    }

    loadSettings();
  }, []);

  async function onSave() {
    if (activeTab === "account") {
      const contactEmail = accountForm.contactEmail.trim();
      if (contactEmail) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(contactEmail)) {
          showToast("계정 이메일 형식이 올바르지 않습니다.", "error");
          return;
        }
      }

      if (accountForm.newPassword || accountForm.confirmPassword || accountForm.currentPassword) {
        if (!accountForm.currentPassword) {
          showToast("현재 비밀번호를 입력해 주세요.", "error");
          return;
        }
        if (accountForm.newPassword.length < 8) {
          showToast("새 비밀번호는 8자 이상으로 입력해 주세요.", "error");
          return;
        }
        if (accountForm.newPassword !== accountForm.confirmPassword) {
          showToast("새 비밀번호 확인이 일치하지 않습니다.", "error");
          return;
        }
      }

      const nextAccount = {
        ...accountForm,
        accountName: accountForm.accountName.trim(),
        contactPhone: accountForm.contactPhone.trim(),
        contactEmail,
      };
      window.localStorage.setItem(LOCAL_ACCOUNT_KEY, JSON.stringify(nextAccount));
      setAccountForm((prev) => ({
        ...nextAccount,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        profileImage: prev.profileImage,
      }));
      window.dispatchEvent(new Event("minddit:profile-updated"));
      showToast("계정 설정이 저장되었습니다.", "success");
      return;
    }

    const emailText = form.email.trim();
    if (emailText) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(emailText)) {
        showToast("문의 이메일 형식이 올바르지 않습니다.", "error");
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        name: form.name.trim() || DEFAULT_CENTER_NAME,
        phone: form.phone.trim(),
        email: emailText,
      };

      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const fallback = normalizeSettings(payload);
        setForm(fallback);
        window.localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(fallback));
        window.dispatchEvent(new Event("minddit:profile-updated"));
        if (data?.error) {
          showToast(data.error, "error");
        } else {
          showToast("서버 저장에 실패하여 현재 브라우저에 임시 저장했습니다.", "info");
        }
        return;
      }

      const saved = await res.json();
      const normalized = normalizeSettings(saved);
      setForm(normalized);
      window.localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(normalized));
      window.dispatchEvent(new Event("minddit:profile-updated"));
      showToast("설정이 저장되었습니다.", "success");
    } catch {
      const fallback = normalizeSettings({
        ...form,
        name: form.name.trim() || DEFAULT_CENTER_NAME,
        email: emailText,
      });
      setForm(fallback);
      window.localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(fallback));
      window.dispatchEvent(new Event("minddit:profile-updated"));
      showToast("네트워크 오류로 브라우저에 임시 저장했습니다.", "info");
    } finally {
      setSaving(false);
    }
  }

  function onSearchAddress() {
    const next = window.prompt("주소를 입력해 주세요", form.address);
    if (next === null) return;
    setForm((prev) => ({ ...prev, address: next.trim() }));
  }

  function tabClass(tab: SettingsTab) {
    return activeTab === tab
      ? "w-full rounded-lg bg-[#485763] px-4 py-3 text-left text-sm font-semibold text-white"
      : "w-full rounded-lg px-4 py-3 text-left text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-800";
  }

  return (
    <div>
      <div className="dashboard-sticky-header-compact flex items-center justify-between gap-4">
        <h1 className="text-[1.7rem] font-bold text-gray-900">설정</h1>

        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex h-10 w-[76px] items-center justify-center rounded-lg bg-[#292929] px-4 text-sm font-medium text-white transition hover:bg-[#1f1f1f] disabled:opacity-60"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>

      <div className="mt-0.5 space-y-6">
        <p className="text-sm text-gray-500">시스템 및 계정 설정을 관리합니다.</p>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[240px_1fr]">
        <aside>
          <nav className="space-y-1">
            <button onClick={() => setActiveTab("general")} className={tabClass("general")}>기관 설정</button>
            <button onClick={() => setActiveTab("account")} className={tabClass("account")}>계정 설정</button>
            <button onClick={() => setActiveTab("users")} className={tabClass("users")}>사용자 관리</button>
            <button onClick={() => setActiveTab("notifications")} className={tabClass("notifications")}>시스템 설정</button>
          </nav>
        </aside>

        <div className="space-y-6">
          {activeTab === "general" && (
            <>
              <section className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="mb-5 text-lg font-semibold text-gray-900">기관 설정</h2>

                <div className="grid gap-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800">기관명 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="기관명을 입력하세요"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-gray-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800">기관 소개</label>
                    <textarea
                      rows={4}
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="기관 및 프로그램 소개를 입력하세요"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800">기관 주소 <span className="text-red-500">*</span></label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={form.address}
                        onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                        placeholder="주소를 검색하세요"
                        className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-gray-500"
                      />
                      <button
                        type="button"
                        onClick={onSearchAddress}
                        className="inline-flex h-11 min-w-[76px] whitespace-nowrap items-center justify-center rounded-lg border border-[#485763] bg-[#485763] px-4 text-sm text-white hover:bg-[#3f4c56]"
                      >
                        검색
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800">오시는 길</label>
                    <textarea
                      rows={3}
                      value={form.directions}
                      onChange={(e) => setForm((prev) => ({ ...prev, directions: e.target.value }))}
                      placeholder="오시는 길 안내를 입력하세요"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-800">문의 연락처</label>
                      <input
                        type="text"
                        value={form.phone}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            phone: e.target.value.replace(/[^0-9-]/g, ""),
                          }))
                        }
                        placeholder="예: 02-1234-5678"
                        inputMode="numeric"
                        pattern="[0-9-]*"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-gray-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-800">문의 이메일 <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="예: contact@minddit.com"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-gray-500"
                      />
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === "account" && (
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-5 text-lg font-semibold text-gray-900">계정 설정</h2>

              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-800">프로필 설정</label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                      {accountForm.profileImage ? (
                        <img src={accountForm.profileImage} alt="profile" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">no image</div>
                      )}
                    </div>
                    <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700 hover:bg-gray-50">
                      이미지 변경
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            const result = typeof reader.result === "string" ? reader.result : "";
                            setAccountForm((prev) => {
                              const next = { ...prev, profileImage: result };
                              window.localStorage.setItem(LOCAL_ACCOUNT_KEY, JSON.stringify(next));
                              window.dispatchEvent(new Event("minddit:profile-updated"));
                              return next;
                            });
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800">이름 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={accountForm.accountName}
                      onChange={(e) =>
                        setAccountForm((prev) => ({
                          ...prev,
                          accountName: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-gray-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800">아이디(이메일) <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      value={accountForm.accountId}
                      disabled
                      className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-4 py-2.5 text-gray-500"
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm">
                  <p className="mb-3 text-sm font-semibold text-gray-800">비밀번호 변경 <span className="text-red-500">*</span></p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <input
                      type="password"
                      value={accountForm.currentPassword}
                      onChange={(e) =>
                        setAccountForm((prev) => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }))
                      }
                      placeholder="현재 비밀번호"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-gray-500"
                    />
                    <input
                      type="password"
                      value={accountForm.newPassword}
                      onChange={(e) =>
                        setAccountForm((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      placeholder="새 비밀번호 (8자 이상)"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-gray-500"
                    />
                    <input
                      type="password"
                      value={accountForm.confirmPassword}
                      onChange={(e) =>
                        setAccountForm((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      placeholder="새 비밀번호 확인"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-gray-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800">이메일 <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      value={accountForm.contactEmail}
                      onChange={(e) =>
                        setAccountForm((prev) => ({
                          ...prev,
                          contactEmail: e.target.value,
                        }))
                      }
                      placeholder="예: account@minddit.com"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-gray-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800">연락처</label>
                    <input
                      type="text"
                      value={accountForm.contactPhone}
                      onChange={(e) =>
                        setAccountForm((prev) => ({
                          ...prev,
                          contactPhone: e.target.value.replace(/[^0-9-]/g, ""),
                        }))
                      }
                      placeholder="예: 010-1234-5678"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-gray-500"
                    />
                  </div>
                </div>

              </div>
            </section>
          )}

          {activeTab === "users" && (
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">사용자 관리</h2>
              <p className="mt-2 text-sm text-gray-500">사용자 관리 항목은 준비 중입니다···</p>
            </section>
          )}

          {activeTab === "notifications" && (
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-5 text-lg font-semibold text-gray-900">시스템 설정</h2>

              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">이메일 알림</p>
                    <p className="text-sm text-gray-500">중요한 이벤트 발생 시 이메일 발송</p>
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
              </div>
            </section>
          )}
        </div>
      </div>
      </div>

    </div>
  );
}
