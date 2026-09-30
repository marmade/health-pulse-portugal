import json, re, sys, statistics
sys.path.insert(0, "scripts")
from comparar_vias import comparar
D = "docs/evidencia/2026-09-30-via-b-corrida-1/"
dumps = {n: json.load(open(D + n + ".json")) for n in ("dump-via-funcao", "dump-via-pytrends", "dump-via-pytrends-2")}

def resumo(a, b):
    v, razao, linhas, _ = comparar(dumps[a]["pedidos"], dumps[b]["pedidos"])
    txt = "\n".join(linhas)
    med = re.search(r"MEDIANA dos (\d+) termos: correlação (\S+), diferença (\S+), a ≤ 2: (\S+)%", txt)
    so = "%d | %d" % (len(re.findall(r"^   só na via funcao", txt, re.M)), len(re.findall(r"^   só na via pytrends", txt, re.M)))
    sec4 = txt.split("4. PEDIDOS COM TODOS")[1].splitlines()[1:]
    inteiros = [l.strip() for l in sec4 if l.strip() and l.strip() != "nenhum"]
    comuns = re.search(r"— (\d+) pedidos comuns", txt).group(1)
    return dict(termos=med.group(1), corr=med.group(2).rstrip(","), dif=med.group(3).rstrip(","), ate2=med.group(4),
                p2=so, comuns=comuns, inteiros=inteiros, veredicto=v)

A = resumo("dump-via-funcao", "dump-via-pytrends")
B = resumo("dump-via-pytrends-2", "dump-via-pytrends")
print("%-44s %-22s %-22s" % ("", "funcao × pytrends", "pytrends-2 × pytrends"))
for k, rot, ref in (("corr", "mediana da correlação (≥ 0,987)", ""), ("dif", "mediana da diferença média (≤ 1,9)", ""),
                    ("ate2", "mediana das semanas a ≤ 2 (≥ 72,5%)", "")):
    print("%-44s %-22s %-22s" % (rot, A[k] + ("%" if k == "ate2" else ""), B[k] + ("%" if k == "ate2" else "")))
print("%-44s %-22s %-22s" % ("termos comparados", A["termos"], B["termos"]))
print("%-44s %-22s %-22s" % ("pedidos só no 1.º | só no 2.º dump", A["p2"], B["p2"]))
print("%-44s %-22s %-22s" % ("pedidos comuns", A["comuns"], B["comuns"]))
print("%-44s %-22s %-22s" % ("pedidos abaixo por inteiro", len(A["inteiros"]), len(B["inteiros"])))
for n, X in (("funcao × pytrends", A), ("pytrends-2 × pytrends", B)):
    print("\nabaixo por inteiro, %s:" % n)
    for l in X["inteiros"] or ["nenhum"]: print("   " + l)

print("\nTOP 5 — funcao | pytrends | pytrends-2")
for e in ["saude-mental", "alimentacao", "menopausa", "emergentes"]:
    t = [dumps[n]["top5"][e] for n in ("dump-via-funcao", "dump-via-pytrends", "dump-via-pytrends-2")]
    nomes = [[x for x, _ in l] for l in t]
    print("== %s — funcao×pytrends: %d de 5, ordem %s | pytrends-2×pytrends: %d de 5, ordem %s" % (
        e, len(set(nomes[0]) & set(nomes[1])), "igual" if nomes[0] == nomes[1] else "muda",
        len(set(nomes[2]) & set(nomes[1])), "igual" if nomes[2] == nomes[1] else "muda"))
    for i in range(5):
        print("   %d. " % (i + 1) + "  |  ".join("%-20s %6.1f" % (l[i][0][:20], l[i][1]) for l in t))
