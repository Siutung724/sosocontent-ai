'use client';

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

export function AdminExportButton({ rows }: { rows: UserRow[] }) {
  const handleExport = () => {
    const headers = ['Email', '方案', '加入日期', '訂閱到期', '生成次數', '最後使用', 'Stripe Customer ID'];

    const csvRows = rows.map(r => [
      r.email,
      r.plan,
      r.created_at ? new Date(r.created_at).toLocaleDateString('zh-HK') : '',
      r.current_period_end ? new Date(r.current_period_end).toLocaleDateString('zh-HK') : '',
      String(r.exec_count),
      r.last_exec_at ? new Date(r.last_exec_at).toLocaleDateString('zh-HK') : '',
      r.stripe_customer_id ?? '',
    ].map(cell => `"${cell.replace(/"/g, '""')}"`).join(','));

    const csv = '\uFEFF' + [headers.join(','), ...csvRows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sosocontent-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 bg-surface border border-primary/20 hover:border-accent/40 hover:text-accent text-secondary text-sm font-medium px-4 py-2 rounded-xl transition-colors"
    >
      <span>⬇</span>
      匯出 CSV（Excel）
    </button>
  );
}
