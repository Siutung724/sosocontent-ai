'use client';

import { useState, useRef } from 'react';
import type { VoiceProfile } from '@/lib/workflow-types';
import { useToast } from '@/hooks/useToast';
import { MINIMAX_CANTONESE_VOICES, MINIMAX_EMOTIONS } from '@/lib/tts/minimax';
import { createClient } from '@/lib/supabase-browser';

// ── Constants ─────────────────────────────────────────────────────────────────

const LANGUAGE_OPTIONS = [
  { value: 'yue-HK', label: '🇭🇰 廣東話・粵語 (yue-HK)' },
  { value: 'zh-TW',  label: '🇹🇼 普通話・繁體 (zh-TW)' },
  { value: 'zh-CN',  label: '🇨🇳 普通話・簡體 (zh-CN)' },
];

const DEMO_TEXT = '你好！我係 sosocontent 嘅 AI 助理，我可以幫你生成地道廣東話品牌文案。';

// ── Types ─────────────────────────────────────────────────────────────────────

type FormData = {
  display_name:      string;
  provider:          string;
  provider_voice_id: string;
  language:          string;
  description:       string;
  default_emotion:   string;
  default_speed:     number;
  default_vol:       number;
  default_pitch:     number;
  is_default:        boolean;
  sample_audio_url:  string;
};

const EMPTY_FORM: FormData = {
  display_name:      '',
  provider:          'minimax',
  provider_voice_id: 'Cantonese_crisp_news_anchor_vv2',
  language:          'yue-HK',
  description:       '',
  default_emotion:   'neutral',
  default_speed:     1.0,
  default_vol:       1.0,
  default_pitch:     1.0,
  is_default:        false,
  sample_audio_url:  '',
};

function profileToForm(p: VoiceProfile): FormData {
  return {
    display_name:      p.display_name,
    provider:          p.provider,
    provider_voice_id: p.provider_voice_id ?? '',
    language:          p.language,
    description:       p.description ?? '',
    default_emotion:   p.default_emotion,
    default_speed:     p.default_speed,
    default_vol:       p.default_vol,
    default_pitch:     p.default_pitch,
    is_default:        p.is_default,
    sample_audio_url:  (p as VoiceProfile & { sample_audio_url?: string }).sample_audio_url ?? '',
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

// ── Slider field ──────────────────────────────────────────────────────────────

function SliderField({
  label, value, min, max, step, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-secondary">{label}</label>
        <span className="text-xs text-primary font-medium tabular-nums">{value.toFixed(1)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-cta"
      />
      <div className="flex justify-between text-xs text-secondary/50 mt-0.5">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}

// ── Download helper ───────────────────────────────────────────────────────────

async function downloadAudio(url: string, filename = 'voice-preview.mp3') {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  } catch {
    window.open(url, '_blank');
  }
}

function DownloadButton({
  url,
  filename = 'voice-preview.mp3',
  iconOnly = false,
}: {
  url: string;
  filename?: string;
  iconOnly?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      title="下載 MP3"
      onClick={async () => { setBusy(true); await downloadAudio(url, filename); setBusy(false); }}
      disabled={busy}
      className={`flex items-center gap-1 font-medium transition-colors disabled:opacity-50 border rounded-lg text-xs
        border-primary/10 hover:border-primary/20 text-secondary hover:text-primary
        ${iconOnly ? 'px-2 py-1.5' : 'px-2.5 py-1.5'}`}
    >
      {busy ? <Spinner /> : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 shrink-0">
          <path d="M8.75 2.75a.75.75 0 0 0-1.5 0v5.69L5.03 6.22a.75.75 0 0 0-1.06 1.06l3.5 3.5a.75.75 0 0 0 1.06 0l3.5-3.5a.75.75 0 0 0-1.06-1.06L8.75 8.44V2.75Z" />
          <path d="M3.5 9.75a.75.75 0 0 0-1.5 0v1.5A2.75 2.75 0 0 0 4.75 14h6.5A2.75 2.75 0 0 0 14 11.25v-1.5a.75.75 0 0 0-1.5 0v1.5c0 .69-.56 1.25-1.25 1.25h-6.5c-.69 0-1.25-.56-1.25-1.25v-1.5Z" />
        </svg>
      )}
      {!iconOnly && <span>{busy ? '下載中...' : '下載 MP3'}</span>}
    </button>
  );
}

// ── Audio Sample Panel ────────────────────────────────────────────────────────
// Rendered in TOP-LEFT cell when editing

function AudioSamplePanel({
  sampleUrl, onUrlChange,
}: {
  sampleUrl: string;
  onUrlChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorderRef  = useRef<MediaRecorder | null>(null);
  const recTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const uploadAudioBlob = async (blob: Blob, filename: string) => {
    setUploading(true); setUploadError(null);
    try {
      const supabase = createClient();
      const path = `voice-samples/${Date.now()}_${filename}`;
      const { error: upErr } = await supabase.storage
        .from('tts-audio')
        .upload(path, blob, { contentType: blob.type, upsert: false });
      if (upErr) throw new Error(upErr.message);
      const { data } = supabase.storage.from('tts-audio').getPublicUrl(path);
      onUrlChange(data.publicUrl);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : '上載失敗');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAudioBlob(file, file.name);
    e.target.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm' });
        await uploadAudioBlob(blob, 'recording.webm');
        if (recTimerRef.current) clearInterval(recTimerRef.current);
        setRecSeconds(0);
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      setRecSeconds(0);
      recTimerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000);
    } catch {
      setUploadError('無法存取麥克風，請確認瀏覽器權限');
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="bg-surface border border-primary/8 rounded-2xl p-4 space-y-3">
      <p className="text-xs font-semibold text-secondary uppercase tracking-widest">
        聲音樣本
        <span className="ml-1.5 text-secondary/50 normal-case font-normal">（可選，用作聲線參考）</span>
      </p>

      {/* Upload */}
      <div className="flex items-center gap-3 bg-surface-2 border border-primary/8 rounded-xl px-4 py-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-secondary mb-0.5">上載音頻檔案</p>
          <p className="text-xs text-secondary/50">支援 MP3、M4A、WAV 等格式</p>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || recording}
          className="flex items-center gap-1.5 bg-surface border border-primary/10 hover:border-primary/20 text-secondary hover:text-primary px-3 py-2 rounded-xl text-xs font-medium transition-colors disabled:opacity-50 shrink-0"
        >
          {uploading ? <Spinner /> : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M9.25 2a.75.75 0 0 1 .75.75v8.19l1.47-1.47a.75.75 0 1 1 1.06 1.06l-2.75 2.75a.75.75 0 0 1-1.06 0L5.97 10.53a.75.75 0 0 1 1.06-1.06L8.5 10.94V2.75A.75.75 0 0 1 9.25 2ZM3 13.75a.75.75 0 0 1 .75.75v1.5c0 .414.336.75.75.75h9.5a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 1 1.5 0v1.5A2.25 2.25 0 0 1 14 18H4.5A2.25 2.25 0 0 1 2.25 16v-1.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
            </svg>
          )}
          {uploading ? '上載中...' : '上載 MP3'}
        </button>
        <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Record */}
      <div className="bg-surface-2 border border-primary/8 rounded-xl px-4 py-3">
        <div className="flex items-center gap-3 mb-2.5">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-secondary mb-0.5">直接錄音</p>
            <p className="text-xs text-secondary/50">請讀出以下句子作聲線樣本</p>
          </div>
          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            disabled={uploading}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors disabled:opacity-50 border shrink-0 ${
              recording
                ? 'bg-danger/10 border-danger/30 text-danger animate-pulse'
                : 'bg-surface border-primary/10 hover:border-primary/20 text-secondary hover:text-primary'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M7 4a3 3 0 0 1 6 0v6a3 3 0 1 1-6 0V4Z" />
              <path d="M5.5 9.643a.75.75 0 0 0-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-1.5v-1.546A6.001 6.001 0 0 0 16 10v-.357a.75.75 0 0 0-1.5 0V10a4.5 4.5 0 0 1-9 0v-.357Z" />
            </svg>
            {recording ? `停止 ${recSeconds}s` : '開始錄音'}
          </button>
        </div>
        <p className="text-sm text-primary font-medium leading-relaxed border-t border-primary/8 pt-2.5">
          「好開心可以為你提供配音服務，你有啲乜嘢想我幫你講？」
        </p>
      </div>

      {/* Player */}
      {sampleUrl && (
        <div className="bg-surface-2 border border-primary/10 rounded-xl px-3 py-2.5 flex items-center gap-2">
          <audio controls src={sampleUrl} className="flex-1" style={{ height: '30px' }} />
          <DownloadButton url={sampleUrl} filename="voice-sample.mp3" iconOnly />
          <button
            type="button"
            onClick={() => onUrlChange('')}
            className="text-xs text-secondary/50 hover:text-danger transition-colors shrink-0"
          >
            移除
          </button>
        </div>
      )}

      {uploadError && <p className="text-xs text-danger">⚠️ {uploadError}</p>}
    </div>
  );
}

// ── Voice Profile Form ────────────────────────────────────────────────────────
// Renders as `display:contents` — TWO grid cells (bottom-left + bottom-right)

function VoiceProfileForm({
  initial, onSave, onCancel, sampleAudioUrl, title,
}: {
  initial: FormData;
  onSave: (data: FormData) => Promise<void>;
  onCancel: () => void;
  sampleAudioUrl: string;
  title: string;
}) {
  const [form, setForm]         = useState<FormData>(initial);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [previewState, setPreviewState] = useState<'idle' | 'loading' | 'playing'>('idle');
  const [previewUrl, setPreviewUrl]     = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const set = (key: keyof FormData, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handlePreview = async () => {
    if (previewState === 'loading') return;
    if (previewState === 'playing' && previewAudioRef.current) {
      previewAudioRef.current.pause();
      setPreviewState('idle');
      return;
    }
    setPreviewState('loading');
    try {
      const res = await fetch('/api/tts/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: DEMO_TEXT,
          voiceSettings: {
            provider:          form.provider,
            provider_voice_id: form.provider_voice_id,
            default_emotion:   form.default_emotion,
            default_speed:     form.default_speed,
            default_vol:       form.default_vol,
            default_pitch:     form.default_pitch,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '生成失敗');
      setPreviewUrl(data.audio_url);
      const audio = new Audio(data.audio_url);
      previewAudioRef.current = audio;
      audio.onended = () => setPreviewState('idle');
      audio.play();
      setPreviewState('playing');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '試聽失敗');
      setPreviewState('idle');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try { await onSave({ ...form, sample_audio_url: sampleAudioUrl }); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : '儲存失敗'); }
    finally { setSaving(false); }
  };

  const inputCls = 'w-full bg-surface-2 border border-primary/10 rounded-xl px-3 py-2.5 text-sm text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-cta/40 focus:border-cta/40';

  return (
    // `contents` makes the form transparent to the CSS grid — its two child divs become grid cells
    <form onSubmit={handleSubmit} className="contents">

      {/* ── BOTTOM-LEFT: Identity fields ── */}
      <div className="bg-surface border border-primary/8 rounded-2xl p-6 space-y-5">
        <h2 className="text-base font-semibold text-primary">{title}</h2>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-secondary mb-1.5">
            聲線名稱 <span className="text-danger">*</span>
          </label>
          <input
            type="text" required value={form.display_name}
            onChange={e => set('display_name', e.target.value)}
            placeholder="例如：HK 開朗女聲"
            className={inputCls}
          />
        </div>

        {/* Provider */}
        <div>
          <label className="block text-sm font-medium text-secondary mb-1.5">TTS 服務商</label>
          <select value={form.provider} onChange={e => set('provider', e.target.value)} className={inputCls}>
            <option value="minimax">MiniMax（粵語 TTS）</option>
          </select>
        </div>

        {/* Voice ID */}
        <div>
          <label className="block text-sm font-medium text-secondary mb-1.5">
            Voice ID <span className="text-danger">*</span>
            <span className="ml-1 text-secondary/60 font-normal">（MiniMax 聲線代碼）</span>
          </label>
          <select
            value={
              MINIMAX_CANTONESE_VOICES.some(v => v.id === form.provider_voice_id)
                ? form.provider_voice_id
                : '__custom__'
            }
            onChange={e => { if (e.target.value !== '__custom__') set('provider_voice_id', e.target.value); }}
            className={inputCls}
          >
            {MINIMAX_CANTONESE_VOICES.map(v => (
              <option key={v.id} value={v.id}>{v.label}</option>
            ))}
            <option value="__custom__">自定義 Voice ID…</option>
          </select>
          <input
            type="text" required value={form.provider_voice_id}
            onChange={e => set('provider_voice_id', e.target.value)}
            placeholder="例如：Cantonese_crisp_news_anchor_vv2"
            className={`mt-2 ${inputCls}`}
          />
        </div>

        {/* Language + Emotion */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">語言</label>
            <select value={form.language} onChange={e => set('language', e.target.value)} className={inputCls}>
              {LANGUAGE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">情緒風格</label>
            <select value={form.default_emotion} onChange={e => set('default_emotion', e.target.value)} className={inputCls}>
              {MINIMAX_EMOTIONS.map(em => (
                <option key={em} value={em}>{em}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── BOTTOM-RIGHT: Tuning + submit ── */}
      <div className="bg-surface border border-primary/8 rounded-2xl p-6 space-y-5">

        {/* Sliders */}
        <div className="space-y-4 bg-surface-2 border border-primary/8 rounded-xl p-4">
          <SliderField label="語速 Speed" value={form.default_speed} min={0.5} max={2.0} step={0.1} onChange={v => set('default_speed', v)} />
          <SliderField label="音量 Volume" value={form.default_vol}   min={0.5} max={1.5} step={0.1} onChange={v => set('default_vol', v)} />
          <SliderField label="音調 Pitch"  value={form.default_pitch} min={0.5} max={1.5} step={0.1} onChange={v => set('default_pitch', v)} />
          <div className="pt-1.5 border-t border-primary/8 flex items-center justify-between">
            <p className="text-xs text-secondary/50">調整後按試聽</p>
            <button
              type="button"
              onClick={handlePreview}
              disabled={previewState === 'loading'}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-50 ${
                previewState === 'playing'
                  ? 'border-cta/40 text-cta bg-cta/10'
                  : 'border-primary/10 text-secondary hover:border-cta/30 hover:text-cta bg-surface'
              }`}
            >
              {previewState === 'loading' ? <Spinner /> : previewState === 'playing' ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                  <path d="M4 4h3v8H4V4zm5 0h3v8H9V4z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                  <path d="M3 3.732a1.5 1.5 0 0 1 2.305-1.265l6.706 4.268a1.5 1.5 0 0 1 0 2.53L5.305 13.533A1.5 1.5 0 0 1 3 12.268V3.732Z" />
                </svg>
              )}
              {previewState === 'loading' ? '生成中...' : previewState === 'playing' ? '停止' : '試聽效果'}
            </button>
          </div>
        </div>

        {/* Preview result inline */}
        {previewUrl && (
          <div className="bg-surface-2 border border-cta/20 rounded-xl px-3 py-2.5 flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full bg-cta shrink-0 ${previewState === 'playing' ? 'animate-pulse' : ''}`} />
            <p className="text-xs text-cta font-medium shrink-0">試聽結果</p>
            <audio controls src={previewUrl} className="flex-1" style={{ height: '28px' }} />
            <DownloadButton url={previewUrl} filename="voice-preview.mp3" iconOnly />
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-secondary mb-1.5">
            備注
            <span className="ml-1 text-secondary/60 font-normal">（用來記住這個聲線的用途，只有你自己看得到）</span>
          </label>
          <input
            type="text" value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="例如：適合產品介紹的平靜聲線"
            className={inputCls}
          />
        </div>

        {/* Set as default */}
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_default}
            onChange={e => set('is_default', e.target.checked)}
            className="!w-auto rounded border-primary/20 text-cta focus:ring-cta/40 shrink-0"
          />
          <span className="text-sm text-secondary">設為預設聲線</span>
        </label>

        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger rounded-xl px-4 py-3 text-sm">
            ⚠️ {error}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="submit" disabled={saving}
            className="flex items-center gap-2 bg-cta hover:bg-cta/90 disabled:opacity-50 text-body font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors"
          >
            {saving ? <><Spinner /> 儲存中...</> : '儲存聲線'}
          </button>
          <button
            type="button" onClick={onCancel}
            className="text-sm text-secondary hover:text-primary font-medium px-4 py-2.5 rounded-xl border border-primary/10 hover:border-primary/20 transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </form>
  );
}

// ── Profile Card ──────────────────────────────────────────────────────────────

function ProfileCard({
  profile, onEdit, onDelete, onSetDefault,
}: {
  profile: VoiceProfile;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [demoState, setDemoState]   = useState<'idle' | 'loading' | 'playing'>('idle');
  const [demoUrl, setDemoUrl]       = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { showToast } = useToast();

  const handleDemo = async () => {
    if (demoState === 'loading') return;
    if (demoState === 'playing' && audioRef.current) {
      audioRef.current.pause();
      setDemoState('idle');
      return;
    }
    setDemoState('loading');
    try {
      const res = await fetch('/api/tts/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text: DEMO_TEXT, voiceProfileId: profile.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? '生成失敗');
      setDemoUrl(data.audio_url);
      const audio = new Audio(data.audio_url);
      audioRef.current = audio;
      audio.onended = () => setDemoState('idle');
      audio.play();
      setDemoState('playing');
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : '試聽失敗');
      setDemoState('idle');
    }
  };

  return (
    <div className={`bg-surface-2 border rounded-xl p-3.5 transition-colors ${
      profile.is_default ? 'border-cta/30' : 'border-primary/8 hover:border-primary/12'
    }`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-primary text-sm leading-tight">{profile.display_name}</h3>
            {profile.is_default && (
              <span className="text-xs bg-cta/15 text-cta px-1.5 py-0.5 rounded-full font-medium shrink-0">預設</span>
            )}
          </div>
          <p className="text-xs text-secondary/50 mt-0.5 truncate font-mono">{profile.provider_voice_id}</p>
        </div>

        <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
          <button
            onClick={handleDemo}
            className={`text-xs px-2 py-1.5 rounded-lg border font-medium transition-colors flex items-center gap-1 ${
              demoState === 'playing'
                ? 'border-cta/40 text-cta bg-cta/10'
                : 'border-primary/10 text-secondary hover:border-primary/20 hover:text-primary'
            }`}
          >
            {demoState === 'loading' ? <Spinner /> : demoState === 'playing' ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                <path d="M4 4h3v8H4V4zm5 0h3v8H9V4z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                <path d="M3 3.732a1.5 1.5 0 0 1 2.305-1.265l6.706 4.268a1.5 1.5 0 0 1 0 2.53L5.305 13.533A1.5 1.5 0 0 1 3 12.268V3.732Z" />
              </svg>
            )}
            {demoState === 'loading' ? '生成中' : demoState === 'playing' ? '停止' : '試聽'}
          </button>

          {demoUrl && (
            <DownloadButton url={demoUrl} filename={`${profile.display_name}.mp3`} iconOnly />
          )}

          {!profile.is_default && (
            <button
              onClick={onSetDefault}
              className="text-xs border border-primary/10 hover:border-cta/30 text-secondary hover:text-cta px-2 py-1.5 rounded-lg font-medium transition-colors"
            >
              設預設
            </button>
          )}
          <button
            onClick={onEdit}
            className="text-xs border border-primary/10 hover:border-primary/20 text-secondary hover:text-primary px-2 py-1.5 rounded-lg font-medium transition-colors"
          >
            編輯
          </button>
          {confirming ? (
            <div className="flex gap-1">
              <button onClick={onDelete} className="text-xs text-white bg-danger hover:bg-danger/90 px-2 py-1.5 rounded-lg font-medium">
                確認
              </button>
              <button onClick={() => setConfirming(false)} className="text-xs border border-primary/10 text-secondary px-2 py-1.5 rounded-lg">
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="text-xs border border-primary/10 hover:border-danger/30 text-secondary hover:text-danger px-2 py-1.5 rounded-lg font-medium transition-colors"
            >
              刪除
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-3 text-xs text-secondary">
        <span><span className="text-secondary/50">語速</span> {profile.default_speed.toFixed(1)}</span>
        <span><span className="text-secondary/50">音量</span> {profile.default_vol.toFixed(1)}</span>
        <span><span className="text-secondary/50">音調</span> {profile.default_pitch.toFixed(1)}</span>
        <span><span className="text-secondary/50">情緒</span> {profile.default_emotion}</span>
      </div>
      {profile.description && (
        <p className="text-xs text-secondary/50 mt-1.5 truncate">{profile.description}</p>
      )}
    </div>
  );
}

// ── Main Manager ──────────────────────────────────────────────────────────────

type View = { mode: 'list' } | { mode: 'create' } | { mode: 'edit'; profile: VoiceProfile };

export default function VoiceProfileManager({ initial }: { initial: VoiceProfile[] }) {
  const [profiles, setProfiles]     = useState<VoiceProfile[]>(initial);
  const [view, setView]             = useState<View>({ mode: 'list' });
  const [sampleAudioUrl, setSampleAudioUrl] = useState('');
  const [profilesExpanded, setProfilesExpanded] = useState(true);
  const { showToast } = useToast();

  const startCreate = () => { setSampleAudioUrl(''); setProfilesExpanded(true); setView({ mode: 'create' }); };
  const startEdit   = (p: VoiceProfile) => {
    setSampleAudioUrl((p as VoiceProfile & { sample_audio_url?: string }).sample_audio_url ?? '');
    setProfilesExpanded(true);
    setView({ mode: 'edit', profile: p });
  };

  const handleCreate = async (form: FormData) => {
    const res  = await fetch('/api/voice-profiles', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? '建立失敗');
    setProfiles(prev => {
      const next = [data as VoiceProfile, ...prev];
      if ((data as VoiceProfile).is_default) {
        return next.map(p => p.id === data.id ? p : { ...p, is_default: false });
      }
      return next;
    });
    setView({ mode: 'list' });
    showToast('success', `聲線「${form.display_name}」已建立`);
  };

  const handleUpdate = async (form: FormData, id: string) => {
    const res  = await fetch(`/api/voice-profiles/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? '更新失敗');
    setProfiles(prev => {
      const next = prev.map(p => p.id === id ? (data as VoiceProfile) : p);
      if ((data as VoiceProfile).is_default) {
        return next.map(p => p.id === id ? p : { ...p, is_default: false });
      }
      return next;
    });
    setView({ mode: 'list' });
    showToast('success', '聲線已更新');
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/voice-profiles/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      showToast('error', data.error ?? '刪除失敗');
      return;
    }
    setProfiles(prev => prev.filter(p => p.id !== id));
    showToast('success', '聲線已刪除');
  };

  const handleSetDefault = async (id: string) => {
    const res  = await fetch(`/api/voice-profiles/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ is_default: true }),
    });
    if (!res.ok) { showToast('error', '設定失敗'); return; }
    setProfiles(prev => prev.map(p => ({ ...p, is_default: p.id === id })));
    showToast('success', '已設為預設聲線');
  };

  const isEditing = view.mode !== 'list';

  // ── Layout: 2-column grid, rows expand when editing ──────────────────────
  // Row 1: [AudioSample OR Idle]  [ProfileList]
  // Row 2: [FormLeft]             [FormRight]    ← only when editing (via `contents`)
  // Last:  [CTA footer — col-span-2]

  return (
    <div className="lg:grid lg:grid-cols-2 lg:gap-4 lg:items-start space-y-4 lg:space-y-0">

      {/* ── ROW 1 LEFT: Audio sample (editing) or idle placeholder ── */}
      {isEditing ? (
        <AudioSamplePanel
          sampleUrl={sampleAudioUrl}
          onUrlChange={setSampleAudioUrl}
        />
      ) : (
        <div className="bg-surface border border-primary/8 rounded-2xl p-8 text-center">
          <p className="text-5xl mb-4">🎙️</p>
          <p className="text-primary font-semibold text-base mb-1">調教你的專屬聲線</p>
          <p className="text-secondary/60 text-sm mb-6 leading-relaxed">
            設定語速、音量、音調，即時試聽效果<br />
            <span className="text-secondary/40">右側選擇聲線編輯，或新增聲線</span>
          </p>
          <button
            onClick={startCreate}
            className="bg-cta hover:bg-cta/90 text-body text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
          >
            ＋ 新增聲線
          </button>
        </div>
      )}

      {/* ── ROW 1 RIGHT: Profile list (always visible) ── */}
      <div className="bg-surface border border-primary/8 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-secondary uppercase tracking-widest">
            聲線庫 ({profiles.length})
          </h2>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setProfilesExpanded(v => !v)}
              className="flex items-center gap-1 text-xs border border-primary/10 hover:border-cta/30 text-secondary hover:text-cta px-2.5 py-1.5 rounded-lg font-medium transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 shrink-0">
                <path fillRule="evenodd" d="M1.75 4a.75.75 0 0 0 0 1.5h12.5a.75.75 0 0 0 0-1.5H1.75Zm0 3.5a.75.75 0 0 0 0 1.5h8a.75.75 0 0 0 0-1.5h-8Zm0 3.5a.75.75 0 0 0 0 1.5h4a.75.75 0 0 0 0-1.5h-4Z" clipRule="evenodd" />
              </svg>
              切換角色
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
                className={`w-3 h-3 shrink-0 transition-transform ${profilesExpanded ? 'rotate-180' : ''}`}>
                <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </button>
            {!isEditing && (
              <button
                onClick={startCreate}
                className="text-xs bg-cta hover:bg-cta/90 text-body font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                ＋ 新增
              </button>
            )}
          </div>
        </div>

        {profiles.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-secondary/50 text-xs">尚未建立聲線，點擊右上角新增</p>
          </div>
        ) : profilesExpanded ? (
          <div className="space-y-2">
            {profiles.map(p => (
              <ProfileCard
                key={p.id}
                profile={p}
                onEdit={() => startEdit(p)}
                onDelete={() => handleDelete(p.id)}
                onSetDefault={() => handleSetDefault(p.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {profiles.map(p => (
              <button
                key={p.id}
                onClick={() => startEdit(p)}
                className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border font-medium transition-colors ${
                  p.is_default
                    ? 'border-cta/40 text-cta bg-cta/10'
                    : 'border-primary/10 text-secondary hover:border-primary/20 hover:text-primary'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                {p.display_name}
                {p.is_default && <span className="text-secondary/40">（預設）</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── ROW 2: Form — renders as 2 grid cells via `contents` ── */}
      {isEditing && (
        <VoiceProfileForm
          key={view.mode === 'edit' ? view.profile.id : 'create'}
          title={view.mode === 'create' ? '➕ 新增聲線' : '✏️ 編輯聲線'}
          initial={view.mode === 'edit' ? profileToForm(view.profile) : EMPTY_FORM}
          sampleAudioUrl={sampleAudioUrl}
          onSave={form =>
            view.mode === 'edit'
              ? handleUpdate(form, view.profile.id)
              : handleCreate(form)
          }
          onCancel={() => setView({ mode: 'list' })}
        />
      )}

      {/* ── Footer CTA — full width ── */}
      <div className="lg:col-span-2 text-center pt-2">
        <p className="text-xs text-secondary/40 mb-3">語音生成由 MiniMax 粵語 TTS 提供</p>
        <div className="inline-block bg-cta/10 border border-cta/20 rounded-2xl px-6 py-3">
          <p className="text-sm text-primary font-medium mb-1">想永久保存所有生成語音？</p>
          <p className="text-xs text-secondary mb-2.5">升級會員，無限儲存 · 優先生成 · 更多聲線</p>
          <a
            href="/pricing"
            className="inline-block bg-cta hover:bg-cta/90 text-body text-xs font-semibold px-4 py-1.5 rounded-xl transition-colors"
          >
            立即升級會員 →
          </a>
        </div>
      </div>
    </div>
  );
}
