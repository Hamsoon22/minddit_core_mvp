import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mindfitcore — 정신건강 프로그램 플랫폼",
  description: "세션 설계부터 참여자 관리까지",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
