#!/usr/bin/env python3
"""testar_via_funcao.py — a opção --via do script 5, testada SEM REDE
======================================================================
30/09/2026, sessão 22. Um servidor falso em 127.0.0.1 faz de trends-buscar-grupo (e do
/rest/v1/keywords, para a corrida de ponta a ponta). Qualquer ligação para fora de
127.0.0.1 é recusada pelo próprio teste — se algum caminho tentasse chegar ao Google ou ao
Supabase, o teste rebentava em vez de passar.

    .venv-trends/bin/python scripts/testar_via_funcao.py

O QUE PROVA
  · o formato de saída da pedir() é o mesmo pelas duas vias: a comparação corre o pytrends
    4.9.2 verdadeiro sobre a mesma timelineData, com só as duas saídas para a rede
    (GetGoogleCookie, _get_data) a devolverem respostas fixas;
  · "explore: HTTP 429" entra na espera e repetição que já existiam (uma vez só);
  · "sem_dados" dá série vazia, nunca 0;
  · sem SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY, pára com uma frase — não volta ao pytrends;
  · chave recusada (401/403) pára a corrida;
  · --gravar com a via funcao (ou com um dump feito por ela) pára antes de qualquer pedido;
  · por omissão a via é o pytrends e a função não é chamada;
  · a via fica escrita no output (linha VIA e RESUMO).
O QUE NÃO PROVA
  · que a função verdadeira responde assim — isso é a 1.ª janela, com a service_role verdadeira.
"""
import contextlib, importlib.util, io, json, os, socket, sys, tempfile, threading, types
from http.server import BaseHTTPRequestHandler, HTTPServer

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ── sem rede: só 127.0.0.1 ──────────────────────────────────────────────────
_connect = socket.socket.connect
def _so_local(self, addr):
    if addr[0] not in ("127.0.0.1", "localhost"):
        raise AssertionError("TENTOU SAIR PARA A REDE: %r" % (addr,))
    return _connect(self, addr)
socket.socket.connect = _so_local

# ── o servidor falso ────────────────────────────────────────────────────────
class Falso:
    respostas = []      # fila: (status_http, corpo_dict) para a função
    chamadas = []       # (auth, corpo) de cada POST à função
    leituras = []       # caminho de cada GET à base
    keywords = []       # linhas devolvidas pelo /rest/v1/keywords

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _responde(self, status, corpo):
        b = json.dumps(corpo).encode()
        self.send_response(status); self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        Falso.leituras.append(self.path)
        if self.path.startswith("/rest/v1/keywords"): return self._responde(200, Falso.keywords)
        self._responde(404, {})
    def do_POST(self):
        corpo = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        Falso.chamadas.append((self.headers.get("Authorization"), corpo))
        if self.path != "/functions/v1/trends-buscar-grupo": return self._responde(404, {})
        status, r = Falso.respostas.pop(0) if Falso.respostas else (200, gerar(corpo["termos"]))
        self._responde(status, r)

srv = HTTPServer(("127.0.0.1", 0), H)
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d" % srv.server_address[1]

# timelineData como o Google a dá (time em segundos, valores pela ordem dos termos)
TL = [{"time": "1727568000", "value": [50, 7, 0], "isPartial": None},
      {"time": "1728172800", "value": [61, 9, 3]},
      {"time": "1728777600", "value": [44, 12, 1], "isPartial": True}]
TERMOS = ["menopausa", "afrontamentos", "perimenopausa"]

def pontos_da_funcao(termos, tl):
    """o que a trends-buscar-grupo devolve (paraPontos, index.ts l.91–98)"""
    return [{"t": int(p["time"]), "valores": {t: p["value"][i] for i, t in enumerate(termos)},
             "parcial": p.get("isPartial") is True} for p in tl]

def gerar(termos):
    tl = [{"time": p["time"], "value": [50 - 10 * i for i in range(len(termos))]} for p in TL]
    return {"estado": "recolhido", "erro": None, "pontos": pontos_da_funcao(termos, tl),
            "aquecimento": {"tem_nid": True}, "milissegundos": 1}

def ok(status, pontos): return (200, {"estado": status, "erro": None, "pontos": pontos})
def falhou(erro): return (200, {"estado": "falhou", "erro": erro, "pontos": []})

# ── o script 5 ──────────────────────────────────────────────────────────────
spec = importlib.util.spec_from_file_location("script5", os.path.join(RAIZ, "scripts", "5_fetch_google_trends.py"))
S5 = importlib.util.module_from_spec(spec); spec.loader.exec_module(S5)
S5.CFG["espera_apos_429"] = 0; S5.CFG["pausa_segundos"] = 0

def ambiente(**kv):
    for k in ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY"): os.environ.pop(k, None)
    os.environ.update(kv)

def novo(respostas=()):
    Falso.respostas = list(respostas); Falso.chamadas = []; Falso.leituras = []

def saiu(f):
    """corre f; devolve (mensagem do sys.exit ou None, stdout, valor devolvido por f)"""
    out = io.StringIO()
    try:
        with contextlib.redirect_stdout(out): valor = f()
    except SystemExit as e:
        return str(e.code), out.getvalue(), None
    return None, out.getvalue(), valor

def main_com(*argv):
    sys.argv[1:] = list(argv)
    return saiu(S5.main)

falhas = []
def verifica(nome, cond, detalhe=""):
    print(("  OK    " if cond else "  FALHA ") + nome + ("" if cond else "  — " + detalhe))
    if not cond: falhas.append(nome)

CHAVE = "chave-falsa-do-teste"
ambiente(SUPABASE_URL=URL, SUPABASE_SERVICE_ROLE_KEY=CHAVE)

print("1. recolhido — o pedido que sai, e o formato que volta")
novo([ok("recolhido", pontos_da_funcao(TERMOS, TL))])
st, series, erro = S5.pedir(S5.Funcao(), TERMOS, "today 5-y")
auth, corpo = Falso.chamadas[0]
verifica("uma chamada, com a chave no Authorization", len(Falso.chamadas) == 1 and auth == "Bearer " + CHAVE)
verifica("corpo = termos, timeframe, categoria e geo do trends_grupos.json",
         corpo == dict(termos=TERMOS, timeframe="today 5-y", categoria=45, geo="PT"), repr(corpo))
verifica("estado recolhido, sem erro", (st, erro) == ("recolhido", None))

print("2. o formato é o mesmo que pelo pytrends (mesma timelineData)")
try:
    import warnings
    from pytrends.request import TrendReq
    # o pytrends VERDADEIRO; só os dois sítios onde sairia para a rede dão respostas fixas
    TrendReq.GetGoogleCookie = lambda self: {}
    TrendReq._get_data = lambda self, url, **k: (
        {"widgets": [{"id": "TIMESERIES", "token": "t", "request": {}}]} if url == TrendReq.GENERAL_URL
        else {"default": {"timelineData": TL}})
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", FutureWarning)   # aviso do pandas dentro do pytrends
        st_p, series_p, _ = S5.pedir(TrendReq(hl="pt-PT", tz=0, timeout=(10, 30), retries=0), TERMOS, "today 5-y")
    sys.modules.pop("pytrends", None); sys.modules.pop("pytrends.request", None)
    verifica("séries iguais, ponto a ponto (data UTC, valor int, parcial bool)", series == series_p,
             "\n    funcao:   %r\n    pytrends: %r" % (series.get("afrontamentos"), series_p.get("afrontamentos")))
    verifica("tipos iguais", [tuple(map(type, x)) for x in series["menopausa"]] == [tuple(map(type, x)) for x in series_p["menopausa"]])
except ImportError:
    verifica("pytrends disponível (correr com .venv-trends/bin/python)", False)

print("3. 'explore: HTTP 429' — espera e repete UMA vez")
novo([falhou("explore: HTTP 429"), ok("recolhido", pontos_da_funcao(TERMOS, TL))])
_, out, r = saiu(lambda: S5.pedir(S5.Funcao(), TERMOS, "today 5-y"))
verifica("à segunda tentativa: recolhido", r[0] == "recolhido" and len(Falso.chamadas) == 2, repr(r))
verifica("avisa da espera", "429 — espera de" in out, out)
novo([falhou("explore: HTTP 429"), falhou("explore: HTTP 429")])
_, _, r = saiu(lambda: S5.pedir(S5.Funcao(), TERMOS, "today 5-y"))
verifica("429 duas vezes: falhou, com o erro da função, e não tenta terceira",
         r[0] == "falhou" and "explore: HTTP 429" in r[2] and len(Falso.chamadas) == 2 and r[1] == {}, repr(r))

print("4. outro 'falhou' — não repete")
novo([falhou("explore: sem widget TIMESERIES")])
r = S5.pedir(S5.Funcao(), TERMOS, "today 5-y")
verifica("falhou, uma chamada só", r[0] == "falhou" and "sem widget" in r[2] and len(Falso.chamadas) == 1, repr(r))
novo([(500, {"error": "rebentou"})])
r = S5.pedir(S5.Funcao(), TERMOS, "today 5-y")
verifica("HTTP 500 da função: falhou, com o código no erro", r[0] == "falhou" and "HTTP 500" in r[2], repr(r))

print("5. sem_dados — série vazia, nunca 0")
novo([ok("sem_dados", [])])
r = S5.pedir(S5.Funcao(), TERMOS, "today 5-y")
verifica("(sem_dados, {}, None)", r == ("sem_dados", {}, None), repr(r))

print("6. chave recusada — pára")
for codigo in (401, 403):
    novo([(codigo, {"error": "x"})])
    msg, _, _ = saiu(lambda: S5.pedir(S5.Funcao(), TERMOS, "today 5-y"))
    verifica("HTTP %d: sys.exit com frase" % codigo, msg is not None and "recusou a chave (HTTP %d)" % codigo in msg, repr(msg))

print("7. faltam variáveis — pára, e não chama nada")
for falta in ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"):
    ambiente(**{k: v for k, v in (("SUPABASE_URL", URL), ("SUPABASE_SERVICE_ROLE_KEY", CHAVE)) if k != falta})
    novo(); sys.modules.pop("pytrends", None)
    msg, _, _ = main_com("--dry-run", "--via", "funcao")
    verifica("sem %s: pára com a frase, nenhuma chamada, pytrends não importado" % falta,
             msg is not None and falta in msg and "Não volta ao pytrends" in msg and not Falso.chamadas
             and "pytrends" not in sys.modules, repr(msg))
ambiente()
msg, _, _ = saiu(S5.Funcao)
verifica("sem as duas: a frase nomeia as duas", msg is not None and "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY" in msg, repr(msg))

print("8. ponta a ponta — --dry-run --via funcao --eixo menopausa")
ambiente(SUPABASE_URL=URL, SUPABASE_SERVICE_ROLE_KEY=CHAVE, SUPABASE_ANON_KEY="anon-falsa")
Falso.keywords = [{"term": t, "axis": "menopausa"} for t in TERMOS]
novo()
DUMP = os.path.join(tempfile.mkdtemp(), "dump-via-funcao.json")
msg, out, _ = main_com("--dry-run", "--via", "funcao", "--eixo", "menopausa", "--dump", DUMP)
resumo = json.loads(out.split("RESUMO ", 1)[1].splitlines()[0]) if "RESUMO " in out else {}
verifica("não saiu com erro", msg is None, repr(msg))
verifica("output diz 'VIA funcao'", "VIA funcao — %s/functions/v1/trends-buscar-grupo" % URL in out, out[:300])
verifica("RESUMO traz via=funcao", resumo.get("via") == "funcao", repr(resumo))
verifica("todos os pedidos foram à função falsa, e recolhidos",
         resumo.get("pedidos") == resumo.get("recolhidos") == sum(1 for _ in Falso.chamadas) > 0, repr(resumo))

print("9. tranca — --gravar com a via funcao pára antes de tudo")
for argv, nome in ((["--gravar", "--via", "funcao"], "--gravar --via funcao"),
                   (["--gravar", "--carregar", DUMP], "--gravar --carregar <dump feito com --via funcao>")):
    novo()
    msg, _, _ = main_com(*argv)
    verifica("%s: pára com a frase da regra, sem chamar a função nem a base" % nome,
             msg is not None and "A via funcao ainda não pode gravar" in msg and "trends_lotes_fonte_check" in msg
             and not Falso.chamadas and not Falso.leituras, "%r chamadas=%r leituras=%r" % (msg, Falso.chamadas, Falso.leituras))

print("10. por omissão — pytrends, e a função não é chamada")
usado = []
class TR:
    def __init__(self, **k): usado.append(k)
    def build_payload(self, *a, **k): raise Exception("pytrends falso: sem rede")
    def interest_over_time(self): pass
pk = types.ModuleType("pytrends"); pr = types.ModuleType("pytrends.request"); pr.TrendReq = TR
sys.modules["pytrends"], sys.modules["pytrends.request"] = pk, pr
novo()
msg, out, _ = main_com("--dry-run", "--eixo", "menopausa")
verifica("output diz 'VIA pytrends'", "VIA pytrends" in out, out[:300])
verifica("o TrendReq foi criado como antes", usado == [dict(hl="pt-PT", tz=0, timeout=(10, 30), retries=0)], repr(usado))
verifica("nenhuma chamada à função", not Falso.chamadas, repr(Falso.chamadas))
verifica("RESUMO traz via=pytrends", '"via": "pytrends"' in out)

srv.shutdown()
print()
print("TODOS OS TESTES PASSARAM" if not falhas else "FALHARAM %d: %s" % (len(falhas), "; ".join(falhas)))
sys.exit(1 if falhas else 0)
