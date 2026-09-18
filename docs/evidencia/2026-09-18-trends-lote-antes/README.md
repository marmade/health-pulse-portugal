# O primeiro lote do Google Trends — retrato "antes" da lista de 100 (18/09/2026)

Corridas do `scripts/5_fetch_google_trends.py` novo, a partir do Mac da Marta, com a lista
**actual** de 82 keywords — a lista de 100 só se aplica na terça 22/09, depois de a corrida
de segunda testar o `archive-weekly` v2 sozinho (decisão da sessão 15, mantida).

| ficheiro | janela | pedidos | pontos | lote na base |
|---|---|---|---|---|
| `dump-12m.json` | 12 meses, semanal | 33 (23 no passo 1, 9 no passo 2, 1 entre eixos), 0 falhas | 8109 | `4dad25b9-c816-4563-ab2d-fe3d77b3b3aa`, completo, 4452 calibrados |
| `dump-5a.json` | 5 anos, semanal | (ver o lote) | | |

Os dumps são a saída do `--dry-run --dump`; os lotes foram gravados com `--gravar --carregar
<dump>`, sem repetir pedidos ao Google. A primeira gravação do lote de 12 meses rebentou em
`trends_calibrados` (409: um termo esmagado era calibrado no passo 1 e no passo 2, mesma
data); o lote meio escrito (`77402f89…`) foi apagado, o script passou a ficar com a versão do
passo 2 e a marcar o lote como `falhou` se rebentar a meio, e gravou-se de novo.

## O que o lote de 12 meses mostra

Top 5 de cada eixo, por mediana calibrada na régua da âncora (âncora ≈ 100; acima de 100 é
"mais pesquisado que a âncora"):

- **Saúde mental** (âncora psiquiatra): ansiedade 191 · stress 107 · depressão 84 · alzheimer 61 · enxaqueca 51
- **Alimentação** (colesterol alto): anemia 251 · colesterol alto 54 · diabetes tipo 2 40 · açúcar e saúde 14
- **Menopausa** (menopausa): endometriose 35 · cancro da mama 20 · candidíase 16 · osteoporose 14 · menopausa sintomas 2
- **Emergentes** (avc): avc 31 · sepsis 8 · **tudo o resto a 0**
- **Entre eixos** (passo 3): psiquiatra 39 · colesterol alto 17 · menopausa 73 · avc 100

Âncoras secundárias escolhidas pelos dados: burnout (saúde mental), diabetes tipo 2
(alimentação), endometriose (menopausa). **Nos Emergentes não havia nenhuma** — nenhum termo
com mediana entre 20 e 40, porque emergente é pico e não mediana. O ranking por mediana
está certo para três eixos e errado para este; fica para a fase dos alertas.

`açúcar e saúde`, que sai na lista de 100 por "sem procura", tem 14 ao lado de `anemia` a 100.
A reconsiderar.

## A chave

O script grava com a `service_role`, lida de `~/.config/health-pulse/env` (fora do
repositório, `chmod 600`, uma linha). Não está no git nem passou pela conversa: foi da área
de transferência da Marta para o ficheiro.
