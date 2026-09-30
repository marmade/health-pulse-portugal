#!/usr/bin/env python3
"""testar_comparar_vias.py — o comparar_vias.py dá os veredictos certos? (sem rede)
===================================================================================
30/09/2026, sessão 22. Dumps falsos, no formato do --dump do script 5: 33 pedidos (32 grupos
de 5 termos e as quatro âncoras juntas), 262 semanas, a última marcada incompleta. Corre o
comparar_vias.py como se corre à mão.

    python3 scripts/testar_comparar_vias.py

CASOS                                                                          ESPERADO
  igual — a via pytrends com ruído de ±1 em 30% das semanas                  PASSOU
  diferente — a via pytrends com números sem relação                         NÃO PASSOU, termos listados
  um pedido inteiro desviado, o resto igual                                  NÃO PASSOU, a dizer qual
  34 pedidos nas duas vias, com ruído                                        PASSOU
  mesmo número, mas um pedido do passo 2 diferente em cada via               PASSOU, os dois listados
  número de pedidos diferente nas duas vias                                  NÃO PASSOU
  um pedido falhado na via funcao                                            NÃO PASSOU
  um pedido falhado na via pytrends                                          SEM VEREDICTO
  uma marcação de semana incompleta diferente                                NÃO PASSOU
"""
import copy, json, math, os, random, subprocess, sys, tempfile
from datetime import datetime, timedelta, timezone

AQUI = os.path.dirname(os.path.abspath(__file__))
PASTA = tempfile.mkdtemp()
SEMANAS = [(datetime(2021, 10, 3, tzinfo=timezone.utc) + timedelta(weeks=i)).isoformat() for i in range(262)]
EIXOS = ["saude-mental", "alimentacao", "menopausa", "emergentes"]

def dump(via, pedidos):
    return dict(timeframe="today 5-y", eixo=None, top5={}, calibrados=[],
                resumo=dict(via=via, pedidos=len(pedidos),
                            recolhidos=sum(p["status"] == "recolhido" for p in pedidos)),
                pedidos=pedidos)

def pedido(rnd, eixo, passo, termos):
    series = {}
    for t in termos:
        nivel = rnd.randint(8, 70)
        series[t] = [[d, max(0, min(100, nivel + round(15 * math.sin(k / 8)) + rnd.randint(-4, 4))),
                      k == len(SEMANAS) - 1] for k, d in enumerate(SEMANAS)]
    return dict(eixo=eixo, passo=passo, amostra=1, termos=termos, ancora=termos[0] if passo != 3 else None,
                status="recolhido", erro=None, series=series, fetched_at="2026-10-01T06:10:00+00:00")

def base(n=33):
    """n pedidos: n-1 grupos de 5 termos (a âncora em primeiro) e as quatro âncoras juntas"""
    rnd = random.Random(18)
    ps = [pedido(rnd, EIXOS[i % 4], 1, ["ancora-%d" % (i % 4)] + ["termo-%02d-%d" % (i, j) for j in range(4)])
          for i in range(n - 1)]
    return ps + [pedido(rnd, None, 3, ["ancora-%d" % k for k in range(4)])]

rnd = random.Random(30)
def ruido(v): return max(0, v + rnd.choice([-1, 1])) if rnd.random() < 0.3 else v
def aleatorio(v): return rnd.randint(0, 100)

def mexe(pedidos, f, so=None):
    """aplica f aos valores de todos os pedidos, ou só ao pedido de índice `so`"""
    out = copy.deepcopy(pedidos)
    for i, p in enumerate(out):
        if so is not None and i != so: continue
        for s in p["series"].values():
            for x in s: x[1] = f(x[1])
    return out

def corre(nome, funcao, pytrends):
    a, b = os.path.join(PASTA, nome + "-f.json"), os.path.join(PASTA, nome + "-p.json")
    json.dump(dump("funcao", funcao), open(a, "w")); json.dump(dump("pytrends", pytrends), open(b, "w"))
    r = subprocess.run([sys.executable, os.path.join(AQUI, "comparar_vias.py"), a, b], capture_output=True, text=True)
    return r.returncode, r.stdout + r.stderr

F = base()
IGUAL = mexe(F, ruido)
casos = []   # (nome, funcao, pytrends, início esperado da linha do veredicto, texto que tem de aparecer no output)
casos.append(("igual", F, IGUAL, "PASSOU —", None))
casos.append(("diferente", F, mexe(F, aleatorio), "NÃO PASSOU —", "Termos abaixo da referência: ancora-0"))
casos.append(("um pedido inteiro desviado", F, mexe(IGUAL, aleatorio, so=9), "NÃO PASSOU —",
              "1 pedido(s) com todos os termos abaixo da referência: alimentacao p1 ancora-1·termo-09-0"))
F34 = base(34)
casos.append(("34 pedidos nas duas vias", F34, mexe(F34, ruido), "PASSOU — os 34 pedidos", None))
# passo 2 escolhido de forma diferente em cada via: mesmo número, um pedido diferente de cada lado
f2, p2 = copy.deepcopy(F), copy.deepcopy(IGUAL)
f2.append(pedido(random.Random(1), "menopausa", 2, ["termo-02-1", "termo-06-0", "termo-10-2"]))
p2.append(pedido(random.Random(2), "menopausa", 2, ["termo-02-3", "termo-06-0", "termo-10-2"]))
casos.append(("pedido do passo 2 diferente", f2, p2, "PASSOU —", "só na via pytrends: menopausa p2 termo-02-3"))
casos.append(("número de pedidos diferente", f2, IGUAL, "NÃO PASSOU — número de pedidos diferente", None))
f1 = copy.deepcopy(F); f1[5].update(status="falhou", erro="RuntimeError: explore: HTTP 429", series={})
casos.append(("funcao com um falhado", f1, IGUAL, "NÃO PASSOU — chegaram 32 de 33", None))
p1 = copy.deepcopy(IGUAL); p1[7].update(status="falhou", erro="TooManyRequestsError: 429", series={})
casos.append(("pytrends com um falhado", F, p1, "SEM VEREDICTO —", None))
pm = copy.deepcopy(IGUAL); pm[3]["series"][pm[3]["termos"][1]][-1][2] = False
casos.append(("marcação incompleta diferente", F, pm, "NÃO PASSOU — 1 diferença", None))

falhas = []
for nome, f, p, inicio, tem in casos:
    codigo, out = corre(nome.replace(" ", "-"), f, p)
    final = [l for l in out.splitlines() if l.startswith(("PASSOU", "NÃO PASSOU", "SEM VEREDICTO", "Termos abaixo"))]
    ok = (any(l.startswith(inicio) for l in final) and (codigo == 0) == inicio.startswith("PASSOU")
          and (tem is None or tem in out))
    print("%s  %-30s saída %d" % ("OK   " if ok else "FALHA", nome, codigo))
    for l in final: print("         " + (l if len(l) < 180 else l[:180] + " …"))
    if not ok: falhas.append(nome); print(out)

print()
print("TODOS OS %d CASOS DERAM O VEREDICTO ESPERADO" % len(casos) if not falhas else "FALHARAM: " + ", ".join(falhas))
sys.exit(1 if falhas else 0)
