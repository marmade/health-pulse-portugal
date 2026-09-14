# CONTEXT.md — Reportagem Viva / Diz que Disse
> Fonte de verdade do estado actual do projecto. Actualizado a cada sessão.
> Última actualização: 2026-09-14 (sessão 13)
> Incidente em curso desde Maio/2026 — ver `AUDIT.md` para o diagnóstico completo.
> **Escrita anónima fechada a 09/09/2026** em `ijpxjpbjudaddfatibfl`, depois de o pipeline
> passar a escrever com `service_role`. Nenhum dado foi apagado. **O `/admin` deixou de
> escrever — decisão datada, ver "Estado do Admin".**
> Na instância nova **já não há contactos pessoais legíveis**: `contactos_projecto` está
> fechada ao anónimo e os e-mails e telefones de `revisao_pares` foram esvaziados a
> 09/09/2026 (sessão 12), sem apagar linhas nem esvaziar a página.
> **Fica uma exposição:** os mesmos dados na instância antiga `cyjwhmuakmiytypewwfw`, que
> responde e não está protegida. SQL pronto em `docs/operacoes/`; a instância vai ser
> apagada por inteiro. Ver Pendentes Críticos nº 4.

---

## Verificações

> Cada linha diz o que foi verificado, quando e como. Afirmação sem método é suposição.
> Antes de agir sobre qualquer destas linhas, confirma a data: verificação com mais de um mês não é estado actual.

> **Onde foi verificado.** `[nesta sessão]` = Claude Code, com comando reproduzível, na data
> da própria linha (07/09 na sessão 10, 09/09 nas sessões 11 e 12) ·
> `[claude.ai, transcrito]` = verificado noutra janela e passado para aqui sem re-execução ·
> `[declarado]` = afirmado pela Marta, sem teste · `[sessão anterior]` = verificado antes da
> sessão que o regista, data na coluna · `[por testar]` = nunca verificado

> **Segundo eixo, desde a sessão 13.** As linhas de 14/09/2026 levam também `[bd]`,
> `[ficheiro]` ou `[documento]` — **o que foi lido**, não só onde; e `[agregado]` como
> modificador quando o valor é uma contagem ou média. Convenção decidida a 09/09/2026; as
> linhas anteriores ainda não a levam, ver Restantes.

| Afirmação | Data | Método | Resultado |
|---|---|---|---|
| O pipeline escreve com `service_role` numa corrida **agendada** | 14/09/2026 | `[sessão 13][bd][agregado]` `count(*)` por tabela nas 19 (`query_to_xml` sobre `pg_class`, MCP Supabase), comparado com 07/09 e 09/09 · `[documento]` API pública do GitHub, `actions/runs` | Run **#38**, evento `schedule`, 14/09 12:18–12:35 UTC, `success`. `news_items` 278→**310**, `health_questions` 4604→**4647**, `guioes_semanais` 25→**29**, `eixos_archive` 24→**28**, `youtube_trends` 22→**19** (substituição: o script 4 faz DELETE). **Primeira corrida agendada depois da migração `20260909190000`** — e a primeira de qualquer tipo: o #37 foi manual e anterior à migração. Escreveu com **zero políticas de escrita para `public`/`anon`**. **Ressalva:** a chave anon continua a invocar as Edge Functions dos passos 4, 6 e 7 (`youtube-trends.yml:10`) — o que ficou provado é que a **escrita** não depende dela, não que saiu do pipeline |
| `historical_snapshots` continua parada, por desactivação e não por falha | 14/09/2026 | `[sessão 13][bd][agregado]` `count(*)` directo | **3462 linhas, inalteradas** desde 07/09. Coerente com os passos 1 e 3 comentados a 14/08/2026 |
| Nenhuma política de escrita sobreviveu para `public`/`anon` | 14/09/2026 | `[sessão 13][bd]` `pg_policies` filtrado a `cmd <> 'SELECT'`, com a coluna `roles` | **6 políticas de escrita, todas `{service_role}`**: `app_settings` (ALL), `historical_snapshots` (INSERT), `news_items` (INSERT), `plataforma_popups` (ALL), `sobre_conteudo` (ALL), `trends_cache` (ALL). Zero para `public` ou `anon`. O estado de 09/09 aguentou uma corrida completa do pipeline |
| `contactos_projecto` mantém-se fechada | 14/09/2026 | `[sessão 13][bd]` `pg_class.relrowsecurity` e contagem de `pg_policies`, mais `count(*)` | RLS activo, **0 políticas**, **4 linhas preservadas**. Inalterado desde 09/09/2026 |
| O agendamento do GitHub Actions chega tarde — e isso não é falha | 14/09/2026 | `[sessão 13][documento]` API pública do GitHub, `actions/runs`, runs #32–#38 | O `cron` pede 06:00 UTC (`youtube-trends.yml:5`). Arranques reais: #32 07:49, #33 07:03, #34 07:06, #35 13:11, #36 12:02, **#38 12:18** (o #37 foi `workflow_dispatch`). O atraso do GitHub em workflows agendados passou de ~1h para ~6h. Todas com conclusão `success` — que **neste workflow não prova que os passos escreveram**, ver `AUDIT.md` secções 2 e 3. Fica registado para uma corrida que aparece ao meio-dia não ser lida como avaria |
| Duas tabelas fora do modelo de dados documentado | 14/09/2026 | `[sessão 13][bd]` Listagem de `pg_class` cruzada com a secção "Modelo de Dados" deste ficheiro; depois `grep` por `.from("…")` em `src/` | `plataforma_popups` (**15 linhas**) e `trend_data` (**0 linhas, vazia**). Nenhuma das duas constava do modelo. `plataforma_popups` é lida por `Plataforma.tsx:91` e escrita pelo `/admin` (`Admin.tsx:485` e `:713`) — **está em uso**, faltava ao modelo. `trend_data` **não tem um único leitor no `src/`**: a única ocorrência é a declaração em `types.ts:596`, que é ficheiro gerado. Candidata a remoção, **não removida nesta sessão** |
| Workflow semanal corre sozinho, sem intervenção manual | 07/09/2026 | `[claude.ai, transcrito]` Escritas observadas em `ijpxjpbjudaddfatibfl` entre 12:25 e 12:28 UTC | Confirmado. `news_items` 278, `health_questions` 4604, `youtube_trends` 22, `guioes_semanais` 25, `eixos_archive` 24 |
| Passos 1 e 3 (Google Trends) não escrevem nada | 14/08/2026 | `[sessão anterior]` Bloco comentado em `youtube-trends.yml`, com motivo e condição de religação no próprio ficheiro | Comentados desde 14/08/2026. **É esta a razão pela qual `historical_snapshots` está parada** — não é falha de recolha, é desactivação deliberada |
| Passo 2B (autocomplete) desligado | 09/09/2026 | `[nesta sessão]` Bloco comentado em `youtube-trends.yml`, com motivo e condição de religação no próprio ficheiro | Comentado a 09/09/2026, antecipado de sexta-feira. Motivo: testar o pipeline obriga a correr o workflow, e o passo 2B acrescentaria mais linhas com `relative_volume` fabricado às 3634 existentes. Passos activos no workflow: 11, contra 12 antes |
| `contactos_projecto` fechada ao acesso anónimo | 09/09/2026 | `[nesta sessão]` Migração `20260909160000` aplicada; depois, pedidos REST com a chave anon (papel `anon` confirmado por descodificação do JWT) | 0 políticas, RLS activo, **4 linhas preservadas**. Com a anon: SELECT `HTTP 200 []`, INSERT `HTTP 401` (42501), UPDATE e DELETE `HTTP 204` com 0 linhas afectadas. Os 204 não são sucesso: a impressão md5 do conjunto manteve-se em `a0cb6e2c…` e o telefone visado pelo UPDATE está inalterado |
| `historical_snapshots` não tem nenhuma janela defensável | 07/09/2026 | `[claude.ai, transcrito]` SQL: agrupamento por minuto de escrita e procura de valores fora de 0–100 | 3462 linhas. 240 são *seed* retrodatado, inserido num único minuto a 08/03/2026 com datas de 01/10/2025 a 01/03/2026. 3018 (09/03–12/04) têm valores acima de 100 num índice normalizado 0–100, e 43% presas no valor 1 |
| `historical_snapshots` da instância antiga: a série congelou a 14/04/2026 | 09/09/2026 | `[sessão 12]` Descarga das 12072 linhas com a chave anon; agregação por mês, por keyword, e comparação do conjunto `(keyword, search_index)` dia a dia | **12072 linhas**, 01/10/2025 a 27/07/2026. Por mês: 03/2026 2032 linhas/22 dias/38,4% a 0 ou 1 e **16 acima de 100**; 04/2026 2624/30 dias/52,6%; 05/2026 2542/31/54,9%; 06/2026 2460/30/54,9%; 07/2026 2214/27/54,9%. As 200 linhas de 10/2025 a 02/2026 estão a 0% de chão mas foram **todas escritas no minuto `2026-03-08T11:44`** — *seed* retrodatado. **De 14/04 a 27/07, 105 dias, cada dia é idêntico ao anterior** nas 82 keywords: `menopausa sintomas` = 44 em 88 pontos com desvio 0,0, `depressão` = 4, `burnout` = 26. **Na janela 05–07/2026 as 82 keywords são constantes.** O congelamento começa 2 dias depois da migração de 12/04 |
| O que só existe na instância antiga é o período congelado | 09/09/2026 | `[sessão 12]` Contagem por mês nas duas instâncias | A nova tem 03/2026 (2032 linhas, 22 dias — **iguais** à antiga), 04/2026 **só até ao dia 12** (1066 linhas, 12 dias), e 2 dias de 08/2026. Só existe na antiga o período de **13/04 em diante**: 1558 linhas em 13–30/04, onde 42 keywords têm exactamente **dois** valores distintos — o de antes e o congelado, ou seja a própria transição — e 54,7% dos valores estão a 0 ou 1. **Apagar a instância antiga não perde nenhuma série que varie** |
| Google Autocomplete não segmenta por país | 07/09/2026 | `[nesta sessão]` `md5` e `diff` sobre as 4 respostas guardadas (pedidos manuais feitos pela Marta) | Respostas **byte a byte idênticas** entre `gl=pt` e `gl=br` (`fa5766d4…`, `ea7a0f17…`). O parâmetro `gl` não altera o resultado. Evidência em `docs/evidencia/2026-09-07-autocomplete-gl/` |
| `keywords` é curadoria manual, não recolha automática | 07/09/2026 | `[claude.ai, transcrito]` Consulta SQL: procura de linhas com assinatura de inserção automática (`previous_volume = 0` E `trend = 'up'`) | **Zero linhas** com essa assinatura. 83 linhas, 82 activas. Distribuição: 33 saúde mental, 18 alimentação, 16 emergentes, 16 menopausa. 43 com `current_volume = 0`, média 11,1, ~~zero emergentes com valor~~ — *este último ponto foi corrigido a 09/09/2026: são 5 de 15 com valor; ver a linha CORRECÇÃO abaixo* |
| A lista de 83 keywords vem do SNS 24 e da DGS | 09/09/2026 | `[declarado]` Afirmado pela Marta | A curadoria foi feita a partir de fontes institucionais. A lista não é uma amostra dos temas de saúde procurados — é uma amostra do **vocabulário com que o Estado nomeia** esses temas |
| 38 de 82 keywords não têm resolução na própria série | 09/09/2026 | `[sessão 12]` Período arquivado 09/03–13/04, o único com variação; contagem de dias no valor mínimo de cada série, individualmente. O script 5 pede uma keyword de cada vez (`5_…py:63`), logo cada série está normalizada ao seu próprio máximo — a medida é de **resolução**, não de volume comparado | 38 keywords com ≥50% dos dias no chão da própria série; várias com **um único valor distinto** em todo o período (`prevenção suicídio`, `saúde mental jovens`, `reabilitação psicossocial`, `candida auris`). Contra: `menopausa sintomas` (max 100, 32 valores distintos), `long covid` (72, 29) e `burnout` (57, 21), com 0% no chão |
| CORRECÇÃO — "zero emergentes com valor" não se confirma | 09/09/2026 | `[sessão 12]` `select … from keywords where is_active group by axis`, e o mesmo por `is_emergent` | A linha de 07/09/2026 dizia "zero emergentes com valor". **Hoje: `axis='emergentes'` tem 15 keywords activas e 5 com valor** (máximo 59). O zero só aparece na leitura por `is_emergent = true` — e essa é **vazia**: a coluna está a `true` em **0 linhas de toda a tabela**, logo dá zero por a *flag* nunca ser preenchida, não por o tema não ter sinal. Proporção com valor por eixo: emergentes **5/15 (33%)**, saúde mental 16/33 (48%), menopausa 8/16 (50%), alimentação 10/18 (56%). Emergentes **é o mais baixo, mas não é zero** |
| `.env` versionado num repositório público | 07/09/2026 | `[nesta sessão]` `git ls-files`, `git log -p --all -- .env`, API pública do GitHub | Repositório **público** (HTTP 200). Só variáveis `VITE_*` — `PROJECT_ID`, `PUBLISHABLE_KEY`, `URL`. **Sem `service_role` em todo o histórico**: não há chaves a rodar nem histórico a reescrever |
| Datas dos commits ao `.env` | 07/09/2026 | `[nesta sessão]` `git log --format="%h %ad %s" --date=short -- .env` | 5 commits: 06/03, 12/04 (×3, um deles a migração), **21/05/2026**. Os 4 "Changes" são do bot do Lovable. Confirma que o Lovable reescreveu o `.env` **depois** da migração de 12/04 |
| O que o bot do Lovable fez ao `.env`, e o que o desencadeia | 09/09/2026 | `[nesta sessão]` `git fetch --all --prune`, `git log --all -m -- .env`, `git show 5246597` | **Dois commits, não um:** `5246597` (21/05 07:35:53 UTC) é a alteração, `e22227d` (07:36:47) é o merge — `git log -- .env` omitia o segundo. A alteração **repôs a instância antiga** (`ijpxjpbjudaddfatibfl` → `cyjwhmuakmiytypewwfw`) e não tocou em mais nada. Traz `Co-authored-by: marmade`: foi sessão interactiva, não o bot sozinho. **Contraprova:** a 09/09 a Marta abriu o Lovable só para ver créditos e o fetch não trouxe nada, em nenhum ramo |
| `client.ts` não tem instância hardcoded | 09/09/2026 | `[nesta sessão]` Leitura de `src/integrations/supabase/client.ts` e `grep` por `VITE_SUPABASE` em todo o repositório | Lê `import.meta.env.VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`, substituídos pelo Vite **em tempo de compilação**. Não há `define` no `vite.config.ts` nem outro `.env*`. **Corrigir o `.env` chega** — e o que estiver no `.env` no momento do build é o que o site usa |
| `.env` a apontar para a instância nova | 09/09/2026 | `[nesta sessão]` Valores restaurados de `5246597^`; depois, pedido REST com as credenciais do próprio ficheiro | `news_items` devolve **288**, a contagem da instância nova. A chave do ficheiro é byte a byte a mesma que o workflow usa. **A verificação no browser NÃO foi feita:** não há Node nesta máquina |
| A instância antiga não está fora do ar, e expõe os mesmos dados | 09/09/2026 | `[nesta sessão]` Leitura REST de `cyjwhmuakmiytypewwfw` com a chave `anon` do histórico do git | Responde a tudo. `news_items` 1994, `health_questions` 3362, `guioes_semanais` 5. **`contactos_projecto`: 4 linhas legíveis, 4 nomes, 3 e-mails, 3 telefones** — impressão dos nomes idêntica à da instância nova. `revisao_pares`: 4 linhas, com `bio_a`/`bio_b`/`afiliacao` que **não existem na nova**. "Congelada a 30/04" quer dizer sem escritas, não offline: se o site apontasse para lá não dava erro, mostrava dados errados |
| Chave `anon` da instância nova em código versionado | 07/09/2026 | `[nesta sessão]` Leitura de `scripts/6_…py:26` e `scripts/7_…py:29` | A chave `anon` de `ijpxjpbjudaddfatibfl` estava **hardcoded** nos dois scripts, além do `.env`. **`git rm --cached .env` não a remove do repositório** — o que fecha o risco é o RLS, não o ficheiro. *Estado a 09/09/2026: os 7 scripts passaram a ler do ambiente; os números de linha desta coluna são anteriores a essa alteração* |
| `.env` aponta para a instância errada | 13/08/2026 | `[sessão anterior]` Leitura do ficheiro | Aponta para `cyjwhmuakmiytypewwfw` (antiga, congelada a 30/04). A oficial é `ijpxjpbjudaddfatibfl` |
| Valores fabricados no script 7 (autocomplete) | 07/09/2026 | `[nesta sessão]` Leitura de `scripts/7_fetch_autocomplete_questions.py` | **Confirmado.** `relative_volume = max(10, 100 - pos*5)` (l.142) — a posição na lista gravada como se fosse volume; `growth_percent` fixo a `0` (l.146); `is_question` fixo a `True` (l.151), mesmo para termos que não são perguntas. **Acrescento:** `pos` acumula ao longo dos 10 seeds, logo a partir da 19ª sugestão o valor é sempre `10`. O pedido usa `gl=pt` (l.112), parâmetro sem efeito |
| Valores fabricados no script 6 (pytrends) | 07/09/2026 | `[nesta sessão]` Leitura de `scripts/6_fetch_health_questions.py` | **Confirmado.** `relative_volume = max(10, 100 - rank*8)` (l.208); `"breakout"` convertido em `growth = 5000` (l.199-200); `expandir_mural()` (l.288-338) insere keywords com `previous_volume: 0`, `trend: "up"` e `current_volume` igual ao volume fabricado. **Que nunca tenha inserido nada é a consulta SQL da linha das `keywords`, não esta leitura** |
| Script 6 é a única fonte de perguntas com base territorial | 07/09/2026 | `[nesta sessão]` Leitura de `scripts/6_…py:175` | Confirmado: `build_payload(..., geo="PT", timeframe="today 3-m")`. O `growth_percent` vem do valor real das *rising queries* do Google — **excepto** quando é `"breakout"`, caso em que é fabricado |
| `6_fetch_health_questions.py` falha em silêncio | 07/09/2026 | `[nesta sessão]` Leitura de `scripts/6_…py:225-227` | **Confirmado.** Qualquer excepção (incluindo HTTP 429) é apanhada, impressa no log, e a função devolve lista vazia. Não escreve `NULL` nem marca estado: a keyword desaparece da recolha dessa semana sem rasto na base de dados |
| `refresh-trends` copia `current_volume` sem validar | 14/08/2026 | `[sessão anterior]` Leitura de `supabase/functions/refresh-trends/index.ts` | Confirmado; insert único e atómico, resposta 200 conta linhas preparadas, não gravadas |
| Escrita anónima via REST bloqueada por RLS | 13/08/2026 | `[sessão anterior]` POST com chave anon a duas tabelas | HTTP 401, Postgres 42501. **Só duas tabelas testadas — e `contactos_projecto` não era nenhuma delas** |
| RLS das restantes tabelas | 09/09/2026 | `[nesta sessão]` `pg_policies` cruzado com leitura REST tabela a tabela usando a chave anon | 19 tabelas, **todas com RLS activo — o que não protege nada por si só**. `contactos_projecto` devolve 0 linhas; todas as outras devolvem conteúdo à anon |
| `revisao_pares` expõe dados pessoais | 09/09/2026 | `[nesta sessão]` `pg_policies` + leitura REST com a chave anon | Políticas `public` `true` em SELECT, INSERT e UPDATE. **4 linhas, 4 com nome, 4 com e-mail, 3 com telefone** (dois perfis por linha). Lidas e reescritas por quem tenha a chave. O `hideContact` de `RevisaoPares.tsx` esconde no ecrã, não impede o envio |
| `revisao_pares` sem contactos, sem perder a página | 09/09/2026 | `[sessão 12]` Migração `20260909200000`; depois, leitura REST com a chave anon | `email_a`, `email_b`, `telefone_a` e `telefone_b` esvaziados. **Nenhuma linha apagada.** Com a anon: 4 linhas devolvidas, **0 e-mails, 0 telefones**. Ficam nome (4), especialidade (4), link (4), bio (2) e sumário (2). Fechar o SELECT teria esvaziado a página; limpar os campos não |
| EFEITO COLATERAL não registado na sessão 11 | 09/09/2026 | `[sessão 12]` Leitura de `RevisaoPares.tsx:80` e `:169-170`, cruzada com o resultado da chave anon | Fechar `contactos_projecto` ao anónimo a 09/09 fez a secção de contactos de `/revisao-pares` passar a mostrar **"Sem contactos registados"**. O código faz `if (ctRes.data) setContactos(ctRes.data)`: o RLS devolve `[]`, não erro, logo a lista fica vazia e a página degrada em silêncio. **A sessão 11 fechou a tabela sem registar que isto acontecia** |
| CORRECÇÃO à sessão 11 — as bios não se perdem | 09/09/2026 | `[sessão 12]` `information_schema.columns` na instância nova + `md5(trim(...))` das bios nas duas instâncias | A sessão 11 afirmou que `bio_a`, `bio_b` e `afiliacao` **não existiam** na instância nova. **É falso.** Existem, e o `md5` do texto depois de `trim` é **idêntico** nas duas (`1270eee4…`, `2a5cd574…`) — a diferença de 1 caractere era espaço no fim. **Não há 174 caracteres a perder.** O erro foi ter inferido o schema do ficheiro de migração em vez de consultar a base de dados |
| `revisao_pares` tem duas linhas com o mesmo `eixo` | 09/09/2026 | `[sessão 12]` `select eixo … order by eixo` na instância nova | Duas linhas com `eixo = 'emergentes'`. `RevisaoPares.tsx:84-85` indexa num mapa por `d.eixo`, logo **uma sobrepõe a outra** e a página mostra só um dos dois pares. A coluna `axis` existe mas está vazia nas 4 linhas — quem lê o schema pela migração `20260318100000` engana-se, porque a produção tem as duas colunas |
| Três lockfiles, e o build a funcionar | 09/09/2026 | `[sessão 12]` Comparação do `package.json` (74 dependências) com cada lockfile; depois `npm install` e `npm run build` | O `package-lock.json` do repositório **não tinha 8 dependências**, incluindo `@supabase/supabase-js`; era do commit do template (2025-01-01), tal como o `bun.lockb`. Ficou primeiro o `bun.lock`, e a escolha foi **revista** quando a Marta instalou o Node: sem `bun` na máquina, esse lockfile não se conseguia verificar. Fica o **`package-lock.json` gerado de novo** — 570 pacotes, 0 em falta, e é com ele que o build está provado |
| O build corre, e o bundle aponta para a instância certa | 09/09/2026 | `[sessão 12]` `npm run build` com e sem `.env`, e `grep` ao `dist/assets/index-*.js` | `✓ built in 2.31s`, 3808 módulos, aviso de chunk acima de 500 kB (1,75 MB, 519 kB gzipped). **`dist/_redirects` existe no output.** Com `.env`: `https://ijpxjpbjudaddfatibfl.supabase.co` no bundle, **zero ocorrências de `cyjwhmuakmiytypewwfw`**. Sem `.env`: a URL **não entra** no bundle e fica só a mensagem de erro do `client.ts` — confirma que a protecção funciona e que o build **não falha** sem as variáveis, falha o site. Testado com Node 24; o `.nvmrc` pede 20 e isso **não foi testado** |
| Escrita anónima em 13 tabelas, 9 com DELETE | 09/09/2026 | `[nesta sessão]` `pg_policies`: políticas de INSERT/UPDATE/DELETE/ALL com `qual`/`with_check` a `true` e role não-`service_role` | `bookmarks` (ALL); `briefings_archive`, `debunking`, `guioes`, `guioes_semanais`, `health_questions`, `keywords`, `sobre_conteudo`, `textos`, `youtube_trends` (INSERT/UPDATE/**DELETE**); `news_items` (UPDATE/**DELETE**); `eixos_archive` (INSERT); `revisao_pares` (INSERT/UPDATE). Um DELETE anónimo apaga as 4604 linhas de `health_questions` |
| Escrita anónima fechada em todas as tabelas | 09/09/2026 | `[nesta sessão]` Migração `20260909190000` (31 políticas removidas em 12 tabelas); depois, bateria de pedidos REST com a chave anon | **0 políticas de escrita a `public`** e 0 tabelas sem RLS. Com a anon: INSERT `HTTP 401`/42501 em 11 tabelas testadas; UPDATE e DELETE `HTTP 204` com 0 linhas, incluindo um DELETE **sem filtro** em `youtube_trends` e `debunking`. **Impressão md5 das contagens das 19 tabelas idêntica antes e depois (`b04740f7…`)**, texto da linha visada intacto, 0 alterações, 0 inserções de teste. Leitura verificada tabela a tabela: as 16 que o site lê continuam a devolver conteúdo |
| Os 7 scripts do pipeline escrevem com a chave anon | 09/09/2026 | `[nesta sessão]` Leitura das linhas indicadas e descodificação de cada JWT | Chave hardcoded em `4_…py:25`, `5_…py:22`, `6_…py:26`, `7_…py:29`, `8_…py:14`, `9_…py:24`, `10_…py:17` — **a mesma chave `anon` nos sete** (md5 `cd6632b6`), de `ijpxjpbjudaddfatibfl`. Também em texto simples no `env:` do workflow (l.10). Escrevem: `9_…py:92` e `4_…py:254` fazem DELETE. **Fechar as escritas a anon antes de migrar estes scripts desliga os passos 2, 2B, 4B e 5** |
| Edge Functions não dependem da chave anon | 09/09/2026 | `[nesta sessão]` `grep` por `SERVICE_ROLE`/`ANON` nas 7 funções | As 5 que tocam no Supabase usam `service_role`: `archive-weekly`, `fetch-rss-feeds`, `generate-guioes-weekly`, `google-trends`, `refresh-trends`. Fechar as escritas a anon não as afecta |
| Escrita via Edge Function | — | `[por testar]` | Em aberto. `verify_jwt = false` confirmado na instância nova; desconhecido na antiga |
| Edge Functions deployadas na instância nova | 14/08/2026 | `[sessão anterior]` MCP Supabase `list_edge_functions` | 5 activas: `refresh-trends`, `archive-weekly`, `generate-guioes-weekly`, `google-trends`, `fetch-rss-feeds` |
| Edge Functions em falta | 14/08/2026 | `[sessão anterior]` MCP + POST a `generate-diz-que-disse` | `generate-diz-que-disse` e `generate-guiao-questions` (HTTP 404) |
| Código das funções em produção | 14/08/2026 | `[sessão anterior]` MCP: todas em versão 1, deploy 28/07/2026 17:20–17:27 | Nunca redeployadas. Alterações no repositório desde 28/07 NÃO estão em produção |
| `VITE_PERPLEXITY_API_KEY` existe como secret na instância nova | 14/08/2026 | `[declarado]` Painel Supabase, verificado pela Marta | Existe, criada 12/04/2026. Sem função deployada que a leia |

---

## Projecto

**Reportagem Viva** — dashboard de monitorização de narrativas de saúde em Portugal (lado A)
**Diz que Disse** — editorial de comunicação de ciências da saúde (lado B)

- Lovable preview: https://preview--health-pulse-pt.lovable.app/
- Admin: https://preview--health-pulse-pt.lovable.app/admin
  (credencial removida do documento a 07/09/2026. Esteve em claro num
  repositório público e **permanece no histórico do Git** — retirá-la do
  ficheiro não a remove do repositório. Decisão de 07/09/2026: não
  alterar a palavra-passe, porque o painel aponta para a instância antiga
  e sai com o corte do Lovable. Até lá, o acesso é público de facto.)
- Repositório: https://github.com/marmade/health-pulse-portugal
- Lovable project ID: 69209c37-6f9e-4a84-bea9-8e56d0eace5a

---

## Stack

- **Frontend:** React + Vite + TypeScript + Tailwind + shadcn/ui (Lovable)
- **Backend:** Supabase — **uma instância em uso, outra por apagar** (ver `AUDIT.md` secções 4 e 5):
  - **Em uso, e a única:** `ijpxjpbjudaddfatibfl.supabase.co` (Marta) — **viva**. É para aqui
    que o `.env` aponta e é esta que está no bundle compilado (verificado 09/09/2026,
    Crítico nº 3). O pipeline escreve aqui com `service_role`, a última vez na corrida
    agendada #38 de 14/09/2026. O único passo partido é o do Google Trends, comentado
    desde 14/08/2026
  - **Por apagar:** `cyjwhmuakmiytypewwfw.supabase.co` (Lovable) — **já não é para aqui que o
    site aponta**, mas responde e expõe os mesmos dados pessoais. Ver Crítico nº 4
  - **Corrigido a 14/09/2026 — e o erro vale a pena ficar registado.** Esta secção dizia, até
    hoje, que a instância antiga estava "em uso de facto" e que o `.env` apontava para lá.
    Era verdade a 13/08/2026 e deixou de ser a 09/09/2026, sem que a secção fosse
    actualizada: **o documento contradizia a tabela de Verificações e o Crítico nº 3 dele
    próprio.** É a mesma classe de erro que a sessão 12 registou — ler o estado numa fonte
    derivada em vez da primária —, desta vez dentro do ficheiro que é suposto ser a fonte
  - **Descartável, a apagar:** `hypztdsgzuykoksrurto` (`teste-consolidada-descartavel`),
    criado a 14/09/2026 só para correr a `migration_consolidada.sql` e **pausado no mesmo
    dia**. Plano free, **0 USD**, sem dados do projecto — só o schema vazio que o teste criou.
    Não tem ligação ao site nem ao pipeline. **Apagá-lo exige o painel do Supabase:** o MCP
    não elimina projectos, só pausa. Ver `AUDIT.md` 6.5
  - Enquanto o Lovable Cloud estiver ligado ao projecto, editar no editor visual pode alterar
    o `.env` sem aviso — foi o que aconteceu a 21/05/2026, commit `5246597`
- **Design:** Space Grotesk, azul `#0000FF`, magenta `#FF00FF`, fundo branco, sem sombras nem gradientes
- **Automatização:** GitHub Actions (workflow semanal), Python scripts em `scripts/`
- **Claude Code:** instalado localmente; comando `claude`, a partir de `~/Documents/health-pulse-portugal`

---

## Eixos Temáticos

| Código | Nome |
|---|---|
| `saude-mental` | Saúde Mental |
| `alimentacao` | Alimentação |
| `menopausa` | Menopausa |
| `emergentes` | Emergentes |

---

## Modelo de Dados — Lado A (Reportagem Viva)

**`keywords` é o elemento central** — todas as tabelas de monitorização ligam a ela via `keyword_id` (FK, nullable).

> **19 tabelas em `public`**, verificado a 14/09/2026. As duas do terceiro grupo foram
> acrescentadas nessa data: estavam na base de dados e não neste modelo.

### Tabelas — Lado A (11)
`keywords`, `health_questions`, `news_items`, `debunking`, `youtube_trends`, `historical_snapshots`, `app_settings`, `trends_cache`, `briefings_archive`, `eixos_archive`, `guioes_semanais`

### Tabelas — Lado B (6)
`revisao_pares`, `contactos_projecto`, `bookmarks`, `guioes`, `textos`, `sobre_conteudo`

### Fora dos dois lados (2) — acrescentadas a 14/09/2026
- **`plataforma_popups`** — 15 linhas. Conteúdo dos *popups* da página `/plataforma`: lida por
  `Plataforma.tsx:91` e gerida no tab PLATAFORMA do `/admin` (`Admin.tsx:485` e `:713`).
  Escrita fechada a `service_role` a 09/09/2026, como o resto. **Está em uso** — a ausência
  era do modelo, não da base
- **`trend_data`** — **0 linhas, vazia**. Criada pela migração `20260308110746` e nunca usada.
  Nada no `src/` a lê. Candidata a remoção, ver Restantes — **não removida nesta sessão**

### health_questions — schema
```
id, question, growth_percent, relative_volume, axis, axis_label,
cluster, is_question, keyword_id, updated_at,
source (TEXT DEFAULT 'pytrends'),
last_seen_at (TIMESTAMPTZ DEFAULT now())
```
**Constraint única:** `(question, axis, source)`

---

## Fontes de Dados

| Tipo | Total | Detalhes |
|---|---|---|
| RSS feeds | 44 | Media geral, media saúde, institucional, nutrição, sociedades científicas, ONG, farmacêutica, divulgação, fact-check |
| YouTube canais | 56 | Media, institucional, sociedades, hospitais, academia, ONG, fact-check, internacional, autarquias |
| Bookmarks referência | 76 | Todas as sociedades médicas AJOMED + institucionais + ONG |
| Fontes peer-reviewed | 5 | MSD Manuals, Acta Médica Portuguesa, RPMGF, SciELO PT, Cochrane |

### Estatuto das fontes — decisão de 07/09/2026

**Google Autocomplete mudou de estatuto.** Deixa de responder *"o que perguntam os
portugueses"* e passa a responder *"como se formula a dúvida em português"*. A razão é
factual e está verificada: `gl=pt` e `gl=br` devolvem respostas byte a byte idênticas — a
fonte não segmenta por país.

**Delimitação do objecto.** O protótipo recolhe **dúvidas formuladas em português, a partir
de Portugal**. O critério é territorial, não linguístico.

**O Google Trends fica** por ser a única das três fontes que segmenta por país de facto
(`geo=PT`). É essa a função que desempenha no desenho, independentemente da decisão sobre
como passar a recolhê-lo.

| Fonte | Responde a | Segmenta por país |
|---|---|---|
| Google Trends (script 5) | dinâmica temporal do interesse | **Sim** — `geo=PT` |
| pytrends *related queries* (script 6) | o que está a crescer | **Sim** — `geo=PT` |
| Google Autocomplete (script 7) | como se formula a dúvida | **Não** — verificado 07/09/2026 |

### Hipótese do vocabulário — 09/09/2026

> **Estatuto: HIPÓTESE. Não testada.** O que está verificado são os números das linhas
> "A lista de 83 keywords vem do SNS 24 e da DGS", "38 de 82 keywords não têm resolução na
> própria série" e "CORRECÇÃO — zero emergentes com valor não se confirma", na tabela de
> Verificações. A explicação abaixo é uma **leitura** desses números e mantém-se por
> confirmar até o teste ser corrido.

As keywords sem sinal no Google Trends não são necessariamente temas que ninguém procura.
Podem ser temas que ninguém **formula assim**.

"Prevenção suicídio", "saúde mental jovens" e "reabilitação psicossocial" são linguagem de
programa e de relatório. A hipótese é que o zero não mede desinteresse — mede **distância
entre o vocabulário da instituição e o de quem pesquisa**.

**O que a hipótese prevê, e o que os dados mostram — com uma correcção.** Se a lista é
vocabulário institucional, o eixo Emergentes devia ser o mais afectado: um tema emergente
ainda não tem nome institucional, porque a nomenclatura chega depois do fenómeno.

A previsão **confirma-se na direcção, não na magnitude**. A versão anterior deste raciocínio
apoiava-se em "zero emergentes com valor", registado a 07/09/2026. Verificado a 09/09/2026,
esse zero não se sustenta: `axis='emergentes'` tem 15 keywords activas e **5 com valor**. O
zero vinha da leitura por `is_emergent = true`, que está a `true` em **zero linhas de toda a
tabela** — dá zero por a coluna nunca ser preenchida, não por ausência de sinal.

O que fica de pé é a ordenação:

| eixo | activas | com valor | % |
|---|---|---|---|
| **emergentes** | 15 | **5** | **33%** |
| saúde mental | 33 | 16 | 48% |
| menopausa | 16 | 8 | 50% |
| alimentação | 18 | 10 | 56% |

Emergentes é o eixo com menor proporção de keywords com sinal, como a hipótese prevê. Mas a
diferença é de 33% contra 48–56%, não de zero contra o resto. **Uma tendência com quatro
pontos não é uma demonstração** — é motivo para correr o teste, não para o dispensar.

**Contraprova dentro da própria lista.** "Menopausa sintomas" veio da mesma origem
institucional e tem sinal cheio (máximo 100, 32 valores distintos no período arquivado).
Portanto a lista não é uniformemente institucional: há termos que já entraram na linguagem
corrente e outros que não. **Quais entraram é mensurável.**

**O teste que confirma ou nega.** Para uma keyword sem sinal, pedir ao Google Trends uma
reformulação do mesmo conceito em linguagem corrente:

- se a reformulação tiver sinal e o termo institucional não → **é vocabulário**, e a keyword
  corrige-se reescrevendo-a
- se nenhuma formulação do conceito tiver sinal → **é volume genuinamente baixo**, e o tema
  sai do gráfico e fica do lado editorial

Fazer esta distinção com método, e documentá-la, é o que separa uma limitação declarada de um
achado.

**Segundo teste, com dados que já existem e sem recolha nova.** Estão na base de dados duas
listas de vocabulário sobre os mesmos temas, com proveniência conhecida:

- **A** — as 83 keywords: como o Estado nomeia os assuntos de saúde
- **B** — as 4626 linhas de `health_questions`: formulações reais, recolhidas do próprio
  Google

A distância entre A e B é mensurável hoje, sem depender do `pytrends` nem de limites de
pedidos.

**O que isto muda no protótipo.** A lista A deixa de ser a camada de detecção e passa a ser
**termo de comparação**. A detecção passa a ser semeada por B. A lista A não se apaga: é o
mapa do que a instituição considera relevante, para sobrepor ao mapa do que as pessoas
perguntam. **As zonas onde os dois não coincidem são o objecto do projecto.**

**Consequência para a tese.** Se se confirmar, deixa de ser uma limitação técnica de rodapé:
um sistema de monitorização de literacia em saúde construído sobre volume de pesquisa e
semeado por vocabulário institucional é **cego aos temas de baixa procura e alto risco**. É
um achado sobre o método, obtido empiricamente com dados do próprio protótipo.

---

## Automatização — GitHub Actions

**Workflow:** `youtube-trends.yml` — "Actualização Semanal — Reportagem Viva"
**Schedule:** Segundas-feiras 06:00 UTC (07:00 Lisboa) — mas ver o atraso abaixo | Também disparo manual

> **Estado:** o workflow foi desactivado automaticamente pelo GitHub por inactividade do
> repositório e reactivado a 28/07/2026. **Corre desde então com conclusão `success` em
> todas as runs — o que neste workflow não é prova de que todos os passos escreveram, ver
> `AUDIT.md` secções 2 e 3.** As falhas dos passos saem como `::warning::`, não como erro
> fatal: foi assim que os 404 das Edge Functions e os 429 do pytrends passaram
> despercebidos. Runs #31 a #38: 03/08, 10/08, 17/08, 24/08, 31/08, 07/09, 09/09 (à mão,
> #37) e **14/09 (#38)**.
>
> **O agendamento chega tarde, e isso não é falha — verificado a 14/09/2026.** O `cron` pede
> segunda-feira às 06:00 UTC; os arranques reais foram #33 07:03, #34 07:06, #35 13:11,
> #36 12:02 e #38 12:18. O atraso do GitHub em workflows agendados passou de ~1h para ~6h.
>
> **Escreve com `service_role` desde 09/09/2026.** Os passos em Python recebem
> `SUPABASE_SERVICE_ROLE_KEY` do secret. A chave `anon` do `env:` (l.10) já não escreve nada:
> só serve de *Bearer* para invocar as Edge Functions dos passos 4, 6 e 7, que escrevem com
> `service_role` por dentro.
>
> **Passo 1 (Google Trends) partido — verificado a 13/08/2026.** Quando a recolha falha
> (HTTP 429, ver `AUDIT.md` secção 2), o script **escreve `0`** em vez de manter o valor
> anterior ou marcar erro. Estado a 10/08: **43 de 82 keywords a zero**, e só **12 mudaram**
> face a 03/08. Consequências: nenhum sinal emergente dispara, e o dashboard apresenta uma
> **falha de recolha como ausência de interesse** — quando o estado real é desconhecido.
>
> **Correcção decidida (13/08/2026):** escrever `NULL` em vez de `0` quando a recolha falha,
> e acrescentar uma coluna `collection_status` que distinga explicitamente "recolhido",
> "falhou" e "sem dados". Sem isto, nenhuma série de trends é defensável na tese.

### Passos — numeração real do ficheiro (verificado 14/08/2026)

**Activos:**
0. Ping Supabase — wake up da instância se pausada (sessão 5)
2. Perguntas de saúde (`scripts/6_fetch_health_questions.py`) → `health_questions` (source=pytrends)
2B. Perguntas autocomplete (`scripts/7_fetch_autocomplete_questions.py`) → `health_questions` (source=autocomplete)
4. RSS feeds (Edge Function `fetch-rss-feeds`) → `news_items` (com `keyword_id` — sessão 5)
4B. Limpeza notícias antigas por eixo (`scripts/9_cleanup_old_news.py`) — sessão 5
5. YouTube (`scripts/4_fetch_youtube_trends.py`) → `youtube_trends`
6. Guiões semanais (Edge Function `generate-guioes-weekly`) → `guioes_semanais`
7. Arquivo semanal (Edge Function `archive-weekly`) → `eixos_archive` + `briefings_archive`

**Comentados a 14/08/2026** — não removidos; o bloco de comentário no próprio ficheiro
explica o motivo e a condição para religar:
1. Google Trends PT (`scripts/5_fetch_google_trends.py`) → `keywords`
3. Refresh trends (Edge Function `refresh-trends`) → `historical_snapshots`

### Edge Functions
| Nome | Função |
|---|---|
| `refresh-trends` | Cria snapshots históricos (sem alterar volumes) |
| `fetch-rss-feeds` | Recolhe notícias de 44 RSS feeds (com keyword_id desde sessão 5) |
| `archive-weekly` | Arquiva 4 eixos + briefing |
| `generate-guioes-weekly` | Gera guiões dos 4 eixos (5 banco + 5 IA) |
| `generate-guiao-questions` | Gera perguntas IA via Perplexity Sonar |
| `generate-diz-que-disse` | Gera conteúdo Diz que Disse para briefing |

---

## Dashboard — Dados 100% Reais (com ressalva desde Maio/2026)

> **Ressalva.** O princípio de zero mock data mantém-se no código, mas **nenhuma das duas
> instâncias tem hoje uma série de trends utilizável**:
>
> - **Nova (`ijpxjpbjudaddfatibfl`) — sem janela defensável.** Verificado a 07/09/2026: das
>   3462 linhas de `historical_snapshots`, 240 são seed retrodatado e 3018 contêm valores
>   impossíveis (acima de 100 num índice normalizado 0–100) ou presas no valor 1. Nenhuma
>   fatia é apresentável numa tese. Série parada desde 10/08/2026.
> - **Antiga (`cyjwhmuakmiytypewwfw`) — congelada, e a qualidade NÃO ESTÁ VERIFICADA.**
>   Versões anteriores deste documento afirmavam "dados de trends reais até 30/04/2026".
>   Essa afirmação nunca foi testada com os critérios de 07/09, e o período 09/03–12/04 é
>   exactamente o mesmo que está contaminado na instância nova. Tratar como **não
>   verificada** até correr lá o teste dos valores impossíveis. Ver `AUDIT.md` secção 4.
> - É a instância antiga que o **site publicado** lê. Quem abrir o URL hoje vê valores de
>   Abril apresentados como actuais — quatro meses de atraso.
>
> `news_items` não é afectada em nenhuma das duas — mantém-se real e contínua.

- **Zero mock data** — eliminados Math.random, kwPeriodMult, mock fallbacks
- **Gráficos**: `historical_snapshots` via `buildTrend.ts`, média simples (corrigida sessão 3 — era sum(v²)/sum(v))
- **Volumes por período**: recalculados via snapshots (7d/30d/12m); fallback consistente quando dados insuficientes (corrigido sessão 3)
- **Alertas**: thresholds 30% (7d), 50% (30d), 40% (12m) + emergentes com variação > 0 (corrigido sessão 3 — antes incluía emergentes com variação negativa)
- **Ranking urgência**: "Prioridade de comunicação esta semana" no overview e briefing

---

## Estado do Admin

| Tab | Estado |
|---|---|
| KEYWORDS | ✅ 83 keywords (migradas do Lovable) |
| DEBUNKING | ✅ 36 registos (dados da Marta, transformados para schema Lovable) |
| NOTÍCIAS | ✅ 158 (migradas do Lovable) |
| TEXTOS | ✅ 4 (migrados do Lovable) |
| GUIÕES | ✅ 100 (dados da Marta, transformados) + 1 semanal |
| PLATAFORMA | ✅ 15 popups |
| SOBRE | ✅ 11 blocos |
| BOOKMARKS | ✅ 182 (179 Lovable + 3 Marta merged) |
| BENCHMARK | ✅ Verificado — personas + pseudociência + MSD links |
| REVISÃO PARES | ✅ 4 (migrados do Lovable) |

### Decisão de 09/09/2026 — o `/admin` deixou de escrever

Os números acima descrevem o que está na base de dados, **não** o que o `/admin` consegue
fazer. Desde 09/09/2026 não consegue escrever nada.

`Admin.tsx` e `Guioes.tsx:447-449` escrevem com a chave `anon`. Ao fechar a escrita anónima
(migração `20260909190000`), os dois passam a receber `401`/42501. Foi decisão tomada com o
custo à vista, não efeito colateral.

Porquê aceitar o custo: a password do Admin é comparada no cliente (`Admin.tsx:463`) e vai no
bundle publicado. Nunca foi protecção — era um aviso. Enquanto as políticas estivessem
ligadas ao role `public`, qualquer pessoa com a chave `anon`, que está num repositório
público, tinha exactamente os mesmos poderes que o `/admin`. O `Guioes.tsx` era pior: gravava
guiões sem sequer pedir password.

Até haver autenticação Supabase a sério, a gestão de conteúdos passa para o painel Supabase,
que usa `service_role` e ignora o RLS. É trabalho manual assumido, com data.

**Atenção para quem retomar isto:** autenticar no frontend não resolve por si. Enquanto as
políticas forem para o role `public`, uma sessão autenticada não muda nada — as políticas
novas têm de ser para `authenticated`. Ver Pendentes Críticos nº 2.

---

## Prioridades — decisão de 2026-08-13

**Prioridade à Reportagem Viva (lado A). Lado B em pausa deliberada.** O lado B não recebe
conteúdo novo há meses — `guioes` desde 09/03/2026, `debunking` desde 25/03/2026 — e essa
pausa passa a ser explícita, não acidental: enquanto a série de trends não for defensável,
o esforço vai todo para o lado A. Reavaliar quando os pendentes críticos estiverem fechados.

## Plano da semana — 15 a 18/09/2026

> Escrito a 14/09/2026, **antes** da semana. Existe para o balanço ter contra o que se
> medir: um balanço sem plano prévio mede-se contra a memória do que se tencionava fazer, e
> a memória acomoda-se ao que aconteceu.

| dia | trabalho |
|---|---|
| **terça 15** | **Preview local (`npm run dev`) e deploy.** É a tarde que **desbloqueia a semana** — sem ela, nada do que vem a seguir tem objecto |
| **quarta 16** | **Exportar as 3634 linhas de autocomplete** (Crítico nº 7) · **inventariar as afirmações do dashboard** — o inventário é **da Marta**, feito da posição de quem lê a página |
| **quinta 17** | **Varrimento:** confronto de **cada afirmação com o dado que a sustenta** |
| **sexta 18** | **Decidir correcções** · **balanço da semana** |

### Porque a ordem é esta, e não outra

O varrimento das afirmações estava antes na semana e **foi movido para depois do deploy**. A
razão não é de conveniência:

**O site publicado lê a instância antiga e mostra Abril como actual**, e o preview local não
estava a ser usado. Varrer a página publicada seria **varrer o artefacto errado** — produziria
um inventário de afirmações sobre dados que a instância viva já não tem, e cada correcção
decidida a partir dele estaria a corrigir o retrato errado.

É a mesma distinção que atravessou a sessão 13: **a afirmação e a coisa afirmada têm de ser
postas lado a lado**, e para isso a coisa afirmada tem de ser a que está viva. Daí terça
vir primeiro e ser descrita como o que desbloqueia a semana, não como uma tarefa entre outras.

### O que ficou de fora, por decisão

**A escrita da secção metodológica não entra nesta semana, e isso é escolha, não
esquecimento.** Ganhou base a 14/09/2026 — `docs/metodo/` criada, rascunho de apêndice e o
anexo de coordenadas com os cinco casos ligados aos seus commits. O que falta não é material:
**o texto tem de ser em voz própria**, e isso não se agenda ao lado de tarefas de execução
nem se delega. Fica fora do plano para não aparecer no balanço de sexta como tarefa falhada
quando não era tarefa desta semana.

### Uma falha da rotina, registada

**O ponto 1 da rotina — balanço da semana anterior — falhou a 14/09/2026.** A segunda-feira
foi ocupada pelo estado da base de dados, pela auditoria da consolidada e pela arrumação das
regras, e o balanço não se fez.

**Movido para sexta 18**, junto com a decisão das correcções. O motivo de não ficar à espera
da segunda seguinte: **não falhar duas segundas seguidas** é mais fácil do que recuperar uma
rotina que se interrompeu duas vezes. Fica registado aqui em vez de desaparecer — uma rotina
que falha sem deixar rasto é uma rotina que se perde sem ninguém decidir perdê-la.

## Pendentes

### Críticos — por esta ordem (09/09/2026)

A ordem é deliberada: cada item depende do anterior, ou é mais urgente do que ele.

0. [x] **`contactos_projecto` — fechada a 09/09/2026.** As 4 linhas **não** foram apagadas: é
   a agenda de trabalho do projecto e os dados fazem falta. O que se removeu foi o acesso
   anónimo. Migração `20260909160000`, políticas do `20260320193223` comentadas e secção 5.19
   da consolidada reescrita, para que reaplicar qualquer um deles não reabra a exposição.
   Provado com a chave anon, não com `service_role`. Commit `a3fe51f`.

   **Contexto de 09/09/2026 (sessão 12), decidido fora do repositório:** a tabela era a
   agenda da Marta para contactar cientistas, e **esse plano provavelmente não avança**. Os
   contactos estão no telemóvel dela. **Não exportar estas linhas para lado nenhum** — a
   cópia útil já existe fora do projecto, e qualquer ficheiro exportado seria só mais uma
   cópia de dados pessoais em texto simples. Apagar as 4 linhas da instância nova é possível
   mas não urgente: a tabela está fechada ao anónimo desde 09/09 e não fecha exposição
   nenhuma. Ver "Restantes".

1. [x] **Escritas anónimas — fechadas a 09/09/2026.** A sequência de 6 pontos foi cumprida
   pela ordem, sem trocar: secret criado, os 7 scripts a lerem do ambiente sem valor por
   defeito, secret passado aos passos, workflow #37 corrido à mão e confirmado a escrever com
   `service_role`, e só então as 31 políticas removidas em 12 tabelas (migração
   `20260909190000`). `revisao_pares` fechado à escrita à parte (`20260909180000`).
   Nenhum dado apagado: impressão md5 das contagens das 19 tabelas igual antes e depois.
   Commits `a3fe51f`, `1ea9481`, `5e43a0e`.

   **Confirmado em corrida agendada a 14/09/2026, não só manual.** O #37 foi disparado à
   mão, com a Marta a ver. O **#38 correu sozinho** pelo `cron`, com as 31 políticas já
   removidas, e escreveu em cinco tabelas. É a prova que faltava: a de 09/09 mostrava que o
   pipeline *podia* escrever com `service_role`, esta mostra que o **faz sem ninguém
   carregar no botão**.

2. [ ] **Autenticação Supabase a sério — e só depois repor escrita no `/admin`.**
   Consequência assumida do ponto anterior: o `/admin` não escreve desde 09/09/2026, e a
   gestão de conteúdos passou para o painel Supabase. Isto é um pendente, não um esquecimento.

   O que NÃO resolve: pôr um ecrã de login no frontend. Enquanto as políticas forem para o
   role `public`, uma sessão autenticada tem exactamente os mesmos poderes que um anónimo.
   A password actual (`Admin.tsx:463`) é comparada no cliente e vai no bundle.

   O que resolve, por esta ordem:
   1. Supabase Auth com utilizador real para a Marta
   2. `Admin.tsx` e `Guioes.tsx` a usarem essa sessão, não a chave `anon`
   3. políticas novas de INSERT/UPDATE/DELETE **para o role `authenticated`**, nunca `public`,
      tabela a tabela e só nas que o admin precisa de escrever
   4. `Guioes.tsx:447-449` grava sem pedir password nenhuma — ou passa a exigir sessão, ou
      deixa de gravar
   5. testar com a chave anon que continua a não escrever, como a 09/09/2026

   Enquanto isto não existir, **não repor políticas de escrita para `public`**. É desfazer
   tudo o que se fez a 09/09/2026.

3. [x] **`.env` — fora do tracking e a apontar para a instância certa (09/09/2026).**
   `git rm --cached .env` feito; a regra do `.gitignore:16` já estava em vigor desde
   07/09/2026. Os valores foram **restaurados do próprio histórico** (`5246597^`), não
   escritos à mão: a chave que lá está é byte a byte a mesma que o workflow usa.
   Confirmado que `src/integrations/supabase/client.ts` não tem instância nenhuma escrita —
   lê `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`, que o Vite substitui **em tempo
   de compilação**. Corrigir o `.env` chegava, e chegou.
   **Isto NÃO remove a chave `anon` do repositório público:** continua no `env:` do workflow
   (l.10) e em todo o histórico do git. O que fecha o risco é o RLS, não este item — a chave
   `anon` é pública por desenho.
   **Confirmado a 09/09/2026 (sessão 12), depois de a Marta instalar o Node:** `npm install`
   e `npm run build` correram. O bundle publicado contém
   `https://ijpxjpbjudaddfatibfl.supabase.co` e **zero ocorrências de `cyjwhmuakmiytypewwfw`**.
   É prova mais forte do que o teste REST: não é a API que responde certo, é o ficheiro
   compilado que tem lá a instância certa. Falta só abrir no browser.

4. [ ] **Instância antiga `cyjwhmuakmiytypewwfw` — apagar os dados pessoais, e depois a
   instância inteira.** Decisão de 09/09/2026: a instância vai ser **apagada por inteiro**.
   Apagar as linhas primeiro é para não ficar exposto no intervalo.

   **SQL pronto:** `docs/operacoes/2026-09-09-instancia-antiga-apagar-dados-pessoais.sql`.
   Corre no SQL Editor do painel, projecto `cyjwhmuakmiytypewwfw`. Não é migração deste
   repositório e não vai para `supabase/migrations/`, que é da instância nova. Quem corre é a
   Marta: o Claude Code não tem acesso administrativo lá (o MCP devolve "You do not have
   permission"), e o único acesso daqui é a chave `anon` do histórico do git, que não serve
   para uma eliminação irreversível.

   **Sem exportação**, por decisão de 09/09/2026. Verificado antes de decidir que não se
   perde nada:
   - `contactos_projecto`: impressão md5 dos nomes idêntica nas duas instâncias
     (`9c47acfd…`). Mesmas 4 pessoas, e a instância nova tem-nas fechadas ao anónimo.
   - `revisao_pares`: **as bios existem na instância nova.** `md5(trim(bio_a))` e
     `md5(trim(bio_b))` são idênticos nos dois lados (`1270eee4…`, `2a5cd574…`).
     **Isto corrige o que a sessão 11 registou:** não há 174 caracteres a perder, e não há
     perda nenhuma para registar. O erro da sessão 11 foi inferir o schema do ficheiro de
     migração em vez de consultar a base de dados.

   Enquanto não for feito, os mesmos dados continuam legíveis lá por quem tenha a chave
   `anon` dessa instância, que está no histórico público do git.

5. [ ] **Cortar o Lovable e publicar no Cloudflare Pages.** Enquanto a ligação Lovable
   Cloud↔Supabase estiver activa, o editor visual reescreve o `.env` e desfaz o item 3.
   Decisão de 07/09/2026: abandonar o Lovable.

   **Destino decidido a 09/09/2026: Cloudflare Pages, pela integração Git do painel.**
   Quem o faz é a Marta, no browser. O repositório foi preparado a 09/09/2026 (commit
   `fedd760`): fica um lockfile só — o **`package-lock.json` gerado de novo**, 570 pacotes e 0
   dependências em falta (o antigo não tinha 8, incluindo o `@supabase/supabase-js`; o
   `bun.lock` saiu porque não há `bun` na máquina e não se conseguia verificar) —,
   `.nvmrc` com Node 20, `public/_redirects` com
   `/* /index.html 200` (sem isto qualquer link directo dá 404, são 13 rotas mais um
   catch-all), e o `client.ts` a parar com mensagem explícita se faltar
   `VITE_SUPABASE_URL` ou `VITE_SUPABASE_PUBLISHABLE_KEY`.

   **Por fazer, e por esta ordem:**
   1. definir as duas variáveis no painel do Cloudflare, **para produção E para preview** —
      não vêm do `.env`, que não está versionado
   2. ~~correr o primeiro build~~ — **FEITO a 09/09/2026**, localmente: `✓ built in 2.31s`,
      3808 módulos. Sai um aviso de chunk acima de 500 kB (1,75 MB, 519 kB gzipped): é aviso,
      não erro. Verificado no output que `dist/_redirects` existe e que o bundle aponta para a
      instância certa. **Cuidado:** o build foi feito com Node 24 e o `.nvmrc` diz 20 — o
      Cloudflare vai usar 20, que o `vite` 5.4 suporta, mas isso é documentação, não teste
   3. só depois desligar o Lovable, para não ficar sem publicação nenhuma no intervalo
   4. **remover o `lovable-tagger`** — não foi tocado no commit `fedd760` de propósito: é
      importado no topo do `vite.config.ts`, fora da condição de modo, e o build parte se o
      pacote sair sem a linha sair também. Sai a linha e a dependência ao mesmo tempo

   **Detalhe apurado a 09/09/2026, mais grave do que estava registado.** São dois commits do
   bot, não um: `5246597` (21/05/2026 07:35:53 UTC) é a alteração e `e22227d` (07:36:47) é o
   *merge* que a trouxe para o `main`. O `git log -- .env` só mostrava o primeiro, porque
   omite merges por omissão.

   O que o commit fez não foi "reescrever o `.env`" — foi **repor a instância antiga**, e não
   tocou em mais nenhum ficheiro:

   ```
   -VITE_SUPABASE_PROJECT_ID="ijpxjpbjudaddfatibfl"
   +VITE_SUPABASE_PROJECT_ID="cyjwhmuakmiytypewwfw"
   ```

   Cinco semanas depois da migração de 12/04, o bot desfê-la no `.env`. E o commit traz
   `Co-authored-by: marmade`: **não foi o Lovable a mexer sozinho num repositório parado, foi
   uma sessão interactiva atribuída à conta da Marta.** O gatilho é abrir o editor e trabalhar
   lá, não o tempo a passar.

   Contraprova de 09/09/2026: a Marta abriu o Lovable nesse dia **só para ver créditos** e o
   `git fetch --all` não trouxe commit nenhum, em nenhum ramo. Consultar não desencadeia
   escrita; editar desencadeia.
6. [ ] **Reescrever `5_fetch_google_trends.py` — decisão de schema fechada a 07/09/2026,
   a aplicar ANTES de alguém implementar.**

   O índice do Google Trends é normalizado ao **máximo da janela pedida**. Duas descargas
   com janelas diferentes produzem séries em **escalas diferentes**, mesmo para a mesma
   keyword. Consequência: fazer *append* incremental cria em silêncio uma série com duas
   escalas misturadas — a mesma classe de falha que já custou as 3462 linhas de
   `historical_snapshots`.

   Regras, não sugestões:
   - a tabela guarda `fetched_at`, `window_start`, `window_end` e identificador do pedido
   - o dashboard lê **sempre de uma descarga só**
   - **SUBSTITUIÇÃO, NUNCA ACUMULAÇÃO**
   - séries longas em vez de pontos isolados; `geo=PT`; grupos com keyword-âncora
   - `NULL` + `collection_status` nas falhas, nunca `0`

   Calibração entre grupos de 5 keywords: West, R. (2020), *Calibration of Google Trends
   Time Series*, CIKM '20, pp. 2257-2260. DOI 10.1145/3340531.3412075

   Religar os passos 1 e 3 antes disto só acrescenta lixo à série.
7. [ ] **`7_fetch_autocomplete_questions.py`:** exportar primeiro as 3634 linhas de
   autocomplete que já estão na base de dados. **Só depois** tocar no script — mexer antes
   perde-as

### Suspensos — dependem de verificação prévia

- [x] **Exportar `historical_snapshots` da instância antiga** — **FEITO a 09/09/2026**, para
  `docs/arquivo/2026-09-09-instancia-antiga/`, junto com `news_items` (1994 linhas). São dados
  não pessoais. As tabelas com dados pessoais **não** foram exportadas, por decisão do mesmo
  dia. O arquivo é um seguro contra o único passo do plano sem volta atrás, não uma série
  aproveitável — o `README.md` da pasta tem os números.
- [x] ~~**Importar esses dados para a instância nova**~~ — **CANCELADO a 09/09/2026**, mas
  **não pela razão que ficou escrita primeiro**. A primeira leitura desta sessão concluiu, a
  partir de agregados, que "metade da série é o chão da falha". Isso é verdade e não chega:
  agregados escondem janelas. Ao olhar por mês e por keyword, o que aparece é pior e mais
  claro — **a série congelou a 14/04/2026** e os 105 dias seguintes são o mesmo valor
  repetido. O período que a instância nova não cobre é exactamente o período congelado.
  Não há nada que varie para importar
- [ ] **Decidir o destino do Google Trends no projecto** — em aberto desde 07/09/2026. Ver
  Crítico nº 6, onde a decisão de schema já está fechada. Sem esta decisão, os passos 1 e 3
  ficam comentados.
  **Facto novo de 09/09/2026:** candidatura ao **alpha da Google Trends API submetida a
  09/09/2026, sem resposta**. Decisão da Marta: **não esperar por ela.** Uma candidatura sem
  data de resposta não é um plano — se a resposta chegar, reabre-se o assunto

### Restantes

- [ ] **Depositar um instantâneo do repositório num arquivo com DOI.** **Acção da Marta —
      exige as contas dela** (GitHub + Zenodo); não se faz daqui.
      **Porquê:** o apêndice metodológico e o `docs/metodo/anexo-coordenadas.md` ligam cinco
      casos a commits deste repositório, e chamam-lhes de **grau 1 — verificáveis por
      qualquer pessoa**. Esse grau assenta em o repositório ser público e continuar lá. **Um
      commit é imutável; um repositório não é** — pode ser tornado privado, movido ou
      apagado, e nesse dia as coordenadas de grau 1 passam todas a grau 3 de uma só vez, sem
      aviso e sem nada no texto a assinalá-lo.
      **Como:** criar uma *release* no GitHub e ligar o Zenodo ao repositório, que deposita o
      instantâneo e devolve um DOI permanente. Depois, no anexo, acrescentar o DOI ao lado
      dos hashes — o hash diz *onde* no histórico, o DOI garante que o histórico continua
      acessível.
      **Até lá**, o anexo diz isto na secção "Limite deste anexo", para a fragilidade estar
      declarada e não descoberta por quem tentar verificar.
- [x] ~~**Aviso operacional — segunda-feira 06:00 UTC**, passo 2B a acumular linhas
      fabricadas~~ (resolvido a 09/09/2026: o passo 2B foi comentado, com motivo e condição
      de religação no próprio `youtube-trends.yml`. Passos activos: 11)
- [ ] **`set_updated_at` com `search_path` mutável.** Achado a 09/09/2026 pelo linter de
      segurança do Supabase (`function_search_path_mutable`, nível WARN). É anterior a esta
      sessão e não tem relação com o RLS. Fica registado para não se perder: a função devia
      declarar `set search_path = ''` e qualificar os nomes.
      https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
- [ ] **Nota sobre o linter:** o aviso `rls_enabled_no_policy` em `contactos_projecto` é
      **deliberado**, não é para corrigir. RLS activo com zero políticas é exactamente o
      estado pretendido: nega tudo a `anon`, e o `service_role` continua a passar
- [ ] **`contactos_projecto` na instância nova — apagar ou manter as 4 linhas.** Em aberto a
      09/09/2026, deliberadamente sem urgência: **não fecha exposição nenhuma**, porque a
      tabela está fechada ao anónimo desde 09/09 e o linter confirma zero políticas. É
      higiene de dados, não segurança. A favor de apagar: o plano de contactar cientistas
      provavelmente não avança e a Marta tem os contactos no telemóvel, logo a tabela deixou
      de ter finalidade — e dados pessoais sem finalidade não se guardam. Contra: custa nada
      mantê-los e a página `/revisao-pares` já não os lê de qualquer forma. **Se se apagar,
      sem exportação.**
- [ ] **Duas linhas de `revisao_pares` com o mesmo `eixo` ('emergentes').** `RevisaoPares.tsx`
      indexa por `eixo` num mapa, logo uma sobrepõe a outra e a página mostra só um dos dois
      pares. Achado a 09/09/2026. Decidir se é erro de dados (uma das linhas está a mais) ou
      se a página é que devia agrupar em vez de indexar
- [ ] **Aplicar a convenção de etiquetas de fonte à tabela de Verificações.** Decidida a
      09/09/2026, por aplicar — mexe em ~30 linhas antigas e faz-se de uma vez. **As seis
      linhas da sessão 13 já a levam**, logo o trabalho que falta é só nas anteriores.
      **Dois eixos independentes, uma linha leva os dois** (ex.: `[sessão 12][bd]`):
      as etiquetas actuais dizem **onde** foi verificado; as novas dizem **o que foi lido** —
      `[bd]`, `[ficheiro]`, `[documento]`.
      **`[agregado]` é modificador, não valor:** uma contagem por mês é uma pergunta à base de
      dados e seria `[bd]` com legitimidade, logo pô-lo como alternativa deixaria passar
      exactamente o erro que motivou isto. Forma certa: `[bd][agregado]` para contagens e
      médias, `[bd]` sozinho para as linhas.
      **Regra:** antes de uma decisão irreversível, uma linha `[agregado]` tem de ser reaberta
      até às linhas. `[declarado]` não leva o segundo eixo — não houve leitura.
      Motivo em `docs/sessoes/2026-09-09-b.md`, "a fonte derivada em vez da primária".
- [ ] **`trend_data` — tabela vazia e sem leitores, candidata a remoção.** 0 linhas,
      verificado a 14/09/2026. Criada pela migração `20260308110746`. Nada no `src/` a lê:
      a única ocorrência é a declaração de tipos gerada em `types.ts:596`. Remover obriga a
      mexer em três sítios — essa migração, a consolidada e o `migrate_data.py:35` — e a
      regenerar o `types.ts`; é pequeno, mas é uma migração destrutiva e não se faz de
      passagem. **Sem urgência:** uma tabela vazia com RLS activo e só leitura pública não
      expõe nada. O risco que esta tabela levanta não é ela — é o item abaixo.
- [ ] **`migration_consolidada.sql` — auditada a 14/09/2026, e o resultado foi o contrário
      do esperado.** `[sessão 13][bd]` + `[ficheiro]` Ver `AUDIT.md` secção 6.
      **CORRECÇÃO:** este item acusava o ficheiro de reintroduzir a leitura pública de
      `trend_data` como decisão de segurança revertida. **É falso.** Essa política está
      **activa na base de dados neste momento** — a migração de 09/09 removeu escrita
      anónima e nunca tocou em leitura. O ficheiro descreve o estado actual e não o
      contradiz. Houve **uma** reintrodução, `contactos_projecto`, tratada a 09/09/2026, e
      não duas. A versão anterior deste item contradizia o item do `trend_data` quinze
      linhas acima, que dizia — correctamente — que leitura pública numa tabela vazia com
      RLS não expõe nada.
      **O que a auditoria encontrou em vez disso, e é mais sério:**
      o ficheiro **afirma ser idempotente e não é** (24 `CREATE POLICY` sem `IF NOT EXISTS`
      e zero `DROP POLICY`; segunda corrida aborta em l.429), e o **histórico de migrações
      não reconstrói a base que existe** — 4 dos 8 registos remotos não têm ficheiro local,
      e os outros 4 têm ficheiro com o mesmo nome e versão diferente, logo um `db push` não
      vê nenhuma das correcções de 09/09 como aplicada. Isso faz da consolidada o único
      caminho de reconstrução real, o que **agrava** a falha de idempotência.
      O ficheiro tinha **632 linhas, não 749**.
      **CORRIDO E CORRIGIDO a 14/09/2026.** Foi executado pela primeira vez desde que foi
      gerado a 12/04/2026, num projecto Supabase **descartável** — a instância real não foi
      tocada. Em base vazia **passou inteiro**, e o schema produzido tem a **mesma assinatura
      md5 de colunas** que a instância real. A repetição falhou onde 6.2 previa, l.429, com
      `ERROR 42710`. Quatro correcções aplicadas: corpo envolvido em `BEGIN`/`COMMIT`,
      cabeçalho reescrito sem a palavra "idempotent" e com a condição de uso,
      `idx_eixos_archive_axis_week` acrescentado e a política de `bookmarks` renomeada para
      `Public read`. **E o ficheiro já corrigido foi corrido outra vez**, de ponta a ponta
      numa base vazia: passou, incluindo o `CREATE EXTENSION pg_cron` dentro da transacção,
      e **o schema produzido coincide com o da instância real nas três assinaturas md5** —
      colunas, políticas sem nome e políticas **com** nome, que era a última a divergir.
      **Fica por verificar uma coisa só:** o comportamento pelo caminho `psql` sem
      `--single-transaction`. Ver `AUDIT.md` secção 6, de 6.1 a 6.7.
- [ ] **`scripts/switch_supabase.sh` já só faz metade do que diz.** Verificado a 14/09/2026.
      Foi feito para trocar todas as referências da instância antiga para a nova, em cinco
      alvos. **Depois de 09/09/2026 os sete scripts Python leem a chave do ambiente**, logo
      o **passo 5 do script não encontra nada para substituir** e reporta `NO CHANGE`.
      Sobram-lhe três alvos reais: `.env`, `supabase/config.toml` e
      `.github/workflows/youtube-trends.yml`. Fica registado porque uma ferramenta de
      reparação que faz metade do trabalho **em silêncio** é a mesma classe de falha que
      este projecto passou dois meses a desenterrar — quem a corresse a seguir a um novo
      atropelo do Lovable veria "SWITCH COMPLETE" sem saber o que ficou por trocar.
      **Segundo ponto:** o `find "$REPO_ROOT/scripts" -name '*.py'` do passo 5 apanhava
      também a cópia órfã `scripts/.github/workflows/7_fetch_autocomplete_questions.py`,
      movida a 14/09/2026 para `_antigos/`. O script **fica onde está** — sai na colheita do
      Lovable, com o `Admin.tsx` (Crítico nº 5); até lá é a ferramenta que desfaz uma
      reescrita do `.env` como a de 21/05/2026.
- [ ] **`RevisaoPares.tsx` degrada em silêncio.** `if (ctRes.data) setContactos(ctRes.data)`
      trata `[]` do RLS como sucesso. Vale para as outras páginas: uma tabela fechada não dá
      erro, dá lista vazia. Se o site passar a depender disto, convém distinguir "sem dados"
      de "sem permissão"
- [ ] **Sessões 6 e 7 sem ficheiro em `docs/sessoes/`.** A numeração vai em 9 (14/08) mas só
      existem 6 ficheiros anteriores a 07/09/2026. Registar as duas em falta, ou assumir a
      lacuna explicitamente — contar ficheiros para inferir o número da sessão dá resultado
      errado
- [ ] **Painel admin com palavra-passe pública.** Exposta em claro no CONTEXT.md, em
      repositório público. Decisão de 07/09/2026: não alterar, porque o painel sai com o
      Lovable. Se o corte do Lovable for adiado ou o painel for reaproveitado na instância
      nova, esta decisão tem de ser revista.
      Exposta desde **08/03/2026** (`git log -S`: commit `ddfedee`, do bot do Lovable) —
      seis meses. Continua em `src/pages/Admin.tsx`, portanto é servida no bundle do
      frontend: retirá-la do CONTEXT.md não a esconde de quem abrir o site
- [ ] **Migração para `ijpxjpbjudaddfatibfl`** — iniciada na sessão 4, apagada; retomada em
      13/08/2026 pela sequência dos Críticos
- [ ] Recriar os cron jobs em `ijpxjpbjudaddfatibfl` como ficheiro de migração, não no dashboard
- [ ] **Deploy das 2 edge functions em falta na instância nova:** `generate-diz-que-disse` e
      `generate-guiao-questions`, ambas HTTP 404 a 14/08/2026. As outras cinco estão activas
      desde 28/07/2026 — incluindo `generate-guioes-weekly` e `archive-weekly`, que versões
      anteriores deste documento davam erradamente como em falta.

      **Duas condições obrigatórias antes de as deployar:**
      1. **Verificação de chamador por segredo partilhado** — o workflow envia um header, a
         função compara-o com uma variável de ambiente e devolve 401 se não bater. Nunca
         `service_role` key no workflow.
      2. **Renomear `VITE_PERPLEXITY_API_KEY` para `PERPLEXITY_API_KEY`** — painel e código
         ao mesmo tempo. O prefixo `VITE_` faz o Vite injectar a variável no bundle do
         frontend: basta alguém pô-la no `.env`, que é o gesto natural dado o nome, para a
         chave paga passar a ser servida ao browser.
- [ ] Actualizar /sobre bloco "fontes-de-dados": 16→44 feeds RSS, 36→56 canais YouTube,
      acrescentar Google Autocomplete como fonte — **com a ressalva de que o autocomplete
      não segmenta por país** (verificado 07/09/2026). As sugestões não são específicas de
      Portugal, e isso tem de constar da metodologia, não ser omitido
- [ ] Análise aos gráficos: verificar cálculo de `change_percent` em `5_fetch_google_trends.py` — confirmar coerência com /sobre, avaliar defensabilidade metodológica
- [ ] Saúdes.pt como fonte de curadoria manual de keywords e debunking (origem comercial Medis — a documentar)
- [ ] TED Talks / referências audiovisuais (Lado B — decisão adiada)
- [ ] Sazonalidade (precisa de 2+ anos de dados)

### Concluídos

- [x] ~~Verificar RLS de `contactos_projecto`~~ (07/09/2026 — resultado: **sem protecção
      efectiva**; foi o Crítico nº 1 dessa sessão e ficou fechado a 09/09/2026, Crítico nº 0)
- [x] ~~Acrescentar `.env` ao `.gitignore`~~ (sessão 10, 07/09/2026 — regra em
      `.gitignore:16`, confirmada com `git check-ignore --no-index`. O ficheiro **continua
      versionado**; retirar do tracking foi feito a 09/09/2026, Crítico nº 3)
- [x] ~~`eixos_archive` vazia~~ (07/09/2026 — 24 linhas, escritas pelo passo 7 do workflow)
- [x] ~~Revogar o PAT do GitHub exposto~~ (revogado a 13/08/2026 — distinto do token da sessão 4)
- [x] ~~Correr workflow manualmente para popular snapshots e guiões~~ (disparado 2026-03-27)
- [x] ~~Migração colunas eixo/subcategoria nos bookmarks~~ (pedido ao Lovable 2026-03-27)
- [x] ~~Token GitHub revogado~~ (token da sessão 4, Abril/2026 — distinto do que foi revogado a 13/08/2026)
- [x] ~~Preencher keyword_id nos registos do debunking~~ (35/35 linkados — sessão 3)
- [x] ~~Aplicar migração idx_news_items_date~~ (incluída na migração consolidada — sessão 4)
- [x] ~~Ping Supabase no workflow~~ (passo 0, wake up antes dos outros passos — sessão 5)
- [x] ~~Limpeza semanal de notícias por eixo~~ (`scripts/9_cleanup_old_news.py`, passo 4B — sessão 5)
- [x] ~~Debunking ordenado por data_publicacao DESC~~ (3 queries corrigidas — sessão 5)
- [x] ~~keyword_id no RSS fetch~~ (`fetch-rss-feeds/index.ts` agora insere keyword_id — sessão 5)
- [x] ~~Backfill keyword_id em news_items~~ (158/158 resolvidos, `scripts/10_backfill_news_keyword_id.py` — sessão 5)
- [x] ~~Sinónimos curtos adicionados~~ (menopausa, gripe aviária, microplásticos, TDAH — sessão 5)
- [x] ~~Channel ID Ordem dos Enfermeiros~~ (UCuDagVc79VVXXPFJurgXIiw adicionado — sessão 5)
- [x] ~~SPP Pediatria~~ (confirmado: canal não existe no YouTube — sessão 5)

## Code Review — Sessão 3 (2026-04-09)

### Corrigido
- **Weighted average distorcida** — `buildTrend.ts` usava `sum(v²)/sum(v)`, corrigido para média simples
- **Fallback misturava períodos** — `useAxisData.ts` podia comparar snapshot parcial com valor BD de período diferente; agora usa BD completa quando dados insuficientes
- **Emergentes nunca expiravam** — `5_fetch_google_trends.py` agora reseta `is_emergent` quando variação < 50% ou sem dados
- **YouTube falsos positivos** — `4_fetch_youtube_trends.py` agora usa word boundaries + blacklist (política, futebol, etc.)
- **YouTube axis mismatch** — `saude_mental` (underscore) corrigido para `saude-mental` (hyphen)
- **Alertas stale** — `detectAlerts.ts` exclui emergentes com variação negativa
- **Debunking sem data** — componente agora mostra `data_publicacao`, ordenado por data desc
- **Notícias sem limite** — query limitada a 12 meses (performance)
- **keyword_id no debunking** — script `8_link_debunking_keywords.py` linkou 35/35 registos

### Limitações conhecidas (não corrigidas)
- **Período "7d" com dados semanais** — workflow corre 1x/semana, logo "7d" terá 1-2 snapshots. Não engana (mostra dados BD) mas não acrescenta granularidade
- **Debunking sem expiração** — entradas antigas aparecem como actuais; recomendação: adicionar TTL ou aviso visual de staleness
- ~~**Notícias acumulam na BD**~~ — resolvido sessão 5: limpeza semanal condicional por eixo (`scripts/9_cleanup_old_news.py`)

## Migração Supabase — Sessão 4 (2026-04-12)

### Concluído
- **Migração completa** de `cyjwhmuakmiytypewwfw` (Lovable) → `ijpxjpbjudaddfatibfl` (Marta)
- **17 tabelas recriadas** com schema Lovable (drop + recreate); 2 preservadas (bookmarks, eixos_archive)
- **Dados migrados**: ~7100 rows do Lovable + 136 rows transformados da Marta (debunking + guiões)
- **Config actualizada**: `.env`, `config.toml`, workflow GitHub Actions, 5 scripts Python
- **Backup** dos dados originais da Marta em `scripts/marta_backup/` (5 ficheiros JSON)
- **SQL consolidado** das 38 migrations em `scripts/migration_consolidada.sql`
  (749 linhas à data; **632 a 14/09/2026** — ver `AUDIT.md` secção 6)
- **Scripts auxiliares**: `scripts/migrate_data.py`, `scripts/switch_supabase.sh`

### Regra de merge aplicada
- Conflito por ID → ganha a instância com mais registos nessa tabela
- debunking (36) e guiões (100): dados da Marta, transformados para schema Lovable
- bookmarks (179→182): Lovable + 3 da Marta merged
- Tudo o resto: Lovable

---

## Padrões estabelecidos

- **Lovable:** em abandono desde 07/09/2026 (ver Crítico nº 5). Até ao corte, Marta envia
  sempre os prompts ela própria
- **claude.ai não escreve no repositório:** o `CONTEXT.md` que a janela do claude.ai lê está
  em Project Knowledge e é uma cópia só de leitura. O ficheiro vivo é
  `~/Documents/health-pulse-portugal/CONTEXT.md`, e só o Claude Code ou a Marta lá escrevem.
  As duas cópias divergirem foi o problema identificado a 14/08/2026
- **Claude Code:** usar para trabalho de código, scripts, commits (comando `claude`, a partir
  de `~/Documents/health-pulse-portugal`)
- **claude.ai:** estratégia, explicações, briefings entre sessões
- **Supabase:** duas instâncias até a transição fechar; confirmar sempre em qual se está a
  trabalhar antes de alterar dados. Agendamento (`pg_cron`) só via ficheiro de migração,
  nunca no dashboard — foi assim que o cron da instância antiga ficou invisível no repositório
  e continuou a copiar dados de Abril durante meses sem ser detectado
- **Recolha de dados:** uma falha de recolha nunca se escreve como valor. `NULL` + estado
  explícito, nunca `0` — um zero é indistinguível de um dado real e corrompe a série
- **GitHub commits:** via Claude Code (git normal)
- **Git só no terminal, nunca pelo bridge de ficheiros do Cowork.** Inclui comandos de
  leitura: o `git status` escreve `.git/index.lock` e o shell do bridge não tem permissão
  para o remover, o que deixa um lock órfão na pasta. Foi assim que apareceu o lock de
  14/09/2026 — o mecanismo está provado pelo erro `unable to unlink .git/index.lock:
  Operation not permitted` no output dessa sessão; a correspondência com a hora exacta
  (15:38) não foi confirmada. Git é do Claude Code ou da Marta
- **Troca de sessão:** Claude actualiza CONTEXT.md + cria `docs/sessoes/YYYY-MM-DD.md`
- **Rigor científico:** documentar sempre a fonte e limitações metodológicas
- **Fontes peer-reviewed:** MSD Manuals, Acta Médica PT, RPMGF, SciELO, Cochrane
- **Benchmark negativo:** cada pseudociência tem link MSD como contra-narrativa
- **/sobre editável:** DB sobre_conteudo ganha sobre ficheiro sobreContent.ts
