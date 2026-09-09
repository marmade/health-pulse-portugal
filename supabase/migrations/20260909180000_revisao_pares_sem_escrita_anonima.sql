-- Fecha a escrita anónima em revisao_pares (09/09/2026)
--
-- A tabela guarda dois perfis de revisores por eixo: nome, especialidade,
-- telefone, e-mail e link. A 09/09/2026 tinha 4 linhas — 4 com nome, 4 com
-- e-mail, 3 com telefone — e políticas `public` com `true` em SELECT, INSERT e
-- UPDATE. Qualquer pessoa com a chave anon, que está num repositório público,
-- podia reescrever os contactos dos revisores.
--
-- O SELECT FICA ABERTO, por decisão de 09/09/2026, e isso é uma exposição
-- assinalada, não resolvida: os 4 e-mails e os 3 telefones continuam legíveis
-- por quem abrir a página de Revisão de Pares. O `hideContact` de
-- RevisaoPares.tsx esconde-os no ecrã, mas os dados viajam na mesma para o
-- browser. Decisão adiada para depois.
--
-- Nenhum script do pipeline escreve nesta tabela, pelo que fechar as escritas
-- não depende da migração dos scripts para service_role.
--
-- Consequência assumida: src/pages/Admin.tsx deixa de poder criar ou editar
-- revisores. Passa pelo painel Supabase, que usa service_role e ignora o RLS.

drop policy if exists "Allow public insert on revisao_pares" on public.revisao_pares;
drop policy if exists "Allow public update on revisao_pares" on public.revisao_pares;

-- A política de leitura "Public read" mantém-se de propósito. Não a remover
-- sem decidir primeiro o que fazer aos contactos que ela expõe.

alter table public.revisao_pares enable row level security;
