import { arquivoPorPosicao, type EntradaArquivo } from "@/lib/vistaEixo";
import { semanaIntervalo } from "@/lib/semana";

/**
 * O arquivo semanal do eixo por posição (22/10/2026, decisões da Marta em
 * docs/sessoes/2026-10-22.md §1): uma linha por semana, os termos em cada posição, sem valores —
 * cada semana é de um lote com a sua calibração. As semanas da regra anterior ficam à parte.
 */
const POSICOES = Array.from({ length: 10 }, (_, i) => i + 1);

const BotaoPdf = ({ entrada }: { entrada: EntradaArquivo }) => (
  <button
    onClick={() => (window as unknown as { _downloadEixoPdf?: (e: EntradaArquivo) => void })._downloadEixoPdf?.(entrada)}
    className="text-[9px] font-bold uppercase tracking-[0.15em] border px-2 py-1 transition-colors hover:bg-[#0000FF] hover:text-white"
    style={{ borderColor: "#0000FF", color: "#0000FF" }}
  >
    PDF
  </button>
);

const ArquivoPosicoes = ({ entradas }: { entradas: EntradaArquivo[] }) => {
  const { comPosicao, antigas } = arquivoPorPosicao(entradas);
  if (!comPosicao.length && !antigas.length) return null;

  return (
    <section>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3 opacity-60">
        Arquivo semanal — as posições de cada semana
      </p>
      {comPosicao.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="border-b border-foreground/20">
                <th className="text-left font-bold py-1.5 pr-3 whitespace-nowrap">Semana</th>
                {POSICOES.map(p => (
                  <th key={p} className="text-left font-bold py-1.5 pr-3">{String(p).padStart(2, "0")}</th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {comPosicao.map(({ entrada, semanaTrends, porPosicao }) => (
                <tr key={entrada.id} className="border-b border-foreground/10 align-top">
                  <td className="py-1.5 pr-3 whitespace-nowrap font-medium">
                    {semanaTrends ? semanaIntervalo(semanaTrends) : entrada.week_label}
                    <span className="block text-[9px] text-foreground/50 font-normal">arquivo de {entrada.week_label}</span>
                  </td>
                  {POSICOES.map(p => (
                    <td key={p} className="py-1.5 pr-3">
                      {(porPosicao.get(p) || []).map(t => <span key={t} className="block">{t}</span>)}
                    </td>
                  ))}
                  <td className="py-1.5"><BotaoPdf entrada={entrada} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {comPosicao.length > 0 && (
        <p className="text-[9px] leading-relaxed text-foreground/50 mt-3">
          Só posições, sem valores: cada semana vem de um lote diferente do Google Trends, com a sua
          calibração, e os valores de lotes diferentes não se comparam entre si — as posições, sim.
          Valores iguais partilham a posição. Até ao arquivo de 05/10 guardavam-se 5 posições; desde
          o de 12/10, 10.
        </p>
      )}
      {antigas.length > 0 && (
        <div className="mt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1 opacity-60">
            Semanas anteriores — outra medida
          </p>
          <p className="text-[9px] leading-relaxed text-foreground/50 mb-2">
            Os arquivos até ao de {antigas[0].week_label} vêm da regra anterior a 24/09/2026: ordenavam
            os termos pela subida na tabela de keywords, que não era escrita desde 20/03/2026 — não
            pelo que mais se procurou, e sem lote do Google Trends nem posição. Não se põem lado a lado
            com as semanas de cima. Ficam no PDF.
          </p>
          <div>
            {antigas.map(e => (
              <div key={e.id} className="flex items-center justify-between py-2 border-b border-foreground/10 last:border-0">
                <span className="text-xs font-medium">{e.week_label}</span>
                <BotaoPdf entrada={e} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default ArquivoPosicoes;
