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
      .map((k: any) => `${k.term} (volume: ${k.current_volume}, crescimento: ${k.change_percent}%)`)
      .join(", ");

    const systemPrompt = `És especialista em comunicação de ciência e saúde pública em Portugal. Respondes APENAS com JSON válido, sem texto antes ou depois, sem markdown, sem backticks.`;

    const userPrompt = `Gera exactamente 10 perguntas de vox pop sobre o tema ${tema} para o programa Diz que Disse, que vai para as ruas de Portugal perguntar a cidadãos comuns. As perguntas testam literacia em saúde — revelam o que as pessoas sabem ou não sabem, sem julgar. São directas, concretas, em português europeu.

As keywords mais pesquisadas esta semana em Portugal para este tema são: ${keywordList}.

Inspira-te nessas keywords para gerar perguntas relevantes e actuais.

Todas as perguntas devem ter resposta_simples preenchida — nunca vazio.

Responde APENAS com este JSON, sem mais nada:
[
  {
    "pergunta": "texto da pergunta",
    "resposta_simples": "resposta em 1-2 frases em português",
    "referencia_nome": "nome da fonte (ex: OMS, DGS, SNS24, INSA)",
    "referencia_url": "URL da página principal da fonte"
  }
]`;

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
    const content = data.choices?.[0]?.message?.content || "";
    console.log("AI raw response:", content.substring(0, 500));

    let perguntas: any[] = [];

    // Try parsing the content directly as JSON array
    try {
      // Remove any markdown backticks if present
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        perguntas = parsed;
      } else if (parsed.perguntas && Array.isArray(parsed.perguntas)) {
        perguntas = parsed.perguntas;
      }
    } catch {
      // Try to extract JSON array from content
      try {
        const match = content.match(/\[[\s\S]*\]/);
        if (match) {
          perguntas = JSON.parse(match[0]);
        }
      } catch {
        console.error("Failed to parse AI response as JSON");
      }
    }

    // Allowed source URLs
    const allowedUrls: Record<string, string> = {
      "OMS": "https://www.who.int",
      "DGS": "https://www.dgs.pt",
      "SNS24": "https://www.sns24.gov.pt",
      "INSA": "https://www.insa.min-saude.pt",
      "INFARMED": "https://www.infarmed.pt",
      "PubMed": "https://pubmed.ncbi.nlm.nih.gov",
      "ECDC": "https://www.ecdc.europa.eu",
      "ORDEM DOS MÉDICOS": "https://www.ordemdosmedicos.pt",
      "ORDEM DOS PSICÓLOGOS": "https://www.ordemdospsicologos.pt",
    };

    // Validate and normalize each item
    perguntas = perguntas
      .filter((p: any) => p && typeof p === "object" && p.pergunta)
      .map((p: any) => {
        const nome = String(p.referencia_nome || "OMS").toUpperCase().trim();
        const matchedKey = Object.keys(allowedUrls).find((k) => nome.includes(k)) || "OMS";
        return {
          pergunta: String(p.pergunta || ""),
          resposta_simples: String(p.resposta_simples || p.reposta_simples || "Consulte a fonte indicada para mais informações."),
          referencia_nome: matchedKey,
          referencia_url: allowedUrls[matchedKey],
        };
      });

    console.log(`Parsed ${perguntas.length} questions`);

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
