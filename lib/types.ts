export type ToneLevel = 0 | 1 | 2 | 3;

export type Industry = 'retail' | 'fitness' | 'beauty' | 'fnb' | 'general';

export type UseCase = 'facebook_post' | 'instagram_post' | 'xhs' | 'video_script' | 'edm' | 'ad_copy' | 'whatsapp_broadcast' | 'image_prompt';

export interface GenerateRequest {
  brandName: string;
  productDescription: string;
  targetAudience?: string;
  industry: Industry;
  keyBenefits?: string[];
  toneLevel?: number;
  contentType: UseCase;
}

export interface GenerateResponse {
  id?: string; // 加入 ID 方便歷史紀錄操作
  type: string;
  mainContent: string;
  variants: string[];
  hashtags: string[];
  error?: string;
}
