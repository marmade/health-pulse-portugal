-- Fecha o acesso público a contactos_projecto (09/09/2026)
--
-- Motivo: a tabela é a agenda de trabalho do projecto — nome, e-mail, telefone,
-- especialidade e bio de pessoas reais. Nunca foi conteúdo do site. A migração
-- 20260320193223_701e193c-a978-482b-b953-f10e41e0b4dd.sql criou-a com quatro
-- políticas `using (true)` / `with check (true)` para o role `public`, o que deu
-- leitura, inserção, alteração e remoção anónimas a quem tivesse a chave anon —
-- que está no `.env` de um repositório público e hardcoded em
-- scripts/6_fetch_health_questions.py e scripts/7_fetch_autocomplete_questions.py.
--
-- As linhas NÃO são apagadas: são dados de trabalho e ficam na tabela.
-- O que se remove é o acesso anónimo a elas.
--
-- Com o RLS activo e zero políticas, o Postgres nega tudo aos roles anon e
-- authenticated. O `service_role` ignora o RLS, pelo que a agenda continua
-- acessível pelo painel Supabase e pelo MCP.
--
-- Consequência assumida no frontend:
--   · src/pages/RevisaoPares.tsx:80 passa a receber `[]` e mostra
--     "Sem contactos registados" (l.170). É o comportamento correcto.
--   · src/pages/Admin.tsx:209,260,269,283 deixa de ler e de escrever contactos.
--     A gestão da agenda passa a ser feita pelo painel Supabase até existir
--     autenticação a sério (a de Admin.tsx é uma password no cliente, l.463).

drop policy if exists "Allow public read on contactos_projecto"   on public.contactos_projecto;
drop policy if exists "Allow public insert on contactos_projecto" on public.contactos_projecto;
drop policy if exists "Allow public update on contactos_projecto" on public.contactos_projecto;
drop policy if exists "Allow public delete on contactos_projecto" on public.contactos_projecto;

-- Reafirmado explicitamente: sem isto, uma tabela sem políticas mas com RLS
-- desligado ficaria aberta a toda a gente.
alter table public.contactos_projecto enable row level security;
