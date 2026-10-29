import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { notaSemMedicao, semMedicao, topDoEixo, type Medicao, type Pedido } from "../_shared/top_eixo.ts";
import { eDepressaoMeteorologica } from "../_shared/meteo.ts";
import {
  FATOR_MIN, notasDasPartes, previsiveisDoMes, sinaisDaSemana, type LinhaAlerta,
} from "../_shared/emergentes.ts";
import {
  notaSemVerificacoes, topDebunkingDoBriefing, topDebunkingDoEixo, type LinhaDebunking,
} from "../_shared/factchecks.ts";
import { ordenarPerguntas, perguntasDoEixo, perguntasPorEixo } from "../_shared/perguntas.ts";

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

// As perguntas (o tecto e o breakout, que não são medida; a ordem de 28/09; e, desde 29/10/2026,
// 5 por eixo, sem as perguntas pela palavra e com as quase iguais juntas) estão em
// _shared/perguntas.ts: o site lê a mesma regra. Ver docs/sessoes/2026-10-29.md.

// A "depressão" meteorológica (eDepressaoMeteorologica) está em
// _shared/meteo.ts desde 23/10/2026: o site lê a mesma regra, para que o
// arquivo e o ecrã não divirjam. Ver docs/sessoes/2026-10-23.md.

// Os fact-checks (briefing e arquivo dos eixos) vêm da tabela `debunking` desde
// 29/10/2026, pela regra de _shared/factchecks.ts. De 28/09 a 26/10 vinham das
// notícias de fact-check (categoria "Fact Check" ou source_type 'factcheck'), e
// desde Agosto só tinha entrado uma.

/**
 * O papel do JWT do pedido (28/09/2026). Esta função só aceita a service_role:
 * a chave anon é pública (está no workflow e no bundle do site) e bastava para
 * escrever no arquivo. A ASSINATURA do token é verificada antes, pelo
 * `verify_jwt: true` da publicação — sem ele, este papel podia ser forjado.
 * Publicar sempre com verify_jwt: true.
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

    const prev = getPreviousWeek();
    const results: string[] = [];

    // A segunda que fecha a semana — o dia desta corrida, quando o GitHub a
    // corre na segunda. A recolha de perguntas do passo 2 é feita nesta mesma
    // corrida, antes deste passo.
    const segundaQueFecha = deslocaDias(prev.isoEnd, 1);

    // ── 1. Fetch all data needed for archives ────────────────────────────

    const [kwRes, questionsRes, newsRes, youtubeRes, debunkRes] =
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
          //  updated_at        → só a recolha da semana (28/09/2026). Até aqui
          //                      a consulta lia as 207 perguntas acumuladas
          //                      desde Março, e o briefing de 21/09 saiu com
          //                      cinco perguntas escritas entre 23/03 e 25/05.
          //                      O script 6 reescreve updated_at a cada
          //                      pergunta que volta a aparecer, logo isto é
          //                      "o que o Google devolveu nesta recolha".
          //
          // A ordem faz-se abaixo, em ordenarPerguntas().
          .eq("source", "pytrends")
          .eq("is_question", true)
          .gte("updated_at", segundaQueFecha),
        supabase
          .from("news_items")
          .select("*")
          // Só as da semana, de segunda a domingo (28/09/2026). Até aqui eram
          // as mais recentes da tabela, e o passo 4 corre antes deste na mesma
          // corrida: o briefing de 21/09 saiu com 4 notícias de 28/09.
          .gte("date", prev.isoStart)
          .lte("date", prev.isoEnd)
          .order("date", { ascending: false }),
        supabase
          .from("youtube_trends")
          .select("*")
          .order("views", { ascending: false }),
        // Só as datadas: as 36 semeadas a 25/03 não têm data nem veredicto. O
        // filtro do veredicto e do url faz-se em _shared/factchecks.ts. A API
        // corta em 1000 linhas sem erro: a contagem confirma, abaixo.
        supabase
          .from("debunking")
          .select("term, title, explicacao, classification, source, url, data_publicacao, eixo, covid", { count: "exact" })
          .not("data_publicacao", "is", null),
      ]);

    const keywords = kwRes.data || [];
    const questions = ordenarPerguntas(questionsRes.data || []);
    const newsDaSemana = newsRes.data || [];
    const news = newsDaSemana.filter((n: any) => !eDepressaoMeteorologica(n));
    const youtube = youtubeRes.data || [];

    // Uma leitura falhada ou cortada não pode passar por "semana sem
    // verificações": a secção fica vazia com o erro na nota.
    const factChecks = (debunkRes.data as LinhaDebunking[] | null) || [];
    const erroFactChecks = debunkRes.error
      ? `erro ao ler a tabela debunking: ${debunkRes.error.message}`
      : (debunkRes.count ?? 0) !== factChecks.length
      ? `leitura incompleta da tabela debunking: ${factChecks.length} de ${debunkRes.count}`
      : null;
    if (erroFactChecks) factChecks.length = 0;

    results.push(
      `perguntas: ${questions.length} da recolha de ${segundaQueFecha} · ` +
        `notícias: ${news.length} da semana (${newsDaSemana.length - news.length} ` +
        `"depressão" meteorológica fora) · fact-checks datados: ` +
        (erroFactChecks ?? `${factChecks.length}`),
    );

    // ── 1b. A medição da semana ──────────────────────────────────────────
    //
    // Regra decidida a 24/09/2026 pela Marta, em
    // docs/metodo/2026-09-24-top5-do-arquivo-regra.md:
    //   · o top 5 de uma semana são os cinco termos com maior valor MEDIDO
    //     nessa semana, no eixo — não a maior subida;
    //   · a semana sem medição fica VAZIA, com a razão registada.
    // A 13/10/2026 passou a top 10, com empates a partilhar a posição, e a
    // página inicial a mostrar os primeiros deste mesmo top (posicao <= 5) —
    // ver _shared/top_eixo.ts e docs/sessoes/2026-10-13.md.
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
    const medicaoPorEixo: Record<string, Medicao[]> = {};
    // Os pedidos do lote, para dizer porque é que um termo activo não tem
    // medição (sem_dados, falhou, não pedido). Só se usam com medição.
    let pedidosDoLote: Pedido[] = [];

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
          .select("id, termos, collection_status")
          .eq("lote_id", loteId)
          .eq("timeframe", "today 5-y");
        pedidosDoLote = (pedidos as any[] | null) || [];
        const ids = pedidosDoLote.map((r: any) => r.id);

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
            // valor_eixo tal como vem (texto com 3 casas, ou nulo): a
            // topDoEixo compara em milésimas inteiras.
            (medicaoPorEixo[r.eixo] ||= []).push({
              termo: r.termo,
              valor: r.valor_eixo,
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
      // São eles que escolhem as notícias que lhe pertencem (topNews, abaixo);
      // as verificações vão pela coluna `eixo` da `debunking` (29/10/2026). O
      // que saiu daqui foram os números.
      const axisKeywords = keywords.filter((k: any) => k.axis === axis);

      const axisTerms = new Set(
        axisKeywords.map((k: any) => (k.term as string).toLowerCase())
      );

      // Top 10, empates na mesma posição, todos os empatados no corte. A
      // ordenação é só esta: a página inicial lê daqui e não volta a ordenar.
      const termosActivos = axisKeywords.map((k: any) => k.term as string);
      const medicao = medicaoPorEixo[axis] || [];
      const topKeywords = topDoEixo(medicao, termosActivos, 10).map((t) => ({
        ...t,
        semana_trends: semanaTrends,
        lote_id: loteId,
      }));

      // Semana sem medição: fica vazia, com a razão. Nunca se repete a semana
      // anterior, nunca se escreve zero.
      //
      // Com medição, a nota diz que termos activos ficaram sem número, e
      // porquê (13/10/2026). Sem isto um pedido sem_dados tirava o termo do
      // top em silêncio. Fica na nota, e não numa coluna nova: nunca houve um
      // caso real, e a nota já existe para dizer o que falta à medição.
      const faltam = notaMedicao
        ? null
        : notaSemMedicao(semMedicao(medicao, termosActivos, pedidosDoLote), semanaTrends);
      const notaEixo = notaMedicao ??
        ([
          topKeywords.length === 0
            ? `sem termos activos com medição na semana de ${semanaTrends} (lote ${loteId})`
            : null,
          faltam,
        ].filter(Boolean).join("; ") || null);

      // A mesma regra do briefing (29/10/2026): 5 lugares, empatadas no corte todas, sem as
      // perguntas pela palavra, as quase iguais juntas (`variantes`). Ver _shared/perguntas.ts.
      const topQuestions = perguntasDoEixo(questions, axis).map((q) => ({
        question: q.question,
        growth_percent: q.growth_percent,
        fora_de_escala: q.fora_de_escala,
        posicao: q.posicao,
        lugar: q.lugar,
        variantes: q.variantes,
      }));

      // As verificações da semana do eixo, da tabela `debunking` (29/10/2026);
      // as da covid-19 não entram em eixo nenhum. Ver _shared/factchecks.ts.
      const topDebunking = topDebunkingDoEixo(factChecks, axis, prev.isoStart, prev.isoEnd);

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
        const empatados = topKeywords.length - new Set(topKeywords.map((t) => t.posicao)).size;
        results.push(
          `eixos/${axis}: archived — top ${topKeywords.length}` +
            (empatados ? `, ${empatados} empate(s)` : "") +
            (faltam ? ` · ${faltam}` : ""),
        );
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
      // Sinais emergentes: dos alertas (`trends_alertas`), em quatro partes —
      // novos, em curso, a observar e previsíveis do mês. Decisão da Marta,
      // 28/10/2026 (docs/sessoes/2026-10-28.md §6, §12); a regra está em
      // _shared/emergentes.ts. Do briefing de 03/08 ao de 19–25/10 a secção
      // ficou vazia: `keywords.is_emergent` não é escrita desde 14/08/2026, e
      // os alertas só foram provados a 18/10.
      //
      // O lote e a semana são os do top 10 (1b, acima). Sem medição, sem
      // alertas no lote ou com erro de leitura, a secção fica vazia com a
      // razão em `notas.emergentes`; as partes vazias dizem-no cada uma na sua
      // nota. A secção nunca sai em branco.
      const notas: Record<string, string> = {};
      let topEmerging: Record<string, unknown>[] = [];
      if (notaMedicao || !loteId) {
        notas.emergentes = notaMedicao ?? "sem lote completo de 5 anos na base de dados";
      } else {
        try {
          const { data: algum, error: e0 } = await supabase
            .from("trends_alertas")
            .select("semana")
            .eq("lote_id", loteId)
            .limit(1);
          if (e0) throw e0;
          if (!(algum as any[] | null)?.length) {
            notas.emergentes = `lote ${loteId.slice(0, 8)} sem alertas calculados`;
          } else {
            // O mês vigente é o da segunda-feira em que o briefing é gerado.
            const segunda = new Date(`${deslocaDias(prev.isoEnd, 1)}T00:00:00Z`);
            const mes = segunda.getUTCMonth() + 1;
            const ano = segunda.getUTCFullYear();

            const { data: daSemana, error: e1 } = await supabase
              .from("trends_alertas")
              .select("eixo, termo, tipo, semana, valor, referencia, razao, z, fator_sazonal, max_anterior, semana_n, inicio")
              .eq("lote_id", loteId)
              .eq("semana", semanaTrends);
            if (e1) throw e1;

            // Os candidatos a previsíveis, de todos os meses dos anos
            // anteriores; o mês filtra-se em previsiveisDoMes. A API corta em
            // 1000 linhas sem erro: se a contagem não bater, pára.
            const { data: sazonais, error: e2, count } = await supabase
              .from("trends_alertas")
              .select("eixo, termo, tipo, semana, valor, referencia, razao, z, fator_sazonal, semana_n, inicio", { count: "exact" })
              .eq("lote_id", loteId)
              .gte("fator_sazonal", FATOR_MIN)
              .lt("semana", `${ano}-01-01`);
            if (e2) throw e2;
            if ((count ?? 0) !== ((sazonais as any[] | null)?.length ?? 0)) {
              throw new Error(`leitura incompleta dos previsíveis: ${sazonais?.length} de ${count}`);
            }

            const { data: ini, error: e3 } = await supabase
              .from("trends_calibrados")
              .select("data")
              .eq("lote_id", loteId)
              .order("data", { ascending: true })
              .limit(1);
            if (e3) throw e3;
            const inicioSerie = (ini as any[] | null)?.[0]?.data?.slice(0, 10);
            if (!inicioSerie) throw new Error(`lote ${loteId.slice(0, 8)} sem série calibrada`);

            const sinais = sinaisDaSemana((daSemana as LinhaAlerta[] | null) || [], semanaTrends);
            const previsiveis = previsiveisDoMes((sazonais as LinhaAlerta[] | null) || [], mes, ano, inicioSerie);
            Object.assign(notas, notasDasPartes(sinais, previsiveis, semanaTrends, mes));
            topEmerging = [...sinais, ...previsiveis.itens].map((s) => ({
              ...s,
              lote_id: loteId,
              semana_trends: semanaTrends,
            }));
          }
        } catch (e) {
          console.error("emergentes:", e);
          notas.emergentes = `erro ao ler os alertas do lote ${loteId.slice(0, 8)}: ${(e as Error).message}`;
          topEmerging = [];
        }
      }
      results.push(
        `emergentes: ` +
          (notas.emergentes ??
            ["novo", "em_curso", "tendencia", "a_observar", "previsivel"]
              .map((p) => `${topEmerging.filter((s) => s.parte === p).length} ${p}`)
              .join(" · ")),
      );

      // 5 por eixo, em vez do top 5 geral (decisão da Marta, 29/10/2026): cada item leva
      // `axis`, `lugar` (no eixo) e `variantes`. Os briefings de antes não têm `lugar`.
      // NÃO se grava `relative_volume` aqui. Nunca foi um volume — era a posição na lista — e
      // ficava no arquivo permanente debaixo de um nome que dizia o contrário. O que se mede é
      // a subida.
      const topQuestions = perguntasPorEixo(questions).map((q) => ({
        term: q.question,
        axis: q.axis,
        growth_percent: q.growth_percent,
        fora_de_escala: q.fora_de_escala,
        posicao: q.posicao,
        lugar: q.lugar,
        variantes: q.variantes,
      }));
      if (topQuestions.length === 0) {
        notas.perguntas =
          `sem perguntas do Google Trends na recolha de ${segundaQueFecha}`;
      }

      // Duas partes (decisão da Marta, 29/10/2026): "Desta semana" (parte
      // "semana") e as 5 "Anteriores" (parte "anterior"), cada item marcado.
      // "Desta semana" vazia diz-o em `notas.desmentidos`.
      const topDebunking = topDebunkingDoBriefing(factChecks, prev.isoStart, prev.isoEnd);
      if (erroFactChecks) {
        notas.desmentidos = erroFactChecks;
      } else if (!topDebunking.some((d) => d.parte === "semana")) {
        notas.desmentidos = notaSemVerificacoes(prev.isoStart, prev.isoEnd);
      }

      const topNews = news.slice(0, 5).map((n: any) => ({
        title: n.title,
        outlet: n.outlet,
        date: n.date,
        source_type: n.source_type,
      }));
      if (topNews.length === 0) {
        notas.noticias =
          `nenhuma notícia com data entre ${prev.isoStart} e ${prev.isoEnd}`;
      }

      const { error: briefingErr } = await supabase
        .from("briefings_archive")
        .insert({
          week_start: prev.isoStart,
          week_end: prev.isoEnd,
          week_label: prev.shortLabel,
          top_emerging: topEmerging,
          top_questions: topQuestions,
          top_debunking: topDebunking,
          top_news: topNews,
          notas,
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
