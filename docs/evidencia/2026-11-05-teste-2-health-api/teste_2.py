#!/usr/bin/env python3
"""Segundo teste à Google Trends Research API (getTimelinesForHealth). 05/11/2026.

Perguntas: (a) o valor de um termo muda quando vai acompanhado no mesmo pedido?
(b) como se comportam os termos pequenos em PT? (c) a API aceita tópicos (/m/...)?

Endpoint e parâmetros: documento de descoberta oficial,
https://trends.googleapis.com/$discovery/rest?version=v1beta (revision 20260804).
GET https://www.googleapis.com/trends/v1beta/timelinesForHealth
  terms (repetível), geoRestriction.country, timelineResolution, time.startDate, time.endDate

Segurança: a chave lê-se do ambiente ou de ~/.config/health-pulse/env só no momento do
primeiro pedido, vai no cabeçalho X-Goog-Api-Key, nunca no URL, e não se imprime; todo o
texto de erro passa por tapar(). Não escreve no Supabase.

Escreve tudo na pasta deste script: uma resposta crua por pedido (com a hora no nome) e
saida.txt. No ecrã não escreve nada. Se saida.txt já existir, não faz pedido nenhum e sai
com código 2 — para não haver uma segunda corrida por engano.

Tópicos: cada --topico /m/... na linha de comando é um pedido à parte, sozinho, pela ordem
dada (o primeiro é o pedido 4, o segundo o 5, ...). Sem nenhum, ficam só os pedidos 1 a 3 e
o saida.txt diz que os de tópico não foram feitos. Os nomes em NOMES_TOPICOS foram lidos
pelo Cowork no site do Google Trends (Explorar, Portugal) a 05/11/2026; não são deduzidos.
"""
import datetime as dt
import json
import os
import statistics
import sys
import urllib.error
import urllib.parse
import urllib.request

NOME = "GOOGLE_HEALTH_TRENDS_API_KEY"
BASE = "https://www.googleapis.com/trends/v1beta/timelinesForHealth"
COMUNS = [
    ("geoRestriction.country", "PT"),
    ("timelineResolution", "week"),
    ("time.startDate", "2025-11-02"),
    ("time.endDate", "2026-10-31"),
]
ONZE = ["ansiedade", "psiquiatra", "menopausa", "colesterol alto", "avc", "menopausa precoce",
        "psicologa", "psicólogo", "lúpus", "sepsis", "insónia"]
NOMES_TOPICOS = {
    "/m/0k_9": "Ansiedade — Transtorno",
    "/m/03x69g": "Saúde mental — Assunto",
}
PASTA = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(PASTA, "saida.txt")

if os.path.exists(SAIDA):
    sys.exit(2)

topicos = []
for i, a in enumerate(sys.argv):
    if a == "--topico":
        t = sys.argv[i + 1] if i + 1 < len(sys.argv) else None
        if not t or not t.startswith("/"):
            sys.exit(3)
        topicos.append(t)
if len(set(topicos)) != len(topicos):
    sys.exit(3)  # o mesmo tópico duas vezes seria um pedido repetido

PEDIDOS = [
    (1, "ansiedade", ["ansiedade"]),
    (2, "onze", ONZE),
    (3, "menopausa-precoce", ["menopausa precoce"]),
]
for k, t in enumerate(topicos):
    PEDIDOS.append((4 + k, "topico" + t.replace("/", "-"), [t]))

out = open(SAIDA, "w")


def p(*a):
    print(*a, file=out)
    out.flush()


def ler_chave():
    v = os.environ.get(NOME)
    if v:
        return v
    cfg = os.path.expanduser("~/.config/health-pulse/env")
    if os.path.exists(cfg):
        with open(cfg) as f:
            for l in f:
                if l.startswith(NOME + "="):
                    return l.split("=", 1)[1].strip().strip('"')
    p("ERRO: falta %s — no ambiente ou no ficheiro de chaves." % NOME)
    sys.exit(1)


def tapar(texto, chave):
    return texto.replace(chave, "AIza***") if chave else texto


def ler_data(s):
    for fmt in ("%b %d %Y", "%Y-%m-%d", "%b %d, %Y"):
        try:
            return dt.datetime.strptime(s.strip(), fmt).date()
        except ValueError:
            pass
    return None


def pedir(chave, termos):
    # quote_via=quote: espaços como %20, não '+', que nesta API é o operador OR.
    q = urllib.parse.urlencode([("terms", t) for t in termos] + COMUNS,
                               quote_via=urllib.parse.quote)
    url = BASE + "?" + q
    req = urllib.request.Request(url, headers={"X-Goog-Api-Key": chave,
                                               "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return url, r.status, r.read().decode("utf-8", "replace"), None
    except urllib.error.HTTPError as e:
        return url, e.code, e.read().decode("utf-8", "replace"), "http"
    except Exception as e:  # rede, timeout, SSL
        return url, None, "%s: %s" % (type(e).__name__, e), "rede"


def serie(linha):
    """{data: valor}; ponto sem 'value' conta como None (pode ser um 0 omitido)."""
    s = {}
    for pt in linha.get("points", []):
        d = ler_data(str(pt.get("date", "")))
        s[d if d else pt.get("date")] = pt.get("value")
    return s


def resumo(nome, s):
    vals = [v for v in s.values() if v is not None]
    sem = sum(1 for v in s.values() if v is None)
    zeros = sum(1 for v in vals if v == 0)
    datas = sorted(d for d in s if isinstance(d, dt.date))
    saltos = sum(1 for a, b in zip(datas, datas[1:]) if (b - a).days != 7)
    if vals:
        mm = "mín %.1f | mediana %.1f | máx %.1f" % (min(vals), statistics.median(vals), max(vals))
    else:
        mm = "sem valores"
    p("  %-20s pontos %3d | zeros %2d | sem value %2d | buracos %d | %s"
      % (repr(nome), len(s), zeros, sem, saltos, mm))
    if datas:
        p("  %-20s de %s a %s" % ("", datas[0], datas[-1]))


def comparar(rotulo, a, b):
    """a = sozinho, b = no pedido de 11. Diferença (b - a) / a, por semana."""
    p("\n=== %s ===" % rotulo)
    if a is None or b is None:
        p("  não comparável: falta uma das séries")
        return
    comuns = sorted(d for d in a if d in b)
    difs = []
    p("  %-12s %16s %16s %9s" % ("semana", "sozinho", "no pedido de 11", "dif %"))
    for d in comuns:
        va, vb = a[d], b[d]
        if va is None or vb is None or va == 0:
            p("  %-12s %16s %16s %9s" % (d, va, vb, "—"))
            continue
        pc = (vb - va) / va * 100
        difs.append(pc)
        p("  %-12s %16.4f %16.4f %+9.4f" % (d, va, vb, pc))
    so_a = [d for d in a if d not in b]
    so_b = [d for d in b if d not in a]
    if so_a or so_b:
        p("  semanas só num dos pedidos: sozinho %s | no de 11 %s" % (so_a, so_b))
    if difs:
        ab = [abs(x) for x in difs]
        p("  semanas comparadas: %d | |dif| mediana %.4f %% | |dif| máxima %.4f %% | dif média %+.4f %%"
          % (len(difs), statistics.median(ab), max(ab), statistics.mean(difs)))
    else:
        p("  nenhuma semana comparável")


def racio(rotulo, nome_a, a, nome_b, b):
    """Rácio b/a por semana e rácio das medianas. Conta as semanas com b < a. Só números."""
    p("\n=== %s ===" % rotulo)
    if a is None or b is None:
        p("  não comparável: falta uma das séries")
        return
    comuns = sorted(d for d in a if d in b)
    rs, abaixo, iguais, acima = [], 0, 0, 0
    p("  %-12s %16s %16s %10s" % ("semana", nome_a, nome_b, "%s/%s" % (nome_b, nome_a)))
    for d in comuns:
        va, vb = a[d], b[d]
        if va is None or vb is None or va == 0:
            p("  %-12s %16s %16s %10s" % (d, va, vb, "—"))
            continue
        r = vb / va
        rs.append(r)
        abaixo += vb < va
        iguais += vb == va
        acima += vb > va
        p("  %-12s %16.4f %16.4f %10.4f" % (d, va, vb, r))
    so_a = [d for d in a if d not in b]
    so_b = [d for d in b if d not in a]
    if so_a or so_b:
        p("  semanas só numa das séries: %s %s | %s %s" % (nome_a, so_a, nome_b, so_b))
    va_ = [v for v in a.values() if v is not None]
    vb_ = [v for v in b.values() if v is not None]
    if rs:
        p("  semanas comparadas: %d | rácio semanal mín %.4f | mediana %.4f | máx %.4f"
          % (len(rs), min(rs), statistics.median(rs), max(rs)))
    if va_ and vb_ and statistics.median(va_):
        p("  mediana %s %.4f | mediana %s %.4f | rácio das medianas %s/%s %.4f"
          % (nome_a, statistics.median(va_), nome_b, statistics.median(vb_),
             nome_b, nome_a, statistics.median(vb_) / statistics.median(va_)))
    p("  semanas com %s abaixo de %s: %d | iguais: %d | acima: %d (de %d)"
      % (nome_b, nome_a, abaixo, iguais, acima, len(rs)))


p("Teste 2 à Health API — %s (hora da máquina)" % dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
p("Comuns: %s" % COMUNS)
p("Valores = probabilidade × 10 milhões; não é o índice 0–100 do Trends público.")
if not topicos:
    p("Pedidos de tópico: NÃO FEITOS — sem --topico.")
for k, t in enumerate(topicos):
    p("Pedido %d = tópico %s = %s" % (4 + k, t, NOMES_TOPICOS.get(t, "(nome não indicado)")))

chave = ler_chave()
series = {}  # (n.º do pedido, termo pedido) -> {data: valor}
for n, rotulo, termos in PEDIDOS:
    p("\n### Pedido %d (%s): %d termo(s): %s" % (n, rotulo, len(termos), termos))
    if n >= 4:
        p("Tópico: %s = %s" % (termos[0], NOMES_TOPICOS.get(termos[0], "(nome não indicado)")))
    url, codigo, corpo, erro = pedir(chave, termos)
    p("GET", url)
    p("HTTP", codigo)
    hora = dt.datetime.now().strftime("%H%M%S")
    cru = os.path.join(PASTA, "pedido_%d_%s_%s.json" % (n, rotulo, hora))
    with open(cru, "w") as f:
        f.write(tapar(corpo, chave))
    p("Resposta crua:", os.path.basename(cru))
    if erro:
        p("ERRO (%s). Mensagem tal como veio:" % erro)
        p(tapar(corpo, chave))
        continue
    try:
        linhas = json.loads(corpo).get("lines", [])
    except ValueError:
        p("Resposta não é JSON.")
        continue
    devolvidos = [l.get("term") for l in linhas]
    p("Termos devolvidos (%d): %s" % (len(devolvidos), devolvidos))
    if len(linhas) != len(termos):
        p("ATENÇÃO: pedidos %d termos, vieram %d linhas" % (len(termos), len(linhas)))
    for i, l in enumerate(linhas):
        s = serie(l)
        # Associa ao termo pedido pelo nome devolvido; se não casar, pela ordem.
        t = l.get("term")
        pedido = t if t in termos else (termos[i] if i < len(termos) else t)
        if pedido != t:
            p("  nota: linha %d devolvida como %r, associada a %r pela ordem" % (i, t, pedido))
        series[(n, pedido)] = s
        resumo(pedido, s)
del chave

comparar("ansiedade: pedido 1 (sozinha) vs pedido 2 (com 10 outros)",
         series.get((1, "ansiedade")), series.get((2, "ansiedade")))
comparar("menopausa precoce: pedido 3 (sozinha) vs pedido 2 (com 10 outros)",
         series.get((3, "menopausa precoce")), series.get((2, "menopausa precoce")))
t4 = topicos[0] if len(topicos) > 0 else None
t5 = topicos[1] if len(topicos) > 1 else None
racio("palavra 'ansiedade' (pedido 1) vs tópico %s (pedido 4)" % t4,
      "palavra", series.get((1, "ansiedade")),
      "topico", series.get((4, t4)) if t4 else None)
racio("tópico %s (pedido 5) vs tópico %s (pedido 4)" % (t5, t4),
      "ansiedade", series.get((4, t4)) if t4 else None,
      "saude_mental", series.get((5, t5)) if t5 else None)
p("\nfim")
out.close()
