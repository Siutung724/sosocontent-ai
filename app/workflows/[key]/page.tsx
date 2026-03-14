import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import type { Workflow, PromptVariable } from '@/lib/workflow-types';
import WorkflowForm from './WorkflowForm';

interface PageProps {
  params: Promise<{ key: string }>;
}

const FREE_LIFETIME_CREDITS      = 120;
const PRO_PERIOD_CREDITS         = 1000;
const ENTERPRISE_PERIOD_CREDITS  = 5000;

export default async function WorkflowPage({ params }: PageProps) {
  const { key } = await params;
  const supabase = await createClient();

  // 1. Fetch workflow (includes credit_cost after migration 009)
  const { data: workflowData } = await supabase
    .from('workflows')
    .select('*')
    .eq('key', key)
    .eq('is_active', true)
    .single();

  if (!workflowData) notFound();
  const workflow = workflowData as Workflow;
  const creditCost = workflow.credit_cost ?? 1;

  // 2. Fetch prompt template id
  const { data: templateData } = await supabase
    .from('prompt_templates')
    .select('id')
    .eq('workflow_id', workflow.id)
    .limit(1)
    .single();

  // 3. Fetch prompt variables sorted by sort_order
  let variables: PromptVariable[] = [];
  if (templateData) {
    const { data: vars } = await supabase
      .from('prompt_variables')
      .select('*')
      .eq('template_id', templateData.id)
      .order('sort_order');
    variables = vars ?? [];
  }

  // 4. Compute credits remaining for this user
  const { data: { user } } = await supabase.auth.getUser();
  const plan = (user?.user_metadata?.plan as string | undefined) ?? 'free';
  let creditsRemaining = -1; // default: unlimited (enterprise)

  if (user) {
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

    let usageQuery = supabase
      .from('executions')
      .select('credits_used')
      .eq('user_id', user.id);
    if (periodStart) usageQuery = usageQuery.gte('created_at', periodStart);

    const { data: usageRows } = await usageQuery;
    const used = (usageRows ?? []).reduce(
      (sum, row) => sum + (row.credits_used ?? 1),
      0,
    );
    creditsRemaining = Math.max(0, allowance - used);
  }

  return (
    <AppLayout>
      <div className="max-w-2xl">
        {/* Back + title */}
        <div className="mb-8">
          <Link
            href="/workflows"
            className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent/80 font-medium mb-4"
          >
            ← 返回工作坊
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-primary">{workflow.name}</h1>
          {workflow.description && (
            <p className="text-secondary text-sm mt-1">{workflow.description}</p>
          )}
        </div>

        {/* Client-side form + results */}
        <WorkflowForm
          workflowKey={key}
          variables={variables}
          creditCost={creditCost}
          creditsRemaining={creditsRemaining}
        />
      </div>
    </AppLayout>
  );
}
