# Reportagem Viva / Diz que Disse

Dashboard de monitorização de tendências de pesquisa sobre saúde em Portugal.
Trabalho de tese de **Marta Madeira**.

**Publicado em** [dizquedisse.martamadeira.pt](https://dizquedisse.martamadeira.pt/)
(Cloudflare Pages).

> **O estado do projecto não se lê aqui — lê-se no [`CONTEXT.md`](CONTEXT.md)**, que é a
> fonte de verdade e é actualizado a cada sessão. Este ficheiro diz só como se põe o
> projecto a correr. O diagnóstico do incidente em curso está no [`AUDIT.md`](AUDIT.md).

## Correr localmente

Requer Node 20 (está no `.nvmrc`) e um `.env` na raiz com as credenciais da instância
Supabase:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Sem estas duas variáveis o build **passa** e o site abre em branco — é comportamento
deliberado, documentado em `src/integrations/supabase/client.ts`.

```sh
npm install
npm run dev      # servidor de desenvolvimento
npm run build    # build de produção, sai para dist/
npm run lint
npm run test     # vitest
```

## Como está feito

- **Frontend:** Vite · React · TypeScript · Tailwind · shadcn-ui
- **Dados:** Supabase (instância `ijpxjpbjudaddfatibfl`)
- **Recolha:** scripts Python em `scripts/`, orquestrados pelo GitHub Actions em
  `.github/workflows/youtube-trends.yml` — corre **às segundas, 06:00 UTC**
- **Publicação:** Cloudflare Pages, a partir do `main`

**Toda a automação está versionada neste repositório.** É uma regra, não um acaso: a
instância antiga tinha agendadores criados no painel, invisíveis no código, que correram
durante 191 dias depois de o projecto ter mudado de casa. Ver `CONTEXT.md`, secção
"Padrões estabelecidos".

## Documentação

| pasta | o que lá está |
|---|---|
| `docs/sessoes/` | registo de cada sessão de trabalho |
| `docs/evidencia/` | provas com comando e `sha256`, guardadas antes de decidir |
| `docs/arquivo/` | cópias de dados que deixaram de existir noutro lado |
| `docs/metodo/` | material para o apêndice metodológico |
| `docs/operacoes/` | SQL e briefings de operações pontuais |
