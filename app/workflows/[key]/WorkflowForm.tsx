'use client';

import { useState, useRef } from 'react';
import { useToast } from '@/hooks/useToast';
import type {
  PromptVariable, WeeklyPost, WeeklySocialResult,
  BrandStoryResult, ProductLaunchResult,
  BrandTrustResult, BrandStrategyResult,
  WorkflowResult,
} from '@/lib/workflow-types';

interface WorkflowFormProps {
  workflowKey: string;
  variables: PromptVariable[];
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ── Copy Button ───────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`shrink-0 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
        copied
          ? 'border-success/30 text-success bg-success/10'
          : 'border-primary/10 text-secondary hover:border-primary/20 hover:text-primary'
      }`}
    >
      {copied ? '✓ 已複製' : '複製'}
    </button>
  );
}

// ── Post Card ─────────────────────────────────────────────────────────────────

function PostCard({ post, executionId }: { post: WeeklyPost; executionId: string | null }) {
  const [copied, setCopied]       = useState(false);
  const [audioUrl, setAudioUrl]   = useState<string | null>(null);
  const [ttsState, setTtsState]   = useState<'idle' | 'loading' | 'playing'>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { showToast } = useToast();

  const handleCopy = async () => {
    const text = [post.content, '', post.hashtags.join(' ')].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: do nothing silently
    }
  };

  const handleTts = async () => {
    if (ttsState === 'loading') return;
    // If already playing, pause
    if (ttsState === 'playing' && audioRef.current) {
      audioRef.current.pause();
      setTtsState('idle');
      return;
    }
    // If we already have a URL, just play again
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => setTtsState('idle');
      audio.play();
      setTtsState('playing');
      return;
    }
    setTtsState('loading');
    try {
      const body = executionId
        ? { executionId, text: post.content }
        : { text: post.content.slice(0, 500) };
      const res  = await fetch('/api/tts/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const data = await res.json() as { audio_url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? '生成失敗');
      setAudioUrl(data.audio_url!);
      const audio = new Audio(data.audio_url!);
      audioRef.current = audio;
      audio.onended = () => setTtsState('idle');
      audio.play();
      setTtsState('playing');
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : '語音生成失敗');
      setTtsState('idle');
    }
  };

  return (
    <div className="bg-surface border border-primary/8 rounded-2xl overflow-hidden">
      {/* Card header */}
      <div className="bg-surface-2 border-b border-primary/8 px-5 py-3 flex items-start justify-between gap-3">
        <div>
          <span className="block text-xs font-bold text-accent uppercase tracking-widest mb-0.5">
            Day {post.day}
          </span>
          <h3 className="text-base font-semibold text-primary leading-snug">
            {post.theme}
          </h3>
        </div>
        <button
          onClick={handleCopy}
          className={`shrink-0 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors duration-150 ${
            copied
              ? 'border-success/30 text-success bg-success/10'
              : 'border-primary/10 text-secondary hover:border-primary/20 hover:text-primary'
          }`}
        >
          {copied ? '✓ 已複製' : '複製全文'}
        </button>
      </div>

      {/* Card body */}
      <div className="px-5 py-4 space-y-3">
        {/* Main content */}
        <p className="text-sm text-primary leading-relaxed whitespace-pre-line">
          {post.content}
        </p>

        {/* Visual concept */}
        {post.visual_concept && (
          <p className="text-xs text-secondary italic flex items-start gap-1.5">
            <span className="shrink-0 mt-0.5">🖼</span>
            <span>{post.visual_concept}</span>
          </p>
        )}

        {/* Hashtags */}
        {post.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {post.hashtags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-accent/10 text-accent px-2.5 py-0.5 rounded-full font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Voice Bar */}
      <div className="border-t border-primary/8 px-5 py-2.5 flex items-center justify-between gap-3">
        <button
          onClick={handleTts}
          disabled={ttsState === 'loading'}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors border ${
            ttsState === 'playing'
              ? 'border-cta/40 text-cta bg-cta/10'
              : 'border-accent/30 text-accent hover:bg-accent/10'
          } disabled:opacity-50`}
        >
          {ttsState === 'loading' ? (
            <Spinner />
          ) : ttsState === 'playing' ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
              <path d="M4 4h3v8H4V4zm5 0h3v8H9V4z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
              <path d="M3 3.732a1.5 1.5 0 0 1 2.305-1.265l6.706 4.268a1.5 1.5 0 0 1 0 2.53L5.305 13.533A1.5 1.5 0 0 1 3 12.268V3.732Z" />
            </svg>
          )}
          {ttsState === 'loading' ? '生成語音中...' : ttsState === 'playing' ? '停止' : '播放語音'}
        </button>
        <span className="text-xs text-secondary/50">MiniMax 粵語 TTS</span>
      </div>
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

export default function WorkflowForm({ workflowKey, variables }: WorkflowFormProps) {
  // Initialise inputs with any default_value from DB
  const [inputs, setInputs] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    variables.forEach((v) => {
      if (v.default_value) init[v.name] = v.default_value;
    });
    return init;
  });

  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [result, setResult]             = useState<WorkflowResult | null>(null);
  const [executionId, setExecutionId]   = useState<string | null>(null);
  const { showToast } = useToast();

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleChange = (name: string, value: string) => {
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleMultiSelect = (name: string, value: string, checked: boolean) => {
    const current = inputs[name] ? inputs[name].split(',').filter(Boolean) : [];
    const next = checked ? [...current, value] : current.filter((v) => v !== value);
    setInputs((prev) => ({ ...prev, [name]: next.join(',') }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowKey, inputs }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          setQuotaExceeded(true);
          return;
        }
        setError(data.error ?? '生成失敗，請稍後再試');
        showToast('error', data.error ?? '生成失敗，請稍後再試');
        return;
      }

      setResult(data.result as WorkflowResult);
      setExecutionId(data.executionId ?? null);
      const successMsg: Record<string, string> = {
        weekly_social:   '7 日貼文計劃已生成！',
        brand_story:     '品牌故事文案已生成！',
        product_launch:  '新品推廣文案套件已生成！',
        brand_trust:     '品牌公信力內容已生成！',
        brand_strategy:  '競爭分析與策略已生成！',
      };
      showToast('success', successMsg[workflowKey] ?? '內容已生成！');
    } catch {
      setError('網絡錯誤，請稍後再試');
      showToast('error', '網絡錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Form ── */}
      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-primary/8 rounded-2xl p-6 space-y-6"
      >
        {variables.length === 0 && (
          <p className="text-sm text-secondary text-center py-4">
            呢個工作流程暫時未設定輸入欄位
          </p>
        )}

        {variables.map((v) => (
          <div key={v.id}>
            <label className="block text-sm font-medium text-secondary mb-1.5">
              {v.label}
              {v.required && <span className="text-danger ml-1">*</span>}
            </label>

            {/* text */}
            {v.type === 'text' && (
              <input
                type="text"
                value={inputs[v.name] ?? ''}
                onChange={(e) => handleChange(v.name, e.target.value)}
                required={v.required}
                placeholder={v.default_value ?? ''}
                className="w-full bg-surface-2 border border-primary/10 rounded-xl px-3 py-2.5 text-sm text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition"
              />
            )}

            {/* textarea */}
            {v.type === 'textarea' && (
              <textarea
                value={inputs[v.name] ?? ''}
                onChange={(e) => handleChange(v.name, e.target.value)}
                required={v.required}
                rows={4}
                placeholder={v.default_value ?? ''}
                className="w-full bg-surface-2 border border-primary/10 rounded-xl px-3 py-2.5 text-sm text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 resize-y transition"
              />
            )}

            {/* select */}
            {v.type === 'select' && v.options && (
              <select
                value={inputs[v.name] ?? ''}
                onChange={(e) => handleChange(v.name, e.target.value)}
                required={v.required}
                className="w-full bg-surface-2 border border-primary/10 rounded-xl px-3 py-2.5 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition"
              >
                <option value="">請選擇...</option>
                {v.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            {/* multi-select → checkboxes */}
            {v.type === 'multi-select' && v.options && (
              <div className="grid grid-cols-2 gap-2">
                {v.options.map((opt) => {
                  const selected = inputs[v.name]?.split(',').includes(opt.value) ?? false;
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2 cursor-pointer rounded-xl border px-3 py-2 text-sm transition ${
                        selected
                          ? 'border-accent/50 bg-accent/10 text-accent'
                          : 'border-primary/10 text-secondary hover:border-primary/20 hover:text-primary'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) =>
                          handleMultiSelect(v.name, opt.value, e.target.checked)
                        }
                        className="rounded border-primary/20 text-accent focus:ring-accent/50"
                      />
                      {opt.label}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {/* Quota exceeded banner */}
        {quotaExceeded && (
          <div className="bg-accent/8 border border-accent/30 rounded-xl px-4 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary">本月免費額度已用盡 🔒</p>
              <p className="text-xs text-secondary mt-0.5">升級至 Pro，即享無限 AI 生成</p>
            </div>
            <a
              href="/pricing"
              className="shrink-0 bg-accent text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-accent/90 transition-colors"
            >
              立即升級 →
            </a>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger rounded-xl px-4 py-3 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl transition-colors text-sm"
        >
          {loading ? (
            <>
              <Spinner />
              AI 緊係幫你寫緊...
            </>
          ) : (
            '✨ 生成內容'
          )}
        </button>
      </form>

      {/* ── Loading overlay ── */}
      {loading && (
        <div className="mt-6 text-center text-secondary text-sm animate-pulse">
          {{
            weekly_social:  'AI 正在生成 7 日貼文計劃，請稍候...',
            brand_story:    'AI 正在撰寫你的品牌故事，請稍候...',
            product_launch: 'AI 正在生成推廣文案套件，請稍候...',
            brand_trust:    'AI 正在整理品牌公信力內容，請稍候...',
            brand_strategy: 'AI 正在分析競爭環境，請稍候...',
          }[workflowKey] ?? 'AI 正在生成內容，請稍候...'}
        </div>
      )}

      {/* ── Results: weekly_social ── */}
      {result && 'weekly_plan' in result && (result as WeeklySocialResult).weekly_plan.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-primary">📅 本週貼文計劃</h2>
            <span className="text-xs text-secondary bg-surface border border-primary/8 px-2.5 py-1 rounded-full">
              共 {(result as WeeklySocialResult).weekly_plan.length} 篇
            </span>
          </div>
          <div className="space-y-4">
            {(result as WeeklySocialResult).weekly_plan.map((post) => (
              <PostCard key={post.day} post={post} executionId={executionId} />
            ))}
          </div>
          <p className="text-xs text-secondary text-center mt-8">內容由 AI 生成，建議人工校對後再發佈</p>
        </div>
      )}

      {/* ── Results: brand_story ── */}
      {result && 'brand_story' in result && (() => {
        const bs = (result as BrandStoryResult).brand_story;
        return (
          <div className="mt-10 space-y-6">
            <h2 className="text-xl font-bold text-primary">✍️ 品牌故事套件</h2>

            {/* Headline + tagline */}
            <div className="bg-surface border border-primary/8 rounded-2xl p-5 space-y-2">
              <p className="text-xs text-secondary uppercase tracking-widest font-semibold">標題 ／ 標語</p>
              <p className="text-2xl font-bold text-primary">{bs.headline}</p>
              <p className="text-accent font-medium">{bs.tagline}</p>
            </div>

            {/* Short story */}
            <div className="bg-surface border border-primary/8 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-secondary uppercase tracking-widest font-semibold">短版故事（社交媒體）</p>
                <CopyButton text={bs.story_short} />
              </div>
              <p className="text-sm text-primary leading-relaxed whitespace-pre-wrap">{bs.story_short}</p>
            </div>

            {/* Long story */}
            <div className="bg-surface border border-primary/8 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-secondary uppercase tracking-widest font-semibold">長版故事（官網 About Us）</p>
                <CopyButton text={bs.story_long} />
              </div>
              <p className="text-sm text-primary leading-relaxed whitespace-pre-wrap">{bs.story_long}</p>
            </div>

            {/* Key values */}
            <div className="bg-surface border border-primary/8 rounded-2xl p-5 space-y-3">
              <p className="text-xs text-secondary uppercase tracking-widest font-semibold">核心價值</p>
              <div className="flex flex-wrap gap-2">
                {bs.key_values.map((v, i) => (
                  <span key={i} className="bg-accent/10 text-accent border border-accent/20 text-xs font-medium px-3 py-1.5 rounded-full">{v}</span>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="bg-cta/10 border border-cta/20 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-secondary uppercase tracking-widest font-semibold mb-1">行動呼籲句子</p>
                <p className="text-primary font-semibold">{bs.cta}</p>
              </div>
              <CopyButton text={bs.cta} />
            </div>

            <p className="text-xs text-secondary text-center">內容由 AI 生成，建議人工校對後再發佈</p>
          </div>
        );
      })()}

      {/* ── Results: product_launch ── */}
      {result && 'product_launch' in result && (() => {
        const pl = (result as ProductLaunchResult).product_launch;
        return (
          <div className="mt-10 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary">🚀 推廣文案套件</h2>
              <span className="text-xs text-secondary bg-surface border border-primary/8 px-2.5 py-1 rounded-full">{pl.product_name}</span>
            </div>

            {/* Tagline */}
            <div className="bg-surface border border-primary/8 rounded-2xl p-5">
              <p className="text-xs text-secondary uppercase tracking-widest font-semibold mb-2">產品標語</p>
              <p className="text-2xl font-bold text-accent">{pl.tagline}</p>
            </div>

            {/* Key selling points */}
            <div className="bg-surface border border-primary/8 rounded-2xl p-5 space-y-3">
              <p className="text-xs text-secondary uppercase tracking-widest font-semibold">核心賣點</p>
              {pl.key_selling_points.map((ksp, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-cta/20 text-cta text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <div>
                    <p className="text-sm font-semibold text-primary">{ksp.point}</p>
                    <p className="text-xs text-secondary mt-0.5">{ksp.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Launch posts */}
            <div className="space-y-3">
              <p className="text-xs text-secondary uppercase tracking-widest font-semibold">社交媒體推廣貼文</p>
              {pl.launch_posts.map((lp, i) => (
                <div key={i} className="bg-surface border border-primary/8 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-cta bg-cta/10 border border-cta/20 px-2.5 py-1 rounded-full">{lp.platform}</span>
                    <CopyButton text={lp.content} />
                  </div>
                  <p className="text-sm text-primary leading-relaxed whitespace-pre-wrap">{lp.content}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {lp.hashtags.map((h, j) => (
                      <span key={j} className="text-xs text-secondary/60 bg-surface-2 px-2 py-0.5 rounded-full">{h}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Campaign slogans */}
            <div className="bg-surface border border-primary/8 rounded-2xl p-5 space-y-3">
              <p className="text-xs text-secondary uppercase tracking-widest font-semibold">活動口號</p>
              {pl.campaign_slogans.map((s, i) => (
                <div key={i} className="flex items-center justify-between gap-3 bg-surface-2 rounded-xl px-4 py-2.5">
                  <p className="text-sm text-primary font-medium">「{s}」</p>
                  <CopyButton text={s} />
                </div>
              ))}
            </div>

            {/* Email subject */}
            <div className="bg-surface border border-primary/8 rounded-2xl p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-secondary uppercase tracking-widest font-semibold mb-1">電郵主題</p>
                <p className="text-primary font-medium text-sm">{pl.email_subject}</p>
              </div>
              <CopyButton text={pl.email_subject} />
            </div>

            <p className="text-xs text-secondary text-center">內容由 AI 生成，建議人工校對後再發佈</p>
          </div>
        );
      })()}

      {/* ── Results: brand_trust ── */}
      {result && 'brand_trust' in result && (() => {
        const bt = (result as BrandTrustResult).brand_trust;
        return (
          <div className="mt-10 space-y-6">
            <h2 className="text-xl font-bold text-primary">🏷️ 品牌公信力套件</h2>

            {/* Headline + credibility */}
            <div className="bg-surface border border-primary/8 rounded-2xl p-5 space-y-3">
              <p className="text-2xl font-bold text-primary">{bt.trust_headline}</p>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-secondary leading-relaxed flex-1">{bt.credibility_statement}</p>
                <CopyButton text={bt.credibility_statement} />
              </div>
            </div>

            {/* Press intro */}
            <div className="bg-surface border border-primary/8 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-secondary uppercase tracking-widest font-semibold">媒體報導引言</p>
                <CopyButton text={bt.press_intro} />
              </div>
              <p className="text-sm text-primary leading-relaxed">{bt.press_intro}</p>
            </div>

            {/* Trust badges */}
            <div className="bg-surface border border-primary/8 rounded-2xl p-5 space-y-3">
              <p className="text-xs text-secondary uppercase tracking-widest font-semibold">信任標誌</p>
              <div className="flex flex-wrap gap-2">
                {bt.trust_badges.map((badge, i) => (
                  <span key={i} className="bg-cta/10 text-cta border border-cta/20 text-xs font-semibold px-3 py-1.5 rounded-full">
                    ✓ {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Testimonials */}
            <div className="space-y-3">
              <p className="text-xs text-secondary uppercase tracking-widest font-semibold">客戶見證</p>
              {bt.testimonial_highlights.map((t, i) => (
                <div key={i} className="bg-surface border border-primary/8 rounded-2xl p-5">
                  <p className="text-sm text-primary font-medium leading-relaxed mb-2">「{t.quote}」</p>
                  <p className="text-xs text-secondary/60">— {t.attribution}</p>
                </div>
              ))}
            </div>

            {/* Social proof posts */}
            <div className="space-y-3">
              <p className="text-xs text-secondary uppercase tracking-widest font-semibold">社交媒體貼文</p>
              {bt.social_proof_posts.map((sp, i) => (
                <div key={i} className="bg-surface border border-primary/8 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-accent bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-full">{sp.platform}</span>
                    <CopyButton text={sp.content} />
                  </div>
                  <p className="text-sm text-primary leading-relaxed whitespace-pre-wrap">{sp.content}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {sp.hashtags.map((h, j) => (
                      <span key={j} className="text-xs text-secondary/60 bg-surface-2 px-2 py-0.5 rounded-full">{h}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-secondary text-center">內容由 AI 生成，建議人工校對後再發佈</p>
          </div>
        );
      })()}

      {/* ── Results: brand_strategy ── */}
      {result && 'brand_strategy' in result && (() => {
        const bs = (result as BrandStrategyResult).brand_strategy;
        return (
          <div className="mt-10 space-y-6">
            <h2 className="text-xl font-bold text-primary">📚 競爭分析報告</h2>

            {/* Positioning */}
            <div className="bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 rounded-2xl p-5">
              <p className="text-xs text-secondary uppercase tracking-widest font-semibold mb-2">品牌定位聲明</p>
              <p className="text-lg font-bold text-primary">{bs.positioning_statement}</p>
            </div>

            {/* Competitive advantages */}
            <div className="bg-surface border border-primary/8 rounded-2xl p-5 space-y-3">
              <p className="text-xs text-secondary uppercase tracking-widest font-semibold">競爭優勢</p>
              {bs.competitive_advantages.map((ca, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <div>
                    <p className="text-sm font-semibold text-primary">{ca.advantage}</p>
                    <p className="text-xs text-secondary mt-0.5">{ca.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Differentiation */}
            <div className="bg-surface border border-primary/8 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-secondary uppercase tracking-widest font-semibold">差異化策略</p>
                <CopyButton text={bs.differentiation_strategy} />
              </div>
              <p className="text-sm text-primary leading-relaxed">{bs.differentiation_strategy}</p>
            </div>

            {/* Content pillars */}
            <div className="space-y-3">
              <p className="text-xs text-secondary uppercase tracking-widest font-semibold">內容支柱</p>
              {bs.content_pillars.map((cp, i) => (
                <div key={i} className="bg-surface border border-primary/8 rounded-2xl p-5">
                  <p className="text-sm font-semibold text-primary mb-1">{cp.pillar}</p>
                  <p className="text-xs text-secondary mb-2">{cp.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cp.example_topics.map((t, j) => (
                      <span key={j} className="text-xs bg-surface-2 border border-primary/8 text-secondary px-2.5 py-1 rounded-lg">{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Channels + Action plan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-surface border border-primary/8 rounded-2xl p-5 space-y-3">
                <p className="text-xs text-secondary uppercase tracking-widest font-semibold">推薦渠道</p>
                {bs.recommended_channels.map((ch, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                    <span className="text-sm text-primary">{ch}</span>
                  </div>
                ))}
              </div>
              <div className="bg-surface border border-primary/8 rounded-2xl p-5 space-y-3">
                <p className="text-xs text-secondary uppercase tracking-widest font-semibold">行動計劃</p>
                {bs.action_plan.map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-cta/15 text-cta text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <span className="text-xs text-primary leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-secondary text-center">內容由 AI 生成，建議人工校對後再發佈</p>
          </div>
        );
      })()}
    </div>
  );
}
