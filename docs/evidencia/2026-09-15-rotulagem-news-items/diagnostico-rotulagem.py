#!/usr/bin/env python3
"""
Diagnostico da rotulagem de news_items — 15/09/2026.

Reproduz todos os numeros do README.md desta pasta. Nao toca na base de dados:
le dois ficheiros versionados, para que o resultado seja o mesmo hoje e daqui a um ano.

Entradas:
  ./keywords-2026-09-15.json                     (instantaneo das 82 keywords activas)
  ../../arquivo/2026-09-15-news-items-viva/news_items_viva.csv  (as 310 noticias da instancia viva)

LIMITE, e vale para tudo o que sai daqui:
  A funcao de recolha procura no titulo MAIS os primeiros 200 caracteres da descricao
  (fetch-rss-feeds/index.ts:209). A descricao NAO e guardada em news_items — so existiu
  em memoria no momento da recolha. Logo tudo o que este script mede e medido SO no
  titulo, e e limite inferior: uma linha sem vestigio no titulo pode ter sido rotulada
  por texto legitimo que ja nao existe em lado nenhum.
"""
import json, csv, re, collections, hashlib, os, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
KW   = os.path.join(AQUI, 'keywords-2026-09-15.json')
NEWS = os.path.join(AQUI, '..', '..', 'arquivo', '2026-09-15-news-items-viva', 'news_items_viva.csv')

def sha256(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(65536), b''): h.update(b)
    return h.hexdigest()

def fronteira(termo, texto):
    """Casa o termo como palavra inteira (nao como subcadeia)."""
    return re.search(r'(?<!\w)' + re.escape(termo.lower()) + r'(?!\w)', texto.lower()) is not None

def subcadeia(termo, texto):
    """O criterio actual da funcao: qualquer ocorrencia da sequencia de letras."""
    return termo.lower() in texto.lower()

def main():
    kws  = json.load(open(KW, encoding='utf-8'))
    news = list(csv.DictReader(open(NEWS, encoding='utf-8')))

    print('=' * 72)
    print('DIAGNOSTICO DA ROTULAGEM — news_items da instancia viva')
    print('=' * 72)
    print(f'keywords-2026-09-15.json  sha256 {sha256(KW)}')
    print(f'news_items_viva.csv       sha256 {sha256(NEWS)}')

    # lista de busca: cada termo canonico mais os seus sinonimos
    entradas, por_canonico = [], {}
    for r in kws:
        entradas.append((r['term'], r['term']))
        por_canonico[r['term']] = [r['term']] + list(r.get('synonyms') or [])
        for s in (r.get('synonyms') or []):
            entradas.append((s, r['term']))
    n_sin = sum(len(r.get('synonyms') or []) for r in kws)

    print(f'\n[1] INVENTARIO')
    print(f'    keywords activas ............ {len(kws)}')
    print(f'    sinonimos ................... {n_sin}')
    print(f'    entradas na lista de busca .. {len(entradas)}')
    print(f'    noticias .................... {len(news)}')

    # -----------------------------------------------------------------
    print(f'\n[2] O ROTULO ACTUAL TEM APOIO NO TITULO?')
    cat = collections.Counter(); por_termo = collections.defaultdict(collections.Counter)
    for r in news:
        ct, titulo = r['related_term'], r['title']
        lst = por_canonico.get(ct, [ct])
        if   any(fronteira(t, titulo) for t in lst): k = 'A_palavra_inteira'
        elif any(subcadeia(t, titulo) for t in lst): k = 'B_so_subcadeia'
        else:                                        k = 'C_sem_vestigio'
        cat[k] += 1; por_termo[ct][k] += 1
    for k in ['A_palavra_inteira', 'B_so_subcadeia', 'C_sem_vestigio']:
        print(f'    {cat[k]:4}  {cat[k]/len(news)*100:5.1f}%  {k}')
    print('    (C = rotulado por texto da descricao, que nao foi guardado)')

    print(f'\n[3] OS DOIS ROTULOS QUE DOMINAM O CORPUS')
    tot = collections.Counter({t: sum(v.values()) for t, v in por_termo.items()})
    soma = 0
    for t, n in tot.most_common(5):
        v = por_termo[t]; soma += n if t in ('candidíase', 'perturbação obsessivo-compulsiva') else 0
        print(f'    {t:38} n={n:3} ({n/len(news)*100:4.1f}%)  palavra-inteira={v["A_palavra_inteira"]:3} '
              f'so-subcadeia={v["B_so_subcadeia"]:3} sem-vestigio={v["C_sem_vestigio"]:3}')
    print(f'    candidíase + perturbacao obsessivo-compulsiva = {soma} de {len(news)} '
          f'({soma/len(news)*100:.1f}%), zero com palavra inteira')

    # -----------------------------------------------------------------
    print(f'\n[4] SIGLAS E TERMOS CURTOS — correspondencias COM fronteira, no titulo')
    curtos = ['POC','OCD','PEA','AMR','SII','SOP','THS','PTSD','DRGE','TDAH','avc','azia','candida','candidíase']
    for s in curtos:
        hits = [r['title'] for r in news if fronteira(s, r['title'])]
        marca = '   <- corta' if len(hits) == 0 and len(s) == 3 and s.isupper() else ''
        print(f'    {s:12} {len(hits):3}{marca}')
        for h in hits[:2]: print(f'                 ex: {h[:64]}')

    # -----------------------------------------------------------------
    print(f'\n[5] COLISOES NO MAP DE RESOLUCAO (termToKeyword.set sobrescreve)')
    donos = collections.defaultdict(list)
    for r in kws:
        donos[r['term'].lower()].append(('TERMO', r['term']))
        for s in (r.get('synonyms') or []): donos[s.lower()].append(('sinonimo', r['term']))
    col = {k: v for k, v in donos.items() if len(v) > 1}
    print(f'    total: {len(col)}')
    for k, v in sorted(col.items()):
        print(f'    {k!r}')
        for tipo, canon in v: print(f'        {tipo:9} de -> {canon}')

    # -----------------------------------------------------------------
    print(f'\n[6] SIMULACAO — fronteiras de palavra, so no titulo')
    sem, com, multi = 0, 0, collections.Counter()
    for r in news:
        m = sorted({c for t, c in entradas if fronteira(t, r['title'])})
        if not m: sem += 1
        else:     com += 1; multi[len(m)] += 1
    print(f'    titulos SEM correspondencia .. {sem} de {len(news)} ({sem/len(news)*100:.1f}%)')
    print(f'    titulos COM correspondencia .. {com}')
    print(f'    nº de temas distintos por titulo: {dict(sorted(multi.items()))}')
    print('    (limite inferior — a descricao nao foi guardada)')

    # -----------------------------------------------------------------
    print(f'\n[7] O HOMONIMO — "depressao"')
    dep = [r for r in news if fronteira('depressão', r['title'])]
    print(f'    titulos com "depressão" como palavra inteira: {len(dep)} de {len(news)}')
    met = ['aviso amarelo','aviso laranja','aviso vermelho','ipma','trovoada','chuva',
           'vento','agitação marítima','frente fria','meteorolog','tempestade']
    n_met = 0
    for r in dep:
        marcas = [w for w in met if w in r['title'].lower()]
        if marcas: n_met += 1
        print(f'      [{r["related_term"]}] {r["title"][:72]}')
    print(f'    com marcador meteorologico no titulo: {n_met}')
    print('    (os dois casos meteorologicos conhecidos entraram pela DESCRICAO)')

    # -----------------------------------------------------------------
    print(f'\n[8] A SECCAO NO URL — sinal independente, ja guardado')
    NAO = {'mundo','desporto','fama','cultura','politica','economia','opiniao','artigos-de-opiniao'}
    SIM = {'tratar-da-saude'}
    AMB = {'pais','lifestyle','sociedade','noticias','programas','noticiario-antena1'}
    c = collections.Counter()
    for r in news:
        m = re.match(r'https?://[^/]+/(.*)', r['url'])
        segs = set(m.group(1).split('/')) if m else set()
        if   segs & NAO: c['nao-saude'] += 1
        elif segs & SIM: c['saude'] += 1
        elif segs & AMB: c['ambiguo'] += 1
        else:            c['sem-seccao'] += 1
    for k in ['nao-saude','saude','ambiguo','sem-seccao']:
        print(f'    {c[k]:4}  {c[k]/len(news)*100:5.1f}%  {k}')
    print('    RESSALVA: a divisao saude/nao-saude e juizo de quem escreveu este script')
    print('    sobre nomes de seccao que sao dos jornais. "opiniao" e forma, nao tema.')

    # -----------------------------------------------------------------
    print(f'\n[9] FONTE COMPROMETIDA')
    for r in news:
        if 'spesf.pt' in r['url']:
            print(f'    {r["date"]} | {r["outlet"]} | source_type={r["source_type"]} | rotulo={r["related_term"]}')
            print(f'      {r["title"][:80]}')
            print(f'      {r["url"][:100]}')

if __name__ == '__main__':
    main()
