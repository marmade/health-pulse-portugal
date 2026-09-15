# Pendente — o Mural e o `expandir_mural()`

> **Registado a 15/09/2026 (sessão do Cowork), deliberadamente adiado.** Apareceu a
> reboque do trabalho da rotulagem, por esta cadeia: a ordem da lista de keywords não é
> determinista → quem escreve na tabela `keywords`? → `expandir_mural()`.
>
> **Fica em ficheiro e não só no registo de sessão**, porque foi hoje estabelecido que um
> pendente que só existe num `docs/sessoes/` é exactamente onde os pendentes se perdem.
> **A acção que falta: o Claude Code passa isto para os Restantes do `CONTEXT.md`.**

## Decisão já tomada

`[declarado]` **O Mural mantém-se.** Decisão da Marta, 15/09/2026. O Mural lista visualmente
todos os termos da área e é output próprio do projecto — é a forma visível da hipótese do
vocabulário já registada no `CONTEXT.md`: a lista curada como termo de comparação, os termos
detectados nas pesquisas reais ao lado, e a zona onde não coincidem como objecto do projecto.

**O que está em causa não é o Mural — é o caminho de escrita.** A objecção inicial desta
sessão confundiu os dois e foi retirada.

## Os quatro defeitos do `expandir_mural()`

`[sessão 14][ficheiro]` `scripts/6_fetch_health_questions.py:288-338`, lido a 15/09/2026.

1. **`is_active: True` no payload (l.323).** Um termo detectado entra imediatamente na lista
   que **rotula as notícias** — a `fetch-rss-feeds` selecciona `is_active=true` (`index.ts:157`)
   — e na recolha de trends. Estar no Mural e rotular notícias são hoje o mesmo campo, e
   têm de ser dois.
2. **Não há coluna de proveniência.** Depois de inserido, um termo detectado é
   indistinguível de um curado. É isto, e não a inserção, que apaga a afirmação
   `[declarado]` de que a lista das 83 vem do SNS 24 e da DGS. Com `origem`
   (curadoria/detectado) + data, a lista original continua recuperável e o Mural passa a
   **mostrar** a distinção em vez de a apagar.
3. **Escreve volumes fabricados** (l.325-327): `previous_volume: 0`, `trend: "up"` fixo,
   `current_volume` igual ao `relative_volume` inventado do próprio script 6. Contradiz a
   regra estabelecida — nenhuma ausência ou falha de recolha se escreve como valor.
   O termo entra; o volume fica `NULL` com estado explícito.
4. **A selecção dos 20 não é um ranking** (l.307-308). Ordena por `growth_percent`
   decrescente e corta nos primeiros 20, mas **36,3% dos valores de crescimento do pytrends
   estão empatados no tecto de 9999** (`docs/arquivo/2026-09-15-health-questions/`). O grupo
   do tecto vem todo à frente e os 20 escolhidos são arbitrários dentro dele.

## O HTTP 400 — o que muda

O `expandir_mural()` falha com HTTP 400 há semanas, sem diagnóstico (achado na sessão 11).

**Não é para corrigir já** — não porque a função não deva existir, mas porque **no minuto em
que voltar a funcionar começa a escrever com o desenho actual**, incluindo os quatro pontos
acima. Diagnosticar é barato e pode ser feito em paralelo; **religar é que não**.

*Dedução, não verificação:* desde 09/09/2026 os scripts escrevem com `service_role`, logo
**não é** bloqueio de RLS; um 400 é pedido malformado, tipicamente desencontro com o schema.
**Ninguém foi verificar.**

## Ordem

1. decidir os quatro pontos acima (separar Mural de rotulagem; proveniência; volumes; selecção)
2. só depois diagnosticar e religar o 400

Fixar o `ORDER BY` da consulta de keywords é independente e pode vir antes de qualquer um dos dois.
