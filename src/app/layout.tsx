import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "마인딧 코어 - 정신건강 프로그램 운영 서비스",
  description: "세션 설계부터 참여자 관리까지",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
