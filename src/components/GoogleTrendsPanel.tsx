import { useMemo, useState } from "react";
import TrendChart from "@/components/TrendChart";
import type { LoteInfo, Incompleto } from "@/hooks/useTrendsLote";
import { analisar, MES_LONGO, type PontoMensal } from "@/lib/vistaEixo";

/**
 * A série de cada termo activo do eixo, do lote mais recente do Google Trends (22/10/2026,
 * decisão da Marta, docs/sessoes/2026-10-22.md). Até aqui lia o googleTrends.json, descarregado
 * à mão a 18/09 e parado, com termos que não eram os do lote. Os pontos vêm de
 * trends_termo_mensal: a média, por mês, das semanas calibradas na régua do eixo — todos os
 * termos do eixo na mesma régua, logo comparáveis entre si.
 *
 * A leitura por baixo do gráfico é CALCULADA a partir dos pontos, não escrita à mão: se a
 * série mudar, a leitura muda com ela.
 */

type Props = {
  rotulo: string;
  termos: string[];
  /** null enquanto se lê; um mapa termo → série mensal depois. */
  series: Map<string, PontoMensal[]> | null;
  lote: LoteInfo | null;
  incompleto?: Incompleto | null;
  erro?: string | null;
};

const GoogleTrendsPanel = ({ rotulo, termos, series, lote, incompleto, erro }: Props) => {
  const [activo, setActivo] = useState<string | null>(null);
  const termo = activo && termos.includes(activo) ? activo : termos[0];
  const serie = useMemo(() => (termo && series?.get(termo)) || [], [series, termo]);
  const a = useMemo(() => analisar(serie), [serie]);

  const primeira = a.mediasAnuais[0];
  const ultima = a.mediasAnuais[a.mediasAnuais.length - 1];
  const variacao = primeira && ultima && primeira.m > 0
    ? Math.round((ultima.m - primeira.m) / primeira.m * 100) : null;

  return (
    <section>
      <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-foreground/50 mb-4">
        Interesse de pesquisa por termo — Google Trends, lote mais recente
      </p>
      <div className="flex flex-col min-w-0">
        <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-foreground/60 mb-2">{rotulo}</p>
        {erro ? (
          <p className="text-[10px] text-foreground/60">Não foi possível ler as séries do lote: {erro}</p>
        ) : !series || !lote ? (
          <p className="text-[10px] text-foreground/50">A ler as séries do lote…</p>
        ) : (
          <>
            {incompleto && (
              <p className="text-[10px] leading-relaxed font-bold mb-3">
                Aviso: os dados deste painel chegaram incompletos — {incompleto.n} de {incompleto.m} linhas.
                As séries e as leituras abaixo foram calculadas só com essas.
              </p>
            )}
            {/* Todos os termos do eixo estão na mesma régua (a do eixo): comparam-se entre si. */}
            <div className="flex flex-wrap items-center gap-1.5 mb-4">
              <span className="text-[8px] uppercase tracking-wider text-foreground/35 w-full">
                {termos.length} termos activos do eixo, na mesma régua · mensal
              </span>
              {termos.map(t => (
                <button
                  key={t}
                  onClick={() => setActivo(t)}
                  className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 border transition-colors ${
                    t === termo ? "bg-foreground text-background border-foreground"
                                : "border-foreground/20 hover:bg-foreground/5"}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <TrendChart data={a.pontos} label={termo} period="12m" />

            {/* ── A leitura ─────────────────────────────────────────────── */}
            <div className="mt-4 border-t border-foreground/10 pt-3 space-y-2">
              <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-foreground/50">
                O que estamos a ver
              </p>

              <p className="text-[11px] leading-relaxed">
                Interesse de pesquisa por <strong>{termo}</strong> no Google, em <strong>Portugal</strong>,
                na categoria <strong>Saúde</strong>.{" "}
                {serie.length > 0
                  ? <>Série <strong>mensal</strong> de {serie.length} meses, de {serie[0].data.slice(0, 7)} a{" "}
                      {serie[serie.length - 1].data.slice(0, 7)}: cada mês é a média das semanas desse mês.{" "}</>
                  : <>Este termo não tem pontos neste lote.{" "}</>}
                {a.sobrepostos > 0
                  ? <>As duas linhas comparam <strong>{a.corrente}</strong> com{" "}
                     <strong>{a.anterior}</strong>, mês a mês, e sobrepõem-se em{" "}
                     <strong>{a.sobrepostos} meses</strong>.</>
                  : <>Não há meses com dados nos dois anos, logo <strong>a comparação
                     ano-a-ano não é possível</strong> com esta série.</>}
              </p>

              {variacao !== null && a.mediasAnuais.length >= 2 && (
                <p className="text-[11px] leading-relaxed">
                  <strong>Tendência.</strong> Média anual de{" "}
                  {a.mediasAnuais.map(x => `${x.ano}: ${x.m.toFixed(1)}`).join(" · ")} —{" "}
                  {variacao > 0 ? "uma subida" : variacao < 0 ? "uma descida" : "estabilidade"} de{" "}
                  <strong>{Math.abs(variacao)}%</strong> entre {primeira.ano} e{" "}
                  {ultima.ano}, contando só anos civis completos.
                </p>
              )}

              {a.alto && a.baixo && (
                <p className="text-[11px] leading-relaxed">
                  <strong>Sazonalidade.</strong> Nos anos completos, o mês mais alto é{" "}
                  <strong>{MES_LONGO[a.alto.mes]}</strong> ({a.alto.m.toFixed(1)}) e o mais baixo{" "}
                  <strong>{MES_LONGO[a.baixo.mes]}</strong> ({a.baixo.m.toFixed(1)}).
                </p>
              )}

              <p className="text-[10px] leading-relaxed text-foreground/60">
                <strong>Como ler a escala.</strong> O Google não publica número de pesquisas: cada pedido
                traz um índice de 0 a 100, normalizado ao máximo desse pedido. O lote calibra todos os
                pedidos do eixo para a régua da âncora do eixo (a âncora ≈ 100), por isso pode haver
                valores acima de 100.
                {a.maximo ? <> O máximo desta série é {a.maximo.valor.toLocaleString("pt-PT", { maximumFractionDigits: 1 })}, em{" "}
                  {a.maximo.data.slice(0, 7)}.</> : null}{" "}
                Os valores comparam-se entre os termos deste eixo, mas não com os de outro eixo, e não
                são contagens: {variacao === null || variacao === 0
                  ? "uma variação"
                  : `uma ${variacao > 0 ? "subida" : "descida"} de ${Math.abs(variacao)}%`} é de{" "}
                <em>interesse relativo</em>, não de volume de pesquisas.
              </p>

              <p className="text-[10px] leading-relaxed text-foreground/60">
                <strong>Proveniência.</strong> Lote <code className="text-[9px]">{lote.id.slice(0, 8)}</code> do
                Google Trends, recolhido a <strong>{lote.iniciadoEm.slice(0, 10)}</strong>: 5 anos, semanal,
                calibrado na régua do eixo; a média por mês vem da vista{" "}
                <code className="text-[9px]">trends_termo_mensal</code>. Muda quando entra um lote novo,
                na recolha de domingo.
                {serie.length > 0 && (a.zeros === 0
                  ? <> Nenhum dos {serie.length} meses é zero.</>
                  : <> {a.zeros} dos {serie.length} meses são zero.</>)}
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default GoogleTrendsPanel;
