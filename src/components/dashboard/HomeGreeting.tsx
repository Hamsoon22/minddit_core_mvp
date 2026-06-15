"use client";

import { useEffect, useState } from "react";

const LOCAL_ACCOUNT_KEY = "minddit.account.local.v1";

type HomeGreetingProps = {
  fallbackName: string;
};

export default function HomeGreeting({ fallbackName }: HomeGreetingProps) {
  const [displayName, setDisplayName] = useState(fallbackName);

  useEffect(() => {
    function syncName() {
      try {
        const raw = window.localStorage.getItem(LOCAL_ACCOUNT_KEY);
        if (!raw) {
          setDisplayName(fallbackName);
          return;
        }

        const parsed = JSON.parse(raw) as { accountName?: string };
        const nextName = parsed.accountName?.trim() || fallbackName;
        setDisplayName(nextName);
      } catch {
        setDisplayName(fallbackName);
      }
    }

    syncName();
    window.addEventListener("storage", syncName);
    window.addEventListener("minddit:profile-updated", syncName);
    return () => {
      window.removeEventListener("storage", syncName);
      window.removeEventListener("minddit:profile-updated", syncName);
    };
  }, [fallbackName]);

  return (
    <h1 className="text-[1.7rem] font-medium text-gray-900">
      <span className="font-bold">{displayName} 전문가님,</span> 반갑습니다.
    </h1>
  );
}
