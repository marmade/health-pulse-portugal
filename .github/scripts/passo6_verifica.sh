#!/usr/bin/env bash
# Passo 6 do youtube-trends.yml: decide se a corrida dos guiões falhou (13/10/2026).
# Ordem aprovada em docs/sessoes/2026-10-05.md §5, passo 1: o passo 6 FALHA quando o erro de
# algum guião traz "IA:" — antes disto, o 403 da IA saía como aviso e a corrida ficava verde
# (05/10 e 12/10).
#
# Uso:  echo "$BODY" | bash .github/scripts/passo6_verifica.sh "$CODE"
# Sai com 1 (e um ::error::) se:
#   · a função não respondeu 200 — inclui o 403 da própria generate-guioes-weekly;
#   · a resposta não traz a lista `falhas_ia` (não é a resposta que a função dá);
#   · `falhas_ia` não está vazia: alguma chamada à IA desta tentativa falhou.
set -u
CODE="${1:-}"
BODY="$(cat)"

if [ "$CODE" != "200" ]; then
  echo "::error::generate-guioes-weekly devolveu HTTP $CODE"
  exit 1
fi
if ! printf '%s' "$BODY" | jq -e '.falhas_ia | type == "array"' >/dev/null 2>&1; then
  echo "::error::a resposta da generate-guioes-weekly não traz falhas_ia"
  exit 1
fi
N=$(printf '%s' "$BODY" | jq '.falhas_ia | length')
if [ "$N" != "0" ]; then
  printf '%s' "$BODY" | jq -r '.falhas_ia[]' | while IFS= read -r f; do echo "::error::$f"; done
  echo "::error::$N guião(ões) sem perguntas da IA por falha da chamada — ver acima"
  exit 1
fi
echo "IA: sem falhas nesta tentativa · termos à IA: $(printf '%s' "$BODY" | jq -c '.termos_ia // {}')"
