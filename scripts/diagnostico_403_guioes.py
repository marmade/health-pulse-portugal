#!/usr/bin/env python3
"""diagnostico_403_guioes.py — o que chega à generate-guiao-questions pela chamada interna
=====================================================================================
13/10/2026, sessão 29. Passo 2 da ordem aprovada em docs/sessoes/2026-10-05.md §5.

Chama a generate-guioes-weekly com {"diagnostico": true}. Nesse modo a função faz a chamada
interna REAL à generate-guiao-questions (o mesmo supabase.functions.invoke, com a mesma chave
do ambiente) com {"diagnostico": true}, e devolve o que voltou. Nenhuma das duas lê ou escreve
na base, e a generate-guiao-questions não chama o Perplexity.

O que se imprime: o código HTTP e o corpo da resposta, que só leva partes, tipo e role das
chaves — nunca uma chave. A service_role lê-se como no testar_acesso_funcoes.py e não é
impressa.

    python3 scripts/diagnostico_403_guioes.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from testar_acesso_funcoes import chamar, chave_servico  # noqa: E402

codigo, corpo = chamar("generate-guioes-weekly", chave_servico(), {"diagnostico": True})
print("HTTP", codigo)
try:
    print(json.dumps(json.loads(corpo), ensure_ascii=False, indent=2))
except ValueError:
    print(corpo)
