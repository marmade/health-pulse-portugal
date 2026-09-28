-- Quatro desmentidos recuperam o link
-- ===================================
-- 28/09/2026, sessão 20. Aprovado pela Marta. Aplica-se DEPOIS da
-- 20260928120000, que cria `debunking.fonte_estado`.
--
-- ORIGEM DOS LINKS
--   A instância antiga guardava estes desmentidos com link
--   (docs/arquivo/2026-09-15-instancia-antiga/debunking.csv, lote de
--   08/03/2026 11:08). A migração de 25/03 trouxe-os para a nova sem link. A
--   28/09 cada página respondeu 200 e o título foi conferido contra o do
--   desmentido. Ver docs/sessoes/2026-09-28.md § 3.
--
--   O quinto link que responde, o de "Terapia hormonal causa cancro?", aponta
--   para o artigo da vitamina D. Não corresponde: não entra.
--
-- O QUE MUDA
--   · url, e fonte_estado 'sem fonte verificada' → 'verificada', nas quatro;
--   · o do maracujá passa do eixo menopausa para alimentacao (decisão da
--     Marta).
--   Nada mais: título, fonte e classificação ficam como estão.
--
-- Cada UPDATE confirma o título, para não escrever o link na linha errada se
-- um id tiver mudado. REVERSÍVEL: url = '', fonte_estado = 'sem fonte
-- verificada', e o maracujá de volta a menopausa.

update public.debunking
set url = 'https://poligrafo.sapo.pt/saude/jejum-agua-com-limao-e-hidratos-de-carbono-sete-mitos-e-verdades-sobre-nutricao/',
    fonte_estado = 'verificada'
where id = '3e6f941b-15a1-4615-888d-ff0da9489028'
  and title like 'Jejum, água com limão e hidratos de carbono%';

update public.debunking
set url = 'https://science.feedback.org/review/dozens-of-clinical-trials-ongoing-to-investigate-whether-vitamin-d-prevents-covid-19-no-firm-evidence-yet/',
    fonte_estado = 'verificada'
where id = '608c761a-e100-48d6-951f-f27f9a5ea9eb'
  and title like 'Vitamina D previne covid-19?%';

update public.debunking
set url = 'https://observador.pt/factchecks/fact-check-mpox-so-se-transmite-atraves-de-contacto-sexual/',
    fonte_estado = 'verificada'
where id = '416d89f1-247d-4f00-8ca2-7642706cf036'
  and title like 'Mpox só se transmite através de contacto sexual?%';

update public.debunking
set url = 'https://poligrafo.sapo.pt/fact-check/esta-provado-que-beber-sumo-de-maracuja-emagrece/',
    fonte_estado = 'verificada',
    eixo = 'alimentacao'
where id = 'eea0f98d-11e2-4aa5-b7e5-16816ccd93cc'
  and title = 'Está provado que beber sumo de maracujá emagrece?';

-- Tem de dar 4. Se der menos, um UPDATE não encontrou a linha: a migração
-- aborta e nada fica escrito.
do $$
declare n int;
begin
  select count(*) into n from public.debunking where fonte_estado = 'verificada';
  if n <> 4 then
    raise exception 'esperava 4 desmentidos verificados, há %', n;
  end if;
end $$;
