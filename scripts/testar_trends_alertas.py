#!/usr/bin/env python3
"""testar_trends_alertas.py — os empates nos limiares decidem-se pela regra? (sem rede)
=====================================================================================
14/10/2026, sessão 30. Aceitação da correcção dos empates, fixada a 12/10 em
docs/sessoes/2026-10-11.md §4.1 (ponto 1), mais a função única da série (§4.1 b) e a
protecção do passo 7 do script 5 (2026-10-13-cowork.md §7).

    python3 scripts/testar_trends_alertas.py

Os empates repetem-se com vários factores de calibração, porque é o factor que, em vírgula
flutuante, decidia o lado do empate (2026-10-11.md §3.5). A regra é invariante à escala: o
resultado tem de ser o mesmo com qualquer factor.

CASOS                                                                          ESPERADO
  bruto 12 contra referência 8 (razão 3/2, z 2)                               a_observar
  bruto 30 contra referência 20 (razão exactamente 3/2, z 5)                  subida
  bruto 10 contra referência 4 (z exactamente 3, razão 5/2)                   subida
  bruto 9 contra referência 4 (z 5/2)                                         a_observar, não subida
  em curso: 3 contra referência congelada 2                                   continua (2.ª semana)
  em curso: 2 contra referência congelada 2                                   fecha
  bruto 20, máximo anterior 10 (aparecimento exactamente nos dois limiares)   aparecimento
  bruto 19, máximo anterior 0                                                 nada
  aparecimento em curso com bruto 20                                          continua (2.ª semana)
  tendência (29/10): 26.ª semana em curso; 27.ª tendência; subida nova acima
    do patamar; a tendência volta; acaba abaixo de 1,5 × o valor de antes       subida 26, tendencia 27, …
  os números gravados vêm na régua do eixo (bruto × factor)                   valor, referência, ruído
  a série de um termo com dois pedido_id                                      SerieAmbigua (não SystemExit)
  a série de um termo com dois factores                                       SerieAmbigua
  a mesma série vinda da memória e da base                                    linhas iguais
  passo 7: a série aborta                                                     lote gravado, alertas
                                                                              não apagados, saída 4
"""
import importlib.util, io, os, sys
from contextlib import redirect_stdout
from datetime import date, datetime, timedelta, timezone

AQUI = os.path.dirname(os.path.abspath(__file__))

def carrega(nome, ficheiro):
    spec = importlib.util.spec_from_file_location(nome, os.path.join(AQUI, ficheiro))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m

TA = carrega("trends_alertas", "trends_alertas.py")
NOVO = hasattr(TA, "series_brutas")   # o código de 18/09 não tem a função única
FACTORES = [1.0, 0.1, 0.3, 1 / 3, 0.7, 0.123457, 1.4826, 2.7, 0.054321]
SEMANAS = [(date(2025, 1, 5) + timedelta(weeks=i)).isoformat() for i in range(70)]

falhas = []
def verifica(nome, ok, detalhe=""):
    print("  %-4s %s%s" % ("ok" if ok else "FALHA", nome, "" if ok else "  — " + detalhe))
    if not ok: falhas.append(nome)

def alertas(brutos, fac):
    """As linhas da regra para um termo com estes brutos inteiros (uma por semana, a partir de
    SEMANAS[0]) e este factor. Com o código de 18/09, a série vai na régua do eixo (bruto ×
    factor, em vírgula flutuante), como o passo 7 a montava."""
    k = ("eixo", "termo")
    if NOVO:
        linhas = [dict(eixo="eixo", termo="termo", data=SEMANAS[i], pedido_id="p1", factor=fac,
                       valor=v, parcial=False) for i, v in enumerate(brutos)]
        series, factor = TA.series_brutas(linhas)
    else:
        series, factor = {k: {SEMANAS[i]: v * fac for i, v in enumerate(brutos)}}, {k: fac}
    return {l["semana"]: l for l in TA.calcula(series, factor)}

def caso(nome, brutos, semana_i, tipo, semana_n=1):
    """O tipo (e a semana_n) na semana `semana_i`, com todos os factores. tipo None = sem linha."""
    erradas = []
    for fac in FACTORES:
        l = alertas(brutos, fac).get(SEMANAS[semana_i])
        obtido = (l["tipo"], l["semana_n"]) if l else None
        if obtido != ((tipo, semana_n) if tipo else None):
            erradas.append("factor %.6g → %s" % (fac, obtido))
    verifica(nome, not erradas, "; ".join(erradas))

print("EMPATES — %s" % ("código novo" if NOVO else "código de 18/09 (o teste tem de o apanhar)"))
caso("12 contra 8: razão 3/2 e z 2 → a_observar", [8] * 8 + [12], 8, "a_observar")
caso("30 contra 20: razão exactamente 3/2 → subida", [20] * 8 + [30], 8, "subida")
caso("10 contra 4: z exactamente 3 → subida", [4] * 8 + [10], 8, "subida")
caso("9 contra 4: z 5/2 → a_observar, não subida", [4] * 8 + [9], 8, "a_observar")
caso("em curso: 3 contra referência congelada 2 → continua", [2] * 8 + [8, 3], 9, "subida", 2)
caso("em curso: 2 contra referência congelada 2 → fecha", [2] * 8 + [8, 2], 9, None)
caso("aparecimento: bruto 20, máximo anterior 10", [0] * 30 + [10] + [0] * 21 + [20], 52, "aparecimento")
caso("bruto 19, máximo anterior 0 → nada", [0] * 52 + [19], 52, None)
caso("aparecimento em curso com bruto 20 → continua", [0] * 52 + [25, 20], 53, "aparecimento", 2)

if hasattr(TA, "N_TEND"):
    # 29/10/2026 — tendência (docs/evidencia/2026-10-29-creatina/simulacao.md): 10 durante 8
    # semanas, depois 40 (×4); na semana 40 uma subida nova para 100; da semana 45 em diante 12.
    print("\nTENDÊNCIA — mais de %d semanas em curso" % TA.N_TEND)
    T = [10] * 8 + [40] * 32 + [100] + [40] * 4 + [12] * 3
    caso("26.ª semana do acontecimento ainda é alerta em curso", T, 8 + 25, "subida", 26)
    caso("27.ª semana passa a tendência (idade contada desde o início)", T, 8 + 26, "tendencia", 27)
    caso("subida acima do patamar novo (100 contra 40) → alerta novo, 1.ª semana", T, 40, "subida", 1)
    caso("depois do alerta novo, a tendência volta", T, 41, "tendencia", 34)
    caso("abaixo de 1,5 × o valor normal de antes (12 contra 10) → a tendência acaba", T, 45, None)
    l = alertas(T, 0.5)[SEMANAS[8 + 26]]
    verifica("a linha da tendência grava a referência de antes, a razão contra ela e z nulo",
             (l["referencia"], l["razao"], l["z"], l["inicio"]) == (5.0, 4.0, None, SEMANAS[8]),
             str((l["referencia"], l["razao"], l["z"], l["inicio"])))

if not NOVO:
    print("\n%d falha(s) no código de 18/09." % len(falhas))
    sys.exit(1 if falhas else 0)

print("\nNÚMEROS GRAVADOS — na régua do eixo")
l = alertas([20] * 8 + [30], 0.25)[SEMANAS[8]]
verifica("valor 7,5 · referência 5 · ruído 0,5 · razão 1,5 · z 5",
         (l["valor"], l["referencia"], l["ruido"], l["razao"], l["z"]) == (7.5, 5.0, 0.5, 1.5, 5.0),
         str((l["valor"], l["referencia"], l["ruido"], l["razao"], l["z"])))
verifica("os números gravados são float (o JSON da base não leva Fraction)",
         all(isinstance(v, float) for v in (l["valor"], l["referencia"], l["ruido"], l["razao"], l["z"])))

print("\nFUNÇÃO ÚNICA — aborta perante ambiguidade")
def linhas_termo(**muda):
    out = [dict(eixo="e", termo="t", data=SEMANAS[i], pedido_id="p1", factor=0.5, valor=10, parcial=False)
           for i in range(10)]
    out[5].update(muda); return out
for nome, linhas in (("dois pedido_id", linhas_termo(pedido_id="p2")),
                     ("dois factores", linhas_termo(factor=0.6))):
    try:
        TA.series_brutas(linhas); verifica(nome + " → SerieAmbigua", False, "não abortou")
    except TA.SerieAmbigua:
        verifica(nome + " → SerieAmbigua", True)
    except BaseException as e:
        verifica(nome + " → SerieAmbigua", False, "levantou %s" % type(e).__name__)
verifica("SerieAmbigua é uma Exception (o passo 7 apanha-a; SystemExit não)",
         issubclass(TA.SerieAmbigua, Exception))
s, _ = TA.series_brutas(linhas_termo(parcial=True))
verifica("a semana parcial do pedido escolhido fica de fora",
         SEMANAS[5] not in s[("e", "t")] and len(s[("e", "t")]) == 9)

# ── o script 5 ──────────────────────────────────────────────────────────────
S5 = carrega("script5", "5_fetch_google_trends.py")
UTC = timezone.utc
D = [datetime(2025, 1, 5, tzinfo=UTC) + timedelta(weeks=i) for i in range(12)]

def pedidos_falsos():
    """Um eixo, dois pedidos do passo 1 com a âncora (régua 1 e régua 1/3) e um do passo 2
    que substitui o termo esmagado. A última semana vem parcial."""
    def serie(vals): return [(D[i], v, i == len(D) - 1) for i, v in enumerate(vals)]
    p0 = dict(eixo="e", passo=1, termos=["anc", "a"], ancora="anc", status="recolhido",
              series={"anc": serie([30] * 12), "a": serie([8] * 8 + [12, 12, 30, 40])})
    p1 = dict(eixo="e", passo=1, termos=["anc", "b"], ancora="anc", status="recolhido",
              series={"anc": serie([90] * 12), "b": serie([2] * 8 + [8, 3, 3, 9])})
    p2 = dict(eixo="e", passo=2, termos=["a", "b"], ancora="a", status="recolhido",
              series={"a": serie([20] * 12), "b": serie([4] * 8 + [10, 6, 6, 9])})
    for p in (p0, p1, p2): p.update(amostra=1, erro=None, fetched_at=D[-1])
    return [p0, p1, p2]

def calibrados_falsos(pedidos):
    """Como a calibração do script 5: (eixo, termo, data, valor_eixo, factor, índice)."""
    fs = {0: 1.0, 1: 1 / 3, 2: 0.4 * 1.0}   # factores quaisquer, não redondos em binário
    return [(p["eixo"], t, d, v * fs[i], fs[i], i) for i, p in enumerate(pedidos)
            for t, s in p["series"].items() if not (p["passo"] == 2 and t == p["ancora"]) for d, v, _ in s]

print("\nMEMÓRIA = BASE — a mesma série pelos dois caminhos")
pedidos = pedidos_falsos(); cal = calibrados_falsos(pedidos)
mem = TA.calcula(*TA.series_brutas(S5.linhas_brutas(pedidos, cal)))
# o que a base guarda: trends_calibrados (factor a 6 casas, pedido_id) + trends_pontos (valor, is_partial)
pontos = {(i, t, d.date().isoformat()): (v, pc) for i, p in enumerate(pedidos) for t, s in p["series"].items() for d, v, pc in s}
base = [dict(eixo=e, termo=t, data=d.date().isoformat(), pedido_id=i, factor=round(f, 6),
             valor=pontos[(i, t, d.date().isoformat())][0], parcial=pontos[(i, t, d.date().isoformat())][1])
        for e, t, d, ve, f, i in S5.dedup_passo2(pedidos, cal)]
dab = TA.calcula(*TA.series_brutas(base))
verifica("linhas iguais (%d), números incluídos" % len(mem), mem == dab and len(mem) > 0,
         "memória %d, base %d" % (len(mem), len(dab)))
verifica("o termo b vem do pedido do passo 2 (bruto 10 contra 4 → subida)",
         any(l["termo"] == "b" and l["tipo"] == "subida" and l["valor"] == round(10 * 0.4, 6) for l in mem),
         str([(l["termo"], l["tipo"], l["valor"]) for l in mem]))

print("\nPASSO 7 — se a série abortar, o lote fica gravado e os alertas não se apagam")
chamadas = []
def rest_falso(url, key, path, method="GET", body=None, prefer=None):
    chamadas.append((method, path.split("?")[0], body))
    if path.startswith("trends_pedidos"): return [dict(id="ped-%d" % len(chamadas))]
    return None
S5.rest = rest_falso; TA.rest = rest_falso
original = TA.series_brutas
def aborta(linhas): raise TA.SerieAmbigua("e/b: 2 pedido_id nas semanas do lote")
TA.series_brutas = aborta
sys.modules["trends_alertas"] = TA   # o passo 7 faz `import trends_alertas`
class Args: timeframe = "today 5-y"
out = io.StringIO()
with redirect_stdout(out):
    ok = S5.escrever_lote("http://x", "k", dict(id="lote-teste-0000"), pedidos, cal,
                          dict(falhados=0, pontos=1), Args(), [])
TA.series_brutas = original
texto = out.getvalue()
verifica("o lote fica completo", any(m == "PATCH" and b.get("estado") == "completo" for m, _, b in chamadas))
verifica("nenhum DELETE em trends_alertas", not any(m == "DELETE" for m, _, _ in chamadas),
         str([c[:2] for c in chamadas if c[0] == "DELETE"]))
verifica("escrever_lote diz que os alertas falharam", ok is False, repr(ok))
verifica("o aviso nomeia o erro e o comando de recuperação",
         "SerieAmbigua" in texto and "trends_alertas.py --lote lote-tes --gravar" in texto, texto[-300:])
verifica("saída 4 do script 5 quando os alertas falham", S5.SAIDA_ALERTAS_FALHARAM == 4)

print("\n%s" % ("TODOS OS CASOS PASSARAM" if not falhas else "%d FALHA(S): %s" % (len(falhas), "; ".join(falhas))))
sys.exit(1 if falhas else 0)
