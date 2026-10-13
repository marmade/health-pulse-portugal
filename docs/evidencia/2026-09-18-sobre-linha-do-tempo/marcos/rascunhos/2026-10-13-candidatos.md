---
estado: rascunho de 13/10/2026, no Cowork. Candidatos a marco, não escritos com a Marta. Decisão da Marta (13/10): os marcos ficam para o fim (depois do fecho da ferramenta, 30/10). Não entram na linha do tempo do /sobre até serem escritos e fechados com ela, frase a frase.
---

# Candidatos a marco (depois de 28/09)

Formato dos marcos: Pensava-se / Descobriu-se / Mudou. Regras de escrita (06/10): sem datas no
texto ("os marcos já são datas"); evitar a mesma palavra com dois sentidos; linguagem simples.
Cada "Mudou" só se escreve depois de provado pelo efeito.

## 1. A página inicial e o arquivo não mostravam a mesma coisa — 13/10

- Pensava-se: "os mais procurados" eram uma só lista.
- Descobriu-se: havia três contas diferentes (arquivo = valor da semana; página inicial =
  mediana de 52 semanas; script de recolha = mediana de 5 anos, só no registo). Com os mesmos
  dados, o arquivo punha o sarampo em 1.º nos emergentes e a página inicial não o mostrava.
  Os empates decidiam-se pela ordem em que os dados chegavam (caso real: arquivo de 05/10,
  emergentes, gripe A = vacinas, 68).
- Mudou: uma só ordenação; empates partilham o lugar. Publicado a 13/10 (commit 6b732e0).
  **Prova pelo efeito: arquivo de 19/10** (critério em docs/sessoes/2026-10-13.md §1).
- Fontes: docs/sessoes/2026-10-13.md §1–3; 2026-10-13-cowork.md §2 e §5.

## 2. Os guiões ficaram duas semanas sem perguntas da IA, sem aviso — 13/10

- Pensava-se: desde a correcção do briefing, a IA sugeria perguntas todas as semanas.
- Descobriu-se: a protecção de acesso publicada no mesmo dia dessa correcção bloqueava o pedido
  à IA (a chamada interna chegava sem o identificador que a verificação lia). Os guiões de duas
  semanas gravaram-se só com perguntas do banco, e o processo não avisava. Exemplo de falha
  silenciosa.
- Mudou: corrigido e provado sem escrita a 13/10 (commit 2f374a1); o processo passa a falhar à
  vista se voltar a acontecer. **Prova pelo efeito: guiões de 19/10** (critério em
  docs/sessoes/2026-10-13.md §6.1). Decisão pendente da Marta: completar ou não as duas semanas.
- Fontes: docs/sessoes/2026-10-13.md §6; 2026-10-05.md §5; base, guioes_semanais (fonte "banco"
  nas semanas de 05/10 e 12/10, verificado a 13/10 em saúde mental).

## 3. Os alertas decidiam-se ao acaso nos limites — 11/10

- Pensava-se: a regra dos alertas era aplicada como está escrita ("pelo menos uma vez e meia").
- Descobriu-se: os valores do Google são inteiros pequenos e caem muitas vezes exactamente no
  limite (ex.: 12 contra 8); nesses casos decidia o último algarismo da conta, não os dados.
  43 de 43 diferenças estavam em cima de um limite.
- Mudou: **por escrever** — correcção marcada para 14/10; prova no lote de 18/10.
- Fontes: docs/sessoes/2026-10-11.md §3.5–4.2.

## 4. As efemérides não se viram nas pesquisas — a confirmar

- Até agora só o Dia Mundial da Saúde Mental (10/10): na semana do Google de 04/10, nenhum termo
  de topo do eixo subiu (ansiedade 157,7 → 151,8; psiquiatra 74,4 → 68,5; toc 53,7 → 47,1).
  Leitura não verificada: um só dia numa série semanal dilui um pico; o público pode não usar o
  vocabulário das keywords.
- **Esperar pelos dados de Alimentação (16/10) e Menopausa (18/10)** antes de ser marco.
- Fontes: 2026-10-13-cowork.md §2.

## Correcção a um marco fechado (decisão da Marta, por tomar)

O marco de 28/09 diz que os guiões, "na primeira corrida automática, vieram vazios devido a um
erro". Verificado a 13/10: não vieram vazios — vieram com 5 perguntas por eixo, todas do banco,
nenhuma da IA. Frase exacta proposta: "vieram só com perguntas do banco, sem as da IA, devido a
um erro". Este texto está publicado no /sobre.
