#!/usr/bin/env python3
"""testar_gravar_atomico.py — uma falha de rede a meio do gravar() deixa o lote inteiro? (sem rede)
=================================================================================================
15/10/2026, sessão 31. Aceitação do gravar() tudo-ou-nada (docs/sessoes/2026-10-15.md §1),
depois da falha de 14/10 (2026-10-14.md §10): o DELETE passou, o POST seguinte rebentou com
SSLError e o lote ficou vazio.

    python3 scripts/testar_gravar_atomico.py

Uma base falsa guarda as linhas por lote e responde como o PostgREST: DELETE e POST em
trends_alertas, cada um com o seu commit; POST rpc/gravar_alertas_lote, que faz como a função
da base (recusa a lista vazia; apaga e escreve tudo, ou nada).

Para cada pedido de escrita em trends_alertas (o DELETE, cada bloco, ou a chamada à função),
simula a rede a cair de duas maneiras:
  antes   — o pedido não chega à base (o caso de 14/10)          o lote tem de ficar COMO ESTAVA
  depois  — a base fez o commit e a resposta perde-se            o lote tem de ficar como estava
                                                                 ou NOVO INTEIRO, nunca outra coisa
Pelos dois caminhos que gravam: trends_alertas.py --lote ... --gravar, e o passo 7 do script 5
(que além disso tem de dizer que os alertas falharam, para o main sair com 4).

O lote de teste tem 1201 linhas: com o gravar() de 14/10 são 1 DELETE + 3 blocos de 500.
O teste é o mesmo para o código antigo e para o novo; contra o antigo TEM de falhar.
"""
import importlib.util, io, json, os, ssl, sys
from contextlib import redirect_stdout

AQUI = os.path.dirname(os.path.abspath(__file__))

def carrega(nome, ficheiro):
    spec = importlib.util.spec_from_file_location(nome, os.path.join(AQUI, ficheiro))
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m

TA = carrega("trends_alertas", "trends_alertas.py")
sys.modules["trends_alertas"] = TA   # o passo 7 faz `import trends_alertas`
S5 = carrega("script5", "5_fetch_google_trends.py")

falhas = []
def verifica(nome, ok, detalhe=""):
    print("  %-4s %s%s" % ("ok" if ok else "FALHA", nome, "" if ok else "  — " + detalhe))
    if not ok: falhas.append(nome)

LOTE = "lote-teste-0000"
def linha(i, tipo, valor):
    return dict(eixo="e%d" % (i % 4), termo="t%04d" % i, semana="2025-03-09", tipo=tipo, valor=valor,
                referencia=4.0, razao=valor / 4, z=3.0, ruido=2.0, fator_sazonal=None, max_anterior=None,
                semana_n=1, inicio="2025-03-09")
ANTIGAS = [dict(linha(i, "a_observar", 8.0), lote_id=LOTE) for i in range(394)]
NOVAS = [linha(i, "subida", 10.0) for i in range(1201)]
def chave(r): return (r["eixo"], r["termo"], r["semana"])
def retrato(linhas): return sorted((chave(r), r["tipo"], r["valor"]) for r in linhas)
ANTES = retrato(ANTIGAS); NOVO = retrato(dict(r, lote_id=LOTE) for r in NOVAS)

class Base:
    """A base falsa. falha = (n, quando): o n-ésimo pedido de escrita em trends_alertas
    rebenta 'antes' de a base o aplicar, ou 'depois' (aplicado e com commit, resposta perdida)."""
    def __init__(self, falha=None):
        self.linhas = {LOTE: [dict(r) for r in ANTIGAS]}; self.falha = falha; self.escritas = 0
    def rest(self, url, key, path, method="GET", body=None, *resto, **kw):
        if body is not None: json.dumps(body)                      # o urllib manda JSON
        alvo = path.split("?")[0]
        if alvo.startswith("trends_pedidos"): return [dict(id="ped-x")]
        if alvo not in ("trends_alertas", "rpc/gravar_alertas_lote") or method == "GET": return None
        self.escritas += 1
        aplica = lambda: self.aplica(path, method, body)
        if self.falha and self.falha[0] == self.escritas:
            if self.falha[1] == "depois": aplica()
            raise ssl.SSLError("[SSL: SSLV3_ALERT_BAD_RECORD_MAC] sslv3 alert bad record mac (simulado)")
        return aplica()
    def aplica(self, path, method, body):
        if path.startswith("rpc/gravar_alertas_lote"):             # a função: uma transacção
            if not body["p_linhas"]: raise RuntimeError("gravar_alertas_lote: lista vazia recusada")
            self.linhas[body["p_lote_id"]] = [dict(r, lote_id=body["p_lote_id"]) for r in body["p_linhas"]]
            return len(body["p_linhas"])
        if method == "DELETE":
            self.linhas[path.split("lote_id=eq.")[1]] = []; return None
        for r in body: self.linhas.setdefault(r["lote_id"], []).append(dict(r))
        return None
    def lote(self): return retrato(self.linhas.get(LOTE, []))

def pelo_lote(base):
    """trends_alertas.py --lote ... --gravar, com as 1201 linhas novas."""
    TA.rest = base.rest
    TA.env_publico = lambda: ("http://x", "anon")
    TA.chave_service_role = lambda: "service"
    TA.series_do_lote = lambda url, key, lote_id: ({("e0", "t0000"): {"2025-03-09": 10}}, {("e0", "t0000"): 1.0})
    TA.calcula = lambda series, factor: [dict(r) for r in NOVAS]
    TA_rest_get = base.rest
    def rest(url, key, path, method="GET", body=None, *a, **kw):
        if path.startswith("trends_lotes"): return [dict(id=LOTE, estado="completo", iniciado_em="x", n_pedidos=1)]
        return TA_rest_get(url, key, path, method, body, *a, **kw)
    TA.rest = rest
    sys.argv = ["trends_alertas.py", "--lote", LOTE[:8], "--gravar"]
    out = io.StringIO(); erro = None
    with redirect_stdout(out):
        try: TA.main()
        except BaseException as e: erro = e
    return erro, out.getvalue(), None

class Args: timeframe = "today 5-y"
def pelo_passo7(base):
    """O passo 7 do script 5, sobre um lote acabado de gravar."""
    S5.rest = base.rest; TA.rest = base.rest
    TA.series_brutas = lambda linhas: ({("e0", "t0000"): {"2025-03-09": 10}}, {("e0", "t0000"): 1.0})
    TA.calcula = lambda series, factor: [dict(r) for r in NOVAS]
    out = io.StringIO(); erro = None; ok = None
    with redirect_stdout(out):
        try: ok = S5.escrever_lote("http://x", "service", dict(id=LOTE), [], [], dict(falhados=0, pontos=0), Args(), [])
        except BaseException as e: erro = e
    return erro, out.getvalue(), ok

for nome, corre in (("--lote … --gravar", pelo_lote), ("passo 7 do script 5", pelo_passo7)):
    print("\n%s" % nome.upper())
    base = Base(); erro, texto, ok = corre(base); n = base.escritas
    verifica("sem falha: o lote fica com as %d linhas novas (%d pedido(s) de escrita)" % (len(NOVAS), n),
             erro is None and base.lote() == NOVO and ok in (None, True), "erro %r, %d linhas" % (erro, len(base.lote())))
    for k in range(1, n + 1):
        for quando in ("antes", "depois"):
            base = Base((k, quando)); erro, texto, ok = corre(base); obtido = base.lote()
            estado = "como estava" if obtido == ANTES else "novo inteiro" if obtido == NOVO else "%d linhas" % len(obtido)
            aceites = (ANTES,) if quando == "antes" else (ANTES, NOVO)
            verifica("rede cai %s do pedido %d de %d → lote %s" % (quando, k, n, estado),
                     obtido in aceites, "esperado: como estava" + ("" if quando == "antes" else " ou novo inteiro"))
            if nome.startswith("passo"):
                verifica("   e o passo 7 diz que os alertas falharam (saída 4) e nomeia o recálculo",
                         ok is False and erro is None and "trends_alertas.py --lote" in texto,
                         "ok %r, erro %r" % (ok, erro))
            else:
                verifica("   e o --lote não diz que gravou", erro is not None and "GRAVADO" not in texto, repr(erro))

print("\nLISTA VAZIA — não apaga o lote")
base = Base(); TA.rest = base.rest
try: TA.gravar("http://x", "service", LOTE, []); erro = None
except BaseException as e: erro = e
verifica("gravar(…, []) levanta erro e o lote fica como estava", erro is not None and base.lote() == ANTES,
         "erro %r, %d linhas" % (erro, len(base.lote())))

print("\n%s" % ("TODOS OS CASOS PASSARAM" if not falhas else "%d FALHA(S)" % len(falhas)))
sys.exit(1 if falhas else 0)
