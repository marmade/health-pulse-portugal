#!/usr/bin/env python3
"""
Corrige os títulos da news_items com entidades HTML (16) e com o invólucro CDATA (125) —
decisões da Marta, 29/10/2026 (2026-10-29-cowork.md §14 e §15). Só muda o título.

Os títulos novos vêm de titulos-16.json e titulos-cdata-125.json, calculados com o limpar() de
supabase/functions/_shared/texto.ts. Nada é recalculado aqui.

COMO   python3 docs/evidencia/2026-10-29-titulos/corrigir_titulos.py --dry-run
       python3 docs/evidencia/2026-10-29-titulos/corrigir_titulos.py --gravar

O --gravar faz UM só pedido (upsert por id das linhas inteiras, iguais às lidas, só com o título
novo): é uma só instrução, entra tudo ou não entra nada. Antes de escrever confirma que cada linha
tem ainda o título "antes"; depois relê e confirma que só o título mudou.
"""
import argparse, hashlib, importlib.util, json, os, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(AQUI)))
spec = importlib.util.spec_from_file_location("s11", os.path.join(RAIZ, "scripts/11_fetch_fact_checks.py"))
s11 = importlib.util.module_from_spec(spec); spec.loader.exec_module(s11)

def impressao(linhas):
    """md5 de todas as colunas menos o título, por id — para provar que só o título mudou."""
    return {l["id"]: hashlib.md5(json.dumps({k: v for k, v in l.items() if k != "title"}, sort_keys=True, ensure_ascii=False).encode()).hexdigest() for l in linhas}

def ler(url, anon, ids):
    out = []
    for i in range(0, len(ids), 50):
        out += s11.rest(url, anon, "news_items?select=*&id=in.(%s)" % ",".join(ids[i:i + 50]))
    return out

def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--dry-run", action="store_true"); g.add_argument("--gravar", action="store_true")
    args = ap.parse_args()
    alvo = json.load(open(os.path.join(AQUI, "titulos-16.json"))) + json.load(open(os.path.join(AQUI, "titulos-cdata-125.json")))
    novo = {a["id"]: a for a in alvo}
    assert len(novo) == len(alvo) == 141, len(alvo)
    url, anon = s11.env_publico()
    total_antes = len(s11.rest(url, anon, "news_items?select=id&limit=5000"))
    linhas = ler(url, anon, list(novo))
    assert len(linhas) == 141, "lidas %d de 141" % len(linhas)
    diferentes = [l["id"] for l in linhas if l["title"] != novo[l["id"]]["antes"]]
    if diferentes:
        sys.exit("ERRO: %d linhas já não têm o título 'antes' (%s…); nada gravado." % (len(diferentes), diferentes[:3]))
    imp_antes = impressao(linhas)
    print("news_items: %d linhas; a corrigir: 141 (16 entidades + 125 CDATA); todas com o título 'antes'" % total_antes)
    if args.dry_run:
        print("DRY-RUN: nada gravado."); return
    corpo = [{**l, "title": novo[l["id"]]["depois"]} for l in linhas]
    chave_servico = s11.chave("SUPABASE_SERVICE_ROLE_KEY")  # lida pelo script, nunca impressa
    gravadas = s11.rest(url, chave_servico, "news_items?on_conflict=id&select=id", "POST", corpo,
                        prefer="resolution=merge-duplicates,return=representation")
    print("a base devolveu %d linhas" % len(gravadas or []))
    depois = ler(url, anon, list(novo))
    total_depois = len(s11.rest(url, anon, "news_items?select=id&limit=5000"))
    titulos_ok = all(l["title"] == novo[l["id"]]["depois"] for l in depois)
    resto_ok = impressao(depois) == imp_antes
    print("relidas: %d | títulos iguais ao 'depois': %s | outras colunas iguais (md5 por linha): %s | total da tabela: %d → %d"
          % (len(depois), titulos_ok, resto_ok, total_antes, total_depois))
    if not (titulos_ok and resto_ok and total_antes == total_depois and len(depois) == 141):
        sys.exit("ERRO: a prova falhou — ver acima. Não repetir a escrita sem ver o estado.")

if __name__ == "__main__":
    main()
