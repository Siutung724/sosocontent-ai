import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Ticker from '@/components/Ticker';
import LandingOverlays from '@/components/LandingOverlays';

// ── Feature grid data ──────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: '📅',
    title: '7日社交媒體計劃',
    desc: '輸入品牌資料，AI 自動生成一週 IG、Facebook、LinkedIn 貼文，每篇附主題、正文、Hashtag 及配圖建議。',
  },
  {
    icon: '✍️',
    title: '品牌故事生成',
    desc: '輸入你的品牌背景，AI 以地道廣東話撰寫感人品牌故事，提升客戶信任感與品牌認同。',
  },
  {
    icon: '🚀',
    title: '產品推廣文案',
    desc: '新品上市、限時優惠、活動推廣一鍵生成，多款語氣選擇，配合不同行銷場景。',
  },
];

// ── Landing page ───────────────────────────────────────────────────────────

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-body text-primary flex flex-col">

      {/* Layer 1 — Ticker */}
      <Ticker />

      {/* ── Simple nav ── */}
      <header className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="sosocontent" className="h-8 w-8 object-contain" />
          <span className="font-bold text-primary text-sm tracking-wide">sosocontent.ai</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/auth"
            className="text-sm text-secondary hover:text-primary transition-colors"
          >
            登入
          </Link>
          <Link
            href="/auth"
            className="text-sm bg-cta text-body font-semibold px-4 py-1.5 rounded-lg hover:bg-cta/90 transition-colors"
          >
            免費開始
          </Link>
        </div>
      </header>

      {/* ── Banner infographic ── */}
      <div className="w-full max-w-6xl mx-auto px-4 md:px-8 lg:px-12 pt-4 pb-2">
        {/* Desktop: horizontal 3:2 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/banner-mobile.png"
          alt="sosocontent features"
          className="hidden md:block w-full rounded-2xl object-cover"
        />
        {/* Mobile: square 1:1 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/banner-desktop.png"
          alt="sosocontent features"
          className="block md:hidden w-full rounded-2xl object-cover"
        />
      </div>

      {/* ── Hero ── */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-10 pb-24">
        <div className="max-w-3xl mx-auto">

          {/* Eyebrow tag */}
          <span className="inline-block text-xs font-bold text-cta border border-cta/30 bg-cta/10 px-3 py-1 rounded-full mb-6 tracking-widest uppercase">
            香港首個廣東話 AI 內容助手
          </span>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-extrabold text-primary leading-tight mb-6">
            讓 SOSO 幫你寫<br />
            <span className="text-cta">每一篇貼文</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg text-secondary leading-relaxed max-w-xl mx-auto mb-4">
            專為香港中小企打造，一鍵生成地道廣東話品牌文案、社交媒體計劃及產品推廣內容。
          </p>

          {/* Bullets */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-secondary mb-10">
            {['✓ 無需寫作經驗', '✓ 廣東話 AI 生成', '✓ 免費開始使用'].map(b => (
              <span key={b} className="text-cta/80">{b}</span>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth"
              className="w-full sm:w-auto bg-cta text-body font-bold text-base px-8 py-3.5 rounded-xl hover:bg-cta/90 transition-colors shadow-[0_0_30px_rgba(0,237,203,0.25)]"
            >
              免費開始 →
            </Link>
            <Link
              href="#features"
              className="w-full sm:w-auto text-secondary border border-primary/10 hover:border-primary/20 hover:text-primary text-base font-medium px-8 py-3.5 rounded-xl transition-colors"
            >
              了解更多功能
            </Link>
          </div>

        </div>

        {/* ── Feature grid ── */}
        <div id="features" className="mt-24 max-w-5xl mx-auto w-full">
          <h2 className="text-xs font-semibold text-secondary uppercase tracking-widest mb-8">
            核心功能
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            {FEATURES.map(f => (
              <div
                key={f.title}
                className="bg-surface border border-primary/8 rounded-2xl p-6 hover:border-cta/20 transition-colors"
              >
                <span className="text-3xl mb-4 block">{f.icon}</span>
                <h3 className="text-sm font-semibold text-primary mb-2">{f.title}</h3>
                <p className="text-xs text-secondary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom CTA strip ── */}
        <div className="mt-20 max-w-xl mx-auto text-center">
          <p className="text-secondary text-sm mb-4">立即免費試用，無需信用卡</p>
          <Link
            href="/auth"
            className="inline-block bg-cta text-body font-bold text-sm px-8 py-3 rounded-xl hover:bg-cta/90 transition-colors"
          >
            開始生成內容 ✨
          </Link>
        </div>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-primary/8 px-6 py-6 text-center">
        <p className="text-xs text-secondary/50">
          © 2025 sosocontent.ai · 香港製造 🇭🇰
        </p>
      </footer>

      {/* Layers 2 + 3 — client overlays */}
      <LandingOverlays />

    </div>
  );
}
