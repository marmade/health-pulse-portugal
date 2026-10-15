-- gravar_alertas_lote: substitui os alertas de um lote numa só transacção
-- =======================================================================
-- 15/10/2026, sessão 31. Desenho: docs/sessoes/2026-10-15.md §1.
-- Antes, o gravar() de scripts/trends_alertas.py apagava o lote num pedido HTTP e escrevia-o
-- em blocos de 500 noutros, sem transacção: uma falha de rede a meio deixava o lote vazio ou
-- parcial (aconteceu a 14/10, 2026-10-14.md §10). Agora há UM pedido (POST rpc/...), e o
-- PostgREST corre cada chamada numa transacção: o DELETE e o INSERT ficam ambos ou nenhum.
--
-- O lote_id vem do parâmetro, não das linhas. calculado_em fica no default now(), que é o
-- início da transacção: todas as linhas de uma gravação têm o mesmo instante.
-- Se o INSERT não escrever todas as linhas recebidas, aborta (e o DELETE desfaz-se).
-- Uma lista VAZIA é recusada (2026-10-15.md §1): apagaria o lote sem escrever nada.
--
-- Só a service_role a pode chamar (é ela que grava; anon e authenticated não).
-- SECURITY INVOKER: corre com os direitos de quem chama; search_path vazio, nomes qualificados.
--
-- Idempotente (regra 2 do CLAUDE.md): CREATE OR REPLACE; REVOKE e GRANT repetem-se sem erro.
-- Não cria tabelas nem políticas.

create or replace function public.gravar_alertas_lote(p_lote_id uuid, p_linhas jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  n integer;
begin
  if jsonb_typeof(p_linhas) is distinct from 'array' then
    raise exception 'gravar_alertas_lote: p_linhas tem de ser um array JSON';
  end if;
  if jsonb_array_length(p_linhas) = 0 then
    raise exception 'gravar_alertas_lote: lista vazia recusada — não apaga o lote sem escrever nada';
  end if;
  delete from public.trends_alertas where lote_id = p_lote_id;
  insert into public.trends_alertas
    (lote_id, eixo, termo, semana, tipo, valor, referencia, razao, z, ruido,
     fator_sazonal, max_anterior, semana_n, inicio)
  select p_lote_id, x.eixo, x.termo, x.semana, x.tipo, x.valor, x.referencia, x.razao, x.z, x.ruido,
         x.fator_sazonal, x.max_anterior, x.semana_n, x.inicio
  from jsonb_to_recordset(p_linhas) as x(
    eixo text, termo text, semana date, tipo text, valor numeric, referencia numeric,
    razao numeric, z numeric, ruido numeric, fator_sazonal numeric, max_anterior numeric,
    semana_n smallint, inicio date);
  get diagnostics n = row_count;
  if n <> jsonb_array_length(p_linhas) then
    raise exception 'gravar_alertas_lote: escritas % linhas de %', n, jsonb_array_length(p_linhas);
  end if;
  return n;
end;
$$;

revoke all on function public.gravar_alertas_lote(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.gravar_alertas_lote(uuid, jsonb) to service_role;

comment on function public.gravar_alertas_lote(uuid, jsonb) is
  'Substitui as linhas de um lote em trends_alertas numa só transacção (tudo-ou-nada). '
  'Chamada por scripts/trends_alertas.py gravar(). 15/10/2026, docs/sessoes/2026-10-15.md §1.';
