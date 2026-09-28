import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Os únicos sítios onde o Perplexity pode pesquisar (lista aprovada pela Marta a
 * 28/09/2026). Até aqui o pedido dizia "usa APENAS estas fontes" e a resposta
 * vinha com MSD em espanhol e italiano, agências de Espanha e do Chile, g1, R7,
 * EDP. Um pedido não é um filtro: passa a ir no `search_domain_filter` da API,
 * e o texto do pedido lista exactamente os mesmos domínios.
 *
 * Regras da API (docs.perplexity.ai, "Search Domain Filter"): máximo 20; um
 * domínio inclui os subdomínios (`dgs.pt` apanha `alimentacaosaudavel.dgs.pt`,
 * `min-saude.pt` apanha `insa.min-saude.pt`); aceita caminho. A documentação não
 * diz se o filtro é garantido — confere-se pelas fontes devolvidas.
 */
const DOMINIOS_PERMITIDOS = [
  // Referência clínica — só a edição em português (não es, it, pt-br)
  "msdmanuals.com/pt/casa",
  "msdmanuals.com/pt/profissional",
  // Revistas e revisões
  "actamedicaportuguesa.com",
  "rpmgf.pt",
  "scielo.pt",
  "cochranelibrary.com",
  // Institucionais portuguesas
  "dgs.pt",
  "sns24.gov.pt",
  "sns.gov.pt",
  "min-saude.pt",
  "infarmed.pt",
  "ordemdosmedicos.pt",
  "ordemdospsicologos.pt",
  "nutrimento.pt",
  "spginecologia.pt",
  // Internacionais
  "who.int",
  "ecdc.europa.eu",
];

/**
 * O papel do JWT do pedido (28/09/2026). Esta função só aceita a service_role:
 * cada chamada gasta créditos do Perplexity, e a chave anon é pública. Quem a
 * chama é a generate-guioes-weekly, com a service_role do seu ambiente. A
 * ASSINATURA do token é verificada antes, pelo `verify_jwt: true` da
 * publicação — sem ele, este papel podia ser forjado. Publicar sempre com
 * verify_jwt: true.
 *
 * Efeito lateral: o botão "Gerar perguntas da semana" da página /guioes chama
 * esta função com a sessão anónima do browser e passa a receber 403.
 */
function papelDoPedido(req: Request): string | null {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const partes = token.split(".");
  if (partes.length !== 3) return null;
  try {
    const b64 = partes[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4)));
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (papelDoPedido(req) !== "service_role") {
    return new Response(
      JSON.stringify({ error: "só a service_role pode chamar esta função" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { tema, keywords, semana } = await req.json();
    // Segredo renomeado a 28/09/2026: era VITE_PERPLEXITY_API_KEY. O prefixo
    // VITE_ é o que o Vite põe no bundle do browser quando a variável está no
    // .env; uma chave secreta não deve ter um nome que convide a isso.
    const PERPLEXITY_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_KEY) throw new Error("PERPLEXITY_API_KEY is not configured");

    // Só os nomes, por ordem. Até 28/09/2026 iam com o `current_volume` e o
    // `change_percent` da tabela `keywords` — parados desde Março — e o pedido
    // chamava-lhes "as keywords mais pesquisadas esta semana". A
    // generate-guioes-weekly passa agora o top 5 medido da semana (`semana`).
    const keywordList = (keywords || [])
      .map((k: any) => String(k.term))
      .join(", ");
    const frasePesquisa = semana
      ? `Os termos mais procurados no Google em Portugal para este tema na semana de ${semana}, por ordem, foram: ${keywordList}.`
      : `Termos do tema: ${keywordList}.`;

    const systemPrompt = `És especialista em comunicação de ciência e saúde pública em Portugal. Respondes APENAS com JSON válido, sem texto antes ou depois, sem markdown, sem backticks.`;

    const userPrompt = `Gera exactamente 5 perguntas de vox pop sobre ${tema} para o programa Diz que Disse — vamos para as ruas perguntar a cidadãos comuns em Portugal. As perguntas testam literacia em saúde, são directas e concretas, em português europeu. TODAS devem ter resposta_simples e contexto_cientifico preenchidos (nunca vazios). ${frasePesquisa} Inspira-te nesses termos para gerar perguntas relevantes e actuais.

Para cada pergunta inclui:
- resposta_simples: 1-2 frases directas para o cidadão (linguagem acessível)
- contexto_cientifico: 3-5 frases com base científica para o comunicador preparar a entrevista (pode incluir dados, mecanismos, prevalência)

Usa APENAS estas fontes para referencia_nome e referencia_url — são as únicas onde a pesquisa está autorizada:

Referência clínica e revistas:
- MSD Manuals, edição em português (msdmanuals.com/pt/casa e msdmanuals.com/pt/profissional)
- Acta Médica Portuguesa (actamedicaportuguesa.com)
- Revista Portuguesa de Medicina Geral e Familiar (rpmgf.pt)
- SciELO Portugal (scielo.pt)
- Cochrane Library (cochranelibrary.com)

Institucionais portuguesas:
- DGS (dgs.pt) · SNS 24 (sns24.gov.pt) · SNS (sns.gov.pt) · Ministério da Saúde e organismos, incluindo o INSA (min-saude.pt) · Infarmed (infarmed.pt)
- Ordem dos Médicos (ordemdosmedicos.pt) · Ordem dos Psicólogos (ordemdospsicologos.pt) · Nutrimento (nutrimento.pt) · Sociedade Portuguesa de Ginecologia (spginecologia.pt)

Internacionais:
- OMS (who.int) · ECDC (ecdc.europa.eu)

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
        search_domain_filter: DOMINIOS_PERMITIDOS,
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
      .map((p: any) => ({
        pergunta: String(p.pergunta || ""),
        resposta_simples: String(p.resposta_simples || "Consulte a fonte indicada para mais informações."),
        contexto_cientifico: String(p.contexto_cientifico || ""),
        referencia_nome: String(p.referencia_nome || ""),
        // Vazio de propósito (28/09/2026). Até aqui era `citations[i]`: a
        // i-ésima fonte da resposta inteira atribuída à i-ésima pergunta, como
        // se correspondessem — não correspondem. As fontes vão ao nível do
        // guião, em `fontes_resposta`, e a Marta confere-as ao rever.
        referencia_url: "",
      }));

    console.log(`Generated ${perguntas.length} questions via Perplexity Sonar`);

    return new Response(JSON.stringify({ perguntas, fontes_resposta: citations }), {
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
