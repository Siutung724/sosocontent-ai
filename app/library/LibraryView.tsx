'use client';

import { useState, useCallback, useRef } from 'react';
import type { WeeklyPost, WeeklySocialResult } from '@/lib/workflow-types';
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
  weekly_social: '📅',
  brand_story: '✍️',
  product_launch: '🚀',
};

const PAGE_SIZE = 20;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-HK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function inputPreview(inputs: Record<string, string>): string {
  const vals = Object.values(inputs).filter(Boolean);
  const first = vals[0] ?? '';
  return first.length > 60 ? first.slice(0, 60) + '…' : first;
}

// ── Post Card (weekly_social result) ─────────────────────────────────────────

function WeeklyPostCard({ post }: { post: WeeklyPost }) {
  const [copied, setCopied] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { showToast } = useToast();

  const copy = async () => {
    await navigator.clipboard.writeText(`${post.content}\n\n${post.hashtags.join(' ')}`);
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

  return (
    <div className="bg-surface border border-primary/8 rounded-xl overflow-hidden">
      <div className="bg-surface-2 border-b border-primary/8 px-4 py-2.5 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-accent uppercase tracking-widest">Day {post.day}</span>
          <p className="text-sm font-semibold text-primary">{post.theme}</p>
        </div>
        <button
          onClick={copy}
          className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
            copied ? 'border-success/30 text-success bg-success/10' : 'border-primary/10 text-secondary hover:border-primary/20 hover:text-primary'
          }`}
        >
          {copied ? '✓ 已複製' : '複製'}
        </button>
      </div>
      <div className="px-4 py-3 space-y-2">
        <p className="text-sm text-primary leading-relaxed whitespace-pre-line">{post.content}</p>
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

      {/* Voice Bar */}
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
        <span className="text-xs text-secondary/60">系統預設聲線</span>
      </div>
    </div>
  );
}

// ── Result Renderer ───────────────────────────────────────────────────────────

function ResultPanel({ workflowKey, result }: { workflowKey: string | null; result: unknown }) {
  if (workflowKey === 'weekly_social') {
    const data = result as WeeklySocialResult;
    if (data?.weekly_plan?.length) {
      return (
        <div className="space-y-3 pt-2">
          {data.weekly_plan.map(post => <WeeklyPostCard key={post.day} post={post} />)}
        </div>
      );
    }
  }
  // Fallback: raw JSON
  return (
    <pre className="text-xs text-secondary bg-surface-2 border border-primary/8 rounded-xl p-4 overflow-auto max-h-96 leading-relaxed">
      {JSON.stringify(result, null, 2)}
    </pre>
  );
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
      {/* Header — always visible */}
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

      {/* Expanded result */}
      {open && (
        <div className="px-5 pb-5 border-t border-primary/8">
          {/* Input summary */}
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

type FilterKey = 'all' | string;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'weekly_social', label: '📅 每週社交媒體' },
];

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

  // ── Render ────────────────────────────────────────────────────────────────

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
