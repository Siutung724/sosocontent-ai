import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import type { Workflow } from '@/lib/workflow-types';

// ── Constants ──────────────────────────────────────────────────────────────────

const WORKFLOW_ICONS: Record<string, string> = {
  weekly_social:   '📅',
  brand_strategy:  '📚',
  product_launch:  '🚀',
  brand_trust:     '🏷️',
  kol_script:      '🎬',
  flash_sale:      '⚡',
  competitor_ad:   '🔍',
};

const FREE_LIFETIME_CREDITS     = 120;
const PRO_PERIOD_CREDITS        = 1000;
const ENTERPRISE_PERIOD_CREDITS = 5000;

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free:       { label: '免費版',  color: 'bg-primary/8 text-secondary' },
  pro:        { label: 'Pro',     color: 'bg-accent/15 text-accent' },
  enterprise: { label: '企業版',  color: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400' },
};

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const displayName =
    user.user_metadata?.full_name ?? user.user_metadata?.name ??
    user.email?.split('@')[0] ?? '用家';

  const plan = (user.user_metadata?.plan as string | undefined) ?? 'free';
  const planInfo = PLAN_LABELS[plan] ?? PLAN_LABELS.free;

  // ── Fetch in parallel ───────────────────────────────────────────────────────

  // 1. Workflows list
  const workflowsPromise = supabase
    .from('workflows').select('*').eq('is_active', true).order('created_at');

  // 2. All executions by this user (for stats + most-used)
  const allExecsPromise = supabase
    .from('executions')
    .select('id, workflow_id, inputs, created_at, credits_used')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // 3. Brand profiles count
  const workspacesPromise = supabase
    .from('workspaces').select('id').eq('owner_id', user.id);

  const [{ data: workflowData }, { data: allExecData }, { data: workspaceData }] =
    await Promise.all([workflowsPromise, allExecsPromise, workspacesPromise]);

  const workflows: Workflow[] = workflowData ?? [];
  const allExecs = allExecData ?? [];
  const workspaces = workspaceData ?? [];

  // Brand count
  let brandCount = 0;
  if (workspaces.length) {
    const { count } = await supabase
      .from('brand_profiles')
      .select('id', { count: 'exact', head: true })
      .in('workspace_id', workspaces.map(w => w.id));
    brandCount = count ?? 0;
  }

  // Stats
  const totalExecs = allExecs.length;

  // Credits remaining
  let creditsRemaining = -1; // sentinel: unlimited (shouldn't be shown)
  let creditsAllowance = 0;
  {
    let periodStart: string | null = null;
    let allowance: number;

    if (plan === 'free') {
      allowance = FREE_LIFETIME_CREDITS;
      periodStart = null; // all-time
    } else {
      allowance = plan === 'enterprise' ? ENTERPRISE_PERIOD_CREDITS : PRO_PERIOD_CREDITS;
      const { data: planRow } = await supabase
        .from('user_plans')
        .select('current_period_end')
        .eq('user_id', user.id)
        .single();

      if (planRow?.current_period_end) {
        const periodEnd = new Date(planRow.current_period_end);
        periodEnd.setMonth(periodEnd.getMonth() - 1);
        periodStart = periodEnd.toISOString();
      } else {
        const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0);
        periodStart = d.toISOString();
      }
    }

    const periodExecs = periodStart
      ? allExecs.filter(e => e.created_at >= periodStart!)
      : allExecs;
    const creditsUsed = periodExecs.reduce((sum, e) => sum + ((e as any).credits_used ?? 1), 0);
    creditsRemaining = Math.max(0, allowance - creditsUsed);
    creditsAllowance = allowance;
  }

  // Most-used workflows (top 3)
  const wfCounts: Record<string, number> = {};
  for (const ex of allExecs) {
    if (ex.workflow_id) wfCounts[ex.workflow_id] = (wfCounts[ex.workflow_id] ?? 0) + 1;
  }
  const wfMap = Object.fromEntries(workflows.map(w => [w.id, w]));
  const topWorkflows = Object.entries(wfCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, count]) => ({ wf: wfMap[id], count }))
    .filter(x => x.wf);

  // If user has no history, show first 3 active workflows as suggestions
  const quickWorkflows = topWorkflows.length > 0
    ? topWorkflows
    : workflows.slice(0, 3).map(wf => ({ wf, count: 0 }));

  // Recent 5 executions
  const recentExecs = allExecs.slice(0, 5);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">

        {/* ── Top: Greeting + Plan badge ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary">
              你好，{displayName} 👋
            </h1>
            <p className="text-secondary text-sm mt-1">歡迎回到你的內容指揮中心</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${planInfo.color}`}>
              {planInfo.label}
            </span>
            {plan === 'free' && (
              <Link
                href="/pricing"
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-accent text-white hover:bg-accent/90 transition-colors"
              >
                升級 →
              </Link>
            )}
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface border border-primary/8 rounded-2xl p-5">
            <p className="text-xs text-secondary font-medium mb-1">總生成次數</p>
            <p className="text-3xl font-bold text-primary">{totalExecs}</p>
            <p className="text-xs text-secondary/60 mt-1">累計 AI 生成</p>
          </div>
          <div className="bg-surface border border-primary/8 rounded-2xl p-5">
            <p className="text-xs text-secondary font-medium mb-1">剩餘積分</p>
            <p className={`text-3xl font-bold ${creditsRemaining === 0 ? 'text-red-500' : 'text-primary'}`}>
              {creditsRemaining.toLocaleString()}
            </p>
            <p className="text-xs text-secondary/60 mt-1">
              共 {creditsAllowance.toLocaleString()} 積分
            </p>
          </div>
          <div className="bg-surface border border-primary/8 rounded-2xl p-5">
            <p className="text-xs text-secondary font-medium mb-1">品牌數量</p>
            <p className="text-3xl font-bold text-primary">{brandCount}</p>
            <Link href="/brand" className="text-xs text-accent hover:text-accent/80 mt-1 inline-block transition-colors">
              管理品牌 →
            </Link>
          </div>
          <Link
            href="/workflows"
            className="group col-span-2 md:col-span-1 relative overflow-hidden bg-gradient-to-br from-primary/25 to-primary/8 hover:from-primary/35 hover:to-primary/15 border-2 border-primary/50 hover:border-primary/80 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/35 hover:-translate-y-0.5"
          >
            {/* glow blob */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary/25 rounded-full blur-xl group-hover:bg-primary/40 transition-colors duration-200 pointer-events-none" />
            <span className="text-2xl relative">⚡</span>
            <div className="relative">
              <p className="text-sm font-bold text-primary">
                工作坊 →
              </p>
              <p className="text-xs text-secondary/70 mt-0.5">直達全部 7 個工作流程</p>
            </div>
          </Link>
        </div>

        {/* ── Credits warning ── */}
        {creditsRemaining === 0 && (
          <div className="bg-red-500/8 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                {plan === 'free' ? '免費試用積分已用盡 🔒' : '本期積分已用盡'}
              </p>
              <p className="text-xs text-secondary mt-0.5">
                {plan === 'free'
                  ? '升級至 Pro，每個結帳周期獲得 1,000 積分'
                  : '積分將於下期帳單日自動補充'}
              </p>
            </div>
            {plan === 'free' && (
              <Link
                href="/pricing"
                className="shrink-0 bg-accent text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-accent/90 transition-colors"
              >
                立即升級
              </Link>
            )}
          </div>
        )}

        {/* ── Quick entry: most-used workflows ── */}
        <div>
          <h2 className="text-xs font-semibold text-secondary uppercase tracking-widest mb-3">
            {topWorkflows.length > 0 ? '常用工作流程' : '開始使用'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {quickWorkflows.map(({ wf, count }) => (
              <Link
                key={wf.id}
                href={`/workflows/${wf.key}`}
                className="group bg-surface border border-primary/8 hover:border-accent/30 rounded-2xl p-4 flex items-center gap-3 transition-all hover:shadow-md"
              >
                <span className="text-2xl shrink-0">{WORKFLOW_ICONS[wf.key] ?? '✨'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary group-hover:text-accent transition-colors truncate">
                    {wf.name}
                  </p>
                  {count > 0 && (
                    <p className="text-xs text-secondary/60 mt-0.5">已使用 {count} 次</p>
                  )}
                </div>
                <span className="text-secondary/30 group-hover:text-accent/60 transition-colors shrink-0">→</span>
              </Link>
            ))}
          </div>
          <div className="mt-2 text-right">
            <Link href="/workflows" className="text-xs text-secondary hover:text-accent transition-colors">
              查看全部工作流程 →
            </Link>
          </div>
        </div>

        {/* ── Recent executions ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-secondary uppercase tracking-widest">最近生成紀錄</h2>
            <Link href="/library" className="text-xs text-accent hover:text-accent/80 transition-colors">
              查看全部 →
            </Link>
          </div>

          {recentExecs.length === 0 ? (
            <div className="bg-surface border border-primary/8 rounded-2xl p-8 text-center">
              <p className="text-3xl mb-2">📝</p>
              <p className="text-secondary text-sm">未有生成紀錄，選一個工作流程開始吧！</p>
            </div>
          ) : (
            <div className="bg-surface border border-primary/8 rounded-2xl overflow-hidden">
              <ul className="divide-y divide-primary/8">
                {recentExecs.map(ex => {
                  const wf = ex.workflow_id ? wfMap[ex.workflow_id] : null;
                  const preview = Object.values(ex.inputs ?? {}).filter(Boolean)[0] ?? '';
                  const date = new Date(ex.created_at);
                  const dateStr = date.toLocaleDateString('zh-HK', { month: 'short', day: 'numeric' });
                  const timeStr = date.toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <li key={ex.id} className="px-5 py-4 flex items-center gap-4">
                      <span className="text-xl shrink-0">
                        {wf ? (WORKFLOW_ICONS[wf.key] ?? '✨') : '📄'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary truncate">
                          {wf?.name ?? '未知流程'}
                        </p>
                        {preview && (
                          <p className="text-xs text-secondary truncate mt-0.5">{preview}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0 hidden sm:block">
                        <p className="text-xs text-secondary">{dateStr}</p>
                        <p className="text-xs text-secondary/50">{timeStr}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
