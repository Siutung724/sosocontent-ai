import { UseCase, ToneLevel, Industry } from './types';

export const INDUSTRIES: { label: string; value: Industry }[] = [
  { label: '一般 / 其他', value: 'general' },
  { label: '餐飲美食 (F&B)', value: 'fnb' },
  { label: '零售百貨 (Retail)', value: 'retail' },
  { label: '美容護理 (Beauty)', value: 'beauty' },
  { label: '健身運動 (Fitness)', value: 'fitness' },
];

export const USE_CASES: { label: string; value: UseCase }[] = [
  { label: 'Facebook 貼文', value: 'facebook_post' },
  { label: 'Instagram 貼文', value: 'instagram_post' },
  { label: '小紅書 (XHS) 文案', value: 'xhs' },
  { label: '短影片腳本 (Shorts/Reels)', value: 'video_script' },
  { label: 'EDM 郵件內容', value: 'edm' },
  { label: '廣告文案 (Ad Copy)', value: 'ad_copy' },
  { label: 'WhatsApp 廣播訊息', value: 'whatsapp_broadcast' },
  { label: 'AI 生成圖像提示詞 (Image Prompt)', value: 'image_prompt' },
];

export const TONE_LEVELS: { label: string; value: ToneLevel; description: string }[] = [
  { label: '超貼地 (0)', value: 0, description: '好似老友吹水咁，多潮流用語' },
  { label: '輕鬆 (1)', value: 1, description: '幽默親切，適合一般社交媒體' },
  { label: '專業 (2)', value: 2, description: '大方得體但唔死板' },
  { label: '正式 (3)', value: 3, description: '偏向官方口吻，但仲係廣東話' },
];
