'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

type AuthView = 'login' | 'magic_link_sent';

// Wrap in Suspense because useSearchParams() requires it at build time
export default function AuthPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}

function AuthForm() {
  const supabase = createClient();
  const searchParams = useSearchParams();

  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingMagic, setLoadingMagic] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('error') === 'auth_failed') {
      setError('登入失敗，請再試一次');
    }
  }, [searchParams]);

  // ── Google OAuth ──────────────────────────────────────────────────────────

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/workflows`,
      },
    });
    if (error) {
      setError(error.message);
      setLoadingGoogle(false);
    }
  };

  // ── Email Magic Link ──────────────────────────────────────────────────────

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoadingMagic(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/workflows`,
      },
    });

    setLoadingMagic(false);

    if (error) {
      setError(error.message);
    } else {
      setView('magic_link_sent');
    }
  };

  // ── Render: Magic Link Sent ───────────────────────────────────────────────

  if (view === 'magic_link_sent') {
    return (
      <main className="min-h-screen bg-body flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-surface border border-primary/10 rounded-2xl shadow-toast p-8 text-center">
          <div className="text-5xl mb-4">📬</div>
          <h2 className="text-xl font-bold text-primary mb-2">電郵已發送！</h2>
          <p className="text-secondary text-sm mb-1">
            我哋已將登入連結發送至
          </p>
          <p className="text-cta font-medium text-sm mb-6">{email}</p>
          <p className="text-secondary/60 text-xs leading-relaxed">
            請查看你的電子郵件並點擊連結完成登入。
            <br />連結有效期為 1 小時。
          </p>
          <button
            onClick={() => { setView('login'); setEmail(''); }}
            className="mt-6 text-sm text-cta hover:text-cta/80 font-medium transition-colors"
          >
            ← 返回重新輸入
          </button>
        </div>
      </main>
    );
  }

  // ── Render: Login Form ────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-body flex items-center justify-center px-4">
      <div className="max-w-md w-full">

        {/* Brand */}
        <div className="text-center mb-8 flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="sosocontent" className="h-14 w-14 object-contain" />
          <div>
            <h1 className="text-2xl font-bold text-primary">sosocontent.ai</h1>
            <p className="text-secondary text-sm mt-1">香港中小企 AI 內容助理</p>
          </div>
        </div>

        <div className="bg-surface border border-primary/10 rounded-2xl shadow-toast p-8">
          <h2 className="text-base font-semibold text-primary mb-6 text-center">
            登入 / 建立帳戶
          </h2>

          {/* Error */}
          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger rounded-xl px-4 py-3 text-sm mb-5">
              ⚠️ {error}
            </div>
          )}

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loadingGoogle}
            className="w-full flex items-center justify-center gap-3 border border-primary/10 hover:border-primary/20 hover:bg-primary/5 text-primary font-medium py-3 px-4 rounded-xl transition-colors duration-150 mb-5 disabled:opacity-50"
          >
            {loadingGoogle ? <Spinner /> : <GoogleIcon />}
            {loadingGoogle ? '跳轉中...' : '用 Google 帳戶登入'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-primary/10" />
            <span className="text-xs text-secondary/60">或用電郵</span>
            <div className="flex-1 h-px bg-primary/10" />
          </div>

          {/* Magic Link Form */}
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1.5">
                電子郵件地址
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-surface-2 border border-primary/10 rounded-xl px-3 py-2.5 text-sm text-primary placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-cta/40 focus:border-cta/40 transition"
              />
            </div>
            <button
              type="submit"
              disabled={loadingMagic || !email.trim()}
              className="w-full flex items-center justify-center gap-2 bg-cta hover:bg-cta/90 disabled:opacity-40 text-body font-semibold py-3 px-4 rounded-xl transition-colors duration-150 text-sm"
            >
              {loadingMagic ? (
                <>
                  <Spinner />
                  發送中...
                </>
              ) : (
                '發送登入連結 ✉️'
              )}
            </button>
          </form>

          {/* Terms */}
          <p className="text-xs text-secondary/50 text-center mt-6 leading-relaxed">
            登入即代表你同意我們的
            <span className="text-secondary"> 服務條款 </span>及
            <span className="text-secondary"> 私隱政策</span>。
          </p>
        </div>

        {/* Back to home */}
        <p className="text-center mt-5">
          <a href="/" className="text-sm text-secondary/60 hover:text-secondary transition-colors">
            ← 返回首頁
          </a>
        </p>
      </div>
    </main>
  );
}

// ── Small UI helpers ──────────────────────────────────────────────────────────

function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin h-4 w-4 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}
