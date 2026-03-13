import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import { StripeBuyButton } from '@/components/StripeBuyButton';

// ── Feature lists ──────────────────────────────────────────────────────────────

const FREE_FEATURES = [
  { zh: '每月 1 次 AI 內容生成', en: '1 AI content generation / month', included: true },
  { zh: '可用所有 5 個工作流程', en: 'Access all 5 workflows', included: true },
  { zh: '1 個品牌資料', en: '1 brand profile', included: true },
  { zh: '內容庫（查閱記錄）', en: 'Content library access', included: true },
  { zh: '品牌聲線 TTS 播放', en: 'Brand voice TTS playback', included: false },
  { zh: '多個品牌管理', en: 'Multiple brand profiles', included: false },
  { zh: '優先客戶支援', en: 'Priority support', included: false },
];

const PRO_FEATURES = [
  { zh: '無限次 AI 內容生成', en: 'Unlimited AI content generation', included: true },
  { zh: '可用所有 5 個工作流程', en: 'Access all 5 workflows', included: true },
  { zh: '3 個品牌資料', en: 'Up to 3 brand profiles', included: true },
  { zh: '內容庫（完整記錄）', en: 'Full content library', included: true },
  { zh: '品牌聲線 TTS（每月 1 次）', en: 'Brand voice TTS (1× / month)', included: true },
  { zh: '多個品牌管理', en: 'Multiple brand profiles', included: false },
  { zh: '優先客戶支援', en: 'Priority support', included: false },
];

const ENTERPRISE_FEATURES = [
  { zh: '無限次 AI 內容生成', en: 'Unlimited AI content generation', included: true },
  { zh: '可用所有 5 個工作流程', en: 'Access all 5 workflows', included: true },
  { zh: '無限品牌資料', en: 'Unlimited brand profiles', included: true },
  { zh: '內容庫（完整記錄）', en: 'Full content library', included: true },
  { zh: '品牌聲線 TTS（無限次）', en: 'Brand voice TTS (unlimited)', included: true },
  { zh: '多個品牌管理', en: 'Multiple brand profiles', included: true },
  { zh: '優先客戶支援', en: 'Priority support', included: true },
];

// ── FAQ ────────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: '如何計算 AI 生成費用？\nHow are AI generation costs calculated?',
    a: '我們使用按用量計費的 AI 模型（包括 GPT-4o mini 及 MiniMax TTS），成本已包含在月費內，你無需另外付費。\nWe use pay-per-use AI models (including GPT-4o mini and MiniMax TTS). All costs are included in your monthly plan — no hidden fees.',
  },
  {
    q: '可以隨時取消訂閱嗎？\nCan I cancel anytime?',
    a: '可以，所有方案均可隨時取消，取消後仍可使用至月費期結束。\nYes. Cancel anytime — you\'ll retain access until the end of your billing period.',
  },
  {
    q: '免費版有什麼限制？\nWhat are the Free plan limitations?',
    a: '免費版每月只可生成 1 次 AI 內容，不包含 TTS 語音功能。適合試用了解產品功能。\nThe Free plan allows 1 AI generation per month and does not include TTS voice. It\'s ideal for trying out the product.',
  },
];

// ── Feature row ────────────────────────────────────────────────────────────────

function FeatureList({ features }: { features: typeof FREE_FEATURES }) {
  return (
    <ul className="space-y-2.5 flex-1 mb-6">
      {features.map((f, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className={`mt-0.5 shrink-0 text-sm ${f.included ? 'text-success' : 'text-secondary/30'}`}>
            {f.included ? '✓' : '✕'}
          </span>
          <div className={`text-xs leading-snug ${f.included ? 'text-secondary' : 'text-secondary/40'}`}>
            <p>{f.zh}</p>
            <p className="text-secondary/50">{f.en}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  return (
    <AppLayout>
      <div className="space-y-16">

        {/* Hero */}
        <div className="text-center py-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">
            定價方案  /  Pricing
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-primary leading-snug mb-3">
            簡單透明的定價<br className="hidden sm:block" />
            <span className="text-accent">Simple, Transparent Pricing</span>
          </h1>
          <p className="text-secondary text-sm max-w-md mx-auto leading-relaxed">
            按需選擇，無隱藏收費。AI 生成成本已全數包含。<br />
            Choose your plan. No hidden fees. All AI costs included.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

          {/* ── Free ── */}
          <div className="bg-surface border border-primary/8 rounded-2xl flex flex-col">
            <div className="p-6 flex-1 flex flex-col">
              <div className="mb-5">
                <h2 className="text-base font-semibold text-primary">
                  免費體驗
                  <span className="text-secondary/50 font-normal ml-1.5 text-sm">/ Free</span>
                </h2>
                <div className="mt-3 flex items-end gap-1.5">
                  <span className="text-3xl font-bold text-primary">$0</span>
                  <span className="pb-1 text-xs text-secondary">永久免費 / Free forever</span>
                </div>
              </div>
              <FeatureList features={FREE_FEATURES} />
              <Link
                href="/login"
                className="block w-full text-center py-2.5 px-4 rounded-xl text-sm border border-primary/20 hover:border-accent/40 text-secondary hover:text-primary transition-colors"
              >
                立即開始  /  Get Started
              </Link>
            </div>
          </div>

          {/* ── Pro ── */}
          <div className="relative bg-accent/5 border border-accent/40 rounded-2xl shadow-lg shadow-accent/10 scale-[1.02] flex flex-col">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-accent text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                最受歡迎  /  Most Popular
              </span>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="mb-5">
                <h2 className="text-base font-semibold text-primary">
                  專業版
                  <span className="text-secondary/50 font-normal ml-1.5 text-sm">/ Pro</span>
                </h2>
                <div className="mt-3 flex items-end gap-1.5">
                  <span className="text-3xl font-bold text-accent">US$20</span>
                  <div className="pb-1 text-xs text-secondary leading-tight">
                    <p>每月 / per month</p>
                  </div>
                </div>
              </div>
              <FeatureList features={PRO_FEATURES} />
              {/* Stripe Buy Button */}
              <div className="flex justify-center">
                <StripeBuyButton buyButtonId="buy_btn_1TAYKzFFnwNrhEtRwJzJUnnb" />
              </div>
            </div>
          </div>

          {/* ── Enterprise ── */}
          <div className="bg-surface border border-primary/8 rounded-2xl flex flex-col">
            <div className="p-6 flex-1 flex flex-col">
              <div className="mb-5">
                <h2 className="text-base font-semibold text-primary">
                  企業版
                  <span className="text-secondary/50 font-normal ml-1.5 text-sm">/ Enterprise</span>
                </h2>
                <div className="mt-3 flex items-end gap-1.5">
                  <span className="text-3xl font-bold text-primary">US$50</span>
                  <div className="pb-1 text-xs text-secondary leading-tight">
                    <p>每月 / per month</p>
                  </div>
                </div>
              </div>
              <FeatureList features={ENTERPRISE_FEATURES} />
              {/* Stripe Buy Button */}
              <div className="flex justify-center">
                <StripeBuyButton buyButtonId="buy_btn_1TAYQiFFnwNrhEtR14w7OiXs" />
              </div>
            </div>
          </div>

        </div>

        {/* Cost transparency */}
        <div className="bg-surface border border-primary/8 rounded-2xl p-5 max-w-2xl mx-auto text-center">
          <p className="text-xs font-semibold text-secondary uppercase tracking-widest mb-2">
            成本透明度  /  Cost Transparency
          </p>
          <p className="text-sm text-secondary leading-relaxed">
            每次 AI 文案生成成本約 <span className="text-primary font-medium">US$0.002</span>，
            TTS 語音生成約 <span className="text-primary font-medium">US$0.02–0.05</span> 每次。
            月費已涵蓋所有 AI 使用成本，按方案限額扣除。
          </p>
          <p className="text-xs text-secondary/60 mt-1.5">
            Each AI generation costs ~US$0.002; TTS ~US$0.02–0.05 per session. All included in your plan.
          </p>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xs font-semibold text-secondary uppercase tracking-widest mb-6 text-center">
            常見問題  /  FAQ
          </h2>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-surface border border-primary/8 rounded-2xl p-5">
                <p className="text-sm font-semibold text-primary mb-2 leading-snug whitespace-pre-line">{faq.q}</p>
                <p className="text-sm text-secondary leading-relaxed whitespace-pre-line">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
