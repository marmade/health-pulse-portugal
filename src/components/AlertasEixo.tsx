import type { AlertasEixo as Dados, AlertaItem } from "@/hooks/useTrendsLote";
import { semanaIntervalo } from "@/lib/semana";
import { fraseDaTendencia } from "../../supabase/functions/_shared/emergentes";
import { fraseDoAlerta, n0, vezes } from "@/lib/fraseAlerta";

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
 *     tendência     alerta em curso há mais de 26 semanas (29/10/2026) — linha à parte, sem
 *                   bandeira e sem a palavra "alerta" (docs/metodo/2026-09-18-alertas-regra.md §7a)
 */
type ComSimbolo = Exclude<AlertaItem["tipo"], "tendencia">;
const SIMBOLO: Record<ComSimbolo, string> = { subida: "▲", aparecimento: "●", sazonal: "~", a_observar: "○" };
/** A cor de cada símbolo — a mesma nas linhas dos alertas e na legenda do "Como ler os alertas"
    (decisão da Marta, 23/10/2026). Os alertas a vermelho; o sazonal e o "a observar" no cinzento
    da linha deles. */
const COR_SIMBOLO: Record<ComSimbolo, string> = {
  subida: "text-destructive", aparecimento: "text-destructive", sazonal: "text-foreground/60", a_observar: "text-foreground/60",
};
const Simbolo = ({ tipo }: { tipo: ComSimbolo }) => <span className={COR_SIMBOLO[tipo]}>{SIMBOLO[tipo]}</span>;

// a linha do alerta vem de src/lib/fraseAlerta.ts — a mesma do briefing e da sugestão de conteúdo
function frase(a: AlertaItem): string {
  if (a.tipo === "aparecimento") return fraseDoAlerta(a);
  let s = fraseDoAlerta(a);
  if (a.tipo === "sazonal" && a.fatorSazonal) s += ` — sazonal: nesta época é habitual (×${vezes(a.fatorSazonal)})`;
  return s;
}

/**
 * "Como ler os alertas" — texto da Marta, aprovado a 23/10/2026, letra a letra; substitui a nota
 * de proveniência que estava aqui (NOTA_ALERTAS). Os detalhes que saíram do ecrã (os 3 desvios
 * robustos, a regra de 18/09/2026) vão para o /sobre, pelo rascunho
 * docs/evidencia/2026-09-18-sobre-linha-do-tempo/rascunho-notas-de-metodo.md §1.2. O §1.1 desse
 * rascunho tem este mesmo texto, e um teste compara-os (src/test/comoLerAlertas.test.tsx).
 * Sempre visível, com o título como título de coluna, no mesmo rótulo dos eixos — decisão da
 * Marta, 23/10/2026: na página inicial é a primeira coluna, à esquerda dos 4 eixos (Index.tsx).
 * A largura fica limitada para as linhas não passarem de 70 a 80 caracteres; os símbolos têm as
 * cores das linhas dos alertas (COR_SIMBOLO). Ver docs/sessoes/2026-10-23.md §7.
 */
export const ComoLerAlertas = () => (
  <div>
    <p className="editorial-label mb-3" style={{ color: "#0000FF" }}>
      Como ler os alertas
    </p>
    <div className="text-[10px] leading-relaxed text-foreground/70 border-l-2 pl-2 space-y-1.5 max-w-[62ch]" style={{ borderColor: "#0000FF" }}>
      <p>
        Um alerta diz que um termo foi mais procurado numa semana do que costuma ser. Os valores vêm do
        Google Trends e não são números de pesquisas: são relativos, numa escala própria de cada eixo, e
        só se comparam dentro do mesmo eixo.
      </p>
      <p>
        <Simbolo tipo="subida" /> <strong>Subida.</strong> O «valor normal» é a mediana das oito semanas anteriores. Há alerta
        quando a semana fica pelo menos 1,5 vezes acima desse valor e bem acima da oscilação habitual do
        termo. «Em curso, 3.ª semana» quer dizer que a subida dura há três semanas. Enquanto dura, o
        valor normal fica o de antes de começar.
      </p>
      <p>
        Um alerta que dura mais de meio ano passa a tendência: deixa de ter bandeira, e o valor normal
        passa a ser o novo nível. Uma subida acima desse nível volta a dar alerta.
      </p>
      <p>
        <Simbolo tipo="aparecimento" /> <strong>Aparecimento.</strong> Um termo sem procura regular passa a ser procurado, muito acima
        do que tinha no último ano.
      </p>
      <p>
        <Simbolo tipo="sazonal" /> <strong>Sazonal.</strong> A subida é a que esta época do ano costuma trazer. Mostra-se, mas não
        é alerta.
      </p>
      <p>
        <Simbolo tipo="a_observar" /> <strong>A observar.</strong> Subiu sem chegar ao limite de alerta.
      </p>
      <p>
        A semana em curso não conta. O alerta diz que algo subiu, não porquê: isso é leitura de quem o
        vê. «Nenhum alerta» quer dizer que nenhum termo cumpriu a regra nessa semana, não que nada
        mudou no tema.
      </p>
    </div>
  </div>
);

/** rotulo: na página inicial (linhas alinhadas) é o nome do eixo; sem rotulo, o título diz a
    semana. compacto: sem o "Como ler os alertas" (a linha da página inicial mostra-o uma vez). */
const AlertasEixo = ({ dados, rotulo, rotuloCor, compacto }: { dados: Dados; rotulo?: string; rotuloCor?: string; compacto?: boolean }) => {
  const alertas = dados.itens.filter(a => a.tipo === "subida" || a.tipo === "aparecimento");
  const resto = dados.itens.filter(a => a.tipo === "sazonal" || a.tipo === "a_observar");
  const tendencias = dados.itens.filter(a => a.tipo === "tendencia");
  return (
    <div>
      <p className="editorial-label mb-3" style={rotuloCor ? { color: rotuloCor } : undefined}>
        {rotulo ?? <>Alertas — semana de {semanaIntervalo(dados.semana)}</>}
      </p>
      {alertas.length === 0 && (
        <p className="text-[10px] leading-relaxed text-foreground/60 py-1">
          Nenhum alerta esta semana.
        </p>
      )}
      <div className="space-y-0">
        {alertas.map(a => <Linha key={a.termo} a={a} forte />)}
        {resto.map(a => <Linha key={a.termo} a={a} />)}
        {tendencias.map(a => <LinhaTendencia key={a.termo} a={a} />)}
      </div>
      {!compacto && <div className="mt-2"><ComoLerAlertas /></div>}
    </div>
  );
};

/** A linha da tendência (decisão da Marta, 29/10/2026), sem bandeira: «creatina — tendência de
    subida desde 02/01/2022 · 190,6 (o valor normal antes era 40,8)». */
const LinhaTendencia = ({ a }: { a: AlertaItem }) => (
  <div className="flex items-start gap-2 py-2 border-b border-foreground/10 last:border-0 text-foreground/60">
    <span className="w-3 shrink-0" />
    <p className="text-[10px] leading-relaxed flex-1 min-w-0">
      <span className="text-xs font-semibold">{a.termo}</span>{" — "}
      {fraseDaTendencia({ valor: a.valor, referencia: a.referencia, inicio: a.inicio })}
    </p>
  </div>
);

const Linha = ({ a, forte }: { a: AlertaItem; forte?: boolean }) => (
  <div className={`flex items-start gap-2 py-2 border-b border-foreground/10 last:border-0 ${forte ? "" : "text-foreground/60"}`}>
    <span className={`text-[11px] w-3 shrink-0 mt-0.5 ${COR_SIMBOLO[a.tipo as ComSimbolo]}`}>{SIMBOLO[a.tipo as ComSimbolo]}</span>
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
