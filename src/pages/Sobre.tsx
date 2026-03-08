import { Link } from "react-router-dom";

const axes = [
  { emoji: "🧠", title: "SAÚDE MENTAL", desc: "Ansiedade, burnout, TDAH e bem-estar" },
  { emoji: "🥗", title: "ALIMENTAÇÃO", desc: "Nutrição, dietas e comportamentos alimentares" },
  { emoji: "🌿", title: "MENOPAUSA", desc: "Saúde feminina e hormonal" },
  { emoji: "📡", title: "EMERGENTES", desc: "Novos temas e alertas de saúde pública" },
];

const fontes = [
  { label: "Google Trends", desc: "Comportamento de pesquisa em Portugal" },
  { label: "13 RSS Feeds", desc: "RTP, Público, Expresso, JN, DN, TSF, SIC, Observador, CMJornal, DGS, Ordem dos Médicos, Polígrafo, Observador Fact-Check" },
  { label: "Supabase", desc: "Base de dados em tempo real" },
];

const paraQueServe = [
  "Identificar os temas de saúde mais pesquisados em Portugal",
  "Detectar sinais emergentes antes de chegarem aos media",
  "Cruzar picos de pesquisa com desinformação e facto-verificação",
  "Informar a escolha de temas para comunicação em saúde",
];

const agradecimentos = [
  "António Granado",
  "Matilde Gonçalves",
  "Luís Veríssimo",
  "Ana Sanchez",
  "Joana Lobo Antunes",
  "António Gomes da Costa",
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
              <span className="text-2xl">{axis.emoji}</span>
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] mt-4">
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

      {/* Fontes de dados */}
      <section className="px-6 py-12">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-8">Fontes de dados</h2>
        <div className="space-y-4 max-w-2xl">
          {fontes.map((f) => (
            <div key={f.label} className="flex gap-3">
              <span className="text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                — {f.label}
              </span>
              <span className="text-xs opacity-60 leading-relaxed">
                · {f.desc}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* Metodologia */}
      <section className="px-6 py-12">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Metodologia</h2>
        <div className="space-y-4 max-w-2xl text-sm leading-relaxed">
          <p>
            <span className="font-bold">Sinais emergentes:</span> crescimento semanal superior a 200% ou termos sem histórico no ano anterior.
          </p>
          <p>
            <span className="font-bold">Debunking</span> categorizado em: <span className="font-bold">FALSO</span> / <span className="font-bold">ENGANADOR</span> / <span className="font-bold">SEM EVIDÊNCIA</span> / <span className="font-bold">IMPRECISO</span>
          </p>
        </div>
      </section>

      <div className="section-divider" />

      {/* Agradecimentos */}
      <section className="px-6 py-12">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Agradecimentos</h2>
        <p className="text-sm max-w-2xl leading-relaxed mb-6">
          Um agradecimento aos professores do primeiro ano do Mestrado em Comunicação de Ciência da FCSH-UNL, pelo seu papel fundamental em abrir horizontes e na transmissão do pensamento científico e da ética colaborativa:
        </p>
        <div className="space-y-2 max-w-2xl">
          {agradecimentos.map((nome) => (
            <p key={nome} className="text-sm">— {nome}</p>
          ))}
        </div>
      </section>

      <div className="section-divider" />

      {/* Créditos */}
      <footer className="px-6 py-12">
        <p className="text-[10px] uppercase tracking-[0.15em] leading-relaxed opacity-50">
          Marta Madeira<br />
          Mestrado em Comunicação de Ciência<br />
          Faculdade de Ciências Sociais e Humanas<br />
          Universidade Nova de Lisboa · 2026
        </p>
      </footer>
    </div>
  );
};

export default Sobre;
