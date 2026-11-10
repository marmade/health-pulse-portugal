#!/usr/bin/env python3
"""Quarto teste à Google Trends Research API (getTimelinesForHealth). 05/11/2026.

Parte do teste_3.py (docs/evidencia/2026-11-05-teste-3-health-api/). Um só pedido, 18 termos.

Perguntas:
(a) Ruído de cada série: o mesmo conjunto escrito de duas formas —
    "ansiedade+pânico" contra "pânico+ansiedade", e "ansiedade" contra "ansiedade+ansiedade".
(b) O tópico /m/0k_9 contém as outras séries? S = pânico+panico; fobia; os 5 medicamentos.
(c) Sobreposição das formas de acento: "pânico+panico" contra "pânico" e "panico".
(d) Os 5 medicamentos com "+" contra os 5 individuais.

Endpoint: GET https://www.googleapis.com/trends/v1beta/timelinesForHealth
  terms (repetível), geoRestriction.country, timelineResolution, time.startDate, time.endDate

Codificação: espaço -> %20, '+' -> %2B, '/' -> %2F, verificada no URL montado ANTES de enviar
(cada termo descodifica para si mesmo; nenhum '+' nem espaço literal; cada '+' de um termo
aparece como %2B). Se falhar, não se envia nada e sai com código 4.

Segurança: a chave lê-se do ambiente ou de ~/.config/health-pulse/env só antes do pedido,
vai no cabeçalho X-Goog-Api-Key, nunca no URL, e não se imprime; o texto de erro e a
resposta crua passam por tapar(). Não escreve no Supabase.

Escreve tudo na pasta deste script: a resposta crua (com a hora no nome) e saida.txt. No
ecrã não escreve nada. Se a pasta já tiver saida.txt ou alguma resposta (pedido_*.json), não
faz pedido nenhum e sai com código 2. Limites do guia (30 termos, 2000 pontos, sem
repetidos): código 3. Se a API recusar o pedido ou algum termo, regista o erro tal como vem
e o(s) termo(s) em falta, sem tentar alternativas.

Associação linha -> termo: como no teste 3 (pela ordem se o número de linhas bater, com nota
quando o nome devolvido difere; senão só por nome exacto e único).

=== Critérios, fixados antes da corrida ===

(a) Diferença semanal de um par (X, Y): |X − Y| / max(X, Y). Semana com X = Y = 0 conta como
    diferença 0 (exacta). Semana com um zero e o outro não dá 100 % e entra na conta.
    Por par: mediana e máximo dessa diferença, e semanas exactamente iguais (X == Y).
    MARGEM M = o maior dos dois máximos (em fracção). É o ruído medido nesta corrida.

(b), (c), (d) Cada caso tem uma série combinada C, uma referência baixa R_baixo e uma
    referência alta R_alto:
      (b) R_baixo = T = /m/0k_9           R_alto = T + S          C = /m/0k_9+S
      (c) R_baixo = max(pânico, panico)   R_alto = pânico + panico  C = pânico+panico
      (d) R_baixo = max dos 5             R_alto = soma dos 5      C = os 5 com '+'
    "perto de R" quer dizer |C − R| ≤ M × R (com R = 0, só se C = 0).
    Classes por semana (exclusivas, por esta ordem):
      ambas    — perto de R_baixo E perto de R_alto (S é pequena demais para separar)
      baixo    — perto de R_baixo só ((b): contida; (c), (d): perto do maior)
      alto     — perto de R_alto só  ((b): separada; (c), (d): perto da soma)
      entre    — R_baixo < C < R_alto, longe dos dois
      abaixo   — C < R_baixo, fora da margem
      acima    — C > R_alto, fora da margem
    Mais o rácio das medianas C/R_baixo e C/R_alto (medianas de cada série nas 52 semanas;
    para R_baixo e R_alto, mediana da série semanal calculada).
    Semana com um ponto sem 'value' em qualquer série do caso: não comparável, à parte.
"""
import datetime as dt
import glob
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
MEDS = ["victan", "diazepam", "alprazolam", "xanax", "lorazepam"]
MEDS_MAIS = "+".join(MEDS)
TERMOS = [
    "/m/0k_9",
    "ansiedade",
    "ansiedade+pânico",
    "pânico+ansiedade",
    "ansiedade+ansiedade",
    "pânico",
    "panico",
    "pânico+panico",
    "/m/0k_9+pânico+panico",
    "fobia",
    "/m/0k_9+fobia",
] + MEDS + [
    MEDS_MAIS,
    "/m/0k_9+" + MEDS_MAIS,
]
PARES_RUIDO = [("ansiedade+pânico", "pânico+ansiedade"), ("ansiedade", "ansiedade+ansiedade")]

PASTA = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(PASTA, "saida.txt")

if os.path.exists(SAIDA) or glob.glob(os.path.join(PASTA, "pedido_*.json")):
    sys.exit(2)
if len(TERMOS) != 18 or len(TERMOS) > 30 or len(TERMOS) * 52 > 2000 \
        or len(set(TERMOS)) != len(TERMOS):
    sys.exit(3)

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


def montar(termos):
    # quote_via=quote (o urlencode passa safe=''): espaço -> %20, '+' -> %2B, '/' -> %2F,
    # acentos em UTF-8 %XX. No teste 3 foi assim e deu HTTP 200.
    q = urllib.parse.urlencode([("terms", t) for t in termos] + COMUNS,
                               quote_via=urllib.parse.quote)
    return BASE + "?" + q, q


def verificar(q, termos):
    probs = []
    if "+" in q:
        probs.append("'+' literal na query (o servidor lê-lo-ia como espaço)")
    if " " in q:
        probs.append("espaço literal na query")
    vals = [kv.split("=", 1)[1] for kv in q.split("&") if kv.startswith("terms=")]
    vistos = [urllib.parse.unquote(v) for v in vals]
    if vistos != termos:
        probs.append("termos descodificados %r != pedidos %r" % (vistos, termos))
    for t, v in zip(termos, vals):
        if v.count("%2B") != t.count("+"):
            probs.append("termo %r: %d '+' mas %d '%%2B' em %s" % (t, t.count("+"), v.count("%2B"), v))
    return probs


def codificado(q, termo):
    alvo = "terms=" + urllib.parse.quote(termo, safe="")
    return alvo if alvo in q.split("&") else None


def pedir(chave, url):
    req = urllib.request.Request(url, headers={"X-Goog-Api-Key": chave,
                                               "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, r.read().decode("utf-8", "replace"), None
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace"), "http"
    except Exception as e:  # rede, timeout, SSL
        return None, "%s: %s" % (type(e).__name__, e), "rede"


def serie(linha):
    s = {}
    for pt in linha.get("points", []):
        d = ler_data(str(pt.get("date", "")))
        s[d if d else pt.get("date")] = pt.get("value")
    return s


def mediana_vals(vals):
    vals = [v for v in vals if v is not None]
    return statistics.median(vals) if vals else None


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
    p("  %-52s pontos %3d | zeros %2d | sem value %2d | buracos %d | %s"
      % (repr(nome), len(s), zeros, sem, saltos, mm))
    if datas:
        p("  %-52s de %s a %s" % ("", datas[0], datas[-1]))


def associar(linhas, termos):
    m = {}
    if len(linhas) == len(termos):
        for i, (l, t) in enumerate(zip(linhas, termos)):
            m[t] = l
            if l.get("term") != t:
                p("  nota: linha %d devolvida como %r, associada a %r pela ordem"
                  % (i, l.get("term"), t))
        return m
    p("  ATENÇÃO: pedidos %d termos, vieram %d linhas — associação só por nome exacto e único"
      % (len(termos), len(linhas)))
    nomes = [l.get("term") for l in linhas]
    for i, l in enumerate(linhas):
        t = l.get("term")
        if t in termos and nomes.count(t) == 1:
            m[t] = l
        else:
            p("  nota: linha %d (%r) sem associação" % (i, t))
    for t in termos:
        if t not in m:
            p("  TERMO SEM LINHA: %r" % t)
    return m


def ruido(x_n, y_n, X, Y):
    """Devolve o máximo da diferença semanal (fracção) ou None."""
    p("\n=== ruído: %r vs %r ===" % (x_n, y_n))
    if X is None or Y is None:
        p("  não comparável: falta uma das séries")
        return None
    datas = sorted(d for d in X if d in Y)
    difs, exactas, nc = [], 0, 0
    p("  %-12s %14s %14s %10s" % ("semana", x_n[:14], y_n[:14], "|dif| %"))
    for d in datas:
        x, y = X[d], Y[d]
        if x is None or y is None:
            nc += 1
            p("  %-12s %14s %14s %10s  não comparável" % (d, x, y, "—"))
            continue
        m = max(x, y)
        f = abs(x - y) / m if m else 0.0
        difs.append(f)
        exactas += x == y
        p("  %-12s %14.4f %14.4f %10.4f%s" % (d, x, y, f * 100, "  (exacta)" if x == y else ""))
    so = [d for d in set(X) | set(Y) if d not in datas]
    if so:
        p("  semanas só numa das séries: %s" % sorted(map(str, so)))
    if not difs:
        p("  nenhuma semana comparável")
        return None
    p("  semanas comparadas %d (não comparáveis %d) | exactamente iguais %d | "
      "|dif| mediana %.4f %% | |dif| máxima %.4f %%"
      % (len(difs), nc, exactas, statistics.median(difs) * 100, max(difs) * 100))
    return max(difs)


def perto(c, r, M):
    return c == 0 if r == 0 else abs(c - r) <= M * r


def caso(titulo, nome_c, C, comps, M, rot_baixo, rot_alto, baixo_fn):
    """comps: {nome: série}; R_alto = soma das comps; R_baixo = baixo_fn(valores das comps)."""
    p("\n=== %s ===" % titulo)
    p("  C = %r | R_baixo = %s | R_alto = %s | margem M = %.4f %%"
      % (nome_c, rot_baixo, rot_alto, M * 100))
    if C is None or any(s is None for s in comps.values()):
        p("  não comparável: falta uma das séries (%s)"
          % [n for n, s in list(comps.items()) + [(nome_c, C)] if s is None])
        return
    datas = sorted(d for d in C if all(d in s for s in comps.values()))
    cont = dict.fromkeys(["ambas", "baixo", "alto", "entre", "abaixo", "acima"], 0)
    nc = 0
    rb_s, ra_s = [], []
    p("  %-12s %12s %12s %12s %9s %9s  %s"
      % ("semana", "R_baixo", "R_alto", "C", "C/Rb", "C/Ra", "classe"))
    for d in datas:
        vs = [s[d] for s in comps.values()]
        c = C[d]
        if c is None or any(v is None for v in vs):
            nc += 1
            p("  %-12s não comparável" % d)
            continue
        rb, ra = baixo_fn(vs), sum(vs)
        rb_s.append(rb)
        ra_s.append(ra)
        pb, pa = perto(c, rb, M), perto(c, ra, M)
        if pb and pa:
            k = "ambas"
        elif pb:
            k = "baixo"
        elif pa:
            k = "alto"
        elif rb < c < ra:
            k = "entre"
        elif c < rb:
            k = "abaixo"
        else:
            k = "acima"
        cont[k] += 1
        p("  %-12s %12.4f %12.4f %12.4f %9s %9s  %s"
          % (d, rb, ra, c, "%.4f" % (c / rb) if rb else "—", "%.4f" % (c / ra) if ra else "—", k))
    p("  semanas comparadas: %d (não comparáveis: %d)" % (sum(cont.values()), nc))
    p("    perto das duas (não distingue):  %d" % cont["ambas"])
    p("    perto de R_baixo só (%s): %d" % (rot_baixo, cont["baixo"]))
    p("    perto de R_alto só (%s):  %d" % (rot_alto, cont["alto"]))
    p("    entre, longe das duas:           %d" % cont["entre"])
    p("    abaixo de R_baixo, fora da margem: %d" % cont["abaixo"])
    p("    acima de R_alto, fora da margem:   %d" % cont["acima"])
    mc, mb, ma = mediana_vals(C.values()), mediana_vals(rb_s), mediana_vals(ra_s)
    if None not in (mc, mb, ma):
        p("  medianas: C %.4f | R_baixo %.4f | R_alto %.4f | C/R_baixo %s | C/R_alto %s"
          % (mc, mb, ma, "%.4f" % (mc / mb) if mb else "—", "%.4f" % (mc / ma) if ma else "—"))


# --- Montar e verificar o URL antes de tocar na chave ---------------------------------------
p("Teste 4 à Health API — %s (hora da máquina)" % dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
p("Comuns: %s" % COMUNS)
p("Valores = probabilidade × 10 milhões; não é o índice 0–100 do Trends público.")
p("Critérios fixados antes da corrida: ver a docstring do teste_4.py.")

url, q = montar(TERMOS)
probs = verificar(q, TERMOS)
if probs:
    p("\nCodificação ERRADA — nada enviado:")
    for x in probs:
        p("  " + x)
    out.close()
    sys.exit(4)
p("\nCodificação verificada antes de enviar: cada termo descodifica para si mesmo; cada '+' "
  "chega como %2B; nenhum '+' nem espaço literal na query.")
for t in ("pânico+ansiedade", "ansiedade+ansiedade", "/m/0k_9+" + MEDS_MAIS):
    p("  %r  ->  %s" % (t, codificado(q, t)))

# --- Pedido ---------------------------------------------------------------------------------
chave = ler_chave()
series = {}
p("\n### Pedido 1 (ruido-e-conteudo): %d termo(s): %s" % (len(TERMOS), TERMOS))
codigo, corpo, erro = pedir(chave, url)
p("GET", url)
p("HTTP", codigo)
hora = dt.datetime.now().strftime("%H%M%S")
cru = os.path.join(PASTA, "pedido_1_ruido-e-conteudo_%s.json" % hora)
with open(cru, "w") as f:
    f.write(tapar(corpo, chave))
p("Resposta crua:", os.path.basename(cru))
if erro:
    p("ERRO (%s). Mensagem tal como veio:" % erro)
    p(tapar(corpo, chave))
    p("Termos do pedido recusado: %s" % TERMOS)
    p("Sem alternativas tentadas.")
else:
    try:
        linhas = json.loads(corpo).get("lines", [])
    except ValueError:
        linhas = None
        p("Resposta não é JSON.")
    if linhas is not None:
        p("Termos devolvidos (%d): %s" % (len(linhas), [l.get("term") for l in linhas]))
        for t, l in associar(linhas, TERMOS).items():
            s = serie(l)
            series[t] = s
            resumo(t, s)
del chave

# --- (a) ruído ------------------------------------------------------------------------------
p("\n\n######## (a) Ruído: o mesmo conjunto escrito de duas formas ########")
maximos = [ruido(x, y, series.get(x), series.get(y)) for x, y in PARES_RUIDO]
validos = [m for m in maximos if m is not None]
if len(validos) == 2:
    M = max(validos)
    p("\nMARGEM M = %.4f %% (o maior dos dois máximos)" % (M * 100))
elif validos:
    M = validos[0]
    p("\nMARGEM M = %.4f %% — ATENÇÃO: só um dos dois pares foi comparável" % (M * 100))
else:
    M = None
    p("\nMARGEM: não calculada (nenhum par comparável). (b), (c) e (d) não se fazem.")

# --- (b), (c), (d) --------------------------------------------------------------------------
if M is not None:
    T = series.get("/m/0k_9")
    p("\n\n######## (b) O tópico contém as outras séries? ########")
    for nome_s in ("pânico+panico", "fobia", MEDS_MAIS):
        caso("(b) T = /m/0k_9, S = %r" % nome_s, "/m/0k_9+" + nome_s,
             series.get("/m/0k_9+" + nome_s),
             {"T": T, "S": series.get(nome_s)}, M,
             "T (contida)", "T+S (separada)", lambda vs: vs[0])
    p("\n\n######## (c) Formas de acento ########")
    caso("(c) pânico+panico contra pânico e panico", "pânico+panico",
         series.get("pânico+panico"),
         {"pânico": series.get("pânico"), "panico": series.get("panico")}, M,
         "max(pânico, panico)", "pânico + panico", max)
    p("\n\n######## (d) Medicamentos ########")
    caso("(d) os 5 com '+' contra os 5 individuais", MEDS_MAIS, series.get(MEDS_MAIS),
         {m: series.get(m) for m in MEDS}, M,
         "max dos 5", "soma dos 5", max)

p("\nfim")
out.close()
