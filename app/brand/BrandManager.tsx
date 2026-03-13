'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BrandProfile } from '@/lib/workflow-types';
import { useToast } from '@/hooks/useToast';

// ── Constants ─────────────────────────────────────────────────────────────────

const TONE_OPTIONS = [
  { value: '輕鬆搞笑', label: '😄 輕鬆搞笑' },
  { value: '專業可信', label: '💼 專業可信' },
  { value: '溫暖貼地', label: '🤝 溫暖貼地' },
  { value: '活力年輕', label: '⚡ 活力年輕' },
  { value: '高端精緻', label: '✨ 高端精緻' },
];

const LANG_OPTIONS = [
  { value: '香港粵語口語＋繁體中文', label: '🇭🇰 香港粵語口語＋繁體中文' },
  { value: '台灣用語＋繁體中文', label: '🇹🇼 台灣用語＋繁體中文' },
  { value: '書面華語＋繁體中文', label: '📝 書面華語＋繁體中文' },
];

type FormData = {
  name: string;
  description: string;
  target_audience: string;
  tone: string;
  language_style: string;
  banned_words_raw: string; // comma-separated input
};

const EMPTY_FORM: FormData = {
  name: '',
  description: '',
  target_audience: '',
  tone: '',
  language_style: '',
  banned_words_raw: '',
};

function profileToForm(p: BrandProfile): FormData {
  return {
    name: p.name,
    description: p.description ?? '',
    target_audience: p.target_audience ?? '',
    tone: p.tone ?? '',
    language_style: p.language_style ?? '',
    banned_words_raw: (p.banned_words ?? []).join('、'),
  };
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ── Form ──────────────────────────────────────────────────────────────────────

function ProfileForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: FormData;
  onSave: (data: FormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormData>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof FormData, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-secondary mb-1.5">
          品牌名稱 <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          required
          placeholder="例如：好味小廚"
          className="w-full bg-surface-2 border border-primary/10 rounded-xl px-3 py-2.5 text-sm text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-secondary mb-1.5">品牌描述</label>
        <textarea
          value={form.description}
          onChange={e => set('description', e.target.value)}
          rows={3}
          placeholder="例如：香港本地家庭式茶餐廳，主打懷舊港式飲食文化..."
          className="w-full bg-surface-2 border border-primary/10 rounded-xl px-3 py-2.5 text-sm text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 resize-y"
        />
      </div>

      {/* Target Audience */}
      <div>
        <label className="block text-sm font-medium text-secondary mb-1.5">目標受眾</label>
        <input
          type="text"
          value={form.target_audience}
          onChange={e => set('target_audience', e.target.value)}
          placeholder="例如：25-45 歲、居港家庭、懷舊飲食愛好者"
          className="w-full bg-surface-2 border border-primary/10 rounded-xl px-3 py-2.5 text-sm text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50"
        />
      </div>

      {/* Tone + Language side-by-side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-secondary mb-1.5">語氣風格</label>
          <select
            value={form.tone}
            onChange={e => set('tone', e.target.value)}
            className="w-full bg-surface-2 border border-primary/10 rounded-xl px-3 py-2.5 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50"
          >
            <option value="">請選擇...</option>
            {TONE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-1.5">語言風格</label>
          <select
            value={form.language_style}
            onChange={e => set('language_style', e.target.value)}
            className="w-full bg-surface-2 border border-primary/10 rounded-xl px-3 py-2.5 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50"
          >
            <option value="">請選擇...</option>
            {LANG_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Banned Words */}
      <div>
        <label className="block text-sm font-medium text-secondary mb-1.5">
          禁用詞語
          <span className="text-secondary/60 font-normal ml-1">（以頓號「、」分隔）</span>
        </label>
        <input
          type="text"
          value={form.banned_words_raw}
          onChange={e => set('banned_words_raw', e.target.value)}
          placeholder="例如：便宜、打折、劣質"
          className="w-full bg-surface-2 border border-primary/10 rounded-xl px-3 py-2.5 text-sm text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50"
        />
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger rounded-xl px-4 py-3 text-sm">
          ⚠️ {error}
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-accent hover:bg-accent/90 disabled:opacity-50 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors"
        >
          {saving ? <><Spinner /> 儲存中...</> : '儲存品牌'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-secondary hover:text-primary font-medium px-4 py-2.5 rounded-xl border border-primary/10 hover:border-primary/20 transition-colors"
        >
          取消
        </button>
      </div>
    </form>
  );
}

// ── Profile Card ──────────────────────────────────────────────────────────────

function ProfileCard({
  profile,
  onEdit,
  onDelete,
}: {
  profile: BrandProfile;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    onDelete();
  };

  return (
    <div className="bg-surface border border-primary/8 hover:border-primary/10 rounded-2xl p-5 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-semibold text-primary text-base">{profile.name}</h3>
          {profile.tone && (
            <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded-full mt-1 inline-block">
              {profile.tone}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onEdit}
            className="text-xs text-secondary hover:text-primary border border-primary/10 hover:border-primary/20 px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            編輯
          </button>
          {confirming ? (
            <div className="flex gap-1">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs text-white bg-danger hover:bg-danger/90 px-2.5 py-1.5 rounded-lg font-medium transition-colors"
              >
                {deleting ? '刪除中...' : '確認刪除'}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="text-xs text-secondary border border-primary/10 px-2 py-1.5 rounded-lg"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="text-xs text-secondary hover:text-danger border border-primary/10 hover:border-danger/30 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              刪除
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1.5 text-sm text-secondary">
        {profile.description && (
          <p className="line-clamp-2 text-secondary">{profile.description}</p>
        )}
        {profile.target_audience && (
          <p><span className="text-secondary/60">目標受眾：</span>{profile.target_audience}</p>
        )}
        {profile.language_style && (
          <p><span className="text-secondary/60">語言：</span>{profile.language_style}</p>
        )}
        {profile.banned_words?.length > 0 && (
          <p><span className="text-secondary/60">禁用詞：</span>{profile.banned_words.join('、')}</p>
        )}
      </div>
    </div>
  );
}

// ── Main Manager ──────────────────────────────────────────────────────────────

type View = { mode: 'list' } | { mode: 'create' } | { mode: 'edit'; profile: BrandProfile };

export default function BrandManager({ initial }: { initial: BrandProfile[] }) {
  const [profiles, setProfiles] = useState<BrandProfile[]>(initial);
  const [view, setView] = useState<View>({ mode: 'list' });
  const { showToast } = useToast();
  const router = useRouter();

  // ── API helpers ────────────────────────────────────────────────────────────

  const formDataToPayload = (form: FormData) => ({
    name: form.name,
    description: form.description || null,
    target_audience: form.target_audience || null,
    tone: form.tone || null,
    language_style: form.language_style || null,
    banned_words: form.banned_words_raw
      ? form.banned_words_raw.split(/[,，、]/).map(s => s.trim()).filter(Boolean)
      : [],
  });

  const handleCreate = async (form: FormData) => {
    const res = await fetch('/api/brand-profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formDataToPayload(form)),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? '建立失敗');
    setProfiles(prev => [data as BrandProfile, ...prev]);
    setView({ mode: 'list' });
    showToast('success', `品牌「${form.name}」已建立`);
  };

  const handleUpdate = async (form: FormData, id: string) => {
    const res = await fetch(`/api/brand-profiles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formDataToPayload(form)),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? '更新失敗');
    setProfiles(prev => prev.map(p => (p.id === id ? (data as BrandProfile) : p)));
    setView({ mode: 'list' });
    showToast('success', '品牌資料已更新');
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/brand-profiles/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      showToast('error', data.error ?? '刪除失敗');
      return;
    }
    setProfiles(prev => prev.filter(p => p.id !== id));
    if (view.mode === 'edit' && view.profile.id === id) setView({ mode: 'list' });
    showToast('success', '品牌資料已刪除');
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Form panel ── */}
      {(view.mode === 'create' || view.mode === 'edit') && (
        <div className="bg-surface border border-accent/20 rounded-2xl p-6 mb-6">
          <h2 className="text-base font-semibold text-primary mb-5">
            {view.mode === 'create' ? '➕ 新增品牌資料' : '✏️ 編輯品牌資料'}
          </h2>
          <ProfileForm
            initial={view.mode === 'edit' ? profileToForm(view.profile) : EMPTY_FORM}
            onSave={form =>
              view.mode === 'edit'
                ? handleUpdate(form, view.profile.id)
                : handleCreate(form)
            }
            onCancel={() => setView({ mode: 'list' })}
          />
        </div>
      )}

      {/* ── List header ── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-secondary uppercase tracking-widest">
          品牌資料庫 ({profiles.length})
        </h2>
        {view.mode === 'list' && (
          <button
            onClick={() => setView({ mode: 'create' })}
            className="text-sm bg-accent hover:bg-accent/90 text-white font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            ＋ 新增品牌
          </button>
        )}
      </div>

      {/* ── Profile list ── */}
      {profiles.length === 0 ? (
        <div className="bg-surface border border-primary/8 rounded-2xl p-10 text-center">
          <p className="text-4xl mb-3">🏷️</p>
          <p className="text-secondary text-sm">未有品牌資料</p>
          <p className="text-secondary/60 text-xs mt-1">建立品牌資料後，AI 生成的內容會更貼合你的品牌</p>
          <button
            onClick={() => setView({ mode: 'create' })}
            className="mt-4 text-sm text-accent hover:text-accent/80 font-medium"
          >
            立即新增 →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {profiles.map(p => (
            <ProfileCard
              key={p.id}
              profile={p}
              onEdit={() => setView({ mode: 'edit', profile: p })}
              onDelete={() => handleDelete(p.id)}
            />
          ))}
        </div>
      )}

      {/* ── Voice Profile Card (placeholder) ── */}
      <div className="mt-10">
        <h2 className="text-xs font-semibold text-secondary uppercase tracking-widest mb-4">
          聲線設定
        </h2>
        <div className="bg-surface border border-primary/8 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-primary">我的聲線（Voice Profile）</h3>
              <p className="text-xs text-secondary mt-0.5">用你的聲線朗讀 AI 生成的內容</p>
            </div>
            <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full shrink-0">
              未建立
            </span>
          </div>
          <div className="space-y-1.5 text-sm text-secondary mb-5">
            <p><span className="text-secondary/60">聲線名稱：</span>預設聲線</p>
            <p><span className="text-secondary/60">語言：</span>暫未設定</p>
            <p><span className="text-secondary/60">訓練狀態：</span>未建立</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/settings/voice')}
              className="text-sm bg-accent hover:bg-accent/90 text-white font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              前往聲線設定 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
