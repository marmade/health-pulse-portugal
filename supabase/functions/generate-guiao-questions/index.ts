import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tema, keywords } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const keywordList = (keywords || [])
      .map((k: any) => `- ${k.term} (vol: ${k.current_volume}, crescimento: ${k.change_percent}%)`)
      .join("\n");

    const systemPrompt = `És um especialista em comunicação de ciência e saúde pública em Portugal. Com base nas keywords de saúde em tendência nesta semana, gera exactamente 10 perguntas de vox pop por tema. As perguntas testam literacia em saúde de cidadãos comuns. Não julgam comportamentos. São directas e concretas. Cada pergunta tem: pergunta (texto), resposta_simples (1-2 frases claras), referencia_nome (nome da fonte real, ex: OMS, DGS, PubMed), referencia_url (URL real e verificável da fonte). Respondes sempre em português europeu.`;

    const userPrompt = `Tema: ${tema}\n\nKeywords em tendência esta semana:\n${keywordList}\n\nGera 10 perguntas de vox pop baseadas nestas tendências.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_perguntas",
                description: "Return an array of vox pop questions with answers and references.",
                parameters: {
                  type: "object",
                  properties: {
                    perguntas: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          pergunta: { type: "string" },
                          resposta_simples: { type: "string" },
                          referencia_nome: { type: "string" },
                          referencia_url: { type: "string" },
                        },
                        required: ["pergunta", "resposta_simples", "referencia_nome", "referencia_url"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["perguntas"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "return_perguntas" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de pedidos excedido. Tenta novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adiciona créditos no workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "Erro na geração de perguntas." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let perguntas: any[] = [];

    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        perguntas = parsed.perguntas || [];
      } catch {
        console.error("Failed to parse tool call arguments");
      }
    }

    // Fallback: try content
    if (perguntas.length === 0) {
      const content = data.choices?.[0]?.message?.content || "";
      try {
        const match = content.match(/\[[\s\S]*\]/);
        if (match) {
          perguntas = JSON.parse(match[0]);
        }
      } catch { /* ignore */ }
    }

    return new Response(JSON.stringify({ perguntas }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-guiao-questions error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
