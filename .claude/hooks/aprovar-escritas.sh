#!/bin/bash
# aprovar-escritas.sh — trava o que escreve, deixa passar o que lê
# ================================================================
# 24/09/2026, sessão 18. Corre ANTES de cada comando de terminal e de cada consulta SQL.
# Lê o texto do que vai correr e decide: deixar seguir, pedir aprovação, ou recusar.
#
# PORQUE EXISTE
#   As regras de permissão vêem o NOME da ferramenta, não o que vai lá dentro. O
#   `execute_sql` é a mesma ferramenta para ler e para escrever, e um script Python parece
#   só "correr um script" quando na verdade grava na base. A regra da Marta: conta pelo que
#   o comando FAZ, não pelo que parece.
#
# FALHA FECHADA: qualquer erro aqui dentro — jq em falta, entrada estranha, entrada vazia —
# resulta em PEDIR APROVAÇÃO, nunca em deixar passar. Foi exigência dela.
#
# Só vê comandos de terminal e consultas SQL. A edição de ficheiros passa pelas ferramentas
# de ficheiro, que não são matéria deste hook.
#
# Saída: nada = segue o caminho normal das permissões. JSON com "ask" = pergunta à Marta.
# JSON com "deny" = não acontece de todo.

pedir() {
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"%s"}}\n' "$1"
  exit 0
}
recusar() {
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"%s"}}\n' "$1"
  exit 0
}

entrada=$(cat) || pedir "O hook nao conseguiu ler a entrada. Na duvida, pergunta-se."
[ -z "${entrada//[[:space:]]/}" ] && pedir "O hook recebeu uma entrada vazia. Na duvida, pergunta-se."
command -v jq >/dev/null 2>&1 || pedir "O hook precisa do jq e nao o encontrou. Na duvida, pergunta-se."

printf '%s' "$entrada" | jq -e . >/dev/null 2>&1 \
  || pedir "O hook nao conseguiu interpretar a entrada. Na duvida, pergunta-se."
sql=$(printf '%s' "$entrada" | jq -r '.tool_input.query // ""' 2>/dev/null)
cmd=$(printf '%s' "$entrada" | jq -r '.tool_input.command // ""' 2>/dev/null)
ficheiro=$(printf '%s' "$entrada" | jq -r '.tool_input.file_path // ""' 2>/dev/null)
texto="$sql $cmd"

# ── 0. O GUARDA NAO SE REESCREVE A SI PROPRIO ────────────────────────────────
# Buraco encontrado pela Marta a 24/09/2026, depois de eu o ter usado sem dar por isso: o
# hook bloqueou-me duas vezes, e das duas contornei-o a editar ficheiros pela ferramenta de
# edicao, que ele nao vigiava. Um guarda que se pode reescrever a si proprio nao e um guarda.
#
# So `.claude/` pede aprovacao. Editar o resto do repositorio — codigo, migracoes, docs —
# segue sem perguntar, que e o ponto da divisao que ela desenhou.
if [ -n "$ficheiro" ]; then
  case "$ficheiro" in
    */.claude/*|.claude/*)
      pedir "Isto edita a configuracao que decide o que precisa de aprovacao, ou o proprio guarda. Nunca passa sozinho." ;;
  esac
  # O ficheiro de chaves, se alguma vez escapar as regras de permissao.
  if printf '%s' "$ficheiro" | grep -qE '(^|/)\.env([^A-Za-z0-9_-]|$)|config/health-pulse'; then
    recusar "Este e o ficheiro de chaves. Nao se le nem se escreve por aqui."
  fi
fi

# ── 1. SEGREDOS: recusa, nao é sequer pergunta ───────────────────────────────
# O `deny` das permissoes cobre as ferramentas de leitura e escrita de ficheiros. Nao cobre
# `cat`, nem `head`, nem `env`, nem `printenv` — e uma chave lida para a conversa fica no
# registo da sessao para sempre. Por isso a barreira esta aqui, onde se ve o comando inteiro.
#
# A regra apanha o PADRAO "comando que le" + "caminho do segredo", e nao a simples mencao do
# caminho. A primeira versao recusava qualquer comando que mencionasse o ficheiro, e isso
# bloqueou a escrita da documentacao que FALA dele (24/09/2026, ao escrever esta regra no
# CONTEXT.md, e depois ao editar este proprio ficheiro). Escrever sobre um segredo nao e
# ler um segredo.
leitores='cat|head|tail|less|more|nl|od|xxd|strings|grep|egrep|fgrep|rg|ack|awk|sed|cut|tr|sort|uniq|open|code|vi|vim|nano|emacs|cp|scp|rsync|tar|zip|base64|source'
segredo='\.env([^A-Za-z0-9_-]|$)|config/health-pulse'

if printf '%s' "$texto" | grep -qE "(^|[^a-z])($leitores)[[:space:]][^|;&]*($segredo)"; then
  recusar "Este comando le o ficheiro de chaves. Uma chave lida para a conversa fica no registo para sempre. Os scripts leem-na sozinhos; o Claude nao a ve."
fi
# Leitura pela via de uma linguagem: python -c "open('...')", node, ruby, perl.
if printf '%s' "$texto" | grep -qE "(open|read_file|readFile|load|File)[[:space:](]*['\"][^'\"]*($segredo)"; then
  recusar "Este comando abre o ficheiro de chaves a partir de codigo. Os scripts leem-na sozinhos; o Claude nao a ve."
fi
# Despejar o ambiente, ou nomear uma chave directamente.
if printf '%s' "$texto" | grep -qE "SERVICE_ROLE_KEY|FACTCHECK_API_KEY|(^|[;&|(]|&&|\|\|)[[:space:]]*(env|printenv)([[:space:]]|$)"; then
  recusar "Este comando despeja o ambiente ou nomeia uma chave. Os scripts leem-na sozinhos; o Claude nao a ve."
fi

# ── 2. ESCRITA NA BASE, em SQL ───────────────────────────────────────────────
# `create` nao apanha `created_at` nem `update` apanha `updated_at`: a fronteira a seguir
# exige que a palavra acabe ali.
verbos='insert|update|delete|alter|drop|truncate|create|grant|revoke|upsert|copy|call|do|cron|vacuum|reindex'
if [ -n "$sql" ] && printf '%s' "$sql" | grep -qiE "(^|[^a-z_])($verbos)([^a-z_]|$)"; then
  pedir "Esta consulta escreve na base de dados (ou chama codigo que escreve). A Marta aprova."
fi

# ── 3. ESCRITA NA BASE, por outros caminhos ──────────────────────────────────
# O mesmo, visto do lado do terminal: scripts com --gravar, pedidos a API REST, invocacao
# de Edge Functions (a fetch-rss-feeds escreveu 17 linhas assim a 24/09), e QUALQUER script
# de scripts/ corrido com python — o hook so ve o texto, e `--gravar` nao chega.
# `do` fica de fora do lado do terminal por causa dos ciclos `for ... do`; o que se procura
# aqui e a forma do bloco anonimo do Postgres, `DO $$`.
verbos_sh='insert|update|delete|alter|drop|truncate|create|grant|revoke|upsert|copy|call|cron|vacuum|reindex'
if [ -n "$cmd" ]; then
  if printf '%s' "$cmd" | grep -qE 'python[0-9.]*[^|;&]*scripts/|scripts/[^[:space:]]*\.(py|sh)|--gravar'; then
    pedir "Isto corre um script do projecto. Varios gravam na base de dados (script 5, 10, 11, alertas). Conta pelo que faz, nao pelo que parece."
  fi
  if printf '%s' "$cmd" | grep -qE -- '-X[[:space:]]*(POST|PUT|PATCH|DELETE)|/functions/v1/|/rest/v1/|supabase[[:space:]]+(db|functions|migration)'; then
    pedir "Isto escreve na base de dados ou invoca uma Edge Function pela rede."
  fi
  if printf '%s' "$cmd" | grep -qiE "(^|[^a-z_])($verbos_sh)([^a-z_]|$)|do[[:space:]]*\\\$\\\$"; then
    pedir "Este comando tem uma instrucao de escrita em SQL la dentro."
  fi
  if printf '%s' "$cmd" | grep -qE '(^|[^a-z])launchctl([^a-z]|$)'; then
    pedir "Isto instala ou mexe num agendamento que passa a correr sozinho, com a chave de servico."
  fi
fi

exit 0
