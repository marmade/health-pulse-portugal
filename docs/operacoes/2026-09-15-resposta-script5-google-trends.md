# Resposta ao brief do script 5 — 15/09/2026

> Resposta à pergunta em `2026-09-15-pergunta-script5-google-trends.md`, escrita no terminal.
> O brief pediu discordância onde a houvesse. **Há uma, e é a que mais importa.**

---

## O que está errado: a janela de 8 meses fecha a porta ao ano-a-ano

O Google Trends muda a granularidade conforme a janela **pedida num único pedido**:

| janela pedida | devolve |
|---|---|
| até ~9 meses | **diário** |
| ~9 meses a 5 anos | **semanal** |
| mais de 5 anos | mensal |

A janela de 8 meses dá diário — o brief acerta nisso. **Mas uma janela de 8 meses nunca
contém o ano anterior**, e a regra nº 3 do próprio desenho proíbe — correctamente — colar
descargas.

**O desenho, tal como está, garante que o gráfico que motivou tudo isto nunca funciona.**

### A correcção é aditiva: duas descargas, não uma

- **Descarga A — semanal, 5 anos, `geo=PT`.** ~260 pontos por termo, tudo na mesma régua num
  só pedido. **É o que dá o ano-a-ano.**
- **Descarga B — diária, 8 meses, `geo=PT`.** O que o brief propõe. Dá o detalhe recente e é
  o que permite observar o mecanismo notícia→procura.

Mesma âncora, mesmos grupos: **42 pedidos por passagem em vez de 21.** O custo continua
irrelevante.

### E o ganho que não está no brief

`docs/sessoes/2026-09-15.md` regista: *"a sazonalidade não é alcançável com este material:
precisa de 2+ anos e há seis meses"*.

**A descarga A tem cinco anos hoje.** O Google tem esse histórico; o projecto nunca o pediu.
**Uma limitação registada como estrutural resolve-se com uma descarga** — e antes de o
pipeline semanal estar escrito.

---

## O segundo problema: uma âncora só não chega

Com **43 das 82 keywords activas a zero**, uma âncora de volume alto esmaga as de volume
baixo. Um termo com 1/1000 do volume da âncora **volta como `0`** — e fica-se outra vez com
um zero que significa ao mesmo tempo *"sem procura"* e *"abaixo do limiar de medição"*.

**É exactamente o defeito que este trabalho todo está a corrigir, a reaparecer no sistema
novo.** O brief cita West (2020), mas usa **uma** âncora; é precisamente esse artigo que
trata do encadeamento quando as escalas não se sobrepõem.

O que proponho acrescentar ao desenho:

1. **Escolher a âncora com dados.** O melhor candidato medido é **`menopausa sintomas`** —
   máximo 100 e 32 valores distintos na única janela com variação (`CONTEXT.md`,
   Verificações, 09/09/2026). Validar antes, não assumir.
2. **Contar com duas âncoras encadeadas** — uma de volume alto e uma de volume baixo, com
   sobreposição entre grupos.
3. **`abaixo_do_limiar` como valor de `collection_status`**, distinto de `NULL` (falha) e de
   `0` (medição). É informação: *"menos de 1% da âncora X"*, e é auditável.

---

## Respostas às quatro perguntas

### 1. O desenho está certo?

**Sim, no essencial** — a calibração por âncora, guardar a descarga inteira, nunca colar
séries, `NULL` + estado, e isolar a fonte numa função são todos correctos, e o raciocínio de
que *"análise semanal não precisa de recolha semanal"* está certo.

**Falta-lhe** a descarga de 5 anos (secção 1) e o encadeamento de âncoras (secção 2).

### 2. Pagar ou `trendspyg`?

**Pagar — e a decisão não é sobre dinheiro.** 42 pedidos × 52 semanas ≈ **2200/ano**, o que a
$0,001–0,009 dá **$2 a $20 por ano**; o depósito de $50 sem validade dura anos.

O que se compra não é volume: é **deixar de depender de um scraper de endpoints não
documentados**. O `trendspyg` é grátis e tem exactamente a fragilidade que trouxe o projecto
até aqui — o `pytrends` também funcionou, até deixar de funcionar.

*Nota de honestidade:* os preços e o estado da API alpha são os do brief, apurados a
15/09/2026. **Não foram verificados no terminal.**

### 3. Ordem de trabalho

1. **O teste de granularidade** — grátis, sem conta e sem dependências. Ver a secção
   seguinte.
2. **O schema, antes do fetcher.** Se o fetcher vier primeiro, o schema herda os acidentes
   dele. Tabela nova com `fetched_at`, `window_start`, `window_end`, `granularity`,
   `request_id`, `anchor_term`, `collection_status`.
3. **O fetcher**, com a fonte isolada como o brief propõe.
4. **Uma descarga completa, arquivada.**
5. **Só então tocar no dashboard.** Os problemas dele são todos a jusante.

### 4. `historical_snapshots` — arquivar e esvaziar?

**Arquivar: já está feito.** As 3462 linhas estão em
`docs/evidencia/2026-09-15-dashboard-inspeccao/historical-snapshots-2026-09-15.csv`.

**Escrever numa tabela NOVA, não reutilizar esta.** A tabela actual não tem `fetched_at`, nem
janela, nem granularidade, nem estado. Acrescentar-lhe colunas obriga **todas** as consultas
futuras a filtrar *"onde as colunas novas não são nulas"* — e a pergunta *"estes dados são de
confiança?"* passa a depender de quem escreve a consulta. **Com um nome novo, responde-se
pelo nome da tabela.**

**E não a esvaziar já.** Deixá-la intacta até a nova funcionar; só então uma migração que a
remove. Esvaziar uma tabela contra a qual ainda se pode querer comparar é irreversível de
graça.

---

## Uma discordância menor, que poupa trabalho

O brief repete **as duas** descargas todas as segundas. Para a **B** (diária, 8 meses) faz
sentido. Para a **A** (semanal, 5 anos) **não**: uma série semanal de 5 anos não muda de
forma relevante de segunda para segunda, e **cada descarga nova torna a anterior
incomparável**. Mensal chega, e reduz o ruído de escala.

---

## Correcções que este trabalho trouxe ao `CONTEXT.md`

Duas, ambas verificadas no terminal sobre as 3462 linhas arquivadas, e já aplicadas:

- **`3018` → `16`.** A linha de 07/09 dizia que 3018 valores estavam acima de 100 num índice
  0–100. **São 16.** O 3018 é o **total da janela** 09/03–12/04: um denominador lido como
  numerador, a inflacionar o defeito ~190×. O que se mantém: **1309 dessa janela (43,4%)
  presas no valor 1**, e 1317 no total. **O defeito é real e a conclusão não muda** — muda o
  número.
- **`7d` e `30d` não mostram dados errados: não mostram nada.** Os dois filtram por data e a
  série acaba a 10/08/2026 — **zero linhas**. São três botões de período em que dois não têm
  objecto.

---

## Como fazer o teste em sandbox — e a parte que não precisa de sandbox nenhuma

**As três perguntas do brief dividem-se em duas, e só uma precisa de conta.**

### Parte 1 — a granularidade. Grátis, cinco minutos, sem conta e sem código

*(a)* e *(b)* — se 8 meses dá diário e se 5 anos dá semanal — são factos **sobre o Google
Trends**, não sobre nenhum fornecedor. Qualquer intermediário devolve o que o Google
devolver. Logo respondem-se no próprio Google Trends:

1. Abrir **`trends.google.com/trends/explore`**
2. Região **Portugal**, período **intervalo personalizado**
3. Escrever até 5 termos — **pôr a âncora candidata em todos os grupos**:
   `menopausa sintomas` mais quatro das 82
4. No gráfico *"Interesse ao longo do tempo"*, carregar no botão de **descarregar CSV**
5. Repetir para as janelas a testar: **~8 meses** e **5 anos**

Depois, sobre os ficheiros descarregados:

```
python3 scripts/testes/teste_4_granularidade.py ficheiro-8m.csv ficheiro-5a.csv
```

O script responde às cinco perguntas — granularidade medida pelo intervalo real entre
pontos, número de pontos, janela coberta, percentagem de zeros por termo (o problema do
limiar), se há meses do mesmo mês em dois anos diferentes (o ano-a-ano), e como a âncora se
comporta entre ficheiros.

**Não precisa de rede, de conta, de chave nem do `pytrends`.** Lê ficheiros.

**As regras de decisão estão escritas dentro do ficheiro, antes de correr** — como nos testes
1 a 3. Uma regra escrita depois de ver o resultado não é uma regra.

### Parte 2 — o formato do fornecedor. Esta precisa de conta

O que a sandbox do DataForSEO responde, e **só ela**:

- o **formato da resposta** preserva a granularidade que o Google dá, ou re-agrega?
- a **âncora vem no mesmo objecto** que os outros termos do grupo, com valores comparáveis?
- o **custo real por pedido** para este tipo de consulta, que varia com o endpoint
- **o que devolve em falha** — e é isto que decide o `collection_status`: é preciso saber
  distinguir *"o Google não tem dados"* de *"o pedido falhou"* **na resposta**, senão o
  problema do `0` ambíguo volta pela terceira vez

**A sandbox é gratuita e não consome depósito.** A ordem é: criar conta, correr um pedido de
cada um dos dois tipos de janela, guardar as duas respostas em bruto em `docs/evidencia/`, e
só então decidir se se deposita.

**Não preciso das credenciais** — e é melhor que não passem por aqui. Quando tiveres as duas
respostas guardadas, leio-as e escrevo o adaptador.

### O que já existia e ficou por correr

`scripts/testes/teste_1_janela_24m.py`, escrito a **09/09/2026**, faz a mesma pergunta da
granularidade e continua **por correr** — porque depende do `pytrends`, que é a peça partida.
O teste 4 existe para não ficar refém disso.
