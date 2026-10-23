---
estado: rascunho, aberto a 23/10/2026 no Cowork. Ficheiro único e acumulado — vai-se acrescentando à medida que os textos do ecrã deixam detalhes de método de fora. Nada daqui entra no /sobre sem ser escrito e fechado com a Marta, frase a frase.
nao_confundir: os marcos da linha do tempo (Pensava-se / Descobriu-se / Mudou) vivem em marcos/ e marcos/rascunhos/. Isto é outra coisa — o "como funciona", não o "o que aconteceu".
---

# Notas de método para o /sobre — rascunho

## 1. Alertas

### 1.1 O texto do ecrã (aprovado pela Marta a 23/10, recolhido em "Como ler os alertas")

> **Alertas.** Um alerta diz que um termo foi mais procurado numa semana do que costuma ser. Os
> valores são os do Google Trends: relativos, de 0 a 100, comparáveis só dentro do mesmo eixo —
> não são números de pesquisas.
>
> ▲ **Subida.** O "valor normal" é a mediana das oito semanas anteriores. Há alerta quando a
> semana fica pelo menos 1,5 vezes acima dele e bem acima da oscilação habitual do termo. "Em
> curso, 3.ª semana" quer dizer que a subida dura há três semanas; enquanto dura, o valor normal
> fica o de antes de começar.
> ● **Aparecimento.** Um termo sem procura regular passa a ser procurado, muito acima do que tinha
> no último ano.
> ~ **Sazonal.** A subida é a que esta época do ano costuma trazer. Mostra-se, mas não é alerta.
> ○ **A observar.** Está a mexer sem chegar a alerta.
>
> A semana em curso não conta. O alerta diz que algo subiu, não porquê: isso é leitura de quem o
> vê. "Nenhum alerta" quer dizer que nenhum termo cumpriu a regra nessa semana, não que nada
> mudou no tema.

### 1.2 O que o ecrã deixa de fora (para o /sobre)

Fonte de tudo o que se segue: `docs/metodo/2026-09-18-alertas-regra.md` §3 (a regra), §5 (o
varrimento) e §7 (as decisões da Marta de 18/09).

- **Procura regular.** Só pode ter alerta de subida o termo com valor acima de 0 em pelo menos 6
  das 8 semanas de referência. É uma condição do projecto, não um limiar do Google.
- **"Bem acima da oscilação habitual".** Mede-se a oscilação do termo nas mesmas 8 semanas com o
  MAD (desvio absoluto mediano — uma medida de dispersão que não se deixa arrastar por um pico
  isolado), com dois pisos: 2 pontos e 10 % do valor normal. A subida tem de ser pelo menos 3
  vezes essa oscilação (z ≥ 3).
- **As duas condições juntas.** O z sozinho dispara em séries muito planas com subidas pequenas;
  o 1,5 sozinho dispara no ruído dos termos pequenos. Por isso exigem-se as duas.
- **Porquê 8 semanas.** Curto para ser "recente" (dois meses); longo para a mediana absorver 3–4
  semanas de oscilação; com 12 a diferença foi pequena e a referência começava a atravessar
  estações.
- **Sazonal.** Para cada ano anterior (até 4), mede-se quanto aquela época costuma subir; se
  costuma subir 1,5 vezes ou mais e a subida deste ano não passa desse costume com 25 % de
  folga, é sazonal. Sem ano anterior, não há desconto (por isso o "cancro da mama" disparou em
  Outubro de 2022 e foi sazonal em 2023, 2024 e 2025).
- **Aparecimento.** Valor ≥ 20 na régua do próprio pedido (abaixo disso é a oscilação aleatória
  do Google, que vive nos 10–19) e pelo menos o dobro do máximo das 52 semanas anteriores.
  Aplica-se a todos os eixos (decisão 4 de 18/09).
- **"Em curso".** O valor normal congela no da semana antes do primeiro disparo; o alerta
  continua enquanto o valor estiver ≥ 1,5 vezes esse valor congelado. Sem isto, o pico entrava
  na referência e o alerta calava-se à 3.ª semana (decisão 3 de 18/09).

### 1.3 Porquê 1,5 — e o que isso faz às contagens

- O 1,5 **não sai de uma fórmula**: foi uma escolha da Marta a 18/09, depois de testar a regra em
  cinco anos de dados com quatro combinações de limiares (§5 e §7, decisão 1).
- O limiar mais duro (z ≥ 4 e 2 vezes) deixava 43 alertas em cinco anos em vez de 109, e perdia
  as subidas de metade a dobro — "stress" (1,6–1,9 vezes), "alzheimer" (1,5–2,0), "colesterol
  alto" (1,7), "menopausa" na semana do Dia Mundial: as semanas em que "está a subir e vale a
  pena falar disto". As subidas grandes passam nos dois limiares.
- Com os valores fixados, a regra deu, nos cinco anos: 109 subidas + 8 aparecimentos, cerca de
  23 por ano, nunca mais de 4 numa semana; 18 subidas descontadas como sazonais.
- O número fica sempre ao lado da bandeira ("2,7 vezes acima do valor normal"), para um alerta
  fraco se ler como fraco.
- `[por escrever com a Marta]` como dizer, no /sobre, que o 1,5 é uma escolha testada e não uma
  lei estatística — é o que torna o método honesto.

### 1.4 Limite a declarar

- Em Setembro de 2026, só 17 dos 84 termos tinham procura regular (§5) — a regra de subida
  existia para cerca de um quinto da lista. Número datado: refazer a contagem com a lista actual
  antes de o publicar.
- A 14/10 corrigiu-se o cálculo nos limites: os valores do Google são inteiros pequenos e caem
  muitas vezes em cima do limite (ex. 12 contra 8); passou a calcular-se em fracções exactas
  (`docs/sessoes/2026-10-14.md`). Ver também o candidato a marco n.º 3 em
  `marcos/rascunhos/2026-10-13-candidatos.md`.
