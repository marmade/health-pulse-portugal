-- Fecha a escrita anónima em todas as tabelas (09/09/2026)
--
-- Ponto 5 da sequência de 09/09/2026, e o último. Só pode ser aplicada DEPOIS
-- de o pipeline escrever com service_role — o que foi confirmado no workflow
-- #37, corrido à mão a 09/09/2026: POST /rest/v1/health_questions 201 e
-- DELETE+POST /rest/v1/youtube_trends 204/201, todos com papel `service_role`
-- no JWT. Aplicar isto antes disso teria desligado os passos 2, 4B e 5 sem dar
-- erro, porque o script 6 falha em silêncio.
--
-- O que se remove: 31 políticas de INSERT, UPDATE, DELETE e ALL concedidas ao
-- role `public` em 12 tabelas. Nove delas davam DELETE anónimo — um pedido com
-- a chave anon, que está num repositório público, apagava as 4626 linhas de
-- health_questions.
--
-- O que NÃO se remove: as políticas de SELECT. Todas as 12 tabelas têm política
-- de leitura própria, verificado antes de aplicar, incluindo o `bookmarks`,
-- cuja política de escrita era um ALL. O site continua a ler tudo o que lia.
--
-- Quem escreve a partir de agora: as Edge Functions e os 7 scripts do pipeline,
-- todos com service_role, que ignora o RLS.
--
-- DECISÃO DE 09/09/2026, assumida e não acidental: /admin deixa de escrever.
-- src/pages/Admin.tsx e src/pages/Guioes.tsx:447-449 escreviam com a chave anon
-- e passam a falhar com 401/42501. A gestão de conteúdos passa para o painel
-- Supabase até existir autenticação Supabase a sério. A password do Admin nunca
-- foi protecção: é comparada no cliente (Admin.tsx:463) e vai no bundle.
-- Enquanto as políticas estiverem ligadas ao role `public`, autenticar no
-- frontend não muda nada — as novas políticas terão de ser para `authenticated`.

drop policy if exists "Admin write" on public.bookmarks;  -- ALL
drop policy if exists "Allow public delete on briefings_archive" on public.briefings_archive;  -- DELETE
drop policy if exists "Allow public insert on briefings_archive" on public.briefings_archive;  -- INSERT
drop policy if exists "Allow public update on briefings_archive" on public.briefings_archive;  -- UPDATE
drop policy if exists "Allow public delete on debunking" on public.debunking;  -- DELETE
drop policy if exists "Allow public insert on debunking" on public.debunking;  -- INSERT
drop policy if exists "Allow public update on debunking" on public.debunking;  -- UPDATE
drop policy if exists "Public insert access" on public.eixos_archive;  -- INSERT
drop policy if exists "Allow public delete on guioes" on public.guioes;  -- DELETE
drop policy if exists "Allow public insert on guioes" on public.guioes;  -- INSERT
drop policy if exists "Allow public update on guioes" on public.guioes;  -- UPDATE
drop policy if exists "Allow public delete on guioes_semanais" on public.guioes_semanais;  -- DELETE
drop policy if exists "Allow public insert on guioes_semanais" on public.guioes_semanais;  -- INSERT
drop policy if exists "Allow public update on guioes_semanais" on public.guioes_semanais;  -- UPDATE
drop policy if exists "Allow public delete on health_questions" on public.health_questions;  -- DELETE
drop policy if exists "Allow public insert on health_questions" on public.health_questions;  -- INSERT
drop policy if exists "Allow public update on health_questions" on public.health_questions;  -- UPDATE
drop policy if exists "Allow public delete on keywords" on public.keywords;  -- DELETE
drop policy if exists "Allow public insert on keywords" on public.keywords;  -- INSERT
drop policy if exists "Allow public update on keywords" on public.keywords;  -- UPDATE
drop policy if exists "Allow public delete on news_items" on public.news_items;  -- DELETE
drop policy if exists "Allow public update on news_items" on public.news_items;  -- UPDATE
drop policy if exists "Allow public delete on sobre_conteudo" on public.sobre_conteudo;  -- DELETE
drop policy if exists "Allow public insert on sobre_conteudo" on public.sobre_conteudo;  -- INSERT
drop policy if exists "Allow public update on sobre_conteudo" on public.sobre_conteudo;  -- UPDATE
drop policy if exists "Allow public delete on textos" on public.textos;  -- DELETE
drop policy if exists "Allow public insert on textos" on public.textos;  -- INSERT
drop policy if exists "Allow public update on textos" on public.textos;  -- UPDATE
drop policy if exists "Allow public delete on youtube_trends" on public.youtube_trends;  -- DELETE
drop policy if exists "Allow public insert on youtube_trends" on public.youtube_trends;  -- INSERT
drop policy if exists "Allow public update on youtube_trends" on public.youtube_trends;  -- UPDATE
