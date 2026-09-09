"""
TESTE 1 — JANELA
================
Pergunta: uma descarga de 24 meses devolve o quê, exactamente?

Confirma três coisas, e nenhuma delas está confirmada hoje:
  a) a granularidade (diária, semanal ou mensal)
  b) quantos pontos vêm
  c) se Junho/2025 E Junho/2026 estão os dois na mesma série

Keyword: "menopausa sintomas" — escolhida por ser a única com sinal cheio
confirmado (máximo 100 e 32 valores distintos no período arquivado 09/03-13/04).
Se esta não tiver resolução, nenhuma tem.

COMO CORRER
  python3 scripts/testes/teste_1_janela_24m.py

  Corre a partir de IP residencial. Em GitHub Actions dá 429: é datacenter.
  Requer: pip install "pytrends==4.9.2" "urllib3<2.0"

O QUE ESCREVE
  docs/evidencia/<data>-janela-24m/serie.csv      — a série em bruto
  docs/evidencia/<data>-janela-24m/resumo.txt     — as respostas a a), b), c)

NÃO escreve na base de dados. É uma experiência, não recolha.
"""
import sys, os, csv
from datetime import datetime, timezone

KEYWORD = "menopausa sintomas"
JANELA = "today 24-m"
GEO = "PT"

def main():
    try:
        from pytrends.request import TrendReq
    except ImportError:
        sys.exit("ERRO: falta o pytrends. pip install 'pytrends==4.9.2' 'urllib3<2.0'")

    hoje = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    dest = f"docs/evidencia/{hoje}-janela-24m"
    os.makedirs(dest, exist_ok=True)

    pytrends = TrendReq(hl="pt-PT", tz=0)
    print(f"A pedir '{KEYWORD}', geo={GEO}, timeframe={JANELA} ...")
    try:
        pytrends.build_payload([KEYWORD], geo=GEO, timeframe=JANELA, gprop="")
        df = pytrends.interest_over_time()
    except Exception as e:
        # Regra do projecto: falhar em voz alta, nunca continuar com um valor inventado.
        sys.exit(f"ERRO: o pedido falhou -> {type(e).__name__}: {e}\n"
                 f"      Se for 429, o IP está a ser bloqueado. Não repetir em ciclo.")

    if df is None or df.empty:
        sys.exit("ERRO: resposta vazia. NÃO interpretar como 'sem interesse' — é ausência de resposta.")

    if "isPartial" in df.columns:
        df = df[df["isPartial"] == False]

    datas = list(df.index)
    valores = [int(v) for v in df[KEYWORD].tolist()]

    # a) granularidade: diferença entre pontos consecutivos
    deltas = sorted({(datas[i+1] - datas[i]).days for i in range(len(datas)-1)})
    if deltas == [1]:            gran = "DIÁRIA"
    elif deltas == [7]:          gran = "SEMANAL"
    elif all(28 <= d <= 31 for d in deltas): gran = "MENSAL"
    else:                        gran = f"IRREGULAR (deltas em dias: {deltas})"

    # c) os dois Junhos
    meses = {d.strftime("%Y-%m") for d in datas}
    jun25, jun26 = "2025-06" in meses, "2026-06" in meses

    with open(f"{dest}/serie.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f); w.writerow(["data", "search_index"])
        for d, v in zip(datas, valores): w.writerow([d.strftime("%Y-%m-%d"), v])

    linhas = [
        f"TESTE 1 — JANELA   ({hoje})",
        f"keyword: {KEYWORD} | geo={GEO} | timeframe={JANELA}",
        "",
        f"a) GRANULARIDADE : {gran}",
        f"b) PONTOS        : {len(datas)}  (de {datas[0].date()} a {datas[-1].date()})",
        f"c) Junho/2025 na série: {'SIM' if jun25 else 'NÃO'}",
        f"   Junho/2026 na série: {'SIM' if jun26 else 'NÃO'}",
        "",
        f"meses cobertos   : {len(meses)}",
        f"máximo da série  : {max(valores)}   (tem de ser 100; se não for, a janela foi cortada)",
        f"mínimo da série  : {min(valores)}",
        f"valores distintos: {len(set(valores))}",
        "",
        "REGRA DE DECISÃO, escrita antes de correr:",
        "  · se a granularidade for SEMANAL, a comparação mês-a-mês precisa de uma regra de",
        "    agregação escrita (as semanas atravessam meses). Decidir e documentar.",
        "  · se os dois Junhos estiverem na série, a frase-alvo é suportável DENTRO desta",
        "    descarga. Fora dela, não.",
        "  · se o máximo não for 100, a série não está normalizada ao que se pediu.",
    ]
    open(f"{dest}/resumo.txt", "w", encoding="utf-8").write("\n".join(linhas) + "\n")
    print("\n".join(linhas))
    print(f"\nEscrito em {dest}/")

if __name__ == "__main__":
    main()
