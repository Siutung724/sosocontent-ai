'use client';

import Link from 'next/link';
import { useToast } from '@/hooks/useToast';

interface SettingsViewProps {
  email: string;
  displayName: string;
  createdAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-HK', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function SettingsView({ email, displayName, createdAt }: SettingsViewProps) {
  const { showToast } = useToast();

  return (
    <div className="max-w-2xl space-y-8">

      {/* ── 帳戶資料 ── */}
      <section>
        <h2 className="text-xs font-semibold text-secondary uppercase tracking-widest mb-4">帳戶資料</h2>
        <div className="bg-surface border border-primary/8 rounded-2xl divide-y divide-primary/8">
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <span className="text-sm text-secondary">顯示名稱</span>
            <span className="text-sm text-primary font-medium">{displayName}</span>
          </div>
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <span className="text-sm text-secondary">電郵</span>
            <span className="text-sm text-primary font-medium">{email}</span>
          </div>
          <div className="px-5 py-4 flex items-center justify-between gap-4">
            <span className="text-sm text-secondary">加入日期</span>
            <span className="text-sm text-primary font-medium">{formatDate(createdAt)}</span>
          </div>
        </div>
      </section>

      {/* ── 訂閱計劃 ── */}
      <section>
        <h2 className="text-xs font-semibold text-secondary uppercase tracking-widest mb-4">訂閱計劃</h2>
        <div className="bg-surface border border-primary/8 rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-primary">免費版</h3>
              <p className="text-xs text-secondary mt-0.5">每月 10 次生成額度</p>
            </div>
            <span className="text-xs bg-accent/10 text-accent px-2.5 py-0.5 rounded-full font-medium shrink-0">
              使用中
            </span>
          </div>
          <button
            onClick={() => showToast('success', '訂閱升級功能即將推出，敬請期待！')}
            className="text-sm border border-accent/30 text-accent hover:bg-accent/10 px-4 py-2 rounded-xl transition-colors font-medium"
          >
            升級至專業版
          </button>
        </div>
      </section>

      {/* ── 聲線設定 ── */}
      <section>
        <h2 className="text-xs font-semibold text-secondary uppercase tracking-widest mb-4">聲線設定</h2>
        <div className="bg-surface border border-primary/8 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-primary">粵語 TTS 聲線</h3>
              <p className="text-xs text-secondary mt-0.5">管理聲線設定，用於 AI 生成內容的語音朗讀</p>
            </div>
            <span className="text-xs bg-cta/10 text-cta px-2 py-0.5 rounded-full shrink-0 font-medium">
              MiniMax
            </span>
          </div>
          <Link
            href="/settings/voice"
            className="inline-flex items-center gap-2 bg-cta hover:bg-cta/90 text-body font-semibold text-sm px-4 py-2 rounded-xl transition-colors"
          >
            管理聲線設定 →
          </Link>
        </div>
      </section>

      {/* ── 危險區域 ── */}
      <section>
        <h2 className="text-xs font-semibold text-secondary uppercase tracking-widest mb-4">其他</h2>
        <div className="bg-surface border border-primary/8 rounded-2xl p-5">
          <p className="text-sm text-secondary mb-4">如需刪除帳號或匯出資料，請聯絡我們。</p>
          <button
            onClick={() => showToast('success', '如需協助，請電郵至 hello@sosocontent.ai')}
            className="text-sm border border-primary/10 hover:bg-primary/8 text-secondary hover:text-primary px-4 py-2 rounded-xl transition-colors"
          >
            聯絡支援
          </button>
        </div>
      </section>

    </div>
  );
}
