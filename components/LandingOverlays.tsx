'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// ── Update Banner (Layer 2) ────────────────────────────────────────────────
// Fixed bottom-right card, dismissible

function UpdateBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 bg-surface border border-cta/20 rounded-2xl shadow-toast overflow-hidden">
      {/* Top accent bar */}
      <div className="h-1 bg-cta w-full" />
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-2">
        <h3 className="text-base font-bold text-primary leading-snug">
          廣東話 AI 文案<br />
          <span className="text-cta">秒速生成，即刻用</span>
        </h3>
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
      <div className="px-5 pb-5">
        <ul className="space-y-2 mb-4">
          {[
            '🎬 KOL 腳本 + 限時爆款帖',
            '🔍 拆解競爭對手廣告策略',
            '🎁 免費送 120 積分，即刻試',
          ].map(item => (
            <li key={item} className="text-sm text-secondary font-medium">{item}</li>
          ))}
        </ul>
        <Link
          href="/auth"
          className="block w-full bg-cta text-body text-sm font-bold text-center py-2.5 rounded-xl hover:bg-cta/90 transition-colors"
        >
          免費開始 →
        </Link>
      </div>
    </div>
  );
}

// ── Promo Modal (Layer 3) ──────────────────────────────────────────────────
// Full-screen backdrop + centered modal, dismissible

// 優惠倒數：首次訪問起 3 天，存在 localStorage
const OFFER_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
const LS_KEY = 'soso_offer_end';

function getOfferEnd(): number {
  if (typeof window === 'undefined') return 0;
  const stored = localStorage.getItem(LS_KEY);
  if (stored) {
    const ts = parseInt(stored, 10);
    if (!isNaN(ts)) return ts;
  }
  const end = Date.now() + OFFER_DURATION_MS;
  localStorage.setItem(LS_KEY, String(end));
  return end;
}

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    const offerEnd = getOfferEnd();
    const calc = () => Math.max(0, offerEnd - Date.now());
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
              { text: '7 大 AI 工作流程，一鍵生成廣東話文案', soon: false },
              { text: '品牌定位 + 競爭對手廣告拆解', soon: false },
              { text: 'KOL 腳本 + 限時優惠爆款帖', soon: false },
              { text: '粵語 TTS 語音播報', soon: false },
              { text: '數字人視頻生成', soon: true },
            ].map(item => (
              <li key={item.text} className="flex items-center gap-2 text-sm text-secondary">
                <span className="text-cta shrink-0">✓</span>
                <span>{item.text}</span>
                {item.soon && (
                  <span className="text-[10px] text-secondary/50 border border-primary/10 px-1.5 py-0.5 rounded-full shrink-0">即將推出</span>
                )}
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

          <p className="text-xs text-secondary mb-4 font-medium">
            🔓 無需信用卡，隨時取消
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
