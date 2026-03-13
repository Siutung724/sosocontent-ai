import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

const SELECT_COLS = 'id, workspace_id, display_name, provider, provider_voice_id, language, description, default_emotion, default_speed, default_vol, default_pitch, is_default, created_at';

// GET /api/voice-profiles — list all profiles for current user's workspaces
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 });

  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', user.id);

  const workspaceIds = workspaces?.map(w => w.id) ?? [];
  if (workspaceIds.length === 0) return NextResponse.json([]);

  const { data, error } = await supabase
    .from('voice_profiles')
    .select(SELECT_COLS)
    .in('workspace_id', workspaceIds)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/voice-profiles — create a new profile
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 });

  // Get or auto-create workspace
  let workspaceId: string;
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', user.id)
    .limit(1)
    .single();

  if (workspaces) {
    workspaceId = workspaces.id;
  } else {
    const { data: newWs, error: wsErr } = await supabase
      .from('workspaces')
      .insert({ name: 'My Workspace', owner_id: user.id })
      .select('id')
      .single();
    if (wsErr || !newWs) {
      return NextResponse.json({ error: '建立工作區失敗' }, { status: 500 });
    }
    workspaceId = newWs.id;
  }

  const body = await req.json() as {
    display_name:       string;
    provider?:          string;
    provider_voice_id:  string;
    language?:          string;
    description?:       string;
    default_emotion?:   string;
    default_speed?:     number;
    default_vol?:       number;
    default_pitch?:     number;
    is_default?:        boolean;
    sample_audio_url?:  string;
  };

  if (!body.display_name?.trim())    return NextResponse.json({ error: '請填寫聲線名稱' }, { status: 400 });
  if (!body.provider_voice_id?.trim()) return NextResponse.json({ error: '請填寫 Voice ID' }, { status: 400 });

  // If new profile is default, clear existing default first
  if (body.is_default) {
    await supabase
      .from('voice_profiles')
      .update({ is_default: false })
      .eq('workspace_id', workspaceId);
  }

  const { data, error } = await supabase
    .from('voice_profiles')
    .insert({
      workspace_id:      workspaceId,
      user_id:           user.id,
      name:              body.display_name,
      display_name:      body.display_name,
      provider:          body.provider          ?? 'minimax',
      provider_voice_id: body.provider_voice_id,
      language:          body.language          ?? 'yue-HK',
      description:       body.description       ?? null,
      default_emotion:   body.default_emotion   ?? 'neutral',
      default_speed:     body.default_speed      ?? 1.0,
      default_vol:       body.default_vol        ?? 1.0,
      default_pitch:     body.default_pitch      ?? 1.0,
      is_default:        body.is_default         ?? false,
      sample_audio_url:  body.sample_audio_url   ?? null,
      status:            'ready',
    })
    .select(SELECT_COLS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
