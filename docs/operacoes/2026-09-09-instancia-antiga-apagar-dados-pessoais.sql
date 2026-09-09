-- Apagar os dados pessoais na instância ANTIGA cyjwhmuakmiytypewwfw
-- Sessão 12, 09/09/2026
--
-- ONDE CORRER: painel Supabase → projecto cyjwhmuakmiytypewwfw → SQL Editor.
-- NÃO é uma migração deste repositório e não deve ser posta em
-- supabase/migrations/ — essa pasta é da instância nova (ijpxjpbjudaddfatibfl).
-- O Claude Code não tem acesso administrativo a esta instância: o MCP devolve
-- "You do not have permission". Quem corre isto é a Marta.
--
-- PORQUÊ: a instância antiga responde a pedidos e não está protegida. As mesmas
-- 4 pessoas de contactos_projecto e os mesmos revisores continuam legíveis por
-- quem tenha a chave anon dessa instância, que está no histórico público do
-- git. Fechar o RLS lá não vale o trabalho: a instância vai ser apagada por
-- inteiro. Isto é para não ficar exposto no intervalo.
--
-- SEM EXPORTAÇÃO, por decisão de 09/09/2026. Verificado nesse dia, antes de
-- decidir, que não se perde nada:
--   · contactos_projecto — a impressão md5 dos nomes é idêntica nas duas
--     instâncias (9c47acfd…). São as mesmas 4 pessoas, e a instância nova tem-nas
--     intactas e já fechada ao acesso anónimo.
--   · revisao_pares — as bios EXISTEM na instância nova. O md5 do texto de
--     bio_a e bio_b, depois de trim, é IDÊNTICO nas duas (1270eee4…, 2a5cd574…).
--     A diferença de 1 caractere no comprimento é espaço no fim.
--     (Isto corrige o que a sessão 11 registou: não há 174 caracteres a perder.)
--
-- A seguir a isto, apagar o projecto inteiro no painel resolve o resto.

-- ── 1. ANTES: confirmar o que lá está ────────────────────────────────────────
select 'contactos_projecto' as tabela, count(*) as linhas from public.contactos_projecto
union all
select 'revisao_pares', count(*) from public.revisao_pares;
-- Esperado: 4 e 4.

-- ── 2. APAGAR ────────────────────────────────────────────────────────────────
-- Irreversível. Não há cópia destas linhas nesta instância depois disto.
delete from public.contactos_projecto;
delete from public.revisao_pares;

-- ── 3. DEPOIS: confirmar que ficou vazio ─────────────────────────────────────
select 'contactos_projecto' as tabela, count(*) as linhas from public.contactos_projecto
union all
select 'revisao_pares', count(*) from public.revisao_pares;
-- Esperado: 0 e 0.
