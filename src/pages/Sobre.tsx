import { Link } from "react-router-dom";
import { AXIS_COLORS, type AxisId } from "@/lib/axisColors";
import { fallbackSobreContent } from "@/data/sobreContent";
import EditorialHeader from "@/components/EditorialHeader";

const Sobre = () => {
  const content = fallbackSobreContent;

  const get = (id: string) => content[id];

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
      if (/^[A-ZÀÁÂÃÇÉÊÍÓÔÕÚÎ ]+$/.test(trimmed)) {
        headerCount++;
        return (
          <p key={i} className={`text-[9px] font-bold uppercase tracking-wider mb-2 ${headerCount === 1 ? "mt-0" : "mt-5 pt-5 border-t border-foreground/10"}`} style={{ color: "#0000FF" }}>
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
  const fluxoSteps = parseFluxo(get("como-funciona").conteudo);
  const agradecimentosText = get("agradecimentos").conteudo;
  const agradecimentosParts = agradecimentosText.split("\n\n");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <EditorialHeader />

      {/* O que é */}
      <section className="px-6 py-12">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-8">O que é</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Coluna A — Reportagem Viva */}
          <div className="space-y-6">
            <div>
              <h3 className="text-[9px] font-bold uppercase tracking-[0.12em] text-primary mb-3">Reportagem Viva</h3>
              <p className="text-sm leading-relaxed">Uma plataforma de monitorização de narrativas de saúde em Portugal. Agrega dados de pesquisa online, cobertura mediática e sinais de desinformação para gerar insights sobre o que preocupa, o que circula e o que distorce a informação de saúde, em tempo real.</p>
            </div>
            <div className="space-y-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-primary mt-6 mb-3">Para que serve</p>
              <p className="text-xs leading-relaxed opacity-80 flex gap-2"><span className="text-primary flex-shrink-0">·</span><span>Identificar os temas de saúde mais pesquisados em Portugal</span></p>
              <p className="text-xs leading-relaxed opacity-80 flex gap-2"><span className="text-primary flex-shrink-0">·</span><span>Detectar sinais emergentes antes de chegarem aos media</span></p>
              <p className="text-xs leading-relaxed opacity-80 flex gap-2"><span className="text-primary flex-shrink-0">·</span><span>Cruzar picos de pesquisa com desinformação e facto-verificação</span></p>
              <p className="text-xs leading-relaxed opacity-80 flex gap-2"><span className="text-primary flex-shrink-0">·</span><span>Informar a escolha de temas para comunicação em saúde</span></p>
            </div>
          </div>
          {/* Coluna B — Diz que Disse */}
          <div className="space-y-6 p-6 -m-2" style={{ backgroundColor: "#F5F5FF" }}>
            <div>
              <h3 className="text-[9px] font-bold uppercase tracking-[0.12em] mb-3" style={{ color: "#7B00FF" }}>Diz que Disse</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#7B00FF" }}>Um projecto de comunicação estratégica de ciências da saúde. Os seus temas, formatos e prioridades editoriais são informados pelo que o Reportagem Viva detecta, transformando dados de monitorização em conteúdo útil para o público.</p>
            </div>
            <div className="space-y-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] mt-6 mb-3" style={{ color: "#7B00FF" }}>Para que serve</p>
              <p className="text-xs leading-relaxed opacity-80 flex gap-2" style={{ color: "#7B00FF" }}><span className="flex-shrink-0">·</span><span>Capacitar as pessoas com conhecimento crítico sobre saúde</span></p>
              <p className="text-xs leading-relaxed opacity-80 flex gap-2" style={{ color: "#7B00FF" }}><span className="flex-shrink-0">·</span><span>Desenvolver o pensamento crítico face à informação recebida</span></p>
              <p className="text-xs leading-relaxed opacity-80 flex gap-2" style={{ color: "#7B00FF" }}><span className="flex-shrink-0">·</span><span>Valorizar a comunicação em saúde nos cuidados de saúde primários</span></p>
              <p className="text-xs leading-relaxed opacity-80 flex gap-2" style={{ color: "#7B00FF" }}><span className="flex-shrink-0">·</span><span>Reduzir desigualdades sociais no acesso à informação em saúde</span></p>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Os 4 eixos */}
      <section className="px-6 py-12">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-8">{get("os-4-eixos").titulo}</h2>
        <div className="columns-2 gap-12 text-sm leading-relaxed mb-8">
          {get("eixos-intro").conteudo}
        </div>
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
            <div className="border-t border-foreground/10 pt-4 flex flex-col">
              {(() => {
                const blocks = get("metodologia").conteudo.split(/\n\n+/);
                let headerCount = 0;
                return blocks.map((block, i) => {
                  const trimmed = block.trim();
                  if (/^[A-ZÀÁÂÃÇÉÊÍÓÔÕÚÎ ]+$/.test(trimmed)) {
                    headerCount++;
                    return (
                      <p key={i} className={`text-[9px] font-bold uppercase tracking-wider mb-2 ${headerCount === 1 ? "mt-0" : "mt-5 pt-5 border-t border-foreground/10"}`} style={{ color: "#0000FF" }}>
                        {trimmed}
                      </p>
                    );
                  }
                  return <p key={i} className="text-xs leading-relaxed opacity-80 mb-3">{trimmed}</p>;
                });
              })()}
            </div>
          </div>
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
              {/* Four sources converging */}
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <div className="border border-primary px-3 py-2 w-[130px] flex-shrink-0">
                    <h3 className="text-[9px] font-bold uppercase tracking-[0.12em] text-primary leading-tight">Google Trends</h3>
                    <p className="text-[9px] text-muted-foreground mt-0.5 lowercase leading-tight">semanal · pytrends</p>
                  </div>
                  <span className="text-primary text-[10px] font-bold select-none">↘</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="border border-primary px-3 py-2 w-[130px] flex-shrink-0">
                    <h3 className="text-[9px] font-bold uppercase tracking-[0.12em] text-primary leading-tight">Autocomplete</h3>
                    <p className="text-[9px] text-muted-foreground mt-0.5 lowercase leading-tight">semanal · perguntas</p>
                  </div>
                  <span className="text-primary text-[10px] font-bold select-none">↘</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="border border-primary px-3 py-2 w-[130px] flex-shrink-0">
                    <h3 className="text-[9px] font-bold uppercase tracking-[0.12em] text-primary leading-tight">RSS Feeds</h3>
                    <p className="text-[9px] text-muted-foreground mt-0.5 lowercase leading-tight">42 fontes</p>
                  </div>
                  <span className="text-primary text-[10px] font-bold select-none">→</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="border border-primary px-3 py-2 w-[130px] flex-shrink-0">
                    <h3 className="text-[9px] font-bold uppercase tracking-[0.12em] text-primary leading-tight">YouTube</h3>
                    <p className="text-[9px] text-muted-foreground mt-0.5 lowercase leading-tight">55 canais</p>
                  </div>
                  <span className="text-primary text-[10px] font-bold select-none">↗</span>
                </div>
              </div>
              {/* Supabase → Edge Functions → Dashboard → Arquivo */}
              {[
                { title: "Supabase", subtitle: "base de dados" },
                { title: "Edge Functions", subtitle: "automação" },
                { title: "Dashboard", subtitle: "visualização" },
                { title: "Arquivo", subtitle: "semanal · PDF" },
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
            { title: "Google Trends", subtitle: "semanal · pytrends" },
            { title: "Google Autocomplete", subtitle: "semanal · perguntas" },
            { title: "RSS Feeds", subtitle: "42 fontes" },
            { title: "YouTube", subtitle: "55 canais" },
            { title: "Supabase", subtitle: "base de dados" },
            { title: "Edge Functions", subtitle: "automação" },
            { title: "Dashboard", subtitle: "visualização" },
            { title: "Arquivo", subtitle: "semanal · PDF" },
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

      {/* Limitações */}
      <section className="px-6 py-12">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-8">{get("limitacoes").titulo}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
          {parseList(get("limitacoes").conteudo).map((item) => (
            <p key={item} className="text-sm leading-relaxed">{item}</p>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* Agradecimentos */}
      <section className="px-6 py-12">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6">{get("agradecimentos").titulo}</h2>
        <div className="columns-2 gap-12 text-sm leading-relaxed">
          {agradecimentosParts.map((part, i) => (
            <p key={i} className="mb-6 last:mb-0">
              {part}
            </p>
          ))}
        </div>
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
