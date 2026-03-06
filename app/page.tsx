'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { GenerateRequest, GenerateResponse } from '@/lib/types';
import { USE_CASES, TONE_LEVELS, INDUSTRIES } from '@/lib/constants';
import { CONFIG } from '@/lib/config';
import type { User } from '@supabase/supabase-js';

export default function Home() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [formData, setFormData] = useState<GenerateRequest>({
    brandName: '',
    productDescription: '',
    targetAudience: '',
    industry: 'general',
    toneLevel: 1,
    contentType: 'facebook_post',
  });

  const [result, setResult] = useState<string>('');
  const [error, setError] = useState('');
  const [history, setHistory] = useState<any[]>([]);

  // 監聽登入狀態
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthLoading(false);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 獲取歷史紀錄
  const fetchHistory = async () => {
    if (user) {
      try {
        const res = await fetch('/api/history?limit=10');
        const data = await res.json();
        if (Array.isArray(data)) setHistory(data);
      } catch (err) {
        console.error('Failed to fetch history:', err);
      }
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setHistory([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult('');

    try {
      const response = await fetch(CONFIG.CONTENT_API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data: GenerateResponse = await response.json();
      if (data.error) throw new Error(data.error);

      const formattedResult = formatResult(data);
      setResult(formattedResult);

      // 生成成功後刷新歷史
      if (user) fetchHistory();

    } catch (err: any) {
      setError(err.message || '發生錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const formatResult = (data: any) => {
    return `
${data.mainContent}

---
建議變體：
${data.variants.join('\n\n')}

---
Hashtags:
${data.hashtags.join(' ')}
    `.trim();
  };

  const handleSelectHistory = (item: any) => {
    setResult(formatResult(item.result));
    setFormData({
      ...formData,
      brandName: item.meta?.brandName || '',
      industry: item.meta?.industry || 'general',
      contentType: item.type
    });
  };

  return (
    <main className="container">
      <header className="hero">
        <div className="auth-nav">
          {authLoading ? null : user ? (
            <div className="user-info">
              <span>👋 {user.user_metadata?.full_name || user.email}</span>
              <button onClick={handleSignOut} className="btn-text">登出</button>
            </div>
          ) : (
            <button onClick={handleSignIn} className="btn-text">用 Google 登入 🔑</button>
          )}
        </div>
        <h1>sosocontent.ai 🇭🇰</h1>
        <p>專為香港中小企打造的地道廣東話 AI 營銷助手</p>
      </header>

      <section className="main-grid">
        <div className="sidebar-container">
          <form onSubmit={handleSubmit} className="card glass">
            <div className="form-group">
              <label>品牌名稱</label>
              <input
                type="text"
                placeholder="例如：街頭小食店"
                value={formData.brandName}
                onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>產品/服務描述</label>
              <textarea
                placeholder="例如：新鮮熱辣雞蛋仔，外脆內軟..."
                rows={3}
                value={formData.productDescription}
                onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>目標客群</label>
              <input
                type="text"
                placeholder="例如：18-35歲、鍾意搵食嘅年輕人"
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>所屬行業</label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value as any })}
                >
                  {INDUSTRIES.map(ind => <option key={ind.value} value={ind.value}>{ind.label}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>內容平台 / 用途</label>
                <select
                  value={formData.contentType}
                  onChange={(e) => setFormData({ ...formData, contentType: e.target.value as any })}
                >
                  {USE_CASES.map(uc => <option key={uc.value} value={uc.value}>{uc.label}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>語氣正式度 (0-3)</label>
              <input
                type="range"
                min="0" max="3"
                value={formData.toneLevel}
                onChange={(e) => setFormData({ ...formData, toneLevel: parseInt(e.target.value) as any })}
              />
              <span className="tone-hint">
                {TONE_LEVELS.find(t => t.value === formData.toneLevel)?.label}
              </span>
            </div>

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? '生成中...' : '一鍵生成文案 ✨'}
            </button>
          </form>

          {user && history.length > 0 && (
            <div className="card glass history-sidebar">
              <h3>最近生成</h3>
              <div className="history-list">
                {history.map((item) => (
                  <div key={item.id} className="history-item" onClick={() => handleSelectHistory(item)}>
                    <span className="history-date">{new Date(item.created_at).toLocaleDateString()}</span>
                    <span className="history-type">{USE_CASES.find(u => u.value === item.type)?.label}</span>
                    <p className="history-peek">{item.meta?.brandName}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="result-area">
          {error && <div className="alert-error">{error}</div>}

          <div className="card glass result-card">
            <h3>生成結果</h3>
            {result ? (
              <div className="content-box">
                <textarea readOnly value={result} rows={12} />
                <button onClick={() => navigator.clipboard.writeText(result)} className="btn-secondary">
                  複製到剪貼簿 📋
                </button>
              </div>
            ) : (
              <p className="placeholder-text">喺左邊輸入資料，然後按「生成」啦！</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
