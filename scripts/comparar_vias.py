#!/usr/bin/env python3
"""comparar_vias.py — a via B entrega o mesmo que o pytrends?
==============================================================
30/09/2026, sessão 22; critério mudado a 01/10/2026. Lê dois dumps do script 5 (--dump),
um feito com --via funcao e outro com --via pytrends, no mesmo dia, e aplica o critério de
aceitação de 30/09 (docs/sessoes/2026-09-30-cowork.md §14), decidido pela Marta depois da
1.ª corrida de teste:

  "A via B fica aprovada se, em três corridas de teste, chegarem todos os pedidos e o top 5
   de cada eixo coincidir com o do pytrends do mesmo dia."

Este script julga UMA corrida. As três são contadas no registo das sessões.

    python3 scripts/comparar_vias.py dump-via-funcao.json dump-via-pytrends.json

A 1.ª corrida de teste (30/09) foi julgada pelo critério de §12 e ficou NÃO PASSOU; não se
reclassifica. Este script continua a ler os dumps dela, mas o veredicto que der para esses
dumps é o do critério novo, e não substitui o que ficou registado: quando todos os pedidos
dos dois dumps são anteriores a 01/10, o output di-lo numa NOTA junto ao veredicto
(decisão da Marta, 01/10). O código de saída é o do critério novo.

REGRA DO VEREDICTO (Marta, 30/09 e 01/10/2026)
  1. CHEGARAM. Todos os pedidos do dump da via funcao vieram `recolhido` — contando a
     segunda volta (01/10): vale o estado final de cada pedido. `sem_dados` NÃO conta como
     chegado: todos os pedidos levam uma âncora com valores, e uma resposta vazia é sinal de
     defeito, não de falta de procura (decisão de 01/10). Se não: NÃO PASSOU — mesmo que o
     pytrends também tenha falhas.
     Se a via funcao chegou toda e o pytrends não: SEM VEREDICTO — uma falha do pytrends não
     pode reprovar a via B.
  2. TOP 5. Em cada eixo, os mesmos 5 termos, pela mesma ordem, nos dois dumps. Se sim:
     PASSOU. Se não: NÃO PASSOU, a dizer em que eixo.

SÓ INFORMAÇÃO (não decide o veredicto)
  · número de pedidos de cada via, e os pedidos do passo 2 que só existem numa delas;
  · semanas e marcações de semana incompleta (is_partial) nos pedidos comuns — saem como
    AVISO destacado, junto ao veredicto;
  · as medidas numéricas do critério de §12: por termo, correlação, diferença média e
    fracção de semanas a ≤ 2, contra a referência de 18/09 (CONTEXT.md, Verificações:
    menopausa, 5 anos, semanal, pytrends contra o CSV manual — 0,987, 1,9 pontos, 190 de
    262 semanas a ≤ 2); a mediana dos termos; e os pedidos com todos os termos abaixo.
"""
import json, math, statistics, sys

REF_CORR, REF_DIFF, REF_ATE2 = 0.987, 1.9, 190 / 262
AXES = ["saude-mental", "alimentacao", "menopausa", "emergentes"]
CRITERIO_DESDE = "2026-10-01"   # corridas com todos os pedidos antes disto: NOTA de que não se reclassificam

def carregar(caminho):
    d = json.load(open(caminho))
    return d.get("resumo", {}).get("via"), d["pedidos"], d.get("top5") or {}

def chave(p): return (p["eixo"], p["passo"], tuple(p["termos"]))

def nome(k): return "%s p%d %s" % (k[0] or "entre-eixos", k[1], "·".join(k[2]))

def contagem(pedidos):
    c = {"pedidos": len(pedidos)}
    for s in ("recolhido", "sem_dados", "falhou"): c[s] = sum(p["status"] == s for p in pedidos)
    return c

def pearson(xs, ys):
    mx, my = statistics.fmean(xs), statistics.fmean(ys)
    sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    sxx, syy = sum((x - mx) ** 2 for x in xs), sum((y - my) ** 2 for y in ys)
    return sxy / math.sqrt(sxx * syy) if sxx and syy else None

def medir(ps):
    """[(funcao, pytrends)] → (correlação ou None, diferença média, fracção a ≤ 2, [medidas falhadas])"""
    r = pearson([a for a, _ in ps], [b for _, b in ps])
    dif = statistics.fmean(abs(a - b) for a, b in ps)
    ate2 = sum(abs(a - b) <= 2 for a, b in ps) / len(ps)
    falha = [n for n, ok in (("correlação", r is None or r >= REF_CORR), ("diferença", dif <= REF_DIFF),
                             ("≤ 2", ate2 >= REF_ATE2)) if not ok]
    return r, dif, ate2, falha

def termos_top5(top5, eixo): return [x[0] for x in top5.get(eixo, [])]

def comparar(funcao, pytrends, top5_f, top5_p):
    """Devolve (veredicto, razão, linhas do relatório, termos abaixo da referência — None se
    os números não chegaram a ser comparados, avisos de semanas/marcações)."""
    linhas, abaixo, avisos = [], None, []
    cf, cp = contagem(funcao), contagem(pytrends)
    linhas.append("1. CHEGARAM (sem_dados não conta como chegado)")
    linhas.append("   via funcao:   %(recolhido)d de %(pedidos)d recolhidos, %(sem_dados)d sem_dados, %(falhou)d falhados" % cf)
    linhas.append("   via pytrends: %(recolhido)d de %(pedidos)d recolhidos, %(sem_dados)d sem_dados, %(falhou)d falhados" % cp)
    for p in funcao:
        if "segunda_volta" in p:
            linhas.append("   funcao %s: segunda volta — %s" % (nome(chave(p)), p["segunda_volta"]))
    for via, ps in (("funcao", funcao), ("pytrends", pytrends)):
        for p in ps:
            if p["status"] != "recolhido":
                linhas.append("   %s %s: %s %s" % (via, nome(chave(p)), p["status"], p["erro"] or ""))
    if cf["recolhido"] != cf["pedidos"]:
        return ("NÃO PASSOU", "chegaram %d de %d pedidos pela via funcao (%d falhados, %d sem_dados), contando a "
                "segunda volta" % (cf["recolhido"], cf["pedidos"], cf["falhou"], cf["sem_dados"]), linhas, abaixo, avisos)
    if cp["recolhido"] != cp["pedidos"]:
        return ("SEM VEREDICTO", "a via funcao chegou toda, mas a corrida pytrends não (%d de %d): repetir a do Mac "
                "no mesmo dia" % (cp["recolhido"], cp["pedidos"]), linhas, abaixo, avisos)

    # 2. o top 5 de cada eixo — o que decide
    eixos = [e for e in AXES if e in top5_f or e in top5_p]
    linhas.append("2. TOP 5 DE CADA EIXO — os mesmos 5 termos, pela mesma ordem")
    diferentes = []
    for e in eixos:
        tf, tp = termos_top5(top5_f, e), termos_top5(top5_p, e)
        if tf == tp:
            linhas.append("   %-13s igual:     %s" % (e, " · ".join(tf)))
        else:
            diferentes.append(e)
            linhas.append("   %-13s DIFERENTE" % e)
            linhas.append("      via funcao:   %s" % (" · ".join(tf) or "(sem top 5)"))
            linhas.append("      via pytrends: %s" % (" · ".join(tp) or "(sem top 5)"))
    if not eixos:
        linhas.append("   nenhum dos dumps traz top 5")

    # 3. só informação: pedidos, semanas e marcações
    linhas.append("3. SÓ INFORMAÇÃO — pedidos, semanas e marcações (não decidem o veredicto)")
    if cf["pedidos"] != cp["pedidos"]:
        linhas.append("   número de pedidos diferente: %d pela via funcao, %d pela via pytrends" % (cf["pedidos"], cp["pedidos"]))
    pf, pp = {chave(p): p for p in funcao}, {chave(p): p for p in pytrends}
    comuns = [k for k in pf if k in pp]
    linhas.append("   %d pedidos comuns" % len(comuns))
    for lado, ks in (("só na via funcao", [k for k in pf if k not in pp]), ("só na via pytrends", [k for k in pp if k not in pf])):
        for k in ks: linhas.append("   %s: %s" % (lado, nome(k)))
    pares = {}
    for k in comuns:
        for t in k[2]:
            sf, sp = pf[k]["series"].get(t, []), pp[k]["series"].get(t, [])
            if [x[0] for x in sf] != [x[0] for x in sp]:
                avisos.append("semanas diferentes: %s em %s (%d contra %d)" % (t, nome(k), len(sf), len(sp)))
            elif [x[2] for x in sf] != [x[2] for x in sp]:
                avisos.append("marcação is_partial diferente: %s em %s" % (t, nome(k)))
            elif sf:
                pares[(k, t)] = [(a[1], b[1]) for a, b in zip(sf, sp)]
    linhas.append("   semanas e marcações: %s" % ("%d diferença(s) — ver o AVISO junto ao veredicto" % len(avisos)
                                                  if avisos else "iguais em todos os termos dos pedidos comuns"))

    # 4. só informação: os números do critério de §12
    linhas.append("4. SÓ INFORMAÇÃO — números por termo (critério de §12); referência: correlação ≥ %.3f, "
                  "diferença média ≤ %.1f, semanas a ≤ 2 ≥ %.1f%%" % (REF_CORR, REF_DIFF, 100 * REF_ATE2))
    por_termo = {}
    for (k, t), ps in pares.items(): por_termo.setdefault(t, []).extend(ps)
    medidas, abaixo = [], []
    for t, ps in sorted(por_termo.items()):
        r, dif, ate2, falha = medir(ps)
        medidas.append((r, dif, ate2))
        if falha: abaixo.append("%s (%s)" % (t, ", ".join(falha)))
        linhas.append("   %-32s %s  correlação %s  diferença %.2f  a ≤ 2: %5.1f%%  (%d semanas)%s" % (
            t[:32], "ABAIXO" if falha else "  ok  ", "  —  " if r is None else "%.3f" % r, dif, 100 * ate2,
            len(ps), "  ← " + ", ".join(falha) if falha else ""))
    if medidas:
        rs = [r for r, _, _ in medidas if r is not None]
        linhas.append("   MEDIANA dos %d termos: correlação %s, diferença %.2f, a ≤ 2: %.1f%%" % (
            len(medidas), "%.3f" % statistics.median(rs) if rs else "—", statistics.median(m[1] for m in medidas),
            100 * statistics.median(m[2] for m in medidas)))
    inteiros = [k for k in comuns if all((k, t) in pares for t in k[2]) and all(medir(pares[(k, t)])[3] for t in k[2])]
    linhas.append("   pedidos com todos os termos abaixo da referência: %s" % ("; ".join(nome(k) for k in inteiros) or "nenhum"))

    if not eixos:
        return ("SEM VEREDICTO", "nenhum dos dumps traz top 5 — não se pode aplicar o critério", linhas, abaixo, avisos)
    if diferentes:
        return ("NÃO PASSOU", "o top 5 difere em %d eixo(s): %s" % (len(diferentes), ", ".join(diferentes)),
                linhas, abaixo, avisos)
    return ("PASSOU", "os %d pedidos da via funcao chegaram (contando a segunda volta), a corrida pytrends também, e o "
            "top 5 é igual nos %d eixos — os mesmos termos, pela mesma ordem" % (cf["pedidos"], len(eixos)),
            linhas, abaixo, avisos)

def main():
    if len(sys.argv) != 3:
        sys.exit("uso: comparar_vias.py <dump da via funcao> <dump da via pytrends>")
    (vf, funcao, top5_f), (vp, pytrends, top5_p) = carregar(sys.argv[1]), carregar(sys.argv[2])
    if (vf, vp) != ("funcao", "pytrends"):
        sys.exit("ERRO: o primeiro dump tem de ser da via funcao e o segundo da via pytrends "
                 "(os dumps dizem: %r e %r)" % (vf, vp))
    veredicto, razao, linhas, abaixo, avisos = comparar(funcao, pytrends, top5_f, top5_p)
    print("Critério de 30/09 (docs/sessoes/2026-09-30-cowork.md §14) — vale para as corridas de teste a partir de 01/10.")
    print("\n".join(linhas))
    print()
    if avisos:
        print("!" * 100)
        print("!!! AVISO — %d diferença(s) de semanas ou de marcação de semana incompleta. Não decide o veredicto"
              % len(avisos))
        print("!!! (critério de 30/09), mas é preciso olhar para isto antes de aceitar a corrida:")
        for a in avisos: print("!!!   " + a)
        print("!" * 100)
        print()
    if all(p.get("fetched_at", "9999")[:10] < CRITERIO_DESDE for p in funcao + pytrends):
        print("NOTA: Esta corrida é anterior ao critério de 30/09 §14: foi julgada pelo §12 e ficou NÃO PASSOU; "
              "não se reclassifica. O veredicto abaixo é só informação.")
    print("%s — %s." % (veredicto, razao))
    print("Termos abaixo da referência de 18/09 (só informação): %s" % (
        "não calculado (parou antes dos números)" if abaixo is None else "; ".join(abaixo) or "nenhum"))
    sys.exit(0 if veredicto == "PASSOU" else 1)

if __name__ == "__main__":
    main()
