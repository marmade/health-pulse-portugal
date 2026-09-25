import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/* Linha do tempo do método (página /sobre). Desenho decidido a 18/09/2026: esboço em
   docs/evidencia/2026-09-18-sobre-linha-do-tempo/esboco.md, secção A, e a maqueta HTML
   referida no cabeçalho desse ficheiro. O texto vem dos ficheiros em marcos/, um por
   ponto, lidos tal como estão: a página não tem cópia do texto. */

const FICHEIROS = import.meta.glob(
  "/docs/evidencia/2026-09-18-sobre-linha-do-tempo/marcos/2026-*.md",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const MESES = ["Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set"];
const MESES_LONGOS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

/* A régua vai de 1 de Março a 1 de Outubro: cada mês ocupa a largura dos dias que tem. */
const INI = Date.UTC(2026, 2, 1);
const FIM = Date.UTC(2026, 9, 1);
const dia = (iso: string) => Date.parse(iso + "T00:00:00Z");
const x = (iso: string) => ((dia(iso) - INI) / (FIM - INI)) * 100;

/* A régua ocupa a largura da secção: os meses esticam e encolhem com o ecrã. No mais
   estreito que a mostra (768 px, 720 de régua) o 14/09 e o 18/09 ficam a 13,5 px um do
   outro, e os pontos (9 px, clique de 12 px) não se tocam.
   Sem nota da pausa de Junho e Julho: decisão de 20/09, não referir a pausa. */

type Marco = {
  data: string;
  dataFim?: string;
  titulo: string;
  tres: { rotulo: string; texto: string }[];
  prosa: { md: string; larga: boolean }[];
};

const lerMarco = (raw: string): Marco => {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error("marco sem frontmatter");
  const fm: Record<string, string> = {};
  m[1].split("\n").forEach((linha) => {
    const i = linha.indexOf(":");
    if (i > 0) fm[linha.slice(0, i).trim()] = linha.slice(i + 1).trim();
  });

  // As três linhas a negrito abrem o corpo; o resto é prosa.
  const linhas = m[2].trim().split("\n");
  const tres = linhas.slice(0, 3).map((linha) => {
    const r = linha.match(/^\*\*(Pensava-se|Descobriu-se|Mudou):?\*\*[,:]?\s*(.*)$/);
    if (!r) throw new Error(`marco ${fm.data}: esperava as três linhas a negrito`);
    return { rotulo: r[1], texto: r[2] };
  });

  // "<!-- largura toda -->" marca o parágrafo seguinte para ocupar a largura das três
  // colunas. Os outros comentários HTML não chegam ao ecrã: sem rehype-raw, o
  // react-markdown não mostra HTML.
  const prosa: Marco["prosa"] = [];
  linhas.slice(3).join("\n").split("<!-- largura toda -->").forEach((parte, i) => {
    if (i === 0) {
      if (parte.trim()) prosa.push({ md: parte, larga: false });
      return;
    }
    const t = parte.replace(/^\s+/, "");
    const fimParagrafo = t.search(/\n\s*\n/);
    const larga = fimParagrafo < 0 ? t : t.slice(0, fimParagrafo);
    const resto = fimParagrafo < 0 ? "" : t.slice(fimParagrafo);
    prosa.push({ md: larga, larga: true });
    if (resto.trim()) prosa.push({ md: resto, larga: false });
  });

  return { data: fm.data, dataFim: fm.data_fim, titulo: fm.titulo, tres, prosa };
};

const MARCOS: Marco[] = Object.keys(FICHEIROS).sort().map((k) => lerMarco(FICHEIROS[k]));

const rotuloCurto = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

const quando = (m: Marco) => {
  const d = Number(m.data.slice(8, 10));
  const mes = MESES_LONGOS[Number(m.data.slice(5, 7)) - 1];
  if (!m.dataFim) return `${d} de ${mes} de 2026`;
  const d2 = Number(m.dataFim.slice(8, 10));
  const ligacao = (dia(m.dataFim) - dia(m.data)) / 86400000 === 1 ? "e" : "a";
  return `${d} ${ligacao} ${d2} de ${mes} de 2026`;
};

const md: Components = {
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1 [&_ul]:mt-1 [&_ul]:mb-0 [&_ul]:list-[circle]">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
  table: ({ children }) => <table className="w-full max-w-[68ch] border-collapse my-2 mb-4 text-[11px]">{children}</table>,
  th: ({ children }) => <th className="text-left pr-2 py-1.5 border-b border-primary/10 text-[9px] uppercase tracking-[0.15em] font-semibold opacity-60 align-top">{children}</th>,
  td: ({ children }) => <td className="text-left pr-2 py-1.5 border-b border-primary/10 align-top">{children}</td>,
};

/* Aspas. Os ficheiros têm aspas direitas ("), e o " da Space Grotesk desenha-se como
   uma aspa de fecho: "ansiedade" lia-se ”ansiedade”. Aqui passam a “ ” ao mostrar,
   sem mexer nos ficheiros. Abre a aspa que vem no início ou depois de espaço ou
   parêntese; fecha a outra. O carácter anterior passa de um nó de texto para o seguinte,
   para "**Mudou:**" ou "_x_" contarem bem. Só mexe em texto corrido, não em código. */
type No = { type: string; value?: string; children?: No[] };
const remarkAspas = () => (arvore: No) => {
  let anterior = "";
  const percorre = (no: No) => {
    if (no.type === "text" && no.value) {
      no.value = [...no.value].map((c) => {
        const r = c === '"' ? (anterior === "" || /[\s([{]/.test(anterior) ? "“" : "”") : c;
        anterior = c;
        return r;
      }).join("");
    } else if (no.type === "inlineCode" || no.type === "code") {
      anterior = "x";
    } else if (no.type === "paragraph" || no.type === "tableCell" || no.type === "listItem" || no.type === "heading") {
      anterior = "";
    }
    no.children?.forEach(percorre);
  };
  percorre(arvore);
};

const Md = ({ children }: { children: string }) => (
  <ReactMarkdown remarkPlugins={[remarkGfm, remarkAspas]} components={md}>{children}</ReactMarkdown>
);

const Titulo = ({ children }: { children: ReactNode }) => (
  <h3 className="text-lg font-bold leading-tight mb-5 max-w-[30ch] first-letter:uppercase">{children}</h3>
);

/* Altura das filas de datas por baixo da linha. As filas são atribuídas medindo cada
   data no ecrã: uma data só fica numa fila se não tocar na anterior dessa fila. */
const EIXO = 36;
const FILA = 14;

const Regua = ({ aberto, tudo, abrir }: { aberto: number; tudo: boolean; abrir: (i: number) => void }) => {
  const regua = useRef<HTMLDivElement>(null);
  const datas = useRef<(HTMLSpanElement | null)[]>([]);
  const [filas, setFilas] = useState<number[]>(() => MARCOS.map(() => 0));

  useLayoutEffect(() => {
    const el = regua.current;
    if (!el) return;
    const calcular = () => {
      const largura = el.clientWidth;
      if (!largura) return;
      const fimDaFila: number[] = [];
      const novas = MARCOS.map((m, i) => {
        const w = datas.current[i]?.offsetWidth ?? 0;
        const esq = (x(m.data) / 100) * largura - w / 2;
        let f = fimDaFila.findIndex((fim) => esq > fim + 6);
        if (f < 0) f = fimDaFila.length;
        fimDaFila[f] = esq + w;
        return f;
      });
      setFilas((antes) => (antes.join() === novas.join() ? antes : novas));
    };
    calcular();
    // A largura das datas só é a final depois de a Space Grotesk carregar.
    document.fonts?.ready.then(calcular);
    const ro = new ResizeObserver(calcular);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const nFilas = Math.max(...filas) + 1;

  return (
    <div ref={regua} className="relative hidden md:block w-full" style={{ height: EIXO + 14 + nFilas * FILA }} aria-label="Régua de Março a Setembro de 2026">
      {MESES.map((n, i) => (
        <div key={n} className="absolute top-0 h-full border-l border-primary/10" style={{ left: `${x(`2026-${String(i + 3).padStart(2, "0")}-01`)}%` }}>
          <span className="absolute top-0 left-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] whitespace-nowrap">{n}</span>
        </div>
      ))}
      <div className="absolute left-0 right-0 border-t border-primary" style={{ top: EIXO }} />
      {MARCOS.map((m, i) => {
        const on = tudo || i === aberto;
        const f = filas[i];
        return (
          <button
            key={m.data}
            type="button"
            onClick={() => abrir(i)}
            aria-expanded={on}
            aria-controls={`marco-${m.data}`}
            title={`${quando(m)}: ${m.titulo}`}
            className="group absolute w-3 h-6 -translate-x-1/2 -translate-y-1/2 focus-visible:outline-none"
            style={{ left: `${x(m.data)}%`, top: EIXO }}
          >
            <span className={`absolute left-1/2 top-1/2 w-[9px] h-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-primary transition-transform group-hover:scale-125 group-focus-visible:scale-125 motion-reduce:transition-none ${on ? "bg-primary" : "bg-background"}`} />
            {f > 0 && <span className="absolute left-1/2 w-px bg-primary/20" style={{ top: 18, height: f * FILA }} />}
            <span
              ref={(el) => (datas.current[i] = el)}
              className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] tracking-[0.05em] tabular-nums ${on ? "font-semibold" : "opacity-70"}`}
              style={{ top: 14 + f * FILA + 4 }}
            >
              {rotuloCurto(m.data)}
            </span>
          </button>
        );
      })}
    </div>
  );
};

/* No telemóvel a régua passa a lista vertical, por mês. */
const Lista = ({ aberto, tudo, abrir }: { aberto: number; tudo: boolean; abrir: (i: number) => void }) => (
  <div className="md:hidden border-t border-primary">
    {MESES.map((n, k) => {
      const mes = String(k + 3).padStart(2, "0");
      return (
        <div key={n}>
          <div className="pt-2.5 pb-1 text-[10px] uppercase tracking-[0.15em] font-semibold border-b border-primary/10">{n}</div>
          {MARCOS.map((m, i) => m.data.slice(5, 7) !== mes ? null : (
            <button
              key={m.data}
              type="button"
              onClick={() => abrir(i)}
              aria-expanded={tudo || i === aberto}
              className="flex gap-2.5 items-baseline w-full text-left py-2 border-b border-primary/10 text-xs"
            >
              <span className={`w-2 h-2 rounded-full border-[1.5px] border-primary flex-none ${tudo || i === aberto ? "bg-primary" : ""}`} />
              <span className="tabular-nums opacity-50 w-[5ch] flex-none">{rotuloCurto(m.data)}</span>
              <span className="first-letter:uppercase">{m.titulo}</span>
            </button>
          ))}
        </div>
      );
    })}
  </div>
);

const LinhaDoTempo = () => {
  const [aberto, setAberto] = useState(MARCOS.length - 1); // o último aberto por omissão
  const [tudo, setTudo] = useState(false);
  const abrir = (i: number) => { setTudo(false); setAberto(i); };

  return (
    <section className="px-6 py-12">
      <div className="flex justify-between items-baseline gap-4 mb-2">
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5">Linha do tempo do método</h2>
          <p className="text-[13px] leading-relaxed opacity-70 max-w-[62ch] mb-7">
            O método de desenvolvimento da ferramenta foi desenhado à medida que foi sendo feito, e fruto de descobertas. Os pontos representam um dia em que se assumiu que uma coisa não era o que se pensava e que foi fazendo com que a estrutura do código fosse sendo alterada.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setTudo((t) => !t)}
          aria-pressed={tudo}
          className={`flex-none border px-2.5 py-1 text-[9px] uppercase tracking-[0.15em] ${tudo ? "bg-primary text-background border-primary" : "border-primary/20 hover:border-primary"}`}
        >
          {tudo ? "Ver um de cada vez" : "Ver tudo"}
        </button>
      </div>

      <Regua aberto={aberto} tudo={tudo} abrir={abrir} />
      <Lista aberto={aberto} tudo={tudo} abrir={abrir} />

      <div className="border-t border-primary/20">
        {MARCOS.map((m, i) => !(tudo || i === aberto) ? null : (
          <article key={m.data} id={`marco-${m.data}`} className="py-7 border-b border-primary/10">
            <p className="text-[9px] uppercase tracking-[0.2em] opacity-50 mb-1.5">{quando(m)}</p>
            <Titulo>{m.titulo}</Titulo>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5 mb-5">
              {m.tres.map((t) => (
                <div key={t.rotulo} className="border-t border-primary pt-2 text-xs leading-relaxed">
                  <b className="block text-[9px] uppercase tracking-[0.2em] mb-1">{t.rotulo}</b>
                  <Md>{t.texto}</Md>
                </div>
              ))}
            </div>
            {m.prosa.map((p, k) => (
              /* A prosa vai numa caixa da cor do bloco "Diz que Disse", à largura da
                 secção; o parágrafo "largura toda" vai numa caixa igual, à parte. */
              <div key={k} className={`bg-[#F5F5FF] px-5 py-4 ${k > 0 ? "mt-3" : ""}`}>
                <div className="text-[13px] leading-relaxed opacity-80">
                  <Md>{p.md}</Md>
                </div>
              </div>
            ))}
          </article>
        ))}
      </div>

      {/* Nota geral da assistência, no fim da secção: por escrever (25/09/2026). O lugar
          fica aqui, vazio. */}
    </section>
  );
};

export default LinhaDoTempo;
