#!/usr/bin/env python3
"""comparar_vias.py — a via B entrega o mesmo que o pytrends?
==============================================================
30/09/2026, sessão 22. Lê dois dumps do script 5 (--dump), um feito com --via funcao e
outro com --via pytrends, no mesmo dia, e aplica o critério de aceitação aprovado pela Marta
(docs/sessoes/2026-09-30-cowork.md §12):

  "No mesmo dia, pede-se o mesmo ao Google pelos dois caminhos. Se os 33 pedidos chegarem e
   os números forem tão parecidos como o pytrends era da descarga manual a 18/09, a via B
   fica aprovada. Se não, fica o domingo à mão."

    python3 scripts/comparar_vias.py dump-via-funcao.json dump-via-pytrends.json

A REFERÊNCIA (CONTEXT.md, Verificações, 18/09/2026): menopausa, 5 anos, semanal, pytrends
contra o CSV manual — correlação 0,987, diferença média 1,9 pontos, 190 de 262 semanas a ≤ 2.

O QUE SE VERIFICA, POR ESTA ORDEM
  1. Chegaram: todos os pedidos da via funcao vieram `recolhido`, e o número de pedidos é o
     mesmo nas duas vias. O 33 da frase não está fixo aqui: o número depende das keywords
     activas e do passo 2 (decisão da Marta, 30/09).
     Se a corrida pytrends não chegou toda, o resultado é SEM VEREDICTO — uma falha do
     pytrends não pode reprovar a via B.
  2. Os pedidos do passo 2 dependem dos números do passo 1 e podem não ser os mesmos nos dois
     dumps: os que diferem são listados, e compara-se só nos que existem nos dois.
     Nesses: mesmas semanas e mesmas marcações de semana incompleta (is_partial).
  3. Números: correlação, diferença média e fracção de semanas a ≤ 2. Um termo (ou um termo
     num pedido) fica ABAIXO DA REFERÊNCIA se falhar qualquer das três. A correlação de uma
     série constante não existe: esse termo é julgado só pelas outras duas.

REGRA DO VEREDICTO (decidida pela Marta a 30/09/2026)
  PASSOU se 1 e 2 se cumprem, se a MEDIANA dos termos está dentro da referência nas três
  medidas, E se nenhum pedido tem TODOS os seus termos abaixo da referência. Um erro de
  sistema apanha o pedido inteiro; o ruído do Google espalha-se por termos soltos. Se um
  pedido inteiro ficar abaixo: NÃO PASSOU, a dizer qual. Os termos abaixo da referência são
  listados, passe ou não.
"""
import json, math, statistics, sys

REF_CORR, REF_DIFF, REF_ATE2 = 0.987, 1.9, 190 / 262

def carregar(caminho):
    d = json.load(open(caminho))
    return d.get("resumo", {}).get("via"), d["pedidos"]

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

def comparar(funcao, pytrends):
    """Devolve (veredicto, razão, linhas do relatório, termos abaixo da referência — None se
    a comparação dos números não chegou a ser feita)."""
    linhas, abaixo = [], None
    cf, cp = contagem(funcao), contagem(pytrends)
    linhas.append("1. CHEGARAM")
    linhas.append("   via funcao:   %(recolhido)d de %(pedidos)d recolhidos, %(sem_dados)d sem_dados, %(falhou)d falhados" % cf)
    linhas.append("   via pytrends: %(recolhido)d de %(pedidos)d recolhidos, %(sem_dados)d sem_dados, %(falhou)d falhados" % cp)
    for p in funcao:
        if p["status"] != "recolhido":
            linhas.append("   funcao %s: %s %s" % (nome(chave(p)), p["status"], p["erro"] or ""))
    if cf["recolhido"] != cf["pedidos"]:
        return ("NÃO PASSOU", "chegaram %d de %d pedidos pela via funcao" % (cf["recolhido"], cf["pedidos"]),
                linhas, abaixo)
    if cp["recolhido"] != cp["pedidos"]:
        return ("SEM VEREDICTO", "a corrida pytrends não chegou toda (%d de %d): repetir a do Mac no mesmo dia"
                % (cp["recolhido"], cp["pedidos"]), linhas, abaixo)
    if cf["pedidos"] != cp["pedidos"]:
        return ("NÃO PASSOU", "número de pedidos diferente: %d pela via funcao, %d pela via pytrends"
                % (cf["pedidos"], cp["pedidos"]), linhas, abaixo)

    # 2. os mesmos pedidos? mesmas semanas, mesmas marcações
    pf, pp = {chave(p): p for p in funcao}, {chave(p): p for p in pytrends}
    comuns = [k for k in pf if k in pp]
    linhas.append("2. PEDIDOS, SEMANAS E MARCAÇÕES — %d pedidos comuns" % len(comuns))
    for lado, ks in (("só na via funcao", [k for k in pf if k not in pp]), ("só na via pytrends", [k for k in pp if k not in pf])):
        for k in ks: linhas.append("   %s: %s" % (lado, nome(k)))
    diferencas, pares = [], {}
    for k in comuns:
        for t in k[2]:
            sf, sp = pf[k]["series"].get(t, []), pp[k]["series"].get(t, [])
            if [x[0] for x in sf] != [x[0] for x in sp]:
                diferencas.append("semanas diferentes: %s em %s (%d contra %d)" % (t, nome(k), len(sf), len(sp)))
            elif [x[2] for x in sf] != [x[2] for x in sp]:
                diferencas.append("marcação is_partial diferente: %s em %s" % (t, nome(k)))
            else:
                pares[(k, t)] = [(a[1], b[1]) for a, b in zip(sf, sp)]
    for d in diferencas: linhas.append("   " + d)
    if not diferencas: linhas.append("   iguais em todos os termos dos pedidos comuns")
    if diferencas:
        return ("NÃO PASSOU", "%d diferença(s) de semanas ou de marcação de semana incompleta" % len(diferencas),
                linhas, abaixo)

    # 3. números — por termo (todos os pontos do termo nos pedidos comuns) e por pedido
    linhas.append("3. NÚMEROS POR TERMO — referência: correlação ≥ %.3f, diferença média ≤ %.1f, "
                  "semanas a ≤ 2 ≥ %.1f%%" % (REF_CORR, REF_DIFF, 100 * REF_ATE2))
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
    rs = [r for r, _, _ in medidas if r is not None]
    med = (statistics.median(rs) if rs else None, statistics.median(m[1] for m in medidas),
           statistics.median(m[2] for m in medidas))
    linhas.append("   MEDIANA dos %d termos: correlação %s, diferença %.2f, a ≤ 2: %.1f%%" % (
        len(medidas), "—" if med[0] is None else "%.3f" % med[0], med[1], 100 * med[2]))

    linhas.append("4. PEDIDOS COM TODOS OS TERMOS ABAIXO DA REFERÊNCIA")
    inteiros = [k for k in comuns if all(medir(pares[(k, t)])[3] for t in k[2])]
    for k in inteiros: linhas.append("   " + nome(k))
    if not inteiros: linhas.append("   nenhum")

    fora = [n for n, ok in (("correlação", med[0] is not None and med[0] >= REF_CORR),
                            ("diferença média", med[1] <= REF_DIFF), ("semanas a ≤ 2", med[2] >= REF_ATE2)) if not ok]
    if fora:
        return ("NÃO PASSOU", "a mediana dos termos fica abaixo da referência de 18/09 em: " + ", ".join(fora),
                linhas, abaixo)
    if inteiros:
        return ("NÃO PASSOU", "%d pedido(s) com todos os termos abaixo da referência: %s"
                % (len(inteiros), "; ".join(nome(k) for k in inteiros)), linhas, abaixo)
    return ("PASSOU", "os %d pedidos chegaram pelas duas vias (números comparados nos %d comuns), semanas e "
            "marcações iguais, a mediana dos termos está dentro da referência de 18/09 e nenhum pedido ficou "
            "abaixo por inteiro" % (cf["pedidos"], len(comuns)), linhas, abaixo)

def main():
    if len(sys.argv) != 3:
        sys.exit("uso: comparar_vias.py <dump da via funcao> <dump da via pytrends>")
    (vf, funcao), (vp, pytrends) = carregar(sys.argv[1]), carregar(sys.argv[2])
    if (vf, vp) != ("funcao", "pytrends"):
        sys.exit("ERRO: o primeiro dump tem de ser da via funcao e o segundo da via pytrends "
                 "(os dumps dizem: %r e %r)" % (vf, vp))
    veredicto, razao, linhas, abaixo = comparar(funcao, pytrends)
    print("\n".join(linhas))
    print()
    print("%s — %s." % (veredicto, razao))
    print("Termos abaixo da referência: %s" % (
        "não calculado (parou antes dos números)" if abaixo is None else "; ".join(abaixo) or "nenhum"))
    sys.exit(0 if veredicto == "PASSOU" else 1)

if __name__ == "__main__":
    main()
