import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// PATCH /api/voice-profiles/:id — update a profile
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 });

  // Verify ownership via workspace
  const { data: profile } = await supabase
    .from('voice_profiles')
    .select('id, workspace_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!profile) return NextResponse.json({ error: '找不到聲線資料' }, { status: 404 });

  const body = await req.json() as Record<string, unknown>;

  // If setting this as default, clear others in same workspace first
  if (body.is_default === true) {
    await supabase
      .from('voice_profiles')
      .update({ is_default: false })
      .eq('workspace_id', profile.workspace_id)
      .neq('id', id);
  }

  const allowed = [
    'display_name', 'provider_voice_id', 'language', 'description',
    'default_emotion', 'default_speed', 'default_vol', 'default_pitch', 'is_default',
    'sample_audio_url',
  ];

  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) {
      patch[key] = body[key];
      if (key === 'display_name') patch['name'] = body[key]; // keep name in sync
    }
  }

  const { data, error } = await supabase
    .from('voice_profiles')
    .update(patch)
    .eq('id', id)
    .select('id, workspace_id, display_name, provider, provider_voice_id, language, description, default_emotion, default_speed, default_vol, default_pitch, is_default, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/voice-profiles/:id
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 });

  const { error } = await supabase
    .from('voice_profiles')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new Response(null, { status: 204 });
}
