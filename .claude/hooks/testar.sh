#!/bin/bash
# testar.sh — corre os casos de casos-de-teste.jsonl contra aprovar-escritas.sh
# ============================================================================
# 24/09/2026. Cada linha do .jsonl é um caso: o que se manda ao hook e o que ele deve
# responder — "passa", "ask" ou "deny".
#
# Os casos vivem num ficheiro à parte de propósito: vários contêm os próprios padrões que o
# hook recusa (o caminho do ficheiro de chaves, `printenv`), e escrever isso dentro de um
# comando de terminal fazia o hook bloquear o seu próprio teste. Num ficheiro, o hook só vê
# o comando que corre este executor, e esse é inofensivo.
#
#   bash .claude/hooks/testar.sh

cd "$(dirname "$0")" || exit 1
HOOK=./aprovar-escritas.sh
CASOS=./casos-de-teste.jsonl
[ -x "$HOOK" ] || { echo "falta $HOOK"; exit 1; }
bash -n "$HOOK" || { echo "o hook tem um erro de sintaxe"; exit 1; }

total=0; bons=0; maus=0
while IFS= read -r linha; do
  [ -z "$linha" ] && continue
  esperado=$(printf '%s' "$linha" | jq -r '.esperado')
  nome=$(printf '%s' "$linha" | jq -r '.nome')
  payload=$(printf '%s' "$linha" | jq -c '.payload')

  saida=$(printf '%s' "$payload" | bash "$HOOK" 2>/dev/null)
  if [ -z "$saida" ]; then
    obtido="passa"
  else
    obtido=$(printf '%s' "$saida" | jq -r '.hookSpecificOutput.permissionDecision // "SAIDA-MA"' 2>/dev/null)
    [ -z "$obtido" ] && obtido="SAIDA-MA"
  fi

  total=$((total + 1))
  if [ "$obtido" = "$esperado" ]; then
    bons=$((bons + 1)); printf '  ok     %-8s %s\n' "$obtido" "$nome"
  else
    maus=$((maus + 1)); printf '  FALHA  esperado %-6s deu %-6s  %s\n' "$esperado" "$obtido" "$nome"
  fi
done < "$CASOS"

echo
echo "--- casos de limite, sem ficheiro ---"
for caso in "entrada vazia::" "json estragado::isto nao e json"; do
  nome="${caso%%::*}"; entrada="${caso##*::}"
  saida=$(printf '%s' "$entrada" | bash "$HOOK" 2>/dev/null)
  obtido=$(printf '%s' "$saida" | jq -r '.hookSpecificOutput.permissionDecision // "passa"' 2>/dev/null)
  [ -z "$obtido" ] && obtido="passa"
  total=$((total + 1))
  if [ "$obtido" = "ask" ]; then bons=$((bons + 1)); printf '  ok     ask      %s\n' "$nome"
  else maus=$((maus + 1)); printf '  FALHA  esperado ask    deu %-6s  %s\n' "$obtido" "$nome"; fi
done

saida=$(printf '%s' '{"tool_name":"Bash","tool_input":{"command":"ls"}}' | PATH=/bin /bin/bash "$HOOK" 2>/dev/null)
obtido=$(printf '%s' "$saida" | /usr/bin/jq -r '.hookSpecificOutput.permissionDecision // "passa"' 2>/dev/null)
[ -z "$obtido" ] && obtido="passa"
total=$((total + 1))
if [ "$obtido" = "ask" ]; then bons=$((bons + 1)); printf '  ok     ask      sem jq no caminho\n'
else maus=$((maus + 1)); printf '  FALHA  esperado ask    deu %-6s  sem jq no caminho\n' "$obtido"; fi

echo
echo "$bons de $total passaram; $maus falharam."
[ "$maus" -eq 0 ] || exit 1
