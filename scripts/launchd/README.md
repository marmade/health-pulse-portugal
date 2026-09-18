# Agendar o script 5 no Mac (launchd)

**Estado: NÃO instalado** (18/09/2026). Instala-se quando o `--dry-run` estiver validado e a
lista de keywords fechada.

1. Copiar o plist para fora do repositório e preencher a chave:
   `cp scripts/launchd/pt.martamadeira.trends.plist ~/Library/LaunchAgents/` e editar
   `PREENCHER-ANTES-DE-INSTALAR` com a `SUPABASE_SERVICE_ROLE_KEY`. **A cópia com a chave
   nunca entra no git.**
2. `launchctl load ~/Library/LaunchAgents/pt.martamadeira.trends.plist`
3. Testar sem esperar por segunda: `launchctl start pt.martamadeira.trends` e ler
   `~/Library/Logs/trends-lote.log`.
4. Desinstalar: `launchctl unload ~/Library/LaunchAgents/pt.martamadeira.trends.plist`.

O Mac tem de estar ligado: a dormir corre ao acordar; desligado, perde a semana — e a
ausência de lote nessa segunda fica visível em `trends_lotes`. Plano B, sempre:
`.venv-trends/bin/python scripts/5_fetch_google_trends.py --gravar` à mão.
