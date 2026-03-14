import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import type {
  ExecuteWorkflowRequest,
  ExecuteWorkflowResponse,
  PromptTemplate,
  PromptVariable,
  BrandProfile,
} from '@/lib/workflow-types';

// ── Credit config ─────────────────────────────────────────────────────────────

/** Monthly credit allowance per plan. -1 = unlimited. */
const PLAN_MONTHLY_CREDITS: Record<string, number> = {
  free:       5,
  pro:        100,
  enterprise: -1,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Replace all {{PLACEHOLDER}} tokens in a template string with values from inputs */
function renderTemplate(template: string, inputs: Record<string, string>): string {
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (_, key: string) => inputs[key] ?? '');
}

/** Strip markdown code fences that some models wrap JSON in */
function extractJson(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse<ExecuteWorkflowResponse>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let body: ExecuteWorkflowRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' } as any, { status: 400 });
  }

  if (!body.workflowKey && !body.templateId) {
    return NextResponse.json(
      { error: 'Provide either workflowKey or templateId' } as any,
      { status: 400 },
    );
  }

  // 1. Fetch the prompt template from Supabase ─────────────────────────────────
  let templateQuery = supabase
    .from('prompt_templates')
    .select('*, workflows!inner(id, key, is_active, credit_cost)')
    .limit(1);

  if (body.templateId) {
    templateQuery = templateQuery.eq('id', body.templateId);
  } else {
    templateQuery = templateQuery.eq('workflows.key', body.workflowKey!);
  }

  const { data: templateRows, error: tplError } = await templateQuery;

  if (tplError || !templateRows?.length) {
    return NextResponse.json(
      { error: `Workflow template not found: ${tplError?.message ?? body.workflowKey}` } as any,
      { status: 404 },
    );
  }

  const template = templateRows[0] as PromptTemplate & {
    workflows: { id: string; key: string; credit_cost: number };
  };
  const workflowId: string  = template.workflows.id;
  const workflowKey: string = template.workflows.key;
  const creditCost: number  = template.workflows.credit_cost ?? 1;

  // 2. Credit check ─────────────────────────────────────────────────────────────
  if (user) {
    const plan = (user.user_metadata?.plan as string | undefined) ?? 'free';
    const planAllowance = PLAN_MONTHLY_CREDITS[plan] ?? PLAN_MONTHLY_CREDITS.free;

    if (planAllowance !== -1) {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { data: usageRows } = await supabase
        .from('executions')
        .select('credits_used')
        .eq('user_id', user.id)
        .gte('created_at', monthStart.toISOString());

      const creditsUsed = (usageRows ?? []).reduce(
        (sum, row) => sum + (row.credits_used ?? 1),
        0,
      );

      if (creditsUsed + creditCost > planAllowance) {
        const remaining = Math.max(0, planAllowance - creditsUsed);
        return NextResponse.json(
          {
            error: remaining === 0
              ? `本月積分已用盡（${planAllowance} 積分），請升級至 Pro 解鎖更多生成次數。`
              : `積分不足：此工作流程需要 ${creditCost} 積分，你只剩 ${remaining} 積分。`,
            creditsRemaining: remaining,
            creditCost,
          } as any,
          { status: 403 },
        );
      }
    }
  }

  // 3. Fetch prompt variables (for validation & default injection) ──────────────
  const { data: variables } = await supabase
    .from('prompt_variables')
    .select('*')
    .eq('template_id', template.id)
    .order('sort_order');

  const vars: PromptVariable[] = variables ?? [];

  // 4. Optionally merge BrandProfile defaults into inputs ───────────────────────
  let mergedInputs: Record<string, string> = { ...body.inputs };

  if (body.brandProfileId) {
    const { data: profile } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('id', body.brandProfileId)
      .single();

    if (profile) {
      const bp = profile as BrandProfile;
      if (!mergedInputs.TARGET_AUDIENCE && bp.target_audience)
        mergedInputs.TARGET_AUDIENCE = bp.target_audience;
      if (!mergedInputs.BRAND_DESCRIPTION && bp.description)
        mergedInputs.BRAND_DESCRIPTION = bp.description;
      if (!mergedInputs.TONE && bp.tone)
        mergedInputs.TONE = bp.tone;
      if (!mergedInputs.LANGUAGE_STYLE && bp.language_style)
        mergedInputs.LANGUAGE_STYLE = bp.language_style;
    }
  }

  // 5. Apply variable defaults for any still-missing fields ─────────────────────
  for (const v of vars) {
    if (!mergedInputs[v.name] && v.default_value) {
      mergedInputs[v.name] = v.default_value;
    }
  }

  // 6. Validate required variables ──────────────────────────────────────────────
  const missing = vars
    .filter(v => v.required && !mergedInputs[v.name]?.trim())
    .map(v => v.label);

  if (missing.length) {
    return NextResponse.json(
      { error: `缺少必填欄位：${missing.join('、')}` } as any,
      { status: 400 },
    );
  }

  // 7. Render the user prompt from template ─────────────────────────────────────
  const userPrompt = renderTemplate(template.template_body, mergedInputs);

  // 8. Call the AI model ─────────────────────────────────────────────────────────
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

  const start = Date.now();
  let rawText = '';
  let usedModel = template.model;
  let tokensUsed: number | null = null;

  if (openrouterKey) {
    const modelsToTry = [
      template.model,
      'openai/gpt-4o-mini',
      'google/gemini-flash-1.5',
    ].filter(Boolean);

    let lastError = '';
    for (const model of modelsToTry) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openrouterKey}`,
            'HTTP-Referer': 'https://sosocontent.ai',
            'X-Title': 'sosocontent.ai HK',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: template.system_prompt },
              { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
          }),
        });

        if (res.ok) {
          const json = await res.json();
          rawText = json.choices[0].message.content;
          usedModel = model;
          tokensUsed = json.usage?.total_tokens ?? null;
          console.log(`[workflows/execute] OK with ${model} in ${Date.now() - start}ms`);
          break;
        }
        lastError = await res.text();
        console.warn(`[workflows/execute] ${model} failed:`, lastError);
      } catch (err: any) {
        lastError = err.message;
      }
    }

    if (!rawText) {
      return NextResponse.json(
        { error: `OpenRouter failed: ${lastError}` } as any,
        { status: 502 },
      );
    }

  } else if (geminiKey) {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
    const res = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: `${template.system_prompt}\n\n${userPrompt}` }],
        }],
      }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Gemini error: ${await res.text()}` } as any,
        { status: res.status },
      );
    }
    const json = await res.json();
    rawText = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    usedModel = 'gemini-1.5-flash';
  } else {
    return NextResponse.json({ error: '未設定 AI API Key' } as any, { status: 500 });
  }

  // 9. Parse AI output ───────────────────────────────────────────────────────────
  let parsedResult: unknown;
  try {
    parsedResult = JSON.parse(extractJson(rawText));
  } catch {
    return NextResponse.json(
      { error: `AI 輸出無法解析為 JSON: ${rawText.slice(0, 200)}` } as any,
      { status: 500 },
    );
  }

  // 10. Save execution log ──────────────────────────────────────────────────────
  let executionId = crypto.randomUUID();

  const executionRow = {
    workspace_id: body.brandProfileId
      ? (await supabase.from('brand_profiles').select('workspace_id').eq('id', body.brandProfileId).single()).data?.workspace_id
      : null,
    workflow_id: workflowId,
    template_id: template.id,
    user_id: user?.id ?? null,
    inputs: mergedInputs,
    result: parsedResult,
    model: usedModel,
    tokens_used: tokensUsed,
    credits_used: creditCost,
  };

  const { data: savedExecution } = await supabase
    .from('executions')
    .insert(executionRow)
    .select('id')
    .single();

  if (savedExecution?.id) executionId = savedExecution.id;

  // 11. Return response ─────────────────────────────────────────────────────────
  return NextResponse.json({
    executionId,
    workflowKey,
    result: parsedResult,
    model: usedModel,
    tokensUsed,
  });
}
