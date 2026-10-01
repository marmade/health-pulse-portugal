#!/usr/bin/env python3
"""testar_comparar_vias.py — o comparar_vias.py dá os veredictos certos? (sem rede)
===================================================================================
30/09/2026, sessão 22; casos do critério de 30/09 §14 a 01/10/2026. Dumps falsos, no formato
do --dump do script 5: 33 pedidos (32 grupos de 5 termos e as quatro âncoras juntas), 262
semanas, a última marcada incompleta, e um top 5 por eixo. Corre o comparar_vias.py como se
corre à mão.

    python3 scripts/testar_comparar_vias.py

CASOS                                                                          ESPERADO
  igual — a via pytrends com ruído de ±1 em 30% das semanas                  PASSOU
  números sem relação, top 5 igual (os números são só informação)            PASSOU, termos listados
  top 5 com a ordem trocada num eixo                                         NÃO PASSOU, a dizer qual
  top 5 com um termo diferente num eixo                                      NÃO PASSOU, a dizer qual
  um eixo sem top 5 num dos dumps                                            NÃO PASSOU
  um pedido falhado na via funcao                                            NÃO PASSOU
  um pedido sem_dados na via funcao (não conta como chegado)                 NÃO PASSOU
  falhados nas duas vias                                                     NÃO PASSOU (não SEM VEREDICTO)
  um pedido falhado na via pytrends, a via funcao toda                       SEM VEREDICTO
  falhado na 1.ª volta e recuperado na segunda (estado final recolhido)      PASSOU, a segunda volta listada
  falhado também na segunda volta                                            NÃO PASSOU
  número de pedidos diferente nas duas vias                                  PASSOU, como informação
  mesmo número, mas um pedido do passo 2 diferente em cada via               PASSOU, os dois listados
  uma marcação de semana incompleta diferente                                PASSOU, com AVISO destacado
  semanas diferentes num termo                                               PASSOU, com AVISO destacado
  os dumps verdadeiros de 30/09 (docs/evidencia/…corrida-1)                  lidos sem erro, com a NOTA de que
                                                                             não se reclassificam
  (nos casos falsos, de 01/10, a NOTA não pode aparecer)
"""
import copy, json, math, os, random, subprocess, sys, tempfile
from datetime import datetime, timedelta, timezone

AQUI = os.path.dirname(os.path.abspath(__file__))
PASTA = tempfile.mkdtemp()
SEMANAS = [(datetime(2021, 10, 3, tzinfo=timezone.utc) + timedelta(weeks=i)).isoformat() for i in range(262)]
EIXOS = ["saude-mental", "alimentacao", "menopausa", "emergentes"]
TOP5 = {e: [["termo-%02d-%d" % (i, j), 50.0 - 5 * j] for j, i in enumerate(range(k, k + 20, 4))] for k, e in enumerate(EIXOS)}

def dump(via, pedidos, top5):
    return dict(timeframe="today 5-y", eixo=None, top5=top5, calibrados=[],
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

def com(pedidos, i, **campos):
    out = copy.deepcopy(pedidos); out[i].update(**campos); return out

def top5_com(eixo, termos):
    out = copy.deepcopy(TOP5); out[eixo] = [[t, 50.0 - 5 * j] for j, t in enumerate(termos)]; return out

def corre(nome, funcao, pytrends, top5_f=TOP5, top5_p=TOP5):
    a, b = os.path.join(PASTA, nome + "-f.json"), os.path.join(PASTA, nome + "-p.json")
    json.dump(dump("funcao", funcao, top5_f), open(a, "w")); json.dump(dump("pytrends", pytrends, top5_p), open(b, "w"))
    return corre_ficheiros(a, b)

def corre_ficheiros(a, b):
    r = subprocess.run([sys.executable, os.path.join(AQUI, "comparar_vias.py"), a, b], capture_output=True, text=True)
    return r.returncode, r.stdout + r.stderr

F = base()
IGUAL = mexe(F, ruido)
MENO = [t for t, _ in TOP5["menopausa"]]
FALHOU = dict(status="falhou", erro="RuntimeError: multiline: HTTP 429", series={})
# (nome, funcao, pytrends, top5 funcao, top5 pytrends, início da linha do veredicto, texto que tem de aparecer)
casos = [
    ("igual", F, IGUAL, TOP5, TOP5, "PASSOU —", None),
    ("números sem relação, top 5 igual", F, mexe(F, aleatorio), TOP5, TOP5, "PASSOU —",
     "Termos abaixo da referência de 18/09 (só informação): ancora-0"),
    ("top 5 com a ordem trocada", F, IGUAL, top5_com("menopausa", [MENO[1], MENO[0]] + MENO[2:]), TOP5,
     "NÃO PASSOU — o top 5 difere em 1 eixo(s): menopausa", "menopausa     DIFERENTE"),
    ("top 5 com um termo diferente", F, IGUAL, TOP5, top5_com("emergentes", ["outro"] + [t for t, _ in TOP5["emergentes"]][1:]),
     "NÃO PASSOU — o top 5 difere em 1 eixo(s): emergentes", None),
    ("um eixo sem top 5 num dump", F, IGUAL, {e: v for e, v in TOP5.items() if e != "alimentacao"}, TOP5,
     "NÃO PASSOU — o top 5 difere em 1 eixo(s): alimentacao", "(sem top 5)"),
    ("funcao com um falhado", com(F, 5, **FALHOU), IGUAL, TOP5, TOP5,
     "NÃO PASSOU — chegaram 32 de 33 pedidos pela via funcao (1 falhados, 0 sem_dados)", None),
    ("funcao com um sem_dados", com(F, 5, status="sem_dados", series={}), IGUAL, TOP5, TOP5,
     "NÃO PASSOU — chegaram 32 de 33 pedidos pela via funcao (0 falhados, 1 sem_dados)", "sem_dados não conta como chegado"),
    ("falhados nas duas vias", com(F, 5, **FALHOU), com(IGUAL, 7, **FALHOU), TOP5, TOP5, "NÃO PASSOU — chegaram 32 de 33", None),
    ("pytrends com um falhado", F, com(IGUAL, 7, **FALHOU), TOP5, TOP5, "SEM VEREDICTO — a via funcao chegou toda", None),
    ("recuperado na segunda volta", com(F, 5, segunda_volta="recuperado"), IGUAL, TOP5, TOP5, "PASSOU —",
     "segunda volta — recuperado"),
    ("falhado também na segunda volta", com(F, 5, segunda_volta="não recuperado", **FALHOU), IGUAL, TOP5, TOP5,
     "NÃO PASSOU — chegaram 32 de 33", "segunda volta — não recuperado"),
]
F34 = base(34)
casos.append(("número de pedidos diferente", F34, IGUAL, TOP5, TOP5, "PASSOU —",
              "número de pedidos diferente: 34 pela via funcao, 33 pela via pytrends"))
# passo 2 escolhido de forma diferente em cada via: mesmo número, um pedido diferente de cada lado
f2, p2 = copy.deepcopy(F), copy.deepcopy(IGUAL)
f2.append(pedido(random.Random(1), "menopausa", 2, ["termo-02-1", "termo-06-0", "termo-10-2"]))
p2.append(pedido(random.Random(2), "menopausa", 2, ["termo-02-3", "termo-06-0", "termo-10-2"]))
casos.append(("pedido do passo 2 diferente", f2, p2, TOP5, TOP5, "PASSOU —", "só na via pytrends: menopausa p2 termo-02-3"))
pm = copy.deepcopy(IGUAL); pm[3]["series"][pm[3]["termos"][1]][-1][2] = False
casos.append(("marcação incompleta diferente", F, pm, TOP5, TOP5, "PASSOU —",
              "!!! AVISO — 1 diferença(s) de semanas ou de marcação de semana incompleta"))
ps = copy.deepcopy(IGUAL); ps[4]["series"][ps[4]["termos"][2]].pop(0)
casos.append(("semanas diferentes num termo", F, ps, TOP5, TOP5, "PASSOU —", "!!!   semanas diferentes: termo-04-1"))

falhas = []
def mostra(nome, codigo, out, inicio, tem, anterior=False):
    final = [l for l in out.splitlines() if l.startswith(("PASSOU", "NÃO PASSOU", "SEM VEREDICTO", "Termos abaixo"))]
    tem = () if tem is None else (tem,) if isinstance(tem, str) else tem
    ok = (any(l.startswith(inicio) for l in final) and (codigo == 0) == inicio.startswith("PASSOU")
          and all(x in out for x in tem) and "Traceback" not in out
          and ("anterior ao critério" in out) == anterior)
    print("%s  %-36s saída %d" % ("OK   " if ok else "FALHA", nome, codigo))
    for l in final: print("         " + (l if len(l) < 180 else l[:180] + " …"))
    if not ok: falhas.append(nome); print(out)

for nome, f, p, tf, tp, inicio, tem in casos:
    codigo, out = corre(nome.replace(" ", "-"), f, p, tf, tp)
    mostra(nome, codigo, out, inicio, tem)

# os dumps verdadeiros de 30/09: têm de continuar a ler-se. A corrida foi julgada pelo critério
# de §12 (NÃO PASSOU, não se reclassifica): o output tem de o dizer na NOTA.
E = os.path.join(os.path.dirname(AQUI), "docs", "evidencia", "2026-09-30-via-b-corrida-1")
codigo, out = corre_ficheiros(os.path.join(E, "dump-via-funcao.json"), os.path.join(E, "dump-via-pytrends.json"))
mostra("dumps verdadeiros de 30/09", codigo, out, "PASSOU —",
      ("MEDIANA dos 100 termos: correlação 0.790, diferença 0.83, a ≤ 2: 92.5%",
       "NOTA: Esta corrida é anterior ao critério de 30/09 §14: foi julgada pelo §12 e ficou NÃO PASSOU"), anterior=True)

print()
print("TODOS OS %d CASOS DERAM O VEREDICTO ESPERADO" % (len(casos) + 1) if not falhas else "FALHARAM: " + ", ".join(falhas))
sys.exit(1 if falhas else 0)
