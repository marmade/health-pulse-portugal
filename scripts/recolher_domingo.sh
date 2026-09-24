#!/bin/bash
# recolher_domingo.sh — recolhe o lote e diz se serve para a segunda seguinte
# ==========================================================================
# 24/09/2026. Um comando só, para correr ao domingo à noite (decisão da Marta).
#
#   bash scripts/recolher_domingo.sh
#
# O QUE FAZ
#   1. Corre o script 5 sobre as keywords activas, 5 anos, e grava o lote.
#   2. A seguir CONFIRMA o que interessa: a semana do Trends que a corrida de segunda vai
#      precisar veio completa, ou veio parcial?
#
# PORQUE É QUE O PASSO 2 EXISTE
#   O arquivo de segunda fecha a semana de segunda a domingo anterior; a semana do Google
#   Trends que lhe corresponde é a que começa no domingo antes dessa segunda. Um lote
#   recolhido antes de essa semana fechar (sábado à noite) traz esse ponto marcado
#   `is_partial`, e o arquivo escreve vazio — foi o que aconteceu a 21/09 e o que
#   aconteceria a 28/09 com o lote de quinta 24.
#   Não sabemos quanto tempo o Google demora a marcar uma semana como completa depois de
#   ela fechar. Por isso isto CONFIRMA em vez de assumir.

set -u
cd "$(dirname "$0")/.." || exit 1

echo "== 1. recolher =="
.venv-trends/bin/python scripts/5_fetch_google_trends.py \
  --gravar --timeframe 'today 5-y' --origem "domingo, à mão, $(date +%Y-%m-%d)"
if [ $? -ne 0 ]; then
  echo
  echo "A RECOLHA FALHOU. Nada mais a fazer — o lote anterior fica como estava."
  exit 1
fi

echo
echo "== 2. confirmar =="
.venv-trends/bin/python - <<'PY'
import os, sys, json, urllib.request
from datetime import date, timedelta

URL = "https://ijpxjpbjudaddfatibfl.supabase.co"
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
if not key:
    cfg = os.path.expanduser("~/.config/health-pulse/env")
    if os.path.exists(cfg):
        for l in open(cfg):
            if l.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                key = l.split("=", 1)[1].strip()
if not key:
    sys.exit("ERRO: falta SUPABASE_SERVICE_ROLE_KEY.")
h = {"apikey": key, "Authorization": "Bearer " + key}

def get(caminho):
    return json.load(urllib.request.urlopen(urllib.request.Request(URL + "/rest/v1/" + caminho, headers=h)))

hoje = date.today()
segunda = hoje + timedelta(days=(7 - hoje.weekday()) % 7 or 7)   # a próxima segunda
semana  = segunda - timedelta(days=8)                            # o domingo que a corrida usa

lote = get("trends_lotes?select=id,iniciado_em&estado=eq.completo&order=iniciado_em.desc&limit=1")
if not lote:
    sys.exit("ERRO: não há lote completo.")
lote_id = lote[0]["id"]

pedidos = get("trends_pedidos?select=id&lote_id=eq.%s&timeframe=eq.today%%205-y" % lote_id)
ids = ",".join(p["id"] for p in pedidos)
pontos = get("trends_pontos?select=data,is_partial&pedido_id=in.(%s)&data=gte.%s&data=lt.%s&limit=1"
             % (ids, semana.isoformat(), (semana + timedelta(days=1)).isoformat()))

print()
print("corrida de segunda:      %s" % segunda.isoformat())
print("semana do Trends usada:  %s (domingo a sábado)" % semana.isoformat())
print("lote gravado:            %s de %s" % (lote_id[:8], lote[0]["iniciado_em"][:16]))
print()
if not pontos:
    print(">>> NÃO SERVE: o lote não tem ponto nenhum para essa semana.")
    print(">>> Na segunda o arquivo escreve VAZIO, com a razão.")
    sys.exit(2)
if pontos[0]["is_partial"]:
    print(">>> NÃO SERVE: essa semana veio PARCIAL (o Google ainda não a fechou).")
    print(">>> Na segunda o arquivo escreve VAZIO, com a razão.")
    print(">>> Voltar a correr este comando mais tarde, antes do meio-dia de segunda.")
    sys.exit(2)
print(">>> SERVE: a semana veio COMPLETA.")
print(">>> Na segunda o arquivo escreve o top 5 de cada eixo com estes dados.")
PY
