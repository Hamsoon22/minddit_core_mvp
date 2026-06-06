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
  { href: "/settings", label: "설정" },
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
                  "block text-[16px] rounded-xl px-5 py-3 transition-colors",
                  active
                    ? "bg-gray-100 text-gray-900 font-bold"
                    : "text-gray-400 hover:text-gray-600"
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
              className="flex w-full items-center justify-center gap-2 px-4 py-3 text-center text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19.4 15C19.1277 15.6171 19.2583 16.3378 19.73 16.82L19.79 16.88C20.1656 17.2551 20.3766 17.7642 20.3766 18.295C20.3766 18.8258 20.1656 19.3349 19.79 19.71C19.4149 20.0856 18.9058 20.2966 18.375 20.2966C17.8442 20.2966 17.3351 20.0856 16.96 19.71L16.9 19.65C16.4178 19.1783 15.6971 19.0477 15.08 19.32C14.4755 19.5791 14.0826 20.1724 14.08 20.83V21C14.08 22.1046 13.1846 23 12.08 23C10.9754 23 10.08 22.1046 10.08 21V20.91C10.0642 20.2327 9.63587 19.6339 9 19.4C8.38291 19.1277 7.66219 19.2583 7.18 19.73L7.12 19.79C6.74486 20.1656 6.23582 20.3766 5.705 20.3766C5.17418 20.3766 4.66514 20.1656 4.29 19.79C3.91445 19.4149 3.70343 18.9058 3.70343 18.375C3.70343 17.8442 3.91445 17.3351 4.29 16.96L4.35 16.9C4.82167 16.4178 4.95231 15.6971 4.68 15.08C4.42093 14.4755 3.82764 14.0826 3.17 14.08H3C1.89543 14.08 1 13.1846 1 12.08C1 10.9754 1.89543 10.08 3 10.08H3.09C3.76728 10.0642 4.36609 9.63587 4.6 9C4.87231 8.38291 4.74167 7.66219 4.27 7.18L4.21 7.12C3.83445 6.74486 3.62343 6.23582 3.62343 5.705C3.62343 5.17418 3.83445 4.66514 4.21 4.29C4.58514 3.91445 5.09418 3.70343 5.625 3.70343C6.15582 3.70343 6.66486 3.91445 7.04 4.29L7.1 4.35C7.58219 4.82167 8.30291 4.95231 8.92 4.68H9C9.60447 4.42093 9.99738 3.82764 10 3.17V3C10 1.89543 10.8954 1 12 1C13.1046 1 14 1.89543 14 3V3.09C14.0026 3.74764 14.3955 4.34093 15 4.6C15.6171 4.87231 16.3378 4.74167 16.82 4.27L16.88 4.21C17.2551 3.83445 17.7642 3.62343 18.295 3.62343C18.8258 3.62343 19.3349 3.83445 19.71 4.21C20.0856 4.58514 20.2966 5.09418 20.2966 5.625C20.2966 6.15582 20.0856 6.66486 19.71 7.04L19.65 7.1C19.1783 7.58219 19.0477 8.30291 19.32 8.92V9C19.5791 9.60447 20.1724 9.99738 20.83 10H21C22.1046 10 23 10.8954 23 12C23 13.1046 22.1046 14 21 14H20.91C20.2524 14.0026 19.6591 14.3955 19.4 15Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              설정
            </button>
            <div className="h-px bg-gray-100" />
            <button
              type="button"
              onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/login" }); }}
              className="flex w-full items-center justify-center gap-2 px-4 py-3 text-center text-sm text-[#AD4E70] hover:bg-red-50 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12H9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
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
            <img src={profileImage} alt="프로필 이미지" className="h-8 w-8 rounded-full object-cover shrink-0" />
          ) : (
            <Image
              src="/profile-avatar.svg"
              alt="프로필 이미지"
              width={32}
              height={32}
              className="rounded-full shrink-0"
            />
          )}
          <div className="min-w-0 flex-1 text-left">
            <p className="text-[15px] font-semibold text-gray-700 truncate">{displayName}</p>
            <p className="text-sm font-medium text-gray-500 truncate">{displayOrganization}</p>
          </div>
        </button>
      </div>
    </aside>
  );
}