# Corrida de teste #3 da via B — 01/10/2026, a 1.ª da versão nova

A recolha do Google Trends pelos dois caminhos, no mesmo dia e à mesma hora: a **via funcao**
(GitHub → `trends-buscar-grupo` no Supabase, região fixa eu-west-1 → Google) e a **via
pytrends** (Mac → Google). As duas corridas foram `--dry-run`: nada foi gravado na base.
Versão nova da via B (commit `0bb626f`): região fixa, registo por tentativa, segunda volta.
Registo da sessão: `docs/sessoes/2026-10-01.md` §7; análise: `2026-10-01-cowork.md` §6–7.

## Ficheiros

| ficheiro | o que é |
|---|---|
| `dump-via-funcao.json` | script 5 pela via funcao, no workflow `via-b-corrida-de-teste.yml`, arrancado à mão pela Marta. Artefacto `dump-via-funcao-36882073238` do GitHub, tirado do zip sem alterações (sha256 `dc632e5d…`) |
| `dump-via-pytrends.json` | script 5 pela via pytrends, no Mac — o controlo do mesmo dia |
| `comparar_vias.txt` | o output de `scripts/comparar_vias.py dump-via-funcao.json dump-via-pytrends.json` (saída 0) |

## Horas (UTC, primeiro e último pedido de cada dump)

| corrida | de | até |
|---|---|---|
| via funcao | 15:09:59 | 15:26:58 |
| via pytrends | 15:14:55 | 15:27:22 |

## Resultados

1. **Critério de 30/09 §14, escrito a 30/09 — depois do resultado da 1.ª corrida (30/09),
   antes desta: PASSOU.** 33 de 33 pedidos recolhidos pelas duas vias, sem `sem_dados`;
   top 5 igual nos quatro eixos — os mesmos 5 termos, pela mesma ordem; semanas e marcações
   de semana incompleta iguais.
2. **Via funcao:** 37 tentativas, todas em **eu-west-1**, `tem_nid` em todas, 572–1064 ms
   cada. Quatro 429 (`multiline`) em 3 pedidos do passo 1: dois recuperados na repetição de
   60 s, um na segunda volta (`menopausa·menstruação·mioma·osteopenia·osteoporose`).
   **Sem a segunda volta, a corrida teria dado NÃO PASSOU.**
3. **Via pytrends:** cinco 429, todos recuperados na repetição de 60 s.
4. **Só informação:** medianas dos 100 termos — correlação 1,000, diferença 0,00, 100 % das
   semanas a ≤ 2 (30/09: 0,790 / 0,83 / 92,5 %). 20 dos 33 pedidos com séries idênticas;
   nos outros 13, 16 valores diferentes em cerca de 43 000, nenhum acima de 2 pontos, 13
   deles na semana incompleta de 27/09. O pytrends de hoje não tem nenhuma série igual à do
   pytrends de 30/09 (30 pedidos comuns).

## O que isto não prova

- **Porque é que as duas vias deram hoje a mesma amostra.** A 30/09 também correram à mesma
  hora e deram amostras diferentes, com a função em us-west-1; hoje, em eu-west-1, a mesma.
  A região é a candidata — leitura não verificada. Uma corrida não prova a causa.
- É 1 de 3 corridas. A via B só fica aprovada com três (`2026-09-30-cowork.md` §14).
- Nenhuma corrida gravou: os dumps não mostram como sairia um lote, nem os alertas.
