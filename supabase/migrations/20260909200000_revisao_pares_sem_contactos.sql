-- Remove os contactos pessoais de revisao_pares (09/09/2026, sessão 12)
--
-- A tabela é lida publicamente pela página /revisao-pares e essa leitura fica
-- aberta de propósito: a revisão por pares é um dos três actos do projecto e as
-- linhas são o conteúdo da página. O que sai são os dados de contacto, que não
-- precisam de estar num site público para a revisão existir.
--
-- Isto fecha a exposição que ficou assinalada a 09/09/2026 na migração
-- 20260909180000: 4 e-mails e 3 telefones legíveis por quem abrisse a página.
-- Fechar o SELECT teria esvaziado a página; limpar os campos não.
--
-- NÃO se apagam linhas. Ficam as 4, com nome, especialidade, link, bio e
-- sumário — tudo o que a página mostra além do contacto.
--
-- O `hideContact` de RevisaoPares.tsx escondia estes campos no ecrã quando
-- app_settings.modo_apresentacao estava a 'true', mas os dados viajavam na
-- mesma para o browser. Agora não há o que viajar.

update public.revisao_pares
set email_a    = '',
    email_b    = '',
    telefone_a = '',
    telefone_b = ''
where coalesce(email_a,'')    <> ''
   or coalesce(email_b,'')    <> ''
   or coalesce(telefone_a,'') <> ''
   or coalesce(telefone_b,'') <> '';
