import { createClient } from '@supabase/supabase-js';
import type { TtsProvider, TtsRequest, TtsResponse } from './types';

// MiniMax T2A v2 docs: https://platform.minimaxi.com/document/T2A%20V2
// International: https://api.minimax.io/v1  (MINIMAX_BASE_URL env var)
// Audio returned as hex-encoded MP3 in `data.audio`

function getApiUrl(): string {
  const base = process.env.MINIMAX_BASE_URL ?? 'https://api.minimax.io/v1';
  return `${base}/t2a_v2`;
}

// Emotion values supported by MiniMax
export const MINIMAX_EMOTIONS = [
  'neutral', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised',
] as const;

// Known Cantonese voice IDs (platform.minimax.io international)
// _vv2 variants are higher-quality Standard voices
export const MINIMAX_CANTONESE_VOICES = [
  { id: 'Cantonese_crisp_news_anchor_vv2',       label: '★ 清晰新聞女主播' },
  { id: 'Cantonese_professional_reporter_vv2',   label: '★ 專業記者女聲' },
  { id: 'Cantonese_Articulate_commentator_vv2',  label: '★ 清晰評論員' },
  { id: 'Cantonese_Warm_Reporter_vv2',            label: '★ 溫暖記者男聲' },
  { id: 'Cantonese_objective_narrator_vv2',       label: '★ 客觀旁白' },
  { id: 'Cantonese_news_anchor_vv2',              label: '★ 新聞主播' },
  { id: 'Cantonese_resonant_host_vv2',            label: '★ 共鳴主持人' },
  { id: 'Cantonese_Male_news_anchor_vv2',         label: '★ 男新聞主播' },
  { id: 'Cantonese_casual_narrator_vv2',          label: '★ 輕鬆旁白' },
  { id: 'Cantonese_podcast_host_vv2',             label: '★ Podcast 主持人' },
  { id: 'Cantonese_Objective_commentator_vv2',    label: '★ 客觀評論員' },
  { id: 'Cantonese_GentleLady',                   label: '粵語・溫柔女聲' },
  { id: 'Cantonese_ProfessionalHost（F)',          label: '粵語・專業女主播' },
  { id: 'Cantonese_CuteGirl',                     label: '粵語・可愛女聲' },
  { id: 'Cantonese_KindWoman',                    label: '粵語・親切女聲' },
] as const;

export class MiniMaxTtsProvider implements TtsProvider {
  private apiKey: string;
  private groupId: string;

  constructor(apiKey: string, groupId: string) {
    this.apiKey = apiKey;
    this.groupId = groupId;
  }

  async generate(request: TtsRequest): Promise<TtsResponse> {
    const { text, voiceProfile } = request;

    const body = {
      model: 'speech-02-hd',
      text,
      voice_setting: {
        voice_id:  voiceProfile.provider_voice_id || 'Cantonese_crisp_news_anchor_vv2',
        speed:     voiceProfile.default_speed,
        vol:       voiceProfile.default_vol,
        // MiniMax pitch: integer semitones -12..12; our stored range 0.5–1.5 → -6..6
        pitch:     Math.round((voiceProfile.default_pitch - 1.0) * 12),
        emotion:   voiceProfile.default_emotion,
      },
      audio_setting: {
        audio_sample_rate: 32000,
        bitrate:           128000,
        format:            'mp3',
      },
    };

    const response = await fetch(`${getApiUrl()}?GroupId=${this.groupId}`, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`MiniMax API error ${response.status}: ${errText}`);
    }

    const json = await response.json() as {
      base_resp?: { status_code: number; status_msg: string };
      data?:      { audio?: string };
    };

    if (json.base_resp && json.base_resp.status_code !== 0) {
      throw new Error(`MiniMax error: ${json.base_resp.status_msg}`);
    }

    const audioHex = json.data?.audio;
    if (!audioHex) {
      throw new Error('MiniMax returned no audio data');
    }

    // Convert hex string → Buffer → upload to Supabase Storage
    const audioBuffer = Buffer.from(audioHex, 'hex');
    const audioUrl    = await uploadAudioToStorage(audioBuffer);
    return { audioUrl };
  }
}

// ── Supabase Storage upload ───────────────────────────────────────────────────

async function uploadAudioToStorage(buffer: Buffer): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
                   ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase  = createClient(supabaseUrl, serviceKey);
  const fileName  = `tts/${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`;

  const { error } = await supabase.storage
    .from('tts-audio')
    .upload(fileName, buffer, {
      contentType:  'audio/mpeg',
      cacheControl: '3600',
      upsert:       false,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from('tts-audio').getPublicUrl(fileName);
  return data.publicUrl;
}
