#!/usr/bin/env python3
"""Terceiro teste à Google Trends Research API (getTimelinesForHealth). 05/11/2026.

Parte do teste_2.py (docs/evidencia/2026-11-05-teste-2-health-api/).

Pedido 1 — o que faz o "+". A descrição de terms no documento de descoberta (revision
20260804) diz: "can include ORs using '+' sign". O "+" soma os valores (conta duas vezes a
mesma sessão) ou é um OU que conta cada sessão uma vez?
Pedido 2 — quanto pesa cada forma da área Ansiedade em Portugal (24 termos).

Endpoint: GET https://www.googleapis.com/trends/v1beta/timelinesForHealth
  terms (repetível), geoRestriction.country, timelineResolution, time.startDate, time.endDate

Codificação: espaços como %20 e "+" como %2B, para que o valor descodificado no servidor
contenha o carácter "+". Verificada no URL montado ANTES de enviar: se algum termo não
descodificar para si mesmo, ou se houver "+" ou espaço literal na query, não se envia nada
e sai com código 4.

Segurança: a chave lê-se do ambiente ou de ~/.config/health-pulse/env só antes do primeiro
pedido, vai no cabeçalho X-Goog-Api-Key, nunca no URL, e não se imprime; todo o texto de
erro e todas as respostas cruas passam por tapar(). Não escreve no Supabase.

Escreve tudo na pasta deste script: uma resposta crua por pedido (com a hora no nome) e
saida.txt. No ecrã não escreve nada. Se a pasta já tiver saida.txt ou alguma resposta
(pedido_*.json), não faz pedido nenhum e sai com código 2 — para não haver uma segunda
corrida por engano.

Associação linha → termo: se vierem tantas linhas como termos pedidos, pela ordem (o teste 2
mostrou a ordem preservada), e cada linha cujo nome devolvido difira do pedido fica anotada;
isto evita que "ansiedade+pânico" e "ansiedade + pânico" se confundam se o Google devolver o
mesmo nome para os dois. Se o número diferir, só por nome exacto e único; o resto fica
sem associação e anotado.

Critérios fixados antes do resultado:
- "C ≈ A+B": |C − (A+B)| ≤ 0,5 % de (A+B); com A+B = 0, só se C = 0.
- Pares de acento "iguais": |dif| ≤ 0,5 % do maior; também se conta a igualdade exacta.
- Semana com um ponto sem 'value' numa das séries: não comparável, contada à parte.
"""
import datetime as dt
import glob
import json
import os
import statistics
import sys
import time
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
TOL = 0.005  # 0,5 %

P1 = [
    "ansiedade",
    "ansiedade sintomas",
    "ansiedade+ansiedade sintomas",
    "pânico",
    "ansiedade+pânico",
    "ansiedade + pânico",
    "/m/0k_9",
    "/m/0k_9+ansiedade",
]
# (A, B, C)
TRIOS = [
    ("ansiedade", "ansiedade sintomas", "ansiedade+ansiedade sintomas"),
    ("ansiedade", "pânico", "ansiedade+pânico"),
    ("ansiedade", "pânico", "ansiedade + pânico"),
    ("/m/0k_9", "ansiedade", "/m/0k_9+ansiedade"),
]

ORIGEM_HQ = "health_questions (leitura do Cowork, 05/11) ou teste 2"
ORIGEM_COWORK = "candidato proposto pelo Cowork; NÃO aparece em health_questions"
P2 = [
    ("/m/0k_9", ORIGEM_HQ),
    ("ansiedade", ORIGEM_HQ),
    ("crise de ansiedade", ORIGEM_HQ),
    ("ataque de ansiedade", ORIGEM_HQ),
    ("pânico", ORIGEM_HQ),
    ("panico", ORIGEM_HQ),
    ("crise de pânico", ORIGEM_HQ),
    ("ataque de pânico", ORIGEM_HQ),
    ("síndrome do pânico", ORIGEM_HQ),
    ("sindrome do panico", ORIGEM_HQ),
    ("transtorno de ansiedade", ORIGEM_HQ),
    ("perturbação de ansiedade", ORIGEM_HQ),
    ("perturbação de pânico", ORIGEM_HQ),
    ("fobia social", ORIGEM_HQ),
    ("agorafobia", ORIGEM_HQ),
    ("fobia", ORIGEM_HQ),
    ("calmantes", ORIGEM_HQ),
    ("calmante para ansiedade", ORIGEM_HQ),
    ("calmantes naturais para ansiedade", ORIGEM_HQ),
    ("alprazolam", ORIGEM_HQ),
    ("diazepam", ORIGEM_HQ),
    ("xanax", ORIGEM_COWORK),
    ("victan", ORIGEM_COWORK),
    ("lorazepam", ORIGEM_COWORK),
]
PARES_ACENTO = [("pânico", "panico"), ("síndrome do pânico", "sindrome do panico")]

PEDIDOS = [
    (1, "mais", P1),
    (2, "area-ansiedade", [t for t, _ in P2]),
]

PASTA = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(PASTA, "saida.txt")

if os.path.exists(SAIDA) or glob.glob(os.path.join(PASTA, "pedido_*.json")):
    sys.exit(2)

# Limites do guia: até 30 termos e 2000 pontos (52 semanas) por pedido.
for _, _, termos in PEDIDOS:
    if len(termos) > 30 or len(termos) * 52 > 2000 or len(set(termos)) != len(termos):
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
    # acentos em UTF-8 %XX. No teste 2 o tópico foi assim (%2Fm%2F0k_9) e deu HTTP 200.
    q = urllib.parse.urlencode([("terms", t) for t in termos] + COMUNS,
                               quote_via=urllib.parse.quote)
    return BASE + "?" + q, q


def verificar(q, termos):
    """Descodifica a query como o servidor a lê e confirma que cada termo volta igual.
    Devolve a lista de problemas (vazia se está tudo bem)."""
    probs = []
    if "+" in q:
        probs.append("'+' literal na query (o servidor lê-lo-ia como espaço)")
    if " " in q:
        probs.append("espaço literal na query")
    pares = [kv.split("=", 1) for kv in q.split("&")]
    vistos = [urllib.parse.unquote(v) for k, v in pares if k == "terms"]
    if vistos != termos:
        probs.append("termos descodificados %r != pedidos %r" % (vistos, termos))
    return probs


def codificado(q, termo):
    alvo = urllib.parse.quote(termo, safe="")  # como o urlencode: '/' também vira %2F
    for kv in q.split("&"):
        if kv == "terms=" + alvo:
            return kv
    return None


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
    """{data: valor}; ponto sem 'value' conta como None (pode ser um 0 omitido)."""
    s = {}
    for pt in linha.get("points", []):
        d = ler_data(str(pt.get("date", "")))
        s[d if d else pt.get("date")] = pt.get("value")
    return s


def mediana(s):
    vals = [v for v in s.values() if v is not None]
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
    p("  %-36s pontos %3d | zeros %2d | sem value %2d | buracos %d | %s"
      % (repr(nome), len(s), zeros, sem, saltos, mm))
    if datas:
        p("  %-36s de %s a %s" % ("", datas[0], datas[-1]))


def associar(linhas, termos):
    """Devolve {termo pedido: linha}. Ver docstring do módulo."""
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
            p("  nota: termo pedido %r sem linha associada" % t)
    return m


def trio(a_n, b_n, c_n, A, B, C):
    p("\n=== A=%r  B=%r  C=%r ===" % (a_n, b_n, c_n))
    if A is None or B is None or C is None:
        p("  não comparável: falta uma das séries")
        return
    datas = sorted(d for d in C if d in A and d in B)
    cont = {"≈": 0, "entre": 0, "abaixo": 0, "acima": 0}
    nc = 0
    p("  %-12s %12s %12s %12s %12s %9s  %s"
      % ("semana", "A", "B", "A+B", "C", "C/(A+B)", "classe"))
    for d in datas:
        a, b, c = A[d], B[d], C[d]
        if a is None or b is None or c is None:
            nc += 1
            p("  %-12s %12s %12s %12s %12s %9s  não comparável" % (d, a, b, "—", c, "—"))
            continue
        soma = a + b
        if (soma == 0 and c == 0) or (soma > 0 and abs(c - soma) <= TOL * soma):
            k = "≈"
        elif c > soma:
            k = "acima"
        elif c >= max(a, b):
            k = "entre"
        else:
            k = "abaixo"
        cont[k] += 1
        r = "%.4f" % (c / soma) if soma else "—"
        p("  %-12s %12.4f %12.4f %12.4f %12.4f %9s  %s" % (d, a, b, soma, c, r, k))
    so = [d for d in set(A) | set(B) | set(C) if d not in datas]
    if so:
        p("  semanas que não estão nas três séries: %s" % sorted(map(str, so)))
    p("  semanas comparadas: %d (não comparáveis: %d)" % (sum(cont.values()), nc))
    p("    C ≈ A+B (|dif| ≤ 0,5 %%):      %d" % cont["≈"])
    p("    max(A,B) ≤ C < A+B:            %d" % cont["entre"])
    p("    C < max(A,B):                  %d" % cont["abaixo"])
    p("    C > A+B:                       %d" % cont["acima"])
    ma, mb, mc = mediana(A), mediana(B), mediana(C)
    if None not in (ma, mb, mc) and ma + mb:
        p("  medianas: A %.4f | B %.4f | A+B %.4f | C %.4f | rácio C/(A+B) %.4f"
          % (ma, mb, ma + mb, mc, mc / (ma + mb)))


def lado_a_lado(rot_a, rot_b, A, B, titulo):
    """Compara duas séries semana a semana: iguais (≤ 0,5 %), diferentes, um zero e outro não."""
    p("\n=== %s: %r vs %r ===" % (titulo, rot_a, rot_b))
    if A is None or B is None:
        p("  não comparável: falta uma das séries")
        return
    datas = sorted(d for d in A if d in B)
    exactos = iguais = difs = um_zero = ambos_zero = nc = 0
    p("  %-12s %14s %14s %9s  %s" % ("semana", rot_a[:14], rot_b[:14], "dif %", "classe"))
    for d in datas:
        a, b = A[d], B[d]
        if a is None or b is None:
            nc += 1
            p("  %-12s %14s %14s %9s  não comparável" % (d, a, b, "—"))
            continue
        if a == 0 and b == 0:
            ambos_zero += 1
            k, pc = "ambos zero", "—"
        elif a == 0 or b == 0:
            um_zero += 1
            k, pc = "um zero, outro não", "—"
        else:
            m = max(a, b)
            pc = "%+.4f" % ((b - a) / a * 100)
            if abs(a - b) <= TOL * m:
                iguais += 1
                exactos += a == b
                k = "iguais" + (" (exacto)" if a == b else "")
            else:
                difs += 1
                k = "diferentes"
        p("  %-12s %14.4f %14.4f %9s  %s" % (d, a, b, pc, k))
    so = [d for d in set(A) | set(B) if d not in datas]
    if so:
        p("  semanas só numa das séries: %s" % sorted(map(str, so)))
    p("  semanas: %d | iguais (≤ 0,5 %%) %d, das quais exactas %d | diferentes %d | "
      "um zero e outro não %d | ambos zero %d | não comparáveis %d"
      % (len(datas), iguais, exactos, difs, um_zero, ambos_zero, nc))
    ma, mb = mediana(A), mediana(B)
    if ma is not None and mb is not None:
        p("  medianas: %r %.4f | %r %.4f" % (rot_a, ma, rot_b, mb))


# --- Montar e verificar os URLs antes de tocar na chave -------------------------------------
p("Teste 3 à Health API — %s (hora da máquina)" % dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
p("Comuns: %s" % COMUNS)
p("Valores = probabilidade × 10 milhões; não é o índice 0–100 do Trends público.")
p("Critério 'C ≈ A+B' e 'iguais': |dif| ≤ 0,5 %; fixado antes da corrida.")

urls = {}
for n, rotulo, termos in PEDIDOS:
    url, q = montar(termos)
    probs = verificar(q, termos)
    if probs:
        p("\nPedido %d: codificação ERRADA — nada enviado:" % n)
        for x in probs:
            p("  " + x)
        out.close()
        sys.exit(4)
    urls[n] = url
p("\nCodificação verificada antes de enviar: nos 2 pedidos, cada termo descodifica para si "
  "mesmo; nenhum '+' nem espaço literal na query.")
q1 = urls[1].split("?", 1)[1]
for t in ("ansiedade+pânico", "ansiedade + pânico", "/m/0k_9+ansiedade"):
    p("  %r  ->  %s" % (t, codificado(q1, t)))

p("\nOrigem dos termos do pedido 2:")
for t, o in P2:
    p("  %-36s %s" % (t, o))

# --- Pedidos --------------------------------------------------------------------------------
chave = ler_chave()
series = {}  # (n.º do pedido, termo pedido) -> {data: valor}
for i, (n, rotulo, termos) in enumerate(PEDIDOS):
    if i:
        time.sleep(1.5)  # guia: pelo menos 1 s entre pedidos
    p("\n### Pedido %d (%s): %d termo(s): %s" % (n, rotulo, len(termos), termos))
    url = urls[n]
    codigo, corpo, erro = pedir(chave, url)
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
    for t, l in associar(linhas, termos).items():
        s = serie(l)
        series[(n, t)] = s
        resumo(t, s)
del chave

# --- Leitura do pedido 1 --------------------------------------------------------------------
p("\n\n######## Pedido 1 — o que faz o '+' ########")
for a, b, c in TRIOS:
    trio(a, b, c, series.get((1, a)), series.get((1, b)), series.get((1, c)))
lado_a_lado("ansiedade+pânico", "ansiedade + pânico",
            series.get((1, "ansiedade+pânico")), series.get((1, "ansiedade + pânico")),
            "com e sem espaços à volta do '+'")

# --- Leitura do pedido 2 --------------------------------------------------------------------
p("\n\n######## Pedido 2 — formas da área Ansiedade ########")
m_top = mediana(series.get((2, "/m/0k_9"), {}))
m_ans = mediana(series.get((2, "ansiedade"), {}))
p("  %-36s %5s %9s %9s %9s %9s %9s  %s"
  % ("termo", "zeros", "mín", "mediana", "máx", "/tópico", "/ansied.", "origem"))
for t, o in P2:
    s = series.get((2, t))
    if s is None:
        p("  %-36s sem série" % t)
        continue
    vals = [v for v in s.values() if v is not None]
    zeros = sum(1 for v in vals if v == 0)
    if not vals:
        p("  %-36s sem valores" % t)
        continue
    md = statistics.median(vals)
    rt = "%.4f" % (md / m_top) if m_top else "—"
    ra = "%.4f" % (md / m_ans) if m_ans else "—"
    marca = "" if o == ORIGEM_HQ else "  [candidato Cowork, fora de health_questions]"
    p("  %-36s %2d/%-2d %9.1f %9.1f %9.1f %9s %9s%s"
      % (t, zeros, len(s), min(vals), md, max(vals), rt, ra, marca))
for a, b in PARES_ACENTO:
    lado_a_lado(a, b, series.get((2, a)), series.get((2, b)), "par de acento")

p("\nfim")
out.close()
