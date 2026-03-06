import { NextRequest, NextResponse } from 'next/server';
import { GenerateRequest, GenerateResponse } from '@/lib/types';
import { INDUSTRIES, USE_CASES } from '@/lib/constants';
import { BASE_SYSTEM_PROMPT, buildXxxPrompt } from '@/lib/prompts/templates';
import { createClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body: GenerateRequest = await req.json();

    // 驗證必要欄位
    if (!body.brandName || !body.productDescription) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

    const industryName = INDUSTRIES.find(i => i.value === body.industry)?.label || body.industry;
    const platformName = USE_CASES.find(u => u.value === body.contentType)?.label || body.contentType;

    // 構建用戶提示詞
    const userPrompt = buildXxxPrompt(body.contentType, {
      industry_name: industryName,
      platform_name: platformName,
      brand_name: body.brandName,
      product_description: body.productDescription,
      target_audience: body.targetAudience || '香港大眾',
      key_benefits: (body.keyBenefits || []).join(', '),
      tone_level: body.toneLevel ?? 1,
      content_type: body.contentType
    });

    console.log('[Debug] OpenRouter Key present:', !!openrouterKey);
    console.log('[Debug] Gemini Key present:', !!geminiKey);

    const start = Date.now();
    let generatedData: any = null;

    if (openrouterKey) {
      console.log('[API] Using OpenRouter (System + User mode)');
      const apiUrl = "https://openrouter.ai/api/v1/chat/completions";

      const modelsToTry = [
        "openai/gpt-4o-mini",
        "google/gemini-flash-1.5",
        "meta-llama/llama-3.1-8b-instruct:free"
      ];

      let lastError = '';
      for (const model of modelsToTry) {
        try {
          console.log(`[API] Trying model via OpenRouter: ${model}`);
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openrouterKey}`,
              'HTTP-Referer': 'https://sosocontent.ai',
              'X-Title': 'sosocontent.ai HK',
            },
            body: JSON.stringify({
              model: model,
              messages: [
                { role: "system", content: BASE_SYSTEM_PROMPT },
                { role: "user", content: userPrompt }
              ],
              response_format: { type: "json_object" }
            }),
          });

          if (response.ok) {
            const result = await response.json();
            generatedData = JSON.parse(result.choices[0].message.content);
            console.log(`[API] Success with model ${model} in ${Date.now() - start} ms`);
            break;
          } else {
            const errBody = await response.text();
            console.warn(`[API] Model ${model} failed with: `, errBody);
            lastError = errBody;
          }
        } catch (err: any) {
          console.error(`[API] Error with model ${model}: `, err);
          lastError = err.message;
        }
      }

      if (!generatedData) {
        return NextResponse.json({ error: `OpenRouter failed after trying multiple models. Last error: ${lastError}` }, { status: 500 });
      }

    } else if (geminiKey) {
      console.log('[API] Falling back to Gemini native API (v1)');
      const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;

      try {
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: `${BASE_SYSTEM_PROMPT}\n\n${userPrompt}` }] }
            ]
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          return NextResponse.json({ error: `Gemini API error: ${errorText}` }, { status: response.status });
        }

        const result = await response.json();
        const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        const cleanedText = generatedText.replace(/```json|```/g, '').trim();
        generatedData = JSON.parse(cleanedText);
        console.log(`[API] Gemini response received in ${Date.now() - start}ms`);
      } catch (err: any) {
        console.error('[API] Gemini fetch failed:', err);
        return NextResponse.json({ error: `Connection failed: ${err.message}` }, { status: 500 });
      }

    } else {
      return NextResponse.json({ error: '未設定 API Key' }, { status: 500 });
    }

    // --- 儲存歷史紀錄 (如果用戶已登入) ---
    if (user && generatedData) {
      try {
        const { data: savedGeneration, error: dbError } = await supabase
          .from('generations')
          .insert({
            user_id: user.id,
            type: body.contentType,
            prompt: userPrompt,
            result: generatedData,
            meta: {
              brandName: body.brandName,
              industry: body.industry,
              toneLevel: body.toneLevel,
              targetAudience: body.targetAudience
            }
          })
          .select('id')
          .single();

        if (savedGeneration) {
          generatedData.id = savedGeneration.id;
          console.log('[DB] History saved for user:', user.id);
        }
        if (dbError) {
          console.error('[DB] Failed to save history:', dbError);
        }
      } catch (dbError) {
        console.error('[DB] Failed to save history:', dbError);
      }
    }

    return NextResponse.json(generatedData);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
