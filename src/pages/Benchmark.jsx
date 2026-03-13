import { useState, useEffect } from "react";

// ─── Seed data verbatim do benchmark-mestrado.docx ───────────────────────────
const SEED_DATA = [
  // ── BENCHMARK + ── Portais Nacionais ──────────────────────────────────────
  {
    id: "bn-1",
    sinal: "+",
    tipo: "Portal",
    ambito: "Nacional",
    nome: "DGS — Direcção-Geral da Saúde",
    link: "https://dgs.pt",
    descricao:
      "Autoridade de saúde pública que regula, orienta e coordena as políticas de saúde e vigilância epidemiológica. Entidade central do Ministério da Saúde.",
    col3: "• Conteúdo educativo e de saúde pública credível e relevante\n• Normas, orientações nacionais e campanhas de prevenção sazonais\n• Instagram com 90K+ seguidores e diversidade de formatos (vídeos, campanhas com figuras conhecidas)\n• Iniciativas como o catálogo digital dos alimentos",
    col4: "• Site com navegação pouco intuitiva e UX desactualizada\n• Velocidade de resposta a crises de desinformação abaixo do ritmo das redes sociais\n• Fraca presença no TikTok e YouTube",
  },
  {
    id: "bn-2",
    sinal: "+",
    tipo: "Portal",
    ambito: "Nacional",
    nome: "SNS — Serviço Nacional de Saúde",
    link: "https://sns.gov.pt",
    descricao:
      "Portal institucional do sistema de saúde português com informação para utentes e profissionais.",
    col3: "• Grande visibilidade institucional\n• Fonte de referência para utentes\n• Informação sobre direitos, prestadores e serviços",
    col4: "• Design e UX desactualizados\n• Conteúdo raramente optimizado para pesquisa ou partilha social\n• Pouca produção de conteúdo original de literacia",
  },
  {
    id: "bn-3",
    sinal: "+",
    tipo: "Portal",
    ambito: "Nacional",
    nome: "INSA — Instituto Nacional de Saúde Dr. Ricardo Jorge",
    link: "https://insa.min-saude.pt",
    descricao:
      "Laboratório do Estado com missão de investigação e saúde pública. Publica boletins epidemiológicos e dados sobre doenças infecciosas.",
    col3: "• Dados primários de referência com rigor técnico-científico reconhecido\n• Boletins epidemiológicos regulares (gripe, COVID, resistências)\n• Fonte primária para jornalistas especializados",
    col4: "• Comunicação excessivamente técnica\n• Pouca adaptação para públicos não especializados\n• Baixo impacto nas redes sociais",
  },
  {
    id: "bn-4",
    sinal: "+",
    tipo: "Portal",
    ambito: "Nacional",
    nome: "Polígrafo",
    link: "https://poligrafo.sapo.pt",
    descricao:
      "Plataforma de fact-checking independente, membro da IFCN. Verifica afirmações públicas em política, economia e saúde.",
    col3: "• Metodologia IFCN com transparência total no processo\n• Histórico pesquisável de fact-checks\n• Parceiro do Facebook/Meta para verificação de conteúdo em Portugal",
    col4: "• Cobertura de saúde irregular — foco maior em política\n• Recursos limitados face ao volume de desinformação\n• Pouca presença no TikTok e YouTube",
  },
  {
    id: "bn-5",
    sinal: "+",
    tipo: "Portal",
    ambito: "Nacional",
    nome: "CIMPLE / Sofia Pinto (NOVA FCT)",
    link: "https://cimple.eu",
    descricao:
      "Projecto europeu de investigação sobre desinformação em saúde com participação da NOVA FCT. Desenvolve ferramentas de detecção automática de desinformação.",
    col3: "• Abordagem científica e multidisciplinar com parceiros europeus\n• Tecnologia de detecção automática de claims de saúde\n• Publicações académicas de referência",
    col4: "• Produto ainda em fase de I&D com impacto público limitado\n• Sem produto final disponível para o cidadão comum",
  },
  {
    id: "bn-6",
    sinal: "+",
    tipo: "Portal",
    ambito: "Nacional",
    nome: "ERS — Entidade Reguladora da Saúde",
    link: "https://ers.pt",
    descricao:
      "Organismo regulador independente do sector da saúde. Fiscaliza prestadores e publicita informação sobre direitos dos utentes.",
    col3: "• Autoridade formal de supervisão com transparência nos relatórios\n• Plataforma de queixas acessível ao cidadão",
    col4: "• Comunicação institucional e pouco proactiva na esfera digital\n• Ausência de estratégia de comunicação em saúde pública",
  },
  {
    id: "bn-7",
    sinal: "+",
    tipo: "Portal",
    ambito: "Nacional",
    nome: "SPLS — Sociedade Portuguesa de Literacia em Saúde",
    link: "https://spls.pt",
    descricao:
      "Associação científica dedicada à promoção da literacia em saúde junto de profissionais e população.",
    col3: "• Missão focada exclusivamente em literacia\n• Produção de recursos educativos validados\n• Rede de profissionais de saúde e investigadores",
    col4: "• Alcance digital muito reduzido\n• Presença nas redes sociais ainda incipiente",
  },
  // ── BENCHMARK + ── Personas Nacionais ─────────────────────────────────────
  {
    id: "pn-1",
    sinal: "+",
    tipo: "Persona",
    ambito: "Nacional",
    nome: "David Marçal",
    link: "",
    descricao:
      "Investigador e comunicador científico, autor de Isto Não É Ciência. Principal referência nacional no debate sobre pseudociência e pensamento crítico.",
    col3: "• Comunicação acessível e bem-humorada com grande credibilidade pública\n• Activo no Twitter/X e com presença multicanal\n• Capacidade única de simplificar ciência sem perder rigor",
    col4: "• Foco mais amplo na pseudociência geral do que exclusivamente em saúde\n• Menor presença no TikTok/Instagram (plataformas de desinformação dominante)",
  },
  {
    id: "pn-2",
    sinal: "+",
    tipo: "Persona",
    ambito: "Nacional",
    nome: "Carlos Fiolhais",
    link: "",
    descricao:
      "Físico e divulgador científico, antigo director do Centro de Física da UC. Defensor do ensino científico e do pensamento crítico.",
    col3: "• Autoridade académica reconhecida e respeitada\n• Presença consistente nos media tradicionais e digitais\n• Intervenção regular em temas de desinformação e obscurantismo",
    col4: "• Menor enfoque em saúde especificamente\n• Perfil mais associado à física e educação científica geral",
  },
  {
    id: "pn-3",
    sinal: "+",
    tipo: "Persona",
    ambito: "Nacional",
    nome: "Margarida Graça Santos",
    link: "",
    descricao:
      "Jornalista especializada em saúde e ciência. Responsável por reportagens aprofundadas e verificadas na área da saúde pública.",
    col3: "• Rigor jornalístico com contextualização científica consistente\n• Cobertura de temas de saúde de forma aprofundada e responsável",
    col4: "• Alcance limitado às plataformas dos media onde trabalha\n• Sem presença própria independente nas redes sociais",
  },
  {
    id: "pn-4",
    sinal: "+",
    tipo: "Persona",
    ambito: "Nacional",
    nome: "Tânia Graça",
    link: "",
    descricao:
      "Nutricionista com presença digital activa e comunicação baseada em evidência. Combate activamente mitos alimentares nas redes sociais.",
    col3: "• Especialização clínica conjugada com comunicação digital eficaz\n• Linguagem acessível e próxima do público leigo\n• Combate sistemático a mitos de nutrição",
    col4: "• Alcance circunscrito à área de nutrição\n• Não cobre outras dimensões da saúde",
  },
  {
    id: "pn-5",
    sinal: "+",
    tipo: "Persona",
    ambito: "Nacional",
    nome: "Joana Gonçalves-Sá",
    link: "",
    descricao:
      "Investigadora do Instituto Gulbenkian de Ciência. Especialista em ciência de dados, comportamento humano e desinformação. Autora de Sociedade Demente e de artigos de alto impacto (PLOS Biology, Nature Human Behaviour).",
    col3: "• Produção científica de alto impacto com aplicação directa à comunicação pública de ciência\n• Traduz investigação académica em mensagens accionáveis\n• Visão interdisciplinar única: biologia + psicologia + ciências sociais\n• Intervenção pública frequente nos media sobre desinformação",
    col4: "• Perfil predominantemente académico com menor presença em plataformas populares\n• O impacto da investigação chega maioritariamente através de intermediários",
  },
  // ── BENCHMARK + ── Portais Internacionais ─────────────────────────────────
  {
    id: "bi-1",
    sinal: "+",
    tipo: "Portal",
    ambito: "Internacional",
    nome: "NHS — National Health Service (UK)",
    link: "https://nhs.uk",
    descricao:
      "Sistema de saúde público universal britânico. Um dos maiores produtores de informação de saúde baseada em evidências para cidadãos.",
    col3: "• 'Behind the Headlines': análise das notícias de saúde com contexto científico\n• UX exemplar — informação clara, acessível, actualizada e pesquisável\n• Fact-sheets partilháveis e guias de condição clínica para o cidadão",
    col4: "• Contexto específico do sistema de saúde britânico nem sempre transferível\n• Menor presença em TikTok e formatos de vídeo curto",
  },
  {
    id: "bi-2",
    sinal: "+",
    tipo: "Portal",
    ambito: "Internacional",
    nome: "Informed Health / IQWiG",
    link: "https://informedhealth.org",
    descricao:
      "Portal do Instituto alemão para Qualidade e Eficiência em Cuidados de Saúde. Referência europeia em informação médica independente e revisões sistemáticas acessíveis.",
    col3: "• Independência total de interesses comerciais e farmacêuticos\n• Revisões sistemáticas traduzidas para linguagem acessível ao público\n• Rigor metodológico de referência europeia",
    col4: "• Interface pouco apelativa visualmente\n• Menor presença nas redes sociais e formatos digitais modernos",
  },
  {
    id: "bi-3",
    sinal: "+",
    tipo: "Portal",
    ambito: "Internacional",
    nome: "Cochrane Library",
    link: "https://cochranelibrary.com",
    descricao:
      "Base de dados de revisões sistemáticas de referência mundial. O 'gold standard' da evidência médica sintetizada, publicada de forma aberta.",
    col3: "• Máximo rigor científico e transparência metodológica\n• Acesso aberto a sumários de revisões para o público\n• Referência mundial para profissionais e investigadores",
    col4: "• Linguagem altamente técnica, não adequada para comunicação directa com o público\n• Produção lenta face à velocidade das questões de saúde pública",
  },
  {
    id: "bi-4",
    sinal: "+",
    tipo: "Portal",
    ambito: "Internacional",
    nome: "Health Feedback",
    link: "https://healthfeedback.org",
    descricao:
      "Plataforma de fact-checking em saúde, membro da IFCN. Especializada exclusivamente em verificar afirmações de saúde com rede global de cientistas revisores.",
    col3: "• Especialização exclusiva em saúde — foco que o distingue dos fact-checkers generalistas\n• Rede global de cientistas como revisores voluntários\n• Metodologia IFCN transparente e replicável",
    col4: "• Volume de verificações limitado face à escala da desinformação\n• Foco maior no contexto anglófono",
  },
  {
    id: "bi-5",
    sinal: "+",
    tipo: "Portal",
    ambito: "Internacional",
    nome: "WHO Mythbusters",
    link: "https://who.int",
    descricao:
      "Secção de desmitificação da Organização Mundial da Saúde. Responde a mitos de saúde globais com comunicação visual e acessível.",
    col3: "• Autoridade global da OMS com alcance multinacional\n• Multilingue e visual, com conteúdo partilhável\n• Alto alcance orgânico e credibilidade institucional máxima",
    col4: "• Pode ser lento a reagir a mitos emergentes\n• Tom institucional pode limitar o engagement nos públicos mais jovens",
  },
  {
    id: "bi-6",
    sinal: "+",
    tipo: "Portal",
    ambito: "Internacional",
    nome: "Full Fact",
    link: "https://fullfact.org",
    descricao:
      "Organização britânica de fact-checking independente, pioneira em fact-checking automatizado. Cobre política, economia e saúde.",
    col3: "• Tecnologia de fact-checking automatizado — pioneira no sector\n• Transparência total e sem afiliações partidárias\n• Metodologia replicada por organizações noutros países",
    col4: "• Foco predominante no contexto britânico\n• Saúde é apenas uma das várias áreas cobertas",
  },
  // ── BENCHMARK + ── Personas Internacionais ────────────────────────────────
  {
    id: "pi-1",
    sinal: "+",
    tipo: "Persona",
    ambito: "Internacional",
    nome: "Doctor Mike (Mikhail Varshavski)",
    link: "",
    descricao:
      "Médico de família americano com 13M+ subscritores no YouTube. Combina entretenimento e informação médica verificada, respondendo activamente a mitos populares de saúde.",
    col3: "• Enorme alcance nas plataformas digitais (YouTube, Instagram, TikTok)\n• Formato apelativo que não sacrifica a credibilidade médica\n• Combate activo à desinformação com debunking em vídeo",
    col4: "• Formato de entretenimento pode diluir a profundidade científica\n• Contexto de saúde predominantemente americano",
  },
  {
    id: "pi-2",
    sinal: "+",
    tipo: "Persona",
    ambito: "Internacional",
    nome: "Eric Topol",
    link: "",
    descricao:
      "Cardiologista e cientista, director do Scripps Research Translational Institute. Referência global em medicina digital e IA aplicada à saúde. Autor de Deep Medicine.",
    col3: "• Rigor científico máximo com curadoria constante de literatura médica\n• Influência nos media especializados e na comunidade médica global\n• Comunicação clara sobre IA e o futuro da medicina",
    col4: "• Comunicação mais dirigida a profissionais e académicos do que ao público geral\n• Menor presença em formatos de vídeo popular",
  },
  {
    id: "pi-3",
    sinal: "+",
    tipo: "Persona",
    ambito: "Internacional",
    nome: "ZDoggMD (Zubin Damania)",
    link: "",
    descricao:
      "Médico americano e criador de conteúdo, conhecido por desafiar pseudociência e promover medicina baseada em evidência com tom irreverente.",
    col3: "• Tom irreverente e acessível que atinge audiências não convencionais\n• Posição firme e consistente contra desinformação médica\n• Grande audiência digital com elevado engagement",
    col4: "• Estilo polarizador pode alienar parte do público\n• Contexto principalmente americano",
  },
  // ── BENCHMARK − ── Portais Nacionais ──────────────────────────────────────
  {
    id: "bn-neg-1",
    sinal: "-",
    tipo: "Portal",
    ambito: "Nacional",
    nome: "IIPNL — Instituto Internacional de PNL",
    link: "https://iipnl.pt",
    descricao:
      "Instituto que promove a Programação Neurolinguística (PNL) como ferramenta de desenvolvimento pessoal e melhoria da saúde. A PNL não tem suporte científico robusto — é classificada como pseudociência pelo consenso académico.",
    col3: "• Aparência de legitimidade institucional com nome que imita organizações científicas\n• Terminologia técnica enganosa que simula linguagem científica\n• Associação a \"institutos\" e \"certificações\" sem validação académica",
    col4: "• Induz confiança em técnicas sem evidência aplicadas a problemas de saúde real\n• Dificulta distinção entre psicologia clínica validada e pseudoterapia\n• Combater: regulação mais clara das denominações; literacia sobre critérios de evidência em saúde mental",
  },
  {
    id: "bn-neg-2",
    sinal: "-",
    tipo: "Portal",
    ambito: "Nacional",
    nome: "Lei 45/2003 — Terapêuticas Não Convencionais",
    link: "https://dre.pt",
    descricao:
      "Caso sistémico: lei portuguesa que reconhece homeopatia, naturopatia, acupunctura, osteopatia, quiropraxia, naturopatia e fitoterapia como \"terapêuticas não convencionais\" com enquadramento profissional oficial.",
    col3: "• Legitimação legal de práticas sem evidência científica robusta\n• Criação de ordens profissionais que conferem aparência de equivalência à medicina convencional\n• Financiamento público indirecto e cobertura por alguns seguros de saúde",
    col4: "• Confunde cidadãos sobre a eficácia real destas práticas face a alternativas baseadas em evidência\n• Pode desviar doentes de tratamentos eficazes em situações de saúde grave\n• Combater: revisão legislativa baseada em evidência; comunicação pública clara sobre o que a evidência científica suporta",
  },
  // ── BENCHMARK − ── Personas Nacionais ─────────────────────────────────────
  {
    id: "pn-neg-1",
    sinal: "-",
    tipo: "Persona",
    ambito: "Nacional",
    nome: "Gustavo Santos",
    link: "",
    descricao:
      "Figura mediática portuguesa (conferencista, escritor, apresentador de TV) que promove conceitos de \"bem-estar\", espiritualidade e auto-ajuda misturados com afirmações de saúde sem base científica.",
    col3: "• Autoridade carismática amplificada por media mainstream (RTP, SIC)\n• Linguagem pseudo-científica que mistura terminologia real com afirmações sem fundamento\n• Apelo emocional forte e promessas de transformação pessoal",
    col4: "• Difusão de afirmações de saúde não verificadas para audiências massivas de televisão\n• Normalização de pseudociência com aparência de credibilidade cultural\n• Combater: fact-checking sistemático; educação pública sobre falácias de autoridade",
  },
  {
    id: "pn-neg-2",
    sinal: "-",
    tipo: "Persona",
    ambito: "Nacional",
    nome: "Manuel Pinto Coelho",
    link: "",
    descricao:
      "Médico português com posições sistematicamente contrárias ao consenso científico em vacinação, oncologia e medicina convencional. Fundou associações de \"medicina integrativa\" e tem presença regular nos media portugueses.",
    col3: "• Credencial médica usada para disseminar posições contra o consenso científico\n• Amplificação por media sem fact-checking adequado\n• Associação a redes internacionais antivax",
    col4: "• Hesitação vacinal em Portugal e desconfiança no sistema de saúde\n• Foi referência para movimentos antivax durante a pandemia COVID-19\n• Combater: desmistificação pública; realce do consenso científico; regulação do Código Deontológico da Ordem dos Médicos",
  },
  // ── BENCHMARK − ── Portais Internacionais ─────────────────────────────────
  {
    id: "bi-neg-1",
    sinal: "-",
    tipo: "Portal",
    ambito: "Internacional",
    nome: "Mercola.com",
    link: "https://mercola.com",
    descricao:
      "Site americano fundado por Joseph Mercola, médico osteopata. Considerado pela OMS e pelo Center for Countering Digital Hate como uma das principais fontes de desinformação em saúde online — parte do \"Disinformation Dozen\".",
    col3: "• Aparência de autoridade médica (fundador é médico licenciado)\n• Mistura estratégica de conteúdo verdadeiro com afirmações falsas para ganhar credibilidade\n• Modelo de negócio: venda de suplementos, livros e cursos sem evidência\n• Instagram, YouTube, Twitter e Facebook removeram/limitaram as suas contas\n• Acumulou mais de 3.6 milhões de seguidores antes das restrições",
    col4: "• Media Bias/Fact Check: avaliado como 'Quackery-level pseudoscience' com credibilidade baixa (2025)\n• Apesar das restrições, mantém site activo e newsletter com milhões de subscritores\n• Padrão de operação: publica artigo → artigo é removido → publica versão alterada → ciclo recomeça\n• Modelo replicável: foi referência de Manuel Pinto Coelho em Portugal",
  },
  {
    id: "bi-neg-2",
    sinal: "-",
    tipo: "Portal",
    ambito: "Internacional",
    nome: "Natural News",
    link: "https://naturalnews.com",
    descricao:
      "O segundo maior portal de \"saúde alternativa\" do mundo, fundado por Mike Adams (\"The Health Ranger\"). Rede de pelo menos 56 domínios documentada pelo Institute for Strategic Dialogue. Adams associado ao grupo de extrema-direita \"Oath Keepers\".",
    col3: "• Vai além da desinformação de saúde: integra teorias de conspiração política, negacionismo climático e racismo\n• SEO agressivo para maximizar alcance orgânico\n• Rede de dezenas de domínios para contornar banimentos",
    col4: "• Banido das principais plataformas mas continua activo em plataformas alternativas\n• Modelo replicável em múltiplos países e línguas\n• Combater: moderação consistente de plataformas; media literacy; desmonetização",
  },
  {
    id: "bi-neg-3",
    sinal: "-",
    tipo: "Portal",
    ambito: "Internacional",
    nome: "Goop",
    link: "https://goop.com",
    descricao:
      "Marca de wellness de Gwyneth Paltrow. Promove produtos e práticas sem evidência científica com estética de luxo. Várias sanções regulatórias nos EUA por publicidade enganosa em saúde.",
    col3: "• Associação a celebridade de alto perfil que confere credibilidade aspiracional\n• Estética de luxo que posiciona pseudociência como sofisticação\n• Monetização por produtos premium sem eficácia comprovada",
    col4: "• Normalização de pseudociência com aparência premium entre mulheres com elevado nível educacional e poder de compra\n• Cria mercado para produtos ineficazes e potencialmente perigosos\n• Combater: regulação de publicidade em saúde; fact-checking de produtos",
  },
  // ── BENCHMARK − ── Personas Internacionais ────────────────────────────────
  {
    id: "pi-neg-1",
    sinal: "-",
    tipo: "Persona",
    ambito: "Internacional",
    nome: "Robert F. Kennedy Jr.",
    link: "",
    descricao:
      "Político americano (ex-candidato presidencial, ex-Secretário de Saúde nomeado). Fundou a Children's Health Defense, classificada como principal organização antivax do mundo. Membro do \"Disinformation Dozen\".",
    col3: "• Credencial familiar (nome Kennedy) que confere legitimidade histórica ilegítima\n• Amplificação mediática massiva antes e durante administração Trump\n• Apelo à liberdade individual e desconfiança nas instituições como estratégia retórica",
    col4: "• Hesitação vacinal global — contributo directo para surtos de sarampo nos EUA\n• Desconfiança em FDA, CDC e agências de saúde a nível internacional\n• Combater: fact-checking sistemático; reforço da comunicação institucional transparente",
  },
];

const STORAGE_KEY = "benchmark_entries";

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return SEED_DATA;
}

function col3Label(sinal) {
  return sinal === "+" ? "BOAS PRÁTICAS" : "MECANISMOS DE DESINFORMAÇÃO";
}
function col4Label(sinal) {
  return sinal === "+" ? "FRAGILIDADES" : "IMPACTO / PARA COMBATER";
}

// ─── Card component ───────────────────────────────────────────────────────────
function BenchmarkCard({ entry, accentColor }) {
  const [open, setOpen] = useState(false);
  const mono = { fontFamily: "'Space Mono', 'Courier New', monospace" };
  const blue = "#0000FF";

  const bulletLines = (text) =>
    text.split("\n").filter(Boolean).map((line, i) => (
      <div key={i} style={{ ...mono, fontSize: "12px", lineHeight: "1.6", color: "#333", marginBottom: "4px" }}>
        {line}
      </div>
    ));

  return (
    <div
      style={{
        borderTop: `2px solid ${open ? accentColor : "#e5e5e5"}`,
        paddingTop: "14px",
        paddingBottom: "14px",
        borderBottom: "1px solid #f0f0f0",
        transition: "border-color 0.15s",
      }}
    >
      {/* Card header */}
      <div
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", cursor: "pointer", gap: "16px" }}
        onClick={() => setOpen(!open)}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <span
              style={{
                ...mono,
                fontSize: "9px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "2px 7px",
                border: `1px solid ${accentColor}`,
                color: accentColor,
                fontWeight: 700,
              }}
            >
              {entry.tipo}
            </span>
            {entry.link && (
              <a
                href={entry.link}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{ ...mono, fontSize: "9px", color: blue, letterSpacing: "0.06em", textDecoration: "underline" }}
              >
                {entry.link.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>
          <h3
            style={{
              ...mono,
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.04em",
              margin: 0,
              textTransform: "uppercase",
              color: "#000",
            }}
          >
            {entry.nome}
          </h3>
          {!open && (
            <p style={{ ...mono, fontSize: "11px", color: "#666", margin: "6px 0 0", lineHeight: 1.5 }}>
              {entry.descricao.slice(0, 100)}{entry.descricao.length > 100 ? "…" : ""}
            </p>
          )}
        </div>
        <div
          style={{
            ...mono,
            fontSize: "16px",
            color: "#999",
            paddingTop: "2px",
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            userSelect: "none",
          }}
        >
          ↓
        </div>
      </div>

      {/* Expanded content */}
      {open && (
        <div style={{ marginTop: "16px" }}>
          <p style={{ ...mono, fontSize: "12px", color: "#333", lineHeight: 1.65, marginBottom: "18px" }}>
            {entry.descricao}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <div
                style={{
                  ...mono,
                  fontSize: "9px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  color: accentColor,
                  borderBottom: `1px solid ${accentColor}`,
                  paddingBottom: "4px",
                  marginBottom: "10px",
                }}
              >
                {col3Label(entry.sinal)}
              </div>
              {bulletLines(entry.col3)}
            </div>
            <div>
              <div
                style={{
                  ...mono,
                  fontSize: "9px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  color: "#666",
                  borderBottom: "1px solid #ccc",
                  paddingBottom: "4px",
                  marginBottom: "10px",
                }}
              >
                {col4Label(entry.sinal)}
              </div>
              {bulletLines(entry.col4)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section component ────────────────────────────────────────────────────────
function Section({ title, entries, accentColor }) {
  const mono = { fontFamily: "'Space Mono', 'Courier New', monospace" };
  if (!entries.length) return null;

  return (
    <div style={{ marginBottom: "40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <div style={{ flex: 1, height: "1px", background: "#e5e5e5" }} />
        <span
          style={{
            ...mono,
            fontSize: "9px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#999",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </span>
        <div style={{ flex: 1, height: "1px", background: "#e5e5e5" }} />
      </div>
      {entries.map((e) => (
        <BenchmarkCard key={e.id} entry={e} accentColor={accentColor} />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BenchmarkPage() {
  const [entries] = useState(loadEntries);
  const [activeSinal, setActiveSinal] = useState("+");
  const [activeAmbito, setActiveAmbito] = useState("ALL");

  const mono = { fontFamily: "'Space Mono', 'Courier New', monospace" };
  const blue = "#0000FF";
  const green = "#16a34a";
  const red = "#dc2626";

  const accentColor = activeSinal === "+" ? green : red;

  const filtered = entries.filter((e) => {
    if (e.sinal !== activeSinal) return false;
    if (activeAmbito !== "ALL" && e.ambito !== activeAmbito) return false;
    return true;
  });

  const portaisNac = filtered.filter((e) => e.tipo === "Portal" && e.ambito === "Nacional");
  const personasNac = filtered.filter((e) => e.tipo === "Persona" && e.ambito === "Nacional");
  const portaisInt = filtered.filter((e) => e.tipo === "Portal" && e.ambito === "Internacional");
  const personasInt = filtered.filter((e) => e.tipo === "Persona" && e.ambito === "Internacional");

  const totalFiltered = filtered.length;
  const totalAll = entries.filter((e) => e.sinal === activeSinal).length;

  return (
    <div
      style={{
        maxWidth: "860px",
        margin: "0 auto",
        padding: "48px 24px 80px",
        background: "#fff",
        minHeight: "100vh",
      }}
    >
      {/* Page header */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "8px" }}>
          <h1
            style={{
              ...mono,
              fontSize: "11px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              margin: 0,
              color: "#000",
              fontWeight: 700,
            }}
          >
            REPORTAGEM VIVA
          </h1>
          <span style={{ ...mono, fontSize: "11px", color: "#999", letterSpacing: "0.1em" }}>/ BENCHMARK</span>
        </div>
        <p
          style={{
            ...mono,
            fontSize: "11px",
            color: "#666",
            margin: 0,
            lineHeight: 1.6,
            maxWidth: "520px",
          }}
        >
          Mapeamento do ecossistema de referências e vectores de desinformação em saúde — portais e personas nacionais e internacionais.
        </p>
      </div>

      {/* Toggle Benchmark + / − */}
      <div style={{ display: "flex", gap: "0", marginBottom: "24px", border: "1px solid #000", width: "fit-content" }}>
        {[
          { value: "+", label: "BENCHMARK +" },
          { value: "-", label: "BENCHMARK −" },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveSinal(value)}
            style={{
              ...mono,
              fontSize: "11px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "10px 24px",
              border: "none",
              borderRight: value === "+" ? "1px solid #000" : "none",
              cursor: "pointer",
              fontWeight: activeSinal === value ? 700 : 400,
              background: activeSinal === value ? (value === "+" ? green : red) : "#fff",
              color: activeSinal === value ? "#fff" : "#000",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Âmbito filter */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "32px" }}>
        {["ALL", "Nacional", "Internacional"].map((a) => (
          <button
            key={a}
            onClick={() => setActiveAmbito(a)}
            style={{
              ...mono,
              fontSize: "10px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "5px 14px",
              cursor: "pointer",
              border: "1px solid",
              borderColor: activeAmbito === a ? accentColor : "#ccc",
              background: activeAmbito === a ? accentColor : "#fff",
              color: activeAmbito === a ? "#fff" : "#666",
              fontWeight: activeAmbito === a ? 700 : 400,
              transition: "all 0.15s",
            }}
          >
            {a === "ALL" ? "TODOS" : a.toUpperCase()}
          </button>
        ))}
        <span style={{ ...mono, fontSize: "10px", color: "#ccc", alignSelf: "center", marginLeft: "8px" }}>
          {totalFiltered === totalAll ? `${totalAll} entradas` : `${totalFiltered} / ${totalAll}`}
        </span>
      </div>

      {/* Description line */}
      <div
        style={{
          ...mono,
          fontSize: "10px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: accentColor,
          borderLeft: `3px solid ${accentColor}`,
          paddingLeft: "12px",
          marginBottom: "36px",
          lineHeight: 1.5,
        }}
      >
        {activeSinal === "+"
          ? "Referências positivas — portais e comunicadores que produzem informação de saúde credível, baseada em evidência."
          : "Vectores de desinformação — portais e figuras que disseminam informação de saúde falsa ou enganosa."}
      </div>

      {/* Sections: Nacional */}
      {(activeAmbito === "ALL" || activeAmbito === "Nacional") && (
        <div style={{ marginBottom: "48px" }}>
          {(activeAmbito === "ALL") && (
            <div
              style={{
                ...mono,
                fontSize: "10px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#000",
                fontWeight: 700,
                marginBottom: "24px",
                paddingBottom: "8px",
                borderBottom: "2px solid #000",
              }}
            >
              NACIONAL
            </div>
          )}
          <Section title="PORTAIS" entries={portaisNac} accentColor={accentColor} />
          <Section title="PERSONAS" entries={personasNac} accentColor={accentColor} />
        </div>
      )}

      {/* Sections: Internacional */}
      {(activeAmbito === "ALL" || activeAmbito === "Internacional") && (
        <div style={{ marginBottom: "48px" }}>
          {(activeAmbito === "ALL") && (
            <div
              style={{
                ...mono,
                fontSize: "10px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#000",
                fontWeight: 700,
                marginBottom: "24px",
                paddingBottom: "8px",
                borderBottom: "2px solid #000",
              }}
            >
              INTERNACIONAL
            </div>
          )}
          <Section title="PORTAIS" entries={portaisInt} accentColor={accentColor} />
          <Section title="PERSONAS" entries={personasInt} accentColor={accentColor} />
        </div>
      )}

      {filtered.length === 0 && (
        <div style={{ ...mono, fontSize: "11px", color: "#ccc", textAlign: "center", padding: "48px 0", letterSpacing: "0.08em" }}>
          Nenhuma entrada para este filtro.
        </div>
      )}

      {/* Footer note */}
      <div
        style={{
          ...mono,
          fontSize: "9px",
          color: "#ccc",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          borderTop: "1px solid #f0f0f0",
          paddingTop: "20px",
          marginTop: "40px",
        }}
      >
        Dados carregados de localStorage (chave: {STORAGE_KEY}).
        Gerido em /admin → tab BENCHMARK.
      </div>
    </div>
  );
}
