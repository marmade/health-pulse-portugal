"""Só leitura (chave pública): por lote, os alertas gravados contra os do código corrigido."""
import collections, importlib.util, json, sys
spec = importlib.util.spec_from_file_location('TA', sys.argv[1] + '/scripts/trends_alertas.py')
TA = importlib.util.module_from_spec(spec); spec.loader.exec_module(TA)
url, key = TA.env_publico()
lotes = TA.rest(url, key, 'trends_lotes?select=id,estado,iniciado_em,notas&order=iniciado_em')
res = {}
for l in lotes:
    grav = TA.rest(url, key, f"trends_alertas?select=eixo,termo,semana,tipo,semana_n&lote_id=eq.{l['id']}&order=eixo,termo,semana")
    try:
        novo = TA.calcula(*TA.series_do_lote(url, key, l['id']))
        erro = None
    except TA.SerieAmbigua as e:
        novo, erro = [], str(e)
    chave = lambda r: (r['eixo'], r['termo'], r['semana'][:10], r['tipo'], r['semana_n'])
    G = collections.Counter(chave(r) for r in grav); N = collections.Counter(chave(r) for r in novo)
    tg = collections.Counter(r['tipo'] for r in grav); tn = collections.Counter(r['tipo'] for r in novo)
    res[l['id']] = dict(iniciado=l['iniciado_em'][:16], estado=l['estado'], erro=erro,
                        gravadas=len(grav), novas=len(novo), so_gravadas=sum((G - N).values()),
                        so_novas=sum((N - G).values()), tipos_gravadas=dict(tg), tipos_novas=dict(tn))
    r = res[l['id']]
    print(f"{l['id'][:8]} {r['iniciado']} {r['estado']:10s} grav {r['gravadas']:5d} novo {r['novas']:5d} "
          f"(só grav {r['so_gravadas']}, só novo {r['so_novas']}) {'ERRO ' + erro if erro else ''}")
    print(f"           por tipo: grav {dict(sorted(tg.items()))}\n                     novo {dict(sorted(tn.items()))}")
json.dump(res, open(sys.argv[2], 'w'), indent=1, ensure_ascii=False)
