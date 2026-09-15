#!/usr/bin/env python3
"""
Reproduz o grafico "vs ano anterior" do dashboard — 15/09/2026.

Reimplementa em Python o que o frontend desenha:

  src/hooks/useHistoricalData.ts:20-33  select('*') SEM limite e SEM filtro de data
                                        para o periodo "12m"; order=snapshot_date.asc
  src/lib/buildTrend.ts:57-86           build12m: current = ano civil corrente,
                                        previous = ano anterior; previous ?? 0
  src/components/TrendChart.tsx:21      rotulos "2026" / "2025" / "vs ano anterior"

Le o instantaneo versionado das 3462 linhas. O corte das 1000 e SIMULADO aqui pela
mesma regra que o PostgREST aplica por omissao, para o resultado ser reproduzivel sem
rede. O cabecalho real observado a 15/09/2026 esta no README:
  content-range: 0-999/3462
"""
import csv, io, os, hashlib, collections, datetime

AQUI  = os.path.dirname(os.path.abspath(__file__))
SNAP  = os.path.join(AQUI, 'historical-snapshots-2026-09-15.csv')
HOJE  = datetime.date(2026, 9, 15)     # fixo, para o resultado nao mudar com o relogio
LIMITE_POSTGREST = 1000
MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]

def sha256(p):
    h = hashlib.sha256()
    with open(p,'rb') as f:
        for b in iter(lambda: f.read(65536), b''): h.update(b)
    return h.hexdigest()

def build12m(snaps, hoje):
    """Traducao fiel de buildTrend.ts:57-86, incluindo o `previous ?? 0`."""
    cur = collections.defaultdict(list); pre = collections.defaultdict(list)
    for s in snaps:
        d = datetime.date.fromisoformat(s['snapshot_date'])
        if   d.year == hoje.year:     cur[d.month-1].append(int(s['search_index']))
        elif d.year == hoje.year - 1: pre[d.month-1].append(int(s['search_index']))
    saida = []
    for i, lab in enumerate(MESES):
        c = round(sum(cur[i])/len(cur[i])) if (i <= hoje.month-1 and cur[i]) else None
        p = round(sum(pre[i])/len(pre[i])) if pre[i] else None
        saida.append({'mes': lab, 'current': c, 'previous': 0 if p is None else p,
                      'previous_real': p})
    return saida

def main():
    todas = list(csv.DictReader(io.open(SNAP, encoding='utf-8', newline='')))
    print('='*74); print('GRAFICO "VS ANO ANTERIOR" — reproducao'); print('='*74)
    print(f'historical-snapshots-2026-09-15.csv  sha256 {sha256(SNAP)}')
    print(f'data de referencia fixa: {HOJE}')

    print(f'\n[1] O QUE EXISTE vs O QUE CHEGA AO BROWSER')
    print(f'    linhas na tabela ................. {len(todas)}')
    chegam = sorted(todas, key=lambda r: r['snapshot_date'])[:LIMITE_POSTGREST]
    print(f'    limite por omissao do PostgREST .. {LIMITE_POSTGREST}')
    print(f'    linhas que chegam ................ {len(chegam)}  ({len(chegam)/len(todas)*100:.0f}%)')
    print(f'    nunca chegam ..................... {len(todas)-len(chegam)}')
    dc = [r['snapshot_date'] for r in chegam]
    print(f'    janela que chega ................. {min(dc)} a {max(dc)}')
    dt = [r['snapshot_date'] for r in todas]
    print(f'    janela que existe ................ {min(dt)} a {max(dt)}')
    print('    O hook ordena por snapshot_date ASCENDENTE, logo o corte guarda as MAIS')
    print('    ANTIGAS e deita fora as mais recentes.')

    print(f'\n[2] POR MES, o que chega (todos os eixos)')
    c = collections.Counter(r['snapshot_date'][:7] for r in chegam)
    for k in sorted(c): print(f'    {k}  {c[k]:4}')

    for eixo in ['saude-mental','menopausa','alimentacao','emergentes']:
        s = [r for r in chegam if r['axis'] == eixo]
        pontos = build12m(s, HOJE)
        print(f'\n[3] O QUE O GRAFICO DESENHA — {eixo}  ({len(s)} linhas)')
        print('    mes    current(2026)  previous(2025)')
        for p in pontos:
            cs = str(p['current']) if p['current'] is not None else (
                 'undefined' if MESES.index(p['mes']) <= HOJE.month-1 else '— futuro')
            ps = str(p['previous']) + ('' if p['previous_real'] is not None else '   <- ?? 0, nao e lacuna')
            print(f'    {p["mes"]:5}  {cs:13}  {ps}')
        ambos = [p['mes'] for p in pontos if p['current'] is not None and p['previous_real'] is not None]
        print(f'    MESES COM AS DUAS LINHAS: {ambos if ambos else "NENHUM"}')

    print(f'\n[4] A CONCLUSAO, para qualquer eixo')
    s = [r for r in chegam]
    pontos = build12m(s, HOJE)
    com_cur = [p['mes'] for p in pontos if p['current'] is not None]
    com_pre = [p['mes'] for p in pontos if p['previous_real'] is not None]
    print(f'    meses com dados de 2026 (current) .. {com_cur}')
    print(f'    meses com dados de 2025 (previous) . {com_pre}')
    print(f'    interseccao ........................ {sorted(set(com_cur) & set(com_pre)) or "VAZIA"}')
    print('    Uma comparacao ano-a-ano precisa de sobreposicao. Nao ha nenhuma.')

if __name__ == '__main__':
    main()
