import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { AdminExportButton } from './AdminExportButton';

// ── Types ──────────────────────────────────────────────────────────────────────

interface UserRow {
  id: string;
  email: string;
  created_at: string;
  plan: string;
  stripe_customer_id: string | null;
  current_period_end: string | null;
  exec_count: number;
  last_exec_at: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const PLAN_PRICE: Record<string, number> = { pro: 20, enterprise: 50 };

function fmt(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('zh-HK', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function planBadge(plan: string) {
  if (plan === 'pro')        return 'bg-accent/15 text-accent';
  if (plan === 'enterprise') return 'bg-yellow-500/15 text-yellow-500';
  return 'bg-primary/8 text-secondary';
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  // Admin guard — only allowed emails can access
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean);
  if (!adminEmails.includes(user.email ?? '')) {
    redirect('/dashboard');
  }

  // ── Fetch users + plan data (service role via server client) ─────────────────
  const { data: planRows } = await supabase
    .from('user_plans')
    .select('user_id, plan, stripe_customer_id, current_period_end');

  const planMap = Object.fromEntries((planRows ?? []).map(p => [p.user_id, p]));

  // Fetch all auth users via admin API
  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 });

  // Fetch execution counts per user
  const { data: execAgg } = await supabase
    .from('executions')
    .select('user_id, created_at')
    .not('user_id', 'is', null)
    .order('created_at', { ascending: false });

  const execByUser: Record<string, { count: number; last: string }> = {};
  for (const e of execAgg ?? []) {
    if (!e.user_id) continue;
    if (!execByUser[e.user_id]) execByUser[e.user_id] = { count: 0, last: e.created_at };
    execByUser[e.user_id].count++;
  }

  // Build unified user rows
  const rows: UserRow[] = authUsers.map(u => {
    const p = planMap[u.id];
    const ex = execByUser[u.id];
    return {
      id:                  u.id,
      email:               u.email ?? '—',
      created_at:          u.created_at,
      plan:                p?.plan ?? (u.user_metadata?.plan as string) ?? 'free',
      stripe_customer_id:  p?.stripe_customer_id ?? null,
      current_period_end:  p?.current_period_end ?? null,
      exec_count:          ex?.count ?? 0,
      last_exec_at:        ex?.last ?? null,
    };
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // ── Stats ─────────────────────────────────────────────────────────────────────
  const totalUsers   = rows.length;
  const freeCount    = rows.filter(r => r.plan === 'free').length;
  const proCount     = rows.filter(r => r.plan === 'pro').length;
  const entCount     = rows.filter(r => r.plan === 'enterprise').length;
  const mrrEstimate  = proCount * 20 + entCount * 50;
  const totalExecs   = rows.reduce((s, r) => s + r.exec_count, 0);

  // This month signups
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
  const newThisMonth = rows.filter(r => new Date(r.created_at) >= monthStart).length;

  return (
    <AppLayout>
      <div className="space-y-8 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-1">內部管理</p>
            <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
          </div>
          <AdminExportButton rows={rows} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: '總用戶', value: totalUsers, sub: `本月新增 ${newThisMonth}` },
            { label: '免費版', value: freeCount,  sub: `${((freeCount/totalUsers||0)*100).toFixed(0)}%` },
            { label: 'Pro',    value: proCount,   sub: 'US$20/月' },
            { label: '企業版', value: entCount,   sub: 'US$50/月' },
            { label: 'MRR 估算', value: `$${mrrEstimate}`, sub: '美元 / 月' },
            { label: '總生成次數', value: totalExecs, sub: '累計 AI 生成' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-surface border border-primary/8 rounded-2xl p-4">
              <p className="text-xs text-secondary font-medium mb-1">{label}</p>
              <p className="text-2xl font-bold text-primary">{value}</p>
              <p className="text-xs text-secondary/60 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* User table */}
        <div className="bg-surface border border-primary/8 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-primary/8 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-primary">用戶清單</h2>
            <span className="text-xs text-secondary">{totalUsers} 位用戶</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary/8 text-xs text-secondary font-medium">
                  <th className="text-left px-5 py-3">Email</th>
                  <th className="text-left px-4 py-3">方案</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">加入日期</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">訂閱到期</th>
                  <th className="text-right px-4 py-3">生成次數</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">最後使用</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/8">
                {rows.map(r => (
                  <tr key={r.id} className="hover:bg-primary/4 transition-colors">
                    <td className="px-5 py-3 text-primary font-medium truncate max-w-[200px]">
                      {r.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${planBadge(r.plan)}`}>
                        {r.plan === 'free' ? '免費' : r.plan === 'pro' ? 'Pro' : '企業'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-secondary hidden md:table-cell">{fmt(r.created_at)}</td>
                    <td className="px-4 py-3 text-secondary hidden lg:table-cell">{fmt(r.current_period_end)}</td>
                    <td className="px-4 py-3 text-right font-medium text-primary">{r.exec_count}</td>
                    <td className="px-4 py-3 text-secondary hidden md:table-cell">{fmt(r.last_exec_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
