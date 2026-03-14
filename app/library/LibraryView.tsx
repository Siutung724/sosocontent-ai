'use client';

import { useState, useCallback, useRef } from 'react';
import type {
  WeeklyPost,
  WeeklySocialResult,
  BrandStoryResult,
  ProductLaunchResult,
  BrandTrustResult,
  BrandStrategyResult,
  BrandPositioningResult,
  AdCopyResult,
  ReviewToAdResult,
} from '@/lib/workflow-types';
import { useToast } from '@/hooks/useToast';

// ── Types ─────────────────────────────────────────────────────────────────────

type WorkflowInfo = { key: string; name: string } | null;

type ExecRow = {
  id: string;
  workflow_id: string | null;
  inputs: Record<string, string>;
  result: unknown;
  model: string | null;
  tokens_used: number | null;
  created_at: string;
  workflows: WorkflowInfo;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const WORKFLOW_ICONS: Record<string, string> = {
  weekly_social:  '📅',
  brand_story:    '✍️',
  product_launch: '🚀',
  brand_trust:    '🏷️',
  brand_strategy: '📚',
};

const PAGE_SIZE = 20;

type FilterKey = 'all' | string;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',            label: '全部' },
  { key: 'weekly_social',  label: '📅 每週社交媒體' },
  { key: 'brand_story',    label: '✍️ 品牌故事' },
  { key: 'product_launch', label: '🚀 產品上市' },
  { key: 'brand_trust',    label: '🏷️ 品牌信任' },
  { key: 'brand_strategy', label: '📚 品牌策略' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-HK', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function inputPreview(inputs: Record<string, string>): string {
  const vals = Object.values(inputs).filter(Boolean);
  const first = vals[0] ?? '';
  return first.length > 60 ? first.slice(0, 60) + '…' : first;
}

// ── Shared CopyBlock ──────────────────────────────────────────────────────────

function CopyBlock({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="bg-surface border border-primary/8 rounded-xl overflow-hidden">
      <div className="bg-surface-2 border-b border-primary/8 px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-secondary uppercase tracking-wide">{label}</span>
        <button
          onClick={copy}
          className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
            copied
              ? 'border-success/30 text-success bg-success/10'
              : 'border-primary/10 text-secondary hover:border-primary/20 hover:text-primary'
          }`}
        >
          {copied ? '✓ 已複製' : '複製'}
        </button>
      </div>
      <p className="px-4 py-3 text-sm text-primary leading-relaxed whitespace-pre-line">{text}</p>
    </div>
  );
}

// ── WeeklyPostCard ────────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<string, string> = {
  '教育價值': 'bg-blue-500/10 text-blue-400',
  '互動趣味': 'bg-green-500/10 text-green-400',
  '信任案例': 'bg-amber-500/10 text-amber-400',
  '推廣轉化': 'bg-purple-500/10 text-purple-400',
};

function WeeklyPostCard({ post }: { post: WeeklyPost }) {
  const [copied, setCopied] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { showToast } = useToast();

  const copy = async () => {
    const hook = post.engagement_hook ? `\n\n${post.engagement_hook}` : '';
    await navigator.clipboard.writeText(`${post.content}${hook}\n\n${post.hashtags.join(' ')}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlay = async () => {
    if (playing && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
      return;
    }
    setTtsLoading(true);
    try {
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: post.content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '生成失敗');
      const audio = new Audio(data.audio_url);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      await audio.play();
      setPlaying(true);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '語音生成失敗');
    } finally {
      setTtsLoading(false);
    }
  };

  const categoryStyle = post.category ? (CATEGORY_STYLES[post.category] ?? 'bg-primary/10 text-secondary') : null;

  return (
    <div className="bg-surface border border-primary/8 rounded-xl overflow-hidden">
      <div className="bg-surface-2 border-b border-primary/8 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-accent uppercase tracking-widest">
            Day {post.day}{post.day_label ? ` · ${post.day_label}` : ''}
          </span>
          {categoryStyle && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryStyle}`}>
              {post.category}
            </span>
          )}
        </div>
        <button
          onClick={copy}
          className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors shrink-0 ${
            copied ? 'border-success/30 text-success bg-success/10' : 'border-primary/10 text-secondary hover:border-primary/20 hover:text-primary'
          }`}
        >
          {copied ? '✓ 已複製' : '複製'}
        </button>
      </div>
      <div className="px-4 py-3 space-y-2">
        <p className="text-sm font-semibold text-primary/80">{post.theme}</p>
        <p className="text-sm text-primary leading-relaxed whitespace-pre-line">{post.content}</p>
        {post.engagement_hook && (
          <p className="text-xs text-accent/80 bg-accent/5 border border-accent/10 rounded-lg px-3 py-2 flex gap-1.5">
            <span>💬</span>{post.engagement_hook}
          </p>
        )}
        {post.visual_concept && (
          <p className="text-xs text-secondary italic flex gap-1.5"><span>🖼</span>{post.visual_concept}</p>
        )}
        {post.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.hashtags.map(t => (
              <span key={t} className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        )}
      </div>
      <div className="border-t border-primary/8 px-4 py-2 flex items-center justify-between">
        <button
          onClick={handlePlay}
          disabled={ttsLoading}
          className={`flex items-center gap-1.5 border rounded-lg px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
            playing
              ? 'border-danger/30 text-danger hover:bg-danger/10'
              : 'border-accent/30 text-accent hover:bg-accent/10'
          }`}
        >
          {ttsLoading ? (
            <svg className="animate-spin w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : playing ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
              <path d="M4.5 2a.5.5 0 0 0-.5.5v11a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5v-11a.5.5 0 0 0-.5-.5h-2Zm5 0a.5.5 0 0 0-.5.5v11a.5.5 0 0 0 .5.5h2a.5.5 0 0 0 .5-.5v-11a.5.5 0 0 0-.5-.5h-2Z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
              <path d="M3 3.732a1.5 1.5 0 0 1 2.305-1.265l6.706 4.268a1.5 1.5 0 0 1 0 2.53L5.305 13.533A1.5 1.5 0 0 1 3 12.268V3.732Z" />
            </svg>
          )}
          {ttsLoading ? '生成中...' : playing ? '停止' : '播放'}
        </button>
        <span className="text-xs text-secondary/60">
          {post.best_post_time ? `⏰ 建議 ${post.best_post_time} 發布` : '系統預設聲線'}
        </span>
      </div>
    </div>
  );
}

// ── BrandStoryPanel ───────────────────────────────────────────────────────────

function BrandStoryPanel({ result }: { result: unknown }) {
  const d = (result as BrandStoryResult).brand_story;
  if (!d) return <RawJson result={result} />;
  return (
    <div className="space-y-3 pt-2">
      <CopyBlock label="標題" text={d.headline} />
      <CopyBlock label="標語" text={d.tagline} />
      <CopyBlock label="短版故事" text={d.story_short} />
      <CopyBlock label="長版故事" text={d.story_long} />
      {d.key_values?.length > 0 && (
        <div className="bg-surface border border-primary/8 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">核心價值</p>
          <ul className="space-y-1">
            {d.key_values.map((v, i) => (
              <li key={i} className="text-sm text-primary flex gap-2">
                <span className="text-accent shrink-0">•</span>{v}
              </li>
            ))}
          </ul>
        </div>
      )}
      {d.cta && <CopyBlock label="行動呼籲 (CTA)" text={d.cta} />}
    </div>
  );
}

// ── ProductLaunchPanel ────────────────────────────────────────────────────────

function ProductLaunchPanel({ result }: { result: unknown }) {
  const d = (result as ProductLaunchResult).product_launch;
  if (!d) return <RawJson result={result} />;
  return (
    <div className="space-y-3 pt-2">
      <CopyBlock label="產品名稱" text={d.product_name} />
      <CopyBlock label="標語" text={d.tagline} />
      {d.key_selling_points?.length > 0 && (
        <div className="bg-surface border border-primary/8 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">賣點</p>
          <ul className="space-y-2">
            {d.key_selling_points.map((sp, i) => (
              <li key={i} className="text-sm text-primary">
                <span className="text-accent font-semibold">✦ {sp.point}</span>
                {sp.description && <p className="text-xs text-secondary mt-0.5 ml-4">{sp.description}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {d.launch_posts?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-secondary uppercase tracking-wide">上市貼文</p>
          {d.launch_posts.map((post, i) => (
            <div key={i} className="bg-surface border border-primary/8 rounded-xl overflow-hidden">
              <div className="bg-surface-2 border-b border-primary/8 px-4 py-2">
                <span className="text-xs font-semibold text-accent">{post.platform}</span>
              </div>
              <p className="px-4 py-3 text-sm text-primary leading-relaxed whitespace-pre-line">{post.content}</p>
              {post.hashtags?.length > 0 && (
                <div className="px-4 pb-3 flex flex-wrap gap-1">
                  {post.hashtags.map(t => (
                    <span key={t} className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {d.campaign_slogans?.length > 0 && (
        <div className="bg-surface border border-primary/8 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">宣傳口號</p>
          <ul className="space-y-1">
            {d.campaign_slogans.map((s, i) => (
              <li key={i} className="text-sm text-primary flex gap-2">
                <span className="text-accent shrink-0">→</span>{s}
              </li>
            ))}
          </ul>
        </div>
      )}
      {d.email_subject && <CopyBlock label="電郵主旨" text={d.email_subject} />}
    </div>
  );
}

// ── BrandTrustPanel ───────────────────────────────────────────────────────────

function BrandTrustPanel({ result }: { result: unknown }) {
  const d = (result as BrandTrustResult).brand_trust;
  if (!d) return <RawJson result={result} />;
  return (
    <div className="space-y-3 pt-2">
      <CopyBlock label="信任標題" text={d.trust_headline} />
      <CopyBlock label="可信度聲明" text={d.credibility_statement} />
      {d.press_intro && <CopyBlock label="媒體介紹" text={d.press_intro} />}
      {d.testimonial_highlights?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-secondary uppercase tracking-wide">客戶見證</p>
          {d.testimonial_highlights.map((t, i) => (
            <div key={i} className="bg-surface border border-primary/8 rounded-xl px-4 py-3">
              <p className="text-sm text-primary italic leading-relaxed">「{t.quote}」</p>
              {t.attribution && (
                <p className="text-xs text-secondary mt-1.5 text-right">— {t.attribution}</p>
              )}
            </div>
          ))}
        </div>
      )}
      {d.social_proof_posts?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-secondary uppercase tracking-wide">社交證明貼文</p>
          {d.social_proof_posts.map((post, i) => (
            <div key={i} className="bg-surface border border-primary/8 rounded-xl overflow-hidden">
              <div className="bg-surface-2 border-b border-primary/8 px-4 py-2">
                <span className="text-xs font-semibold text-accent">{post.platform}</span>
              </div>
              <p className="px-4 py-3 text-sm text-primary leading-relaxed whitespace-pre-line">{post.content}</p>
              {post.hashtags?.length > 0 && (
                <div className="px-4 pb-3 flex flex-wrap gap-1">
                  {post.hashtags.map(t => (
                    <span key={t} className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {d.trust_badges?.length > 0 && (
        <div className="bg-surface border border-primary/8 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">信任標記</p>
          <div className="flex flex-wrap gap-2">
            {d.trust_badges.map((badge, i) => (
              <span key={i} className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full">{badge}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── BrandStrategyPanel ────────────────────────────────────────────────────────

function BrandStrategyPanel({ result }: { result: unknown }) {
  const d = (result as BrandStrategyResult).brand_strategy;
  if (!d) return <RawJson result={result} />;
  return (
    <div className="space-y-3 pt-2">
      <CopyBlock label="定位聲明" text={d.positioning_statement} />
      <CopyBlock label="差異化策略" text={d.differentiation_strategy} />
      {d.competitive_advantages?.length > 0 && (
        <div className="bg-surface border border-primary/8 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">競爭優勢</p>
          <ul className="space-y-2">
            {d.competitive_advantages.map((a, i) => (
              <li key={i} className="text-sm text-primary">
                <span className="text-accent font-semibold">★ {a.advantage}</span>
                {a.description && <p className="text-xs text-secondary mt-0.5 ml-4">{a.description}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {d.content_pillars?.length > 0 && (
        <div className="bg-surface border border-primary/8 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">內容支柱</p>
          <ul className="space-y-3">
            {d.content_pillars.map((cp, i) => (
              <li key={i}>
                <p className="text-sm font-semibold text-primary">◆ {cp.pillar}</p>
                {cp.description && <p className="text-xs text-secondary mt-0.5 ml-4">{cp.description}</p>}
                {cp.example_topics?.length > 0 && (
                  <div className="ml-4 mt-1 flex flex-wrap gap-1">
                    {cp.example_topics.map((t, j) => (
                      <span key={j} className="text-xs bg-primary/8 text-secondary px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {d.recommended_channels?.length > 0 && (
        <div className="bg-surface border border-primary/8 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">推薦渠道</p>
          <div className="flex flex-wrap gap-2">
            {d.recommended_channels.map((ch, i) => (
              <span key={i} className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">{ch}</span>
            ))}
          </div>
        </div>
      )}
      {d.action_plan?.length > 0 && (
        <div className="bg-surface border border-primary/8 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">行動計劃</p>
          <ol className="space-y-1">
            {d.action_plan.map((step, i) => (
              <li key={i} className="text-sm text-primary flex gap-2">
                <span className="text-accent font-bold shrink-0">{i + 1}.</span>{step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

// ── BrandPositioningPanel (v2 brand_strategy) ────────────────────────────────

function BrandPositioningPanel({ result }: { result: unknown }) {
  const d = (result as BrandPositioningResult).brand_positioning;
  if (!d) return <RawJson result={result} />;
  return (
    <div className="space-y-3 pt-2">
      <CopyBlock label="🎯 一句話品牌定位" text={d.one_liner} />
      {d.differentiation_angles?.length > 0 && (
        <div className="bg-surface border border-primary/8 rounded-xl px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-secondary uppercase tracking-wide">差異化角度</p>
          {d.differentiation_angles.map((a, i) => (
            <div key={i} className="border-l-2 border-accent/40 pl-3">
              <p className="text-sm font-semibold text-primary">{a.angle}</p>
              {a.description && <p className="text-xs text-secondary mt-0.5">{a.description}</p>}
            </div>
          ))}
        </div>
      )}
      {d.brand_voice_keywords?.length > 0 && (
        <div className="bg-surface border border-primary/8 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">品牌語氣關鍵詞</p>
          <div className="flex flex-wrap gap-2">
            {d.brand_voice_keywords.map((kw, i) => (
              <span key={i} className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full font-medium">{kw}</span>
            ))}
          </div>
        </div>
      )}
      {d.pain_points?.length > 0 && (
        <div className="bg-surface border border-primary/8 rounded-xl px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-secondary uppercase tracking-wide">核心痛點排序</p>
          {d.pain_points.map((p, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="text-xs font-bold text-accent/70 bg-accent/10 rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">{p.rank}</span>
              <div>
                <p className="text-sm text-primary">{p.pain}</p>
                {p.insight && <p className="text-xs text-secondary/70 mt-0.5">→ {p.insight}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
      {d.local_elements?.length > 0 && (
        <div className="bg-surface border border-primary/8 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">🇭🇰 香港本地化元素</p>
          <div className="flex flex-wrap gap-2">
            {d.local_elements.map((el, i) => (
              <span key={i} className="text-xs bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full">{el}</span>
            ))}
          </div>
        </div>
      )}
      {d.competitor_gaps?.length > 0 && (
        <div className="bg-surface border border-primary/8 rounded-xl px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-secondary uppercase tracking-wide">競爭對手弱點 → 我的機會</p>
          {d.competitor_gaps.map((g, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-danger/5 border border-danger/10 rounded-lg px-3 py-2">
                <span className="text-danger/70 font-medium">弱點：</span>
                <span className="text-primary">{g.competitor_weakness}</span>
              </div>
              <div className="bg-success/5 border border-success/10 rounded-lg px-3 py-2">
                <span className="text-success font-medium">機會：</span>
                <span className="text-primary">{g.our_opportunity}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {d.action_steps?.length > 0 && (
        <div className="bg-surface border border-primary/8 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">⚡ 立即行動步驟</p>
          <ol className="space-y-1.5">
            {d.action_steps.map((step, i) => (
              <li key={i} className="text-sm text-primary flex gap-2">
                <span className="text-accent font-bold shrink-0">{i + 1}.</span>{step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

// ── AdCopyPanel (v2 product_launch) ──────────────────────────────────────────

function AdCopyPanel({ result }: { result: unknown }) {
  const d = (result as AdCopyResult).ad_copy;
  if (!d) return <RawJson result={result} />;
  return (
    <div className="space-y-3 pt-2">
      <CopyBlock label="🪝 開場勾住注意力" text={d.hook} />
      <CopyBlock label="中段建立渴望" text={d.body} />
      <CopyBlock label="社會認證" text={d.social_proof} />
      <CopyBlock label="行動號召 CTA" text={d.cta} />
      <CopyBlock label="📋 完整廣告全文" text={d.full_copy} />
      {d.visual_direction && (
        <p className="text-xs text-secondary italic flex gap-1.5 px-1">
          <span>🖼</span>{d.visual_direction}
        </p>
      )}
      {d.hashtags?.length > 0 && (
        <div className="bg-surface border border-primary/8 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">Hashtag 策略</p>
          <div className="flex flex-wrap gap-1">
            {d.hashtags.map(t => (
              <span key={t} className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── ReviewToAdPanel (v2 brand_trust) ─────────────────────────────────────────

function ReviewToAdPanel({ result }: { result: unknown }) {
  const d = (result as ReviewToAdResult).review_to_ad;
  if (!d) return <RawJson result={result} />;
  return (
    <div className="space-y-3 pt-2">
      <CopyBlock label="💬 精煉引言（圖片廣告用）" text={d.quote_version} />
      <CopyBlock label="📖 故事化帖文（第一人稱）" text={d.story_version} />
      <CopyBlock label="📊 數據強化版" text={d.data_version} />
      <CopyBlock label="❓ 問答格式版" text={d.qa_version} />
      {d.hashtags?.length > 0 && (
        <div className="bg-surface border border-primary/8 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">Hashtag</p>
          <div className="flex flex-wrap gap-1">
            {d.hashtags.map(t => (
              <span key={t} className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Raw JSON fallback ─────────────────────────────────────────────────────────

function RawJson({ result }: { result: unknown }) {
  return (
    <pre className="text-xs text-secondary bg-surface-2 border border-primary/8 rounded-xl p-4 overflow-auto max-h-96 leading-relaxed">
      {JSON.stringify(result, null, 2)}
    </pre>
  );
}

// ── Result Renderer ───────────────────────────────────────────────────────────

function ResultPanel({ workflowKey, result }: { workflowKey: string | null; result: unknown }) {
  if (workflowKey === 'weekly_social') {
    const data = result as WeeklySocialResult;
    // v2 format: { strategy_note, posts: [] }
    const plan = data?.weekly_plan;
    const posts = Array.isArray(plan) ? plan : (plan as { posts?: WeeklyPost[] })?.posts;
    const strategyNote = !Array.isArray(plan) ? (plan as { strategy_note?: string })?.strategy_note : undefined;
    if (posts?.length) {
      return (
        <div className="space-y-3 pt-2">
          {strategyNote && (
            <p className="text-xs text-secondary/80 bg-surface-2 border border-primary/8 rounded-xl px-4 py-2.5 flex gap-2">
              <span>💡</span>{strategyNote}
            </p>
          )}
          {posts.map(post => <WeeklyPostCard key={post.day} post={post} />)}
        </div>
      );
    }
  }
  if (workflowKey === 'brand_story')    return <BrandStoryPanel result={result} />;
  if (workflowKey === 'product_launch') {
    // v2: ad_copy key; v1: product_launch key
    const r = result as Record<string, unknown>;
    if (r?.ad_copy) return <AdCopyPanel result={result} />;
    return <ProductLaunchPanel result={result} />;
  }
  if (workflowKey === 'brand_trust') {
    const r = result as Record<string, unknown>;
    if (r?.review_to_ad) return <ReviewToAdPanel result={result} />;
    return <BrandTrustPanel result={result} />;
  }
  if (workflowKey === 'brand_strategy') {
    const r = result as Record<string, unknown>;
    if (r?.brand_positioning) return <BrandPositioningPanel result={result} />;
    return <BrandStrategyPanel result={result} />;
  }
  return <RawJson result={result} />;
}

// ── Execution Card ────────────────────────────────────────────────────────────

function ExecCard({ exec }: { exec: ExecRow }) {
  const [open, setOpen] = useState(false);
  const wfKey = exec.workflows?.key ?? null;
  const wfName = exec.workflows?.name ?? '未知流程';
  const icon = WORKFLOW_ICONS[wfKey ?? ''] ?? '📄';
  const preview = inputPreview(exec.inputs ?? {});

  return (
    <div className="bg-surface border border-primary/8 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-surface-2 transition-colors"
      >
        <span className="text-2xl shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-primary">{wfName}</p>
          {preview && <p className="text-xs text-secondary truncate mt-0.5">{preview}</p>}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-secondary">{formatDate(exec.created_at)}</p>
          {exec.tokens_used && (
            <p className="text-xs text-secondary/50 mt-0.5">{exec.tokens_used.toLocaleString()} tokens</p>
          )}
        </div>
        <span className="text-secondary/50 text-sm ml-2">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-primary/8">
          {Object.keys(exec.inputs ?? {}).length > 0 && (
            <div className="mt-4 mb-4 bg-surface-2 rounded-xl px-4 py-3 space-y-1">
              <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">輸入資料</p>
              {Object.entries(exec.inputs).map(([k, v]) => v ? (
                <div key={k} className="flex gap-2 text-xs">
                  <span className="text-secondary/60 shrink-0 w-28 truncate">{k}</span>
                  <span className="text-secondary line-clamp-1">{v}</span>
                </div>
              ) : null)}
            </div>
          )}
          <ResultPanel workflowKey={wfKey} result={exec.result} />
        </div>
      )}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-accent mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ── Main LibraryView ──────────────────────────────────────────────────────────

export default function LibraryView({ initial }: { initial: ExecRow[] }) {
  const [execs, setExecs] = useState<ExecRow[]>(initial);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [offset, setOffset] = useState(initial.length);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initial.length === PAGE_SIZE);

  const fetchMore = useCallback(async (newFilter?: FilterKey) => {
    const activeFilter = newFilter ?? filter;
    const newOffset = newFilter !== undefined ? 0 : offset;

    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(newOffset) });
      if (activeFilter !== 'all') params.set('workflow_key', activeFilter);

      const res = await fetch(`/api/executions?${params}`);
      const data: ExecRow[] = await res.json();

      if (newFilter !== undefined) {
        setExecs(data);
        setOffset(data.length);
        setFilter(newFilter);
      } else {
        setExecs(prev => [...prev, ...data]);
        setOffset(newOffset + data.length);
      }
      setHasMore(data.length === PAGE_SIZE);
    } finally {
      setLoading(false);
    }
  }, [filter, offset]);

  const handleFilter = (key: FilterKey) => {
    if (key === filter) return;
    fetchMore(key);
  };

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => handleFilter(f.key)}
            className={`text-sm px-4 py-1.5 rounded-full font-medium transition-colors border ${
              filter === f.key
                ? 'bg-accent text-white border-accent'
                : 'text-secondary border-primary/10 hover:border-primary/20 hover:text-primary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading && execs.length === 0 ? (
        <div className="py-16"><Spinner /></div>
      ) : execs.length === 0 ? (
        <div className="bg-surface border border-primary/8 rounded-2xl p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-secondary text-sm">未有生成紀錄</p>
          <p className="text-secondary/60 text-xs mt-1">使用工作流程生成內容後，紀錄會顯示在這裡</p>
          <a href="/workflows" className="inline-block mt-4 text-sm text-accent hover:text-accent/80 font-medium">
            前往工作坊 →
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {execs.map(ex => <ExecCard key={ex.id} exec={ex} />)}
        </div>
      )}

      {/* Load more */}
      {hasMore && !loading && (
        <div className="text-center mt-6">
          <button
            onClick={() => fetchMore()}
            className="text-sm text-accent hover:text-accent/80 font-medium border border-accent/30 hover:border-accent/50 px-6 py-2 rounded-xl transition-colors"
          >
            載入更多
          </button>
        </div>
      )}
      {loading && execs.length > 0 && (
        <div className="py-6"><Spinner /></div>
      )}
    </div>
  );
}
