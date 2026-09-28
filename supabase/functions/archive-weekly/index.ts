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

/**
 * O tecto do script 6 (`min(growth, 9999)`) e o `breakout` do Google, que o
 * script 6 converte em 5000. Nenhum dos dois é medida: o primeiro lê-se "pelo
 * menos isto", o segundo não tem limiar publicado. Vão para o arquivo como
 * "fora de escala", sem número.
 *
 * Limitação: um crescimento medido de exactamente 5000% seria lido como
 * breakout. Nas recolhas de 14/09 a 28/09 não há nenhum 5000.
 */
const TECTO = 9999;
const BREAKOUT = 5000;

function foraDeEscala(q: any) {
  return q.growth_percent === TECTO || q.growth_percent === BREAKOUT;
}

function medidaDaPergunta(q: any) {
  const fora = foraDeEscala(q);
  return {
    growth_percent: fora ? null : q.growth_percent,
    fora_de_escala: fora,
    posicao: q.posicao ?? null,
  };
}

/**
 * Ordem das perguntas (decisão de 28/09/2026):
 *   1. as "fora de escala" primeiro — subiram pelo menos tanto como qualquer
 *      medida —, sem as ordenar pelo número, que não é medida;
 *   2. depois as medidas, pela subida;
 *   3. desempate pela posição em que o Google as devolveu (`posicao`).
 *
 * A `posicao` é a ordem DENTRO da lista de cada termo. Duas perguntas de
 * termos diferentes podem estar ambas na posição 1, e aí o Google não dá
 * ordem nenhuma entre elas: o último desempate é a ordem da recolha
 * (`updated_at`), que segue a ordem da lista de keywords. Não é critério — é
 * só para não voltar a ser o alfabeto.
 */
function ordenarPerguntas(qs: any[]) {
  const pos = (q: any) => q.posicao ?? Number.MAX_SAFE_INTEGER;
  return [...qs].sort((a, b) => {
    const fa = foraDeEscala(a), fb = foraDeEscala(b);
    if (fa !== fb) return fa ? -1 : 1;
    if (!fa && a.growth_percent !== b.growth_percent) {
      return (b.growth_percent ?? 0) - (a.growth_percent ?? 0);
    }
    if (pos(a) !== pos(b)) return pos(a) - pos(b);
    return String(a.updated_at).localeCompare(String(b.updated_at));
  });
}

/**
 * "Depressão" no sentido meteorológico. O termo `depressão sintomas` tem
 * "depressão" como sinónimo, e com a fronteira de palavra da fetch-rss-feeds
 * v2 continua a casar com a depressão do boletim do tempo — é homónimo, não
 * pedaço de palavra. Caso de 24/09/2026: "Chuva regressa domingo e pode ser
 * intensa terça e quarta" (Observador, categoria "Céu e Terra").
 *
 * Só se aplica às notícias que casaram por "depressão". O texto da descrição
 * não é guardado na base, logo decide-se pelo título e pelas categorias do
 * feed.
 */
const CATEGORIA_METEO = /c[ée]u e terra|meteorolog|\btempo\b/i;
const TITULO_METEO =
  /\b(chuvas?|trovoadas?|ipma|tempestades?|precipitação|ventos?|agitação marítima)\b|aviso (amarelo|laranja|vermelho)|meteorol/i;

function eDepressaoMeteorologica(n: any) {
  const casou = String(n.casou_por ?? n.related_term ?? "").toLowerCase();
  if (!casou.includes("depress")) return false;
  const cats = (n.categorias || []).join(" · ");
  return CATEGORIA_METEO.test(cats) || TITULO_METEO.test(n.title || "");
}

/**
 * Notícia de fact-check: categoria "Fact Check" no feed, ou vinda de um feed
 * de fact-check (source_type 'factcheck', ex. observador.pt/factchecks).
 */
function eFactCheck(n: any) {
  return (
    n.source_type === "factcheck" ||
    (n.categorias || []).some((c: string) => /fact[- ]?check/i.test(c))
  );
}

function desmentidoDaNoticia(n: any) {
  return {
    term: n.related_term,
    title: n.title,
    // O feed não traz o veredicto. Fica nulo em vez de inventar um.
    classification: null,
    source: n.outlet,
    url: n.url,
    date: n.date,
  };
}

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

    const [kwRes, questionsRes, newsRes, youtubeRes] =
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
      ]);

    // A tabela `debunking` deixou de ser lida a 28/09/2026. Os 36 desmentidos
    // são da Marta, de fact-checks de jornalismo, mas estão sem link
    // (`fonte_estado = 'sem fonte verificada'`), e até aqui entravam sempre os
    // mesmos cinco — a consulta não tinha ordem e ficava a ordem física da
    // tabela. Voltam quando tiverem link. Os desmentidos da semana vêm agora
    // das notícias de fact-check (factChecks, abaixo).

    const keywords = kwRes.data || [];
    const questions = ordenarPerguntas(questionsRes.data || []);
    const newsDaSemana = newsRes.data || [];
    const news = newsDaSemana.filter((n: any) => !eDepressaoMeteorologica(n));
    const factChecks = news.filter(eFactCheck);
    const youtube = youtubeRes.data || [];

    results.push(
      `perguntas: ${questions.length} da recolha de ${segundaQueFecha} · ` +
        `notícias: ${news.length} da semana (${newsDaSemana.length - news.length} ` +
        `"depressão" meteorológica fora) · fact-checks: ${factChecks.length}`,
    );

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
          ...medidaDaPergunta(q),
        }));

      // Até 28/09/2026 vinha da tabela `debunking` casada por `term` — que lá
      // é o título, logo nunca casava com os termos do eixo e ficava sempre
      // vazio. Passa a ser o mesmo que o briefing: fact-checks da semana.
      const topDebunking = factChecks
        .filter((n: any) =>
          axisTerms.has((n.related_term || "").toLowerCase())
        )
        .slice(0, 3)
        .map(desmentidoDaNoticia);

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
      // Sinais emergentes: VAZIO, com a razão, por decisão de 28/09/2026.
      //
      // Correcção a uma nota de 24/09/2026 que estava aqui e dizia que este
      // bloco "produz uma lista vazia e sempre produziu". Não é verdade: os
      // briefings de Março têm 5 sinais e o de 27/07 tem 3. Quem escrevia
      // `keywords.is_emergent` era o antigo script 5 (subida >= 50% e volume
      // >= 10). A 10/08 os 429 do Google escreveram zeros e os sinais
      // expiraram todos; a 14/08 o passo foi comentado e ninguém voltou a
      // escrever a coluna. Desde o briefing de 03/08 fica vazio.
      //
      // O substituto são os alertas (`trends_alertas`, regra de 18/09/2026).
      // Entram quando passarem o teste que falta; até lá, a lista fica vazia
      // e a nota diz porquê.
      const notas: Record<string, string> = {
        emergentes:
          "vazio até os alertas (trends_alertas) passarem o teste que falta; " +
          "keywords.is_emergent não é escrita desde 14/08/2026",
      };

      const topQuestions = questions.slice(0, 5).map((q: any) => ({
        term: q.question,
        // NÃO se grava `relative_volume` aqui. Nunca foi um volume — era a
        // posição na lista — e ficava no arquivo permanente debaixo de um
        // nome que dizia o contrário. O que se mede é a subida.
        ...medidaDaPergunta(q),
      }));
      if (topQuestions.length === 0) {
        notas.perguntas =
          `sem perguntas do Google Trends na recolha de ${segundaQueFecha}`;
      }

      const topDebunking = factChecks.slice(0, 5).map(desmentidoDaNoticia);
      if (topDebunking.length === 0) {
        notas.desmentidos =
          `nenhuma notícia de fact-check com data entre ${prev.isoStart} e ` +
          `${prev.isoEnd}; os desmentidos da tabela debunking não entram até ` +
          `terem link verificado`;
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
          top_emerging: [],
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
