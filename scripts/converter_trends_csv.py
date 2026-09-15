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
ENTRADA = os.path.join(RAIZ, "docs", "google-trends")
SAIDA = os.path.join(RAIZ, "src", "data", "googleTrends.json")

def ficheiros():
    """Os CSV de serie. Exclui os paineis laterais (relatedQueries/relatedEntities)."""
    todos = sorted(glob.glob(os.path.join(ENTRADA, "*", "*.csv")))
    return [p for p in todos if not os.path.basename(p).lower().startswith(("related",))]

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
    # um CSV pode trazer varios termos — uma coluna cada. Cada coluna e uma serie,
    # e as series do MESMO ficheiro estao na mesma regua; as de ficheiros diferentes NAO.
    linhas_dados = [next(csv.reader([l])) for l in linhas[i+1:] if l.strip()]
    saida = []
    for j, bruto in enumerate(cab[1:], start=1):
        termo = bruto.split(":")[0].strip()
        geo = bruto.split("(")[-1].rstrip(")").strip() if "(" in bruto else "?"
        pontos = []
        for r in linhas_dados:
            try:
                pontos.append({"data": r[0].strip(), "valor": int(str(r[j]).replace("<", "").strip())})
            except (ValueError, IndexError):
                pass
        saida.append({"termo": termo, "geo": geo, "categoria": categoria, "granularidade": passo,
                      "pontos": pontos,
                      "ficheiro": os.path.relpath(p, RAIZ),
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
        porpasta[os.path.basename(os.path.dirname(p))].append(p)
    for pasta, fichs in porpasta.items():
        if len(fichs) > 1:
            print("  AVISO: %s tem %d ficheiros de serie. Sao series DIFERENTES se o termo"
                  % (pasta, len(fichs)))
            print("         diferir (ex.: acento), e duplicados se nao diferir. Verificar.")
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
            print("  %-26s %-9s %4d pontos  %s a %s  max=%3d  zeros=%-3d %s"
                  % (s["termo"][:26], s["granularidade"], len(vals), s["inicio"], s["fim"],
                     s["maximo"], s["zeros"],
                     "(%d termos no ficheiro)" % s["termos_no_ficheiro"] if s["termos_no_ficheiro"] > 1 else ""))

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
