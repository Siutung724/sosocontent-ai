'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// ── Update Banner (Layer 2) ────────────────────────────────────────────────
// Fixed bottom-right card, dismissible

function UpdateBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 bg-surface border border-primary/10 rounded-2xl shadow-toast overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
        <div>
          <span className="block text-xs font-bold text-cta uppercase tracking-widest mb-0.5">
            📢 最新消息
          </span>
          <h3 className="text-sm font-semibold text-primary leading-snug">
            7日社交媒體計劃生成器正式上線
          </h3>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 text-secondary/50 hover:text-secondary transition-colors mt-0.5"
          aria-label="關閉"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
            <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="px-5 pb-4">
        <p className="text-xs text-secondary leading-relaxed mb-3">
          輸入品牌資料，AI 自動為你生成 Instagram、Facebook 及 LinkedIn 一週貼文計劃，每篇附主題、正文、Hashtag 及配圖建議。
        </p>
        <Link
          href="/auth"
          className="inline-flex items-center gap-1.5 bg-cta text-body text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-cta/90 transition-colors"
        >
          立即試用 →
        </Link>
      </div>
    </div>
  );
}

// ── Promo Modal (Layer 3) ──────────────────────────────────────────────────
// Full-screen backdrop + centered modal, dismissible

// 優惠截止日期：2026 年 4 月 30 日 23:59:59
const OFFER_END = new Date('2026-04-30T23:59:59+08:00');

function useCountdown() {
  // null = not yet mounted (avoid server/client mismatch)
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    const calc = () => {
      const diff = OFFER_END.getTime() - Date.now();
      return diff > 0 ? diff : 0;
    };
    setTimeLeft(calc());
    const id = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(id);
  }, []);

  if (timeLeft === null) return { d: 0, h: 0, m: 0, s: 0, mounted: false, expired: false };

  const totalSec = Math.floor(timeLeft / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return { d, h, m, s, mounted: true, expired: timeLeft === 0 };
}

function CountdownBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl font-bold text-cta tabular-nums leading-none">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[10px] text-secondary/60 mt-0.5">{label}</span>
    </div>
  );
}

function PromoModal() {
  const [dismissed, setDismissed] = useState(false);
  const { d, h, m, s, mounted, expired } = useCountdown();
  if (dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-body/80 backdrop-blur-sm"
        onClick={() => setDismissed(true)}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-sm bg-surface border border-primary/10 rounded-2xl shadow-toast overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1 bg-cta w-full" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-2">
          <div>
            <span className="block text-xs font-bold text-cta uppercase tracking-widest mb-1">
              🎁 限時優惠
            </span>
            <h2 className="text-lg font-bold text-primary leading-snug">
              首月免費使用<br />專業版功能
            </h2>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 text-secondary/50 hover:text-secondary transition-colors mt-1"
            aria-label="關閉"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
              <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6">
          <ul className="space-y-2 mb-5 mt-3">
            {[
              '無限次 AI 內容生成',
              '7日、30日社交媒體計劃',
              '品牌聲音分析及優化建議',
              '多平台一鍵發佈（即將推出）',
            ].map(item => (
              <li key={item} className="flex items-center gap-2 text-sm text-secondary">
                <span className="text-cta shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>

          {/* Countdown */}
          {mounted && !expired ? (
            <div className="mb-4">
              <p className="text-[10px] text-secondary/60 mb-2 uppercase tracking-widest">優惠倒數</p>
              <div className="flex items-start justify-center gap-3">
                <CountdownBlock value={d} label="天" />
                <span className="text-cta font-bold text-xl leading-none mt-0.5">:</span>
                <CountdownBlock value={h} label="時" />
                <span className="text-cta font-bold text-xl leading-none mt-0.5">:</span>
                <CountdownBlock value={m} label="分" />
                <span className="text-cta font-bold text-xl leading-none mt-0.5">:</span>
                <CountdownBlock value={s} label="秒" />
              </div>
            </div>
          ) : mounted && expired ? (
            <p className="text-xs text-danger/80 mb-4">優惠已結束</p>
          ) : null}

          <p className="text-xs text-secondary/60 mb-4">
            無需信用卡，隨時取消。
          </p>

          <Link
            href="/auth"
            className="block w-full bg-cta text-body text-sm font-bold text-center py-3 rounded-xl hover:bg-cta/90 transition-colors"
          >
            立即領取優惠
          </Link>

          <button
            onClick={() => setDismissed(true)}
            className="block w-full text-center text-xs text-secondary/50 hover:text-secondary mt-3 transition-colors"
          >
            不了，謝謝
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Combined export ────────────────────────────────────────────────────────

export default function LandingOverlays() {
  return (
    <>
      <PromoModal />
      <UpdateBanner />
    </>
  );
}
