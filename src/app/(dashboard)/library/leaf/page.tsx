"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// ────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────

export default function LeafMeditationPage() {
  const searchParams = useSearchParams();
  const isEmbedded = searchParams.get("embed") === "1";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  function togglePlay() {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play();
      setPlaying(true);
    } else {
      vid.pause();
      setPlaying(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      {!isEmbedded && (
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link
            href="/library"
            className="flex items-center gap-1.5 text-xs text-gray-400 transition hover:text-gray-700"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            라이브러리
          </Link>
          <span className="text-gray-200">/</span>
          <span className="text-xs font-medium text-gray-700">나뭇잎 배띄우기</span>
        </div>
      </div>
      )}

      <div className={`mx-auto max-w-2xl ${isEmbedded ? "px-2 py-3" : "px-4 py-8"}`}>
        {/* Header */}
        <div className="mb-6 rounded-xl bg-gray-900 px-6 py-5 text-white">
          <h1 className="mb-1 text-xl font-bold">나뭇잎 배띄우기</h1>
          <p className="text-sm text-white/70">
            ACT 기반 탈융합 명상입니다. 생각이 떠오를 때마다 나뭇잎에 올려 흘려보내세요.
          </p>
        </div>

        {/* Guide card */}
        <div className="mb-4 rounded-xl border border-gray-200 bg-white px-5 py-4">
          <p className="mb-2 text-xs font-medium text-gray-400">진행 방법</p>
          <ol className="flex flex-col gap-1.5 text-sm text-gray-700">
            <li className="flex gap-2">
              <span className="shrink-0 text-gray-300">1.</span>
              편안한 자세로 앉아 영상을 재생하세요.
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 text-gray-300">2.</span>
              시냇물이 흐르는 장면을 조용히 바라보세요.
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 text-gray-300">3.</span>
              생각이 떠오르면 나뭇잎 위에 올리고 천천히 흘려보내세요.
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 text-gray-300">4.</span>
              생각을 붙잡거나 쫓을 필요 없이, 그냥 지나가도록 두세요.
            </li>
          </ol>
        </div>

        {/* Video player */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-black">
          <video
            ref={videoRef}
            src="/videos/leaf_v4.mp4"
            loop
            playsInline
            className="w-full"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              onClick={togglePlay}
              className="flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/10"
            >
              {playing ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <rect x="5" y="4" width="4" height="16" rx="1" />
                    <rect x="15" y="4" width="4" height="16" rx="1" />
                  </svg>
                  일시정지
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M6 4l14 8-14 8V4z" />
                  </svg>
                  재생
                </>
              )}
            </button>
            <span className="text-xs text-white/40">반복 재생</span>
          </div>
        </div>

        {/* Tip */}
        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            <span className="font-medium text-gray-700">Tip.</span>{" "}
            판단하거나 분석하려 하지 마세요. 생각이 멈추지 않아도 괜찮습니다.
            나뭇잎이 계속 흘러가듯, 생각도 자연스럽게 지나갑니다.
          </p>
        </div>
      </div>
    </div>
  );
}