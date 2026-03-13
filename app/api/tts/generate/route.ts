import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getTtsProvider } from '@/lib/tts';
import type { VoiceProfileSettings } from '@/lib/tts';

// POST /api/tts/generate
// Body A: { executionId: string }
//   → fetches output text from executions table, uses default voice profile
// Body B: { text: string, voiceProfileId?: string }
//   → uses supplied text + optional specific profile (falls back to default)

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 });

    const body = await req.json() as {
      executionId?:    string;
      text?:           string;
      voiceProfileId?: string;
      voiceSettings?:  VoiceProfileSettings;  // inline settings (e.g. unsaved form preview)
    };

    // ── 1. Resolve text ────────────────────────────────────────────────────────
    let text: string;
    let executionId: string | undefined = body.executionId;

    if (executionId) {
      const { data: execution, error } = await supabase
        .from('executions')
        .select('id, result, audio_url, voice_profile_id')
        .eq('id', executionId)
        .eq('user_id', user.id)
        .single();

      if (error || !execution) {
        return NextResponse.json({ error: '找不到執行記錄' }, { status: 404 });
      }

      // If already generated, return cached URL
      if (execution.audio_url) {
        return NextResponse.json({
          audio_url:        execution.audio_url,
          voice_profile_id: execution.voice_profile_id,
        });
      }

      // Extract text from result JSON
      const result = execution.result as Record<string, unknown> | null;
      text = extractTextFromResult(result);
      if (!text) {
        return NextResponse.json({ error: '無法從執行結果中提取文字' }, { status: 422 });
      }
    } else if (body.text) {
      text = body.text.trim();
      if (!text) return NextResponse.json({ error: '文字不能為空' }, { status: 400 });
      // Limit to 500 chars for demo/cost control
      if (text.length > 500) text = text.slice(0, 500);
    } else {
      return NextResponse.json({ error: '需要 executionId 或 text' }, { status: 400 });
    }

    // ── 2. Resolve voice profile ───────────────────────────────────────────────
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id);

    const workspaceIds = workspaces?.map(w => w.id) ?? [];

    let profileId = body.voiceProfileId;
    let voiceSettings: VoiceProfileSettings | null = body.voiceSettings ?? null;

    if (profileId) {
      const { data } = await supabase
        .from('voice_profiles')
        .select('id, provider, provider_voice_id, default_emotion, default_speed, default_vol, default_pitch')
        .eq('id', profileId)
        .single();
      if (data) voiceSettings = data as VoiceProfileSettings;
    }

    // Fall back to default profile in workspace
    if (!voiceSettings && workspaceIds.length > 0) {
      const { data } = await supabase
        .from('voice_profiles')
        .select('id, provider, provider_voice_id, default_emotion, default_speed, default_vol, default_pitch')
        .in('workspace_id', workspaceIds)
        .eq('is_default', true)
        .limit(1)
        .single();
      if (data) {
        voiceSettings = data as VoiceProfileSettings;
        profileId     = (data as { id: string }).id;
      }
    }

    // Fall back to hard-coded MiniMax default if user has no profiles
    if (!voiceSettings) {
      const miniKey = process.env.MINIMAX_API_KEY;
      if (!miniKey) {
        return NextResponse.json(
          { error: 'TTS 服務未設定，請聯絡管理員' },
          { status: 503 }
        );
      }
      voiceSettings = {
        provider:           'minimax',
        provider_voice_id:  'Cantonese_crisp_news_anchor_vv2',
        default_emotion:    'neutral',
        default_speed:      1.0,
        default_vol:        1.0,
        default_pitch:      1.0,
      };
    }

    // ── 3. Generate audio ──────────────────────────────────────────────────────
    const ttsProvider = getTtsProvider(voiceSettings.provider);
    const { audioUrl } = await ttsProvider.generate({ text, voiceProfile: voiceSettings });

    // ── 4. Persist audio_url back to executions ────────────────────────────────
    if (executionId) {
      await supabase
        .from('executions')
        .update({
          audio_url:        audioUrl,
          voice_profile_id: profileId ?? null,
        })
        .eq('id', executionId);
    }

    return NextResponse.json({
      audio_url:        audioUrl,
      voice_profile_id: profileId ?? null,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '未知錯誤';
    console.error('[TTS generate]', msg);
    return NextResponse.json({ error: '語音生成失敗', detail: msg }, { status: 500 });
  }
}

// ── Helper: pull readable text from various result shapes ─────────────────────

function extractTextFromResult(result: Record<string, unknown> | null): string {
  if (!result) return '';

  // weekly_social: result.weekly_plan[0].content
  if (Array.isArray(result.weekly_plan)) {
    const posts = result.weekly_plan as Array<{ content?: string }>;
    return posts
      .map(p => p.content ?? '')
      .filter(Boolean)
      .join('\n\n')
      .slice(0, 500);
  }

  // Generic: look for a top-level "content" or "text" string
  if (typeof result.content === 'string') return result.content.slice(0, 500);
  if (typeof result.text    === 'string') return result.text.slice(0, 500);

  return '';
}
