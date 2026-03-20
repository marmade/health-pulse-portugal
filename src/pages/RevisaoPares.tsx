import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import EditorialHeader from "@/components/EditorialHeader";

const EIXOS = [
  { id: "saude-mental", label: "Saúde Mental", color: "rgba(0,255,200,0.12)" },
  { id: "alimentacao",  label: "Alimentação",  color: "rgba(255,230,0,0.20)" },
  { id: "menopausa",    label: "Menopausa",    color: "rgba(255,0,150,0.12)" },
  { id: "emergentes",   label: "Emergentes",   color: "rgba(0,0,255,0.08)" },
];

type RPRow = {
  id: string;
  eixo: string;
  nome_a: string;
  especialidade_a: string;
  telefone_a: string;
  email_a: string;
  link_a: string;
  nome_b: string;
  especialidade_b: string;
  telefone_b: string;
  email_b: string;
  link_b: string;
  sumario: string;
};

const ProfileBlock = ({ nome, especialidade, email, link }: { nome: string; especialidade: string; email: string; link: string }) => {
  const hasData = nome || especialidade;
  return (
    <div className="space-y-1">
      <p className="text-sm font-semibold">{nome || "—"}</p>
      <p className="text-xs opacity-70">{especialidade || "—"}</p>
      {email && <p className="text-xs opacity-50">{email}</p>}
      {link && (
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-[11px] opacity-40 underline hover:opacity-60 transition-opacity">
          Perfil profissional ↗
        </a>
      )}
      {!hasData && <p className="text-xs opacity-50">—</p>}
    </div>
  );
};

const RevisaoPares = () => {
  const [dados, setDados] = useState<Record<string, RPRow>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (supabase.from as any)("revisao_pares")
      .select("*")
      .then(({ data }: any) => {
        if (data) {
          const map: Record<string, RPRow> = {};
          data.forEach((d: any) => { map[d.eixo] = d; });
          setDados(map);
        }
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
                        <ProfileBlock nome={row.nome_a} especialidade={row.especialidade_a} email={row.email_a} link={row.link_a} />
                        <ProfileBlock nome={row.nome_b} especialidade={row.especialidade_b} email={row.email_b} link={row.link_b} />
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
        )}
      </main>
    </div>
  );
};

export default RevisaoPares;
