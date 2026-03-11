import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AXIS_COLORS, type AxisId } from "@/lib/axisColors";

/* ── Fallback content ── */
const fallbackContent: Record<string, { titulo: string; conteudo: string }> = {
  "o-que-e": {
    titulo: "O que é",
    conteudo: "O Reportagem Viva é um dashboard pessoal de monitorização de tendências de saúde em Portugal. Cruza o comportamento de pesquisa online com cobertura mediática e sinais de desinformação — para informar a produção de conteúdos de comunicação científica.",
  },
  "para-que-serve": {
    titulo: "Para que serve",
    conteudo: "Identificar os temas de saúde mais pesquisados em Portugal\nDetectar sinais emergentes antes de chegarem aos media\nCruzar picos de pesquisa com desinformação e facto-verificação\nInformar a escolha de temas para comunicação em saúde",
  },
  "os-4-eixos": {
    titulo: "Os 4 eixos",
    conteudo: "SAÚDE MENTAL|Ansiedade, burnout, TDAH e bem-estar\nALIMENTAÇÃO|Nutrição, dietas e comportamentos alimentares\nMENOPAUSA|Saúde feminina e hormonal\nEMERGENTES|Novos temas e alertas de saúde pública",
  },
  "fontes-de-dados": {
    titulo: "Fontes de dados",
    conteudo: `RECOLHA AUTOMÁTICA

— Google Trends: dados de pesquisa recolhidos semanalmente via script Python (pytrends), com actualização do dashboard às segundas-feiras. Inclui volume de pesquisa por keyword e Related Queries — as perguntas reais dos portugueses em crescimento. Valores reflectem o índice de interesse relativo em Portugal no período de 12 meses.

— RSS Feeds: 15 fontes portuguesas com recolha contínua em tempo real via Edge Function automatizada. Inclui media (RTP, Público, Observador, JN, DN, Expresso, CM Jornal, TSF, SIC Notícias), institucional (DGS, Ordem dos Médicos, INSA, SNS) e fact-check (Polígrafo, Observador Fact-Check).

— YouTube: vídeos de saúde recolhidos semanalmente via script Python. Inclui título, canal, número de visualizações e URL. Dados organizados por eixo temático e usados para calcular o score de tendência do Mural de Keywords.

DETECÇÃO ASSISTIDA

— Keywords e sinais emergentes identificados automaticamente pelo sistema. Crescimento superior a 200% ou termos sem histórico no ano anterior são sinalizados como emergentes.

CURADORIA EDITORIAL

— Debunking: verificação e categorização manual de mitos e desinformação em saúde, com validação científica. Classificação: FALSO / ENGANADOR / SEM EVIDÊNCIA / IMPRECISO.

— Cobertura mediática: curadoria editorial dos artigos recolhidos via RSS com base em relevância e fundamento científico.`,
  },
  metodologia: {
    titulo: "Metodologia",
    conteudo: `SINAIS EMERGENTES

Crescimento semanal superior a 200% ou termos sem histórico no ano anterior.

Debunking categorizado em: FALSO / ENGANADOR / SEM EVIDÊNCIA / IMPRECISO

O ÍNDICE GOOGLE TRENDS

O índice varia entre 0 e 100 — não representa o número absoluto de pesquisas, mas o interesse relativo de um termo numa região e período. O valor 100 corresponde ao pico máximo de interesse no período analisado. As percentagens de crescimento (+X%) comparam o volume da semana actual com a média das semanas anteriores do mesmo período.

GERAÇÃO DE GUIÕES

Geração de guiões: os dados recolhidos pelo sistema alimentam um prompt estruturado enviado ao Perplexity Sonar, um modelo de linguagem com acesso a fontes verificadas em tempo real. O output é um guião com 10 perguntas por tema, com citações a fontes científicas e jornalísticas. Esta etapa é assistida por IA e sujeita a revisão editorial. Periodicidade: semanal, às segundas-feiras.`,
  },
  "como-funciona": {
    titulo: "Como funciona",
    conteudo: "GOOGLE TRENDS|pesquisas em tempo real\nRSS FEEDS|15 feeds portugueses\nSUPABASE|base de dados + keywords\nEDGE FUNCTIONS|automação diária\nPERPLEXITY SONAR|geração com citações\nGUIÃO|10 perguntas por tema",
  },
  agradecimentos: {
    titulo: "Agradecimentos",
    conteudo: `Um agradecimento aos professores do primeiro ano do Mestrado em Comunicação de Ciência da FCSH-UNL, pelo seu papel fundamental na transmissão do pensamento crítico, científico e da ética colaborativa:

Ana Sanchez; António Gomes da Costa; António Granado; Joana Lobo Antunes; Luís Veríssimo; Matilde Gonçalves`,
  },
};

const Sobre = () => {
  const [content, setContent] = useState(fallbackContent);

  useEffect(() => {
    const fetchContent = async () => {
      const { data } = await supabase.from("sobre_conteudo").select("*");
      if (data && data.length > 0) {
        const map: Record<string, { titulo: string; conteudo: string }> = {};
        data.forEach((row: any) => {
          map[row.id] = { titulo: row.titulo, conteudo: row.conteudo };
        });
        setContent({ ...fallbackContent, ...map });
      }
    };
    fetchContent();
  }, []);

  const get = (id: string) => content[id] || fallbackContent[id];

  /* Parse axes from pipe-delimited format */
  const parseAxes = (text: string) =>
    text.split("\n").map((line) => {
      const [title, desc] = line.split("|");
      return { title: title.trim(), desc: desc?.trim() || "" };
    });

  /* Parse list items from newline-delimited format */
  const parseList = (text: string) => text.split("\n").filter(Boolean);

  /* Parse fontes de dados into structured blocks */
  const renderFontesDeDados = (text: string) => {
    const blocks = text.split(/\n\n+/);
    let headerCount = 0;
    return blocks.map((block, i) => {
      const trimmed = block.trim();
      if (/^[A-ZÀÁÂÃÇÉÊÍÓÔÕÚ ]+$/.test(trimmed)) {
        headerCount++;
        return (
          <p key={i} className={`text-[9px] font-bold uppercase tracking-wider mt-6 mb-2 ${headerCount === 1 ? "mt-0" : "pt-6 border-t border-foreground/10"}`} style={{ color: "#0000FF" }}>
            {trimmed}
          </p>
        );
      }
      return (
        <p key={i} className="text-xs leading-relaxed opacity-80 mb-3">
          {trimmed}
        </p>
      );
    });
  };

  /* Parse fluxo steps */
  const parseFluxo = (text: string) =>
    text.split("\n").map((line) => {
      const [title, subtitle] = line.split("|");
      return { title: title.trim(), subtitle: subtitle?.trim() || "" };
    });

  const axes = parseAxes(get("os-4-eixos").conteudo);
  const paraQueServe = parseList(get("para-que-serve").conteudo);
  const fluxoSteps = parseFluxo(get("como-funciona").conteudo);
  const agradecimentosText = get("agradecimentos").conteudo;
  const agradecimentosParts = agradecimentosText.split("\n\n");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav — editorial only */}
      <header className="w-full">
        <div className="px-6 py-5">
          <p className="text-lg font-bold tracking-[0.05em] uppercase">Diz que Disse</p>
          <p className="editorial-label mt-1" style={{ opacity: 0.5 }}>Serviço Nacional de Literacia em Saúde</p>
        </div>
        <nav className="px-6 py-2 flex items-center justify-between" style={{ borderTop: "1px solid rgba(0,0,255,0.15)", borderBottom: "1px solid rgba(0,0,255,0.15)" }}>
          <Link to="/" className="text-[10px] font-bold tracking-[0.15em] uppercase hover:opacity-70 transition-opacity">
            Reportagem Viva
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/textos" className="nav-link">Textos</Link>
            <span className="text-[10px]" style={{ color: "#0000FF", opacity: 0.2 }}>|</span>
            <Link to="/plataforma" className="nav-link">Plataforma</Link>
            <span className="text-[10px]" style={{ color: "#0000FF", opacity: 0.2 }}>|</span>
            <Link to="/sobre" className="nav-link nav-link-active">Sobre</Link>
          </div>
        </nav>
      </header>

      {/* O que é */}
      <section className="px-6 py-12">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-8">{get("o-que-e").titulo}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-primary mb-3">Reportagem Viva</h3>
            <p className="text-sm leading-relaxed">
              Uma plataforma de monitorização de narrativas de saúde em Portugal. Agrega dados de pesquisa online, cobertura mediática e sinais de desinformação para gerar insights sobre o que preocupa, o que circula e o que distorce a informação de saúde, em tempo real.
            </p>
          </div>
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: "#7B00FF" }}>Diz que Disse</h3>
            <p className="text-sm leading-relaxed" style={{ color: "#7B00FF" }}>
              Um projecto de comunicação estratégica de ciências da saúde. Os seus temas, formatos e prioridades editoriais são informados pelo que o Reportagem Viva detecta, transformando dados de monitorização em conteúdo útil para o público.
            </p>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Para que serve */}
      <section className="px-6 py-12">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-8">{get("para-que-serve").titulo}</h2>
        <div className="space-y-3 max-w-2xl">
          {paraQueServe.map((item) => (
            <p key={item} className="text-sm leading-relaxed">
              — {item}
            </p>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* Os 4 eixos */}
      <section className="px-6 py-12">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-8">{get("os-4-eixos").titulo}</h2>
        <p className="text-sm leading-relaxed max-w-3xl mb-8">
          Os três eixos temáticos (Saúde Mental, Alimentação e Menopausa) foram definidos para identificar e monitorizar as narrativas sobre saúde de forma a estabelecer um plano em concordância com as datas comemorativas estabelecidas no calendário das ciências da saúde. Esta escolha permite pensar de forma cirúrgica na produção de conteúdos e campanhas de sensibilização, que criem uma amostra representativa de uma comunicação estratégica. O quarto eixo, Emergentes, serve um propósito distinto: monitorização contínua de sinais novos, alimentada pela curiosidade editorial e pela eventual necessidade de cruzar temas em surgimento com os eixos principais.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {axes.map((axis) => {
            const axisIdMap: Record<string, AxisId> = {
              "SAÚDE MENTAL": "saude-mental",
              "ALIMENTAÇÃO": "alimentacao",
              "MENOPAUSA": "menopausa",
              "EMERGENTES": "emergentes",
            };
            const colors = AXIS_COLORS[axisIdMap[axis.title] || "emergentes"];
            return (
              <div key={axis.title} className="p-4" style={{ backgroundColor: colors.bg }}>
                <h3 className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: colors.text }}>
                  {axis.title}
                </h3>
              </div>
            );
          })}
        </div>
      </section>

      <div className="section-divider" />

      {/* Fontes de dados + Metodologia side by side */}
      <section className="px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Coluna esquerda — Fontes de dados */}
          <div className="md:border-r md:border-foreground/10 md:pr-6">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4">{get("fontes-de-dados").titulo}</h2>
            <div className="border-t border-foreground/10 pt-4 flex flex-col">
              {renderFontesDeDados(get("fontes-de-dados").conteudo)}
            </div>
          </div>

          {/* Coluna direita — Metodologia */}
          <div className="md:pl-6">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4">{get("metodologia").titulo}</h2>
            <div className="border-t border-foreground/10 pt-4 space-y-0 text-xs text-muted-foreground leading-relaxed">
              {(() => {
                const blocks = get("metodologia").conteudo.split(/\n\n+/);
                let headerCount = 0;
                return blocks.map((block, i) => {
                  const trimmed = block.trim();
                  if (/^[A-ZÀÁÂÃÇÉÊÍÓÔÕÚÎ ]+$/.test(trimmed)) {
                    headerCount++;
                    return (
                      <h3 key={i} className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${headerCount === 1 ? "mt-0" : "mt-6 pt-6 border-t border-foreground/10"}`} style={{ color: "#0000FF" }}>
                        {trimmed}
                      </h3>
                    );
                  }
                  return <p key={i} className="mt-4">{trimmed}</p>;
                });
              })()}
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Limitações */}
      <section className="px-6 py-12">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-8">Limitações</h2>
        <div className="space-y-3 max-w-2xl">
          <p className="text-sm leading-relaxed">— O índice Google Trends não representa volumes absolutos de pesquisa, apenas interesse relativo. Não é possível comparar valores entre temas diferentes.</p>
          <p className="text-sm leading-relaxed">— A cobertura RSS está limitada a 15 fontes seleccionadas por critério editorial. Não representa a totalidade da produção mediática portuguesa.</p>
          <p className="text-sm leading-relaxed">— O debunking é um processo de curadoria manual, sujeito à leitura e julgamento da autora, com validação por fontes científicas.</p>
          <p className="text-sm leading-relaxed">— O threshold de detecção de sinais emergentes (crescimento superior a 200%) é um valor operacional, não um critério cientificamente validado.</p>
        </div>
      </section>

      <div className="section-divider" />

      {/* Como funciona — two-level diagram */}
      <section className="px-6 py-8">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6">{get("como-funciona").titulo}</h2>

        {/* Desktop layout */}
        <div className="hidden md:flex flex-col gap-6">
          {/* Nível 1 — Recolha automática */}
          <div>
            <p className="text-[8px] font-medium uppercase tracking-[0.15em] text-muted-foreground mb-3">Nível 1 — Recolha Automática</p>
            <div className="flex items-center gap-2">
              {/* Three sources converging */}
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <div className="border border-primary px-3 py-2 w-[120px] flex-shrink-0">
                    <h3 className="text-[9px] font-bold uppercase tracking-[0.12em] text-primary leading-tight">Google Trends</h3>
                    <p className="text-[9px] text-muted-foreground mt-0.5 lowercase leading-tight">semanal</p>
                  </div>
                  <span className="text-primary text-[10px] font-bold select-none">↘</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="border border-primary px-3 py-2 w-[120px] flex-shrink-0">
                    <h3 className="text-[9px] font-bold uppercase tracking-[0.12em] text-primary leading-tight">RSS Feeds</h3>
                    <p className="text-[9px] text-muted-foreground mt-0.5 lowercase leading-tight">tempo real</p>
                  </div>
                  <span className="text-primary text-[10px] font-bold select-none">→</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="border border-primary px-3 py-2 w-[120px] flex-shrink-0">
                    <h3 className="text-[9px] font-bold uppercase tracking-[0.12em] text-primary leading-tight">YouTube</h3>
                    <p className="text-[9px] text-muted-foreground mt-0.5 lowercase leading-tight">semanal</p>
                  </div>
                  <span className="text-primary text-[10px] font-bold select-none">↗</span>
                </div>
              </div>
              {/* Supabase → Edge Functions → Dashboard */}
              {[
                { title: "Supabase", subtitle: "base de dados" },
                { title: "Edge Functions", subtitle: "automação" },
                { title: "Dashboard", subtitle: "visualização" },
              ].map((step, idx, arr) => (
                <div key={step.title} className="flex items-center gap-2">
                  <div className="border border-primary px-3 py-2 w-[120px] flex-shrink-0">
                    <h3 className="text-[9px] font-bold uppercase tracking-[0.12em] text-primary leading-tight">{step.title}</h3>
                    <p className="text-[9px] text-muted-foreground mt-0.5 lowercase leading-tight">{step.subtitle}</p>
                  </div>
                  {idx < arr.length - 1 && (
                    <span className="text-primary text-[10px] font-bold select-none flex-shrink-0">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Nível 2 — Produção editorial */}
          <div>
            <p className="text-[8px] font-medium uppercase tracking-[0.15em] text-muted-foreground mb-3">Nível 2 — Produção Editorial</p>
            <div className="flex items-center gap-2">
              {[
                { title: "Dashboard", subtitle: "dados agregados", human: false },
                { title: "Curadoria Editorial", subtitle: "selecção humana", human: true },
                { title: "Perplexity Sonar", subtitle: "geração com citações", human: false },
                { title: "Guião", subtitle: "10 perguntas por tema", human: false },
                { title: "Diz que Disse", subtitle: "publicação", human: false, terminal: true },
              ].map((step, idx, arr) => (
                <div key={step.title} className="flex items-center gap-2">
                  <div
                    className={`px-3 py-2 w-[120px] flex-shrink-0 ${
                      step.terminal
                        ? "border-2 border-primary bg-primary/5"
                        : "border border-primary"
                    }`}
                  >
                    <h3
                      className={`text-[9px] uppercase tracking-[0.12em] leading-tight ${
                        step.human
                          ? "font-normal italic text-primary/70"
                          : step.terminal
                          ? "font-bold text-primary"
                          : "font-bold text-primary"
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p className={`text-[9px] mt-0.5 lowercase leading-tight ${step.human ? "text-muted-foreground/70 italic" : "text-muted-foreground"}`}>
                      {step.subtitle}
                    </p>
                  </div>
                  {idx < arr.length - 1 && (
                    <span className="text-primary text-[10px] font-bold select-none flex-shrink-0">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile layout — vertical stack */}
        <div className="flex md:hidden flex-col gap-4">
          <p className="text-[8px] font-medium uppercase tracking-[0.15em] text-muted-foreground">Nível 1 — Recolha Automática</p>
          {[
            { title: "Google Trends", subtitle: "semanal" },
            { title: "RSS Feeds", subtitle: "tempo real" },
            { title: "YouTube", subtitle: "semanal" },
            { title: "Supabase", subtitle: "base de dados" },
            { title: "Edge Functions", subtitle: "automação" },
            { title: "Dashboard", subtitle: "visualização" },
          ].map((step, idx, arr) => (
            <div key={step.title} className="flex flex-col items-center gap-2">
              <div className="border border-primary px-3 py-2 w-full">
                <h3 className="text-[9px] font-bold uppercase tracking-[0.12em] text-primary leading-tight">{step.title}</h3>
                <p className="text-[9px] text-muted-foreground mt-0.5 lowercase leading-tight">{step.subtitle}</p>
              </div>
              {idx < arr.length - 1 && <span className="text-primary text-[10px] font-bold select-none leading-none">↓</span>}
            </div>
          ))}

          <div className="section-divider my-2" />

          <p className="text-[8px] font-medium uppercase tracking-[0.15em] text-muted-foreground">Nível 2 — Produção Editorial</p>
          {[
            { title: "Dashboard", subtitle: "dados agregados", human: false, terminal: false },
            { title: "Curadoria Editorial", subtitle: "selecção humana", human: true, terminal: false },
            { title: "Perplexity Sonar", subtitle: "geração com citações", human: false, terminal: false },
            { title: "Guião", subtitle: "10 perguntas por tema", human: false, terminal: false },
            { title: "Diz que Disse", subtitle: "publicação", human: false, terminal: true },
          ].map((step, idx, arr) => (
            <div key={step.title} className="flex flex-col items-center gap-2">
              <div className={`px-3 py-2 w-full ${step.terminal ? "border-2 border-primary bg-primary/5" : "border border-primary"}`}>
                <h3 className={`text-[9px] uppercase tracking-[0.12em] leading-tight ${step.human ? "font-normal italic text-primary/70" : "font-bold text-primary"}`}>{step.title}</h3>
                <p className={`text-[9px] mt-0.5 lowercase leading-tight ${step.human ? "text-muted-foreground/70 italic" : "text-muted-foreground"}`}>{step.subtitle}</p>
              </div>
              {idx < arr.length - 1 && <span className="text-primary text-[10px] font-bold select-none leading-none">↓</span>}
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* Agradecimentos */}
      <section className="px-6 py-12">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6">{get("agradecimentos").titulo}</h2>
        {agradecimentosParts.map((part, i) => (
          <p key={i} className="text-sm max-w-2xl leading-relaxed mb-6 last:mb-0">
            {part}
          </p>
        ))}
      </section>

      <div className="section-divider" />

      {/* Créditos */}
      <footer className="px-6 py-12">
        <p className="text-[10px] uppercase tracking-[0.15em] leading-relaxed opacity-50">
          Marta Madeira · 2024110168<br />
          Mestrado em Comunicação de Ciência<br />
          Faculdade de Ciências Sociais e Humanas<br />
          Universidade Nova de Lisboa · 2026
        </p>
      </footer>
    </div>
  );
};

export default Sobre;
