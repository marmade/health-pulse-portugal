-- Correcções à marca da covid-19 nas verificações gravadas a 2/11/2026
-- =====================================================================
-- Decisão da Marta, 2/11/2026 (docs/sessoes/2026-11-02.md §5 e §7). Critério de 29/10: a covid
-- é o assunto da afirmação. Corrigem-se só os casos claros:
--   · "sem telemóvel não é possível obter o certificado de vacinação" → true. A regra do
--     script não o apanha: "vacinação" não casa com `vacinad`. Precedente de 29/10: "crianças
--     entre os 5 e os 11 anos têm de ter telemóvel…", marcada;
--   · "o Certificado Digital de Vacinação serve para entrar em Espanha mas não para regressar"
--     (Junho de 2021, o certificado digital COVID da UE) → true;
--   · "Vacinas da Hepatite B contêm óxido de grafeno" → false. A regra marcou-a pelo termo
--     fraco "grafeno" na janela 2020–2023, mas a afirmação é sobre outra vacina. Precedente
--     de 29/10: desmarcadas as que falam de outra doença.
-- Ficam como estão, para a revisão depois do fecho: Decathlon, recordes de mortalidade e
-- Biden/Fórum Económico Mundial.
--
-- A regra do script (e_covid) não muda. Se a API devolver um destes urls com outra keyword,
-- a linha nova entra com a marca da regra.
-- Idempotente. Aplicada pela MCP como debunking_covid_correccoes_2026_11_02.

update public.debunking set covid = true
where covid = false and url in (
  'https://observador.pt/factchecks/fact-check-sem-telemovel-nao-e-possivel-obter-um-certificado-digital/',
  'https://observador.pt/factchecks/fact-check-certificado-digital-ainda-nao-permite-voar-de-regresso-a-portugal/'
);

update public.debunking set covid = false
where covid = true and url in (
  'https://observador.pt/factchecks/fact-check-as-vacinas-contra-a-hepatite-b-contem-oxido-de-grafeno/'
);
