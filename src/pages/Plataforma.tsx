import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import EditorialHeader from "@/components/EditorialHeader";
import { supabase } from "@/integrations/supabase/client";

/* ── Fallback modal data ── */
const fallbackModals: Record<string, { eyebrow: string; title: string; text: string }> = {
  dgs: { eyebrow: "Parceiros Institucionais", title: "DGS — Direcção-Geral da Saúde", text: "A DGS é uma fonte primária de informação científica validada. O projecto utiliza os seus comunicados, orientações clínicas e alertas de saúde pública como base para a monitorização de tendências e validação do conteúdo produzido." },
  sns: { eyebrow: "Parceiros Institucionais", title: "SNS — Serviço Nacional de Saúde", text: "O SNS fornece dados epidemiológicos, estatísticas de saúde e informação institucional que alimentam os eixos temáticos do dashboard." },
  rtp: { eyebrow: "Amplificação", title: "RTP", text: "Parceiro de amplificação com potencial para co-produção de conteúdo ou divulgação junto de públicos mais alargados através dos canais digitais e televisivos." },
  plataforma: { eyebrow: "Núcleo", title: "Plataforma", text: "O centro do projecto. Agrega o dashboard privado de monitorização de tendências, o arquivo de guiões e o sistema de verificação de mitos. É a ferramenta de estratégia que alimenta todos os canais de comunicação." },
  site: { eyebrow: "Ecossistema Digital", title: "Site", text: "O arquivo público do projecto. Aloja todos os vídeos, textos e verificações produzidos. O que é distribuído pelas redes sociais tem sempre o site como destino e fonte original." },
  app: { eyebrow: "Ecossistema Digital", title: "APP — Bom Saber!", text: "Aplicação móvel consultável com arquivo de mitos vs. factos em saúde. Permite ao utilizador pesquisar temas e aceder a respostas com fundamento científico." },
  instagram: { eyebrow: "Canal de Distribuição", title: "Instagram", text: "Canal de distribuição para públicos jovens e adultos. O formato Diz que Disse — vox pop + dupla científica — é especialmente adequado para Reels e Stories." },
  tiktok: { eyebrow: "Canal de Distribuição", title: "TikTok", text: "Canal de distribuição para públicos mais jovens. O formato curto e dinâmico é ideal para os vídeos vox pop." },
  youtube: { eyebrow: "Canal de Distribuição", title: "YouTube", text: "Canal de distribuição e arquivo permanente para conteúdo mais longo e aprofundado, complementando o site." },
  conversa: { eyebrow: "Ecossistema Público", title: "Conversa em Dia", text: "Formato de encontro presencial com especialistas e público geral. Sessões de conversa sobre temas de saúde actuais, com mediação científica." },
  academia: { eyebrow: "Ecossistema Público", title: "Academia", text: "Parceria com universidades e centros de investigação para produção e validação de conteúdo científico." },
  bairros: { eyebrow: "Ecossistema Público", title: "Bairros", text: "Iniciativa de proximidade que leva informação de saúde com fundamento científico a comunidades locais." },
  centros: { eyebrow: "Ecossistema Público", title: "Centros de Saúde", text: "Colaboração com centros de saúde do SNS para distribuição de conteúdo informativo validado nos espaços de espera e consultas." },
  ccp: { eyebrow: "Extensões", title: "Comunidade Científica Portuguesa", text: "Extensão futura que prevê certificados de competências para profissionais e instituições que participem na validação de conteúdo científico." },
  voz: { eyebrow: "Extensões", title: "Assistente Virtual Voz", text: "Interface de voz para acesso a informação de saúde validada — qualquer utilizador pode fazer perguntas e receber respostas em formato áudio." },
};

/* ── Reusable box ── */
type BoxStyle = { border: string; color: string; bg?: string; fontWeight?: number };

const DiagramBox = ({
  label,
  id,
  style,
  onClick,
  small,
}: {
  label: string;
  id: string;
  style: BoxStyle;
  onClick: (id: string) => void;
  small?: boolean;
}) => (
  <button
    onClick={() => onClick(id)}
    className={`${small ? "px-3 py-1.5 text-[9px]" : "px-4 py-2 text-[11px]"} uppercase tracking-[0.12em] transition-opacity hover:opacity-70 cursor-pointer bg-background`}
    style={{
      border: style.border,
      color: style.color,
      fontWeight: style.fontWeight ?? 400,
      backgroundColor: style.bg ?? "white",
      fontFamily: "var(--font-sans)",
    }}
  >
    {label}
  </button>
);

/* ── Arrow ── */
const Arrow = ({ opacity = 0.3 }: { opacity?: number }) => (
  <div className="flex justify-center py-1" style={{ color: `rgba(0,0,255,${opacity})` }}>
    <span className="text-sm select-none">↓</span>
  </div>
);

/* ── Section label ── */
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[9px] uppercase tracking-[0.2em] text-center mb-2" style={{ color: "rgba(0,0,255,0.45)" }}>
    {children}
  </p>
);

/* ── Styles ── */
const S = {
  parceiros: { border: "1px solid rgba(0,0,255,0.2)", color: "rgba(0,0,255,0.4)" },
  amplificacao: { border: "1px solid rgba(0,0,255,0.2)", color: "rgba(0,0,255,0.4)" },
  nucleo: { border: "2px solid #0000FF", color: "#0000FF", fontWeight: 700 },
  digital: { border: "1px solid #0000FF", color: "#0000FF", bg: "rgba(0,0,255,0.03)" },
  canais: { border: "1px solid rgba(0,0,255,0.45)", color: "rgba(0,0,255,0.55)" },
  publico: { border: "1px dashed #0000FF", color: "#0000FF", bg: "rgba(0,0,255,0.03)" },
  extensoes: { border: "1px solid #0000FF", color: "#0000FF", bg: "rgba(0,0,255,0.03)" },
};

/* ── Page ── */
const Plataforma = () => {
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [tbarWidth, setTbarWidth] = useState(0);
  const channelsRef = useRef<HTMLDivElement>(null);
  const [modals, setModals] = useState<Record<string, { eyebrow: string; title: string; text: string }>>(fallbackModals);

  useEffect(() => {
    const fetchPopups = async () => {
      const { data } = await supabase.from("plataforma_popups").select("*");
      if (data && data.length > 0) {
        const map: Record<string, { eyebrow: string; title: string; text: string }> = {};
        data.forEach((row: any) => { map[row.id] = { eyebrow: row.eyebrow, title: row.title, text: row.text }; });
        setModals({ ...fallbackModals, ...map });
      }
    };
    fetchPopups();
  }, []);

  useEffect(() => {
    const measure = () => {
      if (channelsRef.current) setTbarWidth(channelsRef.current.offsetWidth);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const open = (id: string) => setOpenModal(id);
  const close = () => setOpenModal(null);

  const modal = openModal ? modals[openModal] : null;

  return (
    <div className="min-h-screen text-foreground" style={{ backgroundColor: "#F5F5FF" }}>
      <EditorialHeader />

      {/* Intro */}
      <section className="px-6 py-12 md:py-16 max-w-3xl">
        <p className="editorial-label mb-3">Estrutura do Projecto</p>
        <h1 className="text-2xl md:text-4xl font-bold tracking-[0.03em] leading-tight">
          Uma Plataforma,<br />Várias Dimensões
        </h1>
        <p className="text-sm mt-6 max-w-2xl leading-relaxed opacity-80">
          Este projecto pretende promover e democratizar o acesso à informação com fundamento científico para a valorização da saúde e para o exercício de cidadania. O diagrama representa as várias frentes que o projecto pretende alcançar.
        </p>
      </section>

      <div className="section-divider" />

      {/* Diagram */}
      <section className="px-6 py-12 flex flex-col items-center">
        {/* 1 — Parceiros Institucionais */}
        <SectionLabel>Parceiros Institucionais</SectionLabel>
        <div className="flex gap-3 justify-center flex-wrap">
          <DiagramBox label="DGS" id="dgs" style={S.parceiros} onClick={open} />
          <DiagramBox label="SNS" id="sns" style={S.parceiros} onClick={open} />
        </div>

        <Arrow opacity={0.2} />

        {/* 2 — Amplificação */}
        <SectionLabel>Amplificação</SectionLabel>
        <DiagramBox label="RTP" id="rtp" style={S.amplificacao} onClick={open} />

        <Arrow opacity={0.25} />

        {/* 3 — Núcleo */}
        <DiagramBox label="Plataforma" id="plataforma" style={S.nucleo} onClick={open} />

        <Arrow opacity={0.3} />

        {/* 4 — Ecossistema Digital */}
        <SectionLabel>Ecossistema Digital</SectionLabel>
        <div className="flex gap-3 justify-center flex-wrap">
          <DiagramBox label="Site" id="site" style={S.digital} onClick={open} />
          <DiagramBox label="APP" id="app" style={S.digital} onClick={open} />
        </div>

        {/* T-bar connector + Canais */}
        <div className="flex flex-col items-center mt-1">
          {/* vertical stem down from Site/APP */}
          <div className="w-px h-4" style={{ background: "rgba(0,0,255,0.3)" }} />
          {/* Inverted T: horizontal bar with 3 feet */}
          <div className="flex flex-col items-center">
            <div className="relative" style={{ width: tbarWidth || "auto", height: 16 }}>
              {/* horizontal bar */}
              <div className="absolute top-0 left-0 right-0" style={{ height: 1, background: "rgba(0,0,255,0.3)" }} />
              {/* left foot */}
              <div className="absolute top-0 w-px h-4" style={{ left: 0, background: "rgba(0,0,255,0.3)" }} />
              {/* center foot */}
              <div className="absolute top-0 w-px h-4" style={{ left: "50%", transform: "translateX(-0.5px)", background: "rgba(0,0,255,0.3)" }} />
              {/* right foot */}
              <div className="absolute top-0 w-px h-4" style={{ right: 0, background: "rgba(0,0,255,0.3)" }} />
            </div>
            <div className="mt-2">
              <SectionLabel>Canais de Distribuição</SectionLabel>
            </div>
            <div ref={channelsRef} className="flex gap-2 justify-center flex-wrap">
              <DiagramBox label="Instagram" id="instagram" style={S.canais} onClick={open} small />
              <DiagramBox label="TikTok" id="tiktok" style={S.canais} onClick={open} small />
              <DiagramBox label="YouTube" id="youtube" style={S.canais} onClick={open} small />
            </div>
          </div>
        </div>

        <Arrow opacity={0.15} />

        {/* 5 — Ecossistema Público */}
        <SectionLabel>Ecossistema Público</SectionLabel>
        <div className="flex gap-3 justify-center flex-wrap">
          <DiagramBox label="Conversa em Dia" id="conversa" style={S.publico} onClick={open} />
          <DiagramBox label="Academia" id="academia" style={S.publico} onClick={open} />
          <DiagramBox label="Bairros" id="bairros" style={S.publico} onClick={open} />
          <DiagramBox label="Centros de Saúde" id="centros" style={S.publico} onClick={open} />
        </div>

        <Arrow opacity={0.08} />

        {/* 6 — Extensões */}
        <SectionLabel>Extensões</SectionLabel>
        <div className="flex gap-3 justify-center flex-wrap">
          <DiagramBox label="Comunidade Científica Portuguesa" id="ccp" style={S.extensoes} onClick={open} />
          <DiagramBox label="Assistente Virtual Voz" id="voz" style={S.extensoes} onClick={open} />
        </div>
      </section>

      <div className="section-divider" />

        {/* Legend — inline, centered, below diagram */}
        <div className="mt-10 mb-10 flex justify-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-5 h-3" style={{ border: "2px solid #0000FF" }} />
            <span className="text-[10px] tracking-[0.1em]" style={{ color: "#0000FF" }}>Âmbito actual (2026)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-3" style={{ border: "1px dashed #0000FF" }} />
            <span className="text-[10px] tracking-[0.1em]" style={{ color: "#0000FF" }}>Ecossistema Público</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-3" style={{ border: "1px dashed #0000FF" }} />
            <span className="text-[10px] tracking-[0.1em]" style={{ color: "#0000FF" }}>Extensões</span>
          </div>
        </div>

      {/* Modal overlay */}
      {modal && openModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={close}
        >
          {/* backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

          {/* modal card */}
          <div
            className="relative z-10 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* tab header */}
            <div
              className="flex items-center justify-between px-4 py-2"
              style={{ background: "#0000FF" }}
            >
              <span className="text-[10px] uppercase tracking-[0.15em] font-medium" style={{ color: "white" }}>
                {modal.eyebrow}
              </span>
              <button onClick={close} className="text-white/80 hover:text-white text-sm leading-none cursor-pointer">
                ×
              </button>
            </div>

            {/* body */}
            <div className="bg-background border border-foreground/20 border-t-0 px-6 py-6">
              <p className="editorial-label mb-2">{modal.eyebrow}</p>
              <h2 className="text-base font-bold tracking-[0.02em] mb-4">{modal.title}</h2>
              <p className="text-sm leading-relaxed opacity-80">{modal.text}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Plataforma;
