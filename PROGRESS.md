# sosocontent.ai — 開發進度表

> 更新日期：2026-03-14（Session 7 更新）
> 專案：香港／台灣中小企 AI 內容助理 SaaS
> 技術棧：Next.js 15 · TypeScript · Tailwind CSS · Supabase · OpenRouter / Gemini · MiniMax TTS · Stripe

---

## 圖例

| 符號 | 狀態 |
|------|------|
| ✅ | 完成 |
| 🔄 | 進行中 |
| ⏳ | 待做 |
| 🚫 | 暫緩 / 超出 MVP 範圍 |

---

## 一、資料庫 & 基礎架構

| # | 任務 | 負責 | 狀態 | 備註 |
|---|------|------|------|------|
| 1.1 | DB Migration：`workspaces` `brand_profiles` `workflows` `prompt_templates` `prompt_variables` `executions` | 後端 | ✅ | `001_workflow_tables.sql` |
| 1.2 | Row Level Security (RLS) 政策 | 後端 | ✅ | Migration 內已定義 |
| 1.3 | Seed：`weekly_social` workflow + prompt_template + 7 個 prompt_variables | 後端 | ✅ | `seed.sql` — 已執行到 Supabase |
| 1.4 | Seed：`brand_story` workflow | 後端 | ✅ | 已完成並執行 |
| 1.5 | Seed：`product_launch` workflow | 後端 | ✅ | 已完成並執行 |
| 1.6 | Seed：`brand_trust` workflow | 後端 | ✅ | 已完成並執行 |
| 1.7 | Seed：`brand_strategy` workflow | 後端 | ✅ | 已完成並執行 |
| 1.8 | DB Migration：`voice_profiles` 表 + `executions` 預留欄位 | 後端 | ✅ | `002_voice_tables.sql` — 已執行 2026-03-13 |
| 1.9 | DB Migration：`user_plans` 表（Stripe 訂閱） | 後端 | ✅ | `004_user_plans.sql` |
| 1.10 | DB Migration：`tts-audio` bucket RLS 政策 | 後端 | ✅ | `005_tts_audio_storage_rls.sql` |
| 1.11 | Supabase Storage：`tts-audio` bucket 設為 Public | DevOps | ✅ | Dashboard 手動設定 |
| 1.12 | Supabase 環境變數設定（`.env.local`） | DevOps | ✅ | `NEXT_PUBLIC_SUPABASE_URL` 等 |
| 1.13 | AI API Key 設定（OpenRouter / Gemini） | DevOps | ✅ | `.env.local` |
| 1.14 | MiniMax TTS API Key 設定 | DevOps | ✅ | `MINIMAX_API_KEY` + `MINIMAX_GROUP_ID` |

---

## 二、後端 API

| # | 任務 | 路徑 | 狀態 | 備註 |
|---|------|------|------|------|
| 2.1 | Supabase Server Client | `lib/supabase-server.ts` | ✅ | `@supabase/ssr` cookie-based |
| 2.2 | Supabase Browser Client | `lib/supabase-browser.ts` | ✅ | |
| 2.3 | TypeScript 型別定義 | `lib/workflow-types.ts` | ✅ | 全部 interface 齊備（含 5 個 result 型別） |
| 2.4 | **Workflow 執行引擎** | `POST /api/workflows/execute` | ✅ | 支援 OpenRouter + Gemini fallback；免費版限額 1 次/月 |
| 2.5 | 舊版文案生成 API | `POST /api/generate` | ✅ | Legacy，維持現有功能 |
| 2.6 | 歷史紀錄 API | `GET /api/history` | ✅ | 需登入，從 `generations` 表讀取 |
| 2.7 | Brand Profile CRUD API | `POST/GET/PATCH/DELETE /api/brand-profiles` | ✅ | auto-create workspace；RLS 保護 |
| 2.8 | Executions 列表 API（Content Library） | `GET /api/executions` | ✅ | filter by workflow_key；pagination |
| 2.9 | **TTS 語音生成 API** | `POST /api/tts/generate` | ✅ | 支援 executionId 或 text；快取 audio_url 回 executions |
| 2.10 | **Stripe Webhook 處理** | `POST /api/webhooks/stripe` | ✅ | checkout.completed → upsert user_plans + updateUserById |
| 2.11 | Voice Profile CRUD API | `/api/voice-profiles` | ✅ | 聲線設定 CRUD |
| 2.12 | 免費版限額執行（Rate Limiting） | `POST /api/workflows/execute` | ✅ | 免費用戶每月限 1 次；403 + 升級提示 |

---

## 三、前端頁面

### 3A. 已完成頁面

| # | 頁面 | 路徑 | 狀態 | 備註 |
|---|------|------|------|------|
| 3.1 | Root Layout | `app/layout.tsx` | ✅ | Inter 字型，繁中 lang |
| 3.2 | 登入 / 註冊頁 | `app/auth/page.tsx` | ✅ | Google OAuth + Email Magic Link |
| 3.3 | Auth Callback | `app/auth/callback/route.ts` | ✅ | Supabase SSR callback |
| 3.4 | **Dashboard — Command Center** | `app/dashboard/page.tsx` | ✅ | 4-grid stats（總生成、本月用量、品牌數、⚡工作坊快捷卡）；最常用 workflow；最近 5 條紀錄；免費配額警示 banner |
| 3.5 | **Workflow Hub** | `app/workflows/page.tsx` | ✅ | 6 個工作流程卡片（含品牌聲線設定導向 /settings/voice） |
| 3.6 | **動態 Workflow 表單頁** | `app/workflows/[key]/page.tsx` | ✅ | Server Component，讀 prompt_variables |
| 3.7 | **Workflow 表單 + 結果（Client）** | `app/workflows/[key]/WorkflowForm.tsx` | ✅ | 5 種 result 渲染；Voice Bar；403 升級 banner |
| 3.8 | Brand Profile 管理頁 | `app/brand/page.tsx` + `BrandManager.tsx` | ✅ | 新增 / 編輯 / 刪除；Voice Profile 卡片 |
| 3.9 | **Content Library** | `app/library/page.tsx` + `LibraryView.tsx` | ✅ | 5 個 filter tabs；5 種 ResultPanel；CopyBlock；Voice Bar；分頁載入 |
| 3.10 | 用戶設定頁 | `app/settings/page.tsx` + `SettingsView.tsx` | ✅ | 帳戶、訂閱方案、聲線設定入口、聯絡支援 |
| 3.11 | 聲線設定頁 | `app/settings/voice/page.tsx` | ✅ | Voice Profile CRUD UI |
| 3.12 | **定價頁** | `app/pricing/page.tsx` | ✅ | Stripe Buy Button（Pro + 企業）；client-reference-id 傳 user.id |
| 3.13 | **Admin CRM Dashboard** | `app/admin/page.tsx` | ✅ | 用戶清單、方案統計、MRR 估算、CSV 匯出；ADMIN_EMAILS 白名單 |

---

## 四、共用組件

| # | 組件 | 路徑 | 狀態 | 備註 |
|---|------|------|------|------|
| 4.1 | Navigation / Top Bar | `components/Nav.tsx` | ✅ | Server Component；logo + NavLinks（Client）；sticky blur nav |
| 4.1b | Nav Links（Client） | `components/NavLinks.tsx` | ✅ | active route 偵測；Google signOut |
| 4.2 | Toast 通知 | `components/Toast.tsx` + `providers/ToastProvider.tsx` | ✅ | success／error 左色條；3.5s 自動消失 |
| 4.2b | useToast hook | `hooks/useToast.ts` | ✅ | |
| 4.3 | App Layout Wrapper | `components/AppLayout.tsx` | ✅ | Nav + 統一 container |
| 4.4 | Loading Skeleton | `components/Skeleton.tsx` | ✅ | 多種 skeleton 組合 |
| 4.5 | Auth Guard (middleware) | `middleware.ts` | ✅ | 保護 /dashboard /workflows /library /brand /settings /admin |
| 4.6 | **Stripe Buy Button** | `components/StripeBuyButton.tsx` | ✅ | 接受 `clientReferenceId`（Supabase user.id）傳給 Stripe |
| 4.7 | **Admin CSV 匯出按鈕** | `app/admin/AdminExportButton.tsx` | ✅ | BOM CSV；Excel 繁中支援；7 個欄位 |

---

## 五、UX／UI 設計系統

| # | 任務 | 路徑 | 狀態 | 備註 |
|---|------|------|------|------|
| 5.1 | 設計規範文件 | `DESIGN.md` | ✅ | 深色玻璃態；色彩 tokens；Voice Bar 規格 |
| 5.2 | Tailwind 自訂 tokens | `tailwind.config.ts` | ✅ | body / surface / surface-2 / primary / secondary / accent / success / danger |
| 5.3 | 全域背景深色化 | `app/globals.css` | ✅ | body 改為 `#0b0b12` |
| 5.4 | 全部登入後頁面深色主題 | 各頁面 | ✅ | AppLayout + dark tokens 全面套用 |
| 5.5 | ⚡ 工作坊快捷卡 highlight 效果 | `app/dashboard/page.tsx` | ✅ | brand primary 綠色；border-2；glow blob；shadow；深淺模式自適應 |
| 5.6 | Gunter 字體（Logo） | `app/layout.tsx` | ⏳ | 現用 Inter 備用 |

---

## 六、Voice / TTS

| # | 任務 | 路徑 | 狀態 | 備註 |
|---|------|------|------|------|
| 6.1 | Voice UI 設計規則 | `DESIGN.md` | ✅ | Voice Bar 規格；Voice Profile 卡片規格 |
| 6.2 | TTS 後端規劃文件 | `VOICE_TTS_PLAN.md` | ✅ | DB schema、API 路由、provider 候選 |
| 6.3 | DB Migration：voice_profiles + executions 欄位 | `002_voice_tables.sql` | ✅ | 已執行 2026-03-13 |
| 6.4 | **MiniMax TTS Provider** | `lib/tts/minimax.ts` | ✅ | T2A v2；hex → Buffer → Supabase Storage；15 個粵語聲線 |
| 6.5 | **TTS 生成 API** | `app/api/tts/generate/route.ts` | ✅ | 解析 executionId 或 text；voice profile 優先序；audio_url 快取 |
| 6.6 | **Supabase Storage RLS** | `005_tts_audio_storage_rls.sql` | ✅ | public read；service role only upload/delete |
| 6.7 | WorkflowForm Voice Bar（實際播放） | `WorkflowForm.tsx` | ✅ | 呼叫 /api/tts/generate；播放 / 停止 |
| 6.8 | LibraryView WeeklyPostCard Voice Bar | `LibraryView.tsx` | ✅ | 同上 |
| 6.9 | Voice Profile CRUD UI | `app/settings/voice/page.tsx` | ✅ | 聲線管理頁面 |

---

## 七、訂閱 & 付費

| # | 任務 | 路徑 | 狀態 | 備註 |
|---|------|------|------|------|
| 7.1 | Stripe Buy Button 整合 | `app/pricing/page.tsx` | ✅ | Pro + 企業版；`client-reference-id` = user.id |
| 7.2 | **Stripe Webhook → 自動升級方案** | `app/api/webhooks/stripe/route.ts` | ✅ | checkout.completed / subscription.deleted / payment_failed；upsert user_plans + updateUserById |
| 7.3 | `user_plans` DB 表 | `004_user_plans.sql` | ✅ | user_id / plan / stripe_customer_id / current_period_end |
| 7.4 | 免費版限額執行阻擋 | `api/workflows/execute` + `WorkflowForm.tsx` | ✅ | 每月 1 次；403；升級 banner |
| 7.5 | Vercel 環境變數：STRIPE_WEBHOOK_SECRET | DevOps | ⏳ | 需在 Vercel + Stripe Dashboard 設定 |

---

## 八、Admin CRM

| # | 任務 | 路徑 | 狀態 | 備註 |
|---|------|------|------|------|
| 8.1 | Admin 頁面（用戶清單 + 統計） | `app/admin/page.tsx` | ✅ | 總用戶、免費/Pro/企業人數、MRR 估算、總生成次數、本月新增 |
| 8.2 | CSV 匯出 | `AdminExportButton.tsx` | ✅ | Email/方案/加入日期/訂閱到期/生成次數/最後使用/Stripe ID |
| 8.3 | Vercel 環境變數：ADMIN_EMAILS | DevOps | ⏳ | 逗號分隔的管理員 Email 列表 |
| 8.4 | Google Sheets API 匯出 | — | 🚫 | 需 Google Cloud Service Account；延後處理 |

---

## 九、測試

| # | 任務 | 狀態 | 備註 |
|---|------|------|------|
| 9.1 | `POST /api/workflows/execute` 手動測試（weekly_social） | ✅ | 已在開發環境確認 |
| 9.2 | Stripe Webhook 測試（Stripe CLI） | ⏳ | `stripe listen --forward-to localhost:3000/api/webhooks/stripe` |
| 9.3 | TTS 播放測試（MiniMax API） | ⏳ | 需 MINIMAX_API_KEY 有效 |
| 9.4 | 免費限額測試（第 2 次生成應被 403） | ⏳ | |
| 9.5 | Admin 頁面測試（ADMIN_EMAILS 白名單） | ⏳ | |
| 9.6 | 手機響應式測試 | ⏳ | iPhone SE / 375px |

---

## 十、部署 & DevOps

| # | 任務 | 狀態 | 備註 |
|---|------|------|------|
| 10.1 | `middleware.ts` — session 刷新 + 路由保護 | ✅ | |
| 10.2 | Tailwind CSS v3 安裝 | ✅ | |
| 10.3 | `next.config.mjs` Cloudflare Pages 設定 | ✅ | `@cloudflare/next-on-pages` adapter |
| 10.4 | Vercel 部署設定 | ⏳ | 建議改用 Vercel（Next.js 15 + Server Actions 兼容性更好） |
| 10.5 | Production Supabase 項目建立 | ⏳ | 現用 dev 環境 |
| 10.6 | Migration 執行到 Production DB | ⏳ | 001–005 全部 |
| 10.7 | Seed 執行到 Production DB | ⏳ | 5 個 workflows |
| 10.8 | 自訂域名 `sosocontent.ai` 綁定 | ⏳ | |
| 10.9 | Vercel 環境變數全部設定 | ⏳ | 見下方清單 |

### Vercel 環境變數清單（待設定）

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENROUTER_API_KEY
MINIMAX_API_KEY
MINIMAX_GROUP_ID
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
NEXT_PUBLIC_STRIPE_PRO_BUTTON_ID
NEXT_PUBLIC_STRIPE_ENTERPRISE_BUTTON_ID
ADMIN_EMAILS
```

---

## 十一、MVP 里程碑

```
Phase 0 — 核心引擎 ✅
  [✅] DB schema + seed
  [✅] /api/workflows/execute
  [✅] TypeScript types

Phase 1 — Workflow UI ✅
  [✅] Workflow Hub 頁面（6 個工作流程）
  [✅] 動態表單 + 結果顯示
  [✅] weekly_social 7 張貼文卡

Phase 2 — Auth & 用戶系統 ✅
  [✅] middleware.ts
  [✅] 登入 / 註冊頁 (Google OAuth + Magic Link)
  [✅] Dashboard Command Center（stats + 快捷卡 + 最近紀錄）
  [✅] Brand Profile UI + API

Phase 3 — Content Library ✅
  [✅] GET /api/executions (filter + pagination)
  [✅] LibraryView — 5 個 filter tabs
  [✅] 5 種 ResultPanel（weekly_social / brand_story / product_launch / brand_trust / brand_strategy）
  [✅] CopyBlock 一鍵複製

Phase 3.5 — UX／UI 設計系統 ✅
  [✅] DESIGN.md 設計規範
  [✅] Tailwind 深色 tokens
  [✅] Nav + AppLayout + Toast
  [✅] ⚡ Dashboard 工作坊快捷卡（brand 綠色高亮）

Phase 3.6 — Voice / TTS ✅
  [✅] MiniMax T2A v2 整合（lib/tts/minimax.ts）
  [✅] /api/tts/generate endpoint
  [✅] Supabase Storage tts-audio bucket + RLS
  [✅] WorkflowForm + LibraryView 實際播放功能
  [✅] Voice Profile 設定頁

Phase 3.7 — 訂閱 & 付費 ✅
  [✅] Stripe Buy Button（定價頁）
  [✅] Stripe Webhook → 自動升級 user_plans
  [✅] 免費版限額執行（403 + 升級 banner）

Phase 3.8 — Admin CRM ✅
  [✅] Admin Dashboard（用戶清單 + 統計）
  [✅] CSV 匯出（Excel 繁中）

Phase 4 — 部署上線 ⏳
  [ ] Vercel 部署
  [ ] Production Supabase + Migrations
  [ ] 環境變數全部設定
  [ ] 域名 sosocontent.ai 綁定

Phase 4.5 — 社交媒體整合 & 排程（參考 Manus）⏳
  [ ] 社交媒體連接器（Instagram Graph API OAuth）
  [ ] 一鍵發布：LibraryView / WorkflowForm 加「發布到 IG」按鈕
  [ ] 排程任務：Vercel Cron + DB 排程表（scheduled_tasks）
  [ ] 自動週期生成（每週一自動跑 weekly_social）
  [ ] 技能包：行業 Prompt 模板（零售 / 餐飲 / 美容 / 教育）
  [ ] 品牌個性化加強：語氣偏好、常用 hashtag、受眾設定

Phase 5 — 增長功能 🚫
  [ ] Google Sheets API 匯出（Admin）
  [ ] Landing Page 更新（5 個 workflows 展示）
  [ ] Mobile Nav（底部 tab bar）
  [ ] Tone Learning（記錄用戶編輯，提升生成品質）
  [ ] Gunter 字體（Logo）
```

---

## 下一步行動（Next Actions）

**立即（部署前必做）：**
1. Vercel 新增 `ADMIN_EMAILS` 環境變數（admin 頁面白名單）
2. Vercel 新增 `STRIPE_WEBHOOK_SECRET`（Stripe Webhook 驗證）
3. Stripe Dashboard 設定 Webhook endpoint → `https://你的域名/api/webhooks/stripe`
4. 執行 Supabase Migrations `003`–`005`（若尚未執行到 production）

**測試：**
5. `stripe listen --forward-to localhost:3000/api/webhooks/stripe`（本地測試 Webhook）
6. 測試免費限額：生成 2 次，第 2 次應看到升級 banner
7. TTS 播放測試（需有效 MINIMAX_API_KEY）

**部署：**
8. Vercel 部署 + 自訂域名
9. Production Supabase — 執行全部 migrations + seed
