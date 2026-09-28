import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TEMAS = [
  { value: "saude-mental", label: "SAÚDE MENTAL", db: "saude_mental" },
  { value: "alimentacao", label: "ALIMENTAÇÃO", db: "alimentacao" },
  { value: "menopausa", label: "MENOPAUSA", db: "menopausa" },
  { value: "emergentes", label: "EMERGENTES", db: "emergentes" },
];

/**
 * O papel do JWT do pedido (28/09/2026). Esta função só aceita a service_role:
 * a chave anon é pública (está no workflow e no bundle do site) e bastava para
 * escrever na base e gastar créditos do Perplexity. A ASSINATURA do token é
 * verificada antes, pelo `verify_jwt: true` da publicação — sem ele, este papel
 * podia ser forjado. Publicar sempre com verify_jwt: true.
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

Deno.serve(async (req) => {
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Calculate current week (Monday)
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    monday.setHours(0, 0, 0, 0);
    const semanaStr = monday.toISOString().split("T")[0];

    // A semana medida que o guião usa: a que acabou de fechar, de segunda a
    // domingo — a mesma que o passo 7 acabou de arquivar.
    const semanaMedida = new Date(`${semanaStr}T00:00:00Z`);
    semanaMedida.setUTCDate(semanaMedida.getUTCDate() - 7);
    const semanaMedidaStr = semanaMedida.toISOString().split("T")[0];

    // Até 28/09/2026 a IA recebia os termos da tabela `keywords` com o
    // `current_volume` e o `change_percent` de lá — números parados desde
    // Março — apresentados como "as keywords mais pesquisadas esta semana".
    // Passa a receber o top 5 MEDIDO da semana, tal como o arquivo o gravou em
    // eixos_archive. Por isso o passo 7 (arquivo) corre agora antes deste no
    // workflow. Uma só conta, feita num sítio só.
    const { data: arquivo } = await supabase
      .from("eixos_archive")
      .select("axis, top_keywords, nota_medicao")
      .eq("week_start", semanaMedidaStr);
    const arquivoPorEixo: Record<string, any> = {};
    for (const a of (arquivo as any[] | null) || []) arquivoPorEixo[a.axis] = a;

    const results: string[] = [];

    for (const tema of TEMAS) {
      // Um guião já existente só bloqueia a semana se tiver perguntas por
      // rever ou já revistas. 'falhou', ou uma linha vazia antiga ('gerado'
      // com 0 perguntas, de 03/08 a 28/09), gera-se de novo — na mesma linha,
      // e o que lá estava fica escrito em `erro`, para não se perder o registo
      // da falha.
      const { data: existentes } = await supabase
        .from("guioes_semanais")
        .select("id, estado, perguntas, erro, created_at")
        .eq("semana", semanaStr)
        .eq("tema", tema.value)
        .order("created_at", { ascending: false })
        .limit(1);
      const existing = (existentes as any[] | null)?.[0];

      if (existing && ["por rever", "gravado"].includes(existing.estado)) {
        results.push(`${tema.value}: já existe (${existing.estado})`);
        continue;
      }

      // O que falhou, em texto, para ficar gravado em `erro`. Até 28/09/2026
      // as duas falhas abaixo davam listas vazias em silêncio, e a linha era
      // gravada com estado 'gerado' e gerado_por_ia = true: 36 guiões vazios
      // de 03/08 a 28/09, sem nada que o dissesse.
      const erros: string[] = [];

      // O top 5 medido do eixo, por ordem. Só o termo e a posição: o valor
      // calibrado é relativo ao eixo e não quer dizer nada à IA.
      const doEixo = arquivoPorEixo[tema.value];
      const top5 = ((doEixo?.top_keywords as any[] | null) || []).map((k: any) => ({
        term: k.term,
        posicao: k.posicao,
      }));
      if (top5.length === 0) {
        erros.push(
          `IA não chamada: sem top 5 medido para a semana de ${semanaMedidaStr}` +
            (!doEixo
              ? " (o arquivo dessa semana não existe)"
              : doEixo.nota_medicao ? ` (${doEixo.nota_medicao})` : "")
        );
      }

      // Fetch 5 banco base questions
      //
      // Sem `referencia_url`: a coluna não existe em `guioes` na instância
      // nova, e pedi-la fazia a consulta inteira falhar (42703). Na antiga
      // existia, mas vazia nas 46 linhas — não se perde nenhum link.
      const { data: bancoData, error: bancoErr } = await supabase
        .from("guioes")
        .select("pergunta, resposta, referencia_cientifica")
        .ilike("tema", tema.db)
        .limit(50);

      if (bancoErr) {
        erros.push(`banco: ${bancoErr.message}`);
      } else if (!bancoData || bancoData.length === 0) {
        erros.push(`banco: nenhuma pergunta com tema '${tema.db}'`);
      }

      const shuffled = (bancoData || [])
        .sort(() => Math.random() - 0.5)
        .slice(0, 5);

      const bancoPerguntas = shuffled.map((r: any) => ({
        pergunta: r.pergunta || "",
        resposta_simples: r.resposta || "",
        contexto_cientifico: "",
        referencia_nome: r.referencia_cientifica || "",
        referencia_url: "",
        source: "banco",
      }));

      // Generate 5 AI questions via the existing edge function
      let aiPerguntas: any[] = [];
      // As fontes que o Perplexity devolve são da resposta inteira, não de
      // cada pergunta: guardam-se ao nível do guião, em `fontes_resposta`, e
      // a pergunta da IA fica com referencia_url vazio (28/09/2026).
      let fontesResposta: string[] = [];
      // Sem top 5 medido não se pede nada à IA — o erro já ficou em `erros`.
      if (top5.length > 0) {
        try {
          const { data: aiData, error: aiError } = await supabase.functions.invoke(
            "generate-guiao-questions",
            { body: { tema: tema.label, keywords: top5, semana: semanaMedidaStr } }
          );

          if (aiError) {
            // O corpo da resposta diz mais do que "non-2xx status code" — por
            // exemplo o 404 de uma função que não está publicada.
            let detalhe = "";
            try {
              const ctx = (aiError as any).context;
              if (ctx) detalhe = ` (HTTP ${ctx.status}: ${(await ctx.text()).slice(0, 200)})`;
            } catch { /* fica só a mensagem */ }
            erros.push(`IA: ${aiError.message}${detalhe}`);
          } else {
            aiPerguntas = (aiData?.perguntas || []).slice(0, 5).map((p: any) => ({
              ...p,
              referencia_url: "",
              source: "ia",
            }));
            fontesResposta = ((aiData?.fontes_resposta as unknown[]) || []).map(String);
            if (aiPerguntas.length === 0) erros.push("IA: a resposta não trouxe perguntas");
          }
        } catch (e) {
          erros.push(`IA: ${e instanceof Error ? e.message : "erro desconhecido"}`);
        }
      }

      const allPerguntas = [...bancoPerguntas, ...aiPerguntas];

      // Estado (28/09/2026):
      //   'por rever' → há perguntas; a Marta ainda não as reviu. Pode ter
      //                 falhado uma das fontes — isso fica em `erro`.
      //   'falhou'    → não há perguntas nenhumas. Nunca uma lista vazia como
      //                 se a geração tivesse corrido bem.
      // 'gravado' continua a ser o estado que a página /guioes escreve quando
      // a Marta revê e grava.
      if (existing) {
        const n = Array.isArray(existing.perguntas) ? existing.perguntas.length : 0;
        erros.push(
          `substitui a tentativa de ${String(existing.created_at).slice(0, 16)} ` +
            `(estado '${existing.estado}', ${n} perguntas` +
            (existing.erro ? `, erro: ${existing.erro}` : "") + ")"
        );
      }

      const linha = {
        semana: semanaStr,
        tema: tema.value,
        perguntas: allPerguntas,
        estado: allPerguntas.length > 0 ? "por rever" : "falhou",
        gerado_por_ia: aiPerguntas.length > 0,
        fontes_resposta: fontesResposta,
        erro: erros.length > 0 ? erros.join(" · ") : null,
      };

      const { error: insertErr } = existing
        ? await supabase.from("guioes_semanais").update(linha).eq("id", existing.id)
        : await supabase.from("guioes_semanais").insert(linha);

      if (insertErr) {
        results.push(`${tema.value}: ERROR — ${insertErr.message}`);
      } else {
        results.push(
          `${tema.value}: ${bancoPerguntas.length} banco + ${aiPerguntas.length} IA` +
            (erros.length > 0 ? ` — ${erros.join(" · ")}` : "")
        );
      }
    }

    return new Response(
      JSON.stringify({
        semana: semanaStr,
        results,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-guioes-weekly error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
