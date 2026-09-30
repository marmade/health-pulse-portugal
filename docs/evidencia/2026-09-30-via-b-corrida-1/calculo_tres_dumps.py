import json, re, sys
sys.path.insert(0, "scripts")
from comparar_vias import comparar, chave
D = "docs/evidencia/2026-09-30-via-b-corrida-1/"
F, P, P2 = (json.load(open(D + n + ".json")) for n in ("dump-via-funcao", "dump-via-pytrends", "dump-via-pytrends-2"))
for p in P2["pedidos"]:
    if p["status"] != "recolhido": print("falhou no pytrends-2:", p["eixo"], "p%d" % p["passo"], "·".join(p["termos"]), "—", p["erro"][:80])
ok = lambda d: {chave(p): p for p in d["pedidos"] if p["status"] == "recolhido"}
f, p, p2 = ok(F), ok(P), ok(P2)
todos = [k for k in p if k in f and k in p2]
print("pedidos recolhidos e presentes nos três dumps: %d" % len(todos))
print("pedidos do passo 2 que diferem (só num | só no outro): funcao×pytrends %d | %d ; pytrends-2×pytrends %d | %d" % (
    len([k for k in f if k not in p]), len([k for k in p if k not in f]), len([k for k in p2 if k not in p]), len([k for k in p if k not in p2])))
def medir(a, b):
    v, r, linhas, _ = comparar([a[k] for k in todos], [b[k] for k in todos])
    t = "\n".join(linhas)
    m = re.search(r"MEDIANA dos (\d+) termos: correlação (\S+), diferença (\S+), a ≤ 2: (\S+)", t)
    inteiros = [l.strip() for l in t.split("4. PEDIDOS COM TODOS")[1].splitlines()[1:] if l.strip() and l.strip() != "nenhum"]
    return m.groups(), inteiros
(ma, ia), (mb, ib) = medir(f, p), medir(p2, p)
print()
print("%-40s %-20s %-20s" % ("nos %d pedidos comuns aos três" % len(todos), "funcao × pytrends", "pytrends-2 × pytrends"))
print("%-40s %-20s %-20s" % ("termos comparados", ma[0], mb[0]))
print("%-40s %-20s %-20s" % ("mediana da correlação (ref ≥ 0,987)", ma[1].rstrip(","), mb[1].rstrip(",")))
print("%-40s %-20s %-20s" % ("mediana da diferença (ref ≤ 1,9)", ma[2].rstrip(","), mb[2].rstrip(",")))
print("%-40s %-20s %-20s" % ("mediana a ≤ 2 (ref ≥ 72,5%)", ma[3], mb[3]))
print("%-40s %-20s %-20s" % ("pedidos abaixo por inteiro", len(ia), len(ib)))
for n, l in (("funcao × pytrends", ia), ("pytrends-2 × pytrends", ib)):
    print("\n abaixo por inteiro, %s:" % n)
    for x in l or ["nenhum"]: print("   " + x)
print("\nTOP 5 — funcao | pytrends | pytrends-2   (o pytrends-2 de saúde mental calculou-se sem o pedido que falhou)")
for e in ["saude-mental", "alimentacao", "menopausa", "emergentes"]:
    t = [d["top5"][e] for d in (F, P, P2)]; nm = [[x for x, _ in l] for l in t]
    print("== %s — funcao×pytrends %d de 5, ordem %s | pytrends-2×pytrends %d de 5, ordem %s" % (
        e, len(set(nm[0]) & set(nm[1])), "igual" if nm[0] == nm[1] else "muda",
        len(set(nm[2]) & set(nm[1])), "igual" if nm[2] == nm[1] else "muda"))
    for i in range(5): print("   %d. " % (i + 1) + "  |  ".join("%-18s %6.1f" % (l[i][0][:18], l[i][1]) for l in t))
