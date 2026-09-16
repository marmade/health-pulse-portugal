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
 * Medido a 16/09/2026: apanham **169 das 3634** linhas do autocomplete (4,7%)
 * contra **4 das 1013** do Trends (0,4%), onde o `geo=PT` funciona.
 *
 * `insôni` entrou depois das outras e sozinha vale 42 linhas — a lista cresce
 * quando alguém olha, e é essa a sua natureza: apanha o que lá está escrito.
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
  /\binsôni/i,           // insônia (PT: insónia) — apanhada a 16/09 numa lista
];

const daOutraNorma = (pergunta: string) =>
  MARCAS_OUTRA_NORMA.some(rx => rx.test(pergunta));

/**
 * Saúde animal. Lista separada da de origem por decisão de 16/09/2026: um
 * filtro, um critério — com as duas razões na mesma regra ninguém conseguiria
 * saber, mais tarde, por que motivo uma linha desapareceu.
 *
 * O Autocomplete devolve-as porque as pessoas perguntam mesmo pela saúde dos
 * seus animais com as mesmas palavras ("sintomas de alzheimer em cachorro"): os
 * seeds do script 7 são construídos a partir das keywords do projecto, e o
 * Google completa-os com o que lhe pedem de facto. Não é defeito de recolha, é
 * âmbito — este painel é sobre saúde humana.
 *
 * Medido a 16/09/2026: 72 linhas em 4647 — 71 no autocomplete e 1 no Trends.
 * Verificado uma a uma: nenhuma é falso positivo, todas as ocorrências de
 * `gato`, `cão` e `canina` nestes dados são veterinárias.
 *
 * `veterinári` e `pet` não apanham nada hoje. Ficam porque são o vocabulário
 * óbvio deste âmbito e as recolhas futuras não vão ser relidas por ninguém.
 */
const MARCAS_SAUDE_ANIMAL = [
  /\bcachorr|\bcadela\b|\bfilhote/i,
  /\bc[ãa]o\b|\bc[ãa]es\b|\bcãozinho/i,
  /\bgat[oa]s?\b|\bfelin/i,
  /\bcanin/i,
  /\bveterin[áa]ri/i,
  /\bpets?\b/i,
];

const eSaudeAnimal = (pergunta: string) =>
  MARCAS_SAUDE_ANIMAL.some(rx => rx.test(pergunta));

const naoMostrar = (pergunta: string) =>
  daOutraNorma(pergunta) || eSaudeAnimal(pergunta);

/**
 * O TIPO DE DÚVIDA, lido do próprio texto da pergunta.
 *
 * Os 10 moldes do script 7 ("sintomas de {k}", "o que é {k}", "como tratar
 * {k}"…) deixam marca no texto, e essa marca diz o que a pergunta quer saber —
 * reconhecer, perceber, resolver, ou apenas saber se é normal.
 *
 * Serve para escolher o que a coluna "só habituais" mostra. Sem isto a escolha
 * era do alfabeto: há 84 perguntas empatadas no valor máximo, o desempate é por
 * texto, e o resultado eram cinco linhas começadas em «como» e «o que é» por
 * acaso da ordenação.
 *
 * RESSALVA, e é grande: a mistura de tipos no autocomplete é em boa parte
 * NOSSA. Três dos dez moldes pedem sintomas, logo «31% são sobre sintomas» diz
 * mais sobre o instrumento do que sobre quem procura. No pytrends não é assim —
 * aí o Google devolve o que quer, sem moldes nossos.
 */
const TIPOS: Array<[string, RegExp]> = [
  ['o que é', /^o\W?que (é|e)\b/i],
  ['sintomas', /^sintomas d|\bsintomas\b/i],
  ['causas', /^causas d|\bcausas\b|^o que causa\b/i],
  ['tratamento', /^como tratar\b|^tratamento para\b|\btratamento\b|^o que tomar\b|^como curar\b/i],
  ['prevenção', /^como prevenir\b|^como evitar\b/i],
  ['é normal', /^é normal\b|^e normal\b/i],
  ['diagnóstico', /^como diagnosticar\b|^como saber se\b/i],
];

const tipoDaPergunta = (pergunta: string) =>
  TIPOS.find(([, rx]) => rx.test(pergunta))?.[0] ?? 'outro';

/**
 * Uma pergunta de cada tipo, e o arranque roda de eixo para eixo — com 3 linhas
 * por eixo e um arranque fixo, o painel mostrava sempre os mesmos três tipos e
 * nunca chegava a «é normal ter», que são 124 perguntas e as mais eloquentes
 * que estes dados têm.
 */
function umaDeCadaTipo<T extends { question: string }>(
  linhas: T[],
  quantas: number,
  rodar: number,
): T[] {
  const ordem = TIPOS.map(([rot]) => rot).concat('outro');
  const rodada = [...ordem.slice(rodar % ordem.length), ...ordem.slice(0, rodar % ordem.length)];
  const escolhidas: T[] = [];
  const usadas = new Set<T>();

  for (const tipo of rodada) {
    if (escolhidas.length >= quantas) break;
    const achada = linhas.find(l => !usadas.has(l) && tipoDaPergunta(l.question) === tipo);
    if (achada) {
      escolhidas.push(achada);
      usadas.add(achada);
    }
  }
  // Se não houver tipos que cheguem, completa pela ordem em que vieram.
  for (const l of linhas) {
    if (escolhidas.length >= quantas) break;
    if (!usadas.has(l)) {
      escolhidas.push(l);
      usadas.add(l);
    }
  }
  return escolhidas;
}
const POR_EIXO_PYTRENDS = 100;
/**
 * O conjunto de onde a quota por tipo escolhe. Tem de ser largo: as linhas vêm
 * ordenadas por `relative_volume` e desempatadas por texto, logo um conjunto
 * curto fica cheio das que começam em «c» e sem nenhuma «o que é…» — e a quota
 * escolheria de um saco já enviesado pelo alfabeto, que é o defeito que ela
 * existe para corrigir. 400 cobre tudo o que está acima do chão de 10 em cada
 * eixo (~300 linhas).
 */
const POR_EIXO_AUTOCOMPLETE = 400;

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

/**
 * Os três conjuntos de um eixo.
 *
 * `desdeAutocomplete` corta o autocomplete na recolha mais recente. Decisão de
 * 16/09/2026: a tabela ACUMULA — o upsert actualiza quem reaparece e deixa quem
 * desapareceu com a data antiga —, logo sem corte a página mostrava perguntas
 * de Março ao lado de perguntas de Setembro, todas como "o que as pessoas
 * perguntam". Eram 909 em 3634.
 *
 * NADA É APAGADO: o corte é de leitura. As linhas ficam na base com a data em
 * que foram vistas pela última vez, que é o que permite medir a rotatividade
 * das dúvidas — e o que vai alimentar o arquivo nas páginas de eixo.
 *
 * O MESMO CORTE NÃO SE APLICA AO PYTRENDS, e a razão é medida: das 183
 * perguntas dessa fonte só 21 são da recolha de 14/09, e o eixo `emergentes`
 * fica com UMA. O painel mostra 3 por eixo em duas colunas. Em vez do corte, a
 * coluna diz que a lista inclui recolhas anteriores.
 */
async function repartirEixo(eixo: string, desdeAutocomplete: string | null) {
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
    (() => {
      const q = supabase
        .from('health_questions')
        .select('*')
        .eq('source', 'autocomplete')
        .eq('is_question', true)
        .eq('axis', eixo);
      return desdeAutocomplete ? q.gte('last_seen_at', desdeAutocomplete) : q;
    })()
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
    nasDuas: linhasP.filter(l => nasDuasSet.has(l.question) && !naoMostrar(l.question)),
    soASubir: linhasP.filter(l => !nasDuasSet.has(l.question) && !naoMostrar(l.question)),
    soHabituais: linhasA.filter(
      l => !nasDuasSet.has(l.question) && !naoMostrar(l.question),
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
        // A data da última recolha do autocomplete tem de vir ANTES: é ela que
        // define o corte. Daí não estar no mesmo Promise.all.
        const [dataP, dataA] = await Promise.all([
          ultimaRecolha('pytrends'),
          ultimaRecolha('autocomplete'),
        ]);
        const corte = dataA ? `${dataA.slice(0, 10)}T00:00:00Z` : null;
        const repartidos = await Promise.all(
          eixos.map(eixo => repartirEixo(eixo, corte)),
        );

        // Cada eixo contribui com o mesmo número de linhas, para nenhum eixo
        // grande engolir a coluna.
        const juntar = (chave: 'nasDuas' | 'soASubir') =>
          repartidos.flatMap(r => r[chave].slice(0, porEixo)).map(mapear);

        // "Só habituais" não tem medida nenhuma para ordenar — ver TIPOS acima.
        const habituais = repartidos
          .flatMap((r, i) => umaDeCadaTipo(r.soHabituais, porEixo, i))
          .map(mapear);

        if (!cancelled) {
          setNasDuas(juntar('nasDuas'));
          setSoASubir(juntar('soASubir'));
          setSoHabituais(habituais);
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
