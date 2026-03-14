# sosocontent.ai — 成本與定價內部文件

> ⚠️ 此文件僅供內部使用，不對用家公開
> 最後更新：2026-03-15

---

## 一、供應商成本（每次呼叫）

### AI 文案生成（OpenRouter）

| 模型 | 輸入 | 輸出 | 估算每次 workflow |
|------|------|------|-----------------|
| `google/gemini-flash-1.5` | $0.075/M tokens | $0.30/M tokens | ~$0.003（約 2k tokens） |
| `openai/gpt-4o-mini` | $0.15/M tokens | $0.60/M tokens | ~$0.006（約 2k tokens） |
| `google/gemini-2.0-flash` | $0.10/M tokens | $0.40/M tokens | ~$0.004 |

**參考來源：** [openrouter.ai/models](https://openrouter.ai/models)（每月手動 check）

---

### TTS 語音生成（MiniMax）

| 模型 | 計費方式 | 估算每次 |
|------|---------|---------|
| `speech-02-hd`（粵語） | ~¥0.05/千字 | ~$0.01–0.02/貼文 |

**參考來源：** MiniMax 控制台用量頁面

---

### Lip Sync / 數字人影片（待選）

| 供應商 | 模式 | 計費 | 估算每次（5秒影片） |
|--------|------|------|-----------------|
| **D-ID API** | 相片/影片對嘴 | $0.10–0.15/秒 | ~$0.50–0.75 |
| **VOZO AI** | 影片配音+Lip Sync（LipREAL™） | Enterprise 報價 | 待詢問 |
| **HeyGen API** | Avatar 生成 | 約 $0.04/秒 | ~$0.20 |

**備註：** D-ID 最適合啟動期（自助、$29/月、文件完整）

---

## 二、Credit 定價設計

### 每功能 Credit 消耗（用家可見）

| 功能 | Credit 消耗 | 我方成本 | 毛利率 |
|------|------------|---------|--------|
| 每週社交媒體內容（7篇） | 3 credits | ~$0.003 | 極高 |
| 品牌故事撰寫 | 2 credits | ~$0.003 | 極高 |
| 新品上市推廣 | 3 credits | ~$0.004 | 極高 |
| 品牌信任內容 | 2 credits | ~$0.003 | 極高 |
| 品牌策略分析 | 3 credits | ~$0.004 | 極高 |
| TTS 語音生成（單篇） | 1 credit | ~$0.015 | 高 |
| 數字人影片（5秒，企業版） | 10 credits | ~$0.50–0.75 | 中 |

### Credit Pack 定價（用家可見）

| 方案 | Credits | 售價 | 每 credit 成本 | 建議售價/credit |
|------|---------|------|--------------|--------------|
| 免費新用戶 | 10 credits | $0 | — | — |
| 入門包 | 50 credits | HK$78 / ~US$10 | ~$0.004 | $0.20 |
| 標準包 | 150 credits | HK$198 / ~US$25 | ~$0.004 | $0.17 |
| 專業包 | 500 credits | HK$548 / ~US$70 | ~$0.004 | $0.14 |

**毛利估算（文案生成）：** 每 credit 售 $0.14–0.20，成本 $0.001–0.005 → **毛利率 95%+**
**毛利估算（數字人影片）：** 10 credits = US$1.40–2.00，成本 $0.50–0.75 → **毛利率 ~60–70%**

---

## 三、競爭對手定價參考

| 平台 | 定價模式 | 備註 |
|------|---------|------|
| Jasper AI | US$39/月（Creator） | 純文案，無 TTS/影片 |
| Copy.ai | US$49/月 | 英文為主 |
| Buffer AI | US$6/月 | 社交媒體排程 |
| Manus AI | 邀請制，約 US$39+ | Agent 模式 |

**sosocontent.ai 優勢：** 廣東話本地化 + TTS + 品牌記憶 + 數字人影片（Phase 6）

---

## 四、定期檢查清單

每月檢查以下供應商定價：

- [ ] OpenRouter：[openrouter.ai/models](https://openrouter.ai/models)
- [ ] MiniMax：控制台用量 + 定價頁
- [ ] D-ID：[d-id.com/pricing/api](https://www.d-id.com/pricing/api/)
- [ ] VOZO AI：[vozo.ai/pricing](https://www.vozo.ai/pricing)
- [ ] HeyGen：[heygen.com/api-pricing](https://www.heygen.com/api-pricing)
