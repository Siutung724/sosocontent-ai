export const CONFIG = {
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'sosocontent.ai Cantonese MVP',
  // 指向 Cloud Function 或 Apps Script 的 URL
  CONTENT_API_BASE_URL: process.env.NEXT_PUBLIC_CONTENT_API_BASE_URL || '/api/generate',
  // 是否為開發環境
  IS_DEV: process.env.NODE_ENV === 'development',
};

if (!CONFIG.CONTENT_API_BASE_URL && typeof window !== 'undefined') {
  console.warn('⚠️ CONTENT_API_BASE_URL is not set in environment variables.');
}
