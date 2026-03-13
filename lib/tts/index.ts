import { MiniMaxTtsProvider } from './minimax';
import type { TtsProvider } from './types';

export type { TtsProvider, TtsRequest, TtsResponse, VoiceProfileSettings } from './types';
export { MINIMAX_EMOTIONS, MINIMAX_CANTONESE_VOICES } from './minimax';

/**
 * Factory: returns the correct TtsProvider for a given provider string.
 * Adding ElevenLabs later: add a case here + implement ElevenLabsTtsProvider.
 */
export function getTtsProvider(provider: string): TtsProvider {
  switch (provider) {
    case 'minimax': {
      const apiKey  = process.env.MINIMAX_API_KEY;
      const groupId = process.env.MINIMAX_GROUP_ID;
      if (!apiKey)  throw new Error('MINIMAX_API_KEY env var is not set');
      if (!groupId) throw new Error('MINIMAX_GROUP_ID env var is not set');
      return new MiniMaxTtsProvider(apiKey, groupId);
    }
    default:
      throw new Error(`Unsupported TTS provider: "${provider}"`);
  }
}
