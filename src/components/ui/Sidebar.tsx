"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "홈" },
  { href: "/sessions", label: "프로그램 관리" },
  { href: "/participants", label: "참여자 관리" },
  { href: "/library", label: "콘텐츠 관리" },
  { href: "/settings", label: "설정" },
];

export default function Sidebar({
  user,
}: {
  user?: { name?: string | null; email?: string | null };
}) {
  const pathname = usePathname();

  return (
    <aside className="w-60 h-screen bg-white border-r border-gray-300 flex flex-col shrink-0">
      <div className="h-14 px-5 flex items-center border-b border-gray-300/50">
        <Link href="/dashboard" aria-label="홈으로 이동">
          <Image
            src="/logo.svg"
            alt="Minddit Core"
            width={144}
            height={28}
            priority
          />
        </Link>
      </div>

      <nav className="flex-1 px-6 py-4">
        <div className="space-y-2">
          {NAV.map(({ href, label }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "block text-[16px] rounded-xl px-4 py-2 transition-colors",
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

      <div className="px-6 py-5 border-t border-gray-200">
        <div className="mb-3 flex items-center gap-3">
          <Image
            src="/profile-avatar.svg"
            alt="프로필 이미지"
            width={40}
            height={40}
            className="rounded-full"
          />
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-700 truncate">
              {user?.name ?? "사용자"}
            </p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-xs text-gray-400 hover:text-gray-600 transition"
        >
          로그아웃
        </button>
      </div>
    </aside>
  );
}