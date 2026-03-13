-- ============================================================
-- Seed: SME Workflow #1 — 每週社交媒體內容助手
-- Run AFTER migration 001_workflow_tables.sql
-- ============================================================

-- 1. Insert the system-level workflow (workspace_id = NULL means global/shared)
INSERT INTO workflows (id, workspace_id, key, name, description, is_active)
VALUES (
  'a1000000-0000-0000-0000-000000000001',
  NULL,
  'weekly_social',
  '每週社交媒體內容助手',
  '根據品牌資料及本週重點，一次過生成 7 條社交媒體貼文，每條包含主題、內文、圖片概念及 Hashtag。',
  true
)
ON CONFLICT (id) DO NOTHING;


-- 2. Insert the prompt template for weekly_social
INSERT INTO prompt_templates (id, workflow_id, name, system_prompt, template_body, model)
VALUES (
  'b1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  '每週 7 條貼文生成',

  -- system_prompt ─────────────────────────────────────────────────────────────
  $SYSTEM$你是一位熟悉香港和台灣中小企業市場的資深社交媒體內容策劃，精通粵語和繁體中文。
用字要自然、本地化、符合社群平台語氣，絕對不要機器感或硬銷味。
你的目標是幫老闆在最短時間內準備一星期的社交媒體貼文，使內容有吸引力，同時帶出品牌價值而不過分推銷。

【輸出格式規定】
必須輸出純 JSON，格式如下（不得有任何額外文字或 Markdown code block）：
{
  "weekly_plan": [
    {
      "day": 1,
      "theme": "貼文主題／角度（短句）",
      "content": "完整貼文內文",
      "visual_concept": "建議的圖片或短影片概念（簡要說明）",
      "hashtags": ["#標籤1", "#標籤2"]
    }
  ]
}
weekly_plan 陣列必須剛好包含 7 個物件（day 1 至 day 7），hashtags 每條 3–8 個。$SYSTEM$,

  -- template_body (user prompt with {{PLACEHOLDER}} vars) ─────────────────────
  $TEMPLATE$根據以下資訊，幫我設計一星期的社交媒體內容：

行業／店舖類型：{{BUSINESS_TYPE}}
目標平台：{{PLATFORMS}}
本週推廣重點：{{WEEKLY_FOCUS}}
目標受眾：{{TARGET_AUDIENCE}}
品牌描述：{{BRAND_DESCRIPTION}}
語氣風格：{{TONE}}
語言風格：{{LANGUAGE_STYLE}}

請產出 7 條貼文建議，每一條都要包含：
1）貼文主題／角度（短句，填入 theme）
2）完整貼文內文（適合指定平台，用 {{LANGUAGE_STYLE}}，填入 content）
3）建議的圖片或短影片概念（簡要說明，填入 visual_concept）
4）Hashtag 建議 3–8 個（填入 hashtags 陣列）

請嚴格按照系統指定的 JSON 格式輸出，方便我 copy 使用。$TEMPLATE$,

  'openai/gpt-4o-mini'
)
ON CONFLICT DO NOTHING;


-- 3. Insert prompt variables (defines the input form fields)
INSERT INTO prompt_variables (template_id, name, label, type, required, options, default_value, sort_order)
VALUES

  ('b1000000-0000-0000-0000-000000000001',
   'BUSINESS_TYPE', '行業／店舖類型', 'text', true, NULL,
   NULL, 1),

  ('b1000000-0000-0000-0000-000000000001',
   'PLATFORMS', '目標平台', 'multi-select', true,
   '[
     {"value":"IG","label":"Instagram"},
     {"value":"Facebook","label":"Facebook"},
     {"value":"小紅書","label":"小紅書 (XHS)"},
     {"value":"Threads","label":"Threads"},
     {"value":"TikTok","label":"TikTok / 抖音"}
   ]'::jsonb,
   'IG、Facebook', 2),

  ('b1000000-0000-0000-0000-000000000001',
   'WEEKLY_FOCUS', '本週推廣重點', 'textarea', true, NULL,
   NULL, 3),

  ('b1000000-0000-0000-0000-000000000001',
   'TARGET_AUDIENCE', '目標受眾', 'text', false, NULL,
   '香港大眾', 4),

  ('b1000000-0000-0000-0000-000000000001',
   'BRAND_DESCRIPTION', '品牌描述', 'textarea', false, NULL,
   NULL, 5),

  ('b1000000-0000-0000-0000-000000000001',
   'TONE', '語氣風格', 'select', true,
   '[
     {"value":"輕鬆搞笑","label":"😄 輕鬆搞笑"},
     {"value":"專業可信","label":"💼 專業可信"},
     {"value":"溫暖貼地","label":"🤝 溫暖貼地"},
     {"value":"活力年輕","label":"⚡ 活力年輕"},
     {"value":"高端精緻","label":"✨ 高端精緻"}
   ]'::jsonb,
   '輕鬆搞笑', 6),

  ('b1000000-0000-0000-0000-000000000001',
   'LANGUAGE_STYLE', '語言風格', 'select', true,
   '[
     {"value":"香港粵語口語＋繁體中文","label":"🇭🇰 香港粵語口語＋繁體中文"},
     {"value":"台灣用語＋繁體中文","label":"🇹🇼 台灣用語＋繁體中文"},
     {"value":"書面華語＋繁體中文","label":"📝 書面華語＋繁體中文"}
   ]'::jsonb,
   '香港粵語口語＋繁體中文', 7)

ON CONFLICT (template_id, name) DO NOTHING;


-- ============================================================
-- Seed: Workflow #2 — 品牌故事撰寫
-- ============================================================

INSERT INTO workflows (id, workspace_id, key, name, description, is_active)
VALUES (
  'a2000000-0000-0000-0000-000000000002',
  NULL,
  'brand_story',
  '品牌故事撰寫',
  '根據品牌核心精神與目標受眾，生成打動人心的品牌故事文案，適合官網、社交媒體及媒體報導使用。',
  true
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO prompt_templates (id, workflow_id, name, system_prompt, template_body, model)
VALUES (
  'b2000000-0000-0000-0000-000000000002',
  'a2000000-0000-0000-0000-000000000002',
  '品牌故事生成',

  $SYSTEM$你是一位擅長品牌敘事的資深文案策略師，精通繁體中文及粵語表達。
你的任務是為香港及台灣中小企業撰寫真實、有溫度、有共鳴的品牌故事。
故事要避免空洞的企業語言，要用真實的人物、挑戰與轉變來打動讀者。

【輸出格式規定】
必須輸出純 JSON，格式如下（不得有任何額外文字或 Markdown code block）：
{
  "brand_story": {
    "headline": "品牌故事標題（15字以內）",
    "tagline": "品牌標語／口號（10字以內）",
    "story_short": "短版品牌故事（適合社交媒體，150字以內）",
    "story_long": "長版品牌故事（適合官網 About Us，400-600字）",
    "key_values": ["核心價值1", "核心價值2", "核心價值3"],
    "cta": "行動呼籲句子（適合按鈕或結尾）"
  }
}$SYSTEM$,

  $TEMPLATE$請根據以下品牌資訊，為我撰寫品牌故事：

品牌名稱：{{BRAND_NAME}}
行業類別：{{INDUSTRY}}
創立背景／起源：{{ORIGIN_STORY}}
品牌使命：{{MISSION}}
目標客群：{{TARGET_AUDIENCE}}
品牌個性：{{BRAND_PERSONALITY}}
語言風格：{{LANGUAGE_STYLE}}

請生成完整的品牌故事套件，包括標題、標語、短版及長版故事，讓我可以直接應用於不同渠道。$TEMPLATE$,

  'openai/gpt-4o-mini'
)
ON CONFLICT DO NOTHING;

INSERT INTO prompt_variables (template_id, name, label, type, required, options, default_value, sort_order)
VALUES
  ('b2000000-0000-0000-0000-000000000002',
   'BRAND_NAME', '品牌名稱', 'text', true, NULL, NULL, 1),

  ('b2000000-0000-0000-0000-000000000002',
   'INDUSTRY', '行業類別', 'text', true, NULL, NULL, 2),

  ('b2000000-0000-0000-0000-000000000002',
   'ORIGIN_STORY', '創立背景／起源', 'textarea', true, NULL,
   '分享你點解會創立這個品牌，有什麼難忘的故事或契機？', 3),

  ('b2000000-0000-0000-0000-000000000002',
   'MISSION', '品牌使命', 'textarea', true, NULL,
   '你希望這個品牌為客戶帶來什麼改變或價值？', 4),

  ('b2000000-0000-0000-0000-000000000002',
   'TARGET_AUDIENCE', '目標客群', 'text', false, NULL, '香港中小企業', 5),

  ('b2000000-0000-0000-0000-000000000002',
   'BRAND_PERSONALITY', '品牌個性', 'select', true,
   '[
     {"value":"親切溫暖","label":"🤝 親切溫暖"},
     {"value":"專業可信","label":"💼 專業可信"},
     {"value":"創新前衛","label":"🚀 創新前衛"},
     {"value":"高端精緻","label":"✨ 高端精緻"},
     {"value":"活力年輕","label":"⚡ 活力年輕"}
   ]'::jsonb,
   '親切溫暖', 6),

  ('b2000000-0000-0000-0000-000000000002',
   'LANGUAGE_STYLE', '語言風格', 'select', true,
   '[
     {"value":"香港粵語口語＋繁體中文","label":"🇭🇰 香港粵語口語＋繁體中文"},
     {"value":"台灣用語＋繁體中文","label":"🇹🇼 台灣用語＋繁體中文"},
     {"value":"書面華語＋繁體中文","label":"📝 書面華語＋繁體中文"}
   ]'::jsonb,
   '香港粵語口語＋繁體中文', 7)

ON CONFLICT (template_id, name) DO NOTHING;


-- ============================================================
-- Seed: Workflow #3 — 新品上市推廣
-- ============================================================

INSERT INTO workflows (id, workspace_id, key, name, description, is_active)
VALUES (
  'a3000000-0000-0000-0000-000000000003',
  NULL,
  'product_launch',
  '新品上市推廣',
  '一次生成新產品的賣點文案、社交媒體推廣貼文及活動口號，快速搶佔市場注意力。',
  true
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO prompt_templates (id, workflow_id, name, system_prompt, template_body, model)
VALUES (
  'b3000000-0000-0000-0000-000000000003',
  'a3000000-0000-0000-0000-000000000003',
  '新品推廣文案生成',

  $SYSTEM$你是一位擅長產品推廣的資深文案師，精通香港及台灣市場。
你的任務是為新產品上市生成高吸引力的推廣文案套件，包括賣點整理、社交媒體貼文及活動口號。
文字要簡潔有力，突出產品獨特賣點，激發消費者的購買慾望。

【輸出格式規定】
必須輸出純 JSON，格式如下（不得有任何額外文字或 Markdown code block）：
{
  "product_launch": {
    "product_name": "產品名稱",
    "tagline": "產品標語（10字以內）",
    "key_selling_points": [
      {"point": "賣點標題", "description": "賣點說明（30字以內）"}
    ],
    "launch_posts": [
      {"platform": "平台名稱", "content": "貼文內容", "hashtags": ["#標籤"]}
    ],
    "campaign_slogans": ["口號1", "口號2", "口號3"],
    "email_subject": "推廣電郵主題（吸引點擊）"
  }
}
key_selling_points 需要 3-5 個，launch_posts 需要 3 個（IG、Facebook、小紅書各一），campaign_slogans 需要 3 個。$SYSTEM$,

  $TEMPLATE$請為以下新產品生成完整的上市推廣文案套件：

產品名稱：{{PRODUCT_NAME}}
產品類別：{{PRODUCT_CATEGORY}}
產品特點／功能：{{PRODUCT_FEATURES}}
目標價位：{{PRICE_POINT}}
目標買家：{{TARGET_BUYER}}
推廣重點：{{LAUNCH_FOCUS}}
品牌語氣：{{TONE}}
語言風格：{{LANGUAGE_STYLE}}

請生成完整推廣套件，讓我可以即時用於各個渠道。$TEMPLATE$,

  'openai/gpt-4o-mini'
)
ON CONFLICT DO NOTHING;

INSERT INTO prompt_variables (template_id, name, label, type, required, options, default_value, sort_order)
VALUES
  ('b3000000-0000-0000-0000-000000000003',
   'PRODUCT_NAME', '產品名稱', 'text', true, NULL, NULL, 1),

  ('b3000000-0000-0000-0000-000000000003',
   'PRODUCT_CATEGORY', '產品類別', 'text', true, NULL, NULL, 2),

  ('b3000000-0000-0000-0000-000000000003',
   'PRODUCT_FEATURES', '產品特點／功能', 'textarea', true, NULL,
   '描述產品的主要功能、特色及與同類產品的分別', 3),

  ('b3000000-0000-0000-0000-000000000003',
   'PRICE_POINT', '目標價位', 'select', false,
   '[
     {"value":"經濟實惠（$100以下）","label":"💚 經濟實惠（$100以下）"},
     {"value":"中等定價（$100-$500）","label":"💛 中等定價（$100-$500）"},
     {"value":"中高端（$500-$2000）","label":"🧡 中高端（$500-$2000）"},
     {"value":"高端奢侈（$2000以上）","label":"💎 高端奢侈（$2000以上）"}
   ]'::jsonb,
   '中等定價（$100-$500）', 4),

  ('b3000000-0000-0000-0000-000000000003',
   'TARGET_BUYER', '目標買家', 'text', false, NULL, '香港都市人', 5),

  ('b3000000-0000-0000-0000-000000000003',
   'LAUNCH_FOCUS', '推廣重點', 'textarea', false, NULL,
   '例如：限時優惠、首批特典、解決某個痛點等', 6),

  ('b3000000-0000-0000-0000-000000000003',
   'TONE', '品牌語氣', 'select', true,
   '[
     {"value":"輕鬆搞笑","label":"😄 輕鬆搞笑"},
     {"value":"專業可信","label":"💼 專業可信"},
     {"value":"溫暖貼地","label":"🤝 溫暖貼地"},
     {"value":"活力年輕","label":"⚡ 活力年輕"},
     {"value":"高端精緻","label":"✨ 高端精緻"}
   ]'::jsonb,
   '溫暖貼地', 7),

  ('b3000000-0000-0000-0000-000000000003',
   'LANGUAGE_STYLE', '語言風格', 'select', true,
   '[
     {"value":"香港粵語口語＋繁體中文","label":"🇭🇰 香港粵語口語＋繁體中文"},
     {"value":"台灣用語＋繁體中文","label":"🇹🇼 台灣用語＋繁體中文"},
     {"value":"書面華語＋繁體中文","label":"📝 書面華語＋繁體中文"}
   ]'::jsonb,
   '香港粵語口語＋繁體中文', 8)

ON CONFLICT (template_id, name) DO NOTHING;


-- ============================================================
-- Seed: Workflow #4 — 品牌權威認可
-- ============================================================

INSERT INTO workflows (id, workspace_id, key, name, description, is_active)
VALUES (
  'a4000000-0000-0000-0000-000000000004',
  NULL,
  'brand_trust',
  '品牌權威認可',
  '整合媒體報導、獎項與客戶見證，生成令人信服的品牌公信力內容，適用於官網、提案及社交媒體。',
  true
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO prompt_templates (id, workflow_id, name, system_prompt, template_body, model)
VALUES (
  'b4000000-0000-0000-0000-000000000004',
  'a4000000-0000-0000-0000-000000000004',
  '品牌公信力內容生成',

  $SYSTEM$你是一位擅長品牌公關與信任建立的資深內容策略師，精通繁體中文及粵語表達。
你的任務是幫助中小企業將現有的媒體報導、獎項認可與客戶評價，轉化為有說服力的品牌公信力內容。
文字要具體、真實，避免自吹自擂，要讓第三方聲音替品牌說話。

【輸出格式規定】
必須輸出純 JSON，格式如下（不得有任何額外文字或 Markdown code block）：
{
  "brand_trust": {
    "trust_headline": "品牌信任宣言標題（15字以內）",
    "credibility_statement": "品牌公信力聲明（適合官網 About 頁，100字以內）",
    "press_intro": "媒體報導引言（適合新聞稿或媒體資料夾，80字以內）",
    "testimonial_highlights": [
      {"quote": "客戶見證摘要（30字以內）", "attribution": "來源說明（如：香港餐飲業客戶）"}
    ],
    "social_proof_posts": [
      {"platform": "平台名稱", "content": "貼文內容", "hashtags": ["#標籤"]}
    ],
    "trust_badges": ["信任標誌文字1", "信任標誌文字2", "信任標誌文字3"]
  }
}
testimonial_highlights 需要 3 個，social_proof_posts 需要 2 個（IG 和 LinkedIn 各一），trust_badges 需要 3-5 個。$SYSTEM$,

  $TEMPLATE$請根據以下品牌資訊，生成完整的品牌權威認可內容套件：

品牌名稱：{{BRAND_NAME}}
行業類別：{{INDUSTRY}}
媒體報導／獲獎記錄：{{MEDIA_AWARDS}}
客戶評價摘要：{{CUSTOMER_REVIEWS}}
服務年資／規模：{{EXPERIENCE}}
核心客群：{{TARGET_CLIENT}}
語言風格：{{LANGUAGE_STYLE}}

請生成能直接使用的品牌公信力內容，讓潛在客戶更快建立信任。$TEMPLATE$,

  'openai/gpt-4o-mini'
)
ON CONFLICT DO NOTHING;

INSERT INTO prompt_variables (template_id, name, label, type, required, options, default_value, sort_order)
VALUES
  ('b4000000-0000-0000-0000-000000000004',
   'BRAND_NAME', '品牌名稱', 'text', true, NULL, NULL, 1),

  ('b4000000-0000-0000-0000-000000000004',
   'INDUSTRY', '行業類別', 'text', true, NULL, NULL, 2),

  ('b4000000-0000-0000-0000-000000000004',
   'MEDIA_AWARDS', '媒體報導／獲獎記錄', 'textarea', true, NULL,
   '例如：曾獲香港電台報導、2023 年香港創業獎銀獎、被 HK01 專訪等', 3),

  ('b4000000-0000-0000-0000-000000000004',
   'CUSTOMER_REVIEWS', '客戶評價摘要', 'textarea', true, NULL,
   '分享幾則真實客戶評價或回饋，可以是 Google 評語或直接引述', 4),

  ('b4000000-0000-0000-0000-000000000004',
   'EXPERIENCE', '服務年資／規模', 'text', false, NULL,
   '例如：創業 5 年、服務超過 300 個客戶', 5),

  ('b4000000-0000-0000-0000-000000000004',
   'TARGET_CLIENT', '核心客群', 'text', false, NULL, '香港中小企業', 6),

  ('b4000000-0000-0000-0000-000000000004',
   'LANGUAGE_STYLE', '語言風格', 'select', true,
   '[
     {"value":"香港粵語口語＋繁體中文","label":"🇭🇰 香港粵語口語＋繁體中文"},
     {"value":"台灣用語＋繁體中文","label":"🇹🇼 台灣用語＋繁體中文"},
     {"value":"書面華語＋繁體中文","label":"📝 書面華語＋繁體中文"}
   ]'::jsonb,
   '香港粵語口語＋繁體中文', 7)

ON CONFLICT (template_id, name) DO NOTHING;


-- ============================================================
-- Seed: Workflow #5 — 行業競爭分析
-- ============================================================

INSERT INTO workflows (id, workspace_id, key, name, description, is_active)
VALUES (
  'a5000000-0000-0000-0000-000000000005',
  NULL,
  'brand_strategy',
  '行業競爭分析',
  '拆解競爭對手的內容策略與市場定位，生成差異化建議與內容支柱，幫你找到屬於自己的市場空間。',
  true
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO prompt_templates (id, workflow_id, name, system_prompt, template_body, model)
VALUES (
  'b5000000-0000-0000-0000-000000000005',
  'a5000000-0000-0000-0000-000000000005',
  '競爭分析與差異化策略',

  $SYSTEM$你是一位擅長品牌定位與競爭策略的資深市場顧問，精通香港及台灣中小企業市場。
你的任務是根據用戶提供的品牌資訊與競爭對手描述，生成有實用價值的競爭分析報告與差異化策略。
分析要具體、有洞察力，建議要可執行，幫助品牌找到自己獨特的市場空間。

【輸出格式規定】
必須輸出純 JSON，格式如下（不得有任何額外文字或 Markdown code block）：
{
  "brand_strategy": {
    "positioning_statement": "品牌定位聲明（20字以內）",
    "competitive_advantages": [
      {"advantage": "競爭優勢標題", "description": "具體說明（30字以內）"}
    ],
    "differentiation_strategy": "差異化策略說明（100字以內）",
    "content_pillars": [
      {"pillar": "內容支柱名稱", "description": "說明（20字以內）", "example_topics": ["主題1", "主題2"]}
    ],
    "recommended_channels": ["最適合的渠道1", "渠道2", "渠道3"],
    "action_plan": ["首要行動步驟1（具體可執行）", "步驟2", "步驟3"]
  }
}
competitive_advantages 需要 3-4 個，content_pillars 需要 3 個，action_plan 需要 3-5 步。$SYSTEM$,

  $TEMPLATE$請根據以下資訊，為我的品牌生成競爭分析與差異化策略：

我的品牌：{{MY_BRAND}}
我的行業：{{INDUSTRY}}
我的主要服務／產品：{{MY_OFFERING}}
主要競爭對手：{{COMPETITORS}}
我認為自己的優勢：{{MY_STRENGTHS}}
目標客群：{{TARGET_AUDIENCE}}
語言風格：{{LANGUAGE_STYLE}}

請生成有深度的競爭分析，並提供可立即執行的差異化策略建議。$TEMPLATE$,

  'openai/gpt-4o-mini'
)
ON CONFLICT DO NOTHING;

INSERT INTO prompt_variables (template_id, name, label, type, required, options, default_value, sort_order)
VALUES
  ('b5000000-0000-0000-0000-000000000005',
   'MY_BRAND', '我的品牌名稱', 'text', true, NULL, NULL, 1),

  ('b5000000-0000-0000-0000-000000000005',
   'INDUSTRY', '行業類別', 'text', true, NULL, NULL, 2),

  ('b5000000-0000-0000-0000-000000000005',
   'MY_OFFERING', '主要服務／產品', 'textarea', true, NULL,
   '描述你的核心服務或產品，以及你認為最大的賣點', 3),

  ('b5000000-0000-0000-0000-000000000005',
   'COMPETITORS', '主要競爭對手', 'textarea', true, NULL,
   '列出 2-3 個主要競爭對手，簡單描述他們的定位或策略', 4),

  ('b5000000-0000-0000-0000-000000000005',
   'MY_STRENGTHS', '我認為自己的優勢', 'textarea', false, NULL,
   '你覺得自己比競爭對手強在哪裡？哪些地方客戶最喜歡你？', 5),

  ('b5000000-0000-0000-0000-000000000005',
   'TARGET_AUDIENCE', '目標客群', 'text', false, NULL, '香港中小企業主', 6),

  ('b5000000-0000-0000-0000-000000000005',
   'LANGUAGE_STYLE', '語言風格', 'select', true,
   '[
     {"value":"香港粵語口語＋繁體中文","label":"🇭🇰 香港粵語口語＋繁體中文"},
     {"value":"台灣用語＋繁體中文","label":"🇹🇼 台灣用語＋繁體中文"},
     {"value":"書面華語＋繁體中文","label":"📝 書面華語＋繁體中文"}
   ]'::jsonb,
   '香港粵語口語＋繁體中文', 7)

ON CONFLICT (template_id, name) DO NOTHING;
