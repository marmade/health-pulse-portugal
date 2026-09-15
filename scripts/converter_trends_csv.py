#!/usr/bin/env python3
"""
Converte os CSV descarregados do Google Trends em JSON para o dashboard.

ENTRADA   docs/google trends/<keyword>/multiTimeline.csv
SAIDA     src/data/googleTrends.json

O CSV vem do proprio Google Trends: "Interesse ao longo do tempo" -> descarregar.
Nada aqui contacta a rede. E uma conversao de ficheiros.

COMO CORRER
  python3 scripts/converter_trends_csv.py

Correr outra vez sempre que se descarregar um CSV novo. O JSON e gerado, nao se
edita a mao.
"""
import csv, io, json, os, sys, glob, datetime, collections

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENTRADA = os.path.join(RAIZ, "docs", "google trends")
SAIDA = os.path.join(RAIZ, "src", "data", "googleTrends.json")

def ler(p):
    """O CSV do Trends tem cabecalho proprio antes da tabela."""
    linhas = io.open(p, encoding="utf-8-sig").read().splitlines()
    categoria = next((l.split(":", 1)[1].strip() for l in linhas[:3] if l.lower().startswith("category")), None)
    i = next((k for k, l in enumerate(linhas) if l.lower().startswith(("week", "semana", "day", "dia", "month", "mes"))), None)
    if i is None:
        return None
    cab = next(csv.reader([linhas[i]]))
    passo = {"week": "semanal", "semana": "semanal", "day": "diaria",
             "dia": "diaria", "month": "mensal", "mes": "mensal"}[cab[0].strip().lower()]
    # o termo vem como "menopausa: (Portugal)"
    bruto = cab[1] if len(cab) > 1 else "?"
    termo = bruto.split(":")[0].strip()
    geo = bruto.split("(")[-1].rstrip(")").strip() if "(" in bruto else "?"
    pontos = []
    for l in linhas[i+1:]:
        if not l.strip():
            continue
        r = next(csv.reader([l]))
        try:
            pontos.append({"data": r[0].strip(), "valor": int(str(r[1]).replace("<", "").strip())})
        except (ValueError, IndexError):
            pass
    return {"termo": termo, "geo": geo, "categoria": categoria, "granularidade": passo,
            "pontos": pontos,
            "ficheiro": os.path.relpath(p, RAIZ),
            "descarregado_em": datetime.date.fromtimestamp(os.path.getmtime(p)).isoformat()}

def main():
    if not os.path.isdir(ENTRADA):
        sys.exit("ERRO: nao existe %s" % ENTRADA)
    series = []
    porpasta = collections.defaultdict(list)
    for p in sorted(glob.glob(os.path.join(ENTRADA, "*", "multiTimeline*.csv"))):
        porpasta[os.path.basename(os.path.dirname(p))].append(p)
    for pasta, fichs in porpasta.items():
        if len(fichs) > 1:
            print("  AVISO: %s tem %d ficheiros de serie. Sao series DIFERENTES se o termo"
                  % (pasta, len(fichs)))
            print("         diferir (ex.: acento), e duplicados se nao diferir. Verificar.")
    for p in sorted(glob.glob(os.path.join(ENTRADA, "*", "multiTimeline*.csv"))):
        s = ler(p)
        if not s or not s["pontos"]:
            print("  IGNORADO (sem pontos): %s" % os.path.basename(p)); continue
        datas = [x["data"] for x in s["pontos"]]
        s["inicio"], s["fim"] = min(datas), max(datas)
        vals = [x["valor"] for x in s["pontos"]]
        s["maximo"] = max(vals)
        s["pico_em"] = next(x["data"] for x in s["pontos"] if x["valor"] == s["maximo"])
        s["zeros"] = sum(1 for v in vals if v == 0)
        series.append(s)
        print("  %-16s %-9s %4d pontos  %s a %s  max=%d  zeros=%d"
              % (s["termo"], s["granularidade"], len(vals), s["inicio"], s["fim"], s["maximo"], s["zeros"]))

    if not series:
        sys.exit("ERRO: nenhum multiTimeline.csv encontrado em %s/<keyword>/" % ENTRADA)

    os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
    io.open(SAIDA, "w", encoding="utf-8").write(
        json.dumps({"gerado_em": datetime.date.today().isoformat(),
                    "fonte": "Google Trends, descarga manual do painel 'Interesse ao longo do tempo'",
                    "series": series}, ensure_ascii=False, indent=1))
    print("\nescrito: %s  (%d serie(s))" % (os.path.relpath(SAIDA, RAIZ), len(series)))

if __name__ == "__main__":
    main()
