"""vocabulario.py — as duas formas de cada termo no MESMO pedido ao Google Trends (só leitura).
15/10/2026, sessão 31. Decisão da Marta (docs/sessoes/2026-10-15-cowork.md §4.5): as pessoas
pesquisam "burnout" mais do que "síndrome de burnout", e "pânico" mais do que "ataque de pânico"?
Na recolha semanal o 0 é relativo à régua do pedido (a ansiedade puxa-a para cima); aqui cada
par vai sozinho num pedido, sem a ansiedade.

O pedido é o da recolha de domingo: a função pedir() do scripts/5_fetch_google_trends.py, com o
mesmo TrendReq (hl pt-PT, tz 0, sem retries), categoria 45 (Saúde), geo PT, 'today 5-y'
(semanal), interest_over_time. Um 429 espera CFG["espera_apos_429"] e repete UMA vez (é o que a
pedir() faz); se voltar, o par fica "falhou" e não se insiste. Nada escrito na base.

    .venv-trends/bin/python docs/evidencia/2026-10-15-vocabulario/vocabulario.py <saida.json>
"""
import importlib.util, json, os, sys, time
from datetime import datetime, timezone
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
sys.path.insert(0, os.path.join(RAIZ, "scripts"))
spec = importlib.util.spec_from_file_location("s5", os.path.join(RAIZ, "scripts", "5_fetch_google_trends.py"))
S5 = importlib.util.module_from_spec(spec); spec.loader.exec_module(S5)
from pytrends.request import TrendReq

PARES = [["burnout", "síndrome de burnout"], ["pânico", "ataque de pânico"]]
TIMEFRAME = "today 5-y"
pt = TrendReq(hl="pt-PT", tz=0, timeout=(10, 30), retries=0)     # como o script 5, l.217
saida = dict(pedido=dict(categoria=S5.CFG["categoria"], geo=S5.CFG["geo"], timeframe=TIMEFRAME,
                         funcao="scripts/5_fetch_google_trends.py pedir()", hl="pt-PT", tz=0),
             inicio=datetime.now(timezone.utc).isoformat(), pares=[])
for i, termos in enumerate(PARES):
    if i: time.sleep(15)                                           # o intervalo entre pedidos da recolha
    status, series, erro = S5.pedir(pt, termos, TIMEFRAME)
    par = dict(termos=termos, status=status, erro=erro, hora=datetime.now(timezone.utc).isoformat(), formas={})
    for t, s in series.items():
        completas = [(d, v) for d, v, p in s if not p]
        ult = completas[-52:]
        vals = [v for _, v in ult]
        par["formas"][t] = dict(
            semanas_na_serie=len(s), parciais=sum(1 for _, _, p in s if p),
            ultimas_52=dict(de=ult[0][0].date().isoformat(), a=ult[-1][0].date().isoformat(),
                            media=round(sum(vals) / len(vals), 2), semanas_acima_de_0=sum(1 for v in vals if v > 0),
                            maximo=max(vals)),
            cinco_anos=dict(media=round(sum(v for _, v in completas) / len(completas), 2),
                            semanas_acima_de_0=sum(1 for _, v in completas if v > 0), semanas=len(completas),
                            maximo=max(v for _, v in completas)),
            serie=[(d.date().isoformat(), v, p) for d, v, p in s])
    saida["pares"].append(par)
    print(json.dumps({k: v for k, v in par.items() if k != "formas"} |
                     {"formas": {t: {k: v for k, v in f.items() if k != "serie"} for t, f in par["formas"].items()}},
                     ensure_ascii=False, indent=1), flush=True)
json.dump(saida, open(sys.argv[1], "w"), ensure_ascii=False, indent=1)
