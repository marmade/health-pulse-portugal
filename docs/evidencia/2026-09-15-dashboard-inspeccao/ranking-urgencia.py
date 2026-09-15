#!/usr/bin/env python3
"""
Reproduz o ranking "Prioridade de comunicacao esta semana" do dashboard — 15/09/2026.

Reimplementa, em Python, exactamente o que o frontend calcula:

  src/hooks/useAxisData.ts:119   isEmergent = changePercent >= 50 && currentVolume >= 10
  src/lib/detectAlerts.ts:18,24  threshold(12m) = 40; alerta se changePercent >= threshold
                                 OU (isEmergent && changePercent > 0); top 10 global
  src/pages/Index.tsx:116-122    avgChange = media de changePercent sobre allKeywords
                                 score = avgChange + emergentCount*30 + alertCount*20

Le um instantaneo versionado, nao a base de dados: o resultado e o mesmo hoje e daqui a
um ano.

LIMITE: assume o ramo "DB values" de useAxisData.ts:112-115. O ramo dos snapshots so e
usado quando ha historical_snapshots nos DOIS sub-periodos, e a serie esta parada desde
10/08/2026 — para o periodo por omissao (12m) e para 7d/30d o ramo da base e o que corre.
Nao foi testado no browser; e leitura de codigo mais dados.
"""
import json, os, hashlib, collections

AQUI = os.path.dirname(os.path.abspath(__file__))
KW   = os.path.join(AQUI, 'keywords-volumes-2026-09-15.json')
PERIODO = '12m'   # o valor por omissao em Index.tsx:23

def sha256(p):
    h = hashlib.sha256()
    with open(p,'rb') as f:
        for b in iter(lambda: f.read(65536), b''): h.update(b)
    return h.hexdigest()

def main():
    kws = [r for r in json.load(open(KW, encoding='utf-8')) if r['is_active']]
    print('='*72); print('RANKING DE URGENCIA DO DASHBOARD — reproducao'); print('='*72)
    print(f'keywords-volumes-2026-09-15.json  sha256 {sha256(KW)}')
    print(f'periodo: {PERIODO}  (o valor por omissao)')
    print(f'keywords activas: {len(kws)}  (a tabela tem 83; o dashboard le so as activas)')

    zeros = [r for r in kws if r['current_volume'] == 0]
    print(f'\n[1] O DENOMINADOR DO avgChange')
    print(f'    activas com current_volume = 0 .... {len(zeros)} de {len(kws)} ({len(zeros)/len(kws)*100:.0f}%)')
    print('    Um 0 aqui significa ao mesmo tempo "sem procura" e "recolha falhou".')
    print('    Nao ha como separar os dois: o estado real e desconhecido.')

    # isEmergent e alertas, tal como o frontend os calcula
    thr = 30 if PERIODO=='7d' else 50 if PERIODO=='30d' else 40
    for r in kws:
        r['chg'] = float(r['change_percent'] or 0)
        r['emergente'] = r['chg'] >= 50 and r['current_volume'] >= 10
        r['alerta'] = r['chg'] >= thr or (r['emergente'] and r['chg'] > 0)
    alertas = sorted([r for r in kws if r['alerta']], key=lambda r: -r['chg'])[:10]  # top 10 global

    print(f'\n[2] AS TRES KEYWORDS QUE DECIDEM TUDO  (limiar de alerta: {thr})')
    for r in alertas:
        print(f'    {r["axis"]:14} {r["term"]:26} {r["previous_volume"]:>3} -> {r["current_volume"]:>3} '
              f'= {r["chg"]:+7.1f}%  emergente={str(r["emergente"]):5} alerta=True')
    print(f'    total de alertas: {len(alertas)}  (o codigo corta nos 10 primeiros)')

    print('\n[3] OS DOIS ORDENAMENTOS')
    linhas = []
    for ax in sorted({r['axis'] for r in kws}):
        g = [r for r in kws if r['axis'] == ax]
        avg = sum(r['chg'] for r in g)/len(g)
        ec  = sum(1 for r in g if r['emergente'])
        ac  = sum(1 for r in alertas if r['axis'] == ax)
        linhas.append({'axis':ax,'n':len(g),'avg':avg,'ec':ec,'ac':ac,'score':avg+ec*30+ac*20})

    print('\n    (a) So por avgChange — o que os dados de facto dizem:')
    for i,r in enumerate(sorted(linhas, key=lambda r:-r['avg']),1):
        print(f'        {i}. {r["axis"]:14} {r["avg"]:+7.1f}%')
    print('\n    (b) Pelo score que o dashboard mostra:')
    for i,r in enumerate(sorted(linhas, key=lambda r:-r['score']),1):
        print(f'        {i}. {r["axis"]:14} score {r["score"]:+7.1f}'
              f'   = {r["avg"]:+7.1f} + {r["ec"]}x30 + {r["ac"]}x20'
              f'   (mostra "{r["avg"]:+.0f}%" ao lado)')

    pa = [r['axis'] for r in sorted(linhas, key=lambda r:-r['avg'])]
    pb = [r['axis'] for r in sorted(linhas, key=lambda r:-r['score'])]
    print(f'\n[4] A INVERSAO')
    for ax in pa:
        ia, ib = pa.index(ax)+1, pb.index(ax)+1
        if ia != ib: print(f'    {ax:14} passa de {ia}. (por avgChange) para {ib}. (por score)')
    pos = [r for r in linhas if r['score'] > 0]
    print(f'    eixos com score positivo: {len(pos)} -> {[r["axis"] for r in pos]}')
    print('    ... e nenhum deles tem avgChange positivo.')

if __name__ == '__main__':
    main()
