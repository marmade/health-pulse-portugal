#!/usr/bin/env python3
"""testar_acesso_funcoes.py — quem consegue chamar as três funções do arquivo e dos guiões
=========================================================================================
28/09/2026, sessão 20. Desde esta data a archive-weekly, a generate-guioes-weekly e a
generate-guiao-questions só aceitam a service_role. Este script prova-o pelo efeito:

    python3 scripts/testar_acesso_funcoes.py            # sem gastar créditos do Perplexity
    python3 scripts/testar_acesso_funcoes.py --com-ia   # + 1 chamada real ao Perplexity

O QUE ESPERAR
  · sem chave nenhuma     → 401, recusado à porta (verify_jwt);
  · com a chave anon      → 403, recusado pela função;
  · com a service_role    → 200.

O QUE A CHAMADA COM A SERVICE_ROLE FAZ, E PORQUE É INÓCUA
  · archive-weekly: a semana anterior já está arquivada → "already archived", nada escrito;
  · generate-guioes-weekly: os guiões da semana já estão "por rever" → não gera nada, não
    chama a IA;
  · generate-guiao-questions: gasta UMA chamada ao Perplexity e não escreve nada. Por isso
    só corre com --com-ia.
  Correr isto noutra semana, antes do arquivo e dos guiões existirem, JÁ NÃO É inócuo.

AS CHAVES
  A anon lê-se do workflow (é pública). A service_role lê-se de ~/.config/health-pulse/env,
  como no recolher_domingo.sh. Nenhuma das duas é impressa.
"""
import json
import os
import re
import sys
import urllib.error
import urllib.request

URL = "https://ijpxjpbjudaddfatibfl.supabase.co/functions/v1/"
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")


def chave_anon():
    t = open(os.path.join(RAIZ, ".github/workflows/youtube-trends.yml")).read()
    return re.search(r'SUPABASE_ANON_KEY:\s*["\']?([A-Za-z0-9._-]+)', t).group(1)


def chave_servico():
    k = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    cfg = os.path.expanduser("~/.config/health-pulse/env")
    if not k and os.path.exists(cfg):
        for l in open(cfg):
            if l.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                k = l.split("=", 1)[1].strip().strip('"').strip("'")
    if not k:
        sys.exit("ERRO: falta SUPABASE_SERVICE_ROLE_KEY.")
    return k


def chamar(funcao, chave, corpo):
    h = {"Content-Type": "application/json"}
    if chave:
        h["Authorization"] = "Bearer " + chave
    req = urllib.request.Request(URL + funcao, data=json.dumps(corpo).encode(), method="POST", headers=h)
    try:
        r = urllib.request.urlopen(req, timeout=120)
        return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


def dominios_permitidos():
    """A lista lida da própria função, para não haver duas cópias."""
    t = open(os.path.join(RAIZ, "supabase/functions/generate-guiao-questions/index.ts")).read()
    bloco = re.search(r"DOMINIOS_PERMITIDOS = \[(.*?)\];", t, re.S).group(1)
    return re.findall(r'"([^"]+)"', bloco)


def dentro_da_lista(url, lista):
    """Domínio: o próprio ou um subdomínio. Com caminho: mesmo domínio e o caminho começa assim."""
    m = re.match(r"https?://([^/]+)(/[^?#]*)?", url)
    if not m:
        return False
    host, caminho = m.group(1).lower(), m.group(2) or "/"
    for d in lista:
        dom, _, pref = d.partition("/")
        if host == dom or host.endswith("." + dom):
            if not pref or caminho.startswith("/" + pref):
                return True
    return False


def mostrar_fontes(texto):
    try:
        fontes = json.loads(texto).get("fontes_resposta", [])
    except ValueError:
        print("  (resposta não é JSON)")
        return 1
    lista = dominios_permitidos()
    fora = [f for f in fontes if not dentro_da_lista(f, lista)]
    print(f"\n  fontes da resposta: {len(fontes)} · fora da lista: {len(fora)}")
    for f in fontes:
        print(f"    {'FORA ' if f in fora else '     '}{f}")
    return len(fora)


def main():
    com_ia = "--com-ia" in sys.argv
    anon, servico = chave_anon(), chave_servico()
    corpo_ia = {"tema": "MENOPAUSA", "keywords": [{"term": "menopausa"}], "semana": "2026-09-21"}

    casos = [
        ("archive-weekly", {}, [("sem chave", None, 401), ("anon", anon, 403), ("service_role", servico, 200)]),
        ("generate-guioes-weekly", {}, [("sem chave", None, 401), ("anon", anon, 403), ("service_role", servico, 200)]),
        ("generate-guiao-questions", corpo_ia,
         [("sem chave", None, 401), ("anon", anon, 403)] + ([("service_role", servico, 200)] if com_ia else [])),
    ]

    falhas = 0
    for funcao, corpo, tentativas in casos:
        print(f"\n== {funcao}")
        for nome, chave, esperado in tentativas:
            codigo, texto = chamar(funcao, chave, corpo)
            ok = codigo == esperado
            falhas += not ok
            print(f"  {nome:<13} HTTP {codigo} (esperado {esperado}) {'OK' if ok else 'FALHOU'}")
            print(f"  {'':<13} {texto[:300]}")
            if funcao == "generate-guiao-questions" and nome == "service_role" and codigo == 200:
                falhas += mostrar_fontes(texto)
    if not com_ia:
        print("\n(generate-guiao-questions com service_role não testada: gasta créditos. Usar --com-ia.)")
    print(f"\n{'TUDO COMO ESPERADO' if falhas == 0 else f'{falhas} RESULTADO(S) INESPERADO(S)'}")
    sys.exit(1 if falhas else 0)


if __name__ == "__main__":
    main()
