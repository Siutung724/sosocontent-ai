-- ============================================================
-- Migration 007: Batch 1 — Upgrade 3 workflows with new HK-focused prompts
-- 1. brand_strategy  → 品牌定位一鍵生成器  (PROMPT 1+5)
-- 2. product_launch  → 高轉化廣告文案生成器 (PROMPT 2)
-- 3. brand_trust     → 客評廣告素材轉化器  (PROMPT 6)
-- Run in Supabase SQL Editor
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- 1. 品牌定位一鍵生成器 (brand_strategy → v2)
-- ─────────────────────────────────────────────────────────────

UPDATE workflows
SET name = '品牌定位一鍵生成器',
    description = '用一句話鎖定你的品牌定位，找出3個差異化角度、目標客群痛點排序，及競爭對手的弱點與機會，為所有內容創作奠定基礎。'
WHERE key = 'brand_strategy';

UPDATE prompt_templates
SET
  system_prompt = $SYSTEM$你是一位專為香港中小企服務的品牌定位策略師，精通廣東話口語文案、香港本地消費心理及市場競爭分析。

你的核心原則：
1. 快：每個輸出必須可直接使用，無需二次修改
2. 精準：針對指定行業、目標客群及香港市場現實
3. 有效率：輸出包含「可立即執行」的具體步驟

語言規範（香港市場專用）：
- 主體：廣東話口語書面化（如「係」「唔」「咁」「啱」）
- 適度英文：專業詞彙、品牌名保留英文
- 禁用：純普通話書面語、台灣用語

【輸出格式規定】
必須輸出純 JSON，格式如下（不得有任何額外文字或 Markdown code block）：
{
  "brand_positioning": {
    "one_liner": "一句話品牌定位（10字內，清晰說明你是誰、為誰服務、解決什麼問題）",
    "differentiation_angles": [
      {"angle": "差異化角度標題（8字內）", "description": "具體切入說明（30字內）"}
    ],
    "brand_voice_keywords": ["形容詞1", "形容詞2", "形容詞3", "形容詞4", "形容詞5"],
    "pain_points": [
      {"rank": 1, "pain": "目標客群最在意的痛點", "insight": "深層原因（20字內）"}
    ],
    "local_elements": ["可融入內容的香港本地化元素1", "元素2", "元素3"],
    "competitor_gaps": [
      {"competitor_weakness": "競爭對手未做好的地方", "our_opportunity": "我可以突破的機會（25字內）"}
    ],
    "action_steps": ["立即可執行的具體步驟1", "步驟2", "步驟3"]
  }
}
differentiation_angles 需要 3 個，brand_voice_keywords 需要 5 個，pain_points 由強至弱排列最多 5 個，competitor_gaps 需要 2-3 個，action_steps 需要 3-5 個。$SYSTEM$,

  template_body = $TEMPLATE$請為以下香港品牌建立清晰的市場定位分析：

品牌名稱：{{BRAND_NAME}}
行業／產品／服務：{{INDUSTRY}}
目標客群：{{TARGET_AUDIENCE}}
現有賣點（最強3個）：{{SELLING_POINTS}}
售價定位：{{PRICE_POSITION}}
主要競爭對手：{{COMPETITORS}}
語言風格：{{LANGUAGE_STYLE}}

請輸出：
① 一句話品牌定位（10字內）
② 3個差異化角度（競爭對手未強調、但目標客群在意的切入點）
③ 品牌語氣關鍵詞（5個形容詞）
④ 核心痛點排序（由強至弱，最多5個）
⑤ 香港本地化元素（可融入內容的在地文化、地域、節日或集體回憶）
⑥ 競爭對手弱點與機會（找出我可以突破的空間）
⑦ 立即可執行的3-5步行動計劃

請嚴格按照系統指定的 JSON 格式輸出。$TEMPLATE$,

  updated_at = NOW()
WHERE workflow_id = (SELECT id FROM workflows WHERE key = 'brand_strategy');

-- 刪除舊變數，插入新變數
DELETE FROM prompt_variables
WHERE template_id = (SELECT id FROM prompt_templates WHERE workflow_id = (SELECT id FROM workflows WHERE key = 'brand_strategy'));

INSERT INTO prompt_variables (template_id, name, label, type, required, options, default_value, sort_order)
SELECT
  pt.id,
  v.name, v.label, v.type, v.required, v.options::jsonb, v.default_value, v.sort_order
FROM prompt_templates pt
JOIN workflows w ON pt.workflow_id = w.id AND w.key = 'brand_strategy'
CROSS JOIN (VALUES
  ('BRAND_NAME',       '品牌名稱',           'text',     true,  NULL,
   NULL, 1),
  ('INDUSTRY',         '行業／產品／服務',    'text',     true,  NULL,
   NULL, 2),
  ('TARGET_AUDIENCE',  '目標客群',           'textarea', true,  NULL,
   '年齡、性別、職業、地區，例：25-40歲香港在職女性', 3),
  ('SELLING_POINTS',   '現有賣點（最強3個）', 'textarea', true,  NULL,
   '你認為最強的3個優點，讓競爭對手難以複製的部分', 4),
  ('PRICE_POSITION',   '售價定位',           'select',   true,
   '[{"value":"平價實惠","label":"💚 平價實惠"},{"value":"中等定價","label":"💛 中等定價"},{"value":"中高端","label":"🧡 中高端"},{"value":"高端精品","label":"💎 高端精品"}]',
   '中等定價', 5),
  ('COMPETITORS',      '主要競爭對手（1-3個）','textarea', true,  NULL,
   '列出競爭對手名稱，簡述其定位或策略（一行一個）', 6),
  ('LANGUAGE_STYLE',   '語言風格',           'select',   true,
   '[{"value":"香港粵語口語＋繁體中文","label":"🇭🇰 香港粵語口語＋繁體中文"},{"value":"台灣用語＋繁體中文","label":"🇹🇼 台灣用語＋繁體中文"},{"value":"書面華語＋繁體中文","label":"📝 書面華語＋繁體中文"}]',
   '香港粵語口語＋繁體中文', 7)
) AS v(name, label, type, required, options, default_value, sort_order);


-- ─────────────────────────────────────────────────────────────
-- 2. 高轉化廣告文案生成器 (product_launch → v2)
-- ─────────────────────────────────────────────────────────────

UPDATE workflows
SET name = '高轉化廣告文案生成器',
    description = '生成可直接投放的 Facebook / Instagram 廣告文案，包含勾住注意力的開場、建立渴望的中段、社會認證及行動號召，配合 Hashtag 策略與配圖建議。'
WHERE key = 'product_launch';

UPDATE prompt_templates
SET
  system_prompt = $SYSTEM$你是一位專為香港中小企服務的品牌內容策略師，精通廣東話口語文案、Meta / Instagram 廣告邏輯，以及香港本地消費心理。

你的核心原則：
1. 快：每個輸出必須可直接使用，無需二次修改
2. 精準：內容必須針對指定行業、目標客群和平台特性
3. 真實分享感：語氣如朋友真實分享，避免硬銷腔

語言規範（香港市場專用）：
- 主體：廣東話口語（如「係」「唔」「咁」「超正」「啱晒」）
- 適度英文：專業詞彙、品牌名保留英文
- 禁用：台灣用語、純普通話書面語

【廣告結構（香港高轉化格式）】
第一行：用痛點、數字或驚喜感開場，10-15字，讓人忍不住繼續看
中段：描述問題場景 → 引出解決方案 → 具體功效/成果（用數字或對比）→ 社會認證
結尾CTA：明確行動指令 + 限時/限量元素 + 聯絡方式格式

【輸出格式規定】
必須輸出純 JSON，格式如下（不得有任何額外文字或 Markdown code block）：
{
  "ad_copy": {
    "hook": "第一行勾住注意力（10-15字，用痛點/數字/驚喜感開場）",
    "body": "中段建立渴望（問題場景→解決方案→效果，含社會認證，150字左右）",
    "social_proof": "社會認證獨立句子（例：好多客人話... / 超過XX人已試過...）",
    "cta": "結尾行動號召（明確指令 + 限時/限量 + 聯絡方式，30字內）",
    "full_copy": "完整廣告全文（250-400字，廣東話口語，不得有硬銷感）",
    "hashtags": ["#品牌標籤", "#功效標籤1", "#功效標籤2", "#香港標籤", "#行業標籤"],
    "visual_direction": "建議配圖或影片方向（20字內）"
  }
}
hashtags 需要 8-15 個（品牌標 + 功效標 + 香港本地標 + 行業通用標）。$SYSTEM$,

  template_body = $TEMPLATE$請為以下品牌生成一則可直接投放的廣告文案：

品牌名稱：{{BRAND_NAME}}
行業：{{INDUSTRY}}
今次推廣重點：{{PROMOTION_FOCUS}}
目標客群：{{TARGET_AUDIENCE}}
優惠詳情：{{OFFER_DETAILS}}
截止日期：{{DEADLINE}}
目標平台：{{PLATFORM}}
語言風格：{{LANGUAGE_STYLE}}

請按香港高轉化廣告結構輸出：
① hook：第一行勾住注意力（10-15字，用痛點/數字/驚喜感）
② body：中段建立渴望（問題場景→解決方案→具體成效→社會認證）
③ social_proof：社會認證獨立句子
④ cta：結尾行動號召（含限時/限量元素）
⑤ full_copy：完整廣告全文（250-400字，廣東話口語，真實分享感）
⑥ hashtags：8-15個（品牌+功效+香港本地+行業通用）
⑦ visual_direction：建議配圖方向

請嚴格按照系統指定的 JSON 格式輸出。$TEMPLATE$,

  updated_at = NOW()
WHERE workflow_id = (SELECT id FROM workflows WHERE key = 'product_launch');

DELETE FROM prompt_variables
WHERE template_id = (SELECT id FROM prompt_templates WHERE workflow_id = (SELECT id FROM workflows WHERE key = 'product_launch'));

INSERT INTO prompt_variables (template_id, name, label, type, required, options, default_value, sort_order)
SELECT
  pt.id,
  v.name, v.label, v.type, v.required, v.options::jsonb, v.default_value, v.sort_order
FROM prompt_templates pt
JOIN workflows w ON pt.workflow_id = w.id AND w.key = 'product_launch'
CROSS JOIN (VALUES
  ('BRAND_NAME',       '品牌名稱',     'text',     true,  NULL,
   NULL, 1),
  ('INDUSTRY',         '行業',         'text',     true,  NULL,
   NULL, 2),
  ('PROMOTION_FOCUS',  '今次推廣重點', 'select',   true,
   '[{"value":"新品上市","label":"🆕 新品上市"},{"value":"限時優惠","label":"⚡ 限時優惠"},{"value":"活動推廣","label":"🎉 活動推廣"},{"value":"服務推薦","label":"⭐ 服務推薦"},{"value":"品牌宣傳","label":"📣 品牌宣傳"}]',
   '限時優惠', 3),
  ('TARGET_AUDIENCE',  '目標客群',     'text',     true,  NULL,
   '香港都市人', 4),
  ('OFFER_DETAILS',    '優惠詳情',     'textarea', false, NULL,
   '折扣、優惠碼、免費體驗、贈品，或填「暫無」', 5),
  ('DEADLINE',         '截止日期',     'text',     false, NULL,
   '例：3月31日，或填「不限」', 6),
  ('PLATFORM',         '目標平台',     'select',   true,
   '[{"value":"Facebook帖文","label":"📘 Facebook 帖文"},{"value":"Instagram帖文","label":"📸 Instagram 帖文"},{"value":"IG限時動態","label":"⏱ IG 限時動態"},{"value":"FB+IG兩者","label":"📱 FB + IG 兩者"}]',
   'FB+IG兩者', 7),
  ('LANGUAGE_STYLE',   '語言風格',     'select',   true,
   '[{"value":"香港粵語口語＋繁體中文","label":"🇭🇰 香港粵語口語＋繁體中文"},{"value":"台灣用語＋繁體中文","label":"🇹🇼 台灣用語＋繁體中文"},{"value":"書面華語＋繁體中文","label":"📝 書面華語＋繁體中文"}]',
   '香港粵語口語＋繁體中文', 8)
) AS v(name, label, type, required, options, default_value, sort_order);


-- ─────────────────────────────────────────────────────────────
-- 3. 客評廣告素材轉化器 (brand_trust → v2)
-- ─────────────────────────────────────────────────────────────

UPDATE workflows
SET name = '客評廣告素材轉化器',
    description = '將真實客人評價一鍵轉化為4種可用廣告格式：精煉引言、故事化帖文、數據強化版及問答格式，附 Hashtag 建議，直接貼上即可發布。'
WHERE key = 'brand_trust';

UPDATE prompt_templates
SET
  system_prompt = $SYSTEM$你是一位專為香港中小企服務的品牌內容策略師，精通將真實客人評價轉化為高說服力的廣告素材。

你的核心原則：
1. 保留真實感：改寫後仍要讓人感覺是真實客人聲音，不能過度包裝
2. 多格式輸出：同一則評價生成4種不同格式，適用不同渠道
3. 廣東話本地化：用香港口語，貼近真實讀者語氣

語言規範（香港市場專用）：
- 主體：廣東話口語（如「係」「唔」「好正」「真係」）
- 適度英文：品牌名、專業詞彙保留英文
- 禁用：台灣用語、過度誇張的硬銷語氣

【輸出格式規定】
必須輸出純 JSON，格式如下（不得有任何額外文字或 Markdown code block）：
{
  "review_to_ad": {
    "quote_version": "精煉引言（加引號，30字內，適合圖片廣告直接使用）",
    "story_version": "故事化帖文（客人第一人稱，約250字，有具體場景感和情感轉折）",
    "data_version": "數據化版本（強化評價中的數字、時間、次數或對比，100字內）",
    "qa_version": "問答格式版本（客人問：[痛點問題] → 我們的客人答：[評價精華＋品牌回應]，150字內）",
    "hashtags": ["#標籤1", "#標籤2", "#標籤3", "#標籤4", "#標籤5", "#標籤6", "#標籤7", "#標籤8"]
  }
}
hashtags 需要 8 個，針對評價內容的精準標籤（品牌相關 + 行業 + 效果描述）。$SYSTEM$,

  template_body = $TEMPLATE$請將以下真實客人評價轉化為可發布的廣告素材：

品牌行業：{{BRAND_INDUSTRY}}
客人評價（1-3則）：
{{CUSTOMER_REVIEWS}}
語言風格：{{LANGUAGE_STYLE}}

請輸出4種格式的廣告素材：
① quote_version：精煉引言（加引號，適合圖片廣告，30字內）
② story_version：故事化帖文（客人第一人稱，有場景感，約250字）
③ data_version：數據化版本（強化具體數字、時間、次數或前後對比）
④ qa_version：問答格式版本（客人問痛點→評價精華回答）
⑤ hashtags：8個精準標籤（品牌+行業+效果描述各類型）

請嚴格按照系統指定的 JSON 格式輸出。$TEMPLATE$,

  updated_at = NOW()
WHERE workflow_id = (SELECT id FROM workflows WHERE key = 'brand_trust');

DELETE FROM prompt_variables
WHERE template_id = (SELECT id FROM prompt_templates WHERE workflow_id = (SELECT id FROM workflows WHERE key = 'brand_trust'));

INSERT INTO prompt_variables (template_id, name, label, type, required, options, default_value, sort_order)
SELECT
  pt.id,
  v.name, v.label, v.type, v.required, v.options::jsonb, v.default_value, v.sort_order
FROM prompt_templates pt
JOIN workflows w ON pt.workflow_id = w.id AND w.key = 'brand_trust'
CROSS JOIN (VALUES
  ('BRAND_INDUSTRY',    '品牌行業',                'text',     true,  NULL,
   NULL, 1),
  ('CUSTOMER_REVIEWS',  '客人評價（1-3則）',       'textarea', true,  NULL,
   '貼入真實客人評價，可來自 Google、Facebook、WhatsApp 截圖文字或直接引述（一則一段）', 2),
  ('LANGUAGE_STYLE',    '語言風格',                'select',   true,
   '[{"value":"香港粵語口語＋繁體中文","label":"🇭🇰 香港粵語口語＋繁體中文"},{"value":"台灣用語＋繁體中文","label":"🇹🇼 台灣用語＋繁體中文"},{"value":"書面華語＋繁體中文","label":"📝 書面華語＋繁體中文"}]',
   '香港粵語口語＋繁體中文', 3)
) AS v(name, label, type, required, options, default_value, sort_order);
