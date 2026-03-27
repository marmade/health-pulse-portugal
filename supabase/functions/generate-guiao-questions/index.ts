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
    const PERPLEXITY_KEY = Deno.env.get("VITE_PERPLEXITY_API_KEY");
    if (!PERPLEXITY_KEY) throw new Error("VITE_PERPLEXITY_API_KEY is not configured");

    const keywordList = (keywords || [])
      .map((k: any) => `${k.term} (volume: ${k.current_volume}, crescimento: ${k.change_percent}%)`)
      .join(", ");

    const systemPrompt = `És especialista em comunicação de ciência e saúde pública em Portugal. Respondes APENAS com JSON válido, sem texto antes ou depois, sem markdown, sem backticks.`;

    const userPrompt = `Gera exactamente 5 perguntas de vox pop sobre ${tema} para o programa Diz que Disse — vamos para as ruas perguntar a cidadãos comuns em Portugal. As perguntas testam literacia em saúde, são directas e concretas, em português europeu. TODAS devem ter resposta_simples e contexto_cientifico preenchidos (nunca vazios). As keywords mais pesquisadas esta semana em Portugal para este tema são: ${keywordList}. Inspira-te nessas keywords para gerar perguntas relevantes e actuais.

Para cada pergunta inclui:
- resposta_simples: 1-2 frases directas para o cidadão (linguagem acessível)
- contexto_cientifico: 3-5 frases com base científica para o comunicador preparar a entrevista (pode incluir dados, mecanismos, prevalência)

Usa APENAS estas fontes científicas e institucionais para referencia_nome e referencia_url, por ordem de prioridade:

MSD MANUALS (fonte prioritária — peer-reviewed, em português):
- Saúde Mental: https://www.msdmanuals.com/pt/casa/dist%C3%BArbios-de-sa%C3%BAde-mental
- Alimentação: https://www.msdmanuals.com/pt/casa/dist%C3%BArbios-nutricionais
- Menopausa: https://www.msdmanuals.com/pt/casa/problemas-de-sa%C3%BAde-feminina/menopausa
- Emergentes: https://www.msdmanuals.com/pt/casa/infec%C3%A7%C3%B5es

Fontes institucionais portuguesas:
Para SAÚDE MENTAL: DGS (dgs.pt) · SNS24 (sns24.gov.pt/tema/saude-mental/) · OMS (who.int) · Ordem dos Psicólogos (ordemdospsicologos.pt)
Para ALIMENTAÇÃO: DGS (dgs.pt) · SNS24 (sns24.gov.pt) · OMS (who.int) · INSA (insa.min-saude.pt) · Nutrimento (nutrimento.pt)
Para MENOPAUSA: DGS (dgs.pt) · SNS24 (sns24.gov.pt) · OMS (who.int) · SPG (spginecologia.pt)
Para EMERGENTES: DGS (dgs.pt) · ECDC (ecdc.europa.eu) · OMS (who.int) · INSA (insa.min-saude.pt)

Se não encontrares uma fonte destas para uma pergunta, deixa referencia_url vazio — não inventes outras fontes.

Responde APENAS com este JSON:
[{"pergunta": "texto", "resposta_simples": "1-2 frases", "contexto_cientifico": "3-5 frases com base científica", "referencia_nome": "ex: MSD Manuals, DGS, OMS", "referencia_url": "URL real da fonte ou vazio"}]`;

    console.log("Calling Perplexity Sonar for tema:", tema);

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Perplexity error:", response.status, text);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de pedidos excedido. Tenta novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const citations = data.citations || [];
    console.log("Perplexity raw response:", content.substring(0, 500));
    console.log("Citations:", JSON.stringify(citations).substring(0, 500));

    let perguntas: any[] = [];

    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      perguntas = Array.isArray(parsed) ? parsed : (parsed.perguntas || []);
    } catch {
      try {
        const match = content.match(/\[[\s\S]*\]/);
        if (match) perguntas = JSON.parse(match[0]);
      } catch {
        console.error("Failed to parse Perplexity response as JSON");
      }
    }

    perguntas = perguntas
      .filter((p: any) => p && typeof p === "object" && p.pergunta)
      .map((p: any, i: number) => ({
        pergunta: String(p.pergunta || ""),
        resposta_simples: String(p.resposta_simples || "Consulte a fonte indicada para mais informações."),
        contexto_cientifico: String(p.contexto_cientifico || ""),
        referencia_nome: String(p.referencia_nome || ""),
        referencia_url: citations[i] || String(p.referencia_url || ""),
      }));

    console.log(`Generated ${perguntas.length} questions via Perplexity Sonar`);

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
