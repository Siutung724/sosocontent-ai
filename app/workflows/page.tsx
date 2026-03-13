import { createClient } from '@/lib/supabase-server';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import type { Workflow, BrandProfile } from '@/lib/workflow-types';

const WORKFLOW_ICONS: Record<string, string> = {
  weekly_social: '📅',
  brand_story: '✍️',
  product_launch: '🚀',
};

const QUICK_TASKS = [
  {
    title: '品牌權威認可',
    desc: '整合媒體報導、獎項與客戶見證，建立令人信服的品牌公信力。',
    emoji: '🏷️',
    href: '/brand_trust',
    accent: 'from-yellow-500/10 to-yellow-500/5',
  },
  {
    title: '行業競爭分析',
    desc: '拆解競爭對手的內容策略與定位，找出你的差異化優勢。',
    emoji: '📚',
    href: '/brand_strategy',
    accent: 'from-emerald-500/10 to-emerald-500/5',
  },
  {
    title: '品牌故事撰寫',
    desc: '把品牌核心精神轉化為打動受眾的故事文案，讓人記住你。',
    emoji: '✍️',
    href: '/workflows/brand_story',
    accent: 'from-cta/10 to-cta/5',
  },
  {
    title: '社交媒體週計劃',
    desc: '七天 IG / FB 貼文一次過搞掂，每篇都貼合你的品牌語氣。',
    emoji: '📅',
    href: '/workflows/weekly_social',
    accent: 'from-accent/10 to-accent/5',
  },
  {
    title: '新品上市推廣',
    desc: '快速生成產品賣點、活動口號與推廣文字，搶佔市場注意力。',
    emoji: '🚀',
    href: '/workflows/product_launch',
    accent: 'from-purple-500/10 to-purple-500/5',
  },
  {
    title: '品牌聲線設定',
    desc: '建立你的專屬語音形象，讓文字開口說話，更有溫度。',
    emoji: '🎙️',
    href: '/settings/voice',
    accent: 'from-pink-500/10 to-pink-500/5',
  },
];

export default async function WorkflowsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch workflows
  const { data: workflowData } = await supabase
    .from('workflows')
    .select('*')
    .eq('is_active', true)
    .order('created_at');

  const workflows: Workflow[] = workflowData ?? [];

  // Fetch brand profiles (up to 3)
  let brands: BrandProfile[] = [];
  if (user) {
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id);
    if (workspaces?.length) {
      const { data } = await supabase
        .from('brand_profiles')
        .select('id, name, tone')
        .in('workspace_id', workspaces.map(w => w.id))
        .order('created_at', { ascending: false })
        .limit(3);
      brands = (data as BrandProfile[]) ?? [];
    }
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Hero */}
        <div className="text-center py-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">內容工作坊</p>
          <h1 className="text-3xl md:text-4xl font-bold text-primary leading-snug">
            激發您的創意靈感<br className="hidden sm:block" />
            <span className="text-accent">使用 SOSOCONTENT</span>
          </h1>
          <p className="text-secondary text-sm mt-3 max-w-md mx-auto">
            選擇一個任務，讓 AI 在幾分鐘內生成符合品牌風格的專業內容
          </p>
        </div>

        {/* Quick tasks */}
        <div>
          <h2 className="text-xs font-semibold text-secondary uppercase tracking-widest mb-4">從一個任務開始</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {QUICK_TASKS.map(task => (
              <Link
                key={task.href}
                href={task.href}
                className={`group bg-gradient-to-br ${task.accent} border border-primary/8 hover:border-accent/30 rounded-2xl p-5 flex items-start gap-4 transition-all hover:shadow-lg`}
              >
                <span className="text-3xl shrink-0 mt-0.5">{task.emoji}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-primary group-hover:text-accent transition-colors mb-1">
                    {task.title}
                  </h3>
                  <p className="text-xs text-secondary leading-relaxed">{task.desc}</p>
                </div>
                <span className="text-secondary/40 group-hover:text-accent/60 transition-colors text-lg shrink-0 mt-0.5">→</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Brand quick-access ── */}
        <div className="bg-surface border border-primary/8 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-secondary uppercase tracking-widest">
              品牌資料
            </span>
            <Link
              href="/brand"
              className="text-xs text-accent hover:text-accent/80 font-medium transition-colors"
            >
              管理品牌 →
            </Link>
          </div>

          {brands.length === 0 ? (
            <div className="flex items-center gap-4">
              <p className="text-sm text-secondary flex-1">
                填寫品牌資料後，AI 生成的內容會更貼合你的品牌風格
              </p>
              <Link
                href="/brand"
                className="shrink-0 bg-cta hover:bg-cta/90 text-body font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
              >
                立即填寫品牌資料
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {brands.map((b, i) => (
                <Link
                  key={b.id}
                  href="/brand"
                  className="flex items-center gap-2 bg-surface-2 border border-primary/10 hover:border-cta/40 hover:bg-cta/5 rounded-xl px-4 py-2.5 transition-colors group"
                >
                  <span className="w-6 h-6 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-xs font-bold text-accent shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-primary group-hover:text-cta transition-colors">
                      {b.name}
                    </p>
                    {b.tone && (
                      <p className="text-xs text-secondary/60">{b.tone}</p>
                    )}
                  </div>
                </Link>
              ))}
              {brands.length < 3 && (
                <Link
                  href="/brand"
                  className="flex items-center gap-2 border border-dashed border-primary/20 hover:border-cta/40 rounded-xl px-4 py-2.5 transition-colors text-secondary hover:text-cta"
                >
                  <span className="text-lg leading-none">＋</span>
                  <span className="text-sm font-medium">新增品牌</span>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ── Workflows grid ── */}
        {workflows.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-secondary uppercase tracking-widest mb-4">已啟用工作流程</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((wf) => (
              <div
                key={wf.id}
                className="bg-surface border border-primary/8 hover:border-primary/10 rounded-2xl shadow-card flex flex-col transition-colors"
              >
                <div className="p-6 flex-1">
                  <div className="text-4xl mb-4">
                    {WORKFLOW_ICONS[wf.key] ?? '✨'}
                  </div>
                  <h2 className="text-base font-semibold text-primary mb-2 leading-snug">
                    {wf.name}
                  </h2>
                  <p className="text-secondary text-sm leading-relaxed">
                    {wf.description ?? 'AI 自動生成專業內容，節省你的時間'}
                  </p>
                </div>
                <div className="px-6 pb-6">
                  <Link
                    href={`/workflows/${wf.key}`}
                    className="block w-full text-center bg-accent hover:bg-accent/90 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm"
                  >
                    開始使用
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>
    </AppLayout>
  );
}
