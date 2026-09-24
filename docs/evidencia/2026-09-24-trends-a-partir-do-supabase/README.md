# O Google Trends a partir dos servidores do Supabase — 24/09/2026

**Pergunta:** os passos do Trends estão desligados no workflow desde Agosto porque o Google
devolve 429 aos servidores do GitHub. O script corre à mão, do Mac da Marta. Ela pôs a
objecção de fundo: *"se o script só corre a partir do teu Mac, o arquivo semanal depende de
te lembrares. Isso não é um sistema."* Daí a pergunta: **o Google bloqueia também os
servidores do Supabase?**

## Resposta

**Não bloqueia** — desde que se faça o aquecimento de cookie. E aguenta a corrida semanal
inteira.

| | v1, sem cookie | v2, com cookie | **v3, a corrida inteira** |
|---|---|---|---|
| pedidos | 17 | 17 | **33** |
| `explore` a devolver **429** | **17** | 0 | **0** |
| `explore` a devolver **200** | 0 | 17 | **33** |
| `multiline` a devolver 200 | 0 | 17 | 33 |
| pontos por pedido | 0 | 262 | **262** |
| aquecimentos com cookie `NID` | — | 5 de 5 | **9 de 9** |

## Uma correcção a este documento, pedida pela Marta

A primeira versão deste README dizia que o teste *"repete a corrida semanal: os mesmos 17
grupos"*. **Era falso, e ela apanhou-o.** A corrida semanal do script 5 **não são 17 pedidos,
são 33**:

| passo | pedidos | o que é |
|---|---|---|
| 1 | **24** | 4 eixos × 6 grupos de 5 termos (a âncora do eixo mais quatro) |
| 2 | **8** | os termos esmagados (máx < 15), com âncora secundária — `bipolar`, `obesidade`, `tiroide`, `vacinas` |
| 3 | **1** | as quatro âncoras juntas, para ligar os eixos |

Os 17 da v2 eram uma amostra escolhida por mim, pouco mais de metade. A **v3** corrigiu isto:
recebe os grupos como entrada e levou **os 33 exactos** do lote gravado nesse mesmo dia — os
mesmos termos, a mesma ordem, os mesmos tamanhos de grupo (de 2 a 5 termos). Estão em
`os-33-grupos.json`.

## As condições que a Marta pôs ao teste, e como foram cumpridas

1. **Não usar a `google-trends` publicada.** Ela escreve: faz `upsert` em `trends_cache`
   (`setCache`, no código que está no servidor). Foi lida antes, e posta de lado. As versões
   de teste **não importam o cliente Supabase** e não têm a chave — não podem escrever.
   Confirmável por `grep` nos ficheiros ao lado.
2. **Um pedido não prova nada.** A v2 repetiu 17 pedidos com a pausa de 15 s; a **v3 repetiu
   os 33 da corrida real**, com a mesma pausa, categoria 45, geo PT, 5 anos.
3. **Dizer o que o resultado não prova.** Ver abaixo.

## O erro do primeiro teste, e porque é que ele conta

A v1 deu 17/17 429 e eu ia a caminho de concluir que o Supabase estava bloqueado. **Estava
errado, e o erro era meu:** o `pytrends` pede primeiro um cookie ao Google e a v1 não pedia.
Verificado no código instalado — `.venv-trends/lib/python3.9/site-packages/pytrends/request.py:67`,
`GetGoogleCookie()`. Um 429 sem cookie não distingue "bloqueado por IP" de "falta o cookie".

A v2 acrescenta esse passo e mais nada. O resultado inverte-se por completo.

## O que este resultado NÃO prova

1. **Não desmente o bloqueio do GitHub.** O `pytrends` faz o aquecimento de cookie, logo os
   429 das corridas do GitHub não se explicam por esta falha. A leitura de que aí é bloqueio
   por IP mantém-se de pé.
2. **Não prova que se mantenha.** Três janelas de dez minutos, todas a 24/09/2026.
3. **Testou os IPs deste projecto**, região eu-west-1. Outra região pode responder de outra
   maneira.
4. **Não prova que a recolha inteira caiba numa Edge Function.** Provou que o Google responde
   às 33 chamadas. A calibração, os dois saltos das âncoras secundárias e os alertas continuam
   em Python, e é isso que a via B mantém de propósito.
5. **Não prova nada sobre o calendário.** Que às 06:00 UTC de uma segunda o Google já marque a
   semana anterior como completa **não está verificado** — é suposição, e a primeira
   segunda-feira é que a mede.

## O que fica decidido

**Via B, decidida pela Marta a 24/09** — o Supabase vai buscar, a matemática fica em Python:

- uma Edge Function nova, `trends-buscar-grupo`, **com `verify_jwt` ligado**: só o workflow a
  chama;
- no script 5, troca-se o miolo da `pedir()` (l.69–92) por um pedido HTTP a essa função —
  mesma assinatura, mesmo formato de saída, nada a jusante muda;
- **a opção `--via pytrends` fica como recuo**;
- quem agenda e faz o ciclo é o workflow de segunda, que já existe.

**Domingo 27/09 continua a ser à mão** (`scripts/recolher_domingo.sh`), até a via B ter
passado uma segunda-feira.

## A função no servidor

Publicada como `teste-429-trends` para correr os testes, e **desarmada** entre eles e no fim,
a pedido da Marta. A versão que lá está (v5) devolve 410, não fala com o Google, não lê nem
escreve nada, e exige JWT. **Não foi apagada** — o MCP do Supabase não tem ferramenta para
apagar Edge Functions, não há CLI nesta máquina e não há token de acesso. **Apagar no
painel:** Edge Functions → `teste-429-trends` → Delete.

O código está aqui ao lado, fora de `supabase/functions/`, para não ser confundido com uma
função viva do projecto.

## Ficheiros

| ficheiro | o que é |
|---|---|
| `v1-sem-cookie.ts` | a primeira versão, a que deu 17/17 429 — fica como registo do erro |
| `v2-com-cookie.ts` | a que inverteu o resultado, com 17 grupos |
| `os-33-grupos.json` | os 33 grupos exactos do lote de 24/09, tal como o script 5 os formou |
| `resultado-v1-sem-cookie.json.log` | respostas em bruto da v1 |
| `resultado-v2-com-cookie.json.log` | respostas em bruto da v2 |
| `resultado-v3-33-pedidos.json.log` | respostas em bruto da corrida inteira, 33 pedidos |

A v3 é a v2 com uma diferença só: os grupos vêm no corpo do pedido em vez de estarem fixos no
código. O texto dela está no comentário da função desarmada, no servidor.
