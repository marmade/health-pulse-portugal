#!/usr/bin/env python3
"""
TESTE 5 — A REGRA DOS ALERTAS, CORRIDA SOBRE OS LOTES QUE EXISTEM
=================================================================
Escrito a 18/09/2026 (sessão 16). Lê `trends_calibrados` com a chave pública do `.env`
(a mesma do site), NÃO escreve nada, NÃO pede nada ao Google.

A regra está em `docs/metodo/2026-09-18-alertas-regra.md`. Os parâmetros abaixo foram
FIXADOS nesse dia, depois de dois ensaios sobre o lote de 5 anos (a primeira versão, sem
elegibilidade, disparava 538 vezes em 253 semanas — o registo está no documento). Logo isto
NÃO é um teste cego da regra: é a regra calibrada nestes dados. O teste cego é o que as
semanas seguintes fizerem, e é para isso que o script fica: correr de novo em cada lote.

COMO CORRER
  python3 scripts/testes/teste_5_alertas.py            # resumo + lista de disparos (lote de 5 anos)
  python3 scripts/testes/teste_5_alertas.py ultima     # a última semana completa, nos dois lotes
  python3 scripts/testes/teste_5_alertas.py varre      # a sensibilidade aos parâmetros
"""
import collections, os, statistics as st, sys

# A regra vive em scripts/trends_alertas.py (a versão que o script 5 corre em cada lote);
# este teste importa-a, para não haver duas regras. Os parâmetros estão lá.
import importlib.util as _iu
_spec = _iu.spec_from_file_location('trends_alertas', os.path.join(os.path.dirname(__file__), '..', 'trends_alertas.py'))
TA = _iu.module_from_spec(_spec); _spec.loader.exec_module(TA)
N_REF, MIN_COM_DADOS, Z_MIN, RAZAO_MIN = TA.N_REF, TA.MIN_COM_DADOS, TA.Z_MIN, TA.RAZAO_MIN
avalia = TA.avalia

def carrega():
    url, key = TA.env_publico()
    lotes = {l['id']: l for l in TA.rest(url, key, "trends_lotes?select=*")}
    series, factor, n_parc = collections.defaultdict(dict), {}, 0
    for lid in lotes:
        s, f = TA.series_do_lote(url, key, lid)
        for (eixo, termo), v in s.items():
            series[(lid, eixo, termo)] = v; factor[(lid, eixo, termo)] = f[(eixo, termo)]
    n_parc = sum(1 for _ in [0])  # a semana parcial já fica de fora em series_do_lote
    return lotes, series, factor, n_parc

def fmt(d, eixo, termo, r):
    tipo = ('APARECIMENTO' if r['aparecimento'] else 'sazonal     ' if r['sazonal']
            else 'SUBIDA      ' if r['subida'] else 'a observar  ')
    f = f"{r['fator']:.1f}" if r['fator'] else ' — '
    return (f"{d} {tipo} {eixo:13s} {termo:34s} x={r['x']:6.1f} ref={r['ref']:6.1f} "
            f"ruído={r['ruido']:5.1f} z={r['z']:5.1f} ×{r['razao']:4.1f} saz×{f}")

def main():
    modo = sys.argv[1] if len(sys.argv) > 1 else 'resumo'
    lotes, series, factor, n_parc = carrega()
    # o lote de 5 anos: o que tem mais semanas
    por_lote = collections.Counter(k[0] for k in series)
    lote5 = max(series, key=lambda k: len(series[k]))[0]
    print(f"lotes: {len(lotes)} · semana parcial excluída · lote de 5 anos: {lote5[:8]} "
          f"({len(next(s for k, s in series.items() if k[0] == lote5))} semanas completas)")
    def hist(eixo, termo): return sorted(series.get((lote5, eixo, termo), {}).items())

    if modo == 'varre':
        global N_REF
        for nref in (8, 12):
            for z in (3.0, 4.0):
                for rz in (1.5, 2.0):
                    TA.N_REF, TA.Z_MIN, TA.RAZAO_MIN = nref, z, rz; N_REF = nref
                    a = []; n = e = 0
                    for (l, eixo, termo), s in series.items():
                        if l != lote5: continue
                        vals = sorted(s.items())
                        for i in range(N_REF, len(vals)):
                            r = avalia(vals, i, factor[(l, eixo, termo)], hist(eixo, termo)); n += 1; e += r['elegivel']
                            if r['subida']: a.append((vals[i][0], r))
                    ns = [x for x in a if not x[1]['sazonal']]; sem = collections.Counter(x[0] for x in ns)
                    print(f"N_REF={nref} z≥{z} ×{rz}: elegíveis {e}/{n} · subidas {len(a)} · sazonais {len(a)-len(ns)} "
                          f"· alertas {len(ns)} · semanas com alerta {len(sem)} · máx numa semana {max(sem.values()) if sem else 0}")
        return

    if modo == 'ultima':
        for lote in sorted(por_lote, key=lambda l: lotes[l]['iniciado_em']):
            print(f"\n== lote {lote[:8]} ({lotes[lote]['notas'] or ''}) — última semana completa")
            for (l, eixo, termo), s in sorted(series.items()):
                if l != lote: continue
                vals = sorted(s.items()); r = avalia(vals, len(vals)-1, factor[(l, eixo, termo)], hist(eixo, termo))
                if r and (r['subida'] or r['aparecimento'] or (r['elegivel'] and r['z'] >= 2)):
                    print('  ' + fmt(vals[-1][0], eixo, termo, r))
            eleg = collections.Counter((k[1], avalia(sorted(s.items()), len(s)-1, factor[k])['elegivel'])
                                       for k, s in series.items() if k[0] == lote)
            print('  elegíveis para subida, por eixo:', {e: f"{eleg[(e, True)]}/{eleg[(e, True)]+eleg[(e, False)]}" for e in sorted({k[0] for k in eleg})})
        return

    # resumo: a regra corrida em todas as semanas do lote de 5 anos
    disparos = []; n = e = 0
    for (l, eixo, termo), s in series.items():
        if l != lote5: continue
        vals = sorted(s.items())
        for i in range(N_REF, len(vals)):
            r = avalia(vals, i, factor[(l, eixo, termo)], vals); n += 1; e += r['elegivel']
            if r['subida'] or r['aparecimento']: disparos.append((vals[i][0], eixo, termo, r))
    sub = [d for d in disparos if d[3]['subida'] and not d[3]['sazonal']]
    saz = [d for d in disparos if d[3]['subida'] and d[3]['sazonal']]
    apa = [d for d in disparos if d[3]['aparecimento']]
    sem = collections.Counter(d[0] for d in sub + apa)
    print(f"avaliações {n} · elegíveis {e} ({e/n:.0%}) · subidas {len(sub)} · sazonais descontadas {len(saz)} · aparecimentos {len(apa)}")
    print(f"semanas com alerta {len(sem)} de {n//len({k for k in series if k[0]==lote5})} · máx numa semana {max(sem.values())} · por ano {sorted(collections.Counter(d[0][:4] for d in sub+apa).items())}")
    print("\npor termo (subidas não sazonais):")
    for (ex, t), c in sorted(collections.Counter((d[1], d[2]) for d in sub).items(), key=lambda x: (-x[1], x[0])): print(f"  {c:3d}  {ex:13s} {t}")
    print("\ntodos os disparos, por data:")
    for d, ex, t, r in sorted(disparos, key=lambda x: x[0]): print('  ' + fmt(d, ex, t, r))

if __name__ == '__main__':
    main()
