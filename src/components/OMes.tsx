import { useEffect, useMemo, useState } from "react";
import {
  leituraDoMes, mesesDaLeitura, nomeDoMes, variacaoPorExtenso, valorComUmaCasa, type LinhaMensal,
} from "@/lib/vistaEixo";
import type { Incompleto } from "@/hooks/useTrendsLote";

/**
 * O mês — a leitura mensal da vista do eixo (22/10/2026, proposta aprovada em
 * docs/sessoes/2026-10-22.md §9.2; decisões técnicas e critério no §11). Os 10 mais procurados
 * de um mês completo, com a variação face ao mesmo mês do ano anterior. Lê as séries mensais
 * que a vista já leu; não faz pedidos.
 */
type Props = {
  mensal: LinhaMensal[];
  termosActivos: string[];
  loteId?: string | null;
  incompleto?: Incompleto | null;
};

const OMes = ({ mensal, termosActivos, loteId, incompleto }: Props) => {
  const meses = useMemo(() => mesesDaLeitura(mensal), [mensal]);
  const [mes, setMes] = useState<string | null>(null);
  // abre no último mês completo; volta a ele quando o eixo (e as linhas) mudam
  useEffect(() => { setMes(meses[0] ?? null); }, [meses]);

  const leitura = useMemo(
    () => (mes ? leituraDoMes(mensal, termosActivos, mes) : null),
    [mensal, termosActivos, mes],
  );
  if (!meses.length || !mes || !leitura) return null;
  const { itens, maisSubiu, mesAnterior } = leitura;
  const ultima = itens[itens.length - 1]?.posicao ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-1">
        <p className="editorial-label">O mês — os mais procurados, face ao mesmo mês do ano anterior</p>
        <select
          aria-label="Mês"
          value={mes}
          onChange={e => setMes(e.target.value)}
          className="text-[10px] font-bold uppercase tracking-[0.1em] border bg-background px-2 py-1"
          style={{ borderColor: "#0000FF", color: "#0000FF" }}
        >
          {meses.map(m => <option key={m} value={m}>{nomeDoMes(m)}</option>)}
        </select>
      </div>
      {incompleto && (
        <p className="text-[10px] leading-relaxed text-foreground/60 mb-1">
          Aviso: os dados chegaram incompletos — {incompleto.n} de {incompleto.m} linhas; a lista foi feita só com essas.
        </p>
      )}
      {itens.length < 10 && ultima < 10 && (
        <p className="text-[10px] leading-relaxed text-foreground/60 mb-1">
          Só {itens.length} {itens.length === 1 ? "termo teve" : "termos tiveram"} procura medida em {nomeDoMes(mes)}.
        </p>
      )}
      <table className="w-full text-[11px] border-collapse mt-2">
        <tbody>
          {itens.map(i => (
            <tr key={i.termo} className="border-b border-foreground/10">
              <td className="py-2 pr-3 w-6 text-[10px] font-bold text-foreground/30">{String(i.posicao).padStart(2, "0")}</td>
              <td className="py-2 pr-3 font-semibold">{i.termo}</td>
              <td className="py-2 pr-3 text-right text-foreground/50">{valorComUmaCasa(i.valor)}</td>
              <td className={`py-2 text-right whitespace-nowrap ${i.variacao != null && i.variacao > 0 ? "font-semibold" : "text-foreground/50"}`}>
                {variacaoPorExtenso(i)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[11px] leading-relaxed mt-3">
        {maisSubiu
          ? `O que mais subiu face a ${nomeDoMes(mesAnterior)}: ${maisSubiu.termos.join(" e ")} (${maisSubiu.termos.length > 1 ? "sobem" : "sobe"} ${maisSubiu.variacao}%).`
          : `Nenhum dos termos com percentagem subiu face a ${nomeDoMes(mesAnterior)}.`}
      </p>
      <p className="text-[9px] leading-relaxed text-foreground/50 mt-3">
        Média das semanas do mês de cada termo{loteId ? `, lote ${loteId.slice(0, 8)}` : ""}, na régua do eixo (a âncora ≈ 100);
        só meses completos. Valores iguais partilham a posição. Sem percentagem quando o valor do ano anterior é menor do que 5:
        mostram-se os dois valores.
      </p>
    </div>
  );
};

export default OMes;
