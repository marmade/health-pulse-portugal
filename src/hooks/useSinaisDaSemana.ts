import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  FATOR_MIN, notasDasPartes, previsiveisDoMes, sinaisDaSemana, type LinhaAlerta,
} from "../../supabase/functions/_shared/emergentes";
import { partesDosSinais, type ParteSinais } from "@/lib/sinaisEmergentes";

/**
 * Os "Sinais emergentes" da semana corrente no /briefing (decisão da Marta, 29/10/2026 —
 * docs/sessoes/2026-10-29.md §13): a mesma regra do arquivo (_shared/emergentes.ts), sobre os
 * alertas do lote mais recente. Até aqui a página da semana corrente lia `keywords.is_emergent`,
 * que não é escrita desde 14/08/2026, e dizia "Nenhum sinal de alerta esta semana" ao lado de uma
 * página inicial com alertas.
 *
 *   · lote: o último completo de 5 anos — o critério da página inicial (useTrendsLote);
 *   · semana: a última COMPLETA do lote, como na página inicial (a parcial nunca conta);
 *   · mês dos previsíveis: o mês de hoje.
 * O archive-weekly faz o mesmo para a semana que arquiva; as partes vazias têm as mesmas frases.
 */
export type SinaisDaSemana = {
  partes: ParteSinais[] | null;
  // os itens, como o arquivo os grava em top_emerging (para o PDF e a sugestão de conteúdo)
  itens: Record<string, unknown>[];
  semana: string | null;
  lote: string | null;
  // a razão de não haver partes (sem lote, sem alertas, erro de leitura)
  nota: string | null;
};

const VAZIO: SinaisDaSemana = { partes: null, itens: [], semana: null, lote: null, nota: null };

export function useSinaisDaSemana(): SinaisDaSemana & { carregado: boolean } {
  const [res, setRes] = useState<SinaisDaSemana>(VAZIO);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    let cancelado = false;
    const fim = (r: SinaisDaSemana) => { if (!cancelado) { setRes(r); setCarregado(true); } };
    (async () => {
      try {
        const { data: ped, error: e1 } = await supabase
          .from("trends_pedidos" as never).select("lote_id, fetched_at, trends_lotes!inner(estado)")
          .eq("timeframe", "today 5-y").eq("trends_lotes.estado", "completo")
          .order("fetched_at", { ascending: false }).limit(1);
        if (e1) throw e1;
        const loteId = (ped as unknown as { lote_id: string }[])?.[0]?.lote_id;
        if (!loteId) return fim({ ...VAZIO, nota: "sem lote completo de 5 anos na base de dados" });

        // a última semana completa: a última do lote, ou a anterior se essa vier marcada parcial
        const { data: ult } = await supabase
          .from("trends_calibrados" as never).select("data").eq("lote_id", loteId)
          .order("data", { ascending: false }).limit(1);
        const ultima = (ult as unknown as { data: string }[])?.[0]?.data?.slice(0, 10);
        if (!ultima) return fim({ ...VAZIO, lote: loteId, nota: `lote ${loteId.slice(0, 8)} sem série calibrada` });
        const { data: parc } = await supabase
          .from("trends_pontos" as never).select("pedido_id, trends_pedidos!inner(lote_id)")
          .eq("trends_pedidos.lote_id", loteId).eq("data", `${ultima}T00:00:00+00:00`).eq("is_partial", true).limit(1);
        const d = new Date(`${ultima}T00:00:00Z`);
        if ((parc as unknown[])?.length) d.setUTCDate(d.getUTCDate() - 7);
        const semana = d.toISOString().slice(0, 10);

        const { data: algum, error: e0 } = await supabase
          .from("trends_alertas" as never).select("semana").eq("lote_id", loteId).limit(1);
        if (e0) throw e0;
        if (!(algum as unknown[])?.length) {
          return fim({ ...VAZIO, semana, lote: loteId, nota: `lote ${loteId.slice(0, 8)} sem alertas calculados` });
        }

        const hoje = new Date();
        const mes = hoje.getMonth() + 1, ano = hoje.getFullYear();
        const colunas = "eixo, termo, tipo, semana, valor, referencia, razao, z, fator_sazonal, max_anterior, semana_n, inicio";
        const [{ data: daSemana, error: e2 }, { data: sazonais, error: e3, count }, { data: ini, error: e4 }] = await Promise.all([
          supabase.from("trends_alertas" as never).select(colunas).eq("lote_id", loteId).eq("semana", semana),
          // os candidatos a previsíveis; a API corta em 1000 linhas sem erro — a contagem confirma
          supabase.from("trends_alertas" as never).select(colunas, { count: "exact" }).eq("lote_id", loteId)
            .gte("fator_sazonal", FATOR_MIN).lt("semana", `${ano}-01-01`),
          supabase.from("trends_calibrados" as never).select("data").eq("lote_id", loteId)
            .order("data", { ascending: true }).limit(1),
        ]);
        if (e2) throw e2;
        if (e3) throw e3;
        if (e4) throw e4;
        const saz = (sazonais as unknown as LinhaAlerta[]) || [];
        if ((count ?? 0) !== saz.length) throw new Error(`leitura incompleta dos previsíveis: ${saz.length} de ${count}`);
        const inicioSerie = (ini as unknown as { data: string }[])?.[0]?.data?.slice(0, 10);
        if (!inicioSerie) throw new Error(`lote ${loteId.slice(0, 8)} sem série calibrada`);

        const sinais = sinaisDaSemana((daSemana as unknown as LinhaAlerta[]) || [], semana);
        const previsiveis = previsiveisDoMes(saz, mes, ano, inicioSerie);
        const notas = notasDasPartes(sinais, previsiveis, semana, mes);
        const itens = [...sinais, ...previsiveis.itens] as unknown as Record<string, unknown>[];
        fim({ partes: partesDosSinais(itens as never, notas), itens, semana, lote: loteId, nota: null });
      } catch (e) {
        console.error("useSinaisDaSemana:", e);
        fim({ ...VAZIO, nota: `erro ao ler os alertas: ${(e as Error).message}` });
      }
    })();
    return () => { cancelado = true; };
  }, []);

  return { ...res, carregado };
}
