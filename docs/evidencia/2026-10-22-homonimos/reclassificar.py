import json, re, sys, collections
kw = json.load(open(sys.argv[1]))
s = open(sys.argv[2]).read(); s = json.loads(s)["result"] if s.lstrip().startswith('{') else s
news = json.loads(s[s.index('[{"j"'): s.rindex('}]') + 2])[0]["j"]["news"]
# termo ou sinónimo → (termo canónico, id); o canónico de um termo é ele próprio, mesmo que
# apareça como sinónimo de outro ("ansiedade social" é termo e sinónimo de "fobia social")
# Um termo é sempre ele próprio. Um sinónimo de vários termos vai para o termo cujo nome o
# contém ("stress" → "stress sintomas", não "ansiedade"); senão, para o primeiro alfabético.
canon = {k["term"]: (k["term"], k["id"]) for k in kw}
donos = {}
for k in kw:
    for sy in (k["synonyms"] or []):
        if sy not in canon: donos.setdefault(sy, []).append(k)
for sy, ks in donos.items():
    ks.sort(key=lambda k: (sy.lower() not in k["term"].lower(), k["term"]))
    canon[sy] = (ks[0]["term"], ks[0]["id"])
L = r"[^\W_]"
sig = lambda x: re.fullmatch(r"[A-ZÀ-Ý]{2,5}", x) is not None
regs = [(t, re.compile(rf"(?<!{L}){re.escape(t)}(?!{L})", 0 if sig(t) else re.I)) for t in canon]
def casa(x):
    h = [t for t, r in regs if r.search(x)]
    return sorted(h, key=lambda z: (-len(z), z))[0] if h else None
linhas, cont = [], collections.Counter()
for n in news:
    c = casa(n["t"] or "")
    termo, kid = canon[c] if c else (None, None)
    cont["igual" if termo and termo.lower() == (n["r"] or "").lower() else ("outro" if termo else "sem")] += 1
    q = lambda v: "null" if v is None else "'" + v.replace("'", "''") + "'"
    linhas.append(f"({q(n['id'])}::uuid, {q(termo)}, {q(c)}, {q(kid)}::uuid)")
print(dict(cont), len(linhas), file=sys.stderr)
print("""-- Rotular de novo as notícias da v1 (docs/sessoes/2026-10-22.md §8). UMA instrução: corre
-- inteira ou não corre. Só linhas sem rotulado_de_novo_em e com created_at < 2026-09-22.
update public.news_items n set
  related_term_v1     = n.related_term,
  related_term        = v.termo,
  casou_por           = v.casou,
  keyword_id          = v.kid,
  rotulado_de_novo_em = now()
from (values
  """ + ",\n  ".join(linhas) + """
) as v(id, termo, casou, kid)
where n.id = v.id and n.rotulado_de_novo_em is null and n.created_at < '2026-09-22';""")
