import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import type { Workflow, PromptVariable } from '@/lib/workflow-types';
import WorkflowForm from '@/app/workflows/[key]/WorkflowForm';

const WORKFLOW_KEY = 'brand_trust';

export default async function BrandTrustPage() {
  const supabase = await createClient();

  const { data: workflowData } = await supabase
    .from('workflows')
    .select('*')
    .eq('key', WORKFLOW_KEY)
    .eq('is_active', true)
    .single();

  if (!workflowData) notFound();
  const workflow = workflowData as Workflow;

  const { data: templateData } = await supabase
    .from('prompt_templates')
    .select('id')
    .eq('workflow_id', workflow.id)
    .limit(1)
    .single();

  let variables: PromptVariable[] = [];
  if (templateData) {
    const { data: vars } = await supabase
      .from('prompt_variables')
      .select('*')
      .eq('template_id', templateData.id)
      .order('sort_order');
    variables = vars ?? [];
  }

  return (
    <AppLayout>
      <div className="max-w-2xl">
        <div className="mb-8">
          <Link
            href="/workflows"
            className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent/80 font-medium mb-4"
          >
            ← 返回工作坊
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🏷️</span>
            <h1 className="text-2xl md:text-3xl font-bold text-primary">{workflow.name}</h1>
          </div>
          {workflow.description && (
            <p className="text-secondary text-sm mt-1">{workflow.description}</p>
          )}
        </div>

        <WorkflowForm workflowKey={WORKFLOW_KEY} variables={variables} />
      </div>
    </AppLayout>
  );
}
