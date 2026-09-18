-- keywords: a lista de 100, em duas colunas
-- ==========================================
-- 18/09/2026, sessão 16. Proposta aprovada pela Marta:
-- docs/evidencia/2026-09-18-vocabulario/lista-100-proposta.md — este ficheiro foi GERADO
-- a partir dela, linha a linha, para não haver diferença entre o aprovado e o aplicado.
-- Arquivo da tabela antes: docs/arquivo/2026-09-18-keywords-antes-da-lista-100/ (sha256).
--
-- O QUE FAZ
--   1. Três colunas novas: termo_institucional (de onde o termo veio, na forma da
--      instituição), tipo (V vernáculo · C comercial · S serviços · T tendência),
--      e o par inactivada_em / motivo_inactivacao — porque NADA SE APAGA.
--   2. Os que ficam iguais recebem tipo e termo_institucional = term.
--   3. Os reformulados mudam o `term` para a forma que as pessoas escrevem; o termo
--      antigo fica em termo_institucional E em synonyms — o pipeline das notícias casa
--      títulos pelos sinónimos, logo continua a apanhar a formulação institucional.
--   4. enxaqueca muda de eixo (saude-mental → emergentes), decisão da Marta.
--   5. Os que saem ficam is_active=false, com data e motivo. As linhas, os ids e as FKs
--      (news_items.keyword_id, health_questions.keyword_id) ficam intactos.
--   6. Entram os novos, com source 'google trends 2026-09-18' e a `category` atribuída a
--      18/09 nos rótulos que a tabela já usava (dois novos: Serviços e Peso). A regra e as
--      dúvidas: docs/evidencia/2026-09-18-vocabulario/classificacao-40-novas.md.
--   7. obesidade (era `obesidade infantil`) sai de Pediatria para Peso — a reformulação
--      tirou-lhe o "infantil", e o rótulo tinha de ir atrás.
--
-- current_volume/previous_volume/change_percent NÃO são tocados: são o legado da série
-- parada de 10/08 e o dashboard vai deixar de os ler (trends_calibrados).
-- REVERSÍVEL com o arquivo: todos os ids se mantêm.

alter table public.keywords
  add column if not exists termo_institucional text,
  add column if not exists tipo text,
  add column if not exists inactivada_em timestamptz,
  add column if not exists motivo_inactivacao text;

comment on column public.keywords.termo_institucional is
  'A formulação da instituição de origem (DGS, SNS 24, CUF…). Quando difere de `term`, a distância entre as duas é a hipótese do vocabulário, medida.';
comment on column public.keywords.tipo is 'V vernáculo · C comercial/terapêutico · S acesso a serviços · T tendência; combinações como V/T.';
comment on column public.keywords.motivo_inactivacao is 'Nada se apaga. Uma keyword que sai fica aqui com a razão e a data.';

update public.keywords set termo_institucional='ansiedade', tipo='V' where term='ansiedade' and is_active;
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('crise de ansiedade', '{}', 'Ansiedade', 'saude-mental', 'google trends 2026-09-18', 'V', null);
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('ansiedade social', '{}', 'Ansiedade', 'saude-mental', 'google trends 2026-09-18', 'V', null);
update public.keywords set term='depressão sintomas', termo_institucional='depressão', tipo='V',
  synonyms = array_append(array_remove(synonyms, 'depressão'), 'depressão') where term='depressão' and is_active;
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('depressão pós-parto', '{}', 'Perturbações', 'saude-mental', 'google trends 2026-09-18', 'V', null);
update public.keywords set term='stress sintomas', termo_institucional='stress', tipo='V',
  synonyms = array_append(array_remove(synonyms, 'stress'), 'stress') where term='stress' and is_active;
update public.keywords set term='síndrome de burnout', termo_institucional='burnout', tipo='V',
  synonyms = array_append(array_remove(synonyms, 'burnout'), 'burnout') where term='burnout' and is_active;
update public.keywords set term='ataque de pânico', termo_institucional='pânico', tipo='V',
  synonyms = array_append(array_remove(synonyms, 'pânico'), 'pânico') where term='pânico' and is_active;
update public.keywords set term='stress pós-traumático', termo_institucional='PTSD', tipo='V',
  synonyms = array_append(array_remove(synonyms, 'PTSD'), 'PTSD') where term='PTSD' and is_active;
update public.keywords set termo_institucional='alzheimer', tipo='V' where term='alzheimer' and is_active;
update public.keywords set termo_institucional='demência', tipo='V' where term='demência' and is_active;
update public.keywords set term='insónias', termo_institucional='insónia', tipo='V',
  synonyms = array_append(array_remove(synonyms, 'insónia'), 'insónia') where term='insónia' and is_active;
update public.keywords set termo_institucional='suicídio', tipo='V' where term='suicídio' and is_active;
update public.keywords set termo_institucional='automutilação', tipo='V' where term='automutilação' and is_active;
update public.keywords set termo_institucional='fobia social', tipo='V' where term='fobia social' and is_active;
update public.keywords set term='anorexia', termo_institucional='anorexia nervosa', tipo='V',
  synonyms = array_append(array_remove(synonyms, 'anorexia nervosa'), 'anorexia nervosa') where term='anorexia nervosa' and is_active;
update public.keywords set term='tdah', termo_institucional='TDAH adulto', tipo='V/T',
  synonyms = array_append(array_remove(synonyms, 'TDAH adulto'), 'TDAH adulto') where term='TDAH adulto' and is_active;
update public.keywords set term='bipolar', termo_institucional='perturbação bipolar', tipo='V',
  synonyms = array_append(array_remove(synonyms, 'perturbação bipolar'), 'perturbação bipolar') where term='perturbação bipolar' and is_active;
update public.keywords set term='toc', termo_institucional='perturbação obsessivo-compulsiva', tipo='V',
  synonyms = array_append(array_remove(synonyms, 'perturbação obsessivo-compulsiva'), 'perturbação obsessivo-compulsiva') where term='perturbação obsessivo-compulsiva' and is_active;
update public.keywords set term='autismo', termo_institucional='perturbações do espectro do autismo', tipo='V',
  synonyms = array_append(array_remove(synonyms, 'perturbações do espectro do autismo'), 'perturbações do espectro do autismo') where term='perturbações do espectro do autismo' and is_active;
update public.keywords set termo_institucional='dependências', tipo='V' where term='dependências' and is_active;
update public.keywords set synonyms = array_append(array_remove(synonyms, 'alcoolismo'), 'alcoolismo') where term='dependências' and is_active;
update public.keywords set is_active=false, inactivada_em=now(), motivo_inactivacao='junta-se a dependências (lista de 100, 18/09/2026)' where term='alcoolismo' and is_active;
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('psiquiatra', '{}', 'Serviços', 'saude-mental', 'google trends 2026-09-18', 'S', null);
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('psicologa', '{}', 'Serviços', 'saude-mental', 'google trends 2026-09-18', 'S', null);
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('antidepressivos', '{}', 'Tratamento', 'saude-mental', 'google trends 2026-09-18', 'C', null);
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('calmantes naturais', '{}', 'Alternativas', 'saude-mental', 'google trends 2026-09-18', 'C', null);
update public.keywords set termo_institucional='anemia', tipo='V' where term='anemia' and is_active;
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('alimentos ricos em ferro', '{}', 'Nutrição', 'alimentacao', 'google trends 2026-09-18', 'V', null);
update public.keywords set termo_institucional='colesterol alto', tipo='V' where term='colesterol alto' and is_active;
update public.keywords set termo_institucional='diabetes tipo 2', tipo='V' where term='diabetes tipo 2' and is_active;
update public.keywords set termo_institucional='pré-diabetes', tipo='V' where term='pré-diabetes' and is_active;
update public.keywords set termo_institucional='jejum intermitente', tipo='V/T' where term='jejum intermitente' and is_active;
update public.keywords set term='suplementos', termo_institucional='suplementos alimentares', tipo='C',
  synonyms = array_append(array_remove(synonyms, 'suplementos alimentares'), 'suplementos alimentares') where term='suplementos alimentares' and is_active;
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('creatina', '{}', 'Suplementos', 'alimentacao', 'google trends 2026-09-18', 'C', null);
update public.keywords set termo_institucional='dieta mediterrânica', tipo='V' where term='dieta mediterrânica' and is_active;
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('dieta', '{}', 'Dietas', 'alimentacao', 'google trends 2026-09-18', 'V', null);
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('alimentação saudável', '{}', 'Nutrição', 'alimentacao', 'google trends 2026-09-18', 'V', null);
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('emagrecer', '{}', 'Peso', 'alimentacao', 'google trends 2026-09-18', 'V/T', null);
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('ozempic', '{}', 'Peso', 'alimentacao', 'google trends 2026-09-18', 'C/T', null);
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('canetas para emagrecer', '{}', 'Peso', 'alimentacao', 'google trends 2026-09-18', 'C/T', null);
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('alimentação anti-inflamatória', '{}', 'Dietas', 'alimentacao', 'google trends 2026-09-18', 'T', null);
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('fígado gorduroso', '{}', 'Metabolismo', 'alimentacao', 'google trends 2026-09-18', 'V/T', null);
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('hipertensão', '{}', 'Cardiologia', 'alimentacao', 'google trends 2026-09-18', 'V', null);
update public.keywords set termo_institucional='alergias alimentares', tipo='V' where term='alergias alimentares' and is_active;
update public.keywords set term='refluxo', termo_institucional='refluxo gastroesofágico', tipo='V',
  synonyms = array_append(array_remove(synonyms, 'refluxo gastroesofágico'), 'refluxo gastroesofágico') where term='refluxo gastroesofágico' and is_active;
update public.keywords set termo_institucional='intolerância à lactose', tipo='V' where term='intolerância à lactose' and is_active;
update public.keywords set termo_institucional='doença celíaca', tipo='V' where term='doença celíaca' and is_active;
update public.keywords set term='glúten', termo_institucional='intolerância ao glúten', tipo='V',
  synonyms = array_append(array_remove(synonyms, 'intolerância ao glúten'), 'intolerância ao glúten') where term='intolerância ao glúten' and is_active;
update public.keywords set term='obesidade', termo_institucional='obesidade infantil', tipo='V', category='Peso',
  synonyms = array_append(array_remove(synonyms, 'obesidade infantil'), 'obesidade infantil') where term='obesidade infantil' and is_active;
update public.keywords set termo_institucional='ultraprocessados', tipo='V/T' where term='ultraprocessados' and is_active;
update public.keywords set term='intestino irritável', termo_institucional='síndrome de intestino irritável', tipo='V',
  synonyms = array_append(array_remove(synonyms, 'síndrome de intestino irritável'), 'síndrome de intestino irritável') where term='síndrome de intestino irritável' and is_active;
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('menopausa', '{}', 'Diagnóstico', 'menopausa', 'google trends 2026-09-18', 'V', null);
update public.keywords set term='sintomas menopausa', termo_institucional='menopausa sintomas', tipo='V',
  synonyms = array_append(array_remove(synonyms, 'menopausa sintomas'), 'menopausa sintomas') where term='menopausa sintomas' and is_active;
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('perimenopausa', '{}', 'Diagnóstico', 'menopausa', 'google trends 2026-09-18', 'V/T', null);
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('pré-menopausa', '{}', 'Diagnóstico', 'menopausa', 'google trends 2026-09-18', 'V', null);
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('idade menopausa', '{}', 'Diagnóstico', 'menopausa', 'google trends 2026-09-18', 'V', null);
update public.keywords set termo_institucional='menopausa precoce', tipo='V' where term='menopausa precoce' and is_active;
update public.keywords set term='andropausa', termo_institucional='menopausa masculina', tipo='V',
  synonyms = array_append(array_remove(synonyms, 'menopausa masculina'), 'menopausa masculina') where term='menopausa masculina' and is_active;
update public.keywords set termo_institucional='endometriose', tipo='V' where term='endometriose' and is_active;
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('adenomiose', '{}', 'Saúde da Mulher', 'menopausa', 'google trends 2026-09-18', 'V', null);
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('mioma', '{}', 'Saúde da Mulher', 'menopausa', 'google trends 2026-09-18', 'V', null);
update public.keywords set termo_institucional='candidíase', tipo='V' where term='candidíase' and is_active;
update public.keywords set term='sop', termo_institucional='síndrome do ovário poliquístico', tipo='V',
  synonyms = array_append(array_remove(synonyms, 'síndrome do ovário poliquístico'), 'síndrome do ovário poliquístico') where term='síndrome do ovário poliquístico' and is_active;
update public.keywords set termo_institucional='cancro da mama', tipo='V' where term='cancro da mama' and is_active;
update public.keywords set termo_institucional='osteoporose', tipo='V' where term='osteoporose' and is_active;
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('osteopenia', '{}', 'Complicações', 'menopausa', 'google trends 2026-09-18', 'V', null);
update public.keywords set termo_institucional='incontinência urinária', tipo='V' where term='incontinência urinária' and is_active;
update public.keywords set termo_institucional='suores noturnos', tipo='V' where term='suores noturnos' and is_active;
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('afrontamentos', '{}', 'Sintomas', 'menopausa', 'google trends 2026-09-18', 'V', null);
update public.keywords set term='tiroide', termo_institucional='doenças da tiroide', tipo='V',
  synonyms = array_append(array_remove(synonyms, 'doenças da tiroide'), 'doenças da tiroide') where term='doenças da tiroide' and is_active;
update public.keywords set term='reposição hormonal', termo_institucional='terapia hormonal', tipo='V/C',
  synonyms = array_append(array_remove(synonyms, 'terapia hormonal'), 'terapia hormonal') where term='terapia hormonal' and is_active;
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('menstruação', '{}', 'Saúde da Mulher', 'menopausa', 'google trends 2026-09-18', 'V', null);
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('ginecologista', '{}', 'Serviços', 'menopausa', 'google trends 2026-09-18', 'S', null);
update public.keywords set term='suplemento menopausa', termo_institucional='fitoterapia menopausa', tipo='C',
  synonyms = array_append(array_remove(synonyms, 'fitoterapia menopausa'), 'fitoterapia menopausa') where term='fitoterapia menopausa' and is_active;
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('climacare', '{}', 'Alternativas', 'menopausa', 'google trends 2026-09-18', 'C', null);
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('estradiol', '{}', 'Tratamento', 'menopausa', 'google trends 2026-09-18', 'C', null);
update public.keywords set termo_institucional='avc', tipo='V' where term='avc' and is_active;
update public.keywords set axis='emergentes', tipo='V', termo_institucional='enxaqueca' where term='enxaqueca' and is_active;
update public.keywords set termo_institucional='doenças cardiovasculares', tipo='V' where term='doenças cardiovasculares' and is_active;
update public.keywords set termo_institucional='lúpus', tipo='V' where term='lúpus' and is_active;
update public.keywords set term='sépsis', termo_institucional='sepsis', tipo='V',
  synonyms = array_append(array_remove(synonyms, 'sepsis'), 'sepsis') where term='sepsis' and is_active;
update public.keywords set termo_institucional='candida auris', tipo='V/T' where term='candida auris' and is_active;
update public.keywords set termo_institucional='vírus nipah', tipo='V/T' where term='vírus nipah' and is_active;
update public.keywords set term='sarampo', termo_institucional='sarampo surto', tipo='V',
  synonyms = array_append(array_remove(synonyms, 'sarampo surto'), 'sarampo surto') where term='sarampo surto' and is_active;
update public.keywords set term='dengue', termo_institucional='dengue europa', tipo='V',
  synonyms = array_append(array_remove(synonyms, 'dengue europa'), 'dengue europa') where term='dengue europa' and is_active;
update public.keywords set term='mpox', termo_institucional='mpox portugal', tipo='V',
  synonyms = array_append(array_remove(synonyms, 'mpox portugal'), 'mpox portugal') where term='mpox portugal' and is_active;
update public.keywords set term='gripe das aves', termo_institucional='gripe aviária H5N1', tipo='V',
  synonyms = array_append(array_remove(synonyms, 'gripe aviária H5N1'), 'gripe aviária H5N1') where term='gripe aviária H5N1' and is_active;
update public.keywords set termo_institucional='long covid', tipo='V' where term='long covid' and is_active;
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('covid sintomas', '{}', 'Doenças infecciosas', 'emergentes', 'google trends 2026-09-18', 'V', null);
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('gripe A', '{}', 'Doenças infecciosas', 'emergentes', 'google trends 2026-09-18', 'V', null);
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('hantavírus', '{}', 'Doenças infecciosas', 'emergentes', 'google trends 2026-09-18', 'T', null);
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('vírus do nilo ocidental', '{}', 'Doenças infecciosas', 'emergentes', 'google trends 2026-09-18', 'T', null);
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('mosquito tigre', '{}', 'Saúde pública', 'emergentes', 'google trends 2026-09-18', 'T', null);
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('norovírus', '{}', 'Doenças infecciosas', 'emergentes', 'google trends 2026-09-18', 'T', null);
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('difteria', '{}', 'Doenças infecciosas', 'emergentes', 'google trends 2026-09-18', 'T', null);
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('creutzfeldt-jakob', '{}', 'Neurologia', 'emergentes', 'google trends 2026-09-18', 'T', null);
update public.keywords set term='onda de calor', termo_institucional='calor extremo e saúde', tipo='V/T',
  synonyms = array_append(array_remove(synonyms, 'calor extremo e saúde'), 'calor extremo e saúde') where term='calor extremo e saúde' and is_active;
update public.keywords set term='microplásticos', termo_institucional='microplásticos sangue', tipo='T',
  synonyms = array_append(array_remove(synonyms, 'microplásticos sangue'), 'microplásticos sangue') where term='microplásticos sangue' and is_active;
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('lipedema', '{}', 'Saúde da Mulher', 'emergentes', 'google trends 2026-09-18', 'V/T', null);
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('infeção sexualmente transmissível', '{}', 'Doenças infecciosas', 'emergentes', 'google trends 2026-09-18', 'V', null);
insert into public.keywords (term, synonyms, category, axis, source, tipo, termo_institucional)
  values ('vacinas', '{}', 'Serviços', 'emergentes', 'google trends 2026-09-18', 'S', null);

-- os que saem: nada se apaga
update public.keywords set is_active=false, inactivada_em=now(), motivo_inactivacao='sem dados hoje; serviços entram como psiquiatra/psicologa (lista de 100, 18/09/2026)' where term='terapia online' and is_active;
update public.keywords set is_active=false, inactivada_em=now(), motivo_inactivacao='homónimo: 24 pesquisas relacionadas, nenhuma de saúde (lista de 100, 18/09/2026)' where term='solidão' and is_active;
update public.keywords set synonyms = array_append(array_remove(synonyms, 'prevenção suicídio'), 'prevenção suicídio') where term='suicídio' and is_active;
update public.keywords set is_active=false, inactivada_em=now(), motivo_inactivacao='absorvido por suicídio (lista de 100, 18/09/2026)' where term='prevenção suicídio' and is_active;
update public.keywords set is_active=false, inactivada_em=now(), motivo_inactivacao='linguagem de programa, sem procura — fica como achado da hipótese do vocabulário (lista de 100, 18/09/2026)' where term='desinstitucionalização saúde mental' and is_active;
update public.keywords set is_active=false, inactivada_em=now(), motivo_inactivacao='linguagem de programa, sem procura — fica como achado da hipótese do vocabulário (lista de 100, 18/09/2026)' where term='saúde mental jovens' and is_active;
update public.keywords set is_active=false, inactivada_em=now(), motivo_inactivacao='linguagem de programa, sem procura — fica como achado da hipótese do vocabulário (lista de 100, 18/09/2026)' where term='saúde mental sem-abrigo' and is_active;
update public.keywords set is_active=false, inactivada_em=now(), motivo_inactivacao='linguagem de programa, sem procura — fica como achado da hipótese do vocabulário (lista de 100, 18/09/2026)' where term='saúde mental no trabalho' and is_active;
update public.keywords set is_active=false, inactivada_em=now(), motivo_inactivacao='linguagem de programa, sem procura — fica como achado da hipótese do vocabulário (lista de 100, 18/09/2026)' where term='competências socioemocionais' and is_active;
update public.keywords set is_active=false, inactivada_em=now(), motivo_inactivacao='linguagem de programa, sem procura — fica como achado da hipótese do vocabulário (lista de 100, 18/09/2026)' where term='saúde mental escolar' and is_active;
update public.keywords set is_active=false, inactivada_em=now(), motivo_inactivacao='linguagem de programa, sem procura — fica como achado da hipótese do vocabulário (lista de 100, 18/09/2026)' where term='equipas comunitárias saúde mental' and is_active;
update public.keywords set is_active=false, inactivada_em=now(), motivo_inactivacao='linguagem de programa, sem procura — fica como achado da hipótese do vocabulário (lista de 100, 18/09/2026)' where term='reabilitação psicossocial' and is_active;
update public.keywords set is_active=false, inactivada_em=now(), motivo_inactivacao='linguagem de programa, sem procura — fica como achado da hipótese do vocabulário (lista de 100, 18/09/2026)' where term='saúde mental ensino superior' and is_active;
update public.keywords set is_active=false, inactivada_em=now(), motivo_inactivacao='linguagem de programa, sem procura — fica como achado da hipótese do vocabulário (lista de 100, 18/09/2026)' where term='literacia em saúde mental' and is_active;
update public.keywords set is_active=false, inactivada_em=now(), motivo_inactivacao='máximo 3 ao lado de dieta; 3 pesquisas relacionadas (lista de 100, 18/09/2026)' where term='dieta cetogénica' and is_active;
update public.keywords set is_active=false, inactivada_em=now(), motivo_inactivacao='sem procura com esta formulação (lista de 100, 18/09/2026)' where term='alimentação plant-based' and is_active;
update public.keywords set is_active=false, inactivada_em=now(), motivo_inactivacao='sem procura com esta formulação (lista de 100, 18/09/2026)' where term='açúcar e saúde' and is_active;
update public.keywords set is_active=false, inactivada_em=now(), motivo_inactivacao='sem procura com esta formulação (lista de 100, 18/09/2026)' where term='secura vaginal' and is_active;
update public.keywords set is_active=false, inactivada_em=now(), motivo_inactivacao='sem procura com esta formulação (lista de 100, 18/09/2026)' where term='libido menopausa' and is_active;
update public.keywords set is_active=false, inactivada_em=now(), motivo_inactivacao='a pergunta real é emagrecer, na Alimentação (lista de 100, 18/09/2026)' where term='peso na menopausa' and is_active;
update public.keywords set is_active=false, inactivada_em=now(), motivo_inactivacao='261 de 262 semanas a zero (lista de 100, 18/09/2026)' where term='resistência antibióticos' and is_active;
update public.keywords set is_active=false, inactivada_em=now(), motivo_inactivacao='sem procura com esta formulação (lista de 100, 18/09/2026)' where term='poluição e saúde' and is_active;
