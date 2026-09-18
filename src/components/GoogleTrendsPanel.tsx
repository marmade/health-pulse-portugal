import { useMemo, useState } from "react";
import TrendChart from "@/components/TrendChart";
import type { TrendPoint } from "@/data/mockData";
import dados from "@/data/googleTrends.json";

/**
 * Série real do Google Trends, descarregada à mão e convertida por
 * scripts/converter_trends_csv.py. Ao contrário de `historical_snapshots`, estes
 * pontos estão todos na mesma régua — vêm de uma só descarga.
 *
 * A leitura por baixo do gráfico é CALCULADA a partir dos pontos, não escrita à
 * mão: se a série mudar, a leitura muda com ela.
 */

const MES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MES_LONGO = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

type Ponto = { data: string; valor: number };
type Serie = {
  termo: string; periodo: string | null; rotulo: string; eixo: string;
  geo: string; categoria: string | null; granularidade: string;
  pontos: Ponto[]; inicio: string; fim: string; maximo: number; pico_em: string;
  zeros: number; descarregado_em: string; ficheiro: string;
  regua: string; outros_na_regua: string[]; termos_no_ficheiro: number;
  regua_conjunta_com_periodo_anterior: boolean; colunas_ignoradas: string[];
};

const EIXO_ROTULO: Record<string, string> = {
  "saude-mental": "Saúde mental", "alimentacao": "Alimentação", "menopausa": "Menopausa",
  "emergentes": "Emergentes", "comparacao": "Comparação entre eixos (15/09)",
};
const AXIS_ORDER = ["saude-mental", "alimentacao", "menopausa", "emergentes"];
// A comparação de 15/09 (pasta "comparacao") tem termos de três eixos no mesmo
// ficheiro. Cada série vai para a coluna do seu eixo; a régua (o ficheiro) mantém-se,
// e a leitura continua a dizer com quem está na mesma régua.
const EIXO_POR_TERMO: Record<string, string> = {
  "menopausa": "menopausa", "ansiedade": "saude-mental", "depressão": "saude-mental",
  "alimentação": "alimentacao", "obesidade": "alimentacao",
};
const eixoDe = (s: Serie) =>
  AXIS_ORDER.includes(s.eixo) ? s.eixo : (EIXO_POR_TERMO[s.termo] || null);

const GRANULARIDADE: Record<string, string> = {
  mensal: "mensal", semanal: "semanal", diaria: "diária", horaria: "de ~4 em 4 horas",
};

const SERIES = (dados as unknown as { series: Serie[] }).series;

const media = (a: number[]) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;

function analisar(s: Serie) {
  const porAnoMes = new Map<string, number[]>();
  for (const p of s.pontos) {
    const k = `${p.data.slice(0, 4)}-${p.data.slice(5, 7)}`;
    if (!porAnoMes.has(k)) porAnoMes.set(k, []);
    porAnoMes.get(k)!.push(p.valor);
  }
  const anoDe = (d: string) => +d.slice(0, 4);
  const anos = [...new Set(s.pontos.map(p => anoDe(p.data)))].sort();
  const corrente = anos[anos.length - 1];
  const anterior = corrente - 1;

  // pontos para o TrendChart: mês a mês, ano corrente vs anterior
  const pontos: TrendPoint[] = MES.map((lab, i) => {
    const mm = String(i + 1).padStart(2, "0");
    const c = porAnoMes.get(`${corrente}-${mm}`);
    const p = porAnoMes.get(`${anterior}-${mm}`);
    return {
      week: lab,
      current: (c ? Math.round(media(c)) : undefined) as unknown as number,
      previous: (p ? Math.round(media(p)) : undefined) as unknown as number,
    };
  });
  const sobrepostos = pontos.filter(p => p.current != null && p.previous != null).length;

  // anos civis completos, para tendência e sazonalidade
  const completos = anos.filter(a => new Set(
    s.pontos.filter(p => anoDe(p.data) === a).map(p => p.data.slice(5, 7))).size === 12);
  const mediasAnuais = completos.map(a => ({
    ano: a, m: media(s.pontos.filter(p => anoDe(p.data) === a).map(p => p.valor)),
  }));
  const sazonal = MES.map((_, i) => {
    const mm = String(i + 1).padStart(2, "0");
    const v = completos.flatMap(a => porAnoMes.get(`${a}-${mm}`) || []);
    return { mes: i, m: media(v) };
  }).filter(x => x.m > 0);
  const alto = sazonal.length ? sazonal.reduce((a, b) => (b.m > a.m ? b : a)) : null;
  const baixo = sazonal.length ? sazonal.reduce((a, b) => (b.m < a.m ? b : a)) : null;

  return { pontos, sobrepostos, corrente, anterior, mediasAnuais, alto, baixo };
}

/** Uma coluna = um eixo. Dentro, as réguas (ficheiros) desse eixo e a série activa. */
const TrendsColuna = ({ eixo, itens }: { eixo: string; itens: { s: Serie; i: number }[] }) => {
  const [activa, setActiva] = useState(itens[0]?.i ?? 0);
  const reguas = useMemo(() => {
    const m = new Map<string, { s: Serie; i: number }[]>();
    itens.forEach(({ s, i }) => {
      if (!m.has(s.regua)) m.set(s.regua, []);
      m.get(s.regua)!.push({ s, i });
    });
    // as réguas com mais termos primeiro: são as que permitem comparar
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [itens]);
  const s = SERIES[activa];
  const a = useMemo(() => analisar(s), [s]);

  const primeira = a.mediasAnuais[0];
  const ultima = a.mediasAnuais[a.mediasAnuais.length - 1];
  const variacao = primeira && ultima && primeira.m > 0
    ? Math.round((ultima.m - primeira.m) / primeira.m * 100) : null;

  return (
    <div className="flex flex-col min-w-0">
      <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-foreground/60 mb-2">
        {EIXO_ROTULO[eixo] || eixo}
      </p>
      {itens.length === 0 ? (
        <p className="text-[10px] text-foreground/50">Sem descargas para este eixo.</p>
      ) : (
        <>
          {/* Uma descarga = uma régua. Séries do mesmo ficheiro comparam-se entre si;
              de ficheiros diferentes, não. O agrupamento torna isso visível. */}
          <div className="flex flex-col gap-1.5 mb-4">
            {reguas.map(([regua, grupo]) => (
              <div key={regua} className="flex flex-wrap items-center gap-1.5">
                <span className="text-[8px] uppercase tracking-wider text-foreground/35 w-full">
                  {grupo[0].s.termos_no_ficheiro > 1
                    ? `${grupo[0].s.termos_no_ficheiro} na mesma régua${
                        grupo.length < grupo[0].s.termos_no_ficheiro ? ` (${grupo.length} neste eixo)` : ""}`
                    : grupo[0].s.regua_conjunta_com_periodo_anterior ? "régua conjunta" : "sozinha"}
                  {" · "}{GRANULARIDADE[grupo[0].s.granularidade] || grupo[0].s.granularidade}
                </span>
                {grupo.map(({ s: x, i }) => (
                  <button
                    key={`${regua}-${x.rotulo}`}
                    onClick={() => setActiva(i)}
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 border transition-colors ${
                      i === activa ? "bg-foreground text-background border-foreground"
                                   : "border-foreground/20 hover:bg-foreground/5"}`}
                  >
                    {x.rotulo}
                  </button>
                ))}
              </div>
            ))}
          </div>

      <TrendChart data={a.pontos} label={s.rotulo} period="12m" />

      {/* ── A leitura ─────────────────────────────────────────────── */}
      <div className="mt-4 border-t border-foreground/10 pt-3 space-y-2">
        <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-foreground/50">
          O que estamos a ver
        </p>

        <p className="text-[11px] leading-relaxed">
          Interesse de pesquisa por <strong>{s.termo}</strong>
          {s.periodo ? <> (janela «{s.periodo}»)</> : null} no Google, em{" "}
          <strong>{s.geo}</strong>
          {s.categoria
            ? <> e restringido à categoria <strong>{s.categoria}</strong></>
            : <> — <em>a categoria não vem registada no ficheiro</em> (o exportador novo do
                Trends não a escreve; a descarga foi feita com a categoria Saúde, mas isso
                não é verificável a partir do ficheiro)</>}.
          Série <strong>{GRANULARIDADE[s.granularidade] || s.granularidade}</strong> de{" "}
          {s.pontos.length} pontos, de {s.inicio.slice(0, 10)} a {s.fim.slice(0, 10)}.{" "}
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
            <strong>{variacao > 0 ? "+" : ""}{variacao}%</strong> entre {primeira.ano} e{" "}
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
          <strong>Como ler a escala.</strong> O Google não publica número de pesquisas: publica
          um índice de 0 a 100 <strong>normalizado ao valor mais alto desta descarga</strong>,
          que é {s.maximo} em {s.pico_em}. Os valores são comparáveis <strong>entre si dentro
          deste gráfico</strong>, porque vêm todos do mesmo pedido — mas não são contagens, e
          não se comparam com os de outra descarga. Uma subida de {variacao !== null ? `${variacao}%` : "X%"} é
          de <em>interesse relativo</em>, não de volume de pesquisas.
        </p>

        <p className="text-[10px] leading-relaxed text-foreground/60">
          <strong>Proveniência.</strong> Descarga manual do painel “Interesse ao longo do
          tempo” do Google Trends, a <strong>{s.descarregado_em}</strong>. O ficheiro está no
          repositório em <code className="text-[9px]">{s.ficheiro}</code> e a conversão é feita
          por <code className="text-[9px]">scripts/converter_trends_csv.py</code>.{" "}
          <strong>Não actualiza sozinha</strong>: o que está no gráfico é o que foi
          descarregado nessa data.{" "}
          {s.outros_na_regua.length > 0
            ? <><strong>Está na mesma régua que {s.outros_na_regua.join(", ")}</strong> — vieram
               do mesmo pedido, logo os valores comparam-se entre si.</>
            : s.regua_conjunta_com_periodo_anterior
            ? <><strong>Está numa régua conjunta com o período anterior:</strong> a descarga
               pedia a comparação, logo o 100 é o máximo <em>dos dois períodos</em>, e por isso
               esta série não é igual à mesma janela descarregada sozinha. A coluna do período
               anterior ({s.colunas_ignoradas.join(", ")}) ficou de fora do gráfico: vem com as
               datas do período actual e os valores do anterior, e desenhá-la assim seria mentir.</>
            : <><strong>Está sozinha na sua régua</strong>, normalizada ao seu próprio máximo:
               não se compara com nenhuma das outras séries deste painel.</>}
          {s.zeros === 0
            ? <> Nenhum dos {s.pontos.length} pontos é zero — não há falhas de medição nesta série.</>
            : <> {s.zeros} dos {s.pontos.length} pontos são zero.</>}
        </p>
      </div>
        </>
      )}
    </div>
  );
};

/** Quatro colunas alinhadas com os eixos; com `axis`, só a desse eixo. */
const GoogleTrendsPanel = ({ axis }: { axis?: string }) => {
  const series = SERIES;
  const porEixo = useMemo(() => {
    const m = new Map<string, { s: Serie; i: number }[]>(AXIS_ORDER.map(e => [e, []]));
    series.forEach((s, i) => {
      const e = eixoDe(s);
      if (e) m.get(e)!.push({ s, i });
    });
    return m;
  }, [series]);
  const eixos = axis && axis !== "all" ? AXIS_ORDER.filter(e => e === axis) : AXIS_ORDER;

  return (
    <section>
      <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-foreground/50 mb-4">
        Interesse de pesquisa — série real do Google Trends
      </p>
      <div className={eixos.length > 1
        ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 items-start"
        : "grid grid-cols-1 gap-8 items-start"}>
        {eixos.map(e => (
          <TrendsColuna key={e} eixo={e} itens={porEixo.get(e) || []} />
        ))}
      </div>
    </section>
  );
};

export default GoogleTrendsPanel;
