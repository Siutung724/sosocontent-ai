// ── Provider-agnostic TTS types ───────────────────────────────────────────────
// Adding a new provider (e.g. ElevenLabs) only requires a new class that
// implements TtsProvider — no changes needed in the API route or DB.

export interface VoiceProfileSettings {
  provider: string;            // 'minimax' | 'elevenlabs' | ...
  provider_voice_id: string;
  default_emotion: string;     // 'neutral' | 'happy' | 'sad' | ...
  default_speed: number;       // 0.5 – 2.0
  default_vol: number;         // 0.5 – 1.5
  default_pitch: number;       // 0.5 – 1.5
}

export interface TtsRequest {
  text: string;
  voiceProfile: VoiceProfileSettings;
}

export interface TtsResponse {
  audioUrl: string;            // publicly accessible URL to the mp3
}

export interface TtsProvider {
  generate(request: TtsRequest): Promise<TtsResponse>;
}
