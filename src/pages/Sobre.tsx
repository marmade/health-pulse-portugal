import { Link } from "react-router-dom";

const axes = [
  { title: "SAÚDE MENTAL", desc: "Ansiedade, burnout, TDAH e bem-estar" },
  { title: "ALIMENTAÇÃO", desc: "Nutrição, dietas e comportamentos alimentares" },
  { title: "MENOPAUSA", desc: "Saúde feminina e hormonal" },
  { title: "EMERGENTES", desc: "Novos temas e alertas de saúde pública" },
];

const fontes = [
  { label: "Google Trends", desc: "Comportamento de pesquisa em Portugal" },
  { label: "15 RSS Feeds", desc: "RTP, Público, Expresso, JN, DN, TSF, SIC, Observador, CMJornal, DGS, Ordem dos Médicos, Polígrafo, Observador Fact-Check, INSA, SNS" },
  { label: "Supabase", desc: "Base de dados em tempo real" },
];

const paraQueServe = [
  "Identificar os temas de saúde mais pesquisados em Portugal",
  "Detectar sinais emergentes antes de chegarem aos media",
  "Cruzar picos de pesquisa com desinformação e facto-verificação",
  "Informar a escolha de temas para comunicação em saúde",
];

const fluxo = [
  { title: "GOOGLE TRENDS", subtitle: "pesquisas em tempo real" },
  { title: "SUPABASE", subtitle: "base de dados + keywords" },
  { title: "EDGE FUNCTIONS", subtitle: "automação diária" },
  { title: "PERPLEXITY SONAR", subtitle: "geração com citações" },
  { title: "GUIÃO", subtitle: "10 perguntas por tema" },
];

const agradecimentos = [
  "Ana Sanchez",
  "António Gomes da Costa",
  "António Granado",
  "Joana Lobo Antunes",
  "Luís Veríssimo",
  "Matilde Gonçalves",
];

const Sobre = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="w-full">
        <div className="px-6 py-5 flex items-baseline justify-between">
          <Link to="/" className="text-lg font-bold tracking-[0.05em] uppercase hover:opacity-70 transition-opacity">
            Reportagem Viva
          </Link>
          <Link to="/" className="text-[10px] font-bold uppercase tracking-[0.15em] border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-colors">
            ← Dashboard
          </Link>
        </div>
        <div className="section-divider" />
      </header>

      {/* Hero */}
      <section className="px-6 py-16 md:py-24">
        <h1 className="text-3xl md:text-5xl font-bold tracking-[0.04em] uppercase leading-tight">
          Reportagem Viva
        </h1>
        <p className="mt-4 text-sm md:text-base font-medium tracking-wide uppercase opacity-80">
          Monitorização de Tendências sobre Saúde em Portugal
        </p>
      </section>

      <div className="section-divider" />

      {/* O que é */}
      <section className="px-6 py-12">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6">O que é</h2>
        <p className="text-sm md:text-base max-w-2xl leading-relaxed">
          O Reportagem Viva é um dashboard pessoal de monitorização de tendências de saúde em Portugal. Cruza o comportamento de pesquisa online com cobertura mediática e sinais de desinformação — para informar a produção de conteúdos de comunicação científica.
        </p>
      </section>

      <div className="section-divider" />

      {/* Para que serve */}
      <section className="px-6 py-12">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-8">Para que serve</h2>
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
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-8">Os 4 eixos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {axes.map((axis) => (
            <div key={axis.title} className="border border-foreground/20 p-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.15em]">
                {axis.title}
              </h3>
              <p className="text-xs mt-2 opacity-60 leading-relaxed">
                {axis.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* Fontes de dados + Metodologia side by side */}
      <section className="px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Coluna esquerda — Fontes de dados */}
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-8">Fontes de dados</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs"><span className="text-[10px] font-normal uppercase tracking-[0.15em] text-muted-foreground">Google Trends</span> <span className="opacity-60">· Comportamento de pesquisa em Portugal</span></p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Dados recolhidos semanalmente via script Python (pytrends) e actualizados manualmente. Os valores reflectem o índice de interesse relativo em Portugal no período de 12 meses.</p>
              </div>
              <div>
                <p className="text-xs"><span className="text-[10px] font-normal uppercase tracking-[0.15em] text-muted-foreground">15 RSS Feeds</span> <span className="opacity-60">· RTP, Público, Expresso, JN, DN, TSF, SIC, Observador, CMJornal, DGS, Ordem dos Médicos, Polígrafo, Observador Fact-Check, INSA, SNS</span></p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Artigos recolhidos em tempo real via Edge Function automatizada. Actualização contínua.</p>
              </div>
              <div>
                <p className="text-xs"><span className="text-[10px] font-normal uppercase tracking-[0.15em] text-muted-foreground">Supabase</span> <span className="opacity-60">· Base de dados em tempo real</span></p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Keywords, debunking e categorização inseridos e verificados manualmente. Os dados de pesquisa são actualizados semanalmente.</p>
              </div>
            </div>
          </div>

          {/* Coluna direita — Metodologia */}
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Metodologia</h2>
            <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
              <p>
                Sinais emergentes: crescimento semanal superior a 200% ou termos sem histórico no ano anterior.
              </p>
              <p>
                Debunking categorizado em: FALSO / ENGANADOR / SEM EVIDÊNCIA / IMPRECISO
              </p>
              <div className="mt-6">
                <h3 className="text-[10px] font-normal uppercase tracking-[0.15em] text-muted-foreground mb-3">O Índice Google Trends</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  O índice varia entre 0 e 100 — não representa o número absoluto de pesquisas, mas o interesse relativo de um termo numa região e período. O valor 100 corresponde ao pico máximo de interesse no período analisado. As percentagens de crescimento (+X%) comparam o volume da semana actual com a média das semanas anteriores do mesmo período.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Como funciona */}
      <section className="px-6 py-8">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Como funciona</h2>

        {/* Desktop layout */}
        <div className="hidden md:flex items-center gap-2">
          {/* Left: two sources converging */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <div className="border border-primary px-3 py-2 w-[120px] flex-shrink-0">
                <h3 className="text-[9px] font-bold uppercase tracking-[0.12em] text-primary leading-tight">Google Trends</h3>
                <p className="text-[9px] text-muted-foreground mt-0.5 lowercase leading-tight">pesquisas em tempo real</p>
              </div>
              <span className="text-primary text-[10px] font-bold select-none">↘</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="border border-primary px-3 py-2 w-[120px] flex-shrink-0">
                <h3 className="text-[9px] font-bold uppercase tracking-[0.12em] text-primary leading-tight">RSS Feeds</h3>
                <p className="text-[9px] text-muted-foreground mt-0.5 lowercase leading-tight">15 feeds portugueses</p>
              </div>
              <span className="text-primary text-[10px] font-bold select-none">↗</span>
            </div>
          </div>

          {/* Right: linear chain */}
          {[
            { title: "SUPABASE", subtitle: "base de dados + keywords" },
            { title: "EDGE FUNCTIONS", subtitle: "automação diária" },
            { title: "PERPLEXITY SONAR", subtitle: "geração com citações" },
            { title: "GUIÃO", subtitle: "10 perguntas por tema" },
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

        {/* Mobile layout — vertical stack */}
        <div className="flex md:hidden flex-col gap-2">
          {[
            { title: "GOOGLE TRENDS", subtitle: "pesquisas em tempo real" },
            { title: "RSS FEEDS", subtitle: "15 feeds portugueses" },
            { title: "SUPABASE", subtitle: "base de dados + keywords" },
            { title: "EDGE FUNCTIONS", subtitle: "automação diária" },
            { title: "PERPLEXITY SONAR", subtitle: "geração com citações" },
            { title: "GUIÃO", subtitle: "10 perguntas por tema" },
          ].map((step, idx, arr) => (
            <div key={step.title} className="flex flex-col items-center gap-2">
              <div className="border border-primary px-3 py-2 w-full">
                <h3 className="text-[9px] font-bold uppercase tracking-[0.12em] text-primary leading-tight">{step.title}</h3>
                <p className="text-[9px] text-muted-foreground mt-0.5 lowercase leading-tight">{step.subtitle}</p>
              </div>
              {idx < arr.length - 1 && (
                <span className="text-primary text-[10px] font-bold select-none leading-none">↓</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* Agradecimentos */}
      <section className="px-6 py-12">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Agradecimentos</h2>
        <p className="text-sm max-w-2xl leading-relaxed mb-6">
          Um agradecimento aos professores do primeiro ano do Mestrado em Comunicação de Ciência da FCSH-UNL, pelo seu papel fundamental na transmissão do pensamento crítico, científico e da ética colaborativa:
        </p>
        <p className="text-sm max-w-2xl leading-relaxed">
          Ana Sanchez; António Gomes da Costa; António Granado; Joana Lobo Antunes; Luís Veríssimo; Matilde Gonçalves
        </p>
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
