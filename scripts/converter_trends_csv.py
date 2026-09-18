#!/usr/bin/env python3
"""
Converte os CSV descarregados do Google Trends em JSON para o dashboard.

ENTRADA   docs/google-trends/<eixo>/**/*.csv   (so os ficheiros de serie)
SAIDA     src/data/googleTrends.json

O CSV vem do proprio Google Trends: "Interesse ao longo do tempo" -> descarregar.
Nada aqui contacta a rede. E uma conversao de ficheiros.

DOIS FORMATOS (desde 18/09/2026):
  antigo  multiTimeline.csv: linha "Category: ...", linha em branco, cabecalho
          "Week,menopausa: (Portugal),..." — semanal a 5 anos.
  novo    time_series_PT_<inicio>_<fim>.csv: cabecalho "Time","menopausa",... sem
          categoria nem geo no ficheiro (o geo vem do nome, _PT_; a categoria NAO
          e recuperavel — fica null). A granularidade infere-se do intervalo entre
          datas: 5 anos -> mensal, 12 meses -> semanal, 90/30 dias -> diario,
          7 dias -> ~4 horas.
          Quando se pede "comparar com periodo anterior", vem uma coluna extra
          ("menopausa Preceding year", "... Same period previous year", "... 2024")
          com AS DATAS DO PERIODO ACTUAL E OS VALORES DO ANTERIOR. Desenha-la com
          essas datas seria mentir: fica de fora, e o JSON regista que ficou.
          A coluna principal dessa descarga esta numa regua conjunta (o 100 e o
          maximo dos dois periodos) — por isso e uma serie distinta da simples.

Ficheiros ignorados: searched_with_* (TOP/RISING), by_region*, geoMap*, related*,
*-TOP.csv, *-RISING.csv, *-regiao.csv, README, INDICE.

COMO CORRER
  python3 scripts/converter_trends_csv.py

Correr outra vez sempre que se descarregar um CSV novo. O JSON e gerado, nao se
edita a mao.
"""
import csv, io, json, os, sys, glob, datetime, collections

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENTRADA = os.path.join(RAIZ, "docs", "google-trends")
SAIDA = os.path.join(RAIZ, "src", "data", "googleTrends.json")

IGNORAR_PREFIXO = ("related", "searched_with", "by_region", "geomap")
IGNORAR_SUFIXO = ("-top.csv", "-rising.csv", "-regiao.csv", "-relatedqueries.csv", "-relatedentities.csv")
SUFIXOS_PERIODO_ANTERIOR = ("preceding five years", "preceding year", "same period previous year")
SUFIXOS_PERIODO_ACTUAL = ("past 5 years", "past year", "past 3 months", "past month", "past 7 days", "past week")

def ficheiros():
    """Os CSV de serie, em qualquer profundidade. Exclui TOP/RISING/regiao/geoMap."""
    todos = sorted(glob.glob(os.path.join(ENTRADA, "**", "*.csv"), recursive=True))
    out = []
    for p in todos:
        b = os.path.basename(p).lower()
        if b.startswith(IGNORAR_PREFIXO) or b.endswith(IGNORAR_SUFIXO):
            continue
        out.append(p)
    return out

def eixo_de(p):
    """A primeira pasta abaixo de ENTRADA: alimentacao, saude-mental, menopausa, ..."""
    rel = os.path.relpath(p, ENTRADA)
    return rel.split(os.sep)[0] if os.sep in rel else "(raiz)"

def granularidade_por_datas(datas):
    """Infere o passo pelo intervalo mediano entre datas consecutivas."""
    if len(datas) < 2:
        return "?"
    def parse(d):
        d = d.replace("Z", "")
        try:
            return datetime.datetime.fromisoformat(d)
        except ValueError:
            return datetime.datetime.strptime(d[:10], "%Y-%m-%d")
    ds = [parse(d) for d in datas]
    gaps = sorted((b - a).total_seconds() / 3600 for a, b in zip(ds, ds[1:]))
    g = gaps[len(gaps) // 2]
    if g < 23: return "horaria"
    if g < 24 * 6: return "diaria"
    if g < 24 * 27: return "semanal"
    return "mensal"

def separar_termo(bruto):
    """'menopausa Past year' -> ('menopausa', 'past year'); 'menopausa 2025' -> ('menopausa','2025')."""
    b = bruto.strip(); low = b.lower()
    for suf in SUFIXOS_PERIODO_ANTERIOR + SUFIXOS_PERIODO_ACTUAL:
        if low.endswith(" " + suf):
            return b[: -len(suf) - 1].strip(), suf
    partes = b.rsplit(" ", 1)
    if len(partes) == 2 and partes[1].isdigit() and len(partes[1]) == 4:
        return partes[0], partes[1]
    return b, None

def ler_novo(p, linhas):
    """Formato novo: cabecalho 'Time', termos sem ':' nem geo, sem categoria."""
    cab = next(csv.reader([linhas[0]]))
    geo = "Portugal" if "_PT_" in os.path.basename(p) else "?"
    linhas_dados = [next(csv.reader([l])) for l in linhas[1:] if l.strip()]
    linhas_dados = [r for r in linhas_dados if r and r[0][:2] == "20"]
    termos = [separar_termo(b) for b in cab[1:]]
    saida, ignoradas = [], []
    for j, (termo, periodo) in enumerate(termos, start=1):
        if periodo in SUFIXOS_PERIODO_ANTERIOR or (periodo and periodo.isdigit() and
                any(t == termo and q and q.isdigit() and q > periodo for t, q in termos)):
            # datas do periodo actual, valores do anterior: nao se desenha
            ignoradas.append(cab[j]); continue
        pontos = []
        for r in linhas_dados:
            try:
                pontos.append({"data": r[0].strip(), "valor": int(str(r[j]).replace("<", "").strip())})
            except (ValueError, IndexError):
                pass
        outros = [b for k, b in enumerate(cab[1:], start=1) if k != j
                  and separar_termo(b)[1] not in SUFIXOS_PERIODO_ANTERIOR]
        saida.append({"termo": termo, "periodo": periodo,
                      "rotulo": termo + (" (%s)" % periodo if periodo else ""),
                      "geo": geo, "categoria": None,
                      "granularidade": granularidade_por_datas([x["data"] for x in pontos]),
                      "pontos": pontos,
                      "ficheiro": os.path.relpath(p, RAIZ), "eixo": eixo_de(p),
                      "termos_no_ficheiro": len(cab) - 1,
                      "regua": os.path.splitext(os.path.basename(p))[0],
                      "regua_conjunta_com_periodo_anterior": bool(ignoradas),
                      "colunas_ignoradas": ignoradas,
                      "outros_na_regua": [separar_termo(b)[0] for b in outros],
                      "descarregado_em": datetime.date.fromtimestamp(os.path.getmtime(p)).isoformat()})
    return saida

def ler(p):
    """O CSV do Trends tem cabecalho proprio antes da tabela."""
    linhas = io.open(p, encoding="utf-8-sig").read().splitlines()
    if linhas and linhas[0].lower().startswith(('"time"', "time,")):
        return ler_novo(p, linhas)
    categoria = next((l.split(":", 1)[1].strip() for l in linhas[:3] if l.lower().startswith("category")), None)
    i = next((k for k, l in enumerate(linhas) if l.lower().startswith(("week", "semana", "day", "dia", "month", "mes"))), None)
    if i is None:
        return None
    cab = next(csv.reader([linhas[i]]))
    passo = {"week": "semanal", "semana": "semanal", "day": "diaria",
             "dia": "diaria", "month": "mensal", "mes": "mensal"}[cab[0].strip().lower()]
    # o termo vem como "menopausa: (Portugal)"
    # um CSV pode trazer varios termos — uma coluna cada. Cada coluna e uma serie,
    # e as series do MESMO ficheiro estao na mesma regua; as de ficheiros diferentes NAO.
    linhas_dados = [next(csv.reader([l])) for l in linhas[i+1:] if l.strip()]
    saida = []
    for j, bruto in enumerate(cab[1:], start=1):
        termo = bruto.split(":")[0].strip()
        geo = bruto.split("(")[-1].rstrip(")").strip() if "(" in bruto else "?"
        if termo.lower() == "geo":
            # categoria sem termo: o cabecalho vem "Geo: Portugal"
            termo, geo = "categoria Saúde (sem termo)", bruto.split(":", 1)[1].strip()
        pontos = []
        for r in linhas_dados:
            try:
                pontos.append({"data": r[0].strip(), "valor": int(str(r[j]).replace("<", "").strip())})
            except (ValueError, IndexError):
                pass
        saida.append({"termo": termo, "periodo": None, "rotulo": termo,
                      "geo": geo, "categoria": categoria, "granularidade": passo,
                      "pontos": pontos,
                      "ficheiro": os.path.relpath(p, RAIZ), "eixo": eixo_de(p),
                      "regua_conjunta_com_periodo_anterior": False, "colunas_ignoradas": [],
                      "termos_no_ficheiro": len(cab) - 1,
                      # a REGUA e o ficheiro: series do mesmo ficheiro comparam-se
                      # entre si, series de ficheiros diferentes NAO.
                      "regua": os.path.splitext(os.path.basename(p))[0],
                      "outros_na_regua": [b.split(":")[0].strip()
                                          for k, b in enumerate(cab[1:], start=1) if k != j],
                      "descarregado_em": datetime.date.fromtimestamp(os.path.getmtime(p)).isoformat()})
    return saida

def main():
    if not os.path.isdir(ENTRADA):
        sys.exit("ERRO: nao existe %s" % ENTRADA)
    series = []
    porpasta = collections.defaultdict(list)
    for p in ficheiros():
        for s in (ler(p) or []):
            if not s["pontos"]:
                print("  IGNORADO (sem pontos): %s" % os.path.basename(p)); continue
            datas = [x["data"] for x in s["pontos"]]
            s["inicio"], s["fim"] = min(datas), max(datas)
            vals = [x["valor"] for x in s["pontos"]]
            s["maximo"] = max(vals)
            s["pico_em"] = next(x["data"] for x in s["pontos"] if x["valor"] == s["maximo"])
            s["zeros"] = sum(1 for v in vals if v == 0)
            series.append(s)
            print("  %-12s %-34s %-8s %4d pontos  %s a %s  max=%3d  zeros=%-3d %s%s"
                  % (s["eixo"][:12], s["rotulo"][:34], s["granularidade"], len(vals),
                     s["inicio"][:10], s["fim"][:10], s["maximo"], s["zeros"],
                     "(%d termos no ficheiro)" % s["termos_no_ficheiro"] if s["termos_no_ficheiro"] > 1 else "",
                     " [regua conjunta; %d coluna(s) de periodo anterior fora]" % len(s["colunas_ignoradas"])
                     if s["colunas_ignoradas"] else ""))

    if not series:
        sys.exit("ERRO: nenhum ficheiro de serie encontrado em %s" % ENTRADA)

    os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
    io.open(SAIDA, "w", encoding="utf-8").write(
        json.dumps({"gerado_em": datetime.date.today().isoformat(),
                    "fonte": "Google Trends, descarga manual do painel 'Interesse ao longo do tempo'",
                    "series": series}, ensure_ascii=False, indent=1))
    print("\nescrito: %s  (%d serie(s))" % (os.path.relpath(SAIDA, RAIZ), len(series)))

if __name__ == "__main__":
    main()
