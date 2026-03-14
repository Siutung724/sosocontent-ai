import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import type { Workflow, PromptVariable } from '@/lib/workflow-types';
import WorkflowForm from './WorkflowForm';

interface PageProps {
  params: Promise<{ key: string }>;
}

/** Monthly credit allowance per plan. -1 = unlimited. */
const PLAN_MONTHLY_CREDITS: Record<string, number> = {
  free:       5,
  pro:        100,
  enterprise: -1,
};

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
  const planAllowance = PLAN_MONTHLY_CREDITS[plan] ?? PLAN_MONTHLY_CREDITS.free;
  let creditsRemaining = planAllowance; // -1 = unlimited

  if (planAllowance !== -1 && user) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { data: usageRows } = await supabase
      .from('executions')
      .select('credits_used')
      .eq('user_id', user.id)
      .gte('created_at', monthStart.toISOString());

    const used = (usageRows ?? []).reduce(
      (sum, row) => sum + (row.credits_used ?? 1),
      0,
    );
    creditsRemaining = Math.max(0, planAllowance - used);
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
