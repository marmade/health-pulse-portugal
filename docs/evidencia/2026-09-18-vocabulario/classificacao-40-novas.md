# Classificação das 40 keywords novas (`keywords.category`)

**Data:** 18/09/2026, sessão 16 · **Estado:** feita pelo Claude Code por julgamento, a pedido da
Marta; escrita na migração `20260918180000` (não aplicada — terça). Reversível linha a linha.

## O que a coluna é, medido antes de classificar `[ficheiro]`

Lido no arquivo `docs/arquivo/2026-09-18-keywords-antes-da-lista-100/` (83 linhas) e no `src/`:

- **41 rótulos distintos para 83 linhas.** Mistura quatro critérios: especialidade (Neurologia,
  Cardiologia, Oncologia, Endocrinologia), grupo clínico (Perturbações, Demência, Adições), tema
  (Trabalho, Social, Sono, Dor) e tipo de conteúdo (Sintomas, Diagnóstico, Tratamento,
  Complicações, Alternativas). Há pares que são o mesmo com nome diferente: `Perturbações` /
  `Perturbação Mental`, `Ambiente` / `Saúde Ambiental`, `Infeção` / `Infeção Emergente` /
  `Doenças infecciosas`. E `ansiedade` está em `Perturbações` enquanto `Ansiedade` só tem
  `fobia social`. Os 10 termos de programa tinham `category = 'saude-mental'`, igual ao eixo.
- **Não aparece em ecrã nenhum.** Só em `src/lib/csvExport.ts:31` (uma coluna do CSV) e em
  `src/pages/Admin.tsx:544`, onde uma keyword criada à mão recebe `category = axis`.
- É `NOT NULL` — por isso os 40 entraram com `'por classificar'`.

**Consequência para a regra:** não vale a pena inventar uma taxonomia nova para uma coluna que
ninguém lê — e reorganizar os 61 que ficam é outra decisão, da Marta. Os 40 entram nos rótulos
**que a tabela já usa**, escolhendo em cada eixo o que já lá está; só há rótulo novo onde nenhum
dos existentes serve. O `tipo` (V/C/S/T), esse sim novo, é o que carrega a classificação que
interessa à tese.

## A classificação

| eixo | termo | tipo | category | porquê |
|---|---|---|---|---|
| saúde mental | crise de ansiedade | V | Ansiedade | rótulo existente (com `fobia social`) |
| | ansiedade social | V | Ansiedade | é o nome corrente da fobia social |
| | depressão pós-parto | V | Perturbações | com `depressão sintomas` |
| | psiquiatra | S | **Serviços** (novo) | acesso a serviços; `Tratamento` seria uma pessoa, não um tratamento |
| | psicologa | S | **Serviços** (novo) | idem |
| | antidepressivos | C | Tratamento | rótulo existente no eixo (`terapia online`, que sai) |
| | calmantes naturais | C | Alternativas | rótulo existente (na menopausa: `fitoterapia` → `suplemento menopausa`) |
| alimentação | alimentos ricos em ferro | V | Nutrição | com `anemia` |
| | creatina | C | Suplementos | com `suplementos` |
| | dieta | V | Dietas | com `dieta mediterrânica`, `jejum intermitente` |
| | alimentação saudável | V | Nutrição | |
| | emagrecer | V/T | **Peso** (novo) | não havia rótulo para o peso — só `Pediatria`, pela `obesidade infantil` |
| | ozempic | C/T | **Peso** (novo) | é para isso que se pesquisa |
| | canetas para emagrecer | C/T | **Peso** (novo) | |
| | alimentação anti-inflamatória | T | Dietas | |
| | fígado gorduroso | V/T | Metabolismo | a doença hepática esteatótica é metabólica (com `colesterol alto`, `diabetes tipo 2`) |
| | hipertensão | V | Cardiologia | rótulo existente (nos emergentes, `doenças cardiovasculares`); eixo é decisão da Marta |
| menopausa | menopausa | V | Diagnóstico | com `menopausa precoce` e `andropausa`: a fase, não o sintoma |
| | perimenopausa | V/T | Diagnóstico | idem |
| | pré-menopausa | V | Diagnóstico | idem |
| | idade menopausa | V | Diagnóstico | é literalmente a pergunta de diagnóstico |
| | adenomiose | V | Saúde da Mulher | com `endometriose` |
| | mioma | V | Saúde da Mulher | |
| | osteopenia | V | Complicações | com `osteoporose` |
| | afrontamentos | V | Sintomas | com `suores noturnos`, `sintomas menopausa` |
| | menstruação | V | Saúde da Mulher | |
| | ginecologista | S | **Serviços** (novo) | |
| | climacare | C | Alternativas | é um suplemento de fitoterapia — com `suplemento menopausa` |
| | estradiol | C | Tratamento | com `reposição hormonal` |
| emergentes | covid sintomas | V | Doenças infecciosas | |
| | gripe A | V | Doenças infecciosas | |
| | hantavírus | T | Doenças infecciosas | `Infeção Emergente` só tem `candida auris`; não vale a pena alimentar o par duplicado |
| | vírus do nilo ocidental | T | Doenças infecciosas | idem |
| | mosquito tigre | T | Saúde pública | é o vector, não a doença — vigilância |
| | norovírus | T | Doenças infecciosas | |
| | difteria | T | Doenças infecciosas | |
| | creutzfeldt-jakob | T | Neurologia | doença priónica, neurodegenerativa; com `avc` |
| | lipedema | V/T | Saúde da Mulher | afecta quase só mulheres; nenhum rótulo dos emergentes serve. **Dúvida** |
| | infeção sexualmente transmissível | V | Doenças infecciosas | |
| | vacinas | S | **Serviços** (novo) | a evidência era `boletim de vacinas`, `sns24` — acesso |

**Uma correcção fora dos 40:** `obesidade infantil` → `obesidade` ficava em `Pediatria`. Passa
a `Peso`, na mesma migração. As outras reformulações não mudam de assunto e ficam com o rótulo
que tinham (`tdah` em Perturbações, `andropausa` em Diagnóstico, `enxaqueca` leva `Dor` para os
Emergentes).

## O que fica para a Marta

1. **`lipedema` em Saúde da Mulher** e **`mosquito tigre` em Saúde pública** são as duas escolhas
   com menos apoio nos rótulos existentes.
2. Os pares duplicados (`Ambiente`/`Saúde Ambiental`, `Perturbações`/`Perturbação Mental`,
   `Infeção`/`Infeção Emergente`/`Doenças infecciosas`) e `ansiedade` fora de `Ansiedade`
   são da lista de 82 e ficaram como estavam. Arrumar a coluna é uma decisão à parte — e só
   vale a pena se a coluna vier a ser lida por alguma coisa.
