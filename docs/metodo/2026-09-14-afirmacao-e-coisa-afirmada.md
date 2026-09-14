# A afirmação e a coisa afirmada

> Nota de método. Escrita a 14/09/2026 a partir do registo da sessão 13
> (`docs/sessoes/2026-09-14.md`, 595 linhas) e da secção 6 do `AUDIT.md`.
> Registo técnico, não texto de tese. Serve de base ao apêndice metodológico.
> Toda a evidência citada aqui tem data e está verificável no repositório ou por
> consulta à base de dados; onde houver dedução, está dito.

## Porque existe esta nota

A 14/09/2026 gastou-se um dia inteiro em higiene de repositório — seis commits, uma
auditoria, zero conteúdo de projecto. Justificou-se, porque uma divergência entre
documentos estava a produzir trabalho errado. Mas o que saiu do dia não foi só um
repositório arrumado: foi um padrão, observado **cinco vezes**, em três famílias
distintas, todas com data e prova.

O padrão importa mais do que qualquer das correcções, porque as correcções fecham e o
padrão volta.

## Família A — a afirmação e a coisa afirmada vivem em sítios diferentes

Uma afirmação sobre algo é escrita num lugar; a coisa afirmada muda noutro. Só uma das
duas é actualizada. Ninguém mentiu, ninguém foi descuidado: a distância entre as duas é
que faz o trabalho.

**A1. A cópia do `CONTEXT.md` no Project Knowledge.** A cópia estava no estado de
14/08/2026 enquanto o ficheiro vivo ia em 09/09. Uma sessão leu a cópia como estado
actual e trabalhou sobre ele. Resolvido a 14/09 substituindo as cópias do `CONTEXT.md` e
do `AUDIT.md` por apontadores para o repositório — não há mais cópia, e não se repõe.

**A2. A secção Stack do `CONTEXT.md`.** Descrevia a instância antiga como "em uso de
facto" **cinco dias depois** de o Crítico nº 3 a ter corrigido, no mesmo ficheiro.
O documento contradizia-se a si próprio a poucas secções de distância.

**A3. O cabeçalho da `migration_consolidada.sql`.** Prometia, na l.5, "single
**idempotent** script", e datava-se de "Generated: 2026-04-12". O corpo foi editado a
09/09/2026 — 31 políticas de escrita substituídas por uma nota de nove linhas — e o
cabeçalho não acompanhou. A afirmação de idempotência nunca foi verdadeira: as 24
`CREATE POLICY` não têm `IF NOT EXISTS` (o PostgreSQL não o oferece para políticas) e não
havia uma única `DROP POLICY IF EXISTS` no ficheiro. Verificado por execução a 14/09:
segunda corrida devolve `ERROR: 42710: policy "Allow public read on trends_cache" for
table "trends_cache" already exists`.

O número de linhas do mesmo ficheiro tinha o mesmo defeito: o `CONTEXT.md` e o
`CLAUDE.md` diziam 749 linhas, o ficheiro tinha 632. *Dedução, não verificada:* 749−632 =
117, compatível com a substituição das 31 políticas pela nota de nove linhas — o que
faria do 749 um número pré-09/09 nunca actualizado.

## Família B — uma verificação verdadeira a responder à pergunta errada

Distinta da família A, e mais difícil de apanhar: não há nenhum facto falso. Há um facto
correcto, obtido por verificação real, colocado a sustentar uma conclusão que ele não
sustenta.

**B1. O `sha256` do ficheiro testado.** A 14/09, depois de a consolidada ser corrigida e
corrida, verificou-se que o `sha256` do ficheiro em disco
(`2b4eb167cbb671cd7df82f731819b43b0e7799c175515223bce079321e241a9a`) era idêntico ao do
ficheiro commitado. Verdadeiro, e verificado no terminal. Foi escrito no `AUDIT.md` como
prova de que o texto executado contra a base de dados era byte a byte o ficheiro — o que
não decorre dali. O texto executado tinha sido composto através de uma janela de conversa,
a partir de uma leitura estrutural do ficheiro. O `sha256` fixa **de que versão do
ficheiro o teste fala**; não atesta o que chegou à base.

A distinção que ficou no `AUDIT.md` 6.7: a fidelidade do segundo teste é atestada **por
consequência** — coincidem as três assinaturas, e uma composição infiel teria de acertar
por acaso em 24 nomes de política, nos papéis de cada uma e numa definição de índice — e
**não por identidade**. Prova por identidade é inalcançável com as ferramentas actuais:
exigiria o ficheiro chegar à base sem passar pela janela, ou seja senha da base e `psql`.

Corrigido no commit seguinte. A afirmação errada sobrevive na mensagem do commit
`92bfadf`, já publicado, com a correcção anexada à mensagem do `d657344` — história
partilhada anota-se, não se reescreve.

## Família C — rastreabilidade perdida por uma ferramenta que escreve sem registar

A única das três sem correcção possível.

**C1. O histórico de migrações não descreve a base de dados que existe.** 42 ficheiros em
`supabase/migrations/`; 8 registos no histórico remoto. Dos 8, quatro (os de Março de
2026) não têm ficheiro local nenhum — história perdida. Os outros quatro, as correcções de
09/09, existem dos dois lados com **números de versão diferentes**:

| local | remoto |
|---|---|
| `20260909160000_contactos_projecto_rls_restrict.sql` | `20260909151958` |
| `20260909180000_revisao_pares_sem_escrita_anonima.sql` | `20260909180147` |
| `20260909190000_sem_escrita_anonima_em_todas_as_tabelas.sql` | `20260909181907` |
| `20260909200000_revisao_pares_sem_contactos.sql` | `20260909192141` |

O nome coincide, a versão não, e é pela versão que o Supabase decide o que está aplicado.
Consequência verificada: um `db push` desta pasta não vê nenhuma das quatro correcções
como aplicada.

*Dedução, não verificada:* o projecto foi criado a 08/03/2026 e o histórico remoto começa
a 25/03 — compatível com o Lovable a aplicar SQL directo sem registar, e com o registo a
começar quando se passou a aplicar por CLI/MCP.

Ninguém mentiu aqui tampouco. A ferramenta que construiu o projecto escrevia na base sem
deixar registo de que tinha escrito. O plano de recuperação de emergência assentava num
ledger que não descreve a base — e isso só se descobriu ao comparar as duas coisas, que é
precisamente o que ninguém faz no dia em que precisa do plano.

## O que distingue as três

| | o que falha | tem correcção? |
|---|---|---|
| A | a afirmação não acompanha a coisa afirmada | sim — aproximar as duas, ou apontar de uma para a outra |
| B | a verificação é real mas responde a outra pergunta | sim — nomear o grau de prova e o que ele não cobre |
| C | a ferramenta age sem registar que agiu | **não** — só se detecta comparando |

A família A resolve-se por arrumação: não ter duas cópias, e quando a regra tiver de viver
noutro ficheiro, deixar remissão em vez de duplicado. A família B não se resolve por
arrumação nenhuma — resolve-se por hábito, e o hábito é escrever ao lado de cada prova o
que ela não prova. A família C não se resolve.

## Regras que saíram daqui, e que estão em vigor

1. **Uma só fonte de verdade por assunto, e apontadores em vez de cópias.** As cópias no
   Project Knowledge foram substituídas por apontadores a 14/09/2026.
2. **A regra vive no ficheiro que o seu leitor abre** — e quando isso a separa de outra
   regra da mesma família, deixa-se remissão, nunca duplicado.
3. **Histórico anota-se, não se reescreve.** Um parágrafo antigo com afirmação falsa
   mantém-se e leva aviso a apontar para a refutação. Vale para `docs/sessoes/`, para o
   `AUDIT.md` e para mensagens de commit já publicadas.
4. **Ao lado de cada prova, o que ela não prova.** O grau — por identidade, por
   consequência, por dedução — escreve-se junto ao resultado.
5. **Uma correcção não verificada não é uma correcção.** A 14/09 o ficheiro foi corrigido
   e dado por bom antes de voltar a ser corrido; correu-se, e só então o cabeçalho deixou
   de ser inferência.

## Limite desta nota

É um caso único, observado por quem o produziu, num projecto de uma pessoa. Não é um
estudo e não sustenta generalização. O que sustenta é mais modesto e verificável: num
projecto construído com assistência de IA, ao longo de seis meses, cinco afirmações
documentais divergiram do sistema que descreviam, em três modos distintos, e todas foram
detectadas por comparação directa com o sistema — nunca por releitura dos documentos.

## Referências de enquadramento

Localizadas e verificadas a 14/09/2026. **Nenhuma trata do objecto desta nota.** São de
áreas vizinhas e servem de enquadramento por analogia — enquadram, não provam. Escrevê-las
como se sustentassem os casos concretos seria uma instância da família B.

- **Modo B, o erro de alcance.** Cronbach, L. J., & Meehl, P. E. (1955). Construct validity
  in psychological tests. *Psychological Bulletin*, 52(4), 281–302.
  DOI 10.1037/h0040957 — formulação clássica de que uma medida tem de ser demonstrada a
  medir o construto que se lhe atribui. O `sha256` media uma coisa e foi lido como medindo
  outra.
- **Modo B, porque não foi apanhado.** Parasuraman, R., & Manzey, D. H. (2010). Complacency
  and Bias in Human Use of Automation: An Attentional Integration. *Human Factors*, 52(3),
  381–410. DOI 10.1177/0018720810376055 — complacência e viés no uso de automação.
- **Modo C, proveniência.** Herschel, M., Diestelkämper, R., & Ben Lahmar, H. (2017). A
  survey on provenance: What for? What form? What from? *The VLDB Journal*, 26(6), 881–906.
  DOI 10.1007/s00778-017-0486-1 — o que é registo de proveniência e para que serve.
- **Modo C, reprodutibilidade.** Peng, R. D. (2011). Reproducible Research in Computational
  Science. *Science*, 334, 1226–1227. DOI 10.1126/science.1213847. *(Volume e páginas
  verificados; número do fascículo não confirmado.)*

Sobre detectores de texto gerado, a propósito do aviso encontrado a 14/09/2026 ao colar o
rascunho num documento: Liang, W., Yuksekgonul, M., Mao, Y., Wu, E., & Zou, J. (2023). GPT
detectors are biased against non-native English writers. *Patterns*. arXiv:2304.02819;
PMID 37521038. *(DOI não confirmado — as páginas do editor devolveram 403.)*
