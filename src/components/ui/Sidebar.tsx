"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const LOCAL_SETTINGS_KEY = "minddit.settings.local.v1";
const LOCAL_ACCOUNT_KEY = "minddit.account.local.v1";

const NAV = [
  { href: "/dashboard", label: "홈" },
  { href: "/sessions", label: "프로그램 관리" },
  // { href: "/participants", label: "참여자 관리" },
  { href: "/library", label: "콘텐츠 관리" },
  { href: "/settings", label: "설정 관리" },
];

export default function Sidebar({
  user,
}: {
  user?: { name?: string | null; organization?: string | null };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name ?? "서윤희");
  const [displayOrganization, setDisplayOrganization] = useState(user?.organization ?? "마인딧센터");
  const [profileImage, setProfileImage] = useState<string>("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function syncFromLocal() {
      try {
        const accountRaw = window.localStorage.getItem(LOCAL_ACCOUNT_KEY);
        if (accountRaw) {
          const account = JSON.parse(accountRaw) as {
            accountName?: string;
            profileImage?: string;
          };
          setDisplayName(account.accountName?.trim() || user?.name || "서윤희");
          setProfileImage(account.profileImage ?? "");
        } else {
          setDisplayName(user?.name ?? "서윤희");
          setProfileImage("");
        }
      } catch {
        setDisplayName(user?.name ?? "서윤희");
        setProfileImage("");
      }

      try {
        const settingsRaw = window.localStorage.getItem(LOCAL_SETTINGS_KEY);
        if (settingsRaw) {
          const settings = JSON.parse(settingsRaw) as { name?: string };
          setDisplayOrganization(settings.name?.trim() || user?.organization || "마인딧센터");
        } else {
          setDisplayOrganization(user?.organization ?? "마인딧센터");
        }
      } catch {
        setDisplayOrganization(user?.organization ?? "마인딧센터");
      }
    }

    syncFromLocal();
    window.addEventListener("storage", syncFromLocal);
    window.addEventListener("minddit:profile-updated", syncFromLocal);
    return () => {
      window.removeEventListener("storage", syncFromLocal);
      window.removeEventListener("minddit:profile-updated", syncFromLocal);
    };
  }, [user?.name, user?.organization]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-300 flex flex-col shrink-0">
      <div className="h-14 px-4 flex items-center border-b border-gray-300/50">
        <Link href="/dashboard" aria-label="홈으로 이동">
          <Image
            src="/logo.svg"
            alt="Minddit Core"
            width={176}
            height={35}
            priority
          />
        </Link>
      </div>

      <nav className="flex-1 px-4 py-4">
        <div className="space-y-2">
          {NAV.map(({ href, label }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "block text-[19px] rounded-xl px-5 py-3 transition-colors",
                  active
                    ? "bg-gray-200 text-gray-900 font-bold"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="relative px-4 py-4 border-t border-gray-200" ref={menuRef}>
        {menuOpen && (
          <div className="absolute bottom-full left-4 right-4 mb-2 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden z-50">
            <button
              type="button"
              onClick={() => { setMenuOpen(false); router.push("/settings"); }}
              className="flex w-full items-center justify-center px-4 py-3 text-center text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              설정 관리
            </button>
            <div className="h-px bg-gray-100" />
            <button
              type="button"
              onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/login" }); }}
              className="flex w-full items-center justify-center px-4 py-3 text-center text-sm text-[#AD4E70] hover:bg-red-50 transition-colors"
            >
              로그아웃
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-gray-50"
        >
          {profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profileImage} alt="프로필 이미지" className="h-[50px] w-[50px] rounded-full object-cover shrink-0" />
          ) : (
            <Image
              src="/profile-avatar.svg"
              alt="프로필 이미지"
              width={50}
              height={50}
              className="rounded-full shrink-0"
            />
          )}
          <div className="min-w-0 flex-1 text-left">
            <p className="text-sm font-bold text-gray-700 truncate">{displayName}</p>
            <p className="text-[15px] font-medium text-gray-500 truncate">{displayOrganization}</p>
          </div>
        </button>
      </div>
    </aside>
  );
}