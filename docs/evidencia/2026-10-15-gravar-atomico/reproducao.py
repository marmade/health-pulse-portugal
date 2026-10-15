"""reproducao.py — ponto 2 da aceitação (2026-10-11.md §4.1): depois do --gravar, o recálculo pela
base é igual ao gravado, linha a linha, em (eixo, termo, semana, tipo, semana_n)? Só leitura,
pela chave pública. Compara também os números gravados (valor, referencia, razao, z, ruido,
fator_sazonal, max_anterior, inicio) depois do arredondamento a 3 casas que o gravar() faz.

    python3 docs/evidencia/2026-10-15-gravar-atomico/reproducao.py <exportação trends_alertas .json>
"""
import importlib.util, json, os, sys
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
spec = importlib.util.spec_from_file_location("TA", os.path.join(RAIZ, "scripts", "trends_alertas.py"))
TA = importlib.util.module_from_spec(spec); spec.loader.exec_module(TA)
url, anon = TA.env_publico()
gravado = json.load(open(sys.argv[1]))
NUM = ("valor", "referencia", "razao", "z", "ruido", "fator_sazonal", "max_anterior")
def n(v): return None if v is None else round(float(v), 3)
tudo_igual = True
for lote in sorted({g["lote_id"] for g in gravado}):
    rec = TA.calcula(*TA.series_do_lote(url, anon, lote))
    a = {(l["eixo"], l["termo"], l["semana"], l["tipo"], l["semana_n"]): l for l in rec}
    b = {(g["eixo"], g["termo"], g["semana"], g["tipo"], g["semana_n"]): g for g in gravado if g["lote_id"] == lote}
    so_rec, so_grav = sorted(set(a) - set(b)), sorted(set(b) - set(a))
    numeros = [k for k in set(a) & set(b)
               if any(n(a[k][c]) != n(b[k][c]) for c in NUM) or a[k]["inicio"] != b[k]["inicio"]]
    ok = not so_rec and not so_grav and not numeros
    tudo_igual &= ok
    print(json.dumps(dict(lote=lote[:8], recalculo=len(a), gravado=len(b), so_recalculo=len(so_rec),
                          so_gravado=len(so_grav), numeros_diferentes=len(numeros),
                          exemplos=[list(k) for k in (so_rec + so_grav + numeros)[:3]],
                          veredicto="IGUAL" if ok else "DIFERENTE"), ensure_ascii=False))
print("TODOS IGUAIS" if tudo_igual else "HÁ DIFERENÇAS")
sys.exit(0 if tudo_igual else 1)
