-- Marca "contexto" nas verificações laterais à saúde
-- ===================================================
-- 2/11/2026. Decisão da Marta (docs/sessoes/2026-11-02-cowork.md §3 e 2026-11-02.md):
-- as verificações que a revisão de 29/10 deixou de fora — laterais à saúde (Messi/autismo,
-- Bolsonaro/Alzheimer, protestos contra vacinas, negação das ondas de calor…) — NÃO se
-- apagam: ficam na base como indícios, com esta marca, separadas da desinformação de
-- saúde directa. Até ao fecho de 6/11 ficam fora do ecrã e do briefing (seMostra, em
-- supabase/functions/_shared/factchecks.ts). O nome e o tipo da coluna, e a marca por
-- url (o assunto do artigo, não a keyword com que casou), foram escolha do Claude Code.
--
-- QUEM ESCREVE
--   scripts/11_fetch_fact_checks.py --contexto <ficheiro>, ao gravar (passo 6B).
--   O ficheiro é docs/evidencia/2026-10-29-fact-checks/exclusoes.json (25 urls).
--   O update abaixo marca as linhas que já estão na base: 21 a 2/11/2026, as que o
--   passo 6B gravou nesse dia sem --excluir.
--
-- Idempotente. REVERSÍVEL: alter table public.debunking drop column contexto.

alter table public.debunking
  add column if not exists contexto boolean not null default false;

comment on column public.debunking.contexto is
  'true = verificação lateral à saúde, guardada como indício (decisão da Marta, '
  '2/11/2026). Escrita pelo scripts/11 (--contexto). Fica fora do site e do '
  'briefing (seMostra); a /admin mostra-a.';

update public.debunking set contexto = true
where contexto = false and url in (
    'https://observador.pt/factchecks/cientista-que-produziu-vacina-contra-a-covid-19-e-a-crianca-de-uma-foto-de-emigrantes-turcos-na-alemanha/',
    'https://observador.pt/factchecks/fact-check-alemaes-anti-vacinas-beijaram-se-em-publico-para-protestar/',
    'https://observador.pt/factchecks/fact-check-boletins-meteorologicos-provam-que-temperaturas-nao-mudaram-desde-1986/',
    'https://observador.pt/factchecks/fact-check-calor-extremo-em-italia-faz-semaforo-derreter/',
    'https://observador.pt/factchecks/fact-check-charlie-chaplin-disse-que-o-sol-o-descanso-e-a-dieta-estao-entre-os-seis-melhores-remedios-do-mundo/',
    'https://observador.pt/factchecks/fact-check-chef-lubjomir-defendeu-ha-dias-fecho-de-restaurantes/',
    'https://observador.pt/factchecks/fact-check-china-compra-vacina-de-oxford-para-distribuir-a-populacao-em-vez-de-usar-a-que-produz/',
    'https://observador.pt/factchecks/fact-check-defesa-de-jair-bolsonaro-alegou-que-o-ex-presidente-tem-alzheimer/',
    'https://observador.pt/factchecks/fact-check-em-agosto-de-1944-foi-registada-onda-de-calor-semelhante-a-de-meados-de-julho-deste-ano/',
    'https://observador.pt/factchecks/fact-check-filho-de-bolsonaro-ultrapassou-profissionais-de-saude-e-foi-vacinado-contra-a-covid-19/',
    'https://observador.pt/factchecks/fact-check-fotografia-de-rio-mondego-com-caudal-reduzido-prova-que-alteracoes-climaticas-sao-ciclicas/',
    'https://observador.pt/factchecks/fact-check-ginecologista-detido-no-brasil-por-recusar-tratamento-a-uma-pessoa-travesti/',
    'https://observador.pt/factchecks/fact-check-idosos-excluidos-da-vacinacao-contra-a-covid-19-foi-uma-proposta-do-ps/',
    'https://observador.pt/factchecks/fact-check-imagens-de-aviao-de-combate-debaixo-de-fogo-intenso-sao-de-momento-de-confrontos-militares-na-ucrania/',
    'https://observador.pt/factchecks/fact-check-lionel-messi-foi-diagnosticado-com-autismo-aos-oito-anos/',
    'https://observador.pt/factchecks/fact-check-o-nome-covid-19-significa-doenca-originaria-da-china/',
    'https://observador.pt/factchecks/fact-check-onda-de-calor-em-portugal-de-1930-prova-que-aquecimento-global-nao-existe/',
    'https://observador.pt/factchecks/fact-check-papa-francisco-disse-que-alcoolicos-autistas-e-pessoas-com-deficiencia-devem-ser-sacrificados-no-combate-as-alteracoes-climaticas/',
    'https://observador.pt/factchecks/fact-check-policias-franceses-lancam-algemas-para-o-chao-e-juntam-se-a-manifestantes-contra-vacinas/',
    'https://observador.pt/factchecks/fact-check-revista-especializada-em-alzheimer-fez-capa-com-joe-biden-a-segurar-banana-como-se-fosse-um-telefone/',
    'https://observador.pt/factchecks/fact-check-ricardo-salgado-escreveu-livro-de-memorias-ja-depois-de-defesa-apresentar-um-diagnostico-de-alzheimer/',
    'https://observador.pt/factchecks/fact-check-rogerio-samora-morreu-na-sequencia-de-uma-paragem-cardiorrespiratoria/',
    'https://observador.pt/factchecks/fact-check-trump-disse-que-a-extrema-esquerda-quer-retirar-a-liberdade-a-populacao-global-atraves-do-hantavirus/',
    'https://observador.pt/factchecks/fact-check-trump-fez-publicacao-para-desmentir-problemas-de-incontinencia/',
    'https://observador.pt/factchecks/fact-check-video-mostra-protesto-contra-medidas-sanitarias-na-ucrania/'
);
