"""Chama rpc/gravar_alertas_lote com a chave PÚBLICA; tem de ser recusada.
Lote inexistente e lista vazia: mesmo que passasse, a função recusaria sem escrever."""
import importlib.util, json, sys, urllib.request, urllib.error
spec = importlib.util.spec_from_file_location("TA", sys.argv[1]); TA = importlib.util.module_from_spec(spec); spec.loader.exec_module(TA)
url, anon = TA.env_publico()
req = urllib.request.Request(url + "/rest/v1/rpc/gravar_alertas_lote", method="POST",
    data=json.dumps(dict(p_lote_id="00000000-0000-0000-0000-000000000000", p_linhas=[])).encode(),
    headers={"apikey": anon, "Authorization": "Bearer " + anon, "Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req) as r: print("ACEITE", r.status, r.read()[:300])
except urllib.error.HTTPError as e:
    print("RECUSADA", e.code, e.read().decode()[:300])
