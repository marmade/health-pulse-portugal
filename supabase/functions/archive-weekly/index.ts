import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const axisLabels: Record<string, string> = {
  "saude-mental": "Saude Mental",
  alimentacao: "Alimentacao",
  menopausa: "Menopausa",
  emergentes: "Emergentes",
};

function getPreviousWeek() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) - 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" });
  return {
    isoStart: monday.toISOString().split("T")[0],
    isoEnd: sunday.toISOString().split("T")[0],
    label: `${fmt(monday)} — ${fmt(sunday)} ${monday.getFullYear()}`,
    shortLabel: `${fmt(monday)} — ${fmt(sunday)}`,
  };
}

/**
 * Desloca uma data ISO (YYYY-MM-DD) n dias, em UTC.
 */
function deslocaDias(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().split("T")[0];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const prev = getPreviousWeek();
    const results: string[] = [];

    // ── 1. Fetch all data needed for archives ────────────────────────────

    const [kwRes, questionsRes, debunkingRes, newsRes, youtubeRes] =
      await Promise.all([
        supabase
          .from("keywords")
          .select("*")
          .eq("is_active", true),
        supabase
          .from("health_questions")
          .select("*")
          // Três condições que não são zelo a mais — ver o que estava gravado
          // nos arquivos de 24/08, 31/08 e 07/09: "stress strain curve",
          // "ministro avc", "ptad", "todo mundo em pânico 7 data de
          // lançamento", cada um com um `current_volume` que era a posição na
          // lista. O arquivo é permanente: o que aqui entra fica.
          //
          //  source=pytrends   → só esta fonte mede crescimento
          //  is_question=true  → a coluna existia e nunca era usada; é ela que
          //                      separa a pergunta do ruído
          //  nullsFirst: false → desde 16/09/2026 o script 7 grava NULL em
          //                      growth_percent, e num ORDER BY DESC os NULL
          //                      vêm primeiro
          .eq("source", "pytrends")
          .eq("is_question", true)
          .order("growth_percent", { ascending: false, nullsFirst: false })
          .order("question", { ascending: true }),
        supabase
          .from("debunking")
          .select("*"),
        supabase
          .from("news_items")
          .select("*")
          .order("date", { ascending: false }),
        supabase
          .from("youtube_trends")
          .select("*")
          .order("views", { ascending: false }),
      ]);

    const keywords = kwRes.data || [];
    const questions = questionsRes.data || [];
    const debunking = debunkingRes.data || [];
    const news = newsRes.data || [];
    const youtube = youtubeRes.data || [];

    // ── 1b. A medição da semana ──────────────────────────────────────────
    //
    // Regra decidida a 24/09/2026 pela Marta, em
    // docs/metodo/2026-09-24-top5-do-arquivo-regra.md:
    //   · o top 5 de uma semana são os cinco termos com maior valor MEDIDO
    //     nessa semana, no eixo — não a maior subida;
    //   · a semana sem medição fica VAZIA, com a razão registada.
    //
    // Até 24/09/2026 o top 5 saía da tabela `keywords`, ordenado por
    // `change_percent`. Essa tabela não é escrita desde 20/03/2026, e o
    // resultado foram sete semanas de arquivo com os mesmos cinco termos e os
    // mesmos números até à casa decimal (03/08 a 20/09) — sem a `ansiedade`,
    // que é o maior termo do seu eixo. Ver docs/sessoes/2026-09-24.md § 3b.
    //
    // As semanas do Google Trends são de DOMINGO a sábado; o arquivo fecha
    // semanas de SEGUNDA a domingo. Desencontram-se por um dia. A semana do
    // Trends que corresponde é a que começa no domingo anterior à segunda do
    // arquivo: partilha seis dias com ela (segunda a sábado); a seguinte
    // partilharia um.
    const semanaTrends = deslocaDias(prev.isoStart, -1);
    const semanaTrendsFim = deslocaDias(semanaTrends, 1);

    let loteId: string | null = null;
    let notaMedicao: string | null = null;
    const medicaoPorEixo: Record<string, { termo: string; valor: number }[]> = {};

    {
      // O último lote completo de 5 anos — o mesmo critério do dashboard
      // (src/hooks/useTrendsLote.ts), para que o arquivo e o ecrã não divirjam.
      const { data: ped } = await supabase
        .from("trends_pedidos")
        .select("lote_id, fetched_at, trends_lotes!inner(estado)")
        .eq("timeframe", "today 5-y")
        .eq("trends_lotes.estado", "completo")
        .order("fetched_at", { ascending: false })
        .limit(1);
      const p = (ped as any[] | null)?.[0];

      if (!p) {
        notaMedicao = "sem lote completo de 5 anos na base de dados";
      } else {
        loteId = p.lote_id;
        const { data: pedidos } = await supabase
          .from("trends_pedidos")
          .select("id")
          .eq("lote_id", loteId)
          .eq("timeframe", "today 5-y");
        const ids = ((pedidos as any[] | null) || []).map((r) => r.id);

        // A semana parcial não conta: o lote é recolhido a meio da semana e o
        // último ponto vem cortado. Escrevê-lo seria comparar seis dias com
        // sete.
        const { data: ponto } = await supabase
          .from("trends_pontos")
          .select("is_partial")
          .in("pedido_id", ids)
          .gte("data", semanaTrends)
          .lt("data", semanaTrendsFim)
          .limit(1);
        const ok = (ponto as any[] | null)?.[0];

        if (!ok) {
          notaMedicao =
            `sem medição para a semana de ${semanaTrends} — o lote mais recente (recolhido a ${p.fetched_at}) não a cobre`;
        } else if (ok.is_partial) {
          notaMedicao =
            `a semana de ${semanaTrends} está incompleta no lote mais recente (recolhido a ${p.fetched_at}, a meio da semana)`;
        } else {
          const { data: cal } = await supabase
            .from("trends_calibrados")
            .select("eixo, termo, valor_eixo")
            .eq("lote_id", loteId)
            .gte("data", semanaTrends)
            .lt("data", semanaTrendsFim);
          for (const r of ((cal as any[] | null) || [])) {
            (medicaoPorEixo[r.eixo] ||= []).push({
              termo: r.termo,
              valor: Number(r.valor_eixo),
            });
          }
        }
      }
    }

    results.push(
      `medição: semana ${semanaTrends} — ` +
        (notaMedicao ? notaMedicao : `lote ${loteId}`),
    );

    // ── 2. Archive per-axis data (eixos_archive) ─────────────────────────

    const axes = ["saude-mental", "alimentacao", "menopausa", "emergentes"];

    for (const axis of axes) {
      // Check if already archived
      const { data: existing } = await supabase
        .from("eixos_archive")
        .select("id")
        .eq("axis", axis)
        .eq("week_start", prev.isoStart)
        .maybeSingle();

      if (existing) {
        results.push(`eixos/${axis}: already archived`);
        continue;
      }

      // A leitura da `keywords` que FICA: os nomes dos termos activos do eixo.
      // São eles que escolhem as notícias e as verificações que lhe pertencem
      // (topNews e topDebunking, abaixo). O que saiu daqui foram os números.
      const axisKeywords = keywords.filter((k: any) => k.axis === axis);

      const axisTerms = new Set(
        axisKeywords.map((k: any) => (k.term as string).toLowerCase())
      );

      const topKeywords = (medicaoPorEixo[axis] || [])
        .filter((m) => axisTerms.has(m.termo.toLowerCase()) && m.valor > 0)
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 5)
        .map((m, i) => ({
          term: m.termo,
          valor: Math.round(m.valor * 10) / 10,
          posicao: i + 1,
          semana_trends: semanaTrends,
          lote_id: loteId,
        }));

      // Semana sem medição: fica vazia, com a razão. Nunca se repete a semana
      // anterior, nunca se escreve zero.
      const notaEixo = notaMedicao ??
        (topKeywords.length === 0
          ? `sem termos activos com medição na semana de ${semanaTrends} (lote ${loteId})`
          : null);

      const topQuestions = questions
        .filter((q: any) => q.axis === axis)
        .slice(0, 5)
        .map((q: any) => ({
          question: q.question,
          growth_percent: q.growth_percent,
        }));

      const topDebunking = debunking
        .filter((d: any) => axisTerms.has((d.term || "").toLowerCase()))
        .slice(0, 3)
        .map((d: any) => ({
          term: d.term,
          title: d.title,
          classification: d.classification,
        }));

      const topNews = news
        .filter((n: any) =>
          axisTerms.has((n.related_term || "").toLowerCase())
        )
        .slice(0, 3)
        .map((n: any) => ({
          title: n.title,
          outlet: n.outlet,
          date: n.date,
          source_type: n.source_type,
        }));

      const topYoutube = youtube
        .filter((v: any) => v.eixo === axis)
        .slice(0, 5)
        .map((v: any) => ({
          titulo: v.titulo,
          canal: v.canal,
          views: v.views,
          url: v.url,
        }));

      const { error: insertErr } = await supabase
        .from("eixos_archive")
        .insert({
          axis,
          axis_label: axisLabels[axis] || axis,
          week_start: prev.isoStart,
          week_end: prev.isoEnd,
          week_label: prev.label,
          top_keywords: topKeywords,
          nota_medicao: notaEixo,
          top_questions: topQuestions,
          top_debunking: topDebunking,
          top_news: topNews,
          top_youtube: topYoutube,
        });

      if (insertErr) {
        console.error(`eixos/${axis} insert error:`, insertErr);
        results.push(`eixos/${axis}: ERROR — ${insertErr.message}`);
      } else {
        results.push(`eixos/${axis}: archived`);
      }
    }

    // ── 3. Archive briefing data (briefings_archive) ─────────────────────

    const { data: briefingExists } = await supabase
      .from("briefings_archive")
      .select("id")
      .eq("week_start", prev.isoStart)
      .maybeSingle();

    if (briefingExists) {
      results.push("briefing: already archived");
    } else {
      // NOTA (24/09/2026): este bloco produz uma lista vazia e sempre produziu.
      // Nenhuma das 82 keywords activas tem `is_emergent` a true — verificado na
      // base de dados nesta data —, logo `top_emerging` está vazio nos 11
      // briefings arquivados. Não se mexeu aqui de propósito: o substituto
      // natural são os alertas (`trends_alertas`, regra de 18/09/2026), e essa
      // é uma decisão por tomar, não uma tradução da regra do top 5.
      const emergent = keywords
        .filter((k: any) => k.is_emergent)
        .sort((a: any, b: any) => b.change_percent - a.change_percent);

      const { error: briefingErr } = await supabase
        .from("briefings_archive")
        .insert({
          week_start: prev.isoStart,
          week_end: prev.isoEnd,
          week_label: prev.shortLabel,
          top_emerging: emergent.slice(0, 5).map((k: any) => ({
            term: k.term,
            axis: k.axis,
            change_percent: k.change_percent,
          })),
          top_questions: questions.slice(0, 5).map((q: any) => ({
            term: q.question,
            // NÃO se grava `relative_volume` aqui. Nunca foi um volume — era a
            // posição na lista — e ficava no arquivo permanente debaixo de um
            // nome que dizia o contrário. O que se mede é a subida.
            growth_percent: q.growth_percent,
          })),
          top_debunking: debunking.slice(0, 5).map((d: any) => ({
            term: d.term,
            title: d.title,
            classification: d.classification,
            source: d.source,
          })),
          top_news: news.slice(0, 5).map((n: any) => ({
            title: n.title,
            outlet: n.outlet,
            date: n.date,
            source_type: n.source_type,
          })),
        });

      if (briefingErr) {
        console.error("briefing insert error:", briefingErr);
        results.push(`briefing: ERROR — ${briefingErr.message}`);
      } else {
        results.push("briefing: archived");
      }
    }

    // ── Done ─────────────────────────────────────────────────────────────

    return new Response(
      JSON.stringify({
        week: prev.label,
        results,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in archive-weekly:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
