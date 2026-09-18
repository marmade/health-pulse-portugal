import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardFooter from "@/components/DashboardFooter";
import AxisColumn from "@/components/AxisColumn";
import DebunkingTable from "@/components/DebunkingTable";
import MediaTable from "@/components/MediaTable";
import SearchAlerts from "@/components/SearchAlerts";
import HealthQuestionsPanel from "@/components/HealthQuestionsPanel";
import YouTubeTrendsPanel from "@/components/YouTubeTrendsPanel";
import GoogleTrendsPanel from "@/components/GoogleTrendsPanel";
import Filters from "@/components/Filters";
import { detectAlerts } from "@/lib/detectAlerts";
import { useAxisData, useDebunkingData, useNewsData } from "@/hooks/useAxisData";
import { useLastRefreshed } from "@/hooks/useLastRefreshed";
import { useHistoricalData } from "@/hooks/useHistoricalData";
import { generateEixoPdf } from "@/lib/eixoPdfExport";
import { grupoDoEixo } from "@/lib/trendsGrupo";
import { useTrendsLote } from "@/hooks/useTrendsLote";
import AlertasEixo, { NOTA_ALERTAS, semanaCurta } from "@/components/AlertasEixo";
import { NOTA_TOP5 } from "@/components/AxisColumn";

const axisOrder = ["saude-mental", "alimentacao", "menopausa", "emergentes"];

// Bloco RETIRADO da página a 18/09/2026, com nota no ecrã e registo em
// docs/sessoes/2026-09-18.md. O código fica para não ser reinventado; volta com a
// condição escrita na nota.
const RANKING_RETIRADO = true;     // prioridade de comunicação: dados parados, réguas incomparáveis
const ALERTAS_ANTIGOS = false;   // ver a nota no fim da página
const SELECTOR_PERIODO = false;  // 7 | 30 dias | 12 meses: retirado a 18/09/2026, ver a nota junto ao <Filters>

const Index = () => {
  const [activeAxis, setActiveAxis] = useState("all");
  const [eixosArchives, setEixosArchives] = useState<Record<string, any[]>>({});
  const [filters, setFilters] = useState({ period: "12m" });

  const { data: filteredData, isLoading, error, isFromDb } = useAxisData(filters.period);
  const { data: dbDebunkingData } = useDebunkingData();
  const { data: dbNewsData, lastFetchTimestamp } = useNewsData();
  const lastRefreshed = useLastRefreshed();
  const { data: historicalData } = useHistoricalData(filters.period);

  // O lote do Google Trends (trends_calibrados): top 5 e gráfico de cada eixo. Os termos
  // activos por eixo servem para a âncora, quando não é keyword, ficar fora do top.
  const termosDoEixo = useMemo(() => {
    if (!filteredData) return null;
    const m: Record<string, string[]> = {};
    for (const a of axisOrder) m[a] = (filteredData[a]?.allKeywords || []).map((k: { term: string }) => k.term);
    return m;
  }, [filteredData]);
  const { porEixo: loteEixo, lote } = useTrendsLote(termosDoEixo);
  const semanaAlertas = axisOrder.map(a => loteEixo?.[a]?.alertas?.semana).find(Boolean) ?? null;

  // Use only real DB data — no mock fallback
  const debunkingData = dbDebunkingData;
  const newsData = dbNewsData;

  // Filtrar debunking e notícias pelo eixo activo
  const axisTerms = useMemo(() => {
    if (activeAxis === "all") return null;
    const kws = (filteredData[activeAxis]?.allKeywords || filteredData[activeAxis]?.keywords || []).map((k: any) => k.term.toLowerCase());
    return new Set(kws);
  }, [filteredData, activeAxis]);

  const filteredDebunkingData = useMemo(() => {
    if (!axisTerms) return debunkingData;
    return debunkingData.filter((d: any) => axisTerms.has((d.term || "").toLowerCase()));
  }, [debunkingData, axisTerms]);

  const filteredNewsData = useMemo(() => {
    let result = newsData;

    // Filter by period
    const now = new Date();
    if (filters.period === "7d") {
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 7);
      result = result.filter((n: any) => new Date(n.date) >= cutoff);
    } else if (filters.period === "30d") {
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 30);
      result = result.filter((n: any) => new Date(n.date) >= cutoff);
    }
    // 12m — show all

    // Filter by axis
    if (axisTerms) {
      result = result.filter((n: any) => axisTerms.has((n.relatedTerm || "").toLowerCase()));
    }

    return result;
  }, [newsData, axisTerms, filters.period]);

  // Registar função de download PDF de eixo no window (chamada pelo AxisColumn)
  useEffect(() => {
    (window as any)._downloadEixoPdf = (entry: any) => generateEixoPdf(entry);
    return () => { delete (window as any)._downloadEixoPdf; };
  }, []);

  // Load archives for the active axis (created by the weekly workflow)
  useEffect(() => {
    if (activeAxis !== "all") {
      (supabase.from as any)("eixos_archive")
        .select("*")
        .eq("axis", activeAxis)
        .order("week_start", { ascending: false })
        .then(({ data }: any) => {
          if (data) setEixosArchives((prev: any) => ({ ...prev, [activeAxis]: data }));
        });
    }
  }, [activeAxis]);

  const alerts = useMemo(
    () => filteredData ? detectAlerts(filteredData, filters.period) : [],
    [filteredData, filters.period]
  );

  // `axisAlerts` (os alertas antigos filtrados por eixo) saiu a 18/09/2026 com o bloco que os
  // mostrava na vista de eixo; `alerts` fica só para o ranking retirado e o bloco antigo, ambos
  // desligados.

  const visibleAxes =
    activeAxis === "all"
      ? axisOrder
      : axisOrder.filter((a) => a === activeAxis);

  // Urgency ranking: score each axis by combined signals
  const urgencyRanking = useMemo(() => {
    if (!filteredData) return [];
    return axisOrder
      .map((axisId) => {
        const axis = filteredData[axisId];
        if (!axis) return null;
        const allKw = axis.allKeywords;
        const avgChange = allKw.length > 0
          ? allKw.reduce((s, k) => s + k.changePercent, 0) / allKw.length
          : 0;
        const emergentCount = allKw.filter((k) => k.isEmergent).length;
        const alertCount = alerts.filter((a) => a.axisLabel === axis.label).length;
        // Score: weighted sum — alerts and emergent signals matter most
        const score = avgChange + (emergentCount * 30) + (alertCount * 20);
        return { axisId, label: axis.label, avgChange, emergentCount, alertCount, score };
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score) as {
        axisId: string; label: string; avgChange: number;
        emergentCount: number; alertCount: number; score: number;
      }[];
  }, [filteredData, alerts]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <DashboardHeader activeAxis={activeAxis} onAxisChange={setActiveAxis} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-foreground border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-xs uppercase tracking-wider opacity-60">A carregar dados...</p>
          </div>
        </div>
        <DashboardFooter />
      </div>
    );
  }

  // If no data at all
  if (!filteredData) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <DashboardHeader activeAxis={activeAxis} onAxisChange={setActiveAxis} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs uppercase tracking-wider opacity-60">Sem dados disponíveis</p>
        </div>
        <DashboardFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <DashboardHeader activeAxis={activeAxis} onAxisChange={setActiveAxis} lastRefreshed={lastRefreshed} />

      {/* Data source indicator */}
      {error && (
        <div className="px-6 py-2 bg-muted text-muted-foreground text-xs">
          Erro ao carregar dados: {error}
        </div>
      )}

      {/* Selector de período (7 | 30 dias | 12 meses) — RETIRADO a 18/09/2026 (decisão da
          Marta, registada aqui, no ecrã e em docs/sessoes/2026-09-18.md). Tudo o que está
          acima da dobra vem do lote e tem a sua janela própria, escrita ao lado: gráfico =
          anos, top 5 = 52 semanas, alertas = esta semana contra as 8 anteriores; um selector
          global prometia mudar os três e não mudava nenhum. Só filtrava a lista de notícias
          por data. A Marta: "se nos vier a fazer falta, será dentro de cada eixo" — para a
          fase 4 (séries diárias para um caso). `filters.period` fica a "12m" fixo até o
          código antigo que o lê (useAxisData, useHistoricalData, o filtro das notícias)
          ser apagado ou refeito. */}
      {SELECTOR_PERIODO && (
        <div className="px-6 py-2 overflow-x-auto">
          <Filters filters={filters} onFilterChange={setFilters} />
        </div>
      )}

      {/* Main grid */}
      <main className="flex-1 px-6 py-6">
        {activeAxis !== "all" ? (
          <div className="flex flex-col gap-8">
            {/* Linha 1: gráfico esquerda, keywords direita */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {visibleAxes.map((axisId) => {
                const axis = filteredData[axisId];
                return (
                  <AxisColumn
                    key={`${axisId}-${filters.period}-chart`}
                    axisId={axisId}
                    label={axis.label}
                    keywords={axis.keywords}
                    allKeywords={axis.allKeywords}
                    trendData={axis.trend}
                    period={filters.period}
                    grupo={loteEixo?.[axisId]?.resumo ?? grupoDoEixo(axisId)}
                    archive={eixosArchives[axisId] || []}
                    hideKeywords
                  />
                );
              })}
              {visibleAxes.map((axisId) => {
                const axis = filteredData[axisId];
                return (
                  <AxisColumn
                    key={`${axisId}-${filters.period}-keywords`}
                    axisId={axisId}
                    label={axis.label}
                    keywords={axis.keywords}
                    allKeywords={axis.allKeywords}
                    trendData={axis.trend}
                    period={filters.period}
                    grupo={loteEixo?.[axisId]?.resumo ?? grupoDoEixo(axisId)}
                    top5Lote={loteEixo?.[axisId]?.top5}
                    alertas={loteEixo?.[axisId]?.alertas}
                    hideChart
                  />
                );
              })}
            </div>

            {/* Linha 1B: interesse de pesquisa deste eixo, logo a seguir às keywords */}
            <GoogleTrendsPanel axis={activeAxis} />

            {/* Linha 2: perguntas. Os alertas passaram para a coluna das keywords (fase 3,
                18/09/2026); o bloco antigo, da série parada, foi retirado — ver o fim da página inicial. */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <HealthQuestionsPanel
                axis={activeAxis}
                axisLabel={filteredData[activeAxis]?.label}
              />
            </div>

            {/* Linha 3: YouTube deste eixo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <YouTubeTrendsPanel axis={activeAxis} />
            </div>
          </div>
        ) : (
          /* Overview */
          <>
          {/* Urgency ranking — RETIRADO a 18/09/2026 (decisão da Marta, registada aqui, no
              ecrã e em docs/sessoes/2026-09-18.md). Motivo: score = variação média +
              emergentes×30 + alertas×20, sobre a tabela `keywords` parada desde 10/08 e com
              réguas incomparáveis — contradizia as colunas (Emergentes −57% em cima, −25,8%
              em baixo). Volta quando houver: (1) o pedido das quatro âncoras juntas, que põe
              os eixos numa régua só; (2) uma definição escrita do que "prioridade" mede.
              O cálculo fica intacto abaixo, para não ser reinventado. */}
          <p className="text-[9px] uppercase tracking-[0.15em] text-foreground/40 mb-2">
            Prioridade de comunicação — retirado a 18/09/2026: o ranking vinha de dados parados
            desde 10/08 e de réguas incomparáveis. Volta quando os quatro eixos estiverem numa
            régua só e a definição estiver escrita.
          </p>
          <p className="text-[9px] uppercase tracking-[0.15em] text-foreground/40 mb-8">
            Período 7 | 30 dias | 12 meses — retirado a 18/09/2026: cada bloco tem a sua janela,
            escrita ao lado (gráfico = anos; top 5 = 52 semanas; alertas = esta semana). Se fizer
            falta, será dentro de cada eixo.
          </p>
          {!RANKING_RETIRADO && urgencyRanking.length > 0 && (
            <div className="mb-8">
              <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-foreground/50 mb-3">
                Prioridade de comunicação esta semana
              </p>
              <div className="flex flex-wrap gap-3">
                {urgencyRanking.map((axis, i) => (
                  <button
                    key={axis.axisId}
                    onClick={() => setActiveAxis(axis.axisId)}
                    className="flex items-center gap-2 px-3 py-2 border transition-colors hover:bg-foreground/5"
                    style={{
                      borderColor: i === 0 ? "#0000FF" : "rgba(0,0,255,0.15)",
                      borderWidth: i === 0 ? 2 : 1,
                    }}
                  >
                    <span className="text-[9px] font-bold text-foreground/30">
                      {i + 1}.
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: i === 0 ? "#0000FF" : undefined }}>
                      {axis.label}
                    </span>
                    <span className={`text-[10px] font-semibold ${axis.avgChange > 0 ? "" : "opacity-40"}`}>
                      {axis.avgChange > 0 ? "+" : ""}{axis.avgChange.toFixed(0)}%
                    </span>
                    {axis.alertCount > 0 && (
                      <span className="inline-flex items-center gap-0.5">
                        <span className="w-1.5 h-1.5 bg-destructive rounded-full animate-pulse" />
                        <span className="text-[8px] font-bold">{axis.alertCount}</span>
                      </span>
                    )}
                    {axis.emergentCount > 0 && (
                      <span className="text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 bg-foreground text-background">
                        {axis.emergentCount} sinal{axis.emergentCount > 1 ? "is" : ""}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Página inicial em LINHAS alinhadas (Marta, 18/09/2026: "é um dashboard para ser
              visto num computador, com tudo alinhado"). Cada linha é uma grelha de 4 colunas
              com `items-start`, logo as quatro células começam à mesma altura — antes cada
              eixo era uma pilha vertical e o texto do gráfico (de altura variável) empurrava
              o top 5 e os alertas para alturas diferentes. Linhas: cabeçalho + gráfico ·
              ● Top keywords · ● Alertas. */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 items-start">
            {visibleAxes.map((axisId) => {
              const axis = filteredData[axisId];
              return (
                <AxisColumn
                  key={`${axisId}-${filters.period}-grafico`}
                  axisId={axisId}
                  label={axis.label}
                  keywords={axis.keywords}
                  allKeywords={axis.allKeywords}
                  trendData={axis.trend}
                  period={filters.period}
                  grupo={loteEixo?.[axisId]?.resumo ?? grupoDoEixo(axisId)}
                  hideKeywords
                />
              );
            })}
          </div>

          <div className="section-divider mt-10 mb-6" />
          <div className="flex items-center gap-3 mb-5">
            <span className="inline-block w-1.5 h-1.5 bg-foreground rounded-full" />
            <p className="text-xs font-bold uppercase tracking-[0.15em]">Top keywords</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 items-start">
            {visibleAxes.map((axisId) => {
              const axis = filteredData[axisId];
              return (
                <AxisColumn
                  key={`${axisId}-${filters.period}-keywords`}
                  axisId={axisId}
                  label={axis.label}
                  keywords={axis.keywords}
                  allKeywords={axis.allKeywords}
                  trendData={axis.trend}
                  period={filters.period}
                  grupo={loteEixo?.[axisId]?.resumo ?? grupoDoEixo(axisId)}
                  top5Lote={loteEixo?.[axisId]?.top5}
                  hideChart
                  hideHeader
                  hideAlertas
                />
              );
            })}
          </div>
          {lote && <p className="text-[9px] leading-relaxed text-foreground/50 mt-4">{NOTA_TOP5}</p>}

          {semanaAlertas && (
            <>
              <div className="section-divider mt-10 mb-6" />
              <div className="flex items-center gap-3 mb-5">
                <span className="inline-block w-1.5 h-1.5 bg-foreground rounded-full" />
                <p className="text-xs font-bold uppercase tracking-[0.15em]">
                  Alertas — semana de {semanaCurta(semanaAlertas)}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 items-start">
                {visibleAxes.map((axisId) => {
                  const dados = loteEixo?.[axisId]?.alertas;
                  return dados
                    ? <AlertasEixo key={`${axisId}-alertas`} dados={dados} rotulo={filteredData[axisId].label} rotuloCor="#0000FF" compacto />
                    : <div key={`${axisId}-alertas`} />;
                })}
              </div>
              <p className="text-[9px] leading-relaxed text-foreground/50 mt-4">{NOTA_ALERTAS}</p>
            </>
          )}
          </>
        )}

        {/* Health Questions + YouTube Trends — ordem decidida pela Marta a 18/09/2026: as
            perguntas logo a seguir às colunas; os alertas foram para o fim da página. O
            interesse de pesquisa está no gráfico de cada coluna (grupoDoEixo); o painel
            completo do Trends fica na vista de eixo. */}
        {activeAxis === 'all' && (
          <div className="mt-10">
            <div className="section-divider mb-6" />
            <HealthQuestionsPanel />
            <div className="section-divider mb-6 mt-10" />
            <YouTubeTrendsPanel axis={activeAxis} />
          </div>
        )}

        {/* Side tables */}
        <div className="mt-10">
          <div className="section-divider mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:h-[420px]">
            {/* Fact-check: o componente só mostra linhas COM veredicto e URL; as 36 semeadas a
                25/03/2026 ("a verificar") ficam na tabela e fora do ecrã. A fonte passa a ser a
                Google Fact Check Tools API, só editores portugueses (scripts/11), a partir de
                terça 22/09 — até lá o componente di-lo em vez de mostrar uma lista vazia. */}
            <DebunkingTable items={filteredDebunkingData} />
            <MediaTable items={filteredNewsData} lastFetchTimestamp={lastFetchTimestamp} activeTheme={activeAxis !== "all" ? activeAxis : undefined} />
          </div>
        </div>

        {/* "Alertas de pesquisa" — RETIRADO a 18/09/2026 (decisão da Marta, registada aqui,
            no ecrã e em docs/sessoes/2026-09-18.md). O que mostrava: `change_percent` da
            tabela `keywords`, a série parada desde 10/08, 4 semanas contra 4 numa régua
            incomparável, e chamava "PICO" a +40% — um 1→2 dava "+100%". Os alertas verdadeiros
            (fase 3, regra de 18/09/2026, trends_alertas) estão agora dentro de cada coluna,
            a seguir ao top 5. O componente SearchAlerts e o detectAlerts ficam no código,
            sem uso, até se decidir apagá-los. */}
        {activeAxis === 'all' && ALERTAS_ANTIGOS && alerts.length > 0 && (
          <div className="mt-10">
            <div className="section-divider mb-6" />
            <SearchAlerts
              alerts={alerts}
              period={filters.period}
              debunkingData={debunkingData}
              newsData={newsData}
              historicalData={historicalData}
            />
          </div>
        )}
        {activeAxis === 'all' && (
          <p className="text-[9px] uppercase tracking-[0.15em] text-foreground/40 mt-10">
            Alertas de pesquisa — retirado a 18/09/2026: vinha da série parada desde 10/08 e
            chamava pico a um 1→2. Os alertas estão agora em cada coluna, a seguir ao top 5,
            com a regra de 18/09/2026.
          </p>
        )}
      </main>

      <DashboardFooter
        filters={filters}
        axes={filteredData}
        debunkingData={debunkingData}
        newsData={newsData}
        historicalData={historicalData}
      />
    </div>
  );
};

export default Index;
