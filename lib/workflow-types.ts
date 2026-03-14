/**
 * Workflow Engine — TypeScript Types
 * Mirrors the Supabase schema in migrations/001_workflow_tables.sql
 */

// ── Core entities ─────────────────────────────────────────────────────────────

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface BrandProfile {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  target_audience: string | null;
  tone: string | null;
  language_style: string | null;
  banned_words: string[];
  created_at: string;
}

export interface Workflow {
  id: string;
  workspace_id: string | null;   // null = system/global workflow
  key: string;                   // e.g. 'weekly_social'
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface PromptTemplate {
  id: string;
  workflow_id: string;
  name: string;
  system_prompt: string;
  template_body: string;         // contains {{PLACEHOLDER}} variables
  model: string;
  created_at: string;
  updated_at: string;
}

export type VariableType = 'text' | 'textarea' | 'select' | 'multi-select';

export interface SelectOption {
  value: string;
  label: string;
}

export interface PromptVariable {
  id: string;
  template_id: string;
  name: string;                  // matches {{NAME}} in template_body
  label: string;                 // human-readable (Traditional Chinese)
  type: VariableType;
  required: boolean;
  options: SelectOption[] | null;  // for select / multi-select only
  default_value: string | null;
  sort_order: number;
}

export interface VoiceProfile {
  id: string;
  workspace_id: string;
  display_name: string;
  provider: string;              // 'minimax' | ...
  provider_voice_id: string | null;
  language: string;              // 'yue-HK' | ...
  description: string | null;
  default_emotion: string;
  default_speed: number;
  default_vol: number;
  default_pitch: number;
  is_default: boolean;
  created_at: string;
}

export interface Execution {
  id: string;
  workspace_id: string | null;
  workflow_id: string | null;
  template_id: string | null;
  user_id: string | null;
  inputs: Record<string, string>;
  result: unknown;               // parsed JSON from AI
  model: string | null;
  tokens_used: number | null;
  audio_url: string | null;
  voice_profile_id: string | null;
  created_at: string;
}

// ── API request / response shapes ────────────────────────────────────────────

export interface ExecuteWorkflowRequest {
  /** The workflow key (e.g. 'weekly_social') or templateId UUID */
  workflowKey?: string;
  templateId?: string;
  /** Optional: pre-fills TARGET_AUDIENCE, BRAND_DESCRIPTION, TONE, LANGUAGE_STYLE */
  brandProfileId?: string;
  /** Variable values — keys must match PromptVariable.name */
  inputs: Record<string, string>;
}

export interface ExecuteWorkflowResponse {
  executionId: string;
  workflowKey: string;
  result: unknown;               // parsed AI output (workflow-specific shape)
  model: string;
  tokensUsed: number | null;
  error?: string;
}

// ── weekly_social result shape ────────────────────────────────────────────────

export interface WeeklyPost {
  day: number;
  day_label?: string;       // e.g. "星期一"
  category?: string;        // 教育價值 | 互動趣味 | 信任案例 | 推廣轉化
  theme: string;
  content: string;
  engagement_hook?: string; // question / CTA to drive comments
  visual_concept: string;
  hashtags: string[];
  best_post_time?: string;  // e.g. "09:00"
}

export interface WeeklySocialResult {
  // v2: wrapped object with strategy_note + posts[]
  // v1 (legacy): flat array — both formats supported in LibraryView
  weekly_plan:
    | WeeklyPost[]
    | { strategy_note?: string; posts: WeeklyPost[] };
}

// ── brand_story result shape ──────────────────────────────────────────────────

export interface BrandStoryResult {
  brand_story: {
    headline: string;
    tagline: string;
    story_short: string;
    story_long: string;
    key_values: string[];
    cta: string;
  };
}

// ── product_launch result shape ───────────────────────────────────────────────

export interface ProductLaunchPost {
  platform: string;
  content: string;
  hashtags: string[];
}

export interface ProductLaunchResult {
  product_launch: {
    product_name: string;
    tagline: string;
    key_selling_points: { point: string; description: string }[];
    launch_posts: ProductLaunchPost[];
    campaign_slogans: string[];
    email_subject: string;
  };
}

// ── brand_trust result shape ──────────────────────────────────────────────────

export interface BrandTrustResult {
  brand_trust: {
    trust_headline: string;
    credibility_statement: string;
    press_intro: string;
    testimonial_highlights: { quote: string; attribution: string }[];
    social_proof_posts: { platform: string; content: string; hashtags: string[] }[];
    trust_badges: string[];
  };
}

// ── brand_strategy result shape ───────────────────────────────────────────────

export interface BrandStrategyResult {
  brand_strategy: {
    positioning_statement: string;
    competitive_advantages: { advantage: string; description: string }[];
    differentiation_strategy: string;
    content_pillars: { pillar: string; description: string; example_topics: string[] }[];
    recommended_channels: string[];
    action_plan: string[];
  };
}

export type WorkflowResult =
  | WeeklySocialResult
  | BrandStoryResult
  | ProductLaunchResult
  | BrandTrustResult
  | BrandStrategyResult;
