# Briefing — sessão 13 (2026-09-14)

> Escrito pela janela de estratégia (Cowork/claude.ai), para o Claude Code executar.
> As verificações abaixo foram feitas hoje, 14/09/2026, com método indicado. Re-verifica
> as que quiseres — os comandos estão na coluna do método —, mas não as re-deduzas de
> agregados nem do `CONTEXT.md`, que é o ficheiro que vais actualizar.

## Tarefa

Três coisas, por esta ordem. **Não apagar nada.** O que sai de circulação move-se para
`_antigos/`, com `git mv`, para o rasto ficar no histórico.

### 1. Acrescentar as verificações de hoje à tabela de Verificações do `CONTEXT.md`

| Afirmação | Data | Método | Resultado |
|---|---|---|---|
| O pipeline escreve com `service_role` numa corrida automática | 14/09/2026 | `[sessão 13][bd]` Contagens das 19 tabelas via MCP Supabase (`query_to_xml` sobre `pg_class`), comparadas com os números de 07/09 e 09/09 | Run **#38**, evento `schedule`, 14/09 12:18–12:35 UTC, `success`. `news_items` 278→**310**, `health_questions` 4604→**4647**, `guioes_semanais` 25→**29**, `eixos_archive` 24→**28**, `youtube_trends` 22→**19** (substituição: o script 4 faz DELETE). **É a primeira corrida agendada depois da migração `20260909190000`** — prova que o pipeline não depende da chave anon |
| `historical_snapshots` continua parada, por desactivação e não por falha | 14/09/2026 | `[sessão 13][bd]` Contagem directa | **3462 linhas, inalteradas** desde 07/09. Coerente com os passos 1 e 3 comentados a 14/08 |
| Nenhuma política de escrita sobreviveu para `public`/`anon` | 14/09/2026 | `[sessão 13][bd]` `pg_policies` filtrado a `cmd <> 'SELECT'`, com a coluna `roles` | **6 políticas de escrita, todas `{service_role}`**: `app_settings` (ALL), `historical_snapshots` (INSERT), `news_items` (INSERT), `plataforma_popups` (ALL), `sobre_conteudo` (ALL), `trends_cache` (ALL). Zero para `public` ou `anon`. O estado de 09/09 aguentou uma corrida completa |
| `contactos_projecto` mantém-se fechada | 14/09/2026 | `[sessão 13][bd]` `pg_class.relrowsecurity` + contagem de `pg_policies` | RLS activo, **0 políticas**, **4 linhas preservadas**. Inalterado desde 09/09 |
| Atraso do agendamento do GitHub Actions | 14/09/2026 | `[sessão 13][documento]` API pública do GitHub, `actions/runs`, runs #32–#38 | O `cron` pede 06:00 UTC. Arranques reais: #33 07:03, #34 07:06, #35 13:11, #36 12:02, **#38 12:18**. O atraso do GitHub em workflows agendados passou de ~1h para ~6h. **Não é falha** — registar para não ser interpretado como tal |
| Duas tabelas fora do modelo de dados documentado | 14/09/2026 | `[sessão 13][bd]` Listagem de `pg_class` comparada com a secção "Modelo de Dados" do `CONTEXT.md` | `plataforma_popups` (15 linhas, corresponde ao tab PLATAFORMA do admin) e `trend_data` (**0 linhas, vazia**). Nenhuma das duas consta do modelo. A segunda é candidata a remoção — **confirmar antes que nada no `src/` a lê** |

Actualiza também:
- o cabeçalho: última actualização 2026-09-14 (sessão 13)
- o Crítico nº 1: acrescentar que ficou provado em corrida agendada, não só manual
- a secção "Automatização", que ainda diz "Corre desde então (03/08, 10/08)" — vai em #38
- a secção "Stack", que ainda descreve a instância antiga como "em uso de facto" e o `.env`
  a apontar para lá. Isso foi corrigido a 09/09 (Crítico nº 3) e está desactualizado **no
  próprio documento** — é a mesma classe de erro que nos custou o arranque desta sessão
- a secção "Modelo de Dados": acrescentar `plataforma_popups` e `trend_data`

### 2. Criar `_antigos/` e mover o que está decidido

**`docs/sessoes/` não se move, e isto não está em discussão.** É o rasto do diagnóstico: foi
por existir que a sessão 12 apanhou dois erros da sessão 11. Arquivar o rasto é perder a
capacidade de corrigir o diagnóstico. Não perguntes, não moves.

**Move sem pedir confirmação** — decidido, critério cumprido (descreve um estado que já não
existe e a informação está recuperada noutro ficheiro):

- `scripts/.github/workflows/youtube-trends.yml` — workflow duplicado e órfão, confirmado a
  não executar (`AUDIT.md` secção 4, verificado 29/07/2026). `git mv` para
  `_antigos/scripts-github-workflows-youtube-trends.yml`

É só este. A colheita a sério vem com o corte do Lovable (Crítico nº 5): `Admin.tsx`, o
`lovable-tagger`, as referências ao preview. A pasta fica criada agora e ganha uso então.

**Estes dois exigem decisão, e é aqui que paras e perguntas** — o destino depende de factos
que só se sabem depois de olhar:

1. `scripts/migration_consolidada.sql` — a secção 5.19 foi reescrita a 09/09/2026 para que
   reaplicá-la não reabra a exposição de `contactos_projecto`. Verifica se ainda é o ficheiro
   de referência para recriar a instância. **Se for, fica onde está.** Diz-me o que
   encontraste e espera.
2. `scripts/switch_supabase.sh` — foi feito para alternar entre duas instâncias. Verifica se
   alguma coisa ainda o invoca (workflow, scripts, documentação). Com uma instância só, pode
   ter deixado de ter função — mas o corte do Lovable ainda não está feito. Diz-me o que
   encontraste e espera.

**Não versionados e já ignorados, deixar como estão:** `docs/.DS_Store`,
`docs/evidencia/.DS_Store`. O `bun.lockb` já não está na raiz — nada a fazer.

### 3. Commit

Um commit por cada uma das duas partes, mensagens no estilo do repositório.

## O que NÃO fazer nesta sessão

- não apagar linhas em nenhuma tabela — nem as 3462 de `historical_snapshots`, nem as 3634
  de autocomplete (o Crítico nº 7 exige exportação antes), nem as 4 de `contactos_projecto`
- não tocar na instância antiga: o SQL está em `docs/operacoes/` e quem o corre é a Marta
- não repor políticas de escrita para `public`
- não religar os passos 1 e 3 do workflow antes do Crítico nº 6
