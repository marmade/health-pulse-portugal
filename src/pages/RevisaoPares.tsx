import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import EditorialHeader from "@/components/EditorialHeader";
import { Mail } from "lucide-react";

const EIXOS = [
  { id: "saude-mental", label: "Saúde Mental", color: "rgba(0,255,200,0.12)" },
  { id: "alimentacao",  label: "Alimentação",  color: "rgba(255,230,0,0.20)" },
  { id: "menopausa",    label: "Menopausa",    color: "rgba(255,0,150,0.12)" },
  { id: "emergentes",   label: "Emergentes",   color: "rgba(0,0,255,0.08)" },
];

const CONTACTO_SECTIONS = [
  { tipo: "comunidade_cientifica", label: "Comunidade Científica", headerBg: "#f2fcfa" },
  { tipo: "agentes_trabalho", label: "Agentes de Trabalho", headerBg: "#ede8ff" },
];

type RPRow = {
  id: string;
  eixo: string;
  nome_a: string;
  especialidade_a: string;
  telefone_a: string;
  email_a: string;
  link_a: string;
  bio_a: string;
  nome_b: string;
  especialidade_b: string;
  telefone_b: string;
  email_b: string;
  link_b: string;
  bio_b: string;
  sumario: string;
};

type ContactoRow = {
  id: string;
  tipo: string;
  nome: string;
  especialidade: string;
  email: string;
  telefone: string;
  link: string;
  bio: string;
};

const ProfileBlock = ({ nome, especialidade, email, link, bio, hideContact }: { nome: string; especialidade: string; email: string; link: string; bio: string; hideContact?: boolean }) => {
  const hasData = nome || especialidade;
  return (
    <div className="space-y-1">
      <p className="text-sm font-semibold">{nome || "—"}</p>
      <p className="text-xs opacity-70">{especialidade || "—"}</p>
      {!hideContact && email && (
        <a href={`mailto:${email}`} title={email} className="inline-block opacity-50 hover:opacity-70 transition-opacity">
          <Mail className="h-3 w-3" />
        </a>
      )}
      {link && (
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-[11px] opacity-40 underline hover:opacity-60 transition-opacity">
          Perfil profissional ↗
        </a>
      )}
      {bio && <p className="text-[11px] opacity-40 italic mt-2">{bio}</p>}
      {!hasData && <p className="text-xs opacity-50">—</p>}
    </div>
  );
};

const RevisaoPares = () => {
  const [dados, setDados] = useState<Record<string, RPRow>>({});
  const [contactos, setContactos] = useState<ContactoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [hideContact, setHideContact] = useState(false);

  useEffect(() => {
    Promise.all([
      (supabase.from as any)("revisao_pares").select("*"),
      (supabase.from as any)("contactos_projecto").select("*").order("created_at"),
    ]).then(([rpRes, ctRes]: any[]) => {
      if (rpRes.data) {
        const map: Record<string, RPRow> = {};
        rpRes.data.forEach((d: any) => { map[d.eixo] = d; });
        setDados(map);
      }
      if (ctRes.data) setContactos(ctRes.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen text-foreground" style={{ backgroundColor: "#F5F5FF" }}>
      <EditorialHeader />

      <section className="px-6 pt-12 pb-6">
        <h1 className="text-2xl md:text-4xl font-bold tracking-[0.03em] leading-tight">
          Revisão de Pares
        </h1>
        <p className="mt-2 text-xs font-medium tracking-[0.15em] uppercase opacity-50">
          Dupla científica por eixo
        </p>
      </section>

      <div className="section-divider" />

      <main className="px-6 py-10 max-w-[1200px] mx-auto">
        {loading ? (
          <div className="flex items-center gap-3">
            <div className="animate-spin h-4 w-4 border-2 border-foreground border-t-transparent rounded-full" />
            <p className="text-xs opacity-50">A carregar...</p>
          </div>
        ) : (
          <>
            {/* Eixos grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {EIXOS.map(({ id, label, color }) => {
                const row = dados[id];
                return (
                  <div key={id} className="border border-foreground/10" style={{ backgroundColor: "white" }}>
                    <div className="px-5 py-4 flex items-center gap-3" style={{ backgroundColor: color }}>
                      <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: "#0000FF" }}>
                        {label}
                      </p>
                    </div>
                    <div className="px-5 py-5 grid grid-cols-2 gap-6">
                      {row ? (
                        <>
                          <ProfileBlock nome={row.nome_a} especialidade={row.especialidade_a} email={row.email_a} link={row.link_a} bio={row.bio_a} />
                          <ProfileBlock nome={row.nome_b} especialidade={row.especialidade_b} email={row.email_b} link={row.link_b} bio={row.bio_b} />
                        </>
                      ) : (
                        <>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold">—</p>
                            <p className="text-xs opacity-70">—</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold">—</p>
                            <p className="text-xs opacity-70">—</p>
                          </div>
                        </>
                      )}
                    </div>
                    {row?.sumario && (
                      <div className="px-5 pb-4 border-t border-foreground/5 pt-3">
                        <p className="text-[11px] opacity-40 italic">{row.sumario}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Contactos sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              {CONTACTO_SECTIONS.map(({ tipo, label, headerBg }) => {
                const sectionContactos = contactos.filter(c => c.tipo === tipo);
                return (
                  <div key={tipo} className="border border-foreground/10" style={{ backgroundColor: "white" }}>
                    <div className="px-5 py-4 flex items-center gap-3" style={{ backgroundColor: headerBg }}>
                      <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: "#0000FF" }}>
                        {label}
                      </p>
                    </div>
                    <div className="px-5 py-5">
                      {sectionContactos.length === 0 ? (
                        <p className="text-xs opacity-50">Sem contactos registados</p>
                      ) : (
                        <div className="space-y-5">
                          {sectionContactos.map(c => (
                            <div key={c.id} className="space-y-1">
                              <p className="text-sm font-semibold">{c.nome}</p>
                              {c.especialidade && <p className="text-xs opacity-70">{c.especialidade}</p>}
                              {c.email && (
                                <a href={`mailto:${c.email}`} title={c.email} className="inline-block opacity-50 hover:opacity-70 transition-opacity">
                                  <Mail className="h-3 w-3" />
                                </a>
                              )}
                              {c.telefone && <p className="text-xs opacity-50">{c.telefone}</p>}
                              {c.link && (
                                <a href={c.link} target="_blank" rel="noopener noreferrer" className="text-[11px] opacity-40 underline hover:opacity-60 transition-opacity">
                                  Perfil profissional ↗
                                </a>
                              )}
                              {c.bio && <p className="text-[11px] opacity-40 italic mt-2">{c.bio}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default RevisaoPares;
