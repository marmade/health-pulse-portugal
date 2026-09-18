#!/usr/bin/env python3
"""
Pesquisas relacionadas (TOP e RISING) de cada keyword activa, pelo pytrends, a partir
do Mac da Marta — a fonte 2 do plano de vocabulário de 18/09/2026.

Le a lista de keywords com a chave publica (a mesma que o site usa), pede ao Google
Trends as related queries de cada uma (geo=PT, categoria 45 = Saude, 5 anos), e grava
um CSV unico. NADA e escrito na base de dados.

Saida: related_queries_2026-09-18.csv com as colunas
  keyword, axis, tipo (top|rising), query, valor (0-100 no top; % ou "Breakout" no rising)
e um log com o estado de cada pedido (ok / sem dados / falhou), para que uma falha
nao passe por ausencia de interesse.
"""
import csv, json, os, sys, time, urllib.request
from pytrends.request import TrendReq

AQUI = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(AQUI, "related_queries_2026-09-18.csv")
LOG = os.path.join(AQUI, "recolha.log")
PAUSA = 15

env = dict(l.strip().split("=", 1) for l in open(os.path.join(AQUI, "../../../../.env")) if "=" in l and not l.startswith("#"))
url = env["VITE_SUPABASE_URL"].strip('"') + "/rest/v1/keywords?select=term,axis&is_active=eq.true&order=axis,term"
key = env["VITE_SUPABASE_PUBLISHABLE_KEY"].strip('"')
req = urllib.request.Request(url, headers={"apikey": key, "Authorization": "Bearer " + key})
keywords = json.load(urllib.request.urlopen(req))

pt = TrendReq(hl="pt-PT", tz=0, timeout=(10, 30), retries=0)
log = open(LOG, "w")
with open(SAIDA, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f); w.writerow(["keyword", "axis", "tipo", "query", "valor"])
    for i, k in enumerate(keywords, 1):
        term, axis = k["term"], k["axis"]
        try:
            pt.build_payload([term], cat=45, geo="PT", timeframe="today 5-y")
            rq = pt.related_queries().get(term) or {}
            n = 0
            for tipo in ("top", "rising"):
                df = rq.get(tipo)
                if df is None or df.empty: continue
                for _, r in df.iterrows():
                    w.writerow([term, axis, tipo, r["query"], r["value"]]); n += 1
            estado = "ok %d" % n if n else "sem dados"
        except Exception as e:
            estado = "FALHOU %s: %s" % (type(e).__name__, str(e)[:120])
        linha = "%2d/%d %-40s %-14s %s" % (i, len(keywords), term, axis, estado)
        print(linha); log.write(linha + "\n"); log.flush(); f.flush()
        time.sleep(PAUSA)
print("escrito:", SAIDA)
