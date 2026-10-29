-- Marca das verificações sobre a covid-19
-- =======================================
-- 29/10/2026. Decisão da Marta: no site, as verificações sobre a covid-19 ficam
-- num separador próprio, "Covid-19", fora dos quatro eixos; no briefing não
-- muda nada. Como guardar a marca foi escolha do Claude Code: uma coluna.
--
-- QUEM ESCREVE
--   scripts/11_fetch_fact_checks.py, ao gravar:
--   · na primeira carga (29/10), a regra mais as decisões da Marta sobre os
--     casos duvidosos — docs/evidencia/2026-10-29-fact-checks/
--     covid-casos-duvidosos.md e covid-decisoes.json (175 de 240);
--   · nas semanas seguintes, só a regra.
--   As 36 linhas semeadas a 25/03 ficam com false (o default).
--
-- Aplica-se ANTES do --gravar da primeira carga: as marcas entram na mesma
-- escrita. REVERSÍVEL: alter table public.debunking drop column covid.

alter table public.debunking
  add column if not exists covid boolean not null default false;

comment on column public.debunking.covid is
  'true = a covid-19 é o assunto da afirmação verificada (critério da Marta, '
  '29/10/2026). Escrita pelo scripts/11. No site vai para o separador '
  '"Covid-19", fora dos eixos; o briefing não a usa.';
