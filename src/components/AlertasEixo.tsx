import type { AlertasEixo as Dados, AlertaItem } from "@/hooks/useTrendsLote";
import { MES_LONGO } from "@/lib/trendsGrupo";

/**
 * Os alertas de um eixo, na última semana completa do lote — fase 3, regra de 18/09/2026
 * (docs/metodo/2026-09-18-alertas-regra.md, secção 7). Uma linha por termo, na formulação
 * da Marta: "N vezes acima do valor normal (ref)". Tudo na régua do eixo; os eixos não se
 * misturam numa lista só — por isso isto vive dentro de cada coluna.
 *
 *   ▲ subida        z ≥ 3 e ×1,5 contra a mediana das 8 semanas anteriores
 *   ● aparecimento  termo sem procura regular que surge acima do piscar do Google
 *   ~ sazonal       cumpre a subida, mas a época do ano explica-a — mostra-se, não é alerta
 *   ○ a observar    z ≥ 2 sem chegar a alerta — sem bandeira, nunca com a palavra "alerta"
 */
const SIMBOLO: Record<AlertaItem["tipo"], string> = { subida: "▲", aparecimento: "●", sazonal: "~", a_observar: "○" };

const vezes = (r: number) => (r >= 10 ? r.toFixed(0) : r.toFixed(1).replace(".", ","));
const n0 = (x: number) => Math.round(x).toString();

function frase(a: AlertaItem): string {
  if (a.tipo === "aparecimento")
    return `apareceu; normalmente sem procura (máx. anterior ${n0(a.maxAnterior ?? 0)})`;
  let s = `${vezes(a.razao)} vezes acima do valor normal (${n0(a.referencia)})`;
  if (a.tipo === "sazonal" && a.fatorSazonal) s += ` — sazonal: nesta época é habitual (×${vezes(a.fatorSazonal)})`;
  return s;
}

const dataCurta = (iso: string) => `${+iso.slice(8, 10)} ${MES_LONGO[+iso.slice(5, 7) - 1].slice(0, 3)}`;

export const NOTA_ALERTAS = `"Valor normal" = mediana das 8 semanas anteriores, na régua do eixo. Alerta: 3 desvios robustos e 1,5 vezes acima; "a observar" (○) fica aquém; "sazonal" (~) é o que esta época costuma fazer nos anos anteriores. Regra de 18/09/2026; a semana em curso não conta.`;
export const semanaCurta = dataCurta;

/** rotulo: na página inicial (linhas alinhadas) é o nome do eixo; sem rotulo, o título diz a
    semana. compacto: sem a nota de proveniência (a linha da página inicial mostra-a uma vez). */
const AlertasEixo = ({ dados, rotulo, rotuloCor, compacto }: { dados: Dados; rotulo?: string; rotuloCor?: string; compacto?: boolean }) => {
  const alertas = dados.itens.filter(a => a.tipo === "subida" || a.tipo === "aparecimento");
  const resto = dados.itens.filter(a => a.tipo === "sazonal" || a.tipo === "a_observar");
  return (
    <div>
      <p className="editorial-label mb-3" style={rotuloCor ? { color: rotuloCor } : undefined}>
        {rotulo ?? <>Alertas — semana de {dataCurta(dados.semana)}</>}
      </p>
      {alertas.length === 0 && (
        <p className="text-[10px] leading-relaxed text-foreground/60 py-1">
          Nenhum alerta esta semana.
        </p>
      )}
      <div className="space-y-0">
        {alertas.map(a => <Linha key={a.termo} a={a} forte />)}
        {resto.map(a => <Linha key={a.termo} a={a} />)}
      </div>
      {!compacto && <p className="text-[9px] leading-relaxed text-foreground/50 mt-2">{NOTA_ALERTAS}</p>}
    </div>
  );
};

const Linha = ({ a, forte }: { a: AlertaItem; forte?: boolean }) => (
  <div className={`flex items-start gap-2 py-2 border-b border-foreground/10 last:border-0 ${forte ? "" : "text-foreground/60"}`}>
    <span className={`text-[11px] w-3 shrink-0 mt-0.5 ${forte ? "text-destructive" : ""}`}>{SIMBOLO[a.tipo]}</span>
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline gap-2">
        <span className={`text-xs ${forte ? "font-bold" : "font-semibold"} truncate`}>{a.termo}</span>
        <span className="text-xs tabular-nums">{n0(a.valor)}</span>
        {a.semanaN > 1 && (
          <span className="text-[9px] uppercase tracking-wider text-foreground/50 shrink-0">
            em curso, {a.semanaN}.ª semana
          </span>
        )}
      </div>
      <p className="text-[10px] leading-relaxed">
        {frase(a)}{a.tipo === "a_observar" ? " (a observar)" : ""}
      </p>
    </div>
  </div>
);

export default AlertasEixo;
