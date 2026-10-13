#!/usr/bin/env bash
# Teste do passo6_verifica.sh (13/10/2026): cada caso com o código de saída esperado.
# Correr: bash .github/scripts/testar_passo6_verifica.sh
cd "$(dirname "$0")"
falhou=0
caso() {  # nome, código HTTP, corpo, saída esperada
  printf '%s' "$3" | bash passo6_verifica.sh "$2" >/dev/null 2>&1; r=$?
  if [ "$r" = "$4" ]; then echo "ok   $1 (saída $r)"; else echo "FALHA $1: saída $r, esperada $4"; falhou=1; fi
}
caso "403 da própria função"               403 '{"error":"só a service_role pode chamar esta função"}' 1
caso "500 da função"                        500 '{"error":"x"}' 1
caso "200 no formato antigo (12/10), sem falhas_ia" 200 '{"semana":"2026-10-12","results":["saude-mental: 5 banco + 0 IA — IA: Edge Function returned a non-2xx status code (HTTP 403: …)"]}' 1
caso "200 com o 403 da IA num tema"         200 '{"results":[],"falhas_ia":["emergentes: IA: Edge Function returned a non-2xx status code (HTTP 403: …)"],"termos_ia":{"emergentes":5}}' 1
caso "200 sem falhas"                       200 '{"results":["saude-mental: 5 banco + 5 IA (5 termos à IA)"],"falhas_ia":[],"termos_ia":{"saude-mental":5}}' 0
caso "200, guiões já existentes"            200 '{"results":["saude-mental: já existe (por rever)"],"falhas_ia":[],"termos_ia":{}}' 0
caso "200 com IA: só na tentativa substituída" 200 '{"results":["saude-mental: 5 banco + 5 IA (5 termos à IA) — substitui a tentativa de … erro: IA: … 403"],"falhas_ia":[],"termos_ia":{"saude-mental":5}}' 0
caso "corpo que não é JSON"                 200 'Bad Gateway' 1
exit $falhou
