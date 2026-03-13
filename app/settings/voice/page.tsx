import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import type { VoiceProfile } from '@/lib/workflow-types';
import VoiceProfileManager from './VoiceProfileManager';

export default async function VoiceSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id')
    .eq('owner_id', user.id);

  let profiles: VoiceProfile[] = [];
  if (workspaces?.length) {
    const { data } = await supabase
      .from('voice_profiles')
      .select('id, workspace_id, display_name, provider, provider_voice_id, language, description, default_emotion, default_speed, default_vol, default_pitch, is_default, created_at')
      .in('workspace_id', workspaces.map(w => w.id))
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });
    profiles = (data as VoiceProfile[]) ?? [];
  }

  return (
    <AppLayout>
      <div className="max-w-5xl space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">聲線設定</h1>
          <p className="text-secondary text-sm mt-1">
            選擇你嘅廣東話聲線，用於所有 AI 生成內容嘅語音朗讀
          </p>
        </div>
        <VoiceProfileManager initial={profiles} />
      </div>
    </AppLayout>
  );
}
