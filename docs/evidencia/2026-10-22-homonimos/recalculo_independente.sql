-- Recálculo independente da reclassificação (docs/sessoes/2026-10-22.md §8.2 ponto 3): a regra da
-- v2 escrita com as expressões regulares do Postgres, sobre a CÓPIA (o estado antes da escrita).
with termos as (select id, term from keywords),
sin as (select k.id, k.term, s.sy from keywords k, unnest(coalesce(k.synonyms, '{}')) s(sy)
        where s.sy not in (select term from keywords)),
dono as (select distinct on (sy) sy as palavra, term, id from sin
         order by sy, (position(lower(sy) in lower(term)) = 0), term),
canon as (select term as palavra, term, id from termos union all select palavra, term, id from dono),
pal as (select *, regexp_replace(palavra, '([.*+?^${}()|\[\]\\])', '\\\1', 'g') as esc,
               palavra ~ '^[A-ZÀ-Ý]{2,5}$' as sigla from canon),
v1 as (select id, title, related_term from news_items_20261022 where created_at < '2026-09-22'),
hits as (select v1.id, p.palavra, p.term, p.id kid from v1 join pal p on
           case when p.sigla then v1.title ~ ('(?<![[:alnum:]])' || p.esc || '(?![[:alnum:]])')
                else v1.title ~* ('(?<![[:alnum:]])' || p.esc || '(?![[:alnum:]])') end),
melhor as (select distinct on (id) id, palavra, term, kid from hits order by id, length(palavra) desc, palavra collate "C")
select v1.id, m.term as termo, m.palavra as casou, m.kid from v1 left join melhor m using (id);
