import { useState } from "react";

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
    col3: "• Único fact-checker português certificado pelo IFCN\n• Elevado volume de verificações publicadas\n• Formato televisivo semanal e presença em múltiplas plataformas (SIC)",
    col4: "• Cobertura de saúde irregular e reactiva\n• Formato de verificação pode ser pouco acessível para públicos com baixa literacia\n• Menor investimento em conteúdo explicativo ou preventivo",
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
    col3: "• Investigação aplicada com componente tecnológica inovadora\n• Parceria europeia multi-institucional\n• Potencial para ferramentas de monitorização em tempo real",
    col4: "• Projecto académico com pouca visibilidade pública\n• Output orientado para papers e não para comunicação directa\n• Sem presença relevante em redes sociais",
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
    col3: "• Fonte oficial de regulação e fiscalização\n• Publicação de estudos e relatórios sobre acesso e qualidade\n• Independência institucional",
    col4: "• Comunicação excessivamente técnica e burocrática\n• Pouca presença digital e nenhuma estratégia de conteúdo\n• Informação difícil de navegar para o cidadão comum",
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
    col3: "• Foco exclusivo em literacia em saúde\n• Organização de eventos e formações\n• Ponte entre academia e prática clínica",
    col4: "• Baixa visibilidade pública e digital\n• Produção de conteúdo irregular\n• Pouco impacto fora do meio académico",
  },
  // ── BENCHMARK + ── Personas Nacionais ─────────────────────────────────────
  {
    id: "bn-8",
    sinal: "+",
    tipo: "Persona",
    ambito: "Nacional",
    nome: "David Marçal",
    link: "",
    descricao:
      "Investigador e comunicador científico, autor de Isto Não É Ciência. Principal referência nacional no debate sobre pseudociência e pensamento crítico.",
    col3: "• Reconhecido como voz credível no combate à pseudociência\n• Autor de livros de divulgação científica de referência\n• Presença regular em media (rádio, televisão, imprensa)",
    col4: "• Abordagem por vezes académica, menos acessível a públicos menos informados\n• Pouca presença em plataformas digitais de grande alcance (TikTok, YouTube)\n• Foco mais em pseudociência geral do que especificamente em saúde",
  },
  {
    id: "bn-9",
    sinal: "+",
    tipo: "Persona",
    ambito: "Nacional",
    nome: "Carlos Fiolhais",
    link: "",
    descricao:
      "Físico e divulgador científico, antigo director do Centro de Física da UC. Defensor do ensino científico e do pensamento crítico.",
    col3: "• Grande reconhecimento público e institucional\n• Autor prolífico de livros de divulgação científica\n• Voz respeitada em debates públicos sobre ciência e educação",
    col4: "• Comunicação maioritariamente em formatos tradicionais (livros, conferências)\n• Menor presença em redes sociais e formatos digitais\n• Foco generalista, menos centrado em saúde",
  },
  {
    id: "bn-10",
    sinal: "+",
    tipo: "Persona",
    ambito: "Nacional",
    nome: "Margarida Graça Santos",
    link: "",
    descricao:
      "Jornalista especializada em saúde e ciência. Responsável por reportagens aprofundadas e verificadas na área da saúde pública.",
    col3: "• Jornalismo de saúde rigoroso e aprofundado\n• Capacidade de traduzir temas complexos para linguagem acessível\n• Experiência em investigação jornalística na área da saúde",
    col4: "• Alcance limitado ao público leitor de imprensa\n• Pouca presença em redes sociais ou formatos digitais\n• Produção condicionada pelo meio onde publica",
  },
  {
    id: "bn-11",
    sinal: "+",
    tipo: "Persona",
    ambito: "Nacional",
    nome: "Tânia Graça",
    link: "",
    descricao:
      "Nutricionista com presença digital activa e comunicação baseada em evidência. Combate activamente mitos alimentares nas redes sociais.",
    col3: "• Comunicação acessível e baseada em evidência\n• Forte presença no Instagram com conteúdo educativo\n• Combate directo a mitos alimentares populares",
    col4: "• Foco restrito à nutrição\n• Alcance limitado a um segmento demográfico específico\n• Vulnerável a ataques e pressão de indústrias alimentares",
  },
  {
    id: "bn-12",
    sinal: "+",
    tipo: "Persona",
    ambito: "Nacional",
    nome: "Joana Gonçalves-Sá",
    link: "",
    descricao:
      "Investigadora do Instituto Gulbenkian de Ciência. Especialista em ciência de dados, comportamento humano e desinformação. Autora de Sociedade Demente e de artigos de alto impacto (PLOS Biology, Nature Human Behaviour).",
    col3: "• Investigação de referência internacional sobre desinformação\n• Capacidade de comunicação pública excepcional\n• Presença regular em media e debates públicos",
    col4: "• Output primário em formato académico\n• Menor presença em redes sociais de grande alcance\n• Foco mais em análise sistémica do que em resposta directa a mitos",
  },
  // ── BENCHMARK + ── Portais Internacionais ─────────────────────────────────
  {
    id: "bn-13",
    sinal: "+",
    tipo: "Portal",
    ambito: "Internacional",
    nome: "NHS — National Health Service (UK)",
    link: "https://nhs.uk",
    descricao:
      "Sistema de saúde público universal britânico. Um dos maiores produtores de informação de saúde baseada em evidências para cidadãos.",
    col3: "• Conteúdo de saúde vasto, actualizado e acessível\n• Design e UX de referência mundial\n• Optimização para pesquisa (SEO) exemplar\n• Integração com serviços de saúde reais",
    col4: "• Conteúdo em inglês, sem tradução para português\n• Contexto regulatório e farmacológico diferente do português\n• Pode ser difícil de adaptar directamente",
  },
  {
    id: "bn-14",
    sinal: "+",
    tipo: "Portal",
    ambito: "Internacional",
    nome: "Informed Health / IQWiG",
    link: "https://informedhealth.org",
    descricao:
      "Portal do Instituto alemão para Qualidade e Eficiência em Cuidados de Saúde. Referência europeia em informação médica independente e revisões sistemáticas acessíveis.",
    col3: "• Conteúdo baseado em revisões sistemáticas e evidência forte\n• Linguagem acessível para não-especialistas\n• Independência editorial e financiamento público\n• Disponível em inglês e alemão",
    col4: "• Pouca visibilidade fora da Europa Central\n• Sem presença significativa em redes sociais\n• Actualizações podem ser lentas",
  },
  {
    id: "bn-15",
    sinal: "+",
    tipo: "Portal",
    ambito: "Internacional",
    nome: "Cochrane Library",
    link: "https://cochranelibrary.com",
    descricao:
      "Base de dados de revisões sistemáticas de referência mundial. O 'gold standard' da evidência médica sintetizada, publicada de forma aberta.",
    col3: "• Padrão-ouro de evidência médica sintetizada\n• Revisões independentes e metodologicamente rigorosas\n• Acesso aberto a resumos em linguagem simples\n• Rede global de investigadores",
    col4: "• Conteúdo altamente técnico para o público geral\n• Linguagem simples ainda demasiado complexa para muitos leitores\n• Lentidão na publicação de novas revisões",
  },
  {
    id: "bn-16",
    sinal: "+",
    tipo: "Portal",
    ambito: "Internacional",
    nome: "UpToDate",
    link: "https://uptodate.com",
    descricao:
      "Ferramenta de apoio à decisão clínica baseada em evidências. Utilizada por profissionais de saúde em todo o mundo.",
    col3: "• Conteúdo clínico actualizado e baseado em evidências\n• Utilizado por médicos em todo o mundo\n• Recomendações práticas e aplicáveis",
    col4: "• Acesso pago (não acessível ao público geral)\n• Conteúdo orientado para profissionais, não para cidadãos\n• Não produz conteúdo de divulgação",
  },
  {
    id: "bn-17",
    sinal: "+",
    tipo: "Portal",
    ambito: "Internacional",
    nome: "Snopes Health",
    link: "https://snopes.com",
    descricao:
      "Secção de saúde da maior plataforma de fact-checking dos EUA. Verifica rumores, mitos e desinformação relacionados com saúde.",
    col3: "• Vasta base de verificações de mitos de saúde\n• Metodologia transparente e fontes citadas\n• Grande reconhecimento e visibilidade internacional",
    col4: "• Foco no contexto norte-americano\n• Nem sempre cobre temas relevantes para o contexto europeu ou português\n• Formato de artigo longo pode ser pouco acessível",
  },
  {
    id: "bn-18",
    sinal: "+",
    tipo: "Portal",
    ambito: "Internacional",
    nome: "Full Fact Health",
    link: "https://fullfact.org",
    descricao:
      "Organização de fact-checking britânica certificada pela IFCN. Verifica alegações de saúde no contexto político e mediático do Reino Unido.",
    col3: "• Verificações rigorosas e baseadas em evidências\n• Certificação IFCN\n• Colaboração com plataformas digitais para reduzir desinformação",
    col4: "• Foco no contexto britânico\n• Cobertura de saúde não é o foco principal\n• Pouca produção de conteúdo educativo preventivo",
  },
  {
    id: "bn-19",
    sinal: "+",
    tipo: "Portal",
    ambito: "Internacional",
    nome: "Maldita Ciencia",
    link: "https://maldita.es/malditaciencia",
    descricao:
      "Secção científica da Maldita.es, plataforma de fact-checking espanhola. Verifica mitos e desinformação em saúde e ciência.",
    col3: "• Conteúdo em espanhol (proximidade linguística)\n• Forte presença em redes sociais e WhatsApp\n• Modelo participativo (cidadãos enviam dúvidas)\n• Certificação IFCN",
    col4: "• Foco no contexto espanhol\n• Nem todos os temas são directamente aplicáveis ao contexto português\n• Volume elevado pode diluir a profundidade",
  },
  // ── BENCHMARK + ── Personas Internacionais ────────────────────────────────
  {
    id: "bn-20",
    sinal: "+",
    tipo: "Persona",
    ambito: "Internacional",
    nome: "Timothy Caulfield",
    link: "",
    descricao:
      "Professor de Direito e Política de Saúde (U. Alberta). Autor de Is Gwyneth Paltrow Wrong About Everything? Referência global no combate à pseudociência e wellness culture.",
    col3: "• Referência global no combate à pseudociência em saúde\n• Capacidade excepcional de comunicação pública\n• Presença forte no Twitter/X e em documentários\n• Autor de livros de grande circulação",
    col4: "• Contexto norte-americano/canadiano\n• Conteúdo exclusivamente em inglês\n• Foco mais em wellness culture do que em desinformação clínica",
  },
  {
    id: "bn-21",
    sinal: "+",
    tipo: "Persona",
    ambito: "Internacional",
    nome: "Sander van der Linden",
    link: "",
    descricao:
      "Professor de Psicologia Social (Cambridge). Investigador em inoculação psicológica contra desinformação. Autor de Foolproof. Cocriador do jogo GoViral!",
    col3: "• Investigação de referência em inoculação contra desinformação\n• Ferramentas práticas e escaláveis (jogos, intervenções)\n• Publicações de alto impacto e reconhecimento internacional",
    col4: "• Output primariamente académico\n• Ferramentas em inglês e nem sempre adaptadas culturalmente\n• Menor foco específico em saúde",
  },
  {
    id: "bn-22",
    sinal: "+",
    tipo: "Persona",
    ambito: "Internacional",
    nome: "Wen-Ying Sylvia Chou (NCI / NIH)",
    link: "",
    descricao:
      "Programme Director no National Cancer Institute (NIH). Especialista em comunicação de saúde, literacia digital e equidade no acesso à informação.",
    col3: "• Investigação institucional de alto nível em comunicação de saúde\n• Foco em equidade e populações vulneráveis\n• Ligação directa entre investigação e política pública",
    col4: "• Contexto institucional norte-americano\n• Output em formato académico e institucional\n• Pouca visibilidade pública directa",
  },
  // ── BENCHMARK − ── Portais Nacionais ──────────────────────────────────────
  {
    id: "bm-1",
    sinal: "-",
    tipo: "Portal",
    ambito: "Nacional",
    nome: "Notícias Viriato",
    link: "https://noticiasviriato.pt",
    descricao:
      "Site de desinformação que mistura notícias reais com conteúdo fabricado ou distorcido, frequentemente com viés político e anti-sistema.",
    col3: "• Uso de manchetes sensacionalistas e clickbait\n• Mistura de notícias reais com conteúdo fabricado\n• Exploração de medos e desconfiança institucional\n• SEO agressivo para captar tráfego de pesquisa",
    col4: "• Erosão da confiança em instituições de saúde\n• Amplificação de teorias da conspiração\n• Difícil de combater por aparentar ser fonte noticiosa legítima",
  },
  {
    id: "bm-2",
    sinal: "-",
    tipo: "Portal",
    ambito: "Nacional",
    nome: "Páginas de 'saúde natural' no Facebook",
    link: "",
    descricao:
      "Rede de páginas e grupos no Facebook que promovem tratamentos alternativos não validados, anti-vacinação e desconfiança na medicina convencional.",
    col3: "• Exploração de algoritmos de redes sociais para viralidade\n• Apelo emocional e testemunhos pessoais como 'prova'\n• Criação de comunidades fechadas que reforçam crenças\n• Monetização através de produtos e serviços não regulados",
    col4: "• Risco directo para a saúde pública (anti-vacinação, abandono de tratamentos)\n• Difícil de monitorizar e combater pela natureza descentralizada\n• Criação de bolhas informativas difíceis de penetrar",
  },
  // ── BENCHMARK − ── Personas Nacionais ─────────────────────────────────────
  {
    id: "bm-3",
    sinal: "-",
    tipo: "Persona",
    ambito: "Nacional",
    nome: "Influenciadores de 'wellness' sem formação",
    link: "",
    descricao:
      "Figuras com presença digital significativa que promovem conselhos de saúde, nutrição e bem-estar sem qualificações profissionais ou base científica.",
    col3: "• Linguagem acessível e emocional que ressoa com o público\n• Uso eficaz de formatos visuais (stories, reels, vídeos curtos)\n• Construção de comunidade e confiança pessoal\n• Monetização de produtos e serviços associados",
    col4: "• Disseminação de informação incorrecta com aparência de autoridade\n• Promoção de produtos sem evidência científica\n• Desvalorização de profissionais de saúde qualificados\n• Difícil de regular por operar numa zona cinzenta",
  },
  // ── BENCHMARK − ── Portais Internacionais ─────────────────────────────────
  {
    id: "bm-4",
    sinal: "-",
    tipo: "Portal",
    ambito: "Internacional",
    nome: "Natural News",
    link: "https://naturalnews.com",
    descricao:
      "Um dos maiores sites de desinformação em saúde a nível mundial. Promove anti-vacinação, curas milagrosas e teorias da conspiração sobre a indústria farmacêutica.",
    col3: "• Produção massiva de conteúdo optimizado para pesquisa\n• Ecossistema de sites e redes sociais interligados\n• Exploração de desconfiança na 'Big Pharma'\n• Tradução e adaptação para múltiplos idiomas",
    col4: "• Impacto global na saúde pública\n• Modelo de negócio baseado na venda de suplementos não regulados\n• Baneado de múltiplas plataformas mas continua a operar\n• Serve de fonte para sites de desinformação nacionais",
  },
  {
    id: "bm-5",
    sinal: "-",
    tipo: "Portal",
    ambito: "Internacional",
    nome: "Mercola.com",
    link: "https://mercola.com",
    descricao:
      "Site pessoal de Joseph Mercola, osteopata norte-americano. Identificado pela FDA e pela NYT como uma das maiores fontes de desinformação sobre vacinas e COVID-19.",
    col3: "• Aparência profissional e pseudo-científica\n• Citação selectiva de estudos para sustentar narrativas\n• Newsletter com milhões de subscritores\n• Monetização através de loja online de suplementos",
    col4: "• Erosão directa da confiança em vacinas e medicina baseada em evidências\n• Modelo replicado por dezenas de sites semelhantes\n• Conteúdo traduzido e partilhado em português\n• Difícil de combater pela aparência de legitimidade",
  },
  // ── BENCHMARK − ── Personas Internacionais ────────────────────────────────
  {
    id: "bm-6",
    sinal: "-",
    tipo: "Persona",
    ambito: "Internacional",
    nome: "Robert F. Kennedy Jr.",
    link: "",
    descricao:
      "Advogado e activista anti-vacinas, fundador da Children's Health Defense. Uma das figuras mais influentes do movimento anti-vacinação a nível global.",
    col3: "• Capacidade de mobilização política e mediática\n• Uso de linguagem de 'liberdade de escolha' e direitos individuais\n• Exploração de casos reais de efeitos adversos para generalizar\n• Financiamento significativo para campanhas anti-vacinas",
    col4: "• Impacto directo na hesitação vacinal global\n• Influência política crescente (candidatura presidencial)\n• Modelo de comunicação replicado por movimentos locais\n• Legitimação de narrativas anti-ciência em contexto político",
  },
  {
    id: "bm-7",
    sinal: "-",
    tipo: "Persona",
    ambito: "Internacional",
    nome: "Andrew Wakefield",
    link: "",
    descricao:
      "Ex-médico britânico, autor do estudo fraudulento de 1998 que associou a vacina MMR ao autismo. Radiado da Ordem dos Médicos e reconhecido como uma das figuras mais destrutivas na história da saúde pública.",
    col3: "• Estudo original criou narrativa persistente apesar de retractado\n• Transição para documentários e media alternativos (Vaxxed)\n• Figura simbólica do movimento anti-vacinas global\n• Modelo de 'médico dissidente' replicado por outros",
    col4: "• Dano incalculável à confiança pública em vacinas\n• Responsável por surtos de sarampo evitáveis\n• Narrativa 'médico censurado pela indústria' persiste\n• Continua activo e influente apesar da desacreditação",
  },
  {
    id: "bm-8",
    sinal: "-",
    tipo: "Persona",
    ambito: "Internacional",
    nome: "Joseph Mercola",
    link: "https://mercola.com",
    descricao: "Osteopata norte-americano e um dos maiores disseminadores individuais de desinformação em saúde a nível global. Identificado pela FDA e pelo New York Times como fonte central de desinformação sobre vacinas e COVID-19. Opera um ecossistema de conteúdo pseudo-científico associado a uma loja de suplementos.",
    col3: "• Aparência profissional e pseudo-científica que confere falsa credibilidade\n• Citação selectiva de estudos para sustentar narrativas\n• Newsletter com milhões de subscritores em todo o mundo\n• Monetização directa através de loja online de suplementos não regulados",
    col4: "• Erosão da confiança em vacinas e medicina baseada em evidências\n• Modelo replicado por dezenas de sites semelhantes em vários países\n• Conteúdo traduzido e amplamente partilhado em português\n• Difícil de combater pela aparência de legitimidade científica",
  },
  {
    id: "bm-9",
    sinal: "-",
    tipo: "Persona",
    ambito: "Internacional",
    nome: "Stephanie Seneff",
    link: "",
    descricao: "Investigadora do MIT na área de computação que extrapolou a sua autoridade académica para nutrição e vacinas sem formação na área. Promove teorias sem base científica sobre glifosato e autismo, sendo um caso paradigmático de authority spillover — usar credenciais numa área para legitimar afirmações noutra.",
    col3: "• Credenciais do MIT usadas para conferir legitimidade a afirmações fora da sua área\n• Publicação em revistas de acesso aberto com revisão por pares deficiente\n• Linguagem técnica que dificulta a refutação por públicos não especializados\n• Citada extensivamente em comunidades anti-vacinas como 'prova científica'",
    col4: "• Ilustra o perigo do prestígio académico usado fora do domínio de competência\n• Narrativas sobre glifosato e autismo persistem apesar de múltiplas refutações\n• Modelo de desinformação com aparência de rigor que é particularmente difícil de combater\n• Relevante para discussão de literacia científica e avaliação de fontes",
  },
  {
    id: "bm-10",
    sinal: "-",
    tipo: "Persona",
    ambito: "Internacional",
    nome: "Sherri Tenpenny",
    link: "",
    descricao: "Osteopata americana e uma das figuras centrais do movimento anti-vacinas global. Autora de livros e cursos pagos sobre 'perigos das vacinas', com presença em múltiplos países incluindo via tradução de conteúdo para português. Afirmou em audição no Congresso dos EUA que vacinas COVID-19 magnetizavam o corpo humano.",
    col3: "• Monetização extensiva através de livros, cursos e consultas pagas\n• Rede internacional de distribuição de conteúdo anti-vacinas\n• Conteúdo activamente traduzido e partilhado em comunidades lusófonas\n• Apelo emocional a pais preocupados com a saúde dos filhos",
    col4: "• Contribui directamente para a hesitação vacinal em Portugal via conteúdo traduzido\n• Modelo de negócio baseado na amplificação do medo\n• Relevante para contextualizar o movimento anti-vacinas em Portugal\n• Para combater: fact-checking proactivo e formação de profissionais de saúde",
  },
  {
    id: "bm-11",
    sinal: "-",
    tipo: "Persona",
    ambito: "Internacional",
    nome: "Didier Raoult",
    link: "",
    descricao: "Virologista francês de renome que se tornou figura de desinformação durante a COVID-19 ao promover a hidroxicloroquina como cura sem evidência suficiente. Caso paradigmático de um cientista credenciado que entra em conflito com o consenso científico por razões de ego e visibilidade, com impacto directo em políticas de saúde pública.",
    col3: "• Credenciais científicas excepcionais usadas para desafiar o consenso com autoridade\n• Enorme visibilidade mediática em França e internacionalmente\n• Discurso de 'médico corajoso contra o sistema' com forte apelo emocional\n• Publicação acelerada de estudos metodologicamente fracos durante a pandemia",
    col4: "• Influenciou directamente políticas de saúde em França e noutros países\n• Ilustra como cientistas credenciados podem tornar-se vectores de desinformação\n• Caso de estudo fundamental para literacia científica e avaliação de consenso\n• Para combater: distinção entre opinião de especialista e consenso científico",
  },
  {
    id: "bm-12",
    sinal: "-",
    tipo: "Persona",
    ambito: "Internacional",
    nome: "Mehmet Oz (Dr. Oz)",
    link: "",
    descricao: "Cirurgião cardíaco norte-americano reconvertido a apresentador televisivo e promotor de curas, dietas e suplementos sem evidência científica. Modelo global de celebrity medicine — uso de credenciais médicas para promover produtos e conteúdo pseudo-científico com alcance massivo. Condenado pelo Senado dos EUA por publicidade enganosa.",
    col3: "• Credenciais de cirurgião cardíaco de Columbia University usadas como escudo de credibilidade\n• Programa televisivo com audiências de milhões durante mais de uma década\n• Linguagem acessível e emocional que ressoa com públicos vulneráveis\n• Modelo de negócio baseado em parcerias com fabricantes de suplementos",
    col4: "• Define o modelo de celebrity medicine replicado por influenciadores de saúde em todo o mundo\n• Normaliza a promoção de produtos sem evidência por profissionais de saúde\n• Relevante para discutir conflitos de interesse e ética na comunicação médica\n• Para combater: regulação de comunicação médica em contextos comerciais",
  },
  {
    id: "bm-13",
    sinal: "-",
    tipo: "Persona",
    ambito: "Internacional",
    nome: "Gwyneth Paltrow",
    link: "https://goop.com",
    descricao: "Actriz norte-americana fundadora da Goop, empresa de wellness que se tornou referência global na comercialização de pseudo-ciência em saúde. Promoveu ovos de jade vaginais, vapores vaginais, suplementos sem evidência e terapias não validadas, sendo processada e condenada por publicidade enganosa. Figura fundadora da era moderna do celebrity wellness.",
    col3: "• Marca Goop com receitas de centenas de milhões de dólares assente em produtos sem evidência\n• Linguagem de 'empoderamento feminino' e 'escuta do corpo' que legitima afirmações sem base científica\n• Produção de conteúdo editorial (newsletter, podcast, série Netflix) que confere aparência de credibilidade\n• Condenada pela FTC e paga multa por alegações enganosas sobre produtos",
    col4: "• Define o modelo de celebrity wellness replicado globalmente por influenciadores de saúde\n• Normaliza a desconfiança na medicina convencional em nome da 'medicina integrativa'\n• Público-alvo são mulheres com elevado poder de compra e escolaridade — contradiz o mito de que a desinformação afecta apenas populações com menos literacia\n• Conteúdo traduzido e adaptado para contexto português e europeu",
  },
  {
    id: "bm-14",
    sinal: "-",
    tipo: "Persona",
    ambito: "Internacional",
    nome: "Kim Kardashian",
    link: "",
    descricao: "Personalidade televisiva e empresária norte-americana identificada por investigadores como uma das figuras mais problemáticas em conselhos de saúde online. Promoveu detox teas com ingredientes laxantes como produto de emagrecimento, suplementos sem evidência e procedimentos estéticos não regulados. Caso paradigmático de como o alcance de redes sociais supera amplamente o da comunicação de saúde pública.",
    col3: "• Mais de 300 milhões de seguidores no Instagram — a OMS tem 5 milhões no Twitter\n• Parceria comercial com empresas de detox teas e suplementos apresentadas como recomendações pessoais\n• Conteúdo de saúde integrado num ecossistema de marca pessoal onde incentivo financeiro e conselho são indistinguíveis\n• Alcance entre públicos jovens e adolescentes particularmente vulneráveis a mensagens sobre corpo e alimentação",
    col4: "• Ilustra a assimetria de alcance entre desinformação celebrity e comunicação de saúde pública\n• Contribui para cultura de dietas restritivas e distúrbios alimentares em populações jovens\n• Caso de estudo central no debate sobre regulação de publicidade de saúde em redes sociais\n• Para combater: obrigatoriedade de etiquetagem de conteúdo patrocinado e regulação de alegações de saúde por influenciadores",
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
  const blue = "#0000FF";

  const bulletLines = (text) =>
    text.split("\n").filter(Boolean).map((line, i) => (
      <div key={i} className="text-xs leading-relaxed mb-1" style={{ color: blue, opacity: 0.5 }}>
        {line}
      </div>
    ));

  return (
    <div
      className="pt-5 pb-5 transition-colors mb-4 -mx-6 px-6"
      style={{
        borderTop: `2px solid ${open ? accentColor : "rgba(0,0,255,0.1)"}`,
        background: open ? "rgba(0,0,255,0.03)" : "transparent",
      }}
    >
      {/* Card header */}
      <div
        className="flex items-start justify-between cursor-pointer gap-4"
        onClick={() => setOpen(!open)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2.5 mb-1">
            {entry.link && (
              <a
                href={entry.link}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[9px] tracking-[0.06em] underline"
                style={{ color: blue }}
              >
                {entry.link.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>
          <h3
            className="text-sm font-bold tracking-[0.04em] uppercase m-0"
            style={{ color: blue }}
          >
            {entry.nome}
          </h3>
          {!open && (
            <p className="text-xs mt-1.5 leading-snug" style={{ color: blue, opacity: 0.4 }}>
              {entry.descricao.slice(0, 100)}{entry.descricao.length > 100 ? "…" : ""}
            </p>
          )}
        </div>
        <div
          className="text-base pt-0.5 flex-shrink-0 select-none transition-transform duration-200"
          style={{
            color: blue,
            opacity: 0.3,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ↓
        </div>
      </div>

      {/* Expanded content */}
      {open && (
        <div className="mt-4">
          <p className="text-xs leading-relaxed mb-4" style={{ color: blue, opacity: 0.6 }}>
            {entry.descricao}
          </p>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <div
                className="text-[9px] tracking-[0.12em] uppercase font-bold pb-1 mb-4"
                style={{
                  color: blue,
                  opacity: 0.5,
                  borderBottom: "1px solid rgba(0,0,255,0.25)",
                }}
              >
                {col3Label(entry.sinal)}
              </div>
              {bulletLines(entry.col3)}
            </div>
            <div>
              <div
                className="text-[9px] tracking-[0.12em] uppercase font-bold pb-1 mb-4"
                style={{
                  color: blue,
                  opacity: 0.5,
                  borderBottom: "1px solid rgba(0,0,255,0.25)",
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
  if (!entries.length) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px" style={{ background: "rgba(0,0,255,0.1)" }} />
        <span
          className="text-[9px] tracking-[0.18em] uppercase font-bold whitespace-nowrap"
          style={{ color: "#0000FF", opacity: 0.4 }}
        >
          {title}
        </span>
        <div className="flex-1 h-px" style={{ background: "rgba(0,0,255,0.1)" }} />
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
  const [activeAmbitoPlus, setActiveAmbitoPlus] = useState("ALL");
  const [activeAmbitoMinus, setActiveAmbitoMinus] = useState("ALL");
  const [activeTipoPlus, setActiveTipoPlus] = useState("ALL");
  const [activeTipoMinus, setActiveTipoMinus] = useState("ALL");

  const blue = "#0000FF";
  const magenta = "#FF00FF";

  const ambitoOrder = { Nacional: 0, Internacional: 1 };
  const tipoOrder = { Portal: 0, Persona: 1 };

  function renderColumn(sinal, activeAmbito, setActiveAmbito, activeTipo, setActiveTipo, color) {
    const all = entries.filter((e) => e.sinal === sinal);
    const filtered = all
      .filter((e) => activeAmbito === "ALL" || e.ambito === activeAmbito)
      .filter((e) => activeTipo === "ALL" || e.tipo === activeTipo)
      .sort((a, b) => (ambitoOrder[a.ambito] ?? 2) - (ambitoOrder[b.ambito] ?? 2) || (tipoOrder[a.tipo] ?? 2) - (tipoOrder[b.tipo] ?? 2));

    const totalAll = all.length;

    return (
      <div>
        {/* Column title */}
        <div
          className="text-sm font-bold tracking-[0.1em] uppercase mb-4"
          style={{ color }}
        >
          BENCHMARK {sinal}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-6">
          {/* Âmbito filter */}
          <div className="flex items-center gap-0.5">
            {["ALL", "Nacional", "Internacional"].map((a) => (
              <button
                key={a}
                onClick={() => setActiveAmbito(a)}
                className="text-[7px] font-bold tracking-wider uppercase px-1.5 py-0.5 cursor-pointer transition-colors duration-150"
                style={{
                  border: "1px solid",
                  borderColor: activeAmbito === a ? color : "rgba(0,0,255,0.15)",
                  background: activeAmbito === a ? color : "transparent",
                  color: activeAmbito === a ? "#fff" : blue,
                  fontWeight: activeAmbito === a ? 700 : 400,
                }}
              >
                {a === "ALL" ? "TODOS" : a.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Tipo filter */}
          <div className="flex items-center gap-0.5">
            {["ALL", "Portal", "Persona"].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTipo(t)}
                className="text-[7px] font-bold tracking-wider uppercase px-1.5 py-0.5 cursor-pointer transition-colors duration-150"
                style={{
                  border: "1px solid",
                  borderColor: activeTipo === t ? color : "rgba(0,0,255,0.15)",
                  background: activeTipo === t ? color : "transparent",
                  color: activeTipo === t ? "#fff" : blue,
                  fontWeight: activeTipo === t ? 700 : 400,
                }}
              >
                {t === "ALL" ? "TODOS" : t === "Portal" ? "PORTAIS" : "PERSONAS"}
              </button>
            ))}
          </div>

          <span className="text-[7px] font-medium uppercase tracking-[0.15em] self-center" style={{ color, opacity: 0.35 }}>
            {filtered.length === totalAll ? `${totalAll} entradas` : `${filtered.length} / ${totalAll}`}
          </span>
        </div>

        {/* Description */}
        <div className="text-xs tracking-[0.08em] leading-snug mb-9" style={{ color }}>
          {sinal === "+"
            ? "Referências positivas — portais e comunicadores que produzem informação de saúde credível, baseada em evidência."
            : "Vectores de desinformação — portais e figuras que disseminam informação de saúde falsa ou enganosa."}
        </div>

        {/* Flat list */}
        {filtered.map((e) => (
          <BenchmarkCard key={e.id} entry={e} accentColor={color} />
        ))}

        {filtered.length === 0 && (
          <div className="text-[11px] text-center py-12 tracking-[0.08em]" style={{ color, opacity: 0.2 }}>
            Nenhuma entrada para este filtro.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      {renderColumn("+", activeAmbitoPlus, setActiveAmbitoPlus, activeTipoPlus, setActiveTipoPlus, blue)}
      {renderColumn("-", activeAmbitoMinus, setActiveAmbitoMinus, activeTipoMinus, setActiveTipoMinus, magenta)}
    </div>
  );
}
