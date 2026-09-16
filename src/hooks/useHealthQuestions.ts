import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import type { HealthQuestion } from '@/data/healthQuestions';

type Linha = Tables<'health_questions'>;

const EIXOS = ['saude-mental', 'alimentacao', 'menopausa', 'emergentes'];

/**
 * `health_questions` tem duas fontes que medem coisas diferentes:
 *
 *   pytrends      → o que SUBIU      → tem `growth_percent` medido
 *   autocomplete  → o que se ESCREVE → não tem crescimento nenhum (0 em todas)
 *
 * Até 16/09/2026 o painel lia as duas de uma vez ordenadas por
 * `growth_percent`, o que escondia as 3634 linhas do autocomplete no fundo da
 * lista, e não filtrava `is_question` — 18 das 20 linhas visíveis não eram
 * perguntas ("avc toy", "sepsis meaning", "stress hídrico").
 *
 * Agora as perguntas são repartidas em três conjuntos que não se cruzam, para
 * cada uma aparecer uma vez só e o cruzamento entre fontes ficar à vista:
 *
 *   nasDuas      → está nas duas fontes. O próprio script 7 documenta isto
 *                  como "sinal forte de relevância"
 *   soASubir     → só o Google Trends a devolveu
 *   soHabituais  → só o Autocomplete a sugeriu
 *
 * NOTA sobre o que os nomes NÃO dizem: `soASubir` não quer dizer "não é
 * habitual" e `soHabituais` não quer dizer "não subiu" — querem dizer que a
 * outra fonte não a devolveu nesta recolha. As duas recolhas são de dias
 * diferentes e nenhuma é exaustiva.
 */
const TECTO = 9999;          // `min(growth, 9999)` no script 6: é tecto, não sentinela

/**
 * Formas de grafia que o português europeu não usa. Servem para NÃO MOSTRAR
 * perguntas que não podem ter sido escritas em Portugal — e só isso: as linhas
 * ficam na base de dados, e a contagem continua a poder ser refeita.
 *
 * UM FILTRO, UM CRITÉRIO. Esta lista é sobre **origem**, não sobre âmbito.
 * `cachorro` esteve aqui durante uma versão e saiu: as 26 linhas que apanhava
 * são de veterinária ("sintomas de alzheimer em cachorro") e o que está errado
 * nelas é serem sobre cães, não serem brasileiras. Misturar as duas razões numa
 * regra só torna impossível dizer, mais tarde, por que motivo uma linha
 * desapareceu. O âmbito veterinário fica por tratar, e fica por tratar à vista.
 *
 * Existem porque o pedido ao Autocomplete não consegue pedir Portugal: com
 * `client=firefox` o parâmetro `gl` não tem efeito nenhum (verificado a
 * 07/09/2026, e de novo a 16/09 com `gl=pt` contra `gl=br`); com
 * `client=chrome` tem efeito residual — em três seeds testadas, duas deram
 * resultados idênticos para PT e BR.
 *
 * Medido a 16/09/2026: apanham **127 das 3634** linhas do autocomplete (3,5%)
 * contra **4 das 1013** do Trends (0,4%), onde o `geo=PT` funciona.
 *
 * NÃO está aqui `remédio`, que aparece 39 vezes — e também na fonte com
 * `geo=PT`, o que é argumento contra ser marca de origem. Fica por decidir.
 *
 * O que este filtro NÃO faz: tornar os dados portugueses. Apanha só o que se
 * denuncia pela grafia ou pelo vocabulário; "sintomas de enxaqueca" escreve-se
 * igual nos dois países e passa incólume. Por isso a página continua a dizer
 * que o país não está garantido.
 */
const MARCAS_OUTRA_NORMA = [
  /\bestress/i,          // estresse (PT: stress)
  /\bsus\b/i,            // Sistema Único de Saúde, brasileiro
  /\bvocê\b/i,
  /\w*[ôê]nic/i,         // crônica, cetogênica (PT: crónica, cetogénica)
  /\w*ômic/i,            // econômico
  /\bgên/i,              // gênero, gêmeo
  /\banônim/i,
  /\bestômago|\bfôlego/i,
];

const daOutraNorma = (pergunta: string) =>
  MARCAS_OUTRA_NORMA.some(rx => rx.test(pergunta));
const POR_EIXO_PYTRENDS = 100;
const POR_EIXO_AUTOCOMPLETE = 40;

const mapear = (row: Linha): HealthQuestion => ({
  question: row.question,
  growthPercent: row.growth_percent,
  relativeVolume: row.relative_volume,
  axis: row.axis,
  axisLabel: row.axis_label,
  cluster: row.cluster,
  relatedTerms: [],
});

async function ultimaRecolha(fonte: string): Promise<string | null> {
  const { data } = await supabase
    .from('health_questions')
    .select('last_seen_at')
    .eq('source', fonte)
    .order('last_seen_at', { ascending: false })
    .limit(1);
  return data?.[0]?.last_seen_at ?? null;
}

/** Os três conjuntos de um eixo. */
async function repartirEixo(eixo: string) {
  const [pytrends, autocomplete] = await Promise.all([
    supabase
      .from('health_questions')
      .select('*')
      .eq('source', 'pytrends')
      .eq('is_question', true)
      .eq('axis', eixo)
      .order('growth_percent', { ascending: false })
      .order('question', { ascending: true })
      .limit(POR_EIXO_PYTRENDS),
    supabase
      .from('health_questions')
      .select('*')
      .eq('source', 'autocomplete')
      .eq('is_question', true)
      .eq('axis', eixo)
      .order('relative_volume', { ascending: false })
      .order('question', { ascending: true })
      .limit(POR_EIXO_AUTOCOMPLETE),
  ]);

  const linhasP = pytrends.data ?? [];
  const linhasA = autocomplete.data ?? [];

  // A sobreposição pergunta-se à base de dados em vez de se inferir do que já
  // foi descarregado: o conjunto de autocomplete aqui está limitado, e cruzar
  // dois cortes daria menos cruzamentos do que existem.
  const { data: cruzadas } = linhasP.length
    ? await supabase
        .from('health_questions')
        .select('question')
        .eq('source', 'autocomplete')
        .eq('is_question', true)
        .eq('axis', eixo)
        .in('question', linhasP.map(l => l.question))
    : { data: [] };

  const nasDuasSet = new Set((cruzadas ?? []).map(l => l.question));

  return {
    nasDuas: linhasP.filter(l => nasDuasSet.has(l.question) && !daOutraNorma(l.question)),
    soASubir: linhasP.filter(l => !nasDuasSet.has(l.question) && !daOutraNorma(l.question)),
    soHabituais: linhasA.filter(
      l => !nasDuasSet.has(l.question) && !daOutraNorma(l.question),
    ),
  };
}

export function useHealthQuestions(axis?: string) {
  const [nasDuas, setNasDuas] = useState<HealthQuestion[]>([]);
  const [soASubir, setSoASubir] = useState<HealthQuestion[]>([]);
  const [soHabituais, setSoHabituais] = useState<HealthQuestion[]>([]);
  const [growingDate, setGrowingDate] = useState<string | null>(null);
  const [askedDate, setAskedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const eixos = !axis || axis === 'all' ? EIXOS : [axis];
    const porEixo = !axis || axis === 'all' ? 3 : 8;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [repartidos, dataP, dataA] = await Promise.all([
          Promise.all(eixos.map(repartirEixo)),
          ultimaRecolha('pytrends'),
          ultimaRecolha('autocomplete'),
        ]);

        // Cada eixo contribui com o mesmo número de linhas, para nenhum eixo
        // grande engolir a coluna.
        const juntar = (chave: 'nasDuas' | 'soASubir' | 'soHabituais') =>
          repartidos.flatMap(r => r[chave].slice(0, porEixo)).map(mapear);

        if (!cancelled) {
          setNasDuas(juntar('nasDuas'));
          setSoASubir(juntar('soASubir'));
          setSoHabituais(juntar('soHabituais'));
          setGrowingDate(dataP);
          setAskedDate(dataA);
        }
      } catch (err) {
        console.error('Error fetching health questions:', err);
        if (!cancelled) {
          setNasDuas([]);
          setSoASubir([]);
          setSoHabituais([]);
          setGrowingDate(null);
          setAskedDate(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [axis]);

  return { nasDuas, soASubir, soHabituais, growingDate, askedDate, isLoading, TECTO };
}
