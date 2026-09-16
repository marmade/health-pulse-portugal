import { useState } from "react";
import type { HealthQuestion } from "@/data/healthQuestions";
import { getAxisColors } from "@/lib/axisColors";
import { useHealthQuestions } from "@/hooks/useHealthQuestions";
import { supabase } from "@/integrations/supabase/client";

const formatarData = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

type Props = {
  axis?: string;
  axisLabel?: string;
};

const HealthQuestionsPanel = ({ axis, axisLabel }: Props) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [relatedMap, setRelatedMap] = useState<Record<string, HealthQuestion[]>>({});
  const isOverview = !axis || axis === "all";
  const { nasDuas, soASubir, soHabituais, growingDate, askedDate, isLoading } =
    useHealthQuestions(axis);

  const limite = isOverview ? 30 : 15;
  const title = axis && axisLabel
    ? `Perguntas sobre ${axisLabel}`
    : "Perguntas de Saúde";

  const toggle = async (question: string, cluster: string) => {
    const isClosing = expanded === question;
    setExpanded(isClosing ? null : question);
    if (!isClosing && !relatedMap[question]) {
      const { data } = await supabase
        .from('health_questions')
        .select('*')
        .eq('cluster', cluster)
        .eq('is_question', true)
        .neq('question', question)
        .order('relative_volume', { ascending: false })
        .order('question', { ascending: true })
        .limit(5);
      if (data && data.length > 0) {
        setRelatedMap(prev => ({
          ...prev,
          [question]: data.map(row => ({
            question: row.question,
            growthPercent: row.growth_percent,
            relativeVolume: row.relative_volume,
            axis: row.axis,
            axisLabel: row.axis_label,
            cluster: row.cluster,
            relatedTerms: [],
          })),
        }));
      } else {
        setRelatedMap(prev => ({ ...prev, [question]: [] }));
      }
    }
  };

  /**
   * O que cada coluna mostra ao lado da pergunta NÃO é a mesma grandeza, e a
   * barra que aqui estava mentia nas duas: `relative_volume` não é um volume —
   * é a posição na lista devolvida, convertida em número
   * (`max(10, 100 - pos * 8)` no script 6, `* 5` no script 7). Nenhuma das duas
   * fontes publica quantidade de pesquisas.
   *
   *   em crescimento   → `growth_percent`, que é medida a sério: a subida que o
   *                      Google Trends reporta. `min(growth, 9999)` é um tecto,
   *                      logo 9999 lê-se «pelo menos 9999%», não «sem valor».
   *   mais perguntadas → só existe ordem. Mostra-se a posição, que é o que é.
   */
  const metrica = (q: HealthQuestion, comSubida: boolean) => {
    // Onde só há ordem, não se inventa número: a ordem da lista já é a ordem,
    // e um `01` ao lado da primeira linha é a mesma informação escrita outra vez.
    if (!comSubida) return null;
    if (q.growthPercent >= 9999) {
      return (
        <span className="text-[9px] font-bold uppercase tracking-wider text-foreground/50 border border-foreground/20 px-1.5 py-0.5 rounded-sm whitespace-nowrap">
          fora de escala
        </span>
      );
    }
    return (
      <span className="text-[11px] font-bold text-foreground/70 tabular-nums">
        +{q.growthPercent}%
      </span>
    );
  };

  const linha = (q: HealthQuestion, ultima: boolean, comSubida: boolean) => {
    const isExpanded = expanded === q.question;
    return (
      <div key={`${q.axis}-${q.question}`} className="break-inside-avoid">
        <button
          onClick={() => toggle(q.question, q.cluster)}
          className="w-full text-left py-2.5 group"
        >
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold leading-snug">
                {q.question}?
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="inline-block text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm"
                  style={{ backgroundColor: getAxisColors(q.axis).bg, color: getAxisColors(q.axis).text }}
                >
                  {q.axisLabel}
                </span>
                <span className="text-[9px] text-foreground/40">
                  {q.cluster}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              {metrica(q, comSubida)}
            </div>

            <span className="text-[10px] text-foreground/30 group-hover:text-foreground transition-colors shrink-0 mt-0.5">
              {isExpanded ? "−" : "+"}
            </span>
          </div>
        </button>

        {isExpanded && (() => {
          const related = relatedMap[q.question] || [];
          return related.length > 0 ? (
            <div className="pb-4 pl-0">
              <div className="border border-foreground/10 p-4">
                <p className="editorial-label mb-2">Pesquisas relacionadas</p>
                {related.map((rq) => (
                  <p
                    key={rq.question}
                    className="text-[10px] text-foreground/50 leading-relaxed mb-1"
                  >
                    {rq.question}?
                  </p>
                ))}
              </div>
            </div>
          ) : null;
        })()}

        {!ultima && <div className="border-t border-foreground/10" />}
      </div>
    );
  };

  /**
   * Os dois grupos vêm de fontes diferentes e são apresentados em separado
   * porque medem coisas diferentes: `pytrends` diz o que subiu esta semana,
   * `autocomplete` diz o que as pessoas escrevem na caixa de pesquisa. Juntá-los
   * numa lista ordenada por crescimento escondia as 3634 linhas do segundo.
   */
  const grupo = (
    rotulo: string,
    nota: string,
    linhas: HealthQuestion[],
    data: string | null,
    comSubida: boolean,
    notaNumero: string,
  ) => {
    if (linhas.length === 0) return null;
    const visiveis = linhas.slice(0, limite);
    return (
      <div className="min-w-0">
        <p className="editorial-label mb-1">{rotulo}</p>
        <p className="text-[10px] text-foreground/50 leading-relaxed mb-1">{nota}</p>
        <p className="text-[10px] text-foreground/40 mb-3">
          {data
            ? `Última recolha: ${formatarData(data)}`
            : 'Data da última recolha desconhecida'}
        </p>
        <p className="text-[10px] text-foreground/40 leading-relaxed mb-3 pb-3 border-b border-foreground/10">
          {notaNumero}
        </p>
        <div className="space-y-0">
          {visiveis.map((q, i) => linha(q, i === visiveis.length - 1, comSubida))}
        </div>
      </div>
    );
  };

  return (
    <div className="py-5 flex flex-col h-full min-h-0 max-h-[700px]">
      <div className="flex items-center gap-3 mb-1 flex-shrink-0">
        <span className="inline-block w-1.5 h-1.5 bg-foreground rounded-full" />
        <p className="text-xs font-bold uppercase tracking-[0.15em]">
          {title}
        </p>
      </div>
      {/* Três caixas na mesma grelha das três colunas: a do Trends fica por cima
          de «Só a subir», a do Autocomplete por cima de «Só habituais», e a da
          esquerda explica o cruzamento, que é o que a primeira coluna mostra. */}
      <div className="mb-5 ml-[18px] flex-shrink-0 grid gap-6 md:grid-cols-3 items-start">
        <div>
          <p className="text-[10px] text-foreground/50 leading-relaxed">
            Dúvidas recolhidas em <strong>duas</strong> ferramentas do Google que medem
            coisas diferentes. As três colunas mostram em qual delas cada pergunta
            apareceu.
          </p>
          <p className="text-[10px] text-foreground/40 leading-relaxed mt-2">
            «Só» quer dizer «só nesta recolha»: as duas correm em dias diferentes e
            nenhuma devolve tudo o que existe.
          </p>
          <p className="text-[10px] text-foreground/40 leading-relaxed mt-2">
            Não são mostradas <strong>72</strong> perguntas sobre <strong>saúde
            animal</strong> — «sintomas de alzheimer em cachorro», «como tratar avc em
            gatos». As pessoas perguntam-nas com as mesmas palavras, e este painel é
            sobre saúde humana.
          </p>
        </div>

        <div>
          <p className="text-[10px] text-foreground/60 leading-relaxed">
            <strong>Google Trends</strong> — o que <em>subiu</em>. Pesquisas feitas em
            Portugal nos últimos 3 meses, face aos 3 meses anteriores.
          </p>
          <p className="text-[10px] text-foreground/40 leading-relaxed mt-1 italic">
            «Each data point is divided by the total searches of the geography and time
            range it represents to compare relative popularity.»
          </p>
          <p className="text-[9px] text-foreground/40 leading-relaxed mt-1">
            Google,{" "}
            <a
              href="https://support.google.com/trends/answer/4365533"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              FAQ about Google Trends data
            </a>{" "}
            — o valor é relativo ao total de pesquisas, não é um número de pesquisas.
          </p>
        </div>

        <div>
          <p className="text-[10px] text-foreground/60 leading-relaxed">
            <strong>Google Autocomplete</strong> — o que se <em>escreve</em>. As sugestões
            que aparecem enquanto se escreve na caixa de pesquisa.
          </p>
          <p className="text-[10px] text-foreground/40 leading-relaxed mt-1 italic">
            «We look at the real searches that happen on Google and show common and
            trending ones relevant to the characters that are entered.»
          </p>
          <p className="text-[9px] text-foreground/40 leading-relaxed mt-1">
            Google,{" "}
            <a
              href="https://blog.google/products/search/how-google-autocomplete-works-search/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              How Google autocomplete works in Search
            </a>{" "}
            — o Google não publica volumes nem o país destas sugestões, e o parâmetro que
            pediria Portugal não é respeitado. <strong>127</strong> das 3634 perguntas
            trazem formas que um português não escreve (<em>estresse</em>, <em>crônica</em>,
            o <em>SUS</em>) e <strong>não são mostradas</strong> — ficam na base, e a
            contagem pode ser refeita. A mesma medição na fonte do Trends, onde o país
            funciona, dá <strong>4</strong>. O filtro não torna o resto português: só
            apanha o que se denuncia pela escrita.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-5 w-5 border-2 border-foreground border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="overflow-y-auto flex-1 min-h-0 scrollbar-yellow">
          {/* Lado a lado a partir de `md`; empilhados no telemóvel, onde duas
              colunas de perguntas não cabem sem partir as palavras ao meio. */}
          <div className="grid gap-6 md:grid-cols-3 items-start">
            {grupo(
              "Nas duas fontes",
              "As duas ferramentas apontam para a mesma pergunta: o Trends deu-a como tendo subido, e o Autocomplete sugere-a a quem começa a escrever sobre o tema. Coincidirem é raro — e é o sinal mais forte que estes dados dão.",
              nasDuas,
              growingDate,
              true,
              "O número é a subida que o Google Trends reportou para pesquisas feitas em Portugal nos últimos 3 meses, face aos 3 meses anteriores.",
            )}
            {grupo(
              "Só a subir",
              "Subiram no Trends e não estão entre as sugestões que recolhemos do Autocomplete. É o que mudou: pergunta-se hoje mais do que se perguntava há três meses.",
              soASubir,
              growingDate,
              true,
              "«Fora de escala» são as que subiram acima do que o Google quantifica: sabe-se que dispararam, não quanto, nem a partir de que base.",
            )}
            {grupo(
              "Só habituais",
              "O Autocomplete sugere-as e o Trends não as deu como tendo subido. É o que não muda: pergunta-se hoje como se perguntava antes.",
              soHabituais,
              askedDate,
              false,
              "Sem número, porque não há medida: o Autocomplete não publica volumes de pesquisa — devolve sugestões por ordem, e a ordem entre linhas diferentes não é um ranking.",
            )}
          </div>
          {nasDuas.length === 0 && soASubir.length === 0 && soHabituais.length === 0 && (
            <p className="text-[10px] text-foreground/40">Sem perguntas para mostrar.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default HealthQuestionsPanel;
