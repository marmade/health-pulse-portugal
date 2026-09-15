#!/usr/bin/env python3
"""
TESTE 4 — GRANULARIDADE E ÂNCORA, SEM DEPENDER DE NADA
======================================================
Pergunta: uma janela de 8 meses devolve DIARIO? Uma de 5 anos devolve SEMANAL?
E a ancora vem coerente entre grupos?

Estas tres perguntas sao sobre o GOOGLE TRENDS, nao sobre nenhum fornecedor de
API. Qualquer fornecedor que faca de intermediario devolve o que o Google
devolver. Logo respondem-se de graca, sem conta, sem chave e sem pytrends:

  1. Abrir  https://trends.google.com/trends/explore
  2. Regiao: Portugal.  Periodo: intervalo personalizado.
  3. Escrever os termos (ate 5 por consulta).
  4. Carregar no botao de DESCARREGAR CSV do grafico "Interesse ao longo do tempo".
  5. Guardar os ficheiros e correr este script sobre eles.

COMO CORRER
  python3 scripts/testes/teste_4_granularidade.py ficheiro1.csv [ficheiro2.csv ...]

O QUE RESPONDE, por ficheiro
  a) granularidade real (diaria / semanal / mensal), medida pelo intervalo entre pontos
  b) numero de pontos e janela coberta
  c) se ha valores a 0 e quantos — o problema do limiar de medicao
  d) se ha meses do ano corrente E do anterior na mesma serie (o ano-a-ano)

E entre ficheiros
  e) se a ancora aparece em todos e com que valores — a base da calibracao

NAO escreve na base de dados. NAO precisa de rede. E uma leitura de ficheiros.

REGRA DE DECISAO, escrita antes de correr
  - Se 8 meses devolver DIARIO  -> a descarga B do desenho e viavel.
  - Se 5 anos devolver SEMANAL  -> a descarga A e viavel, e com ela o ano-a-ano
                                   e a sazonalidade.
  - Se a ancora vier a 0 nalgum grupo -> essa ancora nao serve para esse grupo,
                                         e e preciso encadear duas.
"""
import sys, csv, io, os, collections, datetime, statistics

def ler_csv_trends(p):
    """O CSV do Google Trends tem 2-3 linhas de cabecalho antes da tabela."""
    linhas = io.open(p, encoding='utf-8-sig').read().splitlines()
    inicio = next((i for i, l in enumerate(linhas)
                   if l.lower().startswith(('semana', 'week', 'dia', 'day', 'mes', 'month', 'data', 'date'))), None)
    if inicio is None:
        sys.exit(f"ERRO: nao encontrei o cabecalho da tabela em {p}")
    r = list(csv.reader(linhas[inicio:]))
    cab, dados = r[0], [x for x in r[1:] if x and x[0].strip()]
    return cab, dados

def data_de(s):
    s = s.strip().split(' - ')[0].strip()        # intervalos "2026-01-01 - 2026-01-07"
    for f in ('%Y-%m-%d', '%d/%m/%Y', '%Y-%m', '%b %Y'):
        try: return datetime.datetime.strptime(s, f).date()
        except ValueError: pass
    return None

def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    ancoras = collections.defaultdict(dict)

    for p in sys.argv[1:]:
        cab, dados = ler_csv_trends(p)
        datas = [d for d in (data_de(x[0]) for x in dados) if d]
        print('=' * 72)
        print(os.path.basename(p))
        print('=' * 72)
        if len(datas) < 2:
            print('  pontos a menos para medir granularidade'); continue

        deltas = [(datas[i+1] - datas[i]).days for i in range(len(datas)-1)]
        passo = statistics.mode(deltas)
        gran = {1: 'DIARIA', 7: 'SEMANAL'}.get(passo, 'MENSAL' if passo >= 28 else f'{passo} dias')
        span = (datas[-1] - datas[0]).days

        print(f'  a) granularidade ....... {gran}   (passo modal: {passo} dia(s))')
        print(f'  b) pontos .............. {len(datas)}')
        print(f'     janela .............. {datas[0]} a {datas[-1]}  ({span} dias, ~{span/30.4:.1f} meses)')

        termos = cab[1:]
        for j, termo in enumerate(termos, start=1):
            vals = []
            for x in dados:
                try: vals.append(int(str(x[j]).replace('<', '').strip() or 0))
                except (ValueError, IndexError): vals.append(0)
            zeros = sum(1 for v in vals if v == 0)
            print(f'  c) {termo[:40]:42} max={max(vals):3} zeros={zeros:4}/{len(vals)} ({zeros/len(vals)*100:4.1f}%)'
                  + ('   <- ABAIXO DO LIMIAR em boa parte da janela' if zeros/len(vals) > .5 else ''))
            ancoras[termo][os.path.basename(p)] = (max(vals), round(sum(vals)/len(vals), 1))

        anos = {d.year for d in datas}
        meses_por_ano = {a: {d.month for d in datas if d.year == a} for a in sorted(anos)}
        sobrep = set.intersection(*meses_por_ano.values()) if len(anos) > 1 else set()
        print(f'  d) anos na serie ....... {sorted(anos)}')
        print(f'     meses em comum ...... {sorted(sobrep) if sobrep else "NENHUM — nao da ano-a-ano"}')
        print()

    if len(sys.argv) > 2:
        print('=' * 72); print('e) A ANCORA ENTRE FICHEIROS'); print('=' * 72)
        for termo, porfich in ancoras.items():
            if len(porfich) > 1:
                print(f'  {termo}')
                for f, (mx, md) in porfich.items():
                    print(f'      {f:34} max={mx:3} media={md}')
                print('      -> serve de ancora se aparecer em todos e nao vier a 0')

if __name__ == '__main__':
    main()
