#!/usr/bin/env python3
"""
Analise da classificacao humana das 100 noticias — 15/09/2026.

Reproduz todos os numeros de classificacao-100-resultados.md. Nao toca na base de dados.

Entradas:
  ../../arquivo/2026-09-15-news-items-viva/amostra-100-TRABALHO-v2.csv  (classificacao da Marta)
  ./keywords-2026-09-15.json                                            (82 keywords activas)

A "regra nova" simulada e a das quatro decisoes de 15/09:
  fronteira de palavra + procura so no titulo + sem as sete siglas de tres letras.
"""
import csv, json, re, collections, math, hashlib, os

AQUI = os.path.dirname(os.path.abspath(__file__))
AM   = os.path.join(AQUI,'..','..','arquivo','2026-09-15-news-items-viva','amostra-100-TRABALHO-v2.csv')
KW   = os.path.join(AQUI,'keywords-2026-09-15.json')
TRES = {'POC','OCD','PEA','AMR','SII','SOP','THS'}

def sha256(p):
    h=hashlib.sha256()
    with open(p,'rb') as f:
        for b in iter(lambda: f.read(65536), b''): h.update(b)
    return h.hexdigest()

def wilson(k,n,z=1.96):
    """Intervalo de confianca de 95% para uma proporcao (Wilson score)."""
    if n==0: return (0.0,0.0)
    p=k/n; d=1+z*z/n; c=(p+z*z/(2*n))/d
    h=z*math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d
    return (max(0,c-h)*100, min(1,c+h)*100)

def fronteira(t,x): return re.search(r'(?<!\w)'+re.escape(t.lower())+r'(?!\w)',x.lower()) is not None

def main():
    am=list(csv.DictReader(open(AM,encoding='utf-8')))
    kws=json.load(open(KW,encoding='utf-8'))
    ent=[(t,c) for r in kws
               for t,c in ([(r['term'],r['term'])]+[(s,r['term']) for s in (r.get('synonyms') or [])])
               if t not in TRES]
    R=lambda r:(r['ROTULO_CORRECTO_S_N'] or '').strip().upper()[:1]
    P=lambda r:(r['PERTENCE_AO_CORPUS_S_N'] or '').strip().upper()[:1]
    n=len(am)

    print('='*72); print('CLASSIFICACAO HUMANA DAS 100 — 15/09/2026'); print('='*72)
    print(f'amostra-100-TRABALHO-v2.csv  sha256 {sha256(AM)}')
    print(f'keywords-2026-09-15.json     sha256 {sha256(KW)}')
    print(f'linhas: {n}')

    print('\n[1] AS DUAS MEDIDAS, SEPARADAS')
    for f,nome in [(R,'rotulo ERRADO'),(P,'NAO pertence ao corpus')]:
        c=collections.Counter(f(r) for r in am); lo,hi=wilson(c['N'],n)
        print(f'    {nome:24} {c["N"]:3}/{n}  IC95% [{lo:.1f}% ; {hi:.1f}%]   (S={c["S"]}, D={c["D"]})')
    c1=collections.Counter((r['1a_PASSAGEM_S_N_D'] or '').strip().upper()[:1] for r in am)
    print(f'    {"1a passagem (mistura)":24} {c1["N"]:3}/{n}   <- media das duas perguntas, nao mede nenhuma')

    print('\n[2] OS QUATRO QUADRANTES')
    q=collections.Counter((R(r),P(r)) for r in am)
    print(f'    {"":20}{"pertence S":>13}{"pertence N":>13}{"pertence D":>13}')
    for rr,lab in [('S','rotulo certo'),('N','rotulo errado'),('D','rotulo duvidoso')]:
        print(f'    {lab:20}'+''.join(f'{q[(rr,pp)]:>13}' for pp in ['S','N','D']))
    print(f'\n    certo + pertence (fica) .............. {q[("S","S")]}')
    print(f'    ERRADO + pertence (re-rotular) ....... {q[("N","S")]}')
    print(f'    errado + nao pertence (sai) .......... {q[("N","N")]}')
    print(f'    certo + NAO pertence ("caso Pepa") ... {q[("S","N")]}')

    print('\n[3] POR TIPO DE FONTE')
    t=collections.defaultdict(collections.Counter)
    for r in am:
        t[r['source_type']]['n']+=1
        if R(r)=='N': t[r['source_type']]['rot']+=1
        if P(r)=='N': t[r['source_type']]['pert']+=1
        if P(r)=='D': t[r['source_type']]['pertD']+=1
    for st,v in sorted(t.items(),key=lambda x:-x[1]['n']):
        m=v['n']; a,b=wilson(v['rot'],m); c,d=wilson(v['pert'],m)
        print(f'    {st:14} n={m:3} | rotulo errado {v["rot"]:3} ({v["rot"]/m*100:4.0f}%) IC[{a:.0f};{b:.0f}]'
              f' | nao pertence {v["pert"]:3} ({v["pert"]/m*100:4.0f}%) IC[{c:.0f};{d:.0f}] | pertence=D {v["pertD"]}')

    print('\n[4] O QUE A REGRA NOVA FAZ')
    res={}
    for r in am:
        m=sorted({cc for tt,cc in ent if fronteira(tt,r['titulo_limpo'])})
        res[r['n']]='cai' if not m else ('mantem' if r['related_term'] in m else 'muda')
    err=[r for r in am if R(r)=='N']; resolv=[r for r in err if res[r['n']] in ('cai','muda')]
    pert=[r for r in am if P(r)=='S']; perd=[r for r in pert if res[r['n']]=='cai']
    print(f'    dos {len(err)} com rotulo errado, resolve {len(resolv)} ({len(resolv)/len(err)*100:.0f}%)')
    print(f'    das {len(pert)} que pertencem, deita fora {len(perd)} ({len(perd)/len(pert)*100:.0f}%)')

    print('\n[5] AS QUE PERTENCEM E CAEM — e porque')
    for r in perd:
        print(f'    [{r["source_type"][:5]:5}] {r["titulo_limpo"][:66]}')
        print(f'            rotulo {r["related_term"]!r} ({"certo" if R(r)=="S" else "errado"})')

    print('\n[6] A LISTA: quantas palavras tem cada termo canonico')
    w=collections.Counter(len(r['term'].split()) for r in kws)
    for k in sorted(w): print(f'    {k} palavra(s): {w[k]:3}')
    multi=[r for r in kws if len(r['term'].split())>1]
    semsin=[r['term'] for r in multi if not (r.get('synonyms') or [])]
    print(f'    multi-palavra: {len(multi)} de {len(kws)} ({len(multi)/len(kws)*100:.0f}%)')
    print(f'    multi-palavra SEM sinonimo nenhum: {len(semsin)}')
    for s in sorted(semsin): print(f'      - {s}')

if __name__=='__main__': main()
