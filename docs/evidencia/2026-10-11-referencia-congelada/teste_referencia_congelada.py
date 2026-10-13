"""Teste da referência congelada — critério em docs/sessoes/2026-10-11.md §2.
Só SELECT com a chave pública. Corre da raiz do repositório:
  .venv-trends/bin/python <este ficheiro> <pasta de saída>
"""
import sys, os, json
from datetime import date, timedelta
from collections import Counter
sys.path.insert(0, os.path.join(os.getcwd(), 'scripts'))
import trends_alertas as TA

SAIDA = sys.argv[1]
LOTES = ['ec6cc6fc', '11031356', '87b4fba4', 'fe58e0e5', '3bbae660']
PARES = [(1, 'ec6cc6fc', '11031356'), (2, '11031356', '87b4fba4'),
         (3, '87b4fba4', 'fe58e0e5'), (4, 'fe58e0e5', '3bbae660')]
ARRANQUES = (13, 26, 52)   # 26 é o do veredicto; 13 e 52 só para leitura

url, key = TA.env_publico()
ids = {l['id'][:8]: l['id'] for l in TA.rest(url, key, 'trends_lotes?select=id')}
out = {'lotes': {}, 'verificacoes': {}, 'pares': {}}
txt = []
def p(*a):
    s = ' '.join(str(x) for x in a); print(s); txt.append(s)

# ---- 1. recalcular os alertas de cada lote e verificar contra o gravado ----
dados = {}
for c in LOTES:
    series, factor = TA.series_do_lote(url, key, ids[c])
    linhas = TA.calcula(series, factor)
    gravadas = TA.rest(url, key, f'trends_alertas?select=eixo,termo,semana,tipo,semana_n&lote_id=eq.{ids[c]}')
    inicio = min(min(s) for s in series.values())
    dados[c] = dict(series=series, linhas=linhas, inicio=inicio)
    cr = Counter(l['tipo'] for l in linhas); cg = Counter(g['tipo'] for g in gravadas)
    ok = len(linhas) == len(gravadas)
    out['lotes'][c] = dict(id=ids[c], termos=len(series), primeira_semana=inicio,
                           linhas_recalculadas=len(linhas), linhas_gravadas=len(gravadas),
                           por_tipo_recalc=dict(cr), por_tipo_gravado=dict(cg), igual=ok)
    p(f'lote {c}: {len(series)} termos, 1.ª semana {inicio}, recalculadas {len(linhas)}, '
      f'gravadas {len(gravadas)} -> {"IGUAL" if ok else "DIFERENTE"}')

def disp_curso(linhas, nomes):
    d = sum(1 for l in linhas if l['tipo'] == 'subida' and l['semana_n'] == 1 and l['termo'] in nomes)
    e = sum(1 for l in linhas if l['tipo'] == 'subida' and l['semana_n'] > 1 and l['termo'] in nomes)
    return d, e

nomes1 = {t for _, t in dados['ec6cc6fc']['series']} & {t for _, t in dados['11031356']['series']}
v1 = disp_curso(dados['ec6cc6fc']['linhas'], nomes1); v2 = disp_curso(dados['11031356']['linhas'], nomes1)
ok_par1 = len(nomes1) == 33 and v1 == (47, 48) and v2 == (39, 74)
out['verificacoes'] = dict(linhas_iguais=all(v['igual'] for v in out['lotes'].values()),
                           par1_nomes_comuns=len(nomes1), par1_18_09=v1, par1_24_09=v2,
                           par1_reproduz=ok_par1)
p(f'par 1 pelo nome: {len(nomes1)} termos; 18/09 disparos/em curso {v1}; 24/09 {v2} '
  f'-> {"REPRODUZ 47/48 e 39/74" if ok_par1 else "NÃO REPRODUZ"}')

if not (out['verificacoes']['linhas_iguais'] and ok_par1):
    p('VERIFICAÇÃO PRÉVIA FALHOU — sem veredicto.')
    json.dump(out, open(os.path.join(SAIDA, 'resultado.json'), 'w'), ensure_ascii=False, indent=1, default=str)
    open(os.path.join(SAIDA, 'resultado.txt'), 'w').write('\n'.join(txt) + '\n')
    sys.exit(1)

# ---- 2. comparar os pares ----
def estado(linhas):
    """(eixo, termo, semana) -> início do acontecimento de subida."""
    return {(l['eixo'], l['termo'], l['semana']): l['inicio'] for l in linhas if l['tipo'] == 'subida'}

def mais_semanas(d, n):
    return (date.fromisoformat(d) + timedelta(weeks=n)).isoformat()

for n, a, b in PARES:
    A, B = dados[a], dados[b]
    ea, eb = estado(A['linhas']), estado(B['linhas'])
    comuns = sorted(set(A['series']) & set(B['series']))
    mudou = A['inicio'] != B['inicio']
    desloc = (date.fromisoformat(B['inicio']) - date.fromisoformat(A['inicio'])).days // 7
    limites = {k: mais_semanas(B['inicio'], k) for k in ARRANQUES}
    termo_semanas = 0; disc = []
    semanas_comuns = set()
    for k in comuns:
        sb = sorted(B['series'][k])
        if len(sb) <= TA.N_REF: continue
        desde = sb[TA.N_REF]
        ws = sorted(w for w in set(A['series'][k]) & set(B['series'][k]) if w >= desde)
        termo_semanas += len(ws); semanas_comuns |= set(ws)
        for w in ws:
            ia, ib = ea.get((k[0], k[1], w)), eb.get((k[0], k[1], w))
            if (ia is None) != (ib is None):
                inicios = [i for i in (ia, ib) if i is not None]
                disc.append(dict(eixo=k[0], termo=k[1], semana=w,
                                 em_subida='anterior' if ia else 'seguinte', inicio=inicios[0],
                                 **{f'arranque_{q}': (w < limites[q] or min(inicios) < limites[q]) for q in ARRANQUES}))
    ult8 = sorted(semanas_comuns)[-8:]
    d_ult8 = sum(1 for x in disc if x['semana'] in set(ult8))
    res = dict(anterior=a, seguinte=b, primeira_semana_anterior=A['inicio'], primeira_semana_seguinte=B['inicio'],
               janela_mudou=mudou, deslocamento_semanas=desloc, termos_comuns=len(comuns), termo_semanas=termo_semanas,
               periodo=[min(semanas_comuns), max(semanas_comuns)] if semanas_comuns else None,
               discordancias=len(disc),
               de_arranque={q: sum(1 for x in disc if x[f'arranque_{q}']) for q in ARRANQUES},
               ultimas_8_semanas=ult8, discordancias_ultimas_8=d_ult8,
               por_termo=Counter(f"{x['eixo']}/{x['termo']}" for x in disc).most_common(),
               lista=disc)
    res['F'] = {q: (res['de_arranque'][q] / len(disc) if disc else None) for q in ARRANQUES}
    out['pares'][n] = res
    p(f"\npar {n}: {a} -> {b}")
    p(f"  1.ª semana: {A['inicio']} -> {B['inicio']}  ({'mudou, ' + str(desloc) + ' sem.' if mudou else 'NÃO mudou'})")
    p(f"  termos comuns (eixo, termo): {len(comuns)}; termo-semanas comparadas: {termo_semanas}; período {res['periodo']}")
    p(f"  discordâncias: {len(disc)}; de arranque 13/26/52: "
      + ' / '.join(f"{res['de_arranque'][q]} ({res['F'][q]:.3f})" if disc else f"{res['de_arranque'][q]}" for q in ARRANQUES))
    p(f"  últimas 8 semanas comuns ({ult8[0]} a {ult8[-1]}): {d_ult8} discordâncias")
    if not mudou and disc:
        p("  NOTA: a 1.ª semana não mudou — estas discordâncias não vêm de desfasamento da janela.")
    for t, c in res['por_termo'][:10]:
        p(f"    {t}: {c}")

# ---- 3. veredicto, só pares 2 a 4, arranque = 26 ----
D = sum(out['pares'][n]['discordancias'] for n in (2, 3, 4))
DA = sum(out['pares'][n]['de_arranque'][26] for n in (2, 3, 4))
F = DA / D if D else None
pares_fracos = [n for n in (2, 3, 4) if out['pares'][n]['discordancias'] >= 10 and out['pares'][n]['F'][26] < 0.5]
if D >= 20 and F >= 2/3 and not pares_fracos: v = 'PASSA'
elif D >= 20 and F < 1/3: v = 'NÃO PASSA'
else: v = 'INCONCLUSIVO'
out['veredicto'] = dict(D=D, de_arranque=DA, F=F, pares_com_10_ou_mais_abaixo_de_meio=pares_fracos, veredicto=v)
p(f"\nVEREDICTO (pares 2–4, arranque 26): D = {D}, de arranque = {DA}, F = {F if F is None else round(F, 3)}, "
  f"pares ≥10 com fracção < ½: {pares_fracos} -> {v}")

json.dump(out, open(os.path.join(SAIDA, 'resultado.json'), 'w'), ensure_ascii=False, indent=1, default=str)
open(os.path.join(SAIDA, 'resultado.txt'), 'w').write('\n'.join(txt) + '\n')
