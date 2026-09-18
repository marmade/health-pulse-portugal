import { useMemo } from "react";
import type { Keyword, TrendPoint } from "@/data/mockData";
import TrendChart from "./TrendChart";
import { MES_LONGO, type GrupoResumo } from "@/lib/trendsGrupo";
import type { Top5Item, AlertasEixo as DadosAlertas } from "@/hooks/useTrendsLote";
import Top5Table from "./Top5Table";
import AlertasEixo from "./AlertasEixo";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

type Props = {
  axisId: string;
  label: string;
  keywords: Keyword[];
  allKeywords: Keyword[];
  trendData: TrendPoint[];
  period: string;
  /** Resumo da descarga de grupo do eixo (página inicial). Se vier, o gráfico usa-o
      em vez de `trendData` — ver src/lib/trendsGrupo.ts para o porquê. */
  grupo?: GrupoResumo | null;
  /** Top 5 do lote do Google Trends (mediana calibrada, 52 semanas). Se vier, substitui o
      top 5 da tabela `keywords`, que é a série parada de 10/08/2026. */
  top5Lote?: Top5Item[] | null;
  /** Alertas do eixo na última semana completa do lote (fase 3, regra de 18/09/2026). Vêm
      logo a seguir ao top 5, dentro da coluna — decisão da Marta: nada de linhas de um lado
      ao outro; cada eixo na sua régua. */
  alertas?: DadosAlertas | null;
  archive?: any[];
  hideChart?: boolean;
  hideKeywords?: boolean;
  /** Página inicial em linhas alinhadas (Marta, 18/09/2026): a célula da linha "Top keywords"
      não repete o cabeçalho do eixo — mostra o nome do eixo como rótulo do top 5. */
  hideHeader?: boolean;
  /** Os alertas têm a sua própria linha na página inicial; na vista de eixo ficam na coluna. */
  hideAlertas?: boolean;
};

export const NOTA_TOP5 = "Mediana das últimas 52 semanas, calibrada para a régua da âncora do eixo (a âncora ≈ 100); a variação compara com as 52 semanas anteriores; o pico é a semana mais alta do ano. Google Trends, Portugal, categoria Saúde — que é o que o Google entende por saúde e não filtra homónimos.";

// O "Var. média" calculado sobre a tabela `keywords` (série parada desde 10/08/2026) deixou
// de se mostrar a 18/09/2026; o bloco fica para quando a coluna voltar a ter dados vivos.
const VAR_MEDIA_ANTIGA = false;

const AxisColumn = ({ axisId, label, keywords, allKeywords, trendData, period, grupo, top5Lote, alertas, archive = [], hideChart, hideKeywords, hideHeader, hideAlertas }: Props) => {
  const totalChange = allKeywords.length > 0
    ? allKeywords.reduce((sum, k) => sum + k.changePercent, 0) / allKeywords.length
    : 0;
  const emergentCount = useMemo(
    () => allKeywords.filter((kw) => kw.isEmergent).length,
    [allKeywords]
  );

  const top5 = useMemo(
    () => [...keywords].sort((a, b) => b.currentVolume - a.currentVolume).slice(0, 5),
    [keywords]
  );

  return (
    <div className="flex flex-col gap-5">
      {!hideHeader && <div>
        <h2 className="text-sm font-bold uppercase tracking-[0.15em]" style={{ color: "#0000FF" }}>
          {label}
        </h2>
        <div className="flex items-center gap-4 mt-2">
          {/* Com descarga de grupo, a variação é a da régua comum (ano corrente vs anterior,
              meses sobrepostos). Sem ela, o número antigo ficaria a vir da série parada de
              10/08/2026 — por isso não se mostra. */}
          {grupo ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <p className="editorial-label">Var. {grupo.anoCorrente} vs {grupo.anoAnterior}</p>
                    {grupo.variacao ? (
                      <p className={`text-lg font-bold ${grupo.variacao.pct > 0 ? "" : "opacity-50"}`}>
                        {grupo.variacao.pct > 0 ? "+" : ""}{grupo.variacao.pct.toFixed(1)}%
                      </p>
                    ) : (
                      <p className="text-lg font-bold opacity-40">—</p>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[300px] text-xs leading-relaxed">
                  {grupo.variacao
                    ? <>Média dos {grupo.termos.length} termos da descarga de grupo deste eixo, na mesma régua,
                        nos {grupo.variacao.meses} meses que existem nos dois anos: {grupo.variacao.corrente.toFixed(1)} em{" "}
                        {grupo.anoCorrente} contra {grupo.variacao.anterior.toFixed(1)} em {grupo.anoAnterior}. É interesse
                        relativo, não volume de pesquisas.</>
                    : <>Não há meses com dados nos dois anos nesta descarga.</>}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
          {VAR_MEDIA_ANTIGA && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <p className="editorial-label">Var. média</p>
                    <p className={`text-lg font-bold ${totalChange > 0 ? "" : "opacity-50"}`}>
                      {totalChange > 0 ? "+" : ""}
                      {totalChange.toFixed(1)}%
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[280px] text-xs leading-relaxed">
                  Média da variação percentual de todas as keywords deste eixo, comparando o período actual com o anterior equivalente. Valores negativos indicam que as pesquisas diminuíram face ao período anterior — pode reflectir sazonalidade ou normalização após um pico.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {!grupo && emergentCount > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <p className="editorial-label">Sinais</p>
                    <p className="text-lg font-bold">{emergentCount}</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[220px] text-xs leading-relaxed">
                  Keywords com crescimento superior a 50% e volume mínimo de 10 pontos no índice Google Trends.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>}

      {!hideChart && grupo && (
        <>
          <div className="border-t border-foreground/10" />
          <TrendChart data={grupo.pontos} label={label} period="12m" />
          {/* Tudo o que está aqui é calculado da descarga; nada é escrito à mão. */}
          <div className="space-y-1 -mt-2">
            <p className="text-[10px] leading-relaxed">
              Média de <strong>{grupo.termos.length} termos na mesma régua</strong> —{" "}
              {grupo.termos.join(", ")} — <strong>{grupo.anoCorrente}</strong> contra{" "}
              <strong>{grupo.anoAnterior}</strong>, mês a mês
              {grupo.mesesSobrepostos > 0
                ? <>, sobrepostos em {grupo.mesesSobrepostos} meses.</>
                : <>. <em>Sem meses nos dois anos: a comparação não é possível.</em></>}
            </p>
            {grupo.maisInteresse && (
              <p className="text-[10px] leading-relaxed">
                <strong>Mais interesse:</strong> {grupo.maisInteresse.termo} (média{" "}
                {grupo.maisInteresse.media.toFixed(0)} em {grupo.anosCompletos[grupo.anosCompletos.length - 1]}).
              </p>
            )}
            {grupo.maisSobe && (
              <p className="text-[10px] leading-relaxed">
                <strong>Mais sobe:</strong> {grupo.maisSobe.termo},{" "}
                {grupo.maisSobe.variacao > 0 ? "+" : ""}{grupo.maisSobe.variacao}% entre os dois
                últimos anos completos ({grupo.maisSobe.de.toFixed(0)} → {grupo.maisSobe.a.toFixed(0)}).
              </p>
            )}
            {grupo.mesAlto && (
              <p className="text-[10px] leading-relaxed">
                <strong>Mês mais alto:</strong> {MES_LONGO[grupo.mesAlto.mes]}, nos{" "}
                {grupo.anosCompletos.length} anos completos.
              </p>
            )}
            <p className="text-[9px] leading-relaxed text-foreground/50">
              Google Trends, Portugal, índice 0–100 normalizado ao máximo desta descarga
              ({grupo.granularidade}, descarregada a {grupo.descarregadoEm}). Não actualiza sozinha.
            </p>
          </div>
        </>
      )}
      {!hideChart && !grupo && (
        <>
          <div className="border-t border-foreground/10" />
          <p className="text-[10px] leading-relaxed text-foreground/50">
            Sem descarga de grupo do Google Trends para este eixo — o gráfico fica de fora
            até haver uma. (A série antiga, de <code>historical_snapshots</code>, deixou de
            ser desenhada a 18/09/2026: média de réguas diferentes sobre dados parados.)
          </p>
        </>
      )}

      {!hideKeywords && top5Lote && top5Lote.length > 0 && (
        <>
          {!hideHeader && <div className="border-t border-foreground/10" />}
          <Top5Table
            rotulo={hideHeader ? label : "Top 5 — mais pesquisados, na régua do eixo"}
            rotuloCor={hideHeader ? "#0000FF" : undefined}
            aviso={top5Lote.length < 5
              ? `Só ${top5Lote.length} ${top5Lote.length === 1 ? "termo tem" : "termos têm"} procura regular neste eixo.`
              : hideHeader ? "Os 5 mais pesquisados, na régua do eixo." : undefined}
            keywords={top5Lote.map(t => ({
              term: t.termo, synonyms: [], category: "", axis: axisId, source: "trends",
              currentVolume: Math.round(t.mediana), previousVolume: Math.round(t.medianaAnterior ?? 0),
              changePercent: t.variacao ?? 0,
              trend: (t.variacao ?? 0) > 10 ? "up" : (t.variacao ?? 0) < -10 ? "down" : "stable",
              lastPeak: t.picoEm ? `${MES_LONGO[+t.picoEm.slice(5, 7) - 1].slice(0, 3)} ${t.picoEm.slice(0, 4)}` : "",
              isEmergent: false,
            }))}
            nota={hideHeader ? undefined : NOTA_TOP5}
          />
        </>
      )}
      {!hideKeywords && !(top5Lote && top5Lote.length > 0) && (
        <>
          {!hideHeader && <div className="border-t border-foreground/10" />}
          <Top5Table keywords={top5} rotulo={hideHeader ? label : undefined} rotuloCor={hideHeader ? "#0000FF" : undefined} />
        </>
      )}
      {!hideKeywords && !hideAlertas && alertas && (
        <>
          <div className="border-t border-foreground/10" />
          <AlertasEixo dados={alertas} />
        </>
      )}

      {/* Arquivo semanal */}
      {archive.length > 0 && (
        <div className="mt-6 pt-4 border-t border-foreground/10">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 opacity-60">
            Arquivo
          </p>
          <div className="space-y-0">
            {archive.map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between py-2 border-b border-foreground/10 last:border-0">
                <span className="text-xs font-medium">{entry.week_label}</span>
                <button
                  onClick={() => (window as any)._downloadEixoPdf && (window as any)._downloadEixoPdf(entry)}
                  className="text-[9px] font-bold uppercase tracking-[0.15em] border px-2 py-1 transition-colors"
                  style={{ borderColor: "#0000FF", color: "#0000FF" }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#0000FF"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#0000FF"; }}
                >
                  PDF
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AxisColumn;
