# Arquivo da instância antiga `cyjwhmuakmiytypewwfw` — 09/09/2026

Exportado a 09/09/2026 (sessão 12), **antes** de a instância ser apagada. Leitura feita com
a chave `anon` dessa instância, recuperada do histórico do git.

São dados **não pessoais**. As tabelas com dados pessoais — `contactos_projecto` e
`revisao_pares` — **não foram exportadas, por decisão de 09/09/2026**: as mesmas pessoas
estão na instância nova, já protegidas, e um ficheiro exportado seria só mais uma cópia de
dados pessoais em texto simples.

| Ficheiro | Linhas | Colunas |
|---|---|---|
| `historical_snapshots.csv` | 12072 | 8 |
| `news_items.csv` | 1994 | 9 |

## O que o `historical_snapshots.csv` contém, com números

Isto é um seguro contra o passo irreversível, não uma série aproveitável. Os números,
apurados a 09/09/2026 sobre estas mesmas 12072 linhas:

**Por mês** (`chão` = valores a 0 ou 1):

| mês | linhas | >100 | =1 | =0 | % chão | kws | dias |
|---|---|---|---|---|---|---|---|
| 2025-10 a 2026-02 | 40/mês | 0 | 0 | 0 | 0% | 40 | 1/mês |
| 2026-03 | 2032 | 16 | 781 | 0 | 38,4% | 83 | 22 |
| 2026-04 | 2624 | 0 | 1092 | 288 | 52,6% | 82 | 30 |
| 2026-05 | 2542 | 0 | 899 | 496 | 54,9% | 82 | 31 |
| 2026-06 | 2460 | 0 | 870 | 480 | 54,9% | 82 | 30 |
| 2026-07 | 2214 | 0 | 783 | 432 | 54,9% | 82 | 27 |

**Os meses a 0% não são recolha.** As 200 linhas de Out/2025 a Fev/2026 foram todas escritas
no mesmo minuto, `2026-03-08T11:44`. É *seed* retrodatado: parecem limpas por serem
fabricadas.

**A série congelou a 14/04/2026.** De 14/04 até 27/07 — **105 dias** — cada dia é idêntico ao
anterior, para as 82 keywords. Verificado por comparação do conjunto `(keyword, search_index)`
dia a dia. Exemplos na janela 05–07/2026: `menopausa sintomas` = 44 nos 88 pontos, desvio
0,0; `depressão` = 4; `burnout` = 26. **As 82 keywords têm valor constante nessa janela.**

Na janela que a instância nova **não** cobre (13 a 30 de Abril, 1558 linhas), 42 keywords
têm exactamente **dois** valores distintos: o de antes do congelamento e o congelado. Não é
variação, é a transição.

O congelamento começa **dois dias depois da migração de 12/04/2026**.

## Conclusão registada

A instância nova cobre 03/2026 (2032 linhas, 22 dias — iguais) e 04/2026 até ao dia 12
(1066 linhas), mais 2 dias de 08/2026. O que só existe aqui é 13/04 em diante, que é o
período congelado.

**Apagar a instância antiga não perde nenhuma série que varie.** Este arquivo fica na mesma,
porque apagar não tem volta atrás e o custo de guardar 2 MB de CSV é nenhum.
