"""
TESTE 2 — VOCABULÁRIO
=====================
Pergunta: o zero mede desinteresse, ou mede distância de vocabulário?

Para cada par, o termo institucional e uma reformulação em linguagem corrente
vão NO MESMO PEDIDO. É isso que os põe na mesma escala e torna os dois valores
comparáveis entre si. Pares separados NÃO são comparáveis entre pares.

AS REFORMULAÇÕES NÃO FORAM INVENTADAS: saíram das 4626 linhas de
health_questions, ou seja, de formulações que o Google devolveu como reais.
A coluna `origem` diz de onde veio cada uma.

>>> A MARTA TEM DE REVER ESTA TABELA ANTES DE CORRER. <<<
A validade do teste inteiro depende de a reformulação ser O MESMO CONCEITO
noutras palavras, e não um conceito vizinho. Onde houver dúvida, está marcado.

COMO CORRER
  python3 scripts/testes/teste_2_vocabulario.py

  IP residencial. Requer: pip install "pytrends==4.9.2" "urllib3<2.0"
  São 10 pedidos com pausa de 8s. Se der 429, pára — não insiste.

O QUE ESCREVE
  docs/evidencia/<data>-vocabulario/pares.csv
"""
import sys, os, csv, time
from datetime import datetime, timezone

GEO = "PT"
JANELA = "today 12-m"
PAUSA = 8

# (institucional, reformulação, origem da reformulação, nota)
PARES = [
    ("prevenção suicídio", "suicídio causas",
     "health_questions, autocomplete", "o termo institucional tem 0 correspondências literais nas perguntas reais e 23 pela raiz"),
    ("doenças da tiroide", "tiroide sintomas",
     "health_questions, raiz 'tiroide' com 38 correspondências", "0 correspondências literais"),
    ("libido menopausa", "libido menopausa tratamento",
     "health_questions, autocomplete", "1 literal contra 135 pela raiz 'menopausa'"),
    ("síndrome do ovário poliquístico", "sindrome ovario poliquistico sintomas",
     "health_questions, autocomplete", "a formulação real vem SEM acentos — verificar se o Trends os trata igual"),
    ("síndrome de intestino irritável", "intestino irritável sintomas",
     "health_questions, autocomplete", "9 literais contra 79 pela raiz"),
    ("saúde mental jovens", "ansiedade adolescentes",
     "PROPOSTA — não saiu dos dados", "DUVIDOSO: pode ser conceito vizinho, não reformulação. Rever."),
    ("saúde mental no trabalho", "stress no trabalho",
     "PROPOSTA — não saiu dos dados", "DUVIDOSO: 'stress' já é keyword com sinal próprio. Rever."),
    ("peso na menopausa", "engordar na menopausa",
     "PROPOSTA — não saiu dos dados", "DUVIDOSO. Rever."),
    # ── controlos: se nem a reformulação tiver sinal, é volume baixo e não vocabulário
    ("desinstitucionalização saúde mental", "internamento psiquiátrico",
     "CONTROLO", "espera-se que NENHUM dos dois tenha sinal"),
    ("saúde mental sem-abrigo", "sem-abrigo",
     "CONTROLO", "0 correspondências nas perguntas reais, por qualquer via"),
]

def main():
    try:
        from pytrends.request import TrendReq
    except ImportError:
        sys.exit("ERRO: falta o pytrends. pip install 'pytrends==4.9.2' 'urllib3<2.0'")

    hoje = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    dest = f"docs/evidencia/{hoje}-vocabulario"
    os.makedirs(dest, exist_ok=True)
    pytrends = TrendReq(hl="pt-PT", tz=0)

    linhas = []
    for i, (inst, refo, origem, nota) in enumerate(PARES, 1):
        print(f"[{i}/{len(PARES)}] {inst!r}  vs  {refo!r}")
        try:
            pytrends.build_payload([inst, refo], geo=GEO, timeframe=JANELA, gprop="")
            df = pytrends.interest_over_time()
        except Exception as e:
            # NULL + estado, nunca 0. Um 0 aqui seria indistinguível de "sem procura".
            linhas.append(dict(institucional=inst, reformulacao=refo, media_inst=None,
                               media_refo=None, max_inst=None, max_refo=None,
                               estado=f"ERRO: {type(e).__name__}", origem=origem, nota=nota))
            print(f"    FALHOU: {e}")
            if "429" in str(e):
                print("    429 — a parar. O IP está a ser bloqueado; insistir só piora.")
                break
            time.sleep(PAUSA); continue

        if df is None or df.empty:
            linhas.append(dict(institucional=inst, reformulacao=refo, media_inst=None,
                               media_refo=None, max_inst=None, max_refo=None,
                               estado="RESPOSTA VAZIA", origem=origem, nota=nota))
        else:
            if "isPartial" in df.columns: df = df[df["isPartial"] == False]
            a, b = df[inst].tolist(), df[refo].tolist()
            linhas.append(dict(institucional=inst, reformulacao=refo,
                               media_inst=round(sum(a)/len(a), 1), media_refo=round(sum(b)/len(b), 1),
                               max_inst=max(a), max_refo=max(b),
                               estado="OK", origem=origem, nota=nota))
            print(f"    inst media={sum(a)/len(a):.1f} max={max(a)}  |  refo media={sum(b)/len(b):.1f} max={max(b)}")
        time.sleep(PAUSA)

    cols = ["institucional","reformulacao","media_inst","media_refo","max_inst","max_refo","estado","origem","nota"]
    with open(f"{dest}/pares.csv","w",newline="",encoding="utf-8") as f:
        w=csv.DictWriter(f, fieldnames=cols); w.writeheader(); w.writerows(linhas)

    print(f"\nEscrito em {dest}/pares.csv")
    print("""
REGRA DE DECISÃO, escrita antes de correr:
  · reformulação com sinal E institucional sem sinal  -> É VOCABULÁRIO.
    A keyword corrige-se reescrevendo-a. Conta a favor da hipótese.
  · os dois sem sinal                                  -> É VOLUME BAIXO.
    O tema sai do gráfico e fica do lado editorial. Conta contra a hipótese.
  · os dois com sinal                                  -> o zero anterior era
    artefacto da recolha, não do vocabulário. Investigar a recolha.
  · institucional com sinal e reformulação sem         -> resultado inesperado;
    provavelmente a reformulação está errada, não a hipótese.

Só os pares com estado OK contam. ERRO e RESPOSTA VAZIA não são zeros.""")

if __name__ == "__main__":
    main()
