import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from "@/components/DashboardHeader";
import DashboardFooter from "@/components/DashboardFooter";
import EditorialSubNav from "@/components/EditorialSubNav";

const AXIS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "saude-mental": { bg: "rgba(0,255,200,0.12)",  text: "#0000FF", border: "#0000FF" },
  alimentacao:    { bg: "rgba(255,230,0,0.2)",    text: "#0000FF", border: "#0000FF" },
  menopausa:      { bg: "rgba(255,0,150,0.12)",   text: "#0000FF", border: "#0000FF" },
  emergentes:     { bg: "rgba(0,0,255,0.08)",     text: "#0000FF", border: "#0000FF" },
};

type Perfil = {
  nome: string;
  especialidade: string;
  telefone: string;
  email: string;
  link: string;
};

type EntradaPares = {
  id: string;
  axis: string;
  axis_label: string;
  nome_a: string; especialidade_a: string; telefone_a: string; email_a: string; link_a: string;
  nome_b: string; especialidade_b: string; telefone_b: string; email_b: string; link_b: string;
  sumario: string;
};

function PerfilCard({ label, perfil, color }: { label: string; perfil: Perfil; color: { bg: string; text: string; border: string } }) {
  const hasData = perfil.nome || perfil.especialidade || perfil.email || perfil.telefone || perfil.link;
  return (
    <div className="flex-1 min-w-0 border border-foreground/10 p-5">
      <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: color.text }}>
        {label}
      </p>
      {hasData ? (
        <div className="space-y-2">
          {perfil.nome && (
            <p className="text-sm font-semibold">{perfil.nome}</p>
          )}
          {perfil.especialidade && (
            <p className="text-xs opacity-70">{perfil.especialidade}</p>
          )}
          {(perfil.telefone || perfil.email || perfil.link) && (
            <div className="pt-2 space-y-1 border-t border-foreground/10">
              {perfil.telefone && (
                <p className="text-[11px] font-mono opacity-60">{perfil.telefone}</p>
              )}
              {perfil.email && (
                <a href={`mailto:${perfil.email}`} className="block text-[11px] font-mono hover:opacity-70 transition-opacity" style={{ color: color.text }}>
                  {perfil.email}
                </a>
              )}
              {perfil.link && (
                <a href={perfil.link} target="_blank" rel="noopener noreferrer" className="block text-[11px] font-mono hover:opacity-70 transition-opacity truncate" style={{ color: color.text }}>
                  {perfil.link.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs opacity-30 italic">Por preencher</p>
      )}
    </div>
  );
}

const RevisaoPares = () => {
  const [dados, setDados] = useState<EntradaPares[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (supabase.from as any)("revisao_pares")
      .select("*")
      .order("axis")
      .then(({ data }: any) => {
        if (data) setDados(data as EntradaPares[]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardHeader activePage="editorial" />
      <EditorialSubNav activePage="revisao-pares" />

      <main className="px-6 py-10 max-w-[1200px] mx-auto">
        <div className="mb-8">
          <p className="editorial-label mb-1">Editorial · Diz que Disse</p>
          <h1 className="text-2xl md:text-4xl font-bold tracking-[0.03em]">
            Revisão de Pares
          </h1>
          <p className="text-sm mt-2 opacity-60">
            Dupla científica sugerida por eixo temático
          </p>
        </div>

        <div className="section-divider mb-10" />

        {loading ? (
          <div className="flex items-center gap-3">
            <div className="animate-spin h-4 w-4 border-2 border-foreground border-t-transparent rounded-full" />
            <p className="text-xs opacity-50">A carregar...</p>
          </div>
        ) : (
          <div className="space-y-10">
            {dados.map((entrada) => {
              const color = AXIS_COLORS[entrada.axis] || { bg: "#F9F9F9", text: "#0000FF", border: "#0000FF" };
              const perfilA: Perfil = { nome: entrada.nome_a, especialidade: entrada.especialidade_a, telefone: entrada.telefone_a, email: entrada.email_a, link: entrada.link_a };
              const perfilB: Perfil = { nome: entrada.nome_b, especialidade: entrada.especialidade_b, telefone: entrada.telefone_b, email: entrada.email_b, link: entrada.link_b };

              return (
                <div key={entrada.id}>
                  {/* Cabeçalho do eixo */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-6 rounded-sm" style={{ backgroundColor: color.border }} />
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: color.text }}>
                      {entrada.axis_label}
                    </p>
                  </div>

                  {/* Card do eixo */}
                  <div className="border border-foreground/10" style={{ borderLeftColor: color.border, borderLeftWidth: 3 }}>
                    {/* Perfis */}
                    <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-foreground/10">
                      <PerfilCard label="Perfil A" perfil={perfilA} color={color} />
                      <PerfilCard label="Perfil B" perfil={perfilB} color={color} />
                    </div>

                    {/* Sumário */}
                    {entrada.sumario && (
                      <div className="border-t border-foreground/10 px-5 py-4">
                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2 opacity-50">
                          Sumário do Eixo
                        </p>
                        <p className="text-sm leading-relaxed opacity-80">{entrada.sumario}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <DashboardFooter hideExport />
    </div>
  );
};

export default RevisaoPares;
